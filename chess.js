var BOARD_SIZE = 8; // TODO maybe we should have a file for constants?

// Players
var WHITE = 0;
var BLACK = 1;

var STALEMATE = 2;

// Types of pieces
var KING   = 'K';
var QUEEN  = 'Q';
var ROOK   = 'R';
var BISHOP = 'B';
var KNIGHT = 'N';
var PAWN   = 'P';

// Order of starting pieces
// TODO notsure if necessary
// TODO this doesn't use the constants which is bad...
var START_POSITION = 'RNBKQBNR';

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
  function iterateMoves(arr, start, end) {
    for (var i = start; i < end; i++) {
      var curPos = start.add(DXY[DIRS[i]]);
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
        break;
      case QUEEN:
        // Queen can move along all directions
        // Can move until it hits an obstacle
        iterateMoves(positions, 0, 8);
        break;
      case ROOK:
        // Rook can move along cardinal directions
        // Can move until it hits an obstacle
        iterateMoves(positions, 0, 4);
        break;
      case BISHOP:
        // Bishop can move along diagonal directions
        // Can move until it hits an obstacle
        iterateMoves(positions, 4, 8);
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
        var dir = DXY['S']; // Going south by default
        if (player === BLACK) {
          dir = DXY['N'];
        }

        // If on starting row we can advance two squares
        var homeRow = (player === WHITE && pos.y === 1) ||
                      (player === BLACK && pos.y === 6);

        // Can always take a diagonal if within bounds
        var curPos = pos.add(dir);
        var diag1 = curPos.add(DXY['W']);
        var diag2 = curPos.add(DXY['E']);
        if (diag1.withinBounds()) {
          positions.push(diag1);
        }
        if (diag2.withinBounds()) {
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
   * Return the path a piece took, given a Move
   */
  this.getPath = function(move) {
    var path = [];

    // Find what direction this move was in
    var diff = move.dst.sub(move.src);
    var dir = diff.normalize();
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
    var xDir = new Pos(diff.x, 0).normalize();
    var yDir = new Pos(0, diff.y).normalize();

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
      // x first
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
   * Make a pair of moves and update the board state to
   * reflect that. The following are updated:
   *  - numMoves is incremented
   *  - moves is appended with this move
   *  - board is updated appropriately
   *  - result may be updated if someone wins
   *
   * This function will fail if the game is over or if
   * either of the moves supplied were invalid. In these
   * cases false will be returned (true otherwise)
   */
  this.makeMove = function(white, black) {
    if (this.gameOver()) return false;
    if (!this.isValidMove(WHITE, white) || !this.isValidMove(BLACK, black)) return false;

    var whitePath = this.getPath(white);
    var blackPath = this.getPath(black);

    return true;
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

// TODO do we care about type checking and ensuring that arguments were passed
/*
 * Represents a single move from one player
 */
function Move(src, dst) {
  this.src = src;
  this.dst = dst;
}

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
Pos.prototype.magnitude = function() {
  return Math.sqrt(this.x*this.x + this.y*this.y);
};
Pos.prototype.normalize = function() {
  var mag = this.magnitude();
  return new Pos(this.x / mag, this.y / mag);
};
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
 * Expose these functions to outside code
 */
module.exports = {
  'Board': Board,
  'Move': Move,
  'Pos': Pos,
};

global = {
  'WHITE': WHITE,
  'BLACK': BLACK,
  'STALEMATE': STALEMATE,
};