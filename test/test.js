// modern browsers only (IE10+)

"use strict";

// waiting for life.js to process
// :(
var LIFE = setInterval(function() {
	try {
		defineTests(LifeGame.game);
		clearInterval(LIFE);
	}
	catch(e) {}
}, 40);

function defineTests(game) {
	QUnit.module("Neighbors list");
	QUnit.test("Check neighbors list length", function(assert) {
		var x = 10, y = 20
		  , neighbors = game.fillCellsNeighbors(x, y);

		assert.equal(neighbors.length, x * y);
	});
}
