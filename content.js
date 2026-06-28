(function () {
  const MESSAGE_SELECTOR = "[data-message-author-role]";
  const STORAGE_KEYS = [
    "capsules",
    "currentConversationId",
    "selectedConversationId",
    "aiCapsules",
  ];

  let lastConversationId = null;
  let lastSavedSignature = "";
  let saveTimer = null;

  function getConversationId() {
    const match = window.location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

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

  function normalizeStorage(result) {
    const capsules =
      result.capsules && typeof result.capsules === "object" && !Array.isArray(result.capsules)
        ? result.capsules
        : {};

    const currentConversationId =
      typeof result.currentConversationId === "string" && capsules[result.currentConversationId]
        ? result.currentConversationId
        : null;

    const selectedConversationId =
      typeof result.selectedConversationId === "string" && capsules[result.selectedConversationId]
        ? result.selectedConversationId
        : null;

    const aiCapsules =
      result.aiCapsules && typeof result.aiCapsules === "object" && !Array.isArray(result.aiCapsules)
        ? result.aiCapsules
        : {};

    const normalized = {
      capsules,
      currentConversationId,
      selectedConversationId,
      aiCapsules,
    };

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

    return { normalized, needsRepair };
  }

  function getMessages() {
    return [...document.querySelectorAll(MESSAGE_SELECTOR)]
      .map((element) => ({
        role: element.getAttribute("data-message-author-role") || "unknown",
        content: (element.innerText || element.textContent || "").trim(),
      }))
      .filter((message) => message.content);
  }

  function getSignature(conversationId, messages) {
    return JSON.stringify({
      conversationId,
      messages: messages.map((message) => [
        message.role,
        message.content,
      ]),
    });
  }

  function mergeMessages(messages, existingMessages = []) {
    const now = new Date().toISOString();

    return messages.map((message, index) => {
      const previous = existingMessages[index];

      return {
        role: message.role,
        content: message.content,
        timestamp:
          previous?.role === message.role && previous?.content === message.content
            ? previous.timestamp
            : now,
      };
    });
  }

  async function ensureStorageShape() {
    const { normalized, needsRepair } = normalizeStorage(
      await storageGet(STORAGE_KEYS),
    );

    if (needsRepair) {
      await storageSet(normalized);
    }

    return normalized;
  }

  async function saveMessages({ force = false } = {}) {
    const conversationId = getConversationId();

    if (!conversationId) {
      return false;
    }

    const messages = getMessages();

    if (messages.length === 0) {
      return false;
    }

    const signature = getSignature(conversationId, messages);

    if (!force && signature === lastSavedSignature) {
      return false;
    }

    const storage = await ensureStorageShape();
    const existing = storage.capsules[conversationId];
    const existingSignature = existing
      ? getSignature(conversationId, existing.messages || [])
      : "";

    if (signature === existingSignature) {
      lastSavedSignature = signature;
      const nextSelectedConversationId =
        storage.selectedConversationId && storage.capsules[storage.selectedConversationId]
          ? storage.selectedConversationId
          : conversationId;

      if (
        storage.currentConversationId !== conversationId ||
        storage.selectedConversationId !== nextSelectedConversationId
      ) {
        await storageSet({
          currentConversationId: conversationId,
          selectedConversationId: nextSelectedConversationId,
        });
      }
      return false;
    }

    storage.capsules[conversationId] = {
      id: conversationId,
      title: document.title || existing?.title || "Untitled Chat",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: mergeMessages(messages, existing?.messages),
    };

    await storageSet({
      capsules: storage.capsules,
      currentConversationId: conversationId,
      selectedConversationId:
        storage.selectedConversationId &&
        storage.capsules[storage.selectedConversationId]
          ? storage.selectedConversationId
          : conversationId,
      aiCapsules: storage.aiCapsules,
    });

    lastSavedSignature = signature;
    return true;
  }

  function scheduleSave(force = false) {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveMessages({ force }).catch((error) => {
        console.error("Memory Capsule failed to save conversation:", error);
      });
    }, 700);
  }

  function checkForChanges() {
    const conversationId = getConversationId();

    if (conversationId !== lastConversationId) {
      lastConversationId = conversationId;
      lastSavedSignature = "";
      scheduleSave(true);
      return;
    }

    const messages = getMessages();
    const signature = conversationId
      ? getSignature(conversationId, messages)
      : "";

    if (conversationId && messages.length > 0 && signature !== lastSavedSignature) {
      scheduleSave();
    }
  }

  function patchHistory(methodName) {
    const original = history[methodName];

    history[methodName] = function (...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event("memory-capsule-location-change"));
      return result;
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "MEMORY_CAPSULE_CAPTURE_NOW") {
      return false;
    }

    saveMessages({ force: true })
      .then((saved) => sendResponse({ ok: true, saved }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error.message || "Unable to save conversation",
        }),
      );

    return true;
  });

  patchHistory("pushState");
  patchHistory("replaceState");

  window.addEventListener("popstate", () => scheduleSave(true));
  window.addEventListener("memory-capsule-location-change", () => scheduleSave(true));

  const observer = new MutationObserver(checkForChanges);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.setInterval(checkForChanges, 2000);
  scheduleSave(true);
})();
