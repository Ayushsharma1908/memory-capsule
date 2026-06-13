console.log("🚀 Memory Capsule Recorder Started");

let lastCount = 0;

function saveMessages() {

  const messages =
    [...document.querySelectorAll('[data-message-author-role]')]
      .map(el => ({
        role: el.getAttribute('data-message-author-role'),
        content: el.innerText,
        timestamp: Date.now()
      }));

  if (messages.length === 0) return;

  chrome.storage.local.set({
    memoryCapsule: messages
  });

  console.log(
    `💾 Saved ${messages.length} messages`
  );
}

setInterval(() => {

  const count =
    document.querySelectorAll(
      '[data-message-author-role]'
    ).length;

  if (count > lastCount) {

    console.log(
      `🆕 New messages detected: ${count}`
    );

    saveMessages();

    lastCount = count;
  }

}, 2000);