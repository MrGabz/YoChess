/**
 * YoChess Sound Engine — Multi-Theme
 * 4 sound packs: Classic, Epic, Arcade, Zen
 * + SpeechSynthesis for coach voice
 */

let audioCtx = null;
let currentTheme = 'classic';

export function setSoundTheme(theme) {
  currentTheme = theme;
  try { localStorage.setItem('yochess_sound_theme', theme); } catch {}
}
export function loadSoundTheme() {
  try { return localStorage.getItem('yochess_sound_theme') || 'classic'; } catch { return 'classic'; }
}

export const SOUND_THEMES = [
  { id: 'classic', name: 'Classic', emoji: '🎵', description: 'Simple wooden tones' },
  { id: 'epic',    name: 'Epic',    emoji: '⚔️', description: 'Dramatic fantasy fanfares' },
  { id: 'arcade',  name: 'Arcade',  emoji: '🕹️', description: '8-bit chiptune bleeps' },
  { id: 'zen',     name: 'Zen',     emoji: '🔔', description: 'Soft bells & calm tones' },
];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, dur, type = 'sine', gain = 0.25, delay = 0, attack = 0.01, release = null) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const rel = release || dur;
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + attack);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + Math.max(rel, 0.02));
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + Math.max(dur, rel) + 0.05);
  } catch {}
}

function sweep(f1, f2, dur, type = 'sine', gain = 0.2, delay = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(f1, ctx.currentTime + delay);
    osc.frequency.linearRampToValueAtTime(f2, ctx.currentTime + delay + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  } catch {}
}

function chord(notes, dur, type = 'sine', gain = 0.12, startDelay = 0) {
  notes.forEach(f => tone(f, dur, type, gain, startDelay));
}

// ─── SOUND PACKS ─────────────────────────────────────────────────────────────

const SOUNDS = {
  classic: {
    move()     { tone(440, 0.09, 'square', 0.14); },
    capture()  { tone(220, 0.07, 'square', 0.18); tone(170, 0.12, 'sawtooth', 0.14, 0.06); },
    check()    { tone(600, 0.1, 'sine', 0.28); tone(800, 0.15, 'sine', 0.22, 0.1); },
    select()   { tone(660, 0.07, 'sine', 0.1); },
    castle()   { tone(330, 0.06, 'square', 0.14); tone(440, 0.09, 'square', 0.14, 0.06); },
    promotion(){ [523,659,784,1047].forEach((f,i) => tone(f, 0.25, 'sine', 0.2, i*0.12)); },
    win()      { [523,659,784,1047].forEach((f,i) => tone(f, 0.32, 'sine', 0.22, i*0.15)); setTimeout(() => chord([523,659,784], 0.8, 'sine', 0.12), 700); },
    loss()     { tone(392,0.22,'sine',0.18); tone(350,0.22,'sine',0.16,0.22); tone(294,0.4,'sine',0.18,0.44); },
    draw()     { chord([440,554,659], 0.4); },
    brilliant(){ [784,988,1175,1568].forEach((f,i) => tone(f, 0.2, 'sine', 0.18, i*0.1)); },
    mistake()  { tone(300, 0.15, 'sawtooth', 0.14); tone(250, 0.2, 'sawtooth', 0.11, 0.1); },
    blunder()  { [200,160,130].forEach((f,i) => tone(f, 0.12, 'sawtooth', 0.18, i*0.11)); },
    click()    { tone(800, 0.04, 'sine', 0.08); },
    tick()     { tone(1200, 0.04, 'sine', 0.06); },
    lowTime()  { tone(880, 0.08, 'square', 0.2); tone(880, 0.08, 'square', 0.2, 0.18); },
  },

  epic: {
    move() { tone(200, 0.12, 'triangle', 0.15); tone(280, 0.08, 'sine', 0.1, 0.04); },
    capture() { sweep(400, 150, 0.18, 'sawtooth', 0.25); tone(100, 0.3, 'sine', 0.2, 0.05); chord([200,267,400], 0.2, 'sawtooth', 0.08, 0.1); },
    check() { tone(523,0.1,'square',0.22); tone(659,0.1,'square',0.2,0.1); tone(784,0.2,'sawtooth',0.18,0.2); chord([523,659,784],0.4,'sine',0.1,0.3); },
    select() { tone(440, 0.06, 'triangle', 0.12); tone(554, 0.08, 'sine', 0.08, 0.05); },
    castle() { [196,247,294,370].forEach((f,i) => tone(f, 0.2, 'triangle', 0.15, i*0.08)); },
    promotion() { const m=[523,659,784,1047,1319,1047,784]; m.forEach((f,i)=>tone(f,0.18,'sine',0.22,i*0.1)); chord([523,659,784],0.8,'sine',0.15,m.length*0.1); },
    win() { const f=[523,523,523,415,466,523,415,466,523]; f.forEach((v,i)=>tone(v,0.2,'triangle',0.2,i*0.12)); [262,330,392].forEach((v,i)=>tone(v,1.5,'sine',0.1,f.length*0.12+i*0.02)); },
    loss() { sweep(400,200,0.4,'sine',0.2); sweep(300,150,0.5,'sine',0.15,0.4); tone(100,0.8,'sine',0.2,0.8); },
    draw() { chord([392,494,587],0.3,'sine',0.15); chord([392,494,587],0.5,'sine',0.1,0.35); },
    brilliant() { [523,659,784,1047,1319,1047,1568].forEach((f,i)=>tone(f,0.15,'sine',0.22,i*0.08)); },
    mistake() { sweep(300,200,0.25,'sawtooth',0.18); tone(150,0.2,'sine',0.12,0.2); },
    blunder() { sweep(500,80,0.5,'sawtooth',0.25); chord([100,133,200],0.4,'sawtooth',0.1,0.3); },
    click()   { tone(660, 0.05, 'triangle', 0.1); },
    tick()    { tone(1100, 0.05, 'triangle', 0.08); },
    lowTime() { tone(523,0.08,'square',0.22); tone(523,0.08,'square',0.22,0.2); },
  },

  arcade: {
    move()     { tone(300,0.06,'square',0.16); tone(400,0.06,'square',0.12,0.04); },
    capture()  { sweep(600,100,0.15,'square',0.22); tone(80,0.15,'square',0.2,0.1); },
    check()    { [800,800,1000,800].forEach((f,i)=>tone(f,0.1,'square',0.2,i*0.08)); },
    select()   { tone(700, 0.05, 'square', 0.12); },
    castle()   { [400,500,600,700].forEach((f,i)=>tone(f,0.07,'square',0.15,i*0.06)); },
    promotion(){ [400,500,600,800,1000,800,600].forEach((f,i)=>tone(f,0.08,'square',0.18,i*0.07)); },
    win()      { const m=[523,523,523,784,784,784,523,784,1047]; m.forEach((f,i)=>tone(f,0.12,'square',0.18,i*0.1)); },
    loss()     { [400,350,300,250,200].forEach((f,i)=>tone(f,0.1,'square',0.18,i*0.1)); },
    draw()     { chord([400,500,600],0.3,'square',0.12); },
    brilliant(){ [600,700,800,1000,1200].forEach((f,i)=>tone(f,0.08,'square',0.18,i*0.06)); },
    mistake()  { sweep(400,200,0.2,'square',0.2); },
    blunder()  { [400,300,200,100].forEach((f,i)=>tone(f,0.1,'square',0.2,i*0.08)); },
    click()    { tone(1000, 0.03, 'square', 0.1); },
    tick()     { tone(1400, 0.04, 'square', 0.08); },
    lowTime()  { tone(1200,0.06,'square',0.2); tone(1000,0.06,'square',0.2,0.14); },
  },

  zen: {
    move()     { tone(528,0.4,'sine',0.12,0,0.02,0.4); tone(660,0.3,'sine',0.06,0.05,0.02,0.3); },
    capture()  { chord([264,330,396],0.5,'sine',0.1); },
    check()    { tone(528,0.15,'sine',0.18); tone(660,0.5,'sine',0.14,0.12); tone(792,0.4,'sine',0.1,0.3); },
    select()   { tone(880,0.2,'sine',0.08,0,0.01,0.2); },
    castle()   { chord([264,330,396,528],0.6,'sine',0.08); },
    promotion(){ [396,528,660,792,1056].forEach((f,i)=>tone(f,0.5,'sine',0.1,i*0.15,0.02,0.5)); },
    win()      { [528,660,792,1056,1320,1056,792].forEach((f,i)=>tone(f,0.6,'sine',0.14,i*0.18,0.02,0.6)); },
    loss()     { tone(396,0.8,'sine',0.1,0,0.05,0.8); tone(330,0.8,'sine',0.08,0.6,0.05,0.8); },
    draw()     { chord([396,528,660],0.8,'sine',0.1); },
    brilliant(){ [528,660,792,1056].forEach((f,i)=>tone(f,0.7,'sine',0.12,i*0.15,0.02,0.7)); },
    mistake()  { tone(264,0.5,'sine',0.1,0,0.02,0.5); },
    blunder()  { tone(220,0.7,'sine',0.12,0,0.02,0.7); tone(196,0.6,'sine',0.1,0.5,0.02,0.6); },
    click()    { tone(1056,0.15,'sine',0.08,0,0.01,0.15); },
    tick()     { tone(1320,0.1,'sine',0.07,0,0.01,0.1); },
    lowTime()  { tone(660,0.15,'sine',0.14); tone(528,0.15,'sine',0.12,0.22); },
  },
};

function play(action) {
  try { (SOUNDS[currentTheme] || SOUNDS.classic)[action]?.(); } catch {}
}

export const Sounds = {
  move()      { play('move'); },
  capture()   { play('capture'); },
  check()     { play('check'); },
  select()    { play('select'); },
  castle()    { play('castle'); },
  promotion() { play('promotion'); },
  win()       { play('win'); },
  loss()      { play('loss'); },
  draw()      { play('draw'); },
  brilliant() { play('brilliant'); },
  mistake()   { play('mistake'); },
  blunder()   { play('blunder'); },
  click()     { play('click'); },
  tick()      { play('tick'); },
  lowTime()   { play('lowTime'); },
};

// ─── SPEECH SYNTHESIS ────────────────────────────────────────────────────────

let speechEnabled = true;
export function setSpeechEnabled(v) {
  speechEnabled = v;
  if (!v) window.speechSynthesis?.cancel();
}

function bestVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const preferred = ['Samantha','Karen','Moira','Tessa','Google US English','Google UK English Female','Microsoft Zira','Microsoft Aria'];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang?.startsWith('en')) || voices[0] || null;
}

export function speak(text, { pitch = 1.2, rate = 0.95, volume = 0.9 } = {}) {
  if (!speechEnabled || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = bestVoice();
    if (v) u.voice = v;
    u.pitch = pitch; u.rate = rate; u.volume = volume;
    window.speechSynthesis.speak(u);
  } catch {}
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const CoachVoice = {
  gameStart(name) { speak(`Let's go! You're playing against ${name}. Good luck, champion!`, { pitch: 1.3, rate: 1.0 }); },
  goodMove()   { speak(pick(['Nice move!','Well played!','Good thinking!','Smart move!']), { pitch: 1.3 }); },
  greatMove()  { speak(pick(['Excellent!','Brilliant move!','Wow, great thinking!','Super move!']), { pitch: 1.4 }); },
  mistake()    { speak(pick(['Careful! Check your pieces.','Think again next time.','Can they take your piece for free?']), { pitch: 1.1, rate: 0.9 }); },
  blunder()    { speak(pick(['Oops! A piece was left unprotected!','Watch out — free piece for them!','Blunder! Always check safety first.']), { pitch: 1.0, rate: 0.9 }); },
  check()      { speak('Check! Your king is in danger!', { pitch: 1.4, rate: 1.1 }); },
  win()        { speak(pick(["Amazing! You won! You're a chess champion!","Incredible! Checkmate! You're awesome!","You did it! Fantastic game!"]), { pitch: 1.4 }); },
  loss()       { speak(pick(["Good game! Every loss teaches you something. Try again!","Don't give up! You'll get it next time!","Well played! That's how champions learn!"]), { pitch: 1.1, rate: 0.95 }); },
  promotion()  { speak("Pawn promotion! Your pawn became a queen!", { pitch: 1.4 }); },
  castle()     { speak("Nice castling! Your king is safer now!", { pitch: 1.3 }); },
  ratingUp(r)  { speak(`Your rating went up to ${r}! Keep it up!`, { pitch: 1.4 }); },
  ratingDown(r){ speak(`Your rating is now ${r}. Keep practicing and you'll bounce back!`, { pitch: 1.1 }); },
  lowTime()    { speak("Hurry! You're running low on time!", { pitch: 1.3, rate: 1.1 }); },
  timeout()    { speak("Time's up! The clock ran out.", { pitch: 1.1 }); },
  coachHint(text) { speak(text, { pitch: 1.2, rate: 0.88 }); },
};
