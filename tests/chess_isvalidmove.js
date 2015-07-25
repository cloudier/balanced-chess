/*jslint node: true, mocha: true*/
/* currently tests the following:
 * - setup and basic movement
 * - fights
 * - en pessant
 * - defend
 * - en pessant & defend
 * TODO
 * - intercepts
 * - castling
 */
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

	// MOVEMENT
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
        
        // FIGHTS
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

            // knight vs pawn. Knight should win.
            assert(board.makeMove(new chess.Move(4, 1, 4, 3), new chess.Move(1, 7, 2, 5)));
            res = board.makeMove(new chess.Move(4, 3, 4, 4), new chess.Move(2, 5, 4, 4));
            // assert(checkResult(res, )) not sure what "moves" means TODO
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pp.p.ppp',
                '........',
                '........',
                '....N...',
                '........',
                'PPP.PPPP',
                'R.BKQBNR',
           	]));

           	// knight vs bishop. Both should die.
           	assert(board.makeMove(new chess.Move(5, 0, 3, 2), new chess.Move(4, 4, 3, 2)));
           	// assert(check result) == fight
            assert(checkBoard(board.getBoard(), [
                'rnbkq.nr',
                'pp.p.ppp',
                '........',
                '........',
                '........',
                '........',
                'PPP.PPPP',
                'R.BKQBNR',
           	]));

            // bishop vs rook. Bishop should die.
            assert(board.makeMove(new chess.Move(0, 1, 0, 3), new chess.Move(4, 6, 4, 4)));
            assert(board.makeMove(new chess.Move(0, 0, 0, 2), new chess.Move(5, 7, 0, 2)));
           	// assert(check result) == fight
            assert(checkBoard(board.getBoard(), [
                '.nbkq.nr',
                '.p.p.ppp',
                'r.......',
                'p.......',
                '....P...',
                '........',
                'PPP..PPP',
                'R.BKQ.NR',
           	]));

           	// queen vs pawn. Pawn should die.
           	assert(board.makeMove(new chess.Move(4, 0, 4, 3), new chess.Move(4, 4, 4, 3)));
           	// assert(check result) == fight
            assert(checkBoard(board.getBoard(), [
                '.nbk..nr',
                '.p.p.ppp',
                'r.......',
                'p...q...',
                '........',
                '........',
                'PPP..PPP',
                'R.BKQ.NR',
           	]));

           	// queen vs bishop. Bishop should die.
           	assert(board.makeMove(new chess.Move(4, 3, 4, 5), new chess.Move(2, 7, 4, 5)));
           	// assert(check result) == fight
            assert(checkBoard(board.getBoard(), [
                '.nbk..nr',
                '.p.p.ppp',
                'r.......',
                'p.......',
                '........',
                '....q...',
                'PPP..PPP',
                'R..KQ.NR',
           	]));

           	// queen vs queen. Both should die.
           	assert(board.makeMove(new chess.Move(4, 5, 4, 6), new chess.Move(4, 7, 4, 6)));
           	// assert(check result) == fight
            assert(checkBoard(board.getBoard(), [
                '.nbk..nr',
                '.p.p.ppp',
                'r.......',
                'p.......',
                '........',
                '........',
                'PPP..PPP',
                'R..K..NR',
           	]));

           	// king vs pawn tests
           	assert(board.makeMove(new chess.Move(3, 1, 3, 3), new chess.Move(2, 6, 2, 4))); 
           	assert(board.makeMove(new chess.Move(3, 3, 3, 4), new chess.Move(2, 4, 2, 3))); 
           	assert(board.makeMove(new chess.Move(3, 4, 3, 5), new chess.Move(2, 3, 2, 2))); 
           	assert(board.makeMove(new chess.Move(3, 5, 3, 6), new chess.Move(3, 7, 4, 7))); 
            assert(checkBoard(board.getBoard(), [
                '.nbk..nr',
                '.p...ppp',
                'r.P.....',
                'p.......',
                '........',
                '........',
                'PPPp.PPP',
                'R...K.NR',
           	]));

            // king vs pawn at promotion square. King should win
            assert(board.makeMove(new chess.Move(3, 6, 3, 7), new chess.Move(4, 7, 3, 7))); 
            assert(checkBoard(board.getBoard(), [
                '.nbk..nr',
                '.p...ppp',
                'r.P.....',
                'p.......',
                '........',
                '........',
                'PPP..PPP',
                'R..K..NR',
           	]));

           	// king vs pawn at any other square. Pawn should win.
           	assert(board.makeMove(new chess.Move(3, 0, 2, 1), new chess.Move(2, 2, 2, 1))); 
            assert(checkBoard(board.getBoard(), [
                '.nb...nr',
                '.pP..ppp',
                'r.......',
                'p.......',
                '........',
                '........',
                'PPP..PPP',
                'R..K..NR',
           	]));

           	// knights try to take each other. Should dodge, not fight
            board = new chess.Board();
            assert(board.makeMove(new chess.Move(1, 0, 2, 2), new chess.Move(6, 7, 5, 5)));
            assert(board.makeMove(new chess.Move(2, 2, 3, 4), new chess.Move(7, 6, 7, 5)));
            assert(board.makeMove(new chess.Move(3, 4, 5, 5), new chess.Move(5, 5, 3, 4)));
            assert(checkBoard(board.getBoard(), [
                'r.bkqbnr',
                'pppppppp',
                '........',
                '........',
                '...N....',
                '.....n.P',
                'PPPPPPP.',
                'RNBKQB.R',
            ]));

        });
		
		// EN PESSANT
		it('should do en pessant correctly', function() {
            assert(board.makeMove(new chess.Move(2, 1, 2, 3), new chess.Move(5, 6, 5, 4)));
            assert(board.makeMove(new chess.Move(2, 3, 2, 4), new chess.Move(5, 4, 5, 3)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pp.ppppp',
                '........',
                '.....P..',
                '..p.....',
                '........',
                'PPPPP.PP',
                'RNBKQBNR',
            ]));
            // shouldn't allow en pessant without pawns to take
            assert(!board.isValidMove(chess.BLACK, new chess.Move(5, 3, 4, 2)));
            assert(!board.isValidMove(chess.BLACK, new chess.Move(5, 3, 6, 2)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(2, 4, 1, 5)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(2, 4, 3, 5)));

            assert(board.makeMove(new chess.Move(4, 1, 4, 3), new chess.Move(3, 6, 3, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pp.p.ppp',
                '........',
                '....pP..',
                '..pP....',
                '........',
                'PPP.P.PP',
                'RNBKQBNR',
            ]));

            // should allow en pessant on the side that advanced the pawn
            assert(board.isValidMove(chess.BLACK, new chess.Move(5, 3, 4, 2)));
            assert(!board.isValidMove(chess.BLACK, new chess.Move(5, 3, 6, 2)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(2, 4, 1, 5)));
            assert(board.isValidMove(chess.WHITE, new chess.Move(2, 4, 3, 5)));

            // shouldn't allow en pessant for other pawns, even if pawns are side by side
            assert(!board.isValidMove(chess.BLACK, new chess.Move(5, 3, 6, 2)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(2, 4, 1, 5)));

            assert(board.makeMove(new chess.Move(3, 4, 2, 3), new chess.Move(4, 3, 5, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                '.p.p.ppp',
                '........',
                'p...pP..',
                'P.pP....',
                '........',
                '.PP.P.PP',
                'RNBKQBNR',
            ]));

            // shouldn't allow en pessant anymore because a turn has passed
			assert(!board.isValidMove(chess.BLACK, new chess.Move(5, 3, 4, 2)));
            assert(!board.isValidMove(chess.WHITE, new chess.Move(2, 4, 3, 5)));

            assert(board.makeMove(new chess.Move(6, 1, 6, 3), new chess.Move(1, 6, 1, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                '.p.p.p.p',
                '........',
                'p...pPp.',
                'PPpP....',
                '........',
                '..P.P.PP',
                'RNBKQBNR',
            ]));

            // do the actual en pessant now
            assert(board.makeMove(new chess.Move(2, 4, 1, 5), new chess.Move(5, 3, 6, 2)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                '.p.p.p.p',
                '......P.',
                'p...p...',
                'P..P....',
                '.p......',
                '..P.P.PP',
                'RNBKQBNR',
            ]));

            // check that you can dodge en pessant
            assert(board.makeMove(new chess.Move(4, 3, 3, 4), new chess.Move(4, 6, 4, 4)));
            res = board.makeMove(new chess.Move(3, 4, 4, 5), new chess.Move(4, 4, 4, 3));
            //assert(checkResult(res, <DODGE ARGUMENTS GO HERE>)); TODO
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                '.p.p.p.p',
                '......P.',
                'p...P...',
                'P.......',
                '.p..p...',
                '..P...PP',
                'RNBKQBNR',
            ]));


        });

		// DEFEND
		it('should defend correctly', function() {
            assert(board.makeMove(new chess.Move(4, 1, 4, 3), new chess.Move(6, 7, 5, 5)));
            // defending when not attacked. Defending piece should die.
            assert(board.makeMove(new chess.Move(2, 0, 1, 1), new chess.Move(4, 6, 5, 5)));
            assert(checkBoard(board.getBoard(), [
                'rn.kqbnr',
                'pppp.ppp',
                '........',
                '....p...',
                '........',
                '.....N..',
                'PPPP.PPP',
                'RNBKQB.R',
            ]));

            // defending a piece that is attacked. Defending piece and attacking piece should die.
            // defended piece remains.
           	assert(board.makeMove(new chess.Move(4, 0, 4, 3), new chess.Move(5, 5, 4, 3)));
            assert(checkBoard(board.getBoard(), [
                'rn.k.bnr',
                'pppp.ppp',
                '........',
                '....p...',
                '........',
                '........',
                'PPPP.PPP',
                'RNBKQB.R',
            ]));

            // the king defends a piece not under attack. The king should remain.
           	assert(board.makeMove(new chess.Move(5, 0, 1, 4), new chess.Move(3, 7, 4, 7)));
            assert(checkBoard(board.getBoard(), [
                'rn.k..nr',
                'pppp.ppp',
                '........',
                '....p...',
                '.b......',
                '........',
                'PPPP.PPP',
                'RNB.KB.R',
            ]));


            // the king defends a piece that is under attack. The king should remain.
           	assert(board.makeMove(new chess.Move(1, 4, 3, 6), new chess.Move(4, 7, 3, 6)));
            assert(checkBoard(board.getBoard(), [
                'rn.k..nr',
                'pppp.ppp',
                '........',
                '....p...',
                '........',
                '........',
                'PPPK.PPP',
                'RNB..B.R',
            ]));
        });

		// DEFEND && EN PESSANT
		it('should pass this test about defending a piece attacked with en pessant', function() {
            assert(board.makeMove(new chess.Move(2, 1, 2, 3), new chess.Move(5, 6, 5, 4)));
            assert(board.makeMove(new chess.Move(2, 3, 2, 4), new chess.Move(5, 4, 5, 3)));
            assert(board.makeMove(new chess.Move(4, 1, 4, 3), new chess.Move(6, 7, 5, 5)));
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'pp.p.ppp',
                '........',
                '....pP..',
                '..p.....',
                '.....N..',
                'PPPPP.PP',
                'RNBKQB.R',
            ]));

            // Black pawn en pessants to take white pawn. White queen moves forward 2, to collide with black pawn.
            // Two things should happen. 
            // 1. the white pawn dies from en pessant
            // 2. the white queen and black pawn fight normally, and the black pawn dies.
            assert(board.makeMove(new chess.Move(4, 0, 4, 2), new chess.Move(5, 3, 4, 2)));
            assert(checkBoard(board.getBoard(), [
                'rnbk.bnr',
                'pp.p.ppp',
                '....q...',
                '........',
                '..p.....',
                '.....N..',
                'PPPPP.PP',
                'RNBKQB.R',
            ]));

			// White pawn en pessants to take black pawn. Black knight moves to defend the black pawn.
            // The white pawn should die from the defend. The black knight should die from doing the defending.
            assert(board.makeMove(new chess.Move(0, 1, 0, 2), new chess.Move(3, 6, 3, 4)));
            assert(board.makeMove(new chess.Move(2, 4, 3, 5), new chess.Move(5, 5, 3, 4)));
            assert(checkBoard(board.getBoard(), [
                'rnbk.bnr',
                '.p.p.ppp',
                'p...q...',
                '........',
                '...P....',
                '........',
                'PPPPP.PP',
                'RNBKQB.R',
            ]));
        });

		// INTERCEPTS
		it('should handle intercepts correctly', function() {
            assert(board.makeMove(new chess.Move(3, 1, 3, 3), new chess.Move(4, 6, 4, 4)));
            assert(board.makeMove(new chess.Move(3, 3, 3, 4), new chess.Move(7, 6, 7, 4)));	
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'ppp.pppp',
                '........',
                '........',
                '...pP..P',
                '........',
                'PPPP.PP.',
                'RNBKQBNR',
            ]));

            // white pawn moves up, intercepting black bishop. Black bishop should die
            assert(board.makeMove(new chess.Move(3, 4, 3, 5), new chess.Move(5, 7, 1, 3)));	
            assert(checkBoard(board.getBoard(), [
                'rnbkqbnr',
                'ppp.pppp',
                '........',
                '........',
                '....P..P',
                '...p....',
                'PPPP.PP.',
                'RNBKQ.NR',
            ]));

            // white bishop moves to intercept black rook at bot right
            assert(board.makeMove(new chess.Move(4, 1, 4, 3), new chess.Move(7, 4, 7, 3)));
			assert(board.makeMove(new chess.Move(2, 0, 7, 5), new chess.Move(7, 7, 7, 4)));
            assert(checkBoard(board.getBoard(), [
                'rn.kqbnr',
                'ppp..ppp',
                '........',
                '....p..P',
                '....P...',
                '...p...b',
                'PPPP.PP.',
                'RNBKQ.N.',
            ]));

            // white bishop should beat black queen on intercept
            assert(board.makeMove(new chess.Move(4, 0, 2, 2), new chess.Move(4, 7, 4, 5)));
            assert(board.makeMove(new chess.Move(5, 0, 2, 3), new chess.Move(4, 5, 1, 2)));
            assert(checkBoard(board.getBoard(), [
                'rn.k..nr',
                'ppp..ppp',
                '..q.....',
                '..b.p..P',
                '....P...',
                '...p...b',
                'PPPP.PP.',
                'RNBK..N.',
            ]));

            // pawn intercepts queen. pawn should die, queen should stop at where they collided
            assert(board.makeMove(new chess.Move(2, 3, 1, 2), new chess.Move(7, 3, 7, 2)));
            assert(board.makeMove(new chess.Move(2, 2, 2, 6), new chess.Move(2, 6, 2, 5)));
            assert(checkBoard(board.getBoard(), [
                'rn.k..nr',
                'ppp..ppp',
                '.bq....P',
                '....p...',
                '....P...',
                '..qp...b',
                'PP.P.PP.',
                'RNBK..N.',
            ]));

            // reset board. now for knight tests
            // knight paths are forward, forward, turn
            // pawn intercepts at square 1 of knight's path
            board = new chess.Board();
            assert(board.makeMove(new chess.Move(1, 0, 2, 2), new chess.Move(2, 6, 2, 4)));
            assert(board.makeMove(new chess.Move(2, 2, 3, 4), new chess.Move(2, 4, 2, 3)));
            assert(checkBoard(board.getBoard(), [
                'r.bkqbnr',
                'pppppppp',
                '........',
                '..P.....',
                '........',
                '........',
                'PP.PPPPP',
                'RNBKQBNR',
            ]));

            // pawn intercepts at square 2 of knight's path
            board = new chess.Board();
            assert(board.makeMove(new chess.Move(1, 0, 2, 2), new chess.Move(2, 6, 2, 5)));
            assert(board.makeMove(new chess.Move(2, 2, 3, 4), new chess.Move(2, 5, 2, 4)));
            assert(checkBoard(board.getBoard(), [
                'r.bkqbnr',
                'pppppppp',
                '........',
                '........',
                '..P.....',
                '........',
                'PP.PPPPP',
                'RNBKQBNR',
            ]));

            // pawn doesn't intercept path at all
            board = new chess.Board();
            assert(board.makeMove(new chess.Move(1, 0, 2, 2), new chess.Move(3, 6, 3, 4)));
            assert(board.makeMove(new chess.Move(2, 2, 3, 4), new chess.Move(3, 4, 3, 3))); // pawn intercepts
            assert(checkBoard(board.getBoard(), [
                'r.bkqbnr',
                'pppppppp',
                '........',
                '...P....',
                '...n....',
                '........',
                'PPP.PPPP',
                'RNBKQBNR',
            ]));
        });
		
    });
    
});