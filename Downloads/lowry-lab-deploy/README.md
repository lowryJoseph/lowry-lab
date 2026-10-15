# Lowry Lab

A small Node/Express site that hosts multiple software demos behind one Render deployment.

## Routes

- `/` — Lowry Lab launcher
- `/graphql-demo/` — Creature Forge REST vs GraphQL demo
- `/npc-generator/` — placeholder for the next app
- `/graphql` — GraphQL endpoint used by Creature Forge
- `/api/...` — REST endpoints used by Creature Forge

## Local run

```bash
npm install
npm start
```

Open http://localhost:3000

## Render

The server uses `process.env.PORT || 3000` and listens on `0.0.0.0`, so it is ready for Render.
