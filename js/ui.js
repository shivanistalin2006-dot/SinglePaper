import { storage } from './storage.js';

export class UIManager {
    constructor(appContext) {
        this.app = appContext;
        this.theme = localStorage.getItem('pv_theme') || 'dark';
        this.currentTool = 'interact';
        this.initDOM();
        this.attachEvents();
        this.applyTheme(this.theme);
        
        // Ensure initial login state is handled
        this.updateProfileUI();
    }

    initDOM() {
        // Theme & Modals
        this.btnTheme = document.getElementById('btn-theme');
        this.btnProfile = document.getElementById('btn-profile');
        this.btnProjects = document.getElementById('btn-projects');
        this.modalProfile = document.getElementById('modal-profile');
        this.modalProjects = document.getElementById('modal-projects');
        this.closeModals = document.querySelectorAll('.close-modal');
        
        // Profile Auth UI
        this.viewLogin = document.getElementById('profile-login-view');
        this.viewActive = document.getElementById('profile-active-view');
        this.inputUsername = document.getElementById('input-username');
        this.btnLogin = document.getElementById('btn-login');
        this.btnLogout = document.getElementById('btn-logout');
        this.displayUsername = document.getElementById('display-username');
        this.statProjects = document.getElementById('stat-projects');
        
        // Projects UI
        this.btnNewProject = document.getElementById('btn-new-project');
        this.btnSaveProject = document.getElementById('btn-save-project');
        this.projectsList = document.getElementById('projects-list');

        // Toolbar
        this.toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
        this.actionBtns = document.querySelectorAll('.tool-btn[data-action]');
        
        // Right Panel Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Paper Properties
        this.colorPresets = document.querySelectorAll('.color-preset');
        this.customColor = document.getElementById('custom-paper-color');
        this.paperTexture = document.getElementById('paper-texture');
        this.bgEnvironment = document.getElementById('bg-environment');
        this.btnResetPaper = document.getElementById('btn-reset-paper');
        
        // Adjustments
        this.paperBrightness = document.getElementById('paper-brightness');
        this.paperContrast = document.getElementById('paper-contrast');
        this.paperOpacity = document.getElementById('paper-opacity');
        
        // Brush settings
        this.brushColor = document.getElementById('brush-color');
        this.brushSize = document.getElementById('brush-size');
        
        // Chatbot
        this.chatbot = document.getElementById('chatbot');
        this.chatbotHeader = document.getElementById('chatbot-header');
        
        // Initialize layers
        this.populateLayers();
    }

    attachEvents() {
        // Mode switching
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.app.setMode(btn.dataset.mode);
            });
        });

        // Export
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.app.exportImage());
        }

        // Onboarding
        const btnStartOnboarding = document.getElementById('btn-start-onboarding');
        const modalOnboarding = document.getElementById('modal-onboarding');
        if (btnStartOnboarding && modalOnboarding) {
            btnStartOnboarding.addEventListener('click', () => {
                modalOnboarding.classList.add('hidden');
                localStorage.setItem('pv_hasSeenOnboarding', 'true');
            });
            
            if (!localStorage.getItem('pv_hasSeenOnboarding')) {
                modalOnboarding.classList.remove('hidden');
            }
        }

        // ModalsTheme toggle
        this.btnTheme.addEventListener('click', () => {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.theme);
        });

        // Modals
        this.btnProfile.addEventListener('click', () => this.openModal(this.modalProfile));
        this.btnProjects.addEventListener('click', () => {
            if (!storage.isLoggedIn()) {
                this.openModal(this.modalProfile);
            } else {
                this.loadProjectsList();
                this.openModal(this.modalProjects);
            }
        });
        
        this.closeModals.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal-overlay'));
            });
        });

        // Auth
        this.btnLogin.addEventListener('click', async () => {
            const username = this.inputUsername.value;
            try {
                await storage.login(username);
                this.updateProfileUI();
                this.closeModal(this.modalProfile); // Automatically close modal after entering
            } catch(e) {
                alert("Invalid username");
            }
        });
        this.btnLogout.addEventListener('click', () => {
            storage.logout();
            this.inputUsername.value = '';
            this.updateProfileUI();
            this.viewLogin.classList.remove('hidden');
        });

        // Projects logic
        this.btnNewProject.addEventListener('click', () => {
            this.app.newProject();
            this.closeModal(this.modalProjects);
        });
        this.btnSaveProject.addEventListener('click', async () => {
            await this.app.saveProject();
            this.loadProjectsList();
        });

        // Toolbar
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.app.setTool(this.currentTool);
            });
        });

        this.actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.triggerAction(btn.dataset.action);
            });
        });

        // Right Panel Tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tabBtns.forEach(b => b.classList.remove('active'));
                this.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.target).classList.add('active');
            });
        });
        
        // Paper Properties
        this.colorPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                this.colorPresets.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.app.setPaperColor(btn.dataset.color);
            });
        });
        
        this.customColor.addEventListener('input', (e) => {
            this.colorPresets.forEach(b => b.classList.remove('active'));
            this.app.setPaperColor(e.target.value);
        });
        
        this.paperTexture.addEventListener('change', (e) => {
            this.app.setPaperTexture(e.target.value);
        });

        this.bgEnvironment.addEventListener('change', (e) => {
            this.app.setBackground(e.target.value);
        });

        this.btnResetPaper.addEventListener('click', () => {
            this.app.resetPaper();
        });
        
        // Adjustments
        this.paperBrightness.addEventListener('input', (e) => this.app.setAdjustment('brightness', e.target.value));
        this.paperContrast.addEventListener('input', (e) => this.app.setAdjustment('contrast', e.target.value));
        this.paperOpacity.addEventListener('input', (e) => this.app.setAdjustment('opacity', e.target.value));
        
        // Brush settings
        this.brushColor.addEventListener('input', (e) => this.app.setBrushColor(e.target.value));
        this.brushSize.addEventListener('input', (e) => this.app.setBrushSize(e.target.value));

        // Chatbot
        this.chatbotHeader.addEventListener('click', () => {
            this.chatbot.classList.toggle('collapsed');
            const icon = this.chatbotHeader.querySelector('.toggle-icon');
            if (this.chatbot.classList.contains('collapsed')) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pv_theme', theme);
        const icon = this.btnTheme.querySelector('i');
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    openModal(modal) {
        modal.classList.remove('hidden');
    }

    closeModal(modal) {
        if(modal) modal.classList.add('hidden');
    }

    async updateProfileUI() {
        if (storage.isLoggedIn()) {
            this.viewLogin.classList.add('hidden');
            this.viewActive.classList.remove('hidden');
            this.displayUsername.textContent = storage.getCurrentUser();
            const projects = await storage.getProjects();
            this.statProjects.textContent = projects.length;
        } else {
            this.viewLogin.classList.remove('hidden');
            this.viewActive.classList.add('hidden');
            // Removed forced modal opening so friends visiting the site can just play instantly.
        }
    }

    async loadProjectsList() {
        if (!storage.isLoggedIn()) return;
        const projects = await storage.getProjects();
        this.projectsList.innerHTML = '';
        
        if (projects.length === 0) {
            this.projectsList.innerHTML = '<div class="empty-state">No saved projects yet.</div>';
            return;
        }

        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            const date = new Date(p.updatedAt).toLocaleDateString();
            
            const thumbHtml = p.data && p.data.thumbnail ? 
                `<img src="${p.data.thumbnail}" style="width: 100%; height: 80px; object-fit: cover; border-radius: var(--radius); margin-bottom: 0.5rem;" />` : 
                `<div style="width: 100%; height: 80px; background: rgba(255,255,255,0.1); border-radius: var(--radius); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-image" style="opacity:0.5;"></i></div>`;
                
            card.innerHTML = `
                ${thumbHtml}
                <div class="title" style="font-weight: 600; font-size: 0.9rem;">${p.title || 'Untitled Paper'}</div>
                <div class="date" style="font-size: 0.75rem; color: var(--text-muted);">${date}</div>
            `;
            card.addEventListener('click', () => {
                this.app.loadProject(p.id);
                this.closeModal(this.modalProjects);
            });
            this.projectsList.appendChild(card);
        });
    }

    populateLayers() {
        this.layerList = document.getElementById('layer-list');
        this.layerList.innerHTML = '';
        
        const layers = [
            { id: 'drawing', name: 'Drawing Layer' },
            { id: 'origami', name: 'Origami Folds' },
            { id: 'texture', name: 'Texture & Shadows' },
            { id: 'base', name: 'Paper Base' }
        ];
        
        layers.forEach(layer => {
            const li = document.createElement('li');
            li.className = 'layer-item';
            li.style = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(128,128,128,0.1); border-radius: var(--radius); margin-bottom: 0.25rem; font-size: 0.875rem;';
            li.innerHTML = `
                <span>${layer.name}</span>
                <button class="icon-btn layer-toggle" data-layer="${layer.id}" style="width: 30px; height: 30px;"><i class="fa-solid fa-eye"></i></button>
            `;
            this.layerList.appendChild(li);
        });
        
        this.layerList.querySelectorAll('.layer-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('i');
                const isVisible = icon.classList.contains('fa-eye');
                const layerId = btn.dataset.layer;
                
                if (isVisible) {
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                    icon.style.opacity = '0.5';
                    if(this.app.paperEngine) this.app.paperEngine.setLayerVisibility(layerId, false);
                } else {
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                    icon.style.opacity = '1';
                    if(this.app.paperEngine) this.app.paperEngine.setLayerVisibility(layerId, true);
                }
            });
        });
    }
}
