function drawHedgehog() {
    ctx.save(); ctx.translate(player.x, player.y);
    if (player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0) ctx.globalAlpha = 0.45;
    if (player.aimState > 0) {
        const len = player.aimState === 1 ? 85 : 65 + player.slingshotCharge * 85;
        const tx = player.facing * Math.cos(player.aimAngle) * len, ty = -Math.sin(player.aimAngle) * len;
        ctx.strokeStyle = player.aimState === 2 ? '#22c55e' : '#ffeb3b'; ctx.fillStyle = '#e5534b'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (player.aimState === 2) {
            ctx.fillStyle = '#0d0f12'; ctx.fillRect(-34, -52, 68, 12);
            ctx.fillStyle = player.slingshotCharge > 0.7 ? '#ef4444' : '#22c55e';
            ctx.fillRect(-31, -49, 62 * player.slingshotCharge, 6);
        }
    }
    ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    if (player.curled) {
        ctx.rotate(player.rot);
        for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            ctx.fillStyle = i % 2 ? '#5c3a21' : '#3d2514';
            ctx.beginPath(); ctx.moveTo(Math.cos(ang - 0.22) * 17, Math.sin(ang - 0.22) * 17);
            ctx.lineTo(Math.cos(ang) * 31, Math.sin(ang) * 31); ctx.lineTo(Math.cos(ang + 0.22) * 17, Math.sin(ang + 0.22) * 17);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = '#7c5338'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = '#d9b38c'; ctx.fill();
        ctx.strokeStyle = '#e5534b'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = '#20b8f9'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, Math.PI * 2); ctx.stroke();
    } else {
        ctx.scale(player.facing, 1);
        const walk = player.grounded && Math.abs(player.vx) > 15 ? Math.sin(performance.now() * 0.018) * 5 : 0;
        ctx.fillStyle = '#b58860'; ctx.beginPath(); ctx.ellipse(-8 - walk, 19, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a2c18'; ctx.beginPath(); ctx.moveTo(-2, -20);
        for (const [sx, sy] of [[-14,-25],[-10,-15],[-24,-18],[-17,-8],[-28,-7],[-20,2],[-29,6],[-19,12],[-23,17],[-8,17]]) ctx.lineTo(sx, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6e472b'; ctx.beginPath(); ctx.arc(-5, -1, 18, Math.PI * 0.55, Math.PI * 1.9); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f3d5b5'; ctx.beginPath(); ctx.moveTo(-6, 16);
        ctx.quadraticCurveTo(10, 18, 17, 10); ctx.quadraticCurveTo(27, 4, 24, -1); ctx.quadraticCurveTo(16, -6, 9, -12); ctx.quadraticCurveTo(-5, -14, -6, 16);
        ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(1, -14); ctx.rotate(0.25);
        ctx.fillStyle = '#e5534b'; ctx.fillRect(-9, -4, 9, 6); ctx.strokeRect(-9, -4, 9, 6);
        ctx.fillStyle = '#20b8f9'; ctx.fillRect(0, -4, 9, 6); ctx.strokeRect(0, -4, 9, 6); ctx.restore();
        ctx.fillStyle = '#d9a77d'; ctx.beginPath(); ctx.arc(-2, -8, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f4978e'; ctx.beginPath(); ctx.arc(-2, -8, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d9a77d'; ctx.beginPath(); ctx.ellipse(7 + walk, 19, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.55)'; ctx.beginPath(); ctx.ellipse(11, 5, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0d0f12'; ctx.beginPath(); ctx.arc(11, -3, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12.2, -4.5, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(24, -1, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(25, -2.5, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(16, 4, 3.5, 0.2, Math.PI * 0.85); ctx.stroke();
    }
    ctx.restore();
}

function drawLadybug(bt) {
    ctx.save();
    ctx.translate(bt.x, bt.y);
    ctx.scale(bt.dir, 1);
    const walk = Math.sin(performance.now() * 0.016 + bt.x * 0.08) * 3.5;

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0d0f12';
    ctx.lineJoin = 'round';

    // Süße kleine Füßchen unten
    ctx.fillStyle = '#2b1d14';
    ctx.beginPath(); ctx.ellipse(-11 - walk, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0 + walk * 0.7, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10 - walk, -4, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Fühler am Kopf
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(11, -24); ctx.quadraticCurveTo(15, -35, 21, -35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -22); ctx.quadraticCurveTo(21, -31, 26, -30); ctx.stroke();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath(); ctx.arc(21, -35, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(26, -30, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Süßer runder Kopf vorne
    ctx.lineWidth = 4;
    ctx.fillStyle = '#3d2514';
    ctx.beginPath(); ctx.arc(11, -15, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Großes süßes Auge & rote Bäckchen (wie beim Igel)
    ctx.fillStyle = '#0d0f12';
    ctx.beginPath(); ctx.arc(14, -17, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(15.2, -18.3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
    ctx.beginPath(); ctx.ellipse(15, -11, 3.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // Leuchtender Marienkäfer-Panzer (Kuppel)
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(-3, -7, 21, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glanzlicht auf dem Panzer
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-3, -7, 15, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();

    // Schwarze Marienkäfer-Punkte
    ctx.fillStyle = '#0d0f12';
    ctx.beginPath(); ctx.arc(-14, -13, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-5, -20, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -13, 3.2, 0, Math.PI * 2); ctx.fill();

    // Goldener Schwachpunkt-Kristall oben auf dem Panzer
    ctx.strokeStyle = '#0d0f12';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-3, -30, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(-4.5, -31.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Ritter-Schild vorne (schützt gegen Frontalangriffe)
    ctx.save();
    ctx.translate(21, -17);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0d0f12';
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-7, -14);
    ctx.lineTo(7, -14);
    ctx.lineTo(7, 3);
    ctx.quadraticCurveTo(7, 13, 0, 17);
    ctx.quadraticCurveTo(-7, 13, -7, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Schild-Innenfläche & goldenes Emblem
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.lineTo(4, 2);
    ctx.quadraticCurveTo(4, 9, 0, 12);
    ctx.quadraticCurveTo(-4, 9, -4, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

function drawHeart(x, y, r, fill) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = fill; ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * 0.75);
    ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.7, -r * 1.1, 0, -r * 0.35);
    ctx.bezierCurveTo(r * 0.7, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.75);
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
