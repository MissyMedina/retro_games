// Game variables
let canvas, ctx;
let player, enemies, projectiles, score;
let gameStarted = false; // Flag to check if the game has started
let enemyDirection = 1; // Direction of enemy movement (1 for right, -1 for left)
let enemySpeed = 1;     // Initial speed of enemy movement

// Level variable
let level = 1;

// Sprite image loading for each entity
const images = {
    player: { src: 'assets/player_ship1-42x35.png', width: 42, height: 35 },
    invader_small: { src: 'assets/invader_small1-45x47.png', width: 45, height: 47 },
    invader_medium: { src: 'assets/invader_medium1-49x52.png', width: 49, height: 52 },
    invader_large: { src: 'assets/invader_large1-52x56.png', width: 52, height: 56 },
    bonus_saucer: { src: 'assets/bonus_saucer1-42x23.png', width: 42, height: 23 },
    bunker_intact: { src: 'assets/bunker_intact1-52x51.png', width: 52, height: 51 },
    bunker_chipped1: { src: 'assets/bunker_chipped11-52x58.png', width: 52, height: 58 },
    bunker_chipped2: { src: 'assets/bunker_chipped21-52x55.png', width: 52, height: 55 },
    bunker_heavily_damaged: { src: 'assets/bunker_heavily_damaged1-52x52.png', width: 52, height: 52 }
};

// Preload all images
const loadedImages = {};
let imagesToLoad = Object.keys(images).length;
let allImagesLoaded = false;
Object.entries(images).forEach(([key, data]) => {
    const img = new Image();
    img.src = data.src;
    img.onload = () => {
        loadedImages[key] = img;
        imagesToLoad--;
        if (imagesToLoad === 0) {
            allImagesLoaded = true;
            startButton.disabled = false;
        }
    };
});

// Draw image helper
function drawImage(img, dx, dy, dw, dh) {
    ctx.drawImage(img, dx, dy, dw, dh);
}

// Bonus ship state
let bonusShip = null;
let bonusShipTimers = [];
let bonusShipsSpawned = 0;
const BONUS_SHIP_SPAWN_TIMES = [10000, 25000]; // ms after level start

// Adaptive Difficulty Variables
let playerAccuracy = 0;
let totalShots = 0;
let hits = 0;
let lives = 3;
let baseEnemySpeed = 1;
let baseSpawnRate = 0.001;

// Bonus ship score milestones
const BONUS_SHIP_SCORE_MILESTONES = [1500, 3000]; // Score thresholds for bonus ships
let lastBonusShipScore = 0;

// Bonus ship tracking
const TOTAL_ENEMIES_PER_LEVEL = 40; // 10 columns × 4 rows
let enemiesKilled = 0;
let lastBonusShipKills = 0;

function scheduleBonusShips() {
    bonusShipTimers.forEach(timer => clearTimeout(timer));
    bonusShipTimers = [];
    bonusShipsSpawned = 0;
    BONUS_SHIP_SPAWN_TIMES.forEach((delay, idx) => {
        const timer = setTimeout(() => {
            spawnBonusShip();
            bonusShipsSpawned++;
        }, delay);
        bonusShipTimers.push(timer);
    });
}

function spawnBonusShip() {
    if (!bonusShip) {
        const direction = Math.random() < 0.5 ? -1 : 1; // Random direction
        bonusShip = {
            x: direction === 1 ? -images.bonus_saucer.width : canvas.width,
            y: 40, // Just below score/lives
            width: images.bonus_saucer.width,
            height: images.bonus_saucer.height,
            speed: 4 * direction // Speed with direction
        };
        soundManager.playBonusShip(); // Play bonus ship sound
    }
}

function moveBonusShip() {
    if (bonusShip) {
        bonusShip.x += bonusShip.speed;
        if (bonusShip.x > canvas.width || bonusShip.x + bonusShip.width < 0) {
            bonusShip = null;
        }
    }
}

function drawBonusShip() {
    if (bonusShip && loadedImages.bonus_saucer) {
        drawImage(loadedImages.bonus_saucer, bonusShip.x, bonusShip.y, bonusShip.width, bonusShip.height);
    }
}

// Point values for invaders and bonus ship
const INVADER_POINTS = { small: 150, medium: 100, large: 50 };
const BONUS_SHIP_POINTS = 2500;

// Track key states for smooth movement and shooting
let keys = {};

// High score logic
let highScores = JSON.parse(localStorage.getItem('spaceClashHighScores') || '[]');
const maxHighScores = 10;

function showHighScoreEntry(finalScore) {
    document.getElementById('highScoreEntry').style.display = 'flex';
    document.getElementById('entryScore').textContent = finalScore;
    document.getElementById('playerNameInput').value = '';
    document.getElementById('playerNameInput').focus();
}

function updateHighScoreHighlight() {
    const list = document.getElementById('highScoreHighlightList');
    if (!list) return;
    list.innerHTML = '';
    highScores.forEach((entry, i) => {
        const li = document.createElement('li');
        let text = `${entry.name.padEnd(10, ' ')} - ${isNaN(entry.score) ? 0 : entry.score} - LEVEL ${entry.level || 1}`;
        if (i === 0) text += ' 👑';
        li.textContent = text;
        list.appendChild(li);
    });
}

window.addEventListener('DOMContentLoaded', updateHighScoreHighlight);

function submitHighScore(finalScore) {
    let name = document.getElementById('playerNameInput').value.trim().substring(0, 10).toUpperCase();
    // Only allow letters and numbers
    name = name.replace(/[^A-Z0-9]/gi, '');
    if (!name) name = 'PLAYER';
    highScores.push({ name, score: finalScore, level });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, maxHighScores);
    localStorage.setItem('spaceClashHighScores', JSON.stringify(highScores));
    showHighScoreBoard();
    updateHighScoreHighlight();
}

function showHighScoreBoard() {
    const board = document.getElementById('highScoreBoard');
    const list = document.getElementById('highScoreList');
    list.innerHTML = '';
    highScores.forEach((entry, i) => {
        const li = document.createElement('li');
        let text = `${entry.name.padEnd(10, ' ')} - ${isNaN(entry.score) ? 0 : entry.score} - LEVEL ${entry.level || 1}`;
        if (i === 0) text += ' 👑';
        li.textContent = text;
        list.appendChild(li);
    });
    board.style.display = 'flex';
}

document.getElementById('closeHighScoreButton').onclick = function() {
    document.getElementById('highScoreBoard').style.display = 'none';
};

// --- Sound Manager (Web Audio API) ---
class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEffects') !== 'false';
        this.ctx = null;
    }
    getContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.ctx;
    }
    playShoot() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = 520;
        g.gain.value = 0.12;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.08);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.09);
        o.stop(ctx.currentTime + 0.09);
    }
    playInvaderHit() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 180;
        g.gain.value = 0.18;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.13);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.14);
        o.stop(ctx.currentTime + 0.14);
    }
    playBonusShip() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 300;
        g.gain.value = 0.16;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.18);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.19);
        o.stop(ctx.currentTime + 0.19);
    }
    setEnabled(val) {
        this.enabled = val;
    }
}
const soundManager = new SoundManager();
window.soundManager = soundManager;
window.addEventListener('storage', (e) => {
    if (e.key === 'soundEffects') {
        soundManager.setEnabled(localStorage.getItem('soundEffects') !== 'false');
    }
});

// --- Explosion Aura System ---
let explosionAuras = [];
function createExplosionAura(x, y, type = 'normal') {
    const aura = {
        x, y,
        frame: 0,
        maxFrames: type === 'bonus' ? 32 : 16,
        color: type === 'bonus' ? ['#ffd700', '#ff00ff', '#00fff7'] : ['#00ff00', '#00ff00'],
        size: type === 'bonus' ? 60 : 32,
        rings: type === 'bonus' ? 4 : 2,
        spikes: type === 'bonus' ? 18 : 8,
        type
    };
    explosionAuras.push(aura);
}
function drawExplosionAuras() {
    for (let i = explosionAuras.length - 1; i >= 0; i--) {
        const aura = explosionAuras[i];
        const progress = aura.frame / aura.maxFrames;
        for (let r = 0; r < aura.rings; r++) {
            const radius = aura.size * (progress + r / aura.rings);
            const alpha = 0.5 * (1 - progress) * (1 - r / aura.rings);
            const color = aura.color[r % aura.color.length];
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            for (let s = 0; s < aura.spikes; s++) {
                const angle = (2 * Math.PI * s) / aura.spikes;
                const spikeLen = radius * (1 + 0.2 * Math.sin(aura.frame + s));
                const px = aura.x + Math.cos(angle) * spikeLen;
                const py = aura.y + Math.sin(angle) * spikeLen;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        aura.frame++;
        if (aura.frame > aura.maxFrames) {
            explosionAuras.splice(i, 1);
        }
    }
}

// --- Floating Score Popups ---
let floatingScores = [];
function createFloatingScore(x, y, value) {
    floatingScores.push({
        x, y,
        value,
        frame: 0,
        maxFrames: 36
    });
}
function drawFloatingScores() {
    for (let i = floatingScores.length - 1; i >= 0; i--) {
        const score = floatingScores[i];
        const progress = score.frame / score.maxFrames;
        const alpha = 1 - progress;
        const yOffset = -30 * progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 28px Orbitron, Arial, sans-serif';
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(score.value, score.x, score.y + yOffset);
        ctx.fillText(score.value, score.x, score.y + yOffset);
        ctx.restore();
        score.frame++;
        if (score.frame > score.maxFrames) {
            floatingScores.splice(i, 1);
        }
    }
}

// --- Level Overlay System ---
let levelOverlay = null;
let overlayCallback = null;
function showLevelOverlay(level, callback) {
    levelOverlay = {
        text: `Level ${level}`,
        frame: 0,
        maxFrames: 72 // 1.2 seconds at 60 FPS
    };
    overlayCallback = callback;
}
function drawLevelOverlay() {
    if (!levelOverlay) return;
    const progress = levelOverlay.frame / levelOverlay.maxFrames;
    let alpha = 1;
    if (progress < 0.15) alpha = progress / 0.15; // Fade in
    else if (progress > 0.85) alpha = (1 - progress) / 0.15; // Fade out
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 54px Orbitron, Arial, sans-serif';
    ctx.fillStyle = '#00fff7';
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(levelOverlay.text, canvas.width/2, canvas.height/2);
    ctx.fillText(levelOverlay.text, canvas.width/2, canvas.height/2);
    ctx.restore();
    levelOverlay.frame++;
    if (levelOverlay.frame > levelOverlay.maxFrames) {
        levelOverlay = null;
        if (typeof overlayCallback === 'function') {
            overlayCallback();
            overlayCallback = null;
        }
    }
}

// Remove setInterval(gameLoop) and use requestAnimationFrame for the main loop
let animationFrameId = null;
function mainLoop() {
    update();
    animationFrameId = requestAnimationFrame(mainLoop);
}

// --- Invader Shooting System ---
let invaderProjectiles = [];
const INVADER_PROJECTILE_WIDTH = 4;
const INVADER_PROJECTILE_HEIGHT = 16;
const MAX_INVADER_PROJECTILES = 3;

function getBottomInvaders() {
    const columns = {};
    enemies.forEach(enemy => {
        const col = Math.round(enemy.x / 60); // 60px spacing per column
        if (!columns[col] || enemy.y > columns[col].y) {
            columns[col] = enemy;
        }
    });
    return Object.values(columns);
}

function invaderShoot() {
    if (invaderProjectiles.length >= MAX_INVADER_PROJECTILES) return;
    const shooters = getBottomInvaders();
    if (shooters.length === 0) return;
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    invaderProjectiles.push({
        x: shooter.x + shooter.width / 2 - INVADER_PROJECTILE_WIDTH / 2,
        y: shooter.y + shooter.height,
        width: INVADER_PROJECTILE_WIDTH,
        height: INVADER_PROJECTILE_HEIGHT
    });
    // Optionally play a sound here
}

let invaderShootInterval = null;
function scheduleInvaderShooting() {
    if (invaderShootInterval) clearInterval(invaderShootInterval);
    if (level < 3) return; // No shooting before level 3
    // Firing rate: starts at 2s, decreases by 0.2s every 2 levels, min 0.7s
    let rate = Math.max(2000 - Math.floor((level - 3) / 2) * 200, 700);
    invaderShootInterval = setInterval(invaderShoot, rate);
}

function moveInvaderProjectiles() {
    for (let i = invaderProjectiles.length - 1; i >= 0; i--) {
        invaderProjectiles[i].y += 7;
        if (invaderProjectiles[i].y > canvas.height) {
            invaderProjectiles.splice(i, 1);
        }
    }
}

function drawInvaderProjectiles() {
    ctx.save();
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff00ff';
    invaderProjectiles.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    ctx.restore();
}

// Check for collision with player
function checkInvaderProjectileCollisions() {
    for (let i = invaderProjectiles.length - 1; i >= 0; i--) {
        const p = invaderProjectiles[i];
        if (
            p.x < player.x + player.width &&
            p.x + p.width > player.x &&
            p.y < player.y + player.height &&
            p.y + p.height > player.y
        ) {
            invaderProjectiles.splice(i, 1);
            gameStarted = false;
            showGameOver();
            return;
        }
    }
}

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    player = { x: canvas.width / 2, y: canvas.height - 50, width: 42, height: 35 };
    enemies = [];
    projectiles = [];
    invaderProjectiles = [];
    score = score || 0; // Keep score across levels
    createEnemies();
    gameStarted = false;
    bonusShip = null;
    scheduleBonusShips(); // Schedule bonus ships for this level
    scheduleInvaderShooting(); // Schedule invader shooting for this level
    // Only show level overlay if it's the first level
    if (level === 1) {
        showLevelOverlay(level, () => {
            gameStarted = true;
        });
    } else {
        gameStarted = true;
    }
    if (!animationFrameId) mainLoop();
}

// Create enemies
function createEnemies() {
    enemies = [];
    const columns = 10;
    const rows = 4;
    const projectileWidth = 4;
    const horizontalSpacing = projectileWidth * 2; // 8 pixels
    const verticalSpacing = 20;
    const maxInvaderWidth = 52;
    let startX = 60;
    let startY = 20;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            let type, width, height;
            if (i === 0 || i === 1) { // Top two rows: small
                type = 'small'; width = 45; height = 47;
            } else if (i === 2) { // Third row: medium
                type = 'medium'; width = 49; height = 52;
            } else { // Bottom row: large
                type = 'large'; width = 52; height = 56;
            }
            let x = startX + j * (maxInvaderWidth + horizontalSpacing);
            let y = startY + i * (height + verticalSpacing);
            enemies.push({ x, y, width, height, type });
        }
    }
}

// Remove drawBackground sunset gradient and use black background
function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Move projectiles upward and remove off-screen ones
function moveProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= 8; // Move up by 8 pixels per frame
        if (projectiles[i].y + projectiles[i].height < 0) {
            projectiles.splice(i, 1);
        }
    }
}

// Add a pause flag for enemy movement
let enemyPaused = false;

// Draw the game over threshold line just above the player's ship
function drawGameOverLine() {
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.setLineDash([]); // Solid line
    ctx.beginPath();
    ctx.moveTo(0, player.y);
    ctx.lineTo(canvas.width, player.y);
    ctx.stroke();
    ctx.restore();
}

// Update game state
function update() {
    drawBackground();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    if (levelOverlay) {
        drawLevelOverlay();
        return;
    }
    if (gameStarted) {
        handlePlayerMovement();
        if (!enemyPaused) {
        moveEnemies();
    }
        moveProjectiles();
        moveBonusShip();
        moveInvaderProjectiles();
    }
    drawGameOverLine();
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    drawBonusShip();
    drawExplosionAuras();
    drawFloatingScores();
    drawInvaderProjectiles();
    checkCollisions();
    checkInvaderProjectileCollisions();
    drawScore();
    checkLevelComplete();
}

// Get modal elements
const gameOverModal = document.getElementById('gameOverModal');
const gameOverText = document.getElementById('gameOverText');
const playAgainButton = document.getElementById('playAgainButton');

// --- Social Sharing in High Score Entry ---
window.addEventListener('DOMContentLoaded', function() {
    function getShareData() {
        const name = document.getElementById('playerNameInput').value.trim() || 'PLAYER';
        const score = document.getElementById('entryScore').textContent || 0;
        const level = window.level || 1;
        const url = window.location.href.split('#')[0];
        const msg = `${name} scored ${score} points and reached Level ${level} in Space Clash 2.0! Play here: ${url}`;
        return { name, score, level, url, msg };
    }
    document.getElementById('twitterShareButtonEntry').onclick = function() {
        const { msg, url } = getShareData();
        const text = encodeURIComponent(msg.replace('Play here: ', ''));
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    };
    document.getElementById('facebookShareButtonEntry').onclick = function() {
        const { msg, url } = getShareData();
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(msg)}`, '_blank');
    };
    document.getElementById('redditShareButtonEntry').onclick = function() {
        const { msg, url } = getShareData();
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(msg)}`, '_blank');
    };
    document.getElementById('whatsappShareButtonEntry').onclick = function() {
        const { msg, url } = getShareData();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };
    document.getElementById('copyLinkButtonEntry').onclick = function() {
        const { msg } = getShareData();
        navigator.clipboard.writeText(msg).then(() => {
            document.getElementById('copyStatus').textContent = 'Copied!';
        }, () => {
            document.getElementById('copyStatus').textContent = 'Copy failed.';
        });
    };
});

// Show share overlay after game over
function showGameOver() {
    gameOverText.textContent = `Game Over! Your score: ${score}`;
    gameOverModal.style.display = 'flex';
    startButton.disabled = false;
    bonusShipTimers.forEach(timer => clearTimeout(timer));
    bonusShipTimers = [];
    if (invaderShootInterval) clearInterval(invaderShootInterval);
    invaderShootInterval = null;
    // Show share overlay after high score check
    if (highScores.length < maxHighScores || score > highScores[highScores.length - 1].score) {
        setTimeout(() => {
            gameOverModal.style.display = 'none';
            showHighScoreEntry(score);
        }, 1000);
    }
}

// Play again button logic
playAgainButton.onclick = function() {
    gameOverModal.style.display = 'none';
    enemySpeed = 1;
    enemyDirection = 1;
    level = 1;
    score = 0;
    startButton.disabled = false;
    init();
};

// Update moveEnemies to use adaptive enemy speed
function moveEnemies() {
    let reachedBoundary = false;
    enemies.forEach(enemy => {
        enemy.x += baseEnemySpeed * enemyDirection;
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            reachedBoundary = true;
        }
    });
    if (reachedBoundary) {
        enemyDirection *= -1; // Change direction
        enemies.forEach(enemy => {
            enemy.y += 20; // Drop down
        });
    }
    // Check if any enemy touches the player's ship
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height >= player.y) {
            gameStarted = false;
            showGameOver();
        }
    });
}

// Draw player
function drawPlayer() {
    const img = loadedImages.player;
    if (img) drawImage(img, player.x, player.y, player.width, player.height);
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        let img;
        if (enemy.type === 'small') img = loadedImages.invader_small;
        else if (enemy.type === 'medium') img = loadedImages.invader_medium;
        else img = loadedImages.invader_large;
        if (img) drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Draw projectiles (make them more visible)
function drawProjectiles() {
    ctx.save();
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'lime';
    projectiles.forEach(projectile => {
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    });
    ctx.restore();
}

// Update shootProjectile to play sound
function shootProjectile() {
    // Only allow one projectile at a time (classic style)
    if (!projectiles.some(p => p.fromPlayer)) {
        projectiles.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, fromPlayer: true });
        soundManager.playShoot();
    }
}

// Update checkCollisions to track enemies killed
function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y
            ) {
                projectiles.splice(i, 1);
                enemies.splice(j, 1);
                score += INVADER_POINTS[enemy.type] || 0;
                enemiesKilled++; // Track enemies killed
                hits++;
                totalShots++;
                playerAccuracy = hits / totalShots;
                baseEnemySpeed = 1 + (playerAccuracy * 0.5);
                baseSpawnRate = 0.001 + (playerAccuracy * 0.0005);
                soundManager.playInvaderHit();
                enemyPaused = true;
                setTimeout(() => { enemyPaused = false; }, 200);
                createExplosionAura(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'normal');
                createFloatingScore(enemy.x + enemy.width/2, enemy.y + enemy.height/2, INVADER_POINTS[enemy.type] || 0);
                return;
            }
        }
        // Bonus ship collision
        if (bonusShip &&
            projectile.x < bonusShip.x + bonusShip.width &&
            projectile.x + projectile.width > bonusShip.x &&
            projectile.y < bonusShip.y + bonusShip.height &&
            projectile.y + projectile.height > bonusShip.y
        ) {
            score += BONUS_SHIP_POINTS;
            projectiles.splice(i, 1);
            createExplosionAura(bonusShip.x + bonusShip.width/2, bonusShip.y + bonusShip.height/2, 'bonus');
            createFloatingScore(bonusShip.x + bonusShip.width/2, bonusShip.y + bonusShip.height/2, BONUS_SHIP_POINTS);
            bonusShip = null; // Clear the bonus ship
            return;
        }
    }
}

// Draw score
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('Level: ' + level, 10, 60);
    updateScoreBox();
}

// Remove demo/purchase dialog from checkDemoTime
function checkDemoTime() {
    // No-op: demo/purchase dialog removed
}

// Check for level completion
function checkLevelComplete() {
    if (enemies.length === 0) {
        gameStarted = false;
        showLevelOverlay(level + 1, () => {
            level++;
            enemySpeed = 1 + (level - 1) * 0.2; // Slightly faster each level
            enemyDirection = 1;
            bonusShip = null;
            init();
        });
    }
}

// Handle player movement with increased speed
function handlePlayerMovement() {
    const moveSpeed = 16; // Increased speed
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += moveSpeed;
    // Clamp player position to canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
}

// Update event listeners for keydown and keyup
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        shootProjectile();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start button
const startButton = document.getElementById('startButton');
startButton.disabled = false;
startButton.onclick = function() {
    startButton.disabled = true;
    if (allImagesLoaded) init();
};

// Hide game over and high score modals on page load
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('highScoreEntry').style.display = 'none';
    document.getElementById('highScoreBoard').style.display = 'none';
});

// Prevent scrolling for arrow keys and spacebar
window.addEventListener('keydown', function(e) {
    if (["ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
    }
}, { passive: false }); 

// --- Contextual Tip System ---
function showTip(message, duration = 3000) {
    const tipContainer = document.getElementById('tipContainer');
    if (!tipContainer) return;
    tipContainer.textContent = message;
    tipContainer.classList.add('show');
    clearTimeout(tipContainer._hideTimeout);
    tipContainer._hideTimeout = setTimeout(() => {
        tipContainer.classList.remove('show');
    }, duration);
}

const rotatingTips = [
  "Tip: Hit the bonus ship for a huge score boost!",
  "Pro: Clear invaders from the edges to slow their descent.",
  "Did you know? Each wave gets a little faster!",
  "Try to keep your shots accurate for a higher score.",
  "Fun Fact: Space Clash 2.0 is 100% front-end magic!",
  "Stay sharp! Invaders speed up as their numbers dwindle.",
  "Share your high score with friends for bragging rights!",
  "Support the game with BuyMeACoffee and keep the stars shining!"
];
let currentTipIndex = 0;
function showNextRotatingTip() {
  const box = document.getElementById('rotatingTipBox');
  if (!box) return;
  box.textContent = rotatingTips[currentTipIndex];
  currentTipIndex = (currentTipIndex + 1) % rotatingTips.length;
}
setInterval(showNextRotatingTip, 5000); // Change tip every 5 seconds
window.addEventListener('DOMContentLoaded', showNextRotatingTip);

function updateScoreBox() {
    const scoreBox = document.getElementById('scoreBoxValue');
    if (scoreBox) scoreBox.textContent = score;
    const scoreBoxLevel = document.getElementById('scoreBoxLevel');
    if (scoreBoxLevel) scoreBoxLevel.textContent = level;
}

// Also update score box on DOMContentLoaded
window.addEventListener('DOMContentLoaded', updateScoreBox);

document.getElementById('submitScoreButton').onclick = function() {
    let finalScore = parseInt(document.getElementById('entryScore').textContent, 10);
    if (isNaN(finalScore)) finalScore = 0;
    submitHighScore(finalScore);
    document.getElementById('highScoreEntry').style.display = 'none';
}; 