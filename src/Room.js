// Room class for dungeon generation
// Each room is a minesweeper-style grid with walls, entrance, and exit

import { SPRITES } from './rendering/spriteDefinitions.js';
import { Bomb } from './Bomb.js';
import { Enemy } from './Enemy.js';
import { Coin } from './Coin.js';

// Enum for sides of the room
export const SIDE = {
    TOP: 'TOP',
    RIGHT: 'RIGHT',
    BOTTOM: 'BOTTOM',
    LEFT: 'LEFT'
};

export class Room {
    /**
     * Creates a new room
     * @param {number} width - Width of the room in cells
     * @param {number} height - Height of the room in cells
     * @param {number} cellSize - Size of each cell in pixels (scale of sprite)
     * @param {string} entranceSide - Side where entrance is located (use SIDE enum)
     * @param {number} bombCount - Number of bombs to generate in the room
     * @param {number} enemyCount - Number of enemies to generate in the room
     * @param {number} coinCount - Number of coins to generate in the room
     */
    constructor(width, height, cellSize, entranceSide, bombCount = 0, enemyCount = 0, coinCount = 0) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.entranceSide = entranceSide;
        this.bombCount = bombCount;
        this.enemyCount = enemyCount;
        this.coinCount = coinCount;

        // Initialize the grid (0 = floor/empty cell, 1 = wall)
        // Entrance and exit are treated as floor cells, tracked separately
        this.grid = [];

        // Store which floor sprite variant to use for each cell (0-5 for 6 different sprites)
        this.floorVariants = [];

        // Store entrance and exit positions
        this.entrancePos = null;
        this.exitPos = null;

        // Store bombs
        this.bombs = [];

        // Store enemies
        this.enemies = [];

        // Store coins
        this.coins = [];

        // Store cell data for hints
        this.cellData = [];

        // Generate the room
        this.generate();
    }

    /**
     * Generates the room layout
     */
    generate() {
        // Initialize grid, floor variants, and cell data
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.floorVariants[y] = [];
            this.cellData[y] = []; // Initialize cellData here
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 0; // Floor cell
                // Randomly choose between 6 floor sprite variants (0-5)
                this.floorVariants[y][x] = Math.floor(Math.random() * 6);

                // Determine if cell is on the border (visible) or inner (hidden)
                const isBorder = x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;

                this.cellData[y][x] = {
                    hidden: !isBorder, // Hidden if NOT border
                    hiddenVariant: Math.floor(Math.random() * 2), // 0 or 1 for sprite choice
                    hint: 0,
                    hasNeighborBomb: false,
                    hasNeighborEnemy: false,
                    hasNeighborCoin: false
                };
            }
        }

        // Place walls around the perimeter
        this.placeWalls();

        // Place entrance
        this.placeEntrance();

        // Place exit (on a different side, avoiding the same half)
        this.placeExit();

        // Generate bombs
        this.generateBombs();

        // Generate enemies
        this.generateEnemies();

        // Generate coins
        this.generateCoins();

        // Calculate hints
        this.calculateHints();
    }

    /**
     * Generates bombs randomly in the room avoiding restricted areas
     */
    generateBombs() {
        let placedBombs = 0;
        let attempts = 0;
        const maxAttempts = this.bombCount * 100; // Safety break

        while (placedBombs < this.bombCount && attempts < maxAttempts) {
            attempts++;

            // Random position inside walls (1 to width-2)
            const x = Math.floor(Math.random() * (this.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - 2)) + 1;

            if (this.isValidEntityPosition(x, y)) {
                this.bombs.push(new Bomb(x, y));
                placedBombs++;
            }
        }

        if (placedBombs < this.bombCount) {
            console.warn(`Could only place ${placedBombs}/${this.bombCount} bombs.`);
        }
    }

    /**
     * Generates enemies randomly in the room
     */
    generateEnemies() {
        let placedEnemies = 0;
        let attempts = 0;
        const maxAttempts = this.enemyCount * 100;

        while (placedEnemies < this.enemyCount && attempts < maxAttempts) {
            attempts++;

            const x = Math.floor(Math.random() * (this.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - 2)) + 1;

            if (this.isValidEntityPosition(x, y)) {
                this.enemies.push(new Enemy(x, y));
                placedEnemies++;
            }
        }

        if (placedEnemies < this.enemyCount) {
            console.warn(`Could only place ${placedEnemies}/${this.enemyCount} enemies.`);
        }
    }

    /**
     * Generates coins randomly in the room
     */
    generateCoins() {
        let placedCoins = 0;
        let attempts = 0;
        const maxAttempts = this.coinCount * 100;

        while (placedCoins < this.coinCount && attempts < maxAttempts) {
            attempts++;

            const x = Math.floor(Math.random() * (this.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - 2)) + 1;

            if (this.isValidEntityPosition(x, y)) {
                this.coins.push(new Coin(x, y));
                placedCoins++;
            }
        }

        if (placedCoins < this.coinCount) {
            console.warn(`Could only place ${placedCoins}/${this.coinCount} coins.`);
        }
    }

    /**
     * Calculates hint numbers and neighbor flags for all cells
     */
    calculateHints() {
        // Reset hints (keep hidden state)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Only reset the hint-related data
                this.cellData[y][x].hint = 0;
                this.cellData[y][x].hasNeighborBomb = false;
                this.cellData[y][x].hasNeighborEnemy = false;
                this.cellData[y][x].hasNeighborCoin = false;
            }
        }

        const updateNeighbor = (cx, cy, type) => {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        this.cellData[ny][nx].hint++;
                        if (type === 'bomb') this.cellData[ny][nx].hasNeighborBomb = true;
                        if (type === 'enemy') this.cellData[ny][nx].hasNeighborEnemy = true;
                        if (type === 'coin') this.cellData[ny][nx].hasNeighborCoin = true;
                    }
                }
            }
        };

        this.bombs.forEach(b => updateNeighbor(b.x, b.y, 'bomb'));
        this.enemies.forEach(e => updateNeighbor(e.x, e.y, 'enemy'));
        this.coins.forEach(c => updateNeighbor(c.x, c.y, 'coin'));
    }

    /**
     * Checks if there is an entity at the given position
     */
    hasEntityAt(x, y) {
        return this.bombs.some(b => b.x === x && b.y === y) ||
            this.enemies.some(e => e.x === x && e.y === y) ||
            this.coins.some(c => c.x === x && c.y === y);
    }

    /**
     * Checks if a position is valid for an entity (bomb or enemy)
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isValidEntityPosition(x, y) {
        // Must be a floor cell
        if (this.grid[y][x] !== 0) return false;

        // Check against existing bombs
        if (this.bombs.some(b => b.x === x && b.y === y)) return false;

        // Check against existing enemies
        if (this.enemies.some(e => e.x === x && e.y === y)) return false;

        // Check against existing coins
        if (this.coins.some(c => c.x === x && c.y === y)) return false;

        // Check distance to entrance (3x3 area means within 1 cell distance)
        // dx, dy <= 1 check covers the 3x3 centered on target
        if (Math.abs(x - this.entrancePos.x) <= 2 && Math.abs(y - this.entrancePos.y) <= 2) {
            return false;
        }

        // Check distance to exit
        if (Math.abs(x - this.exitPos.x) <= 2 && Math.abs(y - this.exitPos.y) <= 2) {
            return false;
        }

        return true;
    }

    /**
     * Places walls around the perimeter of the room
     */
    placeWalls() {
        // Top and bottom walls
        for (let x = 0; x < this.width; x++) {
            this.grid[0][x] = 1; // Top wall
            this.grid[this.height - 1][x] = 1; // Bottom wall
        }

        // Left and right walls
        for (let y = 0; y < this.height; y++) {
            this.grid[y][0] = 1; // Left wall
            this.grid[y][this.width - 1] = 1; // Right wall
        }
    }

    /**
     * Places the entrance on the specified side
     */
    placeEntrance() {
        let x, y;

        switch (this.entranceSide) {
            case SIDE.TOP:
                x = Math.floor(this.width / 2);
                y = 0;
                break;
            case SIDE.RIGHT:
                x = this.width - 1;
                y = Math.floor(this.height / 2);
                break;
            case SIDE.BOTTOM:
                x = Math.floor(this.width / 2);
                y = this.height - 1;
                break;
            case SIDE.LEFT:
                x = 0;
                y = Math.floor(this.height / 2);
                break;
        }

        // Entrance is a floor cell, just track its position
        this.grid[y][x] = 0; // Set to floor (overrides wall)
        this.entrancePos = { x, y };
    }


    /**
     * Places the exit on a valid side (not the same half as entrance)
     */
    placeExit() {
        const validSides = this.getValidExitSides();

        // Randomly choose from valid sides
        const exitSide = validSides[Math.floor(Math.random() * validSides.length)];

        let x, y;

        switch (exitSide) {
            case SIDE.TOP:
                x = Math.floor(this.width / 2);
                y = 0;
                break;
            case SIDE.RIGHT:
                x = this.width - 1;
                y = Math.floor(this.height / 2);
                break;
            case SIDE.BOTTOM:
                x = Math.floor(this.width / 2);
                y = this.height - 1;
                break;
            case SIDE.LEFT:
                x = 0;
                y = Math.floor(this.height / 2);
                break;
        }

        // Exit is a floor cell, just track its position
        this.grid[y][x] = 0; // Set to floor (overrides wall)
        this.exitPos = { x, y };
    }

    /**
     * Gets valid sides for exit placement (not in the same half as entrance)
     * @returns {string[]} Array of valid SIDE values
     */
    getValidExitSides() {
        const sides = [];

        // Determine which sides are valid based on entrance position
        switch (this.entranceSide) {
            case SIDE.TOP:
                // Exit can be on right, bottom, or left (not top)
                sides.push(SIDE.RIGHT, SIDE.BOTTOM, SIDE.LEFT);
                break;
            case SIDE.RIGHT:
                // Exit can be on top, bottom, or left (not right)
                sides.push(SIDE.TOP, SIDE.BOTTOM, SIDE.LEFT);
                break;
            case SIDE.BOTTOM:
                // Exit can be on top, right, or left (not bottom)
                sides.push(SIDE.TOP, SIDE.RIGHT, SIDE.LEFT);
                break;
            case SIDE.LEFT:
                // Exit can be on top, right, or bottom (not left)
                sides.push(SIDE.TOP, SIDE.RIGHT, SIDE.BOTTOM);
                break;
        }

        return sides;
    }

    /**
     * Renders the room to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {SpriteRenderer} renderer - Sprite renderer instance
     * @param {number} offsetX - X offset for rendering (in pixels)
     * @param {number} offsetY - Y offset for rendering (in pixels)
     */
    render(ctx, renderer, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pixelX = offsetX + x * this.cellSize;
                const pixelY = offsetY + y * this.cellSize;
                const scale = this.cellSize / 10; // Assuming 10x10 pixel sprites

                // Check for hidden state first
                // Safety check: this.cellData exists and has the cell
                const cellCheckData = this.cellData[y] && this.cellData[y][x];
                const isHidden = cellCheckData ? cellCheckData.hidden : false;

                if (isHidden) {
                    // Render Hidden Tile
                    const hiddenSprite = cellCheckData.hiddenVariant === 0 ? SPRITES.HIDDEN_1 : SPRITES.HIDDEN_2;
                    renderer.drawSprite(ctx, hiddenSprite, pixelX, pixelY, scale);
                    // Skip everything else for this cell
                    continue;
                }

                const cellType = this.grid[y][x];

                // Determine which sprite to draw
                let sprite = null;

                switch (cellType) {
                    case 0: // Floor cell (includes entrance and exit)
                        // Use the randomly selected floor variant (0-5) for this cell
                        const floorSprites = [
                            SPRITES.FLOOR_1,
                            SPRITES.FLOOR_2,
                            SPRITES.FLOOR_3,
                            SPRITES.FLOOR_4,
                            SPRITES.FLOOR_5,
                            SPRITES.FLOOR_6
                        ];
                        sprite = floorSprites[this.floorVariants[y][x]];
                        break;
                    case 1: // Wall
                        sprite = SPRITES.WALL;
                        break;
                }

                if (sprite) {
                    renderer.drawSprite(ctx, sprite, pixelX, pixelY, scale);
                }

                // Render Hints
                // If the cell does not contain an entity and hint > 0 and is not a wall
                if (cellType !== 1 && !this.hasEntityAt(x, y) && cellCheckData) {
                    const data = cellCheckData;
                    if (data.hint > 0) {
                        // Draw hint number
                        ctx.font = '10px "Press Start 2P"';
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(data.hint, pixelX + this.cellSize / 2, pixelY + this.cellSize / 2);

                        // Draw indicators
                        const indicators = [];
                        if (data.hasNeighborBomb) indicators.push('red');
                        if (data.hasNeighborEnemy) indicators.push('green');
                        if (data.hasNeighborCoin) indicators.push('yellow');

                        if (indicators.length > 0) {
                            const circleY = pixelY + this.cellSize - 5;
                            const spacing = 4;
                            const totalWidth = (indicators.length - 1) * spacing;
                            let startX = pixelX + this.cellSize / 2 - totalWidth / 2;

                            indicators.forEach((color, index) => {
                                ctx.beginPath();
                                ctx.arc(startX + index * spacing, circleY, 1.5, 0, Math.PI * 2);
                                ctx.fillStyle = color;
                                ctx.fill();
                            });
                        }
                    }
                }
            }
        }

        // Render bombs on top of floor
        // Render bombs on top of floor
        this.bombs.forEach(bomb => {
            if (!this.cellData[bomb.y][bomb.x].hidden) {
                bomb.render(ctx, renderer, this.cellSize, offsetX, offsetY);
            }
        });

        // Render enemies
        this.enemies.forEach(enemy => {
            if (!this.cellData[enemy.y][enemy.x].hidden) {
                enemy.render(ctx, renderer, this.cellSize, offsetX, offsetY);
            }
        });

        // Render coins
        this.coins.forEach(coin => {
            if (!this.cellData[coin.y][coin.x].hidden) {
                coin.render(ctx, renderer, this.cellSize, offsetX, offsetY);
            }
        });
    }

    /**
     * Gets the cell type at a specific grid position
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @returns {number} Cell type (0-3)
     */
    getCellType(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return -1; // Out of bounds
        }
        return this.grid[y][x];
    }

    /**
     * Sets the cell type at a specific grid position
     * @param {number} x - Grid x coordinate
     * @param {number} y - Grid y coordinate
     * @param {number} type - Cell type to set
     */
    setCellType(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = type;
        }
    }

    /**
     * Reveals a cell at grid coordinates
     * @param {number} x 
     * @param {number} y 
     */
    revealCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height && this.cellData[y][x]) {
            this.cellData[y][x].hidden = false;
        }
    }
}
