// Game logic and mechanics

import { SpriteSheet } from './rendering/SpriteSheet.js';
import { SpriteRenderer } from './rendering/SpriteRenderer.js';
import { SPRITES } from './rendering/spriteDefinitions.js';

let gameState = {
    running: false,
    spriteSheets: {},  // Store multiple sprite sheets by name
    spriteRenderer: null
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

    // Draw sprites - the sheet is automatically determined from the sprite definition
    renderer.drawSprite(ctx, SPRITES.FLAG, 50, 120, 4);  // 4x scale
}
