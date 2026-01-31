import { SPRITES } from './rendering/spriteDefinitions.js';
import { getSoundManager } from './Sound.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 3;
        this.equippedItem = 'sword';  // 'sword' or 'flag'
        this.flagCount = 3;  // Start with 3 flags
    }

    /**
     * Toggles between sword and flag equipment
     */
    toggleEquip() {
        this.equippedItem = this.equippedItem === 'sword' ? 'flag' : 'sword';
        console.log(`Equipped: ${this.equippedItem}`);
    }

    /**
     * Uses a flag (decrements count)
     * @returns {boolean} True if flag was used, false if none available
     */
    useFlag() {
        if (this.flagCount > 0) {
            this.flagCount--;
            return true;
        }
        return false;
    }

    /**
     * Adds a flag to inventory
     */
    addFlag() {
        this.flagCount++;
    }

    /**
     * Reduces player health by the given amount
     * @param {number} amount 
     * @returns {number} Current health
     */
    takeDamage(amount) {
        this.health -= amount;
        getSoundManager().playDamage();
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
        }
        getSoundManager().playAttack();
        return true;
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
