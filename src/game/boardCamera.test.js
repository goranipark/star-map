import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitBoardCamera } from './boardCamera.js';
import { focusRotation, projectStar, SKY } from './projection.js';

const { constellations } = JSON.parse(readFileSync(new URL('../data/constellations.json', import.meta.url), 'utf8'));

// 실제 별자리의 양 끝과 북극성이 작은 휴대폰·가로 화면에서도 잘리지 않아야 한다.
for (const [width, height] of [[288, 340], [358, 610], [358, 450], [700, 750], [420, 210], [880, 560]]) {
  test(`별자리와 북극성이 ${width}×${height} 별판 안에 들어온다`, () => {
    const viewHeight = 100 * height / width;
    for (const c of constellations) {
      const rotation = focusRotation(c, viewHeight < 80 ? 270 : 180);
      const points = [...c.stars.map((s) => projectStar(s.ra, s.dec, rotation)), { x: SKY.cx, y: SKY.cy }];
      const camera = fitBoardCamera(points, 100, viewHeight);
      assert.ok(Number.isFinite(camera.scale) && camera.scale > 0, c.id);
      for (const point of points) {
        const x = 50 + (point.x - camera.x) * camera.scale;
        const y = viewHeight / 2 + (point.y - camera.y) * camera.scale;
        assert.ok(x >= 8 - 1e-8 && x <= 92 + 1e-8, `${c.id}: 가로 여백`);
        assert.ok(y >= 8 - 1e-8 && y <= viewHeight - 8 + 1e-8, `${c.id}: 세로 여백`);
      }
    }
  });
}
