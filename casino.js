import { gameState, updateUI as updateMainUI, formatNumber, delay, checkAchievements } from './game.js';

// --- Casino DOM Elements ---
// Lottery
let playLotteryButton, lotteryCostDisplay, lotteryResultDisplay;

// Blackjack
let blackjackDealerCardsEl, blackjackPlayerCardsEl, blackjackDealerScoreEl,
    blackjackPlayerScoreEl, blackjackBetAmountInputEl, blackjackDealButtonEl,
    blackjackHitButtonEl, blackjackStandButtonEl, blackjackDoubleDownButtonEl,
    blackjackMessageEl;

// Higher or Lower
let higherLowerPreviousCardEl, higherLowerCurrentCardEl, higherLowerBetAmountInputEl,
    higherLowerStartGameButtonEl, higherLowerHigherButtonEl, higherLowerLowerButtonEl,
    higherLowerCashOutButtonEl, higherLowerMessageEl, higherLowerStreakEl,
    higherLowerPotentialWinningsEl;


// --- Lottery Logic ---
function playITLottery() {
    if (!playLotteryButton) { // Zusätzlicher Check, ob die Elemente initialisiert wurden
        console.error("Lotterie-Button nicht initialisiert!");
        return;
    }
    if (gameState.sp < gameState.itLotteryCostSP) {
        gameState.itLotteryLastResult = "Nicht genug SP für ein Los!";
        renderLotteryCasinoUI();
        return;
    }

    gameState.sp -= gameState.itLotteryCostSP;
    gameState.stats.lotteryPlays++;

    const randomNumber = Math.random() * 100;
    let resultMessage = "";
    let spWon = 0;
    let uvWon = 0;

    if (randomNumber < 0.1) { // 0.1% Jackpot
        spWon = gameState.itLotteryCostSP * 10;
        uvWon = 5;
        resultMessage = `JACKPOT! Du gewinnst ${formatNumber(spWon)} SP und ${uvWon} UV!`;
        gameState.stats.lotteryJackpots++;
    } else if (randomNumber < 0.5) { // 0.4% UV Win
        uvWon = 1;
        resultMessage = `Glückstreffer! Du gewinnst ${uvWon} UV!`;
    } else if (randomNumber < 3) { // 2.5% Large Win
        spWon = gameState.itLotteryCostSP * 5;
        resultMessage = `Großer Gewinn! Du erhältst ${formatNumber(spWon)} SP!`;
    } else if (randomNumber < 10) { // 7% Medium Win
        spWon = gameState.itLotteryCostSP * 2;
        resultMessage = `Schöner Gewinn! Du erhältst ${formatNumber(spWon)} SP!`;
    } else if (randomNumber < 25) { // 15% Break Even
        spWon = gameState.itLotteryCostSP;
        resultMessage = `Einsatz zurück! Du erhältst ${formatNumber(spWon)} SP.`;
    } else if (randomNumber < 50) { // 25% Small Win
        spWon = gameState.itLotteryCostSP * 0.5;
        resultMessage = `Kleiner Trostpreis! Du erhältst ${formatNumber(spWon)} SP.`;
    } else { // 50% Lose
        resultMessage = "Leider nichts gewonnen. Versuche es erneut!";
    }
    gameState.sp += spWon;
    gameState.uv += uvWon;
    gameState.itLotteryLastResult = resultMessage;
    
    renderLotteryCasinoUI();
    updateMainUI(); // Update global SP/UV display
    checkAchievements(); // Jetzt können wir das aufrufen, da es aus game.js importiert wird
}

function renderLotteryCasinoUI() {
    if (lotteryCostDisplay) {
        lotteryCostDisplay.textContent = formatNumber(gameState.itLotteryCostSP);
    }
    if (lotteryResultDisplay) {
        lotteryResultDisplay.textContent = gameState.itLotteryLastResult;
    }
    if (playLotteryButton) {
        playLotteryButton.disabled = gameState.sp < gameState.itLotteryCostSP;
    }
}

// --- Blackjack Logic ---
const SUITS = ['H', 'D', 'C', 'S'];
const SUIT_SYMBOLS = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    gameState.blackjack.deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            gameState.blackjack.deck.push({ value, suit });
        }
    }
}

function shuffleDeck() {
    for (let i = gameState.blackjack.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.blackjack.deck[i], gameState.blackjack.deck[j]] = [gameState.blackjack.deck[j], gameState.blackjack.deck[i]];
    }
}

function getCardValue(card) {
    if (['K', 'Q', 'J'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

function calculateHandValue(hand) {
    let score = 0;
    let aceCount = 0;
    for (let card of hand) {
        score += getCardValue(card);
        if (card.value === 'A') aceCount++;
    }
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }
    return score;
}

async function dealCardAnimated(hand, isPlayerHand) {
    if (gameState.blackjack.deck.length > 0) {
        hand.push(gameState.blackjack.deck.pop());
        if (isPlayerHand) gameState.blackjack.playerScore = calculateHandValue(gameState.blackjack.playerHand);
        renderBlackjackCasinoUI();
        await delay(500);
    }
}

async function startBlackjackGame() {
    const bet = parseInt(blackjackBetAmountInputEl.value);
    if (isNaN(bet) || bet <= 0) {
        gameState.blackjack.message = "Ungültiger Einsatz.";
        renderBlackjackCasinoUI();
        return;
    }
    if (gameState.sp < bet) {
        gameState.blackjack.message = "Nicht genug SP für diesen Einsatz.";
        renderBlackjackCasinoUI();
        return;
    }

    gameState.sp -= bet;
    gameState.blackjack.betAmount = bet;
    gameState.blackjack.gameInProgress = true;
    gameState.blackjack.dealerRevealed = false;
    gameState.blackjack.playerHand = [];
    gameState.blackjack.dealerHand = [];
    createDeck();
    shuffleDeck();

    await dealCardAnimated(gameState.blackjack.playerHand, true);
    await dealCardAnimated(gameState.blackjack.dealerHand, false);
    await dealCardAnimated(gameState.blackjack.playerHand, true);
    await dealCardAnimated(gameState.blackjack.dealerHand, false);

    gameState.blackjack.playerScore = calculateHandValue(gameState.blackjack.playerHand);
    gameState.blackjack.dealerScore = calculateHandValue(gameState.blackjack.dealerHand);

    gameState.blackjack.message = "Deine Runde. Hit oder Stand?";
    if (gameState.blackjack.playerScore === 21) {
        gameState.blackjack.message = "Blackjack! Du gewinnst!";
        await delay(1000);
        endBlackjackRound(true);
    } else {
        renderBlackjackCasinoUI();
    }
    updateMainUI(); // Update global SP display
}

async function blackjackPlayerHit() {
    if (!gameState.blackjack.gameInProgress) return;
    if (blackjackDoubleDownButtonEl) blackjackDoubleDownButtonEl.style.display = 'none';
    await dealCardAnimated(gameState.blackjack.playerHand, true);
    gameState.blackjack.playerScore = calculateHandValue(gameState.blackjack.playerHand);
    renderBlackjackCasinoUI();

    if (gameState.blackjack.playerScore > 21) {
        gameState.blackjack.message = "Bust! Du hast verloren.";
        await delay(1000);
        endBlackjackRound(false);
    } else if (gameState.blackjack.playerScore === 21) {
        blackjackPlayerStand();
    }
}

async function blackjackPlayerStand() {
    if (!gameState.blackjack.gameInProgress) return;
    if (blackjackDoubleDownButtonEl) blackjackDoubleDownButtonEl.style.display = 'none';
    gameState.blackjack.dealerRevealed = true;
    renderBlackjackCasinoUI();
    await delay(700);

    while (calculateHandValue(gameState.blackjack.dealerHand) < 17 && gameState.blackjack.dealerHand.length < 5) {
        gameState.blackjack.message = "Dealer zieht...";
        renderBlackjackCasinoUI();
        await delay(700);
        await dealCardAnimated(gameState.blackjack.dealerHand, false);
        gameState.blackjack.dealerScore = calculateHandValue(gameState.blackjack.dealerHand);
        renderBlackjackCasinoUI();
    }
    gameState.blackjack.dealerScore = calculateHandValue(gameState.blackjack.dealerHand);

    if (gameState.blackjack.dealerScore > 21) {
        gameState.blackjack.message = "Dealer Bust! Du gewinnst!";
        endBlackjackRound(true);
    } else if (gameState.blackjack.dealerScore > gameState.blackjack.playerScore) {
        gameState.blackjack.message = "Dealer gewinnt.";
        endBlackjackRound(false);
    } else if (gameState.blackjack.playerScore > gameState.blackjack.dealerScore) {
        gameState.blackjack.message = "Du gewinnst!";
        endBlackjackRound(true);
    } else {
        gameState.blackjack.message = "Push (Unentschieden).";
        endBlackjackRound(null);
    }
    await delay(1000);
    renderBlackjackCasinoUI();
}

async function blackjackPlayerDoubleDown() {
    if (!gameState.blackjack.gameInProgress || gameState.blackjack.playerHand.length !== 2) return;
    const additionalBet = gameState.blackjack.betAmount;
    if (gameState.sp < additionalBet) {
        gameState.blackjack.message = "Nicht genug SP zum Verdoppeln!";
        renderBlackjackCasinoUI();
        return;
    }
    gameState.sp -= additionalBet;
    gameState.blackjack.betAmount += additionalBet;
    updateMainUI();

    gameState.blackjack.message = "Verdoppelt! Eine letzte Karte...";
    if (blackjackHitButtonEl) blackjackHitButtonEl.style.display = 'none';
    if (blackjackStandButtonEl) blackjackStandButtonEl.style.display = 'none';
    if (blackjackDoubleDownButtonEl) blackjackDoubleDownButtonEl.style.display = 'none';
    renderBlackjackCasinoUI();

    await dealCardAnimated(gameState.blackjack.playerHand, true);
    gameState.blackjack.playerScore = calculateHandValue(gameState.blackjack.playerHand);
    renderBlackjackCasinoUI();

    if (gameState.blackjack.playerScore > 21) {
        gameState.blackjack.message = "Bust nach Double Down! Du hast verloren.";
        await delay(1000);
        endBlackjackRound(false);
    } else {
        await blackjackPlayerStand();
    }
}

function endBlackjackRound(playerWins) {
    gameState.blackjack.gameInProgress = false;
    if (playerWins === true) {
        const isPlayerBlackjack = gameState.blackjack.playerScore === 21 && gameState.blackjack.playerHand.length === 2;
        const payout = isPlayerBlackjack ? Math.floor(gameState.blackjack.betAmount * 2.5) : gameState.blackjack.betAmount * 2;
        gameState.sp += payout;
    } else if (playerWins === null) {
        gameState.sp += gameState.blackjack.betAmount;
    }
    updateMainUI();
    renderBlackjackCasinoUI();
}

function renderBlackjackCasinoUI() {
    if (blackjackMessageEl) blackjackMessageEl.textContent = gameState.blackjack.message;
    if (blackjackDealButtonEl) blackjackDealButtonEl.style.display = gameState.blackjack.gameInProgress ? 'none' : 'inline-block';
    if (blackjackHitButtonEl) blackjackHitButtonEl.style.display = gameState.blackjack.gameInProgress ? 'inline-block' : 'none';
    if (blackjackStandButtonEl) blackjackStandButtonEl.style.display = gameState.blackjack.gameInProgress ? 'inline-block' : 'none';
    if (blackjackDoubleDownButtonEl) {
        const canDouble = gameState.blackjack.gameInProgress &&
                          gameState.blackjack.playerHand.length === 2 &&
                          gameState.sp >= gameState.blackjack.betAmount;
        blackjackDoubleDownButtonEl.style.display = canDouble ? 'inline-block' : 'none';
        blackjackDoubleDownButtonEl.disabled = !canDouble;
    }
    if (blackjackBetAmountInputEl) blackjackBetAmountInputEl.disabled = gameState.blackjack.gameInProgress;

    if (blackjackPlayerScoreEl) blackjackPlayerScoreEl.textContent = gameState.blackjack.playerScore;
    if (blackjackDealerScoreEl) {
        if (gameState.blackjack.dealerRevealed || !gameState.blackjack.gameInProgress) {
            blackjackDealerScoreEl.textContent = calculateHandValue(gameState.blackjack.dealerHand);
        } else if (gameState.blackjack.dealerHand.length > 0) {
            blackjackDealerScoreEl.textContent = getCardValue(gameState.blackjack.dealerHand[0]);
        } else {
            blackjackDealerScoreEl.textContent = 0;
        }
    }

    if (blackjackPlayerCardsEl) {
        blackjackPlayerCardsEl.innerHTML = gameState.blackjack.playerHand.map(card => `<span class="card">${card.value}${SUIT_SYMBOLS[card.suit]}</span>`).join(' ');
    }
    if (blackjackDealerCardsEl) {
        if (gameState.blackjack.dealerRevealed || !gameState.blackjack.gameInProgress) {
            blackjackDealerCardsEl.innerHTML = gameState.blackjack.dealerHand.map(card => `<span class="card">${card.value}${SUIT_SYMBOLS[card.suit]}</span>`).join(' ');
        } else if (gameState.blackjack.dealerHand.length > 0) {
            blackjackDealerCardsEl.innerHTML = `<span class="card">${gameState.blackjack.dealerHand[0].value}${SUIT_SYMBOLS[gameState.blackjack.dealerHand[0].suit]}</span> <span class="card">?</span>`;
        } else {
            blackjackDealerCardsEl.innerHTML = '';
        }
    }
}

// --- Higher or Lower Logic ---
const HL_SUITS = ['H', 'D', 'C', 'S']; // Shared with Blackjack, but good to have if logic diverges
const HL_SUIT_SYMBOLS = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
const HL_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const HL_NUMERIC_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
const HL_PAYOUT_MULTIPLIERS = [1.0, 1.4, 1.9, 2.5, 3.2, 4.0, 5.0, 6.2, 7.5, 9.0, 11.0, 13.5, 16.0, 19.0, 22.5, 26.0]; // Index = streak

function createHigherLowerDeck() {
    gameState.higherLower.deck = [];
    for (let suit of HL_SUITS) {
        for (let value of HL_VALUES) {
            gameState.higherLower.deck.push({ value, suit, numericValue: HL_NUMERIC_VALUES[value] });
        }
    }
}

function shuffleHigherLowerDeck() {
    let deck = gameState.higherLower.deck;
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealHigherLowerCard() {
    if (gameState.higherLower.deck.length === 0) {
        createHigherLowerDeck();
        shuffleHigherLowerDeck();
        // Optional: Add a message if deck reshuffles mid-game, though unlikely for this game type.
    }
    return gameState.higherLower.deck.pop();
}

function startHigherLowerGame() {
    const bet = parseInt(higherLowerBetAmountInputEl.value);
    if (isNaN(bet) || bet <= 0) {
        gameState.higherLower.message = "Ungültiger Einsatz.";
        renderHigherLowerUI();
        return;
    }
    if (gameState.sp < bet) {
        gameState.higherLower.message = "Nicht genug SP für diesen Einsatz.";
        renderHigherLowerUI();
        return;
    }

    gameState.sp -= bet;
    gameState.stats.higherLowerPlays = (gameState.stats.higherLowerPlays || 0) + 1;
    gameState.higherLower.betAmount = bet;
    gameState.higherLower.gameInProgress = true;
    gameState.higherLower.streak = 0;
    gameState.higherLower.potentialWinnings = bet * (HL_PAYOUT_MULTIPLIERS[0] || 1.0);
    gameState.higherLower.previousCard = null;

    createHigherLowerDeck();
    shuffleHigherLowerDeck();
    gameState.higherLower.currentCard = dealHigherLowerCard();

    gameState.higherLower.message = `Karte ist ${gameState.higherLower.currentCard.value}${HL_SUIT_SYMBOLS[gameState.higherLower.currentCard.suit]}. Höher oder Tiefer?`;
    renderHigherLowerUI();
    updateMainUI();
}

function higherLowerGuess(isHigherGuess) {
    if (!gameState.higherLower.gameInProgress) return;

    gameState.higherLower.previousCard = gameState.higherLower.currentCard;
    gameState.higherLower.currentCard = dealHigherLowerCard();

    const prevVal = gameState.higherLower.previousCard.numericValue;
    const currVal = gameState.higherLower.currentCard.numericValue;

    let correctGuess = false;
    if (currVal === prevVal) {
        gameState.higherLower.message = `Push! ${gameState.higherLower.currentCard.value}${HL_SUIT_SYMBOLS[gameState.higherLower.currentCard.suit]} ist gleich ${gameState.higherLower.previousCard.value}${HL_SUIT_SYMBOLS[gameState.higherLower.previousCard.suit]}. Serie gehalten. Erneut raten!`;
        // Streak and potential winnings remain. Player just guesses again.
    } else if ((isHigherGuess && currVal > prevVal) || (!isHigherGuess && currVal < prevVal)) {
        correctGuess = true;
        gameState.higherLower.streak++;
        gameState.stats.higherLowerHighestStreak = Math.max(gameState.stats.higherLowerHighestStreak || 0, gameState.higherLower.streak);
        const multiplier = HL_PAYOUT_MULTIPLIERS[gameState.higherLower.streak] || HL_PAYOUT_MULTIPLIERS[HL_PAYOUT_MULTIPLIERS.length - 1];
        gameState.higherLower.potentialWinnings = gameState.higherLower.betAmount * multiplier;
        gameState.higherLower.message = `Richtig! Nächste Karte: ${gameState.higherLower.currentCard.value}${HL_SUIT_SYMBOLS[gameState.higherLower.currentCard.suit]}. Weiter oder Auszahlen?`;
    } else {
        gameState.higherLower.message = `Falsch! Die Karte war ${gameState.higherLower.currentCard.value}${HL_SUIT_SYMBOLS[gameState.higherLower.currentCard.suit]}. Spiel vorbei.`;
        endHigherLowerGame(false);
    }

    renderHigherLowerUI();
    updateMainUI();
    if (correctGuess || currVal !== prevVal) checkAchievements(); // Check achievements on win/loss/push resolution
}

function higherLowerCashOut() {
    if (!gameState.higherLower.gameInProgress || gameState.higherLower.streak === 0) return;

    gameState.sp += gameState.higherLower.potentialWinnings;
    gameState.stats.higherLowerWins = (gameState.stats.higherLowerWins || 0) + 1;
    gameState.higherLower.message = `Ausgezahlt! Du gewinnst ${formatNumber(gameState.higherLower.potentialWinnings)} SP.`;
    endHigherLowerGame(true);
    checkAchievements();
}

function endHigherLowerGame(playerCashedOut) {
    gameState.higherLower.gameInProgress = false;
    // Bet is already handled or lost. If cashed out, winnings added.
    // Reset for next game, but keep message.
    renderHigherLowerUI();
    updateMainUI();
}

function renderHigherLowerUI() {
    const hlState = gameState.higherLower;
    if (higherLowerPreviousCardEl) higherLowerPreviousCardEl.textContent = hlState.previousCard ? `${hlState.previousCard.value}${HL_SUIT_SYMBOLS[hlState.previousCard.suit]}` : '-';
    if (higherLowerCurrentCardEl) higherLowerCurrentCardEl.textContent = hlState.currentCard ? `${hlState.currentCard.value}${HL_SUIT_SYMBOLS[hlState.currentCard.suit]}` : '-';
    if (higherLowerMessageEl) higherLowerMessageEl.textContent = hlState.message;
    if (higherLowerStreakEl) higherLowerStreakEl.textContent = hlState.streak;
    if (higherLowerPotentialWinningsEl) higherLowerPotentialWinningsEl.textContent = formatNumber(hlState.potentialWinnings);

    if (higherLowerStartGameButtonEl) higherLowerStartGameButtonEl.style.display = hlState.gameInProgress ? 'none' : 'inline-block';
    if (higherLowerBetAmountInputEl) higherLowerBetAmountInputEl.disabled = hlState.gameInProgress;
    if (higherLowerHigherButtonEl) higherLowerHigherButtonEl.style.display = hlState.gameInProgress ? 'inline-block' : 'none';
    if (higherLowerLowerButtonEl) higherLowerLowerButtonEl.style.display = hlState.gameInProgress ? 'inline-block' : 'none';
    if (higherLowerCashOutButtonEl) {
        higherLowerCashOutButtonEl.style.display = hlState.gameInProgress && hlState.streak > 0 ? 'inline-block' : 'none';
        higherLowerCashOutButtonEl.disabled = !(hlState.gameInProgress && hlState.streak > 0);
    }
}

// --- Global Casino UI & Initialization ---
export function updateCasinoGamesUI() {
    renderLotteryCasinoUI();
    renderBlackjackCasinoUI();
    renderHigherLowerUI();
}

export function initCasino() {
    // Get DOM elements here, ensuring DOM is ready
    playLotteryButton = document.getElementById('play-lottery-button');
    lotteryCostDisplay = document.getElementById('lottery-cost-display');
    lotteryResultDisplay = document.getElementById('lottery-result-display');

    blackjackDealerCardsEl = document.getElementById('blackjack-dealer-cards');
    blackjackPlayerCardsEl = document.getElementById('blackjack-player-cards');
    blackjackDealerScoreEl = document.getElementById('blackjack-dealer-score');
    blackjackPlayerScoreEl = document.getElementById('blackjack-player-score');
    blackjackBetAmountInputEl = document.getElementById('blackjack-bet-amount');
    blackjackDealButtonEl = document.getElementById('blackjack-deal-button');
    blackjackHitButtonEl = document.getElementById('blackjack-hit-button');
    blackjackStandButtonEl = document.getElementById('blackjack-stand-button');
    blackjackDoubleDownButtonEl = document.getElementById('blackjack-double-button');
    blackjackMessageEl = document.getElementById('blackjack-message');

    // Higher or Lower Elements
    higherLowerPreviousCardEl = document.getElementById('hl-previous-card');
    higherLowerCurrentCardEl = document.getElementById('hl-current-card');
    higherLowerBetAmountInputEl = document.getElementById('hl-bet-amount');
    higherLowerStartGameButtonEl = document.getElementById('hl-start-button');
    higherLowerHigherButtonEl = document.getElementById('hl-higher-button');
    higherLowerLowerButtonEl = document.getElementById('hl-lower-button');
    higherLowerCashOutButtonEl = document.getElementById('hl-cashout-button');
    higherLowerMessageEl = document.getElementById('hl-message');
    higherLowerStreakEl = document.getElementById('hl-streak');
    higherLowerPotentialWinningsEl = document.getElementById('hl-potential-winnings');

    if (playLotteryButton) playLotteryButton.addEventListener('click', playITLottery);
    
    if (blackjackDealButtonEl) blackjackDealButtonEl.addEventListener('click', startBlackjackGame);
    if (blackjackHitButtonEl) blackjackHitButtonEl.addEventListener('click', blackjackPlayerHit);
    if (blackjackStandButtonEl) blackjackStandButtonEl.addEventListener('click', blackjackPlayerStand);
    if (blackjackDoubleDownButtonEl) blackjackDoubleDownButtonEl.addEventListener('click', blackjackPlayerDoubleDown);

    if (higherLowerStartGameButtonEl) higherLowerStartGameButtonEl.addEventListener('click', startHigherLowerGame);
    if (higherLowerHigherButtonEl) higherLowerHigherButtonEl.addEventListener('click', () => higherLowerGuess(true));
    if (higherLowerLowerButtonEl) higherLowerLowerButtonEl.addEventListener('click', () => higherLowerGuess(false));
    if (higherLowerCashOutButtonEl) higherLowerCashOutButtonEl.addEventListener('click', higherLowerCashOut);

    updateCasinoGamesUI(); // Call the new combined UI update for initial render
    console.log("Casino Modul initialisiert!");
}
