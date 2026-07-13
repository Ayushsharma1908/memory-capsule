import { generateCapsule } from "./capsulegenerator.js";
import { generateAICapsule } from "./aigenerator.js";

const STORAGE_KEYS = [
  "capsules",
  "currentConversationId",
  "selectedConversationId",
  "aiCapsules",
];

const capsuleList = document.getElementById("capsuleList");
const generatedCapsules = document.getElementById("generatedCapsules");

const statusElement = document.getElementById("status");
let visibleChats = 3;
let visibleCapsules = 3;
function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

function storageSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function setStatus(message, isError = false) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message || "";
  statusElement.className = isError ? "error" : "";
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

async function getStorage() {
  const result = await storageGet(STORAGE_KEYS);
  const capsules = normalizeRecord(result.capsules);
  const aiCapsules = normalizeRecord(result.aiCapsules);
  const selectedConversationId =
    typeof result.selectedConversationId === "string" &&
    capsules[result.selectedConversationId]
      ? result.selectedConversationId
      : null;
  const currentConversationId =
    typeof result.currentConversationId === "string" &&
    capsules[result.currentConversationId]
      ? result.currentConversationId
      : null;
  const needsRepair =
    !result.capsules ||
    typeof result.capsules !== "object" ||
    Array.isArray(result.capsules) ||
    !Object.prototype.hasOwnProperty.call(result, "currentConversationId") ||
    result.currentConversationId !== currentConversationId ||
    !Object.prototype.hasOwnProperty.call(result, "selectedConversationId") ||
    result.selectedConversationId !== selectedConversationId ||
    !result.aiCapsules ||
    typeof result.aiCapsules !== "object" ||
    Array.isArray(result.aiCapsules);

  if (needsRepair) {
    await storageSet({
      capsules,
      currentConversationId,
      selectedConversationId,
      aiCapsules,
    });
  }

  return {
    capsules,
    currentConversationId,
    selectedConversationId,
    aiCapsules,
  };
}

function sortByUpdatedAt(entries) {
  return entries.sort(([, first], [, second]) => {
    const firstTime = Date.parse(first?.updatedAt || first?.createdAt || 0);
    const secondTime = Date.parse(second?.updatedAt || second?.createdAt || 0);
    return secondTime - firstTime;
  });
}

function downloadJson(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

async function requestActiveChatCapture() {
  if (!chrome.tabs?.query || !chrome.tabs?.sendMessage) {
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || !tab.url?.startsWith("https://chatgpt.com/")) {
      return;
    }

    await chrome.tabs.sendMessage(tab.id, {
      type: "MEMORY_CAPSULE_CAPTURE_NOW",
    });
  } catch (_error) {
    // The content script may not be present on non-ChatGPT pages.
  }
}

async function renderCurrentChat() {
  const storage = await getStorage();

  const currentId =
    storage.currentConversationId || storage.selectedConversationId;

  const container = document.getElementById("currentChat");

  container.innerHTML = "";

  if (!currentId) {
    container.innerHTML = "<p>No active chat.</p>";
    return;
  }

  const capsule = storage.capsules[currentId];

  if (!capsule) {
    container.innerHTML = "<p>No active chat.</p>";
    return;
  }

  const card = document.createElement("div");

  card.className = "capsule";

  card.innerHTML = `
    <div class="title">
      ${capsule.title}
    </div>

    <div class="meta">
      ${capsule.messageCount} messages
    </div>

    <button id="generateCurrentCapsule">
      Generate Capsule
    </button>
  `;

  container.appendChild(card);

  const button = document.getElementById("generateCurrentCapsule");

  button.addEventListener("click", async () => {
    try {
      button.disabled = true;

      setStatus("Generating Capsule...");

      await generateSelectedAICapsule();

      setStatus("Capsule Generated!");
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

async function renderCapsules() {
  const storage = await getStorage();
  const entries = sortByUpdatedAt(Object.entries(storage.capsules));

  capsuleList.textContent = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No capsules found";
    capsuleList.appendChild(empty);
    return;
  }

  const recentChats = entries
    .filter(([id]) => id !== storage.currentConversationId)
    .slice(0, visibleChats);

  for (const [id, capsule] of recentChats) {
    const item = document.createElement("button");
    const title = document.createElement("span");
    const meta = document.createElement("span");
    const updatedAt = capsule.updatedAt
      ? new Date(capsule.updatedAt).toLocaleString()
      : "Not dated";

    item.type = "button";
    item.className =
      id === storage.selectedConversationId ? "capsule selected" : "capsule";

    title.className = "title";
    title.textContent = capsule.title || "Untitled Chat";

    meta.className = "meta";
    meta.textContent = `${capsule.messageCount || 0} messages - ${updatedAt}`;

    item.append(title, meta);
    item.addEventListener("click", async () => {
      const tab = await chrome.tabs.create({
        url: `https://chatgpt.com/c/${id}`,
      });
    });

    capsuleList.appendChild(item);
  }
}

async function renderGeneratedCapsules() {
  const storage = await getStorage();
  const entries = sortByUpdatedAt(Object.entries(storage.aiCapsules));

  generatedCapsules.textContent = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No generated capsules";
    generatedCapsules.appendChild(empty);
    return;
  }

  for (const [id, capsule] of entries.slice(0, visibleCapsules)) {
    const item = document.createElement("div");
    const title = document.createElement("div");
    const meta = document.createElement("div");

    item.className = "capsule";
    item.dataset.conversationId = id;

    title.className = "title";
    title.textContent = capsule.title || "Untitled Capsule";

    meta.className = "meta";
    meta.textContent = `${capsule.keyTopics?.length || 0} topics`;

    item.append(title, meta);
    item.addEventListener("click", () => {
      chrome.tabs.create({
        url: `viewer.html?id=${id}`,
      });
    });
    generatedCapsules.appendChild(item);
  }
}

async function exportSelectedConversation() {
  const storage = await getStorage();
  const conversationId = storage.currentConversationId;

  if (!conversationId) {
    throw new Error("Select a chat before exporting.");
  }

  const capsule = storage.capsules[conversationId];

  if (!capsule) {
    throw new Error("Selected conversation was not found in storage.");
  }

  if (!Array.isArray(capsule.messages) || capsule.messages.length === 0) {
    throw new Error("Selected conversation has no messages to export.");
  }

  downloadJson("memory-capsule-export.json", generateCapsule(capsule));
}

async function generateSelectedAICapsule() {
  const storage = await getStorage();
  const conversationId = storage.currentConversationId;
  if (!conversationId) {
    throw new Error("Select a chat before generating a capsule.");
  }

  const capsule = storage.capsules[conversationId];

  if (!capsule) {
    throw new Error("Selected conversation was not found in storage.");
  }

  const messages = Array.isArray(capsule.messages) ? capsule.messages : [];
  const conversationText = messages
    .filter((message) => message.content && message.content.trim())
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");

  if (!conversationText) {
    throw new Error("Selected conversation has no messages to send to Gemini.");
  }

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
  downloadJson("memory-capsule.json", generatedCapsule);
  await renderGeneratedCapsules();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (
    changes.capsules ||
    changes.selectedConversationId ||
    changes.currentConversationId
  ) {
    renderCurrentChat().catch((error) => setStatus(error.message, true));

    renderCapsules().catch((error) => setStatus(error.message, true));
  }

  if (changes.aiCapsules) {
    renderGeneratedCapsules().catch((error) => setStatus(error.message, true));
  }
});

requestActiveChatCapture()
  .catch(() => undefined)
  .finally(() =>
    Promise.all([
      renderCapsules(),
      renderGeneratedCapsules(),
      renderCurrentChat(),
    ]).catch((error) =>
      setStatus(error.message || "Unable to load capsules.", true),
    ),
  );
document
  .getElementById("seeMoreChats")
  .addEventListener("click", async () => {

    visibleChats += 5;

    await renderCapsules();

  });

document
  .getElementById("seeMoreCapsules")
  .addEventListener("click", async () => {

    visibleCapsules += 5;

    await renderGeneratedCapsules();

  });