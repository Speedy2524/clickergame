document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const spDisplay = document.getElementById('sp-display');
    const uvDisplay = document.getElementById('uv-display');
    const pdcDisplay = document.getElementById('pdc-display');
    const spPerClickDisplay = document.getElementById('sp-per-click-display');
    const totalSpsDisplay = document.getElementById('total-sps-display');

    const clickButton = document.getElementById('click-button');
    const perClickUpgradesList = document.getElementById('per-click-upgrades-list');
    const automatedGeneratorsList = document.getElementById('automated-generators-list');
    // const specialUnlocksList = document.getElementById('special-unlocks-list');
    const implementFirewallButton = document.getElementById('implement-firewall-button');
    const prestigeUpgradesList = document.getElementById('prestige-upgrades-list');
    const prestigeButton = document.getElementById('prestige-button');

    const achievementsListContainer = document.getElementById('achievements-list-container');
    const resetButton = document.getElementById('reset-button');
    const exportSeedButton = document.getElementById('export-seed-button'); // Add this button to your HTML
    const importSeedButton = document.getElementById('import-seed-button'); // Add this button to your HTML
    // Gambling elements
    const playLotteryButton = document.getElementById('play-lottery-button');
    const lotteryCostDisplay = document.getElementById('lottery-cost-display');
    const lotteryResultDisplay = document.getElementById('lottery-result-display');
    // Casino Modal elements
    const casinoModal = document.getElementById('casino-modal');
    const openCasinoButton = document.getElementById('open-casino-button');
    const closeModalButton = document.querySelector('#casino-modal .close-modal-button');

    // --- Game State ---
    let gameState = {
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
            // New Specialized Tech Teams
            { id: 'avClubGurus', name: 'AV-Club-Gurus', count: 0, baseCost: 100000, baseUVCost: 5, costMultiplier: 1.30, baseSps: 250, generatesUVChance: 0.05, generatesUVAmount: 1, description: 'Generiert SP. Chance, UV durch "Vermietung von Ausrüstung" oder "Gewinn von Tech-Messen" zu generieren.' },
            { id: 'cybersecurityTaskForce', name: 'Cybersecurity-Taskforce', count: 0, baseCost: 500000, baseUVCost: 20, costMultiplier: 1.35, baseSps: 1000, crisisMitigationFactor: 0.1, description: 'Generiert SP. Hilft, die Auswirkungen negativer Zufallsereignisse zu reduzieren.' },
            { id: 'instructionalTechnologists', name: 'Instructional Technologists', count: 0, baseCost: 250000, baseUVCost: 10, costMultiplier: 1.32, baseSps: 600, happinessBoostPerUnit: 1, description: 'Generiert SP. Erhöht passiv die "Lehrerzufriedenheit".' },
        ],
        // Spezielle Projekte / Freischaltungen
        firewallProject: {
            id: 'firewall',
            name: 'Firewall Implementierung',
            costSP: 750000, // Beispielkosten
            costUV: 30,    // Beispielkosten
            implemented: false
        },
        // prestige related (to be expanded)
        prestigesDone: 0,
        prestigeUpgrades: [], // e.g., { id: 'veteranDiscount', level: 0, effect: 0.01 }
        lastSavedTimestamp: null,
        itLotteryCostSP: 10000, // Kosten für ein Lotterielos
        itLotteryLastResult: "Noch nicht gespielt.",
        stats: { // Für Errungenschafts-Tracking
            totalClicksMade: 0,
            lotteryPlays: 0,
            lotteryJackpots: 0,
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
            // Weitere Errungenschaften hier einfügen (Jahrhundert-Klicker, Bandbreiten-Baron etc. nach gleichem Muster)
            // Beispiel für Erste Systemüberholung (wenn Prestige implementiert ist)
            // ersteSystemueberholung: {
            //     name: 'Erste Systemüberholung', description: 'Führe dein erstes Prestige durch.',
            //     tiers: [ { name: 'Gold', value: 1, reward: { sp: 1000000, uv: 50, pdc: 0.05 }, unlocked: false, desc: '1. Prestige.' } ],
            //     checkType: 'stat', statProperty: 'prestigesDone'
            // },
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
            }
        }
    };

    // --- Game Logic Functions ---

    function calculateSpPerClick() {
        let totalBonus = 0;
        gameState.clickUpgrades.forEach(upgrade => {
            totalBonus += upgrade.level * upgrade.baseSpPerClickBonus;
        });
        // Add prestige bonuses later if any
        gameState.spPerClick = (1 + totalBonus) * (1 + gameState.pdc); // PDC Bonus anwenden
    }

    function calculateTotalSps() {
        let total = 0;
        gameState.generators.forEach(gen => {
            total += gen.count * gen.baseSps;
        });
        // Add prestige bonuses later
        // PDC Bonus wird im gameLoop direkt auf die generierten SPs angewendet, nicht auf totalSps selbst
        gameState.totalSps = total; 
    }

    function getCost(item) {
        // For click upgrades, cost increases with level
        // For generators, cost increases with count
        const levelOrCount = item.level !== undefined ? item.level : item.count;
        const spCost = Math.floor(item.baseCost * Math.pow(item.costMultiplier, levelOrCount));
        const uvCost = item.baseUVCost ? Math.floor(item.baseUVCost * Math.pow(item.costMultiplier, levelOrCount)) : 0;
        // Ensure UV cost doesn't become 0 if baseUVCost was > 0 but levelOrCount is 0 and multiplier made it < 1.
        // For simplicity, if baseUVCost is defined, it's at least that baseUVCost for the first purchase if not scaling up.
        // Or, more simply, if baseUVCost is defined, it scales. If it's 0, it stays 0.
        return { sp: spCost, uv: uvCost };
    }

    function clickTicket() {
        gameState.sp += gameState.spPerClick;
        gameState.stats.totalClicksMade++;
        updateUI();
        checkAchievements();
    }

    function buyClickUpgrade(index) {
        const upgrade = gameState.clickUpgrades[index];
        const cost = getCost(upgrade).sp; // Click upgrades currently only cost SP
        if (gameState.sp >= cost) { // Only check SP for click upgrades
            gameState.sp -= cost; // Deduct only SP
            upgrade.level++;
            calculateSpPerClick();
            renderPerClickUpgrades();
            updateUI();
            checkAchievements();
        } else {
            alert("Nicht genug SP!"); // Sollte sein: alert("Nicht genug SP!");
        }
    }

    function buyGenerator(index) {
        const generator = gameState.generators[index];
        const cost = getCost(generator);
        if (gameState.sp >= cost.sp && gameState.uv >= cost.uv) {
            gameState.sp -= cost.sp;
            gameState.uv -= cost.uv;
            generator.count++;
            calculateTotalSps();
            renderAutomatedGenerators();
            updateUI();
            checkAchievements();
        } else {
            alert("Nicht genug Ressourcen (SP oder UV)!"); // Sollte sein: alert("Nicht genug Ressourcen (SP oder UV)!");
        }
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
            // Hier könnte man noch einen spezifischen Effekt der Firewall auslösen, falls gewünscht.
            updateUI(); // UI aktualisieren, um den Button-Status zu ändern
            checkAchievements();
        } else {
            alert("Nicht genug Ressourcen (SP oder UV) für das Firewall-Projekt!");
        }
    }

    function calculateAndAwardOfflineProgress(previousTimestamp) {
        if (!previousTimestamp || typeof previousTimestamp !== 'number' || previousTimestamp <= 0) {
            console.log("Kein gültiger vorheriger Zeitstempel für Offline-Fortschritt gefunden oder Zeitstempel ist ungültig.");
            return 0; // Kein Fortschritt zu berechnen
        }

        const currentTimestamp = Date.now();
        // Ensure previousTimestamp is not in the future (e.g. system clock changed)
        if (previousTimestamp > currentTimestamp) {
            console.warn("Vorheriger Zeitstempel liegt in der Zukunft. Kein Offline-Fortschritt berechnet.");
            return 0;
        }
        const offlineDurationSeconds = (currentTimestamp - previousTimestamp) / 1000;

        if (offlineDurationSeconds <= 10) { // Mindest-Offlinezeit, um kleine Schwankungen zu ignorieren (z.B. 10 Sekunden)
            return 0;
        }

        const maxOfflineSeconds = 7 * 24 * 60 * 60; // Maximal 7 Tage Offline-Fortschritt
        const effectiveOfflineSeconds = Math.min(offlineDurationSeconds, maxOfflineSeconds);

        // gameState.totalSps sollte bereits basierend auf dem geladenen Zustand berechnet sein
        const potentialOfflineEarnings = effectiveOfflineSeconds * gameState.totalSps;
        const awardedOfflineEarnings = Math.floor(potentialOfflineEarnings * 0.30);
        return awardedOfflineEarnings;
    }

    // --- Gambling Logic ---
    function playITLottery() {
        if (gameState.sp < gameState.itLotteryCostSP) {
            gameState.itLotteryLastResult = "Nicht genug SP für ein Los!";
            updateUI();
            return;
        }

        gameState.sp -= gameState.itLotteryCostSP;
        gameState.stats.lotteryPlays++;

        const randomNumber = Math.random() * 100; // Zahl zwischen 0 und 99.99...
        let resultMessage = "";
        let spWon = 0;
        let uvWon = 0;

        if (randomNumber < 0.1) { // 0.1% Jackpot
            spWon = gameState.itLotteryCostSP * 10;
            uvWon = 5;
            resultMessage = `JACKPOT! Du gewinnst ${formatNumber(spWon)} SP und ${uvWon} UV!`;
            gameState.stats.lotteryJackpots++;
        } else if (randomNumber < 0.5) { // 0.4% UV Win (0.1 + 0.4 = 0.5)
            uvWon = 1;
            resultMessage = `Glückstreffer! Du gewinnst ${uvWon} UV!`;
        } else if (randomNumber < 3) { // 2.5% Large Win (0.5 + 2.5 = 3)
            spWon = gameState.itLotteryCostSP * 5;
            resultMessage = `Großer Gewinn! Du erhältst ${formatNumber(spWon)} SP!`;
        } else if (randomNumber < 10) { // 7% Medium Win (3 + 7 = 10)
            spWon = gameState.itLotteryCostSP * 2;
            resultMessage = `Schöner Gewinn! Du erhältst ${formatNumber(spWon)} SP!`;
        } else if (randomNumber < 25) { // 15% Break Even (10 + 15 = 25)
            spWon = gameState.itLotteryCostSP;
            resultMessage = `Einsatz zurück! Du erhältst ${formatNumber(spWon)} SP.`;
        } else if (randomNumber < 50) { // 25% Small Win (25 + 25 = 50)
            spWon = gameState.itLotteryCostSP * 0.5;
            resultMessage = `Kleiner Trostpreis! Du erhältst ${formatNumber(spWon)} SP.`;
        } else { // 50% Lose
            resultMessage = "Leider nichts gewonnen. Versuche es erneut!";
        }
        gameState.sp += spWon;
        gameState.uv += uvWon;
        gameState.itLotteryLastResult = resultMessage;
        updateUI();
        checkAchievements();
    }
    // --- Achievements Logic ---
    function checkAchievements() {
        let newAchievementUnlocked = false;
        for (const achId in gameState.achievements) {
            const ach = gameState.achievements[achId];
            let currentValue;

            switch (ach.checkType) {
                case 'stat':
                    currentValue = gameState.stats[ach.statProperty] || 0;
                    break;
                case 'generatorCount':
                    const gen = gameState.generators.find(g => g.id === ach.generatorId);
                    currentValue = gen ? gen.count : 0;
                    break;
                case 'distinctGeneratorTypes':
                    currentValue = gameState.generators.filter(g => g.count > 0).length;
                    break;
                case 'currency':
                    currentValue = gameState[ach.currencyType] || 0;
                    break;
                case 'gameValue': // For spPerClick, totalSps
                    currentValue = gameState[ach.valueProperty] || 0;
                    break;
                // case 'specificGeneratorSet': // Für "Schulgeist" / "Tech-Vielfalt"
                //     currentValue = ach.generatorIds.filter(id => {
                //         const specificGen = gameState.generators.find(g => g.id === id);
                //         return specificGen && specificGen.count > 0;
                //     }).length;
                //     break;
                default:
                    currentValue = 0;
            }

            for (const tier of ach.tiers) {
                if (!tier.unlocked && currentValue >= tier.value) {
                    tier.unlocked = true;
                    newAchievementUnlocked = true;
                    // Apply reward
                    if (tier.reward.sp) gameState.sp += tier.reward.sp;
                    if (tier.reward.uv) gameState.uv += tier.reward.uv;
                    if (tier.reward.pdc) {
                        gameState.pdc += tier.reward.pdc;
                        calculateSpPerClick(); // PDC beeinflusst SP/Klick
                        // calculateTotalSps(); // PDC beeinflusst SP/Sek (im Loop)
                    }
                    showAchievementNotification(ach.name, tier.name, tier.reward);
                }
            }
        }
        if (newAchievementUnlocked) {
            renderAchievements(); // Update achievement UI if something changed
            updateUI(); // Update main currency displays
        }
    }

    function showAchievementNotification(achName, tierName, reward) {
        const notificationElement = document.getElementById('achievement-notification');
        const nameElement = document.getElementById('achievement-toast-name');
        const tierElement = document.getElementById('achievement-toast-tier');
        const rewardElement = document.getElementById('achievement-toast-reward-text');

        if (!notificationElement || !nameElement || !tierElement || !rewardElement) return;

        nameElement.textContent = achName;
        tierElement.textContent = `Stufe: ${tierName}`;
        
        let rewardString = "Belohnung: ";
        const rewards = [];
        if (reward.sp) rewards.push(`${formatNumber(reward.sp)} SP`);
        if (reward.uv) rewards.push(`${formatNumber(reward.uv)} UV`);
        if (reward.pdc) rewards.push(`${(reward.pdc * 100).toFixed(1)}% permanenter Bonus`); // PDC als Bonus
        rewardString += rewards.join(', ');
        rewardElement.textContent = rewardString;

        notificationElement.classList.add('show');

        // Hide after a few seconds
        setTimeout(() => {
            notificationElement.classList.remove('show');
        }, 5000); // 5 Sekunden anzeigen
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
    // --- Rendering Functions ---

    function formatNumber(num) {
        if (num < 1e3) return num.toFixed(0);
        if (num < 1e6) return (num / 1e3).toFixed(2) + "K";
        if (num < 1e9) return (num / 1e6).toFixed(2) + "M";
        if (num < 1e12) return (num / 1e9).toFixed(2) + "B";
        if (num < 1e15) return (num / 1e12).toFixed(2) + "T";
        return num.toExponential(2);
    }

    function updateUI() {
        if (spDisplay) spDisplay.textContent = formatNumber(gameState.sp);
        if (uvDisplay) uvDisplay.textContent = formatNumber(gameState.uv);
        if (pdcDisplay) {
             // PDC als Prozentsatz anzeigen
            pdcDisplay.textContent = (gameState.pdc * 100).toFixed(2) + '%';
        } else {
            // Fallback, falls pdcDisplay nicht existiert, um Fehler zu vermeiden
        }
        if (spPerClickDisplay) spPerClickDisplay.textContent = formatNumber(gameState.spPerClick);
        if (totalSpsDisplay) totalSpsDisplay.textContent = formatNumber(gameState.totalSps);

        // Update button states (enabled/disabled based on cost)
        gameState.clickUpgrades.forEach((upgrade, index) => {
            const button = document.getElementById(`buy-click-upgrade-${upgrade.id}`);
            if (button) {
                // Click upgrades only cost SP for now
                button.disabled = gameState.sp < getCost(upgrade).sp;
            }
        });

        gameState.generators.forEach((generator, index) => {
            const button = document.getElementById(`buy-generator-${generator.id}`);
            if (button) {
                const cost = getCost(generator);
                button.disabled = gameState.sp < cost.sp || gameState.uv < cost.uv;
            }
        });

        // Prestige button visibility (example condition)
        if (prestigeButton) {
            prestigeButton.style.display = (gameState.sp >= 1e12) ? 'block' : 'none'; // Example logic
        }

        // Firewall Button Status aktualisieren
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

        // Gambling UI
        if (lotteryCostDisplay) {
            lotteryCostDisplay.textContent = formatNumber(gameState.itLotteryCostSP);
        }
        if (lotteryResultDisplay) {
            lotteryResultDisplay.textContent = gameState.itLotteryLastResult;
        }
        if (playLotteryButton) {
            playLotteryButton.disabled = gameState.sp < gameState.itLotteryCostSP;
        }

        // Casino Modal Button (immer aktivierbar, solange das Element existiert)
        // if (openCasinoButton) {
        //     openCasinoButton.disabled = false; // Normalerweise nicht nötig, es sei denn, es gäbe Bedingungen
        // }
    }

    function renderPerClickUpgrades() {
        perClickUpgradesList.innerHTML = '';
        gameState.clickUpgrades.forEach((upgrade, index) => {
            const cost = getCost(upgrade).sp; // Click upgrades only cost SP
            const itemDiv = document.createElement('div');
            itemDiv.className = 'upgrade-item';
            itemDiv.innerHTML = `
                <h4>${upgrade.name} (Level ${upgrade.level})</h4>
                <p>${upgrade.description}</p>
                <p>Effekt: +${formatNumber(upgrade.baseSpPerClickBonus)} SP pro Klick pro Level</p>
                <p>Aktueller Bonus: +${formatNumber(upgrade.level * upgrade.baseSpPerClickBonus)} SP pro Klick</p>
                <button id="buy-click-upgrade-${upgrade.id}" data-index="${index}" ${gameState.sp < cost ? 'disabled' : ''}>
                    Upgrade (Kosten: ${formatNumber(cost)} SP)
                </button>
            `;
            perClickUpgradesList.appendChild(itemDiv);
            document.getElementById(`buy-click-upgrade-${upgrade.id}`).addEventListener('click', () => buyClickUpgrade(index));
        });
    }

    function renderAutomatedGenerators() {
        automatedGeneratorsList.innerHTML = '';
        gameState.generators.forEach((generator, index) => {
            const cost = getCost(generator);
            let costString = `Kosten: ${formatNumber(cost.sp)} SP`;
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
                <button id="buy-generator-${generator.id}" data-index="${index}" ${gameState.sp < cost.sp || gameState.uv < cost.uv ? 'disabled' : ''}>
                    Buy (${costString})
                </button>
            `;
            automatedGeneratorsList.appendChild(itemDiv);
            document.getElementById(`buy-generator-${generator.id}`).addEventListener('click', () => buyGenerator(index));
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

    // --- Game Loop ---
    function gameLoop() {
        // SP-Generierung unter Berücksichtigung des PDC-Bonus
        const effectiveSps = gameState.totalSps * (1 + gameState.pdc);
        gameState.sp += effectiveSps / 10; // Spiel aktualisiert 10 Mal pro Sekunde

        // AV Club Gurus UV generation
        // Diese Logik sollte idealerweise auch in checkAchievements oder einer ähnlichen
        // Funktion für passive Effekte ausgelagert werden, wenn es komplexer wird.
        // Für den Moment belassen wir es hier für die UV-Generierung.
        const avClubGurus = gameState.generators.find(g => g.id === 'avClubGurus');
        if (avClubGurus && avClubGurus.count > 0) {
            for (let i = 0; i < avClubGurus.count; i++) { // Chance per guru unit
                if (Math.random() < (avClubGurus.generatesUVChance / 10)) { // Chance per tick (10 ticks per second)
                    gameState.uv += avClubGurus.generatesUVAmount;
                }
            }
        }

        updateUI();
        checkAchievements(); // Regelmäßig prüfen, besonders für zeitbasierte oder Währungs-Achievements
    }

    // --- Persistence ---
    function saveGame() {
        // Diese Funktion wird nicht mehr für direktes Speichern verwendet.
        alert("Bitte benutze 'Als Seed Exportieren', um dein Spiel zu speichern.");
    }

    function loadGame() {
        // Diese Funktion wird nicht mehr verwendet, da das Laden nur über Seeds erfolgt.
    }

    function exportGameStateAsSeed() {
        const clickUpgradeData = gameState.clickUpgrades.map(u => `${u.id}:${u.level}`).join(',');
        const generatorData = gameState.generators.map(g => `${g.id}:${g.count}`).join(',');
        const achievementData = getAchievementSaveString();

        const seedVersion = "1.2"; // Version erhöht wegen Gambling-Stats

        const seedPayload = [
            seedVersion,
            gameState.sp,
            gameState.uv,
            gameState.pdc.toFixed(4), // PDC als Zahl mit Präzision speichern
            clickUpgradeData, // e.g., "ergonomicMousepad:2,advancedGoogling:1"
            generatorData,    // e.g., "helpdeskIntern:5,patchManagement:0"
            gameState.prestigesDone,
            // Firewall-Status
            gameState.firewallProject.implemented ? "1" : "0",
            Date.now(), // Aktueller Zeitstempel für Offline-Berechnung beim Import dieses Seeds
            `${gameState.stats.totalClicksMade},${gameState.stats.lotteryPlays},${gameState.stats.lotteryJackpots}`, // Stats speichern
            achievementData // Errungenschaftsdaten
        ].join('|'); // Use a delimiter that's unlikely to be in IDs or names

        try {
            const encodedSeed = btoa(seedPayload); // Base64-kodieren
            prompt(`Spiel-Seed (Version ${seedVersion}):\nKopieren Sie diesen Text:`, encodedSeed);
        } catch (e) {
            console.error("Fehler beim Generieren des Seeds:", e);
            alert("Seed konnte nicht generiert werden. Ihr Browser unterstützt möglicherweise btoa (Base64-Kodierung) nicht.");
        }
    }

    function importGameStateFromSeed(encodedSeedFromPrompt) {
        let encodedSeed = encodedSeedFromPrompt;
        if (!encodedSeed) { // If not passed directly, prompt the user
            encodedSeed = prompt("Paste your game seed here:");
        }

        if (!encodedSeed || encodedSeed.trim() === "") {
            alert("Kein Seed angegeben oder Seed ist leer.");
            return;
        }

        try {
            const seedPayload = atob(encodedSeed); // Base64-dekodieren
            const parts = seedPayload.split('|');

            const seedVersion = parts[0]; // Version des Seeds
            if (seedVersion !== "1" && seedVersion !== "1.1" && seedVersion !== "1.2") { // Unterstützt alte und neue Versionen
                alert(`Ungültige oder nicht unterstützte Seed-Version. Dieser Seed ist Version ${seedVersion}, das Spiel unterstützt Version 1, 1.1 oder 1.2.`);
                return;
            }

            // Start with a fresh default state to ensure all properties exist
            const loadedGs = getInitialGameState();

            loadedGs.sp = parseInt(parts[1], 10);
            loadedGs.uv = parseInt(parts[2], 10);
            loadedGs.pdc = parseFloat(parts[3]); // PDC als float laden

            const clickUpgradeDataStr = parts[4];
            const generatorDataStr = parts[5];
            
            // Firewall-Status (Index 7) und Zeitstempel (Index 8)
            if (parts.length > 7) { 
                loadedGs.firewallProject.implemented = parts[7] === "1";
            } else {
                loadedGs.firewallProject.implemented = false; // Standardwert, falls nicht im Seed
            }

            loadedGs.prestigesDone = parseInt(parts[6], 10);

            let loadedTimestampFromSeed = null;
            if (parts.length > 8 && parts[8]) {
                const ts = parseInt(parts[8], 10);
                if (!isNaN(ts)) loadedTimestampFromSeed = ts;
            }

            if (parts.length > 9 && parts[9]) { // Stats laden
                const statParts = parts[9].split(',');
                loadedGs.stats.totalClicksMade = parseInt(statParts[0], 10) || 0;
                if (statParts.length > 1) {
                    loadedGs.stats.lotteryPlays = parseInt(statParts[1], 10) || 0;
                }
                if (statParts.length > 2) {
                    loadedGs.stats.lotteryJackpots = parseInt(statParts[2], 10) || 0;
                }

            }

            if (parts.length > 10 && parts[10]) { // Errungenschaften laden
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
                throw new Error("Ungültige numerische Daten im Seed (Währungen oder Prestige-Zähler).");
            }

            // Parse click upgrades: "id1:level,id2:level"
            clickUpgradeDataStr.split(',').forEach(pair => {
                if (!pair) return; // Skip if pair is empty (e.g. trailing comma)
                const [id, levelStr] = pair.split(':');
                const level = parseInt(levelStr, 10);
                if (id && !isNaN(level)) {
                    const upgrade = loadedGs.clickUpgrades.find(u => u.id === id);
                    if (upgrade) upgrade.level = level;
                } else if (id) {
                    console.warn(`Ungültiges Level für Klick-Upgrade ID "${id}" im Seed: ${levelStr}`);
                }
            });

            // Parse generators: "id1:count,id2:count"
            generatorDataStr.split(',').forEach(pair => {
                if (!pair) return; // Skip if pair is empty
                const [id, countStr] = pair.split(':');
                const count = parseInt(countStr, 10);
                if (id && !isNaN(count)) {
                    const generator = loadedGs.generators.find(g => g.id === id);
                    if (generator) generator.count = count;
                } else if (id) {
                    console.warn(`Ungültige Anzahl für Generator ID "${id}" im Seed: ${countStr}`);
                }
            });
            
            gameState = loadedGs; // Assign the fully constructed state

            // SP/Klick und SP/Sek basierend auf geladenen Werten berechnen
            calculateSpPerClick(); // Wichtig, da es von Upgrades abhängt
            calculateTotalSps();   // Wichtig für Offline-Berechnung

            const offlineEarnings = calculateAndAwardOfflineProgress(loadedTimestampFromSeed);
            if (offlineEarnings > 0) {
                gameState.sp += offlineEarnings; // SP direkt zum gameState hinzufügen
                alert(`Willkommen zurück!\nDu hast ${formatNumber(offlineEarnings)} SP verdient, während du offline warst (30% deiner potenziellen Einnahmen aus diesem Seed-Import).`);
            }
            checkAchievements(); // Nach dem Laden prüfen, ob neue Achievements durch geladenen State erreicht wurden
            // finalizeStateLoad(); // Wird jetzt in init() aufgerufen, nachdem importGameStateFromSeed abgeschlossen ist.
            alert("Spiel von Seed geladen!");
        } catch (e) {
            console.error("Error loading from seed:", e);
            alert("Seed konnte nicht geladen werden. Er könnte beschädigt, ungültig oder von einer inkompatiblen Spielversion sein.\nFehler: " + e.message);
        }
    }

    function getInitialGameState() {
        // Deep copy to avoid modifying the original template on reset
        return JSON.parse(JSON.stringify({
            sp: 0,
            uv: 0, // Upgrade Vouchers
            pdc: 0, // Prestige Derived Credits (Bonusfaktor)
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
            stats: {
                totalClicksMade: 0,
                lotteryPlays: 0,
                lotteryJackpots: 0,
            },
            itLotteryCostSP: 10000,
            itLotteryLastResult: "Noch nicht gespielt.",
            achievements: { // Standard-Errungenschaftsstatus (alles gesperrt)
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
                // ersteSystemueberholung: {
                //     name: 'Erste Systemüberholung', description: 'Führe dein erstes Prestige durch.',
                //     tiers: [ { name: 'Gold', value: 1, reward: { sp: 1000000, uv: 50, pdc: 0.05 }, unlocked: false, desc: '1. Prestige.' } ],
                //     checkType: 'stat', statProperty: 'prestigesDone'
                // },
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
                }
            }
        }));
    }

    // German: function resetGameConfirm() {
    function resetGameConfirm() {
        if (confirm('Sind Sie sicher, dass Sie den gesamten Fortschritt zurücksetzen möchten? Dies kann nicht rückgängig gemacht werden!')) {
            // localStorage.removeItem('schoolDistrictDigitalHeroSave'); // Nicht mehr nötig, da kein LocalStorage verwendet wird
            gameState = getInitialGameState();
            finalizeStateLoad(); 
            alert('Spiel zurückgesetzt!');
        }
    }

    function finalizeStateLoad() {
        calculateSpPerClick();
        calculateTotalSps();
        renderAll();
        updateUI();
    }

    function renderAll() {
        renderPerClickUpgrades();
        renderAutomatedGenerators();
        renderAchievements();
        // renderSpecialUnlocks(); // To be implemented
        // renderPrestigeUpgrades(); // To be implemented
    }

    // --- Initialization ---
    function init() {
        // Event Listeners
        if (clickButton) clickButton.addEventListener('click', clickTicket);
        // Assuming saveButton and loadButton are replaced by seed functionality
        if (resetButton) resetButton.addEventListener('click', resetGameConfirm);
        if (exportSeedButton) exportSeedButton.addEventListener('click', exportGameStateAsSeed);
        if (importSeedButton) importSeedButton.addEventListener('click', () => importGameStateFromSeed()); // Pass no arg to trigger prompt
        if (implementFirewallButton) implementFirewallButton.addEventListener('click', purchaseFirewallProject);

        // Casino Modal Listeners
        if (openCasinoButton && casinoModal) {
            openCasinoButton.addEventListener('click', () => {
                casinoModal.style.display = 'flex'; // 'flex' wegen align-items/justify-content im CSS
            });
        }
        if (closeModalButton && casinoModal) {
            closeModalButton.addEventListener('click', () => {
                casinoModal.style.display = 'none';
            });
        }
        // Optional: Schließen des Modals bei Klick außerhalb des Inhalts
        if (casinoModal) {
            window.addEventListener('click', (event) => {
                if (event.target === casinoModal) { // Nur wenn direkt auf das Modal (den Overlay) geklickt wird
                    casinoModal.style.display = 'none';
                }
            });
        }
        if (playLotteryButton) playLotteryButton.addEventListener('click', playITLottery);

        // loadGame(); // Versucht, beim Start aus localStorage zu laden - Deaktiviert, um stattdessen nach Seed zu fragen
        importGameStateFromSeed(); // Fragt beim Start nach einem Seed. Wenn abgebrochen, startet ein neues Spiel.
        
        finalizeStateLoad(); // Stellt sicher, dass die UI immer initialisiert wird, nachdem ein Seed-Import versucht wurde.

        // Start game loop (10 times per second for smoother updates)
        setInterval(gameLoop, 100); // 100ms = 10 updates per second

        console.log("School District Digital Hero initialisiert!");
    }

    init();
});