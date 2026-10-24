/** 効果音・音声・振動。どれも使えない環境では何もしない */

type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, ms: number, volume = 0.18, delayMs = 0): void {
  if (!ctx) return;
  try {
    const t = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.03);
  } catch {
    // 何もしない
  }
}

export type CueSound = 'down' | 'up' | 'hold' | 'rest' | 'switch' | 'count' | 'start' | 'end';

export function playCue(kind: CueSound): void {
  switch (kind) {
    case 'down': return tone(523, 120);
    case 'up': return tone(784, 120);
    case 'hold': return tone(659, 220);
    case 'rest': return tone(440, 260, 0.14);
    case 'switch': return tone(587, 160, 0.14);
    case 'count': return tone(880, 90, 0.16);
    case 'start': return tone(988, 260);
    case 'end':
      tone(659, 160);
      tone(988, 320, 0.18, 170);
      return;
  }
}

// ---- 音声 ----
let jaVoice: SpeechSynthesisVoice | null = null;
let voicesKnown = false;

function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(): void {
  if (!speechAvailable()) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;
  voicesKnown = true;
  jaVoice = voices.find((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('ja')) ?? null;
}

export function initVoices(): void {
  if (!speechAvailable()) return;
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

/** true: 日本語の声がある / false: ない / null: まだ分からない */
export function japaneseVoiceStatus(): boolean | null {
  if (!speechAvailable()) return false;
  if (!voicesKnown) pickVoice();
  if (!voicesKnown) return null;
  return jaVoice !== null;
}

export function speak(text: string): void {
  if (!speechAvailable()) return;
  if (voicesKnown && !jaVoice) return; // 日本語の声がなければ話さない
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (jaVoice) u.voice = jaVoice;
    u.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // 何もしない
  }
}

export function cancelSpeech(): void {
  if (!speechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // 何もしない
  }
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // 何もしない
  }
}

/** 設定をオンにしたときの試し：どんな合図かをその場で体験してもらう */
export function sampleCue(kind: 'voice' | 'sound' | 'vibration'): void {
  unlockAudio();
  if (kind === 'voice') speak('キープ');
  else if (kind === 'sound') playCue('hold');
  else vibrate(120);
}
