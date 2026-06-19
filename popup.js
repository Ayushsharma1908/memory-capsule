import { generateCapsule } from "./capsulegenerator.js";

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
          ${capsule.title || "Untitled Chat"}
        </div>

        <div class="meta">
          ${capsule.messageCount || 0} messages
        </div>
      `;

      div.addEventListener("click", () => {

        chrome.storage.local.set({
          selectedConversationId: id
        });

        alert(
          `Selected:\n${capsule.title}`
        );

      });

      container.appendChild(div);

    });

  });
}

/*
==================================
GENERATE CAPSULE BUTTON
==================================
*/

document
  .getElementById("generateCapsuleBtn")
  .addEventListener("click", async () => {

    const result =
      await chrome.storage.local.get([
        "capsules",
        "selectedConversationId"
      ]);

    const conversationId =
      result.selectedConversationId;

    if (!conversationId) {
      alert("Select a chat first");
      return;
    }

    const capsule =
      result.capsules?.[conversationId];

    if (!capsule) {
      alert("Capsule not found");
      return;
    }

    // Generate AI Capsule
    const generatedCapsule =
      generateCapsule(capsule);

    console.log(
      "Generated Capsule:",
      generatedCapsule
    );

    // Download it
    const blob = new Blob(
      [
        JSON.stringify(
          generatedCapsule,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `${generatedCapsule.title}-capsule.json`;

    a.click();

    URL.revokeObjectURL(url);

    alert("Capsule Generated 🚀");

  });

renderCapsules();