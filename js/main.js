// Single Paper - Main Application Controller & UI Event Dispatcher

import { playCrushSound, startTearSound, stopTearSound } from './audio.js';
import { ORIGAMI } from './origami.js';
import { PAPER_W, PAPER_H, screenToPaper, isInsidePaper, renderBg, renderPaper } from './paper.js';

// Elements
const bgCanvas    = document.getElementById('bg-canvas');
const paperCanvas = document.getElementById('paper-canvas');
const uiCanvas    = document.getElementById('ui-canvas');

const bgCtx    = bgCanvas.getContext('2d');
const paperCtx = paperCanvas.getContext('2d');
const uiCtx    = uiCanvas.getContext('2d');

// Offscreen buffer for all drawing strokes
const drawCanvas = document.createElement('canvas');
drawCanvas.width  = PAPER_W;
drawCanvas.height = PAPER_H;
const drawCtx = drawCanvas.getContext('2d');

// Offscreen buffer for torn holes
const tearCanvas = document.createElement('canvas');
tearCanvas.width  = PAPER_W;
tearCanvas.height = PAPER_H;
const tearCtx = tearCanvas.getContext('2d');

// Application State
export const state = {
    tx: 0,
    ty: 0,
    scale: 1,
    rot: 0,
    flipped: false,

    tool: 'pen',
    color: '#000000',
    size: 5,

    crushLevel: 0,
    paperColor: '#ffffff',

    isInteracting: false,
    panStart: null,
    pinching: false,
    pinchDist: 0,
    pinchScale0: 1,
    pinchTx0: 0,
    pinchTy0: 0,
    pinchMidX: 0,
    pinchMidY: 0,
};

export const foldLines = [];

// Centering
export function centerPaper() {
    const availW = window.innerWidth * 0.82;
    const availH = (window.innerHeight - 130) * 0.88;
    state.scale = Math.min(availW / PAPER_W, availH / PAPER_H, 1.1);
    state.tx = (window.innerWidth - (PAPER_W * state.scale)) / 2;
    state.ty = (window.innerHeight - (PAPER_H * state.scale)) / 2 + 10;
    state.rot = 0;
}

export function resize() {
    [bgCanvas, paperCanvas, uiCanvas].forEach(c => {
        c.width  = window.innerWidth;
        c.height = window.innerHeight;
    });
    renderBg(bgCanvas, bgCtx);
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
}

window.addEventListener('resize', () => {
    centerPaper();
    resize();
});

// Toast
let toastTimer = null;
export function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Undo / Redo
const undoStack = [];
const redoStack = [];

export function saveSnapshot() {
    undoStack.push(drawCanvas.toDataURL());
    if (undoStack.length > 25) undoStack.shift();
    redoStack.length = 0;
}

export function undo() {
    if (!undoStack.length) return;
    redoStack.push(drawCanvas.toDataURL());
    const img = new Image();
    img.onload = () => {
        drawCtx.clearRect(0, 0, PAPER_W, PAPER_H);
        drawCtx.drawImage(img, 0, 0);
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    };
    img.src = undoStack.pop();
    toast('Undo ↩️');
}

export function redo() {
    if (!redoStack.length) return;
    undoStack.push(drawCanvas.toDataURL());
    const img = new Image();
    img.onload = () => {
        drawCtx.clearRect(0, 0, PAPER_W, PAPER_H);
        drawCtx.drawImage(img, 0, 0);
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    };
    img.src = redoStack.pop();
    toast('Redo ↪️');
}

// Drawing Engine
let isStroking = false;

function applyBrush() {
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.strokeStyle = state.color;
    drawCtx.fillStyle   = state.color;
    drawCtx.lineWidth   = state.size;
    drawCtx.lineCap     = 'round';
    drawCtx.lineJoin    = 'round';

    if (state.tool === 'pencil') {
        drawCtx.globalAlpha = 0.6;
        drawCtx.lineWidth   = Math.max(1, state.size * 0.75);
    } else if (state.tool === 'marker') {
        drawCtx.globalAlpha = 0.4;
        drawCtx.lineWidth   = state.size * 2.8;
    } else {
        drawCtx.globalAlpha = 1;
    }
}

function startStroke(sx, sy) {
    const pt = screenToPaper(sx, sy, state);
    if (!isInsidePaper(pt.x, pt.y)) return;

    saveSnapshot();
    isStroking = true;

    if (state.tool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.beginPath();
        drawCtx.arc(pt.x, pt.y, state.size * 2.5, 0, Math.PI * 2);
        drawCtx.fill();
    } else {
        applyBrush();
        drawCtx.beginPath();
        drawCtx.moveTo(pt.x, pt.y);
        drawCtx.lineTo(pt.x + 0.1, pt.y + 0.1);
        drawCtx.stroke();
    }
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
}

function moveStroke(sx, sy) {
    if (!isStroking) return;
    const pt = screenToPaper(sx, sy, state);

    if (state.tool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
        drawCtx.beginPath();
        drawCtx.arc(pt.x, pt.y, state.size * 2.5, 0, Math.PI * 2);
        drawCtx.fill();
    } else {
        drawCtx.lineTo(pt.x, pt.y);
        drawCtx.stroke();
    }
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
}

function endStroke() {
    isStroking = false;
}

// Tearing Engine
let isTearing = false;
let lastTearPt = null;

function startTear(sx, sy) {
    const pt = screenToPaper(sx, sy, state);
    if (!isInsidePaper(pt.x, pt.y)) return;

    isTearing = true;
    lastTearPt = pt;
    tearCtx.fillStyle = '#000000';
    tearCtx.strokeStyle = '#000000';
    tearCtx.lineWidth = 18;
    tearCtx.lineCap = 'round';
    tearCtx.beginPath();
    tearCtx.moveTo(pt.x, pt.y);
    startTearSound();
}

function moveTear(sx, sy) {
    if (!isTearing || !lastTearPt) return;
    const pt = screenToPaper(sx, sy, state);

    const nx = pt.x + (Math.random() - 0.5) * 12;
    const ny = pt.y + (Math.random() - 0.5) * 12;

    tearCtx.lineTo(nx, ny);
    tearCtx.stroke();
    lastTearPt = pt;
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
}

function endTear() {
    if (!isTearing) return;
    isTearing = false;
    lastTearPt = null;
    stopTearSound();
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    toast('Paper torn! ✂️');
}

// Pointer Events
const activePointers = new Map();

uiCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    uiCanvas.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
        endStroke();
        endTear();
        const pts = [...activePointers.values()];
        state.pinchDist   = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        state.pinchMidX   = (pts[0].x + pts[1].x) / 2;
        state.pinchMidY   = (pts[0].y + pts[1].y) / 2;
        state.pinchScale0 = state.scale;
        state.pinchTx0    = state.tx;
        state.pinchTy0    = state.ty;
        state.pinching    = true;
        return;
    }

    if (state.tool === 'pan') {
        state.panStart = { sx: e.clientX, sy: e.clientY, tx: state.tx, ty: state.ty };
    } else if (state.tool === 'tear') {
        startTear(e.clientX, e.clientY);
    } else if (['pen', 'pencil', 'marker', 'eraser'].includes(state.tool)) {
        startStroke(e.clientX, e.clientY);
    }
}, { passive: false });

uiCanvas.addEventListener('pointermove', e => {
    e.preventDefault();
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (state.pinching && activePointers.size === 2) {
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const ratio = dist / (state.pinchDist || 1);
        const newScale = Math.max(0.25, Math.min(3.5, state.pinchScale0 * ratio));

        state.tx = midX - (state.pinchMidX - state.pinchTx0) * ratio - (PAPER_W * newScale) / 2 + (PAPER_W * state.pinchScale0) / 2;
        state.ty = midY - (state.pinchMidY - state.pinchTy0) * ratio - (PAPER_H * newScale) / 2 + (PAPER_H * state.pinchScale0) / 2;
        state.scale = newScale;
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
        return;
    }

    if (state.tool === 'pan' && state.panStart) {
        state.tx = state.panStart.tx + (e.clientX - state.panStart.sx);
        state.ty = state.panStart.ty + (e.clientY - state.panStart.sy);
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    } else if (state.tool === 'tear') {
        moveTear(e.clientX, e.clientY);
    } else if (['pen', 'pencil', 'marker', 'eraser'].includes(state.tool)) {
        moveStroke(e.clientX, e.clientY);
    }
}, { passive: false });

const handlePointerUp = e => {
    e.preventDefault();
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) state.pinching = false;
    if (activePointers.size === 0) {
        state.panStart = null;
        endStroke();
        endTear();
    }
};

uiCanvas.addEventListener('pointerup',     handlePointerUp, { passive: false });
uiCanvas.addEventListener('pointercancel', handlePointerUp, { passive: false });

uiCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.max(0.25, Math.min(3.5, state.scale * Math.exp(delta)));
    const ratio = newScale / state.scale;
    state.tx = e.clientX - (e.clientX - state.tx) * ratio;
    state.ty = e.clientY - (e.clientY - state.ty) * ratio;
    state.scale = newScale;
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
}, { passive: false });

// Toolbar Event Bindings
const toolMap = {
    'tool-pen': 'pen',
    'tool-pencil': 'pencil',
    'tool-marker': 'marker',
    'tool-eraser': 'eraser',
    'tool-tear': 'tear',
    'tool-pan': 'pan'
};

export function selectTool(toolName, btnId) {
    state.tool = toolName;
    document.querySelectorAll('.tbtn[id^="tool-"]').forEach(b => b.classList.remove('active'));
    if (btnId) document.getElementById(btnId).classList.add('active');

    if (toolName === 'pan') uiCanvas.style.cursor = 'grab';
    else if (toolName === 'eraser') uiCanvas.style.cursor = 'cell';
    else uiCanvas.style.cursor = 'crosshair';

    closePalette();
}

Object.entries(toolMap).forEach(([id, tool]) => {
    document.getElementById(id).addEventListener('click', () => selectTool(tool, id));
});

document.getElementById('btn-flip').addEventListener('click', () => {
    state.flipped = !state.flipped;
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    toast(state.flipped ? 'Flipped to Back Side 🔄' : 'Flipped to Front Side 🔄');
});

document.getElementById('btn-crush').addEventListener('click', () => {
    if (state.crushLevel >= 5) {
        toast('Already fully crumpled! 👊');
        return;
    }
    state.crushLevel++;
    playCrushSound();
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    const msgs = ['Crunch! 👊', 'More crumples! 👊', 'So crushed! 🗑', 'Completely crumpled! 😂', 'Maximum crush! 👊'];
    toast(msgs[state.crushLevel - 1]);
});

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset the paper sheet? All drawings & tears will be cleared.')) return;
    drawCtx.clearRect(0, 0, PAPER_W, PAPER_H);
    tearCtx.clearRect(0, 0, PAPER_W, PAPER_H);
    state.crushLevel = 0;
    state.flipped    = false;
    state.paperColor = '#ffffff';
    foldLines.length = 0;
    undoStack.length = 0;
    redoStack.length = 0;

    document.querySelectorAll('.paper-swatch').forEach(b => b.classList.remove('active'));
    const defSwatch = document.querySelector('.paper-swatch[data-color="#ffffff"]');
    if (defSwatch) defSwatch.classList.add('active');

    centerPaper();
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    toast('Paper reset! 📄✨');
});

document.getElementById('btn-save').addEventListener('click', () => {
    const tmp = document.createElement('canvas');
    tmp.width = PAPER_W;
    tmp.height = PAPER_H;
    const tc = tmp.getContext('2d');

    tc.fillStyle = state.paperColor;
    tc.fillRect(0, 0, PAPER_W, PAPER_H);
    tc.drawImage(drawCanvas, 0, 0);

    tc.globalCompositeOperation = 'destination-out';
    tc.drawImage(tearCanvas, 0, 0);
    tc.globalCompositeOperation = 'source-over';

    const link = document.createElement('a');
    link.download = 'SinglePaper_Artwork.png';
    link.href = tmp.toDataURL('image/png');
    link.click();
    toast('Downloaded artwork! 💾🎉');
});

// Paper Color Selector
document.querySelectorAll('.paper-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.paper-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.paperColor = btn.dataset.color;
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
        toast('Paper color updated! 📄');
    });
});

document.getElementById('custom-paper-color').addEventListener('input', e => {
    document.querySelectorAll('.paper-swatch').forEach(b => b.classList.remove('active'));
    state.paperColor = e.target.value;
    renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
});

// Palette
const PALETTE_COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
    '#78716c', '#64748b', '#1e293b', '#b91c1c', '#047857', '#1d4ed8'
];

const palette = document.getElementById('palette');
PALETTE_COLORS.forEach(c => {
    const btn = document.createElement('div');
    btn.className = 'pal-color';
    btn.style.background = c;
    if (c === '#ffffff') btn.style.border = '1px solid #999';
    btn.addEventListener('click', () => {
        state.color = c;
        updateColorDot();
        document.getElementById('brush-color').value = c;
        if (!['pen', 'pencil', 'marker'].includes(state.tool)) {
            selectTool('pen', 'tool-pen');
        }
        closePalette();
    });
    palette.appendChild(btn);
});

function closePalette() { palette.classList.remove('open'); }
function updateColorDot() { document.getElementById('color-dot').style.background = state.color; }

document.getElementById('btn-palette').addEventListener('click', e => {
    e.stopPropagation();
    palette.classList.toggle('open');
});
document.addEventListener('click', () => closePalette());
palette.addEventListener('click', e => e.stopPropagation());

document.getElementById('brush-color').addEventListener('input', e => {
    state.color = e.target.value;
    updateColorDot();
    if (!['pen', 'pencil', 'marker'].includes(state.tool)) {
        selectTool('pen', 'tool-pen');
    }
});
document.getElementById('color-picker-wrap').addEventListener('click', () => {
    document.getElementById('brush-color').click();
});
document.getElementById('brush-size').addEventListener('input', e => {
    state.size = parseInt(e.target.value);
});

// Origami UI & Tutorials
const oriList = document.getElementById('ori-list');
ORIGAMI.forEach((model, idx) => {
    const card = document.createElement('div');
    card.className = 'ori-card';
    card.innerHTML = `<div class="badge ${model.level}">${model.level.toUpperCase()}</div><h3>${model.name}</h3><p>${model.steps.length} folding steps</p>`;
    card.addEventListener('click', () => openTutorial(idx));
    oriList.appendChild(card);
});

document.getElementById('btn-origami').addEventListener('click', () => {
    document.getElementById('origami-panel').classList.toggle('open');
});

let tutModel = null;
let tutStep  = 0;
const tutCanvas = document.getElementById('tut-canvas');
const tutCtx    = tutCanvas.getContext('2d');

function openTutorial(idx) {
    tutModel = ORIGAMI[idx];
    tutStep  = 0;
    document.getElementById('origami-panel').classList.remove('open');
    document.getElementById('tut-overlay').classList.add('open');
    renderTutStep();
}

function renderTutStep() {
    if (!tutModel) return;
    const step = tutModel.steps[tutStep];
    const total = tutModel.steps.length;

    document.getElementById('tut-title').textContent = tutModel.name;
    document.getElementById('tut-progress').textContent = `STEP ${tutStep + 1} OF ${total}`;
    document.getElementById('tut-instruction').textContent = step.text;
    document.getElementById('tut-prev').disabled = (tutStep === 0);
    document.getElementById('tut-next').textContent = (tutStep === total - 1) ? '🎉 Complete Fold' : 'Next Step →';

    const wrap = document.getElementById('tut-canvas-wrap');
    tutCanvas.width  = wrap.clientWidth  || 420;
    tutCanvas.height = wrap.clientHeight || 300;
    const w = tutCanvas.width;
    const h = tutCanvas.height;

    tutCtx.clearRect(0, 0, w, h);
    tutCtx.fillStyle = '#f8fafc';
    tutCtx.fillRect(0, 0, w, h);
    step.draw(tutCtx, w, h);

    if (tutStep > 0) {
        const hw = PAPER_W / 2;
        const hh = PAPER_H / 2;
        const a  = (tutStep / total) * Math.PI;
        foldLines.push({
            x1: hw + Math.cos(a) * hw * 0.9,
            y1: hh + Math.sin(a) * hh * 0.9,
            x2: hw - Math.cos(a) * hw * 0.9,
            y2: hh - Math.sin(a) * hh * 0.9
        });
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    }
}

document.getElementById('tut-next').addEventListener('click', () => {
    if (!tutModel) return;
    if (tutStep < tutModel.steps.length - 1) {
        tutStep++;
        renderTutStep();
    } else {
        document.getElementById('tut-overlay').classList.remove('open');
        toast('Origami folding complete! 🦢🎉');
        tutModel = null;
    }
});
document.getElementById('tut-prev').addEventListener('click', () => {
    if (tutStep > 0) {
        tutStep--;
        foldLines.pop();
        renderTutStep();
        renderPaper(paperCanvas, paperCtx, drawCanvas, tearCanvas, state, foldLines);
    }
});
document.getElementById('tut-close').addEventListener('click', () => {
    document.getElementById('tut-overlay').classList.remove('open');
    tutModel = null;
});

// Keyboard Shortcuts
window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.getElementById('btn-save').click();
        return;
    }

    const k = e.key.toLowerCase();
    if (k === 'p') selectTool('pen', 'tool-pen');
    else if (k === 'b') selectTool('pencil', 'tool-pencil');
    else if (k === 'm') selectTool('marker', 'tool-marker');
    else if (k === 'e') selectTool('eraser', 'tool-eraser');
    else if (k === 't') selectTool('tear', 'tool-tear');
    else if (k === 'h' || k === 'v' || k === ' ') selectTool('pan', 'tool-pan');
    else if (k === 'c') document.getElementById('btn-crush').click();
    else if (k === 'f') document.getElementById('btn-flip').click();
});

// App Initialization
updateColorDot();
centerPaper();
resize();
selectTool('pen', 'tool-pen');
