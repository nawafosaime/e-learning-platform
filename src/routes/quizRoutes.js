const express = require("express");
const Quiz = require("../models/Quiz");
const Lesson = require("../models/Lesson");
const QuizAttempt = require("../models/QuizAttempt");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertDoctorOwnsCourse, assertStudentEnrolled, recalculateProgress } = require("../utils/courseAccess");
const Enrollment = require("../models/Enrollment");

const router = express.Router();

function sanitizeQuizForStudent(quiz) {
  return {
    _id: quiz._id,
    course: quiz.course,
    title: quiz.title,
    lesson: quiz.lesson,
    questions: quiz.questions.map((question) => ({
      _id: question._id,
      prompt: question.prompt,
      options: question.options,
      topic: question.topic
    }))
  };
}

router.get("/courses/:courseId/quizzes", requireAuth, async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId }).select("title lesson createdAt");
    return res.json({ quizzes });
  } catch (error) {
    return next(error);
  }
});

router.post("/courses/:courseId/quizzes", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const { title, lessonId, questions } = req.body;

    await assertDoctorOwnsCourse(req.params.courseId, req.user._id);

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Title and at least one question are required." });
    }

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson || lesson.course.toString() !== req.params.courseId) {
        return res.status(400).json({ message: "Selected lesson is invalid." });
      }
    }

    const normalizedQuestions = questions.map((question) => ({
      prompt: question.prompt?.trim(),
      options: (question.options || []).map((option) => String(option).trim()),
      correctAnswer: Number(question.correctAnswer),
      explanation: question.explanation?.trim() || "",
      topic: question.topic?.trim() || "General"
    }));

    const quiz = await Quiz.create({
      course: req.params.courseId,
      title: title.trim(),
      lesson: lessonId || null,
      questions: normalizedQuestions
    });

    return res.status(201).json({
      message: "Quiz created successfully.",
      quiz
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/quizzes/:quizId", requireAuth, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate("lesson", "title");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    if (req.user.role === "doctor") {
      await assertDoctorOwnsCourse(quiz.course, req.user._id);
      return res.json({ quiz });
    }

    await assertStudentEnrolled(quiz.course, req.user._id);
    return res.json({ quiz: sanitizeQuizForStudent(quiz) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/quizzes/:quizId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    await assertDoctorOwnsCourse(quiz.course, req.user._id);

    if (typeof req.body.title === "string" && req.body.title.trim()) {
      quiz.title = req.body.title.trim();
    }

    if (Array.isArray(req.body.questions) && req.body.questions.length > 0) {
      quiz.questions = req.body.questions.map((question) => ({
        prompt: question.prompt?.trim(),
        options: (question.options || []).map((option) => String(option).trim()),
        correctAnswer: Number(question.correctAnswer),
        explanation: question.explanation?.trim() || "",
        topic: question.topic?.trim() || "General"
      }));
    }

    await quiz.save();

    return res.json({
      message: "Quiz updated successfully.",
      quiz
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/quizzes/:quizId", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    await assertDoctorOwnsCourse(quiz.course, req.user._id);
    await quiz.deleteOne();

    return res.json({ message: "Quiz deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

router.post("/quizzes/:quizId/submit", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const enrollment = await assertStudentEnrolled(quiz.course, req.user._id);

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(
      answers.map((answer) => [String(answer.questionId), Number(answer.selectedIndex)])
    );

    let score = 0;
    const checkedAnswers = [];
    const weakTopicCounter = {};

    for (const question of quiz.questions) {
      const selectedIndex = answerMap.has(String(question._id))
        ? answerMap.get(String(question._id))
        : -1;
      const isCorrect = selectedIndex === question.correctAnswer;

      if (isCorrect) {
        score += 1;
      } else {
        weakTopicCounter[question.topic] = (weakTopicCounter[question.topic] || 0) + 1;
      }

      checkedAnswers.push({
        questionId: question._id,
        selectedIndex,
        isCorrect
      });
    }

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const weakTopics = Object.entries(weakTopicCounter)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      answers: checkedAnswers,
      score,
      total: quiz.questions.length,
      percentage,
      weakTopics
    });

    const existingScore = enrollment.quizScores.find(
      (item) => item.quiz.toString() === quiz._id.toString()
    );

    if (existingScore) {
      existingScore.scorePercent = Math.max(existingScore.scorePercent, percentage);
    } else {
      enrollment.quizScores.push({
        quiz: quiz._id,
        scorePercent: percentage
      });
    }

    await enrollment.save();
    const progress = await recalculateProgress(enrollment);

    return res.json({
      message: "Quiz submitted successfully.",
      result: {
        attemptId: attempt._id,
        score,
        total: quiz.questions.length,
        percentage,
        weakTopics,
        progress
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
