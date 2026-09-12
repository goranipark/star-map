import test from 'node:test';
import assert from 'node:assert/strict';

import { constellations } from './constellations.js';
import { completionArtFor, completionArtTransform } from './completionReveal.js';
import { projectStar } from './projection.js';

test('모든 별자리에 완료 연출용 성도 삽화가 있다', () => {
  for (const constellation of constellations) {
    assert.match(completionArtFor(constellation), new RegExp(`${constellation.id}-\\d+\\.png$`));
  }
});

test('완료 삽화 변환은 기준 별들을 회전된 퍼즐 좌표에 맞춘다', () => {
  const constellation = constellations[0];
  const projected = Object.fromEntries(
    constellation.stars.map((star) => [star.id, { ...star, ...projectStar(star.ra, star.dec, 137) }])
  );
  const transform = completionArtTransform(constellation, projected);

  assert.ok(transform);
  for (const star of constellation.stars) {
    const target = projected[star.id];
    // 변환 함수 내부와 같은 100×100 합성 기준 좌표를 가져온다.
    const baseTransform = completionArtTransform(constellation, Object.fromEntries(
      constellation.stars.map((item) => [item.id, { ...item, ...projectStar(item.ra, item.dec, 0) }])
    ));
    const base = projectStar(star.ra, star.dec, 0);
    // baseTransform은 100×100 합성 이미지를 원래 성도 좌표로 되돌린다.
    const determinant = baseTransform.a * baseTransform.d - baseTransform.b * baseTransform.c;
    const shiftedX = base.x - baseTransform.e;
    const shiftedY = base.y - baseTransform.f;
    const imageX = (baseTransform.d * shiftedX - baseTransform.c * shiftedY) / determinant;
    const imageY = (-baseTransform.b * shiftedX + baseTransform.a * shiftedY) / determinant;
    const actualX = transform.a * imageX + transform.c * imageY + transform.e;
    const actualY = transform.b * imageX + transform.d * imageY + transform.f;

    assert.ok(Math.abs(actualX - target.x) < 1e-8);
    assert.ok(Math.abs(actualY - target.y) < 1e-8);
  }
});
