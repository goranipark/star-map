/**
 * 게임 오디오.
 *
 * 별도 음원 파일 없이 Web Audio로 짧은 차임과 아주 잔잔한 배경음을 만든다.
 * 따라서 외부 음원의 라이선스·네트워크 상태에 영향을 받지 않는다.
 * 브라우저 자동 재생 정책을 지키기 위해 unlockAudio()는 반드시 사용자의
 * 첫 포인터/키보드 입력 안에서 호출한다.
 */

let enabled = true;
let audioContext = null;
let ambient = null;
let ambientStopTimer = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function stopAmbient() {
  if (!ambient) return;
  const current = ambient;
  ambient = null;

  clearTimeout(ambientStopTimer);
  const now = current.context.currentTime;
  current.master.gain.cancelScheduledValues(now);
  current.master.gain.setValueAtTime(current.master.gain.value, now);
  current.master.gain.linearRampToValueAtTime(0, now + 0.3);
  ambientStopTimer = setTimeout(() => {
    current.nodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* 이미 멈춘 노드는 무시한다. */
      }
      node.disconnect();
    });
    current.master.disconnect();
  }, 350);
}

function startAmbient() {
  const context = getContext();
  if (!enabled || !context || context.state !== 'running' || ambient) return;

  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const lfo = context.createOscillator();
  const lfoDepth = context.createGain();
  const now = context.currentTime;

  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.012, now + 1.2);
  filter.type = 'lowpass';
  filter.frequency.value = 720;
  filter.Q.value = 0.6;

  lfo.frequency.value = 0.06;
  lfoDepth.gain.value = 0.003;
  lfo.connect(lfoDepth).connect(master.gain);

  // A2–E3–A3의 열린 화음. 음량이 작아 수업 설명을 방해하지 않는다.
  const oscillators = [110, 164.81, 220].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 1 ? -4 : index * 2;
    voice.gain.value = index === 0 ? 0.55 : 0.32;
    oscillator.connect(voice).connect(filter);
    oscillator.start();
    return oscillator;
  });

  filter.connect(master).connect(context.destination);
  lfo.start();
  ambient = { context, master, nodes: [...oscillators, lfo] };
}

function tone(frequency, duration, volume, delay = 0, endFrequency = frequency) {
  const context = getContext();
  if (!enabled || !context || context.state !== 'running') return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  const end = start + duration;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
  oscillator.addEventListener('ended', () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
}

/** 사용자의 입력 시점에 오디오 컨텍스트를 연다. */
export async function unlockAudio() {
  const context = getContext();
  if (!context || !enabled) return false;
  try {
    if (context.state === 'suspended') await context.resume();
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
    if (audioContext?.state === 'running') startAmbient();
  } else {
    stopAmbient();
  }
}

/** 퍼즐의 성공·오답·완성 피드백을 재생한다. */
export function playFeedback(kind) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;

  // 포인터 이벤트 안에서 호출된 경우에는 첫 효과음도 들리게 한다.
  if (context.state === 'suspended') {
    context.resume().then(() => {
      startAmbient();
      playFeedback(kind);
    }).catch(() => {});
    return;
  }

  if (kind === 'wrong') {
    tone(190, 0.15, 0.018, 0, 145);
    return;
  }
  if (kind === 'complete') {
    tone(523.25, 0.38, 0.045, 0);
    tone(659.25, 0.42, 0.04, 0.12);
    tone(783.99, 0.52, 0.035, 0.24);
    return;
  }
  tone(520, 0.12, 0.026, 0, 720);
}

/** 개발 중 핫 리로드나 앱 종료 시 오디오 노드를 남기지 않는다. */
export function disposeAudio() {
  stopAmbient();
  clearTimeout(ambientStopTimer);
  if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
  audioContext = null;
}

