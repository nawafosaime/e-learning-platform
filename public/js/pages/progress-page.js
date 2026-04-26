import { BasePage } from "../core/base-page.js";
import { ApiClient } from "../core/api.js";
import { escapeHtml } from "../core/helpers.js";

class ProgressPage extends BasePage {
  constructor() {
    super();
    this.api = new ApiClient();
    this.container = document.getElementById("progressContainer");
  }

  async bootstrap() {
    await this.initialize();
    if (this.currentUser.role !== "student") {
      this.show("Only students can view this page.", "warning");
      return;
    }

    await this.loadProgress();
  }

  async loadProgress() {
    try {
      const data = await this.api.get("/api/progress/me");

      if (!data.progress.length) {
        this.container.innerHTML = `
          <div class="col-12">
            <div class="empty-state">You are not enrolled in any course yet.</div>
          </div>
        `;
        return;
      }

      this.container.innerHTML = data.progress
        .map(
          (item) => `
            <div class="col-lg-6">
              <article class="progress-card h-100">
                <p class="eyebrow mb-2">${escapeHtml(item.course.category || "General")}</p>
                <h2 class="h4 fw-bold">${escapeHtml(item.course.title)}</h2>
                <p class="text-secondary mb-3">Doctor: ${escapeHtml(item.course.doctor.name)}</p>
                <p class="mb-2">Overall progress: <strong>${item.overallProgress}%</strong></p>
                <div class="progress mb-3">
                  <div class="progress-bar" style="width: ${item.overallProgress}%"></div>
                </div>
                <p class="small-muted mb-1">Completed lessons: ${item.completedLessons}</p>
                <p class="small-muted mb-3">Quiz attempts: ${item.quizAttempts}</p>
                <p class="small-muted mb-2">Focus topics</p>
                <div class="topic-list">
                  ${
                    item.focusTopics.length
                      ? item.focusTopics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")
                      : "<span>Doing well</span>"
                  }
                </div>
              </article>
            </div>
          `
        )
        .join("");
    } catch (error) {
      this.show(error.message, "danger");
    }
  }
}

const page = new ProgressPage();
page.bootstrap();
