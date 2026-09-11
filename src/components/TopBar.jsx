import styles from './TopBar.module.css';
import { TOTAL_STAGES } from '../game/constellations.js';

/**
 * 상단 진행 표시 바 — design.md 5장(pill 네비게이션) / 6장.
 * "초등 대상은 진행 상황을 계속 보여주는 것이 안심 요소"이므로 항상 고정 노출한다.
 */
export default function TopBar({ title, completedCount = 0, onBack, onOpenAlmanac }) {
  return (
    <header className={styles.bar}>
      {onBack ? (
        <button className={styles.iconBtn} onClick={onBack} aria-label="뒤로 가기">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M15 5 8 12l7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className={styles.iconBtnSpacer} />
      )}

      <span className={styles.title}>{title}</span>

      <span className={`mono ${styles.progress}`}>
        {completedCount}/{TOTAL_STAGES} 별자리 완성
      </span>

      {onOpenAlmanac ? (
        <button className={styles.iconBtn} onClick={onOpenAlmanac} aria-label="도감 열기">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <span className={styles.iconBtnSpacer} />
      )}
    </header>
  );
}
