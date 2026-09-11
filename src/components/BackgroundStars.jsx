import { useMemo } from 'react';
import styles from './BackgroundStars.module.css';

/**
 * 배경 장식 별 — design.md 6장 "3초 주기 twinkle, 별마다 딜레이 랜덤".
 *
 * 정답이 되는 별(퍼즐 대상)이 아니라 순수 배경 장식이다.
 * Phase 3의 StarField(퍼즐용 별 배치)와는 역할이 다르므로 따로 둔다.
 */
export default function BackgroundStars({ count = 90 }) {
  // 마운트할 때 한 번만 좌표를 뽑는다. 화면을 옮겨 다닐 때 별이 튀지 않도록.
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.2,
        delay: Math.random() * 3,
        opacity: 0.35 + Math.random() * 0.4,
      })),
    [count]
  );

  return (
    <div className={styles.layer} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className={`${styles.star} ${s.id % 11 === 0 ? styles.sparkle : ''}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${-s.delay}s`,
            animationDuration: `${3.5 + s.delay}s`,
            '--peak': s.opacity,
          }}
        />
      ))}
    </div>
  );
}
