import { generateCapsule } from "../ai/capsulegenerator.js";
import { generateAICapsule } from "../ai/aigenerator.js";

// ========================================================
// STORAGE HELPERS
// ========================================================

const STORAGE_KEYS = ["capsules", "currentConversationId", "aiCapsules"];

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

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

function setStatus(message, isError = false) {
  const statusElement = document.getElementById("status");
  if (!statusElement) return;
  statusElement.textContent = message || "";
  statusElement.className = isError ? "error" : "";
}

function downloadJson(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ========================================================
// RENDERING
// ========================================================

let visibleChats = 3;
let visibleCapsules = 3;

async function renderCurrentChat() {
  const storage = await getStorage();
  const currentId = storage.currentConversationId;
  const container = document.getElementById("currentChat");
  
  container.innerHTML = "";
  
  if (!currentId || !storage.capsules[currentId]) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search"></i>
        <p>No conversations captured yet.</p>
      </div>`;
    updateIcons();
    return;
  }
  
  const capsule = storage.capsules[currentId];
  
  const card = document.createElement("div");
  card.className = "capsule-card hero-card";
  card.innerHTML = `
    <div class="card-title">${capsule.title || "Untitled Chat"}</div>
    <div class="card-meta">
      <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
      ${capsule.messageCount || 0} messages
    </div>
    <div class="action-buttons">
      <button id="generateCurrentCapsule" class="primary-button">
        <i data-lucide="sparkles"></i> Generate Capsule
      </button>
      <button id="exportCurrentChat" class="secondary-button">
        <i data-lucide="download"></i> Export
      </button>
    </div>
  `;
  container.appendChild(card);
  
  document.getElementById("generateCurrentCapsule").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try {
      btn.disabled = true;
      setStatus("Generating Capsule...");
      await generateCurrentAICapsule();
      setStatus("Capsule Generated!");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("exportCurrentChat").addEventListener("click", async (e) => {
    try {
      setStatus("Exporting...");
      await exportCurrentConversation();
      setStatus("");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  updateIcons();
}

async function renderCapsules() {
  const storage = await getStorage();
  const entries = sortByUpdatedAt(Object.entries(storage.capsules));
  
  const capsuleList = document.getElementById("capsuleList");
  capsuleList.textContent = "";
  
  const recentChats = entries.filter(([id]) => id !== storage.currentConversationId);
  
  if (recentChats.length === 0) {
    capsuleList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clock-3"></i>
        <p>No recent conversations.</p>
      </div>`;
    document.getElementById("seeMoreChats").style.display = "none";
    updateIcons();
    return;
  }
  
  const visible = recentChats.slice(0, visibleChats);
  
  for (const [id, capsule] of visible) {
    const item = document.createElement("div");
    item.className = "capsule-card";
    
    const updatedAt = capsule.updatedAt 
      ? new Date(capsule.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
      : "Not dated";
    
    item.innerHTML = `
      <div class="card-title">${capsule.title || "Untitled Chat"}</div>
      <div class="card-meta">
        <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
        ${capsule.messageCount || 0} messages
        <span style="margin: 0 4px;">•</span>
        ${updatedAt}
      </div>
    `;
    
    item.addEventListener("click", () => {
      chrome.tabs.create({ url: `https://chatgpt.com/c/${id}` });
    });
    
    capsuleList.appendChild(item);
  }
  
  const seeMoreBtn = document.getElementById("seeMoreChats");
  if (recentChats.length > visibleChats) {
    seeMoreBtn.style.display = "flex";
  } else {
    seeMoreBtn.style.display = "none";
  }

  updateIcons();
}

async function renderGeneratedCapsules() {
  const storage = await getStorage();
  const entries = sortByUpdatedAt(Object.entries(storage.aiCapsules));
  
  const generatedCapsules = document.getElementById("generatedCapsules");
  generatedCapsules.textContent = "";
  
  if (entries.length === 0) {
    generatedCapsules.innerHTML = `
      <div class="empty-state">
        <i data-lucide="brain"></i>
        <p>Generate your first AI Capsule.</p>
      </div>`;
    document.getElementById("seeMoreCapsules").style.display = "none";
    updateIcons();
    return;
  }
  
  const visible = entries.slice(0, visibleCapsules);
  
  for (const [id, capsule] of visible) {
    const item = document.createElement("div");
    item.className = "capsule-card";
    
    const updatedAt = capsule.updatedAt 
      ? new Date(capsule.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
      : "";

    item.innerHTML = `
      <div class="card-title">${capsule.title || "Untitled Capsule"}</div>
      <div class="card-meta">
        <span class="ai-badge"><i data-lucide="sparkles"></i> AI</span>
        <span style="margin: 0 4px;">•</span>
        ${capsule.keyTopics?.length || 0} topics
        <span style="margin: 0 4px;">•</span>
        ${updatedAt}
      </div>
    `;
    
    item.addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL(`viewer/viewer.html?id=${id}`) });
    });
    
    generatedCapsules.appendChild(item);
  }
  
  const seeMoreBtn = document.getElementById("seeMoreCapsules");
  if (entries.length > visibleCapsules) {
    seeMoreBtn.style.display = "flex";
  } else {
    seeMoreBtn.style.display = "none";
  }

  updateIcons();
}

// ========================================================
// ACTIONS
// ========================================================

async function requestActiveChatCapture() {
  if (!chrome.tabs?.query || !chrome.tabs?.sendMessage) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://chatgpt.com/")) return;
    
    await chrome.tabs.sendMessage(tab.id, { type: "MEMORY_CAPSULE_CAPTURE_NOW" });
  } catch (_error) {
    // Content script might not be injected
  }
}

async function exportCurrentConversation() {
  const storage = await getStorage();
  const conversationId = storage.currentConversationId;
  if (!conversationId) throw new Error("No active chat to export.");
  
  const capsule = storage.capsules[conversationId];
  if (!capsule) throw new Error("Conversation data not found.");
  if (!Array.isArray(capsule.messages) || capsule.messages.length === 0) {
    throw new Error("Conversation has no messages.");
  }
  
  downloadJson("memory-capsule-export.json", generateCapsule(capsule));
}

async function generateCurrentAICapsule() {
  const storage = await getStorage();
  const conversationId = storage.currentConversationId;
  if (!conversationId) throw new Error("No active chat to generate a capsule for.");
  
  const capsule = storage.capsules[conversationId];
  if (!capsule) throw new Error("Conversation data not found.");
  
  const messages = Array.isArray(capsule.messages) ? capsule.messages : [];
  const conversationText = messages
    .filter((m) => m.content && m.content.trim())
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
  // Removed downloadJson to match requirements (capsule generation is saved directly)
  // Re-render generated capsules instantly
  await renderGeneratedCapsules();
}

// ========================================================
// EVENT LISTENERS
// ========================================================

document.getElementById("seeMoreChats").addEventListener("click", () => {
  visibleChats += 5;
  renderCapsules();
});

document.getElementById("seeMoreCapsules").addEventListener("click", () => {
  visibleCapsules += 5;
  renderGeneratedCapsules();
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
});

// ========================================================
// INITIALIZATION
// ========================================================

// Init lucide icons on load for static icons
document.addEventListener("DOMContentLoaded", () => {
  updateIcons();
});

requestActiveChatCapture()
  .catch(() => undefined)
  .finally(() => {
    Promise.all([
      renderCurrentChat(),
      renderCapsules(),
      renderGeneratedCapsules(),
    ]).catch((error) => setStatus(error.message || "Failed to load UI", true));
  });
