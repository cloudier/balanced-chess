/*jslint node: true, mocha: true*/
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
    mockery = require('mockery');

var sandbox = sinon.sandbox.create(),
    // stubbedDonut = {
    //     thatAPIMethod: sandbox.stub()
    // },
    chess,
    board;

/*
 * expected is an array of strings where each
 * string represents a row. A single period
 * represents an empty square. Lowercase letters
 * represent white pieces and uppercase are black
 * pieces. The pieces are RNBKQBNR in that order
 *
 * Returns true if the boards match and false otherwise
 */
function checkBoard(actual, expected) {
    for (var y = 0; y < expected.length; y++) {
        for (var x = 0; x < expected[y].length; x++) {
            // If either of them is empty
            var actualEmpty = (actual[x][y] === null);
            var expectedEmpty = (expected[y][x] === '.');
            if (actualEmpty && expectedEmpty) {
                continue;
            } else if (actualEmpty && !expectedEmpty) {
                return false;
            } else if (!actualEmpty && expectedEmpty) {
                return false;
            }

            // Both have a piece, see if the pieces match
            var expectedPiece = expected[y][x].toUpperCase();
            var expectedPlayer = (expected[y][x] === expectedPiece ?
                                  chess.BLACK : chess.WHITE);
            if (actual[x][y].pieceType !== expectedPiece) {
                return false;
            }
            if (actual[x][y].player !== expectedPlayer) {
                return false;
            }
        }
    }
    return true;
}

/*
 * Convenience wrapper for chess.Move which allows
 * easier initialization
 */
function cMove(srcx, srcy, dstx, dsty) {
    var src = new chess.Pos(srcx, srcy);
    var dst = new chess.Pos(dstx, dsty);
    return new chess.Move(src, dst);
}

describe('chess', function() {
    
    before(function() {
        mockery.enable(); // Enable mockery at the start of your test suite
    });

    beforeEach(function() {
        // mockery.registerAllowable('async');                    // Allow some modules to be loaded normally
        // mockery.registerMock('../lib/donut', stubbedDonut);    // Register others to be replaced with our stub
        // mockery.registerAllowable('../lib/donut-queue', true); // Allow our module under test to be loaded normally as well
        mockery.registerAllowable('../chess', true);
        // Chess = require('../lib/donut-queue');                 // Load your module under test
        chess = require('../chess');
        board = new chess.Board(); 
    });

    afterEach(function() {
        sandbox.verifyAndRestore(); // Verify all Sinon mocks have been honored
        mockery.deregisterAll();    // Deregister all Mockery mocks from node's module cache
    });

    after(function() {
        mockery.disable(); // Disable Mockery after tests are completed
    });

    describe('init', function() {
        it('should have the correct starting configuration', function() {
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pppppppp',
                '........',
                '........',
                '........',
                '........',
                'PPPPPPPP',
                'RNBKQBNR',
            ]));
        });
    });

    describe('isValidMove', function() {
        it('should allow pawns to move 2 squares on their first move', function() {
            assert(board.isValidMove(chess.WHITE, cMove(0, 1, 0, 3)));
        });

        it('should not allow players to control the opponents pieces', function() {
            assert(!board.isValidMove(chess.BLACK, cMove(0, 1, 0, 3)));
        });

        it('should allow knights to jump over pieces', function() {
            assert(board.isValidMove(chess.BLACK, cMove(1, 7, 2, 5)));
        });

        it('should allow players to take their own pieces', function() {
            assert(board.isValidMove(chess.BLACK, cMove(1, 7, 3, 6)));
        });

        it('should not allow players to move empty squares', function() {
            assert(!board.isValidMove(chess.WHITE, cMove(5, 5, 4, 4)));
        });

        it('should not allow rooks to move through pieces', function() {
            assert(!board.isValidMove(chess.WHITE, cMove(0, 0, 0, 2)));
        });

        // it('should throw an error when called with a non-object', function() {
        //     var badDonut = -1253434;
        //     assert().to.throw();
        // });

        // it('should call thatAPIMethod() on the donut when called', function() {
        //     donutQueue.push(stubbedDonut);
        //     stubbedDonut.thatAPIMethod.yields();
        //     assert(stubbedDonut.thatAPIMethod.calledOnce()).to.be.true();
        // });
    });
    
});