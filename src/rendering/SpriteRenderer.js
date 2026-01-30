// SpriteRenderer class - handles rendering sprites from sprite sheets to the canvas

import { SPRITES } from './spriteDefinitions.js';

export class SpriteRenderer {
    constructor() {
        // Registry of sprite sheets by name
        this.spriteSheets = new Map();
    }

    /**
     * Register a sprite sheet with a name
     * @param {string} name - Name identifier for the sprite sheet
     * @param {SpriteSheet} spriteSheet - The sprite sheet instance
     */
    registerSpriteSheet(name, spriteSheet) {
        this.spriteSheets.set(name, spriteSheet);
    }

    /**
     * Get a registered sprite sheet by name
     * @param {string} name - Name of the sprite sheet
     * @returns {SpriteSheet|null}
     */
    getSpriteSheet(name) {
        return this.spriteSheets.get(name) || null;
    }

    /**
     * Draw a sprite at the specified canvas position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} spriteDef - Sprite definition with sheet, row, and col properties
     * @param {number} x - X position on canvas
     * @param {number} y - Y position on canvas
     * @param {number} scale - Optional scale factor (default: 1)
     */
    drawSprite(ctx, spriteDef, x, y, scale = 1) {
        // Auto-detect sheet from sprite definition
        const sheetName = spriteDef.sheet;

        if (!sheetName) {
            console.error('Sprite definition does not specify a sheet');
            return;
        }

        const spriteSheet = this.spriteSheets.get(sheetName);

        if (!spriteSheet) {
            console.error(`Sprite sheet '${sheetName}' not registered`);
            return;
        }

        if (!spriteSheet.isReady()) {
            console.warn(`Sprite sheet '${sheetName}' not ready yet`);
            return;
        }

        const { width, height } = spriteSheet.getSpriteDimensions();

        // Calculate source coordinates in the sprite sheet
        const sourceX = spriteDef.col * width;
        const sourceY = spriteDef.row * height;

        // Calculate destination dimensions
        const destWidth = width * scale;
        const destHeight = height * scale;

        // Draw the sprite
        ctx.drawImage(
            spriteSheet.getImage(),
            sourceX, sourceY, width, height,  // Source rectangle
            x, y, destWidth, destHeight        // Destination rectangle
        );
    }
}
