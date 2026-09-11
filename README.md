# Adaptive English · Campaign 1 v1.4

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
