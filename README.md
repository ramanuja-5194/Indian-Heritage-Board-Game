# Aadu Puli Aattam - Goats and Tigers Game 🐐🐅

This repository contains the source code for a web-based, multiplayer version of the traditional Indian board game, **Aadu Puli Aattam** (Goats and Tigers).

This game is a strategic, asymmetric board game that is engaging and easy to learn, but difficult to master.

**Play the game live:** [**https://aadu-puli-aattam.onrender.com/**](https://aadu-puli-aattam.onrender.com/)

---

## 📖 About the Game

**Aadu Puli Aattam** (ஆடு புலி ஆட்டம்) is an ancient and traditional board game that originated in **Tamil Nadu, South India**. It is also known by other names in neighboring states, such as *Huli Gatta* in Karnataka and *Puli Joodam* in Andhra Pradesh.

The game is a "hunt game" and is deeply rooted in Indian culture, often found etched onto the floors of ancient temples. It is an **asymmetric** game, meaning the two players have different pieces, objectives, and rules.

* **One player** controls **3 Tigers** (Puli).
* **The other player** controls **15 Goats** (Aadu).

The game simulates a hunt, where the tigers try to capture the goats, and the goats use their superior numbers to trap and immobilize the tigers.

---

## 🎮 How to Play

If you are unfamiliar with the rules, this [YouTube video provides a great visual explanation](https://youtu.be/cUrkUTchq9Y?si=eK-DQXI9ezu-sybn).

### 🎯 Objective

* **Tigers Win:** The tiger player wins by capturing **5 goats**.
* **Goats Win:** The goat player wins by trapping all three tigers so that they cannot make any legal moves.

### ⚙️ Setup

1.  The 3 Tigers start on the board at the apex (position 22) and the two adjacent spots (positions 18 and 19).
2.  The 15 Goats start off the board.
3.  The **Goats player always goes first**.

### 🐐 Goats' Turn

* **Phase 1: Placement**
    * For the first 15 turns, the goat player places one goat per turn onto any empty intersection on the board.
    * Goats cannot move until all 15 have been placed.
* **Phase 2: Movement**
    * After all 15 goats are on the board, the player must move one goat to an adjacent empty intersection per turn.
    * Goats **cannot** jump over tigers or other goats.

### 🐅 Tigers' Turn

* The tiger player can move from the very first turn.
* A tiger can perform **one** of two actions per turn:
    1.  **Move:** Move the tiger to an adjacent empty intersection.
    2.  **Capture:** Jump over a single goat (in a straight line) to an empty intersection directly beyond it. The jumped goat is "captured" and removed from the board.
* Tigers **cannot** jump over other tigers or multiple goats.

---

## 💻 Steps to Run Locally

You can run this project on your local machine to play by yourself or with someone on the same network.

1.  **Prerequisite:** You must have [Node.js](https://nodejs.org/) installed on your machine.

2.  **Clone the repository:**
    ```bash
    git clone https://github.com/ramanuja-5194/Indian-Heritage-Board-Game.git
    cd your-repository-name
    ```

3.  **Install dependencies:**
    Run this command in the project's root directory:
    ```bash
    npm install
    ```

4.  **Run the server:**
    * To run the server normally:
        ```bash
        npm start
        ```
    * For development (restarts the server automatically when you save changes):
        ```bash
        npm run dev
        ```
    The server will start, listening on port 3000. The `server.js` file is configured to listen on `0.0.0.0`, which allows other devices on your network to connect to it.

5.  **Play the Game:**

    * **On your own machine (Player 1):**
        Open your web browser and go to:
        `http://localhost:3000`

    * **On another computer on the same Wi-Fi (Player 2):**
        
        a.  First, find your computer's (the one running the server) **Local IP Address**.
            * **On Windows:** Open Command Prompt and type `ipconfig`. Look for the "IPv4 Address" (e.g., `192.168.1.10`).
            * **On macOS:** Go to System Preferences > Network > Wi-Fi. Your IP address will be shown.
            * **On Linux:** Open a terminal and type `hostname -I`.

        b.  On the second person's computer or phone, open their browser and type in your IP address followed by the port `:3000`.

        c.  For example, if your server's IP address is `192.168.1.10`, they will go to:
            `http://192.168.1.10:3000`

    Both players can now join the game and will be matched together.