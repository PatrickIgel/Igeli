const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const GAME_W = 1280, GAME_H = 720, MAX_LEVELS = 10;

let view = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
const inputs = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const keys = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const remoteInputs = { blueJump: false, blueLeft: false, blueAct: false };
let remoteJumpPulse = false;
const activePointers = new Map();

let audioCtx = null, soundOn = true;
function playTone(freq, type, dur, vol = 0.1, slide = null) {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime, osc = audioCtx.createOscillator(), g = audioCtx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, now);
        if (slide) osc.frequency.exponentialRampToValueAtTime(slide, now + dur);
        g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + dur);
    } catch (e) {}
}

const state = { levelIndex: 0, levelSeed: (Math.random() * 1e9) | 0, hearts: 5, camX: 0, won: false, gameOver: false, resetSeq: 0, redActHeld: false, blueActHeld: false };
const player = { x: 140, y: 380, vx: 0, vy: 0, r: 24, grounded: false, curled: false, rot: 0, facing: 1, aimState: 0, aimAngle: 0.78, aimDir: 1, slingshotCharge: 0, catapultFlight: false, invuln: 0, wasJumpPressed: false };
let platforms = [], boxes = [], buttons = [], gates = [], breakables = [], winds = [], hazards = [], zombies = [], mushrooms = [], ramps = [], seesaws = [], goalX = 2000;
let colorPlatforms = [], ropeBridges = [], wasps = [], beetles = [];

function hurtPlayer() {
    if (player.invuln > 0) return;
    state.hearts--;
    player.invuln = 1.4;
    playTone(160, 'sawtooth', 0.3, 0.16, 70);
    if (state.hearts <= 0) {
        state.hearts = 0;
        state.gameOver = true;
        return;
    }
    loadLevel(state.levelIndex, false);
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isColorPlatformActive(cp) {
    return cp.color === 'red' ? state.redActHeld : state.blueActHeld;
}
