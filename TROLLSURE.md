# TrollSure

A deliberately fictional group-benefits architecture demo for Lowry Lab.

## V1.1 features
- Quote and enrollment flows
- Wooden Shield / Iron Shield / Mithril Shield core plans
- Troll Insurance plus Goblin Theft and Dragon Singe add-ons
- Gold/silver fantasy currency
- Eligibility, waiting periods, contributions, underwriting and rating rules
- REST BFF / GraphQL toggle over the same backend REST domain APIs
- Claims adjudication flow
  - submitted charge
  - guild-allowed charge
  - deductible
  - Battle Cost Share
  - TrollSure payment
  - adventurer responsibility
- Generated printable Guild Coverage Certificate
- Generated printable Claim Determination Scroll

## Claims simplification
Claims deliberately use a small deterministic rule set: the guild-allowed charge is 85% of the submitted charge, then the applicable deductible and Battle Cost Share are applied. Accumulator logic, prior claims, denial workflows and appeals are future enhancements.

## Documents
Documents are generated server-side from enrollment/claim records and rendered as clean fantasy-character-sheet-inspired HTML. The document page includes Print / Save as PDF so the browser can create a PDF without introducing a PDF library into the demo.

Everything is fictional and intentionally not real insurance.
