# 🎮 School District Digital Hero 🎮

Welcome to School District Digital Hero! This is an incremental clicker game where you take on the role of an IT specialist in a school district, solving problems, upgrading your systems, and becoming an indispensable hero.

## 🌟 Features

* **Core Clicker Mechanic:** Click to resolve IT tickets and earn Support Points (SP).
* **SP per Click Upgrades:** Enhance your efficiency with items like an "Ergonomisches Mauspad" to earn more SP per click.
* **Automated SP Generation:** Hire "Helpdesk-Praktikanten" or implement "Automatisiertes Patch-Systeme" to generate SP automatically over time.
* **Secondary Currencies:**
    * **Upgrade-Gutscheine (UV):** Used for special projects and higher-tier generator upgrades.
    * **Fortbildungs-Credits (PDC):** A prestige currency offering permanent bonuses (currently placeholder for future prestige system).
* **Bezirksprojekte (District Projects):** Implement significant upgrades like a "Firewall" using SP and UV.
* **Achievements System:** Unlock various achievements for reaching milestones, complete with toast notifications.
* **🎰 IT-Casino:**
    * **IT-Lotterie:** Test your luck to win SP or UV.
    * **Blackjack (21):** Play a classic game of Blackjack with your SP.
* **Save/Load System:** Export your game progress as a "Seed" and import it later to continue playing.
* **Game Reset:** Option to hard reset your progress.
* **Sticky Header:** Important game stats (SP, UV, PDC) are always visible at the top.

## 🚀 How to Play / Getting Started

1.  **Resolve Tickets:** Click the main button ("Klicken zum Bearbeiten!") to earn Support Points (SP).
2.  **Upgrade:**
    * **Mein Schreibtisch (My Desk):** Purchase upgrades to increase the SP you get per click.
    * **IT-Abteilung (IT Department):** Buy automated systems/personnel that generate SP for you automatically over time.
3.  **Projects & Advanced Upgrades:**
    * Invest in "Bezirksprojekte" using SP and UV for significant boosts or new functionalities.
    * (Coming Soon) Explore "Weiterbildung" (Prestige Upgrades) once you reach a certain threshold.
4.  **Unlock Achievements:** Meet various criteria to unlock achievements and earn rewards.
5.  **Visit the Casino:** Click the "🎰 Casino" button in the footer to open the IT-Casino modal. Try your luck at the Lottery or Blackjack.
6.  **Save Your Progress:** Use the "Als Seed Exportieren" button to get a code representing your game state. Copy this code.
7.  **Load Progress:** Use "Von Seed Importieren" and paste your previously exported seed to load your game.

## 🛠️ How to Run Locally

1.  Clone this repository:
    ```bash
    git clone <your-repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd <repository-folder-name>
    ```
3.  Open the `index.html` file in your web browser.

    * **Note:** Due to the use of JavaScript ES Modules (`import`/`export` in `game.js` and `casino.js`), you might need to serve the files using a local web server for the game to run correctly. Simply opening `index.html` via the `file:///` protocol can cause issues with module loading in some browsers.
    * A simple way to start a local server (if you have Python installed):
        ```bash
        python -m http.server
        ```
        Then navigate to `http://localhost:8000` (or the port shown) in your browser.

## 📂 File Structure

* `index.html`: The main page for the game.
* `body.css`: Contains all the styling for the game's appearance.
* `game.js`: Core game logic, including SP generation, upgrades, achievements, and save/load functionality.
* `casino.js`: Handles the logic for the IT-Lottery and Blackjack games within the casino modal.
* `resolve_ticket_icon.png.jfif`: Icon used for the main click button.

## 🔮 Future Enhancements (Ideas)

* Fully implement the "Weiterbildung (PDC-Upgrades)" / Prestige system.
* Add more content to "Bezirksprojekte (UV-Freischaltungen)".
* Introduce more types of click upgrades and automated generators.
* Add random events or challenges.
* Expand the Casino with more games.
* More complex achievement tiers and rewards.

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or bug fixes, feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
5.  Push to the branch (`git push origin feature/AmazingFeature`).
6.  Open a Pull Request.

## 📜 License

