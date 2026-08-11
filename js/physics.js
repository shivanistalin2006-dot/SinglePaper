/**
 * Physics and Geometry utilities for Canvas operations
 * Handles pointer event normalization (mouse + touch) and gestures.
 */

export class PhysicsEngine {
    constructor(canvas, onTransformChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onTransformChange = onTransformChange; // Callback when view changes

        // Viewport transform state
        this.transform = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };

        // Pointer state
        this.pointers = new Map();
        
        // Active gesture state
        this.isInteracting = false;
        this.initialTransform = null;
        this.initialPointers = [];
        
        this.isInteractMode = true; // Added flag to disable single-finger pan

        this.attachEvents();
    }

    attachEvents() {
        // Use pointer events for unified mouse/touch handling
        this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
        this.canvas.addEventListener('pointerout', this.onPointerUp.bind(this));
        this.canvas.addEventListener('pointerleave', this.onPointerUp.bind(this));
        
        // Wheel for zoom
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    }

    onPointerDown(e) {
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        // We only care about gestures if we are in 'interact' mode, but the mode logic
        // is handled higher up. This engine just provides the data.
        
        // Initialize gesture tracking
        if (this.pointers.size > 0) {
            this.initialTransform = { ...this.transform };
            this.initialPointers = Array.from(this.pointers.values()).map(p => ({...p}));
            this.isInteracting = true;
            this.canvas.setPointerCapture(e.pointerId);
        }
    }

    onPointerMove(e) {
        if (!this.pointers.has(e.pointerId)) return;
        
        // Update current pointer position
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // If we are handling a gesture, calculate new transform
        if (this.isInteracting && this.initialTransform) {
            this.calculateGesture();
        }
    }

    onPointerUp(e) {
        this.pointers.delete(e.pointerId);
        
        if (this.pointers.size === 0) {
            this.isInteracting = false;
            this.initialTransform = null;
        } else if (this.pointers.size > 0) {
            // Reset gesture anchor if a finger is lifted but others remain
            this.initialTransform = { ...this.transform };
            this.initialPointers = Array.from(this.pointers.values()).map(p => ({...p}));
        }
    }

    onWheel(e) {
        e.preventDefault();
        
        // Zoom around mouse position
        const zoomIntensity = 0.002;
        const delta = -e.deltaY * zoomIntensity;
        const newScale = Math.max(0.1, Math.min(10, this.transform.scale * Math.exp(delta)));
        
        // Adjust translation to zoom around cursor
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
        this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
        this.transform.scale = newScale;

        this.notifyChange();
    }

    calculateGesture() {
        const currentPointers = Array.from(this.pointers.values());
        
        if (currentPointers.length === 1 && this.initialPointers.length === 1) {
            if (!this.isInteractMode) return; // Disable single finger pan if not in interact mode
            
            // Pan
            const dx = currentPointers[0].x - this.initialPointers[0].x;
            const dy = currentPointers[0].y - this.initialPointers[0].y;
            
            this.transform.x = this.initialTransform.x + dx;
            this.transform.y = this.initialTransform.y + dy;
            
        } else if (currentPointers.length === 2 && this.initialPointers.length === 2) {
            // Pinch to zoom and rotate
            const initialDist = this.distance(this.initialPointers[0], this.initialPointers[1]);
            const currentDist = this.distance(currentPointers[0], currentPointers[1]);
            
            const initialAngle = this.angle(this.initialPointers[0], this.initialPointers[1]);
            const currentAngle = this.angle(currentPointers[0], currentPointers[1]);
            
            // Calculate scale
            const scaleFactor = currentDist / initialDist;
            this.transform.scale = Math.max(0.1, Math.min(10, this.initialTransform.scale * scaleFactor));
            
            // Calculate rotation
            const angleDelta = currentAngle - initialAngle;
            this.transform.rotation = this.initialTransform.rotation + angleDelta;
            
            // Calculate translation based on center point
            const initialCenter = this.center(this.initialPointers[0], this.initialPointers[1]);
            const currentCenter = this.center(currentPointers[0], currentPointers[1]);
            
            // Complex math to pan while scaling and rotating around the center...
            // Simplified approach for prototype:
            const dx = currentCenter.x - initialCenter.x;
            const dy = currentCenter.y - initialCenter.y;
            
            this.transform.x = this.initialTransform.x + dx;
            this.transform.y = this.initialTransform.y + dy;
        }

        this.notifyChange();
    }

    notifyChange() {
        if (this.onTransformChange) {
            this.onTransformChange(this.transform);
        }
    }

    // --- Math Utils ---
    
    distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }

    center(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }
    
    // Convert screen coordinates to canvas space coordinates given current transform
    screenToCanvas(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        // Adjust for device pixel ratio if needed (assuming canvas width matches CSS width for logical mapping)
        const logicalX = x - rect.left;
        const logicalY = y - rect.top;
        
        // Reverse translation
        const tx = logicalX - this.transform.x;
        const ty = logicalY - this.transform.y;
        
        // Reverse rotation
        const cos = Math.cos(-this.transform.rotation);
        const sin = Math.sin(-this.transform.rotation);
        const rx = tx * cos - ty * sin;
        const ry = tx * sin + ty * cos;
        
        // Reverse scale
        return {
            x: rx / this.transform.scale,
            y: ry / this.transform.scale
        };
    }
    
    // Simulated paper deformation mapping (for crumpling)
    // Takes UV coordinates (0-1) and applies a noise offset to simulate 3D surface
    // Returns modified UV
    applyCrumpleDistortion(u, v, intensity) {
        // Simple pseudo-random sine wave distortion based on coordinates
        const noiseX = Math.sin(u * 20) * Math.cos(v * 15) * 0.02 * intensity;
        const noiseY = Math.cos(u * 12) * Math.sin(v * 25) * 0.02 * intensity;
        return {
            u: u + noiseX,
            v: v + noiseY
        };
    }
}
