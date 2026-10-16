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
