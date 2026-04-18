const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        selectedIndex: {
          type: Number,
          default: -1
        },
        isCorrect: {
          type: Boolean,
          default: false
        }
      }
    ],
    score: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    weakTopics: [String]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
