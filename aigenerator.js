import { GEMINI_API_KEY } from "./config.js";

export async function generateAICapsule(conversationText) {

const prompt = `
You are an AI Memory Capsule Generator.

Create a reusable memory capsule from this conversation.

Your goal is to capture what the user learned, discovered, decided, or achieved.

Return ONLY valid JSON:

{
  "title": "",
  "summary": "",
  "keyTopics": [],
  "insights": []
}

Instructions:

- Focus on the user's learning journey.
- Combine related questions into one topic.
- Ignore greetings, filler messages, and repeated explanations.
- Do NOT summarize every assistant response.
- Extract the core knowledge gained.
- Summary must be less than 80 words.
- keyTopics maximum 8 items.
- insights maximum 5 items.
- Make insights actionable and memorable.
- Title should represent the overall learning outcome.

Conversation:

${conversationText}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  const data = await response.json();

  console.log("Gemini Response:", data);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  const cleanJson = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanJson);
}
