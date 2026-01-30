// SpriteSheet class - manages loading and storing sprite sheet images

export class SpriteSheet {
    constructor(imagePath, spriteWidth = 10, spriteHeight = 10, onLoadCallback = null) {
        this.imagePath = imagePath;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.image = new Image();
        this.loaded = false;
        this.error = null;

        // Set up load handlers
        this.image.onload = () => {
            this.loaded = true;
            console.log(`Sprite sheet loaded: ${imagePath}`);
            if (onLoadCallback) {
                onLoadCallback();
            }
        };

        this.image.onerror = (err) => {
            this.error = `Failed to load sprite sheet: ${imagePath}`;
            console.error(this.error, err);
        };

        // Start loading the image
        this.image.src = imagePath;
    }

    /**
     * Check if the sprite sheet is ready to use
     * @returns {boolean}
     */
    isReady() {
        return this.loaded && !this.error;
    }

    /**
     * Get the underlying image element
     * @returns {HTMLImageElement}
     */
    getImage() {
        return this.image;
    }

    /**
     * Get sprite dimensions
     * @returns {{width: number, height: number}}
     */
    getSpriteDimensions() {
        return {
            width: this.spriteWidth,
            height: this.spriteHeight
        };
    }

    /**
     * Calculate the number of columns in the sprite sheet
     * @returns {number}
     */
    getColumns() {
        if (!this.loaded) return 0;
        return Math.floor(this.image.width / this.spriteWidth);
    }

    /**
     * Calculate the number of rows in the sprite sheet
     * @returns {number}
     */
    getRows() {
        if (!this.loaded) return 0;
        return Math.floor(this.image.height / this.spriteHeight);
    }
}
