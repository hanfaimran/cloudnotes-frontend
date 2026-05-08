// ── CloudNotes API Helper ──

const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
    if (res.status === 401) { window.location.href = "index.html"; return null; }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async postForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async putForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      credentials: "include",
      body: formData
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      credentials: "include"
    });
    return { ok: res.ok, data: await res.json() };
  },

  async patch(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      credentials: "include"
    });
    return { ok: res.ok, data: await res.json() };
  }
};
