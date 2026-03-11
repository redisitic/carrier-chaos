import { useEffect, useRef, useState } from "react";

// Web Audio API Synthesizer for retro sounds without external assets
class SoundSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    play(sound) {
        if (this.ctx.state === "suspended") this.ctx.resume();

        switch (sound) {
            case "dispatch": // Rising tone
                this.playTone(300, "square", 0.1, 0.05);
                setTimeout(() => this.playTone(400, "square", 0.15, 0.05), 100);
                break;
            case "delivered": // Happy chime
                this.playTone(523.25, "sine", 0.1, 0.1); // C5
                setTimeout(() => this.playTone(659.25, "sine", 0.2, 0.1), 100); // E5
                break;
            case "anomaly": // Warning buzz
                this.playTone(150, "sawtooth", 0.3, 0.1);
                setTimeout(() => this.playTone(120, "sawtooth", 0.4, 0.1), 150);
                break;
            case "gameover": // Sad descent
                this.playTone(300, "triangle", 0.2, 0.1);
                setTimeout(() => this.playTone(250, "triangle", 0.2, 0.1), 200);
                setTimeout(() => this.playTone(200, "triangle", 0.4, 0.1), 400);
                break;
            case "win": // Triumphant
                this.playTone(400, "sine", 0.1, 0.1);
                setTimeout(() => this.playTone(500, "sine", 0.1, 0.1), 100);
                setTimeout(() => this.playTone(600, "sine", 0.3, 0.1), 200);
                break;
            default:
                this.playTone(440, "sine", 0.1);
        }
    }

    setMuted(muted) {
        this.muted = muted;
    }
}

// Singleton synth instance
export const synth = new SoundSynth();

const listeners = new Set();
let globalMuted = false;

function setGlobalMuted(val) {
    globalMuted = val;
    synth.setMuted(val);
    listeners.forEach(l => l(val));
}

export function useAudio() {
    const [muted, setMuted] = useState(globalMuted);

    useEffect(() => {
        listeners.add(setMuted);
        return () => listeners.delete(setMuted);
    }, []);

    return {
        play: (sound) => synth.play(sound),
        muted,
        toggleMute: () => setGlobalMuted(!globalMuted),
    };
}
