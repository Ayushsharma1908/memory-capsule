console.log("🚀 Memory Capsule Recorder Started");

let lastCount = 0;
let seenCountPerConversation = {};
let activeConversationId = null;

function getConversationId() {
  const path = window.location.pathname;

  if (!path.includes("/c/")) {
    return null;
  }

  return path.split("/c/")[1];
}

function isStableConversation() {
  const id = getConversationId();

  if (!id) return false;

  // lock conversation
  if (activeConversationId && activeConversationId !== id) {
    return false;
  }

  activeConversationId = id;
  return true;
}

function saveMessages() {
  const conversationId = getConversationId();

  if (!conversationId) {
    console.log("⚠️ No conversation detected");
    return;
  }

  const messageNodes = document.querySelectorAll("[data-message-author-role]");

  chrome.storage.local.get(["capsules"], (result) => {
    const capsules = result.capsules || {};

    const existing = capsules[conversationId];

    const existingMessages = existing?.messages || [];

    // Track how many messages we already saved for THIS chat
    const lastSavedIndex =
      seenCountPerConversation[conversationId] || existingMessages.length || 0;

    const newMessages = [];

    for (let i = lastSavedIndex; i < messageNodes.length; i++) {
      const el = messageNodes[i];

      newMessages.push({
        role: el.getAttribute("data-message-author-role"),
        content: el.innerText,
        timestamp: Date.now(),
      });
    }

    if (newMessages.length === 0) return;

    const updatedMessages = [...existingMessages, ...newMessages];

    // update tracker
    seenCountPerConversation[conversationId] = updatedMessages.length;

    capsules[conversationId] = {
      ...existing,
      title: document.title || "Untitled Chat",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: updatedMessages.length,
      messages: updatedMessages,
    };

    chrome.storage.local.set(
      {
        capsules,
        currentConversationId: conversationId,
      },
      () => {
        console.log(
          `💾 Saved ${newMessages.length} new messages for ${conversationId}`,
        );

        console.log(`📚 Total Capsules: ${Object.keys(capsules).length}`);
      },
    );
  });
}

function checkForChanges() {
  const conversationId = getConversationId();
  if (!conversationId) return;

  const currentCount = document.querySelectorAll(
    "[data-message-author-role]",
  ).length;

  // ignore unstable UI transitions
  if (currentCount < 2) return;

  if (currentCount !== lastCount) {
    lastCount = currentCount;

    // IMPORTANT: only save if stable
    if (!isStableConversation()) return;

    // extra safety delay (IMPORTANT)
    setTimeout(() => {
      saveMessages();
    }, 500);
  }
}
// Initial save when page loads
setTimeout(() => {
  checkForChanges();
}, 3000);

// Watch for new messages
const observer = new MutationObserver(() => {
  checkForChanges();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

console.log("📌 Conversation ID:", getConversationId());
