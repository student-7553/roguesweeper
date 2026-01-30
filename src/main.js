// Main entry point - minimal startup code
import { initGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Initialize and start the game
initGame(canvas, ctx);
