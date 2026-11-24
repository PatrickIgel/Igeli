// Netzwerk-Status & PeerJS-Konfiguration
let netMode = 'local'; // 'local' | 'host' | 'client'
let peer = null, conn = null;
let hostSendTimer = null, clientInputTimer = null, connectTimeout = null;
let roomCode = '';
let netTarget = null;
let hasReceivedInitialState = false;
let stateSeq = 0, lastStateSeq = -1, lastResetSeq = -1;
let clientAckResetSeq = -1, appliedLevelDataSeq = -1;
let inputSeq = 0, lastInputSeq = -1;
let jumpPressCount = 0, lastRemoteJumpCount = 0;
let isConnecting = false;
let lastSentBlue = { blueJump: false, blueLeft: false, blueAct: false };
let selectedDifficulty = 'medium';

const METERED_TURN_URL = 'https://igelgame.metered.live/api/v1/turn/credentials?apiKey=d4848105067eefae8ec2d7063773a62f4c30';
const STUN_FALLBACK_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
];

let cachedIceServers = null;

async function getPeerConfig() {
    if (!cachedIceServers) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(METERED_TURN_URL, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const servers = await res.json();
                if (Array.isArray(servers) && servers.length > 0) {
                    cachedIceServers = [
                        { urls: 'stun:stun.l.google.com:19302' },
                        ...servers
                    ];
                }
            }
        } catch (e) {}
    }
    return {
        pingInterval: 5000,
        config: {
            iceCandidatePoolSize: 6,
            iceServers: cachedIceServers || STUN_FALLBACK_SERVERS
        }
    };
}

function buildLevelSnapshot() {
    return {
        goalX,
        minX: state.minX,
        maxX: state.maxX,
        platforms: platforms.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
        hazards: hazards.map(h => ({ x: h.x, y: h.y, w: h.w, h: h.h })),
        ramps: ramps.map(r => ({ x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2 })),
        colorPlatforms: colorPlatforms.map(cp => ({ x: cp.x, y: cp.y, w: cp.w, h: cp.h, color: cp.color })),
        magnetBlocks: magnetBlocks.map(mg => ({ x: mg.x, y: mg.y, r: mg.r, range: mg.range, force: mg.force, color: mg.color })),
        colorLasers: colorLasers.map(cl => ({ x: cl.x, y: cl.y, w: cl.w, h: cl.h, color: cl.color })),
        gates: gates.map(g => ({ id: g.id, x: g.x, y: g.y, w: g.w, h: g.h, openH: g.openH })),
        buttons: buttons.map(b => ({
            id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, pressed: b.pressed,
            ...(b.sticky ? { sticky: true } : {}),
            ...(b.toggleWind ? { toggleWind: true } : {})
        })),
        winds: winds.map(w => ({
            ...(w.id !== undefined ? { id: w.id } : {}),
            ...(w.color ? { color: w.color } : {}),
            x: w.x, y: w.y, w: w.w, h: w.h, vx: w.vx, vy: w.vy, active: w.active
        })),
        boxes: boxes.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, vx: 0, vy: 0 })),
        seesaws: seesaws.map(s => ({
            cx: s.cx, cy: s.cy, halfW: s.halfW, angle: s.angle,
            ...(s.lockColor ? { lockColor: s.lockColor } : {})
        })),
        mossPlatforms: mossPlatforms.map(ms => ({
            x: ms.x, y: ms.y, w: ms.w, h: ms.h, origY: ms.origY,
            timer: ms.timer, triggered: ms.triggered, falling: ms.falling, broken: ms.broken, vy: 0
        })),
        mushrooms: mushrooms.map(m => ({ x: m.x, y: m.y, w: m.w, h: m.h, vy: m.vy, bounce: m.bounce })),
        ropeBridges: ropeBridges.map(rb => ({
            ropeX: rb.ropeX, ropeY: rb.ropeY, x: rb.x, y: rb.y, w: rb.w, h: rb.h,
            targetY: rb.targetY, vy: 0, cut: rb.cut, settled: rb.settled
        })),
        wasps: wasps.map(w => ({ x: w.x, y: w.y, baseX: w.baseX, baseY: w.baseY, rangeX: w.rangeX, phase: w.phase, dead: w.dead })),
        beetles: beetles.map(bt => ({ x: bt.x, y: bt.y, dir: bt.dir, dead: bt.dead })),
        zombies: zombies.map(z => ({ x: z.x, y: z.y, dir: z.dir, dead: z.dead })),
        breakables: breakables.map(br => ({ x: br.x, y: br.y, w: br.w, h: br.h, type: br.type }))
    };
}

function applyLevelSnapshot(ld) {
    if (!ld) return;
    if (ld.goalX !== undefined) goalX = ld.goalX;
    if (ld.minX !== undefined) state.minX = ld.minX;
    if (ld.maxX !== undefined) state.maxX = ld.maxX;
    if (Array.isArray(ld.platforms)) platforms = ld.platforms.map(p => ({ ...p }));
    if (Array.isArray(ld.hazards)) hazards = ld.hazards.map(h => ({ ...h }));
    if (Array.isArray(ld.ramps)) ramps = ld.ramps.map(r => ({ ...r }));
    if (Array.isArray(ld.colorPlatforms)) colorPlatforms = ld.colorPlatforms.map(cp => ({ ...cp }));
    if (Array.isArray(ld.magnetBlocks)) magnetBlocks = ld.magnetBlocks.map(mg => ({ ...mg }));
    if (Array.isArray(ld.colorLasers)) colorLasers = ld.colorLasers.map(cl => ({ ...cl }));
    if (Array.isArray(ld.gates)) gates = ld.gates.map(g => ({ ...g }));
    if (Array.isArray(ld.buttons)) buttons = ld.buttons.map(b => ({ ...b }));
    if (Array.isArray(ld.winds)) winds = ld.winds.map(w => ({ ...w }));
    if (Array.isArray(ld.boxes)) boxes = ld.boxes.map(b => ({ ...b }));
    if (Array.isArray(ld.seesaws)) seesaws = ld.seesaws.map(s => ({ ...s }));
    if (Array.isArray(ld.mossPlatforms)) mossPlatforms = ld.mossPlatforms.map(ms => ({ ...ms }));
    if (Array.isArray(ld.mushrooms)) mushrooms = ld.mushrooms.map(m => ({ ...m }));
    if (Array.isArray(ld.ropeBridges)) ropeBridges = ld.ropeBridges.map(rb => ({ ...rb }));
    if (Array.isArray(ld.wasps)) wasps = ld.wasps.map(w => ({ ...w }));
    if (Array.isArray(ld.beetles)) beetles = ld.beetles.map(bt => ({ ...bt }));
    if (Array.isArray(ld.zombies)) zombies = ld.zombies.map(z => ({ ...z }));
    if (Array.isArray(ld.breakables)) breakables = ld.breakables.map(br => ({ ...br }));
}

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
    const curResetSeq = state.resetSeq || 0;
    const needLevelData = clientAckResetSeq !== curResetSeq;
    try {
        const payload = {
            type: 'state',
            seq: stateSeq,
            resetSeq: curResetSeq,
            difficulty: state.difficulty || 'medium',
            levelIndex: state.levelIndex,
            levelSeed: state.levelSeed,
            levelModules: state.levelModules,
            hearts: state.hearts,
            won: state.won,
            gameOver: state.gameOver,
            enemiesDefeated: state.enemiesDefeated,
            elapsedTime: state.elapsedTime,
            maxCatapultJump: state.maxCatapultJump,
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
        };
        if (needLevelData) {
            payload.levelData = buildLevelSnapshot();
        }
        conn.send(payload);
    } catch (e) {}
}

function applyClientState(d) {
    if (d.seq !== undefined) {
        if (d.seq <= lastStateSeq) return;
        lastStateSeq = d.seq;
    }

    const rSeq = d.resetSeq || 0;
    const wasReset = hasReceivedInitialState && rSeq !== lastResetSeq;
    const modulesChanged = Array.isArray(d.levelModules) && (
        !Array.isArray(state.levelModules) ||
        d.levelModules.length !== state.levelModules.length ||
        d.levelModules.some((m, i) => m !== state.levelModules[i])
    );
    const levelChanged = !hasReceivedInitialState || wasReset || modulesChanged ||
        d.levelIndex !== state.levelIndex || d.levelSeed !== state.levelSeed ||
        (d.difficulty && d.difficulty !== state.difficulty);

    if (hasReceivedInitialState && !levelChanged) {
        if (d.hearts < state.hearts) playSound('hurt');
        if (d.won && !state.won) playSound('gameWin');
        if (d.gameOver && !state.gameOver) playSound('gameOver');
        if (d.enemiesDefeated !== undefined && d.enemiesDefeated > (state.enemiesDefeated || 0)) {
            playSound('zombieDefeat');
        }
        if (d.redActHeld !== undefined && !!d.redActHeld !== !!state.redActHeld) {
            playSound(d.redActHeld ? 'colorActivate' : 'colorDeactivate', { color: 'red' });
        }
        if (Array.isArray(d.buttons) && d.buttons.length === buttons.length) {
            for (let i = 0; i < buttons.length; i++) {
                if (d.buttons[i] && !buttons[i].pressed) playSound('buttonPress', { x: buttons[i].x, y: buttons[i].y });
            }
        }
        if (Array.isArray(d.mushrooms) && d.mushrooms.length === mushrooms.length) {
            for (let i = 0; i < mushrooms.length; i++) {
                if (d.mushrooms[i] > 0.85 && mushrooms[i].bounce < 0.5) playSound('mushroomBounce', { x: mushrooms[i].x, y: mushrooms[i].y });
            }
        }
        if (Array.isArray(d.ropeBridges) && d.ropeBridges.length === ropeBridges.length) {
            for (let i = 0; i < ropeBridges.length; i++) {
                if (d.ropeBridges[i].cut && !ropeBridges[i].cut) playSound('ropeCut', { x: ropeBridges[i].ropeX, y: ropeBridges[i].ropeY });
                if (d.ropeBridges[i].settled && !ropeBridges[i].settled) playSound('bridgeLand', { x: ropeBridges[i].x, y: ropeBridges[i].y });
            }
        }
        if (Array.isArray(d.breakables) && d.breakables.length < breakables.length) {
            playSound('breakWall');
        }
    } else if (hasReceivedInitialState && d.levelIndex > state.levelIndex) {
        playSound('levelWin');
    }

    lastResetSeq = rSeq;
    if (d.difficulty) state.difficulty = d.difficulty;
    state.levelIndex = d.levelIndex;
    state.levelSeed = d.levelSeed;
    if (Array.isArray(d.levelModules)) state.levelModules = d.levelModules.slice();
    state.hearts = d.hearts;
    state.won = !!d.won;
    state.gameOver = !!d.gameOver;
    if (d.enemiesDefeated !== undefined) state.enemiesDefeated = d.enemiesDefeated;
    if (d.elapsedTime !== undefined) state.elapsedTime = d.elapsedTime;
    if (d.maxCatapultJump !== undefined) state.maxCatapultJump = d.maxCatapultJump;
    if (d.redActHeld !== undefined) state.redActHeld = !!d.redActHeld;
    if (d.blueActHeld !== undefined) state.blueActHeld = !!d.blueActHeld;

    if (levelChanged) {
        try {
            loadLevel(state.levelIndex, false);
        } catch (e) {}
        netTarget = null;
        appliedLevelDataSeq = -1;
    }

    if (d.levelData && appliedLevelDataSeq !== rSeq) {
        applyLevelSnapshot(d.levelData);
        appliedLevelDataSeq = rSeq;
        if (conn && conn.open) {
            try { conn.send({ type: 'ackLevel', resetSeq: rSeq }); } catch (e) {}
        }
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

    if (Array.isArray(d.boxes) && d.boxes.length === boxes.length) {
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
    if (Array.isArray(d.gates) && d.gates.length === gates.length) {
        for (let i = 0; i < gates.length; i++) {
            const go = d.gates[i];
            if (levelChanged || gates[i].tOpenH === undefined || Math.abs(go - gates[i].openH) > 250) {
                gates[i].openH = go;
            }
            gates[i].tOpenH = go;
        }
    }
    if (Array.isArray(d.zombies) && d.zombies.length === zombies.length) {
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
    if (Array.isArray(d.buttons) && d.buttons.length === buttons.length) {
        for (let i = 0; i < buttons.length; i++) buttons[i].pressed = d.buttons[i];
    }
    if (Array.isArray(d.winds) && d.winds.length === winds.length) {
        for (let i = 0; i < winds.length; i++) winds[i].active = d.winds[i];
    }
    if (d.breakables) breakables = d.breakables;
    if (Array.isArray(d.seesaws) && d.seesaws.length === seesaws.length) {
        for (let i = 0; i < seesaws.length; i++) {
            if (levelChanged || seesaws[i].tAngle === undefined) seesaws[i].angle = d.seesaws[i];
            seesaws[i].tAngle = d.seesaws[i];
        }
    }
    if (Array.isArray(d.mossPlatforms) && d.mossPlatforms.length === mossPlatforms.length) {
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
    if (Array.isArray(d.mushrooms) && d.mushrooms.length === mushrooms.length) {
        for (let i = 0; i < mushrooms.length; i++) {
            if (d.mushrooms[i] > mushrooms[i].bounce) mushrooms[i].bounce = d.mushrooms[i];
        }
    }
    if (Array.isArray(d.ropeBridges) && d.ropeBridges.length === ropeBridges.length) {
        for (let i = 0; i < ropeBridges.length; i++) {
            const r = d.ropeBridges[i];
            if (levelChanged || ropeBridges[i].ty === undefined) ropeBridges[i].y = r.y;
            ropeBridges[i].ty = r.y;
            ropeBridges[i].cut = r.cut;
            ropeBridges[i].settled = r.settled;
        }
    }
    if (Array.isArray(d.wasps) && d.wasps.length === wasps.length) {
        for (let i = 0; i < wasps.length; i++) {
            const w = d.wasps[i];
            if (levelChanged || wasps[i].tx === undefined || Math.hypot(w.x - wasps[i].x, w.y - wasps[i].y) > 250) {
                wasps[i].x = w.x; wasps[i].y = w.y;
            }
            wasps[i].tx = w.x; wasps[i].ty = w.y; wasps[i].dead = w.dead;
        }
    }
    if (Array.isArray(d.beetles) && d.beetles.length === beetles.length) {
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
const diffButtons = document.querySelectorAll('.diff-btn');

function setDifficulty(diff) {
    selectedDifficulty = diff;
    state.difficulty = diff;
    diffButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.diff === diff);
    });
}

diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setDifficulty(btn.dataset.diff);
    });
});

function cleanupPeer() {
    isConnecting = false;
    if (hostSendTimer) { clearInterval(hostSendTimer); hostSendTimer = null; }
    if (clientInputTimer) { clearInterval(clientInputTimer); clientInputTimer = null; }
    if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
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
    state.difficulty = selectedDifficulty;
    menuOverlay.classList.add('hidden');
    loadLevel(0, true);
});

async function startHostSession() {
    cleanupPeer();
    if (typeof Peer === 'undefined') {
        hostStatus.textContent = 'PeerJS konnte nicht geladen werden.';
        return;
    }
    roomCode = String(Math.floor(1000 + Math.random() * 9000));
    roomCodeDisplay.textContent = roomCode;
    hostStatus.textContent = 'Hole Relay-Server & verbinde...';
    const peerConfig = await getPeerConfig();
    if (hostPanel.classList.contains('hidden')) return;

    const currentPeer = new Peer('igel-' + roomCode, peerConfig);
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
            state.difficulty = selectedDifficulty;
            stateSeq = 0;
            clientAckResetSeq = -1;
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
            } else if (d.type === 'ackLevel') {
                if (d.resetSeq !== undefined) {
                    clientAckResetSeq = d.resetSeq;
                }
            } else if (d.type === 'reset') {
                if (state.won || state.gameOver) {
                    state.won = false; state.gameOver = false; state.levelIndex = 0; state.hearts = 5; state.enemiesDefeated = 0; state.elapsedTime = 0; state.maxCatapultJump = 0;
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
            if (!hostStarted && peer === currentPeer) {
                hostStatus.textContent = 'Warte auf Spieler 2 (Blau)...';
            }
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

async function connectToHost() {
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
    let clientStarted = false;
    joinStatus.textContent = 'Hole Relay-Server & suche Raum ' + code + '...';

    const peerConfig = await getPeerConfig();
    if (!isConnecting) return;

    const currentPeer = new Peer(peerConfig);
    peer = currentPeer;

    connectTimeout = setTimeout(() => {
        if (peer === currentPeer && netMode !== 'client' && !clientStarted) {
            cleanupPeer();
            joinStatus.textContent = peerFound
                ? 'Verbindung fehlgeschlagen (NAT/Mobilfunk-Relay blockiert). Bitte erneut versuchen.'
                : 'Zeitüberschreitung – Server antwortet nicht oder Raum ' + code + ' ist nicht aktiv.';
        }
    }, 25000);

    currentPeer.on('open', () => {
        if (peer !== currentPeer) return;
        peerFound = true;
        joinStatus.textContent = 'Raum ' + code + ' gefunden – baue WebRTC/Relay-Verbindung auf...';

        const c = currentPeer.connect('igel-' + code, { reliable: true });
        conn = c;

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
            appliedLevelDataSeq = -1;
            inputSeq = 0;
            jumpPressCount = 0;
            lastSentBlue = { blueJump: false, blueLeft: false, blueAct: false };
            menuOverlay.classList.add('hidden');
            sendBlueInputs(true);
            if (clientInputTimer) clearInterval(clientInputTimer);
            clientInputTimer = setInterval(() => sendBlueInputs(true), 40);
        };

        // ICE-Status der nativen WebRTC-Verbindung überwachen (ohne laufenden Handshake abzubrechen)
        setTimeout(() => {
            if (peer !== currentPeer || !c.peerConnection) return;
            c.peerConnection.addEventListener('iceconnectionstatechange', () => {
                if (peer !== currentPeer || clientStarted) return;
                const iceState = c.peerConnection.iceConnectionState;
                if (iceState === 'checking') {
                    joinStatus.textContent = 'Prüfe Direkt- & Relay-Verbindung (ICE)...';
                } else if (iceState === 'failed') {
                    cleanupPeer();
                    joinStatus.textContent = 'WebRTC/TURN-Verbindung fehlgeschlagen. Bitte erneut versuchen.';
                }
            });
        }, 0);

        c.on('data', d => {
            if (!d) return;
            if (!clientStarted) activateClient();
            if (d.type === 'state') applyClientState(d);
        });
        c.on('close', () => {
            if (peer !== currentPeer) return;
            isConnecting = false;
            if (clientInputTimer) { clearInterval(clientInputTimer); clientInputTimer = null; }
            if (netMode === 'client') {
                netMode = 'local';
                joinStatus.textContent = 'Verbindung getrennt.';
                menuOverlay.classList.remove('hidden');
                joinPanel.classList.remove('hidden');
                mainMenu.classList.add('hidden');
            }
        });
        c.on('error', err => {
            if (peer !== currentPeer) return;
            isConnecting = false;
            if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null; }
            joinStatus.textContent = 'Verbindungsfehler: ' + (err.type || err.message || 'Unbekannt');
        });

        if (c.open) activateClient();
        else c.on('open', activateClient);
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
