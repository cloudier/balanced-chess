var chess = require('../common/chess');

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

  /*
   * Draw the current board state to the canvas
   */
	this.draw = function() {
		var board = this.getBoard();

		var fontSize = Math.floor(cellSize * 0.7);
		ctx.font = fontSize + 'px serif';
		var offset = cellSize * 0.15;

		for (var x = 0; x < chess.BOARD_SIZE; x++) {
			for (var y = 0; y < chess.BOARD_SIZE; y++) {
				ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
				ctx.stroke();

				if (board[x][y] === null) continue;

				var text = board[x][y].pieceType;
				if (board[x][y].player === chess.WHITE) {
					ctx.strokeText(text, x * cellSize + offset, (y+1) * cellSize - offset, cellSize);
				} else {
					ctx.fillText(text, x * cellSize + offset, (y+1) * cellSize - offset, cellSize);
				}
			}
		}
	};

  /*
   * Handles a click event that occured on the canvas
   */
	this.click = function(event) {
		var clickPos = canvas.relMouseCoords(event);

		var cellPos = new chess.Pos(Math.floor(clickPos.x / cellSize),
									Math.floor(clickPos.y / cellSize));

		console.log(cellPos);
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