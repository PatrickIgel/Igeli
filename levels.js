function createRng(seed) {
    let s = (seed >>> 0) || 123456789;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const getModuleCount = idx => idx < 2 ? 1 : idx < 5 ? 2 : idx - 2;
const clampY = (y, min = 340, max = 505) => Math.max(min, Math.min(max, Math.round(y)));

function spawnGroundEnemy(x, y, rng, allowBeetle = true) {
    if (allowBeetle && rng() > 0.52) {
        beetles.push({ x, y, dir: -1, dead: false });
    } else {
        zombies.push({ x, y, dir: -1, dead: false });
    }
}

const START_PRESETS = [
    // 0: Klassische Startwiese
    () => {
        const curX = 340, curY = 480;
        platforms.push({ x: 0, y: curY, w: curX, h: GAME_H - curY });
        player.x = 120; player.y = curY - 70;
        return { curX, curY };
    },
    // 1: Schwung-Rampe (erhöhter Start mit Roll-Rampe)
    () => {
        const startY = 395, curY = 485, curX = 350;
        platforms.push(
            { x: 0, y: startY, w: 170, h: GAME_H - startY },
            { x: 310, y: curY, w: 40, h: GAME_H - curY }
        );
        ramps.push({ x1: 170, y1: startY, x2: 310, y2: curY });
        player.x = 95; player.y = startY - 70;
        return { curX, curY };
    },
    // 2: Aufwind-Klippe (Gleit-Start auf höhere Plattform)
    () => {
        const lowY = 495, curY = 415, curX = 420;
        platforms.push(
            { x: 0, y: lowY, w: 200, h: GAME_H - lowY },
            { x: 330, y: curY, w: 90, h: GAME_H - curY }
        );
        winds.push({ x: 205, y: curY - 70, w: 120, h: lowY - curY + 80, vy: -560, vx: 0, active: true });
        player.x = 105; player.y = lowY - 70;
        return { curX, curY };
    },
    // 3: Waldpilz-Katapult (Sprung-Start)
    () => {
        const lowY = 505, curY = 395, curX = 390;
        platforms.push(
            { x: 0, y: lowY, w: 250, h: GAME_H - lowY },
            { x: 250, y: curY, w: 140, h: GAME_H - curY }
        );
        mushrooms.push({ x: 170, y: lowY - 26, w: 72, h: 26, vy: -760, bounce: 0 });
        player.x = 95; player.y = lowY - 70;
        return { curX, curY };
    }
];

const GOAL_PRESETS = [
    // 0: Klassisches Ziel-Plateau
    (curX, curY) => {
        platforms.push({ x: curX, y: curY, w: 460, h: GAME_H - curY });
        goalX = curX + 260;
    },
    // 1: Sieges-Treppe (erhöhtes Zielpodest)
    (curX, curY) => {
        const stepY = clampY(curY - 56, 330, 460);
        platforms.push(
            { x: curX, y: curY, w: 160, h: GAME_H - curY },
            { x: curX + 160, y: stepY, w: 340, h: GAME_H - stepY }
        );
        goalX = curX + 310;
    },
    // 2: Ziel-Sprung über Stachelgrube mit Aufwind-Sicherheit
    (curX, curY) => {
        const pitY = 535, finalY = clampY(curY - 25, 350, 485);
        platforms.push(
            { x: curX, y: curY, w: 130, h: GAME_H - curY },
            { x: curX + 130, y: pitY, w: 160, h: GAME_H - pitY },
            { x: curX + 290, y: finalY, w: 280, h: GAME_H - finalY }
        );
        hazards.push({ x: curX + 148, y: pitY - 16, w: 124, h: 16 });
        winds.push({ x: curX + 145, y: finalY - 85, w: 130, h: pitY - finalY + 75, vy: -570, vx: 0, active: true });
        goalX = curX + 410;
    },
    // 3: Glaswand-Durchbruch vor der Ziellinie
    (curX, curY) => {
        platforms.push({ x: curX, y: curY, w: 520, h: GAME_H - curY });
        breakables.push({ x: curX + 185, y: curY - 120, w: 36, h: 120, type: 'wall' });
        goalX = curX + 350;
    }
];

// 20 Nahtlose Module (0-14 Standard ab Stufe 1, 15-19 Experten ab Stufe 6)
const LEVEL_MODULES = [
    // 0: Aufwind & Glasboden + Gegenwind-Schalter (inkl. gespiegelter Weg-Variante)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const deltaY = rng() > 0.5 ? -40 : 25;
        if (!mirrored) {
            const endY = clampY(sy + deltaY, 350, 485);
            const botY = Math.max(endY + 25, 500);
            const topY = Math.max(245, Math.min(sy, endY) - 185);
            platforms.push(
                { x: sx, y: sy, w: 120, h: GAME_H - sy },
                { x: sx + 260, y: topY, w: 420, h: 36 },
                { x: sx + 260, y: botY, w: 660, h: GAME_H - botY },
                { x: sx + 920, y: endY, w: 140, h: GAME_H - endY }
            );
            winds.push(
                { x: sx + 125, y: topY - 70, w: 130, h: sy - topY + 130, vy: -560, vx: 0, active: true },
                { x: sx + 520, y: botY - 150, w: 280, h: 150, vy: 0, vx: -420, active: true }
            );
            breakables.push({ x: sx + 430 + Math.floor(rng() * 50), y: topY, w: 110, h: 36, type: 'floor' });
            buttons.push({ id, x: sx + 340, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
            gates.push({ id, x: sx + 830, y: botY - 180, w: 28, h: 180, openH: 0 });
            if (rng() > 0.3) spawnGroundEnemy(sx + 640, botY, rng, true);
            if (rng() > 0.65) wasps.push({ x: sx + 600, y: topY - 65, baseX: sx + 600, baseY: topY - 65, rangeX: 40, phase: rng() * 6, dead: false });
            return { width: 1060, endY };
        } else {
            const topY = clampY(sy - 45, 340, 440);
            const botY = 510;
            const endY = clampY(topY + (rng() > 0.5 ? -30 : 25), 345, 465);
            platforms.push(
                { x: sx, y: sy, w: 120, h: GAME_H - sy },
                { x: sx + 120, y: topY, w: 170, h: 36 },
                { x: sx + 400, y: topY, w: 240, h: 36 },
                { x: sx + 120, y: botY, w: 660, h: GAME_H - botY },
                { x: sx + 920, y: endY, w: 140, h: GAME_H - endY }
            );
            breakables.push({ x: sx + 290, y: topY, w: 110, h: 36, type: 'floor' });
            buttons.push({ id, x: sx + 313, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
            gates.push({ id, x: sx + 690, y: botY - 175, w: 28, h: 175, openH: 0 });
            winds.push({ x: sx + 785, y: endY - 70, w: 130, h: botY - endY + 80, vy: -575, vx: 0, active: true });
            if (rng() > 0.3) spawnGroundEnemy(sx + 520, botY, rng, true);
            return { width: 1060, endY };
        }
    },
    // 1: Kiste & Bodenschalter mit Stachelgrube (gespiegelte Reihenfolge möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const ledgeY = sy - 66, pitY = 525;
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 30), 350, 495);
        platforms.push(
            { x: sx, y: sy, w: 680, h: GAME_H - sy },
            { x: sx + (mirrored ? 340 : 160), y: ledgeY, w: 190, h: 30 },
            { x: sx + 680, y: pitY, w: 165, h: GAME_H - pitY },
            { x: sx + 845, y: endY, w: 155, h: GAME_H - endY }
        );
        const boxX = mirrored ? (sx + 380 + Math.floor(rng() * 40)) : (sx + 210 + Math.floor(rng() * 40));
        const btnX = mirrored ? (sx + 210) : (sx + 460);
        boxes.push({ x: boxX, y: ledgeY - 52, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id, x: btnX, y: sy - 12, w: 64, h: 12, pressed: false });
        gates.push({ id, x: sx + 590, y: sy - 160, w: 28, h: 160, openH: 0 });
        hazards.push({ x: sx + 705, y: pitY - 16, w: 115, h: 16 });
        if (rng() > 0.4) {
            if (rng() > 0.65) wasps.push({ x: sx + 430, y: ledgeY - 62, baseX: sx + 430, baseY: ledgeY - 62, rangeX: 45, phase: rng() * 6, dead: false });
            else spawnGroundEnemy(sx + 420, sy, rng, true);
        }
        return { width: 1000, endY };
    },
    // 2: Katapult-Wanddurchbruch & Wächter (Gegner/Hindernis-Tausch)
    (sx, sy, id, rng) => {
        const upY = clampY(sy - (45 + Math.floor(rng() * 35)), 340, 490);
        platforms.push({ x: sx, y: sy, w: 300, h: GAME_H - sy }, { x: sx + 300, y: upY, w: 580, h: GAME_H - upY });
        breakables.push({ x: sx + 520, y: upY - 120, w: 36, h: 120, type: 'wall' });
        spawnGroundEnemy(sx + 740, upY, rng, true);
        if (rng() > 0.45) {
            if (rng() > 0.5) hazards.push({ x: sx + 165, y: sy - 16, w: 72, h: 16 });
            else zombies.push({ x: sx + 220, y: sy, dir: -1, dead: false });
        }
        return { width: 880, endY: upY };
    },
    // 3: Patrouille & Stachelgrube mit Aufwind-Rettung
    (sx, sy, id, rng) => {
        const pitY = 525;
        const endY = clampY(sy + (rng() > 0.5 ? -55 : 25), 350, 495);
        platforms.push(
            { x: sx, y: sy, w: 240, h: GAME_H - sy },
            { x: sx + 240, y: pitY, w: 460, h: GAME_H - pitY },
            { x: sx + 360, y: 360, w: 220, h: 30 },
            { x: sx + 700, y: endY, w: 220, h: GAME_H - endY }
        );
        hazards.push({ x: sx + 275, y: pitY - 16, w: 390, h: 16 });
        winds.push(
            { x: sx + 245, y: 230, w: 105, h: 270, vy: -580, vx: 0, active: true },
            { x: sx + 585, y: 230, w: 105, h: 270, vy: -580, vx: 0, active: true }
        );
        spawnGroundEnemy(sx + 520, 360, rng, true);
        if (rng() > 0.5) wasps.push({ x: sx + 810, y: endY - 75, baseX: sx + 810, baseY: endY - 75, rangeX: 35, phase: rng() * 6, dead: false });
        else spawnGroundEnemy(sx + 830, endY, rng, true);
        return { width: 920, endY };
    },
    // 4 (Modul 5): Die Kisten-Brücke (Kugel-Anker + Kiste im Aufwind, inkl. Positions-Variante)
    (sx, sy, id, rng) => {
        const shifted = rng() > 0.5;
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 0), 350, 500);
        const shiftX = shifted ? 110 : 0;
        platforms.push(
            { x: sx, y: sy, w: 740, h: GAME_H - sy },
            { x: sx + 310 + shiftX, y: sy - 210, w: 160, h: 28 },
            { x: sx + 740, y: endY, w: 140, h: GAME_H - endY }
        );
        winds.push({ x: sx + 330 + shiftX, y: sy - 182, w: 120, h: 182, vy: -560, vx: 0, active: true });
        boxes.push({ x: sx + 366 + shiftX, y: sy - 165, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push({ id, x: sx + 358 + shiftX, y: sy - 12, w: 64, h: 12, pressed: false });
        gates.push({ id, x: sx + 660, y: sy - 160, w: 28, h: 160, openH: 0 });
        if (rng() > 0.55) spawnGroundEnemy(shifted ? sx + 220 : sx + 550, sy, rng, true);
        return { width: 880, endY };
    },
    // 5 (Modul 6): Doppel-Glas-Etage (Timing-Stampfer mit Gegner-Tausch)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 25), 350, 490);
        const botY = Math.max(endY + 35, 510);
        const topY = Math.max(220, Math.min(sy, endY) - 215), midY = topY + 135;
        platforms.push(
            { x: sx, y: sy, w: 130, h: GAME_H - sy },
            { x: sx + 250, y: topY, w: 170, h: 32 },
            { x: sx + 530, y: topY, w: 150, h: 32 },
            { x: sx + 250, y: midY, w: 170, h: 28 },
            { x: sx + 530, y: midY, w: 150, h: 28 },
            { x: sx + 250, y: botY, w: 650, h: GAME_H - botY },
            { x: sx + 900, y: endY, w: 140, h: GAME_H - endY }
        );
        winds.push({ x: sx + 132, y: topY - 60, w: 115, h: sy - topY + 60, vy: -580, vx: 0, active: true });
        breakables.push({ x: sx + 420, y: topY, w: 110, h: 32, type: 'floor' }, { x: sx + 420, y: midY, w: 110, h: 28, type: 'floor' });
        spawnGroundEnemy(sx + 475, midY, rng, true);
        buttons.push({ id, x: sx + 443, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 780, y: botY - 170, w: 28, h: 170, openH: 0 });
        return { width: 1040, endY };
    },
    // 6 (Modul 7): Katapult-Bande (Winkel-Präzision über Stachelgrube)
    (sx, sy, id, rng) => {
        const pitY = 530;
        const highY = clampY(sy - (45 + Math.floor(rng() * 40)), 335, 480);
        platforms.push(
            { x: sx, y: sy, w: 240, h: GAME_H - sy },
            { x: sx + 240, y: pitY, w: 220, h: GAME_H - pitY },
            { x: sx + 460, y: highY, w: 460, h: GAME_H - highY }
        );
        hazards.push({ x: sx + 265, y: pitY - 16, w: 170, h: 16 });
        breakables.push({ x: sx + 545, y: highY - 120, w: 36, h: 120, type: 'wall' });
        spawnGroundEnemy(sx + 780, highY, rng, true);
        if (rng() > 0.6) wasps.push({ x: sx + 350, y: Math.min(sy, highY) - 95, baseX: sx + 350, baseY: Math.min(sy, highY) - 95, rangeX: 35, phase: rng() * 6, dead: false });
        return { width: 920, endY: highY };
    },
    // 7 (Modul 8): Wind-Slalom (gespiegelte Inselanordnung & Gegner-Tausch)
    (sx, sy, id, rng) => {
        const pitY = 530;
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 20), 350, 495);
        const mirrored = rng() > 0.5;
        const swapWasp = rng() > 0.5;
        if (!mirrored) {
            platforms.push(
                { x: sx, y: sy, w: 140, h: GAME_H - sy },
                { x: sx + 140, y: pitY, w: 640, h: GAME_H - pitY },
                { x: sx + 380, y: 240, w: 160, h: 36 },
                { x: sx + 780, y: endY, w: 160, h: GAME_H - endY }
            );
            hazards.push({ x: sx + 160, y: pitY - 16, w: 600, h: 16 });
            if (swapWasp) {
                wasps.push({ x: sx + 460, y: 345, baseX: sx + 460, baseY: 345, rangeX: 48, phase: rng() * 6, dead: false });
            } else {
                hazards.push({ x: sx + 390, y: 276, w: 140, h: 16 });
            }
            winds.push(
                { x: sx + 180, y: 210, w: 140, h: 300, vy: -590, vx: 0, active: true },
                { x: sx + 590, y: 210, w: 140, h: 300, vy: -590, vx: 0, active: true }
            );
        } else {
            platforms.push(
                { x: sx, y: sy, w: 140, h: GAME_H - sy },
                { x: sx + 140, y: pitY, w: 640, h: GAME_H - pitY },
                { x: sx + 220, y: 255, w: 145, h: 34 },
                { x: sx + 575, y: 255, w: 145, h: 34 },
                { x: sx + 780, y: endY, w: 160, h: GAME_H - endY }
            );
            hazards.push({ x: sx + 160, y: pitY - 16, w: 600, h: 16 });
            winds.push({ x: sx + 390, y: 205, w: 150, h: 305, vy: -600, vx: 0, active: true });
            if (swapWasp) wasps.push({ x: sx + 290, y: 360, baseX: sx + 290, baseY: 360, rangeX: 36, phase: rng() * 6, dead: false });
        }
        return { width: 940, endY };
    },
    // 8 (Modul 9): Der Gegenwind-Katapult-Tunnel (Hindernis-Tausch: Kiste vs Glaswand)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 0), 350, 500);
        const wallVariant = rng() > 0.5;
        platforms.push(
            { x: sx, y: sy, w: 740, h: GAME_H - sy },
            { x: sx + 150, y: sy - 145, w: 580, h: 32 },
            { x: sx + 740, y: endY, w: 140, h: GAME_H - endY }
        );
        winds.push({ x: sx + 230, y: sy - 113, w: 460, h: 113, vy: 0, vx: -460, active: true });
        if (wallVariant) {
            breakables.push({ x: sx + 455, y: sy - 113, w: 34, h: 113, type: 'wall' });
            zombies.push({ x: sx + 620, y: sy, dir: -1, dead: false });
        } else {
            boxes.push({ x: sx + 170, y: sy - 48, w: 48, h: 48, vx: 0, vy: 0 });
        }
        return { width: 880, endY };
    },
    // 9 (Modul 10): Kisten-Aufzug (Waldpilz-Trampolin, gespiegelte Pilzseite möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const highY = Math.max(285, sy - 170);
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 0), 350, 500);
        platforms.push(
            { x: sx, y: sy, w: 780, h: GAME_H - sy },
            { x: sx + (mirrored ? 150 : 340), y: highY, w: 280, h: 32 },
            { x: sx + 780, y: endY, w: 140, h: GAME_H - endY }
        );
        if (!mirrored) {
            mushrooms.push({ x: sx + 220, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            boxes.push({ x: sx + 370, y: highY - 48, w: 48, h: 48, vx: 0, vy: 0 });
            buttons.push({ id, x: sx + 510, y: highY - 12, w: 64, h: 12, pressed: false, sticky: true });
        } else {
            mushrooms.push({ x: sx + 485, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            boxes.push({ x: sx + 345, y: highY - 48, w: 48, h: 48, vx: 0, vy: 0 });
            buttons.push({ id, x: sx + 195, y: highY - 12, w: 64, h: 12, pressed: false, sticky: true });
        }
        gates.push({ id, x: sx + 710, y: sy - 170, w: 28, h: 170, openH: 0 });
        return { width: 920, endY };
    },
    // 10 (Modul 11): Zombie-Kegeln (Steile Roll-Rampe mit Gegner-Mix)
    (sx, sy, id, rng) => {
        const dropY = clampY(sy + 75 + Math.floor(rng() * 45), 420, 530);
        platforms.push({ x: sx, y: sy, w: 160, h: GAME_H - sy }, { x: sx + 380, y: dropY, w: 640, h: GAME_H - dropY });
        ramps.push({ x1: sx + 160, y1: sy, x2: sx + 380, y2: dropY });
        zombies.push({ x: sx + 520, y: dropY, dir: -1, dead: false }, { x: sx + 630, y: dropY, dir: -1, dead: false });
        if (rng() > 0.5) beetles.push({ x: sx + 740, y: dropY, dir: -1, dead: false });
        else zombies.push({ x: sx + 740, y: dropY, dir: -1, dead: false });
        breakables.push({ x: sx + 830, y: dropY - 120, w: 36, h: 120, type: 'wall' });
        return { width: 1020, endY: dropY };
    },
    // 11 (Leicht 1): Hängebrücke über unüberspringbarer Stachelgrube mit Torwand
    (sx, sy, id, rng) => {
        const pitY = 540;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 350, 500);
        platforms.push(
            { x: sx, y: sy, w: 280, h: GAME_H - sy },
            { x: sx + 280, y: pitY, w: 360, h: GAME_H - pitY },
            { x: sx + 640, y: endY, w: 270, h: GAME_H - endY },
            { x: sx + 640, y: 0, w: 46, h: endY - 64 }
        );
        hazards.push({ x: sx + 300, y: pitY - 16, w: 320, h: 16 });
        ropeBridges.push({ ropeX: sx + 455, ropeY: Math.max(70, Math.min(sy, endY) - 275), x: sx + 288, y: Math.max(185, Math.min(sy, endY) - 160), w: 344, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        spawnGroundEnemy(sx + 795, endY, rng, true);
        return { width: 910, endY };
    },
    // 12 (Leicht 2): Farb-Trittsteine (Farb- & Höhen-Spiegelung)
    (sx, sy, id, rng) => {
        const swapColors = rng() > 0.5;
        const stepUp = rng() > 0.5;
        const endY = clampY(sy + (stepUp ? -55 : 40), 350, 500);
        const midY1 = stepUp ? sy - 24 : sy + 14;
        const midY2 = stepUp ? endY - 14 : endY - 22;
        platforms.push({ x: sx, y: sy, w: 220, h: GAME_H - sy }, { x: sx + 695, y: endY, w: 225, h: GAME_H - endY });
        colorPlatforms.push(
            { x: sx + 285, y: midY1, w: 130, h: 20, color: swapColors ? 'red' : 'blue' },
            { x: sx + 490, y: midY2, w: 130, h: 20, color: swapColors ? 'blue' : 'red' }
        );
        if (rng() > 0.6) wasps.push({ x: sx + 450, y: Math.min(midY1, midY2) - 82, baseX: sx + 450, baseY: Math.min(midY1, midY2) - 82, rangeX: 40, phase: rng() * 6, dead: false });
        return { width: 920, endY };
    },
    // 13 (Mittel 1): Glasboden-Stampfer auf Wächter (Gegner-Tausch)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 25), 350, 495);
        const botY = Math.max(endY + 30, 505);
        const topY = Math.max(240, Math.min(sy, endY) - 185);
        platforms.push(
            { x: sx, y: sy, w: 130, h: GAME_H - sy },
            { x: sx + 250, y: topY, w: 155, h: 32 },
            { x: sx + 525, y: topY, w: 145, h: 32 },
            { x: sx + 250, y: botY, w: 630, h: GAME_H - botY },
            { x: sx + 880, y: endY, w: 140, h: GAME_H - endY }
        );
        winds.push({ x: sx + 132, y: topY - 60, w: 115, h: sy - topY + 60, vy: -580, vx: 0, active: true });
        breakables.push({ x: sx + 405, y: topY, w: 120, h: 32, type: 'floor' });
        if (rng() > 0.4) {
            beetles.push({ x: sx + 465, y: botY, dir: -1, dead: false });
        } else {
            zombies.push({ x: sx + 465, y: botY, dir: -1, dead: false });
            wasps.push({ x: sx + 640, y: botY - 88, baseX: sx + 640, baseY: botY - 88, rangeX: 38, phase: rng() * 6, dead: false });
        }
        buttons.push({ id, x: sx + 620, y: botY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 770, y: botY - 170, w: 28, h: 170, openH: 0 });
        return { width: 1020, endY };
    },
    // 14 (Mittel 2): Wespen-Luftraum & Seil-Abwurf mit Torwand
    (sx, sy, id, rng) => {
        const pitY = 540, midY = Math.max(350, sy - 35);
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 25), 350, 500);
        platforms.push(
            { x: sx, y: sy, w: 240, h: GAME_H - sy },
            { x: sx + 370, y: midY, w: 260, h: 34 },
            { x: sx + 630, y: pitY, w: 350, h: GAME_H - pitY },
            { x: sx + 980, y: endY, w: 220, h: GAME_H - endY },
            { x: sx + 980, y: 0, w: 46, h: endY - 64 }
        );
        wasps.push({ x: sx + 305, y: midY - 52, baseX: sx + 305, baseY: midY - 52, rangeX: 42, phase: rng() * 3, dead: false });
        hazards.push({ x: sx + 650, y: pitY - 16, w: 310, h: 16 });
        ropeBridges.push({ ropeX: sx + 800, ropeY: Math.max(70, Math.min(midY, endY) - 265), x: sx + 638, y: Math.max(185, Math.min(midY, endY) - 155), w: 334, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        if (rng() > 0.45) spawnGroundEnemy(sx + 1095, endY, rng, true);
        return { width: 1200, endY };
    },
    // 15 (Experte ab Level 6): Die Wind-Waage (Kippschalter, gespiegelte Windposition möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const pitY = 535;
        const endY = clampY(sy + (rng() > 0.5 ? -55 : -25), 345, 475);
        platforms.push(
            { x: sx, y: sy, w: 190, h: GAME_H - sy },
            { x: sx + 190, y: pitY, w: 440, h: GAME_H - pitY },
            { x: sx + 630, y: endY, w: 330, h: GAME_H - endY }
        );
        hazards.push({ x: sx + 210, y: pitY - 16, w: 400, h: 16 });
        if (!mirrored) {
            winds.push({ x: sx + 210, y: 240, w: 125, h: 270, vy: -580, vx: 0, active: true });
            seesaws.push({ cx: sx + 455, cy: sy + 10, halfW: 135, angle: -0.22 });
        } else {
            seesaws.push({ cx: sx + 345, cy: sy + 10, halfW: 135, angle: -0.22 });
            winds.push({ x: sx + 495, y: 230, w: 125, h: 280, vy: -590, vx: 0, active: true });
        }
        breakables.push({ x: sx + 685, y: endY - 120, w: 36, h: 120, type: 'wall' });
        if (rng() > 0.55) spawnGroundEnemy(sx + 835, endY, rng, true);
        return { width: 960, endY };
    },
    // 16 (Experte ab Level 6): Kisten-Schleuse im Gegenwind
    (sx, sy, id, rng) => {
        const pitY = 535, windId = id + 100;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 0), 350, 500);
        platforms.push(
            { x: sx, y: sy, w: 340, h: GAME_H - sy },
            { x: sx + 340, y: pitY, w: 220, h: GAME_H - pitY },
            { x: sx + 560, y: sy, w: 480, h: GAME_H - sy },
            { x: sx + 1040, y: endY, w: 140, h: GAME_H - endY }
        );
        hazards.push({ x: sx + 360, y: pitY - 16, w: 180, h: 16 });
        winds.push(
            { x: sx + 380, y: 220, w: 135, h: 295, vy: -590, vx: 0, active: true },
            { id: windId, x: sx + 585, y: sy - 140, w: 260, h: 140, vy: 0, vx: -470, active: true }
        );
        boxes.push({ x: sx + 140, y: sy - 48, w: 48, h: 48, vx: 0, vy: 0 });
        buttons.push(
            { id: windId, x: sx + 875, y: sy - 12, w: 58, h: 12, pressed: false, sticky: true, toggleWind: true },
            { id, x: sx + 690, y: sy - 12, w: 64, h: 12, pressed: false }
        );
        gates.push({ id, x: sx + 995, y: sy - 165, w: 28, h: 165, openH: 0 });
        return { width: 1180, endY };
    },
    // 17 (Experte ab Level 6): Stachel-Katapult-Staffel
    (sx, sy, id, rng) => {
        const pitY = 535;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 355, 495);
        platforms.push(
            { x: sx, y: sy, w: 170, h: GAME_H - sy },
            { x: sx + 170, y: pitY, w: 860, h: GAME_H - pitY },
            { x: sx + 365, y: sy - 35, w: 135, h: 30 },
            { x: sx + 685, y: sy - 135, w: 85, h: 28 },
            { x: sx + 880, y: sy - 135, w: 85, h: 28 },
            { x: sx + 720, y: sy + 5, w: 210, h: 30 },
            { x: sx + 1030, y: endY, w: 160, h: GAME_H - endY }
        );
        hazards.push({ x: sx + 190, y: pitY - 16, w: 820, h: 16 });
        spawnGroundEnemy(sx + 430, sy - 35, rng, true);
        breakables.push({ x: sx + 770, y: sy - 135, w: 110, h: 28, type: 'floor' });
        buttons.push({ id, x: sx + 793, y: sy - 7, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 1080, y: endY - 165, w: 28, h: 165, openH: 0 });
        return { width: 1190, endY };
    },
    // 18 (Schwer 1 / Experte ab Level 6): Farb-Staffel im Wespen-Schwarm (Farbspiegelung)
    (sx, sy, id, rng) => {
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -50 : 30), 350, 495);
        platforms.push({ x: sx, y: sy, w: 200, h: GAME_H - sy }, { x: sx + 895, y: endY, w: 215, h: GAME_H - endY });
        colorPlatforms.push(
            { x: sx + 275, y: sy - 20, w: 120, h: 20, color: c1 },
            { x: sx + 485, y: sy - 42, w: 120, h: 20, color: c2 },
            { x: sx + 695, y: endY - 10, w: 120, h: 20, color: c1 }
        );
        wasps.push(
            { x: sx + 440, y: sy - 95, baseX: sx + 440, baseY: sy - 95, rangeX: 38, phase: 0.4 + rng() * 2, dead: false },
            { x: sx + 650, y: endY - 82, baseX: sx + 650, baseY: endY - 82, rangeX: 38, phase: 2.2 + rng() * 2, dead: false }
        );
        return { width: 1110, endY };
    },
    // 19 (Schwer 2 / Experte ab Level 6): Dreifach-Timing (Farb- & Gegner-Variante)
    (sx, sy, id, rng) => {
        const pitY = 540;
        const endY = clampY(sy + (rng() > 0.5 ? -20 : 25), 375, 500);
        const highY = Math.max(255, Math.min(sy, endY) - 110);
        const stepColor = rng() > 0.5 ? 'red' : 'blue';
        platforms.push(
            { x: sx, y: sy, w: 190, h: GAME_H - sy },
            { x: sx + 410, y: highY, w: 145, h: 30 },
            { x: sx + 665, y: highY, w: 145, h: 30 },
            { x: sx + 410, y: pitY, w: 760, h: GAME_H - pitY },
            { x: sx + 1170, y: endY, w: 170, h: GAME_H - endY },
            { x: sx + 1170, y: 0, w: 46, h: endY - 64 }
        );
        colorPlatforms.push({ x: sx + 245, y: sy - 48, w: 105, h: 20, color: stepColor });
        breakables.push({ x: sx + 555, y: highY, w: 110, h: 30, type: 'floor' });
        spawnGroundEnemy(sx + 610, pitY, rng, true);
        hazards.push({ x: sx + 830, y: pitY - 16, w: 320, h: 16 });
        ropeBridges.push({ ropeX: sx + 985, ropeY: Math.max(70, highY - 220), x: sx + 818, y: Math.max(175, highY - 115), w: 344, h: 18, targetY: pitY - 34, vy: 0, cut: false, settled: false });
        buttons.push({ id, x: sx + 455, y: pitY - 12, w: 64, h: 12, pressed: false, sticky: true });
        gates.push({ id, x: sx + 1235, y: endY - 165, w: 28, h: 165, openH: 0 });
        return { width: 1340, endY };
    }
];

const shuffleBagState = {
    used: new Set(),
    cachedKey: '',
    cachedModules: []
};

function drawFromShuffleBag(rng, poolSize, lastMod, expertOnly = false) {
    const refillThreshold = Math.ceil(poolSize * 0.8);
    if (shuffleBagState.used.size >= refillThreshold) {
        shuffleBagState.used.clear();
    }

    const startIdx = expertOnly ? 15 : 0;
    const endIdx = poolSize;

    let candidates = [];
    for (let i = startIdx; i < endIdx; i++) {
        if (!shuffleBagState.used.has(i) && i !== lastMod) {
            candidates.push(i);
        }
    }

    if (candidates.length === 0 && expertOnly) {
        for (let i = startIdx; i < endIdx; i++) {
            shuffleBagState.used.delete(i);
            if (i !== lastMod) candidates.push(i);
        }
    }

    if (candidates.length === 0) {
        for (let i = startIdx; i < endIdx; i++) {
            if (!shuffleBagState.used.has(i)) candidates.push(i);
        }
    }

    const chosen = candidates[Math.floor(rng() * candidates.length)];
    shuffleBagState.used.add(chosen);

    if (shuffleBagState.used.size >= refillThreshold) {
        shuffleBagState.used.clear();
    }

    return chosen;
}

function loadLevel(idx, newSeed = false) {
    if (newSeed) {
        state.levelSeed = (Math.random() * 1e9) | 0;
        if (idx === 0) {
            shuffleBagState.used.clear();
            shuffleBagState.cachedKey = '';
            shuffleBagState.cachedModules = [];
        }
    }

    const rng = createRng(state.levelSeed + idx * 7919);
    const geoRng = createRng(((state.levelSeed ^ 0x9e3779b9) >>> 0) + idx * 104729);
    platforms = []; boxes = []; buttons = []; gates = []; breakables = []; winds = []; hazards = []; zombies = []; mushrooms = []; ramps = []; seesaws = [];
    colorPlatforms = []; ropeBridges = []; wasps = []; beetles = [];
    player.vx = 0; player.vy = 0; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = false; player.invuln = 0;

    const startPresetIdx = Math.floor(geoRng() * START_PRESETS.length);
    let { curX, curY } = START_PRESETS[startPresetIdx](geoRng);
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

    const goalPresetIdx = Math.floor(geoRng() * GOAL_PRESETS.length);
    GOAL_PRESETS[goalPresetIdx](curX, curY, geoRng);
    state.camX = 0;
}
