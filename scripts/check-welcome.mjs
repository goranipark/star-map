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
  // 휴대폰에서 시작 버튼과 건너뛰기 링크가 첫 화면 안에 보여야 한다.
  // 스크롤해야 나오면 처음 온 아이는 표지 그림만 보고 멈춘다.
  // 작은 구형 기기(360×640)부터 큰 휴대폰까지, 표지 그림이 커지면 여기서 걸린다.
  const skip = page.getByRole('button', { name: '대화 건너뛰고 별 잇기' });
  const start = page.getByRole('button', { name: '반가워!', exact: true });
  for (const [width, height] of [[360, 640], [360, 740], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    for (const [name, button] of [['시작', start], ['건너뛰기', skip]]) {
      const { bottom, fold } = await button.evaluate((node) => ({
        bottom: node.getBoundingClientRect().bottom, fold: window.innerHeight,
      }));
      assert.equal(bottom <= fold, true,
        `${width}×${height}에서 ${name} 버튼이 첫 화면 안에 있다 (아래끝 ${Math.round(bottom)} / 화면 ${fold})`);
    }
  }

  await skip.click();
  await page.getByRole('application').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: 시작 대화·퍼즐 진입·건너뛰기, 모바일 가로 넘침·첫 화면 버튼, 페이지 오류 없음');
} finally {
  await browser.close();
}

