/*jslint node: true*/
'use strict';

var BOARD_SIZE = 8;

// Players
var WHITE = 0;
var BLACK = 1;

var TIE = 2;

// Types of pieces
var KING   = 'K';
var QUEEN  = 'Q';
var ROOK   = 'R';
var BISHOP = 'B';
var KNIGHT = 'N';
var PAWN   = 'P';

// Piece strength
var STRENGTH = {
  'K': 0,
  'P': 1,
  'N': 2,
  'B': 2,
  'R': 3,
  'Q': 4,
};

// Order of starting pieces
// TODO notsure if necessary
// TODO this doesn't use the constants which is bad...
var START_POSITION = 'RNBKQBNR';
var BOARD_LETTERS = 'ABCDEFGH';
var BOARD_NUMBERS = '12345678';

// Directions
var DXY = {
  'N': new Pos(0, -1),
  'E': new Pos(1, 0),
  'S': new Pos(0, 1),
  'W': new Pos(-1, 0),

  'NE': new Pos(1, -1),
  'SE': new Pos(1, 1),
  'SW': new Pos(-1, 1),
  'NW': new Pos(-1, -1),

  'K1': new Pos(-2, -1),
  'K2': new Pos(-1, -2),
  'K3': new Pos(1, -2),
  'K4': new Pos(2, -1),
  'K5': new Pos(2, 1),
  'K6': new Pos(1, 2),
  'K7': new Pos(-1, 2),
  'K8': new Pos(-2, 1),
};
var DIRS = ['N', 'E', 'S', 'W',
            'NE', 'SE', 'SW', 'NW',
            'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];

/*
 * Represents a chessboard and exposes functions
 * that can make moves on the board and change the state
 *
 * Keeps a history of the moves and allows movement
 * forward and backwards through this history
 *
 */
function Board() {
  /* The actual board
   * White starts with pieces across [0][0]-[7][1]
   * Black starts with pieces across [0][6]-[7][7]
   *
   *   01234567
   * 0 wwwwwwww
   * 1 wwwwwwww
   * 2
   * 3
   * 4
   * 5
   * 6 bbbbbbbb
   * 7 bbbbbbbb
   *
   */
  var board = [];
  for (var x = 0; x < BOARD_SIZE; x++) {
    board[x] = [];
    for (var y = 0; y < BOARD_SIZE; y++) {
      board[x][y] = null;
    }
  }
  
  // The number of moves that have been made
  var numMoves = 0;
  // A list of past moves: {'white': Move(), 'black': Move()}
  var moves = [];

  // Result will be WHITE or BLACK or STALEMATE or null if not finished
  var result = null;
  
  // Resets the board to the initial state
  function reset() {
    for (var x = 0; x < BOARD_SIZE; x++) {
      board[x][0] = new Piece(START_POSITION.charAt(x), WHITE);
      board[x][1] = new Piece(PAWN, WHITE);
      
      board[x][6] = new Piece(PAWN, BLACK);
      board[x][7] = new Piece(START_POSITION.charAt(x), BLACK);
    }
  }
  reset(); // Call this in the constructor to set up the board appropriately
  
  // Returns true if the square is empty, false otherwise
  function isEmpty(pos) {
    return board[pos.x][pos.y] === null;
  }

  /*
   * Returns array of valid positions, given a particular position
   * and the player that is attempting to make the move
   *
   * Naturally takes into account the piece at that position
   *
   * iterateMoves is a helper function that walks along directions
   * and pushes on moves as long as they are valid. [start, end) are
   * the indices of the DIRS array to use
   */
  function iterateMoves(arr, pos, start, end) {
    for (var i = start; i < end; i++) {
      var curPos = pos.add(DXY[DIRS[i]]);
      while (curPos.withinBounds()) {
        arr.push(curPos);
        if (!isEmpty(curPos)) {
          break;
        }
        curPos = curPos.add(DXY[DIRS[i]]);
      }
    }
  }
  this.validMoves = function(player, pos) {
    var positions = [];
    if (board[pos.x][pos.y] === null) return positions;
    if (board[pos.x][pos.y].player !== player) return positions;
    
    switch(board[pos.x][pos.y].pieceType) {
      case KING:
        // King can move along all directions
        // Can always move one unit unless out of bounds
        for (var i = 0; i < 8; i++) {
          var curPos = pos.add(DXY[DIRS[i]]);
          if (curPos.withinBounds()) {
            positions.push(curPos);
          }
        }
        // TODO castling?!
		// new global vars for kings and rooks - hasmoved
		// if (king and left rook haven't moved) {
		//     if (path is clear (1 left, 2 left, 3 left)) {
		//          positions.push(0, -2)
		//			setflag - left rook to (0, -1)
		//	   }
		// }
		// if (king and right rook haven't moved) {
		//     if (path is clear (1 right, 2 right)) {
		//          positions.push(0, 2)
		// 			setflag - right rook to (0, 1)
		//     }
		// }
		
        break;
      case QUEEN:
        // Queen can move along all directions
        // Can move until it hits an obstacle
        iterateMoves(positions, pos, 0, 8);
        break;
      case ROOK:
        // Rook can move along cardinal directions
        // Can move until it hits an obstacle
        iterateMoves(positions, pos, 0, 4);
        break;
      case BISHOP:
        // Bishop can move along diagonal directions
        // Can move until it hits an obstacle
        iterateMoves(positions, pos, 4, 8);
        break;
      case KNIGHT:
        // Knight can move along L-shaped directions
        // Can always move one unit unless out of bounds
        for (var i = 8; i < 16; i++) {
          var curPos = pos.add(DXY[DIRS[i]]);
          if (curPos.withinBounds()) {
            positions.push(curPos);
          }
        }
        break;
      case PAWN:
        var dir = DXY.S; // Going south by default
        if (player === BLACK) {
          dir = DXY.N;
        }

        // If on starting row we can advance two squares
        var homeRow = (player === WHITE && pos.y === 1) ||
                      (player === BLACK && pos.y === 6);

        // Can always take a diagonal if within bounds
        // and if there is actually a piece there
        var curPos = pos.add(dir);
        var diag1 = curPos.add(DXY.W);
        var diag2 = curPos.add(DXY.E);
        if (diag1.withinBounds() && !isEmpty(diag1)) {
          positions.push(diag1);
        }
        if (diag2.withinBounds() && !isEmpty(diag2)) {
          positions.push(diag2);
        }

        // Can only advance forward if not blocked
        if (curPos.withinBounds() && isEmpty(curPos)) {
          positions.push(curPos);
          if (homeRow) {
            curPos = curPos.add(dir);
            if (curPos.withinBounds() && isEmpty(curPos)) {
              positions.push(curPos);
            }
          }
        }
        // TODO enpassant
        break;
    }
    
    return positions;
  };

  /*
   * Returns true if the move is valid and false otherwise
   */
  this.isValidMove = function(player, move) {
    var positions = this.validMoves(player, move.src);
    for (var i = 0, len = positions.length; i < len; i++) {
      if (move.dst.equals(positions[i])) return true;
    }
    return false;
  };

  /*
   * Return the path a piece took, given a Move
   */
  this.getPath = function(move) {
    var path = [];

    // Find what direction this move was in
    var diff = move.dst.sub(move.src);
    var dir = diff.reduceCommon();
    var dirIndex = null;
    for (var i = 0; i < 8; i++) {
      if (dir.equals(DXY[DIRS[i]])) {
        dirIndex = i;
        break;
      }
    }

    // It's a simple straight line, path is (src,dst]
    if (dirIndex !== null) {
      var pos = move.src.add(dir);
      while (!pos.equals(move.dst)) {
        path.push(pos);
        pos = pos.add(dir);
      }
      path.push(pos);
      return path;
    }

    // It's an annoying knight path
    var xMag = Math.abs(diff.x);
    var yMag = Math.abs(diff.y);
    var xDir = new Pos(diff.x, 0).reduceCommon();
    var yDir = new Pos(0, diff.y).reduceCommon();

    var pos = move.src.clone();
    if (xMag > yMag) {
      // x first
      for (var i = 0; i < 2; i++) {
        pos = pos.add(xDir);
        path.push(pos);
      }
      pos = pos.add(yDir);
      path.push(pos);
    } else {
      // y first
      for (var i = 0; i < 2; i++) {
        pos = pos.add(yDir);
        path.push(pos);
      }
      pos = pos.add(xDir);
      path.push(pos);
    }
    return path;
  };
  
  /*
   * Make a pair of moves and update the board state to
   * reflect that. The following are updated:
   *  - numMoves is incremented
   *  - moves is appended with this move
   *  - board is updated appropriately
   *  - result may be updated if someone wins
   *
   * This function will fail if the game is over or if
   * either of the moves supplied were invalid. In these
   * cases false will be returned.
   *
   * Otherwise an object is returned like so:
   *  - white.intercept = true/false
   *  - white.dodge = true/false
   *  - white.moves = true/false
   *  - black.intercept = true/false
   *  - black.dodge = true/false
   *  - black.moves = true/false
   *  - fight = true/false
   */
  function inPath(pos, path) {
    for (var i = 0, len = path.length; i < len; i++) {
      if (pos.equals(path[i])) return true;
    }
    return false;
  }
  this.makeMove = function(white, black) {
    if (this.gameOver()) return false;
    if (!this.isValidMove(WHITE, white) || !this.isValidMove(BLACK, black)) return false;

    // Calculate paths of the moves
    var whitePath = this.getPath(white);
    var blackPath = this.getPath(black);

    var whitePiece = board[white.src.x][white.src.y];
    var blackPiece = board[black.src.x][black.src.y];

    var result = {white: {}, black: {}};

    // Calculate whether they intercept or not
    result.white.intercept = inPath(white.dst, blackPath);
    result.black.intercept = inPath(black.dst, whitePath);

    result.white.moves = true; // White move successful
    result.black.moves = true; // Black move successful
    result.fight = false;       // A fight occurs - resolution on piece value

    if (result.white.intercept && result.black.intercept) {
      // They both intercept each other - fight!
      result.fight = true;
    } else if (result.white.intercept) {
      // White intercepts black
      if (blackPiece.pieceType === QUEEN && whitePiece.pieceType === PAWN) {
      	// special case: when pawn's intercept a queen, the pawn dies and stops where they collided
      	result.white.moves = false;
      	black.dst = white.dst;
      } else {
      	// normal case
        result.black.moves = false; 
      }
    } else if (result.black.intercept) {
      // Black intercepts white
      if (whitePiece.pieceType === QUEEN && blackPiece.pieceType === PAWN) { 
      	result.black.moves = false;
      	white.dst = black.dst;
      } else {
      	result.white.moves = false; // normal case
      }
    } else {
      // No intercepts, check for 'dodges'
      // A dodge is when one piece moves away from a move which would've taken it
      result.white.dodge = black.dst.equals(white.src);
      result.black.dodge = white.dst.equals(black.src);
      if (result.white.dodge && result.black.dodge) {
        // Both dodges, ie they both tried to take each other - fight!
        // However, knights dodge because their paths avoid each other
        if (!(whitePiece.pieceType === KNIGHT && blackPiece.pieceType === KNIGHT)) {
        	result.fight = true;
        }
      } else if (result.white.dodge) {
        // White dodged
      } else if (result.black.dodge) {
        // Black dodged
      }
    }

    // Resolve fighting powers
    if (result.fight === true) {
      if (STRENGTH[whitePiece.pieceType] >= STRENGTH[blackPiece.pieceType]) {
      	// special case: king beats pawn on promotion square
      	if (blackPiece.pieceType === KING && whitePiece.pieceType === PAWN
      		&& white.dst.y === 7) {
          result.white.moves = false;
      	} else { // normal case
      	  result.black.moves = false;	
      	}
      }
      if (STRENGTH[blackPiece.pieceType] >= STRENGTH[whitePiece.pieceType]) {
      	// special case: king beats pawn on promotion square
      	if (whitePiece.pieceType === KING && blackPiece.pieceType === PAWN
      		&& black.dst.y === 0) {
          result.black.moves = false;
      	} else { // normal case
      	  result.white.moves = false;	
      	}
      }
    }

	// Check defend interactions for white
	if (board[white.dst.x][white.dst.y] !== null // if whitePiece is moving to 
		&& board[white.dst.x][white.dst.y].player === WHITE // another white piece
	    && white.dst.equals(black.dst)) { // and a black piece tries to take it
	  // 1. the black piece dies
	  result.black.moves = false;
	  // 2. unless the defending piece is a king, they also die
	  // set result.white.moves to true if king to revert its death in "resolve fighting powers"
	  result.white.moves = (whitePiece.pieceType === KING) ? true : false;
	}

	// Check defend interactions for black
	if (board[black.dst.x][black.dst.y] !== null 
		&& board[black.dst.x][black.dst.y].player === BLACK 
	    && white.dst.equals(black.dst)) { 
      result.white.moves = false;
      result.black.moves = (blackPiece.pieceType === KING) ? true : false;
	}

    // Move any pieces that can move
    board[white.src.x][white.src.y] = null;
    board[black.src.x][black.src.y] = null;
    if (result.white.moves) {
      // check for pawn promotion
      if (white.dst.y === 7 && whitePiece.pieceType === PAWN) {
      	whitePiece.pieceType = QUEEN; // queen by default for now
      }
      board[white.dst.x][white.dst.y] = whitePiece;
    }
    if (result.black.moves) {
      if (black.dst.y === 0 && blackPiece.pieceType === PAWN) {
      	blackPiece.pieceType = QUEEN;
      }
      board[black.dst.x][black.dst.y] = blackPiece;
    }

    // Update numMoves and moves
    moves[numMoves++] = {white: white.clone(), black: black.clone()};

    // Check if someone won
    var whiteLost = true;
    var blackLost = true;
    for (var x = 0; x < BOARD_SIZE; x++) {
      for (var y = 0; y < BOARD_SIZE; y++) {
        if (board[x][y] === null) continue;
        if (board[x][y].pieceType === KING) {
          if (board[x][y].player === WHITE) {
            whiteLost = false;
          } else {
            blackLost = false;
          }
        }
      }
    }
    if (whiteLost && blackLost) {
      result = TIE;
    } else if (whiteLost) {
      result = BLACK;
    } else if (blackLost) {
      result = WHITE;
    }

    return result;
  };
  
  /*
   * Returns a 2d array of Piece objects which represents
   * the board. Note that this is a deep copy of our existing board
   */
  this.getBoard = function() {
    var boardCopy = [];
    for (var x = 0; x < BOARD_SIZE; x++) {
      boardCopy[x] = [];
      for (var y = 0; y < BOARD_SIZE; y++) {
        boardCopy[x][y] = board[x][y] === null ? null : board[x][y].clone();
      }
    }
    return boardCopy;
  };

  /*
   * If the game is finished or not
   *
   * The winner will be WHITE or BLACK or STALEMATE
   */
  this.gameOver = function () {
    return result !== null;
  };
  this.winner = function () {
    return result;
  };
}

/*
 * Represents a single move from one player
 *
 * Can take either:
 *  - Pos src, Pos dst
 *  - int srcx, int srcy, int dstx, int dsty
 */
function Move() {
  if (arguments.length === 2) {
    this.src = arguments[0].clone();
    this.dst = arguments[1].clone();
  } else if (arguments.length === 4) {
    this.src = new Pos(arguments[0], arguments[1]);
    this.dst = new Pos(arguments[2], arguments[3]);
  }
}
Move.prototype.clone = function() {
  return new Move(this.src.clone(), this.dst.clone());
};

// TODO do we care about type checking
/*
 * A cartesian coordinate.
 *
 * Actually doubles as a vector, in a sense
 */
function Pos(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}
Pos.prototype.add = function(pos) {
  if (pos === null) return this;
  return new Pos(this.x + pos.x, this.y + pos.y);
};
Pos.prototype.sub = function(pos) {
  if (pos === null) return this;
  return new Pos(this.x - pos.x, this.y - pos.y);
};
Pos.prototype.reduceCommon = function() {
  var divisor = gcd(Math.abs(this.x), Math.abs(this.y));
  return new Pos(this.x / divisor, this.y / divisor);
};
// Pos.prototype.magnitude = function() {
//   return Math.sqrt(this.x*this.x + this.y*this.y);
// };
// Pos.prototype.normalize = function() {
//   var mag = this.magnitude();
//   return new Pos(this.x / mag, this.y / mag);
// };
Pos.prototype.withinBounds = function() {
  return this.x >= 0 && this.x < BOARD_SIZE &&
         this.y >= 0 && this.y < BOARD_SIZE;
};
Pos.prototype.equals = function(pos) {
  if (pos === null) return false;
  return this.x === pos.x && this.y === pos.y;
};
Pos.prototype.clone = function() {
  return new Pos(this.x, this.y);
};
Pos.prototype.toString = function() {
  return '(' + this.x + ', ' + this.y + ')';
};

/*
 * Represents a piece on the board
 */
function Piece(pieceType, player) {
  this.pieceType = pieceType;
  this.player = player;
}
Piece.prototype.clone = function() {
  return new Piece(this.pieceType, this.player);
};

/*
 * Utility / helper
 */
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

/*
 * Expose these functions to outside code
 */
module.exports = {
  'Board': Board,
  'Move': Move,
  'Pos': Pos,
  
  'BOARD_SIZE': BOARD_SIZE,
  'WHITE': WHITE,
  'BLACK': BLACK,
  'TIE': TIE,
};