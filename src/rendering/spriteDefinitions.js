// Centralized sprite definitions
// Each sprite is defined by its position in the sprite sheet (row, col) and which sheet it's from
// Sprite sheet uses 10x10 pixel sprites

export const SPRITES = {
    // Example sprite definitions - update these based on your actual sprite sheet layout
    // Format: { sheet: 'sheet_name', row: number, col: number }
    FLAG: { sheet: 'sheet_1', row: 24, col: 20 },

    // Room tile sprites
    FLOOR_1: { sheet: 'sheet_1', row: 30, col: 13 },    // Floor tile variant 1
    FLOOR_2: { sheet: 'sheet_1', row: 30, col: 14 },    // Floor tile variant 2
    FLOOR_3: { sheet: 'sheet_1', row: 30, col: 15 },    // Floor tile variant 3
    FLOOR_4: { sheet: 'sheet_1', row: 30, col: 16 },    // Floor tile variant 4
    FLOOR_5: { sheet: 'sheet_1', row: 32, col: 13 },    // Floor tile variant 5
    FLOOR_6: { sheet: 'sheet_1', row: 32, col: 14 },    // Floor tile variant 6
    WALL: { sheet: 'sheet_1', row: 7, col: 14 },        // Wall tile
    BOMB: { sheet: 'sheet_1', row: 26, col: 21 },       // Bomb entity
    ENEMY: { sheet: 'sheet_1', row: 19, col: 31 },      // Enemy entity
    ENEMY_2: { sheet: 'sheet_1', row: 21, col: 31 },    // Enemy entity variant 2
    COIN: { sheet: 'sheet_1', row: 41, col: 31 },       // Coin entity
    PLAYER: { sheet: 'sheet_1', row: 10, col: 3 },     // Player entity (Best guess: near enemies/items)

    // Hidden tile sprites
    HIDDEN_1: { sheet: 'sheet_1', row: 38, col: 15 },
    HIDDEN_2: { sheet: 'sheet_1', row: 37, col: 13 },

    // Add more sprite definitions as needed
    // Example from a different sheet:
    // UI_BUTTON: { sheet: 'ui_sheet', row: 0, col: 0 },
};
