# Android 1.0.0 validation

Checks performed on 2026-10-03. This report distinguishes application checks from external provider availability.

## Build and package

- `npm run android:apk`: web production build, Capacitor sync, Android unit tests, Android lint, debug APK and signed release APK.
- Native URL-policy suite: 4 tests passing, covering permitted providers and rejection of unsupported URLs.
- Android lint: no errors; warnings remain, including dependency updates and platform compatibility recommendations.
- Release APK signature verified with Android `apksigner`. Minimum Android API 24, target API 36.
- Signing key fingerprint (SHA-256): `ecd8361a31e935ab6c38a3487a19e9acb564cbd1152c6cc9c63fa1a1b6c77078`.
- Signing files, credentials, SDK paths and build output are excluded from Git and the release source archive. Release WebView debugging and app backups are disabled.

## Browser UI checks

Phone (360 × 800 and 393 × 852), landscape (844 × 390), and tablet (768 × 1024) layouts were checked for horizontal overflow and JavaScript errors. Setup, navigation, settings, license, library, theme and language controls were exercised.

Fixture responses exercise movie/TV details, source selection, season/episode selection, manual watched markers and layered Back behavior. The TV test checks that Android uses ordinary TMDB seasons without the desktop episode-group remapping. These use simulated metadata and a dummy token; they do not establish that a real TMDB account or a provider works.

The repository's browser tests run against the Android preview. See [Development](DEVELOPMENT.md). README screenshots are browser previews, not device captures.

## Android emulator checks

Android 16 (API 36), Android System WebView 153.0.8010.36:

- App installation, launch and setup screen.
- Encrypted native storage round trip and deletion, using a test value.
- Rejection of an unsupported player URL.
- Native HTTP request to TMDB returned the expected 401 response for an invalid token.
- Opening the isolated native player and displaying its provider error/retry screen.
- The provider WebView exposes neither Capacitor nor the app's native bridge.
- A synthetic canvas video stream played in the native player, entered fullscreen landscape, left fullscreen using Back, and paused when the app entered the background. This is a player/lifecycle check, not provider streaming proof.

The test emulator experienced intermittent System UI unresponsiveness on a resource-constrained host. No physical-device playback or performance certification is claimed. Android 7–15 compatibility is configured in the build but has not been checked on each OS version.

## External-service limits

No valid TMDB Read Access Token was supplied for live catalog testing. Each user must supply their own token.

Vidking failed DNS resolution in this environment; VidEasy returned an HTTP error; VidSrc loaded a provider page but did not produce a verified video stream. Consequently **end-to-end provider playback remains unverified**. Subtitles, DRM, casting, regional availability and sustained streaming were not validated. These providers can change independently of this app.

The Android port omits the desktop downloader, AllManga resolver, automatic progress tracking/next episode and picture-in-picture. See [Android notes](../ANDROID.md) for the complete scope.
