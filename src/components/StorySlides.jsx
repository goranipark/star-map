import { useEffect, useId, useMemo, useState } from 'react';
import styles from './StorySlides.module.css';

import { getConstellation } from '../game/constellations.js';
import OverlayTuner, { isTuning } from './OverlayTuner.jsx';
import {
  fitConstellationToBox,
  fitConstellationsToBox,
} from '../game/projection.js';

/**
 * 신화 이야기 슬라이드 (3~5컷).
 *
 * design.md 8장: "한 컷당 1~2문장" — 한 화면에 정보를 몰아넣지 않는다.
 *
 * ─────────────────────────────────────────────────────────────
 * 그림과 별자리의 역할 분담 (중요)
 * ─────────────────────────────────────────────────────────────
 * AI로 만든 삽화에는 **별을 하나도 그리지 않는다.** 이미지 생성기는 별을 정확한
 * 위치에 찍지 못해서, 개수가 늘거나 비율이 틀어진 별자리를 그려 버린다.
 * 아이들은 바로 앞 퍼즐에서 실제 좌표로 찍은 정확한 별자리를 이어 놓고 오기 때문에,
 * 그림에서 다른 모양을 보면 그대로 오개념이 된다.
 *
 * 그래서 **별자리는 앱이 그린다.** slide.overlay에 적힌 별자리를 실제 적경·적위로
 * 계산해 삽화 위에 겹쳐 그린다. 옛 성도가 신화 그림 위에 별자리를 얹던 방식과 같고,
 * 별 위치는 100% 정확하다.
 */
export default function StorySlides({ constellation, onFinish, finishLabel = '도감에 담기' }) {
  const slides = constellation.story?.slides ?? [];
  const [index, setIndex] = useState(0);

  /**
   * 삽화 파일을 찾는 중인 상태.
   * 슬라이드에는 그림 경로가 `art/ursa-minor-1.png`처럼 미리 적혀 있지만,
   * 실제로 저장한 파일이 jpg일 수도 있다. 그래서 확장자를 차례로 바꿔 가며 찾아보고,
   * 끝까지 못 찾으면 별자리 모양 그림으로 대신한다.
   * (선생님이 png든 jpg든 편한 형식으로 저장할 수 있게 하려는 것)
   */
  const [artTry, setArtTry] = useState({});

  /** 위치 맞추기 도구로 임시로 바꿔 본 값 (주소에 ?tune=1 을 붙였을 때만 쓴다). */
  const tuning = isTuning();
  const [tunedOverlay, setTunedOverlay] = useState(null);

  // 다른 별자리 이야기로 바뀌면 첫 컷부터 다시 시작
  useEffect(() => {
    setIndex(0);
    setArtTry({});
    setTunedOverlay(null);
  }, [constellation.id]);

  // 컷이 바뀌면 맞추던 값도 그 컷의 것으로 되돌린다
  useEffect(() => setTunedOverlay(null), [index]);

  const isLast = index >= slides.length - 1;
  const slide = slides[index];

  // 대본이 아직 없는 별자리 (Phase 5에서 채운다)
  if (slides.length === 0) {
    return (
      <div className={styles.wrap}>
        <article className={styles.slide}>
          <div className={styles.figureBox}>
            <SkyFigure ids={[constellation.id]} />
          </div>
          <div className={styles.body}>
            <p className="eyebrow">STORY</p>
            <h2 className={styles.title}>{constellation.name}</h2>
            <p className={styles.text}>
              이 별자리의 이야기는 아직 준비 중이에요.
              <br />
              곧 들려드릴게요.
            </p>
          </div>
        </article>
        <div className={styles.controls}>
          <button type="button" className="btnPrimary" onClick={onFinish}>
            {finishLabel}
          </button>
        </div>
      </div>
    );
  }

  const artSource = resolveArt(slide.art, artTry[slide.art] ?? 0);
  const hasArt = Boolean(artSource);

  return (
    <div className={styles.wrap}>
      <article className={styles.slide} key={index}>
        <div className={styles.figureBox}>
          {hasArt ? (
            <img
              className={styles.art}
              key={artSource}
              src={artSource}
              alt=""
              onError={() =>
                setArtTry((prev) => ({
                  ...prev,
                  [slide.art]: (prev[slide.art] ?? 0) + 1,
                }))
              }
            />
          ) : null}

          {/* 삽화가 없으면 별자리 도형만, 있으면 그 위에 겹쳐 그린다 */}
          {(slide.overlay || !hasArt) && (
            <SkyFigure
              ids={tunedOverlay ?? slide.overlay ?? [constellation.id]}
              highlightId={constellation.id}
              overlaid={hasArt}
            />
          )}
        </div>

        <div className={styles.body}>
          <p className="eyebrow">{constellation.story.title ?? constellation.name}</p>
          <p className={styles.text}>{slide.text}</p>
        </div>

        {tuning && (
          <OverlayTuner
            slideKey={`${constellation.id}-${index}`}
            overlay={slide.overlay}
            onChange={setTunedOverlay}
          />
        )}
      </article>

      {/* 몇 컷째인지 보여주는 점 */}
      <div className={styles.dots} role="group" aria-label="이야기 컷">
        {slides.map((_, i) => (
          <button
            type="button"
            key={i}
            className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
            aria-label={`${i + 1}번째 컷`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="btnGhost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          이전
        </button>

        {isLast ? (
          <button type="button" className="btnPrimary" onClick={onFinish}>
            {finishLabel}
          </button>
        ) : (
          <button type="button" className="btnPrimary" onClick={() => setIndex((i) => i + 1)}>
            다음 이야기 보기
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 실제 적경·적위로 계산한 별자리 도형.
 *
 * @param {string[]} ids         그릴 별자리 id 목록 (여러 개면 실제 상대 위치 그대로)
 * @param {string}   highlightId 지금 이야기 중인 별자리 — 이것만 또렷하게, 나머지는 흐리게
 * @param {boolean}  overlaid    삽화 위에 겹쳐 그리는 중인지
 */
function SkyFigure({ ids, highlightId, overlaid = false }) {
  const gradientId = useId();
  const placements = useMemo(() => normalizeOverlay(ids), [ids]);

  // 놓을 자리를 따로 정해 준 별자리가 하나라도 있으면, 별자리마다 따로 맞춘다.
  // 아무 것도 정하지 않았으면 전부 한 덩어리로 맞춰 실제 상대 위치를 유지한다.
  const tuned = placements.some((p) => p.tuned);

  const groups = useMemo(() => {
    if (!tuned) {
      const list = placements.map((p) => getConstellation(p.id)).filter(Boolean);
      const fitted = fitConstellationsToBox(list, { size: 100, padding: 16 });
      return [{ key: 'all', placement: DEFAULT_PLACEMENT, ...fitted }];
    }
    return placements
      .map((p) => {
        const c = getConstellation(p.id);
        if (!c) return null;
        return {
          key: p.id,
          placement: p,
          ...fitConstellationToBox(c, { size: 100, padding: 16 }),
        };
      })
      .filter(Boolean);
  }, [placements, tuned]);

  const dim = (constellationId) =>
    highlightId && placements.length > 1 && constellationId !== highlightId;

  return (
    <svg
      className={overlaid ? styles.overlay : styles.figure}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        {/* 별 둘레의 빛무리 */}
        <radialGradient id={`${gradientId}-halo`}>
          <stop offset="0%" stopColor="#FFFDF4" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#F5E7B8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E8C158" stopOpacity="0" />
        </radialGradient>
      </defs>

      {groups.map(({ key, placement, stars, lines }) => {
        const byId = Object.fromEntries(stars.map((s) => [s.id, s]));
        return (
          <g key={key} transform={placementTransform(placement)}>
            {/* 별을 잇는 선 — 잉크가 아니라 빛줄기로 보이도록 두 겹으로 긋는다 */}
            {lines.map(([a, b]) => {
              if (!byId[a] || !byId[b]) return null;
              const faded = dim(byId[a].constellationId);
              const coords = {
                x1: byId[a].x,
                y1: byId[a].y,
                x2: byId[b].x,
                y2: byId[b].y,
              };
              return (
                <g key={`${a}-${b}`} opacity={faded ? 0.4 : 1}>
                  <line {...coords} className={styles.lineGlow} />
                  <line {...coords} className={styles.lineCore} />
                </g>
              );
            })}

            {stars.map((s) => (
              <Glint
                key={s.id}
                x={s.x}
                y={s.y}
                mag={s.mag}
                gold={s.isPolaris}
                haloId={`${gradientId}-halo`}
                faded={dim(s.constellationId)}
                // 별자리를 줄여 놓으면 별빛도 같이 작아져야 자연스럽다
                size={1 / Math.sqrt(placement.scale)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** 놓을 자리를 정하지 않았을 때의 기본값 — 상자에 맞춘 그대로. */
const DEFAULT_PLACEMENT = { x: 0, y: 0, scale: 1, rotate: 0, tuned: false };

/**
 * overlay 항목을 통일된 형태로 바꾼다.
 * 문자열이면 그냥 별자리 id, 객체면 놓을 자리까지 정한 것이다.
 *   "ursa-major"
 *   { id: "ursa-major", x: -8, y: 4, scale: 0.9, rotate: 15 }
 */
function normalizeOverlay(entries) {
  return entries.map((entry) =>
    typeof entry === 'string'
      ? { id: entry, ...DEFAULT_PLACEMENT }
      : {
          ...DEFAULT_PLACEMENT,
          ...entry,
          tuned: true,
        }
  );
}

/**
 * 상자 한가운데를 기준으로 옮기고·돌리고·키운다.
 * 이 세 가지는 모양을 바꾸지 않으므로 별자리는 여전히 정확하다.
 * (별자리는 실제로도 밤새 북극성을 중심으로 돈다)
 */
function placementTransform({ x, y, scale, rotate }) {
  return [
    `translate(${50 + x} ${50 + y})`,
    `rotate(${rotate})`,
    `scale(${scale})`,
    'translate(-50 -50)',
  ].join(' ');
}

/** 별 하나를 사방으로 뻗는 뾰족한 광채(십자 별빛) 모양으로 만든다. */
function glintPath(radius, waist = 0.13) {
  const w = radius * waist;
  return `M0,${-radius} Q${w},${-w} ${radius},0 Q${w},${w} 0,${radius} Q${-w},${w} ${-radius},0 Q${-w},${-w} 0,${-radius} Z`;
}

/**
 * 빛나는 별 하나.
 *
 * 그냥 동그라미로 찍으면 그림 위에 붙인 스티커처럼 보인다.
 * 빛무리 + 십자 광채 + 밝은 심지 세 겹으로 그려야 삽화 속 밤하늘에 녹아든다.
 */
function Glint({ x, y, mag, gold, haloId, faded, size = 1 }) {
  // 밝은 별일수록 1에 가깝다 (등급은 숫자가 작을수록 밝다)
  const brightness = Math.min(1, Math.max(0, (5.2 - mag) / (5.2 - 1.5)));

  const spike = (1.5 + brightness * 2.1) * size;
  const halo = spike * 1.05;
  const core = (0.32 + brightness * 0.45) * size;

  return (
    <g
      transform={`translate(${x} ${y})`}
      opacity={faded ? 0.5 : 1}
      className={styles.glint}
      style={{ animationDelay: `${((x * 7 + y * 3) % 30) / 10}s` }}
    >
      <circle r={halo} fill={`url(#${haloId})`} />
      <path d={glintPath(spike)} className={gold ? styles.spikeGold : styles.spike} />
      <path
        d={glintPath(spike * 0.55)}
        transform="rotate(45)"
        className={gold ? styles.spikeGold : styles.spike}
        opacity="0.5"
      />
      <circle r={core} className={gold ? styles.coreGold : styles.core} />
    </g>
  );
}

/** 삽화로 받아들이는 파일 형식. 앞에서부터 차례로 찾아본다. */
const ART_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

/**
 * 데이터에 적힌 경로에서 확장자만 바꿔 가며 실제 파일을 찾는다.
 * @returns {string|null} 시도할 경로. 형식을 다 써 봤으면 null.
 */
function resolveArt(artPath, attempt) {
  if (!artPath || attempt >= ART_EXTENSIONS.length) return null;
  const base = artPath.replace(/\.[^./]+$/, '');
  return base + ART_EXTENSIONS[attempt];
}
