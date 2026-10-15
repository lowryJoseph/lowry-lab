let kind = 'ADVENTURER';
let mode = 'GRAPHQL';

const $ = id => document.getElementById(id);
const pretty = value => JSON.stringify(value, null, 2);

const creatureFields = `
      id
      kind
      name
      level
      hitPoints
      armorClass
      initiative
      speed
      ... on Adventurer {
        className
        ancestry
        experience
      }
      ... on Monster {
        challengeRating
        monsterType
        legendary
      }`;

for (const button of document.querySelectorAll('.kind')) {
  button.addEventListener('click', () => {
    kind = button.dataset.kind;
    document.querySelectorAll('.kind').forEach(x => x.classList.toggle('active', x === button));
    $('adventurer-fields').classList.toggle('hidden', kind !== 'ADVENTURER');
    $('monster-fields').classList.toggle('hidden', kind !== 'MONSTER');
  });
}

for (const button of document.querySelectorAll('.mode-button')) {
  button.addEventListener('click', () => setMode(button.dataset.mode));
}

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll('.mode-button').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));

  const isGraphQL = mode === 'GRAPHQL';
  $('mode-summary').textContent = isGraphQL
    ? 'GraphQL mode: the UI asks for a Creature. GraphQL figures out where the pieces live.'
    : 'Direct REST mode: the UI itself must decide which REST endpoints to call and how to combine them.';
  $('layman-text').textContent = isGraphQL
    ? 'You tell one bartender what you want. The bartender knows which shelves and taps to use, gathers everything, and hands you one finished drink.'
    : 'You are your own bartender. You must know which shelf has the liquor, which tap has the beer, and how to combine everything yourself.';
  $('flow-middle').innerHTML = isGraphQL
    ? '🧙 GraphQL<br><small>router / translator</small>'
    : '🧠 UI routing code<br><small>if monster → this API</small>';
  $('flow-middle').classList.toggle('router', isGraphQL);
  $('flow-middle').classList.toggle('warning', !isGraphQL);
  $('request-caption').textContent = isGraphQL
    ? 'In GraphQL mode the UI describes the data it wants.'
    : 'In REST mode the UI contains the endpoint knowledge and orchestration logic.';
  $('trace-explanation').textContent = isGraphQL
    ? 'GraphQL owns the backend knowledge. The UI only knows the GraphQL contract.'
    : 'The UI owns the backend knowledge: type checks, endpoint paths, extra calls, and response merging.';
  clearResults();
}

function clearResults() {
  $('request-view').textContent = 'Waiting for a summon...';
  $('response-view').textContent = 'No creature yet.';
  $('trace').className = 'trace empty';
  $('trace').textContent = 'Run an action and the request path will appear here.';
  for (const id of ['browser-calls', 'routing-decisions', 'backend-calls']) $(id).textContent = '—';
  $('browser-calls-help').textContent = 'Run an action to compare.';
  $('routing-help').textContent = 'Run an action to compare.';
}

async function graphql(query, variables = {}) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}

async function rest(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `REST call failed: ${path}`);
  return body;
}

function readForm() {
  const common = {
    name: $('name').value,
    level: Number($('level').value),
    hitPoints: Number($('hitPoints').value),
    armorClass: Number($('armorClass').value)
  };

  if (kind === 'ADVENTURER') {
    return {
      ...common,
      className: $('className').value,
      ancestry: $('ancestry').value,
      experience: Number($('experience').value)
    };
  }

  return {
    ...common,
    challengeRating: Number($('challengeRating').value),
    monsterType: $('monsterType').value,
    legendary: $('legendary').checked
  };
}

function renderTrace(lines) {
  $('trace').className = 'trace';
  $('trace').innerHTML = '';
  lines.forEach((line, index) => {
    const step = document.createElement('div');
    step.className = 'trace-step';
    step.innerHTML = `<span class="step-number">${index + 1}</span><span>${escapeHtml(line)}</span>`;
    $('trace').appendChild(step);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMetrics({ browserCalls, routingDecisions, backendCalls }) {
  $('browser-calls').textContent = browserCalls;
  $('routing-decisions').textContent = routingDecisions;
  $('backend-calls').textContent = backendCalls;
  $('browser-calls-help').textContent = mode === 'GRAPHQL'
    ? 'One business request crosses the UI boundary.'
    : 'The UI must make each business REST call itself.';
  $('routing-help').textContent = mode === 'GRAPHQL'
    ? 'The UI does not choose backend services.'
    : 'The UI chooses a type endpoint and a stats endpoint.';
}

async function createViaGraphQL(formData) {
  const mutation = `mutation CreateCreature($input: CreateCreatureInput!) {
  createCreature(input: $input) {
    creature {${creatureFields}
    }
    routeTrace
  }
}`;

  const input = { kind, ...formData };
  $('request-view').textContent = `${mutation}\n\nvariables:\n${pretty({ input })}`;

  const result = await graphql(mutation, { input });
  if (result.errors) throw new Error(result.errors[0]?.message || 'GraphQL request failed');

  const payload = result.data.createCreature;
  $('response-view').textContent = pretty(payload.creature);
  renderTrace(payload.routeTrace);
  renderMetrics({ browserCalls: 1, routingDecisions: 0, backendCalls: 2 });
}

async function createViaRest(formData) {
  const typePath = kind === 'MONSTER' ? '/api/monsters' : '/api/adventurers';
  const uiPseudoCode = `// The UI has to know the backend layout:
if (kind === '${kind}') {
  POST ${typePath}
  then GET /api/battle-stats/{newId}
  then merge both JSON responses
}`;
  $('request-view').textContent = uiPseudoCode;

  const created = await rest(typePath, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(formData)
  });
  const stats = await rest(`/api/battle-stats/${created.id}`);
  const combined = { ...created, ...stats };

  $('response-view').textContent = pretty(combined);
  renderTrace([
    `UI checked the creature type: ${kind}`,
    `UI → REST POST ${typePath}`,
    `UI read the new id: ${created.id}`,
    `UI → REST GET /api/battle-stats/${created.id}`,
    'UI merged both REST responses itself'
  ]);
  renderMetrics({ browserCalls: 2, routingDecisions: 2, backendCalls: 2 });
}

async function loadViaGraphQL(id) {
  const query = `query GetCreature($id: ID!) {
  creature(id: $id) {
    creature {${creatureFields}
    }
    routeTrace
  }
}`;
  $('request-view').textContent = `${query}\n\nvariables:\n${pretty({ id })}`;

  const result = await graphql(query, { id });
  if (result.errors) throw new Error(result.errors[0]?.message || 'GraphQL request failed');

  const payload = result.data.creature;
  $('response-view').textContent = pretty(payload.creature);
  renderTrace(payload.routeTrace);
  renderMetrics({ browserCalls: 1, routingDecisions: 0, backendCalls: 2 });
}

async function loadViaRest(id) {
  const isMonster = id.startsWith('m');
  const typePath = isMonster ? `/api/monsters/${id}` : `/api/adventurers/${id}`;
  $('request-view').textContent = `// The UI has to understand what the id means:
const isMonster = id.startsWith('m');
GET ${typePath}
GET /api/battle-stats/${id}
merge the responses`;

  const [base, stats] = await Promise.all([
    rest(typePath),
    rest(`/api/battle-stats/${id}`)
  ]);
  const combined = { ...base, ...stats };

  $('response-view').textContent = pretty(combined);
  renderTrace([
    `UI inspected id "${id}" and decided it is a ${isMonster ? 'MONSTER' : 'ADVENTURER'}`,
    `UI → REST GET ${typePath}`,
    `UI → REST GET /api/battle-stats/${id}`,
    'UI merged both REST responses itself'
  ]);
  renderMetrics({ browserCalls: 2, routingDecisions: 2, backendCalls: 2 });
}

async function run(action) {
  try {
    action === 'create' ? await createCurrent() : await loadCurrent('m2');
  } catch (error) {
    $('response-view').textContent = `Error: ${error.message}`;
    renderTrace(['The request failed before the demo could finish.']);
  }
}

async function createCurrent() {
  const formData = readForm();
  if (mode === 'GRAPHQL') return createViaGraphQL(formData);
  return createViaRest(formData);
}

async function loadCurrent(id) {
  if (mode === 'GRAPHQL') return loadViaGraphQL(id);
  return loadViaRest(id);
}

$('forge-form').addEventListener('submit', event => {
  event.preventDefault();
  run('create');
});

$('load-example').addEventListener('click', () => run('load'));

setMode('GRAPHQL');
