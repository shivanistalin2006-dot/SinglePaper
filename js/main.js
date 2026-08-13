import { UIManager } from './ui.js';
import { storage } from './storage.js';
import { PaperEngine } from './paper.js';
import { BackgroundEngine } from './backgrounds.js';
import { OrigamiManager } from './origami.js';
import { ChatbotManager } from './chatbot.js';
import { AudioEngine } from './audio.js';

class PaperVerseApp {
    constructor() {
        this.audio = new AudioEngine();
        this.currentTool = 'interact';
        this.paperColor = '#ffffff';
        this.brushColor = '#000000';
        this.brushSize = 5;
        this.currentProjectId = null;
        
        this.init();
    }

    async init() {
        try {
            await storage.init();
            console.log("Storage initialized.");
        } catch(e) {
            console.error("Failed to init storage:", e);
        }

        // Initialize UI
        this.ui = new UIManager(this);

        // Initialize Engines (stubs for now, will connect real instances later)
        this.bgEngine = new BackgroundEngine(document.getElementById('bg-canvas'));
        this.paperEngine = new PaperEngine(document.getElementById('paper-canvas'), document.getElementById('ui-canvas'), this);
        this.origami = new OrigamiManager(this);
        this.chatbot = new ChatbotManager();
        
        // Setup resize handling
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        
        console.log("PaperVerse initialized!");
    }

    handleResize() {
        const canvases = ['bg-canvas', 'paper-canvas', 'ui-canvas'];
        canvases.forEach(id => {
            const canvas = document.getElementById(id);
            if(canvas) {
                // Handle high DPI displays
                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                // We keep CSS dimensions 100% via style.css
                // Need to notify engines to redraw
                if (this.bgEngine) this.bgEngine.resize(canvas.width, canvas.height);
                if (this.paperEngine) this.paperEngine.resize(canvas.width, canvas.height);
            }
        });
    }

    // --- State setters called by UI ---
    
    setTool(tool) {
        this.currentTool = tool;
        console.log("Tool set to:", tool);
        if (this.paperEngine) this.paperEngine.setTool(tool);
    }

    triggerAction(action) {
        console.log("Action triggered:", action);
        if (this.paperEngine) {
            if(action === 'undo') this.paperEngine.undo();
            if(action === 'redo') this.paperEngine.redo();
            if(action === 'clear') this.paperEngine.clearDrawing();
            if(action === 'crush') {
                this.audio.playCrush();
                this.paperEngine.crushPaper();
            }
            if(action === 'flip') this.paperEngine.flipPaper();
        }
    }

    setPaperColor(color) {
        this.paperColor = color;
        if (this.paperEngine) this.paperEngine.setColor(color);
    }

    setPaperTexture(texture) {
        if (this.paperEngine) this.paperEngine.setTexture(texture);
    }

    setBackground(bg) {
        if (this.bgEngine) this.bgEngine.setEnvironment(bg);
    }
    
    setAdjustment(type, value) {
        if (this.paperEngine) {
            if (type === 'brightness') this.paperEngine.brightness = parseFloat(value);
            if (type === 'contrast') this.paperEngine.contrast = parseFloat(value);
            if (type === 'opacity') this.paperEngine.opacity = parseFloat(value);
            this.paperEngine.requestRender();
        }
    }

    resetPaper() {
        if (this.paperEngine) this.paperEngine.resetTransform();
    }

    setBrushColor(color) {
        this.brushColor = color;
        if (this.paperEngine) this.paperEngine.setBrush({ color: this.brushColor, size: this.brushSize });
    }

    setBrushSize(size) {
        this.brushSize = parseInt(size);
        if (this.paperEngine) this.paperEngine.setBrush({ color: this.brushColor, size: this.brushSize });
    }

    // --- Projects logic ---

    newProject() {
        this.currentProjectId = null;
        this.resetPaper();
        this.triggerAction('clear');
        console.log("Started new project.");
    }

    async saveProject() {
        if (!storage.isLoggedIn()) {
            alert("Please create a profile first to save projects.");
            return;
        }
        
        // const paperState = this.paperEngine ? this.paperEngine.exportState() : {};
        
        const projectData = {
            id: this.currentProjectId,
            title: `Paper ${new Date().toLocaleTimeString()}`, // Can be edited later
            // data: paperState
        };

        try {
            const id = await storage.saveProject(projectData);
            this.currentProjectId = id;
            console.log("Project saved with ID:", id);
        } catch (e) {
            console.error("Failed to save:", e);
        }
    }

    async loadProject(id) {
        try {
            const project = await storage.getProject(id);
            if (project) {
                this.currentProjectId = id;
                console.log("Loaded project:", project);
                // if(this.paperEngine) this.paperEngine.importState(project.data);
            }
        } catch(e) {
            console.error("Failed to load project:", e);
        }
    }
}

// Bootstrap the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.paperVerse = new PaperVerseApp();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
    }
});
