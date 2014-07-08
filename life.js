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

    function _filterNeighbor(neighbor) {
        return stateTable[neighbor[0]][neighbor[1]] ? true : false;
    }

    function recalcState() {
        // this function takes a lot of cpu
        var newStateTable = [];
        for (var x = 0; x < sizeX; x++) {
            var col = [];
            for (var y = 0; y < sizeY; y++) {
                var cAliveNeighbors = cellsNeighbors[x][y].filter(_filterNeighbor).length;
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
        var stateDiff = {newAlive: [], newDead: []};
        for (var x = 0; x < sizeX; x++) {
            for (var y = 0; y < sizeY; y++) {
                var cAliveNeighbors = cellsNeighbors[x][y].filter(_filterNeighbor).length;
                switch (cAliveNeighbors) {
                    case 2:  // state will not change
                        break;
                    case 3:  // dead will return alive
                        if (stateTable[x][y] === false) {
                            stateDiff.newAlive.push({x: x, y: y});
                        }
                        break;
                    default:  // alive will die
                        if (stateTable[x][y] === true) {
                            stateDiff.newDead.push({x: x, y: y});
                        }
                        break;
                }
            }
        }
        return stateDiff;
    }

    function applyDiffToStateTable(diff) {
        diff.newAlive.forEach(function(d) {
            stateTable[d.x][d.y] = true;
        });
        diff.newDead.forEach(function(d) {
            stateTable[d.x][d.y] = false;
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

    this.getBoardElems = function() {
        if (hasCanvas) {
            return [canvasBoard.baseEl, domBoard.baseEl];
        } else {
            return [domBoard.baseEl];
        }
    }

    this.getCellSize = function() {
        return cellSize;
    }

    this.getBoardSize = function() {
        return {x: sizeX, y: sizeY};
    }

    this.getDelay = function() {
        return delay;
    }

    this.getBoardEngine = function() {
        return board.boardType;
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

    var sizeX = args.sizeX || 200,
        sizeY = args.sizeY || 100,
        cellSize = args.cellSize === undefined ? {x: 5, y: 5} : args.cellSize,
        delay = typeof args.delay == "number" && args.delay >= 0 ? args.delay : 1000,
        hasCanvas = args.hasCanvas === undefined ? true : args.hasCanvas,
        stateTable = initStateTable(),
        cellsNeighbors = getCellsNeighbors(),
        canvasBoard = hasCanvas ? new CanvasBoard(sizeX, sizeY, cellSize) : null,
        domBoard = new DOMBoard(sizeX, sizeY, cellSize),
        board = !hasCanvas ? domBoard : args.boardType === "DOM" ? domBoard : canvasBoard,
        interval = 0,
        runs = false;
}


function createLifeElem(tag, attrs, insertNow) {
    var el = document.createElement(tag);

    for (var a in attrs) {
        el[a] = attrs[a];
    }

    if (insertNow) {
        var parent = document.getElementById("board");
        parent.insertBefore(el, parent.firstChild);
    }

    return el;
}


function BaseBoard() {
    this._init = function(sizeX, sizeY, cellSize) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.setCellSize(cellSize);
    }

    this.activate = function() {
        this.baseEl.style.display = "block";
    }

    this.deactivate = function() {
        this.baseEl.style.display = "none";
    }

    this.over = function() {
        var parent = document.getElementById("board");
        parent.removeChild(this.baseEl, parent.firstChild);
    }

    this._createBoard = function(tag, attrs) {
        var board = createLifeElem(tag, attrs || {}),
            parent = document.getElementById("board");
        board.style.display = "none";
        parent.insertBefore(board, parent.firstChild);
        return board;
    }

    this.switchTo = function(board) {
        this.deactivate();
        board.activate();
        return board;
    }

    this.setCellSize = function(size) {
        this.cellSize = size;
        this.width = size.x * this.sizeX + this.sizeX + 1;
        this.height = size.y * this.sizeY + this.sizeY + 1;
    }
}


function DOMBoard(sizeX, sizeY, cellSize) {
    var elTable = [];

    this.boardType = "DOM";

    this._init(sizeX, sizeY, cellSize);

    this.baseEl = this._createBoard("div", { id: "dom-board" });
    this.baseEl.style.width = this.width + "px";
    this.baseEl.style.height = this.height + "px";

    // this section takes a lot of time!
    (function(board) {
        var width = board.cellSize.x + "px",
            height = board.cellSize.y + "px";

        for (var y = 0; y < board.sizeY; y++) {
            var rowDiv = document.createElement("div");
            rowDiv.style.height = height;
            rowDiv.className = "row";
            for (var x = 0; x < board.sizeX; x++) {
                var cellDiv = document.createElement("div");
                cellDiv.style.width = width;
                cellDiv.style.height = height;
                cellDiv.className = "cell";
                rowDiv.appendChild(cellDiv);
                if (elTable[x] === undefined) {
                    elTable[x] = [];
                }
                elTable[x][y] = cellDiv;
            }
            board.baseEl.appendChild(rowDiv);
        }
    })(this);

    this.redraw = function(stateTable) {
        // high cpu load!
        stateTable.map(function(col, x) {
            col.map(function(v, y) {
                elTable[x][y].style.backgroundColor = v ? "black" : "white";
            });
        });
    }

    this.redrawDiff = function(diff) {
        // works faster than redrawing entire board
        diff.newAlive.forEach(function(d) {
            elTable[d.x][d.y].style.backgroundColor = "black";
        });
        diff.newDead.forEach(function(d) {
            elTable[d.x][d.y].style.backgroundColor = "white";
        });
    }

    this.redrawCellAsAlive = function(x, y) {
        elTable[x][y].style.backgroundColor = "black";
    }

    this.redrawCellAsDead = function(x, y) {
        elTable[x][y].style.backgroundColor = "white";
    }
}
DOMBoard.prototype = new BaseBoard();


function CanvasBoard(sizeX, sizeY, cellSize) {
    this.boardType = "Canvas";

    this._init(sizeX, sizeY, cellSize);

    this.baseEl = this._createBoard("canvas");
    this.baseEl.width = this.width;
    this.baseEl.height = this.height;
    
    var cx = this.baseEl.getContext("2d"),
        cellSizeX = this.cellSize.x,
        cellSizeY = this.cellSize.y;


    this.redraw = function(stateTable) {
        stateTable.map(function(col, x) {
            col.map(function(v, y) {
                cx.fillStyle = v ? "#000" : "#fff";
                cx.fillRect(x*6+1, y*6+1, cellSizeX, cellSizeY);
            });
        });
    }

    this.redrawDiff = function(diff) {
        cx.fillStyle = "#000";
        diff.newAlive.forEach(function(d) {
            cx.fillRect(d.x*6+1, d.y*6+1, cellSizeX, cellSizeY);
        });

        cx.fillStyle = "#fff";
        diff.newDead.forEach(function(d) {
            cx.fillRect(d.x*6+1, d.y*6+1, cellSizeX, cellSizeY);
        });

        // debug, check sizes
        // cx.fillStyle = "red";
        // cx.fillRect(sizeX * 6 - 6, sizeY * 6 - 6, 5, 5);
    }

    this.redrawCellAsAlive = function(x, y) {
        cx.fillStyle = "#000";
        cx.fillRect(x*6+1, y*6+1, cellSizeX, cellSizeY);
    }

    this.redrawCellAsDead = function(x, y) {
        cx.fillStyle = "#fff";
        cx.fillRect(x*6+1, y*6+1, cellSizeX, cellSizeY);
    }
}
CanvasBoard.prototype = new BaseBoard();


window.onload = function(ev) {
    // check the browser
    // IE 9 should ok
    var hasCanvas;
    if (
        typeof Array.prototype.map != "function"
        || typeof Array.prototype.filter != "function"
        || typeof Array.prototype.forEach != "function"
        || typeof Event.prototype.preventDefault != "function"
        || typeof document.querySelector != "function"
        || typeof document.querySelectorAll != "function"
        || !ev
        // check getters
        || (function() {
                try {
                    return !eval('({ get x() { return 1; } }).x === 1');
                } catch (e) {
                    return true;
                }
           })()
        // check setters
        || (function () {
                try {
                    var value;
                    eval('({ set x(v) { value = v; } }).x = 1');
                    return value !== 1;
                } catch (e) {
                    return true;
                }
            })()
    ) {
        createLifeElem("div", { className: "too-old", innerHTML: "ERROR: Your browser is too old!" }, true);
        return;
    } else if (typeof document.createElement("canvas").getContext != "function") {
        hasCanvas = false;
        document.getElementById("engine-dom").checked = true;
        document.getElementById("engine-canvas").disabled = true;
    } else {
        hasCanvas = true;
    }


    function startGame(firstInSession) {
        var w = 0,
            h = 0,
            delay = 0;

        if (view.ngFitVal) {
            // it has issue with scrolls so actually we subtract 3 lines
            w = parseInt(innerWidth / 6) - 3;
            h = parseInt(innerHeight / 6) - 3;
        } else if (firstInSession) {
            w = view.ngXVal;
            h = view.ngYVal;
        } else {
            w = view.ngXVal || game.getBoardSize().x;
            h = view.ngYVal || game.getBoardSize().y;
        }

        if (w * h > 50000) {
            if (!confirm("You are going to create a HUGE board ("+w*h+" cells). Are you sure?")) return;
        }

        if (firstInSession) {
            delay = view.delayVal;
        } else {
            delay = view.delayVal !== null ? view.delayVal : game.getDelay();
        }

        game = new LifeGame({
            sizeX: w,
            sizeY: h,
            boardType: view.engineVal,
            delay: delay,
            hasCanvas: hasCanvas
        });
        game.init();
        assignDrawCbsTo(game);
        if (view.runVal) {
            game.runLoop();
        }

        view.iBoardSize = game.getBoardSize();

        return game;
    }

    function assignDrawCbsTo(game) {
        function onclick(elem, ev, cb, preventDefault) {
            var cellSize = game.getCellSize(),
                rect = elem.getBoundingClientRect(),
                clickX = ev.clientX - rect.left - 2,
                clickY = ev.clientY - rect.top - 2,
                cellWithBorderX = cellSize.x + 1,
                cellWithBorderY = cellSize.y + 1;

            if (clickX % cellWithBorderX && clickY % cellWithBorderY) {
                var x = parseInt(clickX / cellWithBorderX),
                    y = parseInt(clickY / cellWithBorderY);

                cb(x, y);
            }

            if (preventDefault === true) {
                ev.preventDefault();
            }
        }

        game.getBoardElems().forEach(function(elem) {
            elem.onclick = function(ev) {
                onclick(elem, ev, game.markCellAlive);
            }
            elem.oncontextmenu = function(ev) {
                onclick(elem, ev, game.markCellDead, true);
            }
        });
    }


    // The view, according to MVC.
    // It deals with DOM for the panel.
    // The board do not utilize it.
    var view = {
        // Abbreviations:
        // - ng - new game
        // - i - info
        runInput:     document.getElementById("run"),
        delayInput:   document.getElementById("delay"),
        ngXInput:     document.getElementById("new-game-x"),
        ngYInput:     document.getElementById("new-game-y"),
        ngFitInput:   document.getElementById("new-game-fit"),
        ngStartInput: document.getElementById("new-game-start"),
        iStatusSpan:      document.querySelector("#info-status span"),
        iBoardSizeSpan:   document.querySelector("#info-board-size span"),
        iDelaySpan:       document.querySelector("#info-delay span"),
        iBoardEngineSpan: document.querySelector("#info-board-type span"),

        get engineInputs() {
            // converts into the real array
            var inputs = document.querySelectorAll('input[name="engine"]'),
                inputsArray = [];

            for (var i = 0; i < inputs.length; i++) {
                inputsArray.push(inputs[i]);
            }
            return inputsArray;
        },

        get engineCurrent() {
            return this.engineInputs.filter(function(input) {
                return input.checked;
            })[0];
        },

        get engineVal() {
            return this.engineCurrent.value;
        },

        // true - is running
        // false - is in pause
        get runVal() {
            return this.runInput.value === "Pause";
        },

        // state == true - launch
        // state == false - pause
        set runVal(state) {
            this.runInput.value = state ? "Pause" : "Run";
        },

        // returns intenger >= 0 or null
        get delayVal() {
            var val = parseInt(this.delayInput.value, 10);
            return val >= 0 ? val : null;  
        },

        // returns a positive intenger or null
        get ngXVal() {
            return parseInt(this.ngXInput.value, 10) || null;
        },

        // returns a positive intenger or null
        get ngYVal() {
            return parseInt(this.ngYInput.value, 10) || null;
        },

        enableNgSize: function() {
            this.ngXInput.disabled = this.ngYInput.disabled = false;
        },

        disableNgSize: function() {
            this.ngXInput.disabled = this.ngYInput.disabled = true;
        },

        get ngFitVal() {
            return this.ngFitInput.checked;
        },

        // status == true - running
        // status == false - paused
        set iStatus(status) {
            var elem = this.iStatusSpan;
            if (status) {
                elem.innerHTML = "running";
                elem.className = "green-text";
            } else {
                elem.innerHTML = "paused";
                elem.className = "red-text";
            }
        },

        set iBoardSize(size) {
            this.iBoardSizeSpan.innerHTML = size.x+"&#215;"+size.y;
        },

        set iDelay(delay) {
            var fps = 1000 / delay;
            this.iDelaySpan.innerHTML = delay+"&#8201;ms ("+fps.toFixed(2)+"&#8201;fps)";
        },

        set iBoardEngine(engineName) {
            this.iBoardEngineSpan.innerHTML = engineName;
        }
    }


    var game = startGame(true);
    view.iDelay = game.getDelay();
    view.iBoardEngine = game.getBoardEngine();

    view.engineInputs.forEach(function(input) {
        input.addEventListener("change", function() {
            if (input == view.engineCurrent) {
                game.setBoard(view.engineVal);
                view.iBoardEngine = game.getBoardEngine();
            }
        }, false);
    });

    view.runInput.addEventListener("click", function() {
        if (!view.runVal) {
            view.runVal = true;
            view.iStatus = true;
            game.runLoop();
        } else {
            view.runVal = false;
            view.iStatus = false;
            game.stopLoop();
        }
    }, false);

    view.delayInput.addEventListener("change", function() {
        if (view.delayVal !== null) {
            view.iDelay = view.delayVal;
            game.changeDelay(view.delayVal);
        }
    }, false);

    view.ngFitInput.addEventListener("change", function() {
        if (view.ngFitVal) {
            view.disableNgSize();
        } else {
            view.enableNgSize();
        }
    }, false);

    view.ngStartInput.addEventListener("click", function() {
        game.over();
        startGame();
    }, false);
}
