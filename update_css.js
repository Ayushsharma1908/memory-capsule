const fs = require('fs');
let css = fs.readFileSync('popup/popup.css', 'utf8');

css = css.replace(
  /\.app-header \{[\s\S]*?\}/,
  `.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  flex-shrink: 0;
}`
);

css = css.replace(
  /\.app-brand \{[\s\S]*?\}/,
  `.app-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}`
);

css = css.replace(
  /\.app-logo \{[\s\S]*?\}/,
  `.app-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  /* subtle ring to ground the logo */
  box-shadow: 0 0 0 1px var(--line-light);
}`
);

css = css.replace(
  /\.app-title \{[\s\S]*?\}/,
  `.app-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ink);
}`
);

css = css.replace(
  /\.app-subtitle \{[\s\S]*?\}/,
  `.app-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  margin: 0;
  line-height: 1.3;
}`
);

css = css.replace(
  /\.btn-icon:hover \{[\s\S]*?\}/,
  `.btn-icon:hover {
  background: var(--line-light);
  color: var(--ink);
}`
);

css = css.replace(
  /\.section \+ \.section \{[\s\S]*?\}/,
  `.section + .section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}`
);

css = css.replace(
  /\[data-theme="dark"\] \.section \+ \.section \{[\s\S]*?\}/,
  `[data-theme="dark"] .section + .section {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}`
);
if (!css.includes('[data-theme="dark"] .section + .section')) {
  css = css.replace(
    /\.section\+\.section \{[\s\S]*?\}/,
    `.section+.section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
[data-theme="dark"] .section+.section {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}`
  );
}

css = css.replace(
  /\.capsule-card \{[\s\S]*?\}/,
  `.capsule-card {
  background: var(--card);
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid var(--line-light);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 200ms var(--ease),
    box-shadow 200ms var(--ease),
    border-color 200ms var(--ease);
}`
);

css = css.replace(
  /\.capsule-card:hover \{[\s\S]*?\}/,
  `.capsule-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--beige-hover);
}`
);

css = css.replace(
  /\.capsule-card\+\.capsule-card \{[\s\S]*?\}/,
  `.capsule-card+.capsule-card {
  margin-top: 14px;
}`
);

css = css.replace(
  /\.current-chat-card \{[\s\S]*?\}/,
  `.current-chat-card {
  cursor: default;
  background: var(--card-active);
  border: 1px solid var(--line);
  border-left: 3px solid var(--beige);
  box-shadow: var(--shadow-xs);
  /* compensate for thicker left border to keep inner content aligned */
  padding: 12px 16px 12px 13px;
}`
);

css = css.replace(
  /\.current-badge \{[\s\S]*?\}/,
  `.current-badge {
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  background: var(--beige-muted);
  padding: 2px 6px;
  border-radius: var(--r-badge);
  flex-shrink: 0;
}`
);

css = css.replace(
  /\.primary-button,[\s]*\.secondary-button \{[\s\S]*?\}/,
  `.primary-button,
.secondary-button {
  flex: 1;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 12px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: background 200ms var(--ease),
    border-color 200ms var(--ease),
    box-shadow 200ms var(--ease),
    opacity 200ms var(--ease);
}`
);

css = css.replace(
  /\.primary-button svg,[\s]*\.secondary-button svg \{[\s\S]*?\}/,
  `.primary-button svg,
.secondary-button svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.75;
}`
);

css = css.replace(
  /\.card-title \{[\s\S]*?\}/,
  `.card-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1.35;
  /* truncate long titles */
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}`
);

css = css.replace(
  /\.card-meta \{[\s\S]*?\}/,
  `.card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  color: var(--ink);
  opacity: 0.7;
  line-height: 1;
}`
);

css = css.replace(
  /\.section-label \{[\s\S]*?\}/,
  `.section-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-3);
  margin-bottom: 12px;
  padding-left: 2px;
}`
);

css += `
/* ── Search ───────────────────────────────────────────────── */
.search-container {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  color: var(--ink-3);
  stroke-width: 1.75;
}
.search-input {
  width: 100%;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--card);
  padding: 0 14px 0 38px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease);
}
.search-input:focus {
  outline: none;
  border-color: var(--beige);
  box-shadow: 0 0 0 2px var(--beige-wash);
}
.search-input::placeholder {
  color: var(--ink-3);
}
.card-preview {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  margin-top: 2px;
}
`;

fs.writeFileSync('popup/popup.css', css);
console.log("Updated CSS");
