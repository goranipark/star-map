import { constellations, getConstellation } from './constellations.js';

/**
 * 진행 상황 저장 — ToDo.md Phase 2.
 *
 * 서버·DB 없이 브라우저 localStorage에만 저장한다(ToDo.md 0장).
 * 저장 형식이 바뀔 수 있으므로 키에 버전(v1)을 박아 둔다.
 * 나중에 형식을 바꿀 때는 키를 v2로 올리고 마이그레이션 코드를 여기에 둔다.
 *
 * 저장되는 값
 * {
 *   version: 1,
 *   completed: ["ursa-minor", ...],  // 완성한 별자리 id, 완성한 순서대로
 *   lastPlayed: "ursa-major" | null, // 마지막으로 연 별자리 (이어하기용)
 *   updatedAt: "2026-09-10T09:20:00.000Z",
 *   settings: { sound: true },
 *   myConstellations: [ ... ]   // 아이가 직접 만든 성좌 (Phase 4-B)
 * }
 *
 * myConstellations의 한 칸은 constellations.json의 별자리 한 칸과 같은 모양이라
 * 도감 카드·별자리 그림 코드를 그대로 재사용할 수 있다.
 * {
 *   id: "my-1757...", name: "용감한 고양이", aka: "내가 만든 성좌",
 *   stars: [{ id, ra, dec, mag }], lines: [[별id, 별id], ...],
 *   card: { epithet, power }, author: "", createdAt: "..."
 * }
 */

export const STORAGE_KEY = 'polaris-star-map/progress/v1';

const EMPTY = Object.freeze({
  version: 1,
  completed: [],
  lastPlayed: null,
  updatedAt: null,
  settings: { sound: true },
  myConstellations: [],
});

/** 한 기기에 너무 많이 쌓이지 않도록 (교실 공용 기기 대비) */
const MAX_MY_CONSTELLATIONS = 12;

function emptyProgress() {
  return { ...EMPTY, settings: { ...EMPTY.settings }, myConstellations: [] };
}

/** 시크릿 모드 등에서 localStorage 접근 자체가 막히는 경우가 있어 항상 감싼다. */
function safeRead() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWrite(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    // 저장에 실패해도 게임은 계속 진행되어야 한다(진행 기록만 남지 않을 뿐).
    return false;
  }
}

/**
 * 저장된 값을 읽어 온다.
 * 손상되었거나 형식이 다르면 조용히 초기값으로 되돌린다 — 학생 기기에서
 * 오류 화면이 뜨는 것보다 처음부터 다시 하는 편이 낫다.
 */
export function loadProgress() {
  const raw = safeRead();
  if (!raw) return emptyProgress();

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) throw new Error('unknown version');

    // 데이터에 더 이상 없는 별자리 id는 걸러낸다(별자리를 삭제·개명한 경우 대비).
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((id) => Boolean(getConstellation(id)))
      : [];

    return {
      version: 1,
      completed,
      lastPlayed: getConstellation(parsed.lastPlayed) ? parsed.lastPlayed : null,
      updatedAt: parsed.updatedAt ?? null,
      settings: { sound: parsed.settings?.sound !== false },
      myConstellations: Array.isArray(parsed.myConstellations)
        ? parsed.myConstellations.filter(isUsableMyConstellation)
        : [],
    };
  } catch {
    return emptyProgress();
  }
}

/** 저장해 둔 성좌가 그릴 수 있는 모양인지 확인한다 (손상된 값 걸러내기). */
function isUsableMyConstellation(c) {
  return (
    c &&
    typeof c.id === 'string' &&
    Array.isArray(c.stars) &&
    c.stars.length >= 2 &&
    Array.isArray(c.lines) &&
    c.lines.length >= 1
  );
}

/** 진행 상황을 통째로 저장한다. 저장된 객체를 그대로 돌려준다. */
export function saveProgress(progress) {
  const next = { ...progress, version: 1, updatedAt: new Date().toISOString() };
  safeWrite(JSON.stringify(next));
  return next;
}

/** 별자리 하나를 완성 처리한다. 이미 완성한 별자리면 목록을 그대로 둔다. */
export function markCompleted(progress, constellationId) {
  const completed = progress.completed.includes(constellationId)
    ? progress.completed
    : [...progress.completed, constellationId];

  return saveProgress({ ...progress, completed, lastPlayed: constellationId });
}

/** 마지막으로 연 별자리를 기록한다(완성 여부와 무관). */
export function markLastPlayed(progress, constellationId) {
  return saveProgress({ ...progress, lastPlayed: constellationId });
}

/** 효과음 on/off 같은 설정을 바꾼다. */
export function updateSettings(progress, patch) {
  return saveProgress({
    ...progress,
    settings: { ...progress.settings, ...patch },
  });
}

/** 진행 상황을 모두 지운다(교실에서 다음 학생에게 넘길 때 사용). */
export function resetProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 지우지 못해도 무시 */
  }
  return emptyProgress();
}

/* ------------------------------------------------------------------
   나만의 성좌 (Phase 4-B)
------------------------------------------------------------------ */

/** 만든 성좌를 저장한다. 같은 id가 있으면 덮어쓴다(수정). */
export function saveMyConstellation(progress, myConstellation) {
  const list = progress.myConstellations ?? [];
  const exists = list.some((c) => c.id === myConstellation.id);

  const next = exists
    ? list.map((c) => (c.id === myConstellation.id ? myConstellation : c))
    : [...list, myConstellation].slice(-MAX_MY_CONSTELLATIONS);

  return saveProgress({ ...progress, myConstellations: next });
}

/** 만든 성좌 하나를 지운다. */
export function removeMyConstellation(progress, id) {
  return saveProgress({
    ...progress,
    myConstellations: (progress.myConstellations ?? []).filter((c) => c.id !== id),
  });
}

/**
 * 나만의 성좌 만들기가 열렸는지.
 * concept.md의 진행 구조에 맞춰 **도감 5장을 모두 채운 뒤** 열린다.
 */
export function isStarWeavingUnlocked(progress) {
  return progress.completed.length >= constellations.length;
}

export function isCompleted(progress, constellationId) {
  return progress.completed.includes(constellationId);
}

/**
 * 도전 가능한 별자리인지 확인한다.
 * concept.md 2장의 "완성 → 다음 별자리 잠금 해제" 구조에 따라,
 * 바로 앞 순서의 별자리를 완성해야 다음 별자리가 열린다.
 */
export function isUnlocked(progress, constellationId) {
  const target = getConstellation(constellationId);
  if (!target) return false;
  if (target.order === 1) return true;

  const previous = constellations.find((c) => c.order === target.order - 1);
  return previous ? isCompleted(progress, previous.id) : true;
}
