import { BasePage } from "../core/base-page.js";
import { ApiClient } from "../core/api.js";
import { escapeHtml, getParam } from "../core/helpers.js";

class CoursePage extends BasePage {
  constructor() {
    super();
    this.api = new ApiClient();
    this.courseId = getParam("id");
    this.lessonForm = document.getElementById("lessonForm");
    this.quizForm = document.getElementById("quizForm");
    this.lessonSelect = document.getElementById("quizLesson");
    this.enrollButton = document.getElementById("enrollBtn");
  }

  async bootstrap() {
    await this.initialize();
    if (!this.courseId) {
      this.show("Course ID is missing.", "danger");
      return;
    }

    this.registerEvents();
    await this.loadCourse();
  }

  registerEvents() {
    if (this.lessonForm) {
      this.lessonForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(this.lessonForm);

        try {
          await this.api.post(`/api/courses/${this.courseId}/lessons`, {
            title: formData.get("title"),
            content: formData.get("content"),
            order: formData.get("order")
          });

          this.lessonForm.reset();
          this.show("Lesson added successfully.", "success");
          await this.loadCourse();
        } catch (error) {
          this.show(error.message, "danger");
        }
      });
    }

    if (this.quizForm) {
      this.quizForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const title = document.getElementById("quizTitle").value;
        const lessonId = document.getElementById("quizLesson").value;
        const prompt = document.getElementById("quizQuestion").value;
        const options = document
          .getElementById("quizOptions")
          .value.split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        try {
          await this.api.post(`/api/courses/${this.courseId}/quizzes`, {
            title,
            lessonId,
            questions: [
              {
                prompt,
                options,
                correctAnswer: Number(document.getElementById("quizCorrectAnswer").value),
                explanation: document.getElementById("quizExplanation").value,
                topic: document.getElementById("quizTopic").value
              }
            ]
          });

          this.quizForm.reset();
          this.show("Quiz added successfully.", "success");
          await this.loadCourse();
        } catch (error) {
          this.show(error.message, "danger");
        }
      });
    }

    if (this.enrollButton) {
      this.enrollButton.addEventListener("click", async () => {
        try {
          await this.api.post(`/api/courses/${this.courseId}/enroll`, {});
          this.show("Enrollment successful.", "success");
          await this.loadCourse();
        } catch (error) {
          this.show(error.message, "danger");
        }
      });
    }
  }

  async loadCourse() {
    try {
      const data = await this.api.get(`/api/courses/${this.courseId}`);
      this.data = data;
      this.renderCourse();
      this.renderLessons();
      this.renderQuizzes();
      this.populateLessonSelect();
    } catch (error) {
      this.show(error.message, "danger");
    }
  }

  renderCourse() {
    document.getElementById("courseTitle").textContent = this.data.course.title;
    document.getElementById("courseDescription").textContent = this.data.course.description;
    document.getElementById("doctorName").textContent = `Doctor: ${this.data.course.doctor.name}`;
    document.getElementById("courseCategory").textContent = this.data.course.category;

    const enrolled = Boolean(this.data.enrollment);
    const progress = this.data.enrollment?.overallProgress || 0;

    document.getElementById("progressValue").textContent = `${progress}%`;
    document.getElementById("progressBar").style.width = `${progress}%`;
    document.getElementById("enrollmentStatus").textContent =
      this.currentUser.role === "doctor"
        ? "Management mode"
        : enrolled
          ? "Enrolled"
          : "Not enrolled yet";

    document.getElementById("studentActions").classList.toggle(
      "d-none",
      this.currentUser.role !== "student" || enrolled
    );

    const focusBox = document.getElementById("studentFocusBox");
    if (this.currentUser.role === "student" && this.data.focusTopics?.length) {
      focusBox.classList.remove("d-none");
      focusBox.innerHTML = `
        <h2 class="h6 fw-bold">Suggested review topics</h2>
        <div class="topic-list">
          ${this.data.focusTopics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")}
        </div>
      `;
    } else {
      focusBox.classList.add("d-none");
      focusBox.innerHTML = "";
    }
  }

  renderLessons() {
    const container = document.getElementById("lessonsContainer");
    const completed = new Set((this.data.enrollment?.completedLessonIds || []).map(String));

    if (!this.data.lessons.length) {
      container.innerHTML = `<div class="empty-state">No lessons yet.</div>`;
      return;
    }

    container.innerHTML = this.data.lessons
      .map(
        (lesson) => `
          <article class="lesson-card">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <h3 class="h5 fw-bold mb-1">${escapeHtml(lesson.title)}</h3>
                <p class="small-muted mb-2">Lesson ${lesson.order}</p>
              </div>
              ${
                this.currentUser.role === "doctor"
                  ? `
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-secondary" data-action="edit-lesson" data-id="${lesson._id}">Edit</button>
                      <button class="btn btn-sm btn-outline-danger" data-action="delete-lesson" data-id="${lesson._id}">Delete</button>
                    </div>
                  `
                  : ""
              }
            </div>
            <p class="mb-3">${escapeHtml(lesson.content)}</p>
            ${
              this.currentUser.role === "student" && this.data.enrollment
                ? `
                  <button
                    class="btn btn-sm ${completed.has(lesson._id) ? "btn-success" : "btn-outline-primary"}"
                    data-action="complete-lesson"
                    data-id="${lesson._id}"
                    ${completed.has(lesson._id) ? "disabled" : ""}
                  >
                    ${completed.has(lesson._id) ? "Completed" : "Mark as completed"}
                  </button>
                `
                : ""
            }
          </article>
        `
      )
      .join("");

    container.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => this.handleLessonAction(button));
    });
  }

  renderQuizzes() {
    const container = document.getElementById("quizzesContainer");

    if (!this.data.quizzes.length) {
      container.innerHTML = `<div class="empty-state">No quizzes yet.</div>`;
      return;
    }

    container.innerHTML = this.data.quizzes
      .map(
        (quiz) => `
          <article class="quiz-card">
            <h3 class="h5 fw-bold mb-1">${escapeHtml(quiz.title)}</h3>
            <p class="small-muted mb-3">${quiz.lesson?.title ? `Lesson: ${escapeHtml(quiz.lesson.title)}` : "General quiz"}</p>
            <div class="d-flex flex-wrap gap-2">
              ${
                this.currentUser.role === "student"
                  ? this.data.enrollment
                    ? `<a class="btn btn-sm btn-primary" href="/app/quiz?id=${quiz._id}">Start quiz</a>`
                    : `<button class="btn btn-sm btn-outline-secondary" disabled>Enroll first</button>`
                  : `<a class="btn btn-sm btn-outline-primary" href="/app/quiz?id=${quiz._id}">Preview</a>`
              }
              ${
                this.currentUser.role === "doctor"
                  ? `
                    <button class="btn btn-sm btn-outline-secondary" data-action="edit-quiz" data-id="${quiz._id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete-quiz" data-id="${quiz._id}">Delete</button>
                  `
                  : ""
              }
            </div>
          </article>
        `
      )
      .join("");

    container.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => this.handleQuizAction(button));
    });
  }

  populateLessonSelect() {
    if (!this.lessonSelect) {
      return;
    }

    this.lessonSelect.innerHTML = `<option value="">No specific lesson</option>` +
      this.data.lessons
        .map(
          (lesson) =>
            `<option value="${lesson._id}">${escapeHtml(lesson.title)}</option>`
        )
        .join("");
  }

  async handleLessonAction(button) {
    const lessonId = button.dataset.id;
    const action = button.dataset.action;

    try {
      if (action === "complete-lesson") {
        await this.api.post(`/api/lessons/${lessonId}/complete`, {});
      }

      if (action === "delete-lesson") {
        await this.api.delete(`/api/lessons/${lessonId}`);
      }

      if (action === "edit-lesson") {
        const current = this.data.lessons.find((lesson) => lesson._id === lessonId);
        const title = window.prompt("Edit lesson title:", current.title);
        if (!title) {
          return;
        }
        const content = window.prompt("Edit lesson content:", current.content);
        if (!content) {
          return;
        }
        const order = window.prompt("Edit lesson order:", current.order);
        if (!order) {
          return;
        }

        await this.api.patch(`/api/lessons/${lessonId}`, { title, content, order });
      }

      await this.loadCourse();
    } catch (error) {
      this.show(error.message, "danger");
    }
  }

  async handleQuizAction(button) {
    const quizId = button.dataset.id;
    const action = button.dataset.action;

    try {
      if (action === "delete-quiz") {
        await this.api.delete(`/api/quizzes/${quizId}`);
      }

      if (action === "edit-quiz") {
        const quizData = await this.api.get(`/api/quizzes/${quizId}`);
        const quiz = quizData.quiz;
        const title = window.prompt("Edit quiz title:", quiz.title);
        if (!title) {
          return;
        }

        const firstQuestion = quiz.questions[0];
        const prompt = window.prompt("Edit question:", firstQuestion.prompt);
        if (!prompt) {
          return;
        }

        const options = window
          .prompt("Edit options (one line separated by |):", firstQuestion.options.join("|"))
          ?.split("|")
          .map((value) => value.trim())
          .filter(Boolean);

        if (!options?.length) {
          return;
        }

        const correctAnswer = window.prompt(
          "Edit correct option index:",
          firstQuestion.correctAnswer
        );
        if (correctAnswer === null || correctAnswer === "") {
          return;
        }

        const topic = window.prompt("Edit topic:", firstQuestion.topic || "General");
        const explanation = window.prompt(
          "Edit explanation:",
          firstQuestion.explanation || ""
        );

        await this.api.patch(`/api/quizzes/${quizId}`, {
          title,
          questions: [
            {
              prompt,
              options,
              correctAnswer: Number(correctAnswer),
              topic: topic || "General",
              explanation: explanation || ""
            }
          ]
        });
      }

      await this.loadCourse();
    } catch (error) {
      this.show(error.message, "danger");
    }
  }
}

const page = new CoursePage();
page.bootstrap();
