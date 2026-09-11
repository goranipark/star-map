import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORAGE_KEY,
  loadProgress,
  markCompleted,
  removeMyConstellation,
  resetProgress,
  saveMyConstellation,
  saveProgress,
} from './progress.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

function useStorage() {
  const localStorage = new MemoryStorage();
  globalThis.window = { localStorage };
  return localStorage;
}

function empty() {
  return {
    version: 1,
    completed: [],
    lastPlayed: null,
    updatedAt: null,
    settings: { sound: true },
    myConstellations: [],
  };
}

function mine(index) {
  return {
    id: `my-${index}`,
    name: `성좌 ${index}`,
    stars: [
      { id: 'a', ra: 1, dec: 60, mag: 3 },
      { id: 'b', ra: 2, dec: 62, mag: 3 },
    ],
    lines: [['a', 'b']],
    card: { epithet: '빛나는', power: '길을 비춘다' },
  };
}

test.afterEach(() => {
  delete globalThis.window;
});

test('손상된 저장값은 초기 상태로 복구한다', () => {
  const storage = useStorage();
  storage.setItem(STORAGE_KEY, '{broken json');
  assert.deepEqual(loadProgress(), empty());
});

test('존재하지 않는 별자리 ID와 lastPlayed를 제거한다', () => {
  const storage = useStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    completed: ['ursa-minor', 'not-a-constellation'],
    lastPlayed: 'removed-stage',
    settings: { sound: false },
    myConstellations: [mine(1), { id: 'broken', stars: [], lines: [] }],
  }));

  const loaded = loadProgress();
  assert.deepEqual(loaded.completed, ['ursa-minor']);
  assert.equal(loaded.lastPlayed, null);
  assert.equal(loaded.settings.sound, false);
  assert.deepEqual(loaded.myConstellations.map((c) => c.id), ['my-1']);
});

test('같은 별자리를 여러 번 완료해도 한 번만 저장한다', () => {
  useStorage();
  const once = markCompleted(empty(), 'ursa-minor');
  const twice = markCompleted(once, 'ursa-minor');
  assert.deepEqual(twice.completed, ['ursa-minor']);
  assert.equal(twice.lastPlayed, 'ursa-minor');
});

test('사용자 성좌는 최근 12개만 유지한다', () => {
  useStorage();
  let progress = empty();
  for (let index = 0; index < 14; index += 1) {
    progress = saveMyConstellation(progress, mine(index));
  }
  assert.equal(progress.myConstellations.length, 12);
  assert.equal(progress.myConstellations[0].id, 'my-2');
  assert.equal(progress.myConstellations.at(-1).id, 'my-13');
});

test('사용자 성좌 삭제와 전체 초기화가 저장소에도 반영된다', () => {
  const storage = useStorage();
  let progress = saveProgress({ ...empty(), myConstellations: [mine(1), mine(2)] });
  progress = removeMyConstellation(progress, 'my-1');
  assert.deepEqual(progress.myConstellations.map((c) => c.id), ['my-2']);

  const reset = resetProgress();
  assert.deepEqual(reset, empty());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

