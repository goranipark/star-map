import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compassDirection,
  constellationVisibility,
  formatKoreanDateTimeInput,
  greenwichMeanSiderealTimeDegrees,
  horizontalCoordinates,
  parseKoreanDateTime,
  projectHorizontal,
} from './observingSky.js';

const closeTo = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
};

test('J2000 기준 시각의 그리니치 항성시를 계산한다', () => {
  closeTo(greenwichMeanSiderealTimeDegrees(new Date('2000-01-01T12:00:00Z')), 280.46061837);
});

test('천구 북극의 고도는 관측지 위도와 같다', () => {
  const result = horizontalCoordinates(
    { ra: 0, dec: 90 },
    { latitude: 37.5665, longitude: 126.978 },
    new Date('2026-09-12T12:00:00Z')
  );
  closeTo(result.altitude, 37.5665, 1e-6);
});

test('자오선 위 천체는 적도 관측자의 천정에 놓인다', () => {
  const date = new Date('2000-01-01T12:00:00Z');
  const ra = greenwichMeanSiderealTimeDegrees(date) / 15;
  const result = horizontalCoordinates(
    { ra, dec: 0 },
    { latitude: 0, longitude: 0 },
    date
  );
  closeTo(result.altitude, 90, 1e-6);
});

test('수평 좌표 투영은 천정을 중앙, 지평선을 가장자리에 둔다', () => {
  assert.deepEqual(projectHorizontal(90, 123), { x: 50, y: 50, r: 0 });
  const east = projectHorizontal(0, 90);
  closeTo(east.x, 96);
  closeTo(east.y, 50);
  closeTo(east.r, 1);
});

test('방위각과 별자리 관측 상태를 쉬운 말로 바꾼다', () => {
  assert.equal(compassDirection(350), '북');
  assert.equal(compassDirection(91), '동');
  assert.equal(constellationVisibility([{ altitude: 30 }, { altitude: -2 }]).state, 'partial');
  assert.equal(constellationVisibility([{ altitude: -1 }, { altitude: -20 }]).state, 'hidden');
});

test('대한민국 표준시 입력값을 실제 시각과 왕복한다', () => {
  const input = formatKoreanDateTimeInput(new Date('2026-09-12T12:34:00Z'));
  assert.equal(input, '2026-09-12T21:34');
  assert.equal(parseKoreanDateTime(input).toISOString(), '2026-09-12T12:34:00.000Z');
});
