/*jslint node: true*/
'use strict';

var chess = require('./chess.js')

/*

  // The number of moves that have been made
  numMoves
  // A list of past moves
  move[0] {
    'white': Move
    'white-time':
    'black': Move
    'black-time':
    'unmovedpawns': [pos, pos, pos]
    'unmovedrooks/kings?': [pos, pos, pos]
  }

  // Result will be WHITE or BLACK or STALEMATE or null if not finished
  result = null;

  methods to export:
    getResult()
    getNumMoves()
    getMove(int)
*/
