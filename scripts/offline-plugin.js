import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Runs after Vite has emitted HTML, hashed chunks and copied public assets.
export function offlinePlugin() {
  let config;
  return {
    name: 'polaris-offline',
    apply: 'build',
    configResolved(value) { config = value; },
    async closeBundle() {
      const output = path.resolve(config.root, config.build.outDir);
      async function files(folder, prefix = '') {
        const entries = await readdir(folder, { withFileTypes: true });
        const nested = await Promise.all(entries.map((entry) => {
          const relative = `${prefix}${entry.name}`;
          if (relative === 'art' || relative === 'sw.js') return [];
          return entry.isDirectory() ? files(path.join(folder, entry.name), `${relative}/`) : [relative];
        }));
        return nested.flat();
      }
      const assets = (await files(output)).sort();
      const template = await readFile(path.resolve(config.root, 'scripts/service-worker.js'), 'utf8');
      const hash = createHash('sha256').update(template);
      for (const file of assets) hash.update(file).update(await readFile(path.join(output, file)));
      const version = hash.digest('hex').slice(0, 20);
      await writeFile(path.join(output, 'sw.js'),
        `const VERSION = ${JSON.stringify(version)};\nconst PRECACHE = ${JSON.stringify(assets)};\n${template}`);
    },
  };
}
