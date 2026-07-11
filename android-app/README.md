# Android wrapper (Capacitor)

This folder wraps the web app (from the repo root) in a minimal native
Android shell using [Capacitor](https://capacitorjs.com/), so it can run as
an installable `.apk` with the web assets bundled locally — no network
needed after install.

It does **not** duplicate the app's source. `www/` is regenerated from the
repo root's `index.html`, `style.css`, and `js/` on every build (see
`.gitignore` — `www/` is never committed) and is not the app's home.

## How the APK gets built

A GitHub Actions workflow (`.github/workflows/build-apk.yml`) builds this
automatically:
- on every push that touches `index.html`, `style.css`, `js/**`, or this
  folder
- or manually via the "Run workflow" button on the Actions tab

It publishes the result to the `android-latest` GitHub Release on this repo,
so the download link stays the same across rebuilds.

The APK is **debug-signed**, meant for sideloading only (not submitted to
the Play Store). Installing it requires enabling "Install unknown apps" for
your browser/file manager in Android settings.

## Building locally (optional)

Only needed if you want to build without GitHub Actions. Requires a JDK 17+
and the Android SDK installed and on `PATH`/`ANDROID_HOME`.

```bash
cd android-app
npm install
mkdir -p www/js
cp ../index.html ../style.css www/
cp ../js/*.js www/js/
npx cap sync android
cd android
./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```
