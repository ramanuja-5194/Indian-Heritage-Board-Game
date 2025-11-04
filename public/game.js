// Socket connection
const socket = io();

// Game state
let gameState = {
    gameId: null,
    role: null,
    username: null,
    opponentName: null,
    board: Array(23).fill(null),
    currentTurn: 'goats',
    goatsPlaced: 0,
    goatsCaptured: 0,
    selectedPiece: null,
    validMoves: []
};

// Board configuration
const POINT_COORDINATES = [
    { x: 12.5, y: 5 }, { x: 37.5, y: 5 }, { x: 62.5, y: 5 }, { x: 87.5, y: 5 },
    { x: 10, y: 15 }, { x: 18.75, y: 15 }, { x: 39.58333, y: 15 }, { x: 60.41667, y: 15 }, { x: 81.25, y: 15 }, { x: 90, y: 15 },
    { x: 10, y: 30 }, { x: 28.125, y: 30 }, { x: 42.70833, y: 30 }, { x: 57.29167, y: 30 }, { x: 71.875, y: 30 }, { x: 90, y: 30 },
    { x: 10, y: 45 }, { x: 37.5, y: 45 }, { x: 45.83333, y: 45 }, { x: 54.16667, y: 45 }, { x: 62.5, y: 45 }, { x: 90, y: 45 },
    { x: 50, y: 65 }
];

const BOARD_LINES = [
    [0, 3], [4, 9], [10, 15], [16, 21],
    [4, 16], [9, 21],
    [0, 5], [1, 6], [2, 7], [3, 8],
    [5, 11], [6, 12], [7, 13], [8, 14],
    [11, 17], [12, 18], [13, 19], [14, 20],
    [17, 22], [18, 22], [19, 22], [20, 22]
];

const BOARD_CONNECTIONS = {
    0: [1, 5], 1: [0, 2, 6], 2: [1, 3, 7], 3: [2, 8],
    4: [10, 5], 5: [0, 4, 6, 11], 6: [1, 5, 7, 12], 7: [2, 6, 8, 13],
    8: [3, 7, 9, 14], 9: [8, 15],
    10: [4, 11, 16], 11: [5, 10, 12, 17], 12: [6, 11, 13, 18],
    13: [7, 12, 14, 19], 14: [8, 13, 15, 20], 15: [9, 14, 21],
    16: [10, 17], 17: [11, 16, 18, 22], 18: [12, 17, 19, 22],
    19: [13, 18, 20, 22], 20: [14, 19, 21, 22], 21: [15, 20],
    22: [17, 18, 19, 20]
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const roleScreen = document.getElementById('roleScreen');
const waitingScreen = document.getElementById('waitingScreen');
const gameScreen = document.getElementById('gameScreen');
const usernameInput = document.getElementById('usernameInput');
const joinButton = document.getElementById('joinButton');
const rulesButton = document.getElementById('rulesButton');
const gameRulesButton = document.getElementById('gameRulesButton');
const yourName = document.getElementById('yourName');
const yourRole = document.getElementById('yourRole');
const opponentName = document.getElementById('opponentName');
const opponentRole = document.getElementById('opponentRole');
const currentTurnEl = document.getElementById('currentTurn');
const goatsPlacedEl = document.getElementById('goatsPlaced');
const goatsCapturedEl = document.getElementById('goatsCaptured');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const gameBoard = document.getElementById('gameBoard');
const gameOverlay = document.getElementById('gameOverlay');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMessage = document.getElementById('gameOverMessage');
const newGameButton = document.getElementById('newGameButton');
const rulesModal = document.getElementById('rulesModal');
const closeRulesModal = document.getElementById('closeRulesModal');
const closeRulesBtn = document.getElementById('closeRulesBtn');
const quitModal = document.getElementById('quitModal');
const quitGameButton = document.getElementById('quitGameButton');
const cancelQuitBtn = document.getElementById('cancelQuitBtn');
const confirmQuitBtn = document.getElementById('confirmQuitBtn');
const randomRoleButton = document.getElementById('randomRoleButton');
const cancelWaitButton = document.getElementById('cancelWaitButton');
const selectedRoleEl = document.getElementById('selectedRole');

let selectedRole = null;

// Initialize
function init() {
    drawBoard();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    joinButton.addEventListener('click', handleJoinClick);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoinClick();
    });
    
    // Role selection
    document.querySelectorAll('.btn-role').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.target.dataset.role;
            selectRole(role);
        });
    });
    
    randomRoleButton.addEventListener('click', () => {
        const roles = ['goats', 'tigers'];
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        selectRole(randomRole);
    });
    
    // Rules buttons
    rulesButton.addEventListener('click', () => openModal(rulesModal));
    gameRulesButton.addEventListener('click', () => openModal(rulesModal));
    closeRulesModal.addEventListener('click', () => closeModal(rulesModal));
    closeRulesBtn.addEventListener('click', () => closeModal(rulesModal));
    
    // Quit game
    quitGameButton.addEventListener('click', () => openModal(quitModal));
    cancelQuitBtn.addEventListener('click', () => closeModal(quitModal));
    confirmQuitBtn.addEventListener('click', handleQuitGame);
    
    // Cancel waiting
    cancelWaitButton.addEventListener('click', () => {
        socket.emit('cancelWaiting');
        switchScreen('role');
    });
    
    newGameButton.addEventListener('click', () => location.reload());
    
    // Close modals on outside click
    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) closeModal(rulesModal);
    });
    quitModal.addEventListener('click', (e) => {
        if (e.target === quitModal) closeModal(quitModal);
    });
}

// Handle Join Click
function handleJoinClick() {
    const username = usernameInput.value.trim();
    if (username.length < 2) {
        alert('Please enter a valid name (at least 2 characters)');
        return;
    }
    gameState.username = username;
    switchScreen('role');
}

// Select Role
function selectRole(role) {
    selectedRole = role;
    socket.emit('joinGame', { username: gameState.username, role: role });
    selectedRoleEl.textContent = `You selected: ${role === 'goats' ? '🐐 Goats' : '🐅 Tigers'}`;
    switchScreen('waiting');
}

// Handle Quit Game
function handleQuitGame() {
    socket.emit('quitGame', { gameId: gameState.gameId });
    closeModal(quitModal);
    showMessage('You have quit the game', 'error');
    setTimeout(() => location.reload(), 2000);
}

// Modal functions
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Socket Events
socket.on('waiting', () => {
    switchScreen('waiting');
});

socket.on('gameStart', (data) => {
    gameState.gameId = data.gameId;
    gameState.role = data.role;
    gameState.opponentName = data.opponent;
    
    yourName.textContent = gameState.username;
    yourRole.textContent = data.role === 'goats' ? '🐐 Goats' : '🐅 Tigers';
    opponentName.textContent = data.opponent;
    opponentRole.textContent = data.role === 'goats' ? '🐅 Tigers' : '🐐 Goats';
    
    updateGameState(data.gameState);
    switchScreen('game');
    
    if (data.role === 'goats') {
        showMessage('Your turn! Place a goat on the board', 'success');
    } else {
        showMessage('Waiting for opponent to place a goat...', '');
    }
});

socket.on('gameUpdate', (data) => {
    updateGameState(data);
    
    if (data.gameOver) {
        showGameOver(data.winner);
    } else {
        updateTurnMessage();
    }
});

socket.on('opponentQuit', () => {
    showGameOver(gameState.role, 'Opponent quit the game!');
});

socket.on('error', (data) => {
    showMessage(data.message, 'error');
});

socket.on('opponentDisconnected', () => {
    showMessage('Opponent disconnected. Game ended.', 'error');
    setTimeout(() => location.reload(), 3000);
});

// Update Game State
function updateGameState(data) {
    gameState.board = data.board;
    gameState.currentTurn = data.currentTurn;
    gameState.goatsPlaced = data.goatsPlaced;
    gameState.goatsCaptured = data.goatsCaptured;
    
    currentTurnEl.textContent = data.currentTurn === 'goats' ? '🐐 Goats' : '🐅 Tigers';
    goatsPlacedEl.textContent = `${data.goatsPlaced} / 15`;
    goatsCapturedEl.textContent = `${data.goatsCaptured} / 5`;
    
    drawPieces();
}

// Update Turn Message
function updateTurnMessage() {
    const isMyTurn = gameState.currentTurn === gameState.role;
    
    if (isMyTurn) {
        if (gameState.role === 'goats') {
            if (gameState.goatsPlaced < 15) {
                showMessage('Your turn! Place a goat on an empty point', 'success');
            } else {
                showMessage('Your turn! Move a goat to an adjacent empty point', 'success');
            }
        } else {
            showMessage('Your turn! Move or capture with a tiger', 'success');
        }
    } else {
        showMessage(`Waiting for opponent (${gameState.opponentName})...`, '');
    }
}

// Draw Board
function drawBoard() {
    gameBoard.innerHTML = '';
    
    // Draw lines
    BOARD_LINES.forEach(([start, end]) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', POINT_COORDINATES[start].x);
        line.setAttribute('y1', POINT_COORDINATES[start].y);
        line.setAttribute('x2', POINT_COORDINATES[end].x);
        line.setAttribute('y2', POINT_COORDINATES[end].y);
        line.classList.add('board-line');
        gameBoard.appendChild(line);
    });
    
    // Draw points
    POINT_COORDINATES.forEach((coord, index) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('board-point');
        group.dataset.index = index;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', coord.x);
        circle.setAttribute('cy', coord.y);
        circle.setAttribute('r', 1.5);
        circle.classList.add('board-point-circle');
        
        group.appendChild(circle);
        group.addEventListener('click', () => handlePointClick(index));
        
        gameBoard.appendChild(group);
    });
}

// Draw Pieces
function drawPieces() {
    document.querySelectorAll('.game-piece').forEach(el => el.remove());
    
    gameState.board.forEach((piece, index) => {
        if (piece) {
            const coord = POINT_COORDINATES[index];
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coord.x);
            circle.setAttribute('cy', coord.y);
            circle.setAttribute('r', 2.5);
            circle.classList.add('game-piece', piece);
            circle.dataset.index = index;
            circle.addEventListener('click', () => handlePieceClick(index));
            gameBoard.appendChild(circle);
        }
    });
    
    if (gameState.selectedPiece !== null) {
        highlightSelectedPiece(gameState.selectedPiece);
        showValidMoves();
    }
}

// Handle Point Click
function handlePointClick(index) {
    const isMyTurn = gameState.currentTurn === gameState.role;
    if (!isMyTurn) return;
    
    // Placing goat
    if (gameState.role === 'goats' && gameState.goatsPlaced < 15) {
        if (gameState.board[index] === null) {
            socket.emit('placeGoat', { position: index });
        } else {
            showMessage('This position is occupied!', 'error');
        }
        return;
    }
    
    // Moving piece
    if (gameState.selectedPiece !== null && gameState.validMoves.includes(index)) {
        socket.emit('movePiece', { from: gameState.selectedPiece, to: index });
        clearSelection();
    }
}

// Handle Piece Click
function handlePieceClick(index) {
    const piece = gameState.board[index];
    const isMyTurn = gameState.currentTurn === gameState.role;
    
    if (!isMyTurn) return;
    
    if ((gameState.role === 'goats' && piece === 'goat') ||
        (gameState.role === 'tigers' && piece === 'tiger')) {
        
        if (gameState.role === 'goats' && gameState.goatsPlaced < 15) {
            showMessage('Place all goats before moving!', 'error');
            return;
        }
        
        gameState.selectedPiece = index;
        gameState.validMoves = calculateValidMoves(index);
        highlightSelectedPiece(index);
        showValidMoves();
    }
}

// Check if three points form a valid straight line for capture
function isValidCaptureLine(from, middle, to) {
    const p1 = POINT_COORDINATES[from];
    const p2 = POINT_COORDINATES[middle];
    const p3 = POINT_COORDINATES[to];

    // Calculate vectors from->middle and middle->to
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p3.x - p2.x;
    const v2y = p3.y - p2.y;

    // Cross product to check collinearity (should be ~0 for straight line)
    const crossProduct = v1x * v2y - v1y * v2x;
    
    // Dot product to ensure same direction (should be positive)
    const dotProduct = v1x * v2x + v1y * v2y;

    // Points are collinear if cross product is near zero
    // Points are in same direction if dot product is positive
    const isCollinear = Math.abs(crossProduct) < 0.01;
    const isSameDirection = dotProduct > 0;

    return isCollinear && isSameDirection;
}

// Calculate Valid Moves
function calculateValidMoves(fromIndex) {
    const validMoves = [];
    const piece = gameState.board[fromIndex];
    const connections = BOARD_CONNECTIONS[fromIndex];
    
    connections.forEach(to => {
        // Simple move - adjacent empty space
        if (gameState.board[to] === null) {
            validMoves.push(to);
        } else if (piece === 'tiger' && gameState.board[to] === 'goat') {
            // Capture move - tiger can only jump in a STRAIGHT LINE
            const goatConnections = BOARD_CONNECTIONS[to];
            
            goatConnections.forEach(jumpTo => {
                // Check basic conditions first
                if (jumpTo !== fromIndex && gameState.board[jumpTo] === null) {
                    // Now verify it's a true geometric straight line
                    if (isValidCaptureLine(fromIndex, to, jumpTo)) {
                        validMoves.push(jumpTo);
                    }
                }
            });
        }
    });
    
    return validMoves;
}

// Highlight Selected Piece
function highlightSelectedPiece(index) {
    document.querySelectorAll('.game-piece').forEach(el => {
        el.classList.remove('selected');
    });
    
    const piece = document.querySelector(`.game-piece[data-index="${index}"]`);
    if (piece) {
        piece.classList.add('selected');
    }
}

// Show Valid Moves
function showValidMoves() {
    document.querySelectorAll('.board-point').forEach(el => {
        el.classList.remove('valid-move');
    });
    
    gameState.validMoves.forEach(index => {
        const point = document.querySelector(`.board-point[data-index="${index}"]`);
        if (point) {
            point.classList.add('valid-move');
        }
    });
}

// Clear Selection
function clearSelection() {
    gameState.selectedPiece = null;
    gameState.validMoves = [];
    document.querySelectorAll('.game-piece').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelectorAll('.board-point').forEach(el => {
        el.classList.remove('valid-move');
    });
}

// Show Message
function showMessage(text, type = '') {
    messageText.textContent = text;
    messageBox.className = 'message-box';
    if (type) messageBox.classList.add(type);
}

// Switch Screen
function switchScreen(screen) {
    loginScreen.classList.remove('active');
    roleScreen.classList.remove('active');
    waitingScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    
    if (screen === 'login') loginScreen.classList.add('active');
    if (screen === 'role') roleScreen.classList.add('active');
    if (screen === 'waiting') waitingScreen.classList.add('active');
    if (screen === 'game') gameScreen.classList.add('active');
}

// Show Game Over
function showGameOver(winner, message = null) {
    const didIWin = winner === gameState.role;
    
    gameOverTitle.textContent = didIWin ? '🎉 You Win!' : '😔 You Lose';
    gameOverMessage.textContent = message || (didIWin 
        ? `Congratulations! You defeated ${gameState.opponentName}!`
        : `${gameState.opponentName} won this round. Better luck next time!`);
    
    gameOverlay.classList.add('active');
}

// Initialize on load
init();