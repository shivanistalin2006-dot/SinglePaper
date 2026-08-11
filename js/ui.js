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
        
        // Brush settings
        this.brushColor = document.getElementById('brush-color');
        this.brushSize = document.getElementById('brush-size');
        
        // Chatbot
        this.chatbot = document.getElementById('chatbot');
        this.chatbotHeader = document.getElementById('chatbot-header');
    }

    attachEvents() {
        // Theme toggle
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
            this.updateProfileUI();
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
            card.innerHTML = `
                <div class="title">${p.title || 'Untitled Paper'}</div>
                <div class="date">Saved: ${date}</div>
            `;
            card.addEventListener('click', () => {
                this.app.loadProject(p.id);
                this.closeModal(this.modalProjects);
            });
            this.projectsList.appendChild(card);
        });
    }
}
