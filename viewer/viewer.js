document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const capsuleId = urlParams.get('id');

  if (!capsuleId) {
    document.getElementById('title').textContent = 'Error: No Capsule ID provided';
    return;
  }

  try {
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['aiCapsules'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result.aiCapsules || {});
        }
      });
    });

    const capsule = data[capsuleId];

    if (!capsule) {
      document.getElementById('title').textContent = 'Error: Capsule not found';
      return;
    }

    renderCapsule(capsule);
  } catch (error) {
    document.getElementById('title').textContent = 'Error loading capsule';
    console.error(error);
  }
});

function renderCapsule(capsule) {
  // Header
  document.getElementById('title').textContent = capsule.title || 'Untitled Capsule';
  document.getElementById('summary').textContent = capsule.summary || 'No summary available.';
  
  // Metadata
  const metadataEl = document.getElementById('metadata');
  const msgCount = capsule.metadata?.messageCount || (capsule.conversation ? capsule.conversation.length : 0);
  const updatedAt = capsule.updatedAt ? new Date(capsule.updatedAt).toLocaleString() : 'Unknown date';
  metadataEl.innerHTML = `
    <span>${msgCount} messages</span>
    <span>Updated: ${updatedAt}</span>
  `;

  // Download Button
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.style.display = 'block';
  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capsule-${capsule.title ? capsule.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Topics
  if (capsule.keyTopics && capsule.keyTopics.length > 0) {
    document.getElementById('topicsCard').style.display = 'block';
    const topicsContainer = document.getElementById('topics');
    capsule.keyTopics.forEach(topic => {
      const el = document.createElement('div');
      el.className = 'topic';
      el.textContent = topic;
      topicsContainer.appendChild(el);
    });
  }

  // Insights
  if (capsule.insights && capsule.insights.length > 0) {
    document.getElementById('insightsCard').style.display = 'block';
    const insightsContainer = document.getElementById('insights');
    capsule.insights.forEach(insight => {
      const el = document.createElement('div');
      el.className = 'insight';
      el.textContent = insight;
      insightsContainer.appendChild(el);
    });
  }

  // Conversation
  if (capsule.conversation && capsule.conversation.length > 0) {
    document.getElementById('conversationCard').style.display = 'block';
    const conversationContainer = document.getElementById('conversation');
    
    capsule.conversation.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `message ${msg.role === 'user' ? 'user' : 'assistant'}`;
      
      const roleEl = document.createElement('div');
      roleEl.className = 'role';
      roleEl.textContent = msg.role;
      
      const contentEl = document.createElement('div');
      contentEl.className = 'content';
      contentEl.textContent = msg.content;
      
      msgEl.appendChild(roleEl);
      msgEl.appendChild(contentEl);
      conversationContainer.appendChild(msgEl);
    });
  }
}
