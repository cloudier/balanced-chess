/*jslint node: true*/
'use strict';

var chess = require('./common/chess');
var colour = require('colour');

var WHITE_ICONS = {
  'K': String.fromCharCode(0x2654),
  'Q': String.fromCharCode(0x2655),
  'R': String.fromCharCode(0x2656),
  'B': String.fromCharCode(0x2657),
  'N': String.fromCharCode(0x2658),
  'P': String.fromCharCode(0x2659),
}

var BLACK_ICONS = {
  'K': String.fromCharCode(0x265A),
  'Q': String.fromCharCode(0x265B),
  'R': String.fromCharCode(0x265C),
  'B': String.fromCharCode(0x265D),
  'N': String.fromCharCode(0x265E),
  'P': String.fromCharCode(0x265F),
}

var board = new chess.Board();

// Prints out the given board state to stdout
function printBoard(boardstate) {
  console.log('  0 1 2 3 4 5 6 7');
  for (var y = 0; y < boardstate.length; y++) {
    process.stdout.write(y.toString() + ' ');
    for (var x = 0; x < boardstate.length; x++) {
      // Print a '.' if the piece is null, otherwise print the piece
      // Lowercase for WHITE and uppercase for BLACK
      var toPrint = '. ';
      if (boardstate[x][y] !== null) {
        var piece = boardstate[x][y].pieceType;
        if (boardstate[x][y].player === chess.WHITE) {
          toPrint = WHITE_ICONS[piece] + ' ';
        } else {
          toPrint = BLACK_ICONS[piece] + ' ';
          toPrint = toPrint.inverse;
        }
      }
      
      // Print character without a newline
      process.stdout.write(toPrint);
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
    } else if (board.winner() == chess.TIE) {
      console.log('Tie!');
    }
  }
}

function askWhite() {
  // Start standard input stream
  process.stdin.resume();
  // Write out instructions to console
  process.stdout.write('White\'s turn.\n');
  process.stdout.write('> ');
  // Get data from stdin once asynchronously
  process.stdin.once('data', function(data) {
    // Convert data into a move
    data = data.toString().trim();
    var re = /\d+/g;
    var groups = data.match(re);

    var src_x = groups[0];
    var src_y = groups[1];
    var src = new chess.Pos(+src_x, +src_y);
    var dest_x = groups[2];
    var dest_y = groups[3];
    var dest = new chess.Pos(+dest_x, +dest_y);
    var move_w = new chess.Move(src, dest);

    if (!board.isValidMove(chess.WHITE, move_w)) {
      console.log('Invalid move:', move_w);
      askWhite(); // If move is invalid, query user again
    } else {
      askBlack(move_w); // Otherwise, ask for second player's move
    }
  });
}

function askBlack(move_w) {
  process.stdin.resume();
  process.stdout.write('Black\'s turn.\n');
  process.stdout.write('> ');
  process.stdin.once('data', function(data) {
    data = data.toString().trim();
    var re = /\d+/g;
    var groups = data.match(re);

    var src_x = groups[0];
    var src_y = groups[1];
    var src = new chess.Pos(+src_x, +src_y);
    var dest_x = groups[2];
    var dest_y = groups[3];
    var dest = new chess.Pos(+dest_x, +dest_y);
    var move_b = new chess.Move(src, dest);

    if (!board.isValidMove(chess.BLACK, move_b)) {
      console.log('Invalid move:', move_b);
      askBlack(move_w);
    } else {
      board.makeMove(move_w, move_b); // Update board state
      printBoard(board.getBoard()); // Print the new board
    }
  });
}

console.log('Balanced Chess');
console.log('White is represented by lowercase letters.');
console.log('Enter your move in the format x1,y1 x2,y2.');
printBoard(board.getBoard());