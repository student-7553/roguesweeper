import { SPRITES } from './rendering/spriteDefinitions.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 3;
    }

    /**
     * Reduces player health by the given amount
     * @param {number} amount 
     * @returns {number} Current health
     */
    takeDamage(amount) {
        this.health -= amount;
        return this.health;
    }

    /**
     * Attempts to move the player
     * @param {number} dx - Change in x (-1, 0, 1)
     * @param {number} dy - Change in y (-1, 0, 1)
     * @param {Room} room - The current room to check collisions against
     * @returns {boolean} - True if moved, false if blocked
     */
    move(dx, dy, room) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (room.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }

        return false;
    }

    /**
     * Attacks in the specified direction
     * @param {number} dx 
     * @param {number} dy 
     * @param {Room} room 
     * @returns {boolean} True if an attack was performed (even if it missed/hit nothing? Or only if successful? Plan said true if turn consumed. Let's return true.)
     */
    attack(dx, dy, room) {
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        // Check for entity at target
        const entityObj = room.getEntityAt(targetX, targetY);

        if (entityObj && entityObj.type === 'enemy') {
            const enemy = entityObj.entity;
            const remainingHealth = enemy.takeDamage(1);
            console.log(`Player attacked Enemy! HP: ${remainingHealth}`);

            if (remainingHealth <= 0) {
                room.removeEntity(entityObj);
                console.log("Enemy defeated!");
            }
            return true; // Performed an attack action
        } else {
            console.log("Attack missed!");
            // return true; // Missed attack still consumes turn? Yes, usually.
            // But wait, if player just hits arrow key at wall, does it waste turn?
            // "the attack is done in the chosen direction's adjacent tile". 
            // "If the enemy dies on the player's turn... verify [it]... does not get a chance to play a turn".
            // I will assume attacking always consumes a turn, akin to bumping into a wall in some roguelikes, or at least swinging weapon.
            return true;
        }
    }

    /**
     * Renders the player
     * @param {CanvasRenderingContext2D} ctx 
     * @param {SpriteRenderer} renderer 
     * @param {number} cellSize 
     * @param {number} offsetX 
     * @param {number} offsetY 
     */
    render(ctx, renderer, cellSize, offsetX, offsetY) {
        const pixelX = offsetX + this.x * cellSize;
        const pixelY = offsetY + this.y * cellSize;
        const scale = cellSize / 10; // Assuming 10x10 sprites

        renderer.drawSprite(ctx, SPRITES.PLAYER, pixelX, pixelY, scale);
    }
}
