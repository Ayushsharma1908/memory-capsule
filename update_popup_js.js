const fs = require('fs');
let js = fs.readFileSync('popup/popup.js', 'utf8');

// 1. Remove Export from Current Chat
js = js.replace(
  /<button id="exportCurrentChat" class="secondary-button">\s*<i data-lucide="download"><\/i> Export\s*<\/button>/g,
  ''
);

js = js.replace(
  /document\.getElementById\("exportCurrentChat"\)\.addEventListener\("click", async \(e\) => \{[\s\S]*?\}\);\s*/g,
  ''
);

// 2. Add Search functionality
// Add searchQuery state
js = js.replace(
  /let currentTheme = "light";/,
  `let currentTheme = "light";
let searchQuery = "";`
);

// 3. Update renderCapsules (Recent Chats)
js = js.replace(
  /const entries = sortByUpdatedAt\(Object\.entries\(storage\.capsules\)\);/,
  `let entries = sortByUpdatedAt(Object.entries(storage.capsules));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    entries = entries.filter(([id, c]) => {
      const messagesStr = Array.isArray(c.messages) ? c.messages.map(m => m.content || m.text || "").join(" ") : "";
      const text = (c.title || "") + " " + (c.summary || "") + " " + messagesStr;
      return text.toLowerCase().includes(q);
    });
  }`
);

// Add preview and remove chevron for Recent Chats
js = js.replace(
  /<div class="card-title">\$\{escapeHTML\(capsule\.title \|\| "Untitled Chat"\)\}<\/div>/,
  `<div class="card-title">\${escapeHTML(capsule.title || "Untitled Chat")}</div>
          \${(() => {
            const preview = capsule.summary || (Array.isArray(capsule.messages) && capsule.messages.length > 0 ? (capsule.messages[capsule.messages.length - 1].content || capsule.messages[capsule.messages.length - 1].text || "") : "");
            return preview ? \`<div class="card-preview">\${escapeHTML(preview)}</div>\` : '';
          })()}`
);

js = js.replace(
  /<span class="card-chevron"><i data-lucide="chevron-right"><\/i><\/span>/,
  ''
);

// 4. Update renderGeneratedCapsules
js = js.replace(
  /const entries = sortByUpdatedAt\(Object\.entries\(storage\.aiCapsules\)\);/,
  `let entries = sortByUpdatedAt(Object.entries(storage.aiCapsules));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    entries = entries.filter(([id, c]) => {
      const convStr = Array.isArray(c.conversation) ? c.conversation.map(m => m.content || m.text || "").join(" ") : "";
      const text = (c.title || "") + " " + (c.summary || "") + " " + (c.keyTopics || []).join(" ") + " " + convStr;
      return text.toLowerCase().includes(q);
    });
  }`
);

js = js.replace(
  /<span class="card-chevron"><i data-lucide="chevron-right"><\/i><\/span>/,
  ''
);

// 5. Add Event Listener for Search in Initialization section
js = js.replace(
  /updateIcons\(\);[\s]*\/\/ Load theme first/,
  `updateIcons();

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    
    const currentChatSection = document.getElementById("currentChatSection");
    if (searchQuery) {
      currentChatSection.style.display = "none";
    } else {
      currentChatSection.style.display = "block";
    }
    
    renderCapsules();
    renderGeneratedCapsules();
  });
}

// Load theme first`
);

fs.writeFileSync('popup/popup.js', js);
console.log("Updated popup.js");
