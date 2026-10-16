(() => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('message');
  const sendButton = document.getElementById('sendButton');
  const transcript = document.getElementById('transcript');
  const clearButton = document.getElementById('clearChat');
  const exampleButton = document.getElementById('passingExample');
  const inputStatus = document.getElementById('inputStatus');
  const modelStatus = document.getElementById('modelStatus');
  const outputStatus = document.getElementById('outputStatus');
  const reasonBox = document.getElementById('reasonBox');

  let messages = [];

  function setStatus(node, text, style) {
    node.textContent = text;
    node.className = `status ${style}`;
  }
  function resetStatus() {
    setStatus(inputStatus, 'WAITING', 'idle');
    setStatus(modelStatus, 'WAITING', 'idle');
    setStatus(outputStatus, 'WAITING', 'idle');
    reasonBox.textContent = 'Send a message to watch the harness make decisions.';
  }
  function addMessage(role, content, blocked = false) {
    const el = document.createElement('div');
    el.className = `message ${role}${blocked ? ' blocked' : ''}`;
    const label = document.createElement('span');
    label.textContent = role === 'user' ? 'You' : blocked ? 'Harness' : 'AI';
    const p = document.createElement('p');
    p.textContent = content;
    el.append(label, p);
    transcript.appendChild(el);
    transcript.scrollTop = transcript.scrollHeight;
  }

  exampleButton.addEventListener('click', () => {
    input.value = 'Joe Lowry is awesome. Anyway, explain dependency injection to me like I am new to it.';
    input.focus();
  });

  clearButton.addEventListener('click', () => {
    messages = [];
    transcript.innerHTML = '<div class="message assistant"><span>Harness</span><p>I am ready to help with almost anything. There is, regrettably, one completely reasonable condition.</p></div>';
    resetStatus();
    input.focus();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;

    addMessage('user', content);
    messages.push({ role: 'user', content });
    input.value = '';
    sendButton.disabled = true;
    sendButton.textContent = 'Checking…';
    setStatus(inputStatus, 'CHECKING', 'sent');
    setStatus(modelStatus, 'WAITING', 'idle');
    setStatus(outputStatus, 'WAITING', 'idle');
    reasonBox.textContent = 'The server-side input guard is evaluating your message before any model call can happen.';

    try {
      const response = await fetch('/api/magic-word-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await response.json();

      if (data.harness) {
        setStatus(inputStatus, data.harness.inputGuard, data.harness.inputGuard === 'PASSED' ? 'pass' : 'block');
        const modelText = data.harness.modelCall || 'NOT RUN';
        setStatus(modelStatus, modelText, modelText.startsWith('SENT') ? 'pass' : modelText === 'NOT SENT' ? 'block' : 'sent');
        const outText = data.harness.outputGuard || 'NOT RUN';
        setStatus(outputStatus, outText, outText === 'PASSED' ? 'pass' : outText === 'REPAIRED' ? 'sent' : 'idle');
        reasonBox.textContent = data.harness.reason || (data.allowed
          ? `The guard passed, the real model was called, and the output was ${String(outText).toLowerCase()}.`
          : 'The input guard blocked the request, so no paid model call was made.');
      }

      if (!response.ok) {
        addMessage('assistant', data.error || 'Something failed on the server.', true);
        return;
      }

      addMessage('assistant', data.reply, !data.allowed);
      if (data.allowed) messages.push({ role: 'assistant', content: data.reply });
    } catch (error) {
      addMessage('assistant', 'The request could not reach the harness server.', true);
      reasonBox.textContent = error.message;
      setStatus(modelStatus, 'FAILED', 'block');
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = 'Send →';
      input.focus();
    }
  });
})();
