# Keepsent

Keepsent is a local-first private note studio for people who know what they feel
but need help saying it well. The first product turns a few concrete memories
into a keepsake note that can be copied, exported, printed, or shared through a
private URL.

## Company Thesis

People pay from the heart when the recipient matters. Keepsent sells the courage
and clarity to send a meaningful note, not generic AI writing. The company grows
sustainably by increasing meaningful sends, preserving privacy, and charging for
moments where the user already wants to do the right thing.

## Product

The MVP is a browser app with no account, server, or API dependency.

- Guided note composer for thanks, living tributes, encouragement, repair, and
  caregiver support
- Local multilingual drafting in English, Spanish, Korean, and Japanese
- Moment Packs for caregiver witness, mentor thanks, repair, and living tribute
- Deterministic draft generation from the user's own details
- Specificity score and missing-detail prompts
- Editable keepsake draft
- Private share link encoded in the URL
- Print, copy, and text export actions
- Local saved note vault
- Local feedback capture from sender or recipient
- Copyable recipient feedback packets for no-backend pilots
- Local paid-intent reservation capture
- Public GitHub issue forms for pilot feedback and founding reservations
- Company dashboard with early signal counts and data export

## Offer

- Keepsake: $7 for one polished private page
- Year: $29/year for unlimited notes, saved recipients, and reminders
- Family: $79/year for shared family vaults and contributor prompts

Stripe Checkout should be the first real payment integration after the local MVP
shows willingness to pay.

## Market Signals

- Gallup reported in 2024 that 20% of U.S. adults felt lonely a lot of the
  previous day:
  <https://news.gallup.com/poll/651881/daily-loneliness-afflicts-one-five.aspx>
- Pew Research Center surveyed Americans' emotional-support networks in 2024 and
  published findings in 2025:
  <https://www.pewresearch.org/social-trends/2025/01/16/men-women-and-social-connections/>
- CDC tracks recent loneliness and social-connection data:
  <https://www.cdc.gov/mental-health/about-data/community-connection.html>
- Grand View Research estimated the U.S. greeting cards market at $7.12B in 2025:
  <https://www.grandviewresearch.com/industry-analysis/us-greeting-cards-market-report>

The market is not "cards" alone. The wedge is high-emotion, low-frequency
moments where people want to be specific, private, and brave.

## Operating Principles

- Private by default
- No public gallery of intimate notes
- No training on private notes without explicit consent
- Specificity over polish
- Meaningful sends over drafts created
- Sustainable revenue from value delivered, not addiction loops

## Feedback Loop

The north-star metric is meaningful sends per active user, weighted by feedback.
The app captures local pilot signals:

- notes saved
- sender reactions such as "felt like me" or "too generic"
- recipient reactions such as "made me reply" on the recipient's device
- draft language and localization gaps
- pack interest by moment type
- paid-intent reservations and why the product is worth paying for

Export `keepsent-company-data.json` from the Company section to review early
signals from the current device. Until a hosted backend exists, remote recipient
feedback must be copied back to the sender or collected in interviews.

Public pilot intake lives in GitHub Issues:

- Pilot feedback:
  <https://github.com/studio-glhf/keepsent/issues/new?template=pilot-feedback.yml>
- Founding reservation:
  <https://github.com/studio-glhf/keepsent/issues/new?template=founding-reservation.yml>

These issue forms are public by design. They ask for outcome evidence, paid
intent, and trust gaps without asking people to paste private note text. Testers
should not paste Keepsent share links into issues because the note content is
encoded in the URL.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Launch Plan

1. Put the MVP in front of 20 people with one real note to send this week.
2. Ask whether it helped them say something they otherwise would not have said.
3. Ask whether they would pay $7 for the finished keepsake page.
4. Collect broad, non-private evidence through the public pilot issue forms.
5. Improve packs and prompts only from repeated failure modes.
6. Add Stripe Checkout for the $7 Keepsake plan after five credible paid-intent
   reservations.
7. Add hosted accounts only after local share links and exports prove useful.
8. Expand language quality, caregiver packs, and family memory packs once trust
   is earned.
