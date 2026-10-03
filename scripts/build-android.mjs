import { spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const win = process.platform === 'win32';
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: win, env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} failed (${result.status})`);
}

mkdirSync(path.join(root, '.signing'), { recursive: true });
const properties = path.join(root, '.signing/release.properties');
const keystore = path.join(root, '.signing/streamfarvis.jks');
if (!existsSync(keystore)) {
  if (existsSync(properties)) throw new Error('Signing properties exist but the keystore is missing. Restore your signing key before rebuilding.');
  const password = randomBytes(32).toString('hex');
  const keytool = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', win ? 'keytool.exe' : 'keytool') : 'keytool';
  process.env.STREAMFARVIS_SIGNING_PASSWORD = password;
  run(win ? `"${keytool}"` : keytool, ['-genkeypair', '-noprompt', '-keystore', '.signing/streamfarvis.jks', '-storetype', 'PKCS12', '-storepass:env', 'STREAMFARVIS_SIGNING_PASSWORD', '-keypass:env', 'STREAMFARVIS_SIGNING_PASSWORD', '-alias', 'streamfarvis', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', win ? '"CN=StreamFarvis, O=Local development"' : 'CN=StreamFarvis, O=Local development']);
  writeFileSync(properties, `storePassword=${password}\nkeyPassword=${password}\n`, { mode: 0o600 });
  delete process.env.STREAMFARVIS_SIGNING_PASSWORD;
}
if (!existsSync(properties)) throw new Error('Missing .signing/release.properties. Restore the signing credentials.');
run(win ? 'npm.cmd' : 'npm', ['run', 'android:sync']);
run(win ? 'gradlew.bat' : './gradlew', [':app:testDebugUnitTest', ':app:lintDebug', ':app:assembleDebug', ':app:assembleRelease', '--console=plain'], path.join(root, 'android'));
mkdirSync(path.join(root, 'artifacts'), { recursive: true });
for (const variant of ['debug', 'release']) {
  const output = path.join(root, `artifacts/StreamFarvis-1.0.0-${variant}.apk`);
  copyFileSync(path.join(root, `android/app/build/outputs/apk/${variant}/app-${variant}.apk`), output);
  const hash = createHash('sha256').update(readFileSync(output)).digest('hex');
  writeFileSync(`${output}.sha256`, `${hash}  ${path.basename(output)}\n`);
  console.log(`Created ${output}`);
}
