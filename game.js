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

    const resetButton = document.getElementById('reset-button');
    const exportSeedButton = document.getElementById('export-seed-button'); // Add this button to your HTML
    const importSeedButton = document.getElementById('import-seed-button'); // Add this button to your HTML

    // --- Game State ---
    let gameState = {
        sp: 0,
        uv: 0,
        pdc: 0,
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
        lastSavedTimestamp: null
    };

    // --- Game Logic Functions ---

    function calculateSpPerClick() {
        let totalBonus = 0;
        gameState.clickUpgrades.forEach(upgrade => {
            totalBonus += upgrade.level * upgrade.baseSpPerClickBonus;
        });
        // Add prestige bonuses later if any
        gameState.spPerClick = 1 + totalBonus; // Base 1 SP per click
    }

    function calculateTotalSps() {
        let total = 0;
        gameState.generators.forEach(gen => {
            total += gen.count * gen.baseSps;
        });
        // Add prestige bonuses later
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
        updateUI();
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
        if (pdcDisplay) pdcDisplay.textContent = formatNumber(gameState.pdc);
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

    // --- Game Loop ---
    function gameLoop() {
        const spFromGenerators = gameState.totalSps;
        gameState.sp += spFromGenerators / 10; // Game updates 10 times per second

        // AV Club Gurus UV generation
        const avClubGurus = gameState.generators.find(g => g.id === 'avClubGurus');
        if (avClubGurus && avClubGurus.count > 0) {
            for (let i = 0; i < avClubGurus.count; i++) { // Chance per guru unit
                if (Math.random() < (avClubGurus.generatesUVChance / 10)) { // Chance per tick (10 ticks per second)
                    gameState.uv += avClubGurus.generatesUVAmount;
                }
            }
        }

        updateUI();
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

        const seedVersion = "1"; // Versioning the seed helps with future compatibility

        const seedPayload = [
            seedVersion,
            gameState.sp,
            gameState.uv,
            gameState.pdc,
            clickUpgradeData, // e.g., "ergonomicMousepad:2,advancedGoogling:1"
            generatorData,    // e.g., "helpdeskIntern:5,patchManagement:0"
            gameState.prestigesDone,
            // Firewall-Status
            gameState.firewallProject.implemented ? "1" : "0",
            Date.now() // Aktueller Zeitstempel für Offline-Berechnung beim Import dieses Seeds
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
            if (seedVersion !== "1") { // Check against current supported versions
                alert(`Ungültige oder nicht unterstützte Seed-Version. Dieser Seed ist Version ${seedVersion}, das Spiel unterstützt Version 1.`);
                return;
            }

            // Start with a fresh default state to ensure all properties exist
            const loadedGs = getInitialGameState();
            
            loadedGs.sp = parseInt(parts[1], 10);
            loadedGs.uv = parseInt(parts[2], 10);
            loadedGs.pdc = parseInt(parts[3], 10);
            
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
            uv: 0,
            pdc: 0,
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
            lastSavedTimestamp: null // Oder Date.now() für ein brandneues Spiel, aber null ist besser für die Logik
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

        // loadGame(); // Versucht, beim Start aus localStorage zu laden - Deaktiviert, um stattdessen nach Seed zu fragen
        importGameStateFromSeed(); // Fragt beim Start nach einem Seed. Wenn abgebrochen, startet ein neues Spiel.
        
        finalizeStateLoad(); // Stellt sicher, dass die UI immer initialisiert wird, nachdem ein Seed-Import versucht wurde.

        // Start game loop (10 times per second for smoother updates)
        setInterval(gameLoop, 100); // 100ms = 10 updates per second

        console.log("School District Digital Hero initialisiert!");
    }

    init();
});