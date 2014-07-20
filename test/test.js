QUnit.module("Neighbors list");
QUnit.test("Check cells neighbors", function(assert) {
	var neighbors = LifeGame.prototype._getCellsNeighbors(10, 20);

	// the order does not matter
	// we sort arrays to make the test order-independent
	assert.deepEqual(neighbors[0][0].sort(), [[1, 1], [0, 1], [1, 0]].sort(), "Top left.");
	assert.deepEqual(neighbors[0][4].sort(), [[0, 3], [0, 5], [1, 3], [1, 4], [1, 5]].sort(), "Left.");
	assert.deepEqual(neighbors[0][19].sort(), [[0, 18], [1, 18], [1, 19]].sort(), "Bottom left.");
	assert.deepEqual(neighbors[4][0].sort(), [[3, 0], [3, 1], [4, 1], [5, 0], [5, 1]].sort(), "Top.");
	assert.deepEqual(neighbors[4][5].sort(), [[3, 4], [3, 5], [3, 6], [4, 4], [4, 6], [5, 4], [5, 5], [5, 6]].sort(), "Non-border.");
	assert.deepEqual(neighbors[4][19].sort(), [[3, 18], [3, 19], [4, 18], [5, 18], [5, 19]].sort(), "Bottom.");
	assert.deepEqual(neighbors[9][0].sort(), [[8, 0], [8, 1], [9, 1]].sort(), "Top right.");
	assert.deepEqual(neighbors[9][5].sort(), [[8, 4], [8, 5], [8, 6], [9, 4], [9, 6]].sort(), "Right.");
	assert.deepEqual(neighbors[9][19].sort(), [[8, 18], [8, 19], [9, 18]].sort(), "Bottom right.");
});
