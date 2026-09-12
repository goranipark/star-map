const DEG = Math.PI / 180;

const normalizeDegrees = (value) => ((value % 360) + 360) % 360;

/**
 * 주어진 시각의 그리니치 평균 항성시(GMST)를 도 단위로 계산한다.
 * 별의 J2000 적경·적위를 교육용 밤하늘에 배치하기에 충분한 정밀도의 공식이다.
 */
export function greenwichMeanSiderealTimeDegrees(date) {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  const daysSinceJ2000 = julianDate - 2451545.0;
  const centuries = daysSinceJ2000 / 36525;
  return normalizeDegrees(
    280.46061837
      + 360.98564736629 * daysSinceJ2000
      + 0.000387933 * centuries ** 2
      - centuries ** 3 / 38710000
  );
}

/** 적경·적위를 관측자의 고도·방위각으로 변환한다. 방위각은 북쪽=0°, 동쪽=90°다. */
export function horizontalCoordinates(star, observer, date) {
  const latitude = observer.latitude * DEG;
  const declination = star.dec * DEG;
  const localSiderealTime = greenwichMeanSiderealTimeDegrees(date) + observer.longitude;
  const hourAngle = normalizeDegrees(localSiderealTime - star.ra * 15) * DEG;

  const sinAltitude =
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.min(1, Math.max(-1, sinAltitude)));
  const azimuth = Math.atan2(
    -Math.sin(hourAngle) * Math.cos(declination),
    Math.sin(declination) * Math.cos(latitude)
      - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle)
  );

  return {
    altitude: altitude / DEG,
    azimuth: normalizeDegrees(azimuth / DEG),
  };
}

/**
 * 천정이 중앙, 지평선이 가장자리인 원형 하늘 지도에 투영한다.
 * 북쪽은 위, 동쪽은 오른쪽이며 지평선 아래 별은 원 밖으로 나간다.
 */
export function projectHorizontal(altitude, azimuth, { cx = 50, cy = 50, radius = 46 } = {}) {
  const distance = radius * (90 - altitude) / 90;
  const angle = azimuth * DEG;
  return {
    x: cx + distance * Math.sin(angle),
    y: cy - distance * Math.cos(angle),
    r: distance / radius,
  };
}

export function compassDirection(azimuth) {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  return directions[Math.round(normalizeDegrees(azimuth) / 45) % directions.length];
}

export function constellationVisibility(stars) {
  const visible = stars.filter((star) => star.altitude >= 0);
  if (visible.length === 0) return { state: 'hidden', label: '지평선 아래', visibleCount: 0 };
  if (visible.length < stars.length) {
    return { state: 'partial', label: '일부 보임', visibleCount: visible.length };
  }
  const lowest = Math.min(...visible.map((star) => star.altitude));
  return {
    state: lowest < 15 ? 'low' : 'visible',
    label: lowest < 15 ? '낮게 보임' : '잘 보임',
    visibleCount: visible.length,
  };
}

/** 대한민국 표준시로 datetime-local 입력값을 만든다. */
export function formatKoreanDateTimeInput(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

/** datetime-local 값을 대한민국 표준시의 실제 시각으로 읽는다. */
export function parseKoreanDateTime(value) {
  const parsed = new Date(`${value}:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
