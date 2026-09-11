import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artDirectory = path.join(root, 'public', 'art');
const dataPath = path.join(root, 'src', 'data', 'constellations.json');
const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

await access(dataPath);
const data = JSON.parse(await readFile(dataPath, 'utf8'));
const files = await readdir(artDirectory);
const filesByStem = new Map();

for (const file of files) {
  const extension = path.extname(file).toLowerCase();
  if (!extensions.includes(extension)) continue;
  const stem = path.basename(file, extension);
  if (!filesByStem.has(stem)) filesByStem.set(stem, []);
  filesByStem.get(stem).push(file);
}

const missing = [];
const duplicates = [];
const large = [];
const overlayErrors = [];
let expectedCount = 0;

for (const constellation of data.constellations) {
  const slides = constellation.story?.slides ?? [];
  for (const slide of slides) {
    expectedCount += 1;
    const stem = path.basename(slide.art, path.extname(slide.art));
    const matches = filesByStem.get(stem) ?? [];
    if (matches.length === 0) missing.push(stem);
    if (matches.length > 1) duplicates.push(`${stem}: ${matches.join(', ')}`);
    for (const match of matches) {
      const info = await stat(path.join(artDirectory, match));
      if (info.size > 2 * 1024 * 1024) {
        large.push(`${match}: ${(info.size / 1024 / 1024).toFixed(1)} MiB`);
      }
    }
  }

  const last = slides.at(-1);
  if (!last?.isSkyCut || !Array.isArray(last.overlay) || last.overlay.length === 0) {
    overlayErrors.push(constellation.id);
  }
}

const foundCount = expectedCount - missing.length;
console.log(`삽화 검사: ${foundCount}/${expectedCount}컷 발견`);
if (missing.length) console.log(`누락 (${missing.length}): ${missing.join(', ')}`);
if (duplicates.length) console.log(`중복 파일 (${duplicates.length}):\n- ${duplicates.join('\n- ')}`);
if (large.length) console.log(`2 MiB 초과 (${large.length}):\n- ${large.join('\n- ')}`);
if (overlayErrors.length) console.log(`마지막 컷 오버레이 오류: ${overlayErrors.join(', ')}`);

if (missing.length || duplicates.length || overlayErrors.length) process.exitCode = 1;
