# 🧠 Memory Capsule

Capture meaningful ChatGPT conversations and transform them into AI-powered memory capsules containing summaries, key topics, and actionable insights.

## 🌐 Links

- **Website:** [https://memory-capsule-web.vercel.app/](https://memory-capsule-web.vercel.app/)
- **Backend Repository:** [https://github.com/Ayushsharma1908/memory-capsule-backend](https://github.com/Ayushsharma1908/memory-capsule-backend)
- **Latest Release:** [https://github.com/Ayushsharma1908/memory-capsule/releases/latest](https://github.com/Ayushsharma1908/memory-capsule/releases/latest)

## 📖 Overview

Memory Capsule is a Chrome extension designed to help users preserve valuable knowledge from their ChatGPT conversations.

The extension captures conversations and allows users to generate AI-powered capsules that organize important information into:

- 📝 Concise summaries
- 🏷️ Key topics
- 💡 Actionable insights
- 🧠 Meaningful learning outcomes

Instead of manually revisiting long conversations, users can transform them into structured and reusable knowledge.

## ✨ Features

- 💬 Capture ChatGPT conversations
- 📚 View recent conversations
- 🤖 Generate AI-powered Memory Capsules
- 📝 Create concise conversation summaries
- 🏷️ Extract key topics
- 💡 Generate actionable insights
- 👀 View conversations in a dedicated interface
- 🔒 Keep the Gemini API key outside the Chrome extension

## 🏗️ Architecture

```text
┌───────────────────────────────┐
│         ChatGPT Website       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│    Memory Capsule Extension   │
│                               │
│  • Capture Conversations      │
│  • Store Conversation Data    │
│  • Generate AI Capsules       │
└───────────────┬───────────────┘
                │
                │ HTTPS Request
                ▼
┌───────────────────────────────┐
│       Backend API             │
│       Express + TypeScript    │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│           Gemini AI           │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│      Generated Memory Capsule │
│                               │
│  • Title                      │
│  • Summary                    │
│  • Key Topics                 │
│  • Insights                   │
└───────────────────────────────┘
```

## 🚀 Installation

### 1. Download the Latest Release

Download the latest ZIP file from:
[https://github.com/Ayushsharma1908/memory-capsule/releases](https://github.com/Ayushsharma1908/memory-capsule/releases)

### 2. Extract the ZIP File

After extraction, the folder structure should contain:

```text
memory-capsule/
├── manifest.json
├── ai/
├── assets/
├── content/
├── popup/
└── viewer/
```

The selected extension folder must contain `manifest.json` in its root directory.

### 3. Open Chrome Extensions

Open the following URL in Google Chrome:

`chrome://extensions`

### 4. Enable Developer Mode

Enable Developer mode from the top-right corner.

### 5. Load the Extension

Click **Load unpacked** and select the extracted `memory-capsule` folder.

🎉 Memory Capsule is now installed.

## 🧠 How It Works

```text
ChatGPT Conversation
        │
        ▼
Conversation Captured
        │
        ▼
Stored Locally
        │
        ▼
Generate AI Capsule
        │
        ▼
Memory Capsule Backend
        │
        ▼
Gemini AI
        │
        ▼
Structured Knowledge
```

The generated AI capsule may contain:

```json
{
  "title": "Learning Outcome",
  "summary": "A concise summary of the conversation.",
  "keyTopics": [
    "Topic 1",
    "Topic 2"
  ],
  "insights": [
    "Important insight 1",
    "Important insight 2"
  ]
}
```

## 🛠️ Tech Stack

### Chrome Extension
- JavaScript
- HTML
- CSS
- Chrome Extension Manifest V3
- Chrome Storage API

### Backend
- Node.js
- Express.js
- TypeScript
- Gemini API
- CORS
- Rate Limiting

### Website
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## 📂 Project Structure

```text
memory-capsule/
│
├── manifest.json
├── README.md
│
├── ai/
│   ├── aigenerator.js
│   ├── capsulegenerator.js
│   ├── config.example.js
│   └── config.js
│
├── assets/
│   ├── icon-48.png
│   ├── icon-128.png
│   └── lucide.min.js
│
├── content/
│   └── content.js
│
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
└── viewer/
    ├── viewer.html
    ├── viewer.css
    └── viewer.js
```

## 🔐 Security

The Gemini API key is not stored inside the Chrome extension.

The extension communicates with a backend API:

```text
Chrome Extension
       │
       ▼
Backend API
       │
       ▼
Gemini AI
```

This architecture prevents sensitive AI credentials from being directly exposed in the client-side extension code.

## 🌐 Related Projects

- **Backend API:** The backend handles AI capsule generation and securely communicates with Gemini.  
  🔗 [https://github.com/Ayushsharma1908/memory-capsule-backend](https://github.com/Ayushsharma1908/memory-capsule-backend)

- **Official Website:** Learn more about Memory Capsule and explore its documentation.  
  🌐 [https://memory-capsule-web.vercel.app/](https://memory-capsule-web.vercel.app/)

## 🗺️ Roadmap

- [x] Capture ChatGPT conversations
- [x] Store recent conversations
- [x] Generate AI-powered summaries
- [x] Extract key topics
- [x] Generate actionable insights
- [x] Deploy backend API
- [x] Deploy official website
- [x] Create downloadable extension release
- [ ] Chrome Web Store release
- [ ] Advanced conversation search
- [ ] Conversation categorization
- [ ] Cloud synchronization
- [ ] User accounts
- [ ] Cross-device access
- [ ] Support for additional AI platforms

## 🤝 Contributing

Contributions, feature requests, and improvements are welcome.

1. Fork this repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit your changes: `git commit -m "Add your feature"`
5. Push your branch: `git push origin feature/your-feature`
6. Open a Pull Request

## 📜 License

This project is currently intended for educational, personal, and portfolio purposes.

## 👨‍💻 Author

**Ayush Kumar Sharma**  
GitHub: [https://github.com/Ayushsharma1908](https://github.com/Ayushsharma1908)

---

⭐ If you find Memory Capsule useful, consider giving this repository a star!