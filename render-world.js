// Hintergrund (Himmel, Parallax-Wolken, Bäume, Hügel)
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

    ctx.lineWidth = 4; ctx.strokeStyle = '#0d0f12';
    const cloudStep = 290;
    const firstCloud = Math.floor((minX - 120 + state.camX * 0.1 - 90) / cloudStep);
    const lastCloud = Math.ceil((maxX + 120 + state.camX * 0.1 - 90) / cloudStep);
    for (let i = firstCloud; i <= lastCloud; i++) {
        const cx = i * cloudStep + 90 - state.camX * 0.1;
        const cy = 75 + (((i % 3) + 3) % 3) * 48;
        ctx.fillStyle = '#ffffff'; ctx.beginPath();
        ctx.arc(cx, cy, 24, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(cx + 26, cy - 14, 30, Math.PI, Math.PI * 1.85);
        ctx.arc(cx + 58, cy - 6, 26, Math.PI * 1.15, Math.PI * 1.95); ctx.arc(cx + 76, cy + 4, 20, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    const treeCols = ['#d95338', '#e67e22', '#c83e2b'];
    const treeStep = 240;
    const firstTree = Math.floor((minX - 100 + state.camX * 0.22) / treeStep);
    const lastTree = Math.ceil((maxX + 100 + state.camX * 0.22) / treeStep);
    for (let i = firstTree; i <= lastTree; i++) {
        const tx = i * treeStep - state.camX * 0.22;
        const mod3 = ((i % 3) + 3) % 3;
        const mod2 = ((i % 2) + 2) % 2;
        const hillY = 445 + Math.sin((tx + state.camX * 0.15) * 0.004) * 35, crownY = hillY - 115 - mod2 * 18;
        ctx.fillStyle = '#5c3a21'; ctx.fillRect(tx - 14, crownY + 20, 28, groundBottom - crownY); ctx.strokeRect(tx - 14, crownY + 20, 28, groundBottom - crownY);
        ctx.fillStyle = treeCols[mod3]; ctx.beginPath();
        ctx.arc(tx - 32, crownY + 12, 34, Math.PI * 0.45, Math.PI * 1.65); ctx.arc(tx, crownY - 18, 42, Math.PI * 0.95, Math.PI * 2.05);
        ctx.arc(tx + 32, crownY + 12, 34, Math.PI * 1.35, Math.PI * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
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
