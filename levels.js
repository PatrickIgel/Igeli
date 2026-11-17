function createRng(seed) {
    let s = (seed >>> 0) || 123456789;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const getModuleCount = idx => idx < 2 ? 1 : idx < 5 ? 2 : idx - 2;
const clampY = (y, min = 340, max = 505) => Math.max(min, Math.min(max, Math.round(y)));

const addPlat = (...list) => list.forEach(([x, y, w, h]) => platforms.push({ x, y, w, h }));
const addWind = (...list) => list.forEach(([x, y, w, h, vx, vy, id]) => winds.push(id !== undefined ? { id, x, y, w, h, vy, vx, active: true } : { x, y, w, h, vy, vx, active: true }));
const addHaz = (x, y, w) => hazards.push({ x, y, w, h: 16 });
const addGate = (id, x, h) => gates.push({ id, x, y: 0, w: 28, h, openH: 0 });
const addBtn = (id, x, y, sticky = false, toggleWind = false) => buttons.push({
    id, x, y, w: toggleWind ? 58 : 64, h: 12, pressed: false,
    ...(sticky ? { sticky: true } : {}),
    ...(toggleWind ? { toggleWind: true } : {})
});
const addBox = (x, y) => boxes.push({ x, y, w: 48, h: 48, vx: 0, vy: 0 });
const addBreak = (x, y, w, h, type) => breakables.push({ x, y, w, h, type });
const addWasp = (x, y, rangeX, phase) => wasps.push({ x, y, baseX: x, baseY: y, rangeX, phase, dead: false });
const addColorPlat = (...list) => list.forEach(([x, y, w, color]) => colorPlatforms.push({ x, y, w, h: 20, color }));
const addRope = (ropeX, ropeY, x, y, w, targetY) => ropeBridges.push({ ropeX, ropeY, x, y, w, h: 18, targetY, vy: 0, cut: false, settled: false });

function spawnGroundEnemy(x, y, rng, allowBeetle = true) {
    if (allowBeetle && rng() > 0.52) beetles.push({ x, y, dir: -1, dead: false });
    else zombies.push({ x, y, dir: -1, dead: false });
}

const START_PRESETS = [
    // 0: Klassische Startwiese
    () => {
        const curX = 340, curY = 480;
        addPlat([0, curY, curX, GAME_H - curY]);
        player.x = 120; player.y = curY - 70;
        return { curX, curY };
    },
    // 1: Schwung-Rampe (erhöhter Start mit Roll-Rampe)
    () => {
        const startY = 395, curY = 485, curX = 350;
        addPlat([0, startY, 170, GAME_H - startY], [310, curY, 40, GAME_H - curY]);
        ramps.push({ x1: 170, y1: startY, x2: 310, y2: curY });
        player.x = 95; player.y = startY - 70;
        return { curX, curY };
    },
    // 2: Aufwind-Klippe (Gleit-Start auf höhere Plattform)
    () => {
        const lowY = 495, curY = 415, curX = 420;
        addPlat([0, lowY, 200, GAME_H - lowY], [330, curY, 90, GAME_H - curY]);
        addWind([205, curY - 70, 120, lowY - curY + 80, 0, -560]);
        player.x = 105; player.y = lowY - 70;
        return { curX, curY };
    },
    // 3: Waldpilz-Katapult (Sprung-Start)
    () => {
        const lowY = 505, curY = 395, curX = 390;
        addPlat([0, lowY, 250, GAME_H - lowY], [250, curY, 140, GAME_H - curY]);
        mushrooms.push({ x: 170, y: lowY - 26, w: 72, h: 26, vy: -760, bounce: 0 });
        player.x = 95; player.y = lowY - 70;
        return { curX, curY };
    }
];

const GOAL_PRESETS = [
    // 0: Klassisches Ziel-Plateau
    (curX, curY) => {
        addPlat([curX, curY, 460, GAME_H - curY]);
        goalX = curX + 260;
    },
    // 1: Sieges-Treppe (erhöhtes Zielpodest)
    (curX, curY) => {
        const stepY = clampY(curY - 56, 330, 460);
        addPlat([curX, curY, 160, GAME_H - curY], [curX + 160, stepY, 340, GAME_H - stepY]);
        goalX = curX + 310;
    },
    // 2: Ziel-Sprung über Stachelgrube mit Aufwind-Sicherheit
    (curX, curY) => {
        const pitY = 535, finalY = clampY(curY - 25, 350, 485);
        addPlat([curX, curY, 130, GAME_H - curY], [curX + 130, pitY, 160, GAME_H - pitY], [curX + 290, finalY, 280, GAME_H - finalY]);
        addHaz(curX + 148, pitY - 16, 124);
        addWind([curX + 145, finalY - 85, 130, pitY - finalY + 75, 0, -570]);
        goalX = curX + 410;
    },
    // 3: Glaswand-Durchbruch vor der Ziellinie
    (curX, curY) => {
        addPlat([curX, curY, 520, GAME_H - curY]);
        addBreak(curX + 185, curY - 120, 36, 120, 'wall');
        goalX = curX + 350;
    }
];

const shuffleBagState = { used: new Set(), cachedKey: '', cachedModules: [] };

function drawFromShuffleBag(rng, poolSize, lastMod, expertOnly = false) {
    const refillThreshold = Math.ceil(poolSize * 0.8);
    if (shuffleBagState.used.size >= refillThreshold) shuffleBagState.used.clear();
    const startIdx = expertOnly ? 15 : 0;
    let candidates = [];
    for (let i = startIdx; i < poolSize; i++) if (!shuffleBagState.used.has(i) && i !== lastMod) candidates.push(i);
    if (candidates.length === 0 && expertOnly) {
        for (let i = startIdx; i < poolSize; i++) {
            shuffleBagState.used.delete(i);
            if (i !== lastMod) candidates.push(i);
        }
    }
    if (candidates.length === 0) for (let i = startIdx; i < poolSize; i++) if (!shuffleBagState.used.has(i)) candidates.push(i);
    const chosen = candidates[Math.floor(rng() * candidates.length)];
    shuffleBagState.used.add(chosen);
    if (shuffleBagState.used.size >= refillThreshold) shuffleBagState.used.clear();
    return chosen;
}

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

function loadLevel(idx, newSeed = false) {
    state.resetSeq = (state.resetSeq || 0) + 1;
    if (newSeed) {
        state.levelSeed = (Math.random() * 1e9) | 0;
        if (idx === 0) { shuffleBagState.used.clear(); shuffleBagState.cachedKey = ''; shuffleBagState.cachedModules = []; }
    }
    const rng = createRng(state.levelSeed + idx * 7919);
    const geoRng = createRng(((state.levelSeed ^ 0x9e3779b9) >>> 0) + idx * 104729);
    platforms = []; boxes = []; buttons = []; gates = []; breakables = []; winds = []; hazards = []; zombies = []; mushrooms = []; ramps = []; seesaws = [];
    colorPlatforms = []; ropeBridges = []; wasps = []; beetles = [];
    player.vx = 0; player.vy = 0; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = false; player.invuln = 0;

    let { curX, curY } = START_PRESETS[Math.floor(geoRng() * START_PRESETS.length)](geoRng);
    let lastMod = -1;
    const poolSize = idx >= 5 ? LEVEL_MODULES.length : 15;
    const count = getModuleCount(idx);
    const cacheKey = `${idx}:${state.levelSeed}`;

    let chosenModules;
    if (!newSeed && shuffleBagState.cachedKey === cacheKey && shuffleBagState.cachedModules.length === count) {
        chosenModules = shuffleBagState.cachedModules;
    } else if (!newSeed && Array.isArray(state.levelModules) && state.levelModules.length === count) {
        chosenModules = state.levelModules;
        shuffleBagState.cachedKey = cacheKey;
        shuffleBagState.cachedModules = chosenModules.slice();
    } else {
        const expertSlot = idx >= 5 ? Math.floor(rng() * count) : -1;
        chosenModules = [];
        for (let m = 0; m < count; m++) {
            const modIdx = drawFromShuffleBag(rng, poolSize, lastMod, m === expertSlot);
            lastMod = modIdx;
            chosenModules.push(modIdx);
        }
        shuffleBagState.cachedKey = cacheKey;
        shuffleBagState.cachedModules = chosenModules.slice();
    }
    state.levelModules = chosenModules.slice();

    for (let m = 0; m < chosenModules.length; m++) {
        const res = LEVEL_MODULES[chosenModules[m]](curX, curY, m + 1, geoRng);
        curX += res.width; curY = res.endY;
    }
    GOAL_PRESETS[Math.floor(geoRng() * GOAL_PRESETS.length)](curX, curY, geoRng);
    state.camX = 0;

    populateCoopExtras(idx);
}
