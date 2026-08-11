/**
 * Local storage engine using IndexedDB for profiles and projects
 */

const DB_NAME = 'PaperVerseDB';
const DB_VERSION = 1;

export class StorageEngine {
    constructor() {
        this.db = null;
        this.currentUser = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                
                // Check if user is already logged in (using localStorage for active session only)
                const activeUser = localStorage.getItem('pv_active_user');
                if (activeUser) {
                    this.currentUser = activeUser;
                }
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'username' });
                }

                // Projects store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectStore.createIndex('username', 'username', { unique: false });
                    projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };
        });
    }

    // --- User Profile ---

    async login(username) {
        return new Promise((resolve, reject) => {
            if (!username || username.trim() === '') {
                reject(new Error("Username cannot be empty"));
                return;
            }

            const cleanUsername = username.trim();
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.get(cleanUsername);

            request.onsuccess = (e) => {
                const user = e.target.result;
                if (!user) {
                    // Create new user
                    const newUser = {
                        username: cleanUsername,
                        createdAt: Date.now()
                    };
                    store.add(newUser);
                }
                this.currentUser = cleanUsername;
                localStorage.setItem('pv_active_user', cleanUsername);
                resolve(cleanUsername);
            };

            request.onerror = () => reject(request.error);
        });
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('pv_active_user');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // --- Projects ---

    async saveProject(projectData) {
        return new Promise((resolve, reject) => {
            if (!this.currentUser) {
                reject(new Error("User not logged in"));
                return;
            }

            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');

            const id = projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const projectToSave = {
                ...projectData,
                id: id,
                username: this.currentUser,
                updatedAt: Date.now()
            };

            const request = store.put(projectToSave);

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(request.error);
        });
    }

    async getProjects() {
        return new Promise((resolve, reject) => {
            if (!this.currentUser) {
                resolve([]);
                return;
            }

            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const index = store.index('username');
            const request = index.getAll(this.currentUser);

            request.onsuccess = (e) => {
                const projects = e.target.result;
                // Sort by descending update time
                projects.sort((a, b) => b.updatedAt - a.updatedAt);
                resolve(projects);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getProject(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.get(id);

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProject(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const storage = new StorageEngine();
