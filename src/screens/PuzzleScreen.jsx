import { useCallback, useEffect, useState } from 'react';
import styles from './PuzzleScreen.module.css';

import ConstellationBoard from '../components/ConstellationBoard.jsx';

/** 도움말을 누르면 정답 모양을 잠깐만 보여준다. 계속 켜 두면 퍼즐이 되지 않으므로. */
const HINT_MS = 3000;

export default function PuzzleScreen({
  constellation,
  completedConstellations = [],
  onClear,
}) {
  const [progress, setProgress] = useState({ drawn: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);

  // 스테이지가 바뀌면 도움말을 끈다.
  useEffect(() => setShowHint(false), [constellation.id]);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), HINT_MS);
    return () => clearTimeout(t);
  }, [showHint]);

  const handleProgress = useCallback((next) => setProgress(next), []);

  return (
    <section className={styles.wrap}>
      <div className={styles.boardArea}>
        <ConstellationBoard
          fitViewport
          constellation={constellation}
          completedConstellations={completedConstellations}
          showAnswer={showHint}
          onComplete={onClear}
          onProgress={handleProgress}
        />
      </div>

      <aside className={styles.panel}>
        <div className={styles.headline}>
          <p className="eyebrow">STAGE {String(constellation.order).padStart(2, '0')}</p>
          <h2 className={styles.name}>{constellation.name}</h2>
          <p className={styles.aka}>{constellation.aka}</p>
        </div>

        <p className={styles.guide}>
          별을 톡 누르고 다른 별을 누르면 이어져요. 끌어서 이어도 됩니다.
        </p>

        <div className={styles.counter}>
          <span className={`mono ${styles.count}`}>
            {progress.drawn} / {progress.total}
          </span>
          <span className={styles.countLabel}>선 잇기</span>
        </div>

        <div className={styles.bar}>
          <span
            className={styles.barFill}
            style={{
              width: progress.total
                ? `${(progress.drawn / progress.total) * 100}%`
                : '0%',
            }}
          />
        </div>

        {showHint ? (
          <p className={styles.hint}>{constellation.hint}</p>
        ) : (
          <button className="btnGhost" onClick={() => setShowHint(true)}>
            도움말 보기
          </button>
        )}
      </aside>
    </section>
  );
}
