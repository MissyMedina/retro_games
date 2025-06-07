// Social features and leaderboard system
export class SocialManager {
    constructor() {
        this.roomCode = this.generateRoomCode();
        this.referralCode = this.getReferralCode();
    }

    // Generate a random room code
    generateRoomCode() {
        return Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // Get referral code from URL or generate new one
    getReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref') || this.generateRoomCode();
    }

    // Save score to room leaderboard
    saveScore(playerName, score) {
        const roomKey = `room-${this.roomCode}`;
        let roomScores = JSON.parse(localStorage.getItem(roomKey) || '[]');
        
        roomScores.push({
            name: playerName,
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score and keep top 10
        roomScores.sort((a, b) => b.score - a.score);
        roomScores = roomScores.slice(0, 10);
        
        localStorage.setItem(roomKey, JSON.stringify(roomScores));
        
        // Check for referral bonus
        if (this.referralCode && this.referralCode !== this.roomCode) {
            this.grantReferralBonus();
        }
    }

    // Get room leaderboard
    getRoomLeaderboard() {
        const roomKey = `room-${this.roomCode}`;
        return JSON.parse(localStorage.getItem(roomKey) || '[]');
    }

    // Generate share URL
    generateShareUrl(score) {
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomCode);
        url.searchParams.set('score', score);
        url.searchParams.set('ref', this.roomCode);
        return url.toString();
    }

    // Grant referral bonus
    grantReferralBonus() {
        const bonusKey = `bonus-${this.referralCode}`;
        const bonus = parseInt(localStorage.getItem(bonusKey) || '0');
        localStorage.setItem(bonusKey, (bonus + 1).toString());
    }

    // Get referral bonus
    getReferralBonus() {
        const bonusKey = `bonus-${this.roomCode}`;
        return parseInt(localStorage.getItem(bonusKey) || '0');
    }

    // Create share card
    createShareCard(score) {
        const card = document.createElement('div');
        card.className = 'share-card';
        card.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        card.innerHTML = `
            <h2>Share Your Score!</h2>
            <p>Room Code: ${this.roomCode}</p>
            <p>Score: ${score}</p>
            <div class="share-buttons">
                <button onclick="navigator.share({title: 'SpaceClash2.0', text: 'I scored ${score} in room ${this.roomCode}! Can you beat it?', url: '${this.generateShareUrl(score)}'})">Share</button>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(card);
    }
} 