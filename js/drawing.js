/**
 * Drawing Engine
 * Manages drawing strokes on an offscreen canvas that represents the paper's surface.
 */

export class DrawingEngine {
    constructor(width, height) {
        // We use an offscreen canvas to hold the drawing layer.
        // This is drawn onto the main paper canvas later.
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Brush settings
        this.tool = 'pen'; // pen, pencil, marker, erase
        this.color = '#000000';
        this.size = 5;
        
        // State
        this.isDrawing = false;
        this.lastPos = null;
        
        // History for undo/redo (store image data for simplicity in prototype, 
        // in a real app, storing vector paths is much more efficient).
        this.history = [];
        this.historyStep = -1;
        this.saveState();
    }

    resize(width, height) {
        // Save current drawing
        const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
        
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Restore drawing onto new sized canvas
        this.ctx.putImageData(imgData, 0, 0);
    }

    setBrush(settings) {
        if (settings.tool) this.tool = settings.tool;
        if (settings.color) this.color = settings.color;
        if (settings.size) this.size = settings.size;
    }

    startStroke(x, y) {
        this.isDrawing = true;
        this.lastPos = { x, y };
        this.ctx.beginPath();
        
        // Prepare context based on tool
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        
        if (this.tool === 'erase') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.size * 2;
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.lineWidth = this.size;
            this.ctx.strokeStyle = this.color;
            
            if (this.tool === 'marker') {
                this.ctx.globalAlpha = 0.5;
            } else if (this.tool === 'pencil') {
                this.ctx.globalAlpha = 0.8;
                // Add texture to pencil later if needed
            } else {
                this.ctx.globalAlpha = 1.0;
            }
        }
        
        // Draw a single dot if they just click
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawStroke(x, y) {
        if (!this.isDrawing) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.lastPos = { x, y };
    }

    endStroke() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // Reset alpha and blend mode
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.saveState();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.saveState();
    }

    // --- History Management (Undo/Redo) ---
    
    saveState() {
        // Basic image data snapshot
        // To prevent memory explosion, limit history to 10 steps
        this.historyStep++;
        this.history = this.history.slice(0, this.historyStep);
        
        if (this.history.length >= 20) {
            this.history.shift();
            this.historyStep--;
        }
        
        this.history.push(this.ctx.getImageData(0, 0, this.width, this.height));
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.ctx.putImageData(this.history[this.historyStep], 0, 0);
            return true;
        }
        return false;
    }

    getCanvas() {
        return this.canvas;
    }
}
