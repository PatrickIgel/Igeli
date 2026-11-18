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
    ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (player.curled) {
        ctx.rotate(player.rot);
        // Äußere Stachel-Ebene (Dunkelbraun #3d2f25)
        ctx.fillStyle = '#3d2f25';
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const ang = (i / 16) * Math.PI * 2;
            const x1 = Math.cos(ang - 0.19) * 18, y1 = Math.sin(ang - 0.19) * 18;
            if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
            ctx.lineTo(Math.cos(ang) * 30, Math.sin(ang) * 30);
            ctx.lineTo(Math.cos(ang + 0.19) * 18, Math.sin(ang + 0.19) * 18);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Mittlere Mottled-Pelz-Ebene (#806f60)
        ctx.save();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#2b2019'; ctx.fillStyle = '#806f60';
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const ang = ((i + 0.5) / 16) * Math.PI * 2;
            const x1 = Math.cos(ang - 0.19) * 15, y1 = Math.sin(ang - 0.19) * 15;
            if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
            ctx.lineTo(Math.cos(ang) * 24.5, Math.sin(ang) * 24.5);
            ctx.lineTo(Math.cos(ang + 0.19) * 15, Math.sin(ang + 0.19) * 15);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Innere Plüsch-Basis & cremefarbener Bauch (#b8a99a & #eedec5)
        ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fillStyle = '#b8a99a'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, Math.PI * 2); ctx.fillStyle = '#eedec5'; ctx.fill();
        ctx.strokeStyle = '#e5534b'; ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = '#20b8f9'; ctx.beginPath(); ctx.arc(0, 0, 11.5, Math.PI, Math.PI * 2); ctx.stroke();
    } else {
        ctx.scale(player.facing, 1);
        const walk = player.grounded && Math.abs(player.vx) > 15 ? Math.sin(performance.now() * 0.018) * 3.2 : 0;

        // Hilfsfunktion für kurze, fest am Körper sitzende Plüsch-Pfötchen
        const drawAttachedPaw = (cx, cy, fillCol) => {
            ctx.save();
            ctx.fillStyle = fillCol;
            ctx.strokeStyle = '#0d0f12';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.moveTo(cx - 3.3, cy - 3.2);
            ctx.quadraticCurveTo(cx - 3.9, cy - 0.8, cx - 4.1, cy + 1.5);
            ctx.quadraticCurveTo(cx - 3.6, cy + 3.9, cx + 0.9, cy + 4.0);
            ctx.quadraticCurveTo(cx + 4.3, cy + 3.7, cx + 4.7, cy + 1.1);
            ctx.quadraticCurveTo(cx + 3.4, cy - 1.1, cx + 2.9, cy - 3.2);
            ctx.bezierCurveTo(cx + 2.5, cy - 5.4, cx - 2.9, cy - 5.4, cx - 3.3, cy - 3.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Kleine braune Zehenstriche
            ctx.strokeStyle = '#4a2f1c';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(cx + 2.1, cy + 2.3); ctx.lineTo(cx + 3.8, cy + 1.9);
            ctx.moveTo(cx + 2.4, cy + 0.7); ctx.lineTo(cx + 4.1, cy + 0.4);
            ctx.stroke();
            ctx.restore();
        };

        // 1. Hintere Pfötchen (abgedunkeltes Creme #cbb292, fest am Bauch ansetzend)
        drawAttachedPaw(-10.0 - walk * 0.85, 19.3, '#cbb292');
        drawAttachedPaw(3.2 - walk * 0.85, 19.3, '#cbb292');

        // 2. Harmonischer, natürlicher Plüsch-Körper & Kopf (#eedec5, Originalgröße)
        const drawBodyPath = () => {
            ctx.beginPath();
            ctx.moveTo(-19.5, 11.8);
            ctx.bezierCurveTo(-14.5, 17.8, 1.5, 18.0, 11.2, 13.6);
            ctx.bezierCurveTo(16.0, 11.0, 21.5, 6.8, 25.2, 1.2);
            ctx.bezierCurveTo(26.2, -2.5, 21.0, -4.5, 15.8, -6.8);
            ctx.bezierCurveTo(11.5, -10.8, 6.5, -13.8, 0.5, -12.5);
            ctx.bezierCurveTo(-6.5, -10.5, -14.0, -3.0, -19.5, 11.8);
            ctx.closePath();
        };
        ctx.fillStyle = '#eedec5';
        drawBodyPath();
        ctx.fill();

        // Sanfte Bauch-Schattierung im Plüsch-Look
        ctx.save();
        drawBodyPath();
        ctx.clip();
        ctx.fillStyle = 'rgba(210, 184, 148, 0.42)';
        ctx.beginPath();
        ctx.ellipse(-2, 15.8, 20, 5.5, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawBodyPath();
        ctx.stroke();

        // Kleines Plüsch-Schwänzchen hinten
        ctx.fillStyle = '#eedec5';
        ctx.beginPath(); ctx.ellipse(-21.2, 10.4, 2.5, 1.9, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // 3. Abgerundetes, flauschiges Stachelkleid (3 Ebenen, wölbt sich über Rücken & Flanke)
        // Äußere Ebene: Dunkelbraun (#3d2f25)
        ctx.fillStyle = '#3d2f25';
        ctx.beginPath();
        ctx.moveTo(7.5, -12.8);
        for (const [sx, sy] of [
            [5.8, -17.6], [3.0, -15.0],
            [0.2, -20.8], [-2.8, -17.4],
            [-6.2, -23.2], [-9.2, -19.0],
            [-13.2, -23.5], [-15.0, -18.2],
            [-19.5, -20.8], [-19.8, -15.0],
            [-24.8, -15.8], [-23.2, -10.0],
            [-27.8, -8.2], [-24.6, -3.0],
            [-28.8, 1.0], [-24.2, 5.2],
            [-26.5, 10.2], [-20.8, 12.0],
            [-17.2, 13.8], [-12.5, 11.2],
            [-8.2, 13.0], [-4.0, 10.2],
            [0.2, 11.2], [2.5, 7.5],
            [1.2, 2.8], [2.8, -2.2],
            [2.4, -7.8], [5.2, -10.2]
        ]) ctx.lineTo(sx, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Mittlere Ebene: Mottled-Taupe-Pelz (#806f60)
        ctx.save();
        ctx.fillStyle = '#806f60';
        ctx.strokeStyle = '#2b2019';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(5.5, -11.8);
        for (const [sx, sy] of [
            [3.5, -15.8], [1.0, -13.2],
            [-1.8, -18.4], [-4.4, -15.0],
            [-7.8, -20.2], [-10.2, -16.0],
            [-14.0, -19.5], [-15.2, -14.8],
            [-19.2, -16.2], [-18.8, -11.2],
            [-23.0, -10.8], [-20.6, -6.2],
            [-24.2, -3.2], [-20.8, 1.0],
            [-23.0, 5.5], [-18.5, 7.5],
            [-15.5, 10.0], [-11.2, 7.8],
            [-7.4, 9.5], [-3.8, 7.0],
            [-0.6, 8.0], [0.8, 4.5],
            [-0.2, 0.2], [1.2, -4.0],
            [1.5, -8.0]
        ]) ctx.lineTo(sx, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Innere Ebene: Helle Plüsch-Spitzen (#b8a99a)
        ctx.fillStyle = '#b8a99a';
        ctx.strokeStyle = '#3d2f25';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(2.6, -10.2);
        for (const [sx, sy] of [
            [0.6, -13.4], [-1.6, -11.0],
            [-4.5, -15.0], [-6.8, -11.5],
            [-10.2, -14.8], [-12.0, -10.8],
            [-15.8, -11.8], [-15.8, -7.2],
            [-19.0, -5.8], [-16.6, -1.5],
            [-18.5, 2.5], [-14.8, 4.5],
            [-12.5, 7.0], [-9.0, 5.0],
            [-5.8, 6.2], [-3.2, 3.8],
            [-1.2, 4.2], [-1.6, 1.0],
            [-0.2, -1.2], [-1.2, -4.4],
            [0.4, -7.6]
        ]) ctx.lineTo(sx, sy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();

        // 4. Vordere Pfötchen (im Vordergrund, #eedec5, fest mit dem Bauch verbunden)
        drawAttachedPaw(-7.2 + walk, 19.5, '#eedec5');
        drawAttachedPaw(5.4 + walk, 19.5, '#eedec5');

        // Dezenter Polaritäts-Clip auf der Stirn (erhält die Farb-Spielmechanik)
        ctx.save(); ctx.translate(4.5, -13.5); ctx.rotate(0.32); ctx.lineWidth = 2.8;
        ctx.fillStyle = '#e5534b'; ctx.fillRect(-6.5, -2.6, 6.5, 4.5); ctx.strokeRect(-6.5, -2.6, 6.5, 4.5);
        ctx.fillStyle = '#20b8f9'; ctx.fillRect(0, -2.6, 6.5, 4.5); ctx.strokeRect(0, -2.6, 6.5, 4.5);
        ctx.restore();

        // 5. Rundes Plüsch-Ohr
        ctx.fillStyle = '#e3ceb0';
        ctx.beginPath(); ctx.ellipse(1.5, -8.8, 3.8, 4.4, -0.32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c99e82';
        ctx.beginPath(); ctx.ellipse(1.9, -8.6, 1.9, 2.4, -0.32, 0, Math.PI * 2); ctx.fill();

        // 6. Gesicht: Sanfter Augenring, Knopfauge, dunkelbraune Stupsnase & Lächeln
        ctx.fillStyle = 'rgba(216, 192, 158, 0.7)';
        ctx.beginPath(); ctx.ellipse(11.8, -4.2, 4.5, 3.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0d0f12';
        ctx.beginPath(); ctx.arc(12.2, -4.2, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(13.2, -5.4, 1.25, 0, Math.PI * 2); ctx.fill();

        // Dunkelbraune Stupsnase (#4a2f1c)
        ctx.fillStyle = '#4a2f1c';
        ctx.beginPath(); ctx.ellipse(25.0, -2.2, 3.7, 2.9, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8c664b';
        ctx.beginPath(); ctx.ellipse(25.8, -3.1, 1.1, 0.8, -0.3, 0, Math.PI * 2); ctx.fill();

        // Freundliches, sanftes Lächeln
        ctx.strokeStyle = '#3d2f25';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(15.6, 1.7);
        ctx.quadraticCurveTo(18.7, 3.4, 21.8, 1.7);
        ctx.stroke();
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
