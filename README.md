# Adaptive English · Campaign 1 v1.17

Local adaptive grammar trainer.

## v1.1 changes
- Fixed 10-second clock with soft second tick and stronger final 3-2-1 ticks.
- Correct / wrong answer audio feedback.
- Diversity engine: each 15-question session mixes focus, exploration, spaced review and wildcard material.
- Maximum two questions from the same skill in a session and no repeated template in a session.
- Strong cooldown for recently seen sentences and templates.
- AE Rating (0–100) combines recent accuracy, relative speed, transfer and mastery.
- Background progression bands: forest → teal → blue → indigo → amber → gold.
- Session LEVEL remains a session counter; AE Rating is the learning-performance indicator.
- Existing Campaign 1 progress remains compatible.

The PWA package uses `index.html`, `app.js`, `campaign-01.json`, `manifest.webmanifest`, `service-worker.js`, and `icon.svg`.


## Version 1.0
- First numbered stable release.
- More rewarding answer and level-complete sound cues.
- Four longitudinal charts: AE Rating, accuracy, response time, and automaticity.
- Errors moved to a dedicated full-screen review opened on demand.
- Existing Campaign 1 local progress remains compatible.


## Version 1.1
- Two full-history charts: accuracy and average response time.
- Added unique phrases, repeated presentations, and bank-total counters.
- Question and answers moved slightly upward for mobile comfort.
- Existing progress remains compatible.


## Version 1.2
- Hardened question advance so audio, feedback, or storage errors cannot freeze a session.
- Invalid questions are skipped automatically instead of blocking the quiz.
- Correct choice turns green; a selected wrong choice turns red while the correct answer turns green.
- Feedback banner moved higher and question/answers made more legible.
- First 40 sessions prefer prompts of 12 words or fewer.
- Stronger alternating tick-tock and live rating-band colour updates.


## Version 1.3
- Faster touch response using pointer-down handling plus subtle device haptics when supported.
- Larger question, answer, timer, level and statistic typography for mobile use.
- More expressive correct/incorrect feedback with screen pulse/shake and particles on correct answers.
- Removed the longitudinal response-time graph and added a global Learning Trend computed from existing session history.
- Skills are displayed from highest to lowest mastery across all 25 skills.
- Sounds, the fixed 10-second clock, 3,000-question bank and adaptive selection algorithm are preserved.
- STORAGE_KEY remains adaptive_english_campaign1_v1, so existing progress stays compatible.


## Version 1.4
- Adds one full-screen bilingual level lesson before the charts.
- The lesson selects the most frequent error category in that level; ties are resolved by total response time.
- It shows the exact question, the user's answer, the correct answer, Spanish and English explanations, a formula, a translated example and a next-time cue.
- Perfect levels still show one reinforcement lesson based on the slowest correct response.
- The question area is more compact so the prompt and all four answer cards fit in one visual scan; answer typography remains large.
- STORAGE_KEY, 10-second clock, 3,000-question bank, 25 skills, sounds and adaptive engine remain unchanged.


## Version 1.5
- Slightly reduces answer typography while preserving the current compact question layout.
- Keeps the end-of-level micro-lesson explanation in Spanish only; formula and bilingual example remain.
- Correct/incorrect feedback now shows NEW! on first exposure or the exact exposure number (2ª VEZ, 3ª VEZ, etc.) on every answer.
- Exposure numbering reuses the existing seen-count history, so current progress remains compatible.
- STORAGE_KEY, 10-second clock, 3,000-question bank, 25 skills, sounds and adaptive engine remain unchanged.

## Version 1.6
- Splits answer feedback into two blocks: CORRECT/INCORRECT above and a much larger NEW!/Nth-time exposure badge below.
- Exposure count continues to use the existing per-question history, so prior appearances remain accurate.
- Slightly reduces answer typography again while preserving the compact one-screen quiz layout.
- Adds a Learning Score based on an 8-level moving average of the existing Learning Trend composite.
- Learning Score shows a green up arrow, red down arrow, or neutral arrow versus the previous rolling window.
- The Learning Trend chart now includes the current moving-average reference line.
- STORAGE_KEY, 10-second clock, 3,000-question bank, sounds and adaptive engine remain unchanged.

## Version 1.7
- Adds a persistent AI Valoration level from 1 to 10, distinct from the short-term Learning Score.
- AI Valoration combines rolling learning performance, mastery, recent accuracy, automaticity and coverage, tempered by an evidence factor from accumulated attempts and bank coverage.
- New session snapshots preserve AI score, level and confidence for longitudinal use.
- Dashboard and level-complete screen inherit the current AI-level colour; the quiz screen remains unchanged.
- Adds a compact 1–10 colour legend at the bottom of the results screen.
- Existing STORAGE_KEY, progress, 3,000-question bank, 10-second clock, sounds and adaptive engine remain compatible.

## Version 1.8
- Keeps the 3,000-question bank and every fingerprint unchanged while varying short display names at runtime.
- Name variation preserves grammatical gender/pronouns, updates question and answer options consistently, changes across repeat exposures, and avoids reusing a display name within a session when possible.
- Adds question-level lapse memory: a specifically missed question gets a modest review boost only after the normal four-level cooldown.
- Extends the 1–10 colour language across percentages, progress bars, Learning Score, chart lines and per-skill mastery. Low values use red/brown hues and the maximum uses purple; text uses brighter matching tints for contrast.
- Keeps the existing STORAGE_KEY, progress, sounds, 10-second clock, 15-question sessions and adaptive skill engine compatible.

## Version 1.9

- Hardened progress import validation and schema checks.
- Capped answer history at 6,000 rows and session history at 1,000 levels, with a smaller fallback if browser storage reaches quota.
- Added defensive escaping for dynamic result text and skill names.
- Sparkline rendering now ignores invalid numeric values safely.
- Audio degrades gracefully when AudioContext is unavailable; training remains usable.

## Version 1.10

- Rebuilt Learning Curve as a long-term acquisition signal: 65% mastery, 25% coverage, 10% automaticity.
- Added EMA smoothing so the lower chart shows learning trajectory instead of mirroring level accuracy.
- Learning Score now reports the current curve point; its arrow compares the latest 8 levels with the previous 8 non-overlapping levels.
- Lower chart uses the first curve value as a dashed Start reference.

## Version 1.11

- Adds `Campaign 2 Readiness`, a separate advisory signal for when there is enough evidence and broad enough mastery to benefit from a second 3,000-question campaign.
- Readiness combines coverage, mastery, skill breadth, strong-skill share, the long-term Learning Curve and evidence volume, with hard gates to prevent premature recommendations.
- Campaign 2 can be recommended before Campaign 1 is fully complete; Campaign 1 can continue as maintenance while Campaign 2 expands into new C1 material.
- When ready, the dashboard exposes a `COPY HANDOFF FOR CHATGPT` action that prepares a diagnostic prompt; the exported Campaign 1 progress JSON remains the primary data source for designing Campaign 2.
- Campaign 1 bank, fingerprints, storage key, 15-question sessions and 10-second timing remain unchanged.

## Version 1.12

- Adds two start-dashboard entry points: `STATISTICS` and `MY COACH`.
- Statistics mirrors the longitudinal learning dashboard before a session: AI Valoration, Learning Score, accuracy and learning-curve charts, Campaign 2 readiness, and all 25 skills.
- My Coach turns stored performance data into a study file with five adaptive priorities, recurring mistake patterns from recent history, rules, examples, coach cues, and all skills ordered weakest to strongest.
- Both screens are read-only study views and do not change the adaptive engine, campaign bank, progress identity, 15-question sessions, or 10-second timing.

## Version 1.13

- Separates `MY COACH` ranking from quiz scheduling: 55% mastery gap, 35% recent error rate, 10% lack of automaticity.
- Adds a `VIRTUAL PEER` synthetic pace benchmark based on a saturating practice curve calibrated to Campaign 1; it is explicitly not presented as a population average.
- Shows YOU / VIRTUAL PEER / PACE in Statistics and a compact pace indicator on the start dashboard.

## Version 1.14

- Replaces the single Virtual Peer point estimate with a `Typical Learner Model` reference band.
- Shows central typical pace plus a model-based healthy/strong range; the comparison is explicitly not a measured user average.
- Keeps diminishing-gain practice dynamics and uses answer count as the comparison axis.
- Preserves the separate pedagogical `MY COACH` priority introduced in v1.13.


## Version 1.15

- Adds a My Coach ChatGPT handoff generator with a compact structured snapshot of current performance, recent trends, skill priorities, skill movement, recurring mistakes, Typical Learner pace and Campaign 2 readiness.
- The generated prompt is designed for direct copy/paste into ChatGPT; full JSON export remains available for deep audits.


## Version 1.16

- Adds hybrid spacing based on both completed levels and real elapsed calendar time, with per-question review intervals and due timestamps.
- Gives overdue memories extra review priority while suppressing excessive same-day repetition.
- Gives the start cover a distinct burgundy visual identity.
- Clarifies end-of-level navigation with NEXT LEVEL and DASHBOARD · PORTADA as the two main actions.
- Enlarges non-quiz typography across dashboards, My Coach, statistics and results while preserving the tuned question/answer sizes.


## Version 1.17

- Slightly reduces answer-card typography and vertical padding so all four choices can be scanned faster in one glance, especially on Pixel-sized mobile screens.
- Keeps the established question typography unchanged.
- Tightens correct/wrong audio cues into shorter, clearer arcade-style signals without delaying question advance.
- Preserves Campaign 1 data, scheduling, storage key, 15-question sessions and 10-second timer.
