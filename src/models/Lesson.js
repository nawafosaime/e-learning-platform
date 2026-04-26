const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Lesson", lessonSchema);
