# Deploy

1. Put these files at the GitHub repository root.
2. Commit and push to `main`.
3. Render auto-deploys if Auto-Deploy is set to On Commit.
4. In Render, add `lowryjoseph.com` as another Custom Domain on the SAME web service that already serves `apps.lowryjoseph.com`.
5. Use the exact DNS values Render provides. For a root domain, Render may instruct you to use an A/ALIAS/ANAME record rather than a CNAME.
6. Do not remove the existing `apps` CNAME.
7. After Render verifies the root domain and issues TLS, visit both hostnames.
