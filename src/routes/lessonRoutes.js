const express = require("express");
const Lesson = require("../models/Lesson");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertDoctorOwnsCourse, assertStudentEnrolled, recalculateProgress } = require("../utils/courseAccess");

const router = express.Router();

router.get("/courses/:courseId/lessons", requireAuth, async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1 });
    return res.json({ lessons });
  } catch (error) {
    return next(error);
  }
});

router.post("/courses/:courseId/lessons", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const { title, content, order } = req.body;

    await assertDoctorOwnsCourse(req.params.courseId, req.user._id);

    if (!title || !content || !order) {
      return res.status(400).json({ message: "Title, content, and order are required." });
    }

    const lesson = await Lesson.create({
      course: req.params.courseId,
      title: title.trim(),
      content: content.trim(),
      order: Number(order)
    });

    return res.status(201).json({
      message: "Lesson created successfully.",
      lesson
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/lessons/:lessonId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    await assertDoctorOwnsCourse(lesson.course, req.user._id);

    const allowedFields = ["title", "content", "order"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "") {
        lesson[field] = field === "order" ? Number(req.body[field]) : req.body[field].trim();
      }
    }

    await lesson.save();

    return res.json({
      message: "Lesson updated successfully.",
      lesson
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/lessons/:lessonId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    await assertDoctorOwnsCourse(lesson.course, req.user._id);
    await lesson.deleteOne();

    return res.json({ message: "Lesson deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

router.post("/lessons/:lessonId/complete", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    const enrollment = await assertStudentEnrolled(lesson.course, req.user._id);

    if (!enrollment.completedLessonIds.some((item) => item.toString() === lesson._id.toString())) {
      enrollment.completedLessonIds.push(lesson._id);
      await enrollment.save();
    }

    const progress = await recalculateProgress(enrollment);

    return res.json({
      message: "Lesson marked as completed.",
      progress
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
