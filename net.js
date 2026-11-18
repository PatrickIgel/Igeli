// Netzwerk-Status & PeerJS-Konfiguration
let netMode = 'local'; // 'local' | 'host' | 'client'
let peer = null, conn = null;
let hostSendTimer = null, clientInputTimer = null, connectTimeout = null, pingTimer = null;
let roomCode = '';
let netTarget = null;
let hasReceivedInitialState = false;
let stateSeq = 0, lastStateSeq = -1, lastResetSeq = -1;
let inputSeq = 0, lastInputSeq = -1;
let jumpPressCount = 0, lastRemoteJumpCount = 0;
let isConnecting = false;
let lastSentBlue = { blueJump: false, blueLeft: false, blueAct: false };

const PEER_CONFIG = {
    pingInterval: 5000,
    config: {
        iceCandidatePoolSize: 6,
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.relay.metered.ca:80' },
            {
                urls: 'turn:standard.relay.metered.ca:80',
                username: 'e8dd65b92f6dde4319548341',
                credential: '934183410101'
            },
            {
                urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
                username: 'e8dd65b92f6dde4319548341',
                credential: '934183410101'
            },
            {
                urls: 'turn:standard.relay.metered.ca:443',
                username: 'e8dd65b92f6dde4319548341',
                credential: '934183410101'
            },
            {
                urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
                username: 'e8dd65b92f6dde4319548341',
                credential: '934183410101'
            }
        ]
    }
};

function sendBlueInputs(force = false) {
    if (netMode !== 'client' || !conn || !conn.open) return;
    const blueJump = !!(inputs.blueJump || keys.blueJump);
    const blueLeft = !!(inputs.blueLeft || keys.blueLeft);
    const blueAct = !!(inputs.blueAct || keys.blueAct);
    const justPressedJump = blueJump && !lastSentBlue.blueJump;
    if (justPressedJump) jumpPressCount++;
    if (force || blueJump !== lastSentBlue.blueJump || blueLeft !== lastSentBlue.blueLeft || blueAct !== lastSentBlue.blueAct) {
        lastSentBlue.blueJump = blueJump;
        lastSentBlue.blueLeft = blueLeft;
        lastSentBlue.blueAct = blueAct;
        inputSeq++;
        try {
            conn.send({ type: 'input', seq: inputSeq, blueJump, blueLeft, blueAct, jumpPressCount });
        } catch (e) {}
    }
}

function sendGameState() {
    if (netMode !== 'host' || !conn || !conn.open) return;
    stateSeq++;
    try {
        conn.send({
            type: 'state',
            seq: stateSeq,
            resetSeq: state.resetSeq || 0,
            levelIndex: state.levelIndex,
            levelSeed: state.levelSeed,
            levelModules: state.levelModules,
            hearts: state.hearts,
            won: state.won,
            gameOver: state.gameOver,
            redActHeld: state.redActHeld,
            blueActHeld: state.blueActHeld,
            camX: state.camX,
            p: {
                x: player.x, y: player.y, vx: player.vx, vy: player.vy,
                grounded: player.grounded, curled: player.curled, rot: player.rot,
                facing: player.facing, aimState: player.aimState, aimAngle: player.aimAngle,
                slingshotCharge: player.slingshotCharge, invuln: player.invuln
            },
            boxes: boxes.map(b => ({ x: b.x, y: b.y })),
            gates: gates.map(g => g.openH),
            zombies: zombies.map(z => ({ x: z.x, y: z.y, dir: z.dir, dead: z.dead })),
            buttons: buttons.map(b => b.pressed),
            winds: winds.map(w => w.active),
            breakables,
            seesaws: seesaws.map(s => s.angle),
            mossPlatforms: mossPlatforms.map(ms => ({ y: ms.y, triggered: ms.triggered, falling: ms.falling, broken: ms.broken, timer: ms.timer })),
            mushrooms: mushrooms.map(m => m.bounce),
            ropeBridges: ropeBridges.map(rb => ({ y: rb.y, cut: rb.cut, settled: rb.settled })),
            wasps: wasps.map(w => ({ x: w.x, y: w.y, dead: w.dead })),
            beetles: beetles.map(bt => ({ x: bt.x, y: bt.y, dir: bt.dir, dead: bt.dead }))
        });
    } catch (e) {}
}

function applyClientState(d) {
    if (d.seq !== undefined) {
        if (d.seq <= lastStateSeq) return;
        lastStateSeq = d.seq;
    }

    const rSeq = d.resetSeq || 0;
    const wasReset = hasReceivedInitialState && rSeq !== lastResetSeq;
    const levelChanged = !hasReceivedInitialState || wasReset || d.levelIndex !== state.levelIndex || d.levelSeed !== state.levelSeed;
    if (hasReceivedInitialState && !levelChanged) {
        if (d.hearts < state.hearts) playTone(160, 'sawtooth', 0.3, 0.16, 70);
    } else if (hasReceivedInitialState && d.levelIndex > state.levelIndex) {
        playTone(440, 'triangle', 0.35, 0.18, 880);
    }

    lastResetSeq = rSeq;
    state.levelIndex = d.levelIndex;
    state.levelSeed = d.levelSeed;
    if (Array.isArray(d.levelModules)) state.levelModules = d.levelModules;
    state.hearts = d.hearts;
    state.won = !!d.won;
    state.gameOver = !!d.gameOver;
    if (d.redActHeld !== undefined) state.redActHeld = !!d.redActHeld;
    if (d.blueActHeld !== undefined) state.blueActHeld = !!d.blueActHeld;

    if (levelChanged) {
        loadLevel(state.levelIndex, false);
        netTarget = null;
    }

    const px = d.p.x, py = d.p.y, prot = d.p.rot;
    if (!hasReceivedInitialState || levelChanged || !netTarget || Math.hypot(px - player.x, py - player.y) > 250) {
        player.x = px;
        player.y = py;
        player.rot = prot;
    }
    player.vx = d.p.vx;
    player.vy = d.p.vy;
    player.grounded = d.p.grounded;
    player.curled = d.p.curled;
    player.facing = d.p.facing;
    player.aimState = d.p.aimState;
    player.aimAngle = d.p.aimAngle;
    player.slingshotCharge = d.p.slingshotCharge;
    player.invuln = d.p.invuln;

    if (!hasReceivedInitialState || levelChanged || !netTarget || Math.abs(d.camX - state.camX) > 250) {
        state.camX = d.camX;
    }
    netTarget = { px, py, prot, camX: d.camX };

    if (d.boxes && d.boxes.length === boxes.length) {
        for (let i = 0; i < boxes.length; i++) {
            const bx = d.boxes[i];
            if (levelChanged || boxes[i].tx === undefined || Math.hypot(bx.x - boxes[i].x, bx.y - boxes[i].y) > 250) {
                boxes[i].x = bx.x;
                boxes[i].y = bx.y;
            }
            boxes[i].tx = bx.x;
            boxes[i].ty = bx.y;
        }
    }
    if (d.gates && d.gates.length === gates.length) {
        for (let i = 0; i < gates.length; i++) {
            const go = d.gates[i];
            if (levelChanged || gates[i].tOpenH === undefined || Math.abs(go - gates[i].openH) > 250) {
                gates[i].openH = go;
            }
            gates[i].tOpenH = go;
        }
    }
    if (d.zombies && d.zombies.length === zombies.length) {
        for (let i = 0; i < zombies.length; i++) {
            const zx = d.zombies[i];
            if (levelChanged || zombies[i].tx === undefined || Math.hypot(zx.x - zombies[i].x, zx.y - zombies[i].y) > 250) {
                zombies[i].x = zx.x;
                zombies[i].y = zx.y;
            }
            zombies[i].tx = zx.x;
            zombies[i].ty = zx.y;
            zombies[i].dir = zx.dir;
            zombies[i].dead = zx.dead;
        }
    }
    if (d.buttons && d.buttons.length === buttons.length) {
        for (let i = 0; i < buttons.length; i++) buttons[i].pressed = d.buttons[i];
    }
    if (d.winds && d.winds.length === winds.length) {
        for (let i = 0; i < winds.length; i++) winds[i].active = d.winds[i];
    }
    if (d.breakables) breakables = d.breakables;
    if (d.seesaws && d.seesaws.length === seesaws.length) {
        for (let i = 0; i < seesaws.length; i++) {
            if (levelChanged || seesaws[i].tAngle === undefined) seesaws[i].angle = d.seesaws[i];
            seesaws[i].tAngle = d.seesaws[i];
        }
    }
    if (d.mossPlatforms && d.mossPlatforms.length === mossPlatforms.length) {
        for (let i = 0; i < mossPlatforms.length; i++) {
            const m = d.mossPlatforms[i];
            if (levelChanged || mossPlatforms[i].ty === undefined) mossPlatforms[i].y = m.y;
            mossPlatforms[i].ty = m.y;
            mossPlatforms[i].triggered = m.triggered;
            mossPlatforms[i].falling = m.falling;
            mossPlatforms[i].broken = m.broken;
            mossPlatforms[i].timer = m.timer;
        }
    }
    if (d.mushrooms && d.mushrooms.length === mushrooms.length) {
        for (let i = 0; i < mushrooms.length; i++) {
            if (d.mushrooms[i] > mushrooms[i].bounce) mushrooms[i].bounce = d.mushrooms[i];
        }
    }
    if (d.ropeBridges && d.ropeBridges.length === ropeBridges.length) {
        for (let i = 0; i < ropeBridges.length; i++) {
            const r = d.ropeBridges[i];
            if (levelChanged || ropeBridges[i].ty === undefined) ropeBridges[i].y = r.y;
            ropeBridges[i].ty = r.y;
            ropeBridges[i].cut = r.cut;
            ropeBridges[i].settled = r.settled;
        }
    }
    if (d.wasps && d.wasps.length === wasps.length) {
        for (let i = 0; i < wasps.length; i++) {
            const w = d.wasps[i];
            if (levelChanged || wasps[i].tx === undefined || Math.hypot(w.x - wasps[i].x, w.y - wasps[i].y) > 250) {
                wasps[i].x = w.x; wasps[i].y = w.y;
            }
            wasps[i].tx = w.x; wasps[i].ty = w.y; wasps[i].dead = w.dead;
        }
    }
    if (d.beetles && d.beetles.length === beetles.length) {
        for (let i = 0; i < beetles.length; i++) {
            const bt = d.beetles[i];
            if (levelChanged || beetles[i].tx === undefined || Math.hypot(bt.x - beetles[i].x, bt.y - beetles[i].y) > 250) {
                beetles[i].x = bt.x; beetles[i].y = bt.y;
            }
            beetles[i].tx = bt.x; beetles[i].ty = bt.y; beetles[i].dir = bt.dir; beetles[i].dead = bt.dead;
        }
    }

    hasReceivedInitialState = true;
}

// Start-Menü & PeerJS-Steuerung
const menuOverlay = document.getElementById('menuOverlay');
const mainMenu = document.getElementById('mainMenu');
const hostPanel = document.getElementById('hostPanel');
const joinPanel = document.getElementById('joinPanel');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const hostStatus = document.getElementById('hostStatus');
const joinStatus = document.getElementById('joinStatus');
const codeInput = document.getElementById('codeInput');

function cleanupPeer() {
    isConnecting = false;
    if (hostSendTimer) { clearInterval(hostSendTimer); hostSendTimer = null; }
    if (clientInputTimer) { clearInterval(clientInputTimer); clientInputTimer = null; }
    if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (conn) { try { conn.close(); } catch (e) {} conn = null; }
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    activePointers.clear();
    syncPointers();
}

// Auf Smartphones pausiert der Browser WebSockets im Hintergrund (z. B. beim Code-Verschicken)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && peer && !peer.destroyed && peer.disconnected) {
        try { peer.reconnect(); } catch (e) {}
    }
});

document.getElementById('btnLocal').addEventListener('click', () => {
    cleanupPeer();
    netMode = 'local';
    menuOverlay.classList.add('hidden');
    loadLevel(0, true);
});

function startHostSession() {
    cleanupPeer();
    if (typeof Peer === 'undefined') {
        hostStatus.textContent = 'PeerJS konnte nicht geladen werden.';
        return;
    }
    roomCode = String(Math.floor(1000 + Math.random() * 9000));
    roomCodeDisplay.textContent = roomCode;
    hostStatus.textContent = 'Verbinde mit Server...';
    const currentPeer = new Peer('igel-' + roomCode, PEER_CONFIG);
    peer = currentPeer;

    currentPeer.on('open', () => {
        if (peer !== currentPeer) return;
        hostStatus.textContent = 'Warte auf Spieler 2 (Blau)...';
    });
    currentPeer.on('disconnected', () => {
        if (peer !== currentPeer || currentPeer.destroyed) return;
        hostStatus.textContent = 'Verbindung unterbrochen – verbinde neu...';
        try { currentPeer.reconnect(); } catch (e) {}
    });
    currentPeer.on('error', err => {
        if (peer !== currentPeer) return;
        if (err && err.type === 'unavailable-id') startHostSession();
        else if (err && err.type === 'network' && !currentPeer.destroyed) {
            try { currentPeer.reconnect(); } catch (e) {}
        } else {
            hostStatus.textContent = 'Fehler: ' + (err.type || err.message || 'Unbekannt');
        }
    });
    currentPeer.on('connection', c => {
        if (peer !== currentPeer) return;
        conn = c;
        let hostStarted = false;
        hostStatus.textContent = 'Spieler 2 verbindet sich...';

        const activateHost = () => {
            if (hostStarted || peer !== currentPeer) return;
            hostStarted = true;
            netMode = 'host';
            stateSeq = 0;
            lastInputSeq = -1;
            lastRemoteJumpCount = 0;
            remoteInputs.blueJump = false;
            remoteInputs.blueLeft = false;
            remoteInputs.blueAct = false;
            remoteJumpPulse = false;
            menuOverlay.classList.add('hidden');
            state.levelIndex = 0;
            state.hearts = 5;
            state.won = false;
            state.gameOver = false;
            loadLevel(0, true);
            sendGameState();
            if (hostSendTimer) clearInterval(hostSendTimer);
            hostSendTimer = setInterval(sendGameState, 28);
        };

        c.on('data', d => {
            if (!d) return;
            if (!hostStarted) activateHost();
            if (d.type === 'input') {
                if (d.seq !== undefined) {
                    if (d.seq <= lastInputSeq) return;
                    lastInputSeq = d.seq;
                }
                const nextJump = !!d.blueJump;
                if (d.jumpPressCount !== undefined && d.jumpPressCount > lastRemoteJumpCount) {
                    lastRemoteJumpCount = d.jumpPressCount;
                    remoteJumpPulse = true;
                } else if (nextJump && !remoteInputs.blueJump) {
                    remoteJumpPulse = true;
                }
                remoteInputs.blueJump = nextJump;
                remoteInputs.blueLeft = !!d.blueLeft;
                remoteInputs.blueAct = !!d.blueAct;
            } else if (d.type === 'reset') {
                if (state.won || state.gameOver) {
                    state.won = false; state.gameOver = false; state.levelIndex = 0; state.hearts = 5;
                    loadLevel(0, true);
                } else {
                    loadLevel(state.levelIndex, false);
                }
                sendGameState();
            }
        });
        c.on('close', () => {
            remoteInputs.blueJump = false;
            remoteInputs.blueLeft = false;
            remoteInputs.blueAct = false;
            remoteJumpPulse = false;
        });

        if (c.open) activateHost();
        else c.on('open', activateHost);
    });
}

document.getElementById('btnHost').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    hostPanel.classList.remove('hidden');
    startHostSession();
});

document.getElementById('btnCancelHost').addEventListener('click', () => {
    cleanupPeer();
    hostPanel.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

document.getElementById('btnJoinView').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    joinPanel.classList.remove('hidden');
    joinStatus.textContent = '';
    codeInput.value = '';
    setTimeout(() => codeInput.focus(), 50);
});

document.getElementById('btnCancelJoin').addEventListener('click', () => {
    cleanupPeer();
    joinPanel.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

function connectToHost() {
    if (isConnecting) return;
    const code = codeInput.value.replace(/\D/g, '').slice(0, 4);
    if (code.length !== 4) {
        joinStatus.textContent = 'Bitte 4 Ziffern eingeben.';
        return;
    }
    if (typeof Peer === 'undefined') {
        joinStatus.textContent = 'PeerJS konnte nicht geladen werden.';
        return;
    }
    cleanupPeer();
    isConnecting = true;
    roomCode = code;
    let peerFound = false;
    joinStatus.textContent = 'Suche Raum ' + code + '...';
    const currentPeer = new Peer(PEER_CONFIG);
    peer = currentPeer;

    connectTimeout = setTimeout(() => {
        if (peer === currentPeer && netMode !== 'client') {
            cleanupPeer();
            joinStatus.textContent = peerFound
                ? 'Direktverbindung blockiert (Netzwerk/Mobilfunk). Bitte erneut versuchen.'
                : 'Zeitüberschreitung – Server antwortet nicht oder Raum ' + code + ' ist nicht aktiv.';
        }
    }, 25000);

    currentPeer.on('open', () => {
        if (peer !== currentPeer) return;
        peerFound = true;
        joinStatus.textContent = 'Raum ' + code + ' gefunden – baue Verbindung auf...';

        const openDataChannel = () => {
            if (peer !== currentPeer || netMode === 'client') return;
            if (conn) { try { conn.close(); } catch (e) {} }

            const c = currentPeer.connect('igel-' + code, { reliable: true });
            conn = c;
            let clientStarted = false;

            const activateClient = () => {
                if (clientStarted || peer !== currentPeer) return;
                clientStarted = true;
                isConnecting = false;
                if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
                netMode = 'client';
                netTarget = null;
                hasReceivedInitialState = false;
                lastStateSeq = -1;
                lastResetSeq = -1;
                inputSeq = 0;
                jumpPressCount = 0;
                lastSentBlue = { blueJump: false, blueLeft: false, blueAct: false };
                menuOverlay.classList.add('hidden');
                sendBlueInputs(true);
                if (clientInputTimer) clearInterval(clientInputTimer);
                clientInputTimer = setInterval(() => sendBlueInputs(true), 40);
            };

            c.on('data', d => {
                if (!d) return;
                if (!clientStarted) activateClient();
                if (d.type === 'state') applyClientState(d);
            });
            c.on('close', () => {
                isConnecting = false;
                if (clientInputTimer) { clearInterval(clientInputTimer); clientInputTimer = null; }
                netMode = 'local';
                joinStatus.textContent = 'Verbindung getrennt.';
                menuOverlay.classList.remove('hidden');
                joinPanel.classList.remove('hidden');
                mainMenu.classList.add('hidden');
            });
            c.on('error', err => {
                if (peer !== currentPeer) return;
                isConnecting = false;
                joinStatus.textContent = 'Verbindungsfehler: ' + (err.type || err.message || 'Unbekannt');
            });

            if (c.open) {
                activateClient();
            } else {
                c.on('open', activateClient);
                // Falls der erste WebRTC-Handshake auf dem Handy hängt, nach 8s automatisch neu anstoßen
                setTimeout(() => {
                    if (peer === currentPeer && !clientStarted && netMode !== 'client') {
                        joinStatus.textContent = 'Verbindung dauert länger – wechsle auf Relay-Route...';
                        openDataChannel();
                    }
                }, 8000);
            }
        };

        openDataChannel();
    });
    currentPeer.on('error', err => {
        if (peer !== currentPeer) return;
        isConnecting = false;
        if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
        joinStatus.textContent = err && err.type === 'peer-unavailable'
            ? 'Raum ' + code + ' existiert nicht (Host muss offen bleiben).'
            : 'Verbindung fehlgeschlagen (' + (err.type || 'Fehler') + ').';
    });
}

document.getElementById('btnConnect').addEventListener('click', connectToHost);
codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4);
});
codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        connectToHost();
    }
});
