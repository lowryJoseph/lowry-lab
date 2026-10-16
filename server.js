import express from 'express';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';

const app = express();
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
app.listen(PORT, '0.0.0.0', () => console.log(`Lowry site + Lab running on port ${PORT}`));
