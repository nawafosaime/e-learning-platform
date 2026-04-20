import { BasePage } from "../core/base-page.js";
import { ApiClient } from "../core/api.js";
import { escapeHtml } from "../core/helpers.js";

class DashboardPage extends BasePage {
  constructor() {
    super();
    this.api = new ApiClient();
    this.courseForm = document.getElementById("courseForm");
    this.coursesContainer = document.getElementById("coursesContainer");
    this.studentProgressSummary = document.getElementById("studentProgressSummary");
  }

  async bootstrap() {
    await this.initialize();
    this.renderWelcome();
    this.registerEvents();
    await Promise.all([this.loadCourses(), this.loadStudentSummary()]);
  }

  renderWelcome() {
    document.getElementById("welcomeName").textContent = this.currentUser.name;
    document.getElementById("welcomeRole").textContent =
      this.currentUser.role === "doctor" ? "Doctor account" : "Student account";
  }

  registerEvents() {
    if (this.courseForm) {
      this.courseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(this.courseForm);

        try {
          await this.api.post("/api/courses", {
            title: formData.get("title"),
            category: formData.get("category"),
            description: formData.get("description")
          });

          this.courseForm.reset();
          this.show("Course created successfully.", "success");
          await this.loadCourses();
        } catch (error) {
          this.show(error.message, "danger");
        }
      });
    }
  }

  async loadStudentSummary() {
    if (this.currentUser.role !== "student") {
      return;
    }

    try {
      const data = await this.api.get("/api/progress/me");
      if (!data.progress.length) {
        this.studentProgressSummary.innerHTML = `
          <div class="col-12">
            <div class="empty-state">Enroll in a course to start tracking progress.</div>
          </div>
        `;
        return;
      }

      this.studentProgressSummary.innerHTML = data.progress
        .slice(0, 3)
        .map(
          (item) => `
            <div class="col-md-4">
              <div class="progress-card h-100">
                <h3 class="h6 fw-bold">${escapeHtml(item.course.title)}</h3>
                <p class="small-muted mb-2">Progress: ${item.overallProgress}%</p>
                <div class="progress mb-3">
                  <div class="progress-bar" style="width: ${item.overallProgress}%"></div>
                </div>
                <p class="small-muted mb-1">Focus topics</p>
                <div class="topic-list">
                  ${
                    item.focusTopics.length
                      ? item.focusTopics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")
                      : "<span>Keep going</span>"
                  }
                </div>
              </div>
            </div>
          `
        )
        .join("");
    } catch (error) {
      this.show(error.message, "danger");
    }
  }

  async loadCourses() {
    try {
      const data = await this.api.get("/api/courses");

      if (!data.courses.length) {
        this.coursesContainer.innerHTML = `
          <div class="col-12">
            <div class="empty-state">No courses yet. Doctors can create the first course.</div>
          </div>
        `;
        return;
      }

      this.coursesContainer.innerHTML = data.courses
        .map((course) => this.renderCourseCard(course))
        .join("");
    } catch (error) {
      this.show(error.message, "danger");
    }
  }

  renderCourseCard(course) {
    const actionText =
      this.currentUser.role === "doctor"
        ? course.isOwner
          ? "Manage course"
          : "View course"
        : course.isEnrolled
          ? "Continue learning"
          : "Open course";

    const statusText =
      this.currentUser.role === "doctor"
        ? course.isOwner
          ? "You manage this course"
          : `Doctor: ${escapeHtml(course.doctor.name)}`
        : course.isEnrolled
          ? `Enrolled • Progress ${course.overallProgress}%`
          : `Doctor: ${escapeHtml(course.doctor.name)}`;

    return `
      <div class="col-lg-4 col-md-6 course-card">
        <div class="card shadow-soft border-0">
          <div class="card-body d-flex flex-column">
            <p class="eyebrow mb-2">${escapeHtml(course.category || "General")}</p>
            <h3 class="h4 fw-bold">${escapeHtml(course.title)}</h3>
            <p class="text-secondary flex-grow-1">${escapeHtml(course.description)}</p>
            <p class="small-muted">${statusText}</p>
            <a class="btn btn-outline-primary mt-2" href="/app/course?id=${course._id}">${actionText}</a>
          </div>
        </div>
      </div>
    `;
  }
}

const page = new DashboardPage();
page.bootstrap();
