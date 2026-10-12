import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { storage, secureStorage, STORAGE_KEYS, clearAppCaches } from "../utils/storage";
import { ACCENT_PRESETS, THEME_PRESETS, applyAccentColor, applyTheme } from "../utils/appearance";
import { checkForUpdatesWithFallback } from "../utils/updates";
import licenseText from "../../LICENSE?raw";

const LANGUAGES = [
  ["en-US", "English"], ["de-DE", "Deutsch"], ["fr-FR", "Français"],
  ["es-ES", "Español"], ["it-IT", "Italiano"], ["ja-JP", "日本語"],
];

function ExternalLink({ href, children }) {
  return <a href={href} onClick={(event) => {
    event.preventDefault();
    if (window.electron?.openExternal) window.electron.openExternal(href);
    else window.open(href, "_blank", "noopener,noreferrer");
  }}>{children}</a>;
}

export default function AndroidSettingsPage({ apiKey, onChangeApiKey }) {
  const [theme, setTheme] = useState(() => storage.get(STORAGE_KEYS.THEME) || "dark");
  const [accent, setAccent] = useState(() => storage.get(STORAGE_KEYS.ACCENT_COLOR) || "red");
  const [language, setLanguage] = useState(() => storage.get(STORAGE_KEYS.TMDB_LANG) || "en-US");
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const isIOS = Capacitor.getPlatform() === "ios" || import.meta.env.VITE_IOS === "1";

  useEffect(() => {
    window.electron?.getAppVersion?.().then(setVersion).catch(() => {});
  }, []);

  useEffect(() => {
    const onBack = (event) => {
      if (showLicense || confirmReset) {
        event.preventDefault();
        setShowLicense(false);
        setConfirmReset(false);
      }
    };
    window.addEventListener("streamfarvis:back-overlay", onBack);
    return () => window.removeEventListener("streamfarvis:back-overlay", onBack);
  }, [showLicense, confirmReset]);

  const updateTheme = (next) => {
    storage.set(STORAGE_KEYS.THEME, next);
    applyTheme(next);
    setTheme(next);
  };

  const updateAccent = (next) => {
    storage.set(STORAGE_KEYS.ACCENT_COLOR, next);
    applyAccentColor(next);
    setAccent(next);
    window.dispatchEvent(new Event("streambert:player-settings-changed"));
  };

  const updateLanguage = (next) => {
    storage.set(STORAGE_KEYS.TMDB_LANG, next);
    setLanguage(next);
    window.dispatchEvent(new Event("streambert:tmdb-lang-changed"));
    setStatus("Catalog language updated. Newly opened titles use this language.");
  };

  const resetApp = async () => {
    setBusy(true);
    setStatus("");
    try {
      await Promise.all(["apikey", "subdlApiKey", "wyzieApiKey"].map((key) => secureStorage.set(key, "")));
      await clearAppCaches();
      storage.clearAll();
      window.location.reload();
    } catch {
      setStatus("Could not reset secure storage. Please try again.");
      setBusy(false);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateResult(null);
    try {
      const res = await checkForUpdatesWithFallback();
      setUpdateResult(res);
    } catch (err) {
      setUpdateError(err?.message || "Could not check for updates. Check your connection.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="android-settings fade-in">
      <div className="android-page-heading"><span className="android-eyebrow">YOUR SPACE</span><h1>Settings</h1><p>A cinema that feels like you.</p></div>

      <section className="android-settings-section" aria-labelledby="settings-catalog">
        <h2 id="settings-catalog"><span className="android-section-index" aria-hidden="true">01</span> Catalog</h2>
        <div className="android-setting-row">
          <div><h3>TMDB Read Access Token</h3><p>{apiKey ? "Your token is saved on this device." : "Add your personal token to load movies and series."}</p></div>
          <button className="btn btn-secondary" onClick={onChangeApiKey}>{apiKey ? "Replace token" : "Add token"}</button>
        </div>
        <label className="android-setting-row" htmlFor="android-language">
          <div><h3>Catalog language</h3><p>Movie titles, descriptions and episode details.</p></div>
          <select id="android-language" value={language} onChange={(event) => updateLanguage(event.target.value)}>
            {LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </section>

      <section className="android-settings-section" aria-labelledby="settings-appearance">
        <h2 id="settings-appearance"><span className="android-section-index" aria-hidden="true">02</span> Appearance</h2>
        <h3>Theme</h3>
        <div className="android-theme-grid" role="group" aria-label="Theme">
          {THEME_PRESETS.filter((preset) => preset.id !== "custom").map((preset) => (
            <button key={preset.id} className={`android-theme-option${theme === preset.id ? " selected" : ""}`} aria-pressed={theme === preset.id} onClick={() => updateTheme(preset.id)}>
              <span className="android-theme-preview" style={{ background: preset.vars["--bg"], borderColor: preset.vars["--border"] }}><span style={{ background: preset.vars["--surface3"] }} /></span>
              {preset.label}
            </button>
          ))}
        </div>
        <h3>Accent color</h3>
        <div className="android-accent-options" role="group" aria-label="Accent color">
          {ACCENT_PRESETS.map((preset) => (
            <button key={preset.id} aria-label={preset.label} aria-pressed={accent === preset.id} className={`android-accent-option${accent === preset.id ? " selected" : ""}`} onClick={() => updateAccent(preset.id)}>
              <span style={{ background: preset.color }}>{accent === preset.id ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="android-settings-section" aria-labelledby="settings-data">
        <h2 id="settings-data"><span className="android-section-index" aria-hidden="true">03</span> Your data</h2>
        <div className="android-setting-row"><div><h3>Clear cached data</h3><p>Keep your watchlist, history and token.</p></div><button className="btn btn-secondary" onClick={async () => {
          await clearAppCaches();
          storage.remove("trendingCache");
          setStatus("Cached data cleared.");
        }}>Clear cache</button></div>
        <div className="android-setting-row"><div><h3>Reset this app</h3><p>Remove your token, watchlist, history and preferences from this device.</p></div><button className="btn btn-ghost android-danger" onClick={() => setConfirmReset(true)}>Reset app</button></div>
        {confirmReset && <div className="android-reset-confirm" role="alertdialog" aria-label="Confirm app reset"><p>This permanently removes your local app data.</p><div className="android-button-row"><button className="btn btn-secondary" disabled={busy} onClick={() => setConfirmReset(false)}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={resetApp}>{busy ? "Resetting…" : "Delete my app data"}</button></div></div>}
        {status && <p className="android-status" role="status">{status}</p>}
      </section>

      <section className="android-settings-section" aria-labelledby="settings-updates">
        <h2 id="settings-updates"><span className="android-section-index" aria-hidden="true">04</span> Updates</h2>
        <div className="android-setting-row">
          <div>
            <h3>Check for updates</h3>
            <p>StreamFarvis {version ? `v${version}` : ""} · GitHub Releases</p>
          </div>
          <button className="btn btn-secondary" disabled={checkingUpdate} onClick={handleCheckUpdates}>
            {checkingUpdate ? "Checking…" : "Check now"}
          </button>
        </div>
        {updateResult && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--surface2)", borderRadius: 8 }}>
            {updateResult.hasUpdate ? (
              <div>
                <p style={{ fontWeight: 600, color: "var(--red)", marginBottom: 6 }}>
                  🎉 Update available: v{updateResult.latest}
                </p>
                {updateResult.changelog && (
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, maxHeight: 120, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                    {updateResult.changelog.slice(0, 350)}
                  </p>
                )}
                <div className="android-button-row">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const dlUrl = isIOS
                        ? (updateResult.assets?.ipa || updateResult.url)
                        : (updateResult.assets?.apk || updateResult.url);
                      window.electron?.openExternal?.(dlUrl);
                    }}
                  >
                    {isIOS ? "Download iOS Release" : "Download APK (v" + updateResult.latest + ")"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.electron?.openExternal?.(updateResult.url)}
                  >
                    Release notes ↗
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#48c774", margin: 0 }}>
                ✓ StreamFarvis is up to date (v{version || updateResult.current}).
              </p>
            )}
          </div>
        )}
        {updateError && (
          <p className="android-status" style={{ color: "var(--red)" }} role="alert">
            {updateError}
          </p>
        )}
      </section>

      <section className="android-settings-section android-about" aria-labelledby="settings-about">
        <h2 id="settings-about">StreamFarvis {version && <span>v{version}</span>}</h2>
        <p>Mobile adaptation of <ExternalLink href="https://github.com/truelockmc/streambert">Streambert by truelockmc and contributors</ExternalLink>, licensed under the GNU General Public License v3.</p>
        <p>Movie and series metadata is provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <button className="android-text-button" onClick={() => setShowLicense(true)}>Read the GPL-3.0 license</button>
      </section>

      {showLicense && <div className="modal-overlay android-license-overlay" onClick={(event) => event.target === event.currentTarget && setShowLicense(false)}><section className="android-license-dialog" role="dialog" aria-modal="true" aria-labelledby="license-title"><div className="android-license-header"><h2 id="license-title">GNU GPL v3</h2><button className="btn btn-secondary" onClick={() => setShowLicense(false)}>Close</button></div><pre>{licenseText}</pre></section></div>}
    </div>
  );
}
