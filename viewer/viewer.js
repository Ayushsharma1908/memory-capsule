// ========================================================
// UTILS & HELPERS
// ========================================================

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

function calculateReadingTime(text) {
  if (!text || typeof text !== "string") return 1;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

function updateIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Safe light markdown parser.
 * Escapes HTML first to ensure zero XSS risk, then formats code blocks, bold, lists, etc.
 */
function renderMarkdown(text) {
  if (typeof text !== "string") return "";

  // Step 1: Escape HTML to ensure safety
  let safe = escapeHTML(text);

  // Step 2: Code blocks ```lang ... ```
  safe = safe.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang.trim() || "text";
    return `___CODE_BLOCK_BEGIN___${language}___LANG___${code.trim()}___CODE_BLOCK_END___`;
  });

  // Step 3: Inline code `code`
  safe = safe.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Step 4: Bold **text**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Step 5: Italic *text*
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Step 6: Lists
  safe = safe.replace(/^[•\-\*]\s+(.*)$/gm, '<li class="list-item">$1</li>');
  safe = safe.replace(/(<li class="list-item">.*<\/li>\n?)+/g, '<ul class="markdown-list">$&</ul>');

  // Step 7: Paragraphs & Line gaps
  const lines = safe.split(/\r?\n/);
  let codeBlockBuffer = null;
  const result = [];

  lines.forEach((line) => {
    if (line.includes("___CODE_BLOCK_BEGIN___")) {
      const parts = line.split("___CODE_BLOCK_BEGIN___")[1].split("___CODE_BLOCK_END___")[0];
      const [lang, code] = parts.split("___LANG___");
      result.push(`
        <div class="code-block">
          <div class="code-header">
            <span class="code-lang">${escapeHTML(lang || "code")}</span>
            <button class="copy-code-btn" aria-label="Copy code">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
          <pre><code class="language-${escapeHTML(lang)}">${code}</code></pre>
        </div>
      `);
    } else if (line.startsWith("<ul") || line.startsWith("<li") || line.startsWith("</ul")) {
      result.push(line);
    } else if (line.trim().length > 0) {
      result.push(`<p>${line}</p>`);
    }
  });

  return result.join("");
}

// ========================================================
// STATE & TOAST
// ========================================================

let toastTimeout = null;
let currentCapsule = null;
let activeRoleFilter = "all";
let activeSearchQuery = "";
let currentTheme = "light";

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
  }, isError ? 4000 : 2500);
}

// ========================================================
// STORAGE
// ========================================================

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

function storageSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function getCapsule(id) {
  const result = await storageGet(["aiCapsules"]);
  const aiCapsules = result.aiCapsules && typeof result.aiCapsules === "object" ? result.aiCapsules : {};
  return aiCapsules[id] || null;
}

// ========================================================
// THEME MANAGEMENT
// ========================================================

function applyTheme(theme) {
  currentTheme = theme || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  const themeIcon = document.getElementById("themeIcon");
  if (themeIcon) {
    themeIcon.setAttribute("data-lucide", currentTheme === "dark" ? "sun" : "moon");
    updateIcons();
  }
}

async function loadTheme() {
  try {
    const result = await storageGet(["theme"]);
    applyTheme(result.theme || "light");
  } catch (_) {
    applyTheme("light");
  }
}

async function toggleTheme() {
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  await storageSet({ theme: newTheme });
}

// ========================================================
// RENDERING CAPSULE
// ========================================================

function renderCapsule(capsule) {
  currentCapsule = capsule;

  document.getElementById("topics").innerHTML = "";
  document.getElementById("insights").innerHTML = "";
  document.getElementById("conversation").innerHTML = "";

  document.getElementById("title").textContent = capsule.title || "Untitled Memory Capsule";

  const summaryEl = document.getElementById("summary");
  if (capsule.summary) {
    summaryEl.textContent = capsule.summary;
    summaryEl.style.display = "block";
  } else {
    summaryEl.style.display = "none";
  }

  // Calculate total reading time across summary & conversation
  const fullContentText =
    (capsule.summary || "") +
    " " +
    (Array.isArray(capsule.conversation) ? capsule.conversation.map((m) => m.content || "").join(" ") : "");
  const readingTime = calculateReadingTime(fullContentText);

  // ---- Metadata Pills ----
  const metadataEl = document.getElementById("metadata");
  const msgCount =
    capsule.metadata?.messageCount ||
    (Array.isArray(capsule.conversation) ? capsule.conversation.length : 0);
  const updatedAt = capsule.updatedAt ? formatDateFull(capsule.updatedAt) : "";

  metadataEl.innerHTML = `
    <div class="meta-pill" title="Total messages">
      <i data-lucide="message-square"></i>
      <span>${msgCount} ${msgCount === 1 ? "message" : "messages"}</span>
    </div>
    <div class="meta-pill" title="Estimated reading time">
      <i data-lucide="clock"></i>
      <span>${readingTime} min read</span>
    </div>
    ${
      updatedAt
        ? `<div class="meta-pill" title="Last updated">
            <i data-lucide="calendar"></i>
            <span>${escapeHTML(updatedAt)}</span>
           </div>`
        : ""
    }
    ${
      capsule.keyTopics?.length
        ? `<div class="meta-pill" title="Topics identified">
            <i data-lucide="tag"></i>
            <span>${capsule.keyTopics.length} ${capsule.keyTopics.length === 1 ? "topic" : "topics"}</span>
           </div>`
        : ""
    }
  `;

  // ---- Bottom Bar & Topbar Nav visibility updates ----
  const barMsgCountEl = document.getElementById("barMsgCount");
  if (barMsgCountEl) barMsgCountEl.textContent = `${msgCount} msgs`;

  const barReadTimeEl = document.getElementById("barReadTime");
  if (barReadTimeEl) barReadTimeEl.textContent = `${readingTime} min`;

  const navTopics = document.getElementById("navTopics");
  if (navTopics) navTopics.style.display = capsule.keyTopics?.length ? "inline-flex" : "none";

  const navInsights = document.getElementById("navInsights");
  if (navInsights) navInsights.style.display = capsule.insights?.length ? "inline-flex" : "none";

  const navTimeline = document.getElementById("navTimeline");
  if (navTimeline) navTimeline.style.display = capsule.conversation?.length ? "inline-flex" : "none";

  setTimeout(updateNavIndicator, 50);

  // ---- Copy Capsule Button ----
  const copySummaryBtn = document.getElementById("copySummaryBtn");
  if (copySummaryBtn) copySummaryBtn.style.display = "inline-flex";
  const handleCopySummary = async () => {
    try {
      const summaryText = `Title: ${capsule.title}\n\nSummary:\n${capsule.summary || ""}\n\nKey Topics: ${(capsule.keyTopics || []).join(", ")}`;
      await navigator.clipboard.writeText(summaryText);
      setStatus("Copied Capsule summary!");
    } catch (e) {
      setStatus("Failed to copy capsule", true);
    }
  };
  if (copySummaryBtn) copySummaryBtn.onclick = handleCopySummary;

  const bottomCopyBtn = document.getElementById("bottomCopyBtn");
  if (bottomCopyBtn) bottomCopyBtn.onclick = handleCopySummary;

  // ---- Export Download Button ----
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) downloadBtn.style.display = "inline-flex";
  const handleExportJSON = () => {
    try {
      const safeName = capsule.title
        ? capsule.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
        : "capsule_export";
      const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capsule-${safeName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Exported JSON file successfully");
    } catch (error) {
      setStatus(error.message, true);
    }
  };
  if (downloadBtn) downloadBtn.onclick = handleExportJSON;

  const bottomExportBtn = document.getElementById("bottomExportBtn");
  if (bottomExportBtn) bottomExportBtn.onclick = handleExportJSON;

  // ---- Key Topics ----
  if (Array.isArray(capsule.keyTopics) && capsule.keyTopics.length > 0) {
    document.getElementById("topicsSection").style.display = "flex";
    const topicsContainer = document.getElementById("topics");

    capsule.keyTopics.forEach((topic) => {
      const el = document.createElement("button");
      el.className = "topic";
      el.innerHTML = `<i data-lucide="tag"></i> <span>${escapeHTML(topic)}</span>`;
      el.title = `Click to filter conversation by '${topic}'`;
      el.onclick = () => {
        const searchInput = document.getElementById("chatSearchInput");
        if (searchInput) {
          searchInput.value = topic;
          activeSearchQuery = topic.toLowerCase();
          document.getElementById("clearChatSearch").style.display = "grid";
          filterAndRenderFeed();
          document.getElementById("conversationSection").scrollIntoView({ behavior: "smooth" });
        }
      };
      topicsContainer.appendChild(el);
    });
  }

  // ---- Key Insights ----
  if (Array.isArray(capsule.insights) && capsule.insights.length > 0) {
    document.getElementById("insightsSection").style.display = "flex";
    const insightsContainer = document.getElementById("insights");

    capsule.insights.forEach((insight) => {
      const el = document.createElement("div");
      el.className = "insight";
      el.innerHTML = `
        <div class="insight-icon"><i data-lucide="lightbulb"></i></div>
        <div class="insight-text">${escapeHTML(insight)}</div>
      `;
      insightsContainer.appendChild(el);
    });
  }

  // ---- Conversation Timeline ----
  if (Array.isArray(capsule.conversation) && capsule.conversation.length > 0) {
    document.getElementById("conversationSection").style.display = "flex";
    filterAndRenderFeed();
  }

  updateIcons();
}

// ========================================================
// CONVERSATION FEED FILTERING & RENDERING
// ========================================================

function filterAndRenderFeed() {
  if (!currentCapsule || !Array.isArray(currentCapsule.conversation)) return;

  const feedContainer = document.getElementById("conversation");
  const noResultsEl = document.getElementById("noResults");
  feedContainer.innerHTML = "";

  const filtered = currentCapsule.conversation.filter((msg) => {
    if (!msg || typeof msg.content !== "string") return false;

    // Filter by role
    if (activeRoleFilter !== "all") {
      const role = msg.role === "user" ? "user" : "assistant";
      if (role !== activeRoleFilter) return false;
    }

    // Filter by search query
    if (activeSearchQuery) {
      return msg.content.toLowerCase().includes(activeSearchQuery);
    }

    return true;
  });

  // Update count badge
  document.getElementById("messageCountBadge").textContent = filtered.length;

  if (filtered.length === 0) {
    noResultsEl.style.display = "flex";
    updateIcons();
    return;
  }

  noResultsEl.style.display = "none";

  // Timeline spine line
  const spineLine = document.createElement("div");
  spineLine.className = "timeline-line";
  feedContainer.appendChild(spineLine);

  filtered.forEach((msg, index) => {
    const isUser = msg.role === "user";
    const authorName = isUser ? "You" : "ChatGPT";
    const avatarContent = isUser
      ? `<i data-lucide="user"></i>`
      : `<i data-lucide="sparkles"></i>`;

    const formattedBody = renderMarkdown(msg.content);

    // Timeline item wrapper
    const item = document.createElement("div");
    item.className = `timeline-item ${isUser ? "user" : "assistant"}`;
    item.style.animationDelay = `${index * 25}ms`;

    // Node marker
    const node = document.createElement("div");
    node.className = "timeline-node";
    item.appendChild(node);

    // Message card
    const card = document.createElement("div");
    card.className = `message-card ${isUser ? "user" : "assistant"}`;
    card.innerHTML = `
      <div class="message-header">
        <div class="message-author">
          <div class="avatar ${isUser ? "user-avatar" : "assistant-avatar"}">
            ${avatarContent}
          </div>
          <span class="author-name">${authorName}</span>
        </div>
        <button class="copy-msg-btn" title="Copy message text" aria-label="Copy message">
          <i data-lucide="copy"></i> Copy
        </button>
      </div>
      <div class="message-body">${formattedBody}</div>
    `;

    card.querySelector(".copy-msg-btn").onclick = async () => {
      try {
        await navigator.clipboard.writeText(msg.content);
        setStatus("Message copied to clipboard");
      } catch (_) {
        setStatus("Failed to copy", true);
      }
    };

    item.appendChild(card);
    feedContainer.appendChild(item);
  });

  updateIcons();
}

// ========================================================
// CODE COPY DELEGATION
// ========================================================

document.addEventListener("click", async (e) => {
  const copyCodeBtn = e.target.closest(".copy-code-btn");
  if (!copyCodeBtn) return;

  const codeBlock = copyCodeBtn.closest(".code-block");
  if (!codeBlock) return;

  const codeText = codeBlock.querySelector("code")?.textContent || "";
  try {
    await navigator.clipboard.writeText(codeText);
    copyCodeBtn.innerHTML = `<i data-lucide="check"></i> Copied`;
    setStatus("Code copied to clipboard");
    updateIcons();
    setTimeout(() => {
      copyCodeBtn.innerHTML = `<i data-lucide="copy"></i> Copy`;
      updateIcons();
    }, 2000);
  } catch (_) {
    setStatus("Failed to copy code", true);
  }
});

// ========================================================
// NAV INDICATOR (Arc-style sliding pill)
// ========================================================

function updateNavIndicator() {
  const nav = document.getElementById("topbarNav");
  const indicator = document.getElementById("navIndicator");
  if (!nav || !indicator) return;

  const activeItem = nav.querySelector(".nav-item.active");
  if (!activeItem) {
    indicator.style.width = "0px";
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();

  indicator.style.width = `${itemRect.width}px`;
  indicator.style.transform = `translateX(${itemRect.left - navRect.left - 3}px)`;
}

// ========================================================
// EVENT LISTENERS & INITIALIZATION
// ========================================================

document.addEventListener("DOMContentLoaded", async () => {
  await loadTheme();

  // Theme toggle button
  document.getElementById("themeToggleBtn")?.addEventListener("click", toggleTheme);

  // Search input handling
  const searchInput = document.getElementById("chatSearchInput");
  const clearBtn = document.getElementById("clearChatSearch");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeSearchQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = activeSearchQuery ? "grid" : "none";
      filterAndRenderFeed();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      activeSearchQuery = "";
      clearBtn.style.display = "none";
      filterAndRenderFeed();
    });
  }

  // Filter pills handling
  const filterPills = document.querySelectorAll(".filter-pill");
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeRoleFilter = pill.getAttribute("data-role") || "all";
      filterAndRenderFeed();
    });
  });

  // Section navigation pills handling with indicator update
  const navItems = document.querySelectorAll(".nav-item[data-target]");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Progress bar updater
  const progressBar = document.getElementById("progressBar");
  function updateProgressBar() {
    if (!progressBar) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(scrolled, 100)}%`;
  }

  // Scroll spy for topbar section pills
  function updateScrollSpy() {
    const sections = [
      { id: "heroHeader" },
      { id: "topicsSection" },
      { id: "insightsSection" },
      { id: "conversationSection" },
    ];

    const scrollPosition = window.scrollY + 100;
    let activeTarget = "heroHeader";

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el && el.style.display !== "none") {
        const top = el.offsetTop;
        if (scrollPosition >= top) {
          activeTarget = id;
        }
      }
    });

    let changed = false;
    navItems.forEach((item) => {
      const isActive = item.getAttribute("data-target") === activeTarget;
      if (isActive && !item.classList.contains("active")) {
        item.classList.add("active");
        changed = true;
      } else if (!isActive && item.classList.contains("active")) {
        item.classList.remove("active");
        changed = true;
      }
    });

    if (changed) updateNavIndicator();
  }

  // Merge all scroll events into single rAF-throttled handler
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgressBar();
        updateScrollSpy();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Bottom bar scroll to top
  const bottomScrollTopBtn = document.getElementById("bottomScrollTop");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  bottomScrollTopBtn?.addEventListener("click", scrollToTop);

  // Initial indicator placement after fonts load
  setTimeout(updateNavIndicator, 100);
  window.addEventListener("resize", updateNavIndicator, { passive: true });

  // Load Capsule by Query Param
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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.theme) {
    applyTheme(changes.theme.newValue);
  }
});