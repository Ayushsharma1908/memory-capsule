const fs = require('fs');
let js = fs.readFileSync('popup/popup.js', 'utf8');

// Fix renderCurrentChat
js = js.replace(
  /<div class="card-title-row">[\s\S]*?<div class="card-title">\$\{escapeHTML\(capsule\.title \|\| "Untitled Chat"\)\}<\/div>[\s\S]*?\$\{[\s\S]*?\}[\s\S]*?<span class="current-badge">Current<\/span>[\s\S]*?<\/div>/,
  `<div class="card-title-row">
      <div class="card-title">\${escapeHTML(capsule.title || "Untitled Chat")}</div>
      <span class="current-badge">Current</span>
    </div>`
);

// Add to renderCapsules
js = js.replace(
  /<div class="card-title">\$\{escapeHTML\(capsule\.title \|\| "Untitled Chat"\)\}<\/div>\s*<div class="card-meta">/,
  `<div class="card-title">\${escapeHTML(capsule.title || "Untitled Chat")}</div>
          \${(() => {
            const preview = capsule.summary || (Array.isArray(capsule.messages) && capsule.messages.length > 0 ? (capsule.messages[capsule.messages.length - 1].content || capsule.messages[capsule.messages.length - 1].text || "") : "");
            return preview ? \`<div class="card-preview">\${escapeHTML(preview)}</div>\` : '';
          })()}
          <div class="card-meta">`
);

fs.writeFileSync('popup/popup.js', js);
console.log("Fixed preview location");
