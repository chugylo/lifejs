/*
 * Copyright 2014 chugylo
 * All rights reserved.
 * 
 * life.js - The clone of the Life Game.
 * Alpha version.
 */

function LifeGame(args) {
    function initStateTable() {
        // fill random 50% cells
        var stateTable = [];
        for (var x = 0; x < sizeX; x++) {
            var col = [];
            for (var y = 0; y < sizeY; y++) {
                col.push(Math.random() >= 0.5 ? true : false);
            }
            stateTable.push(col);
        }
        return stateTable;
    }

    function recalcState() {
        // this function takes a lot of cpu
        var newStateTable = [];
        for (var x = 0; x < sizeX; x++) {
            var col = [];
            for (var y = 0; y < sizeY; y++) {
                var cAliveNeighbors = cellsNeighbors[x][y].filter(function (neighbor) {
                    return stateTable[neighbor[0]][neighbor[1]] ? true : false;
                }).length;
                switch (cAliveNeighbors) {
                    case 2:  // alive will be alive, dead will not
                        col.push(stateTable[x][y]);
                        break;
                    case 3:  // alive will be alive, dead will be alive too
                        col.push(true);
                        break;
                    default:  // any other case leads to the death
                        col.push(false);
                        break;
                }
            }
            newStateTable.push(col);
        }
        return newStateTable;
    }

    function recalcStateToDiff() {
        // this function takes a lot of cpu
        var stateDiff = [];
        for (var x = 0; x < sizeX; x++) {
            for (var y = 0; y < sizeY; y++) {
                var cAliveNeighbors = cellsNeighbors[x][y].filter(function (neighbor) {
                    return stateTable[neighbor[0]][neighbor[1]] ? true : false;
                }).length;
                switch (cAliveNeighbors) {
                    case 2:  // state will not change
                        break;
                    case 3:  // dead will return alive
                        if (stateTable[x][y] === false) {
                            stateDiff.push({x: x, y: y, state: true});
                        }
                        break;
                    default:  // alive will die
                        if (stateTable[x][y] === true) {
                            stateDiff.push({x: x, y: y, state: false});
                        }
                        break;
                }
            }
        }
        return stateDiff;
    }

    function applyDiffToStateTable(diff) {
        diff.forEach(function(d) {
            stateTable[d.x][d.y] = d.state;
        });
    }

    function getCellsNeighbors() {
        var cellsNeighbors = [];
        for (var x = 0; x < sizeX; x++) {
            var col = [];
            for (var y = 0; y < sizeY; y++) {
                var neighbors = [[x-1, y-1], [x, y-1], [x+1, y-1], [x-1, y], [x+1, y], [x-1, y+1], [x, y+1], [x+1, y+1]];
                // overboard
                neighbors = neighbors.filter(function(neighbor) {
                    return (neighbor[0] > 0 && neighbor[0] < sizeX-1
                        && neighbor[1] > 0 && neighbor[1] < sizeY-1)
                        ? true : false;
                });
                col.push(neighbors);
            }
            cellsNeighbors.push(col);
        }
        return cellsNeighbors;
    }

    this.init = function () {
        board.activate();
        board.redraw(stateTable);
    }

    this.runLoop = function(newDelay) {
        // must be called after .init()
        // newDelay is a positive number or zero
        delay = newDelay === undefined ? delay : newDelay;
        runs = true;
        interval = setInterval(function() {
            var diff = recalcStateToDiff();
            applyDiffToStateTable(diff);
            board.redrawDiff(diff);
        }, delay);
    }

    this.stopLoop = function() {
        // must be called after .init()
        runs = false;
        clearInterval(interval);
    }

    this.changeDelay = function(newDelay) {
        // newDelay is a positive number or zero
        if (runs) {
            this.stopLoop();
            this.runLoop(newDelay);
        } else {
            delay = newDelay;
        }
    }

    this.setBoard = function(boardType) {
        if (!hasCanvas) return;

        var newBoard,
            memRuns = runs;

        if (runs) {
            this.stopLoop();
        }

        if (boardType === "Canvas") {
            newBoard = canvasBoard;
        } else if (boardType === "DOM") {
            newBoard = domBoard;
        }
        board = board.switchTo(newBoard);
        board.redraw(stateTable);

        if (memRuns) {
            this.runLoop(delay);
        }
    }

    this.getBoardEl = function() {
        return board.baseEl;
    }

    this.markCellAlive = function(x, y) {
        stateTable[x][y] = true;
        board.redrawCellAsAlive(x, y);
    }

    this.markCellDead = function(x, y) {
        stateTable[x][y] = false;
        board.redrawCellAsDead(x, y);
    }

    this.over = function() {
        this.stopLoop();
        if (hasCanvas) {
            canvasBoard.over();
        }
        domBoard.over();
    }

    var sizeX = args.sizeX === undefined ? 200 : args.sizeX,
        sizeY = args.sizeY === undefined ? 100 : args.sizeY,
        delay = args.delay === undefined ? 1000 : args.delay,
        hasCanvas = args.hasCanvas === undefined ? true : args.hasCanvas,
        stateTable = initStateTable(),
        cellsNeighbors = getCellsNeighbors(),
        canvasBoard = hasCanvas ? new CanvasBoard(sizeX, sizeY) : null,
        domBoard = new DOMBoard(sizeX, sizeY),
        board = !hasCanvas ? domBoard : args.boardType === "DOM" ? domBoard : canvasBoard;
        interval = 0,
        runs = false;
}


function createLifeElem(tag, attrs, insertNow) {
    var el = document.createElement(tag);

    for (var a in attrs) {
        el[a] = attrs[a];
    }

    if (insertNow) {
        var parent = document.getElementById("life");
        parent.insertBefore(el, parent.firstChild);
    }

    return el;
}


function BaseBoard() {
    this.activate = function() {
        this.baseEl.style.display = "block";
    }

    this.deactivate = function() {
        this.baseEl.style.display = "none";
    }

    this.over = function() {
        var parent = document.getElementById("life");
        parent.removeChild(this.baseEl, parent.firstChild);
    }

    this._createBoard = function(tag, attrs) {
        var board = createLifeElem(tag, attrs || {}),
            parent = document.getElementById("life");
        board.style.display = "none";
        parent.insertBefore(board, parent.firstChild);
        return board;
    }

    this.switchTo = function(board) {
        this.deactivate();
        board.activate();
        return board;
    }
}


function DOMBoard(sizeX, sizeY) {
    var elTable = [],
        width = sizeX * 6,
        height = sizeY * 6;

    this.boardType = "DOM";

    this.baseEl = this._createBoard("div", { id: "dom-board" });
    this.baseEl.style.width = width + "px";
    this.baseEl.style.height = height + "px";

    // this section takes a lot of cpu!
    for (var y = 0; y < sizeY; y++) {
        var rowDiv = document.createElement("div");
        for (var x = 0; x < sizeX; x++) {
            var cellDiv = document.createElement("div");
            rowDiv.appendChild(cellDiv);
            if (elTable[x] === undefined) {
                elTable[x] = [];
            }
            elTable[x][y] = cellDiv;
        }
        this.baseEl.appendChild(rowDiv);
    }

    this.redraw = function(stateTable) {
        // high cpu load!
        stateTable.map(function(col, x) {
            col.map(function(v, y) {
                elTable[x][y].className = v ? "alive" : "dead";
            });
        });
    }

    this.redrawDiff = function(diff) {
        // works faster than redrawing entire board
        diff.forEach(function(d) {
            elTable[d.x][d.y].className = d.state ? "alive" : "dead";
        });
    }

    this.redrawCellAsAlive = function(x, y) {
        elTable[x][y].className = "alive";
    }

    this.redrawCellAsDead = function(x, y) {
        elTable[x][y].className = "dead";
    }
}
DOMBoard.prototype = new BaseBoard();


function CanvasBoard(sizeX, sizeY) {
    this.boardType = "Canvas";

    this.baseEl = this._createBoard("canvas");
    this.baseEl.width = sizeX * 6;
    this.baseEl.height = sizeY * 6;
    
    var cx = this.baseEl.getContext("2d");

    this.redraw = function(stateTable) {
        stateTable.map(function(col, x) {
            col.map(function(v, y) {
                cx.fillStyle = v ? "#000" : "#fff";
                cx.fillRect(x*6, y*6, 5, 5);
            });
        });
    }

    this.redrawDiff = function(diff) {
        diff.forEach(function(d) {
            cx.fillStyle = d.state ? "#000" : "#fff";
            cx.fillRect(d.x*6, d.y*6, 5, 5);
        });

        // debug, check sizes
        // cx.fillStyle = "red";
        // cx.fillRect(sizeX * 6 - 6, sizeY * 6 - 6, 5, 5);
    }

    this.redrawCellAsAlive = function(x, y) {
        cx.fillStyle = "#000";
        cx.fillRect(x*6, y*6, 5, 5);
    }

    this.redrawCellAsDead = function(x, y) {
        cx.fillStyle = "#fff";
        cx.fillRect(x*6, y*6, 5, 5);
    }
}
CanvasBoard.prototype = new BaseBoard();


function getNumValFromInput(input) {
    // returns number value from input `input` what is >= 0 or null
    var val = input.value;
    if (val === "") return null;
    val = +val;  // cast to number
    if (val >= 0) {
        return val;
    }
    return null;
}


window.onload = function() {
    // check the browser
    // IE 9 should ok
    var hasCanvas;
    if (
        Array.prototype.map === undefined
        || Array.prototype.filter === undefined
        || Array.prototype.forEach === undefined
        || document.querySelectorAll === undefined
    ) {
        createLifeElem("div", { innerHTML: "Your browser is too old!" }, true);
        return;
    } else if (document.createElement("canvas").getContext === undefined) {
        hasCanvas = false;
        document.getElementById("engine-dom").checked = true;
        document.getElementById("engine-canvas").disabled = true;
    } else {
        hasCanvas = true;
    }

    var game = new LifeGame({ hasCanvas: hasCanvas }),
        qs = function(name) { return document.querySelector('input[name="'+name+'"]'); },
        engineInputs =  document.querySelectorAll('input[name="engine"]'),
        runInput =      qs("run"),
        delayInput =    qs("delay"),
        ngWidthInput =  qs("new-game-width"),
        ngHeightInput = qs("new-game-height"),
        ngFitInput =    qs("new-game-fit"),
        ngStartInput =  qs("new-game-start"),
        memDelay;  // memDelay is always a positive number or zero

    memDelay = getNumValFromInput(delayInput);
    memDelay = memDelay !== null ? memDelay : 1000;

    game.init();

    for (var i = 0; i < engineInputs.length; i++) {
        (function() {
            var inp = engineInputs[i];
            inp.onchange = function() {
                if (inp.checked) {
                    game.setBoard(inp.value);
                }
            }
        })();
    }

    runInput.onclick = function() {
        if (runInput.value === "Run") {
            runInput.value = "Pause";
            game.runLoop(memDelay);
        } else if (runInput.value === "Pause") {
            runInput.value = "Run";
            game.stopLoop();
        }
    }

    delayInput.onchange = function() {
        var val = getNumValFromInput(delayInput);
        if (val !== null) {
            memDelay = val;
            game.changeDelay(val);
        }

    }

    ngFitInput.onchange = function() {
        if (ngFitInput.checked) {
            ngWidthInput.disabled = ngHeightInput.disabled = true;
        } else {
            ngWidthInput.disabled = ngHeightInput.disabled = false;
        }
    }

    ngStartInput.onclick = function() {
        var w = 0,
            h = 0;

        if (ngFitInput.checked) {
            // it has issue with scrolls so actually we subtract 3 lines
            w = parseInt(innerWidth / 6) - 3,
            h = parseInt(innerHeight / 6) - 3;
        } else {
            w = getNumValFromInput(ngWidthInput),
            h = getNumValFromInput(ngHeightInput);
        }

        if (w !== null && w > 0 && h !== null && h > 0) {
            var boardType = "",
                run = runInput.value === "Run" ? false : true;

            for (var i = 0; i < engineInputs.length; i++) {
                if (engineInputs[i].checked) {
                    boardType = engineInputs[i].value;
                    break;
                }
            }

            game.over();
            game = new LifeGame({
                sizeX: w,
                sizeY: h,
                boardType: boardType,
                delay: memDelay,
                hasCanvas: hasCanvas
            });
            game.init();
            if (run) {
                game.runLoop();
            }
        }
    }

    document.onmousedown = function(ev) {
        if (ev.target == game.getBoardEl()) {
            if (ev.clientX % 6 && ev.clientY % 6) {
                var x = parseInt(ev.clientX / 6),
                    y = parseInt(ev.clientY / 6);

                if (ev.buttons === 1) {
                    game.markCellAlive(x, y);
                } else if (ev.buttons === 2) {
                    game.markCellDead(x, y);
                }
            }
        }
    }
}
