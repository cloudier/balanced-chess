var util = require('util');
var chess = require('./chess');


var board = new chess.Board();

// Prints out the given board state to stdout
function printBoard(boardstate) {
  for (var y = 0; y < boardstate.length; y++) {
    for (var x = 0; x < boardstate.length; x++) {
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
  process.stdout.write("E.g. '1,4 2,4'")
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    var src_x = 0;
    var src_y = 0;
//    if (board.isValidMove(chess.WHITE, new chess.Pos(x, y))) {
 //     askWhite();
  //  }
    askBlack(move);
  });
}

function askBlack(move) {
  process.stdin.resume();
  process.stdout.write("Black's turn - enter input > ");
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    var src_x = 0;
    var src_y = 0;
//    if (board.isValidMove(chess.BLACK, new chess.Pos(x,y))) {
//      askBlack();
//    }
    // make move
    board.makeMove();
    printBoard(board.getBoard());
  });
}

printBoard(board.getBoard());