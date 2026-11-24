const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const GAME_W = 1280, GAME_H = 720, MAX_LEVELS = 10;

let view = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
const inputs = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const keys = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const remoteInputs = { blueJump: false, blueLeft: false, blueAct: false };
let remoteJumpPulse = false;
const activePointers = new Map();

// ============================================================================
// ERWEITERTE PROZEDURALE SOUND-ENGINE (Web Audio API)
// ============================================================================
let audioCtx = null, soundOn = true;
let noiseBuffer = null;
let activeSoundNodes = 0;
const MAX_CONCURRENT_SOUNDS = 18;
const soundCooldowns = new Map();

function ensureAudio() {
    if (!soundOn) return null;
    try {
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (!noiseBuffer && audioCtx) {
            const sampleRate = audioCtx.sampleRate;
            const length = sampleRate * 1.5;
            noiseBuffer = audioCtx.createBuffer(1, length, sampleRate);
            const data = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.997 * b0 + white * 0.029;
                b1 = 0.985 * b1 + white * 0.032;
                b2 = 0.950 * b2 + white * 0.048;
                data[i] = (b0 + b1 + b2 + white * 0.18) * 0.55;
            }
        }
        return audioCtx;
    } catch (e) {
        return null;
    }
}

function canPlaySound(key, cooldownSec) {
    const now = performance.now() * 0.001;
    const last = soundCooldowns.get(key) || -999;
    if (now - last < cooldownSec) return false;
    soundCooldowns.set(key, now);
    return true;
}

function calcSpatialVol(x, y, maxDist = 850) {
    if (x === undefined || y === undefined) return 1;
    const dist = Math.hypot(x - player.x, y - player.y);
    if (dist >= maxDist) return 0;
    const norm = 1 - dist / maxDist;
    return norm * norm;
}

function playTone(freq, type, dur, vol = 0.1, slide = null, delay = 0) {
    const ctxAudio = ensureAudio();
    if (!ctxAudio || activeSoundNodes >= MAX_CONCURRENT_SOUNDS) return;
    try {
        const now = ctxAudio.currentTime + delay;
        const osc = ctxAudio.createOscillator();
        const g = ctxAudio.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, freq), now);
        if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), now + dur);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + Math.min(0.012, dur * 0.25));
        g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        osc.connect(g);
        g.connect(ctxAudio.destination);
        activeSoundNodes++;
        osc.onended = () => { activeSoundNodes = Math.max(0, activeSoundNodes - 1); };
        osc.start(now);
        osc.stop(now + dur + 0.015);
    } catch (e) {}
}

function playNoise(dur, vol = 0.08, filterType = 'bandpass', freqStart = 800, freqEnd = null, q = 1.2, delay = 0) {
    const ctxAudio = ensureAudio();
    if (!ctxAudio || !noiseBuffer || activeSoundNodes >= MAX_CONCURRENT_SOUNDS) return;
    try {
        const now = ctxAudio.currentTime + delay;
        const src = ctxAudio.createBufferSource();
        src.buffer = noiseBuffer;
        const filter = ctxAudio.createBiquadFilter();
        filter.type = filterType;
        filter.Q.setValueAtTime(q, now);
        filter.frequency.setValueAtTime(Math.max(30, freqStart), now);
        if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + dur);
        const g = ctxAudio.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + Math.min(0.015, dur * 0.25));
        g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(ctxAudio.destination);
        activeSoundNodes++;
        src.onended = () => { activeSoundNodes = Math.max(0, activeSoundNodes - 1); };
        const maxOffset = Math.max(0, noiseBuffer.duration - dur - 0.05);
        src.start(now, Math.random() * maxOffset, dur + 0.02);
    } catch (e) {}
}

function playFormantGrowl(freqStart, freqEnd, dur, vol = 0.09) {
    const ctxAudio = ensureAudio();
    if (!ctxAudio || activeSoundNodes >= MAX_CONCURRENT_SOUNDS) return;
    try {
        const now = ctxAudio.currentTime;
        const osc = ctxAudio.createOscillator();
        const filter = ctxAudio.createBiquadFilter();
        const g = ctxAudio.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(340, now);
        filter.frequency.exponentialRampToValueAtTime(210, now + dur);
        filter.Q.setValueAtTime(3.2, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        osc.connect(filter);
        filter.connect(g);
        g.connect(ctxAudio.destination);
        activeSoundNodes++;
        osc.onended = () => { activeSoundNodes = Math.max(0, activeSoundNodes - 1); };
        osc.start(now);
        osc.stop(now + dur + 0.02);
    } catch (e) {}
}

function playSound(name, opts = {}) {
    if (!soundOn) return;
    const spatial = (opts.x !== undefined && opts.y !== undefined)
        ? calcSpatialVol(opts.x, opts.y, opts.maxDist || 850)
        : 1;
    if (spatial <= 0.02) return;
    const v = (opts.vol || 1) * spatial;

    switch (name) {
        // --- SPIELER-AKTIONEN ---
        case 'jump':
            playTone(300, 'sine', 0.16, 0.12 * v, 580);
            playTone(450, 'triangle', 0.10, 0.05 * v, 720, 0.02);
            break;
        case 'land': {
            const impact = Math.min(1, Math.max(0.25, (opts.speed || 250) / 550));
            if (opts.curled) {
                playTone(155, 'triangle', 0.12, 0.13 * impact * v, 58);
                playNoise(0.08, 0.06 * impact * v, 'lowpass', 420, 140);
            } else {
                playTone(190, 'sine', 0.08, 0.08 * impact * v, 85);
            }
            break;
        }
        case 'curlIn':
            if (!canPlaySound('curlIn', 0.08)) return;
            playTone(230, 'triangle', 0.09, 0.08 * v, 470);
            playNoise(0.06, 0.035 * v, 'bandpass', 1200, 2200, 2.0);
            break;
        case 'curlOut':
            if (!canPlaySound('curlOut', 0.08)) return;
            playTone(430, 'triangle', 0.09, 0.07 * v, 220);
            break;
        case 'rollTick':
            if (!canPlaySound('rollTick', 0.075)) return;
            playNoise(0.045, 0.03 * v, 'bandpass', 520, 340, 2.2);
            playTone(115, 'sine', 0.04, 0.025 * v, 85);
            break;
        case 'aimStart':
            playTone(440, 'sine', 0.08, 0.085 * v, 520);
            break;
        case 'aimLock':
            playTone(560, 'triangle', 0.09, 0.10 * v, 680);
            playTone(840, 'sine', 0.07, 0.06 * v, 920, 0.02);
            break;
        case 'chargeTick': {
            const c = opts.charge || 0.2;
            const pitch = 360 + c * 460;
            playTone(pitch, 'sine', 0.06, 0.065 * v, pitch * 1.15);
            break;
        }
        case 'catapultLaunch':
            playTone(240, 'triangle', 0.26, 0.16 * v, 740);
            playTone(360, 'sine', 0.22, 0.09 * v, 920, 0.02);
            playNoise(0.22, 0.10 * v, 'bandpass', 600, 2400, 1.4);
            break;
        case 'hurt':
            playTone(980, 'sine', 0.06, 0.09 * v, 520, 0.00);
            playTone(659.25, 'triangle', 0.11, 0.14 * v, null, 0.00);
            playTone(523.25, 'triangle', 0.11, 0.14 * v, null, 0.08);
            playTone(392.00, 'triangle', 0.22, 0.15 * v, 329.63, 0.16);
            playTone(783.99, 'sine', 0.18, 0.05 * v, 659.25, 0.16);
            break;
        case 'hazardHit':
            playTone(880, 'triangle', 0.07, 0.08 * v, 587.33);
            break;

        // --- GEGNER-SOUNDS ---
        case 'zombieAggro':
            if (!canPlaySound('zombieAggro_' + (opts.id || 0), 2.2)) return;
            playFormantGrowl(155, 92, 0.36, 0.11 * v);
            playTone(78, 'triangle', 0.32, 0.07 * v, 58);
            break;
        case 'zombieStep':
            if (!canPlaySound('zombieStep_' + (opts.id || 0), 0.55)) return;
            playNoise(0.07, 0.038 * v, 'lowpass', 360, 160);
            if (Math.random() < 0.22) {
                playFormantGrowl(125, 88, 0.24, 0.055 * v);
            }
            break;
        case 'zombieDefeat':
            playTone(205, 'square', 0.22, 0.14 * v, 62);
            playFormantGrowl(190, 65, 0.26, 0.10 * v);
            playNoise(0.15, 0.09 * v, 'bandpass', 650, 220, 1.5);
            break;
        case 'waspBuzz':
            if (!canPlaySound('waspBuzz_' + (opts.id || 0), 0.24)) return;
            playTone(215 + Math.random() * 25, 'sawtooth', 0.14, 0.045 * v, 185);
            playTone(435, 'triangle', 0.12, 0.025 * v, 390);
            break;
        case 'waspDefeat':
            playTone(620, 'sawtooth', 0.24, 0.14 * v, 110);
            playTone(310, 'square', 0.18, 0.09 * v, 75, 0.03);
            playNoise(0.12, 0.08 * v, 'bandpass', 1400, 400);
            break;
        case 'beetleStep':
            if (!canPlaySound('beetleStep_' + (opts.id || 0), 0.28)) return;
            playTone(760, 'triangle', 0.03, 0.032 * v, 520);
            playTone(880, 'triangle', 0.03, 0.028 * v, 600, 0.055);
            break;
        case 'beetleShield':
            if (!canPlaySound('beetleShield', 0.12)) return;
            playTone(920, 'triangle', 0.18, 0.13 * v, 760);
            playTone(1480, 'sine', 0.22, 0.09 * v, 1320);
            playTone(2240, 'sine', 0.15, 0.05 * v, 1980);
            playTone(170, 'square', 0.08, 0.08 * v, 90);
            break;
        case 'beetleDefeat':
            playTone(260, 'square', 0.16, 0.13 * v, 95);
            playTone(480, 'triangle', 0.14, 0.10 * v, 720, 0.03);
            playNoise(0.12, 0.08 * v, 'bandpass', 1100, 450);
            break;

        // --- ELEMENTE & MECHANIKEN ---
        case 'mushroomBounce':
            playTone(260, 'sine', 0.24, 0.15 * v, 780);
            playTone(390, 'triangle', 0.20, 0.09 * v, 960, 0.015);
            break;
        case 'breakWall':
            playTone(135, 'square', 0.22, 0.14 * v, 48);
            playTone(95, 'sawtooth', 0.26, 0.12 * v, 38, 0.02);
            playNoise(0.28, 0.15 * v, 'bandpass', 580, 160, 0.9);
            playNoise(0.18, 0.09 * v, 'highpass', 1200, 500, 1.0, 0.04);
            break;
        case 'breakGlass':
            playTone(2200, 'sine', 0.14, 0.10 * v, 1450);
            playTone(3150, 'triangle', 0.16, 0.08 * v, 1900, 0.015);
            playTone(2680, 'sine', 0.18, 0.07 * v, 1200, 0.035);
            playNoise(0.20, 0.13 * v, 'highpass', 2400, 1400, 1.1);
            break;
        case 'mossCrack':
            if (!canPlaySound('mossCrack_' + (opts.id || 0), 0.18)) return;
            playTone(280, 'triangle', 0.11, 0.09 * v, 175);
            playNoise(0.12, 0.07 * v, 'bandpass', 950, 480, 2.2);
            break;
        case 'mossCrumble':
            if (!canPlaySound('mossCrumble_' + (opts.id || 0), 0.22)) return;
            playNoise(0.08, 0.045 * v, 'bandpass', 1100, 620, 2.5);
            break;
        case 'mossFall':
            playTone(145, 'sawtooth', 0.22, 0.13 * v, 55);
            playNoise(0.24, 0.12 * v, 'lowpass', 680, 170);
            break;
        case 'ropeCut':
            playTone(660, 'sawtooth', 0.16, 0.14 * v, 190);
            playTone(980, 'triangle', 0.09, 0.09 * v, 340);
            playNoise(0.09, 0.08 * v, 'highpass', 1900, 800);
            break;
        case 'bridgeLand':
            playTone(130, 'square', 0.18, 0.15 * v, 52);
            playTone(88, 'sine', 0.22, 0.14 * v, 42);
            playNoise(0.16, 0.11 * v, 'lowpass', 480, 120);
            break;
        case 'buttonPress':
            playTone(500, 'sine', 0.12, 0.11 * v, 760);
            playTone(760, 'triangle', 0.10, 0.07 * v, 920, 0.04);
            break;
        case 'buttonRelease':
            if (!canPlaySound('buttonRelease', 0.12)) return;
            playTone(430, 'sine', 0.09, 0.06 * v, 290);
            break;
        case 'gateMove':
            if (!canPlaySound('gateMove_' + (opts.id || 0), 0.14)) return;
            playTone(105, 'sawtooth', 0.11, 0.045 * v, 92);
            playNoise(0.10, 0.035 * v, 'bandpass', 380, 290, 2.0);
            break;
        case 'windWhoosh':
            if (!canPlaySound('windWhoosh', 0.22)) return;
            playNoise(0.28, (opts.updraft ? 0.075 : 0.05) * v, 'bandpass', opts.updraft ? 520 : 380, opts.updraft ? 880 : 480, 1.8);
            break;
        case 'magnetPull':
            if (!canPlaySound('magnetPull', 0.16)) return;
            playTone(110, 'sine', 0.17, 0.065 * v, 145);
            playTone(220, 'triangle', 0.15, 0.045 * v, 290);
            break;
        case 'colorActivate': {
            if (!canPlaySound('colorAct_' + opts.color, 0.10)) return;
            const isRed = opts.color === 'red';
            playTone(isRed ? 330 : 392, 'sine', 0.12, 0.075 * v, isRed ? 495 : 588);
            playTone(isRed ? 495 : 588, 'triangle', 0.10, 0.045 * v, isRed ? 660 : 784, 0.02);
            break;
        }
        case 'colorDeactivate': {
            if (!canPlaySound('colorDeact_' + opts.color, 0.10)) return;
            const isRed = opts.color === 'red';
            playTone(isRed ? 440 : 520, 'sine', 0.09, 0.045 * v, isRed ? 290 : 340);
            break;
        }
        case 'laserBuzz':
            if (!canPlaySound('laserBuzz', 0.24)) return;
            playTone(120, 'sawtooth', 0.14, 0.032 * v, 114);
            playTone(240, 'square', 0.10, 0.018 * v, 232);
            break;
        case 'boxPush':
            if (!canPlaySound('boxPush', 0.16)) return;
            playNoise(0.12, 0.045 * v, 'lowpass', 320, 190);
            playTone(92, 'triangle', 0.10, 0.035 * v, 76);
            break;
        case 'boxLand':
            if (!canPlaySound('boxLand', 0.10)) return;
            playTone(150, 'triangle', 0.12, 0.10 * v, 62);
            playNoise(0.09, 0.07 * v, 'lowpass', 420, 140);
            break;
        case 'seesawCreak':
            if (!canPlaySound('seesawCreak', 0.24)) return;
            playTone(210, 'sawtooth', 0.14, 0.045 * v, 165);
            break;
        case 'rampBoost':
            if (!canPlaySound('rampBoost', 0.18)) return;
            playTone(260, 'sine', 0.15, 0.055 * v, 440);
            break;

        // --- LEVEL & UI ---
        case 'levelWin':
            playTone(523.25, 'triangle', 0.14, 0.13 * v, null, 0.00);
            playTone(659.25, 'triangle', 0.14, 0.13 * v, null, 0.09);
            playTone(783.99, 'triangle', 0.16, 0.14 * v, null, 0.18);
            playTone(1046.50, 'triangle', 0.34, 0.16 * v, 1080, 0.27);
            break;
        case 'gameWin':
            playTone(523.25, 'triangle', 0.13, 0.14 * v, null, 0.00);
            playTone(659.25, 'triangle', 0.13, 0.14 * v, null, 0.09);
            playTone(783.99, 'triangle', 0.13, 0.14 * v, null, 0.18);
            playTone(1046.50, 'triangle', 0.22, 0.16 * v, null, 0.27);
            playTone(880.00, 'triangle', 0.14, 0.14 * v, null, 0.44);
            playTone(1046.50, 'triangle', 0.45, 0.18 * v, 1100, 0.56);
            break;
        case 'gameOver':
            playTone(659.25, 'triangle', 0.14, 0.13 * v, null, 0.00);
            playTone(587.33, 'triangle', 0.14, 0.13 * v, null, 0.12);
            playTone(523.25, 'triangle', 0.16, 0.14 * v, null, 0.24);
            playTone(392.00, 'triangle', 0.36, 0.15 * v, 329.63, 0.36);
            playTone(783.99, 'sine', 0.30, 0.05 * v, 659.25, 0.36);
            break;
        case 'soundToggle':
            playTone(587.33, 'sine', 0.09, 0.10 * v, 880);
            break;
    }
}

const state = { difficulty: 'medium', levelIndex: 0, levelSeed: (Math.random() * 1e9) | 0, hearts: 5, camX: 0, won: false, gameOver: false, resetSeq: 0, redActHeld: false, blueActHeld: false, prevRedActHeld: false, prevBlueActHeld: false, minX: 40, maxX: 2120, enemiesDefeated: 0, elapsedTime: 0, maxCatapultJump: 0 };
const player = { x: 140, y: 380, vx: 0, vy: 0, r: 24, grounded: false, curled: false, wasCurled: false, rot: 0, facing: 1, aimState: 0, aimAngle: 0.78, aimDir: 1, slingshotCharge: 0, lastChargeStep: 0, rollDistAccum: 0, catapultFlight: false, catapultStartX: null, invuln: 0, wasJumpPressed: false };
let platforms = [], boxes = [], buttons = [], gates = [], breakables = [], winds = [], hazards = [], zombies = [], mushrooms = [], ramps = [], seesaws = [], goalX = 2000;
let colorPlatforms = [], ropeBridges = [], wasps = [], beetles = [], magnetBlocks = [], colorLasers = [], mossPlatforms = [];

function hurtPlayer(cause = 'generic') {
    if (player.invuln > 0) return;
    player.catapultStartX = null;
    state.hearts--;
    player.invuln = 1.4;
    if (state.hearts <= 0) {
        state.hearts = 0;
        state.gameOver = true;
        playSound('gameOver');
        return;
    }
    if (cause === 'hazard') playSound('hazardHit');
    playSound('hurt');
    loadLevel(state.levelIndex, false);
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isColorPlatformActive(cp) {
    return cp.color === 'red' ? state.redActHeld : state.blueActHeld;
}

function isColorActive(color) {
    if (!color) return true;
    return color === 'red' ? state.redActHeld : state.blueActHeld;
}
