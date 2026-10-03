import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { StreambertLogo, PlayIcon } from "./Icons";

const TMDB_BASE = "https://api.themoviedb.org/3";
const isAndroid = import.meta.env.VITE_ANDROID === "1" || Capacitor.getPlatform() === "android";

async function validateToken(token) {
  // Step 1: Can we reach TMDB at all?
  try {
    const pingRes = await fetch(`${TMDB_BASE}/configuration`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(7000),
    });

    // TMDB is reachable — now check the response
    if (pingRes.status === 401) {
      return { ok: false, reason: "invalid_token" };
    }
    if (pingRes.status === 403) {
      return { ok: false, reason: "forbidden" };
    }
    if (!pingRes.ok) {
      return { ok: false, reason: "tmdb_error", status: pingRes.status };
    }

    // Step 2: Run a real content request to confirm full API access
    const testRes = await fetch(`${TMDB_BASE}/trending/movie/week`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(7000),
    });
    if (!testRes.ok) {
      return { ok: false, reason: "api_error", status: testRes.status };
    }

    return { ok: true };
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    // Network failure — TMDB not reachable
    return { ok: false, reason: "unreachable" };
  }
}

function errorMessage(reason, status) {
  switch (reason) {
    case "invalid_token":
      return {
        title: "Invalid token",
        body: "TMDB rejected the token (401 Unauthorized). Make sure you copied the long JWT Read Access Token, not the shorter API Key.",
      };
    case "forbidden":
      return {
        title: "Access denied",
        body: "TMDB returned 403 Forbidden. Your account may be suspended or the token may have been revoked.",
      };
    case "timeout":
      return {
        title: "Request timed out",
        body: "TMDB took too long to respond. Check your internet connection and try again.",
      };
    case "unreachable":
      return {
        title: "Cannot reach TMDB",
        body: "No connection to api.themoviedb.org. Check your internet connection.",
      };
    default:
      return {
        title: "Something went wrong",
        body: `TMDB returned an unexpected error${status ? ` (HTTP ${status})` : ""}. Try again in a moment.`,
      };
  }
}

function ExternalLink({ href, className, children }) {
  return (
    <a
      className={className}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (window.electron?.openExternal) window.electron.openExternal(href);
        else window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}

export default function SetupScreen({ onSave, onSkip, storageError }) {
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(() => storageError ? { title: "Secure storage unavailable", body: storageError } : null);
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (isAndroid) return;
    const t = setTimeout(() => {
      window.focus();
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async () => {
    const token = key.trim();
    if (!token) return;
    setChecking(true);
    setError(null);
    const result = await validateToken(token);
    if (result.ok) {
      try {
        await onSave(token);
      } catch {
        setError({ title: "Could not save token", body: "Secure storage is unavailable. Please try again." });
      }
    } else {
      setError(errorMessage(result.reason, result.status));
    }
    setChecking(false);
  };

  if (isAndroid) {
    return (
      <div className="apikey-modal android-onboarding">
        <div className="apikey-box android-onboarding-inner">
          <header className="android-setup-brand"><span className="android-wordmark">Stream<span>Farvis</span></span><span className="android-setup-edition">YOUR PERSONAL CINEMA</span></header>
          <div className="android-setup-story">
            <span className="android-eyebrow">THE NEXT GREAT WATCH</span>
            <h1>Make it<br /><em>a movie night.</em></h1>
            <p>Discover a new favorite.<br />Keep every must-watch in one place.</p>
            <div className="android-setup-categories" aria-label="Catalog features"><span>Movies</span><span>Series</span><span>Your watchlist</span></div>
          </div>
          <div className="android-setup-form">
            <label htmlFor="android-tmdb-token">Connect your catalog</label>
            <p className="android-setup-form-help">Paste your personal TMDB Read Access Token to get started.</p>
            <input id="android-tmdb-token" aria-label="TMDB Read Access Token" type="password" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" className={`apikey-input${error ? " apikey-input-error" : ""}`} placeholder="TMDB Read Access Token" value={key} onChange={(event) => { setKey(event.target.value); setError(null); }} onKeyDown={(event) => event.key === "Enter" && !checking && handleSubmit()} ref={inputRef} disabled={checking} />
            {error && <div className="apikey-error-box" role="alert"><div className="apikey-error-title">{error.title}</div><div className="apikey-error-body">{error.body}</div></div>}
            <button className="btn btn-primary android-setup-submit" onClick={handleSubmit} disabled={!key.trim() || checking}>{checking ? <><span className="apikey-spinner" /> Checking…</> : <><PlayIcon /> Let's go</>}</button>
            <details className="android-token-help"><summary>Need a free TMDB token?</summary><p>Open <ExternalLink href="https://www.themoviedb.org/settings/api">TMDB Settings → API</ExternalLink> and copy the long <strong>API Read Access Token</strong>, not the shorter API key. Your token is saved securely on this device.</p><ExternalLink href="https://github.com/FloKuersten/StreamFarvis/blob/main/tmdb-tutorial.md">Read the setup guide ↗</ExternalLink></details>
            {onSkip && <button className="android-skip-setup" onClick={onSkip}>Explore the app first <span aria-hidden="true">→</span></button>}
          </div>
          <p className="android-setup-attribution">Based on Streambert · GPL-3.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apikey-modal">
      <div className="apikey-box">
        <div className="apikey-logo">
          <StreambertLogo />
        </div>
        <div className="apikey-title">{isAndroid ? "STREAMFARVIS" : "STREAMBERT"}</div>
        {isAndroid && <p className="android-setup-caption">Your movies. Your watchlist. On Android.</p>}
        <p className="apikey-sub">
          Enter your <strong>free</strong> TMDB{" "}
          <strong>Read Access Token</strong> to get started.
          <br />
          Go to{" "}
          <ExternalLink
            className="apikey-link"
            href="https://www.themoviedb.org/settings/api"
          >
            themoviedb.org → Settings → API
          </ExternalLink>{" "}
          and copy the <em>API Read Access Token</em> (the long JWT, not the
          shorter API Key below).
          <br />
          <ExternalLink
            className="apikey-link"
            href="https://github.com/truelockmc/streambert/blob/main/tmdb-tutorial.md"
          >
            Step-by-step guide on how to get that Token
          </ExternalLink>
        </p>
        <input
          aria-label="TMDB Read Access Token"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className={`apikey-input${error ? " apikey-input-error" : ""}`}
          placeholder="Paste your TMDB Read Access Token (eyJ...)..."
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && !checking && handleSubmit()}
          ref={inputRef}
          disabled={checking}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            borderColor: error ? "#f44336" : focused ? "var(--red)" : undefined,
          }}
        />

        {error && (
          <div className="apikey-error-box">
            <div className="apikey-error-title">⚠ {error.title}</div>
            <div className="apikey-error-body">{error.body}</div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "13px",
            marginTop: error ? 0 : undefined,
          }}
          onClick={handleSubmit}
          disabled={!key.trim() || checking}
        >
          {checking ? (
            <>
              <span className="apikey-spinner" /> Checking…
            </>
          ) : (
            <>
              <PlayIcon /> Let's go
            </>
          )}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              marginTop: 14,
              background: "none",
              border: "none",
              color: "var(--text3)",
              fontSize: 13,
              cursor: "pointer",
              padding: "6px 0",
              width: "100%",
              textAlign: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            {isAndroid ? "Explore the app first" : "Skip for now"}
          </button>
        )}
        {isAndroid && <p className="android-setup-attribution">Based on Streambert · GPL-3.0<br />A personal TMDB token is required to load the catalog.</p>}
      </div>
    </div>
  );
}
