// Game logic and mechanics

import { SpriteSheet } from './rendering/SpriteSheet.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { Room, SIDE } from './Room.js';

let gameState = {
    running: false,
    spriteSheets: {},  // Store multiple sprite sheets by name
    spriteRenderer: null,
    currentRoom: null  // Current room being displayed
};

export function initGame(canvas, ctx) {
    console.log('Game initialized');

    // Initialize sprite renderer (works with multiple sheets)
    gameState.spriteRenderer = new SpriteRenderer();

    // Load sprite sheet(s) - you can add more sheets here in the future
    gameState.spriteSheets.sheet_1 = new SpriteSheet('../assets/images/sheet_1.png', 10, 10, () => {
        console.log('sheet_1 loaded');
        checkAllSheetsLoaded(canvas, ctx);
    });

    // Register the sprite sheet with the renderer
    gameState.spriteRenderer.registerSpriteSheet('sheet_1', gameState.spriteSheets.sheet_1);

    // Future sprite sheets can be added like this:
    // gameState.spriteSheets.ui_sheet = new SpriteSheet('../assets/images/ui_sheet.png', 16, 16, () => {
    //     console.log('ui_sheet loaded');
    //     checkAllSheetsLoaded(canvas, ctx);
    // });
    // gameState.spriteRenderer.registerSpriteSheet('ui_sheet', gameState.spriteSheets.ui_sheet);
}

function checkAllSheetsLoaded(canvas, ctx) {
    // Check if all sprite sheets are loaded
    const allLoaded = Object.values(gameState.spriteSheets).every(sheet => sheet.isReady());

    if (allLoaded && !gameState.running) {
        console.log('All sprite sheets ready, starting game loop');

        // Create a test room (15x15 cells, 30px per cell, entrance on left)
        gameState.currentRoom = new Room(15, 15, 30, SIDE.LEFT);
        console.log('Room created:', gameState.currentRoom);

        gameState.running = true;
        gameLoop(canvas, ctx);
    }
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
    // Update game logic here
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
    }
}
