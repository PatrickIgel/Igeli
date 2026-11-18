// Interaktive Mechaniken, Gegner und Zielflagge
function renderEntities() {
    // Magnet-Blöcke zeichnen
    for (const mg of magnetBlocks) {
        const act = isColorActive(mg.color);
        const baseCol = mg.color === 'red' ? '#e5534b' : '#20b8f9';
        const ringAlpha = act ? 0.34 : 0.14;
        ctx.save();
        ctx.strokeStyle = mg.color === 'red' ? `rgba(229, 83, 75, ${ringAlpha})` : `rgba(32, 184, 249, ${ringAlpha})`;
        ctx.lineWidth = act ? 3 : 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(mg.x, mg.y, mg.range, 0, Math.PI * 2);
        ctx.stroke();
        if (act) {
            const pulseR = mg.r + ((performance.now() * 0.08) % (mg.range - mg.r));
            const invR = mg.range - (pulseR - mg.r);
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(mg.x, mg.y, invR, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        ctx.fillStyle = '#374151';
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(mg.x, mg.y, mg.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = act ? baseCol : 'rgba(148, 163, 184, 0.45)';
        ctx.beginPath();
        ctx.arc(mg.x, mg.y, mg.r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = act ? '#ffffff' : baseCol;
        ctx.beginPath();
        ctx.arc(mg.x, mg.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Farb-Schleusen / Laser-Ranken zeichnen
    for (const cl of colorLasers) {
        const open = isColorActive(cl.color);
        const baseCol = cl.color === 'red' ? '#e5534b' : '#20b8f9';
        const glowCol = cl.color === 'red' ? 'rgba(229, 83, 75, 0.35)' : 'rgba(32, 184, 249, 0.35)';
        ctx.save();
        ctx.fillStyle = '#374151';
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        ctx.fillRect(cl.x - 4, cl.y, cl.w + 8, 12);
        ctx.strokeRect(cl.x - 4, cl.y, cl.w + 8, 12);
        ctx.fillRect(cl.x - 4, cl.y + cl.h - 12, cl.w + 8, 12);
        ctx.strokeRect(cl.x - 4, cl.y + cl.h - 12, cl.w + 8, 12);

        if (!open) {
            ctx.fillStyle = glowCol;
            ctx.fillRect(cl.x - 4, cl.y + 12, cl.w + 8, cl.h - 24);
            ctx.fillStyle = baseCol;
            ctx.fillRect(cl.x + 4, cl.y + 12, cl.w - 8, cl.h - 24);
            const waveOff = Math.sin(performance.now() * 0.015) * 3;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cl.x + cl.w / 2, cl.y + 14);
            for (let y = cl.y + 24; y < cl.y + cl.h - 14; y += 16) {
                ctx.lineTo(cl.x + cl.w / 2 + ((y / 16) % 2 === 0 ? waveOff : -waveOff), y);
            }
            ctx.stroke();
        } else {
            ctx.strokeStyle = baseCol;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 8]);
            ctx.strokeRect(cl.x + 4, cl.y + 12, cl.w - 8, cl.h - 24);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    // Zerbröselnde Moos-Plattformen zeichnen
    for (const ms of mossPlatforms) {
        if (ms.broken) continue;
        const shakeX = (ms.triggered && !ms.falling) ? Math.sin(performance.now() * 0.06) * (2 + ms.timer * 2.5) : 0;
        ctx.save();
        ctx.translate(shakeX, 0);
        ctx.fillStyle = '#6b4423';
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        ctx.fillRect(ms.x, ms.y, ms.w, ms.h);
        ctx.strokeRect(ms.x, ms.y, ms.w, ms.h);
        ctx.fillStyle = ms.triggered ? '#a3e635' : '#4d7c0f';
        ctx.fillRect(ms.x - 2, ms.y, ms.w + 4, 9);
        ctx.strokeRect(ms.x - 2, ms.y, ms.w + 4, 9);
        if (ms.triggered) {
            ctx.beginPath();
            ctx.moveTo(ms.x + ms.w * 0.35, ms.y + 4);
            ctx.lineTo(ms.x + ms.w * 0.42, ms.y + ms.h);
            ctx.moveTo(ms.x + ms.w * 0.68, ms.y + 2);
            ctx.lineTo(ms.x + ms.w * 0.62, ms.y + ms.h);
            ctx.stroke();
        }
        ctx.restore();
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


    for (const sw of seesaws) {
        const locked = sw.lockColor && isColorActive(sw.lockColor);
        const lockCol = sw.lockColor === 'red' ? '#e5534b' : '#20b8f9';
        ctx.fillStyle = '#4b5563'; ctx.beginPath(); ctx.moveTo(sw.cx - 18, sw.cy + 36); ctx.lineTo(sw.cx, sw.cy); ctx.lineTo(sw.cx + 18, sw.cy + 36); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(sw.cx, sw.cy); ctx.rotate(sw.angle);
        ctx.fillStyle = locked ? lockCol : '#d97706';
        ctx.fillRect(-sw.halfW, -8, sw.halfW * 2, 16); ctx.strokeRect(-sw.halfW, -8, sw.halfW * 2, 16);
        if (sw.lockColor) {
            ctx.fillStyle = locked ? '#ffffff' : lockCol;
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }
    for (const m of mushrooms) {
        const sq = m.bounce * 8;
        const cx = m.x + m.w / 2;
        const capY = m.y + 14 + sq;
        const baseY = m.y + m.h + 2;
        const rx = m.w / 2;
        const ry = 17 - sq * 0.25;

        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0d0f12';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Leicht bauchiger Pilzstiel mit Schattierung
        const drawStem = () => {
            ctx.beginPath();
            ctx.moveTo(cx - 12, capY - 2);
            ctx.quadraticCurveTo(cx - 15, (capY + baseY) * 0.52, cx - 14, baseY);
            ctx.lineTo(cx + 14, baseY);
            ctx.quadraticCurveTo(cx + 15, (capY + baseY) * 0.52, cx + 12, capY - 2);
            ctx.closePath();
        };
        ctx.fillStyle = '#f3d5b5';
        drawStem();
        ctx.fill();

        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#e2bc96';
        ctx.fillRect(cx + 3, capY - 4, 16, baseY - capY + 8);
        ctx.fillStyle = '#c89d74';
        ctx.fillRect(cx - 18, capY - 2, 36, 7);
        ctx.restore();

        drawStem();
        ctx.stroke();

        // Weiße Pilz-Manschette (Ring am Stiel)
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.ellipse(cx, capY + 7 - sq * 0.25, 16, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Lamellen-Unterseite unter dem Hut
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(cx, capY, rx - 3, 5, 0, 0, Math.PI);
        ctx.fill();
        ctx.stroke();

        // Fliegenpilz-Hut (leuchtend rot mit Schattierung & weißen Punkten)
        const drawCap = () => {
            ctx.beginPath();
            ctx.ellipse(cx, capY, rx, ry, 0, Math.PI, Math.PI * 2);
            ctx.quadraticCurveTo(cx, capY + 3.5, cx - rx, capY);
            ctx.closePath();
        };
        ctx.fillStyle = '#e5534b';
        drawCap();
        ctx.fill();

        ctx.save();
        ctx.clip();
        // Dunklerer Rand unten am Hut
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(m.x - 4, capY - 4, m.w + 8, 10);

        // Weiße Fliegenpilz-Punkte
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(cx - 21, capY - 5.5, 4.2, 3.2, -0.25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 9, capY - 11.5, 4.8, 3.6, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 5, capY - 7, 5.2, 3.8, 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 19, capY - 10.5, 4.0, 3.0, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 25, capY - 4, 3.4, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();

        // Feiner Glanzstreifen oben links
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, capY, rx - 7, Math.PI * 1.16, Math.PI * 1.48);
        ctx.stroke();
        ctx.restore();

        // Hut-Kontur
        ctx.strokeStyle = '#0d0f12';
        ctx.lineWidth = 4;
        drawCap();
        ctx.stroke();
        ctx.restore();
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
}
