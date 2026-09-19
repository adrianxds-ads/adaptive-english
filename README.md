# Adaptive English · Campaign 1 v2.8.1

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


## Version 1.18
- Rebuilds the primary Statistics graph as correct answers per 15-question level with a fixed 0 / 7.5 / 15 vertical scale.
- Uses real calendar dates on the horizontal axis so multi-day retention is visible.
- Makes the primary score graph larger than the secondary Learning Curve.
- Adds an expandable full-screen score chart with per-level points and date labels.


## v1.19
Full 3,000-question bank audit; repaired generator artifacts and predictable-answer families; deterministic four-position correct-answer rotation; exact-phrase + pattern exposure counters.


## v1.20
- Rebuilds the score graph as a 15-band error rainbow: 1–15 errors are individually colour-coded, with a white high-contrast trajectory and full integer scale.
- Uses the same error chart in Statistics, expanded view, and end-of-level history.
- Adds per-question `focus` cues to all 3,000 exercises. After every answer, decisive grammar fragments and the correct completion flash green briefly without changing the existing question-to-question delay.
- Keeps storage, fingerprints, 15-question levels, 10-second timing, adaptive scheduling, and all existing progress compatible.


## v1.21
- Moves answer feedback into the normal quiz layout below the four answers, so it no longer covers the corrected sentence or grammar-focus flash.
- Shows exposure first (`NEW`, `2Âª VEZ`, etc.) and `CORRECT / INCORRECT` beneath it.
- Preserves the existing 540 ms / 860 ms question-advance timing and all Campaign 1 progress.


## Version 1.22
- Reframes the primary performance chart as correct answers out of 15: 15 at the top, 0 at the bottom, so higher always means better.
- Reverses the performance colour field so low scores sit in brown/red bands and high scores rise through green/blue to purple at the top.
- Keeps the high-contrast white trajectory and expandable chart.
- Uses clock-time labels for short study spans and calendar-day labels for longer spans; point tooltips include level, correct answers, errors, date and time.


## Version 1.23
- Adds a per-level adaptive stretch TARGET based on recent performance and selected-question difficulty.
- Uses 0.5-point increments; saves target, delta and hit/miss in session history.
- Shows TARGET in the HUD and colors the final result green when met/beaten, red when missed.


## Version 1.24
- Cognitive UI pass focused on actually reading correction cues instead of merely perceiving a flash.
- Extends post-answer dwell to 1.10 s for correct answers, 1.45 s for ordinary errors, 1.65 s for fast-wrong responses, and 1.50 s for timeouts.
- Extends grammar-focus cue to 0.90 s and changes it from semantic green to amber/gold, reserving green/red for correct/error feedback.
- Replaces the four pre-answer red/blue/yellow/green tiles with a more balanced amber/teal/indigo/raspberry palette so no option carries a built-in success/failure cue.
- Removes the full-screen correctness flash, reduces success particles from 28 to 6, and adds prefers-reduced-motion handling.
- Keeps question/answer typography, target algorithm, 15-question levels, 10-second timer, bank, mastery model and progress storage unchanged.


## Version 1.25
- Adds longitudinal TARGET statistics: average target, average actual score, average delta vs target and target hit rate.
- Adds above/exact/below target breakdown.
- Performance graph overlays adaptive TARGET as a cyan dashed series against the white actual-score series.
- ChatGPT coach handoff now includes target-performance statistics.


## Version 1.26
- Adds 25 fixed canonical Daily Keys, one per Campaign 1 grammar category.
- Daily Key uses Spanish → English productive recall and stays fixed for the local calendar day.
- Daily Key selection uses the existing coach weakness priority and never changes mastery just by viewing/revealing it.
- Adds a compact Keyring of previously selected unique Keys, capped at 25; repeat days increase exposure instead of duplicating cards.
- User-facing skill labels become Keys while internal skill IDs remain unchanged.


## v1.27 · Key Journey
- Campaign 1 has a 25-Key calendar gate: one unique Key unlocks per real calendar day, so the campaign cannot be completed in fewer than 25 days.
- Unlocked Keys live in a horizontal swipe carousel; tap once to reveal, tap again to advance. The next locked Key peeks from the right.
- Correct answers use an original short discovery chime (not copied game audio), and the timer/feedback use the same fantasy-adventure reward language.
- Campaign completion keeps all existing knowledge gates and additionally requires KEY JOURNEY 25/25.


## v1.28 · Wrong-answer reveal
- Wrong answers now surface the correct option in a high-contrast banner directly above the corrected sentence.
- The banner preserves the correct option's answer colour while using white text and a gold discovery glow for fast visual binding.
- The 10-step time rail moved below the answer/feedback panel so timing stays visible without competing with the correction.
- Correct answers stay clean: the extra correct-answer banner only appears after errors/timeouts.


## v1.30
- Practice Tree now grows from cumulative LEVEL, not total answers.
- One tree stage unlocks every 50 LEVELS; LEVEL 10,000 completes 200 stages.
- Added a persistent global level key so future campaigns can continue the same lifetime LEVEL sequence.


## v1.31
- Unified the app around the same 15-colour performance scale used by the /15 score chart.
- AI Valoration now uses levels 1–15; metric fills and text hues map 0–100% into the same 15 bands.
- Each colour band spans about 6.67 percentage points; band 15 is the existing purple maximum.


## v2.0
- Introduces Adrián Visual System (AVS 1.0), a locked reusable 15-rank colour language for future apps, agents and games.
- Rank 15 is now luminous Gold (maximum/reward); rank 14 is Violet (elite). Low ranks run through dark earth, oxblood and wine before copper/amber, green, teal, blue and indigo.
- The score graph, AI Valoration and metric colours now share the same canonical palette source.
- Added a pre-level 3-2-1 mission screen with LEVEL, adaptive TARGET, previous result vs target, and the fixed 15-question / 10-second rules.
- Added a ~3-second post-level resolution flash before full statistics: Gold for target cleared, dark Wine for target missed, plus score, target delta, level transition and AI rank change when one occurred.
- Clear/miss transition sounds are original Adaptive English cues and do not copy game audio.
- Canonical palette tokens live in `adrian-visual-system.js`; human-readable reference lives in `ADRIAN_VISUAL_SYSTEM.md`.


## v2.1
- Adds a small in-game emergency exit (`↩ EXIT`) in the lower-right corner.
- Emergency exit is transactional: it restores the exact pre-level Campaign state, so abandoned questions do not count toward attempts, history, seen/review counts, mastery, tree growth, sessions, or LEVEL completion.
- The dashboard outer background now uses the current Adrián Visual System rank colour (1–15), while the inner panel stays dark for readability.
- The persisted AI/AVS rank therefore becomes the ambient colour seen whenever the app opens.


## v2.2
- Canonical AVS colour semantics are now applied consistently across charts, metrics, target statistics and result states.
- Absolute scalar values use their own 1–15 AVS rank colour. Raw counts and uncalibrated latency remain neutral.
- The /15 performance graph now uses AVS-coloured score segments and points; TARGET uses the same value colours but a dashed/hollow visual grammar instead of a fixed cyan.
- Learning Curve segments change colour with their actual 0–100 value instead of inheriting only the latest point colour.
- Positive/negative deltas use fixed AVS semantic colours (Emerald/Wine); Gold remains reserved for maximum/reward states such as a cleared target.
- Correct/incorrect gameplay states now use canonical AVS Emerald/Wine rather than legacy green/red values.
- Ambient app background follows the current global AI/AVS rank; individual metrics still colour themselves by their own values.


## v2.3
- Upgrades the shared Adrián Visual System to AVS 2.0 with strictly increasing perceptual lightness from rank 1 to 15.
- Each rank now has canonical accent, surface, chart-band and readable text variants; Gold remains rank 15 / maximum-reward.
- Dashboard ambience uses the darker rank surface, while charts and metrics use rank accent/band/text variants.
- Restores visible Unique phrases and Repeated phrases counts on the dashboard; repeated means distinct phrases seen at least twice.
- Daily Keys can now flip front/back repeatedly; horizontal swipe remains the navigation mechanism.
- TARGET CLEARED and TARGET MISSED now use longer, clearly distinct original musical stingers.


## v2.4 · Cognitive load telemetry
- Keeps the fixed 10-second clock, 15-question level, adaptive TARGET, scheduler, mastery model and 3,000-question bank unchanged.
- Adds non-adaptive reading-load telemetry to each new answer: visible prompt word/character count, load band, intrinsic target time and fixed time limit.
- Existing history is analysed retroactively from stored question text, so the new Statistics panel can use prior answers immediately.
- Adds a compact Reading load panel comparing short (≤12 words), medium (13–17) and long (≥18) prompts by accuracy, average response time, timeout rate and evidence count.
- Reading-load conclusions remain observational: the app requires evidence in both short and long bands before labelling a possible load effect.
- Adds skill-specific length-sensitivity analysis to the ChatGPT coach snapshot, so long-sentence effects can be separated from grammar-specific difficulty.
- The coach prompt explicitly treats the 10-second clock as a fixed game rule and avoids recommending timer changes from weak evidence.

## v2.5 · Memory echoes and faster result navigation

- Added subtle synthesized turn sounds to the 25 Key flashcards; reveal rises, close falls, and the global sound toggle still controls them.
- Added a compact `MUSIC ECHO` anchor to every unlocked Key, including dynamic anchors for `so/such` and `too/enough`.
- Wrong answers now trigger a brief top-of-screen memory echo tied to the grammar skill; it is visual only and does not delay question advance.
- Added duplicate quick actions at the top of the level-results screen for Next Level, Dashboard, Review Errors and Final Challenge.
- Preserved the fixed 10-second timer, 15-question level size, scheduler, mastery model, 3,000-question bank and existing localStorage progress key.

## v2.5.1 · Readability polish

- Enlarged Key typography.
- Centered and enlarged in-game Memory Echo above the correct-answer reveal.

## v2.6 · Skill League

- Added dynamic #1–#25 skill ranking based on the existing mastery metric, with subtle gold podium and wine bottom-three markers.
- Added per-level rank movement (▲/▼) and rare league events for entering the Top 3 or escaping the Bottom 3.
- Moved answer-result feedback below the answer grid so it no longer covers the gold correction or Memory Echo.
- Revealed Keys now return automatically to the Spanish front after 10 seconds, with a softer closing sound.
- Training engine, fixed 10-second timer, 15-question level size, scheduler, mastery model and progress key remain unchanged.

## v2.7 · Cognitive feedback hierarchy

- Phrase exposure count is now the primary visual signal on every answer.
- Every phrase shows an explicit count (`1ª VEZ`, `2ª VEZ`, etc.) instead of `NEW`.
- Correct/incorrect colour remains strong but secondary; pattern count and response time remain supporting data.
- Wrong-answer correction stays above the question; the full sentence keeps its gold grammar-focus flash; music echo remains independent.
- Adaptive engine, fixed 10-second timer, 15-question levels, scheduler, mastery model and storage key are unchanged.

## v2.7.1 · Mobile framing audit

- Hardened HUD, answer grid, correction, Memory Echo and cognitive feedback against horizontal overflow.
- Expanded the mobile HUD allocation for sound, level and TARGET instead of forcing them into a 74px column.
- Replaced rigid feedback minima with flexible minmax(0, …) columns and added narrow-screen fallbacks.
- Preserved the 10-second timer, 15-question levels, scheduler, mastery model and progress storage key.

## v2.8 · Error Lab / Secret Keys

- Reviews every error from the completed level, grouped by skill so repeated mistakes do not duplicate theory.
- Keeps the basic correction compact, then adds two collapsible layers: WHY? and SECRET KEY · MEMORY ECHO.
- Uses Spanish-first explanations with concise English reinforcement for all 25 Campaign 1 skills.
- Adds a separate 25-skill `error-coach.js` mnemonic layer aimed at Spanish speakers; it is independent from the daily Key Journey.
- Every error skill gets its existing song / memory anchor, including non-dominant errors.
- Song content is kept to short memory anchors/titles rather than long lyric passages.
- Adaptive engine, mastery, scheduler, fixed 10-second timer, 15-question levels and storage keys remain unchanged.

## v2.8.1
- Error Lab is collapsed by default and opens in place using only the just-completed level errors.
- Error review typography is larger.
- Timer audio accelerates: 1 Hz early, 2 Hz from 3–2s, 4 Hz in the final 2s.

## v2.9 · Error Lab Screen
- Error Lab opens as its own full review screen and only shows the just-completed level errors.
- Error-review typography is substantially larger and no longer constrained by the results dashboard.
- Persistent music anchors in Error Lab and daily Keys include an Open in Spotify action.
- The one-second in-game Memory Echo stays non-clickable to avoid accidental navigation.
- Adaptive engine, 10-second clock, 15-question levels, scheduler, mastery and storage keys remain unchanged.

## v2.10
- Error Lab cards use the AVS 15-colour scale from Gold downward, based on their position in the just-completed level.
- Added ACTIVE TRAINING TIME, reconstructed from stored per-answer response milliseconds and accumulated exactly for future answers.
- No change to adaptive timing weights, mastery, scheduler or the 10-second limit.

## v2.11
- Added Focus Time: visible, active app use including questions, feedback, Error Lab, Keys, My Coach and Statistics; pauses in background or after 90 seconds idle.
- Added a transparent daily effort plan with Minimum / Recommended / Stretch targets. Recommended time starts from a 15-minute base and adapts modestly to due reviews, weak Keys and fatigue evidence.
- Added a Monday-Sunday Focus Time chart and cumulative Focus Time total. Tracking starts with v2.11; historical non-question reading time is not fabricated.
- Focus targets are effort metrics only and do not change mastery, AE Rating, scheduler, question timing or the fixed 10-second clock.

## v2.12
- Refined Skill League presentation: podium uses gold / silver / bronze row treatments; positions 23–25 use three relegation-red tones.
- Ranking position and latest movement are shown side by side with larger, clearer numerals.
- Truncated skill names expose the full name on hover/focus/tap via an overlay tooltip.
- Added an 8-level League Report summarising biggest climber, biggest drop and notable podium / Bottom-3 movement without changing mastery or ranking logic.


## v2.13 · League Study
- Skill League gains a dedicated study screen for the current table and the last 8 levels.
- Ranking and movement numerals are larger while keeping the compact table.
- Statistics uses a compact LEAGUE STUDY launcher instead of squeezing the 8-level report under the table.
- Wrong-answer in-game MEMORY ECHO is reduced to the song title only; the answer correction remains in the existing game feedback.
- Campaign mastery, scheduler, fixed 10-second timer and ranking mathematics are unchanged.


## v2.14 · Clean miss cue + stronger League
- A wrong answer now triggers only the song title as the in-game memory cue.
- The separate correct-answer reveal above the game panel is suppressed; the answer panel itself remains the single correction source.
- League Study gives more visual weight to rank, movement, mastery percentage and 8-level movement cards.
- No mastery, scheduler, timer, target or ranking mathematics changed.


## v3.0 · Error Fingerprints
- Error Lab now builds a historical fingerprint from each recorded wrong answer and exposes a one-tap COPY ERROR JSON prompt for ChatGPT micro-diagnosis.
- Fingerprints are deliberately evidence-based: recurring literal wrong-answer patterns are counted now; deeper misconception tags can accumulate prospectively without rewriting the adaptive engine.
- Instant answer feedback now shows the phrase exposure count plus its correct/wrong record for rapid recognition.
- Campaign mastery, scheduler, 10-second timer, 15-question levels and adaptive scoring remain unchanged.


## v3.1 · Misconception layer + visible release ledger
- Adds a second Error Fingerprint layer that groups different wrong answers into misconception families where deterministic evidence supports the classification.
- The copied Error JSON now includes `misconception_fingerprint` with family, count, share, recent recurrence, first/last level and evidence strength.
- Unknown distractors are explicitly classified as fallback/other rather than given an invented linguistic cause.
- The home screen now has one canonical version display below the Practice Tree with collapsible release notes.
- Core Campaign 1 adaptive mathematics remain untouched.


## v3.2 · Instant answer record
- The transient feedback card no longer spells out CORRECT / INCORRECT / AUTOMATIC / SLOW. Its green/red state is the outcome signal.
- The dominant information is now the phrase's lifetime record: large `✓ correct` and `✕ wrong` counts.
- Total attempts and response time remain as small secondary context because attempts are simply correct + wrong.
- Adaptive scoring, outcome classification and timing logic are unchanged; only the feedback presentation changed.


## v3.3 · Local Coach
- MY COACH now contains a large offline narrative report generated from the same local progress state used by the ChatGPT handoff. It recalculates whenever the Coach screen is opened, therefore after every completed level.
- The report compares recent vs previous answer windows, retention span, due reviews, priority skills and supported misconception fingerprints. It uses deterministic evidence language and does not call an API.
- Correct-answer transition reduced to 760 ms; wrong-answer transitions remain 1450–1650 ms to preserve correction-viewing time.
- Transient Music Echo now shows the song title prominently and the artist underneath; long titles wrap instead of clipping.
- ✓ / ✕ phrase-history counts are slightly larger. Core adaptive mathematics and the fixed 10-second question clock are unchanged.


## v3.4 · Strict misconception matching + League Matchday
- Fixes the real Level 311 false positive where `used` was incorrectly grouped with bare `use` for `allow staff to use`. `ALLOW_BARE_INFINITIVE` now requires an exact morphological base match (`use` → `to use`); supported `-ing` forms get a separate family and unrelated forms fall back to OTHER.
- The level-resolution overlay now includes a larger Skill League Matchday flash after every level, whether the target was hit or missed. It shows up to three biggest risers and three biggest fallers with ▲/▼ position movement.
- The resolution stays visible slightly longer (3.45 s) so the league movement can be read before the statistics/end screen.
- Adaptive ranking mathematics, scheduler, mastery and the fixed 10-second question clock are unchanged.


## v3.5 · Faster play + Matchday leaders
- Correct and wrong answer transitions are approximately 18% faster for a more continuous game rhythm. Correct advance: 760→625 ms; normal wrong: 1450→1190 ms; fast-wrong: 1650→1350 ms; timeout: 1500→1230 ms. Feedback-card visibility was shortened proportionally.
- Skill League Matchday keeps the top three risers and fallers and adds prominent TOP RISER / TOP FALLER cards for the largest movement in each direction.
- Fixed 10-second answering clock and adaptive mathematics remain unchanged.


## v3.6 · Make Me Feel + tighter game rhythm
- `make + object + bare infinitive` now uses Aretha Franklin, `(You Make Me Feel Like) A Natural Woman`, replacing the Britney Spears anchor. The compact cue is `MAKE/MADE → NO TO · MAKE ME FEEL`, matching the user's strongest spontaneous retrieval hook.
- Inter-question pacing is shortened by about another 11%: correct 625→555 ms; normal wrong 1190→1060 ms; fast-wrong 1350→1200 ms; timeout 1230→1095 ms. Feedback visibility is shortened proportionally.
- This is a pacing/Memory Echo layer only. The 15-question round, fixed 10-second answering clock, scheduler, mastery and adaptive scoring are unchanged.


## v3.7 · Campaign ETA
- My Coach adds a rolling `CAMPAIGN 2 ETA` expressed as approximate days at today's learning pace, with a range rather than false precision.
- The forecast combines graduation distance with mastery, breadth, sub-40% weak skills, due-review load, recent learning velocity, and today's Focus Time. It identifies the current main gate (retention, weakest skills, mastery, breadth, or stability).
- ETA is motivational/observational only and cannot unlock Campaign 2. Graduation remains a separate evidence gate.
- The adaptive engine, 15-question rounds, fixed 10-second clock, scheduler and storage key are unchanged.


## v3.8 · Graduation audit + Key Diary
- Recalibrates Campaign 2 readiness against a strict graduation gate: ~100% coverage, 85% global mastery, 70% minimum skill mastery, all 25 base Keys, at least 14 calendar days of evidence, at least 150 spaced-review answers with >=72% retention, 8-level stability >=68%, plus a modest automaticity/fluency signal.
- The final challenge remains separate: passing the forecast or readiness percentage never graduates the campaign.
- Fixes the v3.7 ETA velocity bug: the ETA now reads the actual Learning Curve instead of a nonexistent `sessionHistory.learningScore` field, and projects against the strict graduation deficits.
- Adds the open-ended Key Diary without changing the 25-skill Campaign 1 taxonomy. Discovery #026 is the Gotye cue: `GOTYE -> CORTO · BE/GET -> -ING`.
- Key Diary interaction is now Anki-like: first tap flips; second tap advances to the next card. Swipe remains optional.
- Protected learning engine invariants remain unchanged: 3,000-question bank, scheduler, 15-question levels, fixed 10-second timer, and `adaptive_english_campaign1_v1` storage key.


## v3.8.1 · Cache isolation hotfix
- Re-publishes the full v3.8 feature set after a cross-app conflict audit.
- Fixes a real isolation bug in the service worker: Adaptive English previously deleted every Cache Storage entry on the shared origin during activation. It now removes only old caches whose names begin with `ae-campaign1-`, leaving unrelated apps untouched.
- No learning logic, progress data, 3,000-question bank, scheduler, timer, graduation gates, ETA, or Key Diary behavior changed.


## v3.9 · Practice-hours ETA
- Campaign ETA now always produces a concrete estimated amount of focused practice remaining in hours, with a modeled range and confidence label.
- The dashboard shows both `~X h` and the equivalent `≈ Y days at Z min/day`; if today has at least 10 active minutes, the daily projection uses today's pace, otherwise it uses the recommended daily target.
- A separate calendar floor preserves the longitudinal-retention gate: practice hours cannot bypass the minimum real-time evidence requirement.
- The same expanded estimate is visible in My Coach.
- No change to the 3,000-question bank, scheduler, mastery updates, 15-question levels, 10-second clock, graduation thresholds, progress key, or cache-isolation fix.


## v3.9.1 · Estimated Practice Left
- Renames the live Campaign 2 forecast from ETA to `ESTIMATED PRACTICE LEFT`.
- Keeps focused practice hours as the primary estimate, with equivalent practice days, modeled range, calendar floor, main gate, and confidence as secondary context.
- Renames the coach export field to `campaign2PracticeEstimate`.
- Restores the Local Coach narrative that was accidentally dropped during the v3.9 hours update.
- No campaign bank, scheduler, timer, mastery, graduation gate, or progress storage logic changed.


## v3.10 · Calibrated practice estimate
- Separates `GRADUATION READINESS` (evidence/gate index) from `LEARNING PROGRESS` (progress along the learning curve). They are deliberately not treated as a percentage of time completed.
- Rebuilds Estimated Practice Left from observed in-app velocity. The model estimates recent/lifetime improvement per focused level-hour for learning progress, global mastery, and coverage; it also models the weakest-skill gap using the adaptive weak-skill boost.
- Remaining practice hours are driven by the slowest learning gate rather than by a second unrelated weighted-distance formula.
- Calendar/retention requirements remain a separate floor: more practice cannot fake longitudinal retention.
- The UI now shows learning progress, the hour-driver gate, range, confidence, and graduation readiness separately.
- Core 3,000-question bank, scheduler, mastery updates, 15-question rounds, fixed 10-second clock, and progress storage remain unchanged.


## v3.11 · Daily practice plan
- Estimated Practice Left now converts remaining focused hours into a stable daily prescription using the existing adaptive Focus target.
- Dashboard/My Coach show `recommended minutes/day -> estimated days`, plus minimum, stretch, and today-at-this-pace scenarios.
- More focused minutes shorten the modeled horizon and fewer minutes lengthen it, while calendar/retention floors remain independent.
- The primary day estimate no longer shrinks merely because today's accumulated Focus Time rises; it is anchored to the recommended daily target.
- No changes to the question bank, scheduler, mastery updates, 10-second clock, or progress storage.


## v3.12 · Readability pass
- Enlarges typography and secondary information throughout the home dashboard, statistics, My Coach, Skill League, Key Diary, campaign-planning, end and review screens.
- Estimated Practice Left and its daily/minimum/stretch scenarios receive the strongest size increase because they were difficult to read on mobile.
- The active `#gameScreen` is explicitly excluded from this typography pass: question, answer, HUD, timer, feedback and gameplay layout remain calibrated exactly as before.
- Core learning logic and progress storage are unchanged.


## v3.13 · Grammar flash + fast navigation
- Every answer transition now flashes the exact Skill League grammar label (for both correct and wrong answers). Transition hold/advance timings are unchanged.
- The level-results screen now repeats Estimated Practice Left, recommended minutes/day, estimated days, range and learning-progress context from the dashboard.
- Statistics, League Study, My Coach and Error Lab get a top-of-screen Dashboard button so long panels never require scrolling to the bottom to escape.
- League Study is explicitly included in `showScreen()` routing.
- No changes to the 3,000-question bank, scheduler, scoring/mastery, 15-question level size, 10-second clock, or answer-transition timing.


## v3.14 · Infinitivo sin to + RATHER discovery
- Learner-facing terminology now uses `INFINITIVO SIN TO` instead of `base verb`, `verbo base`, `verbo desnudo` or `bare infinitive` where those expressions mean the uninflected verb after structures such as `would`, `used to`, `make`, and `had better`.
- The 3,000-question source bank is not rewritten; its loaded skill/rule/trigger metadata is normalized at runtime, preserving question IDs, answers, fingerprints, scheduler state and progress compatibility.
- KEY DIARY adds discovery #027: `RATHER BE` — `MISMO → INFINITIVO SIN TO · OTRO → PASADO`, with `I'd rather GO` vs `I'd rather YOU WENT`.
- Internal technical uses of the word `base` (baseline scores, base Keys, hash bases, Focus Time base minutes) are intentionally unchanged because they are not grammar terminology.


## v3.15 · Final Study Freeze / universal AI handoff
- End of every level now builds one self-contained `ADAPTIVE_ENGLISH_GLOBAL_PLUS_SESSION_V1` payload: global longitudinal coach snapshot + latest level + per-skill session summary + every error + grouped error diagnostics + historical fingerprints.
- The app makes a best-effort automatic clipboard write at level completion. Browser/PWA clipboard security can reject writes outside an active tap, so the result screen always exposes a one-tap fallback and reports whether auto-copy succeeded.
- The handoff is provider-neutral and embeds its own analysis contract, so it can be pasted into ChatGPT, Gemini or another capable AI without a project-specific prompt.
- Contrastive coaching is explicit: for conceptual errors, test Spanish-L1 transfer/calques (`Spanish mental pattern → English pattern`); do not force an L1 explanation for speed, attention or reading-load slips. Learner-facing terminology stays `infinitivo sin to`.
- My Coach now provides a direct `COPY GLOBAL JSON`; Error Lab provides `COPY SESSION ERRORS JSON` while preserving one-error JSON exports.
- Final interface audit kept the gameplay panel, 10-second timer, 15-question levels, scheduler/mastery logic, transitions and audio unchanged. The point of this build is reducing friction, not creating another redesign loop.
