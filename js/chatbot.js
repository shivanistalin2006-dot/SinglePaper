/**
 * Chatbot / Ideas Assistant (Rule-based, local)
 */

export class ChatbotManager {
    constructor() {
        this.historyContainer = document.getElementById('chat-history');
        this.chips = document.querySelectorAll('.chat-suggestions .chip');
        
        this.responses = {
            'origami': [
                "Try folding a paper crane! It's a classic.",
                "How about a paper boat? Check the Origami tab!",
                "You can make a simple jumping frog with a square piece.",
                "Fold the corners to make a paper airplane."
            ],
            'drawing': [
                "Draw a tiny city skyline along the bottom edge.",
                "Close your eyes, draw a squiggle, then turn it into a monster.",
                "Try sketching the room you're sitting in.",
                "Draw patterns using only dots and straight lines."
            ],
            'surprise': [
                "Try 'crumpling' the paper texture in the settings!",
                "Have you tried changing the background to 'Galaxy Stars'?",
                "Tear off a corner just for fun (soon!).",
                "Try drawing with the neon marker on black paper."
            ]
        };
        
        this.attachEvents();
    }
    
    attachEvents() {
        this.chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                this.addUserMessage(chip.textContent);
                
                // Simulate typing delay
                setTimeout(() => {
                    this.addBotMessage(this.getRandomResponse(query));
                }, 600);
            });
        });
    }
    
    getRandomResponse(category) {
        if (!this.responses[category]) return "I don't have an idea for that right now!";
        const options = this.responses[category];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    addUserMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'chat-msg user';
        msg.textContent = text;
        this.historyContainer.appendChild(msg);
        this.scrollToBottom();
    }
    
    addBotMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'chat-msg bot';
        msg.textContent = text;
        this.historyContainer.appendChild(msg);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
    }
}
