import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answerLineSet,
  constellations,
  lineKey,
  nextConstellation,
} from './constellations.js';

test('연결선 키는 방향과 무관하다', () => {
  assert.equal(lineKey('alpha', 'beta'), lineKey('beta', 'alpha'));
  assert.equal(lineKey('alpha', 'beta'), 'alpha|beta');
});

test('아직 완성하지 않은 가장 이른 스테이지를 돌려준다', () => {
  assert.equal(nextConstellation([])?.id, constellations[0].id);
  assert.equal(nextConstellation([constellations[0].id])?.id, constellations[1].id);
  assert.equal(nextConstellation(constellations.map((c) => c.id)), null);
});

test('별자리 데이터의 ID, 순서, 연결선 참조가 유효하다', () => {
  assert.deepEqual(constellations.map((c) => c.order), [1, 2, 3, 4, 5]);
  assert.equal(new Set(constellations.map((c) => c.id)).size, constellations.length);

  for (const constellation of constellations) {
    const starIds = new Set(constellation.stars.map((star) => star.id));
    assert.equal(starIds.size, constellation.stars.length, `${constellation.id}: 중복 별 ID`);
    assert.equal(
      answerLineSet(constellation).size,
      constellation.lines.length,
      `${constellation.id}: 중복 연결선`
    );
    for (const [from, to] of constellation.lines) {
      assert.ok(starIds.has(from), `${constellation.id}: 없는 시작 별 ${from}`);
      assert.ok(starIds.has(to), `${constellation.id}: 없는 끝 별 ${to}`);
      assert.notEqual(from, to, `${constellation.id}: 자기 자신을 잇는 선`);
    }
  }
});

test('모든 이야기의 마지막 컷에는 별자리 오버레이가 있다', () => {
  for (const constellation of constellations) {
    const slides = constellation.story?.slides ?? [];
    assert.ok(slides.length > 0, `${constellation.id}: 이야기 없음`);
    const last = slides.at(-1);
    assert.equal(last.isSkyCut, true, `${constellation.id}: 마지막 컷 표시 없음`);
    assert.ok(last.overlay?.length, `${constellation.id}: 마지막 컷 오버레이 없음`);
  }
});

