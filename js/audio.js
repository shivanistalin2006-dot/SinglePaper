// Web Audio API Synthesis for Paper Tear, Crush Effects & Procedural Ambient Music

let audioCtx = null;

export function getAudioContext() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported:", e);
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playCrushSound() {
    const ac = getAudioContext();
    if (!ac) return;

    const buf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 4;
    }

    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.8, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.5);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
}

let tearSoundNode = null;
let tearGainNode = null;

export function startTearSound() {
    const ac = getAudioContext();
    if (!ac || tearSoundNode) return;

    const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    tearSoundNode = ac.createBufferSource();
    tearSoundNode.buffer = buf;
    tearSoundNode.loop = true;

    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2800;

    tearGainNode = ac.createGain();
    tearGainNode.gain.setValueAtTime(0, ac.currentTime);
    tearGainNode.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.05);

    tearSoundNode.connect(filter);
    filter.connect(tearGainNode);
    tearGainNode.connect(ac.destination);
    tearSoundNode.start();
}

export function stopTearSound() {
    if (!tearSoundNode) return;
    try {
        if (audioCtx) {
            tearGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
        }
    } catch (e) {}

    const node = tearSoundNode;
    tearSoundNode = null;
    setTimeout(() => {
        try {
            node.stop();
        } catch (e) {}
    }, 100);
}

// ─── AMBIENT BACKGROUND MUSIC SYNTHESIZER ──────────────────
let isAmbientPlaying = false;
let ambientTimer = null;
let ambientGainNode = null;

// Soothing pentatonic frequencies (Hz) for relaxing paper background ambiance
const CHORD_FREQS = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25];

function playAmbientTone() {
    const ac = getAudioContext();
    if (!ac || !isAmbientPlaying) return;

    const freq = CHORD_FREQS[Math.floor(Math.random() * CHORD_FREQS.length)];
    const osc = ac.createOscillator();
    const noteGain = ac.createGain();
    const filter = ac.createBiquadFilter();

    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ac.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ac.currentTime);

    const now = ac.currentTime;
    const duration = 4 + Math.random() * 3;

    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(ambientGainNode);

    osc.start(now);
    osc.stop(now + duration);
}

export function startAmbientMusic() {
    const ac = getAudioContext();
    if (!ac) return;

    if (!ambientGainNode) {
        ambientGainNode = ac.createGain();
        ambientGainNode.gain.setValueAtTime(0.5, ac.currentTime);
        ambientGainNode.connect(ac.destination);
    }

    isAmbientPlaying = true;
    playAmbientTone();

    clearInterval(ambientTimer);
    ambientTimer = setInterval(() => {
        if (isAmbientPlaying) playAmbientTone();
    }, 2500);
}

export function stopAmbientMusic() {
    isAmbientPlaying = false;
    clearInterval(ambientTimer);
}

export function toggleAmbientMusic() {
    if (isAmbientPlaying) {
        stopAmbientMusic();
        return false;
    } else {
        startAmbientMusic();
        return true;
    }
}
