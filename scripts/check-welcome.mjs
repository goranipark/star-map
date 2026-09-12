import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { browserOptions } from './browser-options.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch(browserOptions);
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('button', { name: '반가워!', exact: true }).click();
  await page.getByText('북쪽 하늘에서 나를 찾아봐.', { exact: false }).waitFor();
  await page.getByRole('button', { name: '네 주변에는 누가 있어?' }).click();
  await page.getByRole('button', { name: '좋아, 첫 별을 찾아보자' }).click();
  await page.getByRole('application').waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const welcome = page.locator('section[aria-labelledby="welcome-title"]');
  const layout = await welcome.evaluate((node) => {
    const boundary = node.getBoundingClientRect();
    const offenders = [...node.querySelectorAll('*')]
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.left < boundary.left - 1 || rect.right > boundary.right + 1)
      .slice(0, 5)
      .map(({ element, rect }) => ({
        tag: element.tagName.toLowerCase(), className: element.className,
        left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
      }));
    return {
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      overflowX: getComputedStyle(node).overflowX,
      offenders,
    };
  });
  const horizontallyScrollable = layout.scrollWidth > layout.clientWidth
    && !['hidden', 'clip'].includes(layout.overflowX);
  assert.equal(horizontallyScrollable, false, `모바일 가로 스크롤 없음: ${JSON.stringify(layout)}`);
  const skip = page.getByRole('button', { name: '대화 건너뛰고 별 잇기' });
  await skip.scrollIntoViewIfNeeded();
  await skip.click();
  await page.getByRole('application').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: 시작 대화·퍼즐 진입·건너뛰기, 모바일 가로 넘침, 페이지 오류 없음');
} finally {
  await browser.close();
}

