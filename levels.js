function createRng(seed) {
    let s = (seed >>> 0) || 123456789;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const HARD_MODULE_SCHEDULE = [
    { total: 3, expert: 1 },  // Level 1 (idx 0)
    { total: 4, expert: 1 },  // Level 2 (idx 1)
    { total: 4, expert: 1 },  // Level 3 (idx 2)
    { total: 5, expert: 1 },  // Level 4 (idx 3)
    { total: 6, expert: 2 },  // Level 5 (idx 4)
    { total: 8, expert: 2 },  // Level 6 (idx 5)
    { total: 9, expert: 2 },  // Level 7 (idx 6)
    { total: 11, expert: 3 }, // Level 8 (idx 7)
    { total: 12, expert: 3 }, // Level 9 (idx 8)
    { total: 13, expert: 3 }  // Level 10 (idx 9)
];

function getLevelModulePlan(idx, difficulty = state.difficulty || 'medium') {
    if (difficulty === 'easy') {
        const total = idx < 2 ? 1 : idx < 5 ? 2 : idx - 2;
        return { total, expertCount: 0, nonExpertPoolEnd: STANDARD_MODULE_COUNT };
    }
    if (difficulty === 'hard') {
        if (idx < HARD_MODULE_SCHEDULE.length) {
            const entry = HARD_MODULE_SCHEDULE[idx];
            return { total: entry.total, expertCount: entry.expert, nonExpertPoolEnd: STANDARD_MODULE_COUNT };
        }
        return { total: 11 + (idx - 7), expertCount: 3, nonExpertPoolEnd: STANDARD_MODULE_COUNT };
    }
    // Mittel (wie bisher)
    const total = idx < 2 ? 1 : idx < 5 ? 2 : idx - 2;
    const hasExpert = idx >= 5;
    return {
        total,
        expertCount: hasExpert ? 1 : 0,
        nonExpertPoolEnd: hasExpert ? LEVEL_MODULES.length : STANDARD_MODULE_COUNT
    };
}

const getModuleCount = (idx, difficulty = state.difficulty || 'medium') => getLevelModulePlan(idx, difficulty).total;
const clampY = (y, min = 340, max = 505) => Math.max(min, Math.min(max, Math.round(y)));

const addPlat = (...list) => list.forEach(([x, y, w, h]) => platforms.push({ x, y, w, h }));
const addWind = (...list) => list.forEach(([x, y, w, h, vx, vy, id, color]) => winds.push({ ...(id !== undefined ? { id } : {}), ...(color ? { color } : {}), x, y, w, h, vy, vx, active: true }));
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
const addMagnet = (...list) => list.forEach(([x, y, r, range, force, color]) => magnetBlocks.push({ x, y, r, range, force, color }));
const addColorLaser = (...list) => list.forEach(([x, y, w, h, color]) => colorLasers.push({ x, y, w, h, color }));
const addMoss = (...list) => list.forEach(([x, y, w]) => mossPlatforms.push({ x, y, w, h: 20, origY: y, timer: 0, triggered: false, falling: false, broken: false, vy: 0 }));
const addSeesaw = (cx, cy, halfW, angle = -0.22, lockColor = null) => seesaws.push({ cx, cy, halfW, angle, ...(lockColor ? { lockColor } : {}) });
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

function drawFromShuffleBag(rng, rangeStart, rangeEnd, lastMod) {
    const subPoolSize = Math.max(1, rangeEnd - rangeStart);
    const refillThreshold = Math.max(1, Math.ceil(subPoolSize * 0.9));
    let usedInRange = 0;
    for (let i = rangeStart; i < rangeEnd; i++) {
        if (shuffleBagState.used.has(i)) usedInRange++;
    }
    if (usedInRange >= refillThreshold) {
        for (let i = rangeStart; i < rangeEnd; i++) shuffleBagState.used.delete(i);
    }

    let candidates = [];
    for (let i = rangeStart; i < rangeEnd; i++) {
        if (!shuffleBagState.used.has(i) && i !== lastMod) candidates.push(i);
    }
    if (candidates.length === 0) {
        for (let i = rangeStart; i < rangeEnd; i++) {
            shuffleBagState.used.delete(i);
            if (i !== lastMod) candidates.push(i);
        }
    }
    if (candidates.length === 0) {
        for (let i = rangeStart; i < rangeEnd; i++) candidates.push(i);
    }

    const chosen = candidates[Math.floor(rng() * candidates.length)];
    shuffleBagState.used.add(chosen);

    let newUsedInRange = 0;
    for (let i = rangeStart; i < rangeEnd; i++) {
        if (shuffleBagState.used.has(i)) newUsedInRange++;
    }
    if (newUsedInRange >= refillThreshold) {
        for (let i = rangeStart; i < rangeEnd; i++) shuffleBagState.used.delete(i);
    }
    return chosen;
}

function pickExpertSlots(rng, totalCount, expertCount) {
    const slots = new Set();
    const target = Math.min(totalCount, Math.max(0, expertCount));
    if (target <= 0) return slots;
    if (target === 1) {
        slots.add(Math.floor(rng() * totalCount));
        return slots;
    }

    const allIndices = Array.from({ length: totalCount }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }

    // Bevorzuge nicht direkt benachbarte Slots, wenn genügend Module vorhanden sind
    for (const candidate of allIndices) {
        if (slots.size >= target) break;
        if (!slots.has(candidate - 1) && !slots.has(candidate + 1)) {
            slots.add(candidate);
        }
    }
    for (const candidate of allIndices) {
        if (slots.size >= target) break;
        slots.add(candidate);
    }
    return slots;
}

function populateCoopExtras(idx) {
    let s = ((state.levelSeed || 1) + (idx + 1) * 7919) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

    // 1. Farb-Plattformen & Wespen in leeren breiten Abgründen (auf angepasste Sprungweite abgestimmt)
    const groundPlats = platforms.filter(p => p.y > 120 && p.y + p.h >= GAME_H - 5).sort((a, b) => a.x - b.x);
    for (let i = 0; i < groundPlats.length - 1; i++) {
        const p1 = groundPlats[i], p2 = groundPlats[i + 1];
        const gapStart = p1.x + p1.w, gapEnd = p2.x;
        const gap = gapEnd - gapStart;
        if (gap >= 145 && gap <= 340) {
            const hasGapElement =
                platforms.some(p => p.y > 120 && p.x + p.w > gapStart + 10 && p.x < gapEnd - 10) ||
                colorPlatforms.some(cp => cp.x + cp.w > gapStart && cp.x < gapEnd) ||
                mossPlatforms.some(mp => mp.x + mp.w > gapStart && mp.x < gapEnd) ||
                ropeBridges.some(rb => rb.x + rb.w > gapStart && rb.x < gapEnd) ||
                magnetBlocks.some(mg => mg.x > gapStart - 40 && mg.x < gapEnd + 40) ||
                winds.some(wi => wi.x + wi.w > gapStart && wi.x < gapEnd) ||
                gates.some(g => g.x + g.w > gapStart - 40 && g.x < gapEnd + 40) ||
                hazards.some(h => h.x + h.w > gapStart && h.x < gapEnd);
            if (hasGapElement) continue;
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
            const below = platforms.find(p => p.y > 120 && br.x + br.w / 2 >= p.x + 28 && br.x + br.w / 2 <= p.x + p.w - 28 && p.y - br.y >= 76 && p.y - br.y < 240);
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
        if (idx === 0) { shuffleBagState.used.clear(); shuffleBagState.cachedKey = ''; shuffleBagState.cachedModules = []; state.enemiesDefeated = 0; state.elapsedTime = 0; state.maxCatapultJump = 0; }
    }
    const difficulty = state.difficulty || 'medium';
    const rng = createRng(state.levelSeed + idx * 7919);
    const geoRng = createRng(((state.levelSeed ^ 0x9e3779b9) >>> 0) + idx * 104729);
    platforms = []; boxes = []; buttons = []; gates = []; breakables = []; winds = []; hazards = []; zombies = []; mushrooms = []; ramps = []; seesaws = [];
    colorPlatforms = []; ropeBridges = []; wasps = []; beetles = []; magnetBlocks = []; colorLasers = []; mossPlatforms = [];
    player.vx = 0; player.vy = 0; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = false; player.catapultStartX = null; player.invuln = 0;

    let { curX, curY } = START_PRESETS[Math.floor(geoRng() * START_PRESETS.length)](geoRng);
    let lastMod = -1;
    const plan = getLevelModulePlan(idx, difficulty);
    const count = plan.total;
    const cacheKey = `${difficulty}:${idx}:${state.levelSeed}`;

    let chosenModules;
    if (!newSeed && shuffleBagState.cachedKey === cacheKey && shuffleBagState.cachedModules.length === count) {
        chosenModules = shuffleBagState.cachedModules;
    } else if (!newSeed && Array.isArray(state.levelModules) && state.levelModules.length === count) {
        chosenModules = state.levelModules;
        shuffleBagState.cachedKey = cacheKey;
        shuffleBagState.cachedModules = chosenModules.slice();
    } else {
        const expertSlots = pickExpertSlots(rng, count, plan.expertCount);
        chosenModules = [];
        for (let m = 0; m < count; m++) {
            const isExpertSlot = expertSlots.has(m);
            const rangeStart = isExpertSlot ? STANDARD_MODULE_COUNT : 0;
            const rangeEnd = isExpertSlot ? LEVEL_MODULES.length : plan.nonExpertPoolEnd;
            const modIdx = drawFromShuffleBag(rng, rangeStart, rangeEnd, lastMod);
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
    validateGroundEnemies();

    // Flachen Boden vor dem Start und nach dem Endpunkt nahtlos fortführen
    const groundExtW = 3000;
    const startGround = platforms.find(p => p.x <= 0 && p.x + p.w > 0 && p.y > 100 && p.y + p.h >= GAME_H - 5);
    if (startGround) {
        startGround.w += -startGround.x + groundExtW;
        startGround.x = -groundExtW;
    }
    const endGround = [...platforms].reverse().find(p => p.y > 100 && p.y + p.h >= GAME_H - 5);
    if (endGround) {
        endGround.w += groundExtW;
    }

    // Unsichtbare Begrenzungswände am Start und nach dem Zielpunkt
    state.minX = 40;
    state.maxX = goalX + 120;
}

function validateGroundEnemies() {
    const floorSurfaces = [
        ...platforms.map(p => ({ x1: p.x, x2: p.x + p.w, y: p.y })),
        ...breakables.filter(br => br.type === 'floor').map(br => ({ x1: br.x, x2: br.x + br.w, y: br.y }))
    ];
    const solidBlocks = [
        ...platforms,
        ...gates.map(g => ({ x: g.x, y: g.y, w: g.w, h: g.h })),
        ...colorLasers.map(cl => ({ x: cl.x, y: cl.y, w: cl.w, h: cl.h })),
        ...breakables.filter(br => br.type === 'wall')
    ];

    const hasEnoughSpace = (enemy, halfW, height) => {
        const y = enemy.y;
        const floor = floorSurfaces.find(f => enemy.x >= f.x1 && enemy.x <= f.x2 && Math.abs(f.y - y) <= 8);
        if (!floor) return false;

        // Check vertical clearance above enemy (must not spawn stuck inside/under a low platform or floor)
        const blockedAbove = solidBlocks.some(s =>
            s.y < y - 6 &&
            s.x < enemy.x + halfW && s.x + s.w > enemy.x - halfW &&
            s.y + s.h > y - height
        ) || breakables.some(br =>
            br.type === 'floor' &&
            br.y < y - 6 &&
            br.x < enemy.x + halfW && br.x + br.w > enemy.x - halfW &&
            br.y + br.h > y - height
        );
        if (blockedAbove) return false;

        // Measure unobstructed walkable patrol span around enemy.x
        let minX = floor.x1 + halfW + 4;
        let maxX = floor.x2 - halfW - 4;
        for (const s of solidBlocks) {
            if (s.y < y - 6 && s.y + s.h > y - height + 4) {
                if (s.x + s.w <= enemy.x && s.x + s.w + halfW + 4 > minX) minX = s.x + s.w + halfW + 4;
                if (s.x >= enemy.x && s.x - halfW - 4 < maxX) maxX = s.x - halfW - 4;
            }
        }
        for (const h of hazards) {
            if (Math.abs(h.y - y) <= 20) {
                if (h.x + h.w <= enemy.x && h.x + h.w + halfW + 4 > minX) minX = h.x + h.w + halfW + 4;
                if (h.x >= enemy.x && h.x - halfW - 4 < maxX) maxX = h.x - halfW - 4;
            }
        }
        if (maxX - minX < 64) return false;
        enemy.x = Math.max(minX, Math.min(maxX, enemy.x));
        return true;
    };

    zombies = zombies.filter(z => hasEnoughSpace(z, 18, 56));
    beetles = beetles.filter(bt => hasEnoughSpace(bt, 24, 48));
}
