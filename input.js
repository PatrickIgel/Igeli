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

const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalonePWA = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

let pseudoFullscreen = false;
let iosFullscreenHintShown = false;

function ensureIOSFullscreenStyles() {
    if (document.getElementById('ios-fullscreen-style')) return;
    const style = document.createElement('style');
    style.id = 'ios-fullscreen-style';
    style.textContent = `
        html.ios-pseudo-fullscreen,
        body.ios-pseudo-fullscreen {
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: var(--ios-vh, 100dvh) !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            touch-action: none !important;
            background: #0d0f12 !important;
            -webkit-user-select: none !important;
            user-select: none !important;
        }
        html.ios-pseudo-fullscreen #gameCanvas,
        body.ios-pseudo-fullscreen #gameCanvas {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: var(--ios-vh, 100dvh) !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            z-index: 9990 !important;
            touch-action: none !important;
        }
        html.ios-pseudo-fullscreen #menuOverlay:not(.hidden),
        body.ios-pseudo-fullscreen #menuOverlay:not(.hidden) {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: var(--ios-vh, 100dvh) !important;
            z-index: 10000 !important;
        }
        #ios-fullscreen-toast {
            position: fixed;
            bottom: 18px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(13, 15, 18, 0.88);
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.22);
            border-radius: 10px;
            padding: 8px 14px;
            font: 600 13px/1.35 system-ui, -apple-system, sans-serif;
            text-align: center;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.25s ease;
            max-width: 90vw;
        }
        #ios-fullscreen-toast.visible {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

function syncIOSViewportSize() {
    if (!pseudoFullscreen) return;
    const vv = window.visualViewport;
    const vh = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--ios-vh', vh + 'px');
    if (vv && (vv.offsetTop > 0 || window.scrollY > 0)) {
        window.scrollTo(0, 0);
    }
}

function showIOSFullscreenHint() {
    if (!isIOSDevice || isStandalonePWA || iosFullscreenHintShown) return;
    iosFullscreenHintShown = true;
    let toast = document.getElementById('ios-fullscreen-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ios-fullscreen-toast';
        toast.textContent = 'Vollbild aktiv • Für randloses Vollbild: Teilen → „Zum Home-Bildschirm“';
        document.body.appendChild(toast);
    }
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        if (toast) toast.classList.remove('visible');
    }, 3800);
}

function updateFullscreenStateUI() {
    const active = isFullscreenActive();
    const btn = document.getElementById('btnFullscreenMenu');
    if (btn) btn.classList.toggle('is-fullscreen', active);
}

function setPseudoFullscreen(enable) {
    pseudoFullscreen = !!enable;
    ensureIOSFullscreenStyles();
    document.documentElement.classList.toggle('ios-pseudo-fullscreen', pseudoFullscreen);
    document.body.classList.toggle('ios-pseudo-fullscreen', pseudoFullscreen);

    if (pseudoFullscreen) {
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            const content = viewportMeta.getAttribute('content') || '';
            if (!content.includes('viewport-fit=cover')) {
                viewportMeta.setAttribute('content', content + (content ? ', ' : '') + 'viewport-fit=cover');
            }
        }
        syncIOSViewportSize();
        setTimeout(() => {
            window.scrollTo(0, 1);
            syncIOSViewportSize();
        }, 60);
        showIOSFullscreenHint();
    } else {
        document.documentElement.style.removeProperty('--ios-vh');
    }

    updateFullscreenStateUI();
    window.dispatchEvent(new Event('resize'));
}

window.addEventListener('resize', syncIOSViewportSize);
window.addEventListener('orientationchange', () => {
    setTimeout(syncIOSViewportSize, 120);
});
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncIOSViewportSize);
    window.visualViewport.addEventListener('scroll', syncIOSViewportSize);
}
document.addEventListener('fullscreenchange', updateFullscreenStateUI);
document.addEventListener('webkitfullscreenchange', updateFullscreenStateUI);

function isNativeFullscreenActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function isFullscreenActive() {
    return isNativeFullscreenActive() || pseudoFullscreen;
}

function toggleFullscreen() {
    const el = document.documentElement;
    if (!isFullscreenActive()) {
        const nativeSupported = !isIOSDevice &&
            (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled !== false);
        const req = nativeSupported
            ? (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)
            : null;
        if (req) {
            try {
                const res = req.call(el);
                if (res && typeof res.then === 'function') {
                    res.then(() => {
                        updateFullscreenStateUI();
                        if (screen.orientation && screen.orientation.lock) {
                            screen.orientation.lock('landscape').catch(() => {});
                        }
                    }).catch(() => {
                        setPseudoFullscreen(true);
                    });
                } else {
                    setTimeout(() => {
                        if (!isNativeFullscreenActive()) setPseudoFullscreen(true);
                        else updateFullscreenStateUI();
                    }, 150);
                }
            } catch (e) {
                setPseudoFullscreen(true);
            }
        } else {
            setPseudoFullscreen(true);
        }
    } else {
        if (pseudoFullscreen) {
            setPseudoFullscreen(false);
        }
        if (isNativeFullscreenActive()) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
            if (exit) Promise.resolve(exit.call(document)).then(updateFullscreenStateUI).catch(() => {});
        }
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
