(() => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('message');
  const sendButton = document.getElementById('sendButton');
  const transcript = document.getElementById('transcript');
  const clearButton = document.getElementById('clearChat');
  const exampleButton = document.getElementById('passingExample');
  const liveExampleButton = document.getElementById('liveExample');
  const deterministicStatus = document.getElementById('deterministicStatus');
  const semanticStatus = document.getElementById('semanticStatus');
  const modelStatus = document.getElementById('modelStatus');
  const webStatus = document.getElementById('webStatus');
  const outputStatus = document.getElementById('outputStatus');
  const reasonBox = document.getElementById('reasonBox');
  const semanticStep = document.getElementById('semanticStep');
  const modeDescription = document.getElementById('modeDescription');
  const modeHint = document.getElementById('modeHint');
  const lessonTitle = document.getElementById('lessonTitle');
  const lessonCopy = document.getElementById('lessonCopy');
  const deterministicLabel = document.getElementById('deterministicLabel');
  const deterministicCopy = document.getElementById('deterministicCopy');
  const flowV2 = document.getElementById('flowV2');
  const flowV3 = document.getElementById('flowV3');
  const flowCopy = document.getElementById('flowCopy');
  const modelName = document.getElementById('modelName');
  const responseId = document.getElementById('responseId');
  const webUsed = document.getElementById('webUsed');
  const remainingCalls = document.getElementById('remainingCalls');
  const modeButtons = [...document.querySelectorAll('.mode-button')];

  let messages = [];
  let mode = 'v2';

  function setStatus(node, text, style) {
    node.textContent = text;
    node.className = `status ${style}`;
  }

  function resetStatus() {
    setStatus(deterministicStatus, 'WAITING', 'idle');
    setStatus(semanticStatus, mode === 'v3' ? 'WAITING' : 'NOT USED', 'idle');
    setStatus(modelStatus, 'WAITING', 'idle');
    setStatus(webStatus, 'WAITING', 'idle');
    setStatus(outputStatus, 'WAITING', 'idle');
    modelName.textContent = '—';
    responseId.textContent = '—';
    webUsed.textContent = '—';
    remainingCalls.textContent = '—';
    reasonBox.textContent = 'Send a message to watch the harness make decisions.';
  }

  function renderMode() {
    const isV3 = mode === 'v3';
    modeButtons.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    semanticStep.classList.toggle('muted-step', !isV3);
    flowV2.classList.toggle('hidden', isV3);
    flowV3.classList.toggle('hidden', !isV3);

    if (isV3) {
      modeDescription.textContent = 'V3 keeps a cheap pre-filter, then asks an AI classifier whether the compliment is genuinely positive and directed at Joe.';
      modeHint.textContent = 'V3 challenge: try subtle praise such as “I have to hand it to Joe, that was a clever solution.”';
      deterministicLabel.textContent = 'Cheap deterministic pre-filter';
      deterministicCopy.textContent = 'Only checks whether Joe is mentioned before spending a classifier call.';
      lessonTitle.textContent = 'V3 lesson';
      lessonCopy.textContent = 'AI can judge meaning that would require an ever-growing pile of rules—but now the guard itself has latency, cost, and model behavior to manage.';
      flowCopy.textContent = 'V3 can spend one model call on the semantic guard and a second on the actual answer. Obvious no-Joe messages are still rejected for free.';
    } else {
      modeDescription.textContent = 'V2 uses ordinary deterministic code to decide whether the compliment counts.';
      modeHint.textContent = 'V2 hint: “Joe is great. Anyway…” works because “great” is in the deterministic rules.';
      deterministicLabel.textContent = 'Deterministic input guard';
      deterministicCopy.textContent = 'V2 decides the compliment entirely with ordinary code.';
      lessonTitle.textContent = 'V2 lesson';
      lessonCopy.textContent = 'Deterministic rules are cheap, fast, predictable, and surprisingly useful—but they only understand the cases you explicitly taught them.';
      flowCopy.textContent = 'V2 uses no AI to judge the input. A rejected message costs no model call.';
    }
    resetStatus();
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

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      renderMode();
    });
  });

  liveExampleButton.addEventListener('click', () => {
    input.value = mode === 'v3'
      ? 'I have to hand it to Joe, that was a clever solution. What is the weather forecast for Des Moines tomorrow?'
      : 'Joe is great. What is the weather forecast for Des Moines tomorrow?';
    input.focus();
  });

  exampleButton.addEventListener('click', () => {
    input.value = mode === 'v3'
      ? 'I have to hand it to Joe, that was a clever solution. Anyway, explain dependency injection to me like I am new to it.'
      : 'Joe is great. Anyway, explain dependency injection to me like I am new to it.';
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
    setStatus(deterministicStatus, 'CHECKING', 'sent');
    setStatus(semanticStatus, mode === 'v3' ? 'WAITING' : 'NOT USED', 'idle');
    setStatus(modelStatus, 'WAITING', 'idle');
    setStatus(webStatus, 'WAITING', 'idle');
    setStatus(outputStatus, 'WAITING', 'idle');
    reasonBox.textContent = mode === 'v3'
      ? 'The cheap pre-filter runs first. If Joe is mentioned, an AI classifier will judge whether the praise is genuine.'
      : 'V2 deterministic code is evaluating the message. No AI is used for this decision.';

    try {
      const response = await fetch('/api/magic-word-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages, mode })
      });
      const data = await response.json();

      if (data.harness) {
        const deterministicText = data.harness.deterministicGuard || data.harness.inputGuard || 'UNKNOWN';
        setStatus(
          deterministicStatus,
          deterministicText,
          deterministicText.includes('PASS') ? 'pass' : deterministicText.includes('BLOCK') ? 'block' : 'sent'
        );

        const semanticText = data.harness.semanticGuard || (mode === 'v3' ? 'UNKNOWN' : 'NOT USED');
        setStatus(
          semanticStatus,
          semanticText,
          semanticText === 'PASSED' ? 'pass' : semanticText === 'BLOCKED' || semanticText === 'NOT SENT' ? 'block' : 'idle'
        );

        const modelText = data.harness.modelCall || 'NOT RUN';
        setStatus(modelStatus, modelText, modelText.startsWith('SENT') ? 'pass' : modelText === 'NOT SENT' ? 'block' : 'sent');

        const webText = data.harness.webSearch || 'NOT USED';
        setStatus(webStatus, webText, webText === 'USED' ? 'pass' : webText === 'NOT USED' ? 'idle' : 'sent');

        modelName.textContent = data.harness.model || (modelText.startsWith('SENT · ') ? modelText.replace('SENT · ', '') : '—');
        responseId.textContent = data.harness.responseId || '—';
        webUsed.textContent = webText;
        remainingCalls.textContent = Number.isInteger(data.harness.remainingCallsThisHour)
          ? String(data.harness.remainingCallsThisHour)
          : '—';

        const outText = data.harness.outputGuard || 'NOT RUN';
        setStatus(outputStatus, outText, outText === 'PASSED' ? 'pass' : outText === 'REPAIRED' ? 'sent' : 'idle');

        reasonBox.textContent = data.harness.reason || (data.allowed
          ? `The active guard allowed the message and the output was ${String(outText).toLowerCase()}.`
          : 'The harness blocked the request.');
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
      setStatus(webStatus, 'UNKNOWN', 'block');
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = 'Send →';
      input.focus();
    }
  });

  renderMode();
})();
