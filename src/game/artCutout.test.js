import test from 'node:test';
import assert from 'node:assert/strict';

import { cutOutNavyBackground, goldCutoutAlpha } from './artCutout.js';

test('남색과 푸른 그라데이션은 완전히 투명해진다', () => {
  assert.equal(goldCutoutAlpha(11, 12, 31), 0);
  assert.equal(goldCutoutAlpha(30, 48, 76), 0);
});

test('금빛 판화선과 밝은 별빛은 남는다', () => {
  assert.ok(goldCutoutAlpha(232, 193, 88) > 245);
  assert.ok(goldCutoutAlpha(92, 72, 30) > 180);
  assert.ok(goldCutoutAlpha(245, 245, 235) > 245);
});

test('완전 투명해진 픽셀의 남색 RGB도 제거한다', () => {
  const pixels = new Uint8ClampedArray([11, 12, 31, 255, 232, 193, 88, 255]);
  cutOutNavyBackground(pixels);
  assert.deepEqual([...pixels.slice(0, 4)], [0, 0, 0, 0]);
  assert.ok(pixels[7] > 245);
});
