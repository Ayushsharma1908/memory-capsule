import { API_BASE_URL } from "./config.js";

export async function generateAICapsule(conversation) {
  let payload;

  if (Array.isArray(conversation)) {
    payload = { conversation };
  } else if (typeof conversation === "string") {
    // Wrap formatted string text into message payload if string passed
    payload = {
      conversation: [
        { role: "user", content: conversation }
      ]
    };
  } else {
    throw new Error("Invalid conversation payload");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ai/generate-capsule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (_err) {
    throw new Error("Unable to connect to Memory Capsule server. Please ensure the backend server is running.");
  }

  let data;
  try {
    data = await response.json();
  } catch (_error) {
    throw new Error("Unable to read response from server.");
  }

  if (!response.ok) {
    const message = data?.error || `Capsule generation failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
