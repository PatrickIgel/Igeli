// Hintergrund (Himmel, Parallax-Wolken, Bäume, Hügel)
function traceCloudUnionPath(puffs, baseY) {
    // Berechnet die exakten äußeren Schnittpunkte benachbarter Wolkenkreise,
    // damit ctx.stroke() nur die äußere Silhouette ohne innere Dreiecke zeichnet.
    const pts = [];
    for (let j = 0; j < puffs.length - 1; j++) {
        const a = puffs[j], b = puffs[j + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const l = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, a.r * a.r - l * l));
        const mx = a.x + (l * dx) / d;
        const my = a.y + (l * dy) / d;
        // Oberer Schnittpunkt (kleineres y)
        const ix1 = mx + (h * dy) / d, iy1 = my - (h * dx) / d;
        const ix2 = mx - (h * dy) / d, iy2 = my + (h * dx) / d;
        pts.push(iy1 < iy2 ? { x: ix1, y: iy1 } : { x: ix2, y: iy2 });
    }
    const first = puffs[0], last = puffs[puffs.length - 1];
    const startAng = Math.asin(Math.max(-1, Math.min(1, (baseY - first.y) / first.r)));
    const endAng = Math.PI - Math.asin(Math.max(-1, Math.min(1, (baseY - last.y) / last.r)));

    ctx.beginPath();
    for (let j = 0; j < puffs.length; j++) {
        const c = puffs[j];
        const a0 = j === 0 ? (Math.PI - startAng) : Math.atan2(pts[j - 1].y - c.y, pts[j - 1].x - c.x);
        const a1 = j === puffs.length - 1 ? (Math.PI - endAng) : Math.atan2(pts[j].y - c.y, pts[j].x - c.x);
        if (j === 0) ctx.arc(c.x, c.y, c.r, a0, a1, false);
        else ctx.arc(c.x, c.y, c.r, a0, a1, false);
    }
    ctx.quadraticCurveTo((first.x + last.x) * 0.5, baseY + 5, first.x + Math.cos(Math.PI - startAng) * first.r, baseY);
    ctx.closePath();
}

function traceCrownUnionPath(puffs) {
    // Berechnet die geschlossene äußere Kontur aller Kronen-Bäusche im Uhrzeigersinn
    const n = puffs.length;
    const pts = [];
    for (let j = 0; j < n; j++) {
        const a = puffs[j], b = puffs[(j + 1) % n];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const l = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, a.r * a.r - l * l));
        const mx = a.x + (l * dx) / d;
        const my = a.y + (l * dy) / d;
        // Äußerer Schnittpunkt (rechts der Bewegungsrichtung a -> b im Canvas-Koordinatensystem)
        const ix1 = mx + (h * dy) / d, iy1 = my - (h * dx) / d;
        const ix2 = mx - (h * dy) / d, iy2 = my + (h * dx) / d;
        const cross1 = dx * (iy1 - a.y) - dy * (ix1 - a.x);
        pts.push(cross1 < 0 ? { x: ix1, y: iy1 } : { x: ix2, y: iy2 });
    }
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
        const c = puffs[j];
        const prevPt = pts[(j - 1 + n) % n];
        const nextPt = pts[j];
        const a0 = Math.atan2(prevPt.y - c.y, prevPt.x - c.x);
        const a1 = Math.atan2(nextPt.y - c.y, nextPt.x - c.x);
        ctx.arc(c.x, c.y, c.r, a0, a1, false);
    }
    ctx.closePath();
}

function renderBackground(viewBounds) {
    const minX = (viewBounds ? viewBounds.minX : 0) - 20;
    const maxX = (viewBounds ? viewBounds.maxX : GAME_W) + 20;
    const minY = (viewBounds ? viewBounds.minY : 0) - 20;
    const maxY = (viewBounds ? viewBounds.maxY : GAME_H) + 20;
    const spanW = maxX - minX;
    const groundBottom = Math.max(GAME_H, maxY) + 10;

    if (minY < 0) {
        ctx.fillStyle = '#72b6f6';
        ctx.fillRect(minX, minY, spanW, -minY + 2);
    }
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
    sky.addColorStop(0, '#72b6f6'); sky.addColorStop(0.65, '#cde8f6'); sky.addColorStop(1, '#fde4be');
    ctx.fillStyle = sky; ctx.fillRect(minX, 0, spanW, GAME_H);
    if (maxY > GAME_H) {
        ctx.fillStyle = '#24150c';
        ctx.fillRect(minX, GAME_H - 2, spanW, maxY - GAME_H + 4);
    }

    // Parallax-Wolken (ohne innere Dreiecks-Linien, mit sanfter Schattierung & Glanzlicht)
    ctx.lineWidth = 4; ctx.strokeStyle = '#0d0f12'; ctx.lineJoin = 'round';
    const cloudStep = 290;
    const firstCloud = Math.floor((minX - 120 + state.camX * 0.1 - 90) / cloudStep);
    const lastCloud = Math.ceil((maxX + 120 + state.camX * 0.1 - 90) / cloudStep);
    for (let i = firstCloud; i <= lastCloud; i++) {
        const cx = i * cloudStep + 90 - state.camX * 0.1;
        const cy = 75 + (((i % 3) + 3) % 3) * 48;
        const puffs = [
            { x: cx, y: cy + 2, r: 21 },
            { x: cx + 23, y: cy - 11, r: 28 },
            { x: cx + 53, y: cy - 13, r: 29 },
            { x: cx + 79, y: cy + 1, r: 21 }
        ];
        const baseY = cy + 16;

        traceCloudUnionPath(puffs, baseY);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Sanfter bläulicher Schatten an der Wolken-Unterseite (innerhalb der Wolke geclippt)
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(cx - 30, baseY - 9, 140, 20);
        ctx.restore();

        // Feine Glanzlichter auf den oberen Wolkenkuppen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx + 23, cy - 11, 20, Math.PI * 1.15, Math.PI * 1.62);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 53, cy - 13, 21, Math.PI * 1.2, Math.PI * 1.68);
        ctx.stroke();

        // Saubere äußere Kontur
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        traceCloudUnionPath(puffs, baseY);
        ctx.stroke();
    }

    // Parallax-Bäume (mehrschichtige, plastische Baumkronen & detaillierte Stämme)
    const treePalettes = [
        { base: '#d95338', dark: '#a83822', light: '#f07b62', rim: '#f8a593' },
        { base: '#e67e22', dark: '#b85d14', light: '#f5a342', rim: '#fbd08d' },
        { base: '#c83e2b', dark: '#96281b', light: '#e36452', rim: '#f49c90' }
    ];
    const treeStep = 240;
    const firstTree = Math.floor((minX - 100 + state.camX * 0.22) / treeStep);
    const lastTree = Math.ceil((maxX + 100 + state.camX * 0.22) / treeStep);
    for (let i = firstTree; i <= lastTree; i++) {
        const tx = i * treeStep - state.camX * 0.22;
        const mod3 = ((i % 3) + 3) % 3;
        const mod2 = ((i % 2) + 2) % 2;
        const pal = treePalettes[mod3];
        const hillY = 445 + Math.sin((tx + state.camX * 0.15) * 0.004) * 35;
        const crownY = hillY - 118 - mod2 * 18;

        // 1. Leicht verjüngter Baumstamm mit Rindenschattierung & Ästen
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0d0f12';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath();
        ctx.moveTo(tx - 17, groundBottom);
        ctx.lineTo(tx - 11, crownY + 18);
        ctx.lineTo(tx + 11, crownY + 18);
        ctx.lineTo(tx + 17, groundBottom);
        ctx.closePath();
        ctx.fill();

        // Dunklere Rindenseite rechts & heller Streifen links
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#3d2514';
        ctx.fillRect(tx + 2, crownY + 15, 20, groundBottom - crownY);
        ctx.fillStyle = '#7c5338';
        ctx.fillRect(tx - 11, crownY + 15, 6, groundBottom - crownY);
        ctx.restore();

        // Stamm-Kontur
        ctx.beginPath();
        ctx.moveTo(tx - 17, groundBottom);
        ctx.lineTo(tx - 11, crownY + 18);
        ctx.lineTo(tx + 11, crownY + 18);
        ctx.lineTo(tx + 17, groundBottom);
        ctx.closePath();
        ctx.stroke();

        // Zwei kleine Äste, die in die Krone ragen
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx - 6, crownY + 34);
        ctx.lineTo(tx - 24, crownY + 18);
        ctx.moveTo(tx + 6, crownY + 29);
        ctx.lineTo(tx + 23, crownY + 14);
        ctx.stroke();

        // 2. Mehrschichtige Baumkrone (im Uhrzeigersinn für saubere Außenkontur)
        const crownPuffs = [
            { x: tx - 35, y: crownY + 14, r: 26 },
            { x: tx - 31, y: crownY - 13, r: 27 },
            { x: tx,      y: crownY - 27, r: 34 },
            { x: tx + 31, y: crownY - 13, r: 27 },
            { x: tx + 35, y: crownY + 14, r: 26 },
            { x: tx + 13, y: crownY + 25, r: 24 },
            { x: tx - 13, y: crownY + 25, r: 24 }
        ];

        traceCrownUnionPath(crownPuffs);
        ctx.fillStyle = pal.base;
        ctx.fill();

        // Innere Tiefe: Schatten unten/rechts & sonnenbeschienene Laub-Bäusche oben links
        ctx.save();
        ctx.clip();

        // Schatten-Bäusche unten
        ctx.fillStyle = pal.dark;
        ctx.beginPath();
        ctx.arc(tx + 26, crownY + 22, 30, 0, Math.PI * 2);
        ctx.arc(tx - 4, crownY + 31, 32, 0, Math.PI * 2);
        ctx.arc(tx - 32, crownY + 22, 26, 0, Math.PI * 2);
        ctx.fill();

        // Mittlere Laub-Bäusche
        ctx.fillStyle = pal.base;
        ctx.beginPath();
        ctx.arc(tx - 24, crownY - 2, 25, 0, Math.PI * 2);
        ctx.arc(tx + 22, crownY - 4, 24, 0, Math.PI * 2);
        ctx.arc(tx + 2, crownY + 6, 26, 0, Math.PI * 2);
        ctx.fill();

        // Sonnenbeschienene Laub-Kuppen oben links
        ctx.fillStyle = pal.light;
        ctx.beginPath();
        ctx.arc(tx - 6, crownY - 24, 26, 0, Math.PI * 2);
        ctx.arc(tx - 29, crownY - 12, 20, 0, Math.PI * 2);
        ctx.arc(tx + 20, crownY - 15, 18, 0, Math.PI * 2);
        ctx.fill();

        // Feine Glanz-Bögen (passend zum Zeichenstil von Igel & Marienkäfer)
        ctx.strokeStyle = pal.rim;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(tx - 2, crownY - 25, 24, Math.PI * 1.15, Math.PI * 1.62);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx - 30, crownY - 12, 19, Math.PI * 1.1, Math.PI * 1.55);
        ctx.stroke();

        ctx.restore();

        // Saubere schwarze Außenkontur der Baumkrone
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        traceCrownUnionPath(crownPuffs);
        ctx.stroke();
    }

    const hillStartX = Math.floor((minX - 80) / 40) * 40;
    const hillEndX = Math.ceil((maxX + 80) / 40) * 40;
    const hillGrad = ctx.createLinearGradient(0, 410, 0, GAME_H);
    hillGrad.addColorStop(0, '#d49a6a'); hillGrad.addColorStop(1, '#8c5832');
    ctx.fillStyle = hillGrad; ctx.beginPath(); ctx.moveTo(hillStartX, groundBottom);
    for (let x = hillStartX; x <= hillEndX; x += 40) ctx.lineTo(x, 445 + Math.sin((x + state.camX * 0.15) * 0.004) * 35);
    ctx.lineTo(hillEndX, groundBottom); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// Weltgeometrie (Windzonen, Erd-Inseln, Grasdecken, Rampen)
function renderTerrain(viewBounds) {

    for (const wi of winds) {
        if (!wi.active) continue;
        const fanActive = isColorActive(wi.color);
        if (wi.color) {
            const fanCol = wi.color === 'red' ? '#e5534b' : '#20b8f9';
            ctx.save();
            ctx.fillStyle = '#374151';
            ctx.strokeStyle = '#0d0f12';
            ctx.lineWidth = 4;
            if (wi.vy < 0) {
                const fx = wi.x + wi.w / 2, fy = wi.y + wi.h - 8;
                ctx.fillRect(wi.x + 12, fy - 8, wi.w - 24, 16);
                ctx.strokeRect(wi.x + 12, fy - 8, wi.w - 24, 16);
                ctx.fillStyle = fanCol;
                ctx.beginPath(); ctx.arc(fx, fy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            } else {
                const dir = wi.vx < 0 ? -1 : 1;
                const fx = dir > 0 ? wi.x + 8 : wi.x + wi.w - 8, fy = wi.y + wi.h / 2;
                ctx.fillRect(fx - 8, wi.y + 12, 16, wi.h - 24);
                ctx.strokeRect(fx - 8, wi.y + 12, 16, wi.h - 24);
                ctx.fillStyle = fanCol;
                ctx.beginPath(); ctx.arc(fx, fy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            if (!fanActive) {
                ctx.strokeStyle = fanCol;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([7, 6]);
                ctx.strokeRect(wi.x, wi.y, wi.w, wi.h);
                ctx.setLineDash([]);
            }
            ctx.restore();
        }
        if (!fanActive) continue;
        const wg = ctx.createLinearGradient(wi.x, wi.y, wi.x, wi.y + wi.h);
        if (wi.color === 'red') {
            wg.addColorStop(0, 'rgba(229,83,75,0.10)'); wg.addColorStop(0.5, 'rgba(254,202,202,0.36)'); wg.addColorStop(1, 'rgba(229,83,75,0.14)');
        } else if (wi.color === 'blue') {
            wg.addColorStop(0, 'rgba(32,184,249,0.10)'); wg.addColorStop(0.5, 'rgba(186,230,253,0.40)'); wg.addColorStop(1, 'rgba(32,184,249,0.14)');
        } else {
            wg.addColorStop(0, 'rgba(255,255,255,0.12)'); wg.addColorStop(0.5, 'rgba(224,242,254,0.38)'); wg.addColorStop(1, 'rgba(255,255,255,0.15)');
        }
        ctx.fillStyle = wg; ctx.fillRect(wi.x, wi.y, wi.w, wi.h);
        const t = performance.now() * 0.14;
        const leafCols = ['#f59e0b', '#e5534b', '#eab308', '#d97706'];
        for (let i = 0; i < 6; i++) {
            const prog = ((t + i * 45) % 180) / 180;
            const wx = wi.vx < 0 ? wi.x + wi.w * (1 - prog) : wi.x + (wi.w * (i + 0.5)) / 6 + Math.sin(prog * 6 + i) * 10;
            const wy = wi.vy < 0 ? wi.y + wi.h * (1 - prog) : wi.y + (wi.h * (i + 0.5)) / 6 + Math.cos(prog * 6 + i) * 6;

            // Zarte, leicht geschwungene Wind-Wellen & Luftpartikel versetzt zu den Blättern
            const sx = wi.vx < 0 ? wi.x + wi.w * (1 - ((prog + 0.45) % 1)) : wi.x + (wi.w * ((i + 3.2) % 6)) / 6;
            const sy = wi.vy < 0 ? wi.y + wi.h * (1 - ((prog + 0.45) % 1)) : wi.y + (wi.h * ((i + 3.2) % 6)) / 6;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            if (wi.vy < 0) {
                ctx.moveTo(sx, sy + 20);
                ctx.quadraticCurveTo(sx - 4, sy + 10, sx, sy);
                ctx.moveTo(sx - 3.5, sy + 5);
                ctx.lineTo(sx, sy);
                ctx.lineTo(sx + 3.5, sy + 5);
            } else {
                const dir = wi.vx < 0 ? -1 : 1;
                ctx.moveTo(sx - dir * 12, sy);
                ctx.quadraticCurveTo(sx, sy - 4, sx + dir * 12, sy);
                ctx.moveTo(sx + dir * 7, sy - 3.5);
                ctx.lineTo(sx + dir * 12, sy);
                ctx.lineTo(sx + dir * 7, sy + 3.5);
            }
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(Math.sin(prog * Math.PI * 2 + i) * 0.75 + (wi.vy < 0 ? -0.35 : 0.25));
            ctx.fillStyle = leafCols[i % leafCols.length];
            ctx.strokeStyle = '#0d0f12';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.quadraticCurveTo(-2, -6.5, 8, 0);
            ctx.quadraticCurveTo(-2, 6.5, -8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-11, 1);
            ctx.lineTo(5, 0);
            ctx.stroke();
            ctx.restore();
        }
    }

    const worldDirtGrad = ctx.createLinearGradient(0, 250, 0, GAME_H);
    worldDirtGrad.addColorStop(0, '#9e6c4a');
    worldDirtGrad.addColorStop(0.35, '#7a5238');
    worldDirtGrad.addColorStop(0.72, '#4e3322');
    worldDirtGrad.addColorStop(1, '#24150c');

    ctx.lineWidth = 5; ctx.strokeStyle = '#0d0f12'; ctx.lineJoin = 'round';
    const groundSegs = [];
    for (const p of platforms) {
        if (p.y > 100 && p.y + p.h >= GAME_H - 5) {
            groundSegs.push({ x1: p.x, y1: p.y, x2: p.x + p.w, y2: p.y });
        } else {
            ctx.fillStyle = worldDirtGrad;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.strokeRect(p.x, p.y, p.w, p.h);
            if (p.y > 100) {
                ctx.fillStyle = '#55b848'; ctx.fillRect(p.x - 2, p.y, p.w + 4, 20);
                ctx.fillStyle = '#7ad667'; ctx.fillRect(p.x, p.y + 3, p.w, 6);
                ctx.strokeRect(p.x - 2, p.y, p.w + 4, 20);
            }
        }
    }
    for (const rp of ramps) groundSegs.push({ x1: rp.x1, y1: rp.y1, x2: rp.x2, y2: rp.y2 });
    groundSegs.sort((a, b) => a.x1 - b.x1 || a.x2 - b.x2);

    const dirtBottom = Math.max(GAME_H, viewBounds ? viewBounds.maxY : GAME_H) + 10;
    const visWorldLeft = state.camX + (viewBounds ? viewBounds.minX : 0) - 100;
    const visWorldRight = state.camX + (viewBounds ? viewBounds.maxX : GAME_W) + 100;

    const groundIslands = [];
    for (const seg of groundSegs) {
        const cur = groundIslands[groundIslands.length - 1];
        if (cur && Math.abs(seg.x1 - cur[cur.length - 1].x2) <= 2) cur.push(seg);
        else groundIslands.push([seg]);
    }

    if (groundIslands.length > 0) {
        const firstSeg = groundIslands[0][0];
        if (visWorldLeft < firstSeg.x1) firstSeg.x1 = visWorldLeft;
        const lastIsland = groundIslands[groundIslands.length - 1];
        const lastSeg = lastIsland[lastIsland.length - 1];
        if (visWorldRight > lastSeg.x2) lastSeg.x2 = visWorldRight;
    }

    for (const island of groundIslands) {
        ctx.fillStyle = worldDirtGrad;
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(island[0].x1, dirtBottom);
        ctx.lineTo(island[0].x1, island[0].y1);
        for (const seg of island) {
            ctx.lineTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.lineTo(island[island.length - 1].x2, dirtBottom);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const grassRuns = [];
        for (let i = 0; i < island.length; i++) {
            const seg = island[i];
            const prev = i > 0 ? island[i - 1] : null;
            if (prev && Math.abs(seg.y1 - prev.y2) <= 2) grassRuns[grassRuns.length - 1].push({ seg, idx: i });
            else grassRuns.push([{ seg, idx: i }]);
        }
        for (const run of grassRuns) {
            const firstIdx = run[0].idx, lastIdx = run[run.length - 1].idx;
            const leftWall = firstIdx > 0 && island[firstIdx - 1].y2 < run[0].seg.y1 - 2;
            const rightWall = lastIdx < island.length - 1 && island[lastIdx + 1].y1 < run[run.length - 1].seg.y2 - 2;
            const gx0 = run[0].seg.x1 - (leftWall ? 0 : 2);
            const gxN = run[run.length - 1].seg.x2 + (rightWall ? 0 : 2);
            const pts = [{ x: gx0, y: run[0].seg.y1 }];
            for (let k = 0; k < run.length - 1; k++) pts.push({ x: run[k].seg.x2, y: run[k].seg.y2 });
            pts.push({ x: gxN, y: run[run.length - 1].seg.y2 });

            ctx.fillStyle = '#55b848';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
            for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k].x, pts[k].y + 20);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#7ad667';
            ctx.beginPath();
            ctx.moveTo(pts[0].x + (leftWall ? 0 : 2), pts[0].y + 3);
            for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x - (k === pts.length - 1 && !rightWall ? 2 : 0), pts[k].y + 3);
            for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k].x - (k === pts.length - 1 && !rightWall ? 2 : 0), pts[k].y + 9);
            ctx.lineTo(pts[0].x + (leftWall ? 0 : 2), pts[0].y + 9);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#0d0f12';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
            for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k].x, pts[k].y + 20);
            ctx.closePath();
            ctx.stroke();
        }
    }
}
