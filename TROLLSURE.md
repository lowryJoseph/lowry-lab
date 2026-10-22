# TrollSure v20 — Benefits Operations

TrollSure is an aggressively fictional group-benefits platform used to demonstrate REST BFF vs GraphQL orchestration over the same domain REST APIs. All currency, products, rules, people, places, providers, and workflows are fantasy/demo data.

## V20 additions
- Participating healer/provider network with in-guild vs out-of-guild allowed-charge differences
- Potion formulary with tiers, copays, prior authorization, and exclusions
- Royal Pre-Approval (prior authorization)
- Real per-member deductible and Max Quest Burden accumulators across repeated claims
- Annual Guild Enrollment plan election
- Quest Life Events / special enrollment window
- Renewal offers and rate changes
- Petition to the High Council (claim appeals)
- Guild premium statements
- Continuation Protection parody workflow
- One Benefit Operations UI backed by domain REST APIs through either REST BFF or GraphQL

## Core architecture
UI → REST BFF or GraphQL facade → domain REST APIs.

The browser does not calculate premiums or adjudicate claims. Backend services remain the source of truth.
