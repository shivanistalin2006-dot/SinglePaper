import { PhysicsEngine } from './physics.js';
import { DrawingEngine } from './drawing.js';

export class PaperEngine {
    constructor(canvas, uiCanvas, app) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.uiCanvas = uiCanvas;
        this.uiCtx = uiCanvas.getContext('2d');
        this.app = app;
        
        // Logical size of the paper (A4 proportion roughly)
        this.paperWidth = 800;
        this.paperHeight = 1130;
        
        // Base paper properties
        this.color = '#ffffff';
        this.texture = 'smooth';
        this.opacity = 1;
        
        // Setup internal engines
        this.drawingEngine = new DrawingEngine(this.paperWidth, this.paperHeight);
        
        // Transform callback
        this.physics = new PhysicsEngine(this.uiCanvas, (transform) => {
            this.requestRender();
        });

        // Center paper initially
        this.centerPaper();
        
        // Tool state
        this.currentTool = 'interact';
        
        // Render loop state
        this.renderPending = false;
        
        // Attach drawing events to UI canvas (which sits on top)
        this.attachDrawingEvents();
        
        this.requestRender();
    }

    centerPaper() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Scale to fit ~80% of screen height
        const scale = (rect.height * 0.8) / this.paperHeight;
        
        this.physics.transform.scale = scale;
        this.physics.transform.x = (rect.width - (this.paperWidth * scale)) / 2;
        this.physics.transform.y = (rect.height - (this.paperHeight * scale)) / 2;
        this.physics.transform.rotation = 0;
        this.physics.notifyChange();
    }

    resize(width, height) {
        // Redraw on resize
        this.requestRender();
    }

    setTool(tool) {
        this.currentTool = tool;
        if (['pen', 'pencil', 'marker', 'erase'].includes(tool)) {
            this.drawingEngine.setBrush({ tool });
        }
    }

    setColor(color) {
        this.color = color;
        this.requestRender();
    }

    setTexture(texture) {
        this.texture = texture;
        this.requestRender();
    }

    setBrush(settings) {
        this.drawingEngine.setBrush(settings);
    }

    undo() {
        if (this.drawingEngine.undo()) this.requestRender();
    }

    redo() {
        if (this.drawingEngine.redo()) this.requestRender();
    }

    clearDrawing() {
        this.drawingEngine.clear();
        this.requestRender();
    }
    
    resetTransform() {
        this.centerPaper();
    }

    // --- Interaction routing ---

    attachDrawingEvents() {
        let isDrawingAction = false;

        this.uiCanvas.addEventListener('pointerdown', (e) => {
            if (this.currentTool === 'interact') return; // Handled by PhysicsEngine
            
            // Map screen to canvas
            const pt = this.physics.screenToCanvas(e.clientX, e.clientY);
            
            // Check if point is inside paper bounds
            if (pt.x >= 0 && pt.x <= this.paperWidth && pt.y >= 0 && pt.y <= this.paperHeight) {
                isDrawingAction = true;
                this.drawingEngine.startStroke(pt.x, pt.y);
                this.requestRender();
            }
        });

        this.uiCanvas.addEventListener('pointermove', (e) => {
            if (!isDrawingAction) return;
            const pt = this.physics.screenToCanvas(e.clientX, e.clientY);
            this.drawingEngine.drawStroke(pt.x, pt.y);
            this.requestRender();
        });

        const endDraw = () => {
            if (isDrawingAction) {
                this.drawingEngine.endStroke();
                isDrawingAction = false;
                this.requestRender();
            }
        };

        this.uiCanvas.addEventListener('pointerup', endDraw);
        this.uiCanvas.addEventListener('pointerout', endDraw);
    }

    // --- Rendering ---

    requestRender() {
        if (!this.renderPending) {
            this.renderPending = true;
            requestAnimationFrame(() => this.render());
        }
    }

    render() {
        this.renderPending = false;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const { x, y, scale, rotation } = this.physics.transform;

        ctx.save();
        
        // 1. Apply global paper transform
        ctx.translate(x, y);
        
        // Scale around top-left
        ctx.scale(scale, scale);
        
        // Translate to center to rotate, then translate back
        const cx = this.paperWidth / 2;
        const cy = this.paperHeight / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.translate(-cx, -cy);

        // 2. Draw Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 20;

        // 3. Draw Base Paper
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.paperWidth, this.paperHeight);
        
        // Reset shadow for subsequent drawings
        ctx.shadowColor = 'transparent';

        // 4. Draw texture overlay (simulated with composite operations)
        if (this.texture === 'crumpled') {
            this.drawCrumpledTexture(ctx);
        } else if (this.texture === 'watercolor') {
            this.drawWatercolorTexture(ctx);
        } else if (this.texture === 'vintage') {
            this.drawVintageTexture(ctx);
        }

        // 5. Draw the Drawing Layer
        ctx.drawImage(this.drawingEngine.getCanvas(), 0, 0);

        ctx.restore();
    }

    // Pseudo-textures for prototype
    drawCrumpledTexture(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        // Draw some random "crease" lines
        for(let i=0; i<20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * this.paperWidth, 0);
            ctx.lineTo(Math.random() * this.paperWidth, this.paperHeight);
            ctx.lineWidth = Math.random() * 5 + 1;
            ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawWatercolorTexture(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0, 0, 50, 0.03)';
        ctx.fillRect(0, 0, this.paperWidth, this.paperHeight);
        ctx.restore();
    }

    drawVintageTexture(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        // Add a vignette/brown tint
        const grad = ctx.createRadialGradient(
            this.paperWidth/2, this.paperHeight/2, 0,
            this.paperWidth/2, this.paperHeight/2, this.paperHeight/1.5
        );
        grad.addColorStop(0, 'rgba(200, 150, 100, 0.1)');
        grad.addColorStop(1, 'rgba(150, 100, 50, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.paperWidth, this.paperHeight);
        ctx.restore();
    }
}
