import express from 'express';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const adventurers = [
  { id: 'a1', kind: 'ADVENTURER', name: 'Brakka Stonehand', level: 7, hitPoints: 62, armorClass: 17, className: 'Barbarian', ancestry: 'Half-Orc', experience: 23000 },
  { id: 'a2', kind: 'ADVENTURER', name: 'Mira Quill', level: 5, hitPoints: 34, armorClass: 15, className: 'Wizard', ancestry: 'Human', experience: 6500 }
];

const monsters = [
  { id: 'm1', kind: 'MONSTER', name: 'Bog Maw', level: 7, hitPoints: 88, armorClass: 14, challengeRating: 5, monsterType: 'Aberration', legendary: false },
  { id: 'm2', kind: 'MONSTER', name: 'Ashscale the Patient', level: 14, hitPoints: 230, armorClass: 20, challengeRating: 13, monsterType: 'Dragon', legendary: true }
];

const battleStats = {
  a1: { initiative: 2, speed: 30 },
  a2: { initiative: 4, speed: 30 },
  m1: { initiative: 1, speed: 25 },
  m2: { initiative: 3, speed: 40 }
};

// ------------------------------
// Existing REST API layer
// ------------------------------
app.get('/api/adventurers/:id', (req, res) => {
  const item = adventurers.find(x => x.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Adventurer not found' });
});

app.get('/api/monsters/:id', (req, res) => {
  const item = monsters.find(x => x.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Monster not found' });
});

app.get('/api/battle-stats/:id', (req, res) => {
  const item = battleStats[req.params.id];
  item ? res.json(item) : res.status(404).json({ error: 'Stats not found' });
});

app.post('/api/adventurers', (req, res) => {
  const id = `a${adventurers.length + 1}`;
  const created = { id, kind: 'ADVENTURER', ...req.body };
  adventurers.push(created);
  battleStats[id] = { initiative: 0, speed: 30 };
  res.status(201).json(created);
});

app.post('/api/monsters', (req, res) => {
  const id = `m${monsters.length + 1}`;
  const created = { id, kind: 'MONSTER', ...req.body };
  monsters.push(created);
  battleStats[id] = { initiative: 0, speed: 30 };
  res.status(201).json(created);
});

// ------------------------------
// GraphQL facade / routing layer
// ------------------------------
const schema = buildSchema(`
  enum CreatureKind { ADVENTURER MONSTER }

  interface Creature {
    id: ID!
    kind: CreatureKind!
    name: String!
    level: Int!
    hitPoints: Int!
    armorClass: Int!
    initiative: Int!
    speed: Int!
  }

  type Adventurer implements Creature {
    id: ID!
    kind: CreatureKind!
    name: String!
    level: Int!
    hitPoints: Int!
    armorClass: Int!
    initiative: Int!
    speed: Int!
    className: String!
    ancestry: String!
    experience: Int!
  }

  type Monster implements Creature {
    id: ID!
    kind: CreatureKind!
    name: String!
    level: Int!
    hitPoints: Int!
    armorClass: Int!
    initiative: Int!
    speed: Int!
    challengeRating: Float!
    monsterType: String!
    legendary: Boolean!
  }

  type CreaturePayload {
    creature: Creature
    routeTrace: [String!]!
  }

  type Query {
    creature(id: ID!): CreaturePayload!
  }

  input CreateCreatureInput {
    kind: CreatureKind!
    name: String!
    level: Int!
    hitPoints: Int!
    armorClass: Int!
    className: String
    ancestry: String
    experience: Int
    challengeRating: Float
    monsterType: String
    legendary: Boolean
  }

  type Mutation {
    createCreature(input: CreateCreatureInput!): CreaturePayload!
  }
`);

async function restGet(path, routeTrace) {
  routeTrace.push(`GraphQL → REST GET ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
  if (!response.ok) return null;
  return response.json();
}

async function restPost(path, body, routeTrace) {
  routeTrace.push(`GraphQL → REST POST ${path}`);
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`REST call failed: ${path}`);
  return response.json();
}

async function hydrateWithSharedStats(creature, routeTrace) {
  if (!creature) return null;
  const stats = await restGet(`/api/battle-stats/${creature.id}`, routeTrace);
  return { ...creature, ...stats, __typename: creature.kind === 'MONSTER' ? 'Monster' : 'Adventurer' };
}

const root = {
  creature: async ({ id }) => {
    const routeTrace = [`UI → GraphQL: creature(id: ${id})`];
    const base = id.startsWith('m')
      ? await restGet(`/api/monsters/${id}`, routeTrace)
      : await restGet(`/api/adventurers/${id}`, routeTrace);
    const creature = await hydrateWithSharedStats(base, routeTrace);
    routeTrace.push('GraphQL combined the REST responses → UI');
    return { creature, routeTrace };
  },

  createCreature: async ({ input }) => {
    const routeTrace = [`UI → GraphQL: createCreature(kind: ${input.kind})`];
    let created;

    if (input.kind === 'MONSTER') {
      created = await restPost('/api/monsters', {
        name: input.name,
        level: input.level,
        hitPoints: input.hitPoints,
        armorClass: input.armorClass,
        challengeRating: input.challengeRating ?? 1,
        monsterType: input.monsterType ?? 'Beast',
        legendary: input.legendary ?? false
      }, routeTrace);
    } else {
      created = await restPost('/api/adventurers', {
        name: input.name,
        level: input.level,
        hitPoints: input.hitPoints,
        armorClass: input.armorClass,
        className: input.className ?? 'Fighter',
        ancestry: input.ancestry ?? 'Human',
        experience: input.experience ?? 0
      }, routeTrace);
    }

    const creature = await hydrateWithSharedStats(created, routeTrace);
    routeTrace.push('GraphQL combined the REST responses → UI');
    return { creature, routeTrace };
  }
};

app.all('/graphql', createHandler({
  schema,
  rootValue: root
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Creature Forge running on port ${PORT}`);
});
