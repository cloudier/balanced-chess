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
    // Clear for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var board = this.getBoard();

    // Set font sizes and center them in each cell
    var fontSize = Math.floor(cellSize * 0.7);
    ctx.font = fontSize + 'px serif';
    var offset = cellSize * 0.15;

    for (var x = 0; x < chess.BOARD_SIZE; x++) {
      for (var y = 0; y < chess.BOARD_SIZE; y++) {
        ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.stroke();

        if (board[x][y] === null) continue;

        var piece = board[x][y].pieceType;
        if (board[x][y].player === chess.WHITE) {
          var text = WHITE_ICONS[piece];
          ctx.fillText(text, x * cellSize + offset, (y+1) * cellSize - offset, cellSize);
        } else {
          var text = BLACK_ICONS[piece];
          ctx.fillText(text, x * cellSize + offset, (y+1) * cellSize - offset, cellSize);
        }
      }
    }
  };

  /*
   * Handles a click event that occured on the canvas
   *
   * Returns the Pos that describes the cell that was clicked
   */
  this.click = function(event) {
    var clickPos = canvas.relMouseCoords(event);

    var cellPos = new chess.Pos(Math.floor(clickPos.x / cellSize),
                  Math.floor(clickPos.y / cellSize));

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
   * Returns true if successful and false otherwise (eg both moves
   * have not been submitted)
   */
  this.advanceGame = function() {
    if (pendingMove[chess.WHITE] === null || pendingMove[chess.BLACK] === null) {
      return false;
    }

    if (this.makeMove(pendingMove[chess.WHITE], pendingMove[chess.BLACK])) {
      pendingMove[chess.WHITE] = null;
      pendingMove[chess.BLACK] = null;
      return true;
    } else {
      return false;
    }
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
app.controller('ChessCtrl', ['$scope', function($scope) {
  /*
   * Step controls what should happen next
   *  - 0 White src
   *  - 1 White dst
   *  - 2 Black src
   *  - 3 Black dst
   */
  $scope.step = 0;
  $scope.instructions = [
    'White select source',
    'White select destination',
    'Black select source',
    'Black select destination',
  ];

  var moveSrc = null;
  var moveDst = null;

  $scope.message = '';
  $scope.board = board;
  $scope.click = function(event) {
    var pos = board.click(event);
    var result = false;
    switch($scope.step) {
      case 0:
        moveSrc = pos;
        result = pos.withinBounds();
        if (result) {
          $scope.message = 'White moving from ' + moveSrc;
        } else {
          $scope.message = 'Invalid source cell: ' + pos;
        }
        break;
      case 1:
        moveDst = pos;
        result = board.submitMove(chess.WHITE, new chess.Move(moveSrc, moveDst));
        if (result) {
          $scope.message = '';
        } else {
          $scope.message = 'Invalid destination cell: ' + pos;
          $scope.step = 0;
        }
        break;
      case 2:
        moveSrc = pos;
        result = pos.withinBounds();
        if (result) {
          $scope.message = 'Black moving from ' + moveSrc;
        } else {
          $scope.message = 'Invalid source cell';
        }
        break;
      case 3:
        moveDst = pos;
        result = board.submitMove(chess.BLACK, new chess.Move(moveSrc, moveDst));
        result = result && board.advanceGame();
        if (result) {
          $scope.message = '';
        } else {
          $scope.message = 'Invalid destination cell: ' + pos;
          $scope.step = 2;
        }
        board.draw();
        break;
    }
    if (result) {
      $scope.step = ($scope.step + 1) % 4;
    }
  }
}]);