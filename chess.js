var exports = module.exports = {};

var BOARD_SIZE = 8; // TODO maybe we should have a file for constants?

// Players
global.WHITE = 0;
global.BLACK = 1;

global.STALEMATE = 2;

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
exports.Board = function() {
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
        // Can move until it hits an obstacle
        iterateMoves(positions, 8, 16);
        break;
      case PAWN:
        var dir = DXY['S']; // Going south by default
        if (player === black) {
          dir = DXY['N'];
        }

        // If on starting row we can advance two squares
        var homeRow = (player === white && pos.y === 1) ||
                      (player === black && pos.y === 6);

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
  }

  /*
   * Returns true if the move is valid and false otherwise
   */
  this.isValid = function(player, move) {
    var positions = validMoves(player, move.src);
    for (var i = 0, len = positions.length; i < len; i++) {
      if (move.dst.equals(pos)) return true;
    }
    return false;
  }
  
  /*
   * Make a pair of moves and return the result
   *
   * TODO how to return result? what's in it?
   */
  this.makeMove = function(white, black) {
    //
  }
  
  /*
   * Returns a 2d array of Piece objects which represents
   * the board. Note that this is a deep copy of our existing board
   */
  this.getBoard = function() {
    var boardCopy = []
    for (var x = 0; x < BOARD_SIZE; x++) {
      boardCopy[x] = [];
      for (var y = 0; y < BOARD_SIZE; y++) {
        boardCopy[x][y] = board[x][y] === null ? null : board[x][y].clone();
      }
    }
    return boardCopy;
  }

  /*
   * If the game is finished or not
   *
   * The winner will be WHITE or BLACK or STALEMATE
   */
  this.gameOver = function () {
    return result !== null;
  }
  this.winner = function () {
    return result;
  }
}

// TODO do we care about type checking and ensuring that arguments were passed
/*
 * Represents a single move from one player
 */
function Move(piece, src, dst) {
  this.piece = piece;
  this.src = src;
  this.dst = dst;
}

// TODO do we care about type checking
/*
 * A cartesian coordinate.
 */
function Pos(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}
Pos.prototype.add = function(pos) {
  if (pos === null) return this;
  if (typeof pos != 'Pos') return this;
  return new Pos(this.x + pos.x, this.y + pos.y);
}
Pos.withinBounds = function() {
  return this.x >= 0 && this.x < BOARD_SIZE &&
         this.y >= 0 && this.y < BOARD_SIZE;
}
Pos.prototype.equals = function(pos) {
  if (pos === null) return false;
  if (typeof pos != 'Pos') return false;
  return this.x === pos.x && this.y === pos.y;
}
Pos.prototype.clone = function() {
  return new Pos(this.x, this.y);
}

/*
 * Represents a piece on the board
 */
function Piece(pieceType, player) {
  this.pieceType = pieceType;
  this.player = player;
}
Piece.prototype.clone = function() {
  return new Piece(this.pieceType, this.player);
}