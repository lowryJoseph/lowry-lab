# Magic Word AI

Route: `/magic-word-ai/`

The browser posts conversation history to `/api/magic-word-ai`. The server:

1. Runs a deterministic input guard.
2. Blocks without calling OpenAI if the latest user message does not contain a recognizable compliment about Joe / Joe Lowry.
3. Rate-limits successful model calls per IP.
4. Calls the OpenAI Responses API.
5. Validates the output and deterministically repairs it if the required positive Joe Lowry mention is missing.

## Required Render environment variable

`OPENAI_API_KEY`

Optional:

`OPENAI_MODEL=gpt-6-luna`

Never place the API key in browser JavaScript, HTML, GitHub, or this repository.


## V2 input guard
The deterministic guard now accepts natural variants such as “Joe is great,” “I respect Joe Lowry,” and “Joe Lowry? He's awesome,” while still blocking obvious insults and negated compliments.

## V2 / V3 comparison mode

The page now includes a harness toggle:

- **V2 — Deterministic:** ordinary JavaScript decides whether the user complimented Joe.
- **V3 — AI semantic guard:** a cheap deterministic pre-filter checks for a Joe mention, then a structured-output AI classifier decides whether the compliment is genuine before the main chatbot is called.

V3 therefore may make two model calls for a successful message: one classifier call and one chatbot call. The final output guard remains deterministic in both modes.

Optional environment variable:

```text
OPENAI_GUARD_MODEL=gpt-6-luna
```

If omitted, the guard uses the same model configured in `OPENAI_MODEL`.

## V15 — live web capability + visible call telemetry

The main chatbot now exposes OpenAI's `web_search` tool. The semantic guard does **not** receive web access; it still has one narrow job: decide whether the user genuinely complimented Joe.

The main model decides whether it needs web search. Current/live questions such as weather, news, prices, and schedules can trigger the tool; ordinary conceptual questions normally do not.

The harness panel now reports:

- whether the main model was actually called
- which model was used
- the OpenAI response ID
- whether a web-search tool call occurred
- remaining in-memory model-call budget slots for the current IP/window

This makes the demo useful for proving that "model capability" comes from tools granted by the harness, not from the model magically having live internet access.
