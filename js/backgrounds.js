/**
 * Animated Background Engine
 */

export class BackgroundEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Opaque optimization
        this.environment = 'particles';
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.particles = [];
        this.initParticles();
        
        // Respect prefers-reduced-motion
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.time = 0;
        this.running = true;
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.initParticles();
    }

    setEnvironment(env) {
        this.environment = env;
        if (env === 'particles') this.initParticles();
        if (env === 'stars') this.initStars();
    }

    initParticles() {
        this.particles = [];
        const count = this.reducedMotion ? 20 : 100;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: `hsla(${Math.random() * 60 + 200}, 70%, 70%, 0.4)`
            });
        }
    }

    initStars() {
        this.particles = [];
        const count = 200;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.05
            });
        }
    }

    animate(timestamp) {
        if (!this.running) return;
        
        this.time = timestamp * 0.001;
        
        if (this.environment === 'solid') {
            this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f172a';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else if (this.environment === 'particles') {
            this.drawParticles();
        } else if (this.environment === 'mesh') {
            this.drawMeshGradient();
        } else if (this.environment === 'stars') {
            this.drawStars();
        } else if (this.environment === 'waves') {
            this.drawWaves();
        }

        requestAnimationFrame(this.animate);
    }

    drawParticles() {
        // Use theme background as base
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#1e1e2f';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (!this.reducedMotion) {
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = this.width;
                if (p.x > this.width) p.x = 0;
                if (p.y < 0) p.y = this.height;
                if (p.y > this.height) p.y = 0;
            });
        }

        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });
    }

    drawMeshGradient() {
        // A simple moving gradient
        const cx1 = this.width * 0.5 + Math.sin(this.time * 0.5) * this.width * 0.2;
        const cy1 = this.height * 0.5 + Math.cos(this.time * 0.3) * this.height * 0.2;
        
        const cx2 = this.width * 0.8 + Math.cos(this.time * 0.4) * this.width * 0.1;
        const cy2 = this.height * 0.2 + Math.sin(this.time * 0.6) * this.height * 0.1;

        // Fill base
        this.ctx.fillStyle = '#1e1b4b'; // Deep violet base
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Add soft light blobs
        this.ctx.globalCompositeOperation = 'screen';
        
        const g1 = this.ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, this.width * 0.6);
        g1.addColorStop(0, 'rgba(99, 102, 241, 0.4)'); // Indigo
        g1.addColorStop(1, 'rgba(99, 102, 241, 0)');
        this.ctx.fillStyle = g1;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const g2 = this.ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, this.width * 0.5);
        g2.addColorStop(0, 'rgba(236, 72, 153, 0.3)'); // Pink
        g2.addColorStop(1, 'rgba(236, 72, 153, 0)');
        this.ctx.fillStyle = g2;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    drawStars() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.particles.forEach(p => {
            if (!this.reducedMotion) {
                p.twinkle += p.twinkleSpeed;
            }
            const alpha = 0.5 + Math.sin(p.twinkle) * 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
        });
    }

    drawWaves() {
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#f0f2f5';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.lineWidth = 2;
        const rows = 10;
        
        for (let i = 0; i < rows; i++) {
            this.ctx.beginPath();
            const yOffset = (i / rows) * this.height;
            
            for (let x = 0; x < this.width; x += 10) {
                // Combine multiple sine waves for organic feel
                const y = Math.sin(x * 0.01 + this.time + i) * 20 
                        + Math.cos(x * 0.005 - this.time * 0.5) * 15;
                
                if (x === 0) this.ctx.moveTo(x, yOffset + y);
                else this.ctx.lineTo(x, yOffset + y);
            }
            
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.ctx.strokeStyle = isDark ? `rgba(255,255,255,${0.02 + (i/rows)*0.03})` : `rgba(0,0,0,${0.02 + (i/rows)*0.03})`;
            this.ctx.stroke();
        }
    }
}
