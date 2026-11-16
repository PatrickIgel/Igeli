function createRng(seed) {
    let s = (seed >>> 0) || 123456789;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const getModuleCount = idx => idx < 3 ? 1 : idx < 5 ? 2 : idx - 2;

// 20 Nahtlose Module (0-14 Standard ab Stufe 1, 15-19 Experten ab Stufe 6)
const LEVEL_MODULES = [
    // 0: Aufwind & Glasboden + Gegenwind-Schalter
    (sx, sy, id, rng) => {
        const topY = Math.max(250, sy - 190), botY = 500, endY = 460;
        platforms.push({ x: sx, y: sy, w: 120, h: GAME_H - sy }, { x: sx + 260, y: topY, w: 420, h: 36 }, { x: sx + 260, y: botY, w: 660, h: GAME_H - botY }, { x: sx + 920, y: endY, w: 140, h: GAME_H - endY });
        winds.push({ x: sx + 125, y: topY - 70, w: 130, h: sy - topY + 130, vy: -560, vx: 0, active: true }, { x: sx + 520, y: botY - 150, w: 280, h: 150, vy: 0, vx: -420, active: true });
        breakables.push({ x: sx + 430 + Math.floor(rng() * 50), y: topY, w: 110, h: 36, type: 'floor' });
        buttons.push({ id, x: sx + 340, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 830, y: botY - 180, w: 28, h: 180, openH: 0 });
        if (rng() > 0.35) zombies.push({ x: sx + 640, y: botY, dir: -1, dead: false });
        return { width: 1060, endY };
    },
    // 1: Kiste & Bodenschalter mit Stachelgrube
    (sx, sy, id, rng) => {
        const ledgeY = sy - 66, pitY = 520, endY = sy;
        platforms.push({ x: sx, y: sy, w: 680, h: GAME_H - sy }, { x: sx + 160, y: ledgeY, w: 190, h: 30 }, { x: sx + 680, y: pitY, w: 165, h: GAME_H - pitY }, { x: sx + 845, y: endY, w: 155, h: GAME_H - endY });
        boxes.push({ x: sx + 210 + Math.floor(rng() * 40), y: ledgeY - 52, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id, x: sx + 460, y: sy - 12, w: 64, h: 12, pressed: false });
        gates.push({ id, x: sx + 590, y: sy - 160, w: 28, h: 160, openH: 0 });
        hazards.push({ x: sx + 705, y: pitY - 16, w: 115, h: 16 });
        if (rng() > 0.45) zombies.push({ x: sx + 420, y: sy, dir: -1, dead: false });
        return { width: 1000, endY };
    },
    // 2: Katapult-Wanddurchbruch & Zombie-Wache
    (sx, sy, id, rng) => {
        const upY = Math.max(340, sy - 64);
        platforms.push({ x: sx, y: sy, w: 300, h: GAME_H - sy }, { x: sx + 300, y: upY, w: 580, h: GAME_H - upY });
        breakables.push({ x: sx + 520, y: upY - 120, w: 36, h: 120, type: 'wall' });
        zombies.push({ x: sx + 740, y: upY, dir: -1, dead: false });
        if (rng() > 0.5) zombies.push({ x: sx + 220, y: sy, dir: -1, dead: false });
        return { width: 880, endY: upY };
    },
    // 3: Zombie-Patrouille & Stachelgrube mit Aufwind-Rettung
    (sx, sy, id, rng) => {
        const pitY = 520, endY = rng() > 0.5 ? 420 : 480;
        platforms.push({ x: sx, y: sy, w: 240, h: GAME_H - sy }, { x: sx + 240, y: pitY, w: 460, h: GAME_H - pitY }, { x: sx + 360, y: 360, w: 220, h: 30 }, { x: sx + 700, y: endY, w: 220, h: GAME_H - endY });
        hazards.push({ x: sx + 275, y: pitY - 16, w: 390, h: 16 });
        winds.push({ x: sx + 245, y: 230, w: 105, h: 270, vy: -580, vx: 0, active: true }, { x: sx + 585, y: 230, w: 105, h: 270, vy: -580, vx: 0, active: true });
        zombies.push({ x: sx + 520, y: 360, dir: -1, dead: false }, { x: sx + 830, y: endY, dir: -1, dead: false });
        return { width: 920, endY };
    },
    // 4 (Modul 5): Die Kisten-Brücke (Kugel-Anker + Kiste im Aufwind)
    (sx, sy, id) => {
        const endY = sy;
        platforms.push({ x: sx, y: sy, w: 860, h: GAME_H - sy }, { x: sx + 310, y: sy - 210, w: 160, h: 28 });
        winds.push({ x: sx + 330, y: sy - 182, w: 120, h: 182, vy: -560, vx: 0, active: true });
        boxes.push({ x: sx + 366, y: sy - 165, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id, x: sx + 358, y: sy - 12, w: 64, h: 12, pressed: false });
        gates.push({ id, x: sx + 660, y: sy - 160, w: 28, h: 160, openH: 0 });
        return { width: 860, endY };
    },
    // 5 (Modul 6): Doppel-Glas-Etage (Timing-Stampfer mit Zombie)
    (sx, sy, id) => {
        const topY = Math.max(220, sy - 230), midY = topY + 135, botY = 510, endY = 470;
        platforms.push({ x: sx, y: sy, w: 130, h: GAME_H - sy }, { x: sx + 250, y: topY, w: 170, h: 32 }, { x: sx + 530, y: topY, w: 150, h: 32 },
            { x: sx + 250, y: midY, w: 170, h: 28 }, { x: sx + 530, y: midY, w: 150, h: 28 }, { x: sx + 250, y: botY, w: 650, h: GAME_H - botY }, { x: sx + 900, y: endY, w: 140, h: GAME_H - endY });
        winds.push({ x: sx + 132, y: topY - 60, w: 115, h: sy - topY + 60, vy: -580, vx: 0, active: true });
        breakables.push({ x: sx + 420, y: topY, w: 110, h: 32, type: 'floor' }, { x: sx + 420, y: midY, w: 110, h: 28, type: 'floor' });
        zombies.push({ x: sx + 475, y: midY, dir: -1, dead: false });
        buttons.push({ id, x: sx + 443, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 780, y: botY - 170, w: 28, h: 170, openH: 0 });
        return { width: 1040, endY };
    },
    // 6 (Modul 7): Katapult-Bande (Winkel-Präzision über Stachelgrube)
    (sx, sy) => {
        const pitY = 530, highY = Math.max(330, sy - 80);
        platforms.push({ x: sx, y: sy, w: 240, h: GAME_H - sy }, { x: sx + 240, y: pitY, w: 220, h: GAME_H - pitY }, { x: sx + 460, y: highY, w: 460, h: GAME_H - highY });
        hazards.push({ x: sx + 265, y: pitY - 16, w: 170, h: 16 });
        breakables.push({ x: sx + 545, y: highY - 120, w: 36, h: 120, type: 'wall' });
        zombies.push({ x: sx + 780, y: highY, dir: -1, dead: false });
        return { width: 920, endY: highY };
    },
    // 7 (Modul 8): Wind-Slalom (Schweben & Einrollen im Wechsel)
    (sx, sy) => {
        const pitY = 530, endY = 460;
        platforms.push({ x: sx, y: sy, w: 140, h: GAME_H - sy }, { x: sx + 140, y: pitY, w: 640, h: GAME_H - pitY }, { x: sx + 380, y: 240, w: 160, h: 36 }, { x: sx + 780, y: endY, w: 160, h: GAME_H - endY });
        hazards.push({ x: sx + 160, y: pitY - 16, w: 600, h: 16 }, { x: sx + 390, y: 276, w: 140, h: 16 });
        winds.push({ x: sx + 180, y: 210, w: 140, h: 300, vy: -590, vx: 0, active: true }, { x: sx + 590, y: 210, w: 140, h: 300, vy: -590, vx: 0, active: true });
        return { width: 940, endY };
    },
    // 8 (Modul 9): Der Gegenwind-Katapult-Tunnel
    (sx, sy) => {
        platforms.push({ x: sx, y: sy, w: 880, h: GAME_H - sy }, { x: sx + 150, y: sy - 145, w: 580, h: 32 });
        winds.push({ x: sx + 230, y: sy - 113, w: 460, h: 113, vy: 0, vx: -460, active: true });
        boxes.push({ x: sx + 170, y: sy - 48, w: 48, h: 48, vx: 0, vy: 0 });
        return { width: 880, endY: sy };
    },
    // 9 (Modul 10): Kisten-Aufzug (Waldpilz-Trampolin)
    (sx, sy, id) => {
        const highY = Math.max(290, sy - 170);
        platforms.push({ x: sx, y: sy, w: 920, h: GAME_H - sy }, { x: sx + 340, y: highY, w: 280, h: 32 });
        mushrooms.push({ x: sx + 220, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
        boxes.push({ x: sx + 370, y: highY - 48, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id, x: sx + 510, y: highY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 740, y: sy - 170, w: 28, h: 170, openH: 0 });
        return { width: 920, endY: sy };
    },
    // 10 (Modul 11): Zombie-Kegeln (Steile Roll-Rampe)
    (sx, sy) => {
        const dropY = Math.min(530, sy + 110);
        platforms.push({ x: sx, y: sy, w: 160, h: GAME_H - sy }, { x: sx + 380, y: dropY, w: 640, h: GAME_H - dropY });
        ramps.push({ x1: sx + 160, y1: sy, x2: sx + 380, y2: dropY });
        zombies.push({ x: sx + 520, y: dropY, dir: -1, dead: false }, { x: sx + 630, y: dropY, dir: -1, dead: false }, { x: sx + 740, y: dropY, dir: -1, dead: false });
        breakables.push({ x: sx + 830, y: dropY - 120, w: 36, h: 120, type: 'wall' });
        return { width: 1020, endY: dropY };
    },
    // 11 (Leicht 1): Hängebrücke über unüberspringbarer Stachelgrube mit Torwand
    (sx, sy) => {
        const pitY = 540;
        platforms.push(
            { x: sx, y: sy, w: 280, h: GAME_H - sy },
            { x: sx + 280, y: pitY, w: 360, h: GAME_H - pitY },
            { x: sx + 640, y: sy, w: 270, h: GAME_H - sy },
            { x: sx + 640, y: 0, w: 46, h: sy - 64 }
        );
        hazards.push({ x: sx + 300, y: pitY - 16, w: 320, h: 16 });
        ropeBridges.push({ ropeX: sx + 455, ropeY: Math.max(70, sy - 275), x: sx + 288, y: Math.max(185, sy - 160), w: 344, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        zombies.push({ x: sx + 795, y: sy, dir: -1, dead: false });
        return { width: 910, endY: sy };
    },
    // 12 (Leicht 2): Farb-Trittsteine (Aktivieren-Knopf Blau & Rot)
    (sx, sy) => {
        const endY = Math.max(380, sy - 30);
        platforms.push({ x: sx, y: sy, w: 220, h: GAME_H - sy }, { x: sx + 695, y: endY, w: 225, h: GAME_H - endY });
        colorPlatforms.push(
            { x: sx + 285, y: sy - 24, w: 130, h: 20, color: 'blue' },
            { x: sx + 490, y: endY - 14, w: 130, h: 20, color: 'red' }
        );
        return { width: 920, endY };
    },
    // 13 (Mittel 1): Glasboden-Stampfer auf Marienkäfer-Schild
    (sx, sy, id) => {
        const topY = Math.max(240, sy - 190), botY = 505, endY = 470;
        platforms.push(
            { x: sx, y: sy, w: 130, h: GAME_H - sy },
            { x: sx + 250, y: topY, w: 155, h: 32 },
            { x: sx + 525, y: topY, w: 145, h: 32 },
            { x: sx + 250, y: botY, w: 630, h: GAME_H - botY },
            { x: sx + 880, y: endY, w: 140, h: GAME_H - endY }
        );
        winds.push({ x: sx + 132, y: topY - 60, w: 115, h: sy - topY + 60, vy: -580, vx: 0, active: true });
        breakables.push({ x: sx + 405, y: topY, w: 120, h: 32, type: 'floor' });
        beetles.push({ x: sx + 465, y: botY, dir: -1, dead: false });
        buttons.push({ id, x: sx + 620, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 770, y: botY - 170, w: 28, h: 170, openH: 0 });
        return { width: 1020, endY };
    },
    // 14 (Mittel 2): Wespen-Luftraum & Seil-Abwurf mit Torwand
    (sx, sy) => {
        const pitY = 540, midY = Math.max(350, sy - 35), endY = sy;
        platforms.push(
            { x: sx, y: sy, w: 240, h: GAME_H - sy },
            { x: sx + 370, y: midY, w: 260, h: 34 },
            { x: sx + 630, y: pitY, w: 350, h: GAME_H - pitY },
            { x: sx + 980, y: endY, w: 220, h: GAME_H - endY },
            { x: sx + 980, y: 0, w: 46, h: endY - 64 }
        );
        wasps.push({ x: sx + 305, y: midY - 52, baseX: sx + 305, baseY: midY - 52, rangeX: 42, phase: 0, dead: false });
        hazards.push({ x: sx + 650, y: pitY - 16, w: 310, h: 16 });
        ropeBridges.push({ ropeX: sx + 800, ropeY: Math.max(70, midY - 265), x: sx + 638, y: Math.max(185, midY - 155), w: 334, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        return { width: 1200, endY };
    },
    // 15 (Experte ab Level 6): Die Wind-Waage (Kippschalter)
    (sx, sy) => {
        const pitY = 535, endY = Math.max(350, sy - 60);
        platforms.push({ x: sx, y: sy, w: 190, h: GAME_H - sy }, { x: sx + 190, y: pitY, w: 440, h: GAME_H - pitY }, { x: sx + 630, y: endY, w: 330, h: GAME_H - endY });
        hazards.push({ x: sx + 210, y: pitY - 16, w: 400, h: 16 });
        winds.push({ x: sx + 210, y: 240, w: 125, h: 270, vy: -580, vx: 0, active: true });
        seesaws.push({ cx: sx + 430, cy: sy + 10, halfW: 135, angle: -0.22 });
        breakables.push({ x: sx + 685, y: endY - 120, w: 36, h: 120, type: 'wall' });
        return { width: 960, endY };
    },
    // 16 (Experte ab Level 6): Kisten-Schleuse im Gegenwind
    (sx, sy, id) => {
        const pitY = 535, windId = id + 100;
        platforms.push({ x: sx, y: sy, w: 340, h: GAME_H - sy }, { x: sx + 340, y: pitY, w: 220, h: GAME_H - pitY }, { x: sx + 560, y: sy, w: 620, h: GAME_H - sy });
        hazards.push({ x: sx + 360, y: pitY - 16, w: 180, h: 16 });
        winds.push({ x: sx + 380, y: 220, w: 135, h: 295, vy: -590, vx: 0, active: true }, { id: windId, x: sx + 585, y: sy - 140, w: 260, h: 140, vy: 0, vx: -470, active: true });
        boxes.push({ x: sx + 140, y: sy - 48, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id: windId, x: sx + 875, y: sy - 12, w: 58, h: 12, pressed: false, sticky: true, toggleWind: true }, { id, x: sx + 690, y: sy - 12, w: 64, h: 12, pressed: false });
        gates.push({ id, x: sx + 1020, y: sy - 165, w: 28, h: 165, openH: 0 });
        return { width: 1180, endY: sy };
    },
    // 17 (Experte ab Level 6): Stachel-Katapult-Staffel
    (sx, sy, id) => {
        const pitY = 535, endY = 470;
        platforms.push({ x: sx, y: sy, w: 170, h: GAME_H - sy }, { x: sx + 170, y: pitY, w: 860, h: GAME_H - pitY },
            { x: sx + 365, y: sy - 35, w: 135, h: 30 }, { x: sx + 685, y: sy - 135, w: 85, h: 28 }, { x: sx + 880, y: sy - 135, w: 85, h: 28 },
            { x: sx + 720, y: sy + 5, w: 210, h: 30 }, { x: sx + 1030, y: endY, w: 160, h: GAME_H - endY });
        hazards.push({ x: sx + 190, y: pitY - 16, w: 820, h: 16 });
        zombies.push({ x: sx + 430, y: sy - 35, dir: -1, dead: false });
        breakables.push({ x: sx + 770, y: sy - 135, w: 110, h: 28, type: 'floor' });
        buttons.push({ id, x: sx + 793, y: sy - 7, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 1080, y: endY - 165, w: 28, h: 165, openH: 0 });
        return { width: 1190, endY };
    },
    // 18 (Schwer 1 / Experte ab Level 6): Farb-Staffel im Wespen-Schwarm
    (sx, sy) => {
        const endY = Math.max(360, sy - 50);
        platforms.push({ x: sx, y: sy, w: 200, h: GAME_H - sy }, { x: sx + 895, y: endY, w: 215, h: GAME_H - endY });
        colorPlatforms.push(
            { x: sx + 275, y: sy - 20, w: 120, h: 20, color: 'red' },
            { x: sx + 485, y: sy - 42, w: 120, h: 20, color: 'blue' },
            { x: sx + 695, y: endY - 10, w: 120, h: 20, color: 'red' }
        );
        wasps.push(
            { x: sx + 440, y: sy - 95, baseX: sx + 440, baseY: sy - 95, rangeX: 38, phase: 0.4, dead: false },
            { x: sx + 650, y: endY - 82, baseX: sx + 650, baseY: endY - 82, rangeX: 38, phase: 2.2, dead: false }
        );
        return { width: 1110, endY };
    },
    // 19 (Schwer 2 / Experte ab Level 6): Dreifach-Timing (Farb-Absprung -> Käfer-Bruch -> Seil-Schnitt)
    (sx, sy, id) => {
        const pitY = 540, highY = Math.max(255, sy - 110), endY = 495;
        platforms.push(
            { x: sx, y: sy, w: 190, h: GAME_H - sy },
            { x: sx + 410, y: highY, w: 145, h: 30 },
            { x: sx + 665, y: highY, w: 145, h: 30 },
            { x: sx + 410, y: pitY, w: 760, h: GAME_H - pitY },
            { x: sx + 1170, y: endY, w: 170, h: GAME_H - endY },
            { x: sx + 1170, y: 0, w: 46, h: endY - 64 }
        );
        colorPlatforms.push({ x: sx + 245, y: sy - 48, w: 105, h: 20, color: 'blue' });
        breakables.push({ x: sx + 555, y: highY, w: 110, h: 30, type: 'floor' });
        beetles.push({ x: sx + 610, y: pitY, dir: -1, dead: false });
        hazards.push({ x: sx + 830, y: pitY - 16, w: 320, h: 16 });
        ropeBridges.push({ ropeX: sx + 985, ropeY: Math.max(70, highY - 220), x: sx + 818, y: Math.max(175, highY - 115), w: 344, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        buttons.push({ id, x: sx + 455, y: pitY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 1235, y: endY - 165, w: 28, h: 165, openH: 0 });
        return { width: 1340, endY };
    }
];

function loadLevel(idx, newSeed = false) {
    if (newSeed) state.levelSeed = (Math.random() * 1e9) | 0;
    const rng = createRng(state.levelSeed + idx * 7919);
    platforms = []; boxes = []; buttons = []; gates = []; breakables = []; winds = []; hazards = []; zombies = []; mushrooms = []; ramps = []; seesaws = [];
    colorPlatforms = []; ropeBridges = []; wasps = []; beetles = [];
    player.vx = 0; player.vy = 0; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = false; player.invuln = 0;

    let curX = 340, curY = 480, lastMod = -1;
    platforms.push({ x: 0, y: curY, w: curX, h: GAME_H - curY });

    const poolSize = idx >= 5 ? LEVEL_MODULES.length : 15;
    const count = getModuleCount(idx);
    for (let m = 0; m < count; m++) {
        let modIdx = (idx >= 5 && m === 0) ? 15 + Math.floor(rng() * 5) : Math.floor(rng() * poolSize);
        if (modIdx === lastMod && poolSize > 1) modIdx = (modIdx + 1) % poolSize;
        lastMod = modIdx;
        const res = LEVEL_MODULES[modIdx](curX, curY, m + 1, rng);
        curX += res.width; curY = res.endY;
    }

    platforms.push({ x: curX, y: curY, w: 460, h: GAME_H - curY });
    goalX = curX + 260;
    player.x = 120; player.y = 410; state.camX = 0;
}
