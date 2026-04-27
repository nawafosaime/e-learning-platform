import { AuthService } from "./auth.js";
import { showMessage, hideMessage } from "./helpers.js";

export class BasePage {
  constructor(messageBoxId = "messageBox") {
    this.auth = new AuthService();
    this.messageBox = document.getElementById(messageBoxId);
    this.currentUser = null;
  }

  async initialize() {
    this.currentUser = await this.auth.getCurrentUser();
    this.setupLogout();
    this.syncRoleVisibility();
  }

  setupLogout() {
    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        await this.auth.logout();
      });
    }
  }

  syncRoleVisibility() {
    const studentOnly = document.querySelectorAll(".student-only");
    const doctorPanels = document.querySelectorAll(".doctor-panel");
    const studentPanels = document.querySelectorAll(".student-panel");

    studentOnly.forEach((element) => {
      element.classList.toggle("d-none", this.currentUser?.role !== "student");
    });

    doctorPanels.forEach((element) => {
      element.classList.toggle("d-none", this.currentUser?.role !== "doctor");
    });

    studentPanels.forEach((element) => {
      element.classList.toggle("d-none", this.currentUser?.role !== "student");
    });
  }

  show(message, type = "info") {
    if (this.messageBox) {
      showMessage(this.messageBox, message, type);
    }
  }

  clearMessage() {
    if (this.messageBox) {
      hideMessage(this.messageBox);
    }
  }
}
