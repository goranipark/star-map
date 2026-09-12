/**
 * 폴라리스의 소리 세계.
 *
 * 음원 파일 대신 Web Audio로 D 장조 오음음계의 배경 음악과 효과음을 만든다.
 * 배경의 글라스 벨, 별 연결음, 완성 팡파르가 같은 음계와 잔향 버스를 써서
 * 효과음이 음악 위에 붙은 별도 소리가 아니라 한 곡의 다음 음처럼 들린다.
 *
 * 브라우저 자동 재생 정책 때문에 unlockAudio()는 사용자의 첫 입력 안에서 호출한다.
 */

export const AUDIO_THEME = Object.freeze({
  // D–E–F♯–A–B: 부딪히는 반음이 없어 어린이용 퍼즐에서도 부드럽다.
  connectionScale: Object.freeze([587.33, 659.25, 739.99, 880, 987.77, 1174.66]),
  pad: Object.freeze([73.42, 110, 146.83, 164.81, 220]),
  motif: Object.freeze([293.66, 440, 329.63, 369.99, 493.88, 440, 329.63]),
});

let enabled = true;
let audioContext = null;
let graph = null;
let ambient = null;
const ambientCleanupTimers = new Set();
let fallbackConnectionStep = 0;

/** 연결 진행률을 같은 음계 안의 상승 음으로 바꾼다. Web Audio 없이도 검사 가능한 순수 함수다. */
export function connectionFrequency(connected, total, fallbackStep = 0) {
  const scale = AUDIO_THEME.connectionScale;
  if (Number.isFinite(connected) && Number.isFinite(total) && total > 0) {
    const progress = total === 1 ? 1 : Math.min(1, Math.max(0, (connected - 1) / (total - 1)));
    return scale[Math.round(progress * (scale.length - 1))];
  }
  return scale[Math.abs(fallbackStep) % (scale.length - 1)];
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
    graph = null;
  }
  return audioContext;
}

function impulseResponse(context, seconds = 3.2) {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  let seed = 0x504f4c41; // 같은 기기에서는 언제나 같은 '우주' 질감

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const noise = (seed / 0xffffffff) * 2 - 1;
      const envelope = (1 - i / length) ** 2.6;
      data[i] = noise * envelope * (channel === 0 ? 0.72 : 0.68);
    }
  }
  return impulse;
}

function getGraph(context) {
  if (graph) return graph;

  const musicInput = context.createGain();
  const effectsInput = context.createGain();
  const reverbInput = context.createGain();
  const convolver = context.createConvolver();
  const reverbTone = context.createBiquadFilter();
  const wet = context.createGain();
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();

  musicInput.gain.value = 1;
  effectsInput.gain.value = 1;
  reverbInput.gain.value = 1;
  convolver.buffer = impulseResponse(context);
  reverbTone.type = 'lowpass';
  reverbTone.frequency.value = 4200;
  wet.gain.value = 0.22;
  master.gain.value = 0.72;
  limiter.threshold.value = -18;
  limiter.knee.value = 18;
  limiter.ratio.value = 5;
  limiter.attack.value = 0.012;
  limiter.release.value = 0.28;

  musicInput.connect(master);
  effectsInput.connect(master);
  reverbInput.connect(convolver).connect(reverbTone).connect(wet).connect(master);
  master.connect(limiter).connect(context.destination);

  graph = { musicInput, effectsInput, reverbInput, master, nodes: [
    musicInput, effectsInput, reverbInput, convolver, reverbTone, wet, master, limiter,
  ] };
  return graph;
}

/** source를 마른 소리와 잔향으로 나눠 보낸다. 반환 노드는 source 종료 때 정리한다. */
function connectWithSpace(context, source, destination, sendLevel) {
  const dry = context.createGain();
  const send = context.createGain();
  dry.gain.value = 1;
  send.gain.value = sendLevel;
  source.connect(dry).connect(destination);
  source.connect(send).connect(getGraph(context).reverbInput);
  return [dry, send];
}

function disconnectAll(nodes) {
  nodes.forEach((node) => {
    try { node.disconnect(); } catch { /* 이미 정리된 노드는 무시한다. */ }
  });
}

/** 잔향이 긴 유리 종. 배경 멜로디와 정답 효과음이 이 악기를 함께 쓴다. */
function glassBell(frequency, {
  start,
  duration = 1.8,
  level = 0.06,
  destination,
  reverb = 0.45,
  onEnded,
} = {}) {
  const context = getContext();
  if (!context || context.state !== 'running') return [];
  const begins = start ?? context.currentTime;
  const ends = begins + duration;
  const output = destination ?? getGraph(context).effectsInput;
  const fundamental = context.createOscillator();
  const shimmer = context.createOscillator();
  const fundamentalGain = context.createGain();
  const shimmerGain = context.createGain();
  const cleanupNodes = [fundamental, shimmer, fundamentalGain, shimmerGain];

  fundamental.type = 'sine';
  fundamental.frequency.setValueAtTime(frequency, begins);
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(frequency * 2.01, begins);

  fundamentalGain.gain.setValueAtTime(0.0001, begins);
  fundamentalGain.gain.exponentialRampToValueAtTime(level, begins + 0.018);
  fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, ends);
  shimmerGain.gain.setValueAtTime(0.0001, begins);
  shimmerGain.gain.exponentialRampToValueAtTime(level * 0.28, begins + 0.009);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, begins + duration * 0.56);

  fundamental.connect(fundamentalGain);
  shimmer.connect(shimmerGain);
  cleanupNodes.push(...connectWithSpace(context, fundamentalGain, output, reverb));
  cleanupNodes.push(...connectWithSpace(context, shimmerGain, output, reverb * 0.8));

  fundamental.start(begins);
  shimmer.start(begins);
  fundamental.stop(ends + 0.03);
  shimmer.stop(ends + 0.03);
  fundamental.addEventListener('ended', () => {
    disconnectAll(cleanupNodes);
    onEnded?.(cleanupNodes);
  }, { once: true });
  return cleanupNodes;
}

function duckMusic(start, depth = 0.72, release = 0.8) {
  if (!ambient) return;
  const gain = ambient.duck.gain;
  gain.cancelScheduledValues(start);
  gain.setValueAtTime(Math.max(0.001, gain.value), start);
  gain.exponentialRampToValueAtTime(depth, start + 0.025);
  gain.exponentialRampToValueAtTime(1, start + release);
}

function rampMaster(isOn) {
  if (!graph || !audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  graph.master.gain.cancelScheduledValues(now);
  graph.master.gain.setValueAtTime(Math.max(0.0001, graph.master.gain.value), now);
  graph.master.gain.exponentialRampToValueAtTime(isOn ? 0.72 : 0.0001, now + (isOn ? 0.18 : 0.12));
}

function scheduleAmbientPhrase(current) {
  if (ambient !== current || !enabled) return;
  const { context } = current;
  const phraseStart = Math.max(context.currentTime + 0.08, current.nextPhraseAt);
  const beat = 2.4;

  AUDIO_THEME.motif.forEach((frequency, index) => {
    let nodes;
    nodes = glassBell(frequency, {
      start: phraseStart + index * beat,
      duration: 3.8,
      level: index === 0 ? 0.013 : 0.009,
      destination: current.duck,
      reverb: 0.72,
      onEnded: () => current.oneShots.delete(nodes),
    });
    current.oneShots.add(nodes);
  });

  current.nextPhraseAt = phraseStart + AUDIO_THEME.motif.length * beat;
  const delayMs = Math.max(1000, (current.nextPhraseAt - context.currentTime - 3) * 1000);
  current.phraseTimer = setTimeout(() => scheduleAmbientPhrase(current), delayMs);
}

function stopAmbient() {
  if (!ambient) return;
  const current = ambient;
  ambient = null;
  clearTimeout(current.phraseTimer);

  const now = current.context.currentTime;
  current.master.gain.cancelScheduledValues(now);
  current.master.gain.setValueAtTime(Math.max(0.0001, current.master.gain.value), now);
  current.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  const cleanupTimer = setTimeout(() => {
    current.sources.forEach((node) => {
      try { node.stop(); } catch { /* 이미 멈춘 노드는 무시한다. */ }
    });
    current.oneShots.forEach((group) => group.forEach((node) => {
      if (typeof node.stop === 'function') {
        try { node.stop(); } catch { /* 이미 멈춘 노드는 무시한다. */ }
      }
    }));
    disconnectAll(current.nodes);
    current.oneShots.forEach(disconnectAll);
    current.oneShots.clear();
    ambientCleanupTimers.delete(cleanupTimer);
  }, 500);
  ambientCleanupTimers.add(cleanupTimer);
}

function startAmbient() {
  const context = getContext();
  if (!enabled || !context || context.state !== 'running' || ambient) return;

  const audioGraph = getGraph(context);
  const master = context.createGain();
  const duck = context.createGain();
  const filter = context.createBiquadFilter();
  const filterLfo = context.createOscillator();
  const filterDepth = context.createGain();
  const now = context.currentTime;

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.085, now + 2.8);
  duck.gain.value = 1;
  filter.type = 'lowpass';
  filter.frequency.value = 820;
  filter.Q.value = 0.7;
  filterLfo.type = 'sine';
  filterLfo.frequency.value = 0.025;
  filterDepth.gain.value = 310;
  filterLfo.connect(filterDepth).connect(filter.frequency);
  filter.connect(master).connect(duck).connect(audioGraph.musicInput);
  master.connect(audioGraph.reverbInput);

  const padVoices = AUDIO_THEME.pad.map((frequency, index) => {
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = index < 2 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = [-5, 3, -2, 4, 1][index];
    voice.gain.value = [0.48, 0.27, 0.13, 0.1, 0.07][index];
    oscillator.connect(voice).connect(filter);
    oscillator.start(now);
    return { oscillator, voice };
  });

  filterLfo.start(now);
  const current = {
    context,
    master,
    duck,
    sources: [...padVoices.map(({ oscillator }) => oscillator), filterLfo],
    nodes: [
      master, duck, filter, filterLfo, filterDepth,
      ...padVoices.flatMap(({ oscillator, voice }) => [oscillator, voice]),
    ],
    oneShots: new Set(),
    nextPhraseAt: now + 1.4,
    phraseTimer: null,
  };
  ambient = current;
  scheduleAmbientPhrase(current);
}

function glidingTone(frequency, endFrequency, duration, level, start) {
  const context = getContext();
  if (!context || context.state !== 'running') return;
  const begins = start ?? context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const cleanupNodes = [oscillator, gain];
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, begins);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, begins + duration);
  gain.gain.setValueAtTime(0.0001, begins);
  gain.gain.exponentialRampToValueAtTime(level, begins + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, begins + duration);
  oscillator.connect(gain);
  cleanupNodes.push(...connectWithSpace(context, gain, getGraph(context).effectsInput, 0.18));
  oscillator.start(begins);
  oscillator.stop(begins + duration + 0.02);
  oscillator.addEventListener('ended', () => disconnectAll(cleanupNodes), { once: true });
}

function completionShimmer(start) {
  const context = getContext();
  if (!context || context.state !== 'running') return;
  const duration = 1.7;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const fade = Math.sin(Math.PI * i / length) ** 2;
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const cleanupNodes = [source, filter, gain];
  filter.type = 'bandpass';
  filter.Q.value = 2.4;
  filter.frequency.setValueAtTime(900, start);
  filter.frequency.exponentialRampToValueAtTime(4200, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.018, start + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain);
  cleanupNodes.push(...connectWithSpace(context, gain, getGraph(context).effectsInput, 0.75));
  source.start(start);
  source.addEventListener('ended', () => disconnectAll(cleanupNodes), { once: true });
}

/** 사용자의 입력 시점에 오디오 컨텍스트를 열고 음악을 페이드인한다. */
export async function unlockAudio() {
  const context = getContext();
  if (!context || !enabled) return false;
  try {
    if (context.state === 'suspended') await context.resume();
    rampMaster(true);
    startAmbient();
    return context.state === 'running';
  } catch {
    return false;
  }
}

/** 저장된 소리 설정과 실제 오디오 상태를 맞춘다. */
export function setAudioEnabled(nextEnabled) {
  enabled = Boolean(nextEnabled);
  if (enabled) {
    if (audioContext?.state === 'running') {
      rampMaster(true);
      startAmbient();
    }
  } else {
    rampMaster(false);
    stopAmbient();
  }
}

/**
 * 퍼즐 피드백을 배경 음악의 일부처럼 재생한다.
 * detail={ connected, total }을 주면 별자리를 완성해 갈수록 연결음도 함께 상승한다.
 */
export function playFeedback(kind, detail = {}) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;

  // 포인터 이벤트 안에서 호출된 경우에는 첫 효과음도 들리게 한다.
  if (context.state === 'suspended') {
    context.resume().then(() => {
      rampMaster(true);
      startAmbient();
      playFeedback(kind, detail);
    }).catch(() => {});
    return;
  }

  startAmbient();
  const now = context.currentTime;
  if (kind === 'wrong') {
    duckMusic(now, 0.86, 0.38);
    // 주음 바로 아래의 B로 부드럽게 내려가므로 실패음도 세계관 밖으로 튀지 않는다.
    glidingTone(277.18, 246.94, 0.3, 0.035, now);
    return;
  }

  if (kind === 'complete') {
    fallbackConnectionStep = 0;
    duckMusic(now, 0.48, 2.5);
    // 마지막 연결음의 높은 D 아래로 Dadd9 화음을 쌓아 한 프레이즈로 마무리한다.
    [
      [146.83, 0, 2.9, 0.055],
      [293.66, 0.12, 2.7, 0.075],
      [369.99, 0.28, 2.55, 0.064],
      [440, 0.44, 2.4, 0.06],
      [659.25, 0.68, 2.2, 0.052],
      [1174.66, 0.92, 2, 0.038],
    ].forEach(([frequency, delay, duration, level]) => {
      glassBell(frequency, { start: now + delay, duration, level, reverb: 0.68 });
    });
    completionShimmer(now + 0.08);
    return;
  }

  const frequency = connectionFrequency(detail.connected, detail.total, fallbackConnectionStep);
  fallbackConnectionStep += 1;
  duckMusic(now, 0.68, 0.72);
  glassBell(frequency, { start: now, duration: 1.25, level: 0.082, reverb: 0.46 });
  // 아주 짧은 옥타브 반짝임이 화면의 선 발광과 동시에 나타난다.
  glassBell(frequency * 2, {
    start: now + 0.035,
    duration: 0.62,
    level: 0.018,
    reverb: 0.62,
  });
}

/** 개발 중 핫 리로드나 앱 종료 시 오디오 노드와 타이머를 남기지 않는다. */
export function disposeAudio() {
  stopAmbient();
  ambientCleanupTimers.forEach(clearTimeout);
  ambientCleanupTimers.clear();
  if (graph) disconnectAll(graph.nodes);
  graph = null;
  if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
  audioContext = null;
  fallbackConnectionStep = 0;
}
