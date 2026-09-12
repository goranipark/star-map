import { useMemo, useRef, useState } from 'react';
import styles from './ConstellationCard.module.css';

import { fitConstellationToBox, radiusForMagnitude } from '../game/projection.js';
import {
  appendSketchPoint,
  isUsableSketch,
  MAX_SKETCH_STROKES,
  sketchPath,
} from '../game/constellationSketch.js';

/**
 * 성좌 카드 — 칭호 / 이름 / 권능 / 별자리 그림.
 *
 * 도감의 항목이자, Phase 4-B에서 아이가 직접 채우는 빈 카드의 틀이기도 하다.
 * 카드 5장을 모으며 형식을 익힌 뒤 같은 카드를 빈칸으로 받게 되므로,
 * 여기서 정한 항목 순서와 이름을 그대로 유지한다.
 *
 * @param {object}   constellation
 * @param {boolean}  locked   아직 완성하지 않은 별자리 (실루엣 회색 처리)
 * @param {boolean}  compact  목록에서 쓰는 작은 형태
 * @param {boolean}  large    성좌를 만들 때 크게 보여 주는 세로 형태
 * @param {function} onClick  누르면 이야기 다시 보기
 */
export default function ConstellationCard({
  constellation,
  locked = false,
  compact = false,
  large = false,
  onClick,
  editableSketch = false,
  onSketchChange,
}) {
  const { stars } = useMemo(
    () => fitConstellationToBox(constellation, { size: 100, padding: 14 }),
    [constellation]
  );
  const byId = useMemo(
    () => Object.fromEntries(stars.map((s) => [s.id, s])),
    [stars]
  );

  const { epithet, power } = constellation.card ?? {};
  const Wrapper = onClick ? 'button' : 'div';
  const sketch = isUsableSketch(constellation.sketch) ? constellation.sketch : { version: 1, strokes: [] };
  const drawingRef = useRef(null);
  const [previewStroke, setPreviewStroke] = useState([]);

  const pointFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.min(100, Math.max(0, (event.clientX - rect.left) * 100 / rect.width)),
      Math.min(100, Math.max(0, (event.clientY - rect.top) * 100 / rect.height)),
    ];
  };

  const startDrawing = (event) => {
    if (!editableSketch || sketch.strokes.length >= MAX_SKETCH_STROKES
      || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    const points = [pointFromEvent(event)];
    drawingRef.current = { pointerId: event.pointerId, points };
    setPreviewStroke(points);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const continueDrawing = (event) => {
    if (drawingRef.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    const points = appendSketchPoint(drawingRef.current.points, pointFromEvent(event));
    if (points === drawingRef.current.points) return;
    drawingRef.current.points = points;
    setPreviewStroke(points);
  };

  const finishDrawing = (event, save = true) => {
    if (drawingRef.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    const { points } = drawingRef.current;
    drawingRef.current = null;
    setPreviewStroke([]);
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* already released */ }
    if (save && points.length >= 2) {
      onSketchChange?.({ version: 1, strokes: [...sketch.strokes, points] });
    }
  };

  return (
    <Wrapper
      className={[
        styles.card,
        locked ? styles.locked : '',
        compact ? styles.compact : '',
        large ? styles.large : '',
      ].join(' ')}
      onClick={locked ? undefined : onClick}
      disabled={locked && onClick ? true : undefined}
      type={onClick ? 'button' : undefined}
    >
      {/*
        별자리 그림.

        아직 잇지 않은 별자리는 모양을 보여 주지 않는다 — 그 모양이 곧 퍼즐의 답이라,
        도감에서 미리 보면 별을 이어 보며 찾아내는 재미가 사라진다.
        대신 물음표를 놓아 "여기 아직 만나지 않은 별자리가 있다"는 것만 알린다.
      */}
      <svg
        className={`${styles.figure} ${editableSketch ? styles.drawingFigure : ''}`}
        viewBox="0 0 100 100"
        aria-hidden={editableSketch ? undefined : 'true'}
        role={editableSketch ? 'application' : undefined}
        aria-label={editableSketch ? '별자리 상상화 그리기 영역' : undefined}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={(event) => finishDrawing(event)}
        onPointerCancel={(event) => finishDrawing(event, false)}
      >
        {locked ? (
          <text
            x="50"
            y="50"
            className={styles.unknown}
            textAnchor="middle"
            dominantBaseline="central"
          >
            ?
          </text>
        ) : (
          <>
            <rect x="0" y="0" width="100" height="100" className={styles.drawSurface} />
            {sketch.strokes.map((stroke, index) => (
              <path key={index} d={sketchPath(stroke)} className={styles.sketchLine} />
            ))}
            {previewStroke.length > 1 && (
              <path d={sketchPath(previewStroke)} className={`${styles.sketchLine} ${styles.previewLine}`} />
            )}
            {constellation.lines.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={byId[a].x}
                y1={byId[a].y}
                x2={byId[b].x}
                y2={byId[b].y}
                className={styles.line}
              />
            ))}
            {stars.map((s) => (
              <circle
                key={s.id}
                cx={s.x}
                cy={s.y}
                r={radiusForMagnitude(s.mag, { min: 1.2, max: 2.6 })}
                className={s.isPolaris ? styles.polaris : styles.star}
              />
            ))}
          </>
        )}
      </svg>

      <div className={styles.text}>
        {locked ? (
          <>
            <p className={styles.epithet}>「 ? 」</p>
            <p className={styles.name}>아직 잇지 않은 별자리</p>
            <p className={styles.power}>별을 이어 카드를 채워 보세요.</p>
          </>
        ) : (
          <>
            <p className={styles.epithet}>
              「 {epithet ?? '칭호 준비 중'} 」
            </p>
            <p className={styles.name}>{constellation.name}</p>
            {!compact && (
              <p className={styles.aka}>
                {constellation.aka} · {constellation.latinName}
              </p>
            )}
            <p className={styles.power}>
              {power ?? '권능은 아직 적혀 있지 않아요.'}
            </p>
          </>
        )}
      </div>
    </Wrapper>
  );
}
