import { ApiClient } from "../core/api.js";
import { showMessage, hideMessage } from "../core/helpers.js";

class LoginPage {
  constructor() {
    this.api = new ApiClient();
    this.form = document.getElementById("loginForm");
    this.messageBox = document.getElementById("messageBox");
  }

  registerEvents() {
    this.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessage(this.messageBox);

      const formData = new FormData(this.form);

      try {
        await this.api.post("/api/auth/login", {
          email: formData.get("email"),
          password: formData.get("password")
        });

        window.location.href = "/app/dashboard";
      } catch (error) {
        showMessage(this.messageBox, error.message, "danger");
      }
    });
  }
}

const page = new LoginPage();
page.registerEvents();
