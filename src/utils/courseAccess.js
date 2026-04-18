const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");

async function assertDoctorOwnsCourse(courseId, userId) {
  const course = await Course.findById(courseId);

  if (!course) {
    const error = new Error("Course not found.");
    error.status = 404;
    throw error;
  }

  if (course.doctor.toString() !== userId.toString()) {
    const error = new Error("Only the doctor who created the course can manage it.");
    error.status = 403;
    throw error;
  }

  return course;
}

async function assertStudentEnrolled(courseId, userId) {
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: userId
  });

  if (!enrollment) {
    const error = new Error("You must enroll in this course first.");
    error.status = 403;
    throw error;
  }

  return enrollment;
}

async function recalculateProgress(enrollment) {
  const [lessonCount, quizCount] = await Promise.all([
    Lesson.countDocuments({ course: enrollment.course }),
    Quiz.countDocuments({ course: enrollment.course })
  ]);

  const lessonPercent = lessonCount === 0
    ? 100
    : Math.round((enrollment.completedLessonIds.length / lessonCount) * 100);

  const averageQuiz = enrollment.quizScores.length === 0
    ? 0
    : Math.round(
        enrollment.quizScores.reduce((sum, item) => sum + item.scorePercent, 0) /
          enrollment.quizScores.length
      );

  let overall = lessonPercent;
  if (quizCount > 0) {
    overall = Math.round((lessonPercent + averageQuiz) / 2);
  }

  enrollment.overallProgress = overall;
  await enrollment.save();

  return {
    lessonPercent,
    averageQuiz,
    overallProgress: overall
  };
}

module.exports = {
  assertDoctorOwnsCourse,
  assertStudentEnrolled,
  recalculateProgress
};
