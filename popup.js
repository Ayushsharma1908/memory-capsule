import { generateCapsule } from "./capsulegenerator.js";
import { generateAICapsule } from "./aigenerator.js";

function renderCapsules() {
  chrome.storage.local.get(["capsules"], (result) => {
    const capsules = result.capsules || {};

    const container = document.getElementById("capsuleList");

    container.innerHTML = "";

    const entries = Object.entries(capsules);

    if (entries.length === 0) {
      container.innerHTML = "<p>No capsules found</p>";
      return;
    }

    entries.forEach(([id, capsule]) => {
      const div = document.createElement("div");

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
          selectedConversationId: id,
        });

        alert(`Selected:\n${capsule.title}`);
      });

      container.appendChild(div);
    });
  });
}

// Capsule Generation
document
  .getElementById("generateCapsuleBtn")
  .addEventListener("click", async () => {
    const result = await chrome.storage.local.get([
      "capsules",
      "selectedConversationId",
    ]);

    const conversationId = result.selectedConversationId;

    if (!conversationId) {
      alert("Select a chat first");
      return;
    }

    const capsule = result.capsules?.[conversationId];

    if (!capsule) {
      alert("Capsule not found");
      return;
    }

    const conversationText = capsule.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    let generatedCapsule;

    try {
      const aiCapsule = await generateAICapsule(conversationText);

      generatedCapsule = {
        ...aiCapsule,

        metadata: {
          createdAt: capsule.createdAt,

          updatedAt: capsule.updatedAt,

          messageCount: capsule.messageCount,
        },

        conversation: capsule.messages,
      };

      const storage = await chrome.storage.local.get("aiCapsules");

      const aiCapsules = storage.aiCapsules || {};

      aiCapsules[conversationId] = generatedCapsule;

      await chrome.storage.local.set({
        aiCapsules,
      });

      console.log("AI Capsule:", generatedCapsule);
    } catch (error) {
      console.error(error);

      alert("Gemini Error:\n" + error.message);

      return;
    }
    console.log("AI Capsule:", generatedCapsule);

    const blob = new Blob([JSON.stringify(generatedCapsule, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "memory-capsule.json";

    a.click();

    URL.revokeObjectURL(url);
    await renderGeneratedCapsules();

    alert("AI Capsule Generated 🚀");
  });

async function renderGeneratedCapsules() {
  const result = await chrome.storage.local.get("aiCapsules");

  const capsules = result.aiCapsules || {};

  const container = document.getElementById("generatedCapsules");

  container.innerHTML = "";

  Object.entries(capsules).forEach(([id, capsule]) => {
    const div = document.createElement("div");

    div.className = "capsule";

    div.innerHTML = `
        <div class="title">
          ${capsule.title}
        </div>

        <div class="meta">
          ${capsule.keyTopics.length || 0}
          topics
        </div>
      `;

    container.appendChild(div);
  });
}

renderCapsules();
renderGeneratedCapsules();
