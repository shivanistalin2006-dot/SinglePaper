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
        
        // Tear mask canvas
        this.tearCanvas = document.createElement('canvas');
        this.tearCanvas.width = this.paperWidth;
        this.tearCanvas.height = this.paperHeight;
        this.tearCtx = this.tearCanvas.getContext('2d');
        this.resetTearMask();
        
        this.crushIntensity = 0;
        this.folds = []; // Array to hold fold lines for origami
        this.layerVisibility = {
            base: true,
            texture: true,
            origami: true,
            drawing: true
        };
        
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
        if (['pen', 'pencil', 'marker', 'erase', 'tear'].includes(tool)) {
            // For tearing, we use a separate context but UI state can just say it's drawing mode
            if (tool !== 'tear') this.drawingEngine.setBrush({ tool });
            this.physics.isInteractMode = false;
        } else {
            this.physics.isInteractMode = true;
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
        if (this.currentTool !== 'tear' && this.drawingEngine.undo()) this.requestRender();
    }

    redo() {
        if (this.currentTool !== 'tear' && this.drawingEngine.redo()) this.requestRender();
    }

    clearDrawing() {
        this.drawingEngine.clear();
        this.requestRender();
    }
    
    crushPaper() {
        this.crushIntensity += 1;
        this.texture = 'crumpled'; // Switch to crumpled texture to show effect
        this.requestRender();
    }
    
    resetTearMask() {
        this.tearCtx.globalCompositeOperation = 'source-over';
        this.tearCtx.fillStyle = '#ffffff';
        this.tearCtx.fillRect(0, 0, this.paperWidth, this.paperHeight);
    }

    resetTransform() {
        this.centerPaper();
        this.crushIntensity = 0;
        this.folds = [];
        this.resetTearMask();
        this.requestRender();
    }

    // --- Origami ---
    applyFold(action) {
        // Simple 2D fold representations
        const cx = this.paperWidth / 2;
        const cy = this.paperHeight / 2;
        
        let fold = null;
        if (action.includes('half-down')) fold = { type: 'horizontal', y: cy };
        else if (action.includes('center')) fold = { type: 'vertical', x: cx };
        else if (action.includes('corners')) fold = { type: 'corners' };
        else if (action.includes('wings')) fold = { type: 'horizontal', y: cy - 100 };
        else fold = { type: 'diagonal' }; // generic fallback
        
        this.folds.push(fold);
        this.requestRender();
    }

    setLayerVisibility(layer, isVisible) {
        if (this.layerVisibility[layer] !== undefined) {
            this.layerVisibility[layer] = isVisible;
            this.requestRender();
        }
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
                
                if (this.currentTool === 'tear') {
                    this.startTear(pt.x, pt.y);
                } else {
                    this.drawingEngine.startStroke(pt.x, pt.y);
                }
                this.requestRender();
            }
        });

        this.uiCanvas.addEventListener('pointermove', (e) => {
            if (!isDrawingAction) return;
            const pt = this.physics.screenToCanvas(e.clientX, e.clientY);
            
            if (this.currentTool === 'tear') {
                this.drawTear(pt.x, pt.y);
            } else {
                this.drawingEngine.drawStroke(pt.x, pt.y);
            }
            this.requestRender();
        });

        const endDraw = () => {
            if (isDrawingAction) {
                if (this.currentTool !== 'tear') {
                    this.drawingEngine.endStroke();
                }
                isDrawingAction = false;
                this.requestRender();
            }
        };

        this.uiCanvas.addEventListener('pointerup', endDraw);
        this.uiCanvas.addEventListener('pointerout', endDraw);
    }
    
    startTear(x, y) {
        this.tearCtx.globalCompositeOperation = 'destination-out';
        this.tearCtx.lineJoin = 'round';
        this.tearCtx.lineCap = 'round';
        this.tearCtx.lineWidth = 15;
        this.tearCtx.beginPath();
        this.tearCtx.moveTo(x, y);
    }
    
    drawTear(x, y) {
        // Add jagged noise to the path to make it look like a real tear
        const noisyX = x + (Math.random() - 0.5) * 10;
        const noisyY = y + (Math.random() - 0.5) * 10;
        this.tearCtx.lineTo(noisyX, noisyY);
        this.tearCtx.stroke();
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
        if (this.layerVisibility.base) {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, this.paperWidth, this.paperHeight);
            
            // Apply Tear Mask
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(this.tearCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        // Reset shadow for subsequent drawings
        ctx.shadowColor = 'transparent';

        // 4. Draw texture overlay
        if (this.layerVisibility.texture) {
            if (this.texture === 'crumpled') {
                this.drawCrumpledTexture(ctx);
            } else if (this.texture === 'watercolor') {
                this.drawWatercolorTexture(ctx);
            } else if (this.texture === 'vintage') {
                this.drawVintageTexture(ctx);
            }
        }
        
        // 4b. Draw Origami Folds
        if (this.layerVisibility.origami && this.folds.length > 0) {
            this.drawOrigamiFolds(ctx);
        }

        // 5. Draw the Drawing Layer
        if (this.layerVisibility.drawing) {
            ctx.drawImage(this.drawingEngine.getCanvas(), 0, 0);
        }

        ctx.restore();
    }

    // Pseudo-textures for prototype
    drawCrumpledTexture(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // Increase darkness/intensity based on how many times crushed
        const baseAlpha = 0.05 + (this.crushIntensity * 0.05);
        ctx.fillStyle = `rgba(0,0,0,${baseAlpha})`;
        ctx.fillRect(0, 0, this.paperWidth, this.paperHeight);
        
        // Draw random "crease" lines
        const lines = 20 + (this.crushIntensity * 15);
        for(let i=0; i<lines; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * this.paperWidth, Math.random() * this.paperHeight);
            ctx.lineTo(Math.random() * this.paperWidth, Math.random() * this.paperHeight);
            ctx.lineWidth = Math.random() * 5 + 1;
            ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.stroke();
        }
        
        // Also apply destination-in tear mask to textures so they don't draw outside torn paper
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(this.tearCanvas, 0, 0);
        
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
        
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(this.tearCanvas, 0, 0);
        
        ctx.restore();
    }
    
    drawOrigamiFolds(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        this.folds.forEach(fold => {
            const grad = ctx.createLinearGradient(0, 0, this.paperWidth, this.paperHeight);
            
            if (fold.type === 'horizontal') {
                const gradH = ctx.createLinearGradient(0, fold.y - 20, 0, fold.y + 20);
                gradH.addColorStop(0, 'rgba(0,0,0,0)');
                gradH.addColorStop(0.5, 'rgba(0,0,0,0.15)');
                gradH.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradH;
                ctx.fillRect(0, fold.y - 20, this.paperWidth, 40);
            } else if (fold.type === 'vertical') {
                const gradV = ctx.createLinearGradient(fold.x - 20, 0, fold.x + 20, 0);
                gradV.addColorStop(0, 'rgba(0,0,0,0)');
                gradV.addColorStop(0.5, 'rgba(0,0,0,0.15)');
                gradV.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradV;
                ctx.fillRect(fold.x - 20, 0, 40, this.paperHeight);
            } else if (fold.type === 'corners') {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.paperWidth / 2, this.paperHeight / 4);
                ctx.lineTo(this.paperWidth, 0);
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.paperWidth, this.paperHeight);
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.stroke();
            }
        });
        
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(this.tearCanvas, 0, 0);
        
        ctx.restore();
    }
}
