
function escapeHTML(str) {
  if (typeof str !== "string") return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateFull(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function updateIcons() {
  if (window.lucide) window.lucide.createIcons();
}


let toastTimeout = null;

function setStatus(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message || "";

  if (!message) {
    toast.className = "toast";
    return;
  }

  toast.className = isError ? "toast show error" : "toast show";

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = "toast";
  }, isError ? 5000 : 3000);
}

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

async function getCapsule(id) {
  const result = await storageGet(["aiCapsules"]);
  const aiCapsules = result.aiCapsules && typeof result.aiCapsules === "object" ? result.aiCapsules : {};
  return aiCapsules[id] || null;
}


function renderCapsule(capsule) {
  document.getElementById("topics").innerHTML = "";
  document.getElementById("insights").innerHTML = "";
  document.getElementById("conversation").innerHTML = "";
  document.getElementById("title").textContent = capsule.title || "Untitled Capsule";

  const summaryEl = document.getElementById("summary");
  if (capsule.summary) {
    summaryEl.textContent = capsule.summary;
  } else {
    summaryEl.style.display = "none";
  }

  // ---- Metadata ----
  const metadataEl = document.getElementById("metadata");
  const msgCount =
    capsule.metadata?.messageCount ||
    (Array.isArray(capsule.conversation) ? capsule.conversation.length : 0);
  const updatedAt = capsule.updatedAt ? formatDateFull(capsule.updatedAt) : "";

  metadataEl.innerHTML = `
    <div class="meta-pill">
        <i data-lucide="message-square"></i>
        <span>${msgCount} ${msgCount === 1 ? "message" : "messages"}</span>
    </div>
    ${updatedAt
      ? `
    <div class="meta-pill">
        <i data-lucide="clock"></i>
        <span>${escapeHTML(updatedAt)}</span>
    </div>`
      : ""
    }
    ${capsule.keyTopics?.length
      ? `
    <div class="meta-pill">
        <i data-lucide="tag"></i>
        <span>${capsule.keyTopics.length} ${capsule.keyTopics.length === 1 ? "topic" : "topics"}</span>
    </div>`
      : ""
    }
`;

  // ---- Download Button ----
  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.style.display = "inline-flex";
  downloadBtn.onclick = () => {
    try {
      const safeName = capsule.title
        ? capsule.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
        : "export";
      const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capsule-${safeName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded");
    } catch (error) {
      setStatus(error.message, true);
    }
  };

  // ---- Topics ----
  if (Array.isArray(capsule.keyTopics) && capsule.keyTopics.length > 0) {
    document.getElementById("topicsSection").style.display = "";
    const topicsContainer = document.getElementById("topics");

    capsule.keyTopics.forEach((topic, index) => {
      const el = document.createElement("div");
      el.className = "topic";
      el.textContent = topic;
      el.style.animationDelay = `${index * 40}ms`;
      topicsContainer.appendChild(el);
    });
  }

  // ---- Insights ----
  if (Array.isArray(capsule.insights) && capsule.insights.length > 0) {
    document.getElementById("insightsSection").style.display = "";
    const insightsContainer = document.getElementById("insights");

    capsule.insights.forEach((insight, index) => {
      const el = document.createElement("div");
      el.className = "insight";
      el.textContent = insight;
      el.style.animationDelay = `${index * 60}ms`;
      insightsContainer.appendChild(el);
    });
  }

  // ---- Conversation ----
  if (Array.isArray(capsule.conversation) && capsule.conversation.length > 0) {
    document.getElementById("conversationSection").style.display = "";
    const conversationContainer = document.getElementById("conversation");

    capsule.conversation.forEach((msg, index) => {
      if (!msg || typeof msg.content !== "string") return;

      const msgEl = document.createElement("div");
      msgEl.className = `message ${msg.role === "user" ? "user" : "assistant"}`;
      msgEl.style.animationDelay = `${index * 30}ms`;

      const roleEl = document.createElement("div");
      roleEl.className = "role";
      roleEl.textContent =
        msg.role === "user"
          ?
          "You"
          :
          "ChatGPT";
      const contentEl = document.createElement("div");
      contentEl.className = "content";
      contentEl.textContent = msg.content;

      msgEl.appendChild(roleEl);
      msgEl.appendChild(contentEl);
      conversationContainer.appendChild(msgEl);
    });
  }

  updateIcons();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme || "light");
}

async function loadTheme() {
  try {
    const result = await storageGet(["theme"]);
    applyTheme(result.theme || "light");
  } catch (_) {
    applyTheme("light");
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.theme) {
    applyTheme(changes.theme.newValue);
  }
});


document.addEventListener("DOMContentLoaded", async () => {
  // Load theme first for instant appearance
  await loadTheme();

  const urlParams = new URLSearchParams(window.location.search);
  const capsuleId = urlParams.get("id");

  if (!capsuleId) {
    document.getElementById("title").textContent = "No capsule specified";
    document.getElementById("summary").textContent = "A valid capsule ID is required to view this page.";
    return;
  }

  try {
    const capsule = await getCapsule(capsuleId);

    if (!capsule) {
      document.getElementById("title").textContent = "Capsule not found";
      document.getElementById("summary").textContent = "This capsule may have been deleted or the link is invalid.";
      return;
    }

    renderCapsule(capsule);
  } catch (error) {
    document.getElementById("title").textContent = "Error loading capsule";
    document.getElementById("summary").textContent = error.message || "An unexpected error occurred.";
    console.error(error);
  }
});