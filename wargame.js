// wargame.js
import { gameState, updateUI as updateMainUI, formatNumber } from './game.js';

let canvas, ctx;
let playerGoldDisplay, playerBaseHpDisplay, enemyBaseHpDisplay, wargameMessageDisplay, unitStatsTooltipDisplay;
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

let visualEffects = []; // For things like melee hit effects
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
    archer: { name: "Bogenschütze", cost: 75, hp: 70, attack: 8, speed: 0.4, color: 'green', range: 150, attackCooldown: 1500, lastAttackTime: 0 },
    tank: { name: "Panzer", cost: 120, hp: 250, attack: 15, speed: 0.3, color: 'dimgray', range: UNIT_RADIUS * 2.5, attackCooldown: 1200, lastAttackTime: 0 }
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

function drawHealthBar(unit, currentHp, maxHp) {
    const currentHpPercentage = Math.max(0, currentHp / maxHp); // Ensure percentage is not negative
    // Background of health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
    // Foreground of health bar
    ctx.fillStyle = 'lime';
    ctx.fillRect(unit.x - HEALTH_BAR_WIDTH / 2, unit.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH * currentHpPercentage, HEALTH_BAR_HEIGHT);
}

function drawUnits() {
    playerUnits.forEach(unit => {
        ctx.fillStyle = unit.color;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        drawHealthBar(unit, unit.hp, UNIT_TYPES[unit.type].hp);
    });

    enemyUnits.forEach(unit => {
        ctx.fillStyle = unit.color; // Consider a different color for enemy units for clarity
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, UNIT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        drawHealthBar(unit, unit.hp, UNIT_TYPES[unit.type].hp);
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

function drawVisualEffects() {
    visualEffects.forEach(effect => {
        if (effect.type === 'meleeHit') {
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.7)'; // Yellowish, semi-transparent
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Draw slightly offset from unit center, towards the direction of the hit for better visual
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

function updateWargameUI() {
    if (playerGoldDisplay) playerGoldDisplay.textContent = playerGold;
    if (playerBaseHpDisplay) playerBaseHpDisplay.textContent = PLAYER_BASE_STATS.hp;
    if (enemyBaseHpDisplay) enemyBaseHpDisplay.textContent = ENEMY_BASE_STATS.hp;
}

function updateUnitPositions() {
    playerUnits.forEach(unit => {
        let canMove = true;
        // Check for enemy units in attack range AND in front
        for (const enemy of enemyUnits) {
            const distance = enemy.x - unit.x; // Positive if enemy is to the right (in front of player unit)
            // Stop if enemy is in front AND center-to-center distance is within attack range
            if (distance > 0 && distance <= unit.range) {
                canMove = false;
                break;
            }
        }
        // If no enemy units are engaging, check if the enemy base is in attack range
        if (canMove) {
            // Distance from player unit's center to the enemy base's front edge
            const distanceToEnemyBaseEdge = ENEMY_BASE_X_START() - unit.x;
            if (distanceToEnemyBaseEdge <= unit.range) {
                canMove = false;
            }
        }

        // Also ensure unit doesn't move into/past the base if it can move
        if (canMove && (unit.x + UNIT_RADIUS) < ENEMY_BASE_X_START()) {
            unit.x += unit.speed;
        }
    });

    enemyUnits.forEach(unit => {
        let canMove = true;
        // Check for player units in attack range AND in front
        for (const playerUnit of playerUnits) {
            const distance = unit.x - playerUnit.x; // Positive if playerUnit is to the left (in front of enemy unit)
            if (distance > 0 && distance <= unit.range) { // playerUnit is in front (left) and in range
                canMove = false;
                break;
            }
        }
        // If no player units are engaging, check if the player base is in attack range
        if (canMove) {
            const distanceToPlayerBaseEdge = unit.x - PLAYER_BASE_X_END;
            if (distanceToPlayerBaseEdge <= unit.range) {
                canMove = false;
            }
        }

        if (canMove && (unit.x - UNIT_RADIUS) > PLAYER_BASE_X_END) { // Ensure unit doesn't move into/past the base
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

function addVisualEffect(type, x, y, targetUnit = null) {
    if (type === 'meleeHit') {
        // Position the effect slightly towards the unit that was hit, or at unit's edge
        const effectX = targetUnit ? (x + targetUnit.x) / 2 : x;
        const effectY = targetUnit ? (y + targetUnit.y) / 2 : y;
        visualEffects.push({ type, x: effectX, y: effectY - UNIT_RADIUS * 0.3, radius: UNIT_RADIUS * 0.2, maxRadius: UNIT_RADIUS * 0.7, duration: 150, startTime: Date.now() });
    }
}


function handleCombat() {
    const currentTime = Date.now();

    // Player units attack
    playerUnits.forEach(pUnit => {
        if (currentTime - pUnit.lastAttackTime < pUnit.attackCooldown) return;

        if (pUnit.type === 'archer') { // Ranged units like archers
            let targetEnemyUnit = null;
            let closestDistance = Infinity;
            for (const eUnit of enemyUnits) {
                const distance = eUnit.x - pUnit.x; // Center to center, positive if eUnit is to the right
                if (distance > 0 && distance <= pUnit.range) { // Enemy is in front and in attack range
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        targetEnemyUnit = eUnit;
                    }
                }
            }
            if (targetEnemyUnit) {
                spawnProjectile({ ...pUnit, owner: 'player' }, targetEnemyUnit);
                pUnit.lastAttackTime = currentTime;
            }
        } else { // Melee units (Soldier, Tank)
            let targetEnemyUnit = null;
            // Melee attacks the first unit it's engaging with (closest due to movement)
            for (const eUnit of enemyUnits) {
                const distance = eUnit.x - pUnit.x; // Positive if eUnit is to the right
                if (distance > 0 && distance <= pUnit.range) { // In range and eUnit is in front
                    targetEnemyUnit = eUnit;
                    break;
                }
            }
            if (targetEnemyUnit) {
                addVisualEffect('meleeHit', pUnit.x + UNIT_RADIUS, pUnit.y, targetEnemyUnit); // Effect near point of impact
                targetEnemyUnit.hp -= pUnit.attack;
                if (targetEnemyUnit.hp <= 0) {
                    const index = enemyUnits.indexOf(targetEnemyUnit);
                    if (index > -1) enemyUnits.splice(index, 1);
                    const attackerIndex = PLAYER_BASE_STATS.attackers.indexOf(targetEnemyUnit);
                    if (attackerIndex > -1) PLAYER_BASE_STATS.attackers.splice(attackerIndex, 1);
                }
                pUnit.lastAttackTime = currentTime;
            }
        }
    });

    // Enemy units attack
    enemyUnits.forEach(eUnit => {
        if (currentTime - eUnit.lastAttackTime < eUnit.attackCooldown) return;

        if (eUnit.type === 'archer') {
            let targetPlayerUnit = null;
            let closestDistance = Infinity;
            for (const pUnit of playerUnits) {
                const distance = eUnit.x - pUnit.x; // Positive if pUnit is to the left
                if (distance > 0 && distance <= eUnit.range) { // pUnit is in front and in range
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        targetPlayerUnit = pUnit;
                    }
                }
            }
            if (targetPlayerUnit) {
                spawnProjectile({ ...eUnit, owner: 'enemy' }, targetPlayerUnit);
                eUnit.lastAttackTime = currentTime;
            }
        } else { // Melee units
            let targetPlayerUnit = null;
            for (const pUnit of playerUnits) {
                const distance = eUnit.x - pUnit.x; // Positive if pUnit is to the left
                if (distance > 0 && distance <= eUnit.range) { // pUnit is in front and in range
                    targetPlayerUnit = pUnit;
                    break;
                }
            }
            if (targetPlayerUnit) {
                addVisualEffect('meleeHit', eUnit.x - UNIT_RADIUS, eUnit.y, targetPlayerUnit);
                targetPlayerUnit.hp -= eUnit.attack;
                if (targetPlayerUnit.hp <= 0) {
                    const index = playerUnits.indexOf(targetPlayerUnit);
                    if (index > -1) playerUnits.splice(index, 1);
                    const attackerIndex = ENEMY_BASE_STATS.attackers.indexOf(targetPlayerUnit);
                    if (attackerIndex > -1) ENEMY_BASE_STATS.attackers.splice(attackerIndex, 1);
                }
                eUnit.lastAttackTime = currentTime;
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

function updateVisualEffects() {
    const currentTime = Date.now();
    visualEffects = visualEffects.filter(effect => {
        if (currentTime - effect.startTime > effect.duration) {
            return false; // Remove expired effect
        }
        if (effect.type === 'meleeHit') {
            // Grow effect
            const progress = (currentTime - effect.startTime) / effect.duration;
            effect.radius = effect.maxRadius * Math.sin(progress * Math.PI); // Grows and shrinks
        }
        return true;
    });
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
        const distanceToEnemyBaseFront = ENEMY_BASE_X_START() - unit.x; // unit center to base front

        if (distanceToEnemyBaseFront <= unit.range &&
            currentTime - unit.lastAttackTime >= unit.attackCooldown) {

            // Check if a closer enemy unit should be prioritized (already handled by handleCombat if unit is in range)
            // This check ensures base is only attacked if no units are more immediate threats within its range.
            const enemyInPath = enemyUnits.find(e => e.x > unit.x && (e.x - unit.x) < unit.range && (e.x - unit.x) < distanceToEnemyBaseFront);
            if (enemyInPath) continue;
            if (unit.type !== 'archer') addVisualEffect('meleeHit', unit.x + UNIT_RADIUS, unit.y); // Melee base hit

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
        const distanceToPlayerBaseFront = unit.x - PLAYER_BASE_X_END; // unit center to base front

        if (distanceToPlayerBaseFront <= unit.range &&
            currentTime - unit.lastAttackTime >= unit.attackCooldown) {

            const playerUnitInPath = playerUnits.find(p => p.x < unit.x && (unit.x - p.x) < unit.range && (unit.x - p.x) < distanceToPlayerBaseFront);
            if (playerUnitInPath) continue;

            if (unit.type !== 'archer') addVisualEffect('meleeHit', unit.x - UNIT_RADIUS, unit.y); // Melee base hit

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
    updateVisualEffects();
    handleCombat();
    updateProjectiles();
    handleBaseShooting();
    handleBaseAttacks();
    if (!gameRunning) return;

    drawBases();
    drawUnits();
    drawProjectiles();
    drawVisualEffects();
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
    visualEffects = [];
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
        const baseReward = 250; // Base SP reward for winning
        const bonusPercentage = 0.05; // 5% of current SP as bonus
        const bonusSp = Math.floor(gameState.sp * bonusPercentage);
        const totalSpGained = baseReward + bonusSp;

        if (wargameMessageDisplay) wargameMessageDisplay.textContent = `Du hast gewonnen! +${formatNumber(totalSpGained)} SP`;
        gameState.sp += totalSpGained;

        if (Math.random() < 0.1) {
            gameState.uv += 1;
            if (wargameMessageDisplay) wargameMessageDisplay.textContent += " +1 UV!"; // Append to existing message
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
        drawVisualEffects();
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
    unitStatsTooltipDisplay = document.getElementById('wargame-unit-stats-tooltip'); // Get the new tooltip element

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

        if (unitStatsTooltipDisplay) {
            button.addEventListener('mouseover', (event) => {
                const stats = UNIT_TYPES[unitKey];
                unitStatsTooltipDisplay.innerHTML = `
                    <strong>${stats.name}</strong><br>
                    HP: ${stats.hp}<br>
                    Angriff: ${stats.attack}<br>
                    Geschw.: ${stats.speed}<br>
                    Reichweite: ${stats.range === UNIT_RADIUS * 2.5 ? 'Nahkampf' : stats.range}
                `;
                unitStatsTooltipDisplay.style.display = 'block';
                
                const modalContent = unitStatsTooltipDisplay.parentElement; // This should be 'modal-content'
                if (modalContent) {
                    const modalRect = modalContent.getBoundingClientRect();
                    // event.clientX/clientY are mouse coordinates relative to the viewport.
                    // modalRect.left/top are modalContent's top-left corner relative to the viewport.
                    // So, (event.clientX - modalRect.left) is the mouse's X position relative to modalContent's left edge.
                    const x = event.clientX - modalRect.left + 15; // 15px offset from cursor
                    const y = event.clientY - modalRect.top + 15;  // 15px offset from cursor

                    unitStatsTooltipDisplay.style.left = x + 'px';
                    unitStatsTooltipDisplay.style.top = y + 'px';
                } else {
                    // Fallback if parentElement isn't found, though unlikely here
                    unitStatsTooltipDisplay.style.left = (event.pageX + 15) + 'px';
                    unitStatsTooltipDisplay.style.top = (event.pageY + 15) + 'px';
                }
            });

            button.addEventListener('mouseout', () => {
                unitStatsTooltipDisplay.style.display = 'none';
            });
        }

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
            visualEffects = [];
            enemyUnits = [];
            projectiles = [];

            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBases();
                drawUnits();
                drawProjectiles();
                drawVisualEffects();
            }
            if (unitStatsTooltipDisplay) { // Hide tooltip if it was visible
                unitStatsTooltipDisplay.style.display = 'none';
            }
            updateWargameUI();
        }
    }
}
