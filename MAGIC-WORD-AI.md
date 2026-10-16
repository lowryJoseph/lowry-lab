# Magic Word AI

Route: `/magic-word-ai/`

The browser posts conversation history to `/api/magic-word-ai`. The server:

1. Runs a deterministic input guard.
2. Blocks without calling OpenAI if the latest user message does not contain a Joe Lowry compliment.
3. Rate-limits successful model calls per IP.
4. Calls the OpenAI Responses API.
5. Validates the output and deterministically repairs it if the required positive Joe Lowry mention is missing.

## Required Render environment variable

`OPENAI_API_KEY`

Optional:

`OPENAI_MODEL=gpt-6-luna`

Never place the API key in browser JavaScript, HTML, GitHub, or this repository.
