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
