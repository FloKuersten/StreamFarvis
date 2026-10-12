import { chromium } from 'playwright';
import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');

// 1. Copy generated showcase graphics to docs/images
const iosMockupSrc = 'C:/Users/Flo/.gemini/antigravity/brain/5b34365b-6130-4fae-bff4-df0ebda03950/streamfarvis_ios_app_1791822497560.jpg';
const iosSideloadSrc = 'C:/Users/Flo/.gemini/antigravity/brain/5b34365b-6130-4fae-bff4-df0ebda03950/ios_sideload_flow_1791822514539.jpg';

if (existsSync(iosMockupSrc)) {
  copyFileSync(iosMockupSrc, path.join(root, 'docs/images/ios-showcase.png'));
  console.log('Copied ios-showcase.png');
}
if (existsSync(iosSideloadSrc)) {
  copyFileSync(iosSideloadSrc, path.join(root, 'docs/images/ios-sideload-flow.png'));
  console.log('Copied ios-sideload-flow.png');
}

// 2. Generate 320x180 Android TV banner
async function generateTvBanner() {
  const iconPath = path.join(root, 'public/streamfarvis-icon.png');
  const iconB64 = readFileSync(iconPath).toString('base64');
  const iconSrc = `data:image/png;base64,${iconB64}`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 320px;
    height: 180px;
    background: radial-gradient(circle at 75% 30%, #1c0e12 0%, #090b10 85%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(229, 9, 20, 0.25);
  }
  .glow {
    position: absolute;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(229, 9, 20, 0.35) 0%, transparent 70%);
    top: -20px;
    right: 20px;
    pointer-events: none;
  }
  .content {
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 2;
    padding: 0 20px;
  }
  .icon {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);
  }
  .text {
    display: flex;
    flex-direction: column;
  }
  .title {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .subtitle {
    font-size: 11px;
    font-weight: 600;
    color: #e50914;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 4px;
  }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="content">
    <img src="${iconSrc}" class="icon" />
    <div class="text">
      <div class="title">StreamFarvis</div>
      <div class="subtitle">Android TV</div>
    </div>
  </div>
</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
  await page.setContent(html);
  const outPath = path.join(root, 'android/app/src/main/res/drawable/tv_banner.png');
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 320, height: 180 } });
  await browser.close();
  console.log('Saved tv_banner.png to', outPath);
}

generateTvBanner().catch(console.error);
