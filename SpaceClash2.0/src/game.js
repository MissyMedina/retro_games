// Import enhanced modules
import { PlayerMetrics } from './metrics.js';
import { DifficultyManager } from './difficulty.js';
import { FractalRenderer } from './fractal.js';
import { UIManager } from './ui.js';
import { SocialManager } from './social.js';

// Game variables
let canvas, ctx;
let player, enemies, projectiles, score;
let gameLoop;
let isDemo = true;
let demoTime = 300;
let gameStarted = false;
let enemyDirection = 1;
let enemySpeed = 1;
let level = 1;
let enemyPaused = false;

// Enhanced managers
let metrics;
let difficulty;
let fractal;
let ui;
let social;

// Sprite image loading
const images = {
    player: { src: '../assets/player_ship1-42x35.png', width: 42, height: 35 },
    invader_small: { src: '../assets/invader_small1-45x47.png', width: 45, height: 47 },
    invader_medium: { src: '../assets/invader_medium1-49x52.png', width: 49, height: 52 },
    invader_large: { src: '../assets/invader_large1-52x56.png', width: 52, height: 56 },
    bonus_saucer: { src: '../assets/bonus_saucer1-42x23.png', width: 42, height: 23 }
};

// Preload images
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
            document.getElementById('startButton').disabled = false;
        }
    };
});

// Initialize enhanced features
function initEnhancedFeatures() {
    metrics = new PlayerMetrics();
    difficulty = new DifficultyManager();
    fractal = new FractalRenderer(canvas);
    ui = new UIManager();
    social = new SocialManager();
    
    fractal.initStarfield();
    ui.showRandomTip();
}

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    player = { x: canvas.width / 2, y: canvas.height - 50, width: 42, height: 35 };
    enemies = [];
    projectiles = [];
    score = score || 0;
    
    initEnhancedFeatures();
    createEnemies();
    gameStarted = true;
    gameLoop = setInterval(update, 1000 / 60);
}

// Create enemies with fractal pattern
function createEnemies() {
    enemies = [];
    const pattern = difficulty.generateWavePattern(metrics.getEngagementIndex());
    let startX = 60;
    let startY = 20;
    
    pattern.forEach((row, i) => {
        for (let j = 0; j < row.count; j++) {
            const x = startX + j * (row.spacing + images[`invader_${row.type}`].width);
            const y = startY + i * (images[`invader_${row.type}`].height + 20);
            enemies.push({
                x, y,
                width: images[`invader_${row.type}`].width,
                height: images[`invader_${row.type}`].height,
                type: row.type
            });
        }
    });
}

// Update game state
function update() {
    // Draw fractal background
    fractal.drawStarfield();
    
    if (gameStarted) {
        handlePlayerMovement();
    }
    
    if (gameStarted && !enemyPaused) {
        moveEnemies();
    }
    
    if (gameStarted) {
        moveProjectiles();
        if (!bonusShip && bonusShipAppearances < bonusShipMaxAppearances && Math.random() < 0.001) {
            spawnBonusShip();
        }
        moveBonusShip();
    }
    
    // Draw game elements
    drawPlayer();
    drawEnemies();
    drawProjectiles();
    drawBonusShip();
    fractal.drawExplosionAuras();
    drawScore();
    
    // Check collisions
    checkCollisions();
    
    // Update difficulty
    if (enemies.length > 0) {
        const newPattern = difficulty.adjustDifficulty(metrics);
        if (newPattern) {
            // Update enemy speeds
            enemySpeed = difficulty.currentSpeed;
        }
    }
    
    // Show progress overlay periodically
    if (Math.random() < 0.001) {
        ui.showProgressOverlay({
            waveStreak: metrics.waveStreak,
            accuracy: metrics.accuracy.hits / metrics.accuracy.shots,
            nextLevel: level + 1
        });
    }
}

// Handle player shooting
function shootProjectile() {
    if (gameStarted) {
        metrics.trackShot(false); // Track shot attempt
        projectiles.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10
        });
    }
}

// Check collisions with enhanced effects
function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Check enemy collisions
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (isColliding(projectile, enemy)) {
                // Create explosion aura
                fractal.createExplosionAura(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'normal');
                
                // Update metrics
                metrics.trackShot(true);
                
                // Update score
                score += INVADER_POINTS[enemy.type];
                
                // Remove projectile and enemy
                projectiles.splice(i, 1);
                enemies.splice(j, 1);
                
                // Show milestone tip for first kill
                if (enemies.length === 39) { // First kill in a wave
                    ui.showMilestoneTip('firstKill');
                }
                
                break;
            }
        }
        
        // Check bonus ship collision
        if (bonusShip && isColliding(projectile, bonusShip)) {
            fractal.createExplosionAura(bonusShip.x + bonusShip.width/2, bonusShip.y + bonusShip.height/2, 'bonus');
            score += BONUS_SHIP_POINTS;
            projectiles.splice(i, 1);
            bonusShip = null;
            ui.showMilestoneTip('bonusShip');
        }
    }
}

// Check level completion with enhanced features
function checkLevelComplete() {
    if (enemies.length === 0) {
        metrics.trackWaveComplete();
        level++;
        
        // Show milestone tips
        if (metrics.waveStreak === 3) {
            ui.showMilestoneTip('streak3');
        } else if (metrics.waveStreak === 5) {
            ui.showMilestoneTip('streak5');
        }
        
        enemyPaused = true; // Pause enemy movement
        setTimeout(() => {
            createEnemies();
            enemyPaused = false; // Resume after 2 seconds
        }, 2000);
    }
}

// Show game over with social features
function showGameOver() {
    clearInterval(gameLoop);
    gameStarted = false;
    
    const finalScore = score;
    document.getElementById('gameOverText').textContent = `Game Over! Score: ${finalScore}`;
    document.getElementById('gameOverModal').style.display = 'flex';
    
    // Check for high score
    const highScores = JSON.parse(localStorage.getItem('spaceClashHighScores') || '[]');
    if (highScores.length < 10 || finalScore > highScores[highScores.length - 1].score) {
        showHighScoreEntry(finalScore);
    } else {
        // Show share card
        social.createShareCard(finalScore);
    }
}

// Submit high score with social features
function submitHighScore(finalScore) {
    let name = document.getElementById('playerNameInput').value.trim().substring(0, 10).toUpperCase();
    name = name.replace(/[^A-Z0-9]/gi, '');
    if (!name) name = 'PLAYER';
    
    // Save to both local and room leaderboards
    social.saveScore(name, finalScore);
    
    // Update high score display
    showHighScoreBoard();
    document.getElementById('highScoreEntry').style.display = 'none';
    
    // Show share card
    social.createShareCard(finalScore);
}

// Drawing functions
function drawPlayer() {
    if (!player) return;
    const img = loadedImages['player'];
    if (img) {
        ctx.drawImage(img, player.x, player.y, player.width, player.height);
    }
}

function drawEnemies() {
    if (!enemies) return;
    enemies.forEach(enemy => {
        const img = loadedImages[`invader_${enemy.type}`];
        if (img) {
            ctx.drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawProjectiles() {
    if (!projectiles) return;
    ctx.fillStyle = '#fff';
    projectiles.forEach(p => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
}

function drawBonusShip() {
    if (!bonusShip) return;
    const img = loadedImages['bonus_saucer'];
    if (img) {
        ctx.drawImage(img, bonusShip.x, bonusShip.y, bonusShip.width, bonusShip.height);
    }
}

function drawScore() {
    ctx.save();
    ctx.font = '20px Courier New, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.restore();
}

// Event listeners
document.getElementById('startButton').onclick = init;
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        shootProjectile();
    }
});
document.addEventListener('click', () => {
    if (gameStarted) {
        shootProjectile();
    }
});

// Keyboard controls for player movement
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handlePlayerMovement() {
    if (!player) return;
    const speed = 5;
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= speed;
    }
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) {
        player.x += speed;
    }
}

function moveEnemies() {
    if (!enemies || enemies.length === 0) return;

    // Move all enemies horizontally
    let dx = enemySpeed * enemyDirection;
    let shouldReverse = false;

    // Check if any enemy hits the edge
    for (let enemy of enemies) {
        if ((enemy.x + dx < 0) || (enemy.x + enemy.width + dx > canvas.width)) {
            shouldReverse = true;
            break;
        }
    }

    // If at edge, reverse direction and move down
    if (shouldReverse) {
        enemyDirection *= -1;
        for (let enemy of enemies) {
            enemy.y += 20; // Move down by 20 pixels
        }
    } else {
        for (let enemy of enemies) {
            enemy.x += dx;
        }
    }
}

function moveProjectiles() {
    if (!projectiles) return;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= 8; // Move projectile up by 8 pixels
        // Remove projectile if it goes off the top
        if (projectiles[i].y + projectiles[i].height < 0) {
            projectiles.splice(i, 1);
        }
    }
} 