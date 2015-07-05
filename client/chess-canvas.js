var chess = require('../common/chess');

var WHITE_ICONS = {
  'K': String.fromCharCode(0x2654),
  'Q': String.fromCharCode(0x2655),
  'R': String.fromCharCode(0x2656),
  'B': String.fromCharCode(0x2657),
  'N': String.fromCharCode(0x2658),
  'P': String.fromCharCode(0x2659),
};

var BLACK_ICONS = {
  'K': String.fromCharCode(0x265A),
  'Q': String.fromCharCode(0x265B),
  'R': String.fromCharCode(0x265C),
  'B': String.fromCharCode(0x265D),
  'N': String.fromCharCode(0x265E),
  'P': String.fromCharCode(0x265F),
};

/*
 * Extends chess.Board() and adds methods for drawing the board
 * to an html canvas object as well as methods to interact with
 * the board from the browser.
 */
function DrawableBoard(id) {
  chess.Board.call(this);
  var canvas = document.getElementById(id);
  var ctx = canvas.getContext('2d');
  var cellSize = canvas.width / chess.BOARD_SIZE;

  // Moves that have been submitted but not executed yet
  var pendingMove = {};
  pendingMove[chess.WHITE] = null;
  pendingMove[chess.BLACK] = null;

  /*
   * Draw the current board state to the canvas
   */
  this.draw = function() {
  	var playerColour = chess.BLACK;

    // Clear for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var board = this.getBoard();

    // Set font sizes and center them in each cell
    var fontSize = Math.floor(cellSize * 0.7);
    ctx.font = fontSize + 'px serif';
    var xOffset = cellSize * 0.15;
    var yOffset = cellSize * 0.20;

    for (var col = 0; col < chess.BOARD_SIZE; col++) {
      for (var row = 0; row < chess.BOARD_SIZE; row++) {
      	// otherwise display the corresponding square on the board
      	var x = playerColour === chess.BLACK ? col : chess.BOARD_SIZE - col - 1;
      	var y = playerColour === chess.BLACK ? row : chess.BOARD_SIZE - row - 1;
        
        ctx.rect(col * cellSize, row * cellSize, cellSize, cellSize);
        ctx.stroke();

        if (board[x][y] === null) continue;

        var piece = board[x][y].pieceType;
        if (board[x][y].player === chess.WHITE) {
          var text = WHITE_ICONS[piece];
          ctx.fillText(text, col * cellSize + xOffset, (row+1) * cellSize - yOffset, cellSize);
        } else {
          var text = BLACK_ICONS[piece];
          ctx.fillText(text, col * cellSize + xOffset, (row+1) * cellSize - yOffset, cellSize);
        }
      }
    }

    /*
    // draw column letters
  	for (var col = 0; col < chess.BOARD_SIZE; col++) {
  		var text = playerColour === chess.BLACK ? chess.BOARD_LETTERS.charAt(col) 
  												: chess.BOARD_LETTERS.charAt(chess.BOARD_SIZE - col - 1);
  	    // write(text) at x = col, y = chess.BOARD_SIZE * (cellSize + 1);
  	}

  	// draw row numbers
  	for (var row = 0; row < chess.BOARD_SIZE; row++) {
  		var text = playerColour === chess.BLACK ? chess.BOARD_LETTERS.charAt(row) 
  												: chess.BOARD_LETTERS.charAt(chess.BOARD_SIZE - row - 1);
  	    // write(text) at x = chess.BOARD_SIZE * (cellSize + 1), y = row;
  	}
  	*/
  };

  /*
   * Handles a click event that occured on the canvas
   *
   * Returns the Pos that describes the cell that was clicked
   */
  this.click = function(event) {
    var playerColour = chess.BLACK;
    var clickPos = canvas.relMouseCoords(event);

    var cellPos = new chess.Pos(Math.floor(clickPos.x / cellSize),
                  Math.floor(clickPos.y / cellSize));

    if (playerColour === chess.WHITE) {
    	cellPos.x = chess.BOARD_SIZE - cellPos.x - 1;
    	cellPos.y = chess.BOARD_SIZE - cellPos.y - 1;
    }
    return cellPos;
  };

  /*
   * Submit a move for one player
   *
   * Returns true if valid and false otherwise
   */
  this.submitMove = function(player, move) {
    if (!this.isValidMove(player, move)) {
      return false;
    }

    pendingMove[player] = move.clone();
    return true;
  };

  /*
   * If both moves have been submitted, advance the game
   *
   * Returns the result of the moves if successful and false
   * otherwise (eg both moves have not been submitted)
   */
  this.advanceGame = function() {
    if (pendingMove[chess.WHITE] === null || pendingMove[chess.BLACK] === null) {
      return false;
    }

    var result = this.makeMove(pendingMove[chess.WHITE], pendingMove[chess.BLACK]);
    if (result !== false) {
      pendingMove[chess.WHITE] = null;
      pendingMove[chess.BLACK] = null;
    }

    return result;
  };
}
DrawableBoard.prototype = Object.create(chess.Board.prototype);
DrawableBoard.prototype.constructor = DrawableBoard;

/*
 * Given a mouse event, get the mouse coords relative to the
 * canvas object.
 *
 * Returns an {x: _, y: _} object.
 */
HTMLCanvasElement.prototype.relMouseCoords = function (event) {
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  } while (currentElement = currentElement.offsetParent);

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  return {x: canvasX, y: canvasY};
};


/*
 * Main executed code below
 */
var board = new DrawableBoard('chessboard');
board.draw();

var app = angular.module('app', []);
app.controller('ChessCtrl', function() {
  var self = this;

  /*
   * Step controls what should happen next
   *  - 0 White src
   *  - 1 White dst
   *  - 2 Black src
   *  - 3 Black dst
   */
  self.step = 0;
  self.instructions = [
    'White select source',
    'White select destination',
    'Black select source',
    'Black select destination',
  ];

  var moveSrc = null;
  var moveDst = null;

  self.message = '';
  self.board = board;
  self.click = function(event) {
    var pos = board.click(event);
    var result = false;
    switch(self.step) {
      case 0:
        moveSrc = pos;
        result = pos.withinBounds();
        if (result) {
          self.message = 'White moving from ' + moveSrc;
        } else {
          self.message = 'Invalid source cell: ' + pos;
        }
        break;
      case 1:
        moveDst = pos;
        result = board.submitMove(chess.WHITE, new chess.Move(moveSrc, moveDst));
        if (result) {
          self.message = '';
        } else {
          self.message = 'Invalid destination cell: ' + pos;
          self.step = 0;
        }
        break;
      case 2:
        moveSrc = pos;
        result = pos.withinBounds();
        if (result) {
          self.message = 'Black moving from ' + moveSrc;
        } else {
          self.message = 'Invalid source cell';
        }
        break;
      case 3:
        moveDst = pos;
        result = board.submitMove(chess.BLACK, new chess.Move(moveSrc, moveDst));
        var moveResult = board.advanceGame();
        result = result && (moveResult !== false);
        if (result) {
          self.message = moveResult;
        } else {
          self.message = 'Invalid destination cell: ' + pos;
          self.step = 2;
        }
        board.draw();
        break;
    }
    if (result) {
      self.step = (self.step + 1) % 4;
    }
  }
});