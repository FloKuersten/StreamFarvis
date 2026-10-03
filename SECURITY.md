# Security policy

Security fixes target the latest published StreamFarvis Android release. Older releases may require an update rather than receive a separate patch.

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/FloKuersten/StreamFarvis/security/advisories/new). Do not disclose a vulnerability in a public issue before maintainers have had an opportunity to investigate it.

Include the affected version, Android and WebView versions, reproduction steps, expected and actual behavior, and the potential impact. A minimal proof of concept is helpful. Do not include personal tokens, signing credentials, private user data, or recordings containing them.

If private reporting is unavailable, open an issue asking for a private reporting channel without including vulnerability details. No response-time guarantee is currently offered.

## Security boundaries

- The application stores TMDB tokens using encryption backed by Android Keystore. Android app-data backup is disabled.
- Third-party player pages run in a separate WebView without the app's Capacitor bridge. Player navigation is restricted by an HTTPS provider allowlist; popups and downloads are blocked.
- Providers still control their content and may contain ads or tracking. The Android port does not include the full desktop request-blocking engine.
- Release builds disable WebView debugging. Local debug builds are intended for development.

Token exposure, player-to-app bridge access, unexpected navigation outside the player allowlist, and release signing or dependency compromise are examples of issues worth reporting. Ordinary provider outages and unsupported videos belong in the regular issue tracker.
