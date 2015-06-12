var util = require('util');
var chess = require('./chess');


var board = new chess.Board();

// Prints out the given board state to stdout
function printBoard(boardstate) {
  for (var x = 0; x < BOARD_SIZE; x++) {
    for (var y = 0; y < BOARD_SIZE; y++) {
      // Print a '.' if the piece is null, otherwise print the piece
      var toPrint = boardstate[x][y] === null ?
        '.' : boardstate[x][y].pieceType;
      
      // Print character without a newline
      process.stdout.write(toPrint + ' ');
    }
    // Print a new line
    console.log();
  }

  if (!board.gameOver()) {
    askWhite();
  }
}

function askWhite() {
  process.stdin.resume();
  process.stdout.write("White's turn - enter input > ");
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    // validate data
    // check that move is valid
    askBlack();
  });
}

function askBlack() {
  process.stdin.resume();
  process.stdout.write("Black's turn - enter input > ");
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    // validate data
    // check that move is valid
    printBoard(board.getBoard());
  });
}

printBoard(board.getBoard());