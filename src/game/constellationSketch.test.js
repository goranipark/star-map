import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendSketchPoint,
  emptySketch,
  isUsableSketch,
  MAX_SKETCH_POINTS,
  sketchPath,
} from './constellationSketch.js';

test('빈 상상화와 정상 좌표를 허용한다', () => {
  assert.equal(isUsableSketch(emptySketch()), true);
  assert.equal(isUsableSketch({ version: 1, strokes: [[[0, 0], [50.5, 100]]] }), true);
});

test('범위를 벗어나거나 지나치게 큰 상상화를 거부한다', () => {
  assert.equal(isUsableSketch({ version: 1, strokes: [[[0, 0], [101, 20]]] }), false);
  assert.equal(isUsableSketch({
    version: 1,
    strokes: [Array.from({ length: MAX_SKETCH_POINTS + 1 }, (_, index) => [index % 100, 20])],
  }), false);
});

test('가까운 포인터 좌표는 합치고 SVG 경로로 바꾼다', () => {
  let points = [[10, 10]];
  points = appendSketchPoint(points, [10.1, 10.1]);
  assert.equal(points.length, 1);
  points = appendSketchPoint(points, [20, 25]);
  assert.deepEqual(points, [[10, 10], [20, 25]]);
  assert.equal(sketchPath(points), 'M10.00 10.00 L20.00 25.00');
});
