export async function generateAICapsule(messages) {

  const prompt = `
You are a memory capsule generator.

Analyze this conversation.

Return ONLY JSON:

{
  "title":"",
  "summary":"",
  "keyTopics":[],
  "insights":[]
}

Conversation:

${messages}
`;

  const response =
    await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY",
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

  return data;
}