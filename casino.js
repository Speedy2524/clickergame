import { gameState, updateUI as updateMainUI, formatNumber, delay, checkAchievements } from './game.js';

// --- Casino DOM Elements ---
// Lottery
let playLotteryButton, lotteryCostDisplay, lotteryResultDisplay;

// Blackjack
let blackjackDealerCardsEl, blackjackPlayerCardsEl, blackjackDealerScoreEl,
    blackjackPlayerScoreEl, blackjackBetAmountInputEl, blackjackDealButtonEl,
    blackjackHitButtonEl, blackjackStandButtonEl, blackjackDoubleDownButtonEl,
    blackjackMessageEl;

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

export function initCasino() {
    // Get DOM elements here, ensuring DOM is ready
    playLotteryButton = document.getElementById('play-lottery-button');
    lotteryCostDisplay = document.getElementById('lottery-cost-display');
    lotteryResultDisplay = document.getElementById('lottery-result-display');

    blackjackDealerCardsEl = document.getElementById('blackjack-dealer-cards');
    blackjackPlayerCardsEl = document.getElementById('blackjack-player-cards');
    blackjackDealerScoreEl = document.getElementById('blackjack-dealer-score'); // <-- Korrigiert
    blackjackPlayerScoreEl = document.getElementById('blackjack-player-score');
    blackjackBetAmountInputEl = document.getElementById('blackjack-bet-amount');
    blackjackDealButtonEl = document.getElementById('blackjack-deal-button');
    blackjackHitButtonEl = document.getElementById('blackjack-hit-button');
    blackjackStandButtonEl = document.getElementById('blackjack-stand-button');
    blackjackDoubleDownButtonEl = document.getElementById('blackjack-double-button');
    blackjackMessageEl = document.getElementById('blackjack-message');

    if (playLotteryButton) playLotteryButton.addEventListener('click', playITLottery);
    if (blackjackDealButtonEl) blackjackDealButtonEl.addEventListener('click', startBlackjackGame);
    if (blackjackHitButtonEl) blackjackHitButtonEl.addEventListener('click', blackjackPlayerHit);
    if (blackjackStandButtonEl) blackjackStandButtonEl.addEventListener('click', blackjackPlayerStand);
    if (blackjackDoubleDownButtonEl) blackjackDoubleDownButtonEl.addEventListener('click', blackjackPlayerDoubleDown);

    renderLotteryCasinoUI(); // Initial render for lottery
    renderBlackjackCasinoUI(); // Initial render for blackjack
    console.log("Casino Modul initialisiert!");
}