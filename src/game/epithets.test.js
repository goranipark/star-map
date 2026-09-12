import test from 'node:test';
import assert from 'node:assert/strict';

import { ALL_EPITHETS, EPITHET_GROUPS, epithetGroupFor, randomEpithet } from './epithets.js';

test('칭호는 여섯 카테고리에 열여섯 개씩 있다', () => {
  assert.equal(EPITHET_GROUPS.length, 6);
  for (const group of EPITHET_GROUPS) assert.equal(group.items.length, 16, group.label);
  assert.equal(ALL_EPITHETS.length, 96);
  assert.equal(new Set(ALL_EPITHETS).size, 96);
});

test('칭호가 속한 탭을 찾고 무작위 재추천은 현재 값을 피한다', () => {
  for (const item of ALL_EPITHETS) assert.ok(epithetGroupFor(item));
  const suggested = randomEpithet(ALL_EPITHETS[0]);
  assert.notEqual(suggested, ALL_EPITHETS[0]);
});
