const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const GAME_W = 1280, GAME_H = 720, MAX_LEVELS = 10;

let view = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 };
const inputs = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const keys = { redRight: false, redCurl: false, redAct: false, blueAct: false, blueJump: false, blueLeft: false };
const remoteInputs = { blueJump: false, blueLeft: false, blueAct: false };
let remoteJumpPulse = false;
const activePointers = new Map();

const controlButtons = [
    { id: 'redRight', x: 115,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'RECHTS', sub: 'Laufen' },
    { id: 'redCurl',  x: 245,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'KUGEL',  sub: 'Schwer/Anker' },
    { id: 'redAct',   x: 375,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'AKTIV',  sub: 'Rot-Schalter' },
    { id: 'blueAct',  x: 905,  y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'AKTIV',  sub: 'Blau-Schalter' },
    { id: 'blueJump', x: 1035, y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'SPRUNG', sub: 'Katapult' },
    { id: 'blueLeft', x: 1165, y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'LINKS',  sub: 'Laufen' }
];
const uiButtons = { resetRoom: { x: GAME_W / 2 - 90, y: GAME_H - 52, w: 180, h: 40 }, sound: { x: GAME_W - 68, y: 14, w: 52, h: 42 } };

function getVisibleControlButtons() {
    if (netMode === 'host') return controlButtons.filter(b => b.id.startsWith('red'));
    if (netMode === 'client') return controlButtons.filter(b => b.id.startsWith('blue'));
    return controlButtons;
}

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

function populateCoopExtras(idx) {
    if (colorPlatforms.length || ropeBridges.length || wasps.length || beetles.length) return;

    let s = ((state.levelSeed || 1) + (idx + 1) * 7919) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

    // 1. Farb-Plattformen & Wespen in breiten Abgründen (auf angepasste Sprungweite abgestimmt)
    for (let i = 0; i < platforms.length - 1; i++) {
        const p1 = platforms[i], p2 = platforms[i + 1];
        if (p1.y < 120 || p2.y < 120) continue; // Deckenwände ignorieren
        const gapStart = p1.x + p1.w, gapEnd = p2.x;
        const gap = gapEnd - gapStart;
        if (gap >= 145 && gap <= 340) {
            const midX = (gapStart + gapEnd) / 2;
            const midY = Math.min(p1.y, p2.y) - 10;
            if (gap >= 245) {
                colorPlatforms.push({ x: gapStart + gap * 0.28 - 50, y: midY, w: 100, h: 20, color: 'red' });
                colorPlatforms.push({ x: gapStart + gap * 0.72 - 50, y: midY - 14, w: 100, h: 20, color: 'blue' });
            } else {
                const col = (i + idx) % 2 === 0 ? 'red' : 'blue';
                colorPlatforms.push({ x: midX - 55, y: midY, w: 110, h: 20, color: col });
            }
            if (rnd() < 0.6) {
                wasps.push({ x: midX, y: midY - 88, baseX: midX, baseY: midY - 88, rangeX: Math.min(60, gap * 0.24), phase: rnd() * Math.PI * 2, dead: false });
            }
        }
    }

    // 2. Marienkäfer mit Schild unter Glasböden & auf breiten Plattformen
    for (const br of breakables) {
        if (br.type === 'floor' && br.w >= 70) {
            const below = platforms.find(p => p.y > 120 && br.x + br.w / 2 >= p.x + 20 && br.x + br.w / 2 <= p.x + p.w - 20 && p.y > br.y + 40 && p.y - br.y < 240);
            if (below) {
                beetles.push({ x: br.x + br.w / 2, y: below.y, dir: -1, dead: false });
            }
        }
    }
    for (const p of platforms) {
        if (p.y > 120 && p.w >= 360 && p.x > 420 && p.x + p.w < goalX - 220) {
            const hasHaz = hazards.some(h => h.x < p.x + p.w && h.x + h.w > p.x);
            const hasBeetle = beetles.some(b => Math.abs(b.y - p.y) < 10 && b.x >= p.x && b.x <= p.x + p.w);
            if (!hasHaz && !hasBeetle && rnd() < 0.5) {
                beetles.push({ x: p.x + p.w * 0.65, y: p.y, dir: -1, dead: false });
            }
        }
    }
}

const origLoadLevel = loadLevel;
loadLevel = function(idx, newSeed = false) {
    state.resetSeq = (state.resetSeq || 0) + 1;
    origLoadLevel(idx, newSeed);
    populateCoopExtras(idx);
};

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

function launchCatapult() {
    const power = 330 + player.slingshotCharge * 330;
    player.vx = player.facing * Math.cos(player.aimAngle) * power;
    player.vy = -Math.sin(player.aimAngle) * power * 1.15 - 120;
    player.grounded = false; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = true;
    playTone(260, 'triangle', 0.25, 0.16, 680);
}

function update(dt) {
    if (netMode === 'client') {
        state.blueActHeld = !!(inputs.blueAct || keys.blueAct);
        const f = Math.min(1, 20 * dt);
        if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
        if (netTarget) {
            player.x += (netTarget.px - player.x) * f;
            player.y += (netTarget.py - player.y) * f;
            player.rot += (netTarget.prot - player.rot) * f;
            state.camX += (netTarget.camX - state.camX) * f;
        }
        for (const b of boxes) if (b.tx !== undefined) { b.x += (b.tx - b.x) * f; b.y += (b.ty - b.y) * f; }
        for (const g of gates) if (g.tOpenH !== undefined) g.openH += (g.tOpenH - g.openH) * f;
        for (const z of zombies) if (z.tx !== undefined) { z.x += (z.tx - z.x) * f; z.y += (z.ty - z.y) * f; }
        for (const rb of ropeBridges) if (rb.ty !== undefined) rb.y += (rb.ty - rb.y) * f;
        for (const w of wasps) if (w.tx !== undefined) { w.x += (w.tx - w.x) * f; w.y += (w.ty - w.y) * f; }
        for (const bt of beetles) if (bt.tx !== undefined) { bt.x += (bt.tx - bt.x) * f; bt.y += (bt.ty - bt.y) * f; }
        for (const sw of seesaws) if (sw.tAngle !== undefined) sw.angle += (sw.tAngle - sw.angle) * f;
        for (const m of mushrooms) m.bounce = Math.max(0, m.bounce - dt * 4);
        return;
    }

    if (state.won || state.gameOver) return;
    if (player.invuln > 0) player.invuln -= dt;

    const left = netMode === 'host' ? remoteInputs.blueLeft : (inputs.blueLeft || keys.blueLeft);
    const right = inputs.redRight || keys.redRight;
    const curl = inputs.redCurl || keys.redCurl;
    const redAct = inputs.redAct || keys.redAct;
    const blueAct = netMode === 'host' ? remoteInputs.blueAct : (inputs.blueAct || keys.blueAct);
    const jump = netMode === 'host' ? (remoteInputs.blueJump || remoteJumpPulse) : (inputs.blueJump || keys.blueJump);

    state.redActHeld = !!redAct;
    state.blueActHeld = !!blueAct;

    const jumpJustPressed = jump && !player.wasJumpPressed;
    player.wasJumpPressed = jump;
    remoteJumpPulse = false;
    player.curled = curl;
    if (left && !right) player.facing = -1;
    if (right && !left) player.facing = 1;

    if (player.curled && player.grounded) {
        player.vx *= Math.pow(0.01, dt);
        if (player.aimState === 0) {
            player.slingshotCharge = 0;
            if (jumpJustPressed) { player.aimState = 1; player.aimAngle = 0.25; player.aimDir = 1; playTone(440, 'sine', 0.08, 0.08); }
        } else if (player.aimState === 1) {
            player.aimAngle += player.aimDir * dt * 1.45;
            if (player.aimAngle >= 1.45) { player.aimAngle = 1.45; player.aimDir = -1; }
            if (player.aimAngle <= 0.12) { player.aimAngle = 0.12; player.aimDir = 1; }
            if (jumpJustPressed) { player.aimState = 2; player.slingshotCharge = 0.05; playTone(560, 'sine', 0.1, 0.1); }
        } else if (player.aimState === 2) {
            if (jump) {
                player.slingshotCharge = Math.min(1.0, player.slingshotCharge + dt * 0.52);
                if (player.slingshotCharge >= 1.0) launchCatapult();
            } else if (player.slingshotCharge > 0.05) launchCatapult();
        }
    } else {
        player.slingshotCharge = 0; player.aimState = 0;
        if (player.grounded) player.catapultFlight = false;
        const moveSpeed = player.curled ? 125 : 175;
        let targetVx = (left ? -moveSpeed : 0) + (right ? moveSpeed : 0);
        if (!player.catapultFlight) player.vx += (targetVx - player.vx) * Math.min(1, 8 * dt);
        if (jumpJustPressed && player.grounded) {
            player.vy = -385; player.grounded = false;
            playTone(320, 'sine', 0.16, 0.12, 540);
        }
    }

    let inUpdraft = false;
    for (const w of winds) {
        if (!w.active) continue;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, w.x, w.y, w.w, w.h)) {
            if (w.vy < 0 && jump && !player.curled) {
                inUpdraft = true; player.catapultFlight = false;
                player.vy = Math.max(-290, player.vy - 1180 * dt);
            }
            if (w.vx !== 0 && !(player.curled && player.grounded)) {
                player.vx += (player.catapultFlight ? w.vx * 0.45 : w.vx * 3.8) * dt;
                if (!player.catapultFlight && w.vx < 0 && player.vx > -140) player.vx = -140;
            }
        }
    }

    // Zerbrechliche Ketten / Hängebrücken aktualisieren
    for (const rb of ropeBridges) {
        if (!rb.cut) {
            if ((player.catapultFlight || (!player.grounded && player.curled && Math.hypot(player.vx, player.vy) > 260)) &&
                rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, rb.ropeX - 12, rb.ropeY, 24, Math.max(12, rb.y - rb.ropeY))) {
                rb.cut = true;
                rb.vy = 40;
                playTone(520, 'sawtooth', 0.18, 0.15, 180);
            }
        } else if (!rb.settled) {
            rb.vy = Math.min(780, rb.vy + 980 * dt);
            rb.y += rb.vy * dt;
            if (rb.y >= rb.targetY) {
                rb.y = rb.targetY;
                rb.vy = 0;
                rb.settled = true;
                playTone(130, 'square', 0.16, 0.15, 65);
            }
        }
    }

    const grav = inUpdraft ? 0 : ((player.curled && !player.grounded) ? 1350 : 920);
    player.vy = Math.min(820, player.vy + grav * dt);
    player.x += player.vx * dt;
    if (player.x < 40) { player.x = 40; player.vx = 0; }

    for (const b of boxes) {
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, b.x, b.y, b.w, b.h) && player.y + player.r * 0.5 > b.y + 6) {
            b.x = player.x < b.x + b.w / 2 ? player.x + player.r : player.x - player.r - b.w;
        }
    }
    for (let i = breakables.length - 1; i >= 0; i--) {
        const br = breakables[i];
        if (br.type === 'wall' && rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, br.x, br.y, br.w, br.h)) {
            if (player.curled && Math.abs(player.vx) > 250) { breakables.splice(i, 1); playTone(140, 'square', 0.2, 0.15, 60); }
            else { player.x = player.vx > 0 ? br.x - player.r : br.x + br.w + player.r; player.vx = 0; }
        }
    }

    const solids = [...platforms];
    for (const g of gates) if (g.openH < g.h - 8) solids.push({ x: g.x, y: g.y, w: g.w, h: g.h - g.openH });
    for (const cp of colorPlatforms) if (isColorPlatformActive(cp)) solids.push({ x: cp.x, y: cp.y, w: cp.w, h: cp.h });
    for (const rb of ropeBridges) solids.push({ x: rb.x, y: rb.y, w: rb.w, h: rb.h });

    for (const s of solids) {
        if (rectOverlap(player.x - player.r, player.y - player.r + 4, player.r * 2, player.r * 2 - 8, s.x, s.y, s.w, s.h)) {
            if (player.vx > 0) player.x = s.x - player.r; else if (player.vx < 0) player.x = s.x + s.w + player.r;
            player.vx = 0;
        }
    }

    const prevVy = player.vy;
    player.y += player.vy * dt;
    player.grounded = false;

    // Glasböden: zerbrechen sofort, wenn man sich darauf einrollt oder eingerollt darauf landet
    for (let i = breakables.length - 1; i >= 0; i--) {
        const br = breakables[i];
        if (br.type === 'floor' && rectOverlap(player.x - player.r + 4, player.y - player.r, player.r * 2 - 8, player.r * 2 + 4, br.x, br.y, br.w, br.h)) {
            if (player.curled && player.y < br.y + 14) {
                breakables.splice(i, 1);
                player.grounded = false;
                playTone(130, 'sawtooth', 0.22, 0.16, 55);
            } else if (player.vy >= 0 && player.y - player.r < br.y) {
                player.y = br.y - player.r;
                player.vy = 0;
                player.grounded = true;
            }
        }
    }
    for (const s of [...solids, ...boxes]) {
        if (rectOverlap(player.x - player.r + 4, player.y - player.r, player.r * 2 - 8, player.r * 2, s.x, s.y, s.w, s.h)) {
            if (player.vy >= 0 && player.y < s.y + 18) { player.y = s.y - player.r; player.vy = 0; player.grounded = true; }
            else if (player.vy < 0 && player.y > s.y + s.h - 18) { player.y = s.y + s.h + player.r; player.vy = 0; }
        }
    }

    for (const rp of ramps) {
        if (player.x >= rp.x1 - 8 && player.x <= rp.x2 + 8) {
            const t = Math.max(0, Math.min(1, (player.x - rp.x1) / (rp.x2 - rp.x1)));
            const ry = rp.y1 + t * (rp.y2 - rp.y1);
            if (player.vy >= 0 && player.y + player.r >= ry - 6 && player.y - player.r < ry + 24) {
                player.y = ry - player.r; player.vy = 0; player.grounded = true;
                if (player.curled) { player.vx = Math.min(540, player.vx + 560 * dt); player.catapultFlight = true; }
            }
        }
    }
    for (const sw of seesaws) {
        let torque = 0;
        if (Math.abs(player.x - sw.cx) <= sw.halfW) {
            const sy = sw.cy + (player.x - sw.cx) * Math.tan(sw.angle);
            if (player.vy >= 0 && player.y + player.r >= sy - 10 && player.y - player.r < sy + 22) {
                player.y = sy - player.r; player.vy = 0; player.grounded = true;
                torque = ((player.x - sw.cx) / sw.halfW) * (player.curled ? 1.5 : 0.75);
            }
        }
        sw.angle += (Math.max(-0.28, Math.min(0.28, torque * 0.35 - 0.14)) - sw.angle) * Math.min(1, 5 * dt);
    }
    for (const m of mushrooms) {
        m.bounce = Math.max(0, m.bounce - dt * 4);
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, m.x, m.y, m.w, m.h) && player.vy >= 0) {
            player.y = m.y - player.r; player.vy = m.vy; player.grounded = false; m.bounce = 1; playTone(380, 'sine', 0.2, 0.15, 760);
        }
    }

    for (const b of boxes) {
        let boxFloat = false;
        for (const w of winds) if (w.active && w.vy < 0 && rectOverlap(b.x, b.y, b.w, b.h, w.x, w.y, w.w, w.h)) { b.vy = Math.max(-240, (b.vy || 0) - 1150 * dt); boxFloat = true; }
        if (!boxFloat) b.vy = Math.min(600, (b.vy || 0) + 900 * dt);
        b.y += b.vy * dt;
        for (const m of mushrooms) if (rectOverlap(b.x, b.y, b.w, b.h, m.x, m.y, m.w, m.h) && b.vy >= 0) { b.y = m.y - b.h; b.vy = m.vy * 0.92; m.bounce = 1; }
        for (const s of solids) {
            if (rectOverlap(b.x + 2, b.y, b.w - 4, b.h, s.x, s.y, s.w, s.h) && b.vy >= 0 && b.y + b.h - b.vy * dt <= s.y + 12) {
                b.y = s.y - b.h; b.vy = 0;
            }
        }
    }
    for (const btn of buttons) {
        let active = btn.sticky && btn.pressed;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2 + 4, btn.x, btn.y - 8, btn.w, btn.h + 8)) active = true;
        for (const b of boxes) if (rectOverlap(b.x, b.y, b.w, b.h + 4, btn.x, btn.y - 8, btn.w, btn.h + 8)) active = true;
        if (active && !btn.pressed) playTone(520, 'sine', 0.15, 0.12, 740);
        btn.pressed = active;
        if (btn.toggleWind) { for (const w of winds) if (w.id === btn.id) w.active = !btn.pressed; }
        else for (const g of gates) if (g.id === btn.id) g.openH += ((btn.pressed ? g.h - 14 : 0) - g.openH) * Math.min(1, 6 * dt);
    }

    if (player.y > GAME_H + 80) hurtPlayer();
    for (const h of hazards) {
        const covered = ropeBridges.some(rb => rb.settled && rectOverlap(h.x + 4, h.y - 18, h.w - 8, 22, rb.x, rb.y, rb.w, rb.h));
        if (!covered && rectOverlap(player.x - player.r + 6, player.y - player.r + 6, player.r * 2 - 12, player.r * 2 - 6, h.x, h.y, h.w, h.h)) hurtPlayer();
    }
    for (const z of zombies) {
        if (z.dead) continue;
        const chase = Math.abs(player.y - (z.y - 24)) < 75 && Math.abs(player.x - z.x) < 340;
        if (chase && Math.abs(player.x - z.x) > 8) z.dir = player.x < z.x ? -1 : 1;
        const nextX = z.x + z.dir * (chase ? 85 : 52) * dt;
        const lookX = nextX + z.dir * 16;
        const hasFloor = solids.some(s => lookX >= s.x && lookX <= s.x + s.w && Math.abs(s.y - z.y) < 10) ||
            breakables.some(br => br.type === 'floor' && lookX >= br.x && lookX <= br.x + br.w && Math.abs(br.y - z.y) < 10);
        const hitWall = solids.some(s => rectOverlap(nextX - 14, z.y - 46, 28, 40, s.x, s.y, s.w, s.h)) ||
            breakables.some(br => br.type === 'wall' && rectOverlap(nextX - 14, z.y - 46, 28, 40, br.x, br.y, br.w, br.h));
        if (hasFloor && !hitWall && nextX > 40) z.x = nextX; else z.dir *= -1;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, z.x - 18, z.y - 48, 36, 48)) {
            if (player.curled) { z.dead = true; if (player.vy > 0) player.vy = -300; playTone(190, 'square', 0.22, 0.16, 65); }
            else hurtPlayer();
        }
    }

    // Flug-Gegner (Wespen): nur durch gezielten Katapult-Schuss aus der Luft zu holen
    for (const w of wasps) {
        if (w.dead) continue;
        w.phase += dt * 2.0;
        w.x = w.baseX + Math.sin(w.phase) * w.rangeX;
        w.y = w.baseY + Math.sin(w.phase * 2) * 14;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, w.x - 20, w.y - 16, 40, 32)) {
            if (player.catapultFlight) {
                w.dead = true;
                player.vy = -300;
                playTone(250, 'square', 0.22, 0.16, 75);
            } else {
                hurtPlayer();
            }
        }
    }

    // Marienkäfer mit Schild: vorne durch Schild geschützt, nur von oben (Sprung/Glasboden) besiegbar
    for (const bt of beetles) {
        if (bt.dead) continue;
        const nextX = bt.x + bt.dir * 45 * dt;
        const lookX = nextX + bt.dir * 22;
        const hasFloor = solids.some(s => lookX >= s.x && lookX <= s.x + s.w && Math.abs(s.y - bt.y) < 10) ||
            breakables.some(br => br.type === 'floor' && lookX >= br.x && lookX <= br.x + br.w && Math.abs(br.y - bt.y) < 10);
        const hitWall = solids.some(s => rectOverlap(nextX - 18, bt.y - 36, 36, 32, s.x, s.y, s.w, s.h));
        if (hasFloor && !hitWall && nextX > 40) bt.x = nextX; else bt.dir *= -1;

        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, bt.x - 24, bt.y - 40, 48, 40)) {
            const fromAbove = prevVy >= 0 && (player.y + player.r - prevVy * dt) <= bt.y - 24;
            if (fromAbove) {
                bt.dead = true;
                player.vy = -330;
                playTone(210, 'square', 0.22, 0.16, 65);
            } else if (player.curled) {
                const pushDir = player.x < bt.x ? -1 : 1;
                player.x = bt.x + pushDir * (24 + player.r + 2);
                player.vx = pushDir * 220;
                playTone(300, 'triangle', 0.12, 0.14, 180);
            } else {
                hurtPlayer();
            }
        }
    }

    if (player.x >= goalX) {
        playTone(440, 'triangle', 0.35, 0.18, 880);
        if (state.levelIndex + 1 >= MAX_LEVELS) { state.won = true; }
        else { state.levelIndex++; loadLevel(state.levelIndex, true); }
    }
    player.rot += (player.vx * dt) / player.r;
    state.camX += (Math.max(0, player.x - GAME_W * 0.42) - state.camX) * Math.min(1, 7 * dt);
}

function drawHedgehog() {
    ctx.save(); ctx.translate(player.x, player.y);
    if (player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0) ctx.globalAlpha = 0.45;
    if (player.aimState > 0) {
        const len = player.aimState === 1 ? 85 : 65 + player.slingshotCharge * 85;
        const tx = player.facing * Math.cos(player.aimAngle) * len, ty = -Math.sin(player.aimAngle) * len;
        ctx.strokeStyle = player.aimState === 2 ? '#22c55e' : '#ffeb3b'; ctx.fillStyle = '#e5534b'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (player.aimState === 2) {
            ctx.fillStyle = '#0d0f12'; ctx.fillRect(-34, -52, 68, 12);
            ctx.fillStyle = player.slingshotCharge > 0.7 ? '#ef4444' : '#22c55e';
            ctx.fillRect(-31, -49, 62 * player.slingshotCharge, 6);
        }
    }
    ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    if (player.curled) {
        ctx.rotate(player.rot);
        for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            ctx.fillStyle = i % 2 ? '#5c3a21' : '#3d2514';
            ctx.beginPath(); ctx.moveTo(Math.cos(ang - 0.22) * 17, Math.sin(ang - 0.22) * 17);
            ctx.lineTo(Math.cos(ang) * 31, Math.sin(ang) * 31); ctx.lineTo(Math.cos(ang + 0.22) * 17, Math.sin(ang + 0.22) * 17);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = '#7c5338'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = '#d9b38c'; ctx.fill();
        ctx.strokeStyle = '#e5534b'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = '#20b8f9'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, Math.PI * 2); ctx.stroke();
    } else {
        ctx.scale(player.facing, 1);
        const walk = player.grounded && Math.abs(player.vx) > 15 ? Math.sin(performance.now() * 0.018) * 5 : 0;
        ctx.fillStyle = '#b58860'; ctx.beginPath(); ctx.ellipse(-8 - walk, 19, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a2c18'; ctx.beginPath(); ctx.moveTo(-2, -20);
        for (const [sx, sy] of [[-14,-25],[-10,-15],[-24,-18],[-17,-8],[-28,-7],[-20,2],[-29,6],[-19,12],[-23,17],[-8,17]]) ctx.lineTo(sx, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6e472b'; ctx.beginPath(); ctx.arc(-5, -1, 18, Math.PI * 0.55, Math.PI * 1.9); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f3d5b5'; ctx.beginPath(); ctx.moveTo(-6, 16);
        ctx.quadraticCurveTo(10, 18, 17, 10); ctx.quadraticCurveTo(27, 4, 24, -1); ctx.quadraticCurveTo(16, -6, 9, -12); ctx.quadraticCurveTo(-5, -14, -6, 16);
        ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(1, -14); ctx.rotate(0.25);
        ctx.fillStyle = '#e5534b'; ctx.fillRect(-9, -4, 9, 6); ctx.strokeRect(-9, -4, 9, 6);
        ctx.fillStyle = '#20b8f9'; ctx.fillRect(0, -4, 9, 6); ctx.strokeRect(0, -4, 9, 6); ctx.restore();
        ctx.fillStyle = '#d9a77d'; ctx.beginPath(); ctx.arc(-2, -8, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f4978e'; ctx.beginPath(); ctx.arc(-2, -8, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d9a77d'; ctx.beginPath(); ctx.ellipse(7 + walk, 19, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.55)'; ctx.beginPath(); ctx.ellipse(11, 5, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0d0f12'; ctx.beginPath(); ctx.arc(11, -3, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12.2, -4.5, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(24, -1, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(25, -2.5, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(16, 4, 3.5, 0.2, Math.PI * 0.85); ctx.stroke();
    }
    ctx.restore();
}

function drawLadybug(bt) {
    ctx.save();
    ctx.translate(bt.x, bt.y);
    ctx.scale(bt.dir, 1);
    const walk = Math.sin(performance.now() * 0.016 + bt.x * 0.08) * 3.5;

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0d0f12';
    ctx.lineJoin = 'round';

    // Süße kleine Füßchen unten
    ctx.fillStyle = '#2b1d14';
    ctx.beginPath(); ctx.ellipse(-11 - walk, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0 + walk * 0.7, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10 - walk, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Fühler am Kopf
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(11, -24); ctx.quadraticCurveTo(15, -35, 21, -35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -22); ctx.quadraticCurveTo(21, -31, 26, -30); ctx.stroke();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath(); ctx.arc(21, -35, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(26, -30, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Süßer runder Kopf vorne
    ctx.lineWidth = 4;
    ctx.fillStyle = '#3d2514';
    ctx.beginPath(); ctx.arc(11, -15, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Großes süßes Auge & rote Bäckchen (wie beim Igel)
    ctx.fillStyle = '#0d0f12';
    ctx.beginPath(); ctx.arc(14, -17, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(15.2, -18.3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
    ctx.beginPath(); ctx.ellipse(15, -11, 3.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // Leuchtender Marienkäfer-Panzer (Kuppel)
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(-3, -7, 21, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glanzlicht auf dem Panzer
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-3, -7, 15, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();

    // Schwarze Marienkäfer-Punkte
    ctx.fillStyle = '#0d0f12';
    ctx.beginPath(); ctx.arc(-14, -13, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5, -20, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -13, 3.2, 0, Math.PI * 2); ctx.fill();

    // Goldener Schwachpunkt-Kristall oben auf dem Panzer
    ctx.strokeStyle = '#0d0f12';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-3, -30, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(-4.5, -31.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Ritter-Schild vorne (schützt gegen Frontalangriffe)
    ctx.save();
    ctx.translate(21, -17);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0d0f12';
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-7, -14);
    ctx.lineTo(7, -14);
    ctx.lineTo(7, 3);
    ctx.quadraticCurveTo(7, 13, 0, 17);
    ctx.quadraticCurveTo(-7, 13, -7, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Schild-Innenfläche & goldenes Emblem
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.lineTo(4, 2);
    ctx.quadraticCurveTo(4, 9, 0, 12);
    ctx.quadraticCurveTo(-4, 9, -4, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

function drawHeart(x, y, r, fill) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = fill; ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * 0.75);
    ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.7, -r * 1.1, 0, -r * 0.35);
    ctx.bezierCurveTo(r * 0.7, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.75);
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}

function render() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width || window.innerWidth, h = rect.height || window.innerHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) { canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr); }
    ctx.save(); ctx.scale(dpr, dpr); ctx.fillStyle = '#1e2229'; ctx.fillRect(0, 0, w, h);

    const portrait = h > w;
    view.scale = portrait ? Math.min(w / GAME_H, h / GAME_W) : Math.min(w / GAME_W, h / GAME_H);
    view.rotation = portrait ? -Math.PI / 2 : 0; view.offsetX = w / 2; view.offsetY = h / 2;
    ctx.translate(view.offsetX, view.offsetY); ctx.rotate(view.rotation); ctx.scale(view.scale, view.scale); ctx.translate(-GAME_W / 2, -GAME_H / 2);

    const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
    sky.addColorStop(0, '#72b6f6'); sky.addColorStop(0.65, '#cde8f6'); sky.addColorStop(1, '#fde4be');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.lineWidth = 4; ctx.strokeStyle = '#0d0f12';
    for (let i = 0; i < 6; i++) {
        const cx = ((i * 290 - state.camX * 0.1 + 90) % 1740 + 1740) % 1740 - 180, cy = 75 + (i % 3) * 48;
        ctx.fillStyle = '#ffffff'; ctx.beginPath();
        ctx.arc(cx, cy, 24, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(cx + 26, cy - 14, 30, Math.PI, Math.PI * 1.85);
        ctx.arc(cx + 58, cy - 6, 26, Math.PI * 1.15, Math.PI * 1.95); ctx.arc(cx + 76, cy + 4, 20, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const treeCols = ['#d95338', '#e67e22', '#c83e2b'];
    for (let i = 0; i < 8; i++) {
        const tx = ((i * 240 - state.camX * 0.22) % 1920 + 1920) % 1920 - 160;
        const hillY = 445 + Math.sin((tx + state.camX * 0.15) * 0.004) * 35, crownY = hillY - 115 - (i % 2) * 18;
        ctx.fillStyle = '#5c3a21'; ctx.fillRect(tx - 14, crownY + 20, 28, GAME_H - crownY); ctx.strokeRect(tx - 14, crownY + 20, 28, GAME_H - crownY);
        ctx.fillStyle = treeCols[i % 3]; ctx.beginPath();
        ctx.arc(tx - 32, crownY + 12, 34, Math.PI * 0.45, Math.PI * 1.65); ctx.arc(tx, crownY - 18, 42, Math.PI * 0.95, Math.PI * 2.05);
        ctx.arc(tx + 32, crownY + 12, 34, Math.PI * 1.35, Math.PI * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const hillGrad = ctx.createLinearGradient(0, 410, 0, GAME_H);
    hillGrad.addColorStop(0, '#d49a6a'); hillGrad.addColorStop(1, '#8c5832');
    ctx.fillStyle = hillGrad; ctx.beginPath(); ctx.moveTo(0, GAME_H);
    for (let x = 0; x <= GAME_W + 80; x += 40) ctx.lineTo(x, 445 + Math.sin((x + state.camX * 0.15) * 0.004) * 35);
    ctx.lineTo(GAME_W, GAME_H); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.save(); ctx.translate(-state.camX, 0);
    for (const wi of winds) {
        if (!wi.active) continue;
        const wg = ctx.createLinearGradient(wi.x, wi.y, wi.x, wi.y + wi.h);
        wg.addColorStop(0, 'rgba(255,255,255,0.12)'); wg.addColorStop(0.5, 'rgba(224,242,254,0.38)'); wg.addColorStop(1, 'rgba(255,255,255,0.15)');
        ctx.fillStyle = wg; ctx.fillRect(wi.x, wi.y, wi.w, wi.h); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
        const t = performance.now() * 0.14;
        for (let i = 0; i < 6; i++) {
            const prog = ((t + i * 45) % 180) / 180;
            const wx = wi.vx < 0 ? wi.x + wi.w * (1 - prog) : wi.x + (wi.w * (i + 0.5)) / 6 + Math.sin(prog * 6 + i) * 10;
            const wy = wi.vy < 0 ? wi.y + wi.h * (1 - prog) : wi.y + (wi.h * (i + 0.5)) / 6;
            ctx.beginPath(); if (wi.vy < 0) { ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + 26); } else { ctx.moveTo(wx, wy); ctx.lineTo(wx + 28, wy); } ctx.stroke();
            ctx.fillStyle = i % 2 ? '#f59e0b' : '#ef4444'; ctx.beginPath(); ctx.ellipse(wx + 6, wy, 5, 3, prog * 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    ctx.lineWidth = 5; ctx.strokeStyle = '#0d0f12';
    for (const p of platforms) {
        const dirtGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
        dirtGrad.addColorStop(0, '#7a5238'); dirtGrad.addColorStop(0.55, '#4e3322'); dirtGrad.addColorStop(1, '#26170e');
        ctx.fillStyle = dirtGrad; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.strokeRect(p.x, p.y, p.w, p.h);
        if (p.y > 100) {
            ctx.fillStyle = '#55b848'; ctx.fillRect(p.x - 2, p.y, p.w + 4, 20);
            ctx.fillStyle = '#7ad667'; ctx.fillRect(p.x, p.y + 3, p.w, 6); ctx.strokeRect(p.x - 2, p.y, p.w + 4, 20);
        }
    }

    // Farb-Plattformen zeichnen
    for (const cp of colorPlatforms) {
        const act = isColorPlatformActive(cp);
        const baseCol = cp.color === 'red' ? '#e5534b' : '#20b8f9';
        const ghostCol = cp.color === 'red' ? 'rgba(229, 83, 75, 0.18)' : 'rgba(32, 184, 249, 0.18)';
        ctx.save();
        if (act) {
            ctx.fillStyle = baseCol;
            ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.fillRect(cp.x + 4, cp.y + 3, cp.w - 8, 5);
            ctx.strokeStyle = '#0d0f12';
            ctx.lineWidth = 4;
            ctx.strokeRect(cp.x, cp.y, cp.w, cp.h);
        } else {
            ctx.fillStyle = ghostCol;
            ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
            ctx.strokeStyle = baseCol;
            ctx.lineWidth = 3;
            ctx.setLineDash([7, 6]);
            ctx.strokeRect(cp.x, cp.y, cp.w, cp.h);
            ctx.setLineDash([]);
        }
        ctx.fillStyle = act ? '#ffffff' : baseCol;
        ctx.beginPath();
        ctx.arc(cp.x + cp.w / 2, cp.y + cp.h / 2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Zerbrechliche Ketten / Hängebrücken zeichnen
    for (const rb of ropeBridges) {
        ctx.save();
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#6b7280';
        ctx.beginPath(); ctx.arc(rb.ropeX, rb.ropeY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 5;
        if (!rb.cut) {
            ctx.beginPath(); ctx.moveTo(rb.ropeX, rb.ropeY + 6); ctx.lineTo(rb.ropeX, rb.y); ctx.stroke();
            ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.moveTo(rb.ropeX, rb.ropeY + 6); ctx.lineTo(rb.ropeX, rb.y); ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.beginPath(); ctx.moveTo(rb.ropeX, rb.ropeY + 6); ctx.lineTo(rb.ropeX - 6, rb.ropeY + 34); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rb.ropeX, rb.y - 24); ctx.lineTo(rb.ropeX + 8, rb.y); ctx.stroke();
        }

        ctx.fillStyle = '#92400e';
        ctx.fillRect(rb.x, rb.y, rb.w, rb.h);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(rb.x + 4, rb.y + 3, rb.w - 8, 5);
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        ctx.strokeRect(rb.x, rb.y, rb.w, rb.h);
        ctx.restore();
    }

    for (const rp of ramps) {
        ctx.fillStyle = '#5c3a21'; ctx.beginPath(); ctx.moveTo(rp.x1, rp.y1); ctx.lineTo(rp.x2, rp.y2); ctx.lineTo(rp.x2, GAME_H); ctx.lineTo(rp.x1, GAME_H); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#55b848'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(rp.x1, rp.y1 + 5); ctx.lineTo(rp.x2, rp.y2 + 5); ctx.stroke();
        ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rp.x1, rp.y1); ctx.lineTo(rp.x2, rp.y2); ctx.stroke();
    }
    for (const sw of seesaws) {
        ctx.fillStyle = '#4b5563'; ctx.beginPath(); ctx.moveTo(sw.cx - 18, sw.cy + 36); ctx.lineTo(sw.cx, sw.cy); ctx.lineTo(sw.cx + 18, sw.cy + 36); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(sw.cx, sw.cy); ctx.rotate(sw.angle);
        ctx.fillStyle = '#d97706'; ctx.fillRect(-sw.halfW, -8, sw.halfW * 2, 16); ctx.strokeRect(-sw.halfW, -8, sw.halfW * 2, 16); ctx.restore();
    }
    for (const m of mushrooms) {
        const sq = m.bounce * 8;
        ctx.fillStyle = '#f3d5b5'; ctx.fillRect(m.x + 22, m.y + 12 + sq, 28, m.h - 10 - sq); ctx.strokeRect(m.x + 22, m.y + 12 + sq, 28, m.h - 10 - sq);
        ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.ellipse(m.x + m.w / 2, m.y + 12 + sq, m.w / 2, 14, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    for (const br of breakables) {
        if (br.type === 'wall') {
            ctx.fillStyle = '#8d5b3c'; ctx.fillRect(br.x, br.y, br.w, br.h); ctx.strokeRect(br.x, br.y, br.w, br.h);
            ctx.beginPath(); for (let y = br.y + 28; y < br.y + br.h; y += 28) { ctx.moveTo(br.x, y); ctx.lineTo(br.x + br.w, y); }
            ctx.moveTo(br.x + 8, br.y + 15); ctx.lineTo(br.x + br.w - 6, br.y + br.h / 2); ctx.lineTo(br.x + 10, br.y + br.h - 14); ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(125, 211, 252, 0.85)'; ctx.fillRect(br.x, br.y, br.w, br.h);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(br.x + 8, br.y + 5, br.w - 16, 6); ctx.strokeRect(br.x, br.y, br.w, br.h);
            ctx.beginPath(); ctx.moveTo(br.x + 22, br.y); ctx.lineTo(br.x + 48, br.y + 18); ctx.lineTo(br.x + 36, br.y + br.h); ctx.stroke();
        }
    }
    for (const b of buttons) {
        const bh = b.pressed ? 5 : b.h;
        ctx.fillStyle = b.pressed ? '#22c55e' : (b.toggleWind ? '#20b8f9' : '#e5534b');
        ctx.fillRect(b.x + 4, b.y + (b.h - bh), b.w - 8, bh); ctx.strokeRect(b.x + 4, b.y + (b.h - bh), b.w - 8, bh);
        ctx.fillStyle = '#4b5563'; ctx.fillRect(b.x - 4, b.y + b.h - 4, b.w + 8, 6); ctx.strokeRect(b.x - 4, b.y + b.h - 4, b.w + 8, 6);
    }
    for (const g of gates) {
        const curH = Math.max(14, g.h - g.openH);
        ctx.fillStyle = '#eab308'; ctx.fillRect(g.x, g.y, g.w, curH);
        ctx.fillStyle = '#ca8a04'; ctx.fillRect(g.x + 6, g.y + 4, g.w - 12, Math.max(4, curH - 8)); ctx.strokeRect(g.x, g.y, g.w, curH);
        ctx.fillStyle = '#0d0f12'; for (let y = g.y + 16; y < g.y + curH - 10; y += 26) { ctx.beginPath(); ctx.arc(g.x + g.w / 2, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    }
    for (const bx of boxes) {
        ctx.fillStyle = '#b45309'; ctx.fillRect(bx.x, bx.y, bx.w, bx.h); ctx.fillStyle = '#d97706'; ctx.fillRect(bx.x + 6, bx.y + 6, bx.w - 12, bx.h - 12);
        ctx.strokeRect(bx.x, bx.y, bx.w, bx.h); ctx.strokeRect(bx.x + 6, bx.y + 6, bx.w - 12, bx.h - 12);
        ctx.beginPath(); ctx.moveTo(bx.x + 6, bx.y + 6); ctx.lineTo(bx.x + bx.w - 6, bx.y + bx.h - 6); ctx.moveTo(bx.x + bx.w - 6, bx.y + 6); ctx.lineTo(bx.x + 6, bx.y + bx.h - 6); ctx.stroke();
    }
    for (const hz of hazards) {
        for (let x = hz.x; x < hz.x + hz.w; x += 20) {
            ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(x, hz.y + hz.h); ctx.lineTo(x + 10, hz.y - 3); ctx.lineTo(x + 20, hz.y + hz.h); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.moveTo(x + 4, hz.y + 7); ctx.lineTo(x + 10, hz.y - 3); ctx.lineTo(x + 16, hz.y + 7); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x, hz.y + hz.h); ctx.lineTo(x + 10, hz.y - 3); ctx.lineTo(x + 20, hz.y + hz.h); ctx.closePath(); ctx.stroke();
        }
    }
    for (const z of zombies) if (!z.dead) {
        ctx.save(); ctx.translate(z.x, z.y); ctx.scale(z.dir, 1);
        const legA = Math.sin(performance.now() * 0.014 + z.x * 0.08) * 0.55;
        ctx.lineWidth = 4; ctx.strokeStyle = '#0d0f12'; ctx.fillStyle = '#3b4252';
        ctx.save(); ctx.translate(-3, -14); ctx.rotate(legA); ctx.fillRect(-3.5, 0, 7, 14); ctx.strokeRect(-3.5, 0, 7, 14); ctx.restore();
        ctx.save(); ctx.translate(3, -14); ctx.rotate(-legA); ctx.fillRect(-3.5, 0, 7, 14); ctx.strokeRect(-3.5, 0, 7, 14); ctx.restore();
        ctx.fillStyle = '#6b4c7a'; ctx.fillRect(-11, -34, 22, 21); ctx.strokeRect(-11, -34, 22, 21);
        ctx.fillStyle = '#7fa650'; ctx.fillRect(-12, -52, 24, 19); ctx.strokeRect(-12, -52, 24, 19);
        ctx.fillRect(4, -31 + legA * 3, 18, 7); ctx.strokeRect(4, -31 + legA * 3, 18, 7);
        ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.arc(6, -43, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Flug-Gegner (Wespen) zeichnen
    for (const w of wasps) if (!w.dead) {
        ctx.save(); ctx.translate(w.x, w.y);
        const flap = Math.sin(performance.now() * 0.045 + w.x) * 8;
        ctx.lineWidth = 4; ctx.strokeStyle = '#0d0f12';
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.beginPath(); ctx.ellipse(-4, -14 + flap * 0.4, 12, 7, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(6, -14 - flap * 0.4, 12, 7, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#0d0f12';
        ctx.fillRect(-7, -11, 5, 22); ctx.fillRect(3, -11, 5, 22);
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-30, 3); ctx.lineTo(-20, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.arc(11, -3, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Süßer Marienkäfer mit Ritter-Schild zeichnen
    for (const bt of beetles) if (!bt.dead) drawLadybug(bt);

    const goalPlatY = platforms[platforms.length - 1].y;
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(goalX, goalPlatY - 150, 12, 150); ctx.strokeRect(goalX, goalPlatY - 150, 12, 150);
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(goalX + 6, goalPlatY - 154, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const wave = Math.sin(performance.now() * 0.006) * 6;
    ctx.fillStyle = '#20b8f9'; ctx.beginPath(); ctx.moveTo(goalX + 12, goalPlatY - 144); ctx.lineTo(goalX + 92, goalPlatY - 118 + wave); ctx.lineTo(goalX + 12, goalPlatY - 88); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.moveTo(goalX + 12, goalPlatY - 128); ctx.lineTo(goalX + 62, goalPlatY - 118 + wave * 0.6); ctx.lineTo(goalX + 12, goalPlatY - 104); ctx.closePath(); ctx.fill();

    drawHedgehog();
    ctx.restore();

    for (let i = 0; i < 5; i++) drawHeart(36 + i * 38, 34, 14, i < state.hearts ? '#e5534b' : '#4b5563');
    ctx.fillStyle = 'rgba(13,15,18,0.75)'; ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4;
    ctx.fillRect(225, 14, 175, 40); ctx.strokeRect(225, 14, 175, 40);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 19px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Level ' + (state.levelIndex + 1) + ' / ' + MAX_LEVELS, 312, 41);

    if (netMode !== 'local') {
        ctx.fillStyle = netMode === 'host' ? '#e5534b' : '#20b8f9';
        ctx.fillRect(415, 14, 215, 40); ctx.strokeRect(415, 14, 215, 40);
        ctx.fillStyle = netMode === 'host' ? '#fff' : '#0d0f12';
        ctx.font = 'bold 16px system-ui';
        ctx.fillText((netMode === 'host' ? 'ROT (HOST) • ' : 'BLAU (CLIENT) • ') + roomCode, 522, 40);
    }

    const drawBtn = (b, txt) => {
        ctx.fillStyle = '#374151'; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, b.h * 0.4); ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(txt, b.x + b.w / 2, b.y + b.h / 2 + 5);
    };
    drawBtn(uiButtons.resetRoom, 'LEVEL RESET');
    drawBtn(uiButtons.sound, soundOn ? 'TON' : 'AUS');

    for (const b of getVisibleControlButtons()) {
        const pressed = inputs[b.id] || keys[b.id];
        ctx.save(); ctx.translate(b.x, b.y + (pressed ? 5 : 0));
        if (!pressed) { ctx.fillStyle = '#0d0f12'; ctx.beginPath(); ctx.arc(0, 6, b.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fillStyle = b.color; ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = '#0d0f12'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(0, -b.r * 0.28, b.r * 0.65, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 15px system-ui'; ctx.fillText(b.label, 0, -1); ctx.font = 'bold 11px system-ui'; ctx.fillText(b.sub, 0, 15);
        ctx.restore();
    }

    if (state.won || state.gameOver) {
        ctx.fillStyle = 'rgba(13, 15, 18, 0.78)'; ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.fillStyle = state.won ? '#facc15' : '#e5534b'; ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 6;
        ctx.fillRect(GAME_W / 2 - 270, GAME_H / 2 - 110, 540, 220); ctx.strokeRect(GAME_W / 2 - 270, GAME_H / 2 - 110, 540, 220);
        ctx.fillStyle = state.won ? '#0d0f12' : '#ffffff'; ctx.textAlign = 'center';
        ctx.font = 'bold 34px system-ui'; ctx.fillText(state.won ? 'GESCHAFFT!' : 'SPIEL VORBEI!', GAME_W / 2, GAME_H / 2 - 35);
        ctx.font = 'bold 20px system-ui'; ctx.fillText(state.won ? 'Alle 10 Level gemeinsam gemeistert!' : ('Geschaffte Level: ' + state.levelIndex + ' / ' + MAX_LEVELS), GAME_W / 2, GAME_H / 2 + 10);
        ctx.font = 'bold 16px system-ui'; ctx.fillText('Tippen für neuen Durchlauf', GAME_W / 2, GAME_H / 2 + 58);
    }
    ctx.restore();
}

function toGameCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    let dx = (clientX - rect.left) - view.offsetX, dy = (clientY - rect.top) - view.offsetY;
    const c = Math.cos(-view.rotation), s = Math.sin(-view.rotation);
    return { x: (dx * c - dy * s) / view.scale + GAME_W / 2, y: (dx * s + dy * c) / view.scale + GAME_H / 2 };
}
function syncPointers() {
    inputs.redRight = inputs.redCurl = inputs.redAct = inputs.blueAct = inputs.blueJump = inputs.blueLeft = false;
    const visibleBtns = getVisibleControlButtons();
    for (const pt of activePointers.values()) for (const b of visibleBtns) if (Math.hypot(pt.x - b.x, pt.y - b.y) <= b.hitR) inputs[b.id] = true;
}
const hitRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

canvas.addEventListener('pointerdown', e => {
    const pt = toGameCoords(e.clientX, e.clientY);
    if (hitRect(pt, uiButtons.sound)) { soundOn = !soundOn; return; }
    if (state.won || state.gameOver || hitRect(pt, uiButtons.resetRoom)) {
        if (netMode === 'client') {
            if (conn && conn.open) {
                try { conn.send({ type: 'reset' }); } catch (err) {}
            }
        } else {
            if (state.won || state.gameOver) {
                state.won = false; state.gameOver = false; state.levelIndex = 0; state.hearts = 5;
                loadLevel(0, true);
            } else {
                loadLevel(state.levelIndex, false);
            }
            if (netMode === 'host') sendGameState();
        }
        return;
    }
    activePointers.set(e.pointerId, pt);
    syncPointers();
    sendBlueInputs(true);
});
canvas.addEventListener('pointermove', e => {
    if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, toGameCoords(e.clientX, e.clientY));
        syncPointers();
        sendBlueInputs(false);
    }
});
const endPtr = e => {
    activePointers.delete(e.pointerId);
    syncPointers();
    sendBlueInputs(true);
};
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);

const keyMap = {
    KeyD: 'redRight', ArrowRight: 'redRight',
    KeyS: 'redCurl', ArrowDown: 'redCurl',
    KeyE: 'redAct', ShiftLeft: 'redAct',
    KeyW: 'blueJump', ArrowUp: 'blueJump',
    KeyA: 'blueLeft', ArrowLeft: 'blueLeft',
    KeyQ: 'blueAct', ShiftRight: 'blueAct'
};
window.addEventListener('keydown', e => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (keyMap[e.code]) { keys[keyMap[e.code]] = true; sendBlueInputs(true); }
});
window.addEventListener('keyup', e => {
    if (keyMap[e.code]) { keys[keyMap[e.code]] = false; sendBlueInputs(true); }
});

loadLevel(0, true);
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt); render();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
