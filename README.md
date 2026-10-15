# Lowry Lab

Personal site + demo lab hosted on one Render Node service.

## Routes
- `lowryjoseph.com` — personal homepage
- `apps.lowryjoseph.com` — Lowry Lab launcher
- `/graphql-demo/` — Creature Forge: REST vs GraphQL growth demo
- `/npc-generator/` — Fantasy Character Forge

## Creature Forge v5
The GraphQL demo now tells a product-growth story across six stages. It includes:
- Direct REST vs GraphQL facade toggle
- Management vs Developer explanation toggle
- Adventurer, Monster, and Boss Monster segments
- Progressive requirements: stats, abilities, equipment, legendary actions, loot, phases, lair actions
- Live dependency diagram and complexity meter
- "Product added another requirement" simulator
- Real REST calls reused under GraphQL
- Live trace, consumer request count, routing decisions, backend call count, and integration-point count

Run locally:
```bash
npm install
npm start
```
