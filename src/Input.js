export class Input {
    constructor() {
        this.keys = {}; // Track current state of keys (true = down, false = up)
        this.prevKeys = {}; // Track state of keys in previous frame (for just pressed logic)

        // Bind event listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    /**
     * Updates key states. Should be called at the end of the game loop update.
     * This is necessary to track "just pressed" states.
     */
    update() {
        // Copy current key state to previous key state
        this.prevKeys = { ...this.keys };
    }

    /**
     * Checks if a key is currently held down
     * @param {string} keyCode 
     * @returns {boolean}
     */
    isDown(keyCode) {
        return !!this.keys[keyCode];
    }

    /**
     * Checks if a key was just pressed this frame (not held)
     * @param {string} keyCode 
     * @returns {boolean}
     */
    isJustPressed(keyCode) {
        return !!this.keys[keyCode] && !this.prevKeys[keyCode];
    }
}
