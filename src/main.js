// Main entry point - minimal startup code
import { initGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to maximum square that fits in viewport
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth, window.innerHeight) - 20; // 20px margin
    canvas.width = maxSize;
    canvas.height = maxSize;

    // Re-apply image smoothing setting after resize
    ctx.imageSmoothingEnabled = false;
}

// Initial size
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

// Initialize and start the game
initGame(canvas, ctx);
