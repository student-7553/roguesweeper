// Room class for dungeon generation
// Each room is a minesweeper-style grid with walls, entrance, and exit

import { SPRITES } from './rendering/spriteDefinitions.js';
import { Bomb } from './Bomb.js';
import { Enemy } from './Enemy.js';
import { Coin } from './Coin.js';
import { HorizontalChaseStrategy, VerticalChaseStrategy } from './ai/EnemyBehaviors.js';

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

        // Generate Inner Walls (Chunks)
        this.generateInnerWalls();

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
     * Generates inner wall chunks
     */
    generateInnerWalls() {
        // Configuration
        const wallPercentage = Math.random() * 0.15 + 0.25;
        const targetWallCells = Math.floor((this.width - 2) * (this.height - 2) * wallPercentage);

        let currentWallCells = 0;
        const attempts = 20; // Try to place chunks N times

        // Size constraints
        const minChunkSize = 2;
        const maxChunkSizeBase = 8;

        for (let i = 0; i < attempts; i++) {
            if (currentWallCells >= targetWallCells) break;

            // randomness decide how many wall chunks to spawn (implicit by loop and break)

            // Random center for the chunk - BIASED toward edges
            // Use a power function to bias toward edges (values near 0 and width/height)
            const biasToEdge = (val) => {
                // Push toward 0 or 1 (edges)
                return val < 0.5 ? val * val * 2 : 1 - (1 - val) * (1 - val) * 2;
            };

            const rx = biasToEdge(Math.random());
            const ry = biasToEdge(Math.random());
            const cx = Math.floor(rx * (this.width - 2)) + 1;
            const cy = Math.floor(ry * (this.height - 2)) + 1;

            // Calculate distance factor from center (0.0 at center, ~1.0 at corners)
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const dist = Math.sqrt(Math.pow(cx - centerX, 2) + Math.pow(cy - centerY, 2));
            const maxDist = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
            const distFactor = dist / maxDist; // 0 to 1

            // The closer the wall chunk is to the center the smaller it's size should be
            // Max allowed size scales with distance.
            // At center (dist=0), max is minChunkSize. At edge, max is maxChunkSizeBase.
            const allowedMaxSize = Math.floor(minChunkSize + (maxChunkSizeBase - minChunkSize) * distFactor);

            // Randomize size within limits
            const w = Math.floor(Math.random() * (allowedMaxSize - minChunkSize + 1)) + minChunkSize;
            const h = Math.floor(Math.random() * (allowedMaxSize - minChunkSize + 1)) + minChunkSize;

            const halfW = Math.floor(w / 2);
            const halfH = Math.floor(h / 2);

            // Define chunk bounds
            const x1 = cx - halfW;
            const x2 = cx + halfW;
            const y1 = cy - halfH;
            const y2 = cy + halfH;

            // Store verify backup
            const changes = [];

            // Apply walls
            let validPlacement = true;

            // Check Entrance/Exit Proximity (Radius 3 safe zone)
            const safeDist = 3;
            if (Math.abs(cx - this.entrancePos.x) < safeDist && Math.abs(cy - this.entrancePos.y) < safeDist) validPlacement = false;
            if (Math.abs(cx - this.exitPos.x) < safeDist && Math.abs(cy - this.exitPos.y) < safeDist) validPlacement = false;

            if (validPlacement) {
                for (let y = y1; y <= y2; y++) {
                    for (let x = x1; x <= x2; x++) {
                        // Check bounds - only exclude the actual perimeter walls (row/col 0 and max)
                        // Allow inner walls to connect to border. Path check ensures connectivity.
                        if (x >= 1 && x <= this.width - 2 && y >= 1 && y <= this.height - 2) {
                            if (this.grid[y][x] === 0) {
                                this.grid[y][x] = 1;
                                this.cellData[y][x].hidden = false; // Walls should be visible
                                changes.push({ x, y });
                            }
                        }
                    }
                }

                // Ensure that on generating walls the player still has a valid path to the exit
                // AND no islands are created (all floor tiles reachable)
                if (changes.length > 0) {
                    if (!this.hasPath(this.entrancePos, this.exitPos) || !this.hasNoIslands()) {
                        // Revert if path blocked or islands created
                        changes.forEach(c => {
                            this.grid[c.y][c.x] = 0;
                            this.cellData[c.y][c.x].hidden = true; // Restore hidden state
                        });
                        validPlacement = false;
                    } else {
                        currentWallCells += changes.length;
                    }
                }
            }
        }
    }

    /**
     * Generates bombs using Anti-Void strategy:
     * 1. Place initial random bombs.
     * 2. Identify and break large empty spaces (voids) by adding more bombs.
     * 3. Ensure a valid path exists from Entrance to Exit (carve path if needed).
     */
    generateBombs() {
        // 1. Initial Scatter (Place ~80% of desired bombs randomly first)
        const initialCount = Math.floor(this.bombCount * 0.8);
        this.placeRandomBombs(initialCount);

        // 2. Break Voids
        // We need to calculate hints temporarily to find "0" clusters
        this.calculateHints();
        this.breakLargeVoids();

        // 3. Fill remaining quota if needed (randomly)
        const remaining = this.bombCount - this.bombs.length;
        if (remaining > 0) {
            this.placeRandomBombs(remaining);
        }

        // 4. Ensure Solvability
        this.ensureSolvable();
    }

    /**
     * Places N random bombs
     */
    placeRandomBombs(count) {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = count * 50;

        while (placed < count && attempts < maxAttempts) {
            attempts++;
            const x = Math.floor(Math.random() * (this.width - 2)) + 1;
            const y = Math.floor(Math.random() * (this.height - 2)) + 1;

            if (this.isValidEntityPosition(x, y)) {
                // Temporarily place bomb
                const bomb = new Bomb(x, y);
                this.bombs.push(bomb);

                // Check if this creates an island (unreachable floor tiles considering bombs)
                if (!this.hasNoIslandsWithBombs()) {
                    // Rollback
                    this.bombs.pop();
                } else {
                    placed++;
                }
            }
        }
    }

    /**
     * Checks for islands considering bombs as blocking.
     * Returns true if all non-bomb floor tiles are reachable from entrance.
     */
    hasNoIslandsWithBombs() {
        const visited = new Set();
        const queue = [this.entrancePos];
        visited.add(`${this.entrancePos.x},${this.entrancePos.y}`);

        while (queue.length > 0) {
            const curr = queue.shift();
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height &&
                    this.grid[ny][nx] === 0 && !visited.has(key) &&
                    !this.bombs.some(b => b.x === nx && b.y === ny)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Count all floor cells that don't have bombs
        let totalAccessibleFloorCells = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0 && !this.bombs.some(b => b.x === x && b.y === y)) {
                    totalAccessibleFloorCells++;
                }
            }
        }

        return visited.size === totalAccessibleFloorCells;
    }

    /**
     * Finds large connected areas of 0-hint tiles and places a bomb in them
     */
    breakLargeVoids() {
        const visited = new Set();
        const clusters = [];

        // Find clusters
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.cellData[y][x].hint === 0 && !this.hasEntityAt(x, y) && this.grid[y][x] === 0) {
                    const key = `${x},${y}`;
                    if (!visited.has(key)) {
                        const cluster = this.getCluster(x, y, visited);
                        clusters.push(cluster);
                    }
                }
            }
        }

        // Break clusters larger than threshold
        const SIZE_THRESHOLD = 4; // Arbitrary size for "too big"

        clusters.forEach(cluster => {
            if (cluster.length > SIZE_THRESHOLD) {
                // Pick a spot in the middle-ish (or random) to place a bomb
                // Try to find a spot that doesn't block critical things? 
                // Just random is fine, we fix solvability later.
                const target = cluster[Math.floor(cluster.length / 2)];

                // Verify it's still valid (in case overlapping? shouldn't happen with 0 hints but safe to check)
                if (this.isValidEntityPosition(target.x, target.y)) {
                    this.bombs.push(new Bomb(target.x, target.y));
                }
            }
        });

        // Recalculate hints after adding void-breaking bombs
        this.calculateHints();
    }

    /**
     * BFS to find connected component of 0-hint tiles
     */
    getCluster(startX, startY, visited) {
        const cluster = [];
        const queue = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);
        cluster.push({ x: startX, y: startY });

        while (queue.length > 0) {
            const curr = queue.shift();

            // Check neighbors
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;

                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                    const key = `${nx},${ny}`;
                    if (!visited.has(key)) {
                        const cell = this.cellData[ny][nx];
                        // If it's a 0-hint floor tile with no entity
                        if (cell.hint === 0 && !this.hasEntityAt(nx, ny) && this.grid[ny][nx] === 0) {
                            visited.add(key);
                            cluster.push({ x: nx, y: ny });
                            queue.push({ x: nx, y: ny });
                        }
                    }
                }
            }
        }
        return cluster;
    }

    /**
     * Checks if path exists from Entrance to Exit. If not, removes bombs along a shortest path.
     */
    ensureSolvable() {
        const start = this.entrancePos;
        const end = this.exitPos;

        // Simple BFS to check existence
        if (this.hasPath(start, end)) return;

        console.log("Room blocked, carving path...");

        // If no path, find shortest path IGNORING bombs (but respecting walls)
        // and remove any bombs on that path.
        const path = this.findPathIdeally(start, end);

        if (path) {
            path.forEach(pos => {
                // If there is a bomb here, remove it
                const bombIndex = this.bombs.findIndex(b => b.x === pos.x && b.y === pos.y);
                if (bombIndex !== -1) {
                    this.bombs.splice(bombIndex, 1);
                }
            });
            // Recalculate hints after carving
            this.calculateHints();
        } else {
            // Should not happen unless walls block everything (unlikely with just border walls)
            console.error("Critical: Cannot generate solvable path even ignoring bombs.");
        }
    }

    hasPath(start, end) {
        const queue = [start];
        const visited = new Set([`${start.x},${start.y}`]);

        while (queue.length > 0) {
            const curr = queue.shift();
            if (curr.x === end.x && curr.y === end.y) return true;

            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;

                // Check bounds and walls
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && this.grid[ny][nx] !== 1) {
                    // Check entities (Bombs block path)
                    // Note: In Minesweeper, you theoretically can't step on a bomb.
                    // But here we are checking if a SAFE path exists.
                    // So we treat bombs as walls.
                    if (!this.hasEntityAt(nx, ny)) {
                        const key = `${nx},${ny}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push({ x: nx, y: ny });
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Checks if there are any unreachable floor tiles (islands).
     * Returns true if ALL floor tiles are reachable from entrance.
     */
    hasNoIslands() {
        // BFS from entrance, count all reachable floor cells (ignoring entities for this check)
        const visited = new Set();
        const queue = [this.entrancePos];
        visited.add(`${this.entrancePos.x},${this.entrancePos.y}`);

        while (queue.length > 0) {
            const curr = queue.shift();
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height &&
                    this.grid[ny][nx] === 0 && !visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Count all floor cells in grid
        let totalFloorCells = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0) totalFloorCells++;
            }
        }

        return visited.size === totalFloorCells;
    }

    /**
     * BFS to find path ignoring entities (only walls block)
     */
    findPathIdeally(start, end) {
        const queue = [[start]]; // Queue of paths
        const visited = new Set([`${start.x},${start.y}`]);

        while (queue.length > 0) {
            const path = queue.shift();
            const curr = path[path.length - 1];

            if (curr.x === end.x && curr.y === end.y) return path;

            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]; // Diagonals allowed for carving?
            // Actually player only moves cardinal (WASD). So keep cardinal.
            const cardinalDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

            for (const [dx, dy] of cardinalDirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && this.grid[ny][nx] !== 1) {
                    const key = `${nx},${ny}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        const newPath = [...path, { x: nx, y: ny }];
                        queue.push(newPath);
                    }
                }
            }
        }
        return null;
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
                // Randomly select strategy and sprite
                const isVertical = Math.random() < 0.5;
                const behavior = isVertical ? new VerticalChaseStrategy() : new HorizontalChaseStrategy();
                const sprite = isVertical ? SPRITES.ENEMY_2 : SPRITES.ENEMY;

                this.enemies.push(new Enemy(x, y, behavior, sprite));
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
     * Updates all enemies (AI turn)
     * @param {Object} player - The player object
     */
    updateEnemies(player) {
        let anyEnemyMoved = false;

        // Create a copy of the array because enemies might be removed during iteration (suicide attack)
        // If an enemy attacks, it calls removeEntity, which modifies the array.
        // We iterate backward to handle removal safely, or use a copy.
        // A copy is safer for logic flow.
        const enemies = [...this.enemies];

        for (const enemy of enemies) {
            // Check if enemy is still in the room (might have been removed if another enemy exploded it? Unlikely currently)
            // But good to check if it's still in the main list
            if (this.enemies.includes(enemy)) {
                if (enemy.takeTurn(player, this)) {
                    anyEnemyMoved = true;
                }
            }
        }

        if (anyEnemyMoved) {
            this.calculateHints();
        }
    }

    /**
     * Gets the entity at a specific position
     * @param {number} x
     * @param {number} y
     * @returns {Object|null} The entity (Bomb, Enemy, Coin) or null
     */
    getEntityAt(x, y) {
        const bomb = this.bombs.find(b => b.x === x && b.y === y);
        if (bomb) return { type: 'bomb', entity: bomb };

        const enemy = this.enemies.find(e => e.x === x && e.y === y);
        if (enemy) return { type: 'enemy', entity: enemy };

        const coin = this.coins.find(c => c.x === x && c.y === y);
        if (coin) return { type: 'coin', entity: coin };

        return null;
    }

    /**
     * Removes an entity from the room and updates hints
     * @param {Object} entityObj - The entity object wrapper returned by getEntityAt
     */
    removeEntity(entityObj) {
        if (!entityObj) return;

        const { type, entity } = entityObj;

        if (type === 'bomb') {
            const index = this.bombs.indexOf(entity);
            if (index > -1) this.bombs.splice(index, 1);
        } else if (type === 'enemy') {
            const index = this.enemies.indexOf(entity);
            if (index > -1) this.enemies.splice(index, 1);
        } else if (type === 'coin') {
            const index = this.coins.indexOf(entity);
            if (index > -1) this.coins.splice(index, 1);
        }

        // Recalculate hints immediately to reflect the change
        this.calculateHints();
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
                        // Optimization: Don't render "buried" walls (surrounded by 8 walls)
                        // Check 8 neighbors
                        let allWalls = true;

                        // Optimization: if we are at the very edge of the rendering loop, 
                        // neighbors might be out of bounds. The prompt says "Assume out of bounds to also be wall cells".

                        checkNeighbors:
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = x + dx;
                                const ny = y + dy;

                                // Get cell type. Out of bounds (-1) counts as wall (1 for our purposes here is effectively blocking)
                                // or strictly, we can assume out of bounds is VALID wall context.
                                let nType = 1; // Default to wall if out of bounds
                                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                                    nType = this.grid[ny][nx];
                                }

                                if (nType !== 1) {
                                    allWalls = false;
                                    break checkNeighbors;
                                }
                            }
                        }

                        if (!allWalls) {
                            sprite = SPRITES.WALL;
                        }
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
     * Checks if a move is valid for the player
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isValidMove(x, y) {
        // Check bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }

        // Check walls (1 is wall)
        if (this.grid[y][x] === 1) {
            return false;
        }

        return true;
    }

    /**
     * Handles logic when player enters a tile
     * @param {number} x 
     * @param {number} y 
     */
    onPlayerEnter(x, y) {
        // Safe check for bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        // Check if the tile was hidden
        const wasHidden = this.cellData[y][x].hidden;

        // Reveal the current tile
        this.revealCell(x, y);

        // If it was already revealed, we don't need to do anything else (no flood fill re-trigger)
        if (!wasHidden) return;

        // Check if player is on entrance or exit
        const isEntrance = this.entrancePos && x === this.entrancePos.x && y === this.entrancePos.y;
        const isExit = this.exitPos && x === this.exitPos.x && y === this.exitPos.y;

        // Skip flood fill if on entrance or exit
        if (isEntrance || isExit) return;

        // Check if we should flood fill
        const cellData = this.cellData[y][x];

        // If tile is empty (hint 0) and has no entities, flood fill
        if (cellData.hint === 0 && !this.hasEntityAt(x, y) && this.grid[y][x] !== 1) {
            this.floodFillUnhide(x, y);
        }
    }

    /**
     * Recursively unhides tiles starting from x, y
     * @param {number} x 
     * @param {number} y 
     * @param {Set<string>} visited - To keep track of visited cells in this recursion
     */
    floodFillUnhide(x, y, visited = new Set()) {
        const key = `${x},${y}`;
        if (visited.has(key)) return;
        visited.add(key);

        // Reveal this cell
        this.revealCell(x, y);

        // If this cell has a hint > 0, we stop recursing (but we still revealed it above)
        // Also stop if it's a wall or entity (though revealCell handles validity)
        if (this.cellData[y][x].hint > 0 || this.hasEntityAt(x, y) || this.grid[y][x] === 1) {
            return;
        }

        // Check cardinal neighbors (full recursion)
        const cardinalDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of cardinalDirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                // We only recursively call if the CURRENT cell was a 0.
                // The stopping condition is handled at the start of the next call or after revealing.
                this.floodFillUnhide(nx, ny, visited);
            }
        }

        // Check diagonal neighbors (only reveal if they have hint > 0)
        const diagonalDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of diagonalDirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const diagonalCell = this.cellData[ny][nx];
                // Only reveal diagonal tiles if they have a hint > 0 (do not recurse into them)
                if (diagonalCell && diagonalCell.hint > 0 && !visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    this.revealCell(nx, ny);
                }
            }
        }
    }

    /**
     * Checks if a cell is hidden
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isHidden(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height && this.cellData[y][x]) {
            return this.cellData[y][x].hidden;
        }
        return false;
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
