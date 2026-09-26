import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'src/_packed/manifest.json'), 'utf8'));

for (const entry of manifest) {
  const target = resolve(root, entry.path);
  const partList = Array.isArray(entry.parts) ? entry.parts : [];
  const sources = partList.length
    ? partList
    : entry.pack
      ? [entry.pack]
      : [];
  if (!sources.length) {
    throw new Error(`manifest entry missing pack/parts: ${entry.path}`);
  }
  for (const rel of sources) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) {
      throw new Error(`packed source missing: ${rel}`);
    }
  }
  const b64 = sources
    .map((rel) => readFileSync(resolve(root, rel), 'utf8').trim())
    .join('');
  const raw = gunzipSync(Buffer.from(b64, 'base64'));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, raw);
  console.log('unpacked', entry.path, raw.length);
}
