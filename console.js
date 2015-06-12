/*jslint node: true*/
'use strict';

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

  // If the game isn't over, ask for first player's input
  if (!board.gameOver()) {
    askWhite();
  } else { // Otherwise, print out the winner of the game.
    if (board.winner() == chess.WHITE) {
      console.log('White wins!');
    } else if (board.winner() == chess.BLACK) {
      console.log('Black wins!');
    } else if (board.winner() == chess.STALEMATE) {
      console.log('Stalemate!');
    }
  }
}

function askWhite() {
  // Start standard input stream
  process.stdin.resume();
  // Write out instructions to console
  process.stdout.write('White\'s turn - enter input. For example:\n');
  process.stdout.write('\'1,4 2,4\' - Only the position of the digits matter.\n');
  process.stdout.write('> ');
  // Get data from stdin once asynchronously
  process.stdin.once('data', function(data) {
    // Convert data into a move
    data = data.toString().trim();
    var src_x = data[0];
    var src_y = data[2];
    var src = new chess.Pos(+src_x, +src_y);
    var dest_x = data[4];
    var dest_y = data[6];
    var dest = new chess.Pos(+dest_x, +dest_y);
    var move_w = new chess.Move(src, dest);

    console.log('src ' + src_x + ',' + src_y +
      ' dest ' + dest_x + ',' + dest_y);
    if (!board.isValidMove(chess.WHITE, move_w)) {
      askWhite(); // If move is invalid, query user again
    } else {
      askBlack(move_w); // Otherwise, ask for second player's move
    }
  });
}

function askBlack(move_w) {
  process.stdin.resume();
  process.stdout.write('Black\'s turn - enter input > ');
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    var src_x = data[0];
    var src_y = data[2];
    var src = new chess.Pos(+src_x, +src_y);
    var dest_x = data[4];
    var dest_y = data[6];
    var dest = new chess.Pos(+dest_x, +dest_y);
    var move_b = new chess.Move(src, dest);

    console.log('src ' + src_x + ',' + src_y +
      ' dest ' + dest_x + ',' + dest_y);
    if (!board.isValidMove(chess.BLACK, move_b)) {
      askBlack(move_w);
    } else {
      board.makeMove(move_w, move_b); // Update board state
      printBoard(board.getBoard()); // Print the new board
    }
  });
}

printBoard(board.getBoard());