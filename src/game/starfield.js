import { projectStar, SKY } from './projection.js';

/**
 * 배경 별밭 — 시드 기반 고정 배치.
 *
 * 왜 랜덤이 아니라 고정인가:
 * Phase 4-B에서 아이가 배경 별을 이어 자기 성좌를 만들고 저장한다.
 * 켤 때마다 별 위치가 달라지면 저장한 성좌를 다시 그릴 수 없다.
 * 그래서 같은 시드를 넣으면 언제나 같은 하늘이 나오도록 만든다.
 */

/** 아주 작고 빠른 시드 난수 발생기 (mulberry32). */
function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 이 값을 바꾸면 밤하늘 전체가 바뀐다. 한 번 정하면 바꾸지 않는다. */
export const SKY_SEED = 20260910;

/** 배경 별이 실제 별자리 별에 너무 붙지 않도록 띄우는 최소 거리(성도판 좌표 단위). */
const MIN_GAP = 3.2;

/**
 * 배경 별을 만든다.
 *
 * 좌표는 화면(x, y)이 아니라 하늘 좌표(ra, dec)로 만든다.
 * 그래야 성도판을 회전시킬 때 배경 별도 진짜 별처럼 같이 돈다.
 *
 * @param {object[]} realStars 피해서 배치할 실제 별들 ({ ra, dec })
 * @param {object}   options
 * @returns {Array<{id, ra, dec, mag, twinkleDelay}>}
 */
export function createBackgroundStars(realStars = [], { seed = SKY_SEED, count = 150 } = {}) {
  const random = makeRandom(seed);

  // 성도판을 회전시켜도 별 사이 거리는 변하지 않으므로 회전 0으로 한 번만 계산해 둔다.
  const occupied = realStars.map((s) => projectStar(s.ra, s.dec, 0));

  const stars = [];
  let guard = 0;

  while (stars.length < count && guard < count * 40) {
    guard += 1;

    // 원반 위에 고르게 뿌리려면 반지름은 제곱근을 취해야 한다.
    // (그냥 균등 난수를 쓰면 중심에 몰린다)
    const rNorm = Math.sqrt(random());
    const ra = random() * 24;
    const dec = 90 - (90 - SKY.decMin) * rNorm;

    const p = projectStar(ra, dec, 0);

    const tooClose =
      occupied.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < MIN_GAP) ||
      stars.some((s) => {
        const q = projectStar(s.ra, s.dec, 0);
        return Math.hypot(q.x - p.x, q.y - p.y) < MIN_GAP;
      });
    if (tooClose) continue;

    stars.push({
      id: `bg-${stars.length}`,
      ra,
      dec,
      // 어두운 별 위주로. 다만 밝은 축(3.8)은 어두운 정답 별과 겹치도록 두어
      // "별자리를 찾아내는" 재미를 남긴다 (concept.md 3장).
      mag: 3.8 + random() * 1.8,
      twinkleDelay: random() * 3,
      isBackground: true,
    });
  }

  return stars;
}
