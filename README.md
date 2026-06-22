# 🧠 AI Memory Capsule

AI Memory Capsule is a Chrome Extension that automatically records ChatGPT conversations and transforms them into structured AI-generated memory capsules using Google's Gemini API.

Instead of saving raw chat logs, the extension extracts meaningful knowledge, key topics, insights, and learning outcomes from conversations.

---

## ✨ Features

### 📌 Automatic Conversation Capture

- Detects ChatGPT conversations automatically
- Stores messages locally using Chrome Storage
- Tracks conversation metadata

### 🤖 AI-Powered Capsule Generation

- Uses Gemini 2.5 Flash
- Generates:
  - Title
  - Summary
  - Key Topics
  - Insights

### 💾 Memory Capsule Export

- Export capsules as JSON files
- Preserve conversation history and metadata
- Download capsules for future retrieval

### 🧠 Knowledge Extraction

Rather than summarizing every message, the extension focuses on:

- What the user learned
- Important concepts discussed
- Actionable insights
- Learning outcomes

---

## 📂 Project Structure

```text
memory-capsule/
│
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
│
├── content.js
│
├── aigenerator.js
├── capsulegenerator.js
├── config.js
│
└── assets/
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/memory-capsule.git
cd memory-capsule
```

### 2. Open Chrome Extensions

Navigate to:

```text
chrome://extensions
```

Enable **Developer Mode**.

### 3. Load Extension

Click **Load Unpacked** and select the project folder.

---

## 🔑 Gemini API Setup

Create a file named:

```js
config.js
```

Add:

```js
export const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

Get your API key from:

https://aistudio.google.com

> ⚠️ Never commit your API key to GitHub.

---

## 🚀 Usage

1. Open ChatGPT
2. Start a conversation
3. The extension automatically records messages
4. Open the extension popup
5. Select a conversation
6. Click **Generate Capsule**
7. The extension:
   - Sends conversation to Gemini
   - Generates AI Memory Capsule
   - Saves capsule locally
   - Downloads JSON file

---

## 📄 Example Output

```json
{
  "title": "Learning GitHub Basics",
  "summary": "The user learned GitHub fundamentals, repository creation, and collaboration workflows.",

  "keyTopics": [
    "GitHub",
    "Repositories",
    "Git Commands",
    "Version Control"
  ],

  "insights": [
    "Repositories store project history.",
    "Git tracks code changes using commits.",
    "Collaboration happens through pull requests."
  ]
}
```

---

## 🔒 Privacy

- All conversations are stored locally
- No external database is used
- Only selected conversations are sent to Gemini
- User data is never shared with third parties

---

## 🛠 Tech Stack

- JavaScript
- Chrome Extension API
- Chrome Storage API
- Gemini 2.5 Flash API
- HTML
- CSS

---

## 🎯 Future Roadmap

- Capsule Search
- Semantic Memory Retrieval
- Export to PDF
- Export to Markdown
- Memory Graph Visualization
- RAG-Based Recall System
- Personalized Knowledge Base

---

## 👨‍💻 Author

**Ayush Kumar**

Built to transform conversations into reusable knowledge.