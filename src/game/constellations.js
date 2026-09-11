import data from '../data/constellations.json';

/**
 * 별자리 데이터 접근 창구.
 * 화면 컴포넌트는 constellations.json을 직접 읽지 말고 이 모듈만 쓴다.
 * 나중에 별자리를 추가하거나 파일을 쪼개도 여기만 고치면 되도록.
 *
 * ─────────────────────────────────────────────────────────────
 * constellations.json 스키마
 * ─────────────────────────────────────────────────────────────
 * meta.skyDecMin  : 성도판 가장자리에 해당하는 적위. projection.js와 값을 맞춘다.
 *
 * constellation
 *   id          : 고유 문자열. localStorage에 저장되는 값이므로 한 번 정하면 바꾸지 않는다.
 *   name        : 한글 이름
 *   aka         : 아이들에게 익숙한 별칭 ("북두칠성", "W자리" 등)
 *   latinName   : 라틴어 학명
 *   order       : 스테이지 순서 (1부터). 잠금 해제 순서이기도 하다.
 *   isTutorial  : 튜토리얼 스테이지 여부
 *   hint        : 막혔을 때 보여줄 한 줄 힌트
 *   stars[]     : { id, name(한글 고유명, 없으면 null), bayer, ra(시), dec(도), mag(등급), isPolaris? }
 *   lines[]     : [별id, 별id] 쌍의 배열 = 정답 연결선 목록.
 *                 순서·방향은 판정에 쓰지 않는다 (concept.md 3장: 순서 강제 X, 양방향 허용).
 *   story       : { title, slides[] }  ← Phase 5에서 채운다
 *   art         : { silhouette }       ← Phase 5에서 채운다
 */

export const skyMeta = data.meta;

/** order 순으로 정렬된 별자리 배열. */
export const constellations = [...data.constellations].sort(
  (a, b) => a.order - b.order
);

/** 전체 스테이지 수. */
export const TOTAL_STAGES = constellations.length;

/** id로 별자리 하나를 찾는다. 없으면 undefined. */
export function getConstellation(id) {
  return constellations.find((c) => c.id === id);
}

/** 별자리 안에서 별 하나를 id로 찾는다. */
export function getStar(constellation, starId) {
  return constellation.stars.find((s) => s.id === starId);
}

/**
 * 정답 연결선을 방향 없는 키로 바꾼다. ("a|b"와 "b|a"가 같은 값이 되도록)
 * 정답 판정과 중복 연결 검사에 쓴다.
 */
export function lineKey(starIdA, starIdB) {
  return starIdA < starIdB ? `${starIdA}|${starIdB}` : `${starIdB}|${starIdA}`;
}

/** 별자리의 정답 연결선 전체를 Set<lineKey>로 만든다. */
export function answerLineSet(constellation) {
  return new Set(constellation.lines.map(([a, b]) => lineKey(a, b)));
}

/** 다음에 도전할 별자리(아직 완성하지 않은 것 중 순서가 가장 빠른 것). */
export function nextConstellation(completedIds = []) {
  return constellations.find((c) => !completedIds.includes(c.id)) ?? null;
}
