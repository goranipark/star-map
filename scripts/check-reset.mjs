import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { browserOptions } from './browser-options.js';
import { constellations } from '../src/game/constellations.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch(browserOptions);
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript((completed) => {
    const key = 'polaris-star-map/progress/v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, completed, myConstellations: [], settings: { sound: false },
    }));
    localStorage.setItem('polaris-star-map/draft/v1/previous-student', JSON.stringify({
      version: 1, step: 2, lines: [['umi-alpha', 'umi-delta']],
      epithet: '빛나는', name: '이전 성좌', power: '길을 비춘다', author: '이전 학생', finishedCard: null,
    }));
    window.originalRemove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { throw new Error('blocked'); };
  }, constellations.map((constellation) => constellation.id));
  const page = await context.newPage();
  const editor = await context.newPage();
  await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173');
  await editor.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173');
  await editor.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await editor.getByRole('button', { name: '나만의 성좌 만들기', exact: true }).click();
  await editor.getByLabel('만든 사람 (안 써도 됩니다)', { exact: true }).waitFor();
  assert.equal(await editor.getByLabel('만든 사람 (안 써도 됩니다)', { exact: true }).inputValue(), '이전 학생');
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await page.getByRole('button', { name: '진행 기록 지우기', exact: true }).click();
  await page.getByRole('button', { name: '네, 지웁니다', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '기록을 지우지 못했어요' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '네, 지웁니다', exact: true }).isVisible(), true);
  await page.getByText('5/5 별자리 완성', { exact: true }).first().waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('polaris-star-map/progress/v1')).completed), constellations.map((constellation) => constellation.id));
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('polaris-star-map/draft/v1/previous-student')).author), '이전 학생');
  assert.equal(await editor.getByLabel('만든 사람 (안 써도 됩니다)', { exact: true }).isVisible(), true, '실패하면 다른 탭의 편집 화면도 유지');
  await page.evaluate(() => { Storage.prototype.removeItem = window.originalRemove; });
  await page.getByRole('button', { name: '네, 지웁니다', exact: true }).click();
  await page.getByRole('button', { name: '진행 기록 지우기', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('polaris-star-map/progress/v1')), null);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('polaris-star-map/draft/v1/'))), []);
  await page.getByText('0/5 별자리 완성', { exact: true }).first().waitFor();
  await editor.getByRole('button', { name: '진행 기록 지우기', exact: true }).waitFor();
  assert.equal(await editor.getByRole('application').count(), 0, '성공하면 다른 탭의 편집 화면도 닫음');
  console.log('PASS: 초기화 실패 시 기록·초안 유지, 재시도 성공 후 모든 탭 초기화');
} finally { await browser.close(); }
