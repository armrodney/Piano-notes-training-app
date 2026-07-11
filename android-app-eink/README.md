# Android wrapper (Capacitor) — E-Ink variant

Same idea as `android-app/` — wraps a web build of the app as an installable,
fully offline `.apk` using [Capacitor](https://capacitorjs.com/) — but built
from `index-eink.html` / `style-eink.css` at the repo root instead of the
regular `index.html` / `style.css`.

The e-ink build swaps color-coded feedback (green/red) for shape- and
pattern-based feedback (solid black fill, diagonal hatching, thick outlines)
since e-ink displays are grayscale and slow to refresh — see
`style-eink.css` for the full rationale.

It installs as a **separate app** alongside the regular one (distinct
`appId`: `com.armrodney.stafftrainer.eink`), so both can be on the same
device at once.

`www/` is regenerated on every build from the repo root's e-ink files and
is not committed (see `.gitignore`) — this folder holds no source of its
own.

## How the APK gets built

Built by the same GitHub Actions workflow as the regular APK
(`.github/workflows/build-apk.yml`), which publishes both to the
`android-latest` release as `staff-trainer.apk` (regular) and
`staff-trainer-eink.apk` (this one).

## Building locally (optional)

Requires a JDK 17+ (21 is what CI uses) and the Android SDK on
`PATH`/`ANDROID_HOME`.

```bash
cd android-app-eink
npm install
mkdir -p www/js
cp ../index-eink.html www/index.html
cp ../style-eink.css www/
cp ../js/*.js www/js/
npx cap sync android
cd android
./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```
