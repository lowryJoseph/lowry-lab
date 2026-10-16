Replace the contents of the existing Lowry Lab repository root with this package, then commit and push to `main`. Render can redeploy the same Node service; no new service or DNS changes are required.

## V15 note: web search

No additional Render environment variable is required for web search. The main Responses API request declares the built-in `web_search` tool using the existing `OPENAI_API_KEY`. Web search is only available to the main chatbot call; the V3 semantic guard remains isolated from it.
