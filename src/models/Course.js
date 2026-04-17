const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      default: "General"
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    smartFeatureNote: {
      type: String,
      default: "Weak Topic Tracker: recommends what the student should review after each quiz."
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Course", courseSchema);
