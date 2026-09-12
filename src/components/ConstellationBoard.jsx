import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './ConstellationBoard.module.css';
import StarGlyph from './StarGlyph.jsx';
import { fitBoardCamera } from '../game/boardCamera.js';

import { allSkyStars } from '../game/sky.js';
import { answerLineSet, lineKey } from '../game/constellations.js';
import { completionArtFor, completionArtTransform } from '../game/completionReveal.js';
import { cutOutNavyBackground } from '../game/artCutout.js';
import {
  SKY,
  boundingCircleOf,
  focusRotation,
  projectStar,
  radiusForMagnitude,
} from '../game/projection.js';

/** 별자리 완성 후 이야기 화면으로 넘어가기까지 축하 연출을 보여주는 시간. */
const CELEBRATE_MS = 3400;
/** 오답 선이 붉게 떴다가 사라지는 시간 (design.md 6장). */
const WRONG_MS = 400;
/** 스테이지 시작 시 밤하늘 전체를 보여주는 시간. 그 뒤 별자리로 확대한다. */
const OVERVIEW_MS = 1100;

/** 값을 최소~최대 사이로 자른다. */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * 별 잇기 퍼즐판.
 *
 * 두 가지 모드를 지원한다 (ToDo.md Phase 3).
 *  - mode="puzzle" : 정답 연결선과 대조해 판정. 스테이지 1~5에서 사용.
 *  - mode="free"   : 정답 없이 이은 선을 그대로 유지. Phase 4-B 나만의 성좌에서 사용.
 *
 * 조작은 두 가지를 모두 받는다.
 *  - 별을 탭 → 다른 별을 탭
 *  - 별에서 다른 별로 드래그
 */
export default function ConstellationBoard({
  constellation,
  completedConstellations = [],
  mode = 'puzzle',
  showAnswer = false,
  onComplete,
  onSolved,
  initialLines = [],
  onProgress,
  onFeedback,
  /** 자유 연결 모드에서 이은 선이 바뀔 때마다 알려 준다 — [[별id, 별id], ...] */
  onLinesChange,
  /** 값이 바뀌면 그은 선을 전부 지운다 ("전체 지우기" 버튼용) */
  clearToken = 0,
  fitViewport = false,
}) {
  const free = mode === 'free';
  const completionMaskId = useId().replaceAll(':', '');
  const completionFeatherId = `${completionMaskId}-feather`;
  const groupRef = useRef(null);
  const svgRef = useRef(null);
  const overviewTimer = useRef(null);
  const [viewport, setViewport] = useState({ width: 500, height: 500 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const viewHeight = fitViewport ? (100 * viewport.height) / viewport.width : 100;

  useEffect(() => {
    if (!fitViewport || !svgRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setViewport({ width, height });
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [fitViewport]);

  /**
   * 아이들이 별을 아주 빠르게 연달아 누르면 React가 상태 갱신을 한 번에 모으는 탓에
   * 직전 탭의 결과를 못 보고 연결을 놓칠 수 있다.
   * 그래서 판정에 쓰는 값은 ref로도 들고 있으면서 항상 최신 값을 보게 한다.
   */
  const drawnRef = useRef(new Map(initialLines.map((line) => [lineKey(...line), line])));
  const selectedRef = useRef(null);

  const [drawn, setDrawn] = useState(() => new Map(drawnRef.current)); // key -> [aId, bId]
  const solvedRef = useRef(false);
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;
  const [wrong, setWrong] = useState([]); // [{ id, a, b }]
  const [selectedId, setSelectedId] = useState(null);
  const dragRef = useRef(null); // { fromId, moved }
  const [dragPos, setDragPos] = useState(null); // 고무줄 선을 그리기 위한 좌표
  const [celebrating, setCelebrating] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  useEffect(() => {
    const cancel = () => {
      const pointerId = dragRef.current?.pointerId;
      dragRef.current = null;
      selectedRef.current = null;
      setSelectedId(null);
      setDragPos(null);
      if (pointerId !== undefined) {
        try { svgRef.current?.releasePointerCapture(pointerId); } catch { /* already released */ }
      }
    };
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  const onFeedbackRef = useRef(onFeedback);
  onFeedbackRef.current = onFeedback;

  const answers = useMemo(
    () => (mode === 'puzzle' ? answerLineSet(constellation) : new Set()),
    [constellation, mode]
  );

  /* ---------------------------------------------------------------
     세로 화면은 아래쪽, 가로 화면은 오른쪽으로 별자리를 배치한다.
  --------------------------------------------------------------- */
  const rotation = useMemo(
    () => (free ? 0 : focusRotation(constellation, fitViewport && viewHeight < 80 ? 270 : 180)),
    [constellation, free, fitViewport, viewHeight]
  );

  /** 모든 별을 현재 회전값으로 화면 좌표에 찍는다. */
  const stars = useMemo(() => {
    const memberIds = new Set(free ? [] : constellation.stars.map((s) => s.id));
    return allSkyStars.map((s) => ({
      ...s,
      ...projectStar(s.ra, s.dec, rotation),
      isMember: memberIds.has(s.id),
    }));
  }, [rotation, constellation, free]);

  const starById = useMemo(
    () => Object.fromEntries(stars.map((s) => [s.id, s])),
    [stars]
  );

  const completionArt = useMemo(() => completionArtFor(constellation), [constellation]);
  const completionTransform = useMemo(
    () => completionArtTransform(constellation, starById),
    [constellation, starById]
  );
  const completionArtSource = completionArt
    ? `${import.meta.env.BASE_URL}${completionArt.replace(/^\/+/, '')}`
    : null;
  const completionArtUrl = useTransparentCompletionArt(completionArtSource);

  /* ---------------------------------------------------------------
     확대 위치 — 별자리 전체 + 북극성이 함께 들어오도록 잡는다.
     북극성을 항상 화면에 남겨 두는 것이 concept.md의 핵심이라 반드시 포함한다.
  --------------------------------------------------------------- */
  const focus = useMemo(() => {
    // 자유 연결 모드는 밤하늘 전체가 무대이므로 확대하지 않는다.
    if (free) return { scale: 1, x: SKY.cx, y: SKY.cy, labelX: SKY.cx, labelY: SKY.cy };

    const members = constellation.stars.map((s) => starById[s.id]).filter(Boolean);
    const shape = boundingCircleOf(members);
    // 북극성(성도판 중심)을 반드시 화면에 남긴다 — concept.md의 핵심이다.
    const circle = boundingCircleOf([...members, { x: SKY.cx, y: SKY.cy }]);
    const fitted = fitViewport
      ? fitBoardCamera([...members, { x: SKY.cx, y: SKY.cy }], 100, viewHeight)
      : { scale: clamp(SKY.radius / (circle.radius + 7), 1, 2.4), x: circle.x, y: circle.y };
    return {
      ...fitted,
      // 완성 이름표는 별자리 그림과 겹치지 않게 그림 아래에 놓는다.
      labelX: shape.x,
      labelY: shape.y + shape.radius + 5,
    };
  }, [constellation, starById, free, fitViewport, viewHeight]);

  const overviewScale = Math.min(100, viewHeight) / 100;
  const maxScale = Math.max(overviewScale, focus.scale);
  const scale = zoomed ? overviewScale + (maxScale - overviewScale) * zoomLevel : overviewScale;
  const centerX = zoomed ? focus.x : SKY.cx;
  const centerY = zoomed ? focus.y : SKY.cy;
  const transform = `translate(${50 - scale * centerX} ${viewHeight / 2 - scale * centerY}) scale(${scale})`;

  /** 별을 누른 것으로 인정할 반경. 확대해도 손가락 크기는 그대로이므로 배율로 나눈다. */
  const hitRadius = fitViewport ? 22 * 100 / viewport.width / scale : clamp(3.6 / scale, 1.7, 4.4);

  /**
   * 확대하면 도형이 통째로 커지므로, 별 크기와 선 굵기는 배율로 나눠 두어
   * 화면에 보이는 크기를 일정하게 유지한다.
   * 그래야 "별이 클수록 밝은 별"이라는 규칙이 스테이지마다 흔들리지 않는다.
   */
  // 가로 화면의 넓은 SVG 폭 때문에 별빛까지 커져 서로 뭉치지 않도록 한다.
  const visualUnit = fitViewport ? Math.min(viewport.width, viewport.height, 500) / viewport.width : 1;
  const starScale = (r) => r * visualUnit / scale;
  const lineWidth = (w) => w * visualUnit / scale;
  /** 발광 반경도 같은 이유로 배율 보정한다. 안 하면 확대할수록 별이 뭉개진다. */
  const glow = (radius, color) => `drop-shadow(0 0 ${(radius * visualUnit / scale).toFixed(3)}px ${color})`;

  /* ---------------------------------------------------------------
     스테이지가 바뀌면 판을 새로 깐다.
  --------------------------------------------------------------- */
  useEffect(() => {
    drawnRef.current = new Map((free ? initialLines : []).map((line) => [lineKey(...line), line]));
    solvedRef.current = false;
    selectedRef.current = null;
    dragRef.current = null;
    setDrawn(new Map(drawnRef.current));
    setWrong([]);
    setSelectedId(null);
    setDragPos(null);
    setCelebrating(false);
    setFeedbackMessage('');
    setZoomed(false);
    setZoomLevel(1);

    if (free) return undefined; // 자유 모드는 확대하지 않는다
    overviewTimer.current = setTimeout(() => setZoomed(true), OVERVIEW_MS);
    return () => clearTimeout(overviewTimer.current);
  }, [constellation.id, clearToken, free]);

  /* ---------------------------------------------------------------
     완성 판정
  --------------------------------------------------------------- */
  // 정답 선을 다 그었는지 확인한다.
  useEffect(() => {
    if (mode !== 'puzzle' || celebrating) return;
    if (answers.size === 0 || drawn.size < answers.size) return;

    setCelebrating(true);
    selectedRef.current = null;
    setSelectedId(null);
    setFeedbackMessage(`${constellation.name} 완성!`);
    onFeedbackRef.current?.('complete');
  }, [drawn, answers, mode, celebrating]);

  // 축하 연출을 보여준 뒤 이야기 화면으로 넘긴다.
  // 위 효과와 반드시 나눠 두어야 한다 — 한 곳에 두면 celebrating이 바뀌는 순간
  // 효과가 다시 실행되면서 방금 건 타이머를 스스로 취소해 버린다.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => onCompleteRef.current?.(), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [celebrating]);

  useEffect(() => {
    onProgress?.({ drawn: drawn.size, total: answers.size });
  }, [drawn, answers, onProgress]);

  // 자유 연결 모드에서 이은 선 목록을 부모에게 넘겨 준다
  const onLinesChangeRef = useRef(onLinesChange);
  onLinesChangeRef.current = onLinesChange;

  useEffect(() => {
    if (!free) return;
    onLinesChangeRef.current?.([...drawn.values()]);
  }, [drawn, free]);

  /* ---------------------------------------------------------------
     연결 시도
  --------------------------------------------------------------- */
  const tryConnect = useCallback(
    (aId, bId) => {
      if (celebrating || aId === bId) return;
      const key = lineKey(aId, bId);

      if (drawnRef.current.has(key)) {
        // 퍼즐 모드에서는 이미 그은 선을 무시하고,
        // 자유 모드에서는 한 번 더 이으면 그 선을 지운다 (선 지우기).
        if (!free) return;
        const next = new Map(drawnRef.current);
        next.delete(key);
        drawnRef.current = next;
        setDrawn(next);
        return;
      }

      if (free || answers.has(key)) {
        const next = new Map(drawnRef.current).set(key, [aId, bId]);
        drawnRef.current = next;
        setDrawn(next);
        setFeedbackMessage(free ? '선을 이었어요.' : '맞는 연결이에요.');
        // Commit completion in the input event; the celebration timer only navigates.
        if (!free && !solvedRef.current && answers.size > 0 && next.size === answers.size) {
          solvedRef.current = true;
          onSolvedRef.current?.();
        }
        onFeedbackRef.current?.('correct');
        return;
      }

      // 오답 — 붉은 점선과 부드러운 효과음으로 알려 준 뒤 사라진다. 감점은 없다.
      const id = `${key}-${Date.now()}`;
      setFeedbackMessage('다른 별을 이어 보세요.');
      onFeedbackRef.current?.('wrong');
      setWrong((prev) => [...prev, { id, a: aId, b: bId }]);
      setTimeout(() => {
        setWrong((prev) => prev.filter((w) => w.id !== id));
      }, WRONG_MS);
    },
    [answers, free, celebrating]
  );

  /* ---------------------------------------------------------------
     포인터(마우스·손가락) 처리
  --------------------------------------------------------------- */
  const toSkyPoint = useCallback((event) => {
    const g = groupRef.current;
    const ctm = g?.getScreenCTM();
    if (!ctm) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      ctm.inverse()
    );
    return { x: point.x, y: point.y };
  }, []);

  const starAt = useCallback(
    (point) => {
      if (!point) return null;
      let best = null;
      let bestDistance = Infinity;
      for (const s of stars) {
        const d = Math.hypot(s.x - point.x, s.y - point.y);
        if (d < bestDistance) {
          bestDistance = d;
          best = s;
        }
      }
      return bestDistance <= hitRadius ? best : null;
    },
    [stars, hitRadius]
  );

  const select = (id) => {
    selectedRef.current = id;
    setSelectedId(id);
  };

  const cancelPointer = (event) => {
    const drag = dragRef.current;
    if (event && drag?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragPos(null);
    select(null);
    if (drag) {
      try { svgRef.current?.releasePointerCapture(drag.pointerId); } catch { /* already released */ }
    }
  };

  const handlePointerDown = (event) => {
    if (celebrating || dragRef.current || event.isPrimary === false || event.button !== 0) return;
    const point = toSkyPoint(event);
    const star = starAt(point);
    if (!star) {
      select(null);
      return;
    }
    // 포인터를 놓칠 때를 대비해 캡처해 둔다. 기기에 따라 실패할 수 있으므로 감싼다.
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* 캡처하지 못해도 연결 동작에는 지장이 없다 */
    }
    dragRef.current = { pointerId: event.pointerId, fromId: star.id, moved: false };
    setDragPos(null);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = toSkyPoint(event);
    if (!point) return;
    const from = starById[drag.fromId];
    if (!drag.moved && Math.hypot(point.x - from.x, point.y - from.y) > 1.5) {
      drag.moved = true;
    }
    if (drag.moved) setDragPos(point);
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      cancelPointer(event);
      return;
    }
    const point = toSkyPoint(event);
    const target = starAt(point);

    if (target && target.id !== drag.fromId) {
      // 드래그해서 다른 별에 놓았다
      tryConnect(drag.fromId, target.id);
      select(null);
    } else if (target && !drag.moved) {
      // 제자리에서 탭했다 — 탭 두 번으로 잇는 방식
      const selected = selectedRef.current;
      if (selected && selected !== drag.fromId) {
        tryConnect(selected, drag.fromId);
        select(null);
      } else {
        select(selected === drag.fromId ? null : drag.fromId);
      }
    } else {
      select(null);
    }
    dragRef.current = null;
    setDragPos(null);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };

  /* ---------------------------------------------------------------
     렌더링
  --------------------------------------------------------------- */
  const dragFrom = dragPos ? starById[dragRef.current?.fromId] : null;

  const changeView = (level, overview = false) => {
    clearTimeout(overviewTimer.current);
    cancelPointer();
    setZoomLevel(clamp(level, 0, 1));
    setZoomed(!overview);
  };

  return (
    <>
    <svg
      ref={svgRef}
      className={`${styles.board} ${fitViewport ? styles.fluidBoard : ''}`}
      viewBox={`0 0 100 ${viewHeight}`}
      role="application"
      aria-label={`${constellation.name} 별 잇기 퍼즐`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelPointer}
      onLostPointerCapture={cancelPointer}
      onPointerLeave={(event) => {
        if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) cancelPointer(event);
      }}
    >
      <defs>
        <filter
          id={completionFeatherId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <mask
          id={completionMaskId}
          x="-10"
          y="-10"
          width="120"
          height="120"
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
        >
          <rect x="-10" y="-10" width="120" height="120" fill="black" />
          <ellipse
            cx="50"
            cy="50"
            rx="68"
            ry="64"
            fill="white"
            filter={`url(#${completionFeatherId})`}
          />
        </mask>
      </defs>
      <g
        ref={groupRef}
        className={styles.sky}
        transform={transform}
        data-celebrating={celebrating || undefined}
      >
        {/* 성도판 테두리와 적위 눈금 */}
        <circle
          cx={SKY.cx}
          cy={SKY.cy}
          r={SKY.radius}
          className={styles.skyEdge}
          style={{ strokeWidth: lineWidth(0.25) }}
        />
        {[75, 60].map((dec) => (
          <circle
            key={dec}
            cx={SKY.cx}
            cy={SKY.cy}
            r={(SKY.radius * (90 - dec)) / (90 - SKY.decMin)}
            className={styles.skyGuide}
            style={{ strokeWidth: lineWidth(0.12) }}
          />
        ))}

        {/* 이미 완성한 별자리 — 은은한 골드로 남겨 하늘이 채워지는 것을 보여준다 */}
        {completedConstellations.map((c) => (
          <g key={c.id} className={styles.doneGroup}>
            {c.lines.map(([a, b]) =>
              starById[a] && starById[b] ? (
                <line
                  key={`${a}-${b}`}
                  x1={starById[a].x}
                  y1={starById[a].y}
                  x2={starById[b].x}
                  y2={starById[b].y}
                  className={styles.doneLine}
                  style={{ strokeWidth: lineWidth(0.3) }}
                />
              ) : null
            )}
          </g>
        ))}

        {/* 도움말 — 정답 모양 미리 보기 */}
        {showAnswer && !celebrating && (
          <g className={styles.answerHint}>
            {constellation.lines.map(([a, b]) => (
              <line
                key={`hint-${a}-${b}`}
                x1={starById[a].x}
                y1={starById[a].y}
                x2={starById[b].x}
                y2={starById[b].y}
                className={styles.hintLine}
                style={{ strokeWidth: lineWidth(0.3), strokeDasharray: `${lineWidth(1)} ${lineWidth(1.4)}` }}
              />
            ))}
          </g>
        )}

        {/* 배경 별 */}
        {stars
          .filter((s) => s.isBackground)
          .map((s) => (
            <circle
              key={s.id}
              cx={s.x}
              cy={s.y}
              r={starScale(radiusForMagnitude(s.mag))}
              className={styles.bgStar}
              style={{ animationDelay: `${s.twinkleDelay}s` }}
            />
          ))}

        {/* 완성 순간, 정확한 별 좌표에 맞춰 신화 속 형상이 별빛처럼 떠오른다. */}
        {celebrating && completionArtUrl && completionTransform && (
          <g
            className={styles.completionMyth}
            transform={completionTransform.svg}
            mask={`url(#${completionMaskId})`}
            aria-hidden="true"
            pointerEvents="none"
          >
            <image
              className={styles.completionMythAura}
              href={completionArtUrl}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid meet"
            />
            <image
              className={styles.completionMythArt}
              href={completionArtUrl}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        )}

        {/* 지금까지 이은 정답 선 */}
        <g className={styles.drawnGroup}>
          {[...drawn.values()].map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={starById[a].x}
              y1={starById[a].y}
              x2={starById[b].x}
              y2={starById[b].y}
              className={styles.drawnLine}
              style={{
                strokeWidth: lineWidth(celebrating ? 0.62 : 0.45),
                filter: celebrating
                  ? glow(2, 'rgba(232,193,88,0.85)')
                  : glow(0.8, 'rgba(127,216,232,0.6)'),
              }}
            />
          ))}
        </g>

        {/* 완성한 선마다 빛의 꼬리와 밝은 중심이 한 번 흐른다. */}
        {celebrating && (
          <g aria-hidden="true" pointerEvents="none">
            {[...drawn.values()].map(([a, b], index) => (
              <g key={`spark-${a}-${b}`}>
                {['trail', 'head'].map((part) => (
                  <line
                    key={part}
                    x1={starById[a].x}
                    y1={starById[a].y}
                    x2={starById[b].x}
                    y2={starById[b].y}
                    pathLength="1"
                    className={`${styles.completionSpark} ${part === 'head' ? styles.sparkHead : styles.sparkTrail}`}
                    style={{
                      strokeWidth: lineWidth(part === 'head' ? 0.72 : 1.1),
                      filter: glow(part === 'head' ? 0.65 : 1.3, 'rgba(255,215,128,0.9)'),
                      // 마지막 빛도 1.8초 축하 시간 안에 도착하도록 제한한다.
                      animationDelay: `${(index / Math.max(1, drawn.size - 1)) * 250}ms`,
                      animationDuration: `${CELEBRATE_MS - 450}ms`,
                    }}
                  />
                ))}
              </g>
            ))}
          </g>
        )}

        {/* 오답 선 */}
        {wrong.map((w) => (
          <line
            key={w.id}
            x1={starById[w.a].x}
            y1={starById[w.a].y}
            x2={starById[w.b].x}
            y2={starById[w.b].y}
            className={styles.wrongLine}
            style={{ strokeWidth: lineWidth(0.45) }}
          />
        ))}

        {/* 드래그 중인 고무줄 선 */}
        {dragFrom && (
          <line
            x1={dragFrom.x}
            y1={dragFrom.y}
            x2={dragPos.x}
            y2={dragPos.y}
            className={styles.dragLine}
            style={{
              strokeWidth: lineWidth(0.35),
              strokeDasharray: `${lineWidth(1.2)} ${lineWidth(1.2)}`,
            }}
          />
        )}

        {/* 별자리에 속한 별 */}
        {stars
          .filter((s) => !s.isBackground)
          .map((s) => {
            const base = radiusForMagnitude(s.mag);
            // concept.md 3장: 정답 별은 다른 별보다 "살짝" 크게 (난이도 배려)
            const r = starScale(s.isMember ? base + 0.3 : base);
            return (
              <g key={s.id}>
                {selectedId === s.id && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r + starScale(1.8)}
                    className={styles.selectRing}
                    style={{ strokeWidth: lineWidth(0.4) }}
                  />
                )}
                <StarGlyph
                  x={s.x}
                  y={s.y}
                  radius={r}
                  gold={s.isPolaris || (celebrating && s.isMember)}
                  active={selectedId === s.id || (celebrating && s.isMember)}
                  delay={s.ra % 4.8}
                />
              </g>
            );
          })}

        {/* 완성 순간 — 별자리 이름을 띄운다 */}
        {celebrating && (
          <text
            x={fitViewport ? centerX : focus.labelX}
            y={fitViewport ? centerY + (viewHeight / 2 - 3) / scale : focus.labelY}
            className={styles.doneName}
            style={{ fontSize: starScale(5), strokeWidth: lineWidth(1.2) }}
          >
            {constellation.name}
          </text>
        )}
      </g>
    </svg>
    {fitViewport && (
      <div className={styles.viewControls} role="group" aria-label="별판 보기 조절">
        <button type="button" aria-label="별판 축소" disabled={celebrating || !zoomed || zoomLevel <= 0} onClick={() => changeView(zoomLevel - 0.2)}>−</button>
        <button type="button" aria-label="별판 확대" disabled={celebrating || (zoomed && zoomLevel >= 1)} onClick={() => changeView(zoomed ? zoomLevel + 0.2 : 0.2)}>+</button>
        <button type="button" aria-pressed={!zoomed} disabled={celebrating} onClick={() => changeView(0, true)}>전체 하늘</button>
        <button type="button" aria-pressed={zoomed && zoomLevel === 1} disabled={celebrating} onClick={() => changeView(1)}>별자리 맞춤</button>
      </div>
    )}
    <p className="srOnly" aria-live="polite" aria-atomic="true">
      {feedbackMessage}
    </p>
    </>
  );
}

const transparentArtCache = new Map();

/**
 * SVG 필터에 맡기지 않고 Canvas에서 실제 투명 PNG를 만든다.
 * 이렇게 해야 브라우저·GPU별 색상 보간 차이가 있어도 사각 바탕이 다시 나타나지 않는다.
 */
function useTransparentCompletionArt(source) {
  const [transparentSource, setTransparentSource] = useState(null);

  useEffect(() => {
    let active = true;
    setTransparentSource(null);
    if (!source) return () => { active = false; };

    let prepared = transparentArtCache.get(source);
    if (!prepared) {
      prepared = prepareTransparentArt(source);
      transparentArtCache.set(source, prepared);
    }
    prepared.then((url) => {
      if (active) setTransparentSource(url);
    });
    return () => { active = false; };
  }, [source]);

  return transparentSource;
}

function prepareTransparentArt(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      cutOutNavyBackground(frame.data);
      context.putImageData(frame, 0, 0);
      canvas.toBlob(
        (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
        'image/png'
      );
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
