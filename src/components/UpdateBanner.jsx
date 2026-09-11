import styles from './UpdateBanner.module.css';

export default function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <span>새 버전이 준비됐어요.</span>
      <button type="button" className="btnPrimary" onClick={onUpdate}>
        지금 업데이트
      </button>
      <button type="button" className="btnGhost" onClick={onDismiss}>
        나중에
      </button>
    </aside>
  );
}

