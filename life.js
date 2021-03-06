/*

  life.js - The clone of Conway's Game of Life that runs in the browser.
  
  version 1.1
  
  Copyright (c) 2014-2016 chugylo
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*/


// global var
var LifeGame = (function(module) {

// shortcuts
var getId = document.getElementById.bind(document)
  , qs = document.querySelector.bind(document)
  , qsa = document.querySelectorAll.bind(document)
  , el = document.createElement.bind(document);

var capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

// constants
var GOLDEN_RATIO_INVERSED = 0.6180341996797237;


/*
 * Benchmark.
 * Type `LifeGame.benchmark.run()` in the browser console.
 * Don't touch controls while benchmark is running.
 * It will perform 10 times for 250 generations and print result.
 */

var benchmark = {
    // startGame: null
  // , game: null
    push: function(ms) {
        this._list.push(250 / (ms / 1000));
        this._repeatCount++;
        console.log(this._repeatCount+"/"+this._repeatCountLim+" times repeated");
        this._time();
    }
  , run: function() {
        // clean up after previous run
        this._list = [];
        this._repeatCount = 0;

        console.log("Starting...");
        this._time();  // for first time
    }
  , _repeatCount: 0
  , _repeatCountLim: 10
  , _list: []
  , _time: function() {
        if (this._repeatCount < this._repeatCountLim) {
            gi.over();
            gi = startGame(makeOptions(true), true);
        } else {
            this._printResults();
        }
    }
    // arithmetic mean
  , _mean: function() {
        return this._list.reduce(function(sum, num) {
            return sum + num;
        }, 0) / this._list.length;
    }
  , _range: function() {
        return Math.max.apply(null, this._list) - Math.min.apply(null, this._list);
    }
  , _standardDeviation: function() {
        var meanVal = this._mean()
          , variance = this._list.reduce(function(sum, num) {
                return sum += Math.pow(num - meanVal, 2);
            }, 0) / this._list.length;

        return Math.sqrt(variance);
    }
    // coefficient of variation, %
  , _CV: function() {
        return this._standardDeviation() / this._mean() * 100;
    }
  , _format: function(num) {
        return num - parseInt(num) === 0 ? num : num.toFixed(4);
    }
  , _printResults: function() {
        console.log(
            "Result: "+
            "mean: "+this._format(this._mean())+
            "gps, CV: "+this._format(this._CV())+
            "%, range: "+this._format(this._range())
        );
    }
};


/*
 * The abstract core of the game.
 */
var game = {
    sizeX: 0
  , sizeY: 0
    // Neighbors & state table are 1-dimensional arrays
    // for make it awesome fast.
    // Indexes of these two match.
  , neighbors: []
  , stateTable: []

  , rules: null

    // we need a slim and fast code in here and therefore don't mess with
    // prototypes and constructors
  , init: function(sizeX, sizeY, rules, initialFilling) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;

        this.prepareRules(rules);
        this.initStateTable(initialFilling);
        this.fillCellsNeighbors();
        this.countNeighbors();
    }

    // explicit arguments and returning is for use only
    // when calling from a test suit
  , fillCellsNeighbors: function(sizeXParam, sizeYParam) {
        var x = 0, y = 0
          , neighbors = []
          , sizeX = typeof sizeXParam == "number" ? sizeXParam : this.sizeX
          , sizeY = typeof sizeYParam == "number" ? sizeYParam : this.sizeY;

        function filterOutOfRange(pos) {
            if (pos !== false) {
                neighbors.push(this.stateTable[pos]);
            }
        }

        this.neighbors = [];

        for (; x < sizeX; x++) {
            for (y = 0; y < sizeY; y++) {
                neighbors = [];
                [
                    this.XYToPosWithCheck(x - 1, y - 1)
                  , this.XYToPosWithCheck(x,     y - 1)
                  , this.XYToPosWithCheck(x + 1, y - 1)
                  , this.XYToPosWithCheck(x - 1, y    )
                  , this.XYToPosWithCheck(x + 1, y    )
                  , this.XYToPosWithCheck(x - 1, y + 1)
                  , this.XYToPosWithCheck(x,     y + 1)
                  , this.XYToPosWithCheck(x + 1, y + 1)
                ].forEach(filterOutOfRange, this);

                this.neighbors.push(neighbors);
            }
        }

        return this.neighbors;
    }

  , countNeighbors: function() {
        var pos = 0
          , count = 0
          , n = 0
          , neighbor = null;

        for (; pos < this.stateTable.length; pos++) {
            count = 0;
            neighbor = this.neighbors[pos];

            for (n = 0; n < neighbor.length; n++) {
                if (neighbor[n].c & 1) {
                    count++;
                }
            }

            this.stateTable[pos].c = (count << 1) | (this.stateTable[pos].c & 1);
        }
    }

  , fill: function(fn) {
        var pos = 0
          , cellCount = this.sizeX * this.sizeY;

        this.stateTable = [];

        for (; pos < cellCount; pos++) {
            this.stateTable.push( fn() );
        }
    }

  , initStateTable: function(initialFilling) {
        // Every cell is represented with a one number where:
        // - least significant bit -- is live
        // - other bits -- number of neighbors
        //
        // We wrap variables in object to make them referenceable.
        switch (initialFilling) {
            case "all-live":
                this.fill(function() {
                    return { c: 1 };
                });
                break;
            case "all-dead":
                this.fill(function() {
                    return { c: 0 };
                });
                break;
            default:
                this.fill(function() {
                    return Math.random() >= GOLDEN_RATIO_INVERSED ?
                        { c: 1 } : { c: 0 };
                });
                break;
        }
    }

  , prepareRules: function(rules) {
        var survival
          , willNotSurvive
          , willBirth
          , willNotSurviveLine
          , willBirthLine
          , js;

        // `.indexOf()` needs explicit type
        survival = rules.survival.map(function(val) {
            return typeof val == "number" ? val : parseInt(val, 10);
        });

        // we'll always get a list of pure numbers and therefore `eval()` will be safe
        willNotSurvive = [ 1, 3, 5, 7, 9, 11, 13, 15, 17 ].filter(function(val) {
            return survival.indexOf(val >> 1) === -1;
        });

        // << operator always return number and therefore `eval()` will be safe
        willBirth = rules.birth.map(function(val) {
            return val << 1;
        });

        if (willNotSurvive.length) {
            willNotSurviveLine = willNotSurvive.map(function(val) {
                return "cell == " + val;
            }).join(" || ");
        } else {  // every one survive
            willNotSurviveLine = "false";
        }

        if (willBirth.length) {
            willBirthLine = willBirth.map(function(val) {
                return "cell == " + val;
            }).join(" || ");
        } else {  // no one birth
            willBirthLine = "false";
        }

        // `recalcCells()` takes a lot of cpu!
        js = "this.recalcCells = function() {\n"
            +"    var pos, cell, diff = { newDead: [], newLive: [] };\n"
            +"    for (pos = 0; pos < this.stateTable.length; pos++) {\n"
            +"        cell = this.stateTable[pos].c;\n"
            +"        if (cell) {\n" // cell is alive and/or has neighbor(s)
            +"            if ("+willNotSurviveLine+") {\n"
            +"                diff.newDead.push(pos);\n"
            +"                cell ^= 1;\n"
            +"                this.stateTable[pos].c = cell;\n"
            +"            } else if ("+willBirthLine+") {\n"
            +"                diff.newLive.push(pos);\n"
            +"                cell ^= 1;\n"
            +"                this.stateTable[pos].c = cell;\n"
            +"            }\n"
            +"        }\n"
            +"    }\n"
            +"    return diff;\n"
            +"}\n";

         eval(js);  // jshint ignore: line
    }

  , recalc: function() {
        var diff
          , i = 0
          , j = 0
          , pos = 0
          , neighbor = null;

        // recalc cells to their new states
        diff = this.recalcCells(this.stateTable);

        // recalc neighbors' live neighbor count
        for (i = 0; i < diff.newDead.length; i++) {
            pos = diff.newDead[i];
            neighbor = this.neighbors[pos];

            for (j = 0; j < neighbor.length; j++) {
                // decrement on the second binary position
                neighbor[j].c -= 2;
            }
        }
        for (i = 0; i < diff.newLive.length; i++) {
            pos = diff.newLive[i];
            neighbor = this.neighbors[pos];

            for (j = 0; j < neighbor.length; j++) {
                // increment on the second binary position
                neighbor[j].c += 2;
            }
        }

        return diff;
    }

  , setState: function(state, x, y) {
        var pos = this.XYToPos(x, y)
          , i = 0
          , neighbor = this.neighbors[pos];

        this.stateTable[pos].c ^= 1;
        for (; i < neighbor.length; i++) {
            // increment or decrement on second binary position
            neighbor[i].c += state ? 2 : -2;
        }

        return pos;
    }

  , setDead: function(x, y) {
        return this.setState(false, x, y);
    }

  , setLive: function(x, y) {
        return this.setState(true, x, y);
    }

  , getState: function(x, y) {
        return this.stateTable[ this.XYToPos(x, y) ].c & 1;
    }

  , XYToPos: function(x, y) {
        return x * this.sizeY + y;
    }

  , XYToPosWithCheck: function(x, y) {
        if (
               x < 0
            || y < 0
            || x >= this.sizeX
            || y >= this.sizeY
        ) {
            return false;
        } else {
            return x * this.sizeY + y;
        }
    }
};


/*
 * Make current instance of the game.
 */
function GameInstance(view, args, isBenchmark) {

    function renewView() {
        generation++;
        view.iGeneration = generation;
        view.renewCellInfo();
    }

    function renewViewAfterStop() {
        view.iStatus = false;
        view.cycleVal = false;
    }

    this.runOne = function() {
        board.redrawDiff(game.recalc());
        renewView();
    };

    this.init = function () {
        benchmarkTimestamp = new Date;
        board.activate();
        board.redraw(game.stateTable);
        renewView();
    };

    // must be called after .init()
    // newPeriod is a positive number or zero
    this.runCycle = function(newPeriod) {
        period = newPeriod === undefined ? period : newPeriod;

        function onTime() {
            if (pauseAfter === null || pauseAfter >= generation + 1) {
                this.runOne();
            } else {
                this.stopLoop();
                renewViewAfterStop();
                if (pauseFromCurrent) {
                    this.clearPauseAfter();
                }
            }
        }
        onTime = onTime.bind(this);

        if (typeof pauseAfter == "number" && pauseAfter < generation + 1) {
            renewViewAfterStop();
            return;
        }
        runs = true;
        interval = setInterval(onTime, period);
    };

    // must be called after .init()
    this.stopLoop = function(printBenchmarkParam) {
        var printBenchmark = (printBenchmarkParam || printBenchmarkParam === undefined) ? true : false;

        if (isBenchmark && printBenchmark) {
            benchmark.push(new Date - benchmarkTimestamp);
        }

        runs = false;
        clearInterval(interval);
    };

    // newPeriod is a positive number or zero
    this.changePeriod = function(newPeriod) {
        if (runs) {
            this.stopLoop();
            this.runCycle(newPeriod);
        } else {
            period = newPeriod;
        }
    };

    this.setBoard = function(boardType) {
        if (!hasCanvas) {
            return;
        }

        var newBoard
          , memRuns = runs;

        if (runs) {
            this.stopLoop();
        }

        if (boardType === "Canvas") {
            newBoard = canvasBoard;
        } else if (boardType === "DOM") {
            newBoard = domBoard;
        }
        board = board.switchTo(newBoard);
        if (board.cellSize.x !== cellSize.x || board.cellSize.y !== cellSize.y) {
            board.changeCellSize(cellSize);
        }
        board.redraw(game.stateTable);

        if (memRuns) {
            this.runCycle();
        }
    };

    this.getBoardElems = function() {
        if (hasCanvas) {
            return [canvasBoard.baseEl, domBoard.baseEl];
        } else {
            return [domBoard.baseEl];
        }
    };

    this.isRunning = function() {
        return runs;
    };

    this.getCellSize = function() {
        return cellSize;
    };

    this.getBoardSize = function() {
        return { x: sizeX, y: sizeY };
    };

    this.getPeriod = function() {
        return period;
    };

    this.getBoardEngine = function() {
        return board.boardType;
    };

    this.getStateForCell = function(x, y) {
        return game.getState(x, y);
    };

    this.getGeneration = function() {
        return generation;
    };

    this.pauseAfter = function(generation, fromCurrent) {
        pauseFromCurrent = fromCurrent ? fromCurrent : false;
        pauseAfter = generation;
    };

    this.clearPauseAfter = function() {
        pauseAfter = null;
    };

    this.changeCellSize = function(newSize) {
        cellSize = { x: newSize, y: newSize };
        board.changeCellSize(cellSize);
        if (board.boardType == "Canvas") {
            board.redraw(game.stateTable);
        }
    };

    this.markCellLive = function(x, y) {
        // prevent wrong neighbor counting
        if (this.getStateForCell(x, y)) {
            return;
        }
        var pos = game.setLive(x, y);
        board.redrawCellAsLive(pos);
    };

    this.markCellDead = function(x, y) {
        // prevent wrong neighbor counting
        if (!this.getStateForCell(x, y)) {
            return;
        }
        var pos = game.setDead(x, y);
        board.redrawCellAsDead(pos);
    };

    this.drawPen = function(type, x, y) {
        board.drawPen(type, x, y);
    };

    this.cancelPen = function() {
        board.cancelPen();
    };

    this.over = function() {
        this.stopLoop(false);
        if (hasCanvas) {
            canvasBoard.over();
        }
        domBoard.over();
        generation = 1;
    };

    var sizeX = args.sizeX
      , sizeY = args.sizeY
      , cellSize = { x: args.cellSize, y: args.cellSize }
      , period = args.period
      , hasCanvas = args.hasCanvas
      , rules = args.rules
      , initialFilling = args.initialFilling
      , canvasBoard = args.hasCanvas ? new CanvasBoard(sizeX, sizeY, cellSize) : null
      , domBoard = new DOMBoard(sizeX, sizeY, cellSize)
      , board = !hasCanvas ? domBoard : args.boardType === "DOM" ? domBoard : canvasBoard
      , interval = 0
      , runs = false
      , generation = 0
      , pauseAfter = args.pauseAfter
      , pauseFromCurrent = false
      , benchmarkTimestamp = null;

    game.init(sizeX, sizeY, rules, initialFilling);
}


function createLifeElem(tag, attrs, insertNow) {
    var elem = el(tag)
      , a, parent;

    for (a in attrs) {
        elem[a] = attrs[a];
    }

    if (insertNow) {
        parent = getId("board");
        parent.insertBefore(elem, parent.firstChild);
    }

    return elem;
}


var BaseBoard = function() {
    this._init = function(sizeX, sizeY, cellSize) {
        this.pen = getId("pen");
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.setCellSize(cellSize);
    };

    this.activate = function() {
        this.baseEl.style.display = "block";
    };

    this.deactivate = function() {
        this.baseEl.style.display = "none";
    };

    this.over = function() {
        var parent = getId("board");
        parent.removeChild(this.baseEl);
    };

    this._createBoard = function(tag, attrs) {
        var board = createLifeElem(tag, attrs || {})
          , parent = getId("board");

        board.style.display = "none";
        parent.insertBefore(board, parent.firstChild);
        return board;
    };

    this.switchTo = function(board) {
        this.deactivate();
        board.activate();
        return board;
    };

    this.setCellSize = function(size) {
        this.cellSize = size;
        this.width = size.x * this.sizeX + this.sizeX + 1;
        this.height = size.y * this.sizeY + this.sizeY + 1;
        this.pen.style.width = size.x + "px";
        this.pen.style.height = size.y + "px";
    };

    this.drawPen = function(type, x, y) {
        var boardStyle = getComputedStyle(getId("board"))
          , colorMap = {
                writer: "black"
              , eraser: "white"
              , inert: "gray"
          };

        this.pen.style.backgroundColor = colorMap[type];
        this.pen.style.top = 1 + this.cellSize.y * y + y
            + parseInt(boardStyle.getPropertyValue("padding-top"), 10)
            + "px";
        this.pen.style.left = 1 + this.cellSize.x * x + x
            + parseInt(boardStyle.getPropertyValue("padding-left"), 10)
            + "px";
        this.pen.style.display = "block";
    };

    this.cancelPen = function() {
        this.pen.style.display = "none";
    };
};


// draw a board on a huge tree of DOM elements
// slow, use Canvas what is much faster
var DOMBoard = function(sizeX, sizeY, cellSize) {
    var elTable = []
      , cellCount = sizeX * sizeY
      , baseElIsFilled = false;

    this.boardType = "DOM";

    this._init(sizeX, sizeY, cellSize);

    this.baseEl = this._createBoard("div", { id: "dom-board" });
    this.baseEl.style.width = this.width + "px";
    this.baseEl.style.height = this.height + "px";

    // the function takes a lot of cpu
    this._fillBaseEl = function() {
        var width = this.cellSize.x + "px"
          , height = this.cellSize.y + "px"
          , y = 0, x = 0
          , rowDiv
          , cellDiv;

        for (; y < this.sizeY; y++) {
            rowDiv = el("div");
            rowDiv.style.height = height;
            rowDiv.className = "row";
            for (x = 0; x < this.sizeX; x++) {
                cellDiv = el("div");
                cellDiv.style.width = width;
                cellDiv.style.height = height;
                cellDiv.className = "cell";
                rowDiv.appendChild(cellDiv);
                elTable[ x * sizeY + y ] = cellDiv;
            }
            this.baseEl.appendChild(rowDiv);
        }

        baseElIsFilled = true;
    };

    // the function takes a lot of cpu
    this.changeCellSize = function(cellSize) {
        var width = cellSize.x+"px"
          , height = cellSize.y+"px"
          , rows = document.getElementsByClassName("row")
          , cells = document.getElementsByClassName("cell")
          , r = rows.length
          , c = cells.length;

        this.setCellSize(cellSize);
        this.baseEl.style.width = this.width+"px";
        this.baseEl.style.height = this.height+"px";

        for (; r--;) {
            rows[r].style.height = height;
        }
        for (; c--;) {
            cells[c].style.height = height;
            cells[c].style.width = width;
        }
    };

    this.redraw = function(stateTable) {
        // we fill base element at actual first draw but not at init
        // to prevent wasting cpu if current board is canvas
        if (!baseElIsFilled) {
            this._fillBaseEl();
        }

        for (var i = 0; i < cellCount; i++) {
            elTable[i].style.backgroundColor = stateTable[i].c & 1 ? "black" : "white";
        }
    };

    // the function takes a lot of cpu
    this.redrawDiff = function(diff) {
        var i = 0
          , newLive = diff.newLive
          , newDead = diff.newDead
          , newLiveLen = newLive.length
          , newDeadLen = newDead.length;

        for (; i < newLiveLen; i++) {
            elTable[ newLive[i] ].style.backgroundColor = "black";
        }
        for (i = 0; i < newDeadLen; i++) {
            elTable[ newDead[i] ].style.backgroundColor = "white";
        }
    };

    this.redrawCellAsLive = function(pos) {
        elTable[pos].style.backgroundColor = "black";
    };

    this.redrawCellAsDead = function(pos) {
        elTable[pos].style.backgroundColor = "white";
    };
};
DOMBoard.prototype = new BaseBoard();


// draw a board in a <canvas> tag
var CanvasBoard = function(sizeX, sizeY, cellSize) {
    this.boardType = "Canvas";

    this._init(sizeX, sizeY, cellSize);

    this.baseEl = this._createBoard("canvas");
    this.baseEl.width = this.width;
    this.baseEl.height = this.height;
    
    var cx = this.baseEl.getContext("2d")
      , cellSizeX = this.cellSize.x
      , cellSizeY = this.cellSize.y
      , cellCount = sizeX * sizeY
      , cellMap = [];

    cx.fillStyle = "#aea";
    cx.fillRect(0, 0, this.width, this.height);

    function calcCellMap() {
        var map = [];
        for (var pos = 0; pos < cellCount; pos++) {
            map.push({
                x: Math.floor(pos / sizeY) * (cellSizeX + 1) + 1
              , y: pos % sizeY * (cellSizeY + 1) + 1
            });
        }
        return map;
    }

    cellMap = calcCellMap();

    this.changeCellSize = function(cellSize) {
        this.setCellSize(cellSize);
        this.baseEl.width = this.width;
        this.baseEl.height = this.height;
        cellSizeX = this.cellSize.x;
        cellSizeY = this.cellSize.y;
        cellMap = calcCellMap();
    };

    this.redraw = function(stateTable) {
        for (var i = 0; i < cellCount; i++) {
            cx.fillStyle = stateTable[i].c & 1 ? "black" : "white";
            cx.fillRect(cellMap[i].x, cellMap[i].y, cellSizeX, cellSizeY);
        }
    };

    // the function takes a lot of cpu
    this.redrawDiff = function(diff) {
        var i = 0
          , newLive = diff.newLive
          , newDead = diff.newDead
          , newLiveLen = newLive.length
          , newDeadLen = newDead.length;

        cx.fillStyle = "black";
        for (; i < newLiveLen; i++) {
            cx.fillRect(cellMap[ newLive[i] ].x, cellMap[ newLive[i] ].y, cellSizeX, cellSizeY);
        }

        cx.fillStyle = "white";
        for (i = 0; i < newDeadLen; i++) {
            cx.fillRect(cellMap[ newDead[i] ].x, cellMap[ newDead[i] ].y, cellSizeX, cellSizeY);
        }
    };

    this.redrawCellAsLive = function(pos) {
        cx.fillStyle = "black";
        cx.fillRect(cellMap[pos].x, cellMap[pos].y, cellSizeX, cellSizeY);
    };

    this.redrawCellAsDead = function(pos) {
        cx.fillStyle = "white";
        cx.fillRect(cellMap[pos].x, cellMap[pos].y, cellSizeX, cellSizeY);
    };
};
CanvasBoard.prototype = new BaseBoard();


var I18n = function() {
    var lang = document.getElementsByTagName("html")[0].getAttribute("lang") || "en"
      , _ = {}
      , key = ""
      , line = "";

    if (!LifeGame.lang.en) {
        createLifeElem("div", { className: "bad-lang", innerHTML: "ERROR: Can't load language! Try to reload the page." }, true);
        throw new Error();
    }

    // standard language is always English
    for (key in LifeGame.lang.en) {
        line = LifeGame.lang[lang][key] ? LifeGame.lang[lang][key] : LifeGame.lang.en[key];
        _[key] = line;
    }

    return _;
};
I18n.fillPage = function(_) {
    function qsAll(query) {
        var id = query.split(" ")[0]
          , tag = query.split(" ")[1];

        return getId(id).querySelectorAll(tag);
    }

    function prepend(elem, text) {
        elem.innerHTML = text + elem.innerHTML;
    }

    function append(elem, text) {
        elem.innerHTML = elem.innerHTML + text;
    }

    function prependId(idAttr, text) {
        prepend(getId(idAttr), text);
    }

    function appendId(idAttr, text) {
        append(getId(idAttr), text);
    }

    var step, paFromLabels, newGameLabels, fillingOptions, engineLabels;

    document.getElementsByTagName("title")[0].innerHTML = _.title;
    document.getElementsByTagName("h1")[0].innerHTML = _.header;

    qs("#info-panel h4").innerHTML = _.pInfo;
    prependId("info-status", _.piStatus);
    qs("#info-status span").innerHTML = _.piStatusStopped;
    prependId("info-generation", _.piGeneration);
    prependId("info-cell-info", _.piCellInfo);
    qs("#info-cell-info span").innerHTML = _.piCellInfoEmpty;
    prependId("info-period", _.piPeriod);
    prependId("info-board-size", _.piBoardSize);
    prependId("info-cell-size", _.piCellSize);
    prependId("info-rules", _.piRules);
    prependId("info-mouse-stroke", _.piMouseStroke);
    prependId("info-board-type", _.piBoardEngine);
    getId("cycle").value = _.pCycle;
    getId("one").value = _.pOne;
    step = qs("#flow-control-panel label");
    step.innerHTML = _.pStep + step.innerHTML + _.pStepMs;

    appendId("pa-stop-label", _.pPaStop);
    appendId("pa-generations-label", _.pPaGenerations);
    paFromLabels = qsAll("pa-from label");
    append(paFromLabels[0], _.pPaBeginning);
    append(paFromLabels[1], _.pPaCurrent);

    prepend(qs("#change-size-panel label"), _.pCellSize);
    append(qs("#change-size-panel label"), _.pPx);

    prepend(qs("#mouse-stroke label"), _.pMouseStroke);
    append(qsAll('mouse-stroke label')[0], _.pFree);
    append(qsAll('mouse-stroke label')[1], _.pStraight);

    qs("#new-game-panel h4").innerHTML = _.pNewGame;
    newGameLabels = qsAll("new-game-panel label");
    prepend(newGameLabels[0], _.pBoardSize);
    append(newGameLabels[2], _.pFit);
    prepend(newGameLabels[3], _.pRules);
    prepend(newGameLabels[4], _.pFilling);
    fillingOptions = qsAll("new-game-filling option");
    fillingOptions[0].innerHTML = _.pGolden;
    fillingOptions[1].innerHTML = _.pAllDead;
    fillingOptions[2].innerHTML = _.pAllLive;
    getId("new-game-start").value = _.pStart;
    qs("#board-engine-panel h4").innerHTML = _.pBoardEngine;
    engineLabels = qsAll("board-engine-panel label");
    append(engineLabels[0], _.pCanvasEngine);
    append(engineLabels[1], _.pDOMEngine);
    engineLabels[0].setAttribute("title", _.pCanvasEngineTitle);
    engineLabels[1].setAttribute("title", _.pDOMEngineTitle);
    getId("save").innerHTML = _.pSave;
    getId("tip-panel").innerHTML = _.pTip;
    getId("whatsit-panel").innerHTML = _.pWhatsit;

    appendId("footer", _.rights);

    getId("lang-en").setAttribute("title", _.langEnTitle);
    getId("lang-uk").setAttribute("title", _.langUkTitle);

    if (location.href.match(/#help$/i)) {  // URL with #help, switch to help page
        qs("#game a").innerHTML = _.game;
        qs("#game a").style.display = "inline";
        qs("#help").innerHTML = _.help;
    } else {
        qs("#game").innerHTML = _.game;
        qs("#help a").innerHTML = _.help;
        qs("#help a").style.display = "inline";
    }
};


var CookieStorage = function(view) {
    // attach new elements to the end of `saveMap`, when upgrading,
    // to preserve backward compatibility
    var saveMap = [
            "period"
          , "paSwitch"
          , "paGenerations"
          , "paFrom"
          , "cellSize"
          , "ngX"
          , "ngY"
          , "ngFit"
          , "ngFilling"
          , "engine"
          , "ngRules"
          , "pen"
          , "mouseStroke"
        ]
      , loadMap = [
            function(v) {
                view.periodVal = v;
                view.iPeriod = v;
            }
          , function(v) {
                view.paSwitchVal = !!+v;
            }
          , function(v) {
                view.paGenerationsVal = v;
            }
          , function(v) {
                view.paFromVal = v;
            }
          , function(v) {
                view.changeSizeVal = v;
                view.iCellSize = v;
            }
          , function(v) {
                view.ngXVal = v;
            }
          , function(v) {
                view.ngYVal = v;
            }
          , function(v) {
                view.ngFitVal = !!+v;
            }
          , function(v) {
                view.ngFillingVal = v;
            }
          , function(v) {
                view.engineVal = v;
                view.iBoardEngine = v;
            }
          , function(v) {
                v = v || "23/3";  // default
                view.ngRulesStrVal = v;
                view.iRules = v;
            }
          , function() {}  // do nothing
          , function(v) {
                view.mouseStrokeVal = view.iMouseStroke = parseInt(v, 10);
            }
        ];    

    // we look for backward compatibility
    function upgradeScheme(cookie) {
        var oldLen = cookie.split("|").length
          , newLen = saveMap.length
          , diff = newLen - oldLen
          , result = cookie
          , i = 0;

        if (diff > 0) {
            // wonder if name of cookie is defined but body (part after =) isn't
            if (oldLen === 0) {
                result = "";
                for (; i < newLen - 1; i++) {
                    result += "|";
                }
                return result;
            }
            for (; i < diff; i++) {
                result += "|";
            }
            return result;
        }

        return result;
    }

    this.save = function(key, value) {
        var myCookie = ""
          , myCookieArr = []
          , parts = saveMap.length;

        document.cookie.split(";").forEach(function(cookie) {
            var cookieParts = cookie.replace(/^\s+|\s+$/g, "").split("=")
              , upgradedCookie;

            if (cookieParts[0] == "lifegame") {
                upgradedCookie = upgradeScheme(cookieParts[1]);
                myCookie = upgradedCookie.split("|").map(function(current, index) {
                    return saveMap[index] == key && value !== null ? value : current;
                }).join("|");
            }
        });
        if (!myCookie) {  // create new cookie
            for (; parts--;) {
                myCookieArr[parts] = saveMap[parts] == key ? value : "";
            }
            myCookie = myCookieArr.join("|");
        }
        myCookie = "lifegame="+myCookie+";expires="+new Date(0x7fffffff * 1000).toUTCString();
        document.cookie = myCookie;
    };

    this.load = function(setting) {
        var settingsArr = []
          , cookieParts = []
          , settingInd = -1
          , result = ""
          , i = 0;

        document.cookie.split(";").forEach(function(cookie) {
            cookieParts = cookie.replace(/^\s+|\s+$/g, "").split("=");
            if (cookieParts[0] == "lifegame") {
                settingsArr = cookieParts[1].split("|");
            }
        });
        if (settingsArr.length) {

            // load and return only one setting
            // do not call the function in `loadMap`
            if (setting) {
                settingInd = saveMap.indexOf(setting);
                if (settingInd >= 0) {
                    result = settingsArr[settingInd];
                    if (result) {
                        this._setIsFromStorage(setting);
                        return result;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }

            for (i = settingsArr.length; i--;) {
                if (settingsArr[i].length) {
                    loadMap[i]( settingsArr[i] );
                    this._setIsFromStorage( saveMap[i] );
                }
            }

            // in case of index is undefined we catch and do nothing
            try {
                if (settingsArr[5].length && settingsArr[6].length) {
                    view.iBoardSize = { x: settingsArr[5], y: settingsArr[6] };
                }
            } catch (e) {}

            // set up rules anyway
            loadMap[10]( settingsArr[10] );
        }
    };

    this._fromStorage = [];

    this.isFromStorage = function(setting) {
        return this._fromStorage.indexOf(setting) >= 0 ? true : false;
    };

    this._setIsFromStorage = function(setting) {
        this._fromStorage.push(setting);
    };
};


// do nothing when tests're running
if (!getId("board") || !getId("panel")) {
    return {
        game: game
      , bresenham: bresenham
    };
}

var hasCanvas;
if (typeof document.createElement("canvas").getContext != "function") {
    hasCanvas = false;
    document.getElementById("engine-dom").checked = true;
    document.getElementById("engine-canvas").disabled = true;
} else {
    hasCanvas = true;
}


function unFitWindow() {
    var board = getId("board");
    document.body.style.overflow = "";
    board.style.paddingLeft = "";
    board.style.paddingTop = "";
}

function getTargetGeneration() {
    var target = view.paGenerationsVal
      , from = view.paFromVal;

    if (!view.paSwitchVal) {
        return null;
    }

    if (from == "current") {
        target += gi ? gi.getGeneration() : 1;
    }
    return target;
}

function makeOptions(asBenchmark) {
    var options = {}
      , board = getId("board")
      , hugeBoardLim = 50000;

    function calcOptimalBoardSize() {
        var
            // cell sizes + cell border sizes (1px every internal + 2px external) + board border sizes (2px)
            challengerWidth = view.changeSizeVal + 2 + 2
          , rect = document.documentElement.getBoundingClientRect()
          , left = rect.left
          , right = rect.right
          , targetWidth = (Math.abs(left)+right) * GOLDEN_RATIO_INVERSED
          , oneCellWidth = view.changeSizeVal + 1
          , x = 1, y = 0;

        while (challengerWidth - oneCellWidth / 2 < targetWidth) {
            challengerWidth += oneCellWidth;
            x++;
        }
        y = Math.round(x * GOLDEN_RATIO_INVERSED);

        return { x: x, y: y };
    }

    function convertRulesToArray(rulesStr) {
        if (!rulesStr) {
            return null;
        }
        var rules = rulesStr.split("/");
        return { survival: rules[0].split(""), birth: rules[1].split("") };
    }

    function fitBoardSize() {
        // we ignore any form and cookie data on using `Fit to window`

        var clientWidth, clientHeight, paddingLeft, paddingTop;

        // we must style the page before getting its size
        document.body.style.overflow = "hidden";

        clientWidth = document.documentElement.clientWidth;
        clientHeight = document.documentElement.clientHeight;
        paddingLeft = Math.floor((clientWidth - 3) % (options.cellSize + 1) / 2);
        paddingTop = Math.floor((clientHeight - 3) % (options.cellSize + 1) / 2);

        board.style.paddingLeft = paddingLeft+"px";
        board.style.paddingTop = paddingTop+"px";
        
        options.sizeX = Math.floor((clientWidth - 3) / (options.cellSize + 1));
        options.sizeY = Math.floor((clientHeight - 3) / (options.cellSize + 1));

        alert(_.fitAlert);

        view.cycleVal = true;
        view.iStatus = true;
    }

    function boardSize() {
        // 100:62 -- golden ratio

        var optimalBoardSize
          , cellCount;

        if (view.ngFitVal) {
            fitBoardSize();
            return;
        } else if (this.firstRun) {
            // if cookies are empty, calculate an optimal board size
            if (!cookie.isFromStorage("ngX") || !cookie.isFromStorage("ngY")) {
                optimalBoardSize = calcOptimalBoardSize();
                cookie.save("ngX", optimalBoardSize.x);
                cookie.save("ngY", optimalBoardSize.y);
            }
            if (!cookie.isFromStorage("ngX")) {
                options.sizeX = view.ngXVal = optimalBoardSize.x;
            } else {
                options.sizeX = view.ngXVal || 100;
            }
            if (!cookie.isFromStorage("ngY")) {
                options.sizeY = view.ngYVal = optimalBoardSize.y;
            } else {
                options.sizeY = view.ngYVal || 62;
            }
        } else {
            options.sizeX = view.ngXVal || cookie.load("ngX") || 100;
            options.sizeY = view.ngYVal || cookie.load("ngY") || 62;
        }

        cellCount = options.sizeX * options.sizeY;
        if (cellCount > hugeBoardLim) {
            if (!confirm(_.hugeConfirm1+cellCount+_.hugeConfirm2)) {
                optimalBoardSize = calcOptimalBoardSize();
                cookie.save("ngX", optimalBoardSize.x);
                cookie.save("ngY", optimalBoardSize.y);
                options.sizeX = view.ngXVal = optimalBoardSize.x;
                options.sizeY = view.ngYVal = optimalBoardSize.y;
            }
        }
    }

    options.cellSize = view.changeSizeVal || 7;
    boardSize();
    options.boardType = view.engineVal;
    options.period = asBenchmark ?
        0 : view.periodVal || cookie.load("period") || 1000;
    options.initialFilling = view.ngFillingVal;
    options.hasCanvas = hasCanvas;
    options.pauseAfter = asBenchmark ?
        251 : getTargetGeneration();
    options.rules = view.ngRulesVal || convertRulesToArray(cookie.load("ngRules")) || "23/3";

    makeOptions.prototype.firstRun = false;

    return options;
}
makeOptions.prototype.firstRun = true;

function startGame(options, asBenchmark) {
    var gi = new GameInstance(view, options, asBenchmark);

    gi.init();
    assignCbsTo(gi);
    if (view.cycleVal || view.ngFitVal || asBenchmark) {
        gi.runCycle();
    }

    view.iBoardSize = gi.getBoardSize();

    benchmark.game = gi;

    return gi;
}

// Bresenham's line algorithm
function bresenham(x0, y0, x1, y1) {
    var dx
      , ix
      , dy
      , iy
      , err
      , e2
      , list = [];

    dx = Math.abs(x1 - x0);
    ix = x0 < x1 ? 1 : -1;
    dy = Math.abs(y1 - y0);
    iy = y0 < y1 ? 1 : -1;
    err = (dx > dy ? dx : -dy) / 2;
 
    for (;;) {
        list.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) {
            break;
        }
        e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += ix;
        }
        if (e2 < dy) {
            err += dx;
            y0 += iy;
        }
    }

    return list;
}

// user interaction with boards
function assignCbsTo(gi) {
    var firstPoint = null
      , backupPoints = []
      // cache board coordinates and try not to waste cpu if `mousemove` event
      // happen on the same cell
      , cachedCoords = {}
      , infoCachedCoords = {}
      , actualMouseStrokeType
      , freeStrokeD, straightStrokeD;

    // get mouse event and return game instance's coords
    // or null on borders
    function evToCoords(ev) {
        var cellSize = gi.getCellSize()
          , boardSize = gi.getBoardSize()
          , rect = ev.target.getBoundingClientRect()
          , clickX = ev.clientX - rect.left - 1
          , clickY = ev.clientY - rect.top - 1
          , cellWithBorderX = cellSize.x + 1
          , cellWithBorderY = cellSize.y + 1
          , x, y;

        if (clickX % cellWithBorderX && clickY % cellWithBorderY) {
            x = Math.floor(clickX / cellWithBorderX);
            y = Math.floor(clickY / cellWithBorderY);

            if (x < boardSize.x && y < boardSize.y) {
                return { x: x, y: y };
            }
        }

        return null;
    }

    function updateInfo(ev, coordsParam) {
        var coords = coordsParam !== undefined ? coordsParam : evToCoords(ev);

        if (coords !== null) {
            if (coords.x === infoCachedCoords.x && coords.y === infoCachedCoords.y) {
                return;
            }
            var state = gi.getStateForCell(coords.x, coords.y);
            view.iCellInfo = { state: "in", x: coords.x, y: coords.y, cellState: state };
            view.mouseAboveState = { isActive: true, x: coords.x, y: coords.y };
            infoCachedCoords = coords;
        } else {
            view.iCellInfo = { state: "border" };
            view.mouseAboveState = { isActive: false };
        }
    }

    function strokeDecor(fn) {
        var coords;

        function wrapper(ev) {
            infoCachedCoords = {};

            if (!gi.isRunning()) {
                coords = evToCoords(ev);
                // is not on a border and is not cached
                if (coords && !(coords.x === cachedCoords.x && coords.y === cachedCoords.y)) {
                    fn(coords, cachedCoords, ev.buttons || ev.button);
                    cachedCoords = coords;
                }

                updateInfo(ev, coords);
            } else {
                updateInfo(ev);
            }
        }

        return wrapper;
    }

    function changeCell(x, y, buttons) {
        // left click
        if (buttons & 1) {
            gi.markCellLive(x, y);
        // right click
        // we use else-if, right click will be ignored if pressed both buttons
        } else if (buttons & 2) {
            gi.markCellDead(x, y);
        }
    }

    function freeStroke(coords, cachedCoords, buttons) {
        var x = coords.x, y = coords.y;

        // delegate forward
        if (   cachedCoords.x !== undefined
            && cachedCoords.y !== undefined
            && (   Math.abs(cachedCoords.x - x) > 1
                || Math.abs(cachedCoords.y - y) > 1
                )
            ) {
            firstPoint = cachedCoords;
            straightStroke(coords, null, buttons, true);
            firstPoint = null;
        }

        changeCell(x, y, buttons);
    }
    freeStrokeD = strokeDecor(freeStroke);

    function getBackChanged() {
        var i = 0;
        for (; i < backupPoints.length; i++) {
            if (backupPoints[i].state) {
                gi.markCellLive(backupPoints[i].x, backupPoints[i].y);
            } else {
                gi.markCellDead(backupPoints[i].x, backupPoints[i].y);
            }
        }
    }

    function makeBackup(list, buttons) {
        var i = 0
          , state;

        backupPoints = [];

        for (; i < list.length; i++) {
            state = gi.getStateForCell(list[i].x, list[i].y);
            if (buttons & 1 && !state || buttons & 2 && state) {
                list[i].state = state;
                backupPoints.push(list[i]);
            }
        }
    }

    function straightStroke(coords, cachedCoords, buttons, woBackup) {
        var i = 0
          , list;

        if (firstPoint === null) {
            firstPoint = coords;
        }

        list = bresenham(firstPoint.x, firstPoint.y, coords.x, coords.y);

        if (!woBackup) {
            getBackChanged();
            makeBackup(list, buttons);
        }

        for (; i < list.length; i++) {
            changeCell(list[i].x, list[i].y, buttons);
        }
    }
    straightStrokeD = strokeDecor(straightStroke);

    gi.getBoardElems().forEach(function(elem) {
        elem.oncontextmenu = function(ev) {
            ev.preventDefault();
        };
        elem.onmouseenter = function() {
            elem.onmousemove = updateInfo;
            elem.onmousedown = function(ev) {
                // Cache the value of `mouseStrokeType`.
                // Change of type should only happen on completed plotting
                // process (unpressed mouse button).
                actualMouseStrokeType = mouseStrokeType;
                if (actualMouseStrokeType) {
                    straightStrokeD(ev);
                    elem.onmousemove = straightStrokeD;
                } else {
                    freeStrokeD(ev);
                    elem.onmousemove = freeStrokeD;
                }
            };
            elem.onmouseup = function() {
                elem.onmousemove = updateInfo;
                cachedCoords = {};
                if (actualMouseStrokeType) {
                    firstPoint = null;
                    backupPoints = [];
                }
            };
        };
        elem.onmouseleave = function() {
            elem.onmousemove = null;
            view.iCellInfo = { state: "out" };
            view.mouseAboveState = { isActive: false };
        };
    });
}


var _ = I18n();
I18n.fillPage(_);


// The view, according to MVC.
// It deals with DOM for the panel.
// The board does not utilize it.
var view = {
    // Abbreviations:
    // - ng - new game
    // - i - info
    // - pa - pause after
    cycleInput:         getId("cycle")
  , oneInput:           getId("one")
  , periodInput:        getId("period")
  , paSwitchInput:      getId("pa-switch")
  , paGenerationsInput: getId("pa-generations")
  , paFromInputs:       qsa('input[name="pause-after"]')
  , changeSizeInput:    getId("change-size")
  , mouseStrokeInputs:  qsa('input[name="mouse-stroke"]')
  , ngXInput:           getId("new-game-x")
  , ngYInput:           getId("new-game-y")
  , ngFitInput:         getId("new-game-fit")
  , ngRules:            getId("new-game-rules")
  , ngFilling:          getId("new-game-filling")
  , ngStartInput:       getId("new-game-start")
  , iStatusSpan:        qs("#info-status span")
  , iGenerationSpan:    qs("#info-generation span")
  , iCellInfoSpan:      qs("#info-cell-info span")
  , iBoardSizeSpan:     qs("#info-board-size span")
  , iCellSizeSpan:      qs("#info-cell-size span")
  , iPeriodSpan:        qs("#info-period span")
  , iRulesSpan:         qs("#info-rules span")
  , iMouseStrokeSpan:   qs("#info-mouse-stroke span")
  , iBoardEngineSpan:   qs("#info-board-type span")

    // cached position of the mouse for renew Cell Info at every board redraw
  , mouseAboveState: { isActive: false }

  , getRadioVal: function(inputs) {
        var i = 0;

        while (inputs[i]) {
            if (inputs[i].checked) {
                return inputs[i].value;
            }
            i++;
        }
    }

  , get engineInputs() {
        // converts into the real array
        var inputs = qsa('input[name="engine"]')
          , inputsArray = []
          , i = 0;

        for (; i < inputs.length; i++) {
            inputsArray.push( inputs[i] );
        }
        return inputsArray;
    }

  , get engineCurrent() {
        return this.engineInputs.filter(function(input) {
            return input.checked;
        })[0];
    }

  , get engineVal() {
        return this.engineCurrent.value;
    }

  , set engineVal(value) {
        qs('[name="engine"][value="'+value+'"]').checked = true;
    }

    // true - is running
    // false - is in pause
  , get cycleVal() {
        return this.cycleInput.getAttribute("data-state") == "running";
    }

    // state == true - launch
    // state == false - pause
  , set cycleVal(state) {
        this.cycleInput.setAttribute("data-state", state ? "running" : "paused");
        this.cycleInput.value = state ? _.pPause : _.pCycle;
    }

  , get periodVal() {
        var val = parseInt(this.periodInput.value, 10);
        return val >= 0 && val <= 3600000 ? val : null;
    }

  , set periodVal(value) {
        this.periodInput.value = value;
    }

  , get paSwitchVal() {
        return this.paSwitchInput.checked;
    }

  , set paSwitchVal(value) {
        this.paSwitchInput.checked = value;
    }

  , get paGenerationsVal() {
        // it's identical to the new game's X and Y values currently
        var val = parseInt(this.paGenerationsInput.value, 10);
        return val > 0 && val < 10000 ? val : null;
    }

  , set paGenerationsVal(value) {
        this.paGenerationsInput.value = value;
    }

  , get paFromVal() {
        return this.getRadioVal(this.paFromInputs);
    }

  , set paFromVal(value) {
        qs('[name="pause-after"][value="'+value+'"]').checked = true;
    }

  , get changeSizeVal() {
        return parseInt(this.changeSizeInput.value, 10);
    }

  , set changeSizeVal(value) {
        this.changeSizeInput.value = value;
    }

  , get mouseStrokeVal() {
        return this.getRadioVal(this.mouseStrokeInputs) == "free" ? 0 : 1;
    }

  , set mouseStrokeVal(value) {
        value = value ? "straight" : "free";
        qs('[name="mouse-stroke"][value="'+value+'"]').checked = true;
    }

  , _ngSizeVal: function(input) {
        var val = parseInt(input.value, 10);
        return val > 0 && val < 10000 ? val : null;
    }

  , get ngXVal() {
        return this._ngSizeVal(this.ngXInput);
    }

  , set ngXVal(value) {
        this.ngXInput.value = value;
    }

  , get ngYVal() {
        return this._ngSizeVal(this.ngYInput);
    }

  , set ngYVal(value) {
        this.ngYInput.value = value;
    }

  , enableNgSize: function() {
        this.ngXInput.disabled = this.ngYInput.disabled = false;
    }

  , disableNgSize: function() {
        this.ngXInput.disabled = this.ngYInput.disabled = true;
    }

  , get ngFitVal() {
        return this.ngFitInput.checked;
    }

  , set ngFitVal(value) {
        this.ngFitInput.checked = value;
    }

  , _rulesFormat: /^\s*([0-8]{0,9})\s*\/\s*([0-8]{0,9})\s*$/

  , get ngRulesVal() {
        var result = { survival: [], birth: [] }
          , parsed = this._rulesFormat.exec(this.ngRules.value);

        if (parsed) {
            // filter for unique values and sort
            result.survival = parsed[1].split("").filter(function(val, ind, self) {
                return self.indexOf(val) == ind;
            }).sort();
            result.birth = parsed[2].split("").filter(function(val, ind, self) {
                return self.indexOf(val) == ind;
            }).sort();
            return result;
        } else {
            return null;
        }
    }

  , get ngRulesStrVal() {
        var rules = this.ngRulesVal;

        return rules !== null ?
            rules.survival.join("") +"/"+ rules.birth.join("") : null;
    }

  , set ngRulesVal(value) {
        this.ngRules.value = value.survival.join("") +"/"+ value.birth.join("");
    }

  , set ngRulesStrVal(value) {
        this.ngRules.value = value;
    }

  , get ngFillingVal() {
        return this.ngFilling.value;
    }

  , set ngFillingVal(value) {
        qs('#new-game-filling option[value="'+value+'"]').selected = true;
    }

    // status == true - running
    // status == false - paused
  , set iStatus(status) {
        var elem = this.iStatusSpan;
        if (status) {
            elem.innerHTML = _.piStatusRunning;
            elem.className = "green-text";
        } else {
            elem.innerHTML = _.piStatusPaused;
            elem.className = "red-text";
        }
    }

    // 1000000 => "1 000 000"
    // for non-negative integer numbers only
  , _format: function(num) {
        var unformatted = String(num)
          , len = unformatted.length
          , begin = len - 1
          , end = len
          , position = 0
          , result = "";

        for (; begin >= 0; begin--, end--, position++) {
            if (position && !(position % 3)) {
                result = "&#8201;" + result;
            }
            result = unformatted.slice(begin, end) + result;
        }
        return result;
    }

  , set iGeneration(generation) {
        this.iGenerationSpan.innerHTML = this._format(generation);
    }

  , set iCellInfo(info) {
        var baseElem = this.iCellInfoSpan;

        switch (info.state) {
            case "in":
                var stateSpan = el("span")
                  , stateText = info.cellState ? _.piCellInfoLive : _.piCellInfoDead;

                stateSpan.className = info.cellState ? "green-text" : "red-text";
                stateSpan.innerHTML = stateText;

                baseElem.className = "";
                baseElem.innerHTML = "x="+info.x+", y="+info.y+", ";
                baseElem.appendChild(stateSpan);
                break;
            case "out":
                baseElem.className = "italic-text";
                baseElem.innerHTML = _.piCellInfoEmpty;
                break;
            case "border":
                baseElem.className = "italic-text";
                baseElem.innerHTML = _.piCellInfoBorder;
                break;
        }
    }

  , renewCellInfo: function() {
        if (this.mouseAboveState.isActive) {
            var x = this.mouseAboveState.x
              , y = this.mouseAboveState.y;

            this.iCellInfo = { state: "in", x: x, y: y, cellState: gi.getStateForCell(x, y) };
        }
    }

  , set iBoardSize(size) {
        var cellC = this._format(size.x * size.y);
        this.iBoardSizeSpan.innerHTML = size.x+"&#215;"+size.y+" ("+cellC+"&#8201;"+_.piCells+")";
    }

  , set iCellSize(size) {
        this.iCellSizeSpan.innerHTML = size+"&#215;"+size+"&#8201;"+_.pPx;
    }

  , set iPeriod(period) {
        var gps = 1000 / period;
        this.iPeriodSpan.innerHTML = period+"&#8201;"+_.piMs+" ("+gps.toFixed(2)+"&#8201;"+_.piGps+")";
    }

  , set iRules(rules) {
        this.iRulesSpan.innerHTML = rules;
    }

  , set iMouseStroke(type) {
        this.iMouseStrokeSpan.innerHTML = type ? _.piStraight : _.piFree;
    }

  , set iBoardEngine(engineName) {
        this.iBoardEngineSpan.innerHTML = engineName;
    }
};


function cycleRun() {
    if (!view.cycleVal) {
        view.cycleVal = true;
        view.iStatus = true;
        if (view.paSwitchVal) {
            gi.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
        }
        gi.runCycle();
    } else {
        view.cycleVal = false;
        view.iStatus = false;
        gi.stopLoop();
    }
}

function oneRun() {
    if (view.cycleVal) {
        view.cycleVal = false;
        view.iStatus = false;
        gi.stopLoop();
    }
    gi.runOne();
}

var isHelpPage = location.href.match(/#help$/i);
function toggleHelp() {
    if (isHelpPage) {
        helpOff();
    } else {
        helpOn();
    }
    isHelpPage = !isHelpPage;
}

function helpOn() {
    getId("game-wrapper").style.display = "none";
    getId("help-wrapper").style.display = "block";
    getId("game").innerHTML = '<a href="#game">'+_.game+'</a>';
    qs("#game a").style.display = "inline";
    qs("#game a").addEventListener("click", function() {
        toggleHelp();
    });
    getId("help").innerHTML = _.help;
}

function helpOff() {
    getId("game-wrapper").style.display = "block";
    getId("help-wrapper").style.display = "none";
    getId("game").innerHTML = _.game;
    getId("help").innerHTML = '<a href="#help">'+_.help+'</a>';
    qs("#help a").style.display = "inline";
    qs("#help a").addEventListener("click", function() {
        toggleHelp();
    });
}


if (isHelpPage) {
    helpOn();
}

var cookie = new CookieStorage(view);
cookie.load();


var gi = startGame(makeOptions());


var pen = {
    pens: [ "writer", "eraser", "inert" ]
  , x: null
  , y: null
  , getCoords: function() {
        var fromCookies = cookie.load("pen")
          , parsed;

        function parseCookieFormat(s) {
            return {
                x: parseInt(s.split("/")[0], 10)
              , y: parseInt(s.split("/")[1], 10)
            };
        }

        function processLimits(challenger) {
            var boardSize = gi.getBoardSize();
            if (   challenger === null
                || challenger.x >= boardSize.x
                || challenger.y >= boardSize.y) {
                this.x = boardSize.x / 2;
                this.y = boardSize.y / 2;
                cookie.save("pen", this.x+"/"+this.y);
                return { x: this.x, y: this.y };
            }
            return challenger;
        }

        if (fromCookies) {
            parsed = parseCookieFormat(fromCookies);
            this.x = parsed.x;
            this.y = parsed.y;
            return processLimits(parsed);
        } else if (this.x !== null && this.y !== null) {
            return processLimits({ x: this.x, y: this.y });
        } else {
            return processLimits(null);
        }
    }
    // true means down, false means up
  , writerState: false
  , eraserState: false
  , inertState: false
  , draw: function(pen, coordsParam, onlyMark) {
        var coords = coordsParam || this.getCoords();
        // on several drawings at once in order to skip momental DOM work
        if (!onlyMark) {
            gi.drawPen(pen, coords.x, coords.y);
        }
        switch (pen) {
            case "writer":
                gi.markCellLive(coords.x, coords.y);
                break;
            case "eraser":
                gi.markCellDead(coords.x, coords.y);
                break;
        }
        this[pen+"State"] = true;
    }
  , cancel: function(pen) {
        gi.cancelPen();
        this[pen+"State"] = false;
    }
  , rerun: function() {
        var i, pen;
        for (i in this.pens) {
            pen = this.pens[i];
            if (this[pen+"State"]) {
                this.draw(pen);
            }
        }
    }
  , _mv: function(coordsFn) {
        var coords, i, j, activePen, lastCoords;
        if (this.writerState || this.eraserState || this.inertState) {
            coords = this.getCoords();
            coords = coordsFn(coords);
            if (coords.length) {
                for (i = 0; i < coords.length; i++) {
                    for (j in this.pens) {
                        if (this[this.pens[j]+"State"]) {
                            activePen = this.pens[j];
                            break;
                        }
                    }
                    this.draw(activePen, coords[i], i < coords.length - 1);
                }
                lastCoords = coords.pop();
                this.x = lastCoords.x;
                this.y = lastCoords.y;
                cookie.save("pen", lastCoords.x+"/"+lastCoords.y);
                return true;
            }
        }
        return false;
    }
  , getAffectedCoords: function(coords, key, increment, mul10, filterOutOfRange) {
        var i, result = [];
        for (i = 0; i < (mul10 ? 10 : 1); i++) {
            if (filterOutOfRange(coords.x, coords.y)) {
                coords[key] += increment ? 1 : -1;
                result.push({ x: coords.x, y: coords.y });
            } else {
                break;
            }
        }
        return result;
    }
  , mvLeft: function(shiftPressed) {
        var self = this;
        return this._mv(function(coords) {
            return self.getAffectedCoords(coords, "x", false, shiftPressed, function(x) {
                return x > 0;
            });
        });
    }
  , mvRight: function(shiftPressed) {
        var self = this;
        return this._mv(function(coords) {
            return self.getAffectedCoords(coords, "x", true, shiftPressed, function(x) {
                return x < gi.getBoardSize().x - 1;
            });
        });
    }
  , mvUp: function(shiftPressed) {
        var self = this;
        return this._mv(function(coords) {
            return self.getAffectedCoords(coords, "y", false, shiftPressed, function(_, y) {
                return y > 0;
            });
        });
    }
  , mvDown: function(shiftPressed) {
        var self = this;
        return this._mv(function(coords) {
            return self.getAffectedCoords(coords, "y", true, shiftPressed, function(_, y) {
                return y < gi.getBoardSize().y - 1;
            });
        });
    }
  , init: function() {
        var i, self = this;
        for (i in this.pens) {
            (function() {
                var currentPen = self.pens[i];
                self["pull"+capitalize(currentPen)] = function() {
                    var j, pen;
                    if (self[currentPen+"State"]) {
                        self.cancel(currentPen);  // up every pen
                    } else {
                        self.draw(currentPen);  // down current pen
                        // only one pen is allowed
                        for (j in self.pens) {
                            pen = self.pens[j];
                            if (pen !== currentPen) {
                                if (self[pen+"State"]) {
                                    self[pen+"State"] = false;
                                }
                            }
                        }
                    }
                };
            })();  // jshint ignore: line
        }
    }
};
pen.init();


// scrolling can be done only on full DOM therefore we do it
// outside the startGame()
if (view.ngFitVal) {
    getId("board").scrollIntoView();
}

view.iPeriod = gi.getPeriod();
view.iBoardEngine = gi.getBoardEngine();

// 0 - free type
// 1 - straight type
var mouseStrokeType = cookie.load("mouseStroke") || 0;

document.body.addEventListener("keydown", function(ev) {  // jshint ignore: line
    // console.log(ev);
    switch(ev.keyCode) {
        case 27:  // ESC
            unFitWindow();
            break;
        case 82:  // R
            cycleRun();
            break;
        case 79:  // O
            oneRun();
            break;
        case 67:  // C
            view.mouseStrokeVal = view.iMouseStroke = mouseStrokeType = 0;
            cookie.save("mouseStroke", 0);
            break;
        case 86:  // V
            view.mouseStrokeVal = view.iMouseStroke = mouseStrokeType = 1;
            cookie.save("mouseStroke", 1);
            break;
        case 78:  // N
            pen.pullWriter();
            break;
        case 77:  // M
            pen.pullEraser();
            break;
        case 66:  // B
            pen.pullInert();
            break;
        case 37:  // Left Arrow
        case 65:  // A
        case 72:  // H
            if (pen.mvLeft(ev.shiftKey)) {
                ev.preventDefault();
            }
            break;
        case 39:  // Right Arrow
        case 68:  // D
        case 76:  // L
            if (pen.mvRight(ev.shiftKey)) {
                ev.preventDefault();
            }
            break;
        case 38:  // Up Arrow
        case 87:  // W
        case 75:  // K
            if (pen.mvUp(ev.shiftKey)) {
                ev.preventDefault();
            }
            break;
        case 40:  // Down Arrow
        case 83:  // S
        case 74:  // J
            if (pen.mvDown(ev.shiftKey)) {
                ev.preventDefault();
            }
            break;
        case 80:  // P
            toggleHelp();
            break;
    }
}, false);

[ qs("#game a"), qs("#help a") ].forEach(function(el) {
    if (el !== null) {
        el.addEventListener("click", function() {
            toggleHelp();
        });
    }
});

view.engineInputs.forEach(function(input) {
    input.addEventListener("change", function() {
        if (input == view.engineCurrent) {
            cookie.save("engine", view.engineVal);
            gi.setBoard(view.engineVal);
            view.iBoardEngine = gi.getBoardEngine();
        }
    }, false);
});

view.cycleInput.addEventListener("click", cycleRun, false);

view.oneInput.addEventListener("click", oneRun);

view.periodInput.addEventListener("change", function() {
    if (view.periodVal !== null) {
        cookie.save("period", view.periodVal);
        view.iPeriod = view.periodVal;
        gi.changePeriod(view.periodVal);
    }
}, false);

view.paSwitchInput.addEventListener("change", function() {
    cookie.save("paSwitch", +view.paSwitchVal);
    if (view.paSwitchVal) {
        gi.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
    } else {
        gi.clearPauseAfter();
    }
});

view.paGenerationsInput.addEventListener("change", function() {
    cookie.save("paGenerations", view.paGenerationsVal);
    gi.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
});

// this listener should work correctly while there are only 2 radio buttons
view.paFromInputs[0].addEventListener("change", function() {
    cookie.save("paFrom", view.paFromVal);
    gi.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
});
view.paFromInputs[1].addEventListener("change", function() {
    cookie.save("paFrom", view.paFromVal);
});

view.changeSizeInput.addEventListener("change", function() {
    cookie.save("cellSize", view.changeSizeVal);
    gi.changeCellSize(view.changeSizeVal);
    pen.rerun();
    view.iCellSize = view.changeSizeVal;
});

function onMouseStrokeChanged() {
    view.iMouseStroke = mouseStrokeType = view.mouseStrokeVal;
    cookie.save("mouseStroke", mouseStrokeType);
}
for (var i = 0; i < view.mouseStrokeInputs.length; i++) {
    view.mouseStrokeInputs[i].addEventListener("change", onMouseStrokeChanged);
}

view.ngXInput.addEventListener("change", function() {
    cookie.save("ngX", view.ngXVal);
});

view.ngYInput.addEventListener("change", function() {
    cookie.save("ngY", view.ngYVal);
});

view.ngFitInput.addEventListener("change", function() {
    cookie.save("ngFit", +view.ngFitVal);
    if (view.ngFitVal) {
        view.disableNgSize();
    } else {
        view.enableNgSize();
    }
}, false);

view.ngRules.addEventListener("change", function() {
    var rulesStr = view.ngRulesStrVal
      , rulesFromCookie = cookie.load("ngRules");

    if (rulesStr) {
        cookie.save("ngRules", rulesStr);
        view.iRules = rulesStr;
        view.ngRulesStrVal = rulesStr;  // feed back cleaned value
    } else if (rulesFromCookie) {
        view.iRules = rulesFromCookie;
        view.ngRulesStrVal = rulesFromCookie;
    } else {
        // default
        view.iRules = "23/3";
        view.ngRulesStrVal = "23/3";
    }
});

view.ngFilling.addEventListener("change", function() {
    cookie.save("ngFilling", view.ngFillingVal);
});

view.ngStartInput.addEventListener("click", function() {
    gi.over();
    gi = startGame(makeOptions());

    pen.rerun();

    if (view.ngFitVal) {
        getId("board").scrollIntoView();
    }
}, false);

function makeSaveFname() {
    var now = new Date;
    return "lifegame-"
         + now.getFullYear()
         + "-"
         + ("0" + (now.getMonth() + 1)).slice(-2)
         + "-"
         + ("0" + now.getDate()).slice(-2)
         + "-"
         + ("0" + now.getHours()).slice(-2)
         + "-"
         + ("0" + now.getMinutes()).slice(-2)
         + "-"
         + ("0" + now.getSeconds()).slice(-2)
         + ".png";
}
if (   hasCanvas
    && window.HTMLCanvasElement !== undefined
    && typeof HTMLCanvasElement.prototype.toDataURL == "function"
    ) {
    getId("save").onmousedown = function() {
        var canvas = document.getElementsByTagName("canvas")[0]
          , ref;

        if (gi.getBoardEngine() == "DOM") {
            gi.setBoard("Canvas");
            ref = canvas.toDataURL("image/png");
            gi.setBoard("DOM");
        } else {
            ref = canvas.toDataURL("image/png");
        }

        this.setAttribute("href", ref);
        this.setAttribute("download", makeSaveFname());
    };
} else {
    getId("save").style.display = "none";
}


module.benchmark = benchmark;

return module;

})(LifeGame || {});
