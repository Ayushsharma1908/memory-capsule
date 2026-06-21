import { GEMINI_API_KEY }
from "./config.js";

export async function generateAICapsule(conversationText) {

const prompt = `
You are an AI Memory Capsule Generator.

Your job is NOT to summarize every message.

Your task:

1. Identify what the user was trying to learn.
2. Identify what the user achieved.
3. Extract the most important topics.
4. Generate memorable insights.

Return ONLY valid JSON:

{
  "title":"",
  "summary":"",
  "keyTopics":[],
  "insights":[]
}

Rules:

- Focus on user intent.
- Ignore greetings.
- Ignore filler conversation.
- Group related questions together.
- Keep summary under 100 words.
- Maximum 10 keyTopics.
- Maximum 5 insights.
- Title should be short and meaningful.
- Do NOT explain every assistant response.

Conversation:

${conversationText}
`;

  const response =
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

  const data =
    await response.json();

  console.log(
    "Gemini Response:",
    data
  );

  const text =
    data.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text;

  if (!text) {
    throw new Error(
      "No response from Gemini"
    );
  }

  const cleanJson =
    text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

  return JSON.parse(
    cleanJson
  );
}