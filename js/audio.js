export class AudioEngine {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
        this.tearNode = null;
        this.tearGain = null;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playCrush() {
        if (!this.ctx) return;
        this.resume();
        // Generate a low, crunchy noise for crushing paper
        this.playNoise(0.4, 'lowpass', 800, 1.5);
    }

    startContinuousTear() {
        if (!this.ctx) return;
        this.resume();
        if (this.tearNode) return; // Already tearing
        
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.8; 
        }
        
        this.tearNode = this.ctx.createBufferSource();
        this.tearNode.buffer = buffer;
        this.tearNode.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2500; // High pitch rip sound
        
        this.tearGain = this.ctx.createGain();
        this.tearGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.tearGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05); // Fade in
        
        this.tearNode.connect(filter);
        filter.connect(this.tearGain);
        this.tearGain.connect(this.ctx.destination);
        
        this.tearNode.start();
    }
    
    stopContinuousTear() {
        if (!this.ctx || !this.tearNode) return;
        
        // Fade out quickly to avoid popping
        this.tearGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        
        const nodeToStop = this.tearNode;
        this.tearNode = null;
        
        setTimeout(() => {
            try {
                nodeToStop.stop();
            } catch(e) {}
        }, 150);
    }

    playNoise(duration, filterType, filterFreq, gainStart) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Brown noise approximation for crunch
            let white = Math.random() * 2 - 1;
            data[i] = (this.lastOut || 0) + (0.02 * white);
            data[i] /= 1.02;
            this.lastOut = data[i];
            data[i] *= 3.5; // Compensate gain
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        noiseSource.start();
    }
}
