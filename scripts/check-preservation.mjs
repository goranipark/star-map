import { browserOptions } from './browser-options.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { constellations } from '../src/game/constellations.js';
import { projectStar, focusRotation } from '../src/game/projection.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch(browserOptions);
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
const key = 'polaris-star-map/progress/v1';
const c = constellations[0];
async function connect(page, lines, free = false) {
  const box = await page.getByRole('application').boundingBox();
  const rotation = free ? 0 : focusRotation(c, 100 * box.height / box.width < 80 ? 270 : 180);
  const points = Object.fromEntries(c.stars.map((s) => [s.id, projectStar(s.ra, s.dec, rotation)]));
  await page.getByRole('application').evaluate((svg, { lines, points }) => {
    let pointerId = 10;
    for (const pair of lines) {
      for (const id of pair) {
        const at = points[id];
        const p = new DOMPoint(at.x, at.y).matrixTransform(svg.firstElementChild.getScreenCTM());
        for (const type of ['pointerdown', 'pointerup']) svg.dispatchEvent(new PointerEvent(type, {
          bubbles: true, pointerId, pointerType: 'touch', isPrimary: true, button: 0,
          clientX: p.x, clientY: p.y,
        }));
        pointerId++;
      }
    }
  }, { lines, points });
}
async function enterWeaver(page) {
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await page.getByRole('button', { name: /^(나만의 성좌 만들기|성좌 하나 더 만들기)$/ }).click();
}
try {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto(url);
  await b.goto(url);
  await b.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await a.getByRole('button', { name: '대화 건너뛰고 별 잇기' }).click();
  await a.getByRole('application').waitFor();
  await Promise.all([
    connect(a, c.lines),
    b.getByRole('button', { name: '소리 끄기', exact: true }).click(),
  ]);
  await a.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.completed.includes('ursa-minor'), key);
  assert.equal(await a.getByRole('application').isVisible(), true, '축하 연출 종료 전에 저장');
  await a.getByRole('button', { name: '도감 열기', exact: true }).click();
  await b.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.settings.sound === false, key);
  const result = await b.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
  assert.deepEqual(result.completed, ['ursa-minor']);
  assert.equal(result.settings.sound, false);
  await b.getByText('1/5 별자리 완성', { exact: true }).first().waitFor();
  await context.close();

  const drafts = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await drafts.addInitScript(({ key, ids }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, completed: ids, myConstellations: [], settings: { sound: false },
    }));
  }, { key, ids: constellations.map((c) => c.id) });
  const first = await drafts.newPage();
  await first.goto(url);
  await enterWeaver(first);
  await connect(first, c.lines.slice(0, 2), true);
  await first.getByRole('button', { name: '다음', exact: true }).click();
  await first.getByLabel('이름', { exact: true }).fill('보존할 초안');
  await first.getByPlaceholder('예) 무서운 꿈을 쫓아내 준다').fill('잊지 않는다');
  await first.getByRole('button', { name: '도감 열기', exact: true }).click();
  await first.getByRole('button', { name: '나만의 성좌 만들기', exact: true }).click();
  assert.equal(await first.getByLabel('이름', { exact: true }).inputValue(), '보존할 초안');
  await first.reload();
  await enterWeaver(first);
  assert.equal(await first.getByLabel('이름', { exact: true }).inputValue(), '보존할 초안');
  await first.getByRole('button', { name: '별 다시 잇기' }).click();
  assert.equal(await first.locator('line[class*="drawnLine"]').count(), 2);
  await first.getByRole('button', { name: '다음', exact: true }).click();
  const second = await drafts.newPage();
  await second.goto(url);
  await enterWeaver(second);
  assert.equal(await second.getByLabel('이름', { exact: true }).inputValue(), '보존할 초안');
  await second.getByLabel('이름', { exact: true }).fill('다른 탭 초안');
  await first.reload();
  await enterWeaver(first);
  assert.equal(await first.getByLabel('이름', { exact: true }).inputValue(), '보존할 초안', '탭별 초안을 덮어쓰지 않는다');
  await drafts.close();

  const race = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await race.addInitScript(({ key, ids, base }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, completed: ids, settings: { sound: false }, myConstellations:
        Array.from({ length: 11 }, (_, i) => ({ ...base, id: `old-${i}`, name: `기존 작품 ${i}` })),
    }));
  }, { key, ids: constellations.map((c) => c.id), base: c });
  const racers = [await race.newPage(), await race.newPage()];
  for (let i = 0; i < racers.length; i++) {
    const page = racers[i];
    await page.goto(url);
    await enterWeaver(page);
    // A fresh tab may recover the other tab's in-progress draft.
    if (await page.getByRole('button', { name: '다음', exact: true }).isVisible()) {
      await connect(page, c.lines.slice(0, 2), true);
      await page.getByRole('button', { name: '다음', exact: true }).click();
    }
    await page.getByRole('button', { name: '골라 줘' }).click();
    await page.getByLabel('이름', { exact: true }).fill(`동시 작품 ${i}`);
    await page.getByPlaceholder('예) 무서운 꿈을 쫓아내 준다').fill('기록을 지킨다');
  }
  await racers[0].evaluate((key) => {
    navigator.locks.request(`${key}/write`, () => new Promise((resolve) => {
      window.releaseTestLock = resolve;
    }));
  }, key);
  await racers[0].waitForFunction(() => !!window.releaseTestLock);
  await Promise.all(racers.map((page) => page.getByRole('button', { name: '성좌 완성하기', exact: true }).click()));
  await racers[0].evaluate(() => window.releaseTestLock());
  await racers[0].waitForFunction((key) => JSON.parse(localStorage.getItem(key)).myConstellations.length === 12, key);
  const cards = await racers[0].evaluate((key) => JSON.parse(localStorage.getItem(key)).myConstellations, key);
  assert.equal(cards.filter((card) => card.id.startsWith('old-')).length, 11);
  const winner = cards.find((card) => card.name.startsWith('동시 작품'));
  const loser = racers[winner.name.endsWith('0') ? 1 : 0];
  await loser.getByRole('combobox').waitFor();
  assert.equal(await loser.getByRole('button', { name: '성좌 완성하기', exact: true }).isEnabled(), false);
  assert.match(await loser.getByLabel('이름', { exact: true }).inputValue(), /^동시 작품/);
  await race.close();
  console.log('PASS: 완료 즉시 저장, 연출 중 이동, 두 탭 동시 저장·UI 동기화, 초안 화면 이동·새로고침 복원·탭 분리');
} finally { await browser.close(); }
