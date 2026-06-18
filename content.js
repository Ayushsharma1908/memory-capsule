console.log("🚀 Memory Capsule Recorder Started");

let lastSnapshot = "";

function getConversationId() {
  const path = window.location.pathname;

  if (!path.includes("/c/")) {
    return null;
  }

  return path.split("/c/")[1];
}

function saveMessages() {
  const conversationId = getConversationId();

  if (!conversationId) return;

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

  chrome.storage.local.get(
    ["capsules"],
    (result) => {

      const capsules =
        result.capsules || {};

      const existing =
        capsules[conversationId];

      capsules[conversationId] = {
        title:
          document.title ||
          "Untitled Chat",

        createdAt:
          existing?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),

        messageCount:
          messages.length,

        messages
      };

      chrome.storage.local.set({
        capsules,
        currentConversationId:
          conversationId
      });

      console.log(
        `💾 Saved ${messages.length} messages`
      );
    }
  );
}

function checkForChanges() {

  const snapshot =
    [...document.querySelectorAll(
      "[data-message-author-role]"
    )]
      .map(el => el.innerText)
      .join("||");

  if (snapshot !== lastSnapshot) {

    lastSnapshot = snapshot;

    setTimeout(() => {
      saveMessages();
    }, 1000);
  }
}

setTimeout(
  checkForChanges,
  3000
);

const observer =
  new MutationObserver(
    checkForChanges
  );

observer.observe(
  document.body,
  {
    childList: true,
    subtree: true,
    characterData: true
  }
);

console.log(
  "📌 Conversation ID:",
  getConversationId()
);