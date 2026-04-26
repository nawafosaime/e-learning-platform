const express = require("express");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const Enrollment = require("../models/Enrollment");
const QuizAttempt = require("../models/QuizAttempt");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertDoctorOwnsCourse, recalculateProgress } = require("../utils/courseAccess");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate("doctor", "name email")
      .sort({ createdAt: -1 });

    if (req.user.role === "doctor") {
      const data = courses.map((course) => ({
        ...course.toObject(),
        isOwner: course.doctor._id.toString() === req.user._id.toString()
      }));

      return res.json({ courses: data });
    }

    const enrollments = await Enrollment.find({ student: req.user._id });
    const enrollmentMap = new Map(
      enrollments.map((item) => [item.course.toString(), item])
    );

    const data = courses.map((course) => {
      const enrollment = enrollmentMap.get(course._id.toString());
      return {
        ...course.toObject(),
        isEnrolled: Boolean(enrollment),
        overallProgress: enrollment ? enrollment.overallProgress : 0
      };
    });

    return res.json({ courses: data });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: (category || "General").trim(),
      doctor: req.user._id
    });

    const populatedCourse = await Course.findById(course._id).populate("doctor", "name email");

    return res.status(201).json({
      message: "Course created successfully.",
      course: populatedCourse
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:courseId", requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).populate("doctor", "name email");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const [lessons, quizzes] = await Promise.all([
      Lesson.find({ course: course._id }).sort({ order: 1 }),
      Quiz.find({ course: course._id }).select("title lesson createdAt").populate("lesson", "title")
    ]);

    let enrollment = null;
    let focusTopics = [];

    if (req.user.role === "student") {
      enrollment = await Enrollment.findOne({
        course: course._id,
        student: req.user._id
      });

      if (enrollment) {
        const attempts = await QuizAttempt.find({
          student: req.user._id,
          quiz: { $in: quizzes.map((quiz) => quiz._id) }
        }).sort({ createdAt: -1 });

        const topicCounts = {};
        for (const attempt of attempts) {
          for (const topic of attempt.weakTopics || []) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        }

        focusTopics = Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([topic]) => topic);
      }
    }

    const payload = {
      course,
      lessons,
      quizzes,
      enrollment,
      focusTopics
    };

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:courseId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const course = await assertDoctorOwnsCourse(req.params.courseId, req.user._id);

    const allowedFields = ["title", "description", "category"];
    for (const field of allowedFields) {
      if (typeof req.body[field] === "string" && req.body[field].trim()) {
        course[field] = req.body[field].trim();
      }
    }

    await course.save();

    const updatedCourse = await Course.findById(course._id).populate("doctor", "name email");

    return res.json({
      message: "Course updated successfully.",
      course: updatedCourse
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:courseId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    await assertDoctorOwnsCourse(req.params.courseId, req.user._id);
    const quizIds = await Quiz.find({ course: req.params.courseId }).distinct("_id");

    await Promise.all([
      Course.findByIdAndDelete(req.params.courseId),
      Lesson.deleteMany({ course: req.params.courseId }),
      Quiz.deleteMany({ course: req.params.courseId }),
      Enrollment.deleteMany({ course: req.params.courseId }),
      QuizAttempt.deleteMany({ quiz: { $in: quizIds } })
    ]);

    return res.json({ message: "Course deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

router.post("/:courseId/enroll", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    let enrollment = await Enrollment.findOne({
      course: req.params.courseId,
      student: req.user._id
    });

    if (enrollment) {
      return res.json({
        message: "You are already enrolled in this course.",
        enrollment
      });
    }

    enrollment = await Enrollment.create({
      course: req.params.courseId,
      student: req.user._id
    });

    await recalculateProgress(enrollment);

    return res.status(201).json({
      message: "Enrollment successful.",
      enrollment
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:courseId/progress", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    await assertDoctorOwnsCourse(req.params.courseId, req.user._id);

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("student", "name email")
      .sort({ updatedAt: -1 });

    return res.json({ enrollments });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
