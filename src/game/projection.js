/**
 * 하늘 좌표(적경·적위) → 화면 좌표 변환.
 *
 * concept.md 2장: "화면 중앙에 항상 북극성이 고정되어 있고,
 * 계절/시간에 따라 별자리가 그 주위를 회전하는 실제 밤하늘의 원리를 보여준다."
 *
 * 그래서 별자리마다 따로 그림을 그리지 않고, 별 하나하나의 실제 위치를
 * "천구 북극을 중심으로 한 원형 성도판(planisphere)" 위에 찍는다.
 * 이렇게 하면 별자리끼리의 실제 상대 위치가 그대로 유지되므로
 * 도감·계절 지도·회전 연출을 따로 꾸며낼 필요가 없다.
 *
 * 사용하는 투영법: 방위등거리 투영(azimuthal equidistant).
 *   중심에서의 거리 r ∝ (90° - 적위)  → 극에서 떨어진 각거리에 정비례.
 *   극 주변 별자리만 다루므로 왜곡이 거의 없고, 계산도 뺄셈 하나로 끝난다.
 */

/** 성도판을 그리는 정사각형 좌표계 (SVG viewBox "0 0 100 100" 기준). */
export const SKY = {
  /** 성도판 중심 = 천구 북극. 북극성은 이 점 가까이에 따로 투영된다. */
  cx: 50,
  cy: 50,
  /** 성도판 원반의 반지름 (가장자리에 여백 4를 남긴다) */
  radius: 46,
  /** 원반 가장자리에 해당하는 적위. 이보다 남쪽 별은 화면 밖으로 나간다. */
  decMin: 45,
};

const DEG = Math.PI / 180;

/**
 * 별 하나를 성도판 좌표로 옮긴다.
 *
 * @param {number} ra  적경 (시간 단위, 0~24)
 * @param {number} dec 적위 (도 단위)
 * @param {number} [rotationDeg=0] 성도판 전체를 돌리는 각도(도).
 *        스테이지 전환 연출이나 계절 표현에 쓴다. 0이면 적경 0h가 화면 위쪽.
 * @returns {{x: number, y: number, r: number}}
 *          x, y는 viewBox 좌표. r은 중심에서의 거리 비율(0=천구 북극, 1=원반 가장자리).
 */
export function projectStar(ra, dec, rotationDeg = 0) {
  // 극에서 떨어진 정도(0~1). 적위가 높을수록 중심에 가깝다.
  const r = (90 - dec) / (90 - SKY.decMin);

  // 적경 1시간 = 15도. 땅에서 하늘을 올려다보는 방향이므로 적경은 반시계로 증가한다.
  const angle = (ra * 15 + rotationDeg) * DEG;

  return {
    x: SKY.cx - SKY.radius * r * Math.sin(angle),
    y: SKY.cy - SKY.radius * r * Math.cos(angle),
    r,
  };
}

/**
 * 별자리 하나의 모든 별을 한 번에 투영한다.
 * @returns {Array<{...star, x: number, y: number, r: number}>}
 */
export function projectConstellation(constellation, rotationDeg = 0) {
  return constellation.stars.map((star) => ({
    ...star,
    ...projectStar(star.ra, star.dec, rotationDeg),
  }));
}

/** 투영된 별 목록의 무게중심. 스테이지 포커스 링을 그릴 때 쓴다. */
export function centroidOf(projectedStars) {
  const n = projectedStars.length;
  const sum = projectedStars.reduce(
    (acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / n, y: sum.y / n };
}

/**
 * 별자리를 감싸는 최소 원(중심 + 반지름). 스테이지 범위를 나타내는
 * "은은한 골드 글로우 링"(design.md 5장)의 크기를 정하는 데 쓴다.
 */
export function boundingCircleOf(projectedStars) {
  const center = centroidOf(projectedStars);
  const radius = projectedStars.reduce(
    (max, s) => Math.max(max, Math.hypot(s.x - center.x, s.y - center.y)),
    0
  );
  return { ...center, radius };
}

/**
 * 별자리가 화면의 특정 방향에 오도록 성도판을 돌리는 각도를 구한다.
 *
 * @param {object} constellation
 * @param {number} [targetDeg=180] 별자리를 놓고 싶은 방향(도).
 *        0=위, 90=왼쪽, 180=아래, 270=오른쪽.
 *        기본값 180(아래)은 손이 화면 아래쪽에 있는 태블릿 조작에 편하다.
 */
export function focusRotation(constellation, targetDeg = 180) {
  // 별자리의 평균 적경이 곧 별자리가 놓인 방향각이다.
  // 적경은 0h와 24h가 이어지므로 단순 평균 대신 벡터 평균을 쓴다.
  let sx = 0;
  let sy = 0;
  for (const s of constellation.stars) {
    const a = s.ra * 15 * DEG;
    sx += Math.sin(a);
    sy += Math.cos(a);
  }
  const meanDeg = (Math.atan2(sx, sy) / DEG + 360) % 360;
  return (targetDeg - meanDeg + 360) % 360;
}

/**
 * 별 밝기(등급)를 화면상 반지름으로 바꾼다.
 * 등급은 숫자가 작을수록 밝은 별이다(북극성 1.98, 어두운 별 5 근처).
 *
 * concept.md 3장: "실제 별의 밝기(등급)에 비례한 크기로" 표시하되,
 * 초등 저학년이 어두운 별도 누를 수 있도록 최소 크기를 넉넉히 잡는다.
 */
export function radiusForMagnitude(mag, { min = 0.6, max = 1.6 } = {}) {
  const BRIGHTEST = 1.5;
  const FAINTEST = 5.2;
  const t = (FAINTEST - mag) / (FAINTEST - BRIGHTEST); // 밝을수록 1에 가까움
  const clamped = Math.min(1, Math.max(0, t));
  return min + (max - min) * clamped;
}

/**
 * 별자리 하나를 작은 정사각형 상자 안에 꽉 차게 맞춘다.
 *
 * 성좌 카드나 도감 목록의 작은 그림처럼, 밤하늘 전체가 아니라
 * "별자리 모양 하나"만 보여줄 때 쓴다.
 *
 * @param {object} constellation
 * @param {object} [options]
 * @param {number} [options.size=100]    상자 한 변의 길이 (SVG viewBox 기준)
 * @param {number} [options.padding=12]  가장자리 여백
 * @returns {{ stars: Array, scale: number }}
 */
export function fitConstellationToBox(constellation, options) {
  return fitConstellationsToBox([constellation], options);
}

/**
 * 별자리 여러 개를 한 상자 안에 함께 맞춘다.
 *
 * 별자리끼리의 **실제 상대 위치가 그대로 유지된다.** 하늘에 찍은 좌표를 통째로
 * 축소만 하기 때문이다. 큰곰자리와 작은곰자리를 한 그림에 같이 보여줄 때 쓴다.
 *
 * @returns {{ stars: Array, lines: Array<[string, string]>, scale: number }}
 */
export function fitConstellationsToBox(constellations, { size = 100, padding = 12 } = {}) {
  const points = constellations.flatMap((c) =>
    c.stars.map((s) => ({
      ...s,
      constellationId: c.id,
      ...projectStar(s.ra, s.dec, 0),
    }))
  );
  const lines = constellations.flatMap((c) => c.lines);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // 가로세로 비율을 유지해야 별자리 모양이 찌그러지지 않는다.
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = (size - padding * 2) / Math.max(width, height);

  const offsetX = (size - width * scale) / 2 - minX * scale;
  const offsetY = (size - height * scale) / 2 - minY * scale;

  return {
    scale,
    lines,
    stars: points.map((p) => ({
      ...p,
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    })),
  };
}
