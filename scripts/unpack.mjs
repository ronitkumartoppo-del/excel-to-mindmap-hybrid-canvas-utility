import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'src/_packed/manifest.json'), 'utf8'));

for (const entry of manifest) {
  const packedPath = resolve(root, entry.pack);
  const target = resolve(root, entry.path);
  const b64 = readFileSync(packedPath, 'utf8').trim();
  const raw = gunzipSync(Buffer.from(b64, 'base64'));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, raw);
  console.log('unpacked', entry.path, raw.length);
}
