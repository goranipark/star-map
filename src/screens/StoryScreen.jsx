import styles from './StoryScreen.module.css';
import StorySlides from '../components/StorySlides.jsx';

/**
 * 별자리를 완성한 뒤 열리는 신화 이야기 화면.
 * 도감에서 "다시 보기"로 들어올 때도 같은 화면을 쓴다(replay).
 */
export default function StoryScreen({
  constellation,
  nextConstellation,
  replay = false,
  onNextStage,
  onFinish,
}) {
  return (
    <section className={styles.wrap}>
      {!replay && (
        <p className={styles.banner}>
          <span className={styles.check}>★</span>
          {constellation.name}를 완성했어요!
        </p>
      )}

      <StorySlides
        constellation={constellation}
        onFinish={onFinish}
        finishLabel={replay ? '도감으로 돌아가기' : '도감에 담기'}
      />

      {!replay && nextConstellation && (
        <button type="button" className={`btnGhost ${styles.next}`} onClick={onNextStage}>
          바로 다음 별자리 도전 · {nextConstellation.name}
        </button>
      )}
    </section>
  );
}
