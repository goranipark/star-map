import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { offlinePlugin } from './offline-plugin.js';

test('삽화만 변경해도 워커 버전은 바뀌고 선캐시에 삽화를 추가하지 않는다', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'polaris-offline-test-'));
  try {
    await mkdir(path.join(root, 'dist', 'art'), { recursive: true });
    await mkdir(path.join(root, 'scripts'));
    await writeFile(path.join(root, 'scripts', 'service-worker.js'), '// fixture');
    await writeFile(path.join(root, 'dist', 'index.html'), '<html></html>');
    const illustration = path.join(root, 'dist', 'art', 'same-name.svg');
    await writeFile(illustration, '<svg>old</svg>');
    const plugin = offlinePlugin();
    plugin.configResolved({ root, build: { outDir: 'dist' } });
    await plugin.closeBundle();
    const first = await readFile(path.join(root, 'dist', 'sw.js'), 'utf8');
    await plugin.closeBundle();
    assert.equal(await readFile(path.join(root, 'dist', 'sw.js'), 'utf8'), first, '같은 빌드는 같은 버전');
    await writeFile(illustration, '<svg>new</svg>');
    await plugin.closeBundle();
    const second = await readFile(path.join(root, 'dist', 'sw.js'), 'utf8');
    assert.notEqual(second.split('\n')[0], first.split('\n')[0]);
    assert.equal(second.split('\n')[1], 'const PRECACHE = ["index.html"];');
  } finally {
    if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('polaris-offline-test-')) throw new Error('Unexpected cleanup path');
    await rm(root, { recursive: true, force: true });
  }
});
