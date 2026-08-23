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

    // 2. Rotate & Flip around Paper Center
    const cx = PAPER_W / 2;
    const cy = PAPER_H / 2;
    paperCtx.translate(cx, cy);
    paperCtx.rotate(state.rot);
    if (state.flipped) paperCtx.scale(-1, 1);
    paperCtx.translate(-cx, -cy);

    // 3. Drop Shadow for Physical Sheet Depth
    paperCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    paperCtx.shadowBlur  = 35;
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

    // 5. Subtle Ruled Margin Lines
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

    // 10. Outer Crisp Paper Border
    paperCtx.strokeStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    paperCtx.lineWidth = 1;
    paperCtx.strokeRect(0, 0, PAPER_W, PAPER_H);

    paperCtx.restore();
}

function drawCrushCreases(ctx, state) {
    ctx.save();
    ctx.globalAlpha = state.crushLevel * 0.14;
    const isDarkPaper = (state.paperColor === '#1e293b');
    for (let i = 0; i < state.crushLevel * 20; i++) {
        const x = Math.sin(i * 123.4 + state.crushLevel) * (PAPER_W * 0.45) + (PAPER_W / 2);
        const y = Math.cos(i * 91.2  + state.crushLevel) * (PAPER_H * 0.45) + (PAPER_H / 2);
        const len = 35 + Math.random() * 70;
        const ang = Math.random() * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.strokeStyle = isDarkPaper ? '#ffffff' : '#000000';
        ctx.lineWidth = 0.8 + Math.random() * 1.2;
        ctx.stroke();
    }
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
