# Staff Trainer

A single-page web app for practicing note-reading on the musical staff and
piano keyboard. No backend, no accounts, no build step — just static
HTML/CSS/JS.

**Live app:** https://armrodney.github.io/Piano-notes-training-app/

## Features

- **Four practice types**, mix and match via checkboxes:
  - Letter → Staff — a letter is shown, click the matching line/space
  - Staff → Letter — a note is shown on the staff, pick the letter
  - Letter → Keyboard — a letter is shown, click the matching piano key
  - Keyboard → Letter — a key is highlighted on the piano, pick the letter
- **Treble and/or bass clef** — enable either or both; questions are drawn
  randomly from whichever are checked
- **Extended range** toggle — adds ledger-line notes above/below each staff
  (and the piano keyboard range grows to match)
- Natural notes only (no accidentals)
- The on-screen piano keyboard shows a randomly-shifted 2+ octave slice
  each question (not always starting on the same note), so keys have to be
  found relative to the black-key groups rather than memorized by screen
  position
- Immediate feedback: correct answers auto-advance quickly; incorrect
  answers highlight every matching position for the wrong guess (a letter
  can occur more than once in range) alongside the right answer, label
  the wrongly-clicked position with its letter, and pause before
  auto-advancing (no button to click either way)
- Keyboard shortcuts: press A–G to answer letter-guess questions
- Session stats (overall accuracy + per-note accuracy) persisted in
  `localStorage`, with a reset button

## Running it

Everything is static — no build step, no server required.

**Locally:** open `index.html` directly in a browser.

**On a phone (online):** open the live link above in Chrome and use the
browser's "Add to Home screen" option for an app-like icon.

**On Android (fully offline):** download an APK from the
[latest Android release](https://github.com/armrodney/Piano-notes-training-app/releases/tag/android-latest)
and sideload it — the web app is bundled inside, so it runs with no network
at all after install. You'll need to enable "Install unknown apps" for your
browser/file manager in Android settings; these are debug-signed builds for
personal sideloading, not Play Store releases.

- `staff-trainer.apk` — the standard version (see `android-app/README.md`)
- `staff-trainer-eink.apk` — high-contrast variant for grayscale e-ink
  displays: correct/incorrect are shown via solid fill vs. diagonal
  hatching and shape, not color, since e-ink can't render hue and is slow
  to refresh (see `android-app-eink/README.md` and `style-eink.css`)

## Project structure

```
index.html          regular web app
style.css
index-eink.html      e-ink-optimized web app (same JS, different CSS)
style-eink.css
js/
  notes.js     note/clef data model, keyboard range logic
  staff.js     SVG staff rendering + hit-testing
  keyboard.js  SVG piano keyboard rendering + hit-testing
  stats.js     localStorage-backed stats tracking
  app.js       question generation, settings, game logic
android-app/        Capacitor wrapper -> offline .apk (see its README)
android-app-eink/    Capacitor wrapper for the e-ink build (see its README)
.github/workflows/build-apk.yml   CI that builds & publishes both APKs
```

## Non-goals

No user accounts, no backend, no bass/alto/other clefs beyond treble and
bass, no accidentals (yet), no analytics or third-party services.
