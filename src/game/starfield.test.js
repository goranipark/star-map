import test from 'node:test';
import assert from 'node:assert/strict';

import { constellations } from './constellations.js';
import { createBackgroundStars } from './starfield.js';

const realStars = constellations.flatMap((constellation) => constellation.stars);

test('같은 시드는 같은 배경 별밭을 만든다', () => {
  const first = createBackgroundStars(realStars, { seed: 42, count: 24 });
  const second = createBackgroundStars(realStars, { seed: 42, count: 24 });
  assert.deepEqual(first, second);
});

test('다른 시드는 다른 배경 별밭을 만든다', () => {
  const first = createBackgroundStars(realStars, { seed: 1, count: 12 });
  const second = createBackgroundStars(realStars, { seed: 2, count: 12 });
  assert.notDeepEqual(first, second);
});

test('생성된 별의 ID와 하늘 좌표가 유효하다', () => {
  const stars = createBackgroundStars(realStars, { seed: 123, count: 30 });
  assert.equal(stars.length, 30);
  assert.equal(new Set(stars.map((star) => star.id)).size, stars.length);
  for (const star of stars) {
    assert.ok(star.ra >= 0 && star.ra < 24);
    assert.ok(star.dec >= 45 && star.dec <= 90);
    assert.ok(star.mag >= 3.8 && star.mag <= 5.6);
    assert.equal(star.isBackground, true);
  }
});

