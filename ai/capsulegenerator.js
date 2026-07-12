export function generateCapsule(capsule) {

  const messages = capsule.messages || [];

  const userMessages =
    messages.filter(
      m => m.role === "user"
    );

  const assistantMessages =
    messages.filter(
      m => m.role === "assistant"
    );

  return {

    capsuleVersion: "1.0",

    title:
      capsule.title || "Untitled Chat",

    createdAt:
      capsule.createdAt,

    updatedAt:
      capsule.updatedAt,

    totalMessages:
      messages.length,

    participants: {
      user: userMessages.length,
      assistant:
        assistantMessages.length
    },

    summary:
      generateSummary(messages),

    keyTopics:
      extractTopics(messages),

    conversation:
      messages

  };
}

function generateSummary(messages) {

  const userMessages =
    messages.filter(
      m => m.role === "user"
    );

  const firstQuestion =
    userMessages[0]?.content || "";

  if (firstQuestion.length <= 250)
    return firstQuestion;

  return (
    firstQuestion.slice(0, 250) +
    "..."
  );
}

function extractTopics(messages) {

  const stopWords = new Set([
    "the",
    "is",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "for",
    "with",
    "on",
    "at",
    "it",
    "this",
    "that",
    "from",
    "are",
    "was",
    "were",
    "will",
    "can",
    "you",
    "your",
    "have",
    "has",
    "had",
    "about",
    "into",
    "they",
    "them",
    "their",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "how",
    "hello",
    "thanks",
    "thank",
    "please"
  ]);

  const text =
    messages
      .map(m => m.content)
      .join(" ")
      .toLowerCase();

  const words =
    text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/);

  const frequency = {};

  words.forEach(word => {

    if (
      word.length < 4 ||
      stopWords.has(word)
    ) {
      return;
    }

    frequency[word] =
      (frequency[word] || 0) + 1;

  });

  return Object.entries(
    frequency
  )
    .sort(
      (a, b) => b[1] - a[1]
    )
    .slice(0, 10)
    .map(
      ([word]) => word
    );
}