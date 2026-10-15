# Lowry Site + Lowry Lab

One Node/Express service powers two hostnames:

- `lowryjoseph.com` → custom personal landing page
- `apps.lowryjoseph.com` → Lowry Lab launcher
- `apps.lowryjoseph.com/graphql-demo/` → Creature Forge
- `apps.lowryjoseph.com/npc-generator/` → NPC Generator placeholder

The server chooses the root page based on the incoming hostname. Existing REST and GraphQL demo endpoints remain unchanged.
