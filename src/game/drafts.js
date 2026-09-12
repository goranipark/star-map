import { allSkyStars } from './sky.js';
import { lineKey } from './constellations.js';
import { isUsableMyConstellation } from './progress.js';
import { DRAFT_STORAGE_PREFIX, DRAFT_TAB_STORAGE_KEY } from './storageKeys.js';

const PREFIX = DRAFT_STORAGE_PREFIX;
const TAB_KEY = DRAFT_TAB_STORAGE_KEY;
const ids = new Set(allSkyStars.map((star) => star.id));
let activeKey;
let memory = null;

export function validateDraft(draft) {
  if (!draft || draft.version !== 1 || !Array.isArray(draft.lines)
    || ![1, 2, 3].includes(draft.step)) return false;
  for (const field of ['name', 'epithet', 'power', 'author']) {
    if (typeof draft[field] !== 'string') return false;
  }
  const keys = new Set();
  for (const line of draft.lines) {
    if (!Array.isArray(line) || line.length !== 2 || !ids.has(line[0])
      || !ids.has(line[1]) || line[0] === line[1]) return false;
    const key = lineKey(...line);
    if (keys.has(key)) return false;
    keys.add(key);
  }
  return !draft.finishedCard || isUsableMyConstellation(draft.finishedCard);
}

function key() {
  if (!activeKey) {
    let token;
    try { token = sessionStorage.getItem(TAB_KEY); } catch { /* memory still works */ }
    token ||= crypto.randomUUID();
    try { sessionStorage.setItem(TAB_KEY, token); } catch { /* memory still works */ }
    activeKey = PREFIX + token;
  }
  return activeKey;
}

export function loadDraft() {
  try {
    const own = JSON.parse(localStorage.getItem(key()));
    if (validateDraft(own)) return (memory = own);
    // A newly opened tab can recover the latest unfinished work into its own slot.
    const candidates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const entry = localStorage.key(i);
      if (!entry.startsWith(PREFIX)) continue;
      try {
        const draft = JSON.parse(localStorage.getItem(entry));
        if (validateDraft(draft)) candidates.push(draft);
      } catch { /* skip only the damaged draft */ }
    }
    return (memory = candidates.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null);
  } catch { return memory; }
}

export function saveDraft(draft) {
  memory = draft;
  try {
    if (draft === null) localStorage.removeItem(key());
    else {
      if (!validateDraft(draft)) return false;
      localStorage.setItem(key(), JSON.stringify({ ...draft, updatedAt: Date.now() }));
    }
    return true;
  } catch { return false; }
}

/** 전체 초기화가 끝난 뒤 현재 탭에 남은 초안 참조도 버린다. */
export function clearDraftMemory() {
  activeKey = undefined;
  memory = null;
  try { sessionStorage.removeItem(TAB_KEY); } catch { /* 다음 키는 메모리에서 새로 만든다 */ }
}
