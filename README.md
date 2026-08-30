# 🧠 AI Memory Capsule

AI Memory Capsule is a Chrome Extension that automatically records ChatGPT conversations and transforms them into structured AI-generated memory capsules using a secure backend API with Google's Gemini 2.5 Flash API.

Instead of saving raw chat logs, the extension extracts meaningful knowledge, key topics, insights, and learning outcomes from conversations.

---

## ✨ Features

### 📌 Automatic Conversation Capture

- Detects ChatGPT conversations automatically
- Stores messages locally using Chrome Storage
- Tracks conversation metadata

### 🤖 Secure AI-Powered Capsule Generation

- Gemini 2.5 Flash API integration hosted behind a secure Express backend
- API key is never exposed to the Chrome Extension or client-side code
- Generates:
  - Title
  - Summary
  - Key Topics
  - Insights

### 💾 Memory Capsule Export

- Export capsules as JSON files
- Preserve conversation history and metadata
- Download capsules for future retrieval

---

## 📂 Architecture

```text
Chrome Extension ──(POST /api/ai/generate-capsule)──> Backend Server (Express/TypeScript) ──> Gemini 2.5 Flash API
```

- **Chrome Extension**: Scrapes and manages conversation state locally, delegates capsule generation to the secure backend.
- **Backend API (`memory-capsule-backend`)**: Validates requests, rate-limits endpoints, and handles Gemini API calls securely using server environment variables.

---

## ⚙️ Installation & Setup

### 1. Backend Setup (`memory-capsule-backend`)

Navigate to the backend directory:

```bash
cd memory-capsule-backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example`:

```env
PORT=5000
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Start the backend in development mode:

```bash
npm run dev
```

### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked** and select the `memory-capsule` directory
4. Verify backend configuration in `ai/config.js`:
   ```js
   export const API_BASE_URL = "http://localhost:5000";
   ```

---

## 🔒 Security

- **Zero API Key Leakage**: Gemini API key exists exclusively on the server.
- **Request Validation**: Incoming payloads are strictly validated using Zod.
- **Rate Limiting**: Endpoint protection prevents API abuse.
- **Local Storage**: All conversation data remains strictly in your local Chrome browser storage.

---

## 🛠 Tech Stack

- **Extension**: JavaScript (ES6 Modules), Chrome Extension Manifest V3, HTML5, CSS3
- **Backend**: Node.js, Express, TypeScript, Zod, CORS, Express-Rate-Limit
- **AI Model**: Google Gemini 2.5 Flash API