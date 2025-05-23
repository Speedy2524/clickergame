import { initCasino, updateCasinoGamesUI } from './casino.js';

// --- Game State ---
export let gameState = {
    sp: 0,
    uv: 0, // Upgrade Vouchers
    pdc: 0, // Prestige Derived Credits (als direkter Bonusfaktor, z.B. 0.01 = 1%)
    spPerClick: 1,
    totalSps: 0,
    clickUpgrades: [
        { id: 'ergonomicMousepad', name: 'Ergonomisches Mauspad', level: 0, baseCost: 10, costMultiplier: 1.15, baseSpPerClickBonus: 1, description: 'Mehr Komfort, schnellere Klicks.' },
        { id: 'advancedGoogling', name: 'Fortgeschrittene Google-Fähigkeiten', level: 0, baseCost: 100, costMultiplier: 1.20, baseSpPerClickBonus: 5, description: 'Finden Sie Lösungen in Rekordzeit.' },
        { id: 'macroMagic', name: 'Makro-Magie', level: 0, baseCost: 1000, costMultiplier: 1.25, baseSpPerClickBonus: 20, description: 'Automatisieren Sie sich wiederholende Klickaufgaben.' },
    ],
    generators: [
        { id: 'helpdeskIntern', name: 'Helpdesk-Praktikant', count: 0, baseCost: 50, costMultiplier: 1.18, baseSps: 1, description: 'Beantwortet einfache Fragen, holt Kaffee.' },
        { id: 'patchManagement', name: 'Automatisiertes Patch-System', count: 0, baseCost: 500, costMultiplier: 1.22, baseSps: 10, description: 'Hält Systeme automatisch auf dem neuesten Stand.' },
        { id: 'remoteSupportTeam', name: 'Remote-Support-Team (L2)', count: 0, baseCost: 5000, costMultiplier: 1.25, baseSps: 75, description: 'Behandelt schwierigere Probleme aus der Ferne.' },
        { id: 'avClubGurus', name: 'AV-Club-Gurus', count: 0, baseCost: 100000, baseUVCost: 5, costMultiplier: 1.30, baseSps: 250, generatesUVChance: 0.05, generatesUVAmount: 1, description: 'Generiert SP. Chance, UV durch "Vermietung von Ausrüstung" oder "Gewinn von Tech-Messen" zu generieren.' },
        { id: 'cybersecurityTaskForce', name: 'Cybersecurity-Taskforce', count: 0, baseCost: 500000, baseUVCost: 20, costMultiplier: 1.35, baseSps: 1000, crisisMitigationFactor: 0.1, description: 'Generiert SP. Hilft, die Auswirkungen negativer Zufallsereignisse zu reduzieren.' },
        { id: 'instructionalTechnologists', name: 'Instructional Technologists', count: 0, baseCost: 250000, baseUVCost: 10, costMultiplier: 1.32, baseSps: 600, happinessBoostPerUnit: 1, description: 'Generiert SP. Erhöht passiv die "Lehrerzufriedenheit".' },
    ],
    firewallProject: {
        id: 'firewall',
        name: 'Firewall Implementierung',
        costSP: 750000,
        costUV: 30,
        implemented: false
    },
    prestigesDone: 0,
    prestigeUpgrades: [],
    lastSavedTimestamp: null,
    itLotteryCostSP: 10000,
    itLotteryLastResult: "Noch nicht gespielt.",
    stats: {
        totalClicksMade: 0,
        lotteryPlays: 0,
        lotteryJackpots: 0,
        higherLowerPlays: 0,
        higherLowerWins: 0,
        higherLowerHighestStreak: 0,
    },
    blackjack: {
        deck: [], playerHand: [], dealerHand: [], playerScore: 0, dealerScore: 0,
        betAmount: 0, gameInProgress: false,
        message: "Setze deinen Einsatz und klicke auf 'Deal'.", dealerRevealed: false
    },
    higherLower: {
        deck: [],
        previousCard: null,
        currentCard: null,
        betAmount: 0,
        streak: 0,
        gameInProgress: false,
        message: "Setze deinen Einsatz und starte das Spiel.",
        potentialWinnings: 0
    },
    achievements: {
        unermuedlicherKlicker: {
            name: 'Der Unermüdliche',
            description: 'Klicke wiederholt auf den "Problem lösen"-Button.',
            tiers: [
                { name: 'Bronze', value: 1000, reward: { sp: 10000 }, unlocked: false, desc: '1.000 Klicks.' },
                { name: 'Silber', value: 5000, reward: { sp: 50000 }, unlocked: false, desc: '5.000 Klicks.' },
                { name: 'Gold', value: 10000, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: '10.000 Klicks.' }
            ],
            checkType: 'stat', statProperty: 'totalClicksMade'
        },
        praktikantenDompteur: {
            name: 'Praktikanten-Dompteur',
            description: 'Stelle eine Armee von Helpdesk-Praktikanten ein.',
            tiers: [
                { name: 'Bronze', value: 10, reward: { sp: 25000 }, unlocked: false, desc: '10 Praktikanten.' },
                { name: 'Silber', value: 25, reward: { sp: 100000, uv: 20 }, unlocked: false, desc: '25 Praktikanten.' },
                { name: 'Gold', value: 50, reward: { sp: 500000, uv: 50, pdc: 0.01 }, unlocked: false, desc: '50 Praktikanten.' }
            ],
            checkType: 'generatorCount', generatorId: 'helpdeskIntern'
        },
        automatisierungsAficionado: {
            name: 'Automatisierungs-Aficionado',
            description: 'Nutze eine Vielzahl automatisierter Systeme.',
            tiers: [
                { name: 'Bronze', value: 3, reward: { sp: 100000 }, unlocked: false, desc: '3 verschiedene Typen.' },
                { name: 'Silber', value: 4, reward: { sp: 400000, uv: 30 }, unlocked: false, desc: '4 verschiedene Typen.' },
                { name: 'Gold', value: 5, reward: { sp: 1000000, uv: 100, pdc: 0.02 }, unlocked: false, desc: '5 verschiedene Typen.' }
            ],
            checkType: 'distinctGeneratorTypes'
        },
        gutscheinTycoon: {
            name: 'Gutschein-Tycoon',
            description: 'Horte Upgrade-Voucher (UV).',
            tiers: [
                { name: 'Bronze', value: 100, reward: { sp: 150000 }, unlocked: false, desc: '100 UV.' },
                { name: 'Silber', value: 500, reward: { sp: 750000, uv: 50 }, unlocked: false, desc: '500 UV.' },
                { name: 'Gold', value: 1000, reward: { sp: 2000000, uv: 100, pdc: 0.02 }, unlocked: false, desc: '1.000 UV.' }
            ],
            checkType: 'currency', currencyType: 'uv'
        },
        risikofreudig: {
            name: 'Risikofreudig',
            description: 'Versuche dein Glück bei der IT-Lotterie.',
            tiers: [
                { name: 'Bronze', value: 10, reward: { sp: 5000 }, unlocked: false, desc: '10 Mal gespielt.' },
                { name: 'Silber', value: 50, reward: { sp: 25000, uv: 5 }, unlocked: false, desc: '50 Mal gespielt.' },
                { name: 'Gold', value: 100, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: '100 Mal gespielt.' }
            ],
            checkType: 'stat', statProperty: 'lotteryPlays'
        },
        glueckspilz: {
            name: 'Glückspilz',
            description: 'Knacke den Jackpot in der IT-Lotterie.',
            tiers: [
                { name: 'Bronze', value: 1, reward: { sp: 200000, uv: 20, pdc: 0.005 }, unlocked: false, desc: '1 Jackpot gewonnen.' },
            ],
            checkType: 'stat', statProperty: 'lotteryJackpots'
        },
        kartenhai: {
            name: 'Kartenhai',
            description: 'Erreiche eine hohe Serie bei Höher oder Tiefer.',
            tiers: [
                { name: 'Bronze', value: 3, reward: { sp: 20000 }, unlocked: false, desc: 'Erreiche eine Serie von 3.' },
                { name: 'Silber', value: 7, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: 'Erreiche eine Serie von 7.' },
                { name: 'Gold', value: 12, reward: { sp: 500000, uv: 25, pdc: 0.005 }, unlocked: false, desc: 'Erreiche eine Serie von 12.' }
            ],
            checkType: 'stat', statProperty: 'higherLowerHighestStreak'
        },
    }
};

// --- Module-scoped DOM Element Variables (will be assigned in DOMContentLoaded) ---
let spDisplay, uvDisplay, pdcDisplay, spPerClickDisplay, totalSpsDisplay,
    clickButton, perClickUpgradesList, automatedGeneratorsList,
    implementFirewallButton, prestigeUpgradesList, prestigeButton,
    achievementsListContainer, resetButton, exportSeedButton, importSeedButton,
    casinoModal, openCasinoButton, closeModalButton,
    achievementNotificationElement, achievementNameElement, achievementTierElement, achievementRewardElement;

// --- Exportable Utility Functions ---
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatNumber(num) {
    if (num === null || num === undefined) return "0";
    if (num < 1e3) return num.toFixed(0);
    if (num < 1e6) return (num / 1e3).toFixed(2) + "K";
    if (num < 1e9) return (num / 1e6).toFixed(2) + "M";
    if (num < 1e12) return (num / 1e9).toFixed(2) + "B";
    if (num < 1e15) return (num / 1e12).toFixed(2) + "T";
    return num.toExponential(2);
}

// --- Core Game Logic (accessible at module scope) ---
// Moved getCost to top level as it's used by the exported updateUI
function getCost(item) {
    const levelOrCount = item.level !== undefined ? item.level : item.count;
    const spCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, levelOrCount));
    const uvCost = item.baseUVCost ? Math.floor(item.baseUVCost * Math.pow(item.costMultiplier, levelOrCount)) : 0;
    return { sp: spCost, uv: uvCost };
}

function calculateSpPerClick() {
    let totalBonus = 0;
    gameState.clickUpgrades.forEach(upgrade => {
        totalBonus += upgrade.level * upgrade.baseSpPerClickBonus;
    });
    gameState.spPerClick = (1 + totalBonus) * (1 + gameState.pdc);
}

function calculateTotalSps() {
    let total = 0;
    gameState.generators.forEach(gen => {
        total += gen.count * gen.baseSps;
    });
    gameState.totalSps = total;
}

// --- New Helper for Multi-Buy ---
/**
 * Calculates the cumulative cost and number of items that can be purchased.
 * @param {object} item - The upgrade or generator object.
 * @param {number|string} requestedQuantity - The number of items to try to buy, or 'MAX'.
 * @param {number} startLevelOrCount - The current level or count of the item.
 * @param {number} currentSP - Player's current SP.
 * @param {number} currentUV - Player's current UV.
 * @returns {{spCost: number, uvCost: number, purchasedCount: number, canAffordAll: boolean}}
 */
function getCumulativePurchaseInfo(item, requestedQuantity, startLevelOrCount, currentSP, currentUV) {
    let totalSpCost = 0;
    let totalUvCost = 0;
    let itemsCanBePurchased = 0;
    let tempLevelOrCount = startLevelOrCount;

    const isMaxBuy = requestedQuantity === 'MAX';
    const loopLimit = isMaxBuy ? Infinity : Number(requestedQuantity);

    if (isNaN(loopLimit) && !isMaxBuy) {
        return { spCost: 0, uvCost: 0, purchasedCount: 0, canAffordAll: false };
    }

    for (let i = 0; i < loopLimit; i++) {
        const costOfNextItemSp = Math.floor(item.baseCost * Math.pow(item.costMultiplier, tempLevelOrCount));
        const costOfNextItemUv = item.baseUVCost ? Math.floor(item.baseUVCost * Math.pow(item.costMultiplier, tempLevelOrCount)) : 0;

        if (currentSP >= (totalSpCost + costOfNextItemSp) && currentUV >= (totalUvCost + costOfNextItemUv)) {
            totalSpCost += costOfNextItemSp;
            totalUvCost += costOfNextItemUv;
            itemsCanBePurchased++;
            tempLevelOrCount++;
        } else {
            if (isMaxBuy) break;
            // For specific quantity, if we can't afford this one, we can't afford all.
            // The loop will break, and purchasedCount will be less than requestedQuantity.
            // The `canAffordAll` flag will be determined after the loop.
            break; 
        }
    }
    return { spCost: totalSpCost, uvCost: totalUvCost, purchasedCount: itemsCanBePurchased, canAffordAll: (isMaxBuy ? true : itemsCanBePurchased === Number(requestedQuantity)) };
}

// --- Rendering Functions (defined at top level, use module-scoped DOM vars) ---
// These will be called after DOM is loaded and vars are assigned.
function renderPerClickUpgrades() {
    if (!perClickUpgradesList) return;
    perClickUpgradesList.innerHTML = '';
    gameState.clickUpgrades.forEach((upgrade, index) => {
        const cost = getCost(upgrade).sp; // Cost for a single item for initial display
        const itemDiv = document.createElement('div');
        itemDiv.className = 'upgrade-item';
        itemDiv.innerHTML = `
            <h4>${upgrade.name} (Level ${upgrade.level})</h4>
            <p>${upgrade.description}</p>
            <p>Effekt: +${formatNumber(upgrade.baseSpPerClickBonus)} SP pro Klick pro Level</p>
            <p>Aktueller Bonus: +${formatNumber(upgrade.level * upgrade.baseSpPerClickBonus)} SP pro Klick</p>
            <div class="quantity-selector" data-upgrade-id="${upgrade.id}" data-upgrade-type="click">
                <span>Menge: </span>
                <button class="quantity-btn active" data-amount="1">1</button>
                <button class="quantity-btn" data-amount="10">10</button>
                <button class="quantity-btn" data-amount="25">25</button>
                <button class="quantity-btn" data-amount="MAX">Max</button>
            </div>
            <button class="buy-button" data-upgrade-id="${upgrade.id}" data-upgrade-type="click">
                Kaufe 1 für ${formatNumber(cost)} SP
            </button>
        `;
        perClickUpgradesList.appendChild(itemDiv);
        updateBuyButtonState(upgrade.id, "click", "1"); // Initialize with default quantity
    });
}

function renderAutomatedGenerators() {
    if (!automatedGeneratorsList) return;
    automatedGeneratorsList.innerHTML = '';
    gameState.generators.forEach((generator, index) => {
        const cost = getCost(generator); // Cost for a single item for initial display
        let costString = `${formatNumber(cost.sp)} SP`;
        if (cost.uv > 0) {
            costString += ` + ${formatNumber(cost.uv)} UV`;
        }
        const itemDiv = document.createElement('div');
        itemDiv.className = 'generator-item';
        itemDiv.innerHTML = `
            <h4>${generator.name} (Besitz: ${generator.count})</h4>
            <p>${generator.description}</p>
            <p>Generiert: ${formatNumber(generator.baseSps)} SP/Sekunde pro Einheit</p>
            <p>Gesamt von diesem Typ: ${formatNumber(generator.count * generator.baseSps)} SP/Sekunde</p>
            <div class="quantity-selector" data-upgrade-id="${generator.id}" data-upgrade-type="generator">
                <span>Menge: </span>
                <button class="quantity-btn active" data-amount="1">1</button>
                <button class="quantity-btn" data-amount="10">10</button>
                <button class="quantity-btn" data-amount="25">25</button>
                <button class="quantity-btn" data-amount="MAX">Max</button>
            </div>
            <button class="buy-button" data-upgrade-id="${generator.id}" data-upgrade-type="generator">
                Kaufe 1 für ${costString}
            </button>
        `;
        automatedGeneratorsList.appendChild(itemDiv);
        updateBuyButtonState(generator.id, "generator", "1"); // Initialize
    });
}

function renderAchievements() {
    if (!achievementsListContainer) return;
    achievementsListContainer.innerHTML = '';
    for (const achId in gameState.achievements) {
        const ach = gameState.achievements[achId];
        const achDiv = document.createElement('div');
        achDiv.className = 'achievement-item';
        let achHTML = `<h4>${ach.name}</h4><p>${ach.description}</p>`;
        ach.tiers.forEach(tier => {
            const tierDiv = document.createElement('div');
            tierDiv.className = `achievement-tier ${tier.unlocked ? 'unlocked' : 'locked'}`;
            let rewardString = "";
            if (tier.reward.sp) rewardString += `${formatNumber(tier.reward.sp)} SP`;
            if (tier.reward.uv) rewardString += (rewardString ? ", " : "") + `${formatNumber(tier.reward.uv)} UV`;
            if (tier.reward.pdc) rewardString += (rewardString ? ", " : "") + `${(tier.reward.pdc * 100).toFixed(1)}% Bonus`;
            tierDiv.innerHTML = `
                <strong>${tier.name}</strong>: ${tier.desc}
                ${tier.unlocked ? `<span class="tier-reward">(Belohnung erhalten: ${rewardString})</span>` : `<span class="tier-reward">(Belohnung: ${rewardString})</span>`}
            `;
            achHTML += tierDiv.outerHTML;
        });
        achDiv.innerHTML = achHTML;
        achievementsListContainer.appendChild(achDiv);
    }
}

function showAchievementNotification(achName, tierName, reward) {
    if (!achievementNotificationElement || !achievementNameElement || !achievementTierElement || !achievementRewardElement) return;
    achievementNameElement.textContent = achName;
    achievementTierElement.textContent = `Stufe: ${tierName}`;
    let rewardString = "Belohnung: ";
    const rewards = [];
    if (reward.sp) rewards.push(`${formatNumber(reward.sp)} SP`);
    if (reward.uv) rewards.push(`${formatNumber(reward.uv)} UV`);
    if (reward.pdc) rewards.push(`${(reward.pdc * 100).toFixed(1)}% permanenter Bonus`);
    rewardString += rewards.join(', ');
    achievementRewardElement.textContent = rewardString;
    achievementNotificationElement.classList.add('show');
    setTimeout(() => {
        achievementNotificationElement.classList.remove('show');
    }, 5000);
}

// --- Exported UI and Achievement Functions (callable by other modules like casino.js) ---
export function updateUI() {
    if (spDisplay) spDisplay.textContent = formatNumber(gameState.sp);
    if (uvDisplay) uvDisplay.textContent = formatNumber(gameState.uv);
    if (pdcDisplay) pdcDisplay.textContent = (gameState.pdc * 100).toFixed(2) + '%';
    if (spPerClickDisplay) spPerClickDisplay.textContent = formatNumber(gameState.spPerClick);
    if (totalSpsDisplay) totalSpsDisplay.textContent = formatNumber(gameState.totalSps);

    if (prestigeButton) prestigeButton.style.display = (gameState.sp >= 1e12) ? 'block' : 'none';
    if (implementFirewallButton) {
        const project = gameState.firewallProject;
        if (project.implemented) {
            implementFirewallButton.textContent = `${project.name} (Implementiert)`;
            implementFirewallButton.disabled = true;
        } else {
            implementFirewallButton.textContent = `Implementiere Firewall (Kosten: ${formatNumber(project.costSP)} SP, ${formatNumber(project.costUV)} UV)`;
            implementFirewallButton.disabled = gameState.sp < project.costSP || gameState.uv < project.costUV;
        }
    }

    // Update casino games UI if the module is initialized and function exists
    if (typeof updateCasinoGamesUI === 'function') {
        updateCasinoGamesUI();
    }
    updateAllBuyButtonStates(); // Refresh all buy buttons
}

// NEW function to update buy button text and disabled state
function updateBuyButtonState(upgradeId, upgradeType, selectedAmount) {
    const item = upgradeType === 'click'
        ? gameState.clickUpgrades.find(u => u.id === upgradeId)
        : gameState.generators.find(g => g.id === upgradeId);

    if (!item) return;

    const buyButton = document.querySelector(`.buy-button[data-upgrade-id="${upgradeId}"][data-upgrade-type="${upgradeType}"]`);
    if (!buyButton) return;

    const currentLevelOrCount = upgradeType === 'click' ? item.level : item.count;
    const purchaseInfo = getCumulativePurchaseInfo(item, selectedAmount, currentLevelOrCount, gameState.sp, gameState.uv);

    let costString = `${formatNumber(purchaseInfo.spCost)} SP`;
    if (item.baseUVCost && item.baseUVCost > 0) {
        costString += ` + ${formatNumber(purchaseInfo.uvCost)} UV`;
    }
    
    const displayQuantity = selectedAmount === 'MAX' ? (purchaseInfo.purchasedCount > 0 ? purchaseInfo.purchasedCount : 'Max') : selectedAmount;

    if (purchaseInfo.purchasedCount > 0) {
        buyButton.textContent = `Kaufe ${displayQuantity} für ${costString}`;
        buyButton.disabled = false;
    } else {
        // For MAX buy, if nothing can be bought, reflect that.
        // For specific quantities, if not affordable, also reflect that.
        const buyText = selectedAmount === 'MAX' ? `Kaufe Max (Nicht genug Ressourcen)` : `Kaufe ${selectedAmount} (Nicht genug Ressourcen)`;
        buyButton.textContent = buyText;
        buyButton.disabled = true;
    }
}

export function checkAchievements() {
    let newAchievementUnlocked = false;
    for (const achId in gameState.achievements) {
        const ach = gameState.achievements[achId];
        let currentValue;
        switch (ach.checkType) {
            case 'stat': currentValue = gameState.stats[ach.statProperty] || 0; break;
            case 'generatorCount':
                const gen = gameState.generators.find(g => g.id === ach.generatorId);
                currentValue = gen ? gen.count : 0;
                break;
            case 'distinctGeneratorTypes': currentValue = gameState.generators.filter(g => g.count > 0).length; break;
            case 'currency': currentValue = gameState[ach.currencyType] || 0; break;
            case 'gameValue': currentValue = gameState[ach.valueProperty] || 0; break;
            default: currentValue = 0;
        }
        for (const tier of ach.tiers) {
            if (!tier.unlocked && currentValue >= tier.value) {
                tier.unlocked = true;
                newAchievementUnlocked = true;
                if (tier.reward.sp) gameState.sp += tier.reward.sp;
                if (tier.reward.uv) gameState.uv += tier.reward.uv;
                if (tier.reward.pdc) {
                    gameState.pdc += tier.reward.pdc;
                    calculateSpPerClick();
                }
                showAchievementNotification(ach.name, tier.name, tier.reward);
            }
        }
    }
    if (newAchievementUnlocked) {
        renderAchievements();
        updateUI();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Assign to module-scoped variables
    spDisplay = document.getElementById('sp-display');
    uvDisplay = document.getElementById('uv-display');
    pdcDisplay = document.getElementById('pdc-display');
    spPerClickDisplay = document.getElementById('sp-per-click-display');
    totalSpsDisplay = document.getElementById('total-sps-display');
    clickButton = document.getElementById('click-button');
    perClickUpgradesList = document.getElementById('per-click-upgrades-list');
    automatedGeneratorsList = document.getElementById('automated-generators-list');
    implementFirewallButton = document.getElementById('implement-firewall-button');
    prestigeUpgradesList = document.getElementById('prestige-upgrades-list');
    prestigeButton = document.getElementById('prestige-button');
    achievementsListContainer = document.getElementById('achievements-list-container');
    resetButton = document.getElementById('reset-button');
    exportSeedButton = document.getElementById('export-seed-button');
    importSeedButton = document.getElementById('import-seed-button');
    casinoModal = document.getElementById('casino-modal');
    openCasinoButton = document.getElementById('open-casino-button');
    closeModalButton = document.querySelector('#casino-modal .close-modal-button');
    achievementNotificationElement = document.getElementById('achievement-notification');
    achievementNameElement = document.getElementById('achievement-toast-name');
    achievementTierElement = document.getElementById('achievement-toast-tier');
    achievementRewardElement = document.getElementById('achievement-toast-reward-text');

    // --- Game Logic Functions (defined within DOMContentLoaded, call top-level exported functions for UI/Achievements) ---
    function clickTicket() {
        gameState.sp += gameState.spPerClick;
        gameState.stats.totalClicksMade++;
        updateUI(); // Calls exported updateUI
        checkAchievements(); // Calls exported checkAchievements
    }

    function purchaseFirewallProject() {
        const project = gameState.firewallProject;
        if (project.implemented) {
            alert(`${project.name} wurde bereits implementiert!`);
            return;
        }
        if (gameState.sp >= project.costSP && gameState.uv >= project.costUV) {
            gameState.sp -= project.costSP;
            gameState.uv -= project.costUV;
            project.implemented = true;
            alert(`${project.name} erfolgreich implementiert!`);
            updateUI();
            checkAchievements();
        } else {
            alert("Nicht genug Ressourcen (SP oder UV) für das Firewall-Projekt!");
        }
    }

    function calculateAndAwardOfflineProgress(previousTimestamp) {
        if (!previousTimestamp || typeof previousTimestamp !== 'number' || previousTimestamp <= 0) return 0;
        const currentTimestamp = Date.now();
        if (previousTimestamp > currentTimestamp) return 0;
        const offlineDurationSeconds = (currentTimestamp - previousTimestamp) / 1000;
        if (offlineDurationSeconds <= 10) return 0;
        const maxOfflineSeconds = 7 * 24 * 60 * 60;
        const effectiveOfflineSeconds = Math.min(offlineDurationSeconds, maxOfflineSeconds);
        const potentialOfflineEarnings = effectiveOfflineSeconds * gameState.totalSps;
        return Math.floor(potentialOfflineEarnings * 0.30);
    }

    function getAchievementSaveString() {
        const unlockedAchievements = [];
        for (const achId in gameState.achievements) {
            const ach = gameState.achievements[achId];
            const highestUnlockedTierIndex = ach.tiers.reduce((maxIndex, tier, currentIndex) =>
                (tier.unlocked ? currentIndex : maxIndex), -1);
            if (highestUnlockedTierIndex > -1) {
                unlockedAchievements.push(`${achId}:${highestUnlockedTierIndex}`);
            }
        }
        return unlockedAchievements.join(';');
    }

    // --- Game Loop ---
    function gameLoop() {
        const effectiveSps = gameState.totalSps * (1 + gameState.pdc);
        gameState.sp += effectiveSps / 10;
        const avClubGurus = gameState.generators.find(g => g.id === 'avClubGurus');
        if (avClubGurus && avClubGurus.count > 0) {
            for (let i = 0; i < avClubGurus.count; i++) {
                if (Math.random() < (avClubGurus.generatesUVChance / 10)) {
                    gameState.uv += avClubGurus.generatesUVAmount;
                }
            }
        }
        updateUI();
        checkAchievements();
    }

    // --- Persistence ---
    function exportGameStateAsSeed() {
        const clickUpgradeData = gameState.clickUpgrades.map(u => `${u.id}:${u.level}`).join(',');
        const generatorData = gameState.generators.map(g => `${g.id}:${g.count}`).join(',');
        const achievementData = getAchievementSaveString();
        const seedVersion = "1.3"; // Updated version to reflect new stats
        const seedPayload = [
            seedVersion,
            gameState.sp,
            gameState.uv,
            gameState.pdc.toFixed(4),
            clickUpgradeData,
            generatorData,
            gameState.prestigesDone,
            gameState.firewallProject.implemented ? "1" : "0",
            Date.now(),
            `${gameState.stats.totalClicksMade},${gameState.stats.lotteryPlays},${gameState.stats.lotteryJackpots},${gameState.stats.higherLowerPlays || 0},${gameState.stats.higherLowerWins || 0},${gameState.stats.higherLowerHighestStreak || 0}`,
            achievementData
        ].join('|');
        try {
            const encodedSeed = btoa(seedPayload);
            prompt(`Spiel-Seed (Version ${seedVersion}):\nKopieren Sie diesen Text:`, encodedSeed);
        } catch (e) {
            console.error("Fehler beim Generieren des Seeds:", e);
            alert("Seed konnte nicht generiert werden.");
        }
    }

    function importGameStateFromSeed(encodedSeedFromPrompt) {
        let encodedSeed = encodedSeedFromPrompt;
        if (!encodedSeed) encodedSeed = prompt("Paste your game seed here:");
        if (!encodedSeed || encodedSeed.trim() === "") {
            alert("Kein Seed angegeben oder Seed ist leer.");
            return;
        }
        try {
            const seedPayload = atob(encodedSeed);
            const parts = seedPayload.split('|');
            const seedVersion = parts[0];
            // Allow loading from previous versions for compatibility
            if (seedVersion !== "1" && seedVersion !== "1.1" && seedVersion !== "1.2" && seedVersion !== "1.3") {
                alert(`Ungültige oder nicht unterstützte Seed-Version.`);
                return;
            }
            const loadedGs = getInitialGameState(); // Start with a fresh state
            loadedGs.sp = parseInt(parts[1], 10);
            loadedGs.uv = parseInt(parts[2], 10);
            loadedGs.pdc = parseFloat(parts[3]);
            const clickUpgradeDataStr = parts[4];
            const generatorDataStr = parts[5];
            if (parts.length > 7) loadedGs.firewallProject.implemented = parts[7] === "1";
            loadedGs.prestigesDone = parseInt(parts[6], 10);
            let loadedTimestampFromSeed = null;
            if (parts.length > 8 && parts[8]) {
                const ts = parseInt(parts[8], 10);
                if (!isNaN(ts)) loadedTimestampFromSeed = ts;
            }
            if (parts.length > 9 && parts[9]) {
                const statParts = parts[9].split(',');
                loadedGs.stats.totalClicksMade = parseInt(statParts[0], 10) || 0;
                if (statParts.length > 1) loadedGs.stats.lotteryPlays = parseInt(statParts[1], 10) || 0;
                if (statParts.length > 2) loadedGs.stats.lotteryJackpots = parseInt(statParts[2], 10) || 0;
                // Load Higher or Lower stats if present (for seed version 1.3+)
                if (seedVersion === "1.3" || (seedVersion === "1.2" && statParts.length > 3)) { // Check for 1.2 for forward compatibility if it was accidentally saved with more stats
                    if (statParts.length > 3) loadedGs.stats.higherLowerPlays = parseInt(statParts[3], 10) || 0;
                    if (statParts.length > 4) loadedGs.stats.higherLowerWins = parseInt(statParts[4], 10) || 0;
                    if (statParts.length > 5) loadedGs.stats.higherLowerHighestStreak = parseInt(statParts[5], 10) || 0;
                }
            }
            if (parts.length > 10 && parts[10]) {
                parts[10].split(';').forEach(achState => {
                    if (!achState) return;
                    const [achId, highestTierIndexStr] = achState.split(':');
                    const highestTierIndex = parseInt(highestTierIndexStr, 10);
                    if (loadedGs.achievements[achId] && !isNaN(highestTierIndex)) {
                        for (let i = 0; i <= highestTierIndex; i++) {
                            if (loadedGs.achievements[achId].tiers[i]) {
                                loadedGs.achievements[achId].tiers[i].unlocked = true;
                            }
                        }
                    }
                });
            }
            if (isNaN(loadedGs.sp) || isNaN(loadedGs.uv) || isNaN(loadedGs.pdc) || isNaN(loadedGs.prestigesDone)) {
                throw new Error("Ungültige numerische Daten im Seed.");
            }
            clickUpgradeDataStr.split(',').forEach(pair => {
                if (!pair) return;
                const [id, levelStr] = pair.split(':');
                const level = parseInt(levelStr, 10);
                if (id && !isNaN(level)) {
                    const upgrade = loadedGs.clickUpgrades.find(u => u.id === id);
                    if (upgrade) upgrade.level = level;
                }
            });
            generatorDataStr.split(',').forEach(pair => {
                if (!pair) return;
                const [id, countStr] = pair.split(':');
                const count = parseInt(countStr, 10);
                if (id && !isNaN(count)) {
                    const generator = loadedGs.generators.find(g => g.id === id);
                    if (generator) generator.count = count;
                }
            });
            gameState = loadedGs; // Assign the fully loaded state
            calculateSpPerClick();
            calculateTotalSps();
            const offlineEarnings = calculateAndAwardOfflineProgress(loadedTimestampFromSeed);
            if (offlineEarnings > 0) {
                gameState.sp += offlineEarnings;
                alert(`Willkommen zurück!\nDu hast ${formatNumber(offlineEarnings)} SP verdient, während du offline warst.`);
            }
            checkAchievements(); // Check achievements after loading all state
            alert("Spiel von Seed geladen!");
        } catch (e) {
            console.error("Error loading from seed:", e);
            alert("Seed konnte nicht geladen werden.\nFehler: " + e.message);
        }
        finalizeStateLoad(); // Ensure UI is updated after import, regardless of prompt cancellation
    }

    function getInitialGameState() {
        // Deep copy of the initial state structure to avoid modification issues
        return JSON.parse(JSON.stringify({
            sp: 0, uv: 0, pdc: 0, spPerClick: 1, totalSps: 0,
            clickUpgrades: [
                { id: 'ergonomicMousepad', name: 'Ergonomisches Mauspad', level: 0, baseCost: 10, costMultiplier: 1.15, baseSpPerClickBonus: 1, description: 'Mehr Komfort, schnellere Klicks.' },
                { id: 'advancedGoogling', name: 'Fortgeschrittene Google-Fähigkeiten', level: 0, baseCost: 100, costMultiplier: 1.20, baseSpPerClickBonus: 5, description: 'Finden Sie Lösungen in Rekordzeit.' },
                { id: 'macroMagic', name: 'Makro-Magie', level: 0, baseCost: 1000, costMultiplier: 1.25, baseSpPerClickBonus: 20, description: 'Automatisieren Sie sich wiederholende Klickaufgaben.' },
            ],
            generators: [
                { id: 'helpdeskIntern', name: 'Helpdesk-Praktikant', count: 0, baseCost: 50, costMultiplier: 1.18, baseSps: 1, description: 'Beantwortet einfache Fragen, holt Kaffee.' },
                { id: 'patchManagement', name: 'Automatisiertes Patch-System', count: 0, baseCost: 500, costMultiplier: 1.22, baseSps: 10, description: 'Hält Systeme automatisch auf dem neuesten Stand.' },
                { id: 'remoteSupportTeam', name: 'Remote-Support-Team (L2)', count: 0, baseCost: 5000, costMultiplier: 1.25, baseSps: 75, description: 'Behandelt schwierigere Probleme aus der Ferne.' },
                { id: 'avClubGurus', name: 'AV-Club-Gurus', count: 0, baseCost: 100000, baseUVCost: 5, costMultiplier: 1.30, baseSps: 250, generatesUVChance: 0.05, generatesUVAmount: 1, description: 'Generiert SP. Chance, UV durch "Vermietung von Ausrüstung" oder "Gewinn von Tech-Messen" zu generieren.' },
                { id: 'cybersecurityTaskForce', name: 'Cybersecurity-Taskforce', count: 0, baseCost: 500000, baseUVCost: 20, costMultiplier: 1.35, baseSps: 1000, crisisMitigationFactor: 0.1, description: 'Generiert SP. Hilft, die Auswirkungen negativer Zufallsereignisse zu reduzieren.' },
                { id: 'instructionalTechnologists', name: 'Instructional Technologists', count: 0, baseCost: 250000, baseUVCost: 10, costMultiplier: 1.32, baseSps: 600, happinessBoostPerUnit: 1, description: 'Generiert SP. Erhöht passiv die "Lehrerzufriedenheit".' },
            ],
            firewallProject: { id: 'firewall', name: 'Firewall Implementierung', costSP: 750000, costUV: 30, implemented: false },
            prestigesDone: 0, prestigeUpgrades: [], lastSavedTimestamp: null,
            stats: {
                totalClicksMade: 0,
                lotteryPlays: 0,
                lotteryJackpots: 0,
                higherLowerPlays: 0,
                higherLowerWins: 0,
                higherLowerHighestStreak: 0,
            },
            blackjack: {
                deck: [], playerHand: [], dealerHand: [], playerScore: 0, dealerScore: 0,
                betAmount: 0, gameInProgress: false,
                message: "Setze deinen Einsatz und klicke auf 'Deal'.", dealerRevealed: false
            },
            higherLower: {
                deck: [], previousCard: null, currentCard: null, betAmount: 0, streak: 0,
                gameInProgress: false, message: "Setze deinen Einsatz und starte das Spiel.", potentialWinnings: 0
            },
            itLotteryCostSP: 10000, itLotteryLastResult: "Noch nicht gespielt.",
            achievements: {
                unermuedlicherKlicker: { name: 'Der Unermüdliche', description: 'Klicke wiederholt auf den "Problem lösen"-Button.', tiers: [ { name: 'Bronze', value: 1000, reward: { sp: 10000 }, unlocked: false, desc: '1.000 Klicks.' },{ name: 'Silber', value: 5000, reward: { sp: 50000 }, unlocked: false, desc: '5.000 Klicks.' },{ name: 'Gold', value: 10000, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: '10.000 Klicks.' } ], checkType: 'stat', statProperty: 'totalClicksMade' },
                praktikantenDompteur: { name: 'Praktikanten-Dompteur', description: 'Stelle eine Armee von Helpdesk-Praktikanten ein.', tiers: [ { name: 'Bronze', value: 10, reward: { sp: 25000 }, unlocked: false, desc: '10 Praktikanten.' },{ name: 'Silber', value: 25, reward: { sp: 100000, uv: 20 }, unlocked: false, desc: '25 Praktikanten.' },{ name: 'Gold', value: 50, reward: { sp: 500000, uv: 50, pdc: 0.01 }, unlocked: false, desc: '50 Praktikanten.' } ], checkType: 'generatorCount', generatorId: 'helpdeskIntern' },
                automatisierungsAficionado: { name: 'Automatisierungs-Aficionado', description: 'Nutze eine Vielzahl automatisierter Systeme.', tiers: [ { name: 'Bronze', value: 3, reward: { sp: 100000 }, unlocked: false, desc: '3 verschiedene Typen.' },{ name: 'Silber', value: 4, reward: { sp: 400000, uv: 30 }, unlocked: false, desc: '4 verschiedene Typen.' },{ name: 'Gold', value: 5, reward: { sp: 1000000, uv: 100, pdc: 0.02 }, unlocked: false, desc: '5 verschiedene Typen.' } ], checkType: 'distinctGeneratorTypes' },
                gutscheinTycoon: { name: 'Gutschein-Tycoon', description: 'Horte Upgrade-Voucher (UV).', tiers: [ { name: 'Bronze', value: 100, reward: { sp: 150000 }, unlocked: false, desc: '100 UV.' },{ name: 'Silber', value: 500, reward: { sp: 750000, uv: 50 }, unlocked: false, desc: '500 UV.' },{ name: 'Gold', value: 1000, reward: { sp: 2000000, uv: 100, pdc: 0.02 }, unlocked: false, desc: '1.000 UV.' } ], checkType: 'currency', currencyType: 'uv' },
                risikofreudig: { name: 'Risikofreudig', description: 'Versuche dein Glück bei der IT-Lotterie.', tiers: [ { name: 'Bronze', value: 10, reward: { sp: 5000 }, unlocked: false, desc: '10 Mal gespielt.' },{ name: 'Silber', value: 50, reward: { sp: 25000, uv: 5 }, unlocked: false, desc: '50 Mal gespielt.' },{ name: 'Gold', value: 100, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: '100 Mal gespielt.' } ], checkType: 'stat', statProperty: 'lotteryPlays' },
                glueckspilz: { name: 'Glückspilz', description: 'Knacke den Jackpot in der IT-Lotterie.', tiers: [ { name: 'Bronze', value: 1, reward: { sp: 200000, uv: 20, pdc: 0.005 }, unlocked: false, desc: '1 Jackpot gewonnen.' } ], checkType: 'stat', statProperty: 'lotteryJackpots' },
                kartenhai: { name: 'Kartenhai', description: 'Erreiche eine hohe Serie bei Höher oder Tiefer.', tiers: [ { name: 'Bronze', value: 3, reward: { sp: 20000 }, unlocked: false, desc: 'Erreiche eine Serie von 3.' }, { name: 'Silber', value: 7, reward: { sp: 100000, uv: 10 }, unlocked: false, desc: 'Erreiche eine Serie von 7.' }, { name: 'Gold', value: 12, reward: { sp: 500000, uv: 25, pdc: 0.005 }, unlocked: false, desc: 'Erreiche eine Serie von 12.' } ], checkType: 'stat', statProperty: 'higherLowerHighestStreak' }
            }
        }));
    }

    function resetGameConfirm() {
        if (confirm('Sind Sie sicher, dass Sie den gesamten Fortschritt zurücksetzen möchten? Dies kann nicht rückgängig gemacht werden!')) {
            gameState = getInitialGameState();
            finalizeStateLoad();
            alert('Spiel zurückgesetzt!');
        }
    }

    function finalizeStateLoad() {
        calculateSpPerClick();
        calculateTotalSps();
        renderAll(); // This will call the top-level renderAchievements and updateUI
        updateUI(); // Ensure main UI is also updated
    }

    function renderAll() {
        renderPerClickUpgrades(); // Internal rendering
        renderAutomatedGenerators(); // Internal rendering
        renderAchievements(); // Calls exported renderAchievements
    }

    // --- Initialization ---
    function init() {
        if (clickButton) clickButton.addEventListener('click', clickTicket);
        if (resetButton) resetButton.addEventListener('click', resetGameConfirm);
        if (exportSeedButton) exportSeedButton.addEventListener('click', exportGameStateAsSeed);
        if (importSeedButton) importSeedButton.addEventListener('click', () => importGameStateFromSeed());
        if (implementFirewallButton) implementFirewallButton.addEventListener('click', purchaseFirewallProject);

        // New delegated event listener for upgrade lists
        function handleUpgradeListClick(event) {
            const target = event.target;

            if (target.classList.contains('quantity-btn')) {
                const selectorDiv = target.closest('.quantity-selector');
                if (!selectorDiv) return;

                const upgradeId = selectorDiv.dataset.upgradeId;
                const upgradeType = selectorDiv.dataset.upgradeType;
                const amount = target.dataset.amount;

                selectorDiv.querySelectorAll('.quantity-btn').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');

                updateBuyButtonState(upgradeId, upgradeType, amount);

            } else if (target.classList.contains('buy-button')) {
                const upgradeId = target.dataset.upgradeId;
                const upgradeType = target.dataset.upgradeType;
                
                const quantitySelectorDiv = target.closest('.upgrade-item, .generator-item').querySelector('.quantity-selector');
                if (!quantitySelectorDiv) return;
                
                const activeQuantityButton = quantitySelectorDiv.querySelector('.quantity-btn.active');
                const selectedQuantity = activeQuantityButton ? activeQuantityButton.dataset.amount : "1";

                if (upgradeType === 'click') {
                    buyClickUpgradeHandler(upgradeId, selectedQuantity);
                } else if (upgradeType === 'generator') {
                    buyGeneratorHandler(upgradeId, selectedQuantity);
                }
            }
        }

        if (perClickUpgradesList) perClickUpgradesList.addEventListener('click', handleUpgradeListClick);
        if (automatedGeneratorsList) automatedGeneratorsList.addEventListener('click', handleUpgradeListClick);

        // New Handler functions for buying
        function buyClickUpgradeHandler(upgradeId, requestedQuantity) {
            const upgrade = gameState.clickUpgrades.find(u => u.id === upgradeId);
            if (!upgrade) return;

            const purchaseInfo = getCumulativePurchaseInfo(upgrade, requestedQuantity, upgrade.level, gameState.sp, gameState.uv);

            if (purchaseInfo.purchasedCount > 0) {
                gameState.sp -= purchaseInfo.spCost;
                upgrade.level += purchaseInfo.purchasedCount;
                
                calculateSpPerClick();
                renderPerClickUpgrades(); // Re-render to update levels and costs
                updateUI(); 
                checkAchievements();
            } else {
                // alert("Nicht genug SP!"); // Optionally notify user
            }
        }

        function buyGeneratorHandler(generatorId, requestedQuantity) {
            const generator = gameState.generators.find(g => g.id === generatorId);
            if (!generator) return;

            const purchaseInfo = getCumulativePurchaseInfo(generator, requestedQuantity, generator.count, gameState.sp, gameState.uv);

            if (purchaseInfo.purchasedCount > 0) {
                gameState.sp -= purchaseInfo.spCost;
                gameState.uv -= purchaseInfo.uvCost;
                generator.count += purchaseInfo.purchasedCount;

                calculateTotalSps();
                renderAutomatedGenerators(); 
                updateUI();
                checkAchievements();
            } else {
                // alert("Nicht genug Ressourcen (SP oder UV)!");
            }
        }

        if (openCasinoButton && casinoModal) {
            openCasinoButton.addEventListener('click', () => { casinoModal.style.display = 'flex'; });
        }
        if (closeModalButton && casinoModal) {
            closeModalButton.addEventListener('click', () => { casinoModal.style.display = 'none'; });
        }
        if (casinoModal) {
            window.addEventListener('click', (event) => {
                if (event.target === casinoModal) casinoModal.style.display = 'none';
            });
        }
        
        initCasino(); // Initialize casino module

        // Attempt to load from seed, or start new game if prompt is cancelled
        const seedFromPrompt = prompt("Möchtest du einen Spielstand laden? Gib deinen Seed ein oder klicke auf 'Abbrechen' für ein neues Spiel.");
        if (seedFromPrompt !== null && seedFromPrompt.trim() !== "") {
            importGameStateFromSeed(seedFromPrompt); // Pass the seed directly
        } else {
            // If prompt is cancelled or empty, finalizeStateLoad will use the initial game state
            console.log("Neues Spiel gestartet oder kein Seed eingegeben.");
            gameState = getInitialGameState(); // Ensure it starts with a fresh state if no seed
        }
        
        finalizeStateLoad();
        setInterval(gameLoop, 100);
        console.log("School District Digital Hero initialisiert!");
    }

    function updateAllBuyButtonStates() {
        document.querySelectorAll('.quantity-selector').forEach(selectorDiv => {
            const upgradeId = selectorDiv.dataset.upgradeId;
            const upgradeType = selectorDiv.dataset.upgradeType;
            const activeButton = selectorDiv.querySelector('.quantity-btn.active');
            const amount = activeButton ? activeButton.dataset.amount : '1';
            updateBuyButtonState(upgradeId, upgradeType, amount);
        });
    }
    init();
});
