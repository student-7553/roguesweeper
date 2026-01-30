// Room class for dungeon generation
// Each room is a minesweeper-style grid with walls, entrance, and exit

import { SPRITES } from './rendering/spriteDefinitions.js';

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
     */
    constructor(width, height, cellSize, entranceSide) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.entranceSide = entranceSide;

        // Initialize the grid (0 = floor/empty cell, 1 = wall)
        // Entrance and exit are treated as floor cells, tracked separately
        this.grid = [];

        // Store which floor sprite variant to use for each cell (0-5 for 6 different sprites)
        this.floorVariants = [];

        // Store entrance and exit positions
        this.entrancePos = null;
        this.exitPos = null;

        // Generate the room
        this.generate();
    }

    /**
     * Generates the room layout
     */
    generate() {
        // Initialize grid with empty cells and randomly assign floor variants
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.floorVariants[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 0; // Floor cell
                // Randomly choose between 6 floor sprite variants (0-5)
                this.floorVariants[y][x] = Math.floor(Math.random() * 6);
            }
        }

        // Place walls around the perimeter
        this.placeWalls();

        // Place entrance
        this.placeEntrance();

        // Place exit (on a different side, avoiding the same half)
        this.placeExit();
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
                const cellType = this.grid[y][x];
                const pixelX = offsetX + x * this.cellSize;
                const pixelY = offsetY + y * this.cellSize;
                const scale = this.cellSize / 10; // Assuming 10x10 pixel sprites

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
            }
        }
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
}
