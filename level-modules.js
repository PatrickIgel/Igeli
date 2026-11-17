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
            addPlat([sx, sy, 120, GAME_H - sy], [sx + 260, topY, 420, 36], [sx + 260, botY, 660, GAME_H - botY], [sx + 920, endY, 140, GAME_H - endY]);
            addWind([sx + 125, topY - 70, 130, sy - topY + 130, 0, -560], [sx + 520, botY - 150, 280, 150, -420, 0]);
            addBreak(sx + 430 + Math.floor(rng() * 50), topY, 110, 36, 'floor');
            addBtn(id, sx + 340, botY - 12, true);
            addGate(id, sx + 830, botY);
            if (rng() > 0.3) spawnGroundEnemy(sx + 640, botY, rng, true);
            if (rng() > 0.65) addWasp(sx + 600, topY - 65, 40, rng() * 6);
            return { width: 1060, endY };
        } else {
            const topY = clampY(sy - 45, 340, 440);
            const botY = 510;
            const endY = clampY(topY + (rng() > 0.5 ? -30 : 25), 345, 465);
            addPlat([sx, sy, 120, GAME_H - sy], [sx + 120, topY, 170, 36], [sx + 400, topY, 240, 36], [sx + 120, botY, 660, GAME_H - botY], [sx + 920, endY, 140, GAME_H - endY]);
            addBreak(sx + 290, topY, 110, 36, 'floor');
            addBtn(id, sx + 313, botY - 12, true);
            addGate(id, sx + 690, botY);
            addWind([sx + 785, endY - 70, 130, botY - endY + 80, 0, -575]);
            if (rng() > 0.3) spawnGroundEnemy(sx + 520, botY, rng, true);
            return { width: 1060, endY };
        }
    },
    // 1: Kiste & Bodenschalter mit Stachelgrube (gespiegelte Reihenfolge möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const ledgeY = sy - 66, pitY = 525;
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 30), 350, 495);
        addPlat([sx, sy, 680, GAME_H - sy], [sx + (mirrored ? 340 : 160), ledgeY, 190, 30], [sx + 680, pitY, 165, GAME_H - pitY], [sx + 845, endY, 155, GAME_H - endY]);
        addBox(mirrored ? (sx + 380 + Math.floor(rng() * 40)) : (sx + 210 + Math.floor(rng() * 40)), ledgeY - 52);
        addBtn(id, mirrored ? (sx + 210) : (sx + 460), sy - 12);
        addGate(id, sx + 590, sy);
        addHaz(sx + 705, pitY - 16, 115);
        if (rng() > 0.4) {
            if (rng() > 0.65) addWasp(sx + 430, ledgeY - 62, 45, rng() * 6);
            else spawnGroundEnemy(sx + 420, sy, rng, true);
        }
        return { width: 1000, endY };
    },
    // 2: Katapult-Wanddurchbruch & Wächter (Gegner/Hindernis-Tausch)
    (sx, sy, id, rng) => {
        const upY = clampY(sy - (45 + Math.floor(rng() * 35)), 340, 490);
        addPlat([sx, sy, 300, GAME_H - sy], [sx + 300, upY, 580, GAME_H - upY]);
        addBreak(sx + 520, upY - 120, 36, 120, 'wall');
        spawnGroundEnemy(sx + 740, upY, rng, true);
        if (rng() > 0.45) {
            if (rng() > 0.5) addHaz(sx + 165, sy - 16, 72);
            else zombies.push({ x: sx + 220, y: sy, dir: -1, dead: false });
        }
        return { width: 880, endY: upY };
    },
    // 3: Patrouille & Stachelgrube mit Aufwind-Rettung
    (sx, sy, id, rng) => {
        const pitY = 525;
        const endY = clampY(sy + (rng() > 0.5 ? -55 : 25), 350, 495);
        addPlat([sx, sy, 240, GAME_H - sy], [sx + 240, pitY, 460, GAME_H - pitY], [sx + 360, 360, 220, 30], [sx + 700, endY, 220, GAME_H - endY]);
        addHaz(sx + 275, pitY - 16, 390);
        addWind([sx + 245, 230, 105, 270, 0, -580], [sx + 585, 230, 105, 270, 0, -580]);
        spawnGroundEnemy(sx + 520, 360, rng, true);
        if (rng() > 0.5) addWasp(sx + 810, endY - 75, 35, rng() * 6);
        else spawnGroundEnemy(sx + 830, endY, rng, true);
        return { width: 920, endY };
    },
    // 4 (Modul 5): Die Kisten-Brücke (Kugel-Anker + Kiste im Aufwind, inkl. Positions-Variante)
    (sx, sy, id, rng) => {
        const shifted = rng() > 0.5;
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 0), 350, 500);
        const shiftX = shifted ? 110 : 0;
        addPlat([sx, sy, 740, GAME_H - sy], [sx + 310 + shiftX, sy - 210, 160, 28], [sx + 740, endY, 140, GAME_H - endY]);
        addWind([sx + 330 + shiftX, sy - 182, 120, 182, 0, -560]);
        addBox(sx + 366 + shiftX, sy - 165);
        addBtn(id, sx + 358 + shiftX, sy - 12);
        addGate(id, sx + 660, sy);
        if (rng() > 0.55) spawnGroundEnemy(shifted ? sx + 220 : sx + 550, sy, rng, true);
        return { width: 880, endY };
    },
    // 5 (Modul 6): Doppel-Glas-Etage (Timing-Stampfer mit Gegner-Tausch)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 25), 350, 490);
        const botY = Math.max(endY + 35, 510);
        const topY = Math.max(220, Math.min(sy, endY) - 215), midY = topY + 135;
        addPlat([sx, sy, 130, GAME_H - sy], [sx + 250, topY, 170, 32], [sx + 530, topY, 150, 32], [sx + 250, midY, 170, 28], [sx + 530, midY, 150, 28], [sx + 250, botY, 650, GAME_H - botY], [sx + 900, endY, 140, GAME_H - endY]);
        addWind([sx + 132, topY - 60, 115, sy - topY + 60, 0, -580]);
        addBreak(sx + 420, topY, 110, 32, 'floor');
        addBreak(sx + 420, midY, 110, 28, 'floor');
        spawnGroundEnemy(sx + 475, midY, rng, true);
        addBtn(id, sx + 443, botY - 12, true);
        addGate(id, sx + 780, botY);
        return { width: 1040, endY };
    },
    // 6 (Modul 7): Katapult-Bande (Winkel-Präzision über Stachelgrube)
    (sx, sy, id, rng) => {
        const pitY = 530;
        const highY = clampY(sy - (45 + Math.floor(rng() * 40)), 335, 480);
        addPlat([sx, sy, 240, GAME_H - sy], [sx + 240, pitY, 220, GAME_H - pitY], [sx + 460, highY, 460, GAME_H - highY]);
        addHaz(sx + 265, pitY - 16, 170);
        addBreak(sx + 545, highY - 120, 36, 120, 'wall');
        spawnGroundEnemy(sx + 780, highY, rng, true);
        if (rng() > 0.6) addWasp(sx + 350, Math.min(sy, highY) - 95, 35, rng() * 6);
        return { width: 920, endY: highY };
    },
    // 7 (Modul 8): Wind-Slalom (gespiegelte Inselanordnung & Gegner-Tausch)
    (sx, sy, id, rng) => {
        const pitY = 530;
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 20), 350, 495);
        const mirrored = rng() > 0.5;
        const swapWasp = rng() > 0.5;
        if (!mirrored) {
            addPlat([sx, sy, 140, GAME_H - sy], [sx + 140, pitY, 640, GAME_H - pitY], [sx + 380, 240, 160, 36], [sx + 780, endY, 160, GAME_H - endY]);
            addHaz(sx + 160, pitY - 16, 600);
            if (swapWasp) addWasp(sx + 460, 345, 48, rng() * 6);
            addWind([sx + 180, 210, 140, 300, 0, -590], [sx + 590, 210, 140, 300, 0, -590]);
        } else {
            addPlat([sx, sy, 140, GAME_H - sy], [sx + 140, pitY, 640, GAME_H - pitY], [sx + 220, 255, 145, 34], [sx + 575, 255, 145, 34], [sx + 780, endY, 160, GAME_H - endY]);
            addHaz(sx + 160, pitY - 16, 600);
            addWind([sx + 390, 205, 150, 305, 0, -600]);
            if (swapWasp) addWasp(sx + 290, 360, 36, rng() * 6);
        }
        return { width: 940, endY };
    },
    // 8 (Modul 9): Der Gegenwind-Katapult-Tunnel (Hindernis-Tausch: Kiste vs Glaswand)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 0), 350, 500);
        const wallVariant = rng() > 0.5;
        addPlat([sx, sy, 740, GAME_H - sy], [sx + 150, sy - 145, 580, 32], [sx + 740, endY, 140, GAME_H - endY]);
        addWind([sx + 230, sy - 113, 460, 113, -460, 0]);
        if (wallVariant) {
            addBreak(sx + 455, sy - 113, 34, 113, 'wall');
            zombies.push({ x: sx + 620, y: sy, dir: -1, dead: false });
        } else {
            addBox(sx + 170, sy - 48);
        }
        return { width: 880, endY };
    },
    // 9 (Modul 10): Kisten-Aufzug (Waldpilz-Trampolin, gespiegelte Pilzseite möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const highY = Math.max(285, sy - 170);
        const endY = clampY(sy + (rng() > 0.5 ? -45 : 0), 350, 500);
        addPlat([sx, sy, 780, GAME_H - sy], [sx + (mirrored ? 150 : 340), highY, 280, 32], [sx + 780, endY, 140, GAME_H - endY]);
        if (!mirrored) {
            mushrooms.push({ x: sx + 220, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            addBox(sx + 370, highY - 48);
            addBtn(id, sx + 510, highY - 12, true);
        } else {
            mushrooms.push({ x: sx + 485, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            addBox(sx + 345, highY - 48);
            addBtn(id, sx + 195, highY - 12, true);
        }
        addGate(id, sx + 710, sy);
        return { width: 920, endY };
    },
    // 10 (Modul 11): Zombie-Kegeln (Steile Roll-Rampe mit Gegner-Mix)
    (sx, sy, id, rng) => {
        const dropY = clampY(sy + 75 + Math.floor(rng() * 45), 420, 530);
        addPlat([sx, sy, 160, GAME_H - sy], [sx + 380, dropY, 640, GAME_H - dropY]);
        ramps.push({ x1: sx + 160, y1: sy, x2: sx + 380, y2: dropY });
        zombies.push({ x: sx + 520, y: dropY, dir: -1, dead: false }, { x: sx + 630, y: dropY, dir: -1, dead: false });
        if (rng() > 0.5) beetles.push({ x: sx + 740, y: dropY, dir: -1, dead: false });
        else zombies.push({ x: sx + 740, y: dropY, dir: -1, dead: false });
        addBreak(sx + 830, dropY - 120, 36, 120, 'wall');
        return { width: 1020, endY: dropY };
    },
    // 11 (Leicht 1): Hängebrücke über unüberspringbarer Stachelgrube mit Torwand
    (sx, sy, id, rng) => {
        const pitY = 540;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 350, 500);
        addPlat([sx, sy, 280, GAME_H - sy], [sx + 280, pitY, 360, GAME_H - pitY], [sx + 640, endY, 270, GAME_H - endY], [sx + 640, 0, 46, endY - 64]);
        addHaz(sx + 300, pitY - 16, 320);
        addRope(sx + 455, Math.max(70, Math.min(sy, endY) - 275), sx + 288, Math.max(185, Math.min(sy, endY) - 160), 344, pitY - 34);
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
        addPlat([sx, sy, 220, GAME_H - sy], [sx + 695, endY, 225, GAME_H - endY]);
        addColorPlat([sx + 285, midY1, 130, swapColors ? 'red' : 'blue'], [sx + 490, midY2, 130, swapColors ? 'blue' : 'red']);
        if (rng() > 0.6) addWasp(sx + 450, Math.min(midY1, midY2) - 82, 40, rng() * 6);
        return { width: 920, endY };
    },
    // 13 (Mittel 1): Glasboden-Stampfer auf Wächter (Gegner-Tausch)
    (sx, sy, id, rng) => {
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 25), 350, 495);
        const botY = Math.max(endY + 30, 505);
        const topY = Math.max(240, Math.min(sy, endY) - 185);
        addPlat([sx, sy, 130, GAME_H - sy], [sx + 250, topY, 155, 32], [sx + 525, topY, 145, 32], [sx + 250, botY, 630, GAME_H - botY], [sx + 880, endY, 140, GAME_H - endY]);
        addWind([sx + 132, topY - 60, 115, sy - topY + 60, 0, -580]);
        addBreak(sx + 405, topY, 120, 32, 'floor');
        if (rng() > 0.4) {
            beetles.push({ x: sx + 465, y: botY, dir: -1, dead: false });
        } else {
            zombies.push({ x: sx + 465, y: botY, dir: -1, dead: false });
            addWasp(sx + 640, botY - 88, 38, rng() * 6);
        }
        addBtn(id, sx + 620, botY - 12, true);
        addGate(id, sx + 770, botY);
        return { width: 1020, endY };
    },
    // 14 (Mittel 2): Wespen-Luftraum & Seil-Abwurf mit Torwand
    (sx, sy, id, rng) => {
        const pitY = 540, midY = Math.max(350, sy - 35);
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 25), 350, 500);
        addPlat([sx, sy, 240, GAME_H - sy], [sx + 370, midY, 260, 34], [sx + 630, pitY, 350, GAME_H - pitY], [sx + 980, endY, 220, GAME_H - endY], [sx + 980, 0, 46, endY - 64]);
        addWasp(sx + 305, midY - 52, 42, rng() * 3);
        addHaz(sx + 650, pitY - 16, 310);
        addRope(sx + 800, Math.max(70, Math.min(midY, endY) - 265), sx + 638, Math.max(185, Math.min(midY, endY) - 155), 334, pitY - 34);
        if (rng() > 0.45) spawnGroundEnemy(sx + 1095, endY, rng, true);
        return { width: 1200, endY };
    },
    // 15 (Experte ab Level 6): Die Wind-Waage (Kippschalter, gespiegelte Windposition möglich)
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const pitY = 535;
        const endY = clampY(sy + (rng() > 0.5 ? -55 : -25), 345, 475);
        addPlat([sx, sy, 190, GAME_H - sy], [sx + 190, pitY, 440, GAME_H - pitY], [sx + 630, endY, 330, GAME_H - endY]);
        addHaz(sx + 210, pitY - 16, 400);
        if (!mirrored) {
            addWind([sx + 210, 240, 125, 270, 0, -580]);
            seesaws.push({ cx: sx + 455, cy: sy + 10, halfW: 135, angle: -0.22 });
        } else {
            seesaws.push({ cx: sx + 345, cy: sy + 10, halfW: 135, angle: -0.22 });
            addWind([sx + 495, 230, 125, 280, 0, -590]);
        }
        addBreak(sx + 685, endY - 120, 36, 120, 'wall');
        if (rng() > 0.55) spawnGroundEnemy(sx + 835, endY, rng, true);
        return { width: 960, endY };
    },
    // 16 (Experte ab Level 6): Kisten-Schleuse im Gegenwind
    (sx, sy, id, rng) => {
        const pitY = 535, windId = id + 100;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 0), 350, 500);
        addPlat([sx, sy, 340, GAME_H - sy], [sx + 340, pitY, 220, GAME_H - pitY], [sx + 560, sy, 480, GAME_H - sy], [sx + 1040, endY, 140, GAME_H - endY]);
        addHaz(sx + 360, pitY - 16, 180);
        addWind([sx + 380, 220, 135, 295, 0, -590], [sx + 585, sy - 140, 260, 140, -470, 0, windId]);
        addBox(sx + 140, sy - 48);
        addBtn(windId, sx + 875, sy - 12, true, true);
        addBtn(id, sx + 690, sy - 12);
        addGate(id, sx + 995, sy);
        return { width: 1180, endY };
    },
    // 17 (Experte ab Level 6): Stachel-Katapult-Staffel
    (sx, sy, id, rng) => {
        const pitY = 535;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 355, 495);
        addPlat([sx, sy, 170, GAME_H - sy], [sx + 170, pitY, 860, GAME_H - pitY], [sx + 365, sy - 35, 135, 30], [sx + 685, sy - 135, 85, 28], [sx + 880, sy - 135, 85, 28], [sx + 720, sy + 5, 210, 30], [sx + 1030, endY, 160, GAME_H - endY]);
        addHaz(sx + 190, pitY - 16, 820);
        spawnGroundEnemy(sx + 430, sy - 35, rng, true);
        addBreak(sx + 770, sy - 135, 110, 28, 'floor');
        addBtn(id, sx + 793, sy - 7, true);
        addGate(id, sx + 1080, endY);
        return { width: 1190, endY };
    },
    // 18 (Schwer 1 / Experte ab Level 6): Farb-Staffel im Wespen-Schwarm (Farbspiegelung)
    (sx, sy, id, rng) => {
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -50 : 30), 350, 495);
        addPlat([sx, sy, 200, GAME_H - sy], [sx + 895, endY, 215, GAME_H - endY]);
        addColorPlat([sx + 275, sy - 20, 120, c1], [sx + 485, sy - 42, 120, c2], [sx + 695, endY - 10, 120, c1]);
        addWasp(sx + 440, sy - 95, 38, 0.4 + rng() * 2);
        addWasp(sx + 650, endY - 82, 38, 2.2 + rng() * 2);
        return { width: 1110, endY };
    },
    // 19 (Schwer 2 / Experte ab Level 6): Dreifach-Timing (Farb- & Gegner-Variante)
    (sx, sy, id, rng) => {
        const pitY = 540;
        const endY = clampY(sy + (rng() > 0.5 ? -20 : 25), 375, 500);
        const highY = Math.max(255, Math.min(sy, endY) - 110);
        const stepColor = rng() > 0.5 ? 'red' : 'blue';
        addPlat([sx, sy, 190, GAME_H - sy], [sx + 410, highY, 145, 30], [sx + 665, highY, 145, 30], [sx + 410, pitY, 760, GAME_H - pitY], [sx + 1170, endY, 170, GAME_H - endY], [sx + 1170, 0, 46, endY - 64]);
        addColorPlat([sx + 245, sy - 48, 105, stepColor]);
        addBreak(sx + 555, highY, 110, 30, 'floor');
        spawnGroundEnemy(sx + 610, pitY, rng, true);
        addHaz(sx + 830, pitY - 16, 320);
        addRope(sx + 985, Math.max(70, highY - 220), sx + 818, Math.max(175, highY - 115), 344, pitY - 34);
        addBtn(id, sx + 455, pitY - 12, true);
        addGate(id, sx + 1235, endY);
        return { width: 1340, endY };
    }
];
