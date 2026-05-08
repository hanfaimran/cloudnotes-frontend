// ── CloudNotes Auth ──

// Redirect if already logged in
(async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (res.ok) window.location.href = "dashboard.html";
  } catch (_) {}
})();

// Tab switching
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

// ── Login ──
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
      credentials: "include",
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    window.location.href = "dashboard.html";
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    setLoading("login-btn", false);
  }
});

// ── Signup ──
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
      credentials: "include",
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    window.location.href = "dashboard.html";
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    setLoading("signup-btn", false);
  }
});
