// wargame.js
import { gameState, updateUI as updateMainUI, formatNumber } from './game.js';

let canvas, ctx;
let playerGoldDisplay, playerBaseHpDisplay, enemyBaseHpDisplay, wargameMessageDisplay;
let unitButtonsContainer;

// --- Game State ---
let playerGold = 100;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let playerUnits = [];
let enemyUnits = [];
let projectiles = []; // Array to store active projectiles
let gameRunning = false;
let gameLoopId = null;
let playerGoldIntervalId = null;
let enemySpawnIntervalId = null;

const BASE_WIDTH = 50;
const BASE_HEIGHT = 100;
const UNIT_RADIUS = 10;
const PLAYER_BASE_X_END = BASE_WIDTH;
const ENEMY_BASE_X_START = () => canvas.width - BASE_WIDTH;
const PLAYER_SPAWN_X = BASE_WIDTH + UNIT_RADIUS + 5;
const ENEMY_SPAWN_X = () => canvas.width - BASE_WIDTH - UNIT_RADIUS - 5;
const UNIT_Y_POSITION = () => canvas.height - 50;

const ARROW_SPEED = 3;
const ARROW_DAMAGE_MODIFIER = 1; // Can be used to adjust arrow damage relative to unit's attack
const ARROW_LENGTH = 10; // For drawing the arrow line

const UNIT_TYPES = {
    soldier: { name: "Soldat", cost: 50, hp: 100, attack: 10, speed: 0.5, color: 'blue', range: UNIT_RADIUS * 2.5, attackCooldown: 1000, lastAttackTime: 0 },
    archer: { name: "Bogenschütze", cost: 75, hp: 70, attack: 8, speed: 0.4, color: 'green', range: 150, attackCooldown: 1500, lastAttackTime: 0 }
};
let enemyGold = 100;

function drawBases() {
    // Player base (left)
    ctx.fillStyle = 'darkblue';
    ctx.fillRect(0, canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);

    // Enemy base (right)
    ctx.fillStyle = 'darkred';
    ctx.fillRect(ENEMY_BASE_X_START(), canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
}

function drawUnits() {
    playerUnits.forEach(unit => {
        ctx.fillStyle = unit.color;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });

    enemyUnits.forEach(unit => {
        ctx.fillStyle = unit.color; // Consider a different color for enemy units for clarity
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawProjectiles() {
    projectiles.forEach(p => {
        ctx.strokeStyle = p.owner === 'player' ? 'lightblue' : 'lightcoral';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        // Arrow points in direction of travel
        const endX = p.x + (p.owner === 'player' ? ARROW_LENGTH : -ARROW_LENGTH);
        ctx.lineTo(endX, p.y);
        ctx.stroke();
    });
}

function updateWargameUI() {
    if (playerGoldDisplay) playerGoldDisplay.textContent = playerGold;
    if (playerBaseHpDisplay) playerBaseHpDisplay.textContent = playerBaseHP;
    if (enemyBaseHpDisplay) enemyBaseHpDisplay.textContent = enemyBaseHP;
}

function updateUnitPositions() {
    // Move player units
    playerUnits.forEach(unit => {
        let canMove = true;
        for (const enemy of enemyUnits) {
            const distance = Math.abs(unit.x - enemy.x);
            // Unit stops if an enemy is in range AND in front of it
            if (distance <= unit.range && unit.x < enemy.x) {
                canMove = false;
                break;
            }
        }
        if (canMove && unit.x + UNIT_RADIUS < ENEMY_BASE_X_START()) { // Stop before entering base if not attacking it
            unit.x += unit.speed;
        }
    });

    // Move enemy units
    enemyUnits.forEach(unit => {
        let canMove = true;
        for (const playerUnit of playerUnits) {
            const distance = Math.abs(unit.x - playerUnit.x);
            if (distance <= unit.range && unit.x > playerUnit.x) {
                canMove = false;
                break;
            }
        }
        if (canMove && unit.x - UNIT_RADIUS > PLAYER_BASE_X_END) {
            unit.x -= unit.speed;
        }
    });
}

function spawnProjectile(ownerUnit) {
    projectiles.push({
        x: ownerUnit.x + (ownerUnit.owner === 'player' ? UNIT_RADIUS : -UNIT_RADIUS),
        y: ownerUnit.y, // Fire from unit's y position
        owner: ownerUnit.owner,
        damage: ownerUnit.attack * ARROW_DAMAGE_MODIFIER,
        speed: ARROW_SPEED * (ownerUnit.owner === 'player' ? 1 : -1),
    });
}

function handleCombat() {
    const currentTime = Date.now();

    // Player units attack
    playerUnits.forEach(pUnit => {
        if (currentTime - pUnit.lastAttackTime < pUnit.attackCooldown) return;

        for (let i = enemyUnits.length - 1; i >= 0; i--) {
            const eUnit = enemyUnits[i];
            const distance = Math.abs(pUnit.x - eUnit.x);
            // Check if enemy is in range AND in front
            if (distance <= pUnit.range && pUnit.x < eUnit.x) {
                if (pUnit.type === 'archer') {
                    spawnProjectile({ ...pUnit, owner: 'player' });
                } else { // Melee
                    eUnit.hp -= pUnit.attack;
                    if (eUnit.hp <= 0) {
                        enemyUnits.splice(i, 1);
                    }
                }
                pUnit.lastAttackTime = currentTime;
                break; 
            }
        }
    });

    // Enemy units attack
    enemyUnits.forEach(eUnit => {
        if (currentTime - eUnit.lastAttackTime < eUnit.attackCooldown) return;

        for (let i = playerUnits.length - 1; i >= 0; i--) {
            const pUnit = playerUnits[i];
            const distance = Math.abs(eUnit.x - pUnit.x);
            if (distance <= eUnit.range && eUnit.x > pUnit.x) {
                if (eUnit.type === 'archer') {
                    spawnProjectile({ ...eUnit, owner: 'enemy' });
                } else { // Melee
                    pUnit.hp -= eUnit.attack;
                    if (pUnit.hp <= 0) {
                        playerUnits.splice(i, 1);
                    }
                }
                eUnit.lastAttackTime = currentTime;
                break;
            }
        }
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.speed;

        let hit = false;
        if (p.owner === 'player') {
            for (let j = enemyUnits.length - 1; j >= 0; j--) {
                const eUnit = enemyUnits[j];
                // Collision check: projectile x is within enemy unit's x bounds, and y is close
                if (p.x >= eUnit.x - UNIT_RADIUS && p.x <= eUnit.x + UNIT_RADIUS && Math.abs(p.y - eUnit.y) < UNIT_RADIUS * 1.5) {
                    eUnit.hp -= p.damage;
                    if (eUnit.hp <= 0) {
                        enemyUnits.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }
        } else { // Enemy projectile
            for (let j = playerUnits.length - 1; j >= 0; j--) {
                const pUnit = playerUnits[j];
                if (p.x >= pUnit.x - UNIT_RADIUS && p.x <= pUnit.x + UNIT_RADIUS && Math.abs(p.y - pUnit.y) < UNIT_RADIUS * 1.5) {
                    pUnit.hp -= p.damage;
                    if (pUnit.hp <= 0) {
                        playerUnits.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }
        }

        if (hit || p.x < -ARROW_LENGTH || p.x > canvas.width + ARROW_LENGTH) {
            projectiles.splice(i, 1);
        }
    }
}


function handleBaseAttacks() {
    // Player units attack enemy base
    for (let i = playerUnits.length - 1; i >= 0; i--) {
        const unit = playerUnits[i];
        if (unit.x + UNIT_RADIUS >= ENEMY_BASE_X_START()) {
            enemyBaseHP -= unit.attack;
            playerUnits.splice(i, 1);
            if (enemyBaseHP <= 0) {
                enemyBaseHP = 0;
                endWargame(true);
                return;
            }
        }
    }

    // Enemy units attack player base
    for (let i = enemyUnits.length - 1; i >= 0; i--) {
        const unit = enemyUnits[i];
        if (unit.x - UNIT_RADIUS <= PLAYER_BASE_X_END) {
            playerBaseHP -= unit.attack;
            enemyUnits.splice(i, 1);
            if (playerBaseHP <= 0) {
                playerBaseHP = 0;
                endWargame(false);
                return;
            }
        }
    }
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateUnitPositions();
    handleCombat();
    updateProjectiles();
    handleBaseAttacks();
    if (!gameRunning) return; // Check if game ended

    drawBases();
    drawUnits();
    drawProjectiles();
    updateWargameUI();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnUnit(unitTypeKey) {
    if (!gameRunning) return;
    const unitData = UNIT_TYPES[unitTypeKey];
    if (playerGold >= unitData.cost) {
        playerGold -= unitData.cost;
        playerUnits.push({
            type: unitTypeKey,
            x: PLAYER_SPAWN_X,
            y: UNIT_Y_POSITION(),
            hp: unitData.hp,
            attack: unitData.attack,
            speed: unitData.speed,
            color: unitData.color,
            range: unitData.range,
            attackCooldown: unitData.attackCooldown,
            lastAttackTime: 0 // Initialize lastAttackTime
        });
        updateWargameUI();
    } else {
        if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Nicht genug Gold!";
        setTimeout(() => { if (wargameMessageDisplay) wargameMessageDisplay.textContent = ""; }, 2000);
    }
}

function enemyAISpawn() {
    if (!gameRunning) return;

    const availableUnits = Object.keys(UNIT_TYPES).filter(key => UNIT_TYPES[key].cost <= enemyGold);
    if (availableUnits.length > 0) {
        const randomUnitKey = availableUnits[Math.floor(Math.random() * availableUnits.length)];
        const unitData = UNIT_TYPES[randomUnitKey];
        enemyGold -= unitData.cost;
        enemyUnits.push({
            type: randomUnitKey,
            x: ENEMY_SPAWN_X(),
            y: UNIT_Y_POSITION(),
            hp: unitData.hp,
            attack: unitData.attack,
            speed: unitData.speed,
            color: unitData.color, // Consider a distinct enemy color
            range: unitData.range,
            attackCooldown: unitData.attackCooldown,
            lastAttackTime: 0
        });
    }
}

function startWargameInternal() {
    if (gameRunning) return;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (playerGoldIntervalId) clearInterval(playerGoldIntervalId);
    if (enemySpawnIntervalId) clearInterval(enemySpawnIntervalId);

    playerGold = 200;
    enemyGold = 150;
    playerBaseHP = 1000;
    enemyBaseHP = 1000;
    playerUnits = [];
    enemyUnits = [];
    projectiles = []; // Clear projectiles
    gameRunning = true;
    if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Das Spiel beginnt!";
    const startButton = document.getElementById('start-wargame-button');
    if (startButton) startButton.disabled = true;

    playerGoldIntervalId = setInterval(() => {
        if (gameRunning) {
            playerGold += 10;
            enemyGold += 7; // AI gold generation
            updateWargameUI();
        }
    }, 2000);

    enemySpawnIntervalId = setInterval(enemyAISpawn, 3000 + Math.random() * 2000);

    gameLoopId = requestAnimationFrame(gameLoop);
}

function endWargame(playerWon) {
    gameRunning = false;
    const startButton = document.getElementById('start-wargame-button');
    if (startButton) startButton.disabled = false;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (playerGoldIntervalId) clearInterval(playerGoldIntervalId);
    if (enemySpawnIntervalId) clearInterval(enemySpawnIntervalId);

    if (playerWon) {
        if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Du hast gewonnen! +250 SP";
        gameState.sp += 250;
        // Potentially add UV for winning
        if (Math.random() < 0.1) { // 10% chance for a UV
            gameState.uv += 1;
            if (wargameMessageDisplay) wargameMessageDisplay.textContent += " +1 UV!";
        }
    } else {
        if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Du hast verloren!";
    }
    updateWargameUI(); // Final UI update for HP
    updateMainUI(); // Update main game SP/UV
}


export function initWargame() {
    canvas = document.getElementById('wargameCanvas');
    if (!canvas) { console.error("Wargame canvas not found!"); return; }
    ctx = canvas.getContext('2d');

    playerGoldDisplay = document.getElementById('wargame-player-gold');
    playerBaseHpDisplay = document.getElementById('wargame-player-base-hp');
    enemyBaseHpDisplay = document.getElementById('wargame-enemy-base-hp');
    wargameMessageDisplay = document.getElementById('wargame-message');
    unitButtonsContainer = document.getElementById('wargame-unit-buttons');

    const startButton = document.getElementById('start-wargame-button');
    if (startButton) startButton.addEventListener('click', startWargameInternal);

    unitButtonsContainer.innerHTML = ''; // Clear existing buttons
    for (const unitKey in UNIT_TYPES) {
        const unit = UNIT_TYPES[unitKey];
        const button = document.createElement('button');
        button.dataset.unitType = unitKey;
        button.textContent = `${unit.name} (Kosten: ${unit.cost})`;
        button.addEventListener('click', () => spawnUnit(unitKey));
        unitButtonsContainer.appendChild(button);
    }

    // Initial draw when game is first set up
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBases();
    drawUnits(); // Should be empty initially
    drawProjectiles(); // Should be empty initially
    updateWargameUI();
    console.log("Wargame Minigame Initialisiert!");
}

export function openWargame() {
    const modal = document.getElementById('wargame-modal');
    if (modal) {
        modal.style.display = 'flex';
        if (!gameRunning) {
            if (wargameMessageDisplay) wargameMessageDisplay.textContent = "";
            const startButton = document.getElementById('start-wargame-button');
            if (startButton) startButton.disabled = false;

            // Reset game state for display before a new game starts
            playerGold = 100;
            playerBaseHP = 1000;
            enemyBaseHP = 1000;
            playerUnits = [];
            enemyUnits = [];
            projectiles = []; // Clear projectiles for display

            if (ctx) { // Ensure context is available
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBases();
                drawUnits();
                drawProjectiles();
            }
            updateWargameUI();
        }
    }
}
