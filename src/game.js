// Game logic and mechanics

import { SpriteSheet } from './rendering/SpriteSheet.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { Room, SIDE } from './Room.js';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { getSoundManager } from './Sound.js';

let gameState = {
    running: false,
    spriteSheets: {},  // Store multiple sprite sheets by name
    spriteRenderer: null,
    currentRoom: null,  // Current room being displayed
    input: null,
    player: null,
    gameOver: false,
    score: 0
};

export function initGame(canvas, ctx) {
    console.log('Game initialized');

    // Initialize sprite renderer (works with multiple sheets)
    gameState.spriteRenderer = new SpriteRenderer();

    // Initialize input
    gameState.input = new Input();

    // Load sprite sheet(s) - you can add more sheets here in the future
    gameState.spriteSheets.sheet_1 = new SpriteSheet('./assets/images/sheet_1.png', 10, 10, () => {
        console.log('sheet_1 loaded');
        checkAllSheetsLoaded(canvas, ctx);
    });

    // Register the sprite sheet with the renderer
    gameState.spriteRenderer.registerSpriteSheet('sheet_1', gameState.spriteSheets.sheet_1);
}

function checkAllSheetsLoaded(canvas, ctx) {
    // Check if all sprite sheets are loaded
    const allLoaded = Object.values(gameState.spriteSheets).every(sheet => sheet.isReady());

    if (allLoaded && !gameState.running) {
        console.log('All sprite sheets ready, starting game loop');

        startNewGame();

        gameState.running = true;
        gameLoop(canvas, ctx);
    }
}

function startNewGame() {
    console.log('Starting new game...');

    // Reset Game State
    gameState.gameOver = false;
    gameState.score = 0;

    // Random entrance side
    const sides = [SIDE.TOP, SIDE.RIGHT, SIDE.BOTTOM, SIDE.LEFT];
    const randomEntranceSide = sides[Math.floor(Math.random() * sides.length)];

    // Create a test room (20x20 cells, 30px per cell, random entrance, 25 bombs, 10 enemies, 5 coins)
    gameState.currentRoom = new Room(20, 20, 30, randomEntranceSide, 25, 10, 5);

    // Create player at entrance
    const entrance = gameState.currentRoom.entrancePos;
    gameState.player = new Player(entrance.x, entrance.y);

    // Trigger initial room logic for player start position
    gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);

    console.log('Room created:', gameState.currentRoom);
}

function gameLoop(canvas, ctx) {
    if (!gameState.running) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    update();

    // Render game
    render(ctx);

    // Continue loop
    requestAnimationFrame(() => gameLoop(canvas, ctx));
}

function update() {
    if (!gameState.player || !gameState.input) return;

    // Handle Game Over Input
    if (gameState.gameOver) {
        if (gameState.input.isJustPressed('KeyR')) {
            startNewGame();
        }
        gameState.input.update(); // Make sure to consume inputs
        return;
    }

    let actionTaken = false;

    // --- Equipment Toggle (Space) ---
    if (gameState.input.isJustPressed('Space')) {
        gameState.player.toggleEquip();
    }

    // --- Buy Flag (B key) ---
    if (gameState.input.isJustPressed('KeyB')) {
        if (gameState.score >= 50) {
            gameState.score -= 50;
            gameState.player.addFlag();
            console.log('Bought a flag! Flags: ' + gameState.player.flagCount);
        } else {
            console.log('Not enough coins to buy a flag (need 50)');
        }
    }

    // --- Movement Controls (WASD) ---
    let dx = 0;
    let dy = 0;

    if (gameState.input.isJustPressed('KeyW')) dy = -1;
    else if (gameState.input.isJustPressed('KeyS')) dy = 1;

    if (gameState.input.isJustPressed('KeyA')) dx = -1;
    else if (gameState.input.isJustPressed('KeyD')) dx = 1;

    if (dx !== 0 || dy !== 0) {
        if (gameState.player.move(dx, dy, gameState.currentRoom)) {
            // If move was successful, trigger room events
            gameState.currentRoom.onPlayerEnter(gameState.player.x, gameState.player.y);

            // Check for flag pickup at the new position
            const flagAt = gameState.currentRoom.getFlagAt(gameState.player.x, gameState.player.y);
            if (flagAt) {
                gameState.currentRoom.removeFlag(gameState.player.x, gameState.player.y);
                // gameState.player.addFlag();
                console.log('Picked up flag! Flags: ' + gameState.player.flagCount);
            }

            // Check for entities at the new position
            const entityObj = gameState.currentRoom.getEntityAt(gameState.player.x, gameState.player.y);

            if (entityObj) {
                if (entityObj.type === 'bomb' || entityObj.type === 'enemy') {
                    // Take damage
                    const remainingHealth = gameState.player.takeDamage(1);
                    console.log(`Hit ${entityObj.type}! Health: ${remainingHealth}`);
                    // Remove the entity
                    gameState.currentRoom.removeEntity(entityObj);
                } else if (entityObj.type === 'coin') {
                    // Collect coin
                    gameState.score += 10;
                    console.log(`Collected Coin! Score: ${gameState.score}`);
                    getSoundManager().playCoin();

                    // Remove the entity
                    gameState.currentRoom.removeEntity(entityObj);
                }
            } else {
                getSoundManager().playMove();
            }
            actionTaken = true;
        }
    }

    // --- Arrow Key Controls (Attack or Place Flag based on equipped item) ---
    if (!actionTaken) {
        let arrowDx = 0;
        let arrowDy = 0;

        if (gameState.input.isJustPressed('ArrowUp')) arrowDy = -1;
        else if (gameState.input.isJustPressed('ArrowDown')) arrowDy = 1;
        else if (gameState.input.isJustPressed('ArrowLeft')) arrowDx = -1;
        else if (gameState.input.isJustPressed('ArrowRight')) arrowDx = 1;

        if (arrowDx !== 0 || arrowDy !== 0) {
            const targetX = gameState.player.x + arrowDx;
            const targetY = gameState.player.y + arrowDy;

            if (gameState.player.equippedItem === 'flag') {
                // --- Flag Placement ---
                // Check if target tile is hidden
                if (gameState.currentRoom.isHidden(targetX, targetY)) {
                    // Try to use a flag
                    if (gameState.player.useFlag()) {
                        // Place the flag
                        if (gameState.currentRoom.placeFlag(targetX, targetY)) {
                            actionTaken = true;
                        } else {
                            // Failed to place, refund the flag
                            gameState.player.addFlag();
                        }
                    } else {
                        console.log('No flags available!');
                    }
                } else {
                    console.log('Can only place flags on hidden tiles');
                }
            } else {
                // --- Attack (sword equipped) ---
                if (gameState.player.attack(arrowDx, arrowDy, gameState.currentRoom)) {
                    actionTaken = true;
                }
            }
        }
    }

    // --- Enemy Turn ---
    // Trigger only if player performed an action (Move or Attack)
    if (actionTaken) {
        if (gameState.player.health > 0) {
            gameState.currentRoom.updateEnemies(gameState.player);
        }

        // --- Game State Check ---
        if (gameState.player.health <= 0) {
            gameState.gameOver = true;
            getSoundManager().playLose();
            console.log("Game Over!");
        }
    }

    // Update input state at the end of the frame
    gameState.input.update();
}

function render(ctx) {
    const renderer = gameState.spriteRenderer;

    if (!renderer) return;

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw current room if it exists
    if (gameState.currentRoom) {
        // Center the room on the canvas
        const roomPixelWidth = gameState.currentRoom.width * gameState.currentRoom.cellSize;
        const roomPixelHeight = gameState.currentRoom.height * gameState.currentRoom.cellSize;
        const offsetX = (ctx.canvas.width - roomPixelWidth) / 2;
        const offsetY = (ctx.canvas.height - roomPixelHeight) / 2;

        gameState.currentRoom.render(ctx, renderer, offsetX, offsetY);

        // Render player
        if (gameState.player) {
            gameState.player.render(ctx, renderer, gameState.currentRoom.cellSize, offsetX, offsetY);
        }

        // --- GUI ---

        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Draw Health
        ctx.fillText(`Health: ${gameState.player.health}`, 20, 20);

        // Draw Score
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${gameState.score}`, ctx.canvas.width - 20, 20);

        // Draw Equipped Item and Flag Count (bottom left)
        ctx.textAlign = 'left';
        ctx.font = '14px "Press Start 2P", monospace';

        const swordIndicator = gameState.player.equippedItem === 'sword' ? '> ' : '  ';
        const flagIndicator = gameState.player.equippedItem === 'flag' ? '> ' : '  ';

        ctx.fillStyle = gameState.player.equippedItem === 'sword' ? '#ffcc00' : '#888888';
        ctx.fillText(`${swordIndicator}Sword`, 20, ctx.canvas.height - 60);

        ctx.fillStyle = gameState.player.equippedItem === 'flag' ? '#ffcc00' : '#888888';
        ctx.fillText(`${flagIndicator}Flag x${gameState.player.flagCount}`, 20, ctx.canvas.height - 35);

        ctx.fillStyle = 'white';

        // Draw Game Over Overlay
        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.font = '40px "Press Start 2P", monospace';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);

            ctx.font = '20px "Press Start 2P", monospace';
            ctx.fillStyle = 'white';
            ctx.fillText('Press R to Restart', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
        }
    }
}
