// Dynamic difficulty adjustment system
export class DifficultyManager {
    constructor() {
        this.BASE_SPEED = 1;
        this.BASE_DELAY = 1000;
        this.SPEED_FACTOR = 0.5;
        this.DELAY_FACTOR = 100;
        this.currentSpeed = this.BASE_SPEED;
        this.currentDelay = this.BASE_DELAY;
    }

    // Adjust difficulty based on player metrics
    adjustDifficulty(metrics) {
        const engagementIndex = metrics.getEngagementIndex();
        
        // Adjust enemy speed (faster for better players)
        this.currentSpeed = this.BASE_SPEED + (engagementIndex * this.SPEED_FACTOR);
        
        // Adjust spawn delay (shorter for better players)
        this.currentDelay = Math.max(
            this.BASE_DELAY - (engagementIndex * this.DELAY_FACTOR),
            300 // Minimum delay of 300ms
        );

        // Generate fractal-based wave pattern
        return this.generateWavePattern(engagementIndex);
    }

    // Generate fractal-based wave pattern
    generateWavePattern(engagementIndex) {
        const pattern = [];
        const complexity = Math.floor(3 + (engagementIndex * 2)); // 3-5 rows based on skill
        
        for (let i = 0; i < complexity; i++) {
            const row = {
                type: this.getInvaderType(i, complexity),
                count: Math.floor(8 + (engagementIndex * 4)), // 8-12 invaders per row
                spacing: Math.max(40 - (engagementIndex * 10), 20) // Tighter spacing for better players
            };
            pattern.push(row);
        }
        
        return pattern;
    }

    // Determine invader type based on row position and complexity
    getInvaderType(row, complexity) {
        if (row === 0) return 'small';
        if (row === 1) return 'small';
        if (row === 2) return 'medium';
        return 'large';
    }

    // Reset difficulty to base values
    reset() {
        this.currentSpeed = this.BASE_SPEED;
        this.currentDelay = this.BASE_DELAY;
    }
} 