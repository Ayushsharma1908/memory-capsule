function renderCapsules() {
  chrome.storage.local.get(["capsules"], (result) => {
    const capsules = result.capsules || {};

    const container =
      document.getElementById("capsuleList");

    container.innerHTML = "";

    const entries =
      Object.entries(capsules);

    if (entries.length === 0) {
      container.innerHTML =
        "<p>No capsules found</p>";
      return;
    }

    entries.forEach(([id, capsule]) => {
      const div =
        document.createElement("div");

      div.className = "capsule";

      div.innerHTML = `
        <div class="title">
          ${capsule.title || "Untitled"}
        </div>

        <div class="meta">
          ${capsule.messageCount || 0}
          messages
        </div>
      `;

      div.addEventListener(
        "click",
        () => {
          console.log(capsule);

          alert(
            `Title: ${
              capsule.title
            }\nMessages: ${
              capsule.messageCount
            }`
          );
        }
      );

      container.appendChild(div);
    });
  });
}

document
  .getElementById("exportBtn")
  .addEventListener("click", () => {

    chrome.storage.local.get(
      [
        "capsules",
        "currentConversationId"
      ],
      (result) => {

        const capsules =
          result.capsules || {};

        const conversationId =
          result.currentConversationId;

        console.log(
          "Current ID:",
          conversationId
        );

        if (!conversationId) {
          alert(
            "No active chat found.\n\nOpen a ChatGPT conversation and send at least one message."
          );
          return;
        }

        const capsule =
          capsules[conversationId];

        if (!capsule) {
          alert(
            "Capsule not found."
          );
          return;
        }

        const blob = new Blob(
          [
            JSON.stringify(
              capsule,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement("a");

        a.href = url;

        a.download =
          `capsule-${conversationId}.json`;

        a.click();

        URL.revokeObjectURL(url);

        console.log(
          "📦 Exported current chat"
        );
      }
    );

  });

renderCapsules();