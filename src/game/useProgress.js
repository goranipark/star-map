import { useCallback, useEffect, useRef, useState } from 'react';
import * as store from './progress.js';
import { transactProgress, saveCardOperation, removeCardOperation } from './progressTransactions.js';

export function useProgress() {
  const [progress, setProgress] = useState(store.loadProgress);
  const progressRef = useRef(progress);
  const [saveFailed, setSaveFailed] = useState(false);
  const [conflict, setConflict] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef([]);
  const queue = useRef(Promise.resolve());
  const publish = useCallback((next) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  const apply = useCallback((operation, remember = true) => {
    if (operation) pending.current.push({ operation, remember });
    setSaving(true);
    const run = async () => {
      let success = true;
      let outcome;
      setConflict('');
      while (pending.current.length) {
        const item = pending.current[0];
        try {
          const next = await transactProgress(item.operation);
          publish(next);
          if (pending.current[0] === item) pending.current.shift();
        } catch (error) {
          success = false;
          if (error instanceof store.ProgressResetError) {
            setConflict(error.message);
            if (pending.current[0] === item) pending.current.shift();
          } else if (error instanceof store.ConstellationCapacityError) {
            outcome = 'conflict';
            setConflict(error.message);
            publish(store.loadProgress());
            if (pending.current[0] === item) pending.current.shift();
          } else {
            // Keep operations, not old snapshots, for retries against current storage.
            if (item.remember && error instanceof store.ProgressWriteError) publish(error.progress);
            if (!item.remember && pending.current[0] === item) pending.current.shift();
            setSaveFailed(true);
          }
          break;
        }
      }
      if (success) setSaveFailed(false);
      setSaving(false);
      return outcome || success;
    };
    const result = queue.current.then(run, run);
    queue.current = result;
    return result;
  }, [publish]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== store.STORAGE_KEY && event.key !== null) return;
      if (event.newValue === null) pending.current = [];
      publish(store.loadProgress());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [publish]);

  const complete = useCallback((id) => apply((latest) => store.markCompleted(latest, id)), [apply]);
  const setLastPlayed = useCallback((id) => apply((latest) => store.markLastPlayed(latest, id)), [apply]);
  const setSettings = useCallback((patch) => apply((latest) => store.updateSettings(latest, patch)), [apply]);
  const reset = useCallback(() => {
    pending.current = [];
    return apply(() => store.resetProgress(), false);
  }, [apply]);
  const saveMyConstellation = useCallback((card, replaceId = null, chosenCard) => {
    const expected = chosenCard ?? progressRef.current.myConstellations.find((c) => c.id === (replaceId || card.id));
    return apply(saveCardOperation(card, replaceId, expected), false);
  }, [apply]);
  const removeMyConstellation = useCallback((id) => {
    const expected = progressRef.current.myConstellations.find((c) => c.id === id);
    return apply(removeCardOperation(id, expected), false);
  }, [apply]);
  const retrySave = useCallback(() => apply(null), [apply]);

  return {
    progress, saveFailed, conflict, saving, retrySave,
    completedIds: progress.completed,
    myConstellations: progress.myConstellations,
    starWeavingUnlocked: store.isStarWeavingUnlocked(progress),
    complete, setLastPlayed, setSettings, reset, saveMyConstellation, removeMyConstellation,
    isCompleted: (id) => store.isCompleted(progress, id),
    isUnlocked: (id) => store.isUnlocked(progress, id),
  };
}
