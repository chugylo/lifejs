"use strict";

QUnit.module("Neighbors list");
QUnit.test("Check neighbors list length", function(assert) {
	var x = 10, y = 20
	  , neighbors = LifeGame.prototype._getCellsNeighbors(x, y);

	assert.equal(neighbors.length, x * y);
});
QUnit.test("Check cells neighbors", function(assert) {
	function index(x, y) {
		return x * sizeY + y;
	}

	var sizeX = 10, sizeY = 20
	  , neighbors = LifeGame.prototype._getCellsNeighbors(10, 20);

	// the order does not matter
	// we sort arrays to make the test order-independent
	assert.deepEqual(neighbors[index(0, 0)].sort(), [index(1, 1), index(0, 1), index(1, 0)].sort(), "Top left.");
	assert.deepEqual(neighbors[index(0, 4)].sort(), [index(0, 3), index(0, 5), index(1, 3), index(1, 4), index(1, 5)].sort(), "Left.");
	assert.deepEqual(neighbors[index(0, 19)].sort(), [index(0, 18), index(1, 18), index(1, 19)].sort(), "Bottom left.");
	assert.deepEqual(neighbors[index(4, 0)].sort(), [index(3, 0), index(3, 1), index(4, 1), index(5, 0), index(5, 1)].sort(), "Top.");
	assert.deepEqual(neighbors[index(4, 5)].sort(), [index(3, 4), index(3, 5), index(3, 6), index(4, 4), index(4, 6), index(5, 4), index(5, 5), index(5, 6)].sort(), "Non-border.");
	assert.deepEqual(neighbors[index(4, 19)].sort(), [index(3, 18), index(3, 19), index(4, 18), index(5, 18), index(5, 19)].sort(), "Bottom.");
	assert.deepEqual(neighbors[index(9, 0)].sort(), [index(8, 0), index(8, 1), index(9, 1)].sort(), "Top right.");
	assert.deepEqual(neighbors[index(9, 5)].sort(), [index(8, 4), index(8, 5), index(8, 6), index(9, 4), index(9, 6)].sort(), "Right.");
	assert.deepEqual(neighbors[index(9, 19)].sort(), [index(8, 18), index(8, 19), index(9, 18)].sort(), "Bottom right.");
});
