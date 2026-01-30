// Flag entity class
// Represents a flag placed on a hidden tile to mark it as dangerous or safe

import { SPRITES } from './rendering/spriteDefinitions.js';

export class Flag {
    /**
     * Creates a new flag
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {boolean} isDanger - True if placed on a bomb tile
     */
    constructor(x, y, isDanger) {
        this.x = x;
        this.y = y;
        this.isDanger = isDanger;
        this.sprite = isDanger ? SPRITES.FLAG_DANGER : SPRITES.FLAG_SAFE;
    }

    /**
     * Renders the flag to the canvas
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
