import test from 'node:test';
import assert from 'node:assert/strict';

import { safeFileName } from './cardImage.js';

test('다운로드 파일명에서 운영체제 금지 문자를 제거한다', () => {
  assert.equal(safeFileName('별:/\\*?"<>|자리'), '별자리');
});

test('빈 이름은 안전한 기본 이름을 사용하고 길이를 제한한다', () => {
  assert.equal(safeFileName('   '), '나의성좌');
  assert.equal(safeFileName('가'.repeat(80)).length, 40);
});

