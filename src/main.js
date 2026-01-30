// Main entry point - minimal startup code
import { initGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Disable image smoothing for crisp pixel art scaling
ctx.imageSmoothingEnabled = false;

// Initialize and start the game
initGame(canvas, ctx);
