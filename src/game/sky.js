import { constellations } from './constellations.js';
import { createBackgroundStars } from './starfield.js';

/**
 * 앱 전체가 공유하는 "하나의 밤하늘".
 *
 * 배경 별밭은 앱을 켤 때 딱 한 번 만들어 두고 모든 화면이 같은 것을 쓴다.
 * 화면을 옮겨 다녀도, 스테이지를 다시 시작해도 별은 같은 자리에 있다.
 */

/** 별자리에 속한 실제 별 전부 (스테이지 구분 없이). */
export const realStars = constellations.flatMap((c) =>
  c.stars.map((s) => ({ ...s, constellationId: c.id }))
);

/** 별자리에 속하지 않은 장식 별. 나만의 성좌를 만들 때도 이 별들을 쓴다. */
export const backgroundStars = createBackgroundStars(realStars);

/** 화면에 찍히는 모든 별. */
export const allSkyStars = [...realStars, ...backgroundStars];
