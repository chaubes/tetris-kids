/**
 * PieceGenerator - Handles Tetris piece generation with random bag algorithm
 * Ensures fair distribution of pieces and manages piece rotation states
 */

import { PIECES, PIECE_TYPES, BOARD_CONFIG } from '../core/Constants.js';

export class PieceGenerator {
  constructor() {
    this.bag = [];
    this.nextBag = [];
    this.pieceHistory = [];

    // Initialize the first bag
    this.refillBag();
    this.refillNextBag();
  }

  /**
   * Generate a new random bag of all 7 piece types
   * Uses Fisher-Yates shuffle algorithm for true randomness
   */
  generateRandomBag() {
    const bag = [...PIECE_TYPES];

    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    return bag;
  }

  /**
   * Refill the current bag when empty
   */
  refillBag() {
    this.bag = this.generateRandomBag();
  }

  /**
   * Refill the next bag for lookahead
   */
  refillNextBag() {
    this.nextBag = this.generateRandomBag();
  }

  /**
   * Get the next piece from the bag
   * Implements the random bag system for fair piece distribution
   */
  getNextPiece() {
    // If current bag is empty, move next bag to current
    if (this.bag.length === 0) {
      this.bag = [...this.nextBag];
      this.refillNextBag();
    }

    // Get piece type from bag
    const pieceType = this.bag.shift();

    // Create piece instance
    const piece = this.createPiece(pieceType);

    // Add to history for debugging/statistics
    this.pieceHistory.push(pieceType);

    // Keep history size reasonable
    if (this.pieceHistory.length > 50) {
      this.pieceHistory.shift();
    }

    return piece;
  }

  /**
   * Preview next pieces (for UI display)
   * Returns array of next N piece types
   */
  previewNext(count = 3) {
    const preview = [];
    let bagCopy = [...this.bag];
    let nextBagCopy = [...this.nextBag];

    for (let i = 0; i < count; i++) {
      if (bagCopy.length === 0) {
        bagCopy = [...nextBagCopy];
        nextBagCopy = this.generateRandomBag();
      }

      const pieceType = bagCopy.shift();
      preview.push({
        type: pieceType,
        shape: PIECES[pieceType].shape,
        color: PIECES[pieceType].color,
        name: PIECES[pieceType].name,
      });
    }

    return preview;
  }

  /**
   * Create a piece instance with position and rotation state
   */
  createPiece(pieceType) {
    const pieceData = PIECES[pieceType];

    if (!pieceData) {
      throw new Error(`Unknown piece type: ${pieceType}`);
    }

    // Calculate starting position (center top)
    const startX = Math.floor((BOARD_CONFIG.WIDTH - pieceData.shape[0].length) / 2);
    const startY = 0;

    return {
      type: pieceType,
      shape: this.cloneMatrix(pieceData.shape),
      color: pieceData.color,
      name: pieceData.name,
      x: startX,
      y: startY,
      rotation: 0,
      lockTimer: 0,
      hasLanded: false,
    };
  }

  /**
   * Rotate a piece clockwise
   * Returns new piece state or null if rotation is not possible
   */
  rotatePiece(piece, clockwise = true) {
    const rotatedShape = this.rotateMatrix(piece.shape, clockwise);

    return {
      ...piece,
      shape: rotatedShape,
      rotation: clockwise ? (piece.rotation + 1) % 4 : (piece.rotation + 3) % 4,
    };
  }

  /**
   * Rotate a 2D matrix clockwise or counterclockwise
   */
  rotateMatrix(matrix, clockwise = true) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    if (clockwise) {
      // Clockwise rotation: transpose then reverse each row
      const transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
      return transposed.map(row => row.reverse());
    } else {
      // Counterclockwise: reverse each row then transpose
      const reversed = matrix.map(row => [...row].reverse());
      return reversed[0].map((_, colIndex) => reversed.map(row => row[colIndex]));
    }
  }

  /**
   * Get all possible rotation states for a piece type
   * Useful for collision detection and wall kicks
   */
  getAllRotations(pieceType) {
    const baseShape = PIECES[pieceType].shape;
    const rotations = [baseShape];
    let currentShape = baseShape;

    // Generate 3 additional rotations
    for (let i = 0; i < 3; i++) {
      currentShape = this.rotateMatrix(currentShape, true);
      rotations.push(this.cloneMatrix(currentShape));
    }

    return rotations;
  }

  /**
   * Get wall kick offsets for SRS (Super Rotation System)
   * Used for advanced rotation handling
   */
  getWallKickOffsets(pieceType, fromRotation, toRotation) {
    // Standard wall kick offsets for most pieces
    const standardOffsets = {
      '0->1': [
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ],
      '1->0': [
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ],
      '1->2': [
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ],
      '2->1': [
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ],
      '2->3': [
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ],
      '3->2': [
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ],
      '3->0': [
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ],
      '0->3': [
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ],
    };

    // I-piece has different wall kick offsets
    const iPieceOffsets = {
      '0->1': [
        [-2, 0],
        [1, 0],
        [-2, 1],
        [1, -2],
      ],
      '1->0': [
        [2, 0],
        [-1, 0],
        [2, -1],
        [-1, 2],
      ],
      '1->2': [
        [-1, 0],
        [2, 0],
        [-1, -2],
        [2, 1],
      ],
      '2->1': [
        [1, 0],
        [-2, 0],
        [1, 2],
        [-2, -1],
      ],
      '2->3': [
        [2, 0],
        [-1, 0],
        [2, -1],
        [-1, 2],
      ],
      '3->2': [
        [-2, 0],
        [1, 0],
        [-2, 1],
        [1, -2],
      ],
      '3->0': [
        [1, 0],
        [-2, 0],
        [1, 2],
        [-2, -1],
      ],
      '0->3': [
        [-1, 0],
        [2, 0],
        [-1, -2],
        [2, 1],
      ],
    };

    const offsetKey = `${fromRotation}->${toRotation}`;
    const offsets = pieceType === 'I' ? iPieceOffsets : standardOffsets;

    return offsets[offsetKey] || [[0, 0]]; // Default to no offset
  }

  /**
   * Get the bounding box of a piece shape
   */
  getPieceBounds(shape) {
    let minX = shape[0].length,
      maxX = -1;
    let minY = shape.length,
      maxY = -1;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Get all filled positions of a piece relative to its position
   */
  getPiecePositions(piece) {
    const positions = [];

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          positions.push({
            x: piece.x + x,
            y: piece.y + y,
            color: piece.color,
          });
        }
      }
    }

    return positions;
  }

  /**
   * Clone a 2D matrix (deep copy)
   */
  cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
  }

  /**
   * Get statistics about piece generation
   */
  getStats() {
    const stats = {};

    // Count frequency of each piece type
    PIECE_TYPES.forEach(type => {
      stats[type] = this.pieceHistory.filter(p => p === type).length;
    });

    return {
      totalPieces: this.pieceHistory.length,
      distribution: stats,
      currentBagSize: this.bag.length,
      nextBagSize: this.nextBag.length,
      recentPieces: this.pieceHistory.slice(-10),
    };
  }

  /**
   * Reset the piece generator
   */
  reset() {
    this.bag = [];
    this.nextBag = [];
    this.pieceHistory = [];

    this.refillBag();
    this.refillNextBag();
  }

  /**
   * Generate a specific piece (useful for testing)
   */
  generateSpecificPiece(pieceType) {
    if (!PIECES[pieceType]) {
      throw new Error(`Invalid piece type: ${pieceType}`);
    }

    return this.createPiece(pieceType);
  }
}
