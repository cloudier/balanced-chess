var BOARD_SIZE = 8;

// Players
var WHITE = 0;
var BLACK = 1;

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
var DIRS = {
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
  
  /*
   * Returns array of valid positions, given a particular position
   * and the player that is attempting to make the move
   *
   * Naturally takes into account the piece at that position
   */
  this.validMoves = function(player, pos) {
    var positions = [];
    switch(board[pos.x][pos.y]) {
      case null:
        break; // If piece doesn't exist, return an empty array.
      case KING:
        // get adjacent positions that are empty
        board
        // castling?!
        break;
      case QUEEN:
        // forward/sidewas
        // diagonals
        break;
      case ROOK:
        break;
      case BISHOP:
        break;
      case KNIGHT:
        break;
      case PAWN:
        // double square advance on first move
        // enpassant
        // move forward 1 square if not blocked
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
        boardCopy[x][y] = board[x][y].clone();
      }
    }
    return boardCopy;
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