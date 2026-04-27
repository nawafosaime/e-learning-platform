const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/db");
const { attachUserFromToken, requireAuth, guestOnly } = require("./src/middleware/auth");

const authRoutes = require("./src/routes/authRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const progressRoutes = require("./src/routes/progressRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const viewsDir = path.join(__dirname, "views");

connectDB();

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUserFromToken);

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  if (req.user) {
    return res.redirect("/app/dashboard");
  }
  return res.redirect("/login");
});

app.get("/login", guestOnly, (req, res) => {
  res.sendFile(path.join(viewsDir, "login.html"));
});

app.get("/register", guestOnly, (req, res) => {
  res.sendFile(path.join(viewsDir, "register.html"));
});

app.get("/app/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(viewsDir, "dashboard.html"));
});

app.get("/app/course", requireAuth, (req, res) => {
  res.sendFile(path.join(viewsDir, "course.html"));
});

app.get("/app/quiz", requireAuth, (req, res) => {
  res.sendFile(path.join(viewsDir, "quiz.html"));
});

app.get("/app/progress", requireAuth, (req, res) => {
  res.sendFile(path.join(viewsDir, "progress.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", lessonRoutes);
app.use("/api", quizRoutes);
app.use("/api/progress", progressRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});