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

app.listen(PORT, '0.0.0.0', () => console.log(`Lowry site + Lab running on port ${PORT}`));
