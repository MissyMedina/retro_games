// Enhanced UI and contextual tips system
export class UIManager {
    constructor() {
        this.tips = [
            "Try to hit the bonus ship for extra points!",
            "Destroy invaders from top to bottom for better accuracy",
            "Watch out for the game over line!",
            "Chain your shots for better accuracy",
            "The bonus ship appears twice per level",
            "Higher invaders are worth more points",
            "Keep your streak going for better scores",
            "Watch for patterns in invader movement"
        ];
        this.activeTips = new Set();
        this.tipTimeouts = new Map();
    }

    // Show a contextual tip
    showTip(text, duration = 3000) {
        // Remove any existing tip with the same text
        this.removeTip(text);
        
        // Create tip element
        const tip = document.createElement('div');
        tip.className = 'game-tip';
        tip.textContent = text;
        tip.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 18px;
            text-align: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        
        // Add to document
        document.body.appendChild(tip);
        this.activeTips.add(tip);
        
        // Fade in
        setTimeout(() => tip.style.opacity = '1', 10);
        
        // Set timeout for removal
        const timeout = setTimeout(() => this.removeTip(text), duration);
        this.tipTimeouts.set(text, timeout);
    }

    // Remove a specific tip
    removeTip(text) {
        const existingTip = Array.from(this.activeTips).find(tip => tip.textContent === text);
        if (existingTip) {
            existingTip.style.opacity = '0';
            setTimeout(() => {
                existingTip.remove();
                this.activeTips.delete(existingTip);
            }, 300);
        }
        
        // Clear timeout if exists
        const timeout = this.tipTimeouts.get(text);
        if (timeout) {
            clearTimeout(timeout);
            this.tipTimeouts.delete(text);
        }
    }

    // Show a random tip
    showRandomTip() {
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        this.showTip(randomTip);
    }

    // Show milestone tip
    showMilestoneTip(milestone) {
        const milestoneTips = {
            'firstKill': 'Great start! Keep going!',
            'firstWave': 'Wave complete! The next one will be faster!',
            'highScore': 'New high score! Keep pushing!',
            'bonusShip': 'Bonus ship destroyed! +2500 points!',
            'streak3': '3 waves in a row! You\'re on fire!',
            'streak5': '5 waves! You\'re unstoppable!'
        };
        
        if (milestoneTips[milestone]) {
            this.showTip(milestoneTips[milestone]);
        }
    }

    // Show progress overlay
    showProgressOverlay(stats) {
        const overlay = document.createElement('div');
        overlay.className = 'progress-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
        `;
        
        overlay.innerHTML = `
            <h3>Progress</h3>
            <p>Wave Streak: ${stats.waveStreak}</p>
            <p>Accuracy: ${Math.round(stats.accuracy * 100)}%</p>
            <p>Next Level: ${stats.nextLevel}</p>
        `;
        
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 3000);
    }
} 