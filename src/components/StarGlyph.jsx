import { useId } from 'react';
import styles from './StarGlyph.module.css';

/** SVG 안에서 사용하는 별. radius는 기존 별의 밝기에 따른 크기를 받는다. */
export default function StarGlyph({ x = 0, y = 0, radius = 1, gold = false, active = false, delay = 0 }) {
  const haloId = useId();
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true" pointerEvents="none">
      <g className={styles.size} transform={`scale(${radius})`}>
        <g
          className={`${styles.light} ${gold ? styles.gold : ''} ${active ? styles.active : ''}`}
          style={{ '--delay': `${-delay}s` }}
        >
          <defs>
            <radialGradient id={haloId}>
              <stop offset="0" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="0.3" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle r="2.7" fill={`url(#${haloId})`} />
          {gold && (
            <path className={styles.diagonal} d="M 0 -1.65 Q .14 -.14 1.65 0 Q .14 .14 0 1.65 Q -.14 .14 -1.65 0 Q -.14 -.14 0 -1.65 Z" transform="rotate(45)" />
          )}
          <path className={styles.rays} d={`M 0 ${gold ? -2.35 : -1.8} Q .22 -.22 1.65 0 Q .22 .22 0 ${gold ? 2.35 : 1.8} Q -.22 .22 -1.65 0 Q -.22 -.22 0 ${gold ? -2.35 : -1.8} Z`} />
          <circle r="0.48" fill="currentColor" />
          <circle r="0.24" fill="#fffdf5" />
        </g>
      </g>
    </g>
  );
}
