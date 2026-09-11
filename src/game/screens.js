/**
 * 화면 종류.
 *
 * ToDo.md Phase 1 결정사항: 라우터(react-router)를 쓰지 않고
 * App의 상태값 하나로 화면을 전환한다. 화면 수가 4개뿐이고,
 * GitHub Pages 하위 경로 배포에서 주소 문제가 생기지 않아 더 단순하다.
 */
export const SCREEN = {
  TITLE: 'title', // 시작 화면
  PUZZLE: 'puzzle', // 별 잇기 퍼즐판
  STORY: 'story', // 신화 이야기 슬라이드
  ALMANAC: 'almanac', // 나의 밤하늘 도감
  STAR_WEAVER: 'star-weaver', // 나만의 성좌 만들기 (도감 5장 완성 후 해금)
};

