# StreamFarvis for Android

An Android adaptation of [Streambert](https://github.com/truelockmc/streambert), based on upstream commit `4afe564e5ea2565c96d6f2e61679c00fad2d498c` (2.6.0 package version). The original React interface, catalog, search, library, theme system, artwork and provider URL generation are retained. The Android changes were made on 2026-10-03.

## Install

Download `StreamFarvis-1.0.1-release.apk` from the [latest GitHub release](https://github.com/FloKuersten/StreamFarvis/releases/latest), copy it to your Android device, open it, and permit your file manager to install apps if Android prompts you. Android 7.0 (API 24) or newer and an up-to-date Android System WebView are required. The signed APK is intended for sideloading.

On first launch, enter your own **TMDB API Read Access Token**. Follow the setup link in the app or the existing [TMDB guide](tmdb-tutorial.md). No shared token is bundled. You can skip setup to inspect the interface, but catalog browsing/search need a token and an internet connection.

Select a movie or an episode, then tap **Open player**. The source selector lets you switch among the upstream providers. Android Back returns from the player; fullscreen video supports landscape. Providers are third-party services and may be unavailable or lack a particular video. Only watch content you are entitled to access.

## Included in this port

- Phone and tablet layouts, touch navigation and Android Back handling.
- TMDB metadata, search, movie/TV details, season and episode selection.
- Local saved library and manually marked watched progress.
- Playback in an isolated Android WebView with fullscreen and popup blocking.
- TMDB tokens encrypted using Android Keystore; backups of app data are disabled.
- Android appearance/language settings and external browser trailer links.

The Electron downloader, local-file library, AllManga resolver, automatic playback progress tracking, automatic next-episode playback, desktop picture-in-picture, Discord presence, and desktop updater are not part of this Android build. Anime uses the normal TMDB providers/season numbering. This port does not implement the complete desktop request-blocking engine; third-party player content can still contain ads or tracking.

## Build again

Use Node.js 22.12 or newer, JDK 21–25, and Android SDK platform 36/build-tools 36.0.0. Set `JAVA_HOME` and `ANDROID_HOME` (or create `android/local.properties` with your SDK path). Gradle 9.1.0 is pinned by the wrapper. See the [development guide](docs/DEVELOPMENT.md) for setup, code locations, and testing.

```powershell
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
npm ci
npm run android:apk
```

This compiles the web app, synchronizes Capacitor assets/plugins, and builds debug and signed release APKs into `artifacts/`, with SHA-256 files. On the first build it creates a signing key in `.signing/`. Keep a private backup of that directory: future APK updates require the same signing key. It is ignored by Git and excluded from the source archive. Do not distribute it.

```powershell
npm run dev:android
```

The browser preview shows the Android layout but cannot launch the native player. Preview tokens remain in memory only. For device testing use the debug APK. The delivered release disables WebView debugging.

## License and source

Original Streambert copyright and author credit are preserved. This derivative is distributed under **GPL-3.0**; see [LICENSE](LICENSE). The source archive accompanying the APK contains the modified application and build scripts, excluding dependencies, generated build output, machine paths and signing secrets. Keep the corresponding source and license available whenever you redistribute the APK. Upstream project: https://github.com/truelockmc/streambert.

See the [release notes](https://github.com/FloKuersten/StreamFarvis/releases) for checks performed on each APK and their limits. Browser or emulator checks do not establish that every provider can stream on a physical device.
