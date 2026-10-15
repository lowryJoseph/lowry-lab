# Creature Forge — REST vs GraphQL Routing Demo

A deliberately small D&D-flavored demo showing the *same UI* running in two architectures:

1. **Direct REST** — the browser knows which backend endpoints exist, chooses them, makes multiple calls, and merges responses.
2. **GraphQL Router** — the browser sends one domain-shaped request to GraphQL; GraphQL routes to the same existing REST APIs and composes their responses.

The point is not that REST is bad or GraphQL is magic. The point is **where the knowledge of backend structure lives**.

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000

## Best demo flow

1. Leave **GraphQL Router** selected.
2. Pick Monster and click **Summon Creature**.
3. Point out:
   - 1 UI business request
   - 0 backend-routing decisions in the UI
   - 2 REST calls still happen underneath
4. Toggle to **Direct REST** and summon again.
5. Point out:
   - 2 UI business requests
   - the UI now knows which type endpoint to use
   - the UI also knows it needs battle stats and must merge the result
6. Click **Load existing dragon (m2)** in both modes for the same comparison on reads.

## Layperson analogy

**Direct REST:** every customer has to know the warehouse layout and walk to each shelf themselves.

**GraphQL facade:** the customer asks a service desk for a Creature. The service desk knows the warehouse layout and gathers the pieces. The warehouse can remain exactly where it is.

## REST endpoints

- `GET /api/adventurers/:id`
- `POST /api/adventurers`
- `GET /api/monsters/:id`
- `POST /api/monsters`
- `GET /api/battle-stats/:id`

## GraphQL endpoint

- `POST /graphql`

GraphQL does **not** replace those REST APIs in this demo. Its resolvers call them.

## How this maps to a real system

The creature types are intentionally analogous to two related market/customer segments:

- both need a shared set of fields and behavior;
- one segment needs extra data the other does not;
- existing APIs can remain useful;
- a facade can keep the UI from accumulating `if segment X, call A/B/C; if segment Y, call A/B/D` orchestration.

That makes it possible to evolve the consumer-facing contract without immediately rewriting the backend.
