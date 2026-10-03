# Contributing to StreamFarvis

Bug reports, documentation improvements, and focused Android fixes are welcome. Read the [README](README.md) and [development guide](docs/DEVELOPMENT.md), then check the [issue tracker](https://github.com/FloKuersten/StreamFarvis/issues) before starting.

## Report a bug

Include the app version, Android version, device model, and Android System WebView version, plus clear reproduction steps and what you expected. For playback issues, name the selected provider and whether the problem affects one title or several. A provider outage may not be an application bug.

Screenshots and short, relevant logs help. Remove TMDB tokens, other credentials, personal information, and private playback URLs before posting. Use [private security reporting](SECURITY.md) for vulnerabilities.

## Submit a change

1. Fork this repository and create a branch for one change.
2. Follow the existing code style and keep Android changes scoped where practical.
3. Build with `npm run android:apk`, and run the checks relevant to your change.
4. Check affected UI on a phone-sized viewport and test native behavior on an emulator or device when applicable.
5. Open a pull request describing the problem, resulting behavior, checks performed, and any remaining limitations.

Distinguish browser or fixture tests from real Android/provider playback. Update documentation when behavior or setup changes. Do not commit signing keys, local SDK paths, tokens, generated APKs, dependencies, or personal data.

Contributions are distributed under this project's [GPL-3.0 license](LICENSE). Preserve upstream author and license notices. Send StreamFarvis Android issues here; the original Streambert project maintains its own desktop workflow.
