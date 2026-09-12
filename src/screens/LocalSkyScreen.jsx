import { useId, useMemo, useState } from 'react';
import styles from './LocalSkyScreen.module.css';

import { constellations } from '../game/constellations.js';
import { radiusForMagnitude } from '../game/projection.js';
import {
  compassDirection,
  constellationVisibility,
  formatKoreanDateTimeInput,
  horizontalCoordinates,
  parseKoreanDateTime,
  projectHorizontal,
} from '../game/observingSky.js';
import {
  defaultObservationLocation,
  getObservationLocation,
  observationRegions,
} from '../data/observationLocations.js';

const SKY_CENTER = 50;
const SKY_RADIUS = 46;

function averageAzimuth(stars) {
  if (!stars.length) return 0;
  const vector = stars.reduce((sum, star) => {
    const angle = star.azimuth * Math.PI / 180;
    return { x: sum.x + Math.sin(angle), y: sum.y + Math.cos(angle) };
  }, { x: 0, y: 0 });
  return (Math.atan2(vector.x, vector.y) * 180 / Math.PI + 360) % 360;
}

function locationFailureMessage(error) {
  if (error?.code === 1) return '위치 권한이 허용되지 않았어요. 아래에서 가까운 지역을 골라 주세요.';
  if (error?.code === 3) return '위치를 확인하는 데 시간이 오래 걸렸어요. 다시 시도하거나 지역을 골라 주세요.';
  return '현재 위치를 확인하지 못했어요. 아래에서 가까운 지역을 골라 주세요.';
}

export default function LocalSkyScreen() {
  const clipId = useId().replaceAll(':', '');
  const [location, setLocation] = useState(defaultObservationLocation);
  const [selectedId, setSelectedId] = useState(defaultObservationLocation.id);
  const [dateTime, setDateTime] = useState(() => formatKoreanDateTimeInput());
  const [geoState, setGeoState] = useState({ status: 'idle', message: '' });

  const date = parseKoreanDateTime(dateTime) ?? new Date();
  const plotted = useMemo(() => constellations.map((constellation) => {
    const stars = constellation.stars.map((star) => {
      const horizontal = horizontalCoordinates(star, location, date);
      return { ...star, ...horizontal, ...projectHorizontal(horizontal.altitude, horizontal.azimuth) };
    });
    const starById = Object.fromEntries(stars.map((star) => [star.id, star]));
    const visibility = constellationVisibility(stars);
    const visibleStars = stars.filter((star) => star.altitude >= 0);
    const directionStars = visibleStars.length ? visibleStars : stars;
    return {
      constellation,
      stars,
      starById,
      visibility,
      direction: compassDirection(averageAzimuth(directionStars)),
      highestAltitude: Math.max(...stars.map((star) => star.altitude)),
    };
  }), [location.latitude, location.longitude, date.getTime()]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoState({ status: 'error', message: '이 브라우저에서는 현재 위치 기능을 사용할 수 없어요.' });
      return;
    }
    setGeoState({ status: 'loading', message: '현재 위치를 확인하고 있어요…' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          id: 'current',
          name: '현재 위치',
          region: '기기에서 한 번 확인한 위치',
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setSelectedId('current');
        setGeoState({ status: 'success', message: '현재 위치를 밤하늘에 적용했어요.' });
      },
      (error) => setGeoState({ status: 'error', message: locationFailureMessage(error) }),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 15 * 60 * 1000 }
    );
  };

  const selectLocation = (event) => {
    const next = getObservationLocation(event.target.value);
    if (!next) return;
    setSelectedId(next.id);
    setLocation(next);
    setGeoState({ status: 'idle', message: '' });
  };

  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return (
    <section className={styles.wrap} aria-labelledby="local-sky-title">
      <header className={styles.intro}>
        <p className="eyebrow">LOCAL NIGHT SKY</p>
        <h1 id="local-sky-title" className={styles.title}>우리 지역 밤하늘</h1>
        <p className={styles.lead}>지역과 시각을 바꾸며 북쪽 별자리의 위치를 살펴보세요.</p>
      </header>

      <div className={styles.workspace}>
        <div className={styles.skyColumn}>
          <div className={styles.skyFrame}>
            <svg
              className={styles.sky}
              viewBox="0 0 100 100"
              role="img"
              aria-label={`${location.name}에서 ${formattedDate}에 보이는 북쪽 밤하늘`}
            >
              <defs>
                <clipPath id={clipId}>
                  <circle cx={SKY_CENTER} cy={SKY_CENTER} r={SKY_RADIUS} />
                </clipPath>
                <radialGradient id={`${clipId}-sky`} cx="50%" cy="42%" r="65%">
                  <stop offset="0%" stopColor="#183846" />
                  <stop offset="72%" stopColor="#0b1b2a" />
                  <stop offset="100%" stopColor="#07111e" />
                </radialGradient>
              </defs>

              <circle cx={SKY_CENTER} cy={SKY_CENTER} r={SKY_RADIUS} fill={`url(#${clipId}-sky)`} className={styles.horizon} />
              {[60, 30].map((altitude) => (
                <circle
                  key={altitude}
                  cx={SKY_CENTER}
                  cy={SKY_CENTER}
                  r={SKY_RADIUS * (90 - altitude) / 90}
                  className={styles.altitudeGuide}
                />
              ))}
              <g clipPath={`url(#${clipId})`}>
                {plotted.map(({ constellation, starById }) => (
                  <g key={constellation.id} className={styles.constellation}>
                    {constellation.lines.map(([a, b]) => (
                      <line
                        key={`${a}-${b}`}
                        x1={starById[a].x}
                        y1={starById[a].y}
                        x2={starById[b].x}
                        y2={starById[b].y}
                        className={styles.constellationLine}
                      />
                    ))}
                    {constellation.stars.map((star) => {
                      const point = starById[star.id];
                      if (point.altitude < 0) return null;
                      return (
                        <circle
                          key={star.id}
                          cx={point.x}
                          cy={point.y}
                          r={radiusForMagnitude(star.mag, { min: 0.45, max: 1.05 })}
                          className={star.isPolaris ? styles.polaris : styles.star}
                        />
                      );
                    })}
                  </g>
                ))}
              </g>

              <text x="50" y="2.6" textAnchor="middle" className={styles.compass}>북</text>
              <text x="97.4" y="51" textAnchor="middle" className={styles.compass}>동</text>
              <text x="50" y="99" textAnchor="middle" className={styles.compass}>남</text>
              <text x="2.6" y="51" textAnchor="middle" className={styles.compass}>서</text>
              <circle cx="50" cy="50" r="0.7" className={styles.zenith} />
            </svg>
          </div>
          <div className={styles.skyCaption}>
            <strong>{location.name}</strong>
            <span>{formattedDate} · 대한민국 표준시</span>
          </div>
        </div>

        <aside className={styles.controls}>
          <div className={styles.controlGroup}>
            <div className={styles.controlHeading}>
              <label htmlFor="observation-location">관측 지역</label>
              <button
                type="button"
                className={styles.locationButton}
                onClick={useCurrentLocation}
                disabled={geoState.status === 'loading'}
              >
                {geoState.status === 'loading' ? '확인 중…' : '◎ 현재 위치 사용'}
              </button>
            </div>
            <select id="observation-location" className={styles.select} value={selectedId} onChange={selectLocation}>
              {selectedId === 'current' && <option value="current">현재 위치</option>}
              {observationRegions.map((region) => (
                <optgroup key={region.name} label={region.name}>
                  {region.locations.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className={styles.help}>선택한 지역의 중심 기준이에요. 가까운 지역에서는 거의 비슷하게 보여요.</p>
            {geoState.message && (
              <p className={geoState.status === 'error' ? styles.error : styles.geoMessage} role="status">
                {geoState.message}
              </p>
            )}
            <p className={styles.privacy}>현재 위치는 서버로 보내거나 저장하지 않아요.</p>
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.controlHeading}>
              <label htmlFor="observation-time">관측 시각</label>
              <button type="button" className={styles.nowButton} onClick={() => setDateTime(formatKoreanDateTimeInput())}>
                지금
              </button>
            </div>
            <input
              id="observation-time"
              className={styles.dateInput}
              type="datetime-local"
              value={dateTime}
              onChange={(event) => setDateTime(event.target.value)}
            />
          </div>

          <div className={styles.visibilityList} aria-label="별자리 관측 상태">
            {plotted.map(({ constellation, visibility, direction, highestAltitude }) => (
              <div key={constellation.id} className={styles.visibilityItem}>
                <div>
                  <strong>{constellation.name}</strong>
                  <span>{direction}쪽 · 가장 높은 별 {Math.max(-90, Math.min(90, highestAltitude)).toFixed(0)}°</span>
                </div>
                <span className={`${styles.badge} ${styles[visibility.state]}`}>{visibility.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <p className={styles.notice}>
        이 지도는 수업용 위치 안내예요. 실제 관측에는 산·건물·날씨·주변 불빛의 영향을 함께 살펴보세요.
      </p>
    </section>
  );
}
