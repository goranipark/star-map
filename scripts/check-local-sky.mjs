import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { browserOptions } from './browser-options.js';

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const browser = await chromium.launch(browserOptions);
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: 'block',
    permissions: ['geolocation'],
    geolocation: { latitude: 37.8813, longitude: 127.73 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(url);
  await page.getByRole('button', { name: '우리 지역 밤하늘' }).click();
  await page.getByRole('heading', { name: '우리 지역 밤하늘' }).waitFor();

  const select = page.getByLabel('관측 지역');
  await select.selectOption('gangneung');
  assert.equal(await select.inputValue(), 'gangneung');
  assert.match(await page.getByRole('img', { name: /강릉에서/ }).getAttribute('aria-label'), /강릉에서/);
  assert.equal(await page.locator('optgroup[label="강원특별자치도"] option').count(), 18);
  assert.equal(await page.locator('[aria-label="별자리 관측 상태"] > div').count(), 5);

  await page.getByRole('button', { name: '현재 위치 사용' }).click();
  await page.getByText('현재 위치를 밤하늘에 적용했어요.').waitFor();
  assert.equal(await select.inputValue(), 'current');

  await page.setViewportSize({ width: 390, height: 844 });
  const screen = page.locator('section[aria-labelledby="local-sky-title"]');
  const layout = await screen.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  assert.ok(layout.scrollWidth <= layout.clientWidth + 1, `모바일 가로 넘침 없음: ${JSON.stringify(layout)}`);
  assert.deepEqual(errors, []);
  await context.close();
  console.log('PASS: 지역 밤하늘 지역·현재 위치 선택, 강원 18개 시군, 모바일 가로 넘침 없음');
} finally {
  await browser.close();
}
