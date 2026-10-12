import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));

// Read the streamfarvis icon as base64 so it renders perfectly
const iconPath = path.join(root, 'public/streamfarvis-icon.png');
const iconB64 = readFileSync(iconPath).toString('base64');
const iconSrc = `data:image/png;base64,${iconB64}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1600px;
    height: 900px;
    background: #0d0f17;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #e2e8f0;
    overflow: hidden;
    position: relative;
    padding: 36px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Subtle background ambient lighting */
  .glow-1 {
    position: absolute;
    top: -120px;
    left: 200px;
    width: 500px;
    height: 350px;
    background: radial-gradient(circle, rgba(231, 76, 60, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .glow-2 {
    position: absolute;
    bottom: -80px;
    right: 300px;
    width: 600px;
    height: 400px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .app-logo {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.35);
  }
  .header-text h1 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-text h1 span {
    background: linear-gradient(135deg, #ff6b6b 0%, #e74c3c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .header-text p {
    font-size: 14px;
    color: #94a3b8;
    margin-top: 3px;
  }
  .badge-tag {
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.4);
    color: #ff6b6b;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Main steps container */
  .steps-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    z-index: 2;
    margin: 16px 0;
  }

  /* Step Card */
  .step-card {
    background: #151824;
    border-radius: 20px;
    border: 1px solid #24293d;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
  }
  .step-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  .card-1::before { background: linear-gradient(90deg, #ff6b6b, #e74c3c); }
  .card-2::before { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .card-3::before { background: linear-gradient(90deg, #38bdf8, #0ea5e9); }
  .card-4::before { background: linear-gradient(90deg, #34d399, #10b981); }

  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .step-pill {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.8px;
    padding: 4px 10px;
    border-radius: 10px;
    text-transform: uppercase;
  }
  .pill-1 { background: rgba(231, 76, 60, 0.2); color: #ff6b6b; }
  .pill-2 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .pill-3 { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
  .pill-4 { background: rgba(16, 185, 129, 0.2); color: #34d399; }

  .step-icon {
    font-size: 18px;
  }

  .step-title {
    font-size: 17px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  }
  .step-desc {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.4;
    min-height: 34px;
    margin-bottom: 16px;
  }

  /* Phone mock container */
  .phone-mock {
    background: #0d0f17;
    border-radius: 16px;
    border: 1px solid #222738;
    padding: 16px 14px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
  }

  /* Phone mini camera cutout */
  .camera-hole {
    width: 8px;
    height: 8px;
    background: #1a1e2d;
    border-radius: 50%;
    margin: 0 auto 12px auto;
  }

  /* Step 1 Visual */
  .asset-box {
    background: #191d2c;
    border: 1px solid #2d344d;
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .apk-badge {
    background: #e74c3c;
    color: white;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .apk-filename {
    font-size: 11px;
    font-family: monospace;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .apk-size {
    font-size: 10px;
    color: #64748b;
    margin-left: auto;
  }
  .prompt-modal {
    background: #1e2233;
    border: 1px solid #ff6b6b;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(231, 76, 60, 0.2);
  }
  .prompt-title {
    font-size: 12px;
    font-weight: 700;
    color: #ff8585;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .prompt-body {
    font-size: 10.5px;
    color: #cbd5e1;
    line-height: 1.3;
    margin-bottom: 10px;
  }
  .prompt-btn {
    background: #e74c3c;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 6px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  /* Step 2 Visual */
  .settings-row {
    background: #191d2c;
    border: 1px solid #2d344d;
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 10px;
  }
  .settings-header {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .app-entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .app-name {
    font-size: 12px;
    font-weight: 600;
    color: #f1f5f9;
  }
  .toggle-container {
    background: #10b981;
    width: 38px;
    height: 22px;
    border-radius: 11px;
    position: relative;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  }
  .toggle-knob {
    width: 18px;
    height: 18px;
    background: #ffffff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    right: 2px;
  }
  .settings-note {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 10px;
    color: #fbbf24;
    line-height: 1.3;
  }

  /* Step 3 Visual */
  .play-protect-modal {
    background: #1b2030;
    border: 1px solid #38bdf8;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.15);
  }
  .shield-icon {
    font-size: 18px;
    margin-bottom: 6px;
  }
  .protect-title {
    font-size: 12px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 4px;
  }
  .protect-text {
    font-size: 10.5px;
    color: #94a3b8;
    line-height: 1.3;
    margin-bottom: 8px;
  }
  .more-details {
    font-size: 10.5px;
    color: #38bdf8;
    font-weight: 600;
    margin-bottom: 10px;
    display: inline-block;
  }
  .install-btn {
    background: #0284c7;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 6px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  }

  /* Step 4 Visual */
  .welcome-mock {
    text-align: center;
  }
  .mini-logo {
    width: 32px;
    height: 32px;
    margin: 0 auto 6px auto;
    display: block;
  }
  .welcome-title {
    font-size: 12px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
  }
  .token-input {
    background: #141724;
    border: 1px solid #34d399;
    border-radius: 8px;
    padding: 7px 10px;
    margin-bottom: 8px;
    text-align: left;
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.2);
  }
  .token-label {
    font-size: 9px;
    color: #34d399;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .token-text {
    font-size: 9.5px;
    font-family: monospace;
    color: #cbd5e1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .ready-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
  }

  /* Bottom specs footer */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #131622;
    border: 1px solid #23283c;
    border-radius: 14px;
    padding: 12px 24px;
    z-index: 2;
  }
  .footer-pills {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .footer-badge {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .dot-green { background: #10b981; }
  .dot-blue { background: #38bdf8; }
  .dot-orange { background: #f59e0b; }
  .footer-link {
    font-size: 12.5px;
    font-family: monospace;
    color: #64748b;
  }
</style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <img src="${iconSrc}" class="app-logo" alt="StreamFarvis Logo" />
      <div class="header-text">
        <h1>HOW TO LOAD <span>STREAMFARVIS APK</span></h1>
        <p>Step-by-step sideloading walkthrough for Android phones & tablets • Sideload safe & free</p>
      </div>
    </div>
    <div class="badge-tag">Open Source • GPL-3.0</div>
  </div>

  <!-- 4 Step Cards -->
  <div class="steps-row">

    <!-- Step 1 -->
    <div class="step-card card-1">
      <div class="step-header">
        <span class="step-pill pill-1">STEP 01</span>
        <span class="step-icon">📥</span>
      </div>
      <div class="step-title">Download APK</div>
      <div class="step-desc">Open GitHub Releases on your phone browser and tap the latest signed APK.</div>
      <div class="phone-mock">
        <div class="camera-hole"></div>
        <div class="asset-box">
          <span class="apk-badge">APK</span>
          <span class="apk-filename">StreamFarvis-1.0.1-release.apk</span>
          <span class="apk-size">4.5 MB</span>
        </div>
        <div class="prompt-modal">
          <div class="prompt-title">⚠️ File might be harmful</div>
          <div class="prompt-body">Do you want to download StreamFarvis-1.0.1-release.apk anyway?</div>
          <div class="prompt-btn">👉 Tap "Download anyway"</div>
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div class="step-card card-2">
      <div class="step-header">
        <span class="step-pill pill-2">STEP 02</span>
        <span class="step-icon">⚙️</span>
      </div>
      <div class="step-title">Allow Unknown Apps</div>
      <div class="step-desc">Grant your browser or file manager permission to install downloaded packages.</div>
      <div class="phone-mock">
        <div class="camera-hole"></div>
        <div class="settings-row">
          <div class="settings-header">Settings &gt; Special App Access</div>
          <div class="app-entry">
            <span class="app-name">Install unknown apps</span>
          </div>
          <div class="app-entry" style="margin-top: 8px;">
            <span class="app-name" style="font-size: 11px; color: #94a3b8;">Allow from this source</span>
            <div class="toggle-container">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
        <div class="settings-note">
          ✔️ Toggle ON, then press your phone's <b>Back</b> button to return to installer.
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div class="step-card card-3">
      <div class="step-header">
        <span class="step-pill pill-3">STEP 03</span>
        <span class="step-icon">🛡️</span>
      </div>
      <div class="step-title">Confirm Play Protect</div>
      <div class="step-desc">Bypass Play Protect's warning for newly compiled open-source releases.</div>
      <div class="phone-mock">
        <div class="camera-hole"></div>
        <div class="play-protect-modal">
          <div class="shield-icon">🛡️</div>
          <div class="protect-title">Unrecognized app</div>
          <div class="protect-text">Play Protect does not recognise this developer.</div>
          <div class="more-details">Tap: <b>More details ▾</b></div>
          <div class="install-btn">👉 Tap "Install anyway"</div>
        </div>
      </div>
    </div>

    <!-- Step 4 -->
    <div class="step-card card-4">
      <div class="step-header">
        <span class="step-pill pill-4">STEP 04</span>
        <span class="step-icon">🚀</span>
      </div>
      <div class="step-title">Setup &amp; Stream</div>
      <div class="step-desc">Launch the app, paste your free TMDB Read Access Token, and start watching.</div>
      <div class="phone-mock">
        <div class="camera-hole"></div>
        <div class="welcome-mock">
          <img src="${iconSrc}" class="mini-logo" alt="StreamFarvis" />
          <div class="welcome-title">Welcome to StreamFarvis</div>
          <div class="token-input">
            <div class="token-label">TMDB Read Access Token</div>
            <div class="token-text">eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
          </div>
          <div class="ready-btn">Save and explore ➔</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Specs Footer -->
  <div class="footer">
    <div class="footer-pills">
      <div class="footer-badge"><span class="dot dot-green"></span> Android 7.0+ (API 24+)</div>
      <div class="footer-badge"><span class="dot dot-blue"></span> Universal Architecture (ARM64 / x86_64)</div>
      <div class="footer-badge"><span class="dot dot-orange"></span> Updates Preserve Watchlist &amp; Data</div>
    </div>
    <div class="footer-link">github.com/FloKuersten/StreamFarvis/releases/latest</div>
  </div>

</body>
</html>`;

const outputPathHtml = path.join(root, 'artifacts/guide-preview.html');
writeFileSync(outputPathHtml, html, 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  
  const destPng = path.join(root, 'docs/images/apk-install-guide.png');
  await page.screenshot({ path: destPng });
  console.log(`Saved high-res infographic to ${destPng}`);
  await browser.close();
})();
