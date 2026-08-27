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
let masterVolume = 1.0;

export function setMasterVolume(vol) {
    masterVolume = Math.max(0, Math.min(1, vol));
}

export function playCrushSound() {
    const ac = getAudioContext();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();

    // Multi-burst paper crunch noise synthesis
    const now = ac.currentTime;
    for (let b = 0; b < 3; b++) {
        const offset = b * 0.08;
        const dur = 0.2 + Math.random() * 0.15;
        const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.04 * white) / 1.04;
            data[i] = last * (3 + b);
        }

        const src = ac.createBufferSource();
        src.buffer = buf;

        const filter = ac.createBiquadFilter();
        filter.type = b % 2 === 0 ? 'bandpass' : 'highpass';
        filter.frequency.setValueAtTime(1200 + b * 600, now + offset);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.7, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        src.start(now + offset);
    }
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
