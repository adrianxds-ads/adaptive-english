# Adaptive English · fixed adaptive app

Permanent public app:
`https://adrianxds-ads.github.io/adaptive-english/`

The phone/PWA URL never changes.

## Architecture
- `index.html` — fixed visual shell.
- `app.js` — fixed quiz engine, timer, sounds, scoring and compact result handoff.
- `level.json` — the only level-content file that normally changes: LEVEL, TEST LEVEL, tip, priors and 15 questions.
- `history.json` — historical questions used to prevent repetition and excessive similarity.
- `publish-level.js` — validates, versions, commits, pushes and verifies the live GitHub Pages deployment.
- `service-worker.js` — network-first PWA shell with offline fallback.

## Normal next-level workflow
1. Finish the current test and copy its compact result.
2. Generate the next adaptive 15-question `level.json` from that result.
3. Run `node publish-level.js --validate-only` while drafting.
4. Run `node publish-level.js` when ready.
5. The publisher checks IDs, four-option integrity, domain diversity, historical repetition/similarity, updates `history.json` and `version.json`, commits, pushes, and verifies the public site.

Do not edit `index.html` for ordinary LEVEL changes. Technical app changes are separate from pedagogical level updates.