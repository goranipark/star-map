import { fitConstellationToBox } from './projection.js';

/** 이야기 마지막의 성도 합성용 삽화를 완료 연출에도 재사용한다. */
export function completionArtFor(constellation) {
  const slides = constellation?.story?.slides ?? [];
  return [...slides].reverse().find((slide) => slide.isSkyCut && slide.art)?.art ?? null;
}

/**
 * 100×100 성도 합성 이미지의 좌표를 현재 퍼즐 성도판 좌표에 맞추는 유사 변환.
 * 두 좌표계는 같은 천구 투영을 사용하므로 회전·균일 확대·이동만으로 정확히 겹친다.
 */
export function completionArtTransform(constellation, projectedById) {
  if (!constellation?.stars?.length || !projectedById) return null;

  const fitted = fitConstellationToBox(constellation, { size: 100, padding: 16 });
  const pairs = fitted.stars
    .map((source) => ({ source, target: projectedById[source.id] }))
    .filter(({ target }) => Boolean(target));

  if (pairs.length < 2) return null;

  // 가장 멀리 떨어진 두 별을 기준으로 삼으면 작은 좌표 오차가 확대되지 않는다.
  let anchorA = pairs[0];
  let anchorB = pairs[1];
  let farthest = -1;
  for (let i = 0; i < pairs.length; i += 1) {
    for (let j = i + 1; j < pairs.length; j += 1) {
      const dx = pairs[j].source.x - pairs[i].source.x;
      const dy = pairs[j].source.y - pairs[i].source.y;
      const distance = dx * dx + dy * dy;
      if (distance > farthest) {
        farthest = distance;
        anchorA = pairs[i];
        anchorB = pairs[j];
      }
    }
  }

  if (farthest <= 0) return null;

  const sourceDx = anchorB.source.x - anchorA.source.x;
  const sourceDy = anchorB.source.y - anchorA.source.y;
  const targetDx = anchorB.target.x - anchorA.target.x;
  const targetDy = anchorB.target.y - anchorA.target.y;
  const denominator = sourceDx * sourceDx + sourceDy * sourceDy;

  // 복소수 나눗셈과 같은 형태: a+bi가 회전과 균일 확대를 함께 나타낸다.
  const a = (targetDx * sourceDx + targetDy * sourceDy) / denominator;
  const b = (targetDy * sourceDx - targetDx * sourceDy) / denominator;
  const c = -b;
  const d = a;
  const e = anchorA.target.x - a * anchorA.source.x - c * anchorA.source.y;
  const f = anchorA.target.y - b * anchorA.source.x - d * anchorA.source.y;

  return { a, b, c, d, e, f, svg: `matrix(${a} ${b} ${c} ${d} ${e} ${f})` };
}
