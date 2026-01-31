
export class SoundManager {
    audioCtx = null;

    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
    }


    playTone(freq, type, duration, vol = 0.1) {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        };
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    };
    playMove() {
        this.playTone(300, 'sine', 0.1, 0.05);
    };
    playCoin() {
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'square', 0.2, 0.1), 50);
    };
    playAttack() {
        const duration = 0.1;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start();
    };
    playDamage() { this.playTone(100, 'sawtooth', 0.3, 0.2) };
    // playWin() {
        // [400, 500, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2, 0.1), i * 100));
    // };
    playLose() {
        [300, 200, 100].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.4, 0.2), i * 200));
    }
};

let soundManager;

export function getSoundManager() {
    if (!soundManager) {
        soundManager = new SoundManager();
    }
    return soundManager;
}

