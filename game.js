/**
 * IGELIS REISE - Hauptspiellogik
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elemente
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const hud = document.getElementById('hud');
const touchControls = document.getElementById('touch-controls');

const scoreDisplay = document.getElementById('scoreDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const finalScoreLost = document.getElementById('finalScoreLost');
const finalScoreWin = document.getElementById('finalScoreWin');
const winDetails = document.getElementById('winDetails');

// Spielkonstanten
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GRAVITY = 0.65;
const FRICTION = 0.82;
const LEVEL_LENGTH = 3600;

// Spielzustand
let gameState = 'START'; // START, PLAYING, GAMEOVER, WIN
let score = 0;
let timeRemaining = 90;
let lastTime = 0;
let cameraX = 0;
let particles = [];
let floatingTexts = [];

// Spieler (Igeli)
const player = {
    x: 100,
    y: 300,
    width: 44,
    height: 30,
    vx: 0,
    vy: 0,
    speed: 0.9,
    maxSpeed: 5.5,
    jumpForce: -12.5,
    isGrounded: false,
    facingRight: true,
    lives: 3,
    invulnerable: 0,
    walkCycle: 0
};

// Level-Objekte
let platforms = [];
let collectibles = [];
let enemies = [];
let backgroundElements = [];
let goal = { x: 3420, y: 310, width: 80, height: 80 };

// Initialisierung & Resize
function resizeCanvas() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Level aufbauen
function initLevel() {
    score = 0;
    timeRemaining = 90;
    cameraX = 0;
    particles = [];
    floatingTexts = [];
    
    player.x = 80;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.lives = 3;
    player.invulnerable = 0;
    player.facingRight = true;

    // Boden und Plattformen
    platforms = [
        // Hauptboden (mit kleinen Gruben)
        { x: 0, y: 390, w: 900, h: 60, type: 'ground' },
        { x: 1020, y: 390, w: 800, h: 60, type: 'ground' },
        { x: 1950, y: 390, w: 750, h: 60, type: 'ground' },
        { x: 2820, y: 390, w: 850, h: 60, type: 'ground' },

        // Schwebende Holz- & Erdplattformen
        { x: 280, y: 300, w: 120, h: 20, type: 'wood' },
        { x: 480, y: 230, w: 140, h: 20, type: 'wood' },
        { x: 700, y: 280, w: 110, h: 20, type: 'wood' },
        
        // Über erste Grube
        { x: 910, y: 330, w: 100, h: 20, type: 'wood' },

        { x: 1180, y: 290, w: 130, h: 20, type: 'wood' },
        { x: 1380, y: 210, w: 150, h: 20, type: 'wood' },
        { x: 1600, y: 270, w: 120, h: 20, type: 'wood' },

        // Über zweite Grube
        { x: 1830, y: 320, w: 110, h: 20, type: 'wood' },

        { x: 2100, y: 280, w: 140, h: 20, type: 'wood' },
        { x: 2320, y: 200, w: 140, h: 20, type: 'wood' },
        { x: 2540, y: 270, w: 120, h: 20, type: 'wood' },

        // Über dritte Grube
        { x: 2710, y: 330, w: 100, h: 20, type: 'wood' },

        // Endspurt Plattformen
        { x: 2980, y: 290, w: 130, h: 20, type: 'wood' },
        { x: 3180, y: 230, w: 130, h: 20, type: 'wood' }
    ];

    // Sammelobjekte (Äpfel, Beeren, Goldene Eicheln)
    collectibles = [
        // Äpfel (10 Punkte) & Beeren (25 Punkte)
        { x: 320, y: 265, type: 'apple', collected: false },
        { x: 360, y: 265, type: 'apple', collected: false },
        { x: 530, y: 195, type: 'berry', collected: false },
        { x: 570, y: 195, type: 'berry', collected: false },
        { x: 740, y: 245, type: 'apple', collected: false },
        { x: 950, y: 290, type: 'acorn', collected: false }, // Goldene Eichel (50 Pkt)

        { x: 1100, y: 355, type: 'apple', collected: false },
        { x: 1230, y: 255, type: 'berry', collected: false },
        { x: 1440, y: 175, type: 'acorn', collected: false },
        { x: 1650, y: 235, type: 'apple', collected: false },
        { x: 1875, y: 280, type: 'berry', collected: false },

        { x: 2150, y: 245, type: 'apple', collected: false },
        { x: 2190, y: 245, type: 'apple', collected: false },
        { x: 2380, y: 165, type: 'acorn', collected: false },
        { x: 2590, y: 235, type: 'berry', collected: false },
        { x: 2750, y: 290, type: 'berry', collected: false },

        { x: 3030, y: 255, type: 'apple', collected: false },
        { x: 3235, y: 195, type: 'acorn', collected: false },
        { x: 3320, y: 355, type: 'berry', collected: false }
    ];

    // Gegner (Stachelige Käfer & Fliegenpilz-Wächter)
    enemies = [
        { x: 600, y: 362, w: 34, h: 28, vx: 1.5, minX: 450, maxX: 850, type: 'beetle' },
        { x: 1300, y: 362, w: 34, h: 28, vx: -1.8, minX: 1100, maxX: 1750, type: 'beetle' },
        { x: 1420, y: 182, w: 34, h: 28, vx: 1.2, minX: 1385, maxX: 1500, type: 'beetle' },
        { x: 2200, y: 362, w: 34, h: 28, vx: 2.0, minX: 2000, maxX: 2650, type: 'beetle' },
        { x: 2350, y: 172, w: 34, h: 28, vx: -1.2, minX: 2325, maxX: 2430, type: 'beetle' },
        { x: 3050, y: 362, w: 34, h: 28, vx: -2.2, minX: 2880, maxX: 3320, type: 'beetle' }
    ];

    // Dekoration im Hintergrund (Bäume, Büsche, Wolken)
    backgroundElements = [];
    for (let i = 0; i < 25; i++) {
        backgroundElements.push({
            x: i * 180 + Math.random() * 80,
            y: 390,
            type: i % 3 === 0 ? 'tree' : 'bush',
            scale: 0.8 + Math.random() * 0.5
        });
    }
    for (let i = 0; i < 15; i++) {
        backgroundElements.push({
            x: i * 280 + Math.random() * 100,
            y: 40 + Math.random() * 110,
            type: 'cloud',
            scale: 0.7 + Math.random() * 0.6
        });
    }

    updateHUD();
}

// HUD aktualisieren
function updateHUD() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = Math.ceil(timeRemaining);
    livesDisplay.textContent = '❤️'.repeat(Math.max(0, player.lives));
}

// Partikeleffekt erstellen
function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.8) * 6,
            size: 3 + Math.random() * 4,
            color: color,
            life: 1.0
        });
    }
}

// Schwebenden Text erstellen
function spawnFloatingText(x, y, text, color = '#FFD54F') {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.0
    });
}

// Kollisionsprüfung Rechteck
function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.height > r2.y
    );
}

// Spieler nimmt Schaden
function damagePlayer() {
    if (player.invulnerable > 0) return;
    
    player.lives--;
    player.invulnerable = 90; // 1.5 Sekunden unverwundbar
    player.vy = -8; // Kleiner Rückstoß nach oben
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#E53935', 15);
    updateHUD();

    if (player.lives <= 0) {
        endGame(false);
    }
}

// Spiel beenden
function endGame(won) {
    gameState = won ? 'WIN' : 'GAMEOVER';
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');

    if (won) {
        const timeBonus = Math.ceil(timeRemaining) * 5;
        const totalScore = score + timeBonus;
        finalScoreWin.textContent = totalScore;
        winDetails.textContent = `(Sammelpunkte: ${score} + Zeitbonus: ${timeBonus})`;
        winScreen.classList.remove('hidden');
        spawnParticles(player.x, player.y, '#FFD54F', 40);
    } else {
        finalScoreLost.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
}

// Update-Logik pro Frame
function update(dt) {
    if (gameState !== 'PLAYING') return;

    // Timer herunterzählen
    timeRemaining -= dt;
    if (timeRemaining <= 0) {
        timeRemaining = 0;
        updateHUD();
        endGame(false);
        return;
    }
    timeDisplay.textContent = Math.ceil(timeRemaining);

    // Unverwundbarkeit herunterzählen
    if (player.invulnerable > 0) player.invulnerable--;

    // Horizontale Bewegung
    if (Input.left) {
        player.vx -= player.speed;
        player.facingRight = false;
    }
    if (Input.right) {
        player.vx += player.speed;
        player.facingRight = true;
    }

    // Reibung & Geschwindigkeitsbegrenzung
    player.vx *= FRICTION;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    if (player.vx > player.maxSpeed) player.vx = player.maxSpeed;
    if (player.vx < -player.maxSpeed) player.vx = -player.maxSpeed;

    // Laufanimation
    if (Math.abs(player.vx) > 0.3 && player.isGrounded) {
        player.walkCycle += Math.abs(player.vx) * 0.08;
    } else {
        player.walkCycle = 0;
    }

    // Springen
    if (Input.jump && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
        spawnParticles(player.x + player.width / 2, player.y + player.height, '#D7CCC8', 6);
    }

    // Schwerkraft anwenden
    player.vy += GRAVITY;

    // X-Bewegung & Kollision
    player.x += player.vx;
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x > LEVEL_LENGTH - player.width) { player.x = LEVEL_LENGTH - player.width; }

    for (let p of platforms) {
        if (checkRectCollision(player, p)) {
            if (player.vx > 0) player.x = p.x - player.width;
            else if (player.vx < 0) player.x = p.x + p.w;
            player.vx = 0;
        }
    }

    // Y-Bewegung & Kollision
    player.y += player.vy;
    player.isGrounded = false;

    for (let p of platforms) {
        if (checkRectCollision(player, p)) {
            if (player.vy > 0) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
            } else if (player.vy < 0) {
                player.y = p.y + p.h;
                player.vy = 0;
            }
        }
    }

    // In Grube gefallen?
    if (player.y > GAME_HEIGHT + 50) {
        player.lives--;
        updateHUD();
        if (player.lives <= 0) {
            endGame(false);
            return;
        } else {
            // Zurück auf sicheren Boden setzen
            player.y = 200;
            player.x = Math.max(80, player.x - 180);
            player.vy = 0;
            player.vx = 0;
            player.invulnerable = 90;
        }
    }

    // Sammelobjekte prüfen
    for (let item of collectibles) {
        if (!item.collected) {
            const itemBox = { x: item.x - 12, y: item.y - 12, w: 24, h: 24 };
            if (checkRectCollision(player, itemBox)) {
                item.collected = true;
                let pts = 10;
                let col = '#E53935';
                if (item.type === 'berry') { pts = 25; col = '#8E24AA'; }
                if (item.type === 'acorn') { pts = 50; col = '#FFD54F'; }
                
                score += pts;
                updateHUD();
                spawnParticles(item.x, item.y, col, 12);
                spawnFloatingText(item.x, item.y - 10, `+${pts}`, col);
            }
        }
    }

    // Gegner aktualisieren & prüfen
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.vx;
        if (e.x <= e.minX || e.x + e.w >= e.maxX) {
            e.vx *= -1;
        }

        if (checkRectCollision(player, e)) {
            // Von oben auf Gegner gesprungen?
            if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 10) {
                player.vy = -9.5; // Abprallen
                score += 30;
                updateHUD();
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#FF7043', 15);
                spawnFloatingText(e.x, e.y - 10, '+30', '#FFCC80');
                enemies.splice(i, 1);
            } else {
                damagePlayer();
            }
        }
    }

    // Ziel (Igeli-Bau) erreicht?
    const goalBox = { x: goal.x + 15, y: goal.y + 15, w: goal.width - 30, h: goal.height - 15 };
    if (checkRectCollision(player, goalBox)) {
        endGame(true);
        return;
    }

    // Partikel & Schwebetexte aktualisieren
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y -= 1.2;
        ft.life -= 0.025;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Kamera folgt Igeli sanft
    let targetCamX = player.x - GAME_WIDTH * 0.35;
    targetCamX = Math.max(0, Math.min(targetCamX, LEVEL_LENGTH - GAME_WIDTH));
    cameraX += (targetCamX - cameraX) * 0.1;
}

// ==========================================
// ZEICHNEN (RENDERING)
// ==========================================

function draw() {
    // Himmel-Farbverlauf
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#64B5F6');
    skyGrad.addColorStop(0.6, '#B3E5FC');
    skyGrad.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sonne
    ctx.fillStyle = 'rgba(255, 241, 118, 0.9)';
    ctx.beginPath();
    ctx.arc(680, 75, 42, 0, Math.PI * 2);
    ctx.fill();

    // Ferne Hügel (Parallax)
    ctx.fillStyle = '#A5D6A7';
    for (let i = 0; i < 10; i++) {
        let hx = i * 450 - (cameraX * 0.25);
        ctx.beginPath();
        ctx.arc(hx + 200, 420, 260, Math.PI, 0);
        ctx.fill();
    }

    // Hintergrundelemente (Wolken, Bäume, Büsche)
    for (let bg of backgroundElements) {
        let parallaxFactor = bg.type === 'cloud' ? 0.3 : 0.7;
        let drawX = bg.x - cameraX * parallaxFactor;
        
        if (drawX < -150 || drawX > GAME_WIDTH + 150) continue;

        if (bg.type === 'cloud') {
            drawCloud(drawX, bg.y, bg.scale);
        } else if (bg.type === 'tree') {
            drawTree(drawX, bg.y, bg.scale);
        } else if (bg.type === 'bush') {
            drawBush(drawX, bg.y, bg.scale);
        }
    }

    ctx.save();
    ctx.translate(-cameraX, 0);

    // Plattformen & Boden zeichnen
    for (let p of platforms) {
        if (p.x + p.w < cameraX - 50 || p.x > cameraX + GAME_WIDTH + 50) continue;

        if (p.type === 'ground') {
            // Erde
            ctx.fillStyle = '#6D4C41';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Grasdecke
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(p.x, p.y, p.w, 12);
            ctx.fillStyle = '#81C784';
            ctx.fillRect(p.x, p.y, p.w, 4);
        } else {
            // Holzplattform
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 6);
            ctx.fill();
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Moos oben drauf
            ctx.fillStyle = '#66BB6A';
            ctx.fillRect(p.x + 4, p.y, p.w - 8, 5);
        }
    }

    // Ziel: Gemütlicher Blätter- & Holzhaufen-Bau
    drawGoal(goal.x, goal.y);

    // Sammelobjekte zeichnen
    const bounce = Math.sin(Date.now() * 0.005) * 4;
    for (let item of collectibles) {
        if (item.collected) continue;
        if (item.x < cameraX - 50 || item.x > cameraX + GAME_WIDTH + 50) continue;

        drawCollectible(item.x, item.y + bounce, item.type);
    }

    // Gegner zeichnen
    for (let e of enemies) {
        if (e.x + e.w < cameraX - 50 || e.x > cameraX + GAME_WIDTH + 50) continue;
        drawEnemy(e);
    }

    // Spieler (Igeli) zeichnen
    if (player.invulnerable === 0 || Math.floor(player.invulnerable / 5) % 2 === 0) {
        drawIgeli(player);
    }

    // Partikel zeichnen
    for (let p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Schwebende Punktetexte zeichnen
    ctx.font = "bold 18px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    for (let ft of floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = "#3E2723";
        ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
}

// ==========================================
// HILFSFUNKTIONEN FÜR GRAFIKEN
// ==========================================

function drawCloud(x, y, s) {
    // Wolken-Bäusche mit separaten Pfaden (verhindert Dreiecks-Artefakte)
    const puffs = [
        { dx: -22 * s, dy: 4 * s, r: 17 * s },
        { dx: -4 * s, dy: -6 * s, r: 24 * s },
        { dx: 22 * s, dy: -11 * s, r: 28 * s },
        { dx: 48 * s, dy: -3 * s, r: 22 * s },
        { dx: 66 * s, dy: 6 * s, r: 15 * s }
    ];

    // 1. Sanfter Schatten an der Unterseite der Wolke
    ctx.fillStyle = "rgba(195, 224, 245, 0.85)";
    ctx.beginPath();
    ctx.roundRect(x - 36 * s, y + 6 * s, 114 * s, 18 * s, 10 * s);
    for (const p of puffs) {
        ctx.moveTo(x + p.dx + p.r, y + p.dy + 4 * s);
        ctx.arc(x + p.dx, y + p.dy + 4 * s, p.r, 0, Math.PI * 2);
    }
    ctx.fill();

    // 2. Hauptkörper der Wolke (flache Basis + weiche Kuppen)
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.beginPath();
    ctx.roundRect(x - 35 * s, y + 2 * s, 112 * s, 18 * s, 10 * s);
    for (const p of puffs) {
        ctx.moveTo(x + p.dx + p.r, y + p.dy);
        ctx.arc(x + p.dx, y + p.dy, p.r, 0, Math.PI * 2);
    }
    ctx.fill();

    // 3. Zarter Sonnenglanz auf den oberen Kuppen
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.moveTo(x - 4 * s + 16 * s, y - 9 * s);
    ctx.arc(x - 4 * s, y - 9 * s, 16 * s, 0, Math.PI * 2);
    ctx.moveTo(x + 22 * s + 19 * s, y - 14 * s);
    ctx.arc(x + 22 * s, y - 14 * s, 19 * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawTree(x, y, s) {
    // 1. Baumstamm (leicht verjüngt mit Wurzelansatz)
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.moveTo(x - 13 * s, y);
    ctx.lineTo(x - 8 * s, y - 82 * s);
    ctx.lineTo(x + 8 * s, y - 82 * s);
    ctx.lineTo(x + 13 * s, y);
    ctx.closePath();
    ctx.fill();

    // Dunklere Rindenschattierung rechts am Stamm
    ctx.fillStyle = "#4E342E";
    ctx.beginPath();
    ctx.moveTo(x + 2 * s, y);
    ctx.lineTo(x + 1 * s, y - 82 * s);
    ctx.lineTo(x + 8 * s, y - 82 * s);
    ctx.lineTo(x + 13 * s, y);
    ctx.closePath();
    ctx.fill();

    // Kleine Äste in die Krone hinein
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 5 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y - 62 * s);
    ctx.lineTo(x - 22 * s, y - 78 * s);
    ctx.moveTo(x + 4 * s, y - 68 * s);
    ctx.lineTo(x + 20 * s, y - 82 * s);
    ctx.stroke();

    // Hilfsfunktion zum Zeichnen mehrerer Blatt-Bäusche ohne Verbindungslinien
    const drawCanopyCluster = (clusters, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (const c of clusters) {
            ctx.moveTo(x + c.dx + c.r, y + c.dy);
            ctx.arc(x + c.dx, y + c.dy, c.r, 0, Math.PI * 2);
        }
        ctx.fill();
    };

    // 2. Hintere Schatten-Ebene der Baumkrone (Tiefe)
    drawCanopyCluster([
        { dx: -30 * s, dy: -76 * s, r: 26 * s },
        { dx: 30 * s, dy: -76 * s, r: 26 * s },
        { dx: 0 * s, dy: -72 * s, r: 30 * s },
        { dx: -22 * s, dy: -102 * s, r: 28 * s },
        { dx: 22 * s, dy: -102 * s, r: 28 * s }
    ], "#2E7D32");

    // 3. Haupt-Blattwerk (sattes Grün)
    drawCanopyCluster([
        { dx: 0 * s, dy: -116 * s, r: 33 * s },
        { dx: -28 * s, dy: -90 * s, r: 27 * s },
        { dx: 28 * s, dy: -90 * s, r: 27 * s },
        { dx: -14 * s, dy: -82 * s, r: 25 * s },
        { dx: 15 * s, dy: -82 * s, r: 25 * s },
        { dx: 0 * s, dy: -98 * s, r: 30 * s }
    ], "#43A047");

    // 4. Sonnenbeschienene Blatt-Kuppen (oben links für 3D-Plastizität)
    drawCanopyCluster([
        { dx: -6 * s, dy: -124 * s, r: 22 * s },
        { dx: -31 * s, dy: -96 * s, r: 18 * s },
        { dx: 16 * s, dy: -108 * s, r: 17 * s },
        { dx: -14 * s, dy: -94 * s, r: 16 * s }
    ], "#66BB6A");

    // 5. Feine Glanzlichter auf der Krone
    drawCanopyCluster([
        { dx: -10 * s, dy: -129 * s, r: 11 * s },
        { dx: -34 * s, dy: -100 * s, r: 9 * s }
    ], "#81C784");
}

function drawBush(x, y, s) {
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.arc(x, y - 15 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(x - 18 * s, y - 10 * s, 15 * s, 0, Math.PI * 2);
    ctx.arc(x + 18 * s, y - 10 * s, 15 * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawGoal(x, y) {
    // Blätterhaufen-Höhle
    ctx.fillStyle = "#E65100";
    ctx.beginPath();
    ctx.arc(x + 40, y + 80, 45, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#FFB300";
    ctx.beginPath();
    ctx.arc(x + 25, y + 75, 25, Math.PI, 0);
    ctx.arc(x + 55, y + 75, 25, Math.PI, 0);
    ctx.fill();

    // Höhleneingang
    ctx.fillStyle = "#3E2723";
    ctx.beginPath();
    ctx.arc(x + 40, y + 80, 22, Math.PI, 0);
    ctx.fill();

    // Kleines Schild "ZUHAUSE"
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x - 15, y + 40, 6, 40);
    ctx.fillStyle = "#D7CCC8";
    ctx.fillRect(x - 32, y + 28, 42, 18);
    ctx.fillStyle = "#3E2723";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BAU", x - 11, y + 40);
}

function drawCollectible(x, y, type) {
    if (type === 'apple') {
        // Roter Apfel
        ctx.fillStyle = "#E53935";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        // Glanzpunkt
        ctx.fillStyle = "#FFCDD2";
        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        // Blatt
        ctx.fillStyle = "#43A047";
        ctx.beginPath();
        ctx.ellipse(x + 3, y - 10, 5, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'berry') {
        // Lila Waldbeeren-Traube
        ctx.fillStyle = "#8E24AA";
        ctx.beginPath();
        ctx.arc(x - 4, y, 6, 0, Math.PI * 2);
        ctx.arc(x + 4, y, 6, 0, Math.PI * 2);
        ctx.arc(x, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#43A047";
        ctx.fillRect(x - 2, y - 9, 4, 5);
    } else if (type === 'acorn') {
        // Goldene Eichel
        ctx.fillStyle = "#FFD54F";
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Kappe
        ctx.fillStyle = "#795548";
        ctx.beginPath();
        ctx.arc(x, y - 4, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 1.5, y - 16, 3, 5);
    }
}

function drawEnemy(e) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;

    // Stacheliger Krabbelkäfer
    ctx.fillStyle = "#37474F";
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 15, Math.PI, 0);
    ctx.fill();

    // Stacheln auf dem Panzer
    ctx.fillStyle = "#FF5252";
    for (let a = -0.8; a <= 0.8; a += 0.4) {
        let sx = cx + Math.sin(a) * 14;
        let sy = cy + 4 - Math.cos(a) * 14;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy);
        ctx.lineTo(sx + Math.sin(a) * 7, sy - Math.cos(a) * 7);
        ctx.lineTo(sx + 3, sy);
        ctx.fill();
    }

    // Böse Augen
    let lookDir = e.vx > 0 ? 5 : -5;
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(cx + lookDir, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#D50000";
    ctx.beginPath();
    ctx.arc(cx + lookDir + (e.vx > 0 ? 1 : -1), cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Füßchen
    const step = Math.sin(Date.now() * 0.02) * 3;
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 4); ctx.lineTo(cx - 8 + step, cy + 14);
    ctx.moveTo(cx + 8, cy + 4); ctx.lineTo(cx + 8 - step, cy + 14);
    ctx.stroke();
}

function drawIgeli(p) {
    ctx.save();
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;
    ctx.translate(cx, cy);
    if (!p.facingRight) ctx.scale(-1, 1);

    // Füßchen (animiert beim Laufen)
    const footOffset = Math.sin(p.walkCycle) * 5;
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.ellipse(-6 + footOffset, 12, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(8 - footOffset, 12, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stachelkleid (Hintergrund)
    ctx.fillStyle = "#4E342E";
    ctx.beginPath();
    ctx.arc(-4, 2, 16, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();

    // Einzelne Stachelspitzen
    ctx.fillStyle = "#3E2723";
    for (let angle = Math.PI * 0.9; angle <= Math.PI * 1.95; angle += 0.25) {
        let sx = -4 + Math.cos(angle) * 15;
        let sy = 2 + Math.sin(angle) * 15;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 3);
        ctx.lineTo(sx + Math.cos(angle) * 7, sy + Math.sin(angle) * 7);
        ctx.lineTo(sx + 3, sy + 2);
        ctx.fill();
    }

    // Bauch & Gesicht (hellbraun/beige)
    ctx.fillStyle = "#D7CCC8";
    ctx.beginPath();
    ctx.ellipse(6, 5, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spitze Schnauze
    ctx.beginPath();
    ctx.moveTo(12, -1);
    ctx.lineTo(24, 5);
    ctx.lineTo(12, 11);
    ctx.fill();

    // Schwarze Stupsnase
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(24, 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Niedliches Auge
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(13, 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Lichtreflex im Auge
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(13.8, 0.2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Kleines rundes Ohr
    ctx.fillStyle = "#BCAAA4";
    ctx.beginPath();
    ctx.arc(5, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ==========================================
// HAUPTSCHLEIFE (GAME LOOP)
// ==========================================

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start / Neustart Button Events
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    // Touch-Steuerung nur auf Touch-Geräten oder schmalen Bildschirmen zeigen
    if ('ontouchstart' in window || window.innerWidth <= 850) {
        touchControls.classList.remove('hidden');
    }

    initLevel();
    gameState = 'PLAYING';
    lastTime = performance.now();
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartLostBtn').addEventListener('click', startGame);
document.getElementById('restartWinBtn').addEventListener('click', startGame);

// Initiales Hintergrundbild zeichnen & Loop starten
initLevel();
requestAnimationFrame(gameLoop);
