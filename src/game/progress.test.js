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
  isStarWeavingUnlocked,
  isUsableMyConstellation,
  ProgressWriteError,
  ConstellationCapacityError,
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

test('저장 실패를 알리고 메모리 진행을 복구해 재시도할 수 있다', () => {
  const storage = useStorage();
  const previous = saveProgress(empty());
  const original = storage.getItem(STORAGE_KEY);
  const write = storage.setItem.bind(storage);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  let pending;
  assert.throws(() => saveMyConstellation(previous, mine(1)), (error) => {
    assert.ok(error instanceof ProgressWriteError);
    pending = error.progress;
    return true;
  });
  assert.equal(storage.getItem(STORAGE_KEY), original);
  assert.equal(pending.myConstellations.length, 1);
  storage.setItem = write;
  saveMyConstellation(pending, mine(1));
  assert.equal(loadProgress().myConstellations.length, 1);
});

test('중복 완료 ID는 제거하고 서로 다른 다섯 별자리를 모두 완료해야 해금한다', () => {
  const storage = useStorage();
  const duplicated = { ...empty(), completed: Array(5).fill('ursa-minor') };
  storage.setItem(STORAGE_KEY, JSON.stringify(duplicated));
  assert.deepEqual(loadProgress().completed, ['ursa-minor']);
  assert.equal(isStarWeavingUnlocked(duplicated), false);
  assert.equal(isStarWeavingUnlocked({ ...empty(), completed: [
    'ursa-minor', 'ursa-major', 'cassiopeia', 'cepheus', 'draco',
  ] }), true);
});

test('손상된 작품만 제외하고 정상 작품과 진행 기록은 보존한다', () => {
  const storage = useStorage();
  const mutations = [
    (c) => { c.lines = [['a', 'missing']]; },
    (c) => { c.lines = [['a', 'a']]; },
    (c) => { c.lines = [['a', 'b'], ['b', 'a']]; },
    (c) => { c.lines = [null]; },
    (c) => { c.stars[1].id = 'a'; },
    (c) => { c.stars[0].ra = 24; },
    (c) => { c.stars[0].dec = -91; },
    (c) => { c.stars[0].mag = 'bright'; },
    (c) => { c.stars[0] = null; },
    (c) => { c.name = {}; },
    (c) => { c.card.power = {}; },
    (c) => { c.author = []; },
  ];
  for (const mutate of mutations) {
    const broken = mine(2);
    mutate(broken);
    assert.equal(isUsableMyConstellation(broken), false);
    const raw = JSON.stringify({ ...empty(), completed: ['ursa-minor'], myConstellations: [mine(1), broken] });
    storage.setItem(STORAGE_KEY, raw);
    assert.deepEqual(loadProgress().myConstellations, [mine(1)]);
    assert.deepEqual(loadProgress().completed, ['ursa-minor']);
    assert.equal(storage.getItem(STORAGE_KEY), raw, '읽기는 원본을 덮어쓰지 않는다');
    assert.throws(() => saveMyConstellation(empty(), broken), TypeError);
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    const broken = mine(3);
    broken.stars[0].ra = value;
    assert.equal(isUsableMyConstellation(broken), false);
  }
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

test('13번째 작품은 선택 없이 기존 작품을 삭제하지 않는다', () => {
  const storage = useStorage();
  let progress = empty();
  for (let index = 0; index < 12; index += 1) {
    progress = saveMyConstellation(progress, mine(index));
  }
  assert.equal(progress.myConstellations.length, 12);
  const original = storage.getItem(STORAGE_KEY);
  assert.throws(() => saveMyConstellation(progress, mine(12)), ConstellationCapacityError);
  assert.throws(() => saveMyConstellation(progress, mine(12), 'missing'), ConstellationCapacityError);
  assert.equal(storage.getItem(STORAGE_KEY), original);
  const replaced = saveMyConstellation(progress, mine(12), 'my-5');
  assert.deepEqual(replaced.myConstellations.map((c) => c.id),
    progress.myConstellations.map((c) => c.id === 'my-5' ? 'my-12' : c.id));
  assert.equal(saveMyConstellation(replaced, mine(12)).myConstellations.length, 12);
});

test('교체 저장 실패 시 기존 작품을 메모리와 저장소에 보존한다', () => {
  const storage = useStorage();
  const progress = saveProgress({ ...empty(), myConstellations: [mine(1)] });
  const original = storage.getItem(STORAGE_KEY);
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => saveMyConstellation(progress, mine(2), 'my-1'), (error) => {
    assert.ok(error instanceof ProgressWriteError);
    assert.deepEqual(error.progress.myConstellations, [mine(1)]);
    return true;
  });
  assert.equal(storage.getItem(STORAGE_KEY), original);
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
