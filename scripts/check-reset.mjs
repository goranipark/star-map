import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { browserOptions } from './browser-options.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch(browserOptions);
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  await page.addInitScript(() => {
    const key = 'polaris-star-map/progress/v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, completed: ['ursa-minor'], myConstellations: [], settings: { sound: false },
    }));
    window.originalRemove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { throw new Error('blocked'); };
  });
  await page.goto(process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173');
  await page.getByRole('button', { name: /나의 밤하늘 도감/ }).click();
  await page.getByRole('button', { name: '진행 기록 지우기', exact: true }).click();
  await page.getByRole('button', { name: '네, 지웁니다', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '기록을 지우지 못했어요' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '네, 지웁니다', exact: true }).isVisible(), true);
  await page.getByText('1/5 별자리 완성', { exact: true }).first().waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('polaris-star-map/progress/v1')).completed), ['ursa-minor']);
  await page.evaluate(() => { Storage.prototype.removeItem = window.originalRemove; });
  await page.getByRole('button', { name: '네, 지웁니다', exact: true }).click();
  await page.getByRole('button', { name: '진행 기록 지우기', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('polaris-star-map/progress/v1')), null);
  await page.getByText('0/5 별자리 완성', { exact: true }).first().waitFor();
  console.log('PASS: 초기화 실패 시 기록·확인 유지, 재시도 성공 후 초기화');
} finally { await browser.close(); }
