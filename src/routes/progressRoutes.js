const express = require("express");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: "course",
        populate: {
          path: "doctor",
          select: "name email"
        }
      })
      .sort({ updatedAt: -1 });

    const results = [];

    for (const enrollment of enrollments) {
      const quizzes = await Quiz.find({ course: enrollment.course._id }).select("_id");
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

      const focusTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic]) => topic);

      results.push({
        enrollmentId: enrollment._id,
        course: enrollment.course,
        completedLessons: enrollment.completedLessonIds.length,
        quizAttempts: attempts.length,
        overallProgress: enrollment.overallProgress,
        focusTopics
      });
    }

    return res.json({ progress: results });
  } catch (error) {
    return next(error);
  }
});

router.get("/overview", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const courses = await Course.find({ doctor: req.user._id });
    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    return res.json({
      totalCourses: courses.length,
      totalEnrollments: enrollments.length
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
