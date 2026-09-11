import styles from './TitleScreen.module.css';
import StarGlyph from '../components/StarGlyph.jsx';

/**
 * 시작 화면.
 * concept.md 2장: 북극성이 화면 중앙에 고정되고 별자리가 그 주위를 돈다는
 * 게임의 핵심 컨셉을 첫 화면에서 바로 보여준다.
 */
export default function TitleScreen({ onStart, onOpenAlmanac, completedCount = 0 }) {
  const inProgress = completedCount > 0;
  return (
    <section className={styles.wrap}>
      {/* 북극성 + 회전하는 성도판 링 (design.md 6장: 은은한 회전) */}
      <div className={styles.planisphere} aria-hidden="true">
        <span className={styles.ringOuter} />
        <span className={styles.ringInner} />
        <svg className={styles.polaris} viewBox="-3 -3 6 6">
          <StarGlyph gold />
        </svg>
      </div>

      <p className="eyebrow">POLARIS' STAR MAP</p>
      <h1 className={styles.title}>폴라리스의 별자리</h1>
      <p className={styles.subtitle}>
        북극성을 찾고, 그 주위의 별들을 이어
        <br />
        밤하늘에 숨은 이야기를 열어 보세요.
      </p>

      {inProgress && (
        <p className={`mono ${styles.saved}`}>
          지난번까지 {completedCount}개 완성해 두었어요
        </p>
      )}

      <div className={styles.actions}>
        <button className="btnPrimary" onClick={onStart}>
          {inProgress ? '이어서 별 잇기' : '별 이어 보기'}
        </button>
        <button className="btnGhost" onClick={onOpenAlmanac}>
          나의 밤하늘 도감
        </button>
      </div>
    </section>
  );
}
