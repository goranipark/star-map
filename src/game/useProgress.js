import { useCallback, useState } from 'react';
import * as progressStore from './progress.js';

/**
 * 진행 상황을 화면에서 쓰기 쉽게 감싼 훅.
 *
 * 저장은 progress.js가 localStorage에 바로바로 한다.
 * 여기서는 그 결과를 화면에 반영하기 위한 상태만 들고 있는다.
 */
export function useProgress() {
  // 첫 렌더에서 딱 한 번만 읽는다 (localStorage 접근이 매 렌더마다 일어나지 않도록)
  const [progress, setProgress] = useState(() => progressStore.loadProgress());

  const complete = useCallback((constellationId) => {
    setProgress((prev) => progressStore.markCompleted(prev, constellationId));
  }, []);

  const setLastPlayed = useCallback((constellationId) => {
    setProgress((prev) => progressStore.markLastPlayed(prev, constellationId));
  }, []);

  const setSettings = useCallback((patch) => {
    setProgress((prev) => progressStore.updateSettings(prev, patch));
  }, []);

  const reset = useCallback(() => {
    setProgress(progressStore.resetProgress());
  }, []);

  /** 아이가 만든 성좌 저장 (같은 id면 덮어쓴다) */
  const saveMyConstellation = useCallback((myConstellation) => {
    setProgress((prev) => progressStore.saveMyConstellation(prev, myConstellation));
  }, []);

  const removeMyConstellation = useCallback((id) => {
    setProgress((prev) => progressStore.removeMyConstellation(prev, id));
  }, []);

  return {
    progress,
    completedIds: progress.completed,
    myConstellations: progress.myConstellations ?? [],
    starWeavingUnlocked: progressStore.isStarWeavingUnlocked(progress),
    complete,
    setLastPlayed,
    setSettings,
    reset,
    saveMyConstellation,
    removeMyConstellation,
    isCompleted: (id) => progressStore.isCompleted(progress, id),
    isUnlocked: (id) => progressStore.isUnlocked(progress, id),
  };
}
