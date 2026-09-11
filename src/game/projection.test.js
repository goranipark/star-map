import test from 'node:test';
import assert from 'node:assert/strict';

import { constellations } from './constellations.js';
import {
  SKY,
  fitConstellationToBox,
  projectStar,
  radiusForMagnitude,
} from './projection.js';

test('북극은 성도판 중심에 투영된다', () => {
  const point = projectStar(8, 90);
  assert.equal(point.x, SKY.cx);
  assert.equal(point.y, SKY.cy);
  assert.equal(point.r, 0);
});

test('회전해도 중심에서의 거리는 바뀌지 않는다', () => {
  const before = projectStar(12, 55, 0);
  const after = projectStar(12, 55, 137);
  assert.ok(Math.abs(before.r - after.r) < 1e-12);
  assert.ok(
    Math.abs(Math.hypot(before.x - SKY.cx, before.y - SKY.cy) -
      Math.hypot(after.x - SKY.cx, after.y - SKY.cy)) < 1e-9
  );
});

test('밝은 별이 어두운 별보다 크게 표시된다', () => {
  assert.ok(radiusForMagnitude(1.5) > radiusForMagnitude(5.2));
  assert.equal(radiusForMagnitude(-10), 1.6);
  assert.equal(radiusForMagnitude(20), 0.6);
});

test('카드용 별자리 좌표는 지정한 여백 안에 들어온다', () => {
  const { stars } = fitConstellationToBox(constellations[0], { size: 100, padding: 12 });
  for (const star of stars) {
    assert.ok(star.x >= 12 && star.x <= 88, `x=${star.x}`);
    assert.ok(star.y >= 12 && star.y <= 88, `y=${star.y}`);
  }
});

