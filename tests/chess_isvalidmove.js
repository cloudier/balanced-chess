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
 * Given the result object from chess.makeMove, res, compare
 * it against the provided booleans. Return false if any of
 * them do not match and true otherwise.
 */
function checkResult(res, wDodge, wInt, wMove, bDodge, bInt, bMove, fight) {
    if (res === false) return false;
    if (res.white.dodge !== wDodge) return false;
    if (res.white.intercept !== wInt) return false;
    if (res.white.moves !== wMove) return false;
    if (res.black.dodge !== bDodge) return false;
    if (res.black.intercept !== bInt) return false;
    if (res.black.moves !== bMove) return false;
    if (res.fight !== fight) return false;
    return true;
}

describe('chess', function() {
    
    before(function() {
        mockery.enable(); // Enable mockery at the start of your test suite
    });

    beforeEach(function() {
        // mockery.registerAllowable('async');                    // Allow some modules to be loaded normally
        // mockery.registerMock('../lib/donut', stubbedDonut);    // Register others to be replaced with our stub
        // mockery.registerAllowable('../lib/donut-queue', true); // Allow our module under test to be loaded normally as well
        mockery.registerAllowable('../common/chess', true);
        // Chess = require('../lib/donut-queue');                 // Load your module under test
        chess = require('../common/chess');
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
            assert(board.isValidMove(chess.WHITE, new chess.Move(0, 1, 0, 3)));
        });

        it('should not allow pawns to move 2 squares after it has already moved', function() {
            assert(board.makeMove(new chess.Move(0, 1, 0, 2), new chess.Move(0, 6, 0, 5)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                '.ppppppp',
                'p.......',
                '........',
                '........',
                'P.......',
                '.PPPPPPP',
                'RNBKQBNR',
            ]));
            assert(board.isValidMove(chess.WHITE, new chess.Move(0, 2, 0, 3)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(0, 2, 0, 4)));
        });

        it('should not allow players to control the opponents pieces', function() {
            assert(!board.isValidMove(chess.BLACK, new chess.Move(0, 1, 0, 3)));
        });

        it('should allow knights to jump over pieces', function() {
            assert(board.isValidMove(chess.BLACK, new chess.Move(1, 7, 2, 5)));
        });

        it('should allow players to take their own pieces', function() {
            assert(board.isValidMove(chess.BLACK, new chess.Move(1, 7, 3, 6)));
        });

        it('should not allow players to move empty squares', function() {
            assert(!board.isValidMove(chess.WHITE, new chess.Move(5, 5, 4, 4)));
        });

        it('should not allow rooks to move through pieces', function() {
            assert(!board.isValidMove(chess.WHITE, new chess.Move(0, 0, 0, 2)));
        });

        it('should not allow pawns to take diagonally unless there is a piece there', function() {
            assert(!board.isValidMove(chess.WHITE, new chess.Move(0, 1, 1, 2)));
            assert(!board.isValidMove(chess.BLACK, new chess.Move(0, 6, 1, 5)));
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

    describe('makeMove', function() {
        it('should correctly move non-interacting pieces', function() {
            assert(board.makeMove(new chess.Move(3, 1, 3, 3), new chess.Move(3, 6, 3, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'ppp.pppp',
                '........',
                '...p....',
                '...P....',
                '........',
                'PPP.PPPP',
                'RNBKQBNR',
            ]));

            assert(board.makeMove(new chess.Move(4, 0, 0, 4), new chess.Move(2, 7, 5, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbk.bnr',
                'ppp.pppp',
                '........',
                '...p....',
                'q..P.B..',
                '........',
                'PPP.PPPP',
                'RN.KQBNR',
            ]));

            assert(board.makeMove(new chess.Move(1, 0, 2, 2), new chess.Move(1, 7, 2, 5)));
            assert(checkBoard(board.getBoard(), [
                'r.bk.bnr',
                'ppp.pppp',
                '..n.....',
                '...p....',
                'q..P.B..',
                '..N.....',
                'PPP.PPPP',
                'R..KQBNR',
            ]));

            assert(board.makeMove(new chess.Move(7, 0, 7, 1), new chess.Move(3, 7, 3, 6)));
            assert(checkBoard(board.getBoard(), [
                'r.bk.bn.',
                'ppp.pppr',
                '..n.....',
                '...p....',
                'q..P.B..',
                '..N.....',
                'PPPKPPPP',
                'R...QBNR',
            ]));

            assert(board.makeMove(new chess.Move(7, 1, 7, 5), new chess.Move(3, 6, 4, 5)));
            assert(checkBoard(board.getBoard(), [
                'r.bk.bn.',
                'ppp.ppp.',
                '..n.....',
                '...p....',
                'q..P.B..',
                '..N.K..r',
                'PPP.PPPP',
                'R...QBNR',
            ]));
        });
        
        it('should correctly resolve fights', function() {
            assert(board.makeMove(new chess.Move(2, 1, 2, 3), new chess.Move(3, 6, 3, 4)));
            var res = board.makeMove(new chess.Move(2, 3, 3, 4), new chess.Move(3, 4, 2, 3));
            assert(checkResult(res, true, false, false, true, false, false, true));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pp.ppppp',
                '........',
                '........',
                '........',
                '........',
                'PPP.PPPP',
                'RNBKQBNR',
            ]));
        });
    });
    
});