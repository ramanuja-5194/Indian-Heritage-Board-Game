const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

// Game state management
const games = new Map();
const waitingPlayers = {
    goats: [],
    tigers: []
};

class Game {
    constructor(id, player1, player2) {
        this.id = id;
        this.players = {
            goats: player1,
            tigers: player2
        };
        this.currentTurn = 'goats';
        this.goatsPlaced = 0;
        this.goatsCaptured = 0;
        this.board = this.initializeBoard();
        this.gameOver = false;
        this.winner = null;
    }

    initializeBoard() {
        const board = Array(23).fill(null);
        board[22] = 'tiger';
        board[18] = 'tiger';
        board[19] = 'tiger';
        return board;
    }

    getGameState() {
        return {
            board: this.board,
            currentTurn: this.currentTurn,
            goatsPlaced: this.goatsPlaced,
            goatsCaptured: this.goatsCaptured,
            gameOver: this.gameOver,
            winner: this.winner,
            players: this.players
        };
    }

    switchTurn() {
        this.currentTurn = this.currentTurn === 'goats' ? 'tigers' : 'goats';
    }

    checkWinner() {
        if (this.goatsCaptured >= 5) {
            this.gameOver = true;
            this.winner = 'tigers';
            return true;
        }

        if (this.goatsPlaced === 15) {
            const tigerPositions = [];
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === 'tiger') {
                    tigerPositions.push(i);
                }
            }

            const allTigersTrapped = tigerPositions.every(pos => {
                return !this.hasLegalMoves(pos, 'tiger');
            });

            if (allTigersTrapped) {
                this.gameOver = true;
                this.winner = 'goats';
                return true;
            }
        }

        return false;
    }

    hasLegalMoves(position, pieceType) {
        const connections = this.getConnections(position);
        
        const POINT_COORDINATES = [
            { x: 12.5, y: 5 }, { x: 37.5, y: 5 }, { x: 62.5, y: 5 }, { x: 87.5, y: 5 },
            { x: 10, y: 15 }, { x: 18.75, y: 15 }, { x: 39.58333, y: 15 }, { x: 60.41667, y: 15 }, { x: 81.25, y: 15 }, { x: 90, y: 15 },
            { x: 10, y: 30 }, { x: 28.125, y: 30 }, { x: 42.70833, y: 30 }, { x: 57.29167, y: 30 }, { x: 71.875, y: 30 }, { x: 90, y: 30 },
            { x: 10, y: 45 }, { x: 37.5, y: 45 }, { x: 45.83333, y: 45 }, { x: 54.16667, y: 45 }, { x: 62.5, y: 45 }, { x: 90, y: 45 },
            { x: 50, y: 65 }
        ];
        
        for (const target of connections) {
            // Check simple move
            if (this.board[target] === null) {
                return true;
            }
            
            // Check for capture move if tiger
            if (pieceType === 'tiger' && this.board[target] === 'goat') {
                const targetConnections = this.getConnections(target);
                for (const jumpTo of targetConnections) {
                    if (jumpTo !== position && this.board[jumpTo] === null) {
                        // Check if it's a valid straight line
                        const p1 = POINT_COORDINATES[position];
                        const p2 = POINT_COORDINATES[target];
                        const p3 = POINT_COORDINATES[jumpTo];

                        const v1x = p2.x - p1.x;
                        const v1y = p2.y - p1.y;
                        const v2x = p3.x - p2.x;
                        const v2y = p3.y - p2.y;

                        const crossProduct = v1x * v2y - v1y * v2x;
                        const dotProduct = v1x * v2x + v1y * v2y;

                        if (Math.abs(crossProduct) < 0.01 && dotProduct > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    getConnections(point) {
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
        return BOARD_CONNECTIONS[point] || [];
    }
}

// Helper function to check if three points form a valid straight line for capture
function isValidCaptureLine(from, middle, to) {
    const POINT_COORDINATES = [
        { x: 12.5, y: 5 }, { x: 37.5, y: 5 }, { x: 62.5, y: 5 }, { x: 87.5, y: 5 },
        { x: 10, y: 15 }, { x: 18.75, y: 15 }, { x: 39.58333, y: 15 }, { x: 60.41667, y: 15 }, { x: 81.25, y: 15 }, { x: 90, y: 15 },
        { x: 10, y: 30 }, { x: 28.125, y: 30 }, { x: 42.70833, y: 30 }, { x: 57.29167, y: 30 }, { x: 71.875, y: 30 }, { x: 90, y: 30 },
        { x: 10, y: 45 }, { x: 37.5, y: 45 }, { x: 45.83333, y: 45 }, { x: 54.16667, y: 45 }, { x: 62.5, y: 45 }, { x: 90, y: 45 },
        { x: 50, y: 65 }
    ];

    const p1 = POINT_COORDINATES[from];
    const p2 = POINT_COORDINATES[middle];
    const p3 = POINT_COORDINATES[to];

    // Calculate vectors
    const v1x = p2.x - p1.x;
    const v1y = p2.y - p1.y;
    const v2x = p3.x - p2.x;
    const v2y = p3.y - p2.y;

    // Check if vectors are in the same direction (collinear and same direction)
    const crossProduct = v1x * v2y - v1y * v2x;
    const dotProduct = v1x * v2x + v1y * v2y;

    // Points are collinear if cross product is near zero
    // Points are in same direction if dot product is positive
    const isCollinear = Math.abs(crossProduct) < 0.01;
    const isSameDirection = dotProduct > 0;

    return isCollinear && isSameDirection;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', (data) => {
        const { username, role } = data;
        socket.username = username;
        socket.preferredRole = role;

        // Try to match with opposite role first
        const oppositeRole = role === 'goats' ? 'tigers' : 'goats';
        
        if (waitingPlayers[oppositeRole].length > 0) {
            // Match found with opposite role
            const opponent = waitingPlayers[oppositeRole].shift();
            const gameId = `game_${Date.now()}`;
            
            let goatsPlayer, tigersPlayer;
            if (role === 'goats') {
                goatsPlayer = socket.id;
                tigersPlayer = opponent.id;
            } else {
                goatsPlayer = opponent.id;
                tigersPlayer = socket.id;
            }
            
            const game = new Game(gameId, goatsPlayer, tigersPlayer);
            games.set(gameId, game);

            socket.join(gameId);
            opponent.join(gameId);

            socket.gameId = gameId;
            opponent.gameId = gameId;

            socket.emit('gameStart', {
                gameId: gameId,
                role: role,
                opponent: opponent.username,
                gameState: game.getGameState()
            });

            opponent.emit('gameStart', {
                gameId: gameId,
                role: oppositeRole,
                opponent: username,
                gameState: game.getGameState()
            });

            console.log(`Game started: ${gameId} - ${username}(${role}) vs ${opponent.username}(${oppositeRole})`);
        } else {
            // Add to waiting list
            waitingPlayers[role].push(socket);
            socket.emit('waiting');
            console.log(`${username} waiting as ${role}`);
        }
    });

    socket.on('cancelWaiting', () => {
        // Remove from waiting lists
        waitingPlayers.goats = waitingPlayers.goats.filter(p => p.id !== socket.id);
        waitingPlayers.tigers = waitingPlayers.tigers.filter(p => p.id !== socket.id);
        console.log('User canceled waiting:', socket.id);
    });

    socket.on('quitGame', (data) => {
        const game = games.get(socket.gameId);
        if (!game || game.gameOver) return;

        // Determine winner (opponent wins)
        const quitterRole = socket.id === game.players.goats ? 'goats' : 'tigers';
        const winnerRole = quitterRole === 'goats' ? 'tigers' : 'goats';
        
        game.gameOver = true;
        game.winner = winnerRole;

        // Notify opponent
        socket.to(socket.gameId).emit('opponentQuit');
        
        console.log(`Player ${socket.username} quit game ${socket.gameId}`);
        
        // Clean up game after a delay
        setTimeout(() => {
            games.delete(socket.gameId);
        }, 5000);
    });

    socket.on('placeGoat', (data) => {
        const game = games.get(socket.gameId);
        if (!game || game.gameOver) return;

        const { position } = data;

        if (game.currentTurn !== 'goats' || socket.id !== game.players.goats) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        if (game.goatsPlaced >= 15) {
            socket.emit('error', { message: 'All goats placed!' });
            return;
        }

        if (game.board[position] !== null) {
            socket.emit('error', { message: 'Position occupied!' });
            return;
        }

        game.board[position] = 'goat';
        game.goatsPlaced++;
        game.switchTurn();
        game.checkWinner();

        io.to(socket.gameId).emit('gameUpdate', game.getGameState());
    });

    socket.on('movePiece', (data) => {
        const game = games.get(socket.gameId);
        if (!game || game.gameOver) return;

        const { from, to } = data;

        const piece = game.board[from];
        if ((piece === 'goat' && game.currentTurn !== 'goats') || 
            (piece === 'tiger' && game.currentTurn !== 'tigers')) {
            socket.emit('error', { message: 'Not your turn!' });
            return;
        }

        if ((piece === 'goat' && socket.id !== game.players.goats) ||
            (piece === 'tiger' && socket.id !== game.players.tigers)) {
            socket.emit('error', { message: 'Not your piece!' });
            return;
        }

        if (piece === 'goat' && game.goatsPlaced < 15) {
            socket.emit('error', { message: 'Place all goats first!' });
            return;
        }

        const connections = game.getConnections(from);
        
        // Check for simple move
        if (connections.includes(to) && game.board[to] === null) {
            game.board[from] = null;
            game.board[to] = piece;
            game.switchTurn();
            game.checkWinner();
            io.to(socket.gameId).emit('gameUpdate', game.getGameState());
        } else if (piece === 'tiger') {
            // Check for capture move - tiger can only jump in a straight line
            let captureValid = false;
            let capturedGoatPosition = null;

            // Check each adjacent position for a goat
            for (const middlePos of connections) {
                if (game.board[middlePos] === 'goat') {
                    const middleConnections = game.getConnections(middlePos);
                    
                    if (middleConnections.includes(to) && game.board[to] === null) {
                        // Verify it's a true straight line using geometric check
                        if (isValidCaptureLine(from, middlePos, to)) {
                            captureValid = true;
                            capturedGoatPosition = middlePos;
                            break;
                        }
                    }
                }
            }

            if (captureValid && capturedGoatPosition !== null) {
                game.board[from] = null;
                game.board[capturedGoatPosition] = null;
                game.board[to] = 'tiger';
                game.goatsCaptured++;
                game.switchTurn();
                game.checkWinner();
                io.to(socket.gameId).emit('gameUpdate', game.getGameState());
            } else {
                socket.emit('error', { message: 'Invalid move!' });
            }
        } else {
            socket.emit('error', { message: 'Invalid move!' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from waiting lists
        waitingPlayers.goats = waitingPlayers.goats.filter(p => p.id !== socket.id);
        waitingPlayers.tigers = waitingPlayers.tigers.filter(p => p.id !== socket.id);

        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game && !game.gameOver) {
                io.to(socket.gameId).emit('opponentDisconnected');
                games.delete(socket.gameId);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://192.168.0.119:${PORT}`);
});