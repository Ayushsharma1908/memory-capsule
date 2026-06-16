console.log("🚀 Memory Capsule Recorder Started");

let lastSnapshot = 0;
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

    const messages = [...messageNodes].map((el) => ({
      role: el.getAttribute("data-message-author-role"),
      content: el.innerText,
      timestamp: Date.now(),
    }));

    const existing = capsules[conversationId];

    capsules[conversationId] = {
      ...existing,

      title: document.title || "Untitled Chat",

      createdAt: existing?.createdAt || new Date().toISOString(),

      updatedAt: new Date().toISOString(),

      messageCount: messages.length,

      messages,
    };

    chrome.storage.local.set(
      {
        capsules,
        currentConversationId: conversationId,
      },
      () => {
        console.log(
          `💾 Saved ${messages.length} new messages for ${conversationId}`,
        );

        console.log(`📚 Total Capsules: ${Object.keys(capsules).length}`);
      },
    );
  });
}

function checkForChanges() {

  const messages = [
    ...document.querySelectorAll(
      "[data-message-author-role]"
    )
  ];

  const snapshot =
    messages
      .map(el => el.innerText)
      .join("||");

  if (snapshot !== lastSnapshot) {

    lastSnapshot = snapshot;

    if (!isStableConversation())
      return;

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
