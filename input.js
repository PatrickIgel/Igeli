const controlButtons = [
    { id: 'redRight', x: 115,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'RECHTS', sub: 'Laufen' },
    { id: 'redCurl',  x: 245,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'KUGEL',  sub: 'Schwer/Anker' },
    { id: 'redAct',   x: 375,  y: 620, r: 48, hitR: 62, color: '#e5534b', label: 'AKTIV',  sub: 'Rot-Schalter' },
    { id: 'blueAct',  x: 905,  y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'AKTIV',  sub: 'Blau-Schalter' },
    { id: 'blueJump', x: 1035, y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'SPRUNG', sub: 'Katapult' },
    { id: 'blueLeft', x: 1165, y: 620, r: 48, hitR: 62, color: '#20b8f9', label: 'LINKS',  sub: 'Laufen' }
];
const uiButtons = {
    resetRoom: { x: GAME_W / 2 - 90, y: GAME_H - 52, w: 180, h: 40 },
    sound: { x: GAME_W - 68, y: 14, w: 52, h: 42 },
    fullscreen: { x: GAME_W - 130, y: 14, w: 52, h: 42 }
};

function isFullscreenActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
    const el = document.documentElement;
    if (!isFullscreenActive()) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req) {
            Promise.resolve(req.call(el)).then(() => {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            }).catch(() => {});
        }
    } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) Promise.resolve(exit.call(document)).catch(() => {});
    }
}

const btnFullscreenMenu = document.getElementById('btnFullscreenMenu');
if (btnFullscreenMenu) {
    btnFullscreenMenu.addEventListener('click', toggleFullscreen);
}

function getVisibleControlButtons() {
    if (netMode === 'host') return controlButtons.filter(b => b.id.startsWith('red'));
    if (netMode === 'client') return controlButtons.filter(b => b.id.startsWith('blue'));
    return controlButtons;
}

function toGameCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    let dx = (clientX - rect.left) - view.offsetX, dy = (clientY - rect.top) - view.offsetY;
    const c = Math.cos(-view.rotation), s = Math.sin(-view.rotation);
    return { x: (dx * c - dy * s) / view.scale + GAME_W / 2, y: (dx * s + dy * c) / view.scale + GAME_H / 2 };
}
function syncPointers() {
    inputs.redRight = inputs.redCurl = inputs.redAct = inputs.blueAct = inputs.blueJump = inputs.blueLeft = false;
    const visibleBtns = getVisibleControlButtons();
    for (const pt of activePointers.values()) for (const b of visibleBtns) if (Math.hypot(pt.x - b.x, pt.y - b.y) <= b.hitR) inputs[b.id] = true;
}
const hitRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

canvas.addEventListener('pointerdown', e => {
    if (soundOn) ensureAudio();
    const pt = toGameCoords(e.clientX, e.clientY);
    if (hitRect(pt, uiButtons.fullscreen)) { toggleFullscreen(); return; }
    if (hitRect(pt, uiButtons.sound)) { soundOn = !soundOn; if (soundOn) { ensureAudio(); playSound('soundToggle'); } return; }
    if (state.won || state.gameOver || hitRect(pt, uiButtons.resetRoom)) {
        if (netMode === 'client') {
            if (conn && conn.open) {
                try { conn.send({ type: 'reset' }); } catch (err) {}
            }
        } else {
            if (state.won || state.gameOver) {
                state.won = false; state.gameOver = false; state.levelIndex = 0; state.hearts = 5; state.enemiesDefeated = 0; state.elapsedTime = 0; state.maxCatapultJump = 0;
                loadLevel(0, true);
            } else {
                loadLevel(state.levelIndex, false);
            }
            if (netMode === 'host') sendGameState();
        }
        return;
    }
    activePointers.set(e.pointerId, pt);
    syncPointers();
    sendBlueInputs(true);
});
canvas.addEventListener('pointermove', e => {
    if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, toGameCoords(e.clientX, e.clientY));
        syncPointers();
        sendBlueInputs(false);
    }
});
const endPtr = e => {
    activePointers.delete(e.pointerId);
    syncPointers();
    sendBlueInputs(true);
};
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);

const keyMap = {
    KeyD: 'redRight', ArrowRight: 'redRight',
    KeyS: 'redCurl', ArrowDown: 'redCurl',
    KeyE: 'redAct', ShiftLeft: 'redAct',
    KeyW: 'blueJump', ArrowUp: 'blueJump',
    KeyA: 'blueLeft', ArrowLeft: 'blueLeft',
    KeyQ: 'blueAct', ShiftRight: 'blueAct'
};
function isKeyAllowedForRole(actionId) {
    if (netMode === 'host') return actionId.startsWith('red');
    if (netMode === 'client') return actionId.startsWith('blue');
    return true;
}
window.addEventListener('keydown', e => {
    if (soundOn) ensureAudio();
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    const act = keyMap[e.code];
    if (act && isKeyAllowedForRole(act)) { keys[act] = true; sendBlueInputs(true); }
});
window.addEventListener('keyup', e => {
    const act = keyMap[e.code];
    if (act && isKeyAllowedForRole(act)) { keys[act] = false; sendBlueInputs(true); }
});
