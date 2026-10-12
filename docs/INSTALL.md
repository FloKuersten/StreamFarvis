# Installing & Sideloading StreamFarvis APK

A complete, step-by-step visual guide on how to download, verify, sideload, and update the **StreamFarvis** Android APK on phones, tablets, Android TV, and emulators.

![4 Steps to Install StreamFarvis APK](images/apk-install-guide.png)

---

## Quick Navigation

- [Requirements & Compatibility](#requirements--compatibility)
- [Download Links & QR Code](#download-links--qr-code)
- [Method 1: Direct Phone / Tablet Install (Recommended)](#method-1-direct-phone--tablet-install-recommended)
- [Method 2: ADB Sideloading (PC / Mac / Linux)](#method-2-adb-sideloading-pc--mac--linux)
- [Method 3: Android TV & Fire TV Sideloading](#method-3-android-tv--fire-tv-sideloading)
- [Verifying APK Integrity (SHA-256)](#verifying-apk-integrity-sha-256)
- [Updating Without Data Loss](#updating-without-data-loss)
- [First Launch & TMDB Token Setup](#first-launch--tmdb-token-setup)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Requirements & Compatibility

| Requirement | Specification | Notes |
| :--- | :--- | :--- |
| **Android Version** | **Android 7.0 (API 24) or newer** | Tested on Android 7 through Android 16 |
| **Architecture** | **Universal (ARM64, ARMv7, x86_64, x86)** | Runs on any standard Android hardware |
| **WebView Engine** | **Android System WebView 80+** | Modern WebView required for player & styles |
| **Storage** | **~40 MB free space** | APK is ~4.5 MB; app cache requires ~35 MB |
| **TMDB Token** | **Personal TMDB Read Access Token** | Free to acquire; see [TMDB Guide](../tmdb-tutorial.md) |
| **Google Play** | **Not required (No Play Services needed)** | Fully sideloadable and de-Googled friendly |

---

## Download Links & QR Code

### Official Release Assets

- 📥 **[Download Latest Signed Release APK (GitHub Releases Page)](https://github.com/FloKuersten/StreamFarvis/releases/latest)**
- ⚡ **[Direct 1-Click APK Download](https://github.com/FloKuersten/StreamFarvis/releases/download/android-v1.0.1/StreamFarvis-1.0.1-release.apk)** (`StreamFarvis-1.0.1-release.apk`)
- 🛡️ **[Official SHA-256 Checksum File](https://github.com/FloKuersten/StreamFarvis/releases/download/android-v1.0.1/StreamFarvis-1.0.1-release.apk.sha256)**

### Scan to Download on Phone

If you are reading this on a computer, point your phone camera at the QR code below to jump directly to the download:

<p align="center">
  <img src="images/qr-download.png" width="300" alt="Scan to Download StreamFarvis APK" />
</p>

### Which APK Should I Choose?

| Variant | Purpose | Key Details |
| :--- | :--- | :--- |
| **`StreamFarvis-*-release.apk`** *(Recommended)* | General use & daily viewing | Production-optimized, hardened Keystore storage, signed with release key, smaller download. |
| **`StreamFarvis-*-debug.apk`** | Development & testing | Debuggable via `chrome://inspect`, verbose logging, larger file size. |

---

## Method 1: Direct Phone / Tablet Install (Recommended)

Follow these steps when downloading the APK directly using your Android mobile browser (Chrome, Firefox, Brave, Samsung Internet, DuckDuckGo, etc.):

### Step 1: Download the APK
1. Open the [StreamFarvis Latest Release](https://github.com/FloKuersten/StreamFarvis/releases/latest) in your mobile browser.
2. Under **Assets**, tap **`StreamFarvis-1.0.1-release.apk`**.
3. If your browser displays a warning stating *"File might be harmful. Do you want to download StreamFarvis-1.0.1-release.apk anyway?"*, tap **Download anyway**.
   > [!NOTE]
   > Android shows this standard security alert for any APK downloaded outside the Google Play Store.

### Step 2: Open the APK
1. Once the download finishes, tap **Open** from the browser snackbar or open your **Files / Downloads** app and tap the APK file.

### Step 3: Grant "Install Unknown Apps" Permission
If this is your first time sideloading an app from your browser or file manager:
1. Android will display: *"For your security, your phone currently isn't allowed to install unknown apps from this source."*
2. Tap **Settings** on the prompt.
3. Toggle **Allow from this source** to **ON**.
4. Tap the **Back button** or arrow to return to the installer.

### Step 4: Handle Google Play Protect (If Prompted)
1. If Google Play Protect scans the app and shows *"Unrecognized app"* or *"Blocked by Play Protect"*:
   - Tap **More details** (or **Install anyway**).
   - Tap **Install anyway**.
   > [!TIP]
   > StreamFarvis is fully open source under GPL-3.0. Play Protect flags recently compiled open-source APKs that lack commercial developer signatures.

### Step 5: Complete Installation & Launch
1. Tap **Install**.
2. When finished, tap **Open** to launch StreamFarvis.

---

## Method 2: ADB Sideloading (PC / Mac / Linux)

ADB (Android Debug Bridge) is the fastest way for developers and enthusiasts to install or update the app on connected devices or emulators.

### Option A: Using StreamFarvis Helper Script

The repository includes a fast installer script that detects connected devices and pushes the APK:

```bash
# Install the release APK to your connected phone or emulator
npm run android:install -- --release

# Don't have the APK built locally? Automatically download and install:
npm run android:install -- --release --download

# Install and automatically launch the app
npm run android:install -- --release --launch

# Target a specific device serial if multiple devices are attached
npm run android:install -- --device <serial>
```

### Option B: Manual ADB Command

```bash
# 1. Connect phone via USB and ensure "USB Debugging" is enabled in Developer Options
adb devices

# 2. Sideload the APK (-r preserves data, -d allows downgrade, -t allows test packages)
adb install -r -d -t artifacts/StreamFarvis-1.0.1-release.apk

# 3. (Optional) Launch the app from command line
adb shell am start -n com.farvis.streamfarvis/.MainActivity
```

### Option C: Wireless ADB Sideloading

```bash
# Pair or connect wirelessly (Android 11+ supports Wireless Debugging in Developer Options)
adb connect 192.168.1.50:5555
adb install -r -d -t artifacts/StreamFarvis-1.0.1-release.apk
```

---

## Method 3: Android TV & Fire TV Sideloading

StreamFarvis can be loaded onto Android TV, Google TV (Chromecast), and Amazon Fire TV Sticks:

### Using the "Downloader" App (AFTVnews)
1. On your TV app store, search for and install **Downloader**.
2. In your TV Settings:
   - Go to **Device Preferences / My Fire TV** &rarr; **Developer Options**.
   - Select **Install unknown apps** and enable **Downloader**.
3. Open Downloader and enter either the quick shortlink or the direct release URL:
   - **Quick Shortlink (easy to type with TV remote):**
     `tinyurl.com/24lduo78`
   - **Full GitHub Releases URL:**
     `https://github.com/FloKuersten/StreamFarvis/releases/latest`
4. Downloader will immediately fetch `StreamFarvis-1.0.1-release.apk`. When the download completes, click **Install**.

---

## Verifying APK Integrity (SHA-256)

Before installing, you can verify that the downloaded APK matches the official release checksum:

**Expected SHA-256 for `StreamFarvis-1.0.1-release.apk`:**
```text
793f0bfa90da6027d0e78e1ed04491eb50966b930807a447ad7cd92c0b56d565
```

### Verification Commands

- **Windows PowerShell:**
  ```powershell
  Get-FileHash .\StreamFarvis-1.0.1-release.apk -Algorithm SHA256
  ```

- **Linux / macOS / WSL:**
  ```bash
  sha256sum StreamFarvis-1.0.1-release.apk
  ```

- **Android (Termux):**
  ```bash
  sha256sum /sdcard/Download/StreamFarvis-1.0.1-release.apk
  ```

---

## Updating Without Data Loss

To preserve your **watchlist, viewing history, and encrypted TMDB token**:

> [!IMPORTANT]
> **DO NOT uninstall the previous version before updating!**
> Android wipes an application's internal data and Keystore encryption keys upon uninstallation.

1. Download the new release APK (`StreamFarvis-*-release.apk`).
2. Open the APK on your device.
3. Android will ask: *"Do you want to update this app? Your existing data will not be lost."*
4. Tap **Update**.
5. All your watchlist items, manual watched markers, and saved credentials remain intact.

*Note: In-place updates require that both APKs are signed with the same key. Official GitHub releases are consistently signed with the StreamFarvis release identity.*

---

## First Launch & TMDB Token Setup

When you open StreamFarvis for the first time:

1. You will be greeted by the **Welcome & Setup** screen.
2. Tap **Setup instructions** or visit [TMDB API Token Guide](../tmdb-tutorial.md).
3. Log in to [The Movie Database (TMDB)](https://www.themoviedb.org/) and create a free API Read Access Token.
4. Copy your **API Read Access Token (v4 auth)** — this is the long token starting with `eyJ...`, not the short API key.
5. Paste it into StreamFarvis and tap **Save and explore**.
6. Your token is encrypted via the **Android Keystore system** and stored securely on your device.

---

## Troubleshooting & FAQ

### 1. "App not installed"
- **Cause A (Key Mismatch):** You previously installed a locally built debug APK or an unofficial APK signed with a different key.
  - *Fix:* If you must switch signing identities, back up your TMDB token, uninstall the old version, and install the official release.
- **Cause B (Low Storage):** Device has insufficient free storage.
  - *Fix:* Free up at least 100 MB of internal storage and retry.

### 2. "Problem parsing the package" (Parse Error)
- **Cause A (Incomplete Download):** The APK file was partially downloaded or truncated.
  - *Fix:* Re-download the APK using stable Wi-Fi and verify the SHA-256 hash.
- **Cause B (Unsupported OS):** Device is running Android 6.0 (Marshmallow) or older.
  - *Fix:* StreamFarvis requires Android 7.0 (API 24) or higher.

### 3. "Blocked by Play Protect"
- Tap **More details**, then tap **Install anyway**. Play Protect flags new APKs not listed on Google Play.

### 4. "Cannot open file" when tapping download
- Some third-party browsers do not associate downloaded `.apk` files with the Android Package Installer.
  - *Fix:* Open your phone's native **Files** or **Downloads** app, find `StreamFarvis-1.0.1-release.apk`, and tap it from there.

### 5. Player shows black screen or fails to load controls
- Ensure **Android System WebView** is updated via Google Play or your device system updates. Outdated WebViews (older than version 80) lack modern CSS and JavaScript support.

---

*For build instructions or contributing code, see [DEVELOPMENT.md](DEVELOPMENT.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).*
