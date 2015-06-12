var util = require('util');
var chess = require('./chess');

process.stdin.resume();
process.stdin.setEncoding('utf8');
var board = new chess.Board();

function printBoard(boardstate) {
  for (var x = 0; x < BOARD_SIZE; x++) {
    for (var y = 0; y < BOARD_SIZE; y++) {
      console.log(boardstate[x][y].pieceType)
    }
  }
}

function done() {
  console.log('Quitting...');
  process.exit();
}

process.stdin.on('data', function(text) {
  console.log('received data:', util.inspect(text));
  if (text === 'quit\n') {
    done();
  }
});


do {
  printBoard(board.getBoard());
  // ask for white input
  console.log("White's turn - enter input > ")
    // check that move is valid
  // ask for black input
  console.log("Black's turn - enter input > ")
    // check that move is valid
  // make move
} while (True);