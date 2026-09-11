import * as store from './progress.js';

// Serialize the complete read/modify/write operation across tabs.
export function transactProgress(operation) {
  if (!globalThis.navigator?.locks) {
    return Promise.reject(new Error('이 브라우저에서는 안전한 동시 저장을 지원하지 않습니다.'));
  }
  return navigator.locks.request(`${store.STORAGE_KEY}/write`, () => operation(store.loadProgress()));
}

export const sameCard = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function saveCardOperation(card, replaceId, expected) {
  return (latest) => {
    const existing = latest.myConstellations.find((c) => c.id === card.id);
    if (sameCard(existing, card)) return latest;
    if (existing && !expected) {
      throw new store.ConstellationCapacityError('같은 번호의 작품이 이미 있어요. 다시 저장해 주세요.');
    }
    const targetId = replaceId || (expected ? card.id : null);
    if (targetId && !sameCard(latest.myConstellations.find((c) => c.id === targetId), expected)) {
      throw new store.ConstellationCapacityError('다른 탭에서 작품이 바뀌었어요. 교체할 작품을 다시 선택해 주세요.');
    }
    return store.saveMyConstellation(latest, card, replaceId);
  };
}

export function removeCardOperation(id, expected) {
  return (latest) => {
    const current = latest.myConstellations.find((c) => c.id === id);
    if (!current) return latest;
    if (!sameCard(current, expected)) {
      throw new store.ConstellationCapacityError('다른 탭에서 작품이 바뀌었어요. 확인한 뒤 다시 지워 주세요.');
    }
    return store.removeMyConstellation(latest, id);
  };
}
