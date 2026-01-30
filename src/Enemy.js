// Enemy entity class
// Represents an enemy placed in the room grid

import { SPRITES } from './rendering/spriteDefinitions.js';
import { HorizontalChaseStrategy } from './ai/EnemyBehaviors.js';

export class Enemy {
    /**
     * Creates a new enemy
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {Object} behavior - AI Behavior Strategy (default: HorizontalChaseStrategy)
     * @param {Object} sprite - Sprite definition (default: SPRITES.ENEMY)
     */
    constructor(x, y, behavior = null, sprite = null) {
        this.x = x;
        this.y = y;
        this.active = false;

        // Default to Horizontal Strategy if none provided
        this.behavior = behavior || new HorizontalChaseStrategy();

        // Default to standard enemy sprite if none provided
        this.sprite = sprite || SPRITES.ENEMY;
        this.activeSprite = this.sprite;

        this.health = 1;
    }

    /**
     * Reduces enemy health
     * @param {number} amount
     * @returns {number} Current health
     */
    takeDamage(amount) {
        this.health -= amount;
        return this.health;
    }

    /**
     * Executes the enemy's turn
     * @param {Object} player - The player object
     * @param {Room} room - The current room
     * @returns {boolean} True if the enemy moved or acted
     */
    takeTurn(player, room) {
        const result = this.behavior.takeTurn(this, player, room);

        // Sync active state from behavior (if it changed)
        if (this.behavior.active && !this.active) {
            this.active = true;
        }

        return result.moved;
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
