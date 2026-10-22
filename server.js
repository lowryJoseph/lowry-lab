import express from 'express';
import OpenAI from 'openai';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.get('/', (req, res) => {
  const host = (req.hostname || '').toLowerCase();
  const file = host === 'lowryjoseph.com' || host === 'www.lowryjoseph.com'
    ? 'public/main/index.html'
    : 'public/lab/index.html';
  res.sendFile(file, { root: process.cwd() });
});

app.get(['/graphql-demo', '/graphql-demo/'], (req, res) => {
  res.sendFile('public/graphql-demo/index.html', { root: process.cwd() });
});
app.get(['/npc-generator', '/npc-generator/'], (req, res) => {
  res.sendFile('public/npc-generator/index.html', { root: process.cwd() });
});
app.get(['/yoga-flow', '/yoga-flow/'], (req, res) => {
  res.sendFile('public/yoga-flow/index.html', { root: process.cwd() });
});
app.get(['/automation-starter', '/automation-starter/'], (req, res) => {
  res.sendFile('public/automation-starter/index.html', { root: process.cwd() });
});
app.get(['/magic-word-ai', '/magic-word-ai/'], (req, res) => {
  res.sendFile('public/magic-word-ai/index.html', { root: process.cwd() });
});
app.get(['/trollsure', '/trollsure/'], (req, res) => {
  res.sendFile('public/trollsure/index.html', { root: process.cwd() });
});
app.use(express.static('public', { index: false }));

// ------------------------------------------------------
// Existing REST services. GraphQL intentionally reuses them.
// ------------------------------------------------------
const adventurers = [
  { id: 'a1', kind: 'ADVENTURER', name: 'Brakka Stonehand', level: 7, hitPoints: 62, armorClass: 17, className: 'Barbarian', ancestry: 'Half-Orc', experience: 23000 },
  { id: 'a2', kind: 'ADVENTURER', name: 'Mira Quill', level: 5, hitPoints: 34, armorClass: 15, className: 'Wizard', ancestry: 'Human', experience: 6500 }
];
const monsters = [
  { id: 'm1', kind: 'MONSTER', name: 'Bog Maw', level: 7, hitPoints: 88, armorClass: 14, challengeRating: 5, monsterType: 'Aberration', legendary: false },
  { id: 'm2', kind: 'MONSTER', name: 'Ashscale the Patient', level: 14, hitPoints: 230, armorClass: 20, challengeRating: 13, monsterType: 'Dragon', legendary: true }
];
const bosses = [
  { id: 'b1', kind: 'BOSS', name: 'Vharos, Warden of the Last Gate', level: 20, hitPoints: 480, armorClass: 23, challengeRating: 22, monsterType: 'Ancient Dragon', legendary: true }
];

const battleStats = {
  a1: { initiative: 2, speed: 30 }, a2: { initiative: 4, speed: 30 },
  m1: { initiative: 1, speed: 25 }, m2: { initiative: 3, speed: 40 },
  b1: { initiative: 6, speed: 50 }
};
const equipment = {
  a1: ['Greataxe', 'Explorer Pack'], a2: ['Spellbook', 'Quarterstaff'],
  m1: ['Natural weapons'], m2: ['Natural weapons'], b1: ['Crown of Emberglass']
};
const abilities = {
  a1: ['Rage', 'Reckless Attack'], a2: ['Arcane Recovery', 'Fire Bolt'],
  m1: ['Swallow', 'Bog Camouflage'], m2: ['Fire Breath', 'Wing Attack'],
  b1: ['Inferno Breath', 'Gatebreaker', 'Wing Tempest']
};
const legendaryActions = {
  m2: ['Detect', 'Tail Attack'],
  b1: ['Command the Gate', 'Magma Step', 'Cataclysmic Roar']
};
const lootTables = {
  b1: ['Emberglass Crown', 'Ancient Coin Hoard', 'Gatekeeper Sigil']
};
const phases = {
  b1: ['Phase 1: Warden', 'Phase 2: Broken Seal', 'Phase 3: Last Flame']
};
const lairActions = {
  b1: ['Seal a doorway', 'Summon magma fissure', 'Darken the chamber']
};

function route(collection, name) {
  app.get(`/api/${name}/:id`, (req, res) => {
    const item = collection.find(x => x.id === req.params.id);
    item ? res.json(item) : res.status(404).json({ error: `${name} item not found` });
  });
  app.post(`/api/${name}`, (req, res) => {
    const prefix = name === 'adventurers' ? 'a' : name === 'monsters' ? 'm' : 'b';
    const id = `${prefix}${collection.length + 1}`;
    const kind = name === 'adventurers' ? 'ADVENTURER' : name === 'monsters' ? 'MONSTER' : 'BOSS';
    const created = { id, kind, ...req.body };
    collection.push(created);
    battleStats[id] = { initiative: 0, speed: kind === 'BOSS' ? 40 : 30 };
    equipment[id] = kind === 'ADVENTURER' ? ['Starting equipment'] : ['Natural weapons'];
    abilities[id] = kind === 'ADVENTURER' ? ['Class feature'] : ['Signature attack'];
    if (kind === 'BOSS') {
      legendaryActions[id] = ['Legendary action'];
      lootTables[id] = ['Rare treasure'];
      phases[id] = ['Phase 1', 'Phase 2'];
      lairActions[id] = ['Lair action'];
    }
    res.status(201).json(created);
  });
}
route(adventurers, 'adventurers');
route(monsters, 'monsters');
route(bosses, 'bosses');

function mapRoute(path, source, label) {
  app.get(path, (req, res) => {
    const item = source[req.params.id];
    item ? res.json({ [label]: item }) : res.status(404).json({ error: `${label} not found` });
  });
}
mapRoute('/api/battle-stats/:id', battleStats, 'battleStats');
mapRoute('/api/equipment/:id', equipment, 'equipment');
mapRoute('/api/abilities/:id', abilities, 'abilities');
mapRoute('/api/legendary-actions/:id', legendaryActions, 'legendaryActions');
mapRoute('/api/loot/:id', lootTables, 'loot');
mapRoute('/api/phases/:id', phases, 'phases');
mapRoute('/api/lair-actions/:id', lairActions, 'lairActions');

// ------------------------------------------------------
// GraphQL facade. This is the consumer-facing contract.
// ------------------------------------------------------
const schema = buildSchema(`
  enum CreatureKind { ADVENTURER MONSTER BOSS }

  interface Creature {
    id: ID!
    kind: CreatureKind!
    name: String!
    level: Int!
    hitPoints: Int!
    armorClass: Int!
    initiative: Int!
    speed: Int!
    abilities: [String!]!
    equipment: [String!]!
  }

  type Adventurer implements Creature {
    id: ID! kind: CreatureKind! name: String! level: Int! hitPoints: Int! armorClass: Int!
    initiative: Int! speed: Int! abilities: [String!]! equipment: [String!]!
    className: String! ancestry: String! experience: Int!
  }

  type Monster implements Creature {
    id: ID! kind: CreatureKind! name: String! level: Int! hitPoints: Int! armorClass: Int!
    initiative: Int! speed: Int! abilities: [String!]! equipment: [String!]!
    challengeRating: Float! monsterType: String! legendary: Boolean!
    legendaryActions: [String!]!
  }

  type BossMonster implements Creature {
    id: ID! kind: CreatureKind! name: String! level: Int! hitPoints: Int! armorClass: Int!
    initiative: Int! speed: Int! abilities: [String!]! equipment: [String!]!
    challengeRating: Float! monsterType: String! legendary: Boolean!
    legendaryActions: [String!]! loot: [String!]! phases: [String!]! lairActions: [String!]!
  }

  type CreaturePayload { creature: Creature routeTrace: [String!]! backendCallCount: Int! }
  type Query { creature(id: ID!, requirementLevel: Int = 3): CreaturePayload! }

  input CreateCreatureInput {
    kind: CreatureKind! name: String! level: Int! hitPoints: Int! armorClass: Int!
    className: String ancestry: String experience: Int
    challengeRating: Float monsterType: String legendary: Boolean
  }
  type Mutation { createCreature(input: CreateCreatureInput!, requirementLevel: Int = 3): CreaturePayload! }
`);

async function restGet(path, trace, caller = 'GraphQL') {
  trace.push(`${caller} → REST GET ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
  if (!response.ok) return null;
  return response.json();
}
async function restPost(path, body, trace, caller = 'GraphQL') {
  trace.push(`${caller} → REST POST ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`REST call failed: ${path}`);
  return response.json();
}
function typePath(kind, id = '') {
  const base = kind === 'ADVENTURER' ? 'adventurers' : kind === 'MONSTER' ? 'monsters' : 'bosses';
  return `/api/${base}${id ? `/${id}` : ''}`;
}
function kindFromId(id) { return id.startsWith('a') ? 'ADVENTURER' : id.startsWith('m') ? 'MONSTER' : 'BOSS'; }

async function hydrate(base, requirementLevel, trace, caller = 'GraphQL') {
  if (!base) return null;
  const parts = [];
  // Stage 1: shared stats.
  parts.push(restGet(`/api/battle-stats/${base.id}`, trace, caller));
  // Stage 2: product wants richer creature data.
  if (requirementLevel >= 2) {
    parts.push(restGet(`/api/abilities/${base.id}`, trace, caller));
    parts.push(restGet(`/api/equipment/${base.id}`, trace, caller));
  }
  // Stage 3: monster/boss-specific requirements.
  if (requirementLevel >= 3 && (base.kind === 'MONSTER' || base.kind === 'BOSS')) {
    parts.push(restGet(`/api/legendary-actions/${base.id}`, trace, caller));
  }
  // Stage 4+: boss segment keeps gaining product requirements.
  if (base.kind === 'BOSS') {
    if (requirementLevel >= 4) parts.push(restGet(`/api/loot/${base.id}`, trace, caller));
    if (requirementLevel >= 5) parts.push(restGet(`/api/phases/${base.id}`, trace, caller));
    if (requirementLevel >= 6) parts.push(restGet(`/api/lair-actions/${base.id}`, trace, caller));
  }

  const resolved = await Promise.all(parts);
  const merged = Object.assign({}, base, ...resolved.filter(Boolean));

  // battle-stats is intentionally a separate REST resource and returns
  // { battleStats: { initiative, speed } }. Flatten those shared fields onto
  // the GraphQL Creature object before GraphQL validates non-null fields.
  if (merged.battleStats) {
    merged.initiative = merged.battleStats.initiative;
    merged.speed = merged.battleStats.speed;
    delete merged.battleStats;
  }

  const typename = base.kind === 'ADVENTURER' ? 'Adventurer' : base.kind === 'MONSTER' ? 'Monster' : 'BossMonster';
  return { ...merged, __typename: typename, legendaryActions: merged.legendaryActions || [], loot: merged.loot || [], phases: merged.phases || [], lairActions: merged.lairActions || [], abilities: merged.abilities || [], equipment: merged.equipment || [] };
}


// ------------------------------------------------------
// REST BFF / aggregation API.
// The UI still speaks REST, but it speaks to one purpose-built backend endpoint.
// That endpoint owns orchestration and reuses the same existing REST services.
// ------------------------------------------------------
function bffBody(input) {
  const common = { name: input.name, level: input.level, hitPoints: input.hitPoints, armorClass: input.armorClass };
  if (input.kind === 'ADVENTURER') {
    return { ...common, className: input.className ?? 'Fighter', ancestry: input.ancestry ?? 'Human', experience: input.experience ?? 0 };
  }
  return { ...common, challengeRating: input.challengeRating ?? 1, monsterType: input.monsterType ?? 'Beast', legendary: input.kind === 'BOSS' ? true : Boolean(input.legendary) };
}

app.get('/api/bff/creatures/:id', async (req, res) => {
  try {
    const requirementLevel = Number(req.query.requirementLevel || 3);
    const id = req.params.id;
    const kind = kindFromId(id);
    const trace = [`UI → REST BFF: GET /api/bff/creatures/${id}`];
    const base = await restGet(typePath(kind, id), trace, 'REST BFF');
    if (!base) return res.status(404).json({ error: 'Creature not found' });
    const creature = await hydrate(base, requirementLevel, trace, 'REST BFF');
    trace.push('REST BFF composed the existing REST responses → UI');
    res.json({ creature, routeTrace: trace, backendCallCount: trace.filter(x => x.includes('REST BFF → REST')).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bff/creatures', async (req, res) => {
  try {
    const requirementLevel = Number(req.query.requirementLevel || 3);
    const input = req.body;
    const trace = [`UI → REST BFF: POST /api/bff/creatures`];
    const created = await restPost(typePath(input.kind), bffBody(input), trace, 'REST BFF');
    const creature = await hydrate(created, requirementLevel, trace, 'REST BFF');
    trace.push('REST BFF composed the existing REST responses → UI');
    res.status(201).json({ creature, routeTrace: trace, backendCallCount: trace.filter(x => x.includes('REST BFF → REST')).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const root = {
  creature: async ({ id, requirementLevel }) => {
    const trace = [`UI → GraphQL: creature(id: ${id})`];
    const kind = kindFromId(id);
    const base = await restGet(typePath(kind, id), trace);
    const creature = await hydrate(base, requirementLevel, trace);
    trace.push('GraphQL composed the existing REST responses → UI');
    return { creature, routeTrace: trace, backendCallCount: trace.filter(x => x.includes('GraphQL → REST')).length };
  },
  createCreature: async ({ input, requirementLevel }) => {
    const trace = [`UI → GraphQL: createCreature(kind: ${input.kind})`];
    const common = { name: input.name, level: input.level, hitPoints: input.hitPoints, armorClass: input.armorClass };
    let body;
    if (input.kind === 'ADVENTURER') body = { ...common, className: input.className ?? 'Fighter', ancestry: input.ancestry ?? 'Human', experience: input.experience ?? 0 };
    else body = { ...common, challengeRating: input.challengeRating ?? 1, monsterType: input.monsterType ?? 'Beast', legendary: input.kind === 'BOSS' ? true : (input.legendary ?? false) };
    const created = await restPost(typePath(input.kind), body, trace);
    const creature = await hydrate(created, requirementLevel, trace);
    trace.push('GraphQL composed the existing REST responses → UI');
    return { creature, routeTrace: trace, backendCallCount: trace.filter(x => x.includes('GraphQL → REST')).length };
  }
};

app.all('/graphql', createHandler({ schema, rootValue: root }));

// ------------------------------------------------------
// Magic Word AI harness demo.
// V2 = deterministic compliment guard.
// V3 = cheap deterministic pre-filter + AI semantic guard.
// Both modes still validate the model output before returning it.
// ------------------------------------------------------
const aiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const magicWordModel = process.env.OPENAI_MODEL || 'gpt-6-luna';
const magicWordGuardModel = process.env.OPENAI_GUARD_MODEL || magicWordModel;

const complimentTerms = [
  'awesome', 'amazing', 'great', 'brilliant', 'smart', 'clever', 'excellent',
  'fantastic', 'cool', 'legend', 'legendary', 'handsome', 'talented', 'impressive',
  'wonderful', 'incredible', 'genius', 'good', 'best', 'rocks', 'rules', 'solid',
  'helpful', 'creative', 'funny', 'kind', 'thoughtful', 'sharp'
];

const joeNamePattern = /\bjoe(?:\s+lowry)?\b/i;
const complimentPattern = new RegExp(
  `\\b(?:${complimentTerms.map(term => term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|')})\\b`,
  'i'
);

const directNegativePatterns = [
  /\bjoe(?:\s+lowry)?\s+(?:is|seems|looks|sounds)\s+(?:really\s+|pretty\s+|very\s+)?(?:bad|awful|terrible|stupid|dumb|lame|annoying|useless|worst)\b/i,
  /\bjoe(?:\s+lowry)?\s+(?:sucks|stinks)\b/i,
  /\b(?:hate|dislike|despise)\s+joe(?:\s+lowry)?\b/i,
  /\bjoe(?:\s+lowry)?\s+(?:is|seems|looks|sounds)\s+(?:not|isn't|isnt)\s+(?:really\s+|pretty\s+|very\s+)?(?:awesome|amazing|great|brilliant|smart|clever|excellent|fantastic|cool|legendary|handsome|talented|impressive|wonderful|incredible|good|helpful|creative|funny|kind|thoughtful|sharp)\b/i,
  /\bjoe(?:\s+lowry)?\b[^.!?]{0,80}\bbut\s+he\s+(?:is|seems|looks|sounds)\s+(?:really\s+|pretty\s+|very\s+)?(?:bad|awful|terrible|stupid|dumb|lame|annoying|useless|worst)\b/i
];

const explicitPraisePatterns = [
  /\b(?:love|admire|respect|appreciate)\s+joe(?:\s+lowry)?\b/i,
  /\bjoe(?:\s+lowry)?\s+(?:rocks|rules)\b/i
];

function normalizeMagicText(text) {
  return String(text || '')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function checkJoeCompliment(text) {
  const normalized = normalizeMagicText(text);
  const hasName = joeNamePattern.test(normalized);
  const hasNegative = directNegativePatterns.some(pattern => pattern.test(normalized));

  if (!hasName) {
    return {
      passed: false,
      hasName: false,
      hasPositiveLanguage: false,
      detectedCompliment: null,
      hasNegative: false
    };
  }

  const explicitPraise = explicitPraisePatterns.find(pattern => pattern.test(normalized));
  const clauses = normalized.split(/(?:[.!?;]|\bbut\b|\bhowever\b)/i).map(part => part.trim()).filter(Boolean);
  let detectedCompliment = null;

  for (const clause of clauses) {
    if (!joeNamePattern.test(clause)) continue;
    const match = clause.match(complimentPattern);
    if (match) {
      detectedCompliment = match[0].toLowerCase();
      break;
    }
  }

  if (!detectedCompliment) {
    const followUp = normalized.match(
      /\bjoe(?:\s+lowry)?\b[^.!?]*[.!?]\s*(?:he|he's|he is)\s+(?:really\s+|pretty\s+|very\s+)?([a-z-]+)/i
    );
    if (followUp && complimentTerms.includes(followUp[1].toLowerCase())) {
      detectedCompliment = followUp[1].toLowerCase();
    }
  }

  const hasPositiveLanguage = Boolean(explicitPraise || detectedCompliment);

  return {
    passed: Boolean(hasPositiveLanguage && !hasNegative),
    hasName,
    hasPositiveLanguage,
    detectedCompliment: explicitPraise ? 'explicit praise' : detectedCompliment,
    hasNegative
  };
}

function outputMentionsJoeNicely(text) {
  return checkJoeCompliment(text).passed;
}

async function classifyJoeComplimentWithAI(text) {
  const response = await aiClient.responses.create({
    model: magicWordGuardModel,
    instructions: [
      'You are an input-policy classifier for a deliberately silly AI harness demo.',
      'Your only job is to decide whether the latest user message contains a genuine compliment directed at Joe or Joe Lowry.',
      'Allow natural wording, synonyms, indirect praise, and compliments that do not use a pre-approved keyword list.',
      'A separate negative statement about the user or another subject does not invalidate praise of Joe.',
      'Do not allow negated praise, sarcasm that is clearly insulting, backhanded praise, or a message that also directly insults Joe.',
      'Examples: "Joe is great but I am dumb" = allow. "I have to hand it to Joe, that was clever" = allow.',
      '"Joe is great but he is dumb" = deny. "Joe is not great" = deny. "Pizza is great, Joe exists" = deny.',
      'Return only the structured classification.'
    ].join(' '),
    input: normalizeMagicText(text).slice(0, 2000),
    text: {
      format: {
        type: 'json_schema',
        name: 'joe_compliment_guard',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            mentionsJoe: { type: 'boolean' },
            genuineCompliment: { type: 'boolean' },
            negativeTowardJoe: { type: 'boolean' },
            allowed: { type: 'boolean' },
            reason: { type: 'string' }
          },
          required: ['mentionsJoe', 'genuineCompliment', 'negativeTowardJoe', 'allowed', 'reason']
        }
      }
    },
    max_output_tokens: 160
  });

  return JSON.parse(response.output_text);
}

// Tiny in-memory limiter for a public demo. Render restarts reset this map,
// which is fine here; this is budget protection, not an auth system.
const aiUsageByIp = new Map();
const AI_WINDOW_MS = 60 * 60 * 1000;
const AI_CALLS_PER_WINDOW = 20;
function takeAiSlot(ip) {
  const now = Date.now();
  const key = ip || 'unknown';
  const existing = aiUsageByIp.get(key) || [];
  const recent = existing.filter(timestamp => now - timestamp < AI_WINDOW_MS);
  if (recent.length >= AI_CALLS_PER_WINDOW) {
    aiUsageByIp.set(key, recent);
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  aiUsageByIp.set(key, recent);
  return { allowed: true, remaining: AI_CALLS_PER_WINDOW - recent.length };
}

function rateLimitResponse(res, harness) {
  return res.status(429).json({
    error: 'Demo AI call limit reached for this hour. Joe remains awesome; the budget guard remains undefeated.',
    harness
  });
}

app.post('/api/magic-word-ai', async (req, res) => {
  try {
    const mode = req.body?.mode === 'v3' ? 'v3' : 'v2';
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const cleanHistory = messages
      .filter(message => ['user', 'assistant'].includes(message?.role) && typeof message?.content === 'string')
      .slice(-12)
      .map(message => ({ role: message.role, content: message.content.slice(0, 2000) }));

    const latestUser = [...cleanHistory].reverse().find(message => message.role === 'user');
    if (!latestUser || !latestUser.content.trim()) {
      return res.status(400).json({ error: 'Send a message first.' });
    }

    const deterministic = checkJoeCompliment(latestUser.content);
    let semanticGuard = 'NOT USED';
    let semanticReason = '';

    if (mode === 'v2') {
      if (!deterministic.passed) {
        return res.json({
          allowed: false,
          reply: "Uh uh uh… you didn’t say the magic word!",
          harness: {
            mode: 'V2 · deterministic',
            deterministicGuard: 'BLOCKED',
            semanticGuard,
            modelCall: 'NOT SENT',
            webSearch: 'NOT USED',
            outputGuard: 'NOT RUN',
            reason: !deterministic.hasName
              ? 'V2 rule check: no Joe or Joe Lowry mention detected.'
              : deterministic.hasNegative
                ? 'V2 rule check: direct negative language about Joe was detected.'
                : 'V2 rule check: Joe was mentioned, but the approved deterministic compliment patterns did not match.'
          }
        });
      }
    } else {
      // V3 keeps one deliberately cheap rule before spending money: if the user did
      // not mention Joe at all, there is nothing useful for the semantic guard to judge.
      if (!deterministic.hasName) {
        return res.json({
          allowed: false,
          reply: "Uh uh uh… you didn’t say the magic word!",
          harness: {
            mode: 'V3 · AI semantic guard',
            deterministicGuard: 'PREFILTER BLOCK',
            semanticGuard: 'NOT SENT',
            modelCall: 'NOT SENT',
            webSearch: 'NOT USED',
            outputGuard: 'NOT RUN',
            reason: 'V3 cheap pre-filter: no Joe or Joe Lowry mention, so the classifier was not worth calling.'
          }
        });
      }

      if (!aiClient) {
        return res.status(503).json({
          error: 'OPENAI_API_KEY is not configured on the server.',
          harness: {
            mode: 'V3 · AI semantic guard',
            deterministicGuard: 'PREFILTER PASSED',
            semanticGuard: 'NOT CONFIGURED',
            modelCall: 'NOT SENT',
            webSearch: 'NOT USED',
            outputGuard: 'NOT RUN'
          }
        });
      }

      const guardUsage = takeAiSlot(req.ip);
      if (!guardUsage.allowed) {
        return rateLimitResponse(res, {
          mode: 'V3 · AI semantic guard',
          deterministicGuard: 'PREFILTER PASSED',
          semanticGuard: 'RATE LIMITED',
          modelCall: 'NOT SENT',
          webSearch: 'NOT USED',
          outputGuard: 'NOT RUN'
        });
      }

      const classification = await classifyJoeComplimentWithAI(latestUser.content);
      semanticGuard = classification.allowed ? 'PASSED' : 'BLOCKED';
      semanticReason = classification.reason;

      if (!classification.allowed) {
        return res.json({
          allowed: false,
          reply: "Uh uh uh… you didn’t say the magic word!",
          harness: {
            mode: 'V3 · AI semantic guard',
            deterministicGuard: 'PREFILTER PASSED',
            semanticGuard,
            modelCall: 'NOT SENT',
            webSearch: 'NOT USED',
            outputGuard: 'NOT RUN',
            reason: `AI classifier: ${semanticReason}`,
            remainingCallsThisHour: guardUsage.remaining
          }
        });
      }
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'OPENAI_API_KEY is not configured on the server.',
        harness: {
          mode: 'V2 · deterministic',
          deterministicGuard: 'PASSED',
          semanticGuard,
          modelCall: 'NOT CONFIGURED',
          webSearch: 'NOT USED',
          outputGuard: 'NOT RUN'
        }
      });
    }

    const usage = takeAiSlot(req.ip);
    if (!usage.allowed) {
      return rateLimitResponse(res, {
        mode: mode === 'v3' ? 'V3 · AI semantic guard' : 'V2 · deterministic',
        deterministicGuard: mode === 'v3' ? 'PREFILTER PASSED' : 'PASSED',
        semanticGuard,
        modelCall: 'RATE LIMITED',
        outputGuard: 'NOT RUN'
      });
    }

    const response = await aiClient.responses.create({
      model: magicWordModel,
      instructions: [
        'You are the chat model inside a deliberately silly AI harness demonstration called Magic Word AI.',
        'Answer the user request normally and helpfully.',
        'You have access to web search. Use it when the user asks for current, live, recent, changing, or externally verifiable information such as weather, news, prices, schedules, or current facts.',
        'Do not claim you cannot check live information when web search can answer the request.',
        'Keep responses concise unless the user asks for detail.',
        'Naturally include exactly one brief, positive remark about Joe Lowry somewhere in the response.',
        'Do not claim personal knowledge of Joe Lowry or invent biographical facts about him.',
        'The positive remark can be playful and generic, for example that Joe Lowry is awesome, clever, or has good ideas.'
      ].join(' '),
      input: cleanHistory,
      tools: [{ type: 'web_search' }],
      max_output_tokens: 320
    });

    const outputItems = Array.isArray(response.output) ? response.output : [];
    const webSearchUsed = outputItems.some(item => item?.type === 'web_search_call');
    const responseId = response.id || null;

    let reply = (response.output_text || '').trim();
    let outputGuard = 'PASSED';
    if (!reply) {
      reply = 'Joe Lowry is awesome. I seem to have misplaced the rest of my answer.';
      outputGuard = 'REPAIRED';
    } else if (!outputMentionsJoeNicely(reply)) {
      reply = `Joe Lowry is awesome, by the way. ${reply}`;
      outputGuard = 'REPAIRED';
    }

    res.json({
      allowed: true,
      reply,
      harness: {
        mode: mode === 'v3' ? 'V3 · AI semantic guard' : 'V2 · deterministic',
        deterministicGuard: mode === 'v3' ? 'PREFILTER PASSED' : 'PASSED',
        semanticGuard,
        modelCall: `SENT · ${magicWordModel}`,
        webSearch: webSearchUsed ? 'USED' : 'NOT USED',
        responseId,
        model: magicWordModel,
        outputGuard,
        reason: mode === 'v3'
          ? `AI classifier allowed the message: ${semanticReason}`
          : 'V2 deterministic compliment rule passed. No AI was used to judge the input.',
        remainingCallsThisHour: usage.remaining
      }
    });
  } catch (error) {
    console.error('Magic Word AI error:', error);
    res.status(500).json({
      error: 'The model call failed. Check the server logs and API configuration.',
      harness: {
        deterministicGuard: 'UNKNOWN',
        semanticGuard: 'FAILED',
        modelCall: 'NOT SENT',
        webSearch: 'NOT USED',
        outputGuard: 'NOT RUN'
      }
    });
  }
});


// ------------------------------------------------------
// TrollSure — deliberately fake group-benefits architecture demo.
// Domain REST APIs are the source of truth. The REST BFF and GraphQL
// facade both orchestrate those same APIs so the UI can compare contracts.
// ------------------------------------------------------
const trollProducts = [
  { code: 'TROLL', name: 'Troll Insurance', kind: 'CORE', rates: { individual: 100, plusOne: 175, family: 240 } },
  { code: 'GOBLIN', name: 'Goblin Theft Protection', kind: 'ADD_ON', deductible: 100, rates: { individual: 15, plusOne: 25, family: 35 } },
  { code: 'DRAGON', name: 'Dragon Singe Protection', kind: 'ADD_ON', deductible: 50, rates: { individual: 10, plusOne: 17, family: 24 } }
];

const trollPlans = [
  { code: 'WOOD', name: 'Wooden Shield', rateMultiplier: 0.82, deductible: 2000, battleCostSharePct: 30, maxQuestBurden: 8000 },
  { code: 'IRON', name: 'Iron Shield', rateMultiplier: 1.00, deductible: 1000, battleCostSharePct: 20, maxQuestBurden: 6000 },
  { code: 'MITHRIL', name: 'Mithril Shield', rateMultiplier: 1.25, deductible: 500, battleCostSharePct: 10, maxQuestBurden: 4000 }
];

const trollEligibilityClasses = [
  { code: 'GUILDMASTER', name: 'Guild Master', eligible: true, note: 'Eligible immediately.' },
  { code: 'FULL_TIME', name: 'Full-Time Adventurer', eligible: true, note: 'Eligible for guild benefits.' },
  { code: 'APPRENTICE', name: 'Apprentice', eligible: true, note: 'Eligible in this demo.' },
  { code: 'SEASONAL', name: 'Seasonal Mercenary', eligible: false, note: 'Not eligible for TrollSure in V1.' }
];

const trollAgents = [
  { id: 'A-101', name: 'Merrick Quill', title: 'Licensed Guild Risk Scribe', region: 'Upper & Lower Lands', commissionPct: 5 },
  { id: 'A-102', name: 'Brunna Ledgerstone', title: 'Senior Party Benefits Broker', region: 'Lower Lands', commissionPct: 5 },
  { id: 'A-103', name: 'Fenwick Inkpot', title: 'Associate Protection Peddler', region: 'Upper Lands', commissionPct: 5 }
];

const trollGroups = [];
const trollQuotes = [];
const trollEnrollments = [];
const trollClaims = [];
const trollOperations = [];
const trollAccumulators = new Map();
const trollProviders = [
  { id: 'P-201', name: 'Moonwell Healing Hall', network: 'IN_GUILD', specialty: 'General Quest Medicine', allowedPct: 85 },
  { id: 'P-202', name: 'Sister Brakka’s Bone & Potion', network: 'IN_GUILD', specialty: 'Bones, Burns & Potions', allowedPct: 88 },
  { id: 'P-203', name: 'The Cleric Collective', network: 'IN_GUILD', specialty: 'Restoration & Curses', allowedPct: 90 },
  { id: 'P-204', name: 'Gruk’s Discount Resurrection Wagon', network: 'OUT_OF_GUILD', specialty: 'Questionable Resurrection', allowedPct: 65 }
];
const trollFormulary = [
  { code: 'POT-HEAL', name: 'Basic Healing Potion', tier: 1, copay: 5, status: 'PREFERRED' },
  { code: 'POT-GREATER', name: 'Greater Healing Potion', tier: 2, copay: 12, status: 'PREFERRED' },
  { code: 'POT-RESTORE', name: 'Elixir of Restoration', tier: 3, copay: 25, status: 'PRIOR_AUTH' },
  { code: 'POT-GOBLIN', name: 'Suspicious Goblin Tonic', tier: 9, copay: 0, status: 'NOT_COVERED' }
];
let trollOperationSeq = 5000;
let trollGroupSeq = 1000;
let trollQuoteSeq = 2000;
let trollEnrollmentSeq = 3000;
let trollClaimSeq = 4000;

function trollTier(dependents = 0) {
  if (dependents <= 0) return 'individual';
  if (dependents === 1) return 'plusOne';
  return 'family';
}
function trollGroupClass(memberCount) { return memberCount <= 10 ? 'SMALL' : 'LARGE'; }
function trollPlan(code) { return trollPlans.find(plan => plan.code === code) || trollPlans[1]; }
function trollEligibility(code) { return trollEligibilityClasses.find(item => item.code === code) || trollEligibilityClasses[1]; }
function trollRound(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function trollEffectiveDate(waitingPeriodDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(0, Number(waitingPeriodDays || 0)));
  const effective = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return effective.toISOString().slice(0, 10);
}

function trollRateQuote({ groupName, location, members, products, planCode, guildContributionPct, waitingPeriodDays }) {
  const safeMembers = Array.isArray(members) ? members : [];
  const selectedProducts = trollProducts.filter(product => products.includes(product.code));
  if (!selectedProducts.some(product => product.code === 'TROLL')) selectedProducts.unshift(trollProducts[0]);
  const plan = trollPlan(planCode);
  const contributionPct = Math.max(0, Math.min(100, Number(guildContributionPct ?? 60)));
  const eligibleMembers = safeMembers.filter(member => trollEligibility(member.eligibilityClass).eligible);
  const groupClass = trollGroupClass(eligibleMembers.length || safeMembers.length || 1);
  const locationMultiplier = location === 'LOWER_LANDS' ? 1.05 : 1;
  const groupMultiplier = groupClass === 'LARGE' ? 0.90 : 1;

  const memberLines = safeMembers.map((member, index) => {
    const dependents = Math.max(0, Number(member.dependents || 0));
    const tier = trollTier(dependents);
    const liverUse = Boolean(member.orcLiverUse);
    const eligibility = trollEligibility(member.eligibilityClass);
    const election = member.election === 'WAIVE' ? 'WAIVE' : 'ENROLL';
    const covered = eligibility.eligible && election === 'ENROLL';

    const coverage = covered ? selectedProducts.map(product => {
      const base = Number(product.rates[tier] || 0);
      const planMultiplier = product.code === 'TROLL' ? plan.rateMultiplier : 1;
      const underwritingMultiplier = product.code === 'TROLL' && liverUse ? 1.08 : 1;
      const adjusted = trollRound(base * planMultiplier * locationMultiplier * groupMultiplier * underwritingMultiplier);
      return {
        code: product.code,
        name: product.name,
        deductible: product.code === 'TROLL' ? plan.deductible : product.deductible,
        baseRate: base,
        adjustedRate: adjusted
      };
    }) : [];

    const grossPremium = trollRound(coverage.reduce((sum, item) => sum + item.adjustedRate, 0));
    const guildContribution = trollRound(grossPremium * contributionPct / 100);
    const adventurerContribution = trollRound(grossPremium - guildContribution);

    return {
      memberId: member.id || `M-${index + 1}`,
      name: member.name || `Adventurer ${index + 1}`,
      dependents,
      tier,
      eligibilityClass: eligibility.code,
      eligibilityName: eligibility.name,
      eligible: eligibility.eligible,
      election: eligibility.eligible ? election : 'INELIGIBLE',
      orcLiverUse: liverUse,
      coverage,
      grossPremium,
      guildContribution,
      adventurerContribution
    };
  });

  const grossPremium = trollRound(memberLines.reduce((sum, member) => sum + member.grossPremium, 0));
  const guildContribution = trollRound(memberLines.reduce((sum, member) => sum + member.guildContribution, 0));
  const adventurerContribution = trollRound(memberLines.reduce((sum, member) => sum + member.adventurerContribution, 0));

  return {
    groupName,
    location,
    groupClass,
    memberCount: safeMembers.length,
    eligibleMemberCount: eligibleMembers.length,
    dependentCount: safeMembers.reduce((sum, member) => sum + Math.max(0, Number(member.dependents || 0)), 0),
    locationAdjustmentPct: location === 'LOWER_LANDS' ? 5 : 0,
    largeGroupDiscountPct: groupClass === 'LARGE' ? 10 : 0,
    orcLiverUseAdjustmentPct: 8,
    guildContributionPct: contributionPct,
    waitingPeriodDays: Math.max(0, Number(waitingPeriodDays || 0)),
    effectiveDate: trollEffectiveDate(waitingPeriodDays),
    plan,
    products: selectedProducts,
    memberLines,
    grossPremium,
    guildContribution,
    adventurerContribution,
    monthlyPremium: grossPremium
  };
}

// Domain REST APIs -----------------------------------------------------------
app.get('/api/troll/products', (req, res) => res.json({ products: trollProducts, plans: trollPlans, eligibilityClasses: trollEligibilityClasses }));
app.get('/api/troll/rates', (req, res) => res.json({
  products: trollProducts,
  plans: trollPlans,
  eligibilityClasses: trollEligibilityClasses,
  rules: {
    currency: { goldToSilver: 10, display: 'gold and silver pieces' },
    groupSize: { small: '1-10', large: '11+', largeDiscountPct: 10 },
    locations: { UPPER_LANDS: 0, LOWER_LANDS: 5 },
    underwriting: { orcLiverUsePct: 8, appliesTo: 'TROLL' },
    contribution: { defaultGuildPct: 60 },
    waitingPeriods: [0, 30, 60],
    quoteExpirationDays: 30
  }
}));

app.get('/api/troll/agents', (req, res) => res.json(trollAgents));
app.get('/api/troll/agents/:id', (req, res) => {
  const agent = trollAgents.find(item => item.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Guild benefits agent not found' });
  const groups = trollGroups.filter(group => group.agentId === agent.id);
  const groupIds = new Set(groups.map(group => group.id));
  const enrollments = trollEnrollments.filter(item => groupIds.has(item.groupId));
  const activeMembers = enrollments.reduce((sum, enrollment) => sum + enrollment.memberLines.filter(line => line.enrollmentStatus === 'ACTIVE').length, 0);
  const monthlyPremium = trollRound(enrollments.reduce((sum, enrollment) => sum + Number(enrollment.grossPremium || 0), 0));
  const estimatedCommission = trollRound(monthlyPremium * agent.commissionPct / 100);
  res.json({ agent, groups, enrollments, metrics: { groups: groups.length, activeEnrollments: enrollments.length, activeMembers, monthlyPremium, estimatedCommission } });
});

app.get('/api/troll/groups', (req, res) => res.json(trollGroups));
app.post('/api/troll/groups', (req, res) => {
  const group = {
    id: `G-${++trollGroupSeq}`,
    name: req.body?.name || `Untitled Party ${trollGroupSeq}`,
    location: req.body?.location === 'LOWER_LANDS' ? 'LOWER_LANDS' : 'UPPER_LANDS',
    members: Array.isArray(req.body?.members) ? req.body.members : [],
    agentId: trollAgents.some(agent => agent.id === req.body?.agentId) ? req.body.agentId : trollAgents[0].id,
    status: 'PROSPECT'
  };
  trollGroups.push(group);
  res.status(201).json(group);
});
app.get('/api/troll/groups/:id', (req, res) => {
  const group = trollGroups.find(item => item.id === req.params.id);
  group ? res.json(group) : res.status(404).json({ error: 'Party not found' });
});

app.post('/api/troll/rating/calculate', (req, res) => {
  try {
    res.json(trollRateQuote({
      groupName: req.body?.groupName || 'Unnamed Party',
      location: req.body?.location === 'LOWER_LANDS' ? 'LOWER_LANDS' : 'UPPER_LANDS',
      members: req.body?.members || [],
      products: Array.isArray(req.body?.products) ? req.body.products : ['TROLL'],
      planCode: req.body?.planCode || 'IRON',
      guildContributionPct: req.body?.guildContributionPct,
      waitingPeriodDays: req.body?.waitingPeriodDays
    }));
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/troll/quotes', (req, res) => res.json(trollQuotes));
app.post('/api/troll/quotes', (req, res) => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt); expiresAt.setDate(expiresAt.getDate() + 30);
  const quote = {
    id: `Q-${++trollQuoteSeq}`,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString().slice(0, 10),
    status: 'RATED',
    ...req.body
  };
  trollQuotes.push(quote);
  res.status(201).json(quote);
});
app.get('/api/troll/quotes/:id', (req, res) => {
  const quote = trollQuotes.find(item => item.id === req.params.id);
  quote ? res.json(quote) : res.status(404).json({ error: 'Quote not found' });
});

app.get('/api/troll/enrollments', (req, res) => res.json(trollEnrollments));
app.post('/api/troll/enrollments', (req, res) => {
  const quote = trollQuotes.find(item => item.id === req.body?.quoteId);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  let group = trollGroups.find(item => item.id === quote.groupId);
  if (!group) return res.status(404).json({ error: 'Party not found' });
  group.status = 'ACTIVE';
  quote.status = 'ACCEPTED';
  const enrollment = {
    id: `E-${++trollEnrollmentSeq}`,
    quoteId: quote.id,
    groupId: group.id,
    status: 'ACTIVE',
    effectiveDate: quote.effectiveDate,
    grossPremium: quote.grossPremium,
    guildContribution: quote.guildContribution,
    adventurerContribution: quote.adventurerContribution,
    plan: quote.plan,
    products: quote.products,
    memberLines: quote.memberLines.map(line => ({ ...line, enrollmentStatus: line.election === 'ENROLL' ? 'ACTIVE' : line.election }))
  };
  trollEnrollments.push(enrollment);
  res.status(201).json(enrollment);
});
app.get('/api/troll/enrollments/:id', (req, res) => {
  const enrollment = trollEnrollments.find(item => item.id === req.params.id);
  enrollment ? res.json(enrollment) : res.status(404).json({ error: 'Enrollment not found' });
});

function trollClaimSharePct(enrollment, productCode) {
  if (productCode === 'TROLL') return Number(enrollment.plan?.battleCostSharePct || 20);
  if (productCode === 'GOBLIN') return 20;
  if (productCode === 'DRAGON') return 10;
  return 20;
}

function trollAccumulatorKey(enrollmentId, memberId) { return `${enrollmentId}:${memberId}`; }
function trollGetAccumulator(enrollment, member) {
  const key = trollAccumulatorKey(enrollment.id, member.memberId);
  if (!trollAccumulators.has(key)) trollAccumulators.set(key, { enrollmentId: enrollment.id, memberId: member.memberId, memberName: member.name, deductibleMet: 0, outOfPocket: 0, trollSurePaid: 0 });
  return trollAccumulators.get(key);
}

function trollCreateClaim(input) {
  const enrollment = trollEnrollments.find(item => item.id === input.enrollmentId);
  if (!enrollment) throw new Error('Enrollment not found');
  const member = enrollment.memberLines.find(item => item.memberId === input.memberId);
  if (!member || member.enrollmentStatus !== 'ACTIVE') throw new Error('Adventurer does not have active coverage');
  const coverage = member.coverage.find(item => item.code === input.productCode);
  if (!coverage) throw new Error('Selected protection is not active for this adventurer');

  const submittedCharge = Math.max(0, Number(input.submittedCharge || 0));
  const provider = trollProviders.find(item => item.id === input.providerId) || trollProviders.find(item => item.name === input.healerName) || trollProviders[0];
  const allowedCharge = trollRound(submittedCharge * Number(provider.allowedPct || 85) / 100);
  const accumulator = trollGetAccumulator(enrollment, member);
  const deductibleTotal = Number(coverage.deductible || 0);
  const deductibleRemainingBefore = trollRound(Math.max(0, deductibleTotal - accumulator.deductibleMet));
  const deductibleApplied = trollRound(Math.min(deductibleRemainingBefore, allowedCharge));
  const postDeductible = trollRound(Math.max(0, allowedCharge - deductibleApplied));
  const battleCostSharePct = trollClaimSharePct(enrollment, input.productCode);
  const rawBattleCostShare = trollRound(postDeductible * battleCostSharePct / 100);
  const maxQuestBurden = input.productCode === 'TROLL' ? Number(enrollment.plan?.maxQuestBurden || 6000) : 999999;
  const burdenRemainingBefore = trollRound(Math.max(0, maxQuestBurden - accumulator.outOfPocket));
  const adventurerOwes = trollRound(Math.min(burdenRemainingBefore, deductibleApplied + rawBattleCostShare));
  const battleCostShare = trollRound(Math.max(0, adventurerOwes - deductibleApplied));
  const trollSurePays = trollRound(Math.max(0, allowedCharge - adventurerOwes));
  accumulator.deductibleMet = trollRound(accumulator.deductibleMet + deductibleApplied);
  accumulator.outOfPocket = trollRound(accumulator.outOfPocket + adventurerOwes);
  accumulator.trollSurePaid = trollRound(accumulator.trollSurePaid + trollSurePays);

  return {
    id: `C-${++trollClaimSeq}`,
    enrollmentId: enrollment.id,
    groupId: enrollment.groupId,
    memberId: member.memberId,
    memberName: member.name,
    productCode: coverage.code,
    productName: coverage.name,
    incidentType: String(input.incidentType || 'Quest mishap'),
    healerName: provider.name,
    providerId: provider.id,
    providerNetwork: provider.network,
    incidentDate: String(input.incidentDate || new Date().toISOString().slice(0, 10)),
    submittedAt: new Date().toISOString(),
    status: 'APPROVED',
    submittedCharge: trollRound(submittedCharge),
    allowedCharge,
    deductibleApplied,
    battleCostSharePct,
    battleCostShare,
    trollSurePays,
    adventurerOwes,
    deductibleRemaining: trollRound(Math.max(0, deductibleTotal - accumulator.deductibleMet)),
    outOfPocketYtd: accumulator.outOfPocket,
    maxQuestBurden,
    trollSurePaidYtd: accumulator.trollSurePaid
  };
}

function trollDocEscape(value) {
  return String(value ?? '').replace(/[&<>\"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' }[c]));
}
function trollDocCoins(value) {
  const tenths = Math.round(Number(value || 0) * 10);
  const gp = Math.floor(tenths / 10); const sp = tenths % 10;
  return sp ? `${gp} gp ${sp} sp` : `${gp} gp`;
}
function trollScrollHtml({ title, subtitle, badge, sections }) {
  const sectionHtml = sections.map(section => `<section class="sheet-section"><h2>${trollDocEscape(section.title)}</h2>${section.html}</section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${trollDocEscape(title)}</title><style>
    :root{--ink:#242019;--muted:#6d6252;--line:#9f8f77;--paper:#fbf7ec;--panel:#fffdf7;--accent:#5f3e2c}
    *{box-sizing:border-box}body{margin:0;background:#e9e1d2;color:var(--ink);font-family:Georgia,'Times New Roman',serif}.toolbar{position:sticky;top:0;background:#242019;color:white;padding:10px 16px;text-align:center}.toolbar button{border:0;border-radius:8px;padding:9px 14px;font-weight:700;cursor:pointer}.sheet{width:min(920px,calc(100% - 32px));margin:28px auto;background:var(--paper);border:2px solid var(--ink);padding:26px;box-shadow:0 18px 50px rgba(0,0,0,.18)}.crest{display:grid;grid-template-columns:1fr auto;gap:18px;border-bottom:3px double var(--ink);padding-bottom:18px}.eyebrow{font:700 12px/1.2 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}h1{font-size:34px;margin:5px 0 4px}.subtitle{color:var(--muted)}.badge{border:2px solid var(--ink);padding:12px 16px;align-self:center;text-align:center;font:800 13px/1.2 Arial,sans-serif;letter-spacing:.12em}.sheet-section{margin-top:20px}.sheet-section h2{font-size:15px;text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid var(--line);padding-bottom:6px}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stat{border:1px solid var(--line);background:var(--panel);padding:10px;min-height:68px}.stat span{display:block;font:700 10px/1.2 Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}.stat strong{display:block;margin-top:6px;font-size:16px}.rows{border:1px solid var(--line);background:var(--panel)}.row{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:10px;padding:9px 10px;border-top:1px solid #d8cfbf}.row:first-child{border-top:0}.row.header{font:700 10px/1.2 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.note{border:1px dashed var(--line);padding:11px;background:#f8f1e4;color:var(--muted)}footer{margin-top:26px;padding-top:12px;border-top:3px double var(--ink);font-size:12px;color:var(--muted)}
    @media(max-width:700px){.stat-grid{grid-template-columns:1fr 1fr}.row{grid-template-columns:1fr 1fr}.crest{grid-template-columns:1fr}}@media print{body{background:white}.toolbar{display:none}.sheet{width:100%;margin:0;box-shadow:none;border:0;padding:18px}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div><main class="sheet"><header class="crest"><div><div class="eyebrow">TrollSure · Official Guild Scroll</div><h1>${trollDocEscape(title)}</h1><div class="subtitle">${trollDocEscape(subtitle)}</div></div><div class="badge">${trollDocEscape(badge)}</div></header>${sectionHtml}<footer>Entirely fictional fantasy benefits document. No actual insurance coverage exists. Generated by Lowry Lab TrollSure.</footer></main></body></html>`;
}



app.get('/api/troll/providers', (req, res) => res.json(trollProviders));
app.get('/api/troll/formulary', (req, res) => res.json(trollFormulary));
app.get('/api/troll/accumulators/:enrollmentId/:memberId', (req, res) => {
  const enrollment = trollEnrollments.find(item => item.id === req.params.enrollmentId);
  const member = enrollment?.memberLines.find(item => item.memberId === req.params.memberId);
  if (!enrollment || !member) return res.status(404).json({ error: 'Covered adventurer not found' });
  res.json(trollGetAccumulator(enrollment, member));
});
app.get('/api/troll/operations', (req, res) => res.json(trollOperations));
app.post('/api/troll/operations', (req, res) => {
  try {
    const type = String(req.body?.type || '').toUpperCase();
    const enrollment = trollEnrollments.find(item => item.id === req.body?.enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    const group = trollGroups.find(item => item.id === enrollment.groupId);
    const member = enrollment.memberLines.find(item => item.memberId === req.body?.memberId) || enrollment.memberLines.find(item => item.enrollmentStatus === 'ACTIVE');
    const details = {};
    let status = 'COMPLETED'; let message = '';
    if (type === 'PRIOR_AUTH') {
      const service = String(req.body?.serviceCode || 'CURSED_LIMB_REGENERATION');
      const denied = service === 'DISCOUNT_RESURRECTION';
      status = denied ? 'DENIED' : 'APPROVED';
      message = denied ? 'Out-of-guild discount resurrection is not approved. Please choose a credentialed cleric.' : 'Royal Pre-Approval granted before the quest service is performed.';
      Object.assign(details, { serviceCode: service, memberName: member?.name, authorizationNumber: `RA-${Date.now().toString().slice(-6)}` });
    } else if (type === 'POTION_FILL') {
      const potion = trollFormulary.find(item => item.code === req.body?.serviceCode) || trollFormulary[0];
      status = potion.status === 'NOT_COVERED' ? 'DENIED' : potion.status === 'PRIOR_AUTH' ? 'PENDING_AUTH' : 'APPROVED';
      message = status === 'APPROVED' ? `Potion covered for ${trollDocCoins(potion.copay)}.` : status === 'PENDING_AUTH' ? 'Potion requires Royal Pre-Approval.' : 'Potion is excluded from the guild formulary.';
      Object.assign(details, potion);
    } else if (type === 'LIFE_EVENT') {
      const eventType = String(req.body?.eventType || 'NEW_PARTY_MEMBER');
      if (member && eventType === 'NEW_PARTY_MEMBER') member.dependents = Number(member.dependents || 0) + 1;
      status = 'SPECIAL_ENROLLMENT_OPEN'; message = 'A 30-day special enrollment window has opened.';
      Object.assign(details, { eventType, memberName: member?.name, dependents: member?.dependents });
    } else if (type === 'OPEN_ENROLLMENT') {
      const nextPlan = trollPlan(req.body?.planCode || 'MITHRIL');
      status = 'ELECTION_RECORDED'; message = `Next plan year election recorded for ${nextPlan.name}.`;
      Object.assign(details, { currentPlan: enrollment.plan?.name, nextPlan: nextPlan.name, effectiveDate: trollEffectiveDate(0) });
    } else if (type === 'RENEWAL') {
      const increasePct = 6.25; const renewalPremium = trollRound(enrollment.grossPremium * 1.0625);
      status = 'RENEWAL_OFFERED'; message = 'Renewal offer generated for the next guild plan year.';
      Object.assign(details, { currentPremium: enrollment.grossPremium, renewalPremium, increasePct, currentPlan: enrollment.plan?.name });
    } else if (type === 'APPEAL') {
      const claim = trollClaims.find(item => item.id === req.body?.claimId) || trollClaims.filter(item => item.enrollmentId === enrollment.id).slice(-1)[0];
      if (!claim) throw new Error('No claim available to appeal');
      status = 'UNDER_ARCANE_REVIEW'; message = 'Petition accepted by the High Council. A different adjudicator will review the claim.';
      Object.assign(details, { claimId: claim.id, originalStatus: claim.status, reason: String(req.body?.notes || 'Adventurer disputes the rune math.') });
    } else if (type === 'BILLING') {
      const due = trollRound(enrollment.grossPremium); status = 'STATEMENT_READY'; message = 'Monthly guild premium statement generated.';
      Object.assign(details, { grossPremium: due, guildContribution: enrollment.guildContribution, adventurerContribution: enrollment.adventurerContribution, dueDate: new Date(Date.now()+14*86400000).toISOString().slice(0,10) });
    } else if (type === 'CONTINUATION') {
      const base = member?.grossPremium || 0; const continuationPremium = trollRound(base * 1.02);
      status = 'CONTINUATION_OFFERED'; message = 'Former adventurer may continue protection for 18 moon cycles at full cost plus a 2% administrative rune fee.';
      Object.assign(details, { memberName: member?.name, monthlyPremium: continuationPremium, electionWindowDays: 60, durationMonths: 18 });
    } else throw new Error('Unknown benefit operation');
    const record = { id: `OP-${++trollOperationSeq}`, type, enrollmentId: enrollment.id, groupId: group?.id, memberId: member?.memberId, status, message, details, createdAt: new Date().toISOString() };
    trollOperations.push(record); res.status(201).json(record);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/troll/claims', (req, res) => res.json(trollClaims));
app.post('/api/troll/claims', (req, res) => {
  try {
    const claim = trollCreateClaim(req.body || {});
    trollClaims.push(claim);
    res.status(201).json(claim);
  } catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/troll/claims/:id', (req, res) => {
  const claim = trollClaims.find(item => item.id === req.params.id);
  claim ? res.json(claim) : res.status(404).json({ error: 'Claim not found' });
});

app.get('/api/troll/documents/enrollment/:id', (req, res) => {
  const enrollment = trollEnrollments.find(item => item.id === req.params.id);
  if (!enrollment) return res.status(404).send('Enrollment not found');
  const group = trollGroups.find(item => item.id === enrollment.groupId);
  const members = enrollment.memberLines.filter(item => item.enrollmentStatus === 'ACTIVE');
  const coverageRows = members.map(member => `<div class="row"><strong>${trollDocEscape(member.name)}</strong><span>${trollDocEscape(member.eligibilityName)}</span><span>${trollDocEscape(member.coverage.map(c => c.name).join(', '))}</span><span>${trollDocCoins(member.grossPremium)}/mo</span></div>`).join('');
  const html = trollScrollHtml({
    title: 'Guild Coverage Certificate', subtitle: `${group?.name || enrollment.groupId} · Enrollment ${enrollment.id}`, badge: 'ACTIVE COVERAGE',
    sections: [
      { title: 'Party Profile', html: `<div class="stat-grid"><div class="stat"><span>Guild</span><strong>${trollDocEscape(group?.name || enrollment.groupId)}</strong></div><div class="stat"><span>Enrollment</span><strong>${enrollment.id}</strong></div><div class="stat"><span>Effective Date</span><strong>${enrollment.effectiveDate}</strong></div><div class="stat"><span>Plan</span><strong>${trollDocEscape(enrollment.plan?.name || 'Unknown')}</strong></div></div>` },
      { title: 'Shield Statistics', html: `<div class="stat-grid"><div class="stat"><span>Deductible</span><strong>${trollDocCoins(enrollment.plan?.deductible)}</strong></div><div class="stat"><span>Battle Cost Share</span><strong>${enrollment.plan?.battleCostSharePct || 0}%</strong></div><div class="stat"><span>Max Quest Burden</span><strong>${trollDocCoins(enrollment.plan?.maxQuestBurden)}</strong></div><div class="stat"><span>Guild Premium</span><strong>${trollDocCoins(enrollment.grossPremium)}/mo</strong></div></div>` },
      { title: 'Covered Adventurers', html: `<div class="rows"><div class="row header"><span>Adventurer</span><span>Class</span><span>Protections</span><span>Monthly Rate</span></div>${coverageRows}</div>` },
      { title: 'Important Rune', html: `<div class="note">This fantasy certificate summarizes current TrollSure demo enrollment. It is intentionally styled like a character sheet, but the values come from the same enrollment record used by the application.</div>` }
    ]
  });
  res.type('html').send(html);
});

app.get('/api/troll/documents/claim/:id', (req, res) => {
  const claim = trollClaims.find(item => item.id === req.params.id);
  if (!claim) return res.status(404).send('Claim not found');
  const html = trollScrollHtml({
    title: 'Claim Determination Scroll', subtitle: `${claim.memberName} · Claim ${claim.id}`, badge: claim.status,
    sections: [
      { title: 'Encounter Record', html: `<div class="stat-grid"><div class="stat"><span>Adventurer</span><strong>${trollDocEscape(claim.memberName)}</strong></div><div class="stat"><span>Protection</span><strong>${trollDocEscape(claim.productName)}</strong></div><div class="stat"><span>Incident</span><strong>${trollDocEscape(claim.incidentType)}</strong></div><div class="stat"><span>Healer / Vendor</span><strong>${trollDocEscape(claim.healerName)}</strong></div></div>` },
      { title: 'Adjudication', html: `<div class="stat-grid"><div class="stat"><span>Submitted Charge</span><strong>${trollDocCoins(claim.submittedCharge)}</strong></div><div class="stat"><span>Guild-Allowed Charge</span><strong>${trollDocCoins(claim.allowedCharge)}</strong></div><div class="stat"><span>Deductible Applied</span><strong>${trollDocCoins(claim.deductibleApplied)}</strong></div><div class="stat"><span>Battle Cost Share</span><strong>${claim.battleCostSharePct}% · ${trollDocCoins(claim.battleCostShare)}</strong></div></div>` },
      { title: 'Final Responsibility', html: `<div class="stat-grid"><div class="stat"><span>TrollSure Pays</span><strong>${trollDocCoins(claim.trollSurePays)}</strong></div><div class="stat"><span>Adventurer Owes</span><strong>${trollDocCoins(claim.adventurerOwes)}</strong></div><div class="stat"><span>Incident Date</span><strong>${claim.incidentDate}</strong></div><div class="stat"><span>Status</span><strong>${claim.status}</strong></div></div>` },
      { title: 'Adjudicator Note', html: `<div class="note">For demo simplicity, the guild-allowed charge is 85% of the submitted charge and this claim applies the full deductible before Battle Cost Share. Accumulator logic can be added in a later version.</div>` }
    ]
  });
  res.type('html').send(html);
});


app.get('/api/troll/documents/member-card/:enrollmentId/:memberId', (req, res) => {
  const enrollment = trollEnrollments.find(item => item.id === req.params.enrollmentId);
  if (!enrollment) return res.status(404).send('Enrollment not found');
  const member = enrollment.memberLines.find(item => item.memberId === req.params.memberId);
  if (!member || member.enrollmentStatus !== 'ACTIVE') return res.status(404).send('Active adventurer not found');
  const group = trollGroups.find(item => item.id === enrollment.groupId);
  const coverage = (member.coverage || []).map(item => item.name).join(' · ');
  const html = trollScrollHtml({
    title: 'Adventurer Benefit Card', subtitle: `${member.name} · Member ${member.memberId}`, badge: enrollment.plan?.name || 'ACTIVE',
    sections: [
      { title: 'Identity', html: `<div class="stat-grid"><div class="stat"><span>Adventurer</span><strong>${trollDocEscape(member.name)}</strong></div><div class="stat"><span>Guild</span><strong>${trollDocEscape(group?.name || enrollment.groupId)}</strong></div><div class="stat"><span>Member ID</span><strong>${member.memberId}</strong></div><div class="stat"><span>Effective</span><strong>${enrollment.effectiveDate}</strong></div></div>` },
      { title: 'Protection Stats', html: `<div class="stat-grid"><div class="stat"><span>Shield</span><strong>${trollDocEscape(enrollment.plan?.name || 'Unknown')}</strong></div><div class="stat"><span>Deductible</span><strong>${trollDocCoins(enrollment.plan?.deductible)}</strong></div><div class="stat"><span>Battle Cost Share</span><strong>${enrollment.plan?.battleCostSharePct || 0}%</strong></div><div class="stat"><span>Max Quest Burden</span><strong>${trollDocCoins(enrollment.plan?.maxQuestBurden)}</strong></div></div>` },
      { title: 'Active Protections', html: `<div class="note">${trollDocEscape(coverage || 'Troll Insurance')}</div>` },
      { title: 'Healer Instructions', html: `<div class="note">Present this card to participating guild healers, potion merchants, singe specialists, or suspiciously credentialed clerics. This is a fictional demo card and has absolutely no real-world insurance value.</div>` }
    ]
  });
  res.type('html').send(html);
});

app.get('/api/troll/documents/eob/:id', (req, res) => {
  const claim = trollClaims.find(item => item.id === req.params.id);
  if (!claim) return res.status(404).send('Claim not found');
  const enrollment = trollEnrollments.find(item => item.id === claim.enrollmentId);
  const group = trollGroups.find(item => item.id === claim.groupId);
  const html = trollScrollHtml({
    title: 'Explanation of Battle Benefits', subtitle: `${claim.memberName} · Claim ${claim.id}`, badge: 'NOT A BILL',
    sections: [
      { title: 'Quest Event', html: `<div class="stat-grid"><div class="stat"><span>Adventurer</span><strong>${trollDocEscape(claim.memberName)}</strong></div><div class="stat"><span>Guild</span><strong>${trollDocEscape(group?.name || claim.groupId)}</strong></div><div class="stat"><span>Healer / Vendor</span><strong>${trollDocEscape(claim.healerName)}</strong></div><div class="stat"><span>Protection</span><strong>${trollDocEscape(claim.productName)}</strong></div></div>` },
      { title: 'How the Coin Was Counted', html: `<div class="stat-grid"><div class="stat"><span>Healer Charged</span><strong>${trollDocCoins(claim.submittedCharge)}</strong></div><div class="stat"><span>Guild Allowed</span><strong>${trollDocCoins(claim.allowedCharge)}</strong></div><div class="stat"><span>Deductible</span><strong>${trollDocCoins(claim.deductibleApplied)}</strong></div><div class="stat"><span>Battle Cost Share</span><strong>${claim.battleCostSharePct}% · ${trollDocCoins(claim.battleCostShare)}</strong></div></div>` },
      { title: 'Final Responsibility', html: `<div class="stat-grid"><div class="stat"><span>TrollSure Paid</span><strong>${trollDocCoins(claim.trollSurePays)}</strong></div><div class="stat"><span>You May Owe</span><strong>${trollDocCoins(claim.adventurerOwes)}</strong></div><div class="stat"><span>Deductible Remaining</span><strong>${trollDocCoins(claim.deductibleRemaining)}</strong></div><div class="stat"><span>Quest Burden YTD</span><strong>${trollDocCoins(claim.outOfPocketYtd)}</strong></div></div>` },
      { title: 'Plan Year Totals', html: `<div class="stat-grid"><div class="stat"><span>Max Quest Burden</span><strong>${trollDocCoins(claim.maxQuestBurden)}</strong></div><div class="stat"><span>TrollSure Paid YTD</span><strong>${trollDocCoins(claim.trollSurePaidYtd)}</strong></div><div class="stat"><span>Plan</span><strong>${trollDocEscape(enrollment?.plan?.name || 'Unknown')}</strong></div><div class="stat"><span>Status</span><strong>${claim.status}</strong></div></div>` },
      { title: 'Important Rune', html: `<div class="note"><strong>This is not a bill.</strong> It explains how TrollSure processed this fictional claim. If you disagree, please submit a Petition to the High Council once that feature exists.</div>` }
    ]
  });
  res.type('html').send(html);
});


async function trollInternalGet(path, trace, caller) {
  trace.push(`${caller} → REST GET ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
  if (!response.ok) throw new Error(`REST GET failed: ${path}`);
  return response.json();
}
async function trollInternalPost(path, body, trace, caller) {
  trace.push(`${caller} → REST POST ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`REST POST failed: ${path}`);
  return response.json();
}

// REST BFF ------------------------------------------------------------------
app.post('/api/troll/bff/quote', async (req, res) => {
  try {
    const trace = ['UI → REST BFF: POST /api/troll/bff/quote'];
    const group = await trollInternalPost('/api/troll/groups', { name: req.body?.groupName, location: req.body?.location, members: req.body?.members, agentId: req.body?.agentId }, trace, 'REST BFF');
    const rating = await trollInternalPost('/api/troll/rating/calculate', { ...req.body, groupName: group.name, location: group.location, members: group.members }, trace, 'REST BFF');
    const quote = await trollInternalPost('/api/troll/quotes', { ...rating, groupId: group.id, agentId: group.agentId }, trace, 'REST BFF');
    trace.push('REST BFF composed group + rating + quote → UI');
    res.status(201).json({ quote, trace, backendCallCount: 3 });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/troll/bff/enroll', async (req, res) => {
  try {
    const trace = ['UI → REST BFF: POST /api/troll/bff/enroll'];
    const enrollment = await trollInternalPost('/api/troll/enrollments', { quoteId: req.body?.quoteId }, trace, 'REST BFF');
    const group = await trollInternalGet(`/api/troll/groups/${enrollment.groupId}`, trace, 'REST BFF');
    trace.push('REST BFF composed enrollment + group → UI');
    res.status(201).json({ enrollment, group, trace, backendCallCount: 2 });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/troll/bff/claims', async (req, res) => {
  try {
    const trace = ['UI → REST BFF: POST /api/troll/bff/claims'];
    const enrollment = await trollInternalGet(`/api/troll/enrollments/${req.body?.enrollmentId}`, trace, 'REST BFF');
    const claim = await trollInternalPost('/api/troll/claims', req.body || {}, trace, 'REST BFF');
    trace.push('REST BFF composed enrollment validation + claim adjudication → UI');
    res.status(201).json({ claim, enrollment, trace, backendCallCount: 2 });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/troll/bff/groups/:id', async (req, res) => {
  try {
    const trace = [`UI → REST BFF: GET /api/troll/bff/groups/${req.params.id}`];
    const group = await trollInternalGet(`/api/troll/groups/${req.params.id}`, trace, 'REST BFF');
    const quotes = await trollInternalGet('/api/troll/quotes', trace, 'REST BFF');
    const enrollments = await trollInternalGet('/api/troll/enrollments', trace, 'REST BFF');
    const quote = [...quotes].reverse().find(item => item.groupId === group.id) || null;
    const enrollment = [...enrollments].reverse().find(item => item.groupId === group.id) || null;
    trace.push('REST BFF composed group + quote + enrollment → UI');
    res.json({ group, quote, enrollment, trace, backendCallCount: 3 });
  } catch (error) { res.status(404).json({ error: error.message }); }
});

app.get('/api/troll/bff/agents/:id', async (req, res) => {
  try {
    const trace = [`UI → REST BFF: GET /api/troll/bff/agents/${req.params.id}`];
    const book = await trollInternalGet(`/api/troll/agents/${req.params.id}`, trace, 'REST BFF');
    trace.push('REST BFF returned agent book of business → UI');
    res.json({ ...book, trace, backendCallCount: 1 });
  } catch (error) { res.status(404).json({ error: error.message }); }
});


app.get('/api/troll/bff/operations/catalog', async (req, res) => {
  try {
    const trace = ['UI → REST BFF: GET /api/troll/bff/operations/catalog'];
    const providers = await trollInternalGet('/api/troll/providers', trace, 'REST BFF');
    const formulary = await trollInternalGet('/api/troll/formulary', trace, 'REST BFF');
    trace.push('REST BFF composed provider network + potion formulary → UI');
    res.json({ providers, formulary, trace, backendCallCount: 2 });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/troll/bff/operations', async (req, res) => {
  try {
    const trace = ['UI → REST BFF: POST /api/troll/bff/operations'];
    const enrollment = await trollInternalGet(`/api/troll/enrollments/${req.body?.enrollmentId}`, trace, 'REST BFF');
    const operation = await trollInternalPost('/api/troll/operations', req.body || {}, trace, 'REST BFF');
    trace.push('REST BFF composed enrollment validation + benefit operation → UI');
    res.status(201).json({ operation, enrollment, trace, backendCallCount: 2 });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// GraphQL facade -------------------------------------------------------------
const trollSchema = buildSchema(`
  enum TrollLocation { UPPER_LANDS LOWER_LANDS }
  enum TrollProductCode { TROLL GOBLIN DRAGON }
  enum TrollPlanCode { WOOD IRON MITHRIL }
  enum EligibilityClass { GUILDMASTER FULL_TIME APPRENTICE SEASONAL }
  enum CoverageElection { ENROLL WAIVE }
  type ProductRate { code: String!, name: String!, deductible: Float, baseRate: Float!, adjustedRate: Float! }
  type TrollPlan { code: String!, name: String!, rateMultiplier: Float!, deductible: Float!, battleCostSharePct: Float!, maxQuestBurden: Float! }
  type TrollProduct { code: String!, name: String!, kind: String!, deductible: Float }
  type MemberQuote { memberId: String!, name: String!, dependents: Int!, tier: String!, eligibilityClass: String!, eligibilityName: String!, eligible: Boolean!, election: String!, orcLiverUse: Boolean!, grossPremium: Float!, guildContribution: Float!, adventurerContribution: Float!, coverage: [ProductRate!]! }
  type Quote { id: ID!, groupId: ID!, groupName: String!, location: String!, groupClass: String!, memberCount: Int!, eligibleMemberCount: Int!, dependentCount: Int!, locationAdjustmentPct: Float!, largeGroupDiscountPct: Float!, orcLiverUseAdjustmentPct: Float!, guildContributionPct: Float!, waitingPeriodDays: Int!, effectiveDate: String!, expiresAt: String!, status: String!, grossPremium: Float!, guildContribution: Float!, adventurerContribution: Float!, monthlyPremium: Float!, plan: TrollPlan!, products: [TrollProduct!]!, memberLines: [MemberQuote!]! }
  type Enrollment { id: ID!, quoteId: ID!, groupId: ID!, status: String!, effectiveDate: String!, grossPremium: Float!, guildContribution: Float!, adventurerContribution: Float!, plan: TrollPlan, products: [TrollProduct!], memberLines: [MemberQuote!] }
  type Claim { id: ID!, enrollmentId: ID!, groupId: ID!, memberId: ID!, memberName: String!, productCode: String!, productName: String!, incidentType: String!, healerName: String!, providerId: String, providerNetwork: String, incidentDate: String!, status: String!, submittedCharge: Float!, allowedCharge: Float!, deductibleApplied: Float!, battleCostSharePct: Float!, battleCostShare: Float!, trollSurePays: Float!, adventurerOwes: Float!, deductibleRemaining: Float, outOfPocketYtd: Float, maxQuestBurden: Float, trollSurePaidYtd: Float }
  type ClaimPayload { claim: Claim!, enrollment: Enrollment!, trace: [String!]!, backendCallCount: Int! }
  type Provider { id: ID!, name: String!, network: String!, specialty: String!, allowedPct: Float! }
  type Potion { code: String!, name: String!, tier: Int!, copay: Float!, status: String! }
  type OperationsCatalog { providers: [Provider!]!, formulary: [Potion!]!, trace: [String!]!, backendCallCount: Int! }
  type Operation { id: ID!, type: String!, enrollmentId: ID!, groupId: ID, memberId: ID, status: String!, message: String!, detailsJson: String!, createdAt: String! }
  type OperationPayload { operation: Operation!, enrollment: Enrollment!, trace: [String!]!, backendCallCount: Int! }
  type Group { id: ID!, name: String!, location: String!, status: String!, agentId: ID }
  type Agent { id: ID!, name: String!, title: String!, region: String!, commissionPct: Float! }
  type AgentMetrics { groups: Int!, activeEnrollments: Int!, activeMembers: Int!, monthlyPremium: Float!, estimatedCommission: Float! }
  type AgentBook { agent: Agent!, groups: [Group!]!, enrollments: [Enrollment!]!, metrics: AgentMetrics!, trace: [String!]!, backendCallCount: Int! }
  type QuotePayload { quote: Quote!, trace: [String!]!, backendCallCount: Int! }
  type EnrollmentPayload { enrollment: Enrollment!, group: Group!, trace: [String!]!, backendCallCount: Int! }
  type GroupPayload { group: Group!, quote: Quote, enrollment: Enrollment, trace: [String!]!, backendCallCount: Int! }
  input MemberInput { id: ID, name: String!, dependents: Int!, eligibilityClass: EligibilityClass!, election: CoverageElection!, orcLiverUse: Boolean! }
  input QuoteInput { groupName: String!, location: TrollLocation!, members: [MemberInput!]!, products: [TrollProductCode!]!, planCode: TrollPlanCode!, guildContributionPct: Float!, waitingPeriodDays: Int!, agentId: ID }
  input ClaimInput { enrollmentId: ID!, memberId: ID!, productCode: TrollProductCode!, incidentType: String!, healerName: String!, incidentDate: String!, submittedCharge: Float! }
  input OperationInput { enrollmentId: ID!, memberId: ID, type: String!, serviceCode: String, eventType: String, planCode: String, claimId: ID, notes: String }
  type Query { trollGroup(id: ID!): GroupPayload!, trollAgent(id: ID!): AgentBook!, trollOperationsCatalog: OperationsCatalog! }
  type Mutation { createTrollQuote(input: QuoteInput!): QuotePayload!, enrollTrollQuote(quoteId: ID!): EnrollmentPayload!, submitTrollClaim(input: ClaimInput!): ClaimPayload!, runTrollOperation(input: OperationInput!): OperationPayload! }
`);

const trollRoot = {
  createTrollQuote: async ({ input }) => {
    const trace = ['UI → GraphQL: mutation createTrollQuote'];
    const group = await trollInternalPost('/api/troll/groups', { name: input.groupName, location: input.location, members: input.members, agentId: input.agentId }, trace, 'GraphQL');
    const rating = await trollInternalPost('/api/troll/rating/calculate', { ...input, groupName: group.name, location: group.location, members: group.members }, trace, 'GraphQL');
    const quote = await trollInternalPost('/api/troll/quotes', { ...rating, groupId: group.id, agentId: group.agentId }, trace, 'GraphQL');
    trace.push('GraphQL resolver composed group + rating + quote → UI');
    return { quote, trace, backendCallCount: 3 };
  },
  enrollTrollQuote: async ({ quoteId }) => {
    const trace = ['UI → GraphQL: mutation enrollTrollQuote'];
    const enrollment = await trollInternalPost('/api/troll/enrollments', { quoteId }, trace, 'GraphQL');
    const group = await trollInternalGet(`/api/troll/groups/${enrollment.groupId}`, trace, 'GraphQL');
    trace.push('GraphQL resolver composed enrollment + group → UI');
    return { enrollment, group, trace, backendCallCount: 2 };
  },
  submitTrollClaim: async ({ input }) => {
    const trace = ['UI → GraphQL: mutation submitTrollClaim'];
    const enrollment = await trollInternalGet(`/api/troll/enrollments/${input.enrollmentId}`, trace, 'GraphQL');
    const claim = await trollInternalPost('/api/troll/claims', input, trace, 'GraphQL');
    trace.push('GraphQL resolver composed enrollment validation + claim adjudication → UI');
    return { claim, enrollment, trace, backendCallCount: 2 };
  },
  runTrollOperation: async ({ input }) => {
    const trace = ['UI → GraphQL: mutation runTrollOperation'];
    const enrollment = await trollInternalGet(`/api/troll/enrollments/${input.enrollmentId}`, trace, 'GraphQL');
    const raw = await trollInternalPost('/api/troll/operations', input, trace, 'GraphQL');
    const operation = { ...raw, detailsJson: JSON.stringify(raw.details || {}) };
    trace.push('GraphQL resolver composed enrollment validation + benefit operation → UI');
    return { operation, enrollment, trace, backendCallCount: 2 };
  },
  trollOperationsCatalog: async () => {
    const trace = ['UI → GraphQL: query trollOperationsCatalog'];
    const providers = await trollInternalGet('/api/troll/providers', trace, 'GraphQL');
    const formulary = await trollInternalGet('/api/troll/formulary', trace, 'GraphQL');
    trace.push('GraphQL resolver composed provider network + potion formulary → UI');
    return { providers, formulary, trace, backendCallCount: 2 };
  },
  trollAgent: async ({ id }) => {
    const trace = ['UI → GraphQL: query trollAgent'];
    const book = await trollInternalGet(`/api/troll/agents/${id}`, trace, 'GraphQL');
    trace.push('GraphQL resolver returned agent book of business → UI');
    return { ...book, trace, backendCallCount: 1 };
  },
  trollGroup: async ({ id }) => {
    const trace = ['UI → GraphQL: query trollGroup'];
    const group = await trollInternalGet(`/api/troll/groups/${id}`, trace, 'GraphQL');
    const quotes = await trollInternalGet('/api/troll/quotes', trace, 'GraphQL');
    const enrollments = await trollInternalGet('/api/troll/enrollments', trace, 'GraphQL');
    const quote = [...quotes].reverse().find(item => item.groupId === id) || null;
    const enrollment = [...enrollments].reverse().find(item => item.groupId === id) || null;
    trace.push('GraphQL resolver composed group + quote + enrollment → UI');
    return { group, quote, enrollment, trace, backendCallCount: 3 };
  }
};
app.all('/troll-graphql', createHandler({ schema: trollSchema, rootValue: trollRoot }));

app.listen(PORT, '0.0.0.0', () => console.log(`Lowry site + Lab running on port ${PORT}`));
