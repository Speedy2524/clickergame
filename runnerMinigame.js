// runnerMinigame.js
import { gameState, updateUI as updateMainUI, formatNumber } from './game.js';

let canvas, ctx;
let player, obstacles, collectibles;
let score, gameSpeed, lanes, currentLane;
let gameLoopId = null; // To store the requestAnimationFrame ID
let spawnIntervalId = null;
let isGameOver;
let gameHasStarted = false; // To track if the game has been started at least once

const LANE_COUNT = 3;
let LANE_WIDTH; // Will be canvas.width / LANE_COUNT
const PLAYER_WIDTH_RATIO = 0.15; // Player width as a ratio of canvas width
const PLAYER_HEIGHT_RATIO = 0.1;  // Player height as a ratio of canvas height
let PLAYER_WIDTH, PLAYER_HEIGHT;

const OBSTACLE_SIZE_RATIO = 0.1; // Obstacle size as a ratio of LANE_WIDTH
const COLLECTIBLE_SIZE_RATIO = 0.07; // Collectible size as a ratio of LANE_WIDTH
let OBSTACLE_SIZE, COLLECTIBLE_SIZE;

// DOM Elements for the minigame UI
let runnerScoreEl, startRunnerButtonEl, runnerGameOverEl;

function calculateSizes() {
    LANE_WIDTH = canvas.width / LANE_COUNT;
    PLAYER_WIDTH = canvas.width * PLAYER_WIDTH_RATIO;
    PLAYER_HEIGHT = canvas.height * PLAYER_HEIGHT_RATIO;
    OBSTACLE_SIZE = LANE_WIDTH * OBSTACLE_SIZE_RATIO;
    COLLECTIBLE_SIZE = LANE_WIDTH * COLLECTIBLE_SIZE_RATIO;
}

function initPlayer() {
    lanes = [];
    for (let i = 0; i < LANE_COUNT; i++) {
        lanes.push((i * LANE_WIDTH) + (LANE_WIDTH / 2));
    }
    currentLane = Math.floor(LANE_COUNT / 2); // Start in the middle lane
    player = {
        x: lanes[currentLane] - PLAYER_WIDTH / 2,
        y: canvas.height - PLAYER_HEIGHT - 10,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        color: '#3498db' // Blue
    };
}

function spawnObstacle() {
    const laneIndex = Math.floor(Math.random() * LANE_COUNT);
    obstacles.push({
        x: lanes[laneIndex] - OBSTACLE_SIZE / 2,
        y: -OBSTACLE_SIZE,
        width: OBSTACLE_SIZE,
        height: OBSTACLE_SIZE,
        color: '#e74c3c', // Red
    });
}

function spawnCollectible() {
    const laneIndex = Math.floor(Math.random() * LANE_COUNT);
    // Basic check to avoid spawning collectible directly on an obstacle if one just spawned there
    // This is a simple check; more sophisticated logic might be needed for perfect placement
    if (obstacles.some(obs => obs.y < COLLECTIBLE_SIZE * 2 && Math.abs(obs.x - (lanes[laneIndex] - COLLECTIBLE_SIZE / 2)) < LANE_WIDTH / 2)) {
        return; // Skip spawning if too close to a new obstacle in the same lane
    }
    collectibles.push({
        x: lanes[laneIndex] - COLLECTIBLE_SIZE / 2,
        y: -COLLECTIBLE_SIZE,
        width: COLLECTIBLE_SIZE,
        height: COLLECTIBLE_SIZE,
        color: '#f1c40f', // Yellow
        value: 10 // Score value
    });
}

function updateGameObjects() {
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += gameSpeed;
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }

    // Move collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].y += gameSpeed;
        if (collectibles[i].y > canvas.height) {
            collectibles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Player vs Obstacles
    for (let obs of obstacles) {
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            triggerGameOver();
            return;
        }
    }

    // Player vs Collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        let coll = collectibles[i];
        if (
            player.x < coll.x + coll.width &&
            player.x + player.width > coll.x &&
            player.y < coll.y + coll.height &&
            player.y + player.height > coll.y
        ) {
            score += coll.value;
            collectibles.splice(i, 1);
            if(runnerScoreEl) runnerScoreEl.textContent = score;
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawGameObjects() {
    for (let obs of obstacles) {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
    for (let coll of collectibles) {
        ctx.fillStyle = coll.color;
        ctx.beginPath();
        ctx.arc(coll.x + coll.width / 2, coll.y + coll.height / 2, coll.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameTick() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateGameObjects();
    checkCollisions(); 

    if (isGameOver) return; 

    drawPlayer();
    drawGameObjects();

    gameLoopId = requestAnimationFrame(gameTick);
}

function startGame() {
    gameHasStarted = true;
    isGameOver = false;
    score = 0;
    gameSpeed = canvas.height * 0.0075; // Adjust speed based on canvas height
    obstacles = [];
    collectibles = [];
    calculateSizes(); // Recalculate sizes based on current canvas dimensions
    initPlayer();

    if(runnerScoreEl) runnerScoreEl.textContent = score;
    if(runnerGameOverEl) runnerGameOverEl.style.display = 'none';
    if(startRunnerButtonEl) startRunnerButtonEl.textContent = 'Spiel läuft...';
    if(startRunnerButtonEl) startRunnerButtonEl.disabled = true;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (spawnIntervalId) clearInterval(spawnIntervalId);

    spawnIntervalId = setInterval(() => {
        if (isGameOver) return;
        if (Math.random() < 0.65) spawnObstacle(); // Slightly adjusted spawn rates
        if (Math.random() < 0.45) spawnCollectible();
    }, 1200 - (gameSpeed * 50)); // Spawning rate increases with speed, ensure it doesn't get too fast

    gameLoopId = requestAnimationFrame(gameTick);
}

function triggerGameOver() {
    isGameOver = true;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (spawnIntervalId) clearInterval(spawnIntervalId);

    if(runnerGameOverEl) runnerGameOverEl.style.display = 'block';
    if(startRunnerButtonEl) startRunnerButtonEl.textContent = 'Neustart';
    if(startRunnerButtonEl) startRunnerButtonEl.disabled = false;

    const spEarned = Math.floor(score / 10); // 1 SP for every 10 points
    gameState.sp += spEarned;
    
    let rewardMessage = `Spiel vorbei!`;
    if (score > 150 && Math.random() < 0.05) { // 5% chance for UV if score > 150
        gameState.uv += 1;
        rewardMessage = `Super Lauf! Du hast ${formatNumber(spEarned)} SP und 1 UV gewonnen!`;
    } else if (spEarned > 0) {
        rewardMessage = `Spiel vorbei! Du hast ${formatNumber(spEarned)} SP gewonnen.`;
    }
    // alert(rewardMessage); // Consider displaying this in the game over message instead of an alert
    if(runnerGameOverEl) runnerGameOverEl.textContent = `Game Over! ${rewardMessage.replace('Spiel vorbei! ', '')} Score: ${score}`;


    updateMainUI();
}

function movePlayer(direction) {
    if (isGameOver || !gameHasStarted) return;
    if (direction === 'left') {
        currentLane = Math.max(0, currentLane - 1);
    } else if (direction === 'right') {
        currentLane = Math.min(LANE_COUNT - 1, currentLane + 1);
    }
    player.x = lanes[currentLane] - PLAYER_WIDTH / 2;
}

export function initRunnerMinigame() {
    canvas = document.getElementById('runnerCanvas');
    if (!canvas) { console.error("Runner canvas not found!"); return; }
    ctx = canvas.getContext('2d');

    runnerScoreEl = document.getElementById('runner-score');
    startRunnerButtonEl = document.getElementById('start-runner-button');
    runnerGameOverEl = document.getElementById('runner-game-over');

    if (startRunnerButtonEl) startRunnerButtonEl.addEventListener('click', startGame);

    window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('runner-minigame-modal');
        if (modal && modal.style.display !== 'none' && gameHasStarted && !isGameOver) {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') movePlayer('left');
            else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') movePlayer('right');
        }
    });
    
    canvas.addEventListener('click', (e) => {
        if (isGameOver || !gameHasStarted) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < canvas.width / 2) movePlayer('left');
        else movePlayer('right');
    });

    console.log("Runner Minigame Initialisiert!");
    drawInitialMessage();
}

function drawInitialMessage() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Klicke Start!', canvas.width / 2, canvas.height / 2);
}

export function openRunnerMinigame() {
    const modal = document.getElementById('runner-minigame-modal');
    if (modal) {
        modal.style.display = 'flex';
        calculateSizes(); // Calculate sizes when modal opens, in case of resize
        if (!gameHasStarted || isGameOver) {
             if(runnerGameOverEl) runnerGameOverEl.textContent = 'Game Over!'; // Reset message
             if(runnerGameOverEl) runnerGameOverEl.style.display = 'none';
             if(startRunnerButtonEl) startRunnerButtonEl.textContent = 'Spiel starten';
             if(startRunnerButtonEl) startRunnerButtonEl.disabled = false;
             if(runnerScoreEl) runnerScoreEl.textContent = '0';
             drawInitialMessage();
        }
    }
}