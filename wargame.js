// wargame.js
import { gameState, updateUI as updateMainUI, formatNumber } from './game.js';

let canvas, ctx;
let playerGoldDisplay, playerBaseHpDisplay, enemyBaseHpDisplay, wargameMessageDisplay;
let unitButtonsContainer;

// --- Game State ---
let playerGold = 100;
// let playerBaseHP = 1000; // Now managed by PLAYER_BASE_STATS
// let enemyBaseHP = 1000;  // Now managed by ENEMY_BASE_STATS
let playerUnits = [];
let enemyUnits = [];
let projectiles = []; // Array to store active projectiles
let gameRunning = false;
let gameLoopId = null;
let playerGoldIntervalId = null;
let enemySpawnIntervalId = null;

// --- Image Assets ---
let playerBaseImageObject = null;
let enemyBaseImageObject = null;

const BASE_WIDTH = 50;
const BASE_HEIGHT = 100;
const UNIT_RADIUS = 10;
const PLAYER_BASE_X_END = BASE_WIDTH;
const ENEMY_BASE_X_START = () => canvas.width - BASE_WIDTH;
const PLAYER_SPAWN_X = BASE_WIDTH + UNIT_RADIUS + 5;
const ENEMY_SPAWN_X = () => canvas.width - BASE_WIDTH - UNIT_RADIUS - 5;
const UNIT_Y_POSITION = () => canvas.height - UNIT_RADIUS; // Units' center Y, so bottom of unit is at canvas.height

const ARROW_SPEED = 3;
const ARROW_DAMAGE_MODIFIER = 1;
const ARROW_LENGTH = 10;

const HEALTH_BAR_WIDTH = 20;
const HEALTH_BAR_HEIGHT = 4;
const HEALTH_BAR_OFFSET_Y = UNIT_RADIUS + 5; // How far above the unit the health bar appears

const PLAYER_BASE_STATS = {
    hp: 1000, attack: 5, range: 200, attackCooldown: 2000, lastAttackTime: 0, attackers: []
};
const ENEMY_BASE_STATS = {
    hp: 1000, attack: 5, range: 200, attackCooldown: 2200, lastAttackTime: 0, attackers: []
};

const UNIT_TYPES = {
    soldier: { name: "Soldat", cost: 50, hp: 100, attack: 10, speed: 0.5, color: 'blue', range: UNIT_RADIUS * 2.5, attackCooldown: 1000, lastAttackTime: 0 },
    archer: { name: "Bogenschütze", cost: 75, hp: 70, attack: 8, speed: 0.4, color: 'green', range: 150, attackCooldown: 1500, lastAttackTime: 0 }
};
let enemyGold = 100;

// Helper function to load images asynchronously
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Failed to load image: ${src}`, err);
            reject(err); // Reject so we can handle the error
        };
        img.src = src;
    });
}

function drawBases() {
    // Player base (left)
    if (playerBaseImageObject) {
        ctx.drawImage(playerBaseImageObject, 0, canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = 'darkblue';
        ctx.fillRect(0, canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    }

    // Enemy base (right)
    if (enemyBaseImageObject) {
        ctx.drawImage(enemyBaseImageObject, ENEMY_BASE_X_START(), canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = 'darkred';
        ctx.fillRect(ENEMY_BASE_X_START(), canvas.height - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    }
}
function drawUnits() {
    playerUnits.forEach(unit => {
        ctx.fillStyle = unit.color;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar for player unit
        const maxHp = UNIT_TYPES[unit.type].hp;
        const currentHpPercentage = unit.hp / maxHp;
        // Background of health bar (e.g., red for damage taken)
        ctx.fillStyle = 'red';
        ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
        // Foreground of health bar (green for current health)
        ctx.fillStyle = 'lime';
        ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH * currentHpPercentage, HEALTH_BAR_HEIGHT);
    });

    enemyUnits.forEach(unit => {
        ctx.fillStyle = unit.color; // Consider a different color for enemy units for clarity
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar for enemy unit
        const maxHp = UNIT_TYPES[unit.type].hp;
        const currentHpPercentage = unit.hp / maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
        ctx.fillStyle = 'lime';
        ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH * currentHpPercentage, HEALTH_BAR_HEIGHT);
    });
}

function drawProjectiles() {
    projectiles.forEach(p => {
        ctx.strokeStyle = p.owner === 'player' ? 'lightblue' : 'lightcoral';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const endX = p.x + (p.owner === 'player' ? ARROW_LENGTH : -ARROW_LENGTH);
        ctx.lineTo(endX, p.y);
        ctx.stroke();
    });
}

function updateWargameUI() {
    if (playerGoldDisplay) playerGoldDisplay.textContent = playerGold;
    if (playerBaseHpDisplay) playerBaseHpDisplay.textContent = PLAYER_BASE_STATS.hp;
    if (enemyBaseHpDisplay) enemyBaseHpDisplay.textContent = ENEMY_BASE_STATS.hp;
}

function updateUnitPositions() {
    // Move player units
    playerUnits.forEach(unit => {
        let canMove = true;
        // Check for enemy units in range to attack
        for (const enemy of enemyUnits) {
            const distance = Math.abs(unit.x - enemy.x);
            if (distance <= unit.range && unit.x < enemy.x) { // Unit stops if an enemy is in range AND in front of it
                canMove = false;
                break;
            }
        }
        // Check if unit is in range of enemy base
        const distanceToEnemyBase = ENEMY_BASE_X_START() - (unit.x + UNIT_RADIUS);
        if (distanceToEnemyBase <= unit.range) { // All units stop if base is in range
            canMove = false;
        }
        // Archers might prefer to attack units first if they are closer than the base and in range
        if (unit.type === 'archer' && !canMove) {
            let closerEnemyTarget = null;
            for (const enemy of enemyUnits) {
                const distToPotentialEnemy = Math.abs(unit.x - enemy.x);
                if (enemy.x > unit.x && distToPotentialEnemy <= unit.range) {
                    if (!closerEnemyTarget || distToPotentialEnemy < Math.abs(unit.x - closerEnemyTarget.x)) {
                        closerEnemyTarget = enemy;
                    }
                }
            }
            if (closerEnemyTarget) {
                 const distToCloserEnemy = Math.abs(unit.x - closerEnemyTarget.x);
                 if (distToCloserEnemy < distanceToEnemyBase) {
                    // Already stopped for a closer unit, do nothing extra here for base stopping
                 } else {
                    // Base is closer or equally close among valid targets
                 }
            }
        }


        if (canMove) {
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
        const distanceToPlayerBase = (unit.x - UNIT_RADIUS) - PLAYER_BASE_X_END;
        if (distanceToPlayerBase <= unit.range) {
            canMove = false;
        }

        if (unit.type === 'archer' && !canMove) {
            let closerPlayerTarget = null;
            for (const playerUnit of playerUnits) {
                const distToPotentialPlayer = Math.abs(unit.x - playerUnit.x);
                 if (playerUnit.x < unit.x && distToPotentialPlayer <= unit.range) {
                    if(!closerPlayerTarget || distToPotentialPlayer < Math.abs(unit.x - closerPlayerTarget.x)) {
                        closerPlayerTarget = playerUnit;
                    }
                 }
            }
            if(closerPlayerTarget){
                const distToCloserPlayer = Math.abs(unit.x - closerPlayerTarget.x);
                if(distToCloserPlayer < distanceToPlayerBase){
                    // Already stopped for closer unit
                } else {
                    // Base is closer or equally close
                }
            }
        }

        if (canMove) {
            unit.x -= unit.speed;
        }
    });
}

function spawnProjectile(owner, targetUnit, isBaseShooting = false) {
    let projectileY;
    let projectileX;

    if (isBaseShooting) {
        // Projectile originates from the edge of the base
        projectileX = (owner.owner === 'player' ? PLAYER_BASE_X_END : ENEMY_BASE_X_START());
        if (targetUnit) {
            projectileY = targetUnit.y; // Aim at the target unit's y
        } else { // Fallback if no specific target unit y (should ideally not happen if targeting logic is correct)
            // Projectile originates from the vertical middle of the base
            projectileY = canvas.height - (BASE_HEIGHT / 2) + (Math.random() * BASE_HEIGHT * 0.4 - BASE_HEIGHT * 0.2); // Center +/- 20% of base height
        }
    } else { // Unit shooting
        projectileX = owner.x + (owner.owner === 'player' ? UNIT_RADIUS : -UNIT_RADIUS); // From the edge of the unit
        projectileY = owner.y;
    }

    projectiles.push({
        x: projectileX,
        y: projectileY,
        owner: owner.owner,
        damage: owner.attack * ARROW_DAMAGE_MODIFIER,
        speed: ARROW_SPEED * (owner.owner === 'player' ? 1 : -1),
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
            if (distance <= pUnit.range && pUnit.x < eUnit.x) {
                if (pUnit.type === 'archer') {
                    spawnProjectile({ ...pUnit, owner: 'player' }, eUnit);
                } else { // Melee
                    eUnit.hp -= pUnit.attack;
                    if (eUnit.hp <= 0) {
                        enemyUnits.splice(i, 1);
                        const attackerIndex = PLAYER_BASE_STATS.attackers.indexOf(eUnit);
                        if (attackerIndex > -1) {
                            PLAYER_BASE_STATS.attackers.splice(attackerIndex, 1);
                        }
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
                    spawnProjectile({ ...eUnit, owner: 'enemy' }, pUnit);
                } else { // Melee
                    pUnit.hp -= eUnit.attack;
                    if (pUnit.hp <= 0) {
                        playerUnits.splice(i, 1);
                        const attackerIndex = ENEMY_BASE_STATS.attackers.indexOf(pUnit);
                        if (attackerIndex > -1) {
                            ENEMY_BASE_STATS.attackers.splice(attackerIndex, 1);
                        }
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
                if (p.x >= eUnit.x - UNIT_RADIUS && p.x <= eUnit.x + UNIT_RADIUS && Math.abs(p.y - eUnit.y) < UNIT_RADIUS * 1.5) {
                    eUnit.hp -= p.damage;
                    if (eUnit.hp <= 0) {
                        enemyUnits.splice(j, 1);
                        const attackerIndex = PLAYER_BASE_STATS.attackers.indexOf(eUnit);
                        if (attackerIndex > -1) {
                            PLAYER_BASE_STATS.attackers.splice(attackerIndex, 1);
                        }
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
                        const attackerIndex = ENEMY_BASE_STATS.attackers.indexOf(pUnit);
                        if (attackerIndex > -1) {
                            ENEMY_BASE_STATS.attackers.splice(attackerIndex, 1);
                        }
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

function handleBaseShooting() {
    const currentTime = Date.now();

    // Player base shoots
    if (PLAYER_BASE_STATS.hp > 0 && currentTime - PLAYER_BASE_STATS.lastAttackTime >= PLAYER_BASE_STATS.attackCooldown) {
        let targetAcquired = false;
        // Prioritize units that have attacked the base
        for (let i = PLAYER_BASE_STATS.attackers.length - 1; i >= 0; i--) {
            const attacker = PLAYER_BASE_STATS.attackers[i];
            if (attacker && attacker.hp > 0 && enemyUnits.includes(attacker)) {
                const distanceToAttacker = attacker.x - UNIT_RADIUS - PLAYER_BASE_X_END;
                if (distanceToAttacker <= PLAYER_BASE_STATS.range && attacker.x > PLAYER_BASE_X_END) {
                    spawnProjectile({ owner: 'player', attack: PLAYER_BASE_STATS.attack }, attacker, true);
                    PLAYER_BASE_STATS.lastAttackTime = currentTime;
                    targetAcquired = true;
                    break;
                }
            } else {
                PLAYER_BASE_STATS.attackers.splice(i, 1);
            }
        }

        // If no specific attacker targeted, fall back to general targeting units very close to the base
        if (!targetAcquired) {
            for (const enemy of enemyUnits) {
                const distanceToBaseEdge = enemy.x - UNIT_RADIUS - PLAYER_BASE_X_END;
                const isEffectivelyAttackingBase = (enemy.x - UNIT_RADIUS) <= (PLAYER_BASE_X_END + UNIT_RADIUS * 1.5);
                if (distanceToBaseEdge <= PLAYER_BASE_STATS.range && isEffectivelyAttackingBase && enemy.x > PLAYER_BASE_X_END) {
                    spawnProjectile({ owner: 'player', attack: PLAYER_BASE_STATS.attack }, enemy, true);
                    PLAYER_BASE_STATS.lastAttackTime = currentTime;
                    break;
                }
            }
        }
    }

    // Enemy base shoots
    if (ENEMY_BASE_STATS.hp > 0 && currentTime - ENEMY_BASE_STATS.lastAttackTime >= ENEMY_BASE_STATS.attackCooldown) {
        let targetAcquired = false;
        for (let i = ENEMY_BASE_STATS.attackers.length - 1; i >= 0; i--) {
            const attacker = ENEMY_BASE_STATS.attackers[i];
            if (attacker && attacker.hp > 0 && playerUnits.includes(attacker)) {
                const distanceToAttacker = ENEMY_BASE_X_START() - (attacker.x + UNIT_RADIUS);
                if (distanceToAttacker <= ENEMY_BASE_STATS.range && attacker.x < ENEMY_BASE_X_START()) {
                    spawnProjectile({ owner: 'enemy', attack: ENEMY_BASE_STATS.attack }, attacker, true);
                    ENEMY_BASE_STATS.lastAttackTime = currentTime;
                    targetAcquired = true;
                    break;
                }
            } else {
                ENEMY_BASE_STATS.attackers.splice(i, 1);
            }
        }
        if(!targetAcquired){
            for (const playerUnit of playerUnits) {
                const distanceToBaseEdge = ENEMY_BASE_X_START() - (playerUnit.x + UNIT_RADIUS);
                const isEffectivelyAttackingBase = (playerUnit.x + UNIT_RADIUS) >= (ENEMY_BASE_X_START() - UNIT_RADIUS * 1.5);
                if (distanceToBaseEdge <= ENEMY_BASE_STATS.range && isEffectivelyAttackingBase && playerUnit.x < ENEMY_BASE_X_START()) {
                    spawnProjectile({ owner: 'enemy', attack: ENEMY_BASE_STATS.attack }, playerUnit, true);
                    ENEMY_BASE_STATS.lastAttackTime = currentTime;
                    break;
                }
            }
        }
    }
}


function handleBaseAttacks() {
    const currentTime = Date.now();
    // Player units attack enemy base
    for (let i = playerUnits.length - 1; i >= 0; i--) {
        const unit = playerUnits[i];
        const distanceToEnemyBaseEdge = ENEMY_BASE_X_START() - (unit.x + UNIT_RADIUS);

        if (distanceToEnemyBaseEdge <= unit.range && 
            currentTime - unit.lastAttackTime >= unit.attackCooldown) {
            
            const enemyInPath = enemyUnits.find(e => e.x > unit.x && Math.abs(e.x - unit.x) < unit.range && (e.x - unit.x) < distanceToEnemyBaseEdge + UNIT_RADIUS); 
            if (enemyInPath) continue; 
            
            ENEMY_BASE_STATS.hp -= unit.attack;            
            unit.lastAttackTime = currentTime; 
            if (!ENEMY_BASE_STATS.attackers.includes(unit)) {
                ENEMY_BASE_STATS.attackers.push(unit);
            }
            if (ENEMY_BASE_STATS.hp <= 0) {
                ENEMY_BASE_STATS.hp = 0;
                endWargame(true);
                return;
            }
        }
    }

    // Enemy units attack player base
    for (let i = enemyUnits.length - 1; i >= 0; i--) {
        const unit = enemyUnits[i];
        const distanceToPlayerBaseEdge = (unit.x - UNIT_RADIUS) - PLAYER_BASE_X_END;

        if (distanceToPlayerBaseEdge <= unit.range &&
            currentTime - unit.lastAttackTime >= unit.attackCooldown) {

            const playerUnitInPath = playerUnits.find(p => p.x < unit.x && Math.abs(p.x - unit.x) < unit.range && (unit.x - p.x) < distanceToPlayerBaseEdge + UNIT_RADIUS);
            if (playerUnitInPath) continue;
            
            PLAYER_BASE_STATS.hp -= unit.attack;            
            unit.lastAttackTime = currentTime;
            if (!PLAYER_BASE_STATS.attackers.includes(unit)) {
                PLAYER_BASE_STATS.attackers.push(unit);
            }
            if (PLAYER_BASE_STATS.hp <= 0) {
                PLAYER_BASE_STATS.hp = 0;
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
    handleBaseShooting();
    handleBaseAttacks();
    if (!gameRunning) return; 

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
            ...unitData, 
            type: unitTypeKey, 
            x: PLAYER_SPAWN_X,
            y: UNIT_Y_POSITION(),
            hp: unitData.hp, 
            lastAttackTime: 0 
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
            ...unitData,
            type: randomUnitKey,
            x: ENEMY_SPAWN_X(),
            y: UNIT_Y_POSITION(),
            hp: unitData.hp,
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
    PLAYER_BASE_STATS.hp = 1000;
    ENEMY_BASE_STATS.hp = 1000;
    PLAYER_BASE_STATS.lastAttackTime = 0;
    ENEMY_BASE_STATS.lastAttackTime = 0;
    PLAYER_BASE_STATS.attackers = []; 
    ENEMY_BASE_STATS.attackers = [];  
    playerUnits = [];
    enemyUnits = [];
    projectiles = []; 
    gameRunning = true;
    if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Das Spiel beginnt!";
    const startButton = document.getElementById('start-wargame-button');
    if (startButton) startButton.disabled = true;

    playerGoldIntervalId = setInterval(() => {
        if (gameRunning) {
            playerGold += 10;
            enemyGold += 7; 
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
        if (Math.random() < 0.1) { 
            gameState.uv += 1;
            if (wargameMessageDisplay) wargameMessageDisplay.textContent += " +1 UV!";
        }
    } else {
        if (wargameMessageDisplay) wargameMessageDisplay.textContent = "Du hast verloren!";
    }
    updateWargameUI(); 
    updateMainUI(); 
}

function performInitialDraw() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBases();
        drawUnits();
        drawProjectiles();
        updateWargameUI();
    }
}


export async function initWargame() {
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

    try {
        // Load base images
        playerBaseImageObject = await loadImage('player_base.png'); // Adjust path if needed
        enemyBaseImageObject = await loadImage('enemy_base.png');   // Adjust path if needed
        console.log("Base images loaded successfully.");
    } catch (error) {
        console.error("Error loading base images. Will use fallback drawing.", error);
    }

    // Perform initial draw regardless of image loading success (drawBases has fallbacks)
    performInitialDraw();

    unitButtonsContainer.innerHTML = ''; 
    for (const unitKey in UNIT_TYPES) {
        const unit = UNIT_TYPES[unitKey];
        const button = document.createElement('button');
        button.dataset.unitType = unitKey;
        button.textContent = `${unit.name} (Kosten: ${unit.cost})`;
        button.addEventListener('click', () => spawnUnit(unitKey));
        unitButtonsContainer.appendChild(button);
    }

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

            playerGold = 100;
            PLAYER_BASE_STATS.hp = 1000; 
            ENEMY_BASE_STATS.hp = 1000;  
            PLAYER_BASE_STATS.lastAttackTime = 0;
            ENEMY_BASE_STATS.lastAttackTime = 0;
            PLAYER_BASE_STATS.attackers = [];
            ENEMY_BASE_STATS.attackers = [];
            playerUnits = [];
            enemyUnits = [];
            projectiles = []; 

            if (ctx) { 
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBases();
                drawUnits();
                drawProjectiles();
            }
            updateWargameUI();
        }
    }
}
