import { useMemo, useState } from 'react';
import styles from './AlmanacScreen.module.css';

import { constellations, TOTAL_STAGES } from '../game/constellations.js';
import { backgroundStars } from '../game/sky.js';
import { SKY, projectStar, radiusForMagnitude } from '../game/projection.js';
import ConstellationCard from '../components/ConstellationCard.jsx';

/**
 * 나의 밤하늘 도감.
 *
 * design.md 4·5장: 왼쪽은 원형 성좌판(planisphere), 오른쪽은 헤어라인 카드 목록.
 * 완성한 별자리는 골드로 하늘에 그려지고, 아직 잇지 않은 별자리는
 * 별만 흐릿하게 남아 "여기 어딘가에 있다"는 것만 알려준다.
 */
export default function AlmanacScreen({
  completedIds = [],
  myConstellations = [],
  starWeavingUnlocked = false,
  onReplayStory,
  onStartWeaving,
  onRemoveMyConstellation,
  onBackToTitle,
  onReset,
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const done = useMemo(() => new Set(completedIds), [completedIds]);

  /** 별자리별로 미리 화면 좌표를 찍어 둔다 (성좌판은 회전 없이 고정). */
  const projected = useMemo(
    () =>
      constellations.map((c) => ({
        constellation: c,
        stars: Object.fromEntries(
          c.stars.map((s) => [s.id, projectStar(s.ra, s.dec, 0)])
        ),
      })),
    []
  );

  const bg = useMemo(
    () => backgroundStars.map((s) => ({ ...s, ...projectStar(s.ra, s.dec, 0) })),
    []
  );

  return (
    <section className={styles.wrap}>
      {/* ---------------- 원형 성좌판 ---------------- */}
      <div className={styles.mapArea}>
        <svg
          className={styles.map}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`나의 밤하늘 — ${completedIds.length}/${TOTAL_STAGES} 별자리 완성`}
        >
          <circle cx={SKY.cx} cy={SKY.cy} r={SKY.radius} className={styles.edge} />
          {[75, 60].map((dec) => (
            <circle
              key={dec}
              cx={SKY.cx}
              cy={SKY.cy}
              r={(SKY.radius * (90 - dec)) / (90 - SKY.decMin)}
              className={styles.guide}
            />
          ))}

          {bg.map((s) => (
            <circle
              key={s.id}
              cx={s.x}
              cy={s.y}
              r={radiusForMagnitude(s.mag) * 0.7}
              className={styles.bgStar}
            />
          ))}

          {projected.map(({ constellation: c, stars }) => {
            const complete = done.has(c.id);
            return (
              <g key={c.id} className={complete ? styles.done : styles.todo}>
                {/* 아직 잇지 않은 별자리는 선을 그리지 않는다 — 정답을 미리 보여주지 않으려고 */}
                {complete &&
                  c.lines.map(([a, b]) => (
                    <line
                      key={`${a}-${b}`}
                      x1={stars[a].x}
                      y1={stars[a].y}
                      x2={stars[b].x}
                      y2={stars[b].y}
                      className={styles.line}
                    />
                  ))}
                {c.stars.map((s) => (
                  <circle
                    key={s.id}
                    cx={stars[s.id].x}
                    cy={stars[s.id].y}
                    r={radiusForMagnitude(s.mag)}
                    className={s.isPolaris ? styles.polaris : styles.star}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        <p className={`mono ${styles.caption}`}>
          {completedIds.length} / {TOTAL_STAGES} 별자리 완성
        </p>
      </div>

      {/* ---------------- 카드 목록 ---------------- */}
      <aside className={styles.list}>
        <header className={styles.listHead}>
          <p className="eyebrow">MY NIGHT SKY</p>
          <h2 className={styles.listTitle}>나의 밤하늘 도감</h2>
        </header>

        {constellations.map((c) => (
          <ConstellationCard
            key={c.id}
            constellation={c}
            locked={!done.has(c.id)}
            compact
            onClick={() => onReplayStory?.(c.id)}
          />
        ))}

        {/* ---------------- 나만의 성좌 ---------------- */}
        <section className={styles.mine}>
          <header className={styles.mineHead}>
            <p className="eyebrow">MY OWN</p>
            <h3 className={styles.mineTitle}>나만의 성좌</h3>
          </header>

          {!starWeavingUnlocked ? (
            <p className={styles.mineLocked}>
              별자리 5개를 모두 완성하면
              <br />
              나만의 성좌를 만들 수 있어요.
            </p>
          ) : (
            <>
              {myConstellations.map((c) => (
                <div key={c.id} className={styles.mineItem}>
                  <ConstellationCard constellation={c} compact />
                  <button
                    type="button"
                    className={styles.removeLink}
                    onClick={() => onRemoveMyConstellation?.(c.id)}
                    aria-label={`${c.name} 지우기`}
                  >
                    지우기
                  </button>
                </div>
              ))}

              <button type="button" className={`btnPrimary ${styles.weaveBtn}`} onClick={onStartWeaving}>
                {myConstellations.length ? '성좌 하나 더 만들기' : '나만의 성좌 만들기'}
              </button>
            </>
          )}
        </section>

        <div className={styles.footer}>
          <button type="button" className="btnGhost" onClick={onBackToTitle}>
            처음 화면으로
          </button>

          {confirmingReset ? (
            <span className={styles.confirm}>
              <span className={styles.confirmText}>정말 지울까요?</span>
              <button
                type="button"
                className={styles.danger}
                onClick={() => {
                  onReset?.();
                  setConfirmingReset(false);
                }}
              >
                네, 지웁니다
              </button>
              <button type="button" className="btnGhost" onClick={() => setConfirmingReset(false)}>
                취소
              </button>
            </span>
          ) : (
            <button type="button" className={styles.resetLink} onClick={() => setConfirmingReset(true)}>
              진행 기록 지우기
            </button>
          )}
        </div>
      </aside>
    </section>
  );
}
