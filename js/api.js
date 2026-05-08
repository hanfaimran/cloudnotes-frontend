// ── CloudNotes API Helper ──

const api = {
  getToken() {
    return localStorage.getItem("cn_token");
  },

  getHeaders() {
    return {
      "Authorization": `Bearer ${this.getToken()}`
    };
  },

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.getHeaders()
    });
    if (res.status === 401) {
      localStorage.removeItem("cn_token");
      localStorage.removeItem("cn_user");
      window.location.href = "index.html";
      return null;
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { ...this.getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async postForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: formData
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async putForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: formData
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: this.getHeaders()
    });
    return { ok: res.ok, data: await res.json() };
  },

  async patch(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: this.getHeaders()
    });
    return { ok: res.ok, data: await res.json() };
  }
};
