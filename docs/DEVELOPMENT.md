# Developing StreamFarvis

The Android app packages Streambert's React interface with Capacitor. Android-specific layouts and settings are separate from the retained Electron implementation.

## Requirements

- Node.js 22.12 or newer and npm.
- JDK 21–25, available through `JAVA_HOME` or your command path.
- Android SDK platform 36 and Build Tools 36.0.0.
- Android SDK location in `ANDROID_HOME`, or an `android/local.properties` file containing `sdk.dir=...`.

The project includes a Gradle 9.1.0 wrapper. Android Studio is useful for emulator testing but is not required for command-line builds. A physical device or emulator must run Android 7.0/API 24 or newer.

## Build an APK

Clone the repository and install the locked dependencies. Skipping the Electron binary avoids an unnecessary desktop runtime download when working only on Android.

**PowerShell:**

```powershell
git clone https://github.com/FloKuersten/StreamFarvis.git
Set-Location StreamFarvis
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
npm ci
npm run android:apk
```

**Bash:**

```bash
git clone https://github.com/FloKuersten/StreamFarvis.git
cd StreamFarvis
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
npm run android:apk
```

The build compiles the web interface, synchronizes Capacitor, and creates debug and signed release APKs plus SHA-256 files in `artifacts/`.

The first build creates a local signing key and credentials in `.signing/`. Keep a private backup; Android updates require the original key. This directory is ignored by Git and must never be included in a source archive, issue, or pull request. Self-built APKs use your local key and cannot update the published APK in place.

## Preview and test

```text
npm run dev:android
```

The browser preview runs at the local URL printed by Vite. It uses the Android layout; tokens entered in the preview are kept only in memory. Native playback and Keystore storage require Android. A browser preview is not proof that a provider can play video on a device.

### Browser regression tests

Install Playwright's Chromium once, then start the Android preview on the test port:

```text
npx playwright install chromium
npm run dev:android -- --port 5175 --strictPort
```

In another terminal, run `npm run test:android:ui`. The suite checks catalog filters, hero navigation, source selection, browser player errors, TV season changes, manual progress, and nested Android Back behavior at phone, landscape, and tablet sizes. It also checks horizontal overflow and browser runtime errors.

The tests intercept TMDB metadata and images with fictional fixtures and synthetic artwork. No real token or provider stream is needed. Screenshots and a JSON report are written to `artifacts/ui-smoke/`; they show fixture data, not the live catalog.

Set `TEST_BASE_URL` to use another preview URL. Set `CHROME_PATH` to an existing Chrome/Chromium executable to skip the browser download. These are optional; the defaults are Playwright Chromium and `http://127.0.0.1:5175`.

For a connected device or running emulator:

```text
adb install -r artifacts/StreamFarvis-1.0.0-debug.apk
```

The debug APK supports development inspection. The release APK disables WebView debugging. Keep personal tokens out of logs, screenshots, and test fixtures.

To compile the web bundle and run native unit tests separately:

```text
npm run build:android
npm run android:sync
```

**PowerShell:**

```powershell
Set-Location android
.\gradlew.bat :app:testDebugUnitTest
```

**Bash:**

```bash
cd android
./gradlew :app:testDebugUnitTest
```

For UI changes, check setup, navigation, search, movie/episode details, settings, dialogs, and Android Back in portrait and landscape. For player changes, also test launch failures, leaving fullscreen, backgrounding, and returning to the catalog. State whether you used fixture data, a browser, an emulator, or a physical device when reporting results.

## Code map

| Location | Purpose |
| --- | --- |
| `src/platform/androidBridge.js` | Android bridge and native Back dispatch |
| `src/styles/android.css` | Scoped phone/tablet layouts |
| `src/pages/AndroidSettingsPage.jsx` | Settings supported by the Android build |
| `src/components/AndroidPlayer.jsx` | Provider selection and native player launch |
| `android/app/src/main/java/` | Keystore storage, external links, and isolated player WebView |
| `scripts/build-android.mjs` | APK build, signing, and checksums |

The app dispatches `streamfarvis:back` for native Back. `App.jsx` first dispatches the cancelable `streamfarvis:back-overlay` event so dialogs and active player panels can close before navigation changes.

## Upstream and distribution

Upstream: [truelockmc/streambert](https://github.com/truelockmc/streambert), initial base [4afe564](https://github.com/truelockmc/streambert/commit/4afe564e5ea2565c96d6f2e61679c00fad2d498c). Keep Android adaptations scoped, preserve applicable upstream notices, and describe desktop behavior changes explicitly.

Use the source for the exact release tag when rebuilding a published version. Release source archives must exclude signing credentials, local machine paths, dependencies, generated build output, and user data. See [LICENSE](../LICENSE) and the [Android notes](../ANDROID.md).
