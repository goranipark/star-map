/**
 * 지역명은 선택을 돕기 위한 기준점이며 계산에는 위도·경도만 사용한다.
 * 강원특별자치도는 산간·영동·영서 지역을 고르게 고를 수 있도록 모든 시·군을 싣는다.
 */
export const observationRegions = [
  { name: '서울특별시', locations: [
    { id: 'seoul', name: '서울', latitude: 37.5665, longitude: 126.9780 },
  ] },
  { name: '부산광역시', locations: [
    { id: 'busan', name: '부산', latitude: 35.1796, longitude: 129.0756 },
  ] },
  { name: '대구광역시', locations: [
    { id: 'daegu', name: '대구', latitude: 35.8714, longitude: 128.6014 },
  ] },
  { name: '인천광역시', locations: [
    { id: 'incheon', name: '인천', latitude: 37.4563, longitude: 126.7052 },
  ] },
  { name: '광주광역시', locations: [
    { id: 'gwangju', name: '광주', latitude: 35.1595, longitude: 126.8526 },
  ] },
  { name: '대전광역시', locations: [
    { id: 'daejeon', name: '대전', latitude: 36.3504, longitude: 127.3845 },
  ] },
  { name: '울산광역시', locations: [
    { id: 'ulsan', name: '울산', latitude: 35.5384, longitude: 129.3114 },
  ] },
  { name: '세종특별자치시', locations: [
    { id: 'sejong', name: '세종', latitude: 36.4800, longitude: 127.2890 },
  ] },
  { name: '경기도', locations: [
    { id: 'suwon', name: '수원', latitude: 37.2636, longitude: 127.0286 },
    { id: 'goyang', name: '고양', latitude: 37.6584, longitude: 126.8320 },
    { id: 'uijeongbu', name: '의정부', latitude: 37.7381, longitude: 127.0337 },
    { id: 'seongnam', name: '성남', latitude: 37.4200, longitude: 127.1265 },
  ] },
  { name: '강원특별자치도', locations: [
    { id: 'chuncheon', name: '춘천', latitude: 37.8813, longitude: 127.7300 },
    { id: 'wonju', name: '원주', latitude: 37.3422, longitude: 127.9202 },
    { id: 'gangneung', name: '강릉', latitude: 37.7519, longitude: 128.8761 },
    { id: 'donghae', name: '동해', latitude: 37.5248, longitude: 129.1143 },
    { id: 'taebaek', name: '태백', latitude: 37.1641, longitude: 128.9856 },
    { id: 'sokcho', name: '속초', latitude: 38.2070, longitude: 128.5918 },
    { id: 'samcheok', name: '삼척', latitude: 37.4499, longitude: 129.1652 },
    { id: 'hongcheon', name: '홍천', latitude: 37.6970, longitude: 127.8888 },
    { id: 'hoengseong', name: '횡성', latitude: 37.4918, longitude: 127.9850 },
    { id: 'yeongwol', name: '영월', latitude: 37.1838, longitude: 128.4617 },
    { id: 'pyeongchang', name: '평창', latitude: 37.3705, longitude: 128.3903 },
    { id: 'jeongseon', name: '정선', latitude: 37.3807, longitude: 128.6608 },
    { id: 'cheorwon', name: '철원', latitude: 38.1467, longitude: 127.3134 },
    { id: 'hwacheon', name: '화천', latitude: 38.1062, longitude: 127.7082 },
    { id: 'yanggu', name: '양구', latitude: 38.1100, longitude: 127.9897 },
    { id: 'inje', name: '인제', latitude: 38.0695, longitude: 128.1707 },
    { id: 'goseong-gw', name: '고성', latitude: 38.3806, longitude: 128.4677 },
    { id: 'yangyang', name: '양양', latitude: 38.0754, longitude: 128.6191 },
  ] },
  { name: '충청북도', locations: [
    { id: 'cheongju', name: '청주', latitude: 36.6424, longitude: 127.4890 },
    { id: 'chungju', name: '충주', latitude: 36.9910, longitude: 127.9259 },
    { id: 'jecheon', name: '제천', latitude: 37.1326, longitude: 128.1910 },
  ] },
  { name: '충청남도', locations: [
    { id: 'cheonan', name: '천안', latitude: 36.8151, longitude: 127.1139 },
    { id: 'gongju', name: '공주', latitude: 36.4465, longitude: 127.1190 },
    { id: 'seosan', name: '서산', latitude: 36.7845, longitude: 126.4503 },
  ] },
  { name: '전북특별자치도', locations: [
    { id: 'jeonju', name: '전주', latitude: 35.8242, longitude: 127.1480 },
    { id: 'gunsan', name: '군산', latitude: 35.9677, longitude: 126.7368 },
    { id: 'namwon', name: '남원', latitude: 35.4164, longitude: 127.3904 },
  ] },
  { name: '전라남도', locations: [
    { id: 'mokpo', name: '목포', latitude: 34.8118, longitude: 126.3922 },
    { id: 'suncheon', name: '순천', latitude: 34.9506, longitude: 127.4872 },
    { id: 'yeosu', name: '여수', latitude: 34.7604, longitude: 127.6622 },
  ] },
  { name: '경상북도', locations: [
    { id: 'pohang', name: '포항', latitude: 36.0190, longitude: 129.3435 },
    { id: 'andong', name: '안동', latitude: 36.5684, longitude: 128.7294 },
    { id: 'gumi', name: '구미', latitude: 36.1195, longitude: 128.3446 },
  ] },
  { name: '경상남도', locations: [
    { id: 'changwon', name: '창원', latitude: 35.2285, longitude: 128.6811 },
    { id: 'jinju', name: '진주', latitude: 35.1800, longitude: 128.1076 },
    { id: 'tongyeong', name: '통영', latitude: 34.8544, longitude: 128.4331 },
  ] },
  { name: '제주특별자치도', locations: [
    { id: 'jeju', name: '제주', latitude: 33.4996, longitude: 126.5312 },
    { id: 'seogwipo', name: '서귀포', latitude: 33.2541, longitude: 126.5601 },
  ] },
];

export const observationLocations = observationRegions.flatMap((region) =>
  region.locations.map((location) => ({ ...location, region: region.name }))
);

export const defaultObservationLocation = observationLocations.find(({ id }) => id === 'seoul');

export function getObservationLocation(id) {
  return observationLocations.find((location) => location.id === id);
}
