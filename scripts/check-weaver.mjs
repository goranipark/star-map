import { browserOptions } from './browser-options.js';
// Run against a production preview. PLAYWRIGHT_MODULE may point to a bundled installation.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { constellations } from '../src/game/constellations.js';
import { projectStar } from '../src/game/projection.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch(browserOptions);
const full = process.env.WEAVER_FULL === '1';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const originals = full ? Array.from({ length: 12 }, (_, i) => ({
    id: `my-${i}`, name: `작품 ${i}`, stars: constellations[0].stars,
    lines: constellations[0].lines, card: { epithet: '빛나는', power: '반짝인다' },
  })) : [];
  await page.addInitScript(({ ids, originals }) => {
    localStorage.setItem('polaris-star-map/progress/v1', JSON.stringify({
      version: 1, completed: ids, myConstellations: originals, settings: { sound: false },
    }));
  }, { ids: constellations.map((c) => c.id), originals });
  await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173');
  await page.getByRole('button', { name: '나의 밤하늘 도감', exact: true }).click();
  await page.getByRole('button', { name: full ? '성좌 하나 더 만들기' : '나만의 성좌 만들기', exact: true }).click();
  async function tap(star) {
    const point = projectStar(star.ra, star.dec);
    const screen = await page.getByRole('application').evaluate((svg, p) => {
      const result = new DOMPoint(p.x, p.y).matrixTransform(svg.querySelector('g[transform]').getScreenCTM());
      return { x: result.x, y: result.y };
    }, point);
    await page.mouse.click(screen.x, screen.y);
  }
  const [a, b, c] = constellations[0].stars;
  async function pointer(type, star, pointerId = 101, isPrimary = true) {
    await page.getByRole('application').evaluate((svg, { type, point, pointerId, isPrimary }) => {
      const p = new DOMPoint(point.x, point.y).matrixTransform(svg.querySelector('g[transform]').getScreenCTM());
      svg.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId, isPrimary,
        pointerType: 'touch', button: 0, clientX: p.x, clientY: p.y }));
    }, { type, point: projectStar(star.ra, star.dec), pointerId, isPrimary });
  }
  const lineCount = () => page.locator('line[class*="drawnLine"]').count();
  // React가 다시 그릴 때까지 기다린다. isEnabled()는 한 번만 보고 끝나므로
  // 그대로 쓰면 도감이 꽉 찬 경우처럼 다시 그리기가 느릴 때 헛되이 실패한다.
  async function expectEnabled(locator, enabled, message) {
    for (let i = 0; i < 50; i += 1) {
      if (await locator.isEnabled() === enabled) return;
      await page.waitForTimeout(100);
    }
    assert.fail(message);
  }
  await pointer('pointerdown', a);
  await pointer('pointerdown', c, 102, false);
  await pointer('pointermove', a, 102, false);
  await pointer('pointerup', a, 102, false);
  assert.equal(await lineCount(), 0);
  await pointer('pointermove', b);
  await pointer('pointerup', b);
  assert.equal(await lineCount(), 1, '다른 손가락이 시작 별을 덮어쓰지 않는다');
  await page.getByRole('button', { name: '전체 지우기', exact: true }).click();
  for (const end of ['pointercancel', 'lostpointercapture', 'pointerout']) {
    await pointer('pointerdown', a);
    await pointer('pointermove', b);
    await pointer(end, b);
    await pointer('pointerup', b);
    assert.equal(await lineCount(), 0, end);
    assert.equal(await page.locator('line[class*="dragLine"]').count(), 0, '임시 선 정리');
  }
  await pointer('pointerdown', a);
  await pointer('pointerup', { ra: 0, dec: -90 });
  assert.equal(await lineCount(), 0, '화면 밖에서 놓으면 연결 취소');
  await pointer('pointerdown', a);
  await pointer('pointermove', b);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await pointer('pointerup', b);
  assert.equal(await lineCount(), 0, '창 포커스를 잃으면 연결 취소');
  await tap(a); await tap(b); await tap(b); await tap(c);
  const next = page.getByRole('button', { name: '다음', exact: true });
  await expectEnabled(next, true, '선 두 개를 이으면 다음으로 넘어갈 수 있다');
  await next.click();
  await page.getByRole('button', { name: '별 다시 잇기' }).click();
  await expectEnabled(next, true, '단계 왕복 후에도 두 선 유지');
  // Repeating an existing edge must delete it, proving the board retained its state.
  await tap(a); await tap(b);
  await expectEnabled(next, false, '이미 이은 선을 다시 이으면 지워진다');
  await tap(a); await tap(b);
  await next.click();
  await page.getByRole('button', { name: '골라 줘' }).click();
  await page.getByLabel('이름', { exact: true }).fill('회귀 테스트');
  await page.getByPlaceholder('예) 무서운 꿈을 쫓아내 준다').fill('기록을 지킨다');
  if (full) {
    assert.equal(await page.getByRole('button', { name: '성좌 완성하기' }).isEnabled(), false);
    await page.getByRole('combobox').selectOption('my-5');
  }
  await page.evaluate(() => {
    window.originalWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: '성좌 완성하기' }).click();
  await page.getByText('기기에 저장하지 못했어요. 이 화면에서', { exact: false }).waitFor();
  assert.equal(await page.getByRole('button', { name: '그림으로 저장하기' }).isVisible(), true);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('polaris-star-map/progress/v1')).myConstellations), originals);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalWrite; });
  await page.getByRole('button', { name: '다시 저장하기', exact: true }).click();
  await page.getByText('도감 마지막 칸에 담았어요.', { exact: false }).waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('polaris-star-map/progress/v1')).myConstellations);
  assert.equal(saved.length, full ? 12 : 1);
  const created = saved.find((card) => card.name === '회귀 테스트');
  assert.equal(created.lines.length, 2);
  if (full) assert.deepEqual(saved.filter((card) => card.id !== created.id), originals.filter((card) => card.id !== 'my-5'));
  assert.deepEqual(errors, []);
  console.log(`PASS: 멀티포인터·취소·화면 밖 종료, 단계 왕복, 저장 실패·재시도${full ? ', 선택 작품만 교체' : ''}`);
} finally {
  await browser.close();
}
