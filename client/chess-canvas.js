var chess = require('../common/chess');

function DrawableBoard(id) {
	chess.Board.call(this);
	var canvas = document.getElementById(id);

	this.draw = function() {
		var ctx = canvas.getContext('2d');
		var cellSize = canvas.width / chess.BOARD_SIZE;
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
}
DrawableBoard.prototype = Object.create(chess.Board.prototype);
DrawableBoard.prototype.constructor = DrawableBoard;


/*
 * Main executed code below
 */
var board = new DrawableBoard('chessboard');
board.draw();