/**
 * CollisionDetector - Handles all collision detection in the Tetris game
 * Includes wall/floor collisions, piece-to-piece collisions, and rotation validation
 */

import { BOARD_CONFIG, FEATURES } from '../core/Constants.js';

export class CollisionDetector {
  constructor() {
    this.boardWidth = BOARD_CONFIG.WIDTH;
    this.boardHeight = BOARD_CONFIG.HEIGHT;
  }

  /**
   * Check if a piece position is valid (no collisions)
   * @param {Object} piece - The piece to check
   * @param {Array} board - The game board (2D array)
   * @param {number} offsetX - X offset to check (default: 0)
   * @param {number} offsetY - Y offset to check (default: 0)
   * @returns {boolean} - True if position is valid, false if collision
   */
  isValidPosition(piece, board, offsetX = 0, offsetY = 0) {
    const testX = piece.x + offsetX;
    const testY = piece.y + offsetY;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = testX + x;
          const boardY = testY + y;

          // Check wall collisions (left and right boundaries)
          if (boardX < 0 || boardX >= this.boardWidth) {
            return false;
          }

          // Check floor collision (bottom boundary)
          if (boardY >= this.boardHeight) {
            return false;
          }

          // Check ceiling collision (for newly spawned pieces)
          if (boardY < 0) {
            // Allow pieces to start above the board, but check for immediate game over
            continue;
          }

          // Check piece-to-piece collision
          if (board[boardY] && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if piece can move in a specific direction
   * @param {Object} piece - The piece to check
   * @param {Array} board - The game board
   * @param {string} direction - 'left', 'right', or 'down'
   * @returns {boolean} - True if move is possible
   */
  canMove(piece, board, direction) {
    const offsets = {
      left: [-1, 0],
      right: [1, 0],
      down: [0, 1],
    };

    const [offsetX, offsetY] = offsets[direction] || [0, 0];
    return this.isValidPosition(piece, board, offsetX, offsetY);
  }

  /**
   * Check if piece can rotate
   * Includes wall kick system for enhanced gameplay
   * @param {Object} piece - The piece to check
   * @param {Array} board - The game board
   * @param {Object} rotatedPiece - The rotated piece shape
   * @param {Object} pieceGenerator - Reference to piece generator for wall kicks
   * @returns {Object|null} - Valid piece position or null if rotation impossible
   */
  canRotate(piece, board, rotatedPiece, pieceGenerator) {
    // First try rotation at current position
    if (this.isValidPosition(rotatedPiece, board)) {
      return { ...rotatedPiece };
    }

    // If basic rotation fails and wall kicks are enabled, try wall kicks
    if (FEATURES.WALL_KICKS && pieceGenerator) {
      const wallKickOffsets = pieceGenerator.getWallKickOffsets(
        piece.type,
        piece.rotation,
        rotatedPiece.rotation,
      );

      // Try each wall kick offset
      for (const [offsetX, offsetY] of wallKickOffsets) {
        const testPiece = {
          ...rotatedPiece,
          x: rotatedPiece.x + offsetX,
          y: rotatedPiece.y + offsetY,
        };

        if (this.isValidPosition(testPiece, board)) {
          return testPiece;
        }
      }
    }

    return null; // Rotation not possible
  }

  /**
   * Check if the piece is touching the ground or another piece below
   * @param {Object} piece - The piece to check
   * @param {Array} board - The game board
   * @returns {boolean} - True if piece has landed
   */
  hasLanded(piece, board) {
    return !this.canMove(piece, board, 'down');
  }

  /**
   * Get the "ghost piece" position (where the piece would land)
   * @param {Object} piece - The falling piece
   * @param {Array} board - The game board
   * @returns {Object} - Ghost piece with final position
   */
  getGhostPiece(piece, board) {
    const ghostPiece = { ...piece };

    // Drop the ghost piece as far as possible
    while (this.isValidPosition(ghostPiece, board, 0, 1)) {
      ghostPiece.y++;
    }

    return ghostPiece;
  }

  /**
   * Get hard drop distance
   * @param {Object} piece - The falling piece
   * @param {Array} board - The game board
   * @returns {number} - Number of rows the piece can drop
   */
  getHardDropDistance(piece, board) {
    let distance = 0;

    while (this.isValidPosition(piece, board, 0, distance + 1)) {
      distance++;
    }

    return distance;
  }

  /**
   * Check for T-Spin conditions (advanced feature)
   * @param {Object} piece - The T-piece that was just placed
   * @param {Array} board - The game board
   * @param {boolean} wasRotation - Whether the last move was a rotation
   * @returns {Object} - T-Spin detection result
   */
  checkTSpin(piece, board, wasRotation) {
    // Only check for T-pieces
    if (piece.type !== 'T' || !wasRotation) {
      return { isTSpin: false };
    }

    // Get the T-piece center position
    const centerX = piece.x + 1;
    const centerY = piece.y + 1;

    // Check corners around the T-piece center
    const corners = [
      { x: centerX - 1, y: centerY - 1 }, // Top-left
      { x: centerX + 1, y: centerY - 1 }, // Top-right
      { x: centerX - 1, y: centerY + 1 }, // Bottom-left
      { x: centerX + 1, y: centerY + 1 }, // Bottom-right
    ];

    let occupiedCorners = 0;
    let frontCorners = 0;

    corners.forEach((corner, index) => {
      const isOccupied =
        corner.x < 0 ||
        corner.x >= this.boardWidth ||
        corner.y >= this.boardHeight ||
        (corner.y >= 0 && board[corner.y] && board[corner.y][corner.x]);

      if (isOccupied) {
        occupiedCorners++;

        // Front corners depend on piece rotation
        const isFrontCorner = this.isFrontCorner(piece.rotation, index);
        if (isFrontCorner) {
          frontCorners++;
        }
      }
    });

    const isTSpin = occupiedCorners >= 3 && frontCorners >= 2;

    return {
      isTSpin,
      occupiedCorners,
      frontCorners,
      type: isTSpin ? (occupiedCorners === 4 ? 'T-Spin' : 'T-Spin Mini') : null,
    };
  }

  /**
   * Helper function to determine if a corner is a "front corner" for T-Spin detection
   * @param {number} rotation - Current piece rotation (0-3)
   * @param {number} cornerIndex - Corner index (0-3)
   * @returns {boolean} - True if this is a front corner
   */
  isFrontCorner(rotation, cornerIndex) {
    const frontCorners = [
      [0, 1], // Rotation 0: top-left, top-right
      [1, 3], // Rotation 1: top-right, bottom-right
      [2, 3], // Rotation 2: bottom-left, bottom-right
      [0, 2], // Rotation 3: top-left, bottom-left
    ];

    return frontCorners[rotation].includes(cornerIndex);
  }

  /**
   * Check if the game is over (new piece cannot be placed)
   * @param {Object} piece - The new piece to place
   * @param {Array} board - The game board
   * @returns {boolean} - True if game over
   */
  isGameOver(piece, board) {
    // Check if the piece can be placed at its spawn position
    return !this.isValidPosition(piece, board);
  }

  /**
   * Get all collision points for debugging
   * @param {Object} piece - The piece to check
   * @param {Array} board - The game board
   * @param {number} offsetX - X offset
   * @param {number} offsetY - Y offset
   * @returns {Array} - Array of collision points
   */
  getCollisionPoints(piece, board, offsetX = 0, offsetY = 0) {
    const collisions = [];
    const testX = piece.x + offsetX;
    const testY = piece.y + offsetY;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = testX + x;
          const boardY = testY + y;

          let collisionType = null;

          if (boardX < 0) collisionType = 'leftWall';
          else if (boardX >= this.boardWidth) collisionType = 'rightWall';
          else if (boardY >= this.boardHeight) collisionType = 'floor';
          else if (boardY >= 0 && board[boardY] && board[boardY][boardX]) collisionType = 'piece';

          if (collisionType) {
            collisions.push({
              x: boardX,
              y: boardY,
              type: collisionType,
              pieceX: x,
              pieceY: y,
            });
          }
        }
      }
    }

    return collisions;
  }

  /**
   * Check if a position is within board boundaries
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} - True if within bounds
   */
  isWithinBounds(x, y) {
    return x >= 0 && x < this.boardWidth && y >= 0 && y < this.boardHeight;
  }

  /**
   * Check line collision for clearing detection
   * @param {Array} board - The game board
   * @param {number} lineY - Y coordinate of the line to check
   * @returns {boolean} - True if line is full
   */
  isLineFull(board, lineY) {
    if (lineY < 0 || lineY >= this.boardHeight) {
      return false;
    }

    return board[lineY].every(cell => cell !== 0);
  }

  /**
   * Get all full lines on the board
   * @param {Array} board - The game board
   * @returns {Array} - Array of full line indices
   */
  getFullLines(board) {
    const fullLines = [];

    for (let y = 0; y < this.boardHeight; y++) {
      if (this.isLineFull(board, y)) {
        fullLines.push(y);
      }
    }

    return fullLines;
  }

  /**
   * Advanced collision detection for complex scenarios
   * Useful for future features like multi-piece collision
   * @param {Array} pieces - Array of pieces to check
   * @param {Array} board - The game board
   * @returns {Object} - Detailed collision information
   */
  detectComplexCollisions(pieces, board) {
    const results = {
      hasCollision: false,
      collisionPairs: [],
      invalidPositions: [],
    };

    pieces.forEach((piece, index) => {
      // Check board collision
      if (!this.isValidPosition(piece, board)) {
        results.hasCollision = true;
        results.invalidPositions.push({
          pieceIndex: index,
          piece: piece,
          collisions: this.getCollisionPoints(piece, board),
        });
      }

      // Check piece-to-piece collision (future feature)
      for (let otherIndex = index + 1; otherIndex < pieces.length; otherIndex++) {
        const otherPiece = pieces[otherIndex];

        if (this.doPiecesOverlap(piece, otherPiece)) {
          results.hasCollision = true;
          results.collisionPairs.push({
            piece1Index: index,
            piece2Index: otherIndex,
            piece1: piece,
            piece2: otherPiece,
          });
        }
      }
    });

    return results;
  }

  /**
   * Check if two pieces overlap (for multi-piece scenarios)
   * @param {Object} piece1 - First piece
   * @param {Object} piece2 - Second piece
   * @returns {boolean} - True if pieces overlap
   */
  doPiecesOverlap(piece1, piece2) {
    const positions1 = this.getPiecePositions(piece1);
    const positions2 = this.getPiecePositions(piece2);

    return positions1.some(pos1 => positions2.some(pos2 => pos1.x === pos2.x && pos1.y === pos2.y));
  }

  /**
   * Get all positions occupied by a piece
   * @param {Object} piece - The piece
   * @returns {Array} - Array of {x, y} positions
   */
  getPiecePositions(piece) {
    const positions = [];

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          positions.push({
            x: piece.x + x,
            y: piece.y + y,
          });
        }
      }
    }

    return positions;
  }
}
