/*jslint node: true*/
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

    describe('isValidMove', function() {
        it('should allow pawns to move 2 squares on their first move', function() {
            var src = new chess.Pos(0, 1);
            var dst = new chess.Pos(0, 3);
            var move_w = new chess.Move(src, dst);
            assert(board.isValidMove(chess.WHITE, move_w));
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