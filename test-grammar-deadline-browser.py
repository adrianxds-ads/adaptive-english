"""Grammar Quest deadline regression. Isolated Edge profile, no real progress."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parent
BASE = "https://adrianxds-ads.github.io/adaptive-english/?qa=grammar-deadline-regression"
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel="msedge")
    for width, height in ((360, 740), (412, 915)):
        context = browser.new_context(viewport={"width": width, "height": height}, service_workers="block")
        context.add_init_script("localStorage.setItem('adaptive_english_read_first_v1', '0')")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        def intercept(route):
            uri = urlparse(route.request.url)
            file = ROOT / (uri.path.split("/")[-1] or "index.html")
            if uri.path.startswith("/adaptive-english/") and file.is_file():
                mime = {".js":"application/javascript",".css":"text/css",".json":"application/json",
                        ".html":"text/html",".webmanifest":"application/manifest+json",
                        ".png":"image/png",".svg":"image/svg+xml"}.get(file.suffix, "application/octet-stream")
                route.fulfill(path=str(file), content_type=mime)
            else:
                route.continue_()
        page.route("**/adaptive-english/**", intercept)
        page.goto(BASE, wait_until="domcontentloaded", timeout=45000)
        page.locator("#startBtn").click()
        page.wait_for_function("typeof session !== 'undefined' && session && current && deadline > 0 && !focusAwaiting && document.querySelectorAll('#answers button.answer').length === 4", timeout=45000)
        late = page.evaluate("""() => {
            quizFlow.cancel();
            clearInterval(timerHandle);
            const before = session.records.length;
            const correctPos = current.correctPos;
            deadline = performance.now() - 250;
            focusAnswerAt = deadline - TIME_LIMIT * 1000;
            answer(correctPos, false);
            const rec = session.records[session.records.length - 1];
            answer(correctPos, false);
            return {added:session.records.length-before, correct:rec.correct, ms:rec.ms,
                    answer:rec.userAnswer, type:rec.type, limit:TIME_LIMIT};
        }""")
        timely = page.evaluate("""() => {
            quizFlow.cancel();
            session.index++;
            nextQuestion();
            clearInterval(timerHandle);
            const before = session.records.length;
            answer(current.correctPos, false);
            const rec = session.records[session.records.length - 1];
            return {added:session.records.length-before, correct:rec.correct, ms:rec.ms, limit:TIME_LIMIT};
        }""")
        pause = page.evaluate("""() => {
            quizFlow.cancel();
            session.index++;
            nextQuestion();
            clearInterval(timerHandle);
            const before = session.records.length;
            focusPause();
            answer(current.correctPos, false);
            const blockedWhilePaused = session.records.length === before;
            const deadlineBefore = deadline;
            focusPausedAt -= 5000;
            focusResume();
            const extendedMs = Math.round(deadline - deadlineBefore);
            answer(current.correctPos, false);
            return {blockedWhilePaused, extendedMs,
                    afterResumeRecorded: session.records.length === before + 1,
                    afterResumeCorrect: session.records.at(-1)?.correct === true};
        }""")
        results.append({"viewport":f"{width}x{height}","expired":late,"onTime":timely,"pause":pause,"jsErrors":errors})
        context.close()
    browser.close()
print(json.dumps(results))
for result in results:
    late, timely = result["expired"], result["onTime"]
    assert late["added"] == 1 and late["correct"] is False, "Late correct input must be a single timeout"
    assert late["type"] == "timeout" and late["ms"] == late["limit"] * 1000, "Timeout must record exact duration"
    assert late["answer"] == "No answer", "Expired input must not count as a selected answer"
    assert timely["added"] == 1 and timely["correct"] is True, "On-time correct must count once"
    assert 0 <= timely["ms"] <= timely["limit"] * 1000
    assert result["pause"]["blockedWhilePaused"] and result["pause"]["afterResumeRecorded"] and result["pause"]["afterResumeCorrect"], "Pause/resume must be safe"
    assert result["pause"]["extendedMs"] >= 5000, "Paused time must extend the deadline"
    assert not result["jsErrors"], result["jsErrors"]
print("PASS Grammar deadline, duplicate guard, on-time answer, two mobile viewports")
