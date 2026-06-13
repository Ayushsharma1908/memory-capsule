console.log("🚀 Memory Capsule Recorder Started");

let lastCount = 0;

function getConversationId() {
  const path = window.location.pathname;

  if (!path.includes("/c/")) {
    return null;
  }

  return path.split("/c/")[1];
}

function saveMessages() {
  const conversationId = getConversationId();

  if (!conversationId) {
    console.log("⚠️ No conversation detected");
    return;
  }

  const messages = [
    ...document.querySelectorAll(
      "[data-message-author-role]"
    )
  ].map((el) => ({
    role: el.getAttribute(
      "data-message-author-role"
    ),
    content: el.innerText,
    timestamp: Date.now()
  }));

  const title =
    document.title || "Untitled Chat";

  chrome.storage.local.get(
    ["capsules"],
    (result) => {
      const capsules =
        result.capsules || {};

      capsules[conversationId] = {
        ...capsules[conversationId],

        title,

        createdAt:
          capsules[conversationId]?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),

        messageCount:
          messages.length,

        messages
      };

      chrome.storage.local.set(
        { capsules },
        () => {
          console.log(
            `💾 Saved ${messages.length} messages for ${conversationId}`
          );

          console.log(
            `📚 Total Capsules: ${
              Object.keys(capsules).length
            }`
          );
        }
      );
    }
  );
}

function checkForChanges() {
  const currentCount =
    document.querySelectorAll(
      "[data-message-author-role]"
    ).length;

  if (currentCount !== lastCount) {
    lastCount = currentCount;
    saveMessages();
  }
}

// Initial save when page loads
setTimeout(() => {
  checkForChanges();
}, 3000);

// Watch for new messages
const observer =
  new MutationObserver(() => {
    checkForChanges();
  });

observer.observe(
  document.body,
  {
    childList: true,
    subtree: true
  }
);

console.log(
  "📌 Conversation ID:",
  getConversationId()
);