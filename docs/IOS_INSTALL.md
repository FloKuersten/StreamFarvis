# Installing & Sideloading StreamFarvis for iOS

A complete, step-by-step visual guide on how to build, sideload, install, and update **StreamFarvis** on iPhone and iPad.

![StreamFarvis iOS Showcase](images/ios-showcase.png)

---

## Table of Contents

- [Overview & iOS Requirements](#overview--ios-requirements)
- [How Sideloading Works on iOS](#how-sideloading-works-on-ios)
- [Method 1: Sideloadly (Windows & macOS — Recommended)](#method-1-sideloadly-windows--macos--recommended)
- [Method 2: AltStore / SideStore (Wi-Fi Auto Refresh)](#method-2-altstore--sidestore-wi-fi-auto-refresh)
- [Method 3: TrollStore (Permanent Sign — iOS 14.0–17.0)](#method-3-trollstore-permanent-sign--ios-140170)
- [Method 4: Building & Deploying via Xcode (macOS)](#method-4-building--deploying-via-xcode-macos)
- [Notch, Dynamic Island & Safe Area Support](#notch-dynamic-island--safe-area-support)
- [Native Picture-in-Picture (PiP) on iOS](#native-picture-in-picture-pip-on-ios)
- [In-App Updates](#in-app-updates)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Overview & iOS Requirements

StreamFarvis for iOS is packaged as an Xcode / Capacitor project with native WebKit views, Picture-in-Picture playback, and iOS Keychain security for TMDB API credentials.

| Requirement | Specification | Notes |
| :--- | :--- | :--- |
| **iOS Version** | **iOS 15.0 or newer** | Compatible with iOS 15 through iOS 18+ |
| **Device Support** | **iPhone & iPad** | Adapts to portrait, landscape, notch, and Dynamic Island |
| **Apple ID** | **Any free personal Apple ID** | No $99/year developer membership required |
| **Media Player** | **WKWebView with PiP** | Native Picture-in-Picture, AirPlay, and popup blocking |
| **Security** | **Apple Keychain Services** | Encrypted token storage (`SecItemAdd` / `SecItemCopyMatching`) |
| **TMDB Token** | **Personal TMDB Read Access Token** | Free from [themoviedb.org](https://www.themoviedb.org/) |

---

## How Sideloading Works on iOS

![iOS Sideloading Flow](images/ios-sideload-flow.png)

On iOS, sideloading allows you to install apps packaged as `.ipa` files without going through the Apple App Store. Free Apple IDs are permitted to sign up to 3 apps for 7 days. Sideloading tools handle resigning automatically over USB or local Wi-Fi.

---

## Method 1: Sideloadly (Windows & macOS — Recommended)

Sideloadly is the easiest, most reliable tool for Windows and Mac users.

1. **Install Sideloadly**:
   - Download and install [Sideloadly](https://sideloadly.io/) on your PC or Mac.
   - On Windows, ensure standard iTunes and iCloud (non-Microsoft Store versions) are installed so USB device drivers work.

2. **Connect your iPhone or iPad**:
   - Connect your iOS device to your computer via USB.
   - Unlock your device and tap **Trust This Computer** when prompted.

3. **Load StreamFarvis**:
   - Open Sideloadly. Your connected device should appear in the device dropdown.
   - Download the latest `StreamFarvis.ipa` from the [GitHub Releases](https://github.com/FloKuersten/StreamFarvis/releases).
   - Drag and drop `StreamFarvis.ipa` onto Sideloadly.

4. **Sign and Install**:
   - Enter your Apple ID email in the Apple ID field.
   - Click **Start**. If prompted for your Apple ID password or two-factor code, enter it (Sideloadly sends credentials directly to Apple for signing).
   - Wait until Sideloadly reports **Done**.

5. **Trust Certificate on iPhone**:
   - On your iPhone, navigate to **Settings → General → VPN & Device Management**.
   - Under **Developer App**, tap your Apple ID email.
   - Tap **Trust "[Your Apple ID]"** and confirm.
   - Enable **Developer Mode** under **Settings → Privacy & Security → Developer Mode** if running iOS 16+.
   - Launch **StreamFarvis** from your Home Screen!

---

## Method 2: AltStore / SideStore (Wi-Fi Auto Refresh)

If you prefer refreshing apps wirelessly without tethering to a computer every week:

### AltStore
1. Set up [AltServer](https://altstore.io/) on your PC or Mac and install AltStore on your device.
2. In Safari on your iPhone, visit [StreamFarvis Releases](https://github.com/FloKuersten/StreamFarvis/releases) and download `StreamFarvis.ipa`.
3. Open the downloaded `.ipa` in AltStore.
4. AltStore signs and installs the app. When on the same Wi-Fi network as your computer, AltStore refreshes the 7-day expiration automatically in the background.

### SideStore
1. Follow the [SideStore Guide](https://sidestore.io/) to configure SideStore on your device (uses a local WireGuard loopback VPN).
2. Download `StreamFarvis.ipa` and open it inside SideStore.
3. Refresh apps directly on-device without needing your computer running!

---

## Method 3: TrollStore (Permanent Sign — iOS 14.0–17.0)

If your device is running an iOS version compatible with [TrollStore](https://github.com/opa334/TrollStore) (leveraging CoreTrust):
1. Download `StreamFarvis.ipa` in Safari.
2. Share/open with **TrollStore**.
3. TrollStore installs StreamFarvis permanently—no 7-day expiration, no app limits, and no computer required ever again!

---

## Method 4: Building & Deploying via Xcode (macOS)

If you have a Mac and want to develop, test, or build your own custom IPA:

```bash
# 1. Clone repository
git clone https://github.com/FloKuersten/StreamFarvis.git
cd StreamFarvis

# 2. Install dependencies
npm ci

# 3. Build web app for iOS
npm run build:ios

# 4. Sync assets to Xcode project
npm run ios:sync

# 5. Open Xcode
npm run ios:open
```

### In Xcode:
1. Select the **App** target in the sidebar.
2. Go to **Signing & Capabilities**.
3. Check **Automatically manage signing** and choose your Apple ID Team.
4. Select your connected device from the device picker at the top.
5. Click **Run (Cmd + R)**.

---

## Notch, Dynamic Island & Safe Area Support

StreamFarvis features dedicated styling for iOS hardware cutouts:
- **`viewport-fit=cover`** enables edge-to-edge rendering without artificial black letterboxing bars.
- Header offsets respect the Dynamic Island and camera notches via `env(safe-area-inset-top)`.
- Bottom navigation tabs use `env(safe-area-inset-bottom)` to sit comfortably above the iOS Home Indicator.
- Native momentum scrolling (`-webkit-overflow-scrolling: touch`) provides standard iOS physics and bounce behavior.

---

## Native Picture-in-Picture (PiP) on iOS

When watching a title in StreamFarvis:
1. Tap **Open player** on your movie or episode.
2. Once the stream begins playing in full screen, swipe up to return to your Home Screen or tap the native Picture-in-Picture button on the video player.
3. The video will pop out into a floating window that stays on top while you browse other apps or text friends!
4. Tap the floating window to return to full screen anytime.

---

## In-App Updates

StreamFarvis includes a built-in release checker:
- Go to **Settings → 04 Updates**.
- Tap **Check now** to query the latest GitHub releases.
- If a new version is available, tap **Download iOS Release** to jump directly to the `.ipa` asset or release page.
- Install the updated `.ipa` over your existing installation via Sideloadly or AltStore to preserve your watchlist and watch history!

---

## Troubleshooting & FAQ

### "Untrusted Developer" when tapping the app icon
Go to **Settings → General → VPN & Device Management**, tap your email under Developer App, and tap **Trust**.

### "Developer Mode Required" (iOS 16, 17, 18)
Go to **Settings → Privacy & Security**, scroll down to **Developer Mode**, toggle it **On**, and restart your device.

### "App installation failed: Maximum number of apps reached"
Free Apple IDs can only have 3 active sideloaded apps at a time. Remove an unused sideloaded app in AltStore/Sideloadly and try again.

### Video fails to load or shows a black screen
Streaming providers are third-party services. Tap **Playback source** and switch to a different provider (e.g. VidSrc, SuperEmbed, etc.).
