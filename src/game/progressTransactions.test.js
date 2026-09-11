import test from 'node:test';
import assert from 'node:assert/strict';
import * as store from './progress.js';
import { transactProgress, saveCardOperation, removeCardOperation } from './progressTransactions.js';
import { validateDraft } from './drafts.js';

test('동시 저장은 최신 완료 기록과 작품을 유지하며 설정만 변경한다', async () => {
  let raw = null;
  globalThis.window = { localStorage: { getItem: () => raw, setItem: (_, value) => { raw = value; } } };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let lock = Promise.resolve();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
    request: (_, action) => { const result = lock.then(action); lock = result.catch(() => {}); return result; },
  } } });
  try {
    const card = { id: 'my-a', name: '작품', stars: [
      { id: 'a', ra: 1, dec: 60, mag: 3 }, { id: 'b', ra: 2, dec: 61, mag: 4 },
    ], lines: [['a', 'b']], card: { epithet: '빛나는', power: '빛난다' } };
    await Promise.all([
      transactProgress((latest) => store.markCompleted(latest, 'ursa-minor')),
      transactProgress((latest) => store.updateSettings(latest, { sound: false })),
      transactProgress(saveCardOperation(card, null)),
      transactProgress((latest) => store.markCompleted(latest, 'ursa-major')),
    ]);
    assert.deepEqual(store.loadProgress().completed, ['ursa-minor', 'ursa-major']);
    assert.equal(store.loadProgress().settings.sound, false);
    assert.deepEqual(store.loadProgress().myConstellations, [card]);
    const edited = { ...card, name: '다른 탭 수정' };
    await transactProgress(saveCardOperation(edited, null, card));
    await assert.rejects(transactProgress(removeCardOperation(card.id, card)), store.ConstellationCapacityError);
    await assert.rejects(transactProgress(saveCardOperation({ ...card, id: 'my-b' }, card.id, card)), store.ConstellationCapacityError);
    assert.deepEqual(store.loadProgress().myConstellations, [edited]);
    await transactProgress(removeCardOperation(edited.id, edited));
    await transactProgress((latest) => store.updateSettings(latest, { sound: true }));
    assert.deepEqual(store.loadProgress().myConstellations, [], '설정 저장이 삭제한 작품을 되살리지 않는다');
  } finally {
    delete globalThis.window;
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
});

test('초안은 실제 별 참조와 편집 단계를 검증한다', () => {
  const draft = { version: 1, step: 2, lines: [['umi-alpha', 'umi-delta']],
    name: '초안', epithet: '', power: '', author: '', finishedCard: null };
  assert.equal(validateDraft(draft), true);
  assert.equal(validateDraft({ ...draft, step: 9 }), false);
  assert.equal(validateDraft({ ...draft, lines: [['umi-alpha', 'missing']] }), false);
  assert.equal(validateDraft({ ...draft, name: {} }), false);
});
