// Player performance metrics tracking
export class PlayerMetrics {
    constructor() {
        this.reactionTimes = [];
        this.accuracy = { hits: 0, shots: 0 };
        this.waveStreak = 0;
        this.lastWaveTime = Date.now();
        this.currentWaveStart = Date.now();
    }

    // Track reaction time for first shot in a wave
    trackReactionTime() {
        const reactionTime = Date.now() - this.currentWaveStart;
        this.reactionTimes.push(reactionTime);
        // Keep only last 10 reaction times
        if (this.reactionTimes.length > 10) {
            this.reactionTimes.shift();
        }
    }

    // Track shot accuracy
    trackShot(hit) {
        this.accuracy.shots++;
        if (hit) {
            this.accuracy.hits++;
        }
    }

    // Track wave completion
    trackWaveComplete() {
        this.waveStreak++;
        this.lastWaveTime = Date.now();
        this.currentWaveStart = Date.now();
    }

    // Reset metrics for new game
    reset() {
        this.reactionTimes = [];
        this.accuracy = { hits: 0, shots: 0 };
        this.waveStreak = 0;
        this.lastWaveTime = Date.now();
        this.currentWaveStart = Date.now();
    }

    // Calculate engagement index (0-1)
    getEngagementIndex() {
        const avgReactionTime = this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length || 1000;
        const accuracy = this.accuracy.shots > 0 ? this.accuracy.hits / this.accuracy.shots : 0;
        const streakBonus = Math.min(this.waveStreak / 5, 1);

        // Normalize reaction time (faster is better)
        const reactionScore = Math.max(0, 1 - (avgReactionTime / 2000));

        // Weighted average of metrics
        return (reactionScore * 0.4 + accuracy * 0.4 + streakBonus * 0.2);
    }
} 