// Enemy entity class
// Represents an enemy placed in the room grid

import { SPRITES } from './rendering/spriteDefinitions.js';

export class Enemy {
    /**
     * Creates a new enemy
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = SPRITES.ENEMY;
    }

    /**
     * Renders the enemy to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {SpriteRenderer} renderer - Sprite renderer instance
     * @param {number} cellSize - Size of each cell in pixels
     * @param {number} offsetX - X offset for rendering (in pixels)
     * @param {number} offsetY - Y offset for rendering (in pixels)
     */
    render(ctx, renderer, cellSize, offsetX = 0, offsetY = 0) {
        const pixelX = offsetX + this.x * cellSize;
        const pixelY = offsetY + this.y * cellSize;
        const scale = cellSize / 10; // Assuming 10x10 pixel sprites

        renderer.drawSprite(ctx, this.sprite, pixelX, pixelY, scale);
    }
}
