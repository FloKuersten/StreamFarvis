# Add your TMDB token

StreamFarvis uses TMDB for movie and series metadata, artwork, and search. Each user supplies their own API Read Access Token. No shared token is bundled with the app.

1. [Create a TMDB account](https://www.themoviedb.org/signup) or [sign in](https://www.themoviedb.org/login).
2. Open your [API settings](https://www.themoviedb.org/settings/api). If API access has not been set up, follow TMDB's application steps and provide the required information.
3. Copy the **API Read Access Token**. This is the long token commonly starting with `eyJ`; it is different from the shorter API key.
4. Paste it into StreamFarvis's setup screen and tap **Let's go**. The app validates the token before saving it.

On Android, the token is encrypted using Android Keystore. You can replace it in **Settings → Catalog**, or remove it with **Settings → Reset app**. Reset also removes your watchlist, history, and preferences from that device.

## Troubleshooting

- **Invalid token:** recopy the Read Access Token, checking for omitted characters or extra text. A revoked token needs to be replaced.
- **Cannot reach TMDB or request timed out:** check your connection and whether TMDB is reachable from your network.
- **Catalog works but a video does not:** TMDB supplies metadata, not playback. The selected third-party player source may be unavailable or lack the video.

Do not put your token in a public issue, screenshot, or log. For app problems, [report a StreamFarvis issue](https://github.com/FloKuersten/StreamFarvis/issues/new/choose) with the visible error and your app/Android versions, without the token.
