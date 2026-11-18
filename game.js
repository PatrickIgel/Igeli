function launchCatapult() {
    const power = 330 + player.slingshotCharge * 330;
    player.vx = player.facing * Math.cos(player.aimAngle) * power;
    player.vy = -Math.sin(player.aimAngle) * power * 1.15 - 120;
    player.grounded = false; player.slingshotCharge = 0; player.aimState = 0; player.catapultFlight = true;
    playTone(260, 'triangle', 0.25, 0.16, 680);
}

function update(dt) {
    if (netMode === 'client') {
        state.blueActHeld = !!(inputs.blueAct || keys.blueAct);
        const f = Math.min(1, 20 * dt);
        if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
        if (netTarget) {
            player.x += (netTarget.px - player.x) * f;
            player.y += (netTarget.py - player.y) * f;
            player.rot += (netTarget.prot - player.rot) * f;
            state.camX += (netTarget.camX - state.camX) * f;
        }
        for (const b of boxes) if (b.tx !== undefined) { b.x += (b.tx - b.x) * f; b.y += (b.ty - b.y) * f; }
        for (const g of gates) if (g.tOpenH !== undefined) g.openH += (g.tOpenH - g.openH) * f;
        for (const z of zombies) if (z.tx !== undefined) { z.x += (z.tx - z.x) * f; z.y += (z.ty - z.y) * f; }
        for (const rb of ropeBridges) if (rb.ty !== undefined) rb.y += (rb.ty - rb.y) * f;
        for (const w of wasps) if (w.tx !== undefined) { w.x += (w.tx - w.x) * f; w.y += (w.ty - w.y) * f; }
        for (const bt of beetles) if (bt.tx !== undefined) { bt.x += (bt.tx - bt.x) * f; bt.y += (bt.ty - bt.y) * f; }
        for (const sw of seesaws) if (sw.tAngle !== undefined) sw.angle += (sw.tAngle - sw.angle) * f;
        for (const ms of mossPlatforms) if (ms.ty !== undefined) ms.y += (ms.ty - ms.y) * f;
        for (const m of mushrooms) m.bounce = Math.max(0, m.bounce - dt * 4);
        return;
    }

    if (state.won || state.gameOver) return;
    if (player.invuln > 0) player.invuln -= dt;

    const left = netMode === 'host' ? remoteInputs.blueLeft : (inputs.blueLeft || keys.blueLeft);
    const right = inputs.redRight || keys.redRight;
    const curl = inputs.redCurl || keys.redCurl;
    const redAct = inputs.redAct || keys.redAct;
    const blueAct = netMode === 'host' ? remoteInputs.blueAct : (inputs.blueAct || keys.blueAct);
    const jump = netMode === 'host' ? (remoteInputs.blueJump || remoteJumpPulse) : (inputs.blueJump || keys.blueJump);

    state.redActHeld = !!redAct;
    state.blueActHeld = !!blueAct;

    const jumpJustPressed = jump && !player.wasJumpPressed;
    player.wasJumpPressed = jump;
    remoteJumpPulse = false;
    player.curled = curl;
    if (left && !right) player.facing = -1;
    if (right && !left) player.facing = 1;

    if (player.curled && player.grounded) {
        player.vx *= Math.pow(0.01, dt);
        if (player.aimState === 0) {
            player.slingshotCharge = 0;
            if (jumpJustPressed) { player.aimState = 1; player.aimAngle = 0.25; player.aimDir = 1; playTone(440, 'sine', 0.08, 0.08); }
        } else if (player.aimState === 1) {
            player.aimAngle += player.aimDir * dt * 1.45;
            if (player.aimAngle >= 1.45) { player.aimAngle = 1.45; player.aimDir = -1; }
            if (player.aimAngle <= 0.12) { player.aimAngle = 0.12; player.aimDir = 1; }
            if (jumpJustPressed) { player.aimState = 2; player.slingshotCharge = 0.05; playTone(560, 'sine', 0.1, 0.1); }
        } else if (player.aimState === 2) {
            if (jump) {
                player.slingshotCharge = Math.min(1.0, player.slingshotCharge + dt * 0.52);
                if (player.slingshotCharge >= 1.0) launchCatapult();
            } else if (player.slingshotCharge > 0.05) launchCatapult();
        }
    } else {
        player.slingshotCharge = 0; player.aimState = 0;
        if (player.grounded) player.catapultFlight = false;
        const moveSpeed = player.curled ? 125 : 175;
        let targetVx = (left ? -moveSpeed : 0) + (right ? moveSpeed : 0);
        if (!player.catapultFlight) player.vx += (targetVx - player.vx) * Math.min(1, 8 * dt);
        if (jumpJustPressed && player.grounded) {
            player.vy = -385; player.grounded = false;
            playTone(320, 'sine', 0.16, 0.12, 540);
        }
    }

    let inUpdraft = false;
    for (const w of winds) {
        if (!w.active || !isColorActive(w.color)) continue;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, w.x, w.y, w.w, w.h)) {
            if (w.vy < 0 && jump && !player.curled) {
                inUpdraft = true; player.catapultFlight = false;
                player.vy = Math.max(-290, player.vy - 1180 * dt);
            }
            if (w.vx !== 0 && !(player.curled && player.grounded)) {
                player.vx += (player.catapultFlight ? w.vx * 0.45 : w.vx * 3.8) * dt;
                if (!player.catapultFlight && w.vx < 0 && player.vx > -140) player.vx = -140;
                if (!player.catapultFlight && w.vx > 0 && player.vx < 140) player.vx = 140;
            }
        }
    }

    // Magnet-Blöcke: ziehen den eingerollten Igel an, solange die passende Farbe aktiv gehalten wird
    let inMagnetPull = false;
    for (const mg of magnetBlocks) {
        if (!isColorActive(mg.color) || !player.curled) continue;
        const dx = mg.x - player.x;
        const dy = mg.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1 && dist <= mg.range) {
            inMagnetPull = true;
            player.catapultFlight = false;
            const pull = mg.force * (0.55 + 0.45 * (1 - dist / mg.range));
            player.vx += (dx / dist) * pull * dt;
            player.vy += (dy / dist) * pull * dt;
            const maxSpd = 430;
            const spd = Math.hypot(player.vx, player.vy);
            if (spd > maxSpd) {
                player.vx = (player.vx / spd) * maxSpd;
                player.vy = (player.vy / spd) * maxSpd;
            }
        }
    }

    // Zerbrechliche Ketten / Hängebrücken aktualisieren
    for (const rb of ropeBridges) {
        if (!rb.cut) {
            if ((player.catapultFlight || (!player.grounded && player.curled && Math.hypot(player.vx, player.vy) > 260)) &&
                rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, rb.ropeX - 12, rb.ropeY, 24, Math.max(12, rb.y - rb.ropeY))) {
                rb.cut = true;
                rb.vy = 40;
                playTone(520, 'sawtooth', 0.18, 0.15, 180);
            }
        } else if (!rb.settled) {
            rb.vy = Math.min(780, rb.vy + 980 * dt);
            rb.y += rb.vy * dt;
            if (rb.y >= rb.targetY) {
                rb.y = rb.targetY;
                rb.vy = 0;
                rb.settled = true;
                playTone(130, 'square', 0.16, 0.15, 65);
            }
        }
    }

    const grav = (inUpdraft || inMagnetPull) ? 0 : ((player.curled && !player.grounded) ? 1350 : 920);
    player.vy = Math.min(820, player.vy + grav * dt);
    player.x += player.vx * dt;
    if (player.x < 40) { player.x = 40; player.vx = 0; }

    for (const b of boxes) {
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, b.x, b.y, b.w, b.h) && player.y + player.r * 0.5 > b.y + 6) {
            b.x = player.x < b.x + b.w / 2 ? player.x + player.r : player.x - player.r - b.w;
        }
    }
    for (let i = breakables.length - 1; i >= 0; i--) {
        const br = breakables[i];
        if (br.type === 'wall' && rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, br.x, br.y, br.w, br.h)) {
            if (player.curled && Math.abs(player.vx) > 250) { breakables.splice(i, 1); playTone(140, 'square', 0.2, 0.15, 60); }
            else { player.x = player.vx > 0 ? br.x - player.r : br.x + br.w + player.r; player.vx = 0; }
        }
    }

    const solids = [...platforms];
    for (const g of gates) if (g.openH < g.h - 8) solids.push({ x: g.x, y: g.y, w: g.w, h: g.h - g.openH });
    for (const cp of colorPlatforms) if (isColorPlatformActive(cp)) solids.push({ x: cp.x, y: cp.y, w: cp.w, h: cp.h });
    for (const cl of colorLasers) if (!isColorActive(cl.color)) solids.push({ x: cl.x, y: cl.y, w: cl.w, h: cl.h });
    for (const rb of ropeBridges) solids.push({ x: rb.x, y: rb.y, w: rb.w, h: rb.h });
    for (const mg of magnetBlocks) solids.push({ x: mg.x - mg.r, y: mg.y - mg.r, w: mg.r * 2, h: mg.r * 2 });
    for (const ms of mossPlatforms) if (!ms.broken && !ms.falling) solids.push({ x: ms.x, y: ms.y, w: ms.w, h: ms.h });

    for (const s of solids) {
        if (rectOverlap(player.x - player.r, player.y - player.r + 4, player.r * 2, player.r * 2 - 8, s.x, s.y, s.w, s.h)) {
            const isRampSeam = ramps.some(rp =>
                ((Math.abs((s.x + s.w) - rp.x1) <= 2 && Math.abs(s.y - rp.y1) <= 4) ||
                 (Math.abs(s.x - rp.x2) <= 2 && Math.abs(s.y - rp.y2) <= 4)) &&
                player.x + player.r >= rp.x1 - 6 && player.x - player.r <= rp.x2 + 6 &&
                player.y + player.r <= rp.y1 + Math.max(0, Math.min(1, (player.x - rp.x1) / (rp.x2 - rp.x1))) * (rp.y2 - rp.y1) + 18
            );
            if (isRampSeam) continue;
            if (player.vx > 0) player.x = s.x - player.r; else if (player.vx < 0) player.x = s.x + s.w + player.r;
            player.vx = 0;
        }
    }

    const prevVy = player.vy, wasGrounded = player.grounded;
    player.y += player.vy * dt;
    player.grounded = false;

    // Glasböden: zerbrechen sofort, wenn man sich darauf einrollt oder eingerollt darauf landet
    for (let i = breakables.length - 1; i >= 0; i--) {
        const br = breakables[i];
        if (br.type === 'floor' && rectOverlap(player.x - player.r + 4, player.y - player.r, player.r * 2 - 8, player.r * 2 + 4, br.x, br.y, br.w, br.h)) {
            if (player.curled && player.y < br.y + 14) {
                breakables.splice(i, 1);
                player.grounded = false;
                playTone(130, 'sawtooth', 0.22, 0.16, 55);
            } else if (player.vy >= 0 && player.y - player.r < br.y) {
                player.y = br.y - player.r;
                player.vy = 0;
                player.grounded = true;
            }
        }
    }
    for (const s of [...solids, ...boxes]) {
        if (rectOverlap(player.x - player.r + 4, player.y - player.r, player.r * 2 - 8, player.r * 2, s.x, s.y, s.w, s.h)) {
            if (player.vy >= 0 && player.y < s.y + 18) { player.y = s.y - player.r; player.vy = 0; player.grounded = true; }
            else if (player.vy < 0 && player.y > s.y + s.h - 18) { player.y = s.y + s.h + player.r; player.vy = 0; }
        }
    }

    for (const rp of ramps) {
        if (player.x >= rp.x1 - 10 && player.x <= rp.x2 + 10) {
            const t = Math.max(0, Math.min(1, (player.x - rp.x1) / (rp.x2 - rp.x1)));
            const ry = rp.y1 + t * (rp.y2 - rp.y1);
            const snapUp = wasGrounded ? 16 : 8;
            if (player.vy >= 0 && player.y + player.r >= ry - snapUp && player.y - player.r < ry + 28) {
                player.y = ry - player.r; player.vy = 0; player.grounded = true;
                if (player.curled) { player.vx = Math.min(540, player.vx + 560 * dt); player.catapultFlight = true; }
            }
        }
    }
    // Zerbröselnde Moos-Plattformen (Timer & Kugel-Stampfer)
    for (const ms of mossPlatforms) {
        if (ms.broken) continue;
        if (ms.falling) {
            ms.vy = Math.min(760, ms.vy + 1150 * dt);
            ms.y += ms.vy * dt;
            if (ms.y > GAME_H + 60) ms.broken = true;
            continue;
        }
        const onTop = player.grounded && Math.abs((player.y + player.r) - ms.y) <= 6 && player.x + player.r * 0.6 >= ms.x && player.x - player.r * 0.6 <= ms.x + ms.w;
        if (onTop) {
            if (player.curled) {
                ms.falling = true;
                ms.vy = 160;
                player.grounded = false;
                playTone(135, 'sawtooth', 0.2, 0.15, 60);
                continue;
            }
            if (!ms.triggered) {
                ms.triggered = true;
                playTone(290, 'triangle', 0.1, 0.09, 210);
            }
        }
        if (ms.triggered) {
            ms.timer += dt;
            if (ms.timer >= 1.0) {
                ms.falling = true;
                ms.vy = 80;
                playTone(150, 'sawtooth', 0.18, 0.14, 65);
            }
        }
    }

    for (const sw of seesaws) {
        let torque = 0;
        if (Math.abs(player.x - sw.cx) <= sw.halfW) {
            const sy = sw.cy + (player.x - sw.cx) * Math.tan(sw.angle);
            if (player.vy >= 0 && player.y + player.r >= sy - 10 && player.y - player.r < sy + 22) {
                player.y = sy - player.r; player.vy = 0; player.grounded = true;
                torque += ((player.x - sw.cx) / sw.halfW) * (player.curled ? 1.5 : 0.75);
            }
        }
        for (const b of boxes) {
            const bcx = b.x + b.w / 2;
            if (Math.abs(bcx - sw.cx) <= sw.halfW) {
                const sy = sw.cy + (bcx - sw.cx) * Math.tan(sw.angle);
                if (b.vy >= 0 && b.y + b.h >= sy - 10 && b.y < sy + 20) {
                    b.y = sy - b.h;
                    b.vy = 0;
                    torque += ((bcx - sw.cx) / sw.halfW) * 1.35;
                    if (sw.angle > 0.05) {
                        b.x += Math.sin(sw.angle) * 260 * dt;
                    }
                }
            }
        }
        const locked = sw.lockColor && isColorActive(sw.lockColor);
        if (!locked) {
            sw.angle += (Math.max(-0.28, Math.min(0.28, torque * 0.35 - 0.14)) - sw.angle) * Math.min(1, 5 * dt);
        }
    }
    for (const m of mushrooms) {
        m.bounce = Math.max(0, m.bounce - dt * 4);
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, m.x, m.y, m.w, m.h) && player.vy >= 0) {
            player.y = m.y - player.r; player.vy = m.vy; player.grounded = false; m.bounce = 1; playTone(380, 'sine', 0.2, 0.15, 760);
        }
    }

    for (const b of boxes) {
        let boxFloat = false;
        for (const w of winds) {
            if (!w.active || !isColorActive(w.color)) continue;
            if (rectOverlap(b.x, b.y, b.w, b.h, w.x, w.y, w.w, w.h)) {
                if (w.vy < 0) { b.vy = Math.max(-240, (b.vy || 0) - 1150 * dt); boxFloat = true; }
                if (w.vx !== 0) {
                    b.x += w.vx * 0.42 * dt;
                    for (const s of solids) {
                        if (rectOverlap(b.x, b.y + 4, b.w, b.h - 8, s.x, s.y, s.w, s.h)) {
                            b.x = w.vx > 0 ? s.x - b.w : s.x + s.w;
                        }
                    }
                }
            }
        }
        if (!boxFloat) b.vy = Math.min(600, (b.vy || 0) + 900 * dt);
        b.y += b.vy * dt;
        for (const m of mushrooms) if (rectOverlap(b.x, b.y, b.w, b.h, m.x, m.y, m.w, m.h) && b.vy >= 0) { b.y = m.y - b.h; b.vy = m.vy * 0.92; m.bounce = 1; }
        for (const s of solids) {
            if (rectOverlap(b.x + 2, b.y, b.w - 4, b.h, s.x, s.y, s.w, s.h) && b.vy >= 0 && b.y + b.h - b.vy * dt <= s.y + 12) {
                b.y = s.y - b.h; b.vy = 0;
            }
        }
    }
    for (const btn of buttons) {
        let active = btn.sticky && btn.pressed;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2 + 4, btn.x, btn.y - 8, btn.w, btn.h + 8)) active = true;
        for (const ms of mossPlatforms) if (!ms.broken && rectOverlap(ms.x, ms.y, ms.w, ms.h + 6, btn.x, btn.y - 8, btn.w, btn.h + 8)) active = true;
        for (const b of boxes) if (rectOverlap(b.x, b.y, b.w, b.h + 4, btn.x, btn.y - 8, btn.w, btn.h + 8)) active = true;
        if (active && !btn.pressed) playTone(520, 'sine', 0.15, 0.12, 740);
        btn.pressed = active;
        if (btn.toggleWind) { for (const w of winds) if (w.id === btn.id) w.active = !btn.pressed; }
        else for (const g of gates) if (g.id === btn.id) g.openH += ((btn.pressed ? g.h - 14 : 0) - g.openH) * Math.min(1, 6 * dt);
    }

    if (player.y > GAME_H + 80) hurtPlayer();
    for (const h of hazards) {
        const covered = ropeBridges.some(rb => rb.settled && rectOverlap(h.x + 4, h.y - 18, h.w - 8, 22, rb.x, rb.y, rb.w, rb.h));
        if (!covered && rectOverlap(player.x - player.r + 6, player.y - player.r + 6, player.r * 2 - 12, player.r * 2 - 6, h.x, h.y, h.w, h.h)) hurtPlayer();
    }
    for (const z of zombies) {
        if (z.dead) continue;
        if (z.turnCooldown > 0) z.turnCooldown = Math.max(0, z.turnCooldown - dt);
        const chase = Math.abs(player.y - (z.y - 24)) < 75 && Math.abs(player.x - z.x) < 340;
        if (chase && z.turnCooldown <= 0 && Math.abs(player.x - z.x) > 12) {
            z.dir = player.x < z.x ? -1 : 1;
        }
        const speed = (chase && z.turnCooldown <= 0) ? 85 : 52;
        const nextX = z.x + z.dir * speed * dt;
        const lookX = nextX + z.dir * 16;
        const hasFloor = solids.some(s => lookX >= s.x && lookX <= s.x + s.w && Math.abs(s.y - z.y) < 10) ||
            breakables.some(br => br.type === 'floor' && lookX >= br.x && lookX <= br.x + br.w && Math.abs(br.y - z.y) < 10);
        const hitWall = solids.some(s => rectOverlap(nextX - 14, z.y - 46, 28, 40, s.x, s.y, s.w, s.h)) ||
            breakables.some(br => br.type === 'wall' && rectOverlap(nextX - 14, z.y - 46, 28, 40, br.x, br.y, br.w, br.h));
        if (hasFloor && !hitWall && nextX > 40) {
            z.x = nextX;
        } else {
            z.dir *= -1;
            z.turnCooldown = 0.75;
        }
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, z.x - 18, z.y - 48, 36, 48)) {
            if (player.curled) { z.dead = true; if (player.vy > 0) player.vy = -300; playTone(190, 'square', 0.22, 0.16, 65); }
            else hurtPlayer();
        }
    }

    // Flug-Gegner (Wespen): nur durch gezielten Katapult-Schuss aus der Luft zu holen
    for (const w of wasps) {
        if (w.dead) continue;
        w.phase += dt * 2.0;
        w.x = w.baseX + Math.sin(w.phase) * w.rangeX;
        w.y = w.baseY + Math.sin(w.phase * 2) * 14;
        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, w.x - 20, w.y - 16, 40, 32)) {
            if (player.catapultFlight) {
                w.dead = true;
                player.vy = -300;
                playTone(250, 'square', 0.22, 0.16, 75);
            } else {
                hurtPlayer();
            }
        }
    }

    // Marienkäfer mit Schild: vorne durch Schild geschützt, nur von oben (Sprung/Glasboden) besiegbar
    for (const bt of beetles) {
        if (bt.dead) continue;
        const nextX = bt.x + bt.dir * 45 * dt;
        const lookX = nextX + bt.dir * 22;
        const hasFloor = solids.some(s => lookX >= s.x && lookX <= s.x + s.w && Math.abs(s.y - bt.y) < 10) ||
            breakables.some(br => br.type === 'floor' && lookX >= br.x && lookX <= br.x + br.w && Math.abs(br.y - bt.y) < 10);
        const hitWall = solids.some(s => rectOverlap(nextX - 18, bt.y - 36, 36, 32, s.x, s.y, s.w, s.h));
        if (hasFloor && !hitWall && nextX > 40) bt.x = nextX; else bt.dir *= -1;

        if (rectOverlap(player.x - player.r, player.y - player.r, player.r * 2, player.r * 2, bt.x - 24, bt.y - 40, 48, 40)) {
            const fromAbove = prevVy >= 0 && (player.y + player.r - prevVy * dt) <= bt.y - 24;
            if (fromAbove) {
                bt.dead = true;
                player.vy = -330;
                playTone(210, 'square', 0.22, 0.16, 65);
            } else if (player.curled) {
                const pushDir = player.x < bt.x ? -1 : 1;
                player.x = bt.x + pushDir * (24 + player.r + 2);
                player.vx = pushDir * 220;
                playTone(300, 'triangle', 0.12, 0.14, 180);
            } else {
                hurtPlayer();
            }
        }
    }

    if (player.x >= goalX) {
        playTone(440, 'triangle', 0.35, 0.18, 880);
        if (state.levelIndex + 1 >= MAX_LEVELS) { state.won = true; }
        else { state.levelIndex++; loadLevel(state.levelIndex, true); }
    }
    player.rot += (player.vx * dt) / player.r;
    state.camX += (Math.max(0, player.x - GAME_W * 0.42) - state.camX) * Math.min(1, 7 * dt);
}

loadLevel(0, true);
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt); render();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
