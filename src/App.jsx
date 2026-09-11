import { useCallback, useMemo, useState } from 'react';
import styles from './App.module.css';

import { SCREEN } from './game/screens.js';
import {
  constellations,
  getConstellation,
  nextConstellation,
} from './game/constellations.js';
import { useProgress } from './game/useProgress.js';

import BackgroundStars from './components/BackgroundStars.jsx';
import TopBar from './components/TopBar.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import PuzzleScreen from './screens/PuzzleScreen.jsx';
import StoryScreen from './screens/StoryScreen.jsx';
import AlmanacScreen from './screens/AlmanacScreen.jsx';
import StarWeaverScreen from './screens/StarWeaverScreen.jsx';

/** 화면별 상단 바 제목. TITLE 화면은 상단 바를 쓰지 않는다. */
const SCREEN_TITLE = {
  [SCREEN.PUZZLE]: '별 잇기',
  [SCREEN.STORY]: '별자리 이야기',
  [SCREEN.ALMANAC]: '나의 밤하늘 도감',
  [SCREEN.STAR_WEAVER]: '나만의 성좌 만들기',
};

export default function App() {
  const {
    progress,
    completedIds,
    myConstellations,
    starWeavingUnlocked,
    complete,
    setLastPlayed,
    reset,
    saveMyConstellation,
    removeMyConstellation,
  } = useProgress();

  const [screen, setScreen] = useState(SCREEN.TITLE);
  const [currentId, setCurrentId] = useState(
    () => progress.lastPlayed ?? constellations[0].id
  );
  /** 도감에서 "다시 보기"로 들어온 경우 — 완성 축하 문구를 띄우지 않는다. */
  const [replaying, setReplaying] = useState(false);

  const current = getConstellation(currentId) ?? constellations[0];

  const completedConstellations = useMemo(
    () => completedIds.map(getConstellation).filter(Boolean),
    [completedIds]
  );

  const upcoming = useMemo(() => nextConstellation(completedIds), [completedIds]);

  const go = useCallback((next) => setScreen(next), []);

  /** 시작 화면에서 "별 이어 보기" — 아직 완성하지 않은 별자리로 들어간다. */
  const startPlaying = useCallback(() => {
    const target = nextConstellation(completedIds) ?? constellations[0];
    setCurrentId(target.id);
    setLastPlayed(target.id);
    setReplaying(false);
    setScreen(SCREEN.PUZZLE);
  }, [completedIds, setLastPlayed]);

  /** 퍼즐 완성 → 진행 상황 저장 → 이야기 화면 */
  const handleStageClear = useCallback(() => {
    complete(currentId);
    setReplaying(false);
    setScreen(SCREEN.STORY);
  }, [complete, currentId]);

  /** 이야기를 다 본 뒤 다음 별자리로 이어서 도전 */
  const handleNextStage = useCallback(() => {
    if (!upcoming) return;
    setCurrentId(upcoming.id);
    setLastPlayed(upcoming.id);
    setReplaying(false);
    setScreen(SCREEN.PUZZLE);
  }, [upcoming, setLastPlayed]);

  /** 도감에서 완성한 별자리 카드를 눌러 이야기를 다시 본다 */
  const handleReplayStory = useCallback((constellationId) => {
    setCurrentId(constellationId);
    setReplaying(true);
    setScreen(SCREEN.STORY);
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setCurrentId(constellations[0].id);
    setReplaying(false);
  }, [reset]);

  return (
    <div className={styles.app}>
      {/* 퍼즐 화면은 자기 안에 진짜 밤하늘을 그리므로 장식 별을 겹쳐 그리지 않는다 */}
      {screen !== SCREEN.PUZZLE && screen !== SCREEN.STAR_WEAVER && <BackgroundStars />}

      {screen !== SCREEN.TITLE && (
        <TopBar
          title={SCREEN_TITLE[screen]}
          completedCount={completedIds.length}
          onBack={() =>
            go(
              (replaying && screen === SCREEN.STORY) || screen === SCREEN.STAR_WEAVER
                ? SCREEN.ALMANAC
                : SCREEN.TITLE
            )
          }
          onOpenAlmanac={
            screen === SCREEN.ALMANAC ? undefined : () => go(SCREEN.ALMANAC)
          }
        />
      )}

      {/* key를 화면마다 다르게 주어 전환할 때 페이드인이 다시 실행되게 한다 */}
      <main className={styles.stage} key={`${screen}-${currentId}`}>
        {screen === SCREEN.TITLE && (
          <TitleScreen
            onStart={startPlaying}
            onOpenAlmanac={() => go(SCREEN.ALMANAC)}
            completedCount={completedIds.length}
          />
        )}

        {screen === SCREEN.PUZZLE && (
          <PuzzleScreen
            constellation={current}
            completedConstellations={completedConstellations}
            onClear={handleStageClear}
          />
        )}

        {screen === SCREEN.STORY && (
          <StoryScreen
            constellation={current}
            nextConstellation={upcoming}
            replay={replaying}
            onNextStage={handleNextStage}
            onFinish={() => go(SCREEN.ALMANAC)}
          />
        )}

        {screen === SCREEN.ALMANAC && (
          <AlmanacScreen
            completedIds={completedIds}
            myConstellations={myConstellations}
            starWeavingUnlocked={starWeavingUnlocked}
            onReplayStory={handleReplayStory}
            onStartWeaving={() => go(SCREEN.STAR_WEAVER)}
            onRemoveMyConstellation={removeMyConstellation}
            onBackToTitle={() => go(SCREEN.TITLE)}
            onReset={handleReset}
          />
        )}

        {screen === SCREEN.STAR_WEAVER && (
          <StarWeaverScreen
            onSave={saveMyConstellation}
            onExit={() => go(SCREEN.ALMANAC)}
          />
        )}
      </main>
    </div>
  );
}
