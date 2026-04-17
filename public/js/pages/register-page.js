import { ApiClient } from "../core/api.js";
import { showMessage, hideMessage } from "../core/helpers.js";

class RegisterPage {
  constructor() {
    this.api = new ApiClient();
    this.form = document.getElementById("registerForm");
    this.messageBox = document.getElementById("messageBox");
  }

  registerEvents() {
    this.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideMessage(this.messageBox);

      const formData = new FormData(this.form);

      try {
        await this.api.post("/api/auth/register", {
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: formData.get("role")
        });

        window.location.href = "/app/dashboard";
      } catch (error) {
        showMessage(this.messageBox, error.message, "danger");
      }
    });
  }
}

const page = new RegisterPage();
page.registerEvents();
