import { browserOptions } from './browser-options.js';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = path.resolve('dist');
let version = 'one';
const source = await readFile(path.join(root, 'sw.js'), 'utf8');
assert.match(source, /assets\/[^"\s]+\.js/);
assert.match(source, /assets\/[^"\s]+\.css/);
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const relative = pathname.replace(/^\/star-map\//, '') || 'index.html';
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) throw new Error('outside root');
    let body;
    if (relative === 'sw.js') {
      body = source.replace(/^const VERSION = .*;/, `const VERSION = "${version}";`);
      if (version === 'broken') body = body.replace('const PRECACHE = [', 'const PRECACHE = ["missing.js",');
    } else if (relative === 'art/cache-probe.svg') {
      body = `<svg xmlns="http://www.w3.org/2000/svg"><text>${version}</text></svg>`;
    } else {
      body = await readFile(filename);
      if (relative === 'index.html') body = body.toString().replace('<html', `<html data-build="${version}"`);
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
    response.writeHead(200, { 'Content-Type': types[path.extname(relative)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch(browserOptions);
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = `http://127.0.0.1:${server.address().port}/star-map/`;
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.match(await page.evaluate(async () => (await fetch('art/cache-probe.svg')).text()), /one/);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-build'), 'one');
  await context.setOffline(false);
  await page.evaluate(() => localStorage.setItem('polaris-star-map/progress/v1', JSON.stringify({
    version: 1, completed: ['ursa-minor', 'ursa-major', 'cassiopeia', 'cepheus', 'draco'],
    myConstellations: [], settings: { sound: false },
  })));
  const editor = await context.newPage();
  await editor.goto(url);
  await editor.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await editor.getByRole('button', { name: '나만의 성좌 만들기', exact: true }).click();
  version = 'two';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
  // A new deployment must not silently replace the old cached HTML.
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-build'), 'one');
  await page.getByRole('button', { name: '지금 업데이트', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.build === 'two');
  assert.match(await page.evaluate(async () => (await fetch('art/cache-probe.svg')).text()), /two/, '같은 경로의 삽화를 새 버전으로 갱신');
  assert.equal(await editor.locator('html').getAttribute('data-build'), 'one', '다른 탭의 업데이트가 편집 화면을 새로고침하지 않는다');
  assert.equal(await editor.getByRole('application').isVisible(), true);
  assert.equal(await editor.getByRole('button', { name: '지금 업데이트', exact: true }).count(), 0);
  await editor.getByRole('button', { name: '도감 열기', exact: true }).click();
  await editor.getByRole('button', { name: '지금 업데이트', exact: true }).click();
  await editor.waitForFunction(() => document.documentElement.dataset.build === 'two');
  await editor.close();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-build'), 'two');
  await context.setOffline(false);
  version = 'broken';
  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const result = new Promise((resolve) => registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'redundant' || worker.state === 'installed') resolve(worker.state);
      });
    }, { once: true }));
    await registration.update();
    return result;
  });
  assert.equal(state, 'redundant', '부분 설치는 활성화되지 않는다');
  await context.setOffline(true);
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-build'), 'two');
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).waitFor();
  const caches = await page.evaluate(() => window.caches.keys());
  assert.ok(!caches.some((name) => name.includes('broken')));
  console.log('PASS: 하위 경로 첫 설치 → 오프라인 실행 → 버전 교체 → 부분 설치 실패 시 이전 버전 복구');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
