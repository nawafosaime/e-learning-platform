const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2 && value.length <= 6;
        },
        message: "Each question must have between 2 and 6 options."
      }
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0
    },
    explanation: {
      type: String,
      default: ""
    },
    topic: {
      type: String,
      default: "General"
    }
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Quiz must have at least one question."
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
