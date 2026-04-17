export class ApiClient {
  async request(url, options = {}) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      credentials: "include",
      ...options
    };

    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : {};

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  get(url) {
    return this.request(url, { method: "GET" });
  }

  post(url, body) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  patch(url, body) {
    return this.request(url, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  delete(url) {
    return this.request(url, { method: "DELETE" });
  }
}
