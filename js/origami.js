/**
 * Origami Tutorial Manager
 */

export class OrigamiManager {
    constructor(appContext) {
        this.app = appContext;
        this.tutorials = [
            {
                id: 'boat',
                title: 'Paper Boat',
                difficulty: 'Beginner',
                steps: [
                    { text: 'Start with a rectangular piece of paper. Fold it in half downwards.', action: 'fold-half-down' },
                    { text: 'Fold in half again left to right, then unfold to make a crease.', action: 'crease-center' },
                    { text: 'Fold the top corners down to the center line to form a triangle.', action: 'fold-corners' },
                    { text: 'Fold the bottom rectangular flaps upwards on both sides.', action: 'fold-flaps' },
                    { text: 'Open the bottom and flatten it into a diamond shape.', action: 'open-diamond' },
                    { text: 'Fold the bottom points up to the top point on both sides.', action: 'fold-triangle' },
                    { text: 'Open the bottom again and flatten into a smaller diamond.', action: 'open-diamond-small' },
                    { text: 'Pull the top flaps outwards to reveal the boat!', action: 'pull-boat' }
                ]
            },
            {
                id: 'airplane',
                title: 'Paper Airplane',
                difficulty: 'Beginner',
                steps: [
                    { text: 'Fold the paper in half lengthwise and unfold.', action: 'crease-length' },
                    { text: 'Fold the top two corners to the center crease.', action: 'fold-corners' },
                    { text: 'Fold the paper in half along the center crease.', action: 'fold-half' },
                    { text: 'Fold the wings down so their edges meet the bottom edge.', action: 'fold-wings' },
                    { text: 'Open the wings up. Ready to fly!', action: 'finish-plane' }
                ]
            }
        ];
        
        this.currentTutorial = null;
        this.currentStep = 0;
        
        this.initDOM();
    }

    initDOM() {
        this.listContainer = document.getElementById('origami-list');
        this.overlay = document.getElementById('origami-tutorial-overlay');
        
        this.elTitle = document.getElementById('tutorial-title');
        this.elInstruction = document.getElementById('tutorial-instruction');
        this.elStepIndicator = document.getElementById('tutorial-step-indicator');
        this.elAnimation = document.getElementById('tutorial-animation-container');
        
        this.btnNext = document.getElementById('btn-tut-next');
        this.btnPrev = document.getElementById('btn-tut-prev');
        this.btnRestart = document.getElementById('btn-tut-restart');
        this.btnClose = document.getElementById('btn-close-tutorial');
        
        this.populateList();
        this.attachEvents();
    }

    populateList() {
        this.listContainer.innerHTML = '';
        this.tutorials.forEach(tut => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="title">${tut.title}</div>
                <div class="date">${tut.difficulty} • ${tut.steps.length} Steps</div>
            `;
            card.addEventListener('click', () => this.startTutorial(tut.id));
            this.listContainer.appendChild(card);
        });
    }

    attachEvents() {
        this.btnNext.addEventListener('click', () => this.nextStep());
        this.btnPrev.addEventListener('click', () => this.prevStep());
        this.btnRestart.addEventListener('click', () => this.goToStep(0));
        this.btnClose.addEventListener('click', () => this.closeTutorial());
    }

    startTutorial(id) {
        this.currentTutorial = this.tutorials.find(t => t.id === id);
        if (!this.currentTutorial) return;
        
        this.app.resetPaper(); // Give them a clean sheet
        this.goToStep(0);
        this.overlay.classList.remove('hidden');
    }

    closeTutorial() {
        this.overlay.classList.add('hidden');
        this.currentTutorial = null;
    }

    goToStep(index) {
        if (!this.currentTutorial) return;
        if (index < 0 || index >= this.currentTutorial.steps.length) return;
        
        this.currentStep = index;
        const step = this.currentTutorial.steps[this.currentStep];
        
        this.elTitle.textContent = this.currentTutorial.title;
        this.elInstruction.textContent = step.text;
        this.elStepIndicator.textContent = `Step ${this.currentStep + 1} of ${this.currentTutorial.steps.length}`;
        
        this.btnPrev.disabled = this.currentStep === 0;
        
        if (this.currentStep === this.currentTutorial.steps.length - 1) {
            this.btnNext.textContent = "Finish";
            // trigger celebration here if we want
        } else {
            this.btnNext.textContent = "Next";
        }
        
        this.updateVisuals(step.action);
    }

    nextStep() {
        if (this.currentStep === this.currentTutorial.steps.length - 1) {
            this.closeTutorial();
            this.celebrate();
        } else {
            this.goToStep(this.currentStep + 1);
        }
    }

    prevStep() {
        this.goToStep(this.currentStep - 1);
    }

    updateVisuals(action) {
        // Update the visual instruction icon
        this.elAnimation.innerHTML = `<i class="fa-solid fa-scroll" style="font-size: 3rem; color: var(--accent); margin: 1rem 0; opacity: 0.5;"></i>`;
        
        // Actually simulate the fold on the canvas
        if (this.app.paperEngine) {
            this.app.paperEngine.applyFold(action);
            console.log(`Action applied: ${action}`);
        }
    }

    celebrate() {
        // Create some confetti particles on the ui canvas
        console.log("Celebration!");
    }
}
