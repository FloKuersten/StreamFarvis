import { useEffect, useId, useRef, useState } from "react";
import { PlayIcon } from "./Icons";
import { ANDROID_PLAYER_SOURCES, openAndroidPlayer } from "../utils/android";
import "../styles/android-player.css";

export default function AndroidPlayer({ url, title, subtitle, sourceId, onSourceChange }) {
  const sourceSelectId = useId();
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);
  const currentUrl = useRef(url);
  currentUrl.current = url;

  useEffect(() => {
    setOpened(false);
    setError(null);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [url]);

  async function openPlayer() {
    if (opening) return;
    setOpening(true);
    setError(null);
    const requestedUrl = url;
    try {
      await openAndroidPlayer({ url, title });
      if (currentUrl.current === requestedUrl) setOpened(true);
    } catch (err) {
      if (currentUrl.current === requestedUrl) {
        setError(err?.message || "The player could not open. Try again or choose another source.");
      }
    } finally {
      setOpening(false);
    }
  }

  return (
    <section ref={cardRef} className="android-player" aria-label="Android player">
      <div className="android-player__heading">
        <span className="android-player__icon"><PlayIcon /></span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <p className="android-player__description">
        Open the player to watch. Use Android Back to return here and choose another episode or source.
      </p>
      <div className="android-player__controls">
        <label htmlFor={sourceSelectId}>
          Playback source
          <select id={sourceSelectId} value={sourceId} disabled={opening}
            onChange={(event) => onSourceChange(event.target.value)}>
            {ANDROID_PLAYER_SOURCES.map((source) => (
              <option key={source.id} value={source.id}>{source.label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={openPlayer} disabled={opening || !url}>
          <PlayIcon />
          {opening ? "Opening…" : error ? "Retry player" : opened ? "Open player again" : "Open player"}
        </button>
      </div>
      {error && <p className="android-player__error" role="alert">{error}</p>}
      <p className="android-player__note">
        If a video is unavailable, choose another source. Mark your progress below after watching.
      </p>
    </section>
  );
}
