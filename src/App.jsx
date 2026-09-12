import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';

import { SCREEN } from './game/screens.js';
import {
  constellations,
  getConstellation,
  nextConstellation,
} from './game/constellations.js';
import { useProgress } from './game/useProgress.js';
import { clearDraftMemory, loadDraft, saveDraft } from './game/drafts.js';
import {
  disposeAudio,
  playFeedback,
  setAudioEnabled,
  unlockAudio,
} from './game/audio.js';

import BackgroundStars from './components/BackgroundStars.jsx';
import TopBar from './components/TopBar.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import PuzzleScreen from './screens/PuzzleScreen.jsx';
import StoryScreen from './screens/StoryScreen.jsx';
import AlmanacScreen from './screens/AlmanacScreen.jsx';
import StarWeaverScreen from './screens/StarWeaverScreen.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import {
  activateWaitingWorker,
  registerServiceWorker,
} from './game/serviceWorker.js';

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
    saveFailed,
    retrySave,
    conflict,
    saving,
    completedIds,
    myConstellations,
    starWeavingUnlocked,
    complete,
    setLastPlayed,
    setSettings,
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
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [reloadDeferred, setReloadDeferred] = useState(false);
  const [draft, setDraft] = useState(loadDraft);
  const [draftFailed, setDraftFailed] = useState(false);
  const wasStarWeavingUnlocked = useRef(starWeavingUnlocked);
  const stateRef = useRef({});
  stateRef.current = { screen, saving, saveFailed, draftFailed };
  const updateDraft = useCallback((next) => {
    setDraft(next);
    setDraftFailed(!saveDraft(next));
  }, []);
  const soundOn = progress.settings?.sound !== false;

  useEffect(() => setAudioEnabled(soundOn), [soundOn]);

  useEffect(() => {
    const wasUnlocked = wasStarWeavingUnlocked.current;
    wasStarWeavingUnlocked.current = starWeavingUnlocked;
    if (!wasUnlocked || starWeavingUnlocked) return;
    // 다른 탭에서 전체 초기화해도 이 탭의 메모리 초안과 편집 화면을 남기지 않는다.
    clearDraftMemory();
    setDraft(null);
    setDraftFailed(false);
    if (screen === SCREEN.STAR_WEAVER) setScreen(SCREEN.ALMANAC);
  }, [screen, starWeavingUnlocked]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      disposeAudio();
    };
  }, []);

  useEffect(
    () => registerServiceWorker({
      onUpdate: setUpdateRegistration,
      canReload: () => {
        const state = stateRef.current;
        return state.screen !== SCREEN.STAR_WEAVER && state.screen !== SCREEN.PUZZLE
          && !state.saving && !state.saveFailed && !state.draftFailed;
      },
      onReloadDeferred: () => setReloadDeferred(true),
    }),
    []
  );

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

  const handleSolved = useCallback(() => complete(currentId), [complete, currentId]);
  /** 완료 기록은 마지막 선을 잇는 순간 저장하고, 연출 뒤에는 화면만 전환한다. */
  const handleStageClear = useCallback(() => {
    setReplaying(false);
    setScreen(SCREEN.STORY);
  }, []);

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

  const handleReset = useCallback(async () => {
    if (await reset() !== true) return false;
    clearDraftMemory();
    setDraft(null);
    setDraftFailed(false);
    setCurrentId(constellations[0].id);
    setReplaying(false);
    return true;
  }, [reset]);

  return (
    <div className={`${styles.app} ${screen !== SCREEN.TITLE ? styles.journey : ''}`}>
      {/* 퍼즐 화면은 자기 안에 진짜 밤하늘을 그리므로 장식 별을 겹쳐 그리지 않는다 */}
      {screen !== SCREEN.PUZZLE && screen !== SCREEN.STAR_WEAVER && <BackgroundStars />}

      {screen !== SCREEN.TITLE && (
        <TopBar
          title={SCREEN_TITLE[screen]}
          completedCount={completedIds.length}
          soundOn={soundOn}
          onToggleSound={() => {
            const next = !soundOn;
            setSettings({ sound: next });
            setAudioEnabled(next);
            if (next) unlockAudio();
          }}
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

      {saveFailed && screen !== SCREEN.STAR_WEAVER && (
        <aside role="alert" className={styles.saveWarning}>
          <span>기기에 저장하지 못했어요. 새로고침하거나 창을 닫으면 이번 기록이 사라질 수 있어요.</span>
          <button type="button" className="btnGhost" onClick={retrySave}>다시 저장하기</button>
        </aside>
      )}
      {conflict && <aside role="alert" className={styles.saveWarning}>{conflict}</aside>}
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
            onSolved={handleSolved}
            onFeedback={playFeedback}
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
            draft={draft}
            onDraftChange={updateDraft}
            draftFailed={draftFailed}
            conflict={conflict}
            myConstellations={myConstellations}
            onSave={saveMyConstellation}
            onExit={() => go(SCREEN.ALMANAC)}
            onFeedback={playFeedback}
          />
        )}
      </main>

      {(updateRegistration || reloadDeferred) && screen !== SCREEN.STAR_WEAVER
        && screen !== SCREEN.PUZZLE && !saving && !saveFailed && !draftFailed && (
        <UpdateBanner
          onUpdate={() => reloadDeferred ? window.location.reload() : activateWaitingWorker(updateRegistration)}
          onDismiss={() => { setUpdateRegistration(null); setReloadDeferred(false); }}
        />
      )}
    </div>
  );
}
