const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Course = require("../src/models/Course");
const Lesson = require("../src/models/Lesson");
const Quiz = require("../src/models/Quiz");
const Enrollment = require("../src/models/Enrollment");

async function runSeed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    Enrollment.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Password123", 10);

  const doctor = await User.create({
    name: "Dr. Sara Ahmad",
    email: "doctor@example.com",
    passwordHash,
    role: "doctor"
  });

  const student = await User.create({
    name: "Ali Student",
    email: "student@example.com",
    passwordHash,
    role: "student"
  });

  const course = await Course.create({
    title: "Web Application Basics",
    description: "Learn the basics of semantic HTML, CSS, JavaScript, and web application structure.",
    category: "Web Development",
    doctor: doctor._id
  });

  const lesson1 = await Lesson.create({
    course: course._id,
    title: "Introduction to Semantic HTML",
    content: "Use clear structure such as header, main, article, section, and footer so pages are meaningful and organized.",
    order: 1
  });

  const lesson2 = await Lesson.create({
    course: course._id,
    title: "Object-Oriented JavaScript",
    content: "Use ES6 classes to organize code, avoid unnecessary global variables, and connect objects with callbacks or custom events.",
    order: 2
  });

  await Quiz.create({
    course: course._id,
    lesson: lesson2._id,
    title: "JavaScript Basics Quiz",
    questions: [
      {
        prompt: "Which JavaScript feature is required by the project instructions?",
        options: [
          "Deprecated tags",
          "ES6 classes",
          "File-system storage",
          "No authentication"
        ],
        correctAnswer: 1,
        explanation: "The project requires object-oriented JavaScript using ES6 classes.",
        topic: "JavaScript Classes"
      },
      {
        prompt: "What should be avoided in JavaScript when better encapsulation is possible?",
        options: [
          "Classes",
          "Callbacks",
          "Global variables",
          "Functions"
        ],
        correctAnswer: 2,
        explanation: "The instructions ask students to avoid global variables whenever possible.",
        topic: "Encapsulation"
      }
    ]
  });

  await Enrollment.create({
    student: student._id,
    course: course._id
  });

  console.log("Seed completed.");
  console.log("Doctor: doctor@example.com / Password123");
  console.log("Student: student@example.com / Password123");

  await mongoose.connection.close();
}

runSeed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
