import { generateCapsule } from "../ai/capsulegenerator.js";
import { generateAICapsule } from "../ai/aigenerator.js";

// ========================================================
// CONSTANTS
// ========================================================

const STORAGE_KEYS = ["capsules", "currentConversationId", "aiCapsules", "theme"];
const INITIAL_CHAT_COUNT = 3;
const CHAT_INCREMENT = 3;
const DEFAULT_VISIBLE = 3;
const TOAST_DURATION = 3000;
const TOAST_DURATION_ERROR = 5000;

// ========================================================
// STATE
// ========================================================

let visibleChatsLimit = INITIAL_CHAT_COUNT;
let isCapsulesExpanded = false;
let toastTimeout = null;
let currentTheme = "light";
let searchQuery = "";

// ========================================================
// UTILS
// ========================================================

function escapeHTML(str) {
  if (typeof str !== "string") return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function updateIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// ========================================================
// STORAGE
// ========================================================

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

function storageSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function getStorage() {
  const result = await storageGet(STORAGE_KEYS);
  return {
    capsules: normalizeRecord(result.capsules),
    currentConversationId: result.currentConversationId || null,
    aiCapsules: normalizeRecord(result.aiCapsules),
  };
}

function sortByUpdatedAt(entries) {
  return entries.sort(([, a], [, b]) => {
    const timeA = Date.parse(a?.updatedAt || a?.createdAt || 0);
    const timeB = Date.parse(b?.updatedAt || b?.createdAt || 0);
    return timeB - timeA;
  });
}

// ========================================================
// TOAST
// ========================================================

function setStatus(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message || "";

  if (!message) {
    toast.className = "toast";
    return;
  }

  toast.className = isError ? "toast show error" : "toast show";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = "toast";
  }, isError ? TOAST_DURATION_ERROR : TOAST_DURATION);
}

// ========================================================
// BUTTON LOADING STATE
// ========================================================

function setButtonLoading(btn, loadingText) {
  btn._originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${escapeHTML(loadingText)}`;
}

function resetButton(btn) {
  if (btn._originalHTML) {
    btn.innerHTML = btn._originalHTML;
    delete btn._originalHTML;
  }
  btn.disabled = false;
  updateIcons();
}


function getPreviewText(capsule, type) {
  if (type === "ai") {
    return capsule.summary || "";
  }
  // Recent chat — prefer summary, fallback to last message
  if (capsule.summary) return capsule.summary;
  const messages = Array.isArray(capsule.messages) ? capsule.messages : [];
  if (messages.length === 0) return "";
  const lastMsg = messages[messages.length - 1];
  return lastMsg?.content || lastMsg?.text || "";
}

function filterEntries(entries, isAi) {
  if (!searchQuery) return entries;
  const q = searchQuery.toLowerCase();

  return entries.filter(([id, c]) => {
    let searchString = (c.title || "") + " " + (c.summary || "");

    if (isAi) {
      const convStr = Array.isArray(c.conversation) ? c.conversation.map(m => m.content || m.text || "").join(" ") : "";
      searchString += " " + (c.keyTopics || []).join(" ") + " " + convStr;
    } else {
      const messagesStr = Array.isArray(c.messages) ? c.messages.map(m => m.content || m.text || "").join(" ") : "";
      searchString += " " + messagesStr;
    }

    return searchString.toLowerCase().includes(q);
  });
}

/**
 * Render a unified card component.
 * Used for both Recent Chats and Generated Capsules.
 */
function renderCard(id, capsule, type, index) {
  const item = document.createElement("div");
  item.className = "capsule-card";
  item.setAttribute("tabindex", "0");
  item.setAttribute("role", "button");
  item.style.animationDelay = `${index * 40}ms`;

  const updatedAt = formatDate(capsule.updatedAt);
  const title = escapeHTML(capsule.title || (type === "ai" ? "Untitled Capsule" : "Untitled Chat"));
  const preview = escapeHTML(getPreviewText(capsule, type));

  // Build preview HTML
  const previewHtml = preview
    ? `<div class="card-preview">${preview}</div>`
    : "";

  // Build metadata HTML
  let metaHtml = "";
  if (type === "ai") {
    metaHtml = `
      <span class="ai-badge"><i data-lucide="brain"></i> AI</span>
      <span class="dot">·</span>
      <i data-lucide="tag"></i> ${capsule.keyTopics?.length || 0} Topics
      <span class="dot">·</span>
      ${updatedAt}
    `;
  } else {
    metaHtml = `
      <i data-lucide="message-circle"></i>
      ${capsule.messageCount || 0} messages
      <span class="dot">·</span>
      ${updatedAt}
    `;
  }

  item.innerHTML = `
    <div class="card-title-row">
      <div class="card-title">${title}</div>
    </div>
    ${previewHtml}
    <div class="card-meta">
      ${metaHtml}
    </div>
  `;

  const url = type === "ai"
    ? chrome.runtime.getURL(`viewer/viewer.html?id=${id}`)
    : `https://chatgpt.com/c/${id}`;

  const openUrl = () => chrome.tabs.create({ url });

  item.addEventListener("click", openUrl);
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openUrl();
    }
  });

  return item;
}

function updateSeeMoreButton(btnId, isExpanded, totalCount) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (searchQuery || totalCount <= DEFAULT_VISIBLE) {
    btn.style.display = "none";
  } else {
    btn.style.display = "flex";
    btn.querySelector("span").textContent = isExpanded ? "Show less" : "Show more";
    btn.classList.toggle("expanded", isExpanded);
  }
}

function updateChatsSeeMoreButton(totalCount) {
  const btn = document.getElementById("seeMoreChats");
  if (!btn) return;

  if (searchQuery || visibleChatsLimit >= totalCount) {
    btn.classList.add("hidden");
    btn.style.display = "none";
  } else {
    btn.classList.remove("hidden");
    btn.style.display = "flex";
    const span = btn.querySelector("span");
    if (span) span.textContent = "See more";
  }
}

// ========================================================
// RENDERING — Current Chat
// ========================================================

async function renderCurrentChat() {
  const storage = await getStorage();
  const currentId = storage.currentConversationId;
  const container = document.getElementById("currentChat");

  container.innerHTML = "";

  if (!currentId || !storage.capsules[currentId]) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="message-circle"></i></div>
        <h3>No active conversation</h3>
        <p>Open ChatGPT to start capturing memories.</p>
      </div>`;
    updateIcons();
    return;
  }

  const capsule = storage.capsules[currentId];
  const card = document.createElement("div");
  card.className = "capsule-card current-chat-card";
  const updatedAt = formatDate(capsule.updatedAt);

  card.innerHTML = `
    <div class="card-title-row">
      <div class="card-title">${escapeHTML(capsule.title || "Untitled Chat")}</div>
      <span class="current-badge">Current</span>
    </div>
    <div class="card-meta">
      <i data-lucide="message-circle"></i>
      ${capsule.messageCount || 0} messages
      ${updatedAt ? `<span class="dot">·</span> ${updatedAt}` : ""}
    </div>
    <div class="action-buttons">
      <button id="generateCurrentCapsule" class="primary-button">
        <i data-lucide="wand-2"></i> Generate Capsule
      </button>
    </div>
  `;
  container.appendChild(card);

  document.getElementById("generateCurrentCapsule").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try {
      setButtonLoading(btn, "Generating…");
      await generateCurrentAICapsule();
      setStatus("Generated Successfully");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      if (document.body.contains(btn)) resetButton(btn);
    }
  });

  updateIcons();
}

// ========================================================
// RENDERING — Recent Chats
// ========================================================

async function renderCapsules() {
  const storage = await getStorage();
  let entries = sortByUpdatedAt(Object.entries(storage.capsules));
  entries = entries.filter(([id]) => id !== storage.currentConversationId);

  entries = filterEntries(entries, false);

  const container = document.getElementById("capsuleList");
  container.textContent = "";

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="inbox"></i></div>
        <h3>No recent conversations</h3>
        <p>Your chat history will appear here automatically.</p>
      </div>`;
    updateChatsSeeMoreButton(0);
    updateIcons();
    return;
  }

  const limit = searchQuery ? entries.length : visibleChatsLimit;
  const visible = entries.slice(0, limit);

  visible.forEach(([id, capsule], index) => {
    container.appendChild(renderCard(id, capsule, "recent", index));
  });

  updateChatsSeeMoreButton(entries.length);
  updateIcons();
}

// ========================================================
// RENDERING — Generated Capsules
// ========================================================

async function renderGeneratedCapsules() {
  const storage = await getStorage();
  let entries = sortByUpdatedAt(Object.entries(storage.aiCapsules));

  entries = filterEntries(entries, true);

  const container = document.getElementById("generatedCapsules");
  container.textContent = "";

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="sparkles"></i></div>
        <h3>No capsules generated yet</h3>
        <p>Use Generate Capsule to create your first AI memory.</p>
      </div>`;
    updateSeeMoreButton("seeMoreCapsules", isCapsulesExpanded, 0);
    updateIcons();
    return;
  }

  const limit = searchQuery ? entries.length : (isCapsulesExpanded ? entries.length : DEFAULT_VISIBLE);
  const visible = entries.slice(0, limit);

  visible.forEach(([id, capsule], index) => {
    container.appendChild(renderCard(id, capsule, "ai", index));
  });

  updateSeeMoreButton("seeMoreCapsules", isCapsulesExpanded, entries.length);
  updateIcons();
}

// ========================================================
// ACTIONS
// ========================================================

async function requestActiveChatCapture() {
  if (!chrome.tabs?.query || !chrome.tabs?.sendMessage) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || typeof tab.url !== "string" || !tab.url.startsWith("https://chatgpt.com/")) return;

    await chrome.tabs.sendMessage(tab.id, { type: "MEMORY_CAPSULE_CAPTURE_NOW" });
  } catch (_error) {
    // Content script might not be injected
  }
}

async function generateCurrentAICapsule() {
  const storage = await getStorage();
  const conversationId = storage.currentConversationId;
  if (!conversationId) throw new Error("No active chat to generate a capsule for.");

  const capsule = storage.capsules[conversationId];
  if (!capsule) throw new Error("Conversation data not found.");

  const messages = Array.isArray(capsule.messages) ? capsule.messages : [];
  const conversationText = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  if (!conversationText) throw new Error("No messages to send to AI.");

  const aiCapsule = await generateAICapsule(conversationText);
  const generatedCapsule = {
    ...aiCapsule,
    updatedAt: new Date().toISOString(),
    metadata: {
      createdAt: capsule.createdAt,
      updatedAt: capsule.updatedAt,
      messageCount: capsule.messageCount,
    },
    conversation: messages,
  };

  const latestStorage = await getStorage();
  const aiCapsules = {
    ...latestStorage.aiCapsules,
    [conversationId]: generatedCapsule,
  };

  await storageSet({ aiCapsules });
}

// ========================================================
// EVENT LISTENERS
// ========================================================

document.getElementById("seeMoreChats").addEventListener("click", () => {
  visibleChatsLimit += CHAT_INCREMENT;
  renderCapsules();
});

document.getElementById("seeMoreCapsules").addEventListener("click", () => {
  isCapsulesExpanded = !isCapsulesExpanded;
  renderGeneratedCapsules();
});

// ========================================================
// THEME MANAGEMENT
// ========================================================

function applyTheme(theme) {
  currentTheme = theme || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) toggle.checked = currentTheme === "dark";
}

async function loadTheme() {
  try {
    const result = await storageGet(["theme"]);
    applyTheme(result.theme || "light");
  } catch (_) {
    applyTheme("light");
  }
}

async function setTheme(theme) {
  applyTheme(theme);
  await storageSet({ theme });
}

// ========================================================
// SETTINGS PANEL
// ========================================================

const settingsOverlay = document.getElementById("settingsOverlay");
const settingsBackBtn = document.getElementById("settingsBack");
const darkModeToggle = document.getElementById("darkModeToggle");

// Open settings
document.querySelector(".btn-icon[aria-label='Settings']")?.addEventListener("click", () => {
  settingsOverlay.classList.add("open");
  updateIcons();
});

// Close settings
settingsBackBtn?.addEventListener("click", () => {
  settingsOverlay.classList.remove("open");
});

// Dark mode toggle
darkModeToggle?.addEventListener("change", (e) => {
  const newTheme = e.target.checked ? "dark" : "light";
  setTheme(newTheme).catch((err) => setStatus(err.message, true));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.capsules || changes.currentConversationId) {
    renderCurrentChat().catch((e) => setStatus(e.message, true));
    renderCapsules().catch((e) => setStatus(e.message, true));
  }

  if (changes.aiCapsules) {
    renderGeneratedCapsules().catch((e) => setStatus(e.message, true));
  }

  if (changes.theme) {
    applyTheme(changes.theme.newValue);
  }
});

// ========================================================
// INITIALIZATION
// ========================================================

updateIcons();

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    visibleChatsLimit = INITIAL_CHAT_COUNT;

    const currentChatSection = document.getElementById("currentChatSection");
    if (searchQuery) {
      currentChatSection.style.display = "none";
    } else {
      currentChatSection.style.display = "block";
    }

    renderCapsules();
    renderGeneratedCapsules();
  });
}

// Load theme first (sync appearance before content renders)
loadTheme().then(() => {
  requestActiveChatCapture()
    .catch(() => undefined)
    .finally(() => {
      Promise.all([renderCurrentChat(), renderCapsules(), renderGeneratedCapsules()]).catch(
        (error) => setStatus(error.message || "Failed to load UI", true)
      );
    });
});