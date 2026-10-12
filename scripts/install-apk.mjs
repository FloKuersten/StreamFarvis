import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[1m\x1b[36mStreamFarvis ADB Sideload Helper\x1b[0m (v${version})
Installs StreamFarvis APK directly onto a connected Android device, tablet, TV, or emulator.

\x1b[1mUsage:\x1b[0m
  npm run android:install [options]
  node scripts/install-apk.mjs [options] [path/to/app.apk]

\x1b[1mOptions:\x1b[0m
  --release, -r       Install release APK (default: debug)
  --debug             Install debug APK
  --launch, -l        Launch StreamFarvis on device after successful install
  --device, -s <id>   Target specific device serial or IP:port (from 'adb devices')
  --apk <path>        Custom APK path to install
  --download          Download official signed release APK from GitHub Releases if missing
  --help, -h          Display this help message

\x1b[1mExamples:\x1b[0m
  npm run android:install -- --release --launch
  npm run android:install -- --download --release
  npm run android:install -- --device 192.168.1.50:5555
  node scripts/install-apk.mjs artifacts/StreamFarvis-1.0.1-release.apk
`);
  process.exit(0);
}

const isRelease = args.includes('--release') || args.includes('-r');
const shouldLaunch = args.includes('--launch') || args.includes('-l');
const allowDownload = args.includes('--download');

const deviceFlagIndex = args.findIndex(a => a === '--device' || a === '-s');
const targetDevice = deviceFlagIndex !== -1 ? args[deviceFlagIndex + 1] : null;

const apkFlagIndex = args.findIndex(a => a === '--apk');
let explicitApk = apkFlagIndex !== -1 ? args[apkFlagIndex + 1] : null;
if (!explicitApk) {
  // Check if any non-flag argument ends with .apk
  const positionalApk = args.find(a => !a.startsWith('-') && a.endsWith('.apk'));
  if (positionalApk) explicitApk = positionalApk;
}

// Find ADB executable
function findAdb() {
  if (process.env.ADB_PATH && existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }

  // Check PATH
  const win = process.platform === 'win32';
  const adbCmd = win ? 'adb.exe' : 'adb';
  const pathCheck = spawnSync(win ? 'where' : 'which', [adbCmd], { encoding: 'utf8' });
  if (pathCheck.status === 0 && pathCheck.stdout) {
    const found = pathCheck.stdout.trim().split(/\r?\n/)[0];
    if (found && existsSync(found)) return found;
  }

  // Check android/local.properties
  const localProps = path.join(root, 'android/local.properties');
  if (existsSync(localProps)) {
    const content = readFileSync(localProps, 'utf8');
    const match = content.match(/^sdk\.dir=(.+)$/m);
    if (match) {
      const sdkDir = match[1].trim().replace(/\\:/g, ':').replace(/\\\\/g, '/');
      const candidate = path.join(sdkDir, 'platform-tools', adbCmd);
      if (existsSync(candidate)) return candidate;
    }
  }

  // Check ANDROID_HOME or ANDROID_SDK_ROOT
  const sdkEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdkEnv) {
    const candidate = path.join(sdkEnv, 'platform-tools', adbCmd);
    if (existsSync(candidate)) return candidate;
  }

  // Check common platform paths
  const home = os.homedir();
  const commonPaths = win
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
        path.join(home, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe')
      ]
    : [
        path.join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb'),
        path.join(home, 'Android', 'Sdk', 'platform-tools', 'adb'),
        '/usr/local/bin/adb',
        '/usr/bin/adb'
      ];

  for (const p of commonPaths) {
    if (p && existsSync(p)) return p;
  }

  return null;
}

const adb = findAdb();
if (!adb) {
  console.error('\x1b[31m[ERROR]\x1b[0m Could not find adb (Android Debug Bridge).');
  console.error('Please ensure Android SDK platform-tools is installed or set ANDROID_HOME.');
  console.error('See docs/INSTALL.md for manual APK sideloading instructions.');
  process.exit(1);
}

// Function to download release APK from GitHub Releases
async function downloadGitHubReleaseApk(destPath) {
  const releaseUrl = `https://github.com/FloKuersten/StreamFarvis/releases/download/android-v${version}/StreamFarvis-${version}-release.apk`;
  console.log(`\x1b[34m[DOWNLOAD]\x1b[0m Fetching official signed release APK from:`);
  console.log(`           ${releaseUrl}`);
  try {
    const res = await fetch(releaseUrl, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    mkdirSync(path.dirname(destPath), { recursive: true });
    writeFileSync(destPath, buffer);
    const computedHash = createHash('sha256').update(buffer).digest('hex');
    console.log(`\x1b[32m[DOWNLOAD]\x1b[0m Saved ${(buffer.length / (1024 * 1024)).toFixed(2)} MB to ${path.relative(root, destPath)}`);
    console.log(`\x1b[32m[SHA-256]\x1b[0m  ${computedHash}`);
    return true;
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Download failed: ${err.message}`);
    return false;
  }
}

// Find APK to install
const variant = isRelease ? 'release' : 'debug';
const expectedApk = path.join(root, `artifacts/StreamFarvis-${version}-${variant}.apk`);
const gradleApk = path.join(root, `android/app/build/outputs/apk/${variant}/app-${variant}.apk`);

let apkToInstall = null;
if (explicitApk) {
  const resolved = path.isAbsolute(explicitApk) ? explicitApk : path.join(root, explicitApk);
  if (existsSync(resolved)) {
    apkToInstall = resolved;
  } else {
    console.error(`\x1b[31m[ERROR]\x1b[0m Specified APK does not exist: ${resolved}`);
    process.exit(1);
  }
} else if (existsSync(expectedApk)) {
  apkToInstall = expectedApk;
} else if (existsSync(gradleApk)) {
  apkToInstall = gradleApk;
} else {
  // Check if any APK is in artifacts
  const artifactsDir = path.join(root, 'artifacts');
  if (existsSync(artifactsDir)) {
    const files = readdirSync(artifactsDir).filter(f => f.endsWith('.apk') && f.includes(variant));
    if (files.length > 0) {
      apkToInstall = path.join(artifactsDir, files[0]);
    }
  }
}

// Download fallback if APK not found and release requested or --download passed
if (!apkToInstall && (isRelease || allowDownload)) {
  console.log(`\x1b[33m[NOTICE]\x1b[0m Local ${variant} APK not found. Attempting download from GitHub Releases...`);
  const downloaded = await downloadGitHubReleaseApk(expectedApk);
  if (downloaded) {
    apkToInstall = expectedApk;
  }
}

if (!apkToInstall) {
  console.error(`\x1b[31m[ERROR]\x1b[0m No ${variant} APK found.`);
  console.log(`Options:`);
  console.log(`  1. Build locally:   \x1b[36mnpm run android:apk\x1b[0m`);
  console.log(`  2. Download release: \x1b[36mnpm run android:install -- --release --download\x1b[0m`);
  console.log(`  3. Provide path:    \x1b[36mnpm run android:install -- <path-to-apk>\x1b[0m`);
  process.exit(1);
}

console.log(`\x1b[34m[INFO]\x1b[0m Using ADB: ${adb}`);
console.log(`\x1b[34m[INFO]\x1b[0m Target APK: ${path.relative(root, apkToInstall)}`);

// Check connected devices
const devList = spawnSync(adb, ['devices'], { encoding: 'utf8' });
if (devList.status !== 0) {
  console.error('\x1b[31m[ERROR]\x1b[0m Failed to query adb devices.');
  process.exit(1);
}

const lines = devList.stdout.trim().split(/\r?\n/).slice(1);
const allEntries = lines
  .map(line => line.trim().split(/\s+/))
  .filter(parts => parts.length >= 2);

const devices = allEntries
  .filter(parts => parts[1] === 'device')
  .map(parts => parts[0]);

const unauthorizedDevices = allEntries
  .filter(parts => parts[1] === 'unauthorized')
  .map(parts => parts[0]);

const offlineDevices = allEntries
  .filter(parts => parts[1] === 'offline')
  .map(parts => parts[0]);

if (devices.length === 0) {
  console.error('\x1b[31m[ERROR]\x1b[0m No authorized Android device or emulator detected.');

  if (unauthorizedDevices.length > 0) {
    console.log(`\n\x1b[33m[ACTION REQUIRED]\x1b[0m Device(s) detected but UNAUTHORIZED: \x1b[1m${unauthorizedDevices.join(', ')}\x1b[0m`);
    console.log('  👉 Check your phone screen now.');
    console.log('  👉 Check the box "Always allow from this computer" and tap \x1b[1mAllow\x1b[0m.');
  } else if (offlineDevices.length > 0) {
    console.log(`\n\x1b[33m[NOTICE]\x1b[0m Device(s) offline: ${offlineDevices.join(', ')}. Reconnect USB or restart emulator.`);
  } else {
    console.log('\nTo connect a device:');
    console.log(' 1. Enable Developer Options on your phone (tap Build Number 7 times).');
    console.log(' 2. Enable "USB Debugging" in Developer Options.');
    console.log(' 3. Connect via USB cable or wireless ADB: adb connect <phone-ip>:5555');
    console.log(' 4. Accept the "Allow USB debugging" prompt on your phone screen.\n');
  }
  process.exit(1);
}

let deviceToUse = targetDevice;
if (!deviceToUse) {
  if (devices.length === 1) {
    deviceToUse = devices[0];
  } else {
    console.log(`Multiple devices found (${devices.join(', ')}). Defaulting to ${devices[0]}.`);
    console.log('Use --device <serial> to target a specific device.');
    deviceToUse = devices[0];
  }
} else if (!devices.includes(deviceToUse)) {
  console.error(`\x1b[31m[ERROR]\x1b[0m Target device "${deviceToUse}" not found among authorized devices: ${devices.join(', ')}`);
  process.exit(1);
}

console.log(`\x1b[32m[INSTALL]\x1b[0m Installing to device: ${deviceToUse}...`);
// -r: reinstall existing app, preserving data
// -d: allow version code downgrade
// -t: allow test packages (prevents INSTALL_FAILED_TEST_ONLY on debug APKs)
const adbArgs = ['-s', deviceToUse, 'install', '-r', '-d', '-t', apkToInstall];
const installResult = spawnSync(adb, adbArgs, { stdio: 'inherit' });

if (installResult.status !== 0) {
  console.error('\x1b[31m[ERROR]\x1b[0m Installation failed.');
  console.log('\nCommon troubleshooting steps:');
  console.log(' • INSTALL_FAILED_UPDATE_INCOMPATIBLE: Different signing key (e.g. switching debug <-> release).');
  console.log('   Uninstall old version first (save your TMDB token first!), or install matching build.');
  console.log(' • INSTALL_FAILED_INSUFFICIENT_STORAGE: Free up internal storage on the device.');
  console.log(' • INSTALL_FAILED_VERSION_DOWNGRADE: Lower version code; uninstall or build with higher version.');
  process.exit(installResult.status || 1);
}

console.log(`\x1b[32m[SUCCESS]\x1b[0m StreamFarvis v${version} installed successfully!`);

if (shouldLaunch) {
  console.log('\x1b[34m[LAUNCH]\x1b[0m Launching StreamFarvis on device...');
  spawnSync(adb, ['-s', deviceToUse, 'shell', 'am', 'start', '-n', 'com.farvis.streamfarvis/.MainActivity'], { stdio: 'inherit' });
}

