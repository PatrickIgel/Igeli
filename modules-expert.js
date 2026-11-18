// Experten-Module (19-25, verfügbar ab Stufe 6)
LEVEL_MODULES.push(
    // 19 (Experte ab Level 6): Die Wind-Waage (Kippschalter, gespiegelte Windposition möglich)
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
    // 18 (Experte ab Level 6): Kisten-Schleuse im Gegenwind
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
    // 20 (Schwer 1 / Experte ab Level 6): Farb-Staffel im Wespen-Schwarm (Farbspiegelung)
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
    // 21 (Schwer 2 / Experte ab Level 6): Dreifach-Timing (Farb- & Gegner-Variante)
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
    },
    // 22 (Experte ab Level 6 / Magnet-Blöcke Schwer): Doppel-Magnet-Staffel mit Wespe & Farb-Trittstein
    (sx, sy, id, rng) => {
        const pitY = 545;
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -40 : 15), 345, 485);
        const m1Y = Math.max(185, sy - 145);
        const m2Y = Math.max(180, endY - 150);
        addPlat([sx, sy, 200, GAME_H - sy], [sx + 200, pitY, 860, GAME_H - pitY], [sx + 1060, endY, 220, GAME_H - endY]);
        addHaz(sx + 220, pitY - 16, 820);
        addMagnet(
            [sx + 385, m1Y, 26, 255, 1240, c1],
            [sx + 855, m2Y, 26, 255, 1240, c2]
        );
        addColorPlat([sx + 565, Math.min(sy, endY) - 10, 115, c2]);
        addWasp(sx + 622, Math.min(m1Y, m2Y) + 55, 42, rng() * 6);
        if (rng() > 0.45) spawnGroundEnemy(sx + 1170, endY, rng, true);
        return { width: 1280, endY };
    },
    // 23 (Experte ab Level 6 / Farb-Ventilator Schwer): Kisten-Lift & Tor-Schleuse mit beiden Farb-Ventilatoren
    (sx, sy, id, rng) => {
        const pitY = 540;
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -30 : 20), 355, 495);
        const upperY = Math.max(245, Math.min(sy, endY) - 145);
        addPlat(
            [sx, sy, 230, GAME_H - sy],
            [sx + 230, pitY, 220, GAME_H - pitY],
            [sx + 450, upperY, 210, 30],
            [sx + 450, sy, 520, GAME_H - sy],
            [sx + 970, endY, 180, GAME_H - endY]
        );
        addHaz(sx + 250, pitY - 16, 180);
        addBox(sx + 125, sy - 48);
        addWind(
            [sx + 265, upperY - 70, 145, pitY - upperY + 55, 0, -610, undefined, c1],
            [sx + 665, upperY - 50, 175, sy - upperY + 50, 440, 0, undefined, c2]
        );
        addBtn(id, sx + 535, upperY - 12, true);
        addGate(id, sx + 915, sy);
        if (rng() > 0.5) spawnGroundEnemy(sx + 760, sy, rng, true);
        return { width: 1150, endY };
    },
    // 24 (Experte ab Level 6 / Kipp-Plattform mit Farb-Arretierung): Arretierbare Rampe für Kiste & Katapult
    (sx, sy, id, rng) => {
        const pitY = 540;
        const lockCol = rng() > 0.5 ? 'red' : 'blue';
        const highY = clampY(sy - 65, 325, 420);
        const endY = clampY(highY - 25, 310, 405);
        addPlat(
            [sx, sy, 230, GAME_H - sy],
            [sx + 230, pitY, 420, GAME_H - pitY],
            [sx + 650, highY, 450, GAME_H - highY],
            [sx + 1100, endY, 180, GAME_H - endY]
        );
        addHaz(sx + 250, pitY - 16, 380);
        addSeesaw(sx + 440, sy - 18, 165, -0.24, lockCol);
        addBox(sx + 125, sy - 48);
        addBtn(id, sx + 810, highY - 12, true);
        addGate(id, sx + 1045, highY);
        if (rng() > 0.5) addWasp(sx + 440, highY - 95, 40, rng() * 6);
        return { width: 1280, endY };
    },
    // 25 (Experte ab Level 6 / Moos-Plattformen Schwer): Moos-Stampfer & Etagen-Sprung über Stacheln
    (sx, sy, id, rng) => {
        const pitY = 540;
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 350, 490);
        const topY = Math.max(235, Math.min(sy, endY) - 165);
        const midY = topY + 125;
        addPlat(
            [sx, sy, 140, GAME_H - sy],
            [sx + 140, pitY, 320, GAME_H - pitY],
            [sx + 275, topY, 145, 30],
            [sx + 535, topY, 155, 30],
            [sx + 460, midY, 330, GAME_H - midY],
            [sx + 790, pitY, 220, GAME_H - pitY],
            [sx + 1010, endY, 180, GAME_H - endY]
        );
        addHaz(sx + 155, pitY - 16, 290);
        addHaz(sx + 805, pitY - 16, 190);
        addWind([sx + 145, topY - 65, 120, sy - topY + 65, 0, -595]);
        addMoss([sx + 420, topY, 115], [sx + 840, Math.min(midY, endY) - 14, 120]);
        addBtn(id, sx + 485, midY - 12, true);
        addGate(id, sx + 735, midY);
        if (rng() > 0.45) spawnGroundEnemy(sx + 615, midY, rng, true);
        return { width: 1190, endY };
    }
);
