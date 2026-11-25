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
        addRope(sx + 990, Math.max(70, highY - 220), sx + 810, Math.max(175, highY - 115), 360, pitY - 34);
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
    },
    // 26 (Experte ab Level 6 / Farb-Kipp-Katapult): Arretierbare Rampe + Farb-Rückenwind durch Glaswand
    (sx, sy, id, rng) => {
        const pitY = 540;
        const lockCol = rng() > 0.5 ? 'red' : 'blue';
        const windCol = rng() > 0.5 ? (lockCol === 'red' ? 'blue' : 'red') : lockCol;
        const highY = clampY(sy - 55, 335, 435);
        const endY = clampY(highY - 25, 320, 415);
        addPlat(
            [sx, sy, 220, GAME_H - sy],
            [sx + 220, pitY, 410, GAME_H - pitY],
            [sx + 630, highY, 430, GAME_H - highY],
            [sx + 1060, endY, 180, GAME_H - endY]
        );
        addHaz(sx + 240, pitY - 16, 370);
        addSeesaw(sx + 425, sy - 16, 160, -0.24, lockCol);
        addWind([sx + 655, highY - 135, 220, 135, 480, 0, undefined, windCol]);
        addBreak(sx + 920, highY - 120, 36, 120, 'wall');
        if (rng() > 0.5) spawnGroundEnemy(sx + 1150, endY, rng, true);
        return { width: 1240, endY };
    },
    // 27 (Experte ab Level 6 / Magnet-Laser-Staffel): Zwei Wechsel-Magnete mit Farb-Laser dazwischen
    (sx, sy, id, rng) => {
        const pitY = 545;
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 345, 485);
        const m1Y = Math.max(185, sy - 145 - Math.floor(rng() * 20));
        const m2Y = Math.max(185, endY - 145 - Math.floor(rng() * 20));
        addPlat(
            [sx, sy, 200, GAME_H - sy],
            [sx + 200, pitY, 840, GAME_H - pitY],
            [sx + 1040, endY, 220, GAME_H - endY]
        );
        addHaz(sx + 220, pitY - 16, 800);
        addMagnet(
            [sx + 380, m1Y, 26, 255, 1240, c1],
            [sx + 840, m2Y, 26, 255, 1240, c2]
        );
        addColorLaser([sx + 610, Math.min(m1Y, m2Y) + 15, 22, 235, c1]);
        if (rng() > 0.5) spawnGroundEnemy(sx + 1155, endY, rng, true);
        return { width: 1260, endY };
    },
    // 28 (Experte ab Level 6 / Pilz-Kisten-Schleuse): Kisten-Lift per Pilz, Glasboden-Windschalter & Gegenwind-Tunnel
    (sx, sy, id, rng) => {
        const mirrored = rng() > 0.5;
        const windId = id + 100;
        const highY = Math.max(265, sy - 175);
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 0), 350, 500);
        addPlat(
            [sx, sy, 1080, GAME_H - sy],
            [sx + (mirrored ? 150 : 320), highY, 175, 32],
            [sx + (mirrored ? 435 : 605), highY, 155, 32],
            [sx + 1080, endY, 160, GAME_H - endY]
        );
        if (!mirrored) {
            mushrooms.push({ x: sx + 215, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            addBox(sx + 345, highY - 48);
            addBreak(sx + 495, highY, 110, 32, 'floor');
            addBtn(windId, sx + 550, sy - 12, true, true);
            addWind([sx + 615, sy - 140, 255, 140, -470, 0, windId]);
            addBtn(id, sx + 740, sy - 12);
        } else {
            mushrooms.push({ x: sx + 475, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
            addBox(sx + 340, highY - 48);
            addBreak(sx + 325, highY, 110, 32, 'floor');
            addBtn(windId, sx + 380, sy - 12, true, true);
            addWind([sx + 605, sy - 140, 265, 140, -470, 0, windId]);
            addBtn(id, sx + 735, sy - 12);
        }
        addGate(id, sx + 1015, sy);
        if (rng() > 0.5) zombies.push({ x: sx + 885, y: sy, dir: -1, dead: false });
        return { width: 1240, endY };
    },
    // 29 (Experte ab Level 6 / Moos-Stampfer-Kettenreaktion): Moos, Glasboden-Stampfer & Farb-Aufwind-Rettung
    (sx, sy, id, rng) => {
        const pitY = 545;
        const windCol = rng() > 0.5 ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -35 : 20), 350, 490);
        const topY = Math.max(225, Math.min(sy, endY) - 175);
        const midY = topY + 135;
        addPlat(
            [sx, sy, 140, GAME_H - sy],
            [sx + 140, pitY, 840, GAME_H - pitY],
            [sx + 430, midY, 130, 28],
            [sx + 670, midY, 145, 28],
            [sx + 980, endY, 190, GAME_H - endY]
        );
        addHaz(sx + 160, pitY - 16, 800);
        addWind(
            [sx + 150, topY - 60, 120, sy - topY + 60, 0, -600],
            [sx + 820, endY - 75, 145, pitY - endY + 55, 0, -620, undefined, windCol]
        );
        addMoss([sx + 295, topY, 120]);
        addBreak(sx + 560, midY, 110, 28, 'floor');
        beetles.push({ x: sx + 615, y: pitY - 16, dir: -1, dead: false });
        if (rng() > 0.5) addWasp(sx + 485, topY - 48, 36, rng() * 6);
        return { width: 1170, endY };
    },
    // 30 (Experte ab Level 6 / Rutsch-Kegeln mit Farb-Weiche): Steile Rampe, Farb-Plattform & Farb-Laser vor Gegner-Gruppe
    (sx, sy, id, rng) => {
        const pitY = 545;
        const switchCol = rng() > 0.5 ? 'red' : 'blue';
        const dropY = clampY(sy + 85 + Math.floor(rng() * 35), 430, 520);
        addPlat(
            [sx, sy, 165, GAME_H - sy],
            [sx + 385, pitY, 175, GAME_H - pitY],
            [sx + 560, dropY, 680, GAME_H - dropY]
        );
        ramps.push({ x1: sx + 165, y1: sy, x2: sx + 385, y2: dropY });
        addHaz(sx + 400, pitY - 16, 145);
        addColorPlat([sx + 410, dropY, 125, switchCol]);
        addColorLaser([sx + 615, dropY - 155, 22, 155, switchCol]);
        zombies.push({ x: sx + 740, y: dropY, dir: -1, dead: false }, { x: sx + 845, y: dropY, dir: -1, dead: false });
        if (rng() > 0.5) beetles.push({ x: sx + 950, y: dropY, dir: -1, dead: false });
        else zombies.push({ x: sx + 950, y: dropY, dir: -1, dead: false });
        addBreak(sx + 1045, dropY - 120, 36, 120, 'wall');
        return { width: 1240, endY: dropY };
    },
    // 31 (Experte ab Level 6 / Farb-Ventilator-Slalom unter Lasern): Wechselnde Farb-Aufwinde & Farb-Laser über Stacheln
    (sx, sy, id, rng) => {
        const pitY = 545;
        const swapColors = rng() > 0.5;
        const c1 = swapColors ? 'blue' : 'red';
        const c2 = swapColors ? 'red' : 'blue';
        const midY = clampY(sy - 45, 325, 425);
        const endY = clampY(midY - 35, 300, 415);
        addPlat(
            [sx, sy, 190, GAME_H - sy],
            [sx + 190, pitY, 850, GAME_H - pitY],
            [sx + 1040, endY, 200, GAME_H - endY]
        );
        addHaz(sx + 210, pitY - 16, 810);
        addWind(
            [sx + 225, midY - 75, 145, pitY - midY + 55, 0, -610, undefined, c1],
            [sx + 655, endY - 75, 145, pitY - endY + 55, 0, -620, undefined, c2]
        );
        addColorLaser(
            [sx + 505, midY - 115, 22, 230, c1],
            [sx + 925, endY - 115, 22, 230, c2]
        );
        if (rng() > 0.5) addWasp(sx + 1135, endY - 82, 36, rng() * 6);
        return { width: 1240, endY };
    },
    // 32 (Experte ab Level 6 / Kipp-Waage mit Kisten-Gegengewicht): Arretierbare Wippe für Kiste zum Torschalter
    (sx, sy, id, rng) => {
        const pitY = 540;
        const lockCol = rng() > 0.5 ? 'red' : 'blue';
        const endY = clampY(sy - 20, 345, 465);
        addPlat(
            [sx, sy, 250, GAME_H - sy],
            [sx + 250, pitY, 410, GAME_H - pitY],
            [sx + 660, endY, 540, GAME_H - endY]
        );
        addHaz(sx + 270, pitY - 16, 370);
        addBox(sx + 130, sy - 48);
        addSeesaw(sx + 455, sy - 10, 165, -0.22, lockCol);
        addBtn(id, sx + 845, endY - 12);
        addGate(id, sx + 1110, endY);
        if (rng() > 0.5) spawnGroundEnemy(sx + 965, endY, rng, true);
        return { width: 1200, endY };
    },
    // 33 (Experte ab Level 6 / Magnet-Pilz-Katapult): Waldpilz-Start in Magnet-Schwung durch Glaswand mit Wespe
    (sx, sy, id, rng) => {
        const pitY = 545;
        const magCol = rng() > 0.5 ? 'red' : 'blue';
        const highY = clampY(sy - (65 + Math.floor(rng() * 35)), 310, 420);
        const endY = clampY(highY + (rng() > 0.5 ? -20 : 25), 300, 445);
        const magY = Math.max(155, highY - 150);
        addPlat(
            [sx, sy, 230, GAME_H - sy],
            [sx + 230, pitY, 470, GAME_H - pitY],
            [sx + 700, highY, 370, 32],
            [sx + 1070, endY, 190, GAME_H - endY]
        );
        addHaz(sx + 250, pitY - 16, 430);
        mushrooms.push({ x: sx + 130, y: sy - 26, w: 72, h: 26, vy: -760, bounce: 0 });
        addMagnet([sx + 465, magY, 26, 255, 1240, magCol]);
        addBreak(sx + 855, highY - 120, 36, 120, 'wall');
        if (rng() > 0.45) addWasp(sx + 595, highY - 75, 38, rng() * 6);
        return { width: 1260, endY };
    },
    // 34 (Experte ab Level 6 / Moos-Tunnel im Gegenwind): Moos-Plattformen & feste Mittelplattform mit zentriertem Wind-Ausschalter
    (sx, sy, id, rng) => {
        const pitY = 545;
        const windId = id + 100;
        const laserCol = rng() > 0.5 ? 'red' : 'blue';
        const endY = clampY(sy + (rng() > 0.5 ? -30 : 20), 350, 490);
        const m1Y = clampY(sy - 12, 340, 485);
        const m2Y = clampY((sy + endY) * 0.5 - 14, 335, 480);
        const m3Y = clampY(endY - 12, 340, 485);
        const midPlatX = sx + 495;
        const midPlatW = 180;
        addPlat(
            [sx, sy, 180, GAME_H - sy],
            [sx + 180, pitY, 850, GAME_H - pitY],
            [midPlatX, m2Y, midPlatW, 26],
            [sx + 1030, endY, 200, GAME_H - endY]
        );
        addHaz(sx + 200, pitY - 16, 810);
        addMoss([sx + 235, m1Y, 120], [sx + 810, m3Y, 120]);
        addWind([sx + 625, m2Y - 145, 360, 145, -455, 0, windId]);
        addBtn(windId, midPlatX + Math.round((midPlatW - 58) / 2), m2Y - 12, true, true);
        if (rng() > 0.5) {
            addColorLaser([sx + 770, m3Y - 155, 22, 155, laserCol]);
        } else {
            addWasp(sx + 585, m2Y - 95, 38, rng() * 6);
        }
        return { width: 1230, endY };
    },
    // 35 (Experte ab Level 6 / Seil-Stampfer-Kombi): Seil-Schwung zu Glasboden & Farb-Schalterplattform vor Tor
    (sx, sy, id, rng) => {
        const pitY = 545;
        const platCol = rng() > 0.5 ? 'red' : 'blue';
        const highY = clampY(sy - 65, 315, 415);
        const switchY = clampY(highY + 115, 430, 505);
        const endY = clampY(sy + (rng() > 0.5 ? -20 : 25), 360, 495);
        addPlat(
            [sx, sy, 210, GAME_H - sy],
            [sx + 210, pitY, 790, GAME_H - pitY],
            [sx + 555, highY, 135, 30],
            [sx + 800, highY, 135, 30],
            [sx + 1000, endY, 270, GAME_H - endY]
        );
        addHaz(sx + 230, pitY - 16, 750);
        addRope(sx + 385, Math.max(70, Math.min(sy, highY) - 265), sx + 210, Math.max(185, Math.min(sy, highY) - 155), 330, pitY - 34);
        addBreak(sx + 690, highY, 110, 30, 'floor');
        addColorPlat([sx + 680, switchY, 130, platCol]);
        addBtn(id, sx + 730, switchY - 12, true);
        addGate(id, sx + 1145, endY);
        if (rng() > 0.5) spawnGroundEnemy(sx + 865, highY, rng, true);
        return { width: 1270, endY };
    }
);
