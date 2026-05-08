// ── CloudNotes Dashboard ──

let allNotes = [];
let currentFilter = "all";
let editingNoteId = null;
let deleteNoteId = null;
let selectedColor = "#ffffff";
let pendingImageFile = null;
let pendingFileFile = null;
let searchTimeout = null;
let isListView = false;

// ── Init ──
(async () => {
  const data = await api.get("/auth/me");
  if (!data) return;
  const user = data.user;

  document.getElementById("sidebar-username").textContent = user.name;
  document.getElementById("sidebar-email").textContent = user.email;
  document.getElementById("user-avatar").textContent = user.name.charAt(0).toUpperCase();

  initTheme();
  await loadNotes();
  bindEvents();
})();

// ── Load Notes ──
async function loadNotes(query = "") {
  const path = query ? `/notes/?q=${encodeURIComponent(query)}` : "/notes/";
  const data = await api.get(path);
  if (!data) return;
  allNotes = data.notes;
  renderNotes(filterNotes(allNotes));
}

function filterNotes(notes) {
  if (currentFilter === "pinned") return notes.filter(n => n.pinned);
  if (currentFilter === "with-images") return notes.filter(n => n.image_url || n.file_url);
  return notes;
}

// ── Render ──
function renderNotes(notes) {
  const container = document.getElementById("notes-container");
  const emptyState = document.getElementById("empty-state");
  container.innerHTML = "";

  if (!notes.length) {
    emptyState.classList.remove("hidden");
    document.getElementById("empty-title").textContent =
      currentFilter !== "all" ? "No notes here" : "No notes yet";
    document.getElementById("empty-desc").textContent =
      currentFilter !== "all" ? "Try a different filter" : "Create your first note to get started";
    return;
  }

  emptyState.classList.add("hidden");

  notes.forEach((note, i) => {
    const card = createNoteCard(note, i);
    container.appendChild(card);
  });
}

function createNoteCard(note, index) {
  const card = document.createElement("div");
  card.className = `note-card${note.pinned ? " pinned" : ""}`;
  card.style.animationDelay = `${Math.min(index * 40, 300)}ms`;

  const colorBar = note.color && note.color !== "#ffffff"
    ? `<div class="card-color-bar" style="background:${note.color}"></div>` : "";

  const imageHtml = note.image_url
    ? `<img src="${note.image_url}" alt="Note image" class="card-image" loading="lazy" />` : "";

  const fileHtml = note.file_url
    ? `<div class="card-file-chip">
         <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5"/></svg>
         ${escHtml(note.file_name || "Attachment")}
       </div>` : "";

  const date = formatDate(note.updated_at);

  card.innerHTML = `
    ${colorBar}
    <div class="card-top">
      <h3 class="card-title">${escHtml(note.title)}</h3>
      <span class="pin-badge" title="Pinned">📌</span>
    </div>
    ${note.content ? `<p class="card-content">${escHtml(note.content)}</p>` : ""}
    ${imageHtml}
    ${fileHtml}
    <div class="card-footer">
      <span class="card-date">${date}</span>
      <div class="card-actions">
        <button class="card-action-btn pin-btn${note.pinned ? " active" : ""}" title="${note.pinned ? "Unpin" : "Pin"}" data-id="${note.id}">
          <svg viewBox="0 0 20 20" fill="none"><path d="M9.153 3.318L9.5 3h1l.347.318 1 5 .5.182.5-.182L13.5 4H14l1.5 1.5v.5L14.318 7.347 14.5 8h-.5L10 12v1l-1 1H8l-1-1v-1l1-1v-1L4 9V8.5L5.5 7H6l.5-.5.153-.5 1-5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="card-action-btn edit-btn" title="Edit" data-id="${note.id}">
          <svg viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9a2 2 0 01-.828.514l-3 1a1 1 0 01-1.243-1.243l1-3a2 2 0 01.514-.828l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="card-action-btn delete-btn delete" title="Delete" data-id="${note.id}">
          <svg viewBox="0 0 20 20" fill="none"><path d="M6 2h8M4 5h12M7 5v11M10 5v11M13 5v11M5 5l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>`;

  // Card events
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".card-action-btn")) openNote(note.id);
  });

  card.querySelector(".edit-btn").addEventListener("click", (e) => {
    e.stopPropagation(); openNote(note.id);
  });

  card.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation(); confirmDelete(note.id);
  });

  card.querySelector(".pin-btn").addEventListener("click", (e) => {
    e.stopPropagation(); togglePin(note.id);
  });

  return card;
}

// ── Modal: Open (create or edit) ──
function openModal(note = null) {
  editingNoteId = note ? note.id : null;
  pendingImageFile = null;
  pendingFileFile = null;

  document.getElementById("modal-title").textContent = note ? "Edit Note" : "New Note";
  document.getElementById("note-title").value = note ? note.title : "";
  document.getElementById("note-content").value = note ? note.content || "" : "";
  document.getElementById("modal-error").textContent = "";

  // Color
  selectedColor = note ? note.color : "#ffffff";
  document.querySelectorAll(".swatch").forEach(s => {
    s.classList.toggle("active", s.dataset.color === selectedColor);
  });

  // Pin
  const pinned = note ? note.pinned : false;
  document.getElementById("note-pinned").checked = pinned;
  document.getElementById("pin-toggle").classList.toggle("active", pinned);
  document.getElementById("pin-label").textContent = pinned ? "Pinned" : "Pin";

  // Image preview
  const imgWrap = document.getElementById("image-preview-wrap");
  const imgEl = document.getElementById("image-preview-img");
  if (note && note.image_url) {
    imgEl.src = note.image_url;
    imgWrap.classList.remove("hidden");
  } else {
    imgWrap.classList.add("hidden");
    imgEl.src = "";
  }

  // File preview
  const fileWrap = document.getElementById("file-preview-wrap");
  if (note && note.file_url) {
    document.getElementById("file-preview-name").textContent = note.file_name || "File";
    fileWrap.classList.remove("hidden");
  } else {
    fileWrap.classList.add("hidden");
  }

  // Reset file inputs
  document.getElementById("image-upload").value = "";
  document.getElementById("file-upload").value = "";

  document.getElementById("note-modal").classList.remove("hidden");
  document.getElementById("overlay").classList.remove("hidden");
  setTimeout(() => document.getElementById("note-title").focus(), 100);
}

function openNote(id) {
  const note = allNotes.find(n => n.id === id);
  if (note) openModal(note);
}

function closeModal() {
  document.getElementById("note-modal").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
  editingNoteId = null;
  pendingImageFile = null;
  pendingFileFile = null;
}

// ── Save Note ──
async function saveNote() {
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();
  const pinned = document.getElementById("note-pinned").checked;
  const errorEl = document.getElementById("modal-error");
  errorEl.textContent = "";

  if (!title) { errorEl.textContent = "Title is required"; return; }

  const btn = document.getElementById("save-note-btn");
  btn.querySelector(".btn-text").classList.add("hidden");
  btn.querySelector(".btn-loader").classList.remove("hidden");
  btn.disabled = true;

  const fd = new FormData();
  fd.append("title", title);
  fd.append("content", content);
  fd.append("color", selectedColor);
  fd.append("pinned", pinned.toString());
  if (pendingImageFile) fd.append("image", pendingImageFile);
  if (pendingFileFile) fd.append("file", pendingFileFile);

  try {
    let result;
    if (editingNoteId) {
      result = await api.putForm(`/notes/${editingNoteId}`, fd);
    } else {
      result = await api.postForm("/notes/", fd);
    }

    if (!result.ok) throw new Error(result.data.error || "Save failed");

    closeModal();
    await loadNotes(document.getElementById("search-input").value);
    showToast(editingNoteId ? "Note updated" : "Note created", "success");
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.querySelector(".btn-text").classList.remove("hidden");
    btn.querySelector(".btn-loader").classList.add("hidden");
    btn.disabled = false;
  }
}

// ── Delete ──
function confirmDelete(id) {
  deleteNoteId = id;
  document.getElementById("delete-modal").classList.remove("hidden");
  document.getElementById("overlay").classList.remove("hidden");
}

async function deleteNote() {
  if (!deleteNoteId) return;
  const result = await api.delete(`/notes/${deleteNoteId}`);
  document.getElementById("delete-modal").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
  if (result.ok) {
    await loadNotes(document.getElementById("search-input").value);
    showToast("Note deleted", "success");
  } else {
    showToast("Failed to delete", "error");
  }
  deleteNoteId = null;
}

// ── Pin Toggle ──
async function togglePin(id) {
  const result = await api.patch(`/notes/${id}/pin`);
  if (result.ok) {
    await loadNotes(document.getElementById("search-input").value);
  }
}

// ── Events ──
function bindEvents() {
  // Create button
  document.getElementById("create-note-btn").addEventListener("click", () => openModal());

  // Modal close
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("cancel-note-btn").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);

  // Save
  document.getElementById("save-note-btn").addEventListener("click", saveNote);

  // Delete modal
  document.getElementById("delete-backdrop").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });
  document.getElementById("cancel-delete-btn").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });
  document.getElementById("confirm-delete-btn").addEventListener("click", deleteNote);

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.getElementById("delete-modal").classList.add("hidden");
      document.getElementById("overlay").classList.add("hidden");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s" && editingNoteId !== undefined && !document.getElementById("note-modal").classList.contains("hidden")) {
      e.preventDefault(); saveNote();
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await api.post("/auth/logout", {});
    window.location.href = "index.html";
  });

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    const val = e.target.value;
    document.getElementById("search-clear").classList.toggle("hidden", !val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadNotes(val), 280);
  });
  document.getElementById("search-clear").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    document.getElementById("search-clear").classList.add("hidden");
    loadNotes();
  });

  // Filter nav
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      currentFilter = item.dataset.filter;
      const titles = { all: "All Notes", pinned: "Pinned", "with-images": "With Media" };
      document.getElementById("section-title").textContent = titles[currentFilter];
      renderNotes(filterNotes(allNotes));
      closeSidebar();
    });
  });

  // Color swatches
  document.querySelectorAll(".swatch").forEach(s => {
    s.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach(x => x.classList.remove("active"));
      s.classList.add("active");
      selectedColor = s.dataset.color;
    });
  });

  // Pin toggle
  document.getElementById("pin-toggle").addEventListener("click", () => {
    const cb = document.getElementById("note-pinned");
    cb.checked = !cb.checked;
    document.getElementById("pin-toggle").classList.toggle("active", cb.checked);
    document.getElementById("pin-label").textContent = cb.checked ? "Pinned" : "Pin";
  });

  // Image upload
  document.getElementById("image-upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("image-preview-img").src = ev.target.result;
      document.getElementById("image-preview-wrap").classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("remove-image").addEventListener("click", () => {
    pendingImageFile = null;
    document.getElementById("image-preview-wrap").classList.add("hidden");
    document.getElementById("image-preview-img").src = "";
    document.getElementById("image-upload").value = "";
    if (editingNoteId) {
      const note = allNotes.find(n => n.id === editingNoteId);
      if (note) note.image_url = null;
    }
  });

  // File upload
  document.getElementById("file-upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingFileFile = file;
    document.getElementById("file-preview-name").textContent = file.name;
    document.getElementById("file-preview-wrap").classList.remove("hidden");
  });

  document.getElementById("remove-file").addEventListener("click", () => {
    pendingFileFile = null;
    document.getElementById("file-preview-wrap").classList.add("hidden");
    document.getElementById("file-upload").value = "";
  });

  // Theme
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // View controls
  document.getElementById("grid-view-btn").addEventListener("click", () => {
    isListView = false;
    document.getElementById("notes-container").classList.remove("list-view");
    document.getElementById("grid-view-btn").classList.add("active");
    document.getElementById("list-view-btn").classList.remove("active");
  });
  document.getElementById("list-view-btn").addEventListener("click", () => {
    isListView = true;
    document.getElementById("notes-container").classList.add("list-view");
    document.getElementById("list-view-btn").classList.add("active");
    document.getElementById("grid-view-btn").classList.remove("active");
  });

  // Mobile sidebar
  document.getElementById("hamburger").addEventListener("click", openSidebar);
  document.getElementById("sidebar-close").addEventListener("click", closeSidebar);
  document.getElementById("overlay").addEventListener("click", closeSidebar);
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.remove("hidden");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  if (document.getElementById("note-modal").classList.contains("hidden") &&
      document.getElementById("delete-modal").classList.contains("hidden")) {
    document.getElementById("overlay").classList.add("hidden");
  }
}

// ── Theme ──
function initTheme() {
  const saved = localStorage.getItem("cn-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("cn-theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  document.querySelector(".sun-icon").classList.toggle("hidden", theme === "dark");
  document.querySelector(".moon-icon").classList.toggle("hidden", theme === "light");
}

// ── Toast ──
function showToast(msg, type = "default") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove());
  }, 2800);
}

// ── Helpers ──
function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
