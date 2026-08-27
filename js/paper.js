// Core Paper Physics, Canvas Render Engine & Coordinate Transformations

export const PAPER_W = 620;
export const PAPER_H = 877;

export function screenToPaper(sx, sy, state) {
    let x = (sx - state.tx) / state.scale;
    let y = (sy - state.ty) / state.scale;

    const cx = PAPER_W / 2;
    const cy = PAPER_H / 2;
    x -= cx;
    y -= cy;

    if (state.flipped) x = -x;

    const cos = Math.cos(-state.rot);
    const sin = Math.sin(-state.rot);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;

    return { x: rx + cx, y: ry + cy };
}

export function isInsidePaper(x, y) {
    return x >= 0 && x <= PAPER_W && y >= 0 && y <= PAPER_H;
}

export function renderBg(bgCanvas, bgCtx) {
    const W = bgCanvas.width;
    const H = bgCanvas.height;
    bgCtx.clearRect(0, 0, W, H);

    const grad = bgCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   '#2c221c');
    grad.addColorStop(0.5, '#231a15');
    grad.addColorStop(1,   '#19120e');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, W, H);

    const plankH = 130;
    for (let y = 0; y < H; y += plankH) {
        bgCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        bgCtx.lineWidth = 2;
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(W, y);
        bgCtx.stroke();

        bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        bgCtx.moveTo(0, y + 2);
        bgCtx.lineTo(W, y + 2);
        bgCtx.stroke();
    }

    const vig = bgCtx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    bgCtx.fillStyle = vig;
    bgCtx.fillRect(0, 0, W, H);
}

export function renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines) {
    const W = paperCanvas.width;
    const H = paperCanvas.height;
    paperCtx.clearRect(0, 0, W, H);

    paperCtx.save();

    // 1. Position and Scale Paper
    paperCtx.translate(state.tx, state.ty);
    paperCtx.scale(state.scale, state.scale);

    // 2. Rotate, Flip & Crumple Scale around Paper Center
    const cx = PAPER_W / 2;
    const cy = PAPER_H / 2;
    paperCtx.translate(cx, cy);
    paperCtx.rotate(state.rot);
    if (state.flipped) paperCtx.scale(-1, 1);

    // Apply physical scale reduction & slight tilt angle when crushed
    if (state.crushLevel > 0) {
        const crushScale = 1 - state.crushLevel * 0.045;
        const crushRot   = (state.crushLevel % 2 === 1 ? 1 : -1) * state.crushLevel * 0.015;
        paperCtx.scale(crushScale, crushScale);
        paperCtx.rotate(crushRot);
    }
    paperCtx.translate(-cx, -cy);

    // 3. Drop Shadow for Physical Sheet Depth
    paperCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    paperCtx.shadowBlur  = 35 + state.crushLevel * 5;
    paperCtx.shadowOffsetX = 6;
    paperCtx.shadowOffsetY = 14;

    // 4. Fill Selected Paper Color
    paperCtx.fillStyle = state.paperColor;
    paperCtx.fillRect(0, 0, PAPER_W, PAPER_H);

    // Reset shadow so it doesn't affect drawing layers
    paperCtx.shadowColor = 'transparent';
    paperCtx.shadowBlur  = 0;
    paperCtx.shadowOffsetX = 0;
    paperCtx.shadowOffsetY = 0;

    // 5. Subtle Ruled Margin & Grid Lines
    paperCtx.save();
    const isDarkPaper = (state.paperColor === '#1e293b');
    paperCtx.strokeStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.035)';
    paperCtx.lineWidth = 1;
    for (let y = 40; y < PAPER_H - 20; y += 32) {
        paperCtx.beginPath();
        paperCtx.moveTo(25, y);
        paperCtx.lineTo(PAPER_W - 25, y);
        paperCtx.stroke();
    }
    if (state.showGrid) {
        for (let x = 40; x < PAPER_W - 20; x += 32) {
            paperCtx.beginPath();
            paperCtx.moveTo(x, 25);
            paperCtx.lineTo(x, PAPER_H - 25);
            paperCtx.stroke();
        }
    }
    paperCtx.restore();

    // 6. Draw User Artwork Layer
    paperCtx.drawImage(drawCanvas, 0, 0);

    // 7. Crush / Crease Simulation
    if (state.crushLevel > 0) {
        drawCrushCreases(paperCtx, state);
    }

    // 8. Fold Lines (From Origami)
    drawFoldLines(paperCtx, state, foldLines);

    // 9. Tear Punch-Out (Erases torn parts so desk shows through)
    paperCtx.globalCompositeOperation = 'destination-out';
    paperCtx.drawImage(tearCanvas, 0, 0);
    paperCtx.globalCompositeOperation = 'source-over';

    // 10. Outer Crisp Paper Border & Subtle Corner Curl
    paperCtx.strokeStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    paperCtx.lineWidth = 1;
    paperCtx.strokeRect(0, 0, PAPER_W, PAPER_H);

    // Subtle realistic top-right paper corner dog-ear shadow
    paperCtx.save();
    paperCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    paperCtx.beginPath();
    paperCtx.moveTo(PAPER_W - 20, 0);
    paperCtx.lineTo(PAPER_W, 20);
    paperCtx.lineTo(PAPER_W - 20, 20);
    paperCtx.closePath();
    paperCtx.fill();
    paperCtx.restore();

    paperCtx.restore();
}

function pseudoRandom(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function drawCrushCreases(ctx, state) {
    ctx.save();
    const isDarkPaper = (state.paperColor === '#1e293b');
    const level = state.crushLevel;

    // Deterministic 3D crease line generation
    const totalLines = level * 28;
    for (let i = 0; i < totalLines; i++) {
        const r1 = pseudoRandom(i * 1.3 + level * 10.1);
        const r2 = pseudoRandom(i * 2.7 + level * 20.2);
        const r3 = pseudoRandom(i * 3.1 + level * 30.3);
        const r4 = pseudoRandom(i * 4.9 + level * 40.4);

        const x1 = r1 * (PAPER_W - 60) + 30;
        const y1 = r2 * (PAPER_H - 60) + 30;
        const len = 35 + r3 * 110;
        const ang = r4 * Math.PI * 2;
        const x2 = x1 + Math.cos(ang) * len;
        const y2 = y1 + Math.sin(ang) * len;

        // Dark Crease Shadow
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.2 + r3 * 1.5;
        ctx.stroke();

        // Parallel Highlight Line for 3D depth
        ctx.beginPath();
        ctx.moveTo(x1 + 1.5, y1 + 1.5);
        ctx.lineTo(x2 + 1.5, y2 + 1.5);
        ctx.strokeStyle = isDarkPaper ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
    }

    // Heavy central crumple shadow gradient
    const cx = PAPER_W / 2;
    const cy = PAPER_H / 2;
    const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, PAPER_W * 0.45);
    grad.addColorStop(0, `rgba(0, 0, 0, ${level * 0.07})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PAPER_W, PAPER_H);

    ctx.restore();
}

function drawFoldLines(ctx, state, foldLines) {
    if (!foldLines || !foldLines.length) return;
    ctx.save();
    const isDarkPaper = (state.paperColor === '#1e293b');
    ctx.strokeStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    foldLines.forEach(f => {
        ctx.beginPath();
        ctx.moveTo(f.x1, f.y1);
        ctx.lineTo(f.x2, f.y2);
        ctx.stroke();
    });
    ctx.restore();
}
