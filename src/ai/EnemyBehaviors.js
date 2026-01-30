export class BaseChaseBehavior {
    constructor() {
        this.active = false;
        this.blockedTurns = 0; // Track consecutive turns where enemy couldn't move
        this.lastDesiredMove = null; // Store the tile the enemy wants to move to
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
        const result = this.chase(enemy, player, room);

        // If the enemy couldn't move, track blocked turns
        if (!result.moved) {
            this.blockedTurns++;
            console.log(`Enemy blocked for ${this.blockedTurns} turns`);

            // After 3 blocked turns, try to break a tile
            if (this.blockedTurns >= 3 && this.lastDesiredMove) {
                const { x, y } = this.lastDesiredMove;
                if (room.isHidden(x, y) && room.isValidMove(x, y)) {
                    console.log('Enemy breaks tile!');
                    room.revealCell(x, y);

                    // Try to move there now (handles bomb interaction)
                    if (this.tryMoveForced(enemy, x, y, room, player)) {
                        this.blockedTurns = 0;
                        this.lastDesiredMove = null;
                        return { moved: true };
                    }
                }
                this.blockedTurns = 0; // Reset even if we couldn't move after breaking
            }
        } else {
            this.blockedTurns = 0; // Reset on successful move
            this.lastDesiredMove = null;
        }

        return result;
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

    /**
     * Attempts to move the enemy to a position, respecting hidden tiles and other blockers
     */
    tryMove(enemy, x, y, room, player) {
        if (room.isValidMove(x, y)) {
            const otherEntity = room.getEntityAt(x, y);

            // Avoid other enemies
            if (otherEntity && otherEntity.type === 'enemy') {
                return false;
            }

            // Avoid hidden tiles (but track desired move for tile breaking)
            if (room.isHidden(x, y)) {
                this.lastDesiredMove = { x, y };
                return false;
            }

            // Avoid bombs (but track desired move)
            if (otherEntity && otherEntity.type === 'bomb') {
                this.lastDesiredMove = { x, y };
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

    /**
     * Forces a move after tile breaking - allows moving onto bombs (takes damage)
     */
    tryMoveForced(enemy, x, y, room, player) {
        if (room.isValidMove(x, y)) {
            const otherEntity = room.getEntityAt(x, y);

            // Avoid other enemies
            if (otherEntity && otherEntity.type === 'enemy') {
                return false;
            }

            // Attack Player
            if (x === player.x && y === player.y) {
                console.log('Enemy attacks player!');
                player.takeDamage(1);
                room.removeEntity({ type: 'enemy', entity: enemy });
                return true;
            }

            // Handle bomb interaction - enemy takes damage and bomb explodes
            if (otherEntity && otherEntity.type === 'bomb') {
                console.log('Enemy steps on bomb!');
                // Remove the bomb first
                room.removeEntity(otherEntity);
                // Enemy takes damage
                const remainingHealth = enemy.takeDamage(1);
                if (remainingHealth <= 0) {
                    console.log('Enemy killed by bomb!');
                    room.removeEntity({ type: 'enemy', entity: enemy });
                    return true; // Enemy died, but it did act
                }
                // Move to the bomb's position
                enemy.x = x;
                enemy.y = y;
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
