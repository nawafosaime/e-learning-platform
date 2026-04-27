import { BasePage } from "../core/base-page.js";
import { ApiClient } from "../core/api.js";
import { escapeHtml, getParam, showMessage, hideMessage } from "../core/helpers.js";

class QuizPage extends BasePage {
  constructor() {
    super("resultBox");
    this.api = new ApiClient();
    this.quizId = getParam("id");
    this.form = document.getElementById("quizAttemptForm");
    this.resultBox = document.getElementById("resultBox");
  }

  async bootstrap() {
    await this.initialize();
    if (!this.quizId) {
      this.show("Quiz ID is missing.", "danger");
      return;
    }

    await this.loadQuiz();
  }

  async loadQuiz() {
    try {
      const data = await this.api.get(`/api/quizzes/${this.quizId}`);
      this.quiz = data.quiz;
      document.getElementById("quizTitle").textContent = this.quiz.title;
      this.renderQuiz();
    } catch (error) {
      this.show(error.message, "danger");
    }
  }

  renderQuiz() {
    if (this.currentUser.role === "doctor") {
      this.form.innerHTML = `
        <div class="alert alert-info">
          Doctor preview mode. Questions are shown for review only.
        </div>
        ${this.quiz.questions
          .map(
            (question, index) => `
              <section class="question-block">
                <h2 class="h5 fw-bold">Question ${index + 1}</h2>
                <p>${escapeHtml(question.prompt)}</p>
                <ol>
                  ${question.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}
                </ol>
                <p class="small-muted mb-1">Correct answer index: ${question.correctAnswer}</p>
                <p class="small-muted mb-0">Topic: ${escapeHtml(question.topic || "General")}</p>
              </section>
            `
          )
          .join("")}
      `;
      return;
    }

    this.form.innerHTML =
      this.quiz.questions
        .map(
          (question, index) => `
            <section class="question-block">
              <h2 class="h5 fw-bold">Question ${index + 1}</h2>
              <p>${escapeHtml(question.prompt)}</p>
              <div class="d-grid gap-2">
                ${question.options
                  .map(
                    (option, optionIndex) => `
                      <label class="form-check p-3 border rounded-4">
                        <input
                          class="form-check-input"
                          type="radio"
                          name="question-${question._id}"
                          value="${optionIndex}"
                        />
                        <span class="ms-2">${escapeHtml(option)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("") +
      `
        <div class="d-flex gap-2">
          <button class="btn btn-primary" type="submit">Submit Quiz</button>
          <a class="btn btn-outline-secondary" href="/app/dashboard">Back</a>
        </div>
      `;

    this.form.addEventListener("submit", (event) => this.submitQuiz(event));
  }

  async submitQuiz(event) {
    event.preventDefault();
    hideMessage(this.resultBox);

    const answers = this.quiz.questions.map((question) => {
      const selected = this.form.querySelector(`input[name="question-${question._id}"]:checked`);
      return {
        questionId: question._id,
        selectedIndex: selected ? Number(selected.value) : -1
      };
    });

    try {
      const data = await this.api.post(`/api/quizzes/${this.quizId}/submit`, { answers });
      const result = data.result;

      showMessage(
        this.resultBox,
        `Score: ${result.score}/${result.total} (${result.percentage}%). ${
          result.weakTopics.length
            ? `Review these topics: ${result.weakTopics.join(", ")}.`
            : "Excellent work. No weak topics detected."
        } Overall progress: ${result.progress.overallProgress}%.`,
        "success"
      );
    } catch (error) {
      showMessage(this.resultBox, error.message, "danger");
    }
  }
}

const page = new QuizPage();
page.bootstrap();
