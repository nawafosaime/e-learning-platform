import { ApiClient } from "./api.js";

export class AuthService {
  constructor() {
    this.api = new ApiClient();
  }

  async getCurrentUser() {
    const data = await this.api.get("/api/auth/me");
    return data.user;
  }

  async logout() {
    await this.api.post("/api/auth/logout", {});
    window.location.href = "/login";
  }
}
