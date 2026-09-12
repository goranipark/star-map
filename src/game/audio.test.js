import test from 'node:test';
import assert from 'node:assert/strict';

import { AUDIO_THEME, connectionFrequency } from './audio.js';

test('연결음은 진행할수록 같은 음계 안에서 상승한다', () => {
  const notes = Array.from({ length: 7 }, (_, index) => connectionFrequency(index + 1, 7));
  assert.equal(notes[0], AUDIO_THEME.connectionScale[0]);
  assert.equal(notes.at(-1), AUDIO_THEME.connectionScale.at(-1));
  assert.ok(notes.every((note, index) => index === 0 || note >= notes[index - 1]));
  assert.ok(notes.every((note) => AUDIO_THEME.connectionScale.includes(note)));
});

test('짧은 별자리도 첫 연결에서 완성음의 주음으로 향한다', () => {
  assert.equal(connectionFrequency(1, 1), AUDIO_THEME.connectionScale.at(-1));
});

test('진행 정보가 없는 자유 연결은 마지막 해결음을 남겨 둔 채 음계를 순환한다', () => {
  const usable = AUDIO_THEME.connectionScale.length - 1;
  assert.equal(connectionFrequency(undefined, undefined, usable), AUDIO_THEME.connectionScale[0]);
  assert.notEqual(connectionFrequency(undefined, undefined, usable - 1), AUDIO_THEME.connectionScale.at(-1));
});
