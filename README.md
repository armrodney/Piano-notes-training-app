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
- Immediate feedback: correct answers auto-advance quickly, incorrect
  answers reveal the right answer and pause before auto-advancing (no
  button to click either way)
- Keyboard shortcuts: press A–G to answer letter-guess questions
- Session stats (overall accuracy + per-note accuracy) persisted in
  `localStorage`, with a reset button

## Running it

Everything is static — no build step, no server required.

**Locally:** open `index.html` directly in a browser.

**On a phone (online):** open the live link above in Chrome and use the
browser's "Add to Home screen" option for an app-like icon.

**On Android (fully offline):** download the APK from the
[latest Android release](https://github.com/armrodney/Piano-notes-training-app/releases/tag/android-latest)
and sideload it — the web app is bundled inside, so it runs with no network
at all after install. You'll need to enable "Install unknown apps" for your
browser/file manager in Android settings; this is a debug-signed build for
personal sideloading, not a Play Store release. See `android-app/README.md`
for how it's built.

## Project structure

```
index.html
style.css
js/
  notes.js     note/clef data model, keyboard range logic
  staff.js     SVG staff rendering + hit-testing
  keyboard.js  SVG piano keyboard rendering + hit-testing
  stats.js     localStorage-backed stats tracking
  app.js       question generation, settings, game logic
android-app/   Capacitor wrapper that packages the app as an offline .apk
  (see android-app/README.md)
.github/workflows/build-apk.yml   CI that builds & publishes the APK
```

## Non-goals

No user accounts, no backend, no bass/alto/other clefs beyond treble and
bass, no accidentals (yet), no analytics or third-party services.
