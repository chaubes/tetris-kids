/**
 * Basic smoke tests for the Tetris game using Node.js
 * Tests core functionality without requiring browsers
 */

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

// Test Constants
import { PIECES, GAME_STATES, COLORS } from '../src/core/Constants.js';

// Test Game Logic
import { GameLogic } from '../src/game/GameLogic.js';
import { PieceGenerator } from '../src/game/PieceGenerator.js';
import { CollisionDetector } from '../src/game/CollisionDetector.js';
import { ScoreManager } from '../src/game/ScoreManager.js';

console.log('🧪 Running smoke tests for Tetris Kids...\n');

let passedTests = 0;
let failedTests = 0;

async function test(name, testFn) {
  try {
    await testFn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

async function runTests() {
  // Test Constants
  await test('Constants are properly defined', () => {
    if (!PIECES || Object.keys(PIECES).length !== 7) {
      throw new Error('PIECES should contain 7 tetris pieces');
    }
    
    if (!GAME_STATES || !GAME_STATES.PLAYING) {
      throw new Error('GAME_STATES should be properly defined');
    }
    
    if (!COLORS || Object.keys(COLORS).length === 0) {
      throw new Error('COLORS should be defined');
    }
  });

  // Test PieceGenerator
  await test('PieceGenerator creates valid pieces', () => {
    const generator = new PieceGenerator();
    const piece = generator.getNextPiece();
    
    if (!piece || !piece.type || !piece.shape || piece.x === undefined || piece.y === undefined) {
      throw new Error('Generated piece should have type, shape, x, and y properties');
    }
    
    if (!PIECES[piece.type]) {
      throw new Error(`Generated piece type ${piece.type} should exist in PIECES`);
    }
  });

  await test('PieceGenerator bag system works', () => {
    const generator = new PieceGenerator();
    const pieces = [];
    
    // Generate 7 pieces (one bag)
    for (let i = 0; i < 7; i++) {
      pieces.push(generator.getNextPiece().type);
    }
    
    // Should have all 7 different pieces
    const uniquePieces = new Set(pieces);
    if (uniquePieces.size !== 7) {
      throw new Error('Bag system should generate all 7 pieces in one bag');
    }
  });

  // Test CollisionDetector
  await test('CollisionDetector detects wall collisions', () => {
    const detector = new CollisionDetector();
    const board = Array(20).fill(null).map(() => Array(10).fill(0));
    
    // Test piece at left wall
    const leftPiece = { x: -1, y: 0, shape: [[1, 1], [1, 1]] };
    if (detector.isValidPosition(leftPiece, board)) {
      throw new Error('Should detect left wall collision');
    }
    
    // Test piece at right wall
    const rightPiece = { x: 9, y: 0, shape: [[1, 1], [1, 1]] };
    if (detector.isValidPosition(rightPiece, board)) {
      throw new Error('Should detect right wall collision');
    }
    
    // Test valid position
    const validPiece = { x: 4, y: 0, shape: [[1, 1], [1, 1]] };
    if (!detector.isValidPosition(validPiece, board)) {
      throw new Error('Should not detect collision for valid position');
    }
  });

  // Test GameLogic
  await test('GameLogic initializes properly', () => {
    const gameLogic = new GameLogic();
    
    if (!gameLogic.board || gameLogic.board.length !== 20) {
      throw new Error('Game board should be 20 rows tall');
    }
    
    if (!gameLogic.board[0] || gameLogic.board[0].length !== 10) {
      throw new Error('Game board should be 10 columns wide');
    }
    
    // GameLogic doesn't auto-initialize currentPiece - need to call reset()
    gameLogic.reset();
    if (!gameLogic.currentPiece) {
      throw new Error('Should have a current piece after reset');
    }
  });

  await test('GameLogic can move pieces', () => {
    const gameLogic = new GameLogic();
    gameLogic.reset(); // Initialize the game state
    const initialX = gameLogic.currentPiece.x;
    
    // Try to move left
    const moved = gameLogic.movePiece('left');
    
    if (!moved || gameLogic.currentPiece.x !== initialX - 1) {
      throw new Error('Piece should move left');
    }
  });

  await test('GameLogic detects full lines', () => {
    const gameLogic = new GameLogic();
    
    // Fill bottom row
    for (let col = 0; col < 10; col++) {
      gameLogic.board[19][col] = 1;
    }
    
    // Use CollisionDetector's method to check full lines
    const fullLines = gameLogic.collisionDetector.getFullLines(gameLogic.board);
    if (!fullLines.includes(19)) {
      throw new Error('Should detect full line at bottom row');
    }
  });

  // Test ScoreManager
  await test('ScoreManager calculates scores correctly', () => {
    const scoreManager = new ScoreManager();
    const initialScore = scoreManager.score;
    
    // Update score for single line clear
    scoreManager.updateScore('single', 1);
    
    if (scoreManager.score <= initialScore) {
      throw new Error('Score should increase after clearing lines');
    }
  });

  await test('ScoreManager handles level progression', () => {
    const scoreManager = new ScoreManager();
    const initialLevel = scoreManager.level;
    
    // Simulate clearing enough lines for level up (10 lines per level)
    for (let i = 0; i < 10; i++) {
      scoreManager.updateScore('single', 1);
    }
    
    if (scoreManager.level <= initialLevel) {
      throw new Error('Level should increase after clearing enough lines');
    }
  });

  // Test audio-related issues
  await test('Audio constants are defined', async () => {
    const { SOUNDS } = await import('../src/core/Constants.js');
    
    if (!SOUNDS || typeof SOUNDS !== 'object') {
      throw new Error('SOUNDS should be defined as an object in constants');
    }
    
    // Check for basic sound properties
    if (!SOUNDS.MOVE || !SOUNDS.ROTATE || !SOUNDS.LINE_CLEAR) {
      throw new Error('Basic game sounds should be defined in SOUNDS');
    }
  });

  console.log('\n🧪 Smoke Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 All smoke tests passed! Core game logic is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);