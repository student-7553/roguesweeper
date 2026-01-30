export class BaseChaseBehavior {
    constructor() {
        this.active = false;
    }

    /**
     * Determines the next action for the enemy
     * @param {Enemy} enemy - The enemy instance
     * @param {Object} player - The player object
     * @param {Room} room - The current room
     * @returns {Object|null} Action object { moved: boolean } or null
     */
    takeTurn(enemy, player, room) {
        if (!this.active) {
            // Check proximity to activate
            if (this.shouldActivate(enemy, player)) {
                console.log('Enemy Activated!');
                this.active = true;
                room.revealCell(enemy.x, enemy.y);
                return { moved: true }; // Consumes turn
            }
            return { moved: false };
        }

        // Active behavior: Chase
        return this.chase(enemy, player, room);
    }

    shouldActivate(enemy, player) {
        const dx = Math.abs(enemy.x - player.x);
        const dy = Math.abs(enemy.y - player.y);
        return dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0);
    }

    chase(enemy, player, room) {
        // To be implemented by subclasses
        return { moved: false };
    }

    tryMove(enemy, x, y, room, player) {
        if (room.isValidMove(x, y)) {
            const otherEntity = room.getEntityAt(x, y);

            // Avoid bombs and other enemies
            if (otherEntity && (otherEntity.type === 'bomb' || otherEntity.type === 'enemy')) {
                return false;
            }

            // Avoid hidden tiles
            if (room.isHidden(x, y)) {
                return false;
            }

            // Attack Player
            if (x === player.x && y === player.y) {
                console.log('Enemy attacks player!');
                player.takeDamage(1);
                room.removeEntity({ type: 'enemy', entity: enemy });
                return true;
            }

            // Move to empty spot or coin
            if (!otherEntity || otherEntity.type === 'coin') {
                enemy.x = x;
                enemy.y = y;
                return true;
            }
        }
        return false;
    }
}

export class HorizontalChaseStrategy extends BaseChaseBehavior {
    chase(enemy, player, room) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        // Try horizontal first
        if (dx !== 0) {
            const nextX = enemy.x + Math.sign(dx);
            if (this.tryMove(enemy, nextX, enemy.y, room, player)) {
                return { moved: true };
            }
        }

        // Then vertical
        if (dy !== 0) {
            const nextY = enemy.y + Math.sign(dy);
            if (this.tryMove(enemy, enemy.x, nextY, room, player)) {
                return { moved: true };
            }
        }

        return { moved: false };
    }
}

export class VerticalChaseStrategy extends BaseChaseBehavior {
    chase(enemy, player, room) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        // Try vertical first
        if (dy !== 0) {
            const nextY = enemy.y + Math.sign(dy);
            if (this.tryMove(enemy, enemy.x, nextY, room, player)) {
                return { moved: true };
            }
        }

        // Then horizontal
        if (dx !== 0) {
            const nextX = enemy.x + Math.sign(dx);
            if (this.tryMove(enemy, nextX, enemy.y, room, player)) {
                return { moved: true };
            }
        }

        return { moved: false };
    }
}
