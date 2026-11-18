function render() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width || window.innerWidth, h = rect.height || window.innerHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) { canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr); }
    ctx.save(); ctx.scale(dpr, dpr); ctx.fillStyle = '#1e2229'; ctx.fillRect(0, 0, w, h);

    const portrait = h > w;
    view.scale = portrait ? Math.min(w / GAME_H, h / GAME_W) : Math.min(w / GAME_W, h / GAME_H);
    view.rotation = portrait ? -Math.PI / 2 : 0; view.offsetX = w / 2; view.offsetY = h / 2;
    ctx.translate(view.offsetX, view.offsetY); ctx.rotate(view.rotation); ctx.scale(view.scale, view.scale); ctx.translate(-GAME_W / 2, -GAME_H / 2);

    renderBackground();

    ctx.save(); ctx.translate(-state.camX, 0);
    renderTerrain();
    renderEntities();
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
    drawBtn(uiButtons.fullscreen, isFullscreenActive() ? 'FENSTER' : 'VOLL');
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
