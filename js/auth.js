// ── CloudNotes Auth ──

(async () => {
  try {
    const token = localStorage.getItem("cn_token");
    if (token) {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) window.location.href = "dashboard.html";
    }
  } catch (_) {}
})();

const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".auth-form");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    forms.forEach(f => f.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-form`).classList.add("active");
    clearErrors();
  });
});

function clearErrors() {
  document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.querySelector(".btn-text").classList.toggle("hidden", loading);
  btn.querySelector(".btn-loader").classList.toggle("hidden", !loading);
  btn.disabled = loading;
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  setLoading("login-btn", true);

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("cn_token", data.token);
    localStorage.setItem("cn_user", JSON.stringify(data.user));
    window.location.href = "dashboard.html";
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    setLoading("login-btn", false);
  }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("signup-error");
  errorEl.textContent = "";
  setLoading("signup-btn", true);

  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters";
    setLoading("signup-btn", false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    localStorage.setItem("cn_token", data.token);
    localStorage.setItem("cn_user", JSON.stringify(data.user));
    window.location.href = "dashboard.html";
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    setLoading("signup-btn", false);
  }
});
