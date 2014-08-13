/*
 * Copyright 2014 chugylo
 * All rights reserved.
 * 
 * life.js - The clone of Conway's Game of Life.
 * Alpha version.
 */


(function() {

// shortcuts
var getId = document.getElementById.bind(document)
  , qs = document.querySelector.bind(document)
  , qsa = document.querySelectorAll.bind(document)
  , el = document.createElement.bind(document);

// constants
var GOLDEN_RATIO_INVERSED = 0.6180341996797237;


function LifeGame(view, args) {

    function fill(fn) {
        var stateTable = []
          , pos = 0
          , cellCount = sizeX * sizeY;

        for (; pos < cellCount; pos++) {
            stateTable.push( fn() );
        }
        return stateTable;
    }

    // the state table is a 1-dimensional array for make it awesome fast
    function initStateTable() {
        switch (initialFilling) {
            case "all-live":
                return fill(function() {
                    return true;
                });
            case "all-dead":
                return fill(function() {
                    return false;
                });
            default:
                return fill(function() {
                    return Math.random() >= GOLDEN_RATIO_INVERSED ? true : false;
                });
        }
    }

    // the function takes a lot of cpu
    function recalcStateToDiff() {
        var stateDiff = { newLive: [], newDead: [] }
          , activeNeighborsCount = 0
          , pos = 0, i = 0
          , cellCount = cellsNeighbors.length
          , neighborsCount = 0;

        for (; pos < cellCount; pos++) {
            for (i = 0, activeNeighborsCount = 0, neighborsCount = cellsNeighbors[pos].length; i < neighborsCount; i++) {
                if (stateTable[ cellsNeighbors[pos][i] ]) {
                    activeNeighborsCount++;
                }
            }

            if (activeNeighborsCount != 2) {
                if (activeNeighborsCount == 3) {
                    if (!stateTable[pos]) {  // dead cell will return live
                        stateDiff.newLive.push(pos);
                    }
                } else {
                    if (stateTable[pos]) {  // live cell will return dead
                        stateDiff.newDead.push(pos);
                    }
                }
            }
        }
        return stateDiff;
    }

    function applyDiffToStateTable(diff) {
        var i = 0
          , newLive = diff.newLive
          , newDead = diff.newDead
          , newLiveLen = newLive.length
          , newDeadLen = newDead.length;

        for (; i < newLiveLen; i++) {
            stateTable[ newLive[i] ] = true;
        }
        for (i = 0; i < newDeadLen; i++) {
            stateTable[ newDead[i] ] = false;
        }
    }

    function renewView() {
        generation++;
        view.iGeneration = generation;
        view.renewCellInfo();
    }

    function renewViewAfterStop() {
        view.iStatus = false;
        view.cycleVal = false;
    }

    function XYToPos(x, y) {
        return x * sizeY + y;
    }

    function runOne() {
        var diff = recalcStateToDiff();
        applyDiffToStateTable(diff);
        board.redrawDiff(diff);
        renewView();
    }

    this.init = function () {
        board.activate();
        board.redraw(stateTable);
        renewView();
    }

    // must be called after .init()
    this.runOne = runOne;

    // must be called after .init()
    // newPeriod is a positive number or zero
    this.runCycle = function(newPeriod) {
        period = newPeriod === undefined ? period : newPeriod;
        if (typeof pauseAfter == "number" && pauseAfter < generation + 1) {
            renewViewAfterStop();
            return;
        }
        var self = this;
        runs = true;
        interval = setInterval(function() {
            if (pauseAfter === null || pauseAfter >= generation + 1) {
                runOne();
            } else {
                self.stopLoop();
                renewViewAfterStop();
                if (pauseFromCurrent) {
                    self.clearPauseAfter();
                }
            }
        }, period);
    }

    // must be called after .init()
    this.stopLoop = function() {
        runs = false;
        clearInterval(interval);
    }

    // newPeriod is a positive number or zero
    this.changePeriod = function(newPeriod) {
        if (runs) {
            this.stopLoop();
            this.runCycle(newPeriod);
        } else {
            period = newPeriod;
        }
    }

    this.setBoard = function(boardType) {
        if (!hasCanvas) return;

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
        board.redraw(stateTable);

        if (memRuns) {
            this.runLoop(period);
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
        return { x: sizeX, y: sizeY };
    }

    this.getPeriod = function() {
        return period;
    }

    this.getBoardEngine = function() {
        return board.boardType;
    }

    this.getStateForCell = function(x, y) {
        return stateTable[ XYToPos(x, y) ];
    }

    this.getGeneration = function() {
        return generation;
    }

    this.pauseAfter = function(generation, fromCurrent) {
        pauseFromCurrent = fromCurrent ? fromCurrent : false;
        pauseAfter = generation;
    }

    this.clearPauseAfter = function() {
        pauseAfter = null;
    }

    this.changeCellSize = function(newSize) {
        cellSize = { x: newSize, y: newSize };
        board.changeCellSize(cellSize);
        if (board.boardType == "Canvas") {
            board.redraw(stateTable);
        }
    }

    this.markCellLive = function(x, y) {
        var pos = XYToPos(x, y);
        stateTable[pos] = true;
        board.redrawCellAsLive(pos);
    }

    this.markCellDead = function(x, y) {
        var pos = XYToPos(x, y);
        stateTable[pos] = false;
        board.redrawCellAsDead(pos);
    }

    this.over = function() {
        this.stopLoop();
        if (hasCanvas) {
            canvasBoard.over();
        }
        domBoard.over();
        generation = 1;
    }

    // 100:62 - golden ratio
    var sizeX = args.sizeX || 100
      , sizeY = args.sizeY || 62
      , cellSize = args.cellSize || LifeGame.defaultCellSize
      , period = typeof args.period == "number" && args.period >= 0 ? args.period : 1000
      , hasCanvas = args.hasCanvas === undefined ? true : args.hasCanvas
      , initialFilling = args.initialFilling || "golden"
      , stateTable = initStateTable()
      , cellsNeighbors = this._getCellsNeighbors(sizeX, sizeY)
      , canvasBoard = hasCanvas ? new CanvasBoard(sizeX, sizeY, cellSize) : null
      , domBoard = new DOMBoard(sizeX, sizeY, cellSize)
      , board = !hasCanvas ? domBoard : args.boardType === "DOM" ? domBoard : canvasBoard
      , interval = 0
      , runs = false
      , generation = 0
      , pauseAfter = args.pauseAfter || null
      , pauseFromCurrent = false;
}
LifeGame.prototype = {
    // this function has been moved to the prototype to make it testable
    _getCellsNeighbors: function(sizeX, sizeY) {
        var cellsNeighbors = []
          , x = 0, y = 0
          , neighbors = [];

        for (; x < sizeX; x++) {
            for (y = 0; y < sizeY; y++) {
                neighbors = [ [x-1, y-1], [x, y-1], [x+1, y-1], [x-1, y], [x+1, y], [x-1, y+1], [x, y+1], [x+1, y+1] ];
                // filter values which are out of the board
                neighbors = neighbors.filter(function(neighbor) {
                    return (neighbor[0] >= 0 && neighbor[0] < sizeX
                        && neighbor[1] >= 0 && neighbor[1] < sizeY)
                        ? true : false;
                });
                // convert coords to 1-dim index
                neighbors = neighbors.map(function(neighbor) {
                    return neighbor[0] * sizeY + neighbor[1];
                });
                // we push result to the 1-dimensional array for
                // an exellent performance when it will used
                cellsNeighbors.push(neighbors);
            }
        }
        return cellsNeighbors;
    }    
}
LifeGame.defaultCellSize = { x: 7, y: 7 };


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
        var parent = getId("board");
        parent.removeChild(this.baseEl);
    }

    this._createBoard = function(tag, attrs) {
        var board = createLifeElem(tag, attrs || {})
          , parent = getId("board");

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


// draw a board on a huge tree of DOM elements
// slow, use Canvas what is much faster
function DOMBoard(sizeX, sizeY, cellSize) {
    var elTable = []
      , cellCount = sizeX * sizeY;

    this.boardType = "DOM";

    this._init(sizeX, sizeY, cellSize);

    this.baseEl = this._createBoard("div", { id: "dom-board" });
    this.baseEl.style.width = this.width + "px";
    this.baseEl.style.height = this.height + "px";

    // this section takes a lot of time!
    (function(board) {
        var width = board.cellSize.x + "px"
          , height = board.cellSize.y + "px"
          , y = 0, x = 0
          , rowDiv
          , cellDiv;

        for (; y < board.sizeY; y++) {
            rowDiv = el("div");
            rowDiv.style.height = height;
            rowDiv.className = "row";
            for (x = 0; x < board.sizeX; x++) {
                cellDiv = el("div");
                cellDiv.style.width = width;
                cellDiv.style.height = height;
                cellDiv.className = "cell";
                rowDiv.appendChild(cellDiv);
                elTable[ x * sizeY + y ] = cellDiv;
            }
            board.baseEl.appendChild(rowDiv);
        }
    })(this);

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
    }

    this.redraw = function(stateTable) {
        for (var i = 0; i < cellCount; i++) {
            elTable[i].style.backgroundColor = stateTable[i] ? "black" : "white";
        }
    }

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
    }

    this.redrawCellAsLive = function(pos) {
        elTable[pos].style.backgroundColor = "black";
    }

    this.redrawCellAsDead = function(pos) {
        elTable[pos].style.backgroundColor = "white";
    }
}
DOMBoard.prototype = new BaseBoard();


// draw a board in a <canvas> tag
function CanvasBoard(sizeX, sizeY, cellSize) {
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
    }

    this.redraw = function(stateTable) {
        for (var i = 0; i < cellCount; i++) {
            cx.fillStyle = stateTable[i] ? "black" : "white";
            cx.fillRect(cellMap[i].x, cellMap[i].y, cellSizeX, cellSizeY);
        }
    }

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
    }

    this.redrawCellAsLive = function(pos) {
        cx.fillStyle = "black";
        cx.fillRect(cellMap[pos].x, cellMap[pos].y, cellSizeX, cellSizeY);
    }

    this.redrawCellAsDead = function(pos) {
        cx.fillStyle = "white";
        cx.fillRect(cellMap[pos].x, cellMap[pos].y, cellSizeX, cellSizeY);
    }
}
CanvasBoard.prototype = new BaseBoard();


function I18n() {
    var lang = document.getElementsByTagName("html")[0].getAttribute("lang") || "en"
      , _ = {}
      , key = ""
      , line = "";

    if (!LifeGameLang.en) {
        createLifeElem("div", { className: "bad-lang", innerHTML: "ERROR: Can't load language! Try to reload the page." }, true);
        throw new Error();
    }

    // standard language is always English
    for (key in LifeGameLang.en) {
        line = LifeGameLang[lang][key] ? LifeGameLang[lang][key] : LifeGameLang.en[key];
        _[key] = line;
    }

    return _;
}
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

    qs("#new-game-panel h4").innerHTML = _.pNewGame;
    newGameLabels = qsAll("new-game-panel label");
    prepend(newGameLabels[0], _.pBoardSize);
    append(newGameLabels[2], _.pFit);
    prepend(newGameLabels[3], _.pFilling);
    fillingOptions = qsAll("new-game-filling option");
    fillingOptions[0].innerHTML = _.pGolden;
    fillingOptions[1].innerHTML = _.pAllDead;
    fillingOptions[2].innerHTML = _.pAllLive;
    getId("new-game-start").value = _.pStart;
    qs("#board-engine-panel h4").innerHTML = _.pBoardEngine;
    engineLabels = qsAll("board-engine-panel label");
    append(engineLabels[0], _.pCanvasEngine);
    append(engineLabels[1], _.pDOMEngine);
    getId("tip-panel").innerHTML = _.pTip;

    appendId("footer", _.rights);

    getId("lang-en").setAttribute("title", _.langEnTitle);
    getId("lang-uk").setAttribute("title", _.langUkTitle);
}


function CookieStorage(view) {
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
        ];    

    this.save = function(key, value) {
        var myCookie = ""
          , myCookieArr = []
          , parts = saveMap.length;

        document.cookie.split(";").forEach(function(cookie) {
            var cookieParts = cookie.replace(/^\s+|\s+$/g, "").split("=");
            if (cookieParts[0] == "lifegame") {
                myCookie = cookieParts[1].split("|").map(function(current, index) {
                    return saveMap[index] == key ? value : current;
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
    }

    this.load = function() {
        var settingsArr = []
          , cookieParts = []
          , i = 0;

        document.cookie.split(";").forEach(function(cookie) {
            cookieParts = cookie.replace(/^\s+|\s+$/g, "").split("=");
            if (cookieParts[0] == "lifegame") {
                settingsArr = cookieParts[1].split("|");
            }
        });
        if (settingsArr.length) {
            for (i = settingsArr.length; i--;) {
                if (settingsArr[i].length) {
                    loadMap[i]( settingsArr[i] );
                    this.setFromStorage( saveMap[i] );
                }
            }
            if (settingsArr[5].length && settingsArr[6].length) {
                view.iBoardSize = { x: settingsArr[5], y: settingsArr[6] };
            }
        }
    }

    this._fromStorage = [];

    this.isFromStorage = function(setting) {
        return this._fromStorage.indexOf(setting) >= 0 ? true : false;
    }

    this.setFromStorage = function(setting) {
        this._fromStorage.push(setting);
    }
}


window.onload = function(ev) {
    // do nothing when tests're running
    if (!getId("board") || !getId("panel")) return;

    // check the browser
    // IE 9 should ok
    var hasCanvas;
    if (
        typeof Array.prototype.map != "function"
        || typeof Array.prototype.filter != "function"
        || typeof Array.prototype.forEach != "function"
        || typeof Array.prototype.indexOf != "function"
        || typeof Event.prototype.preventDefault != "function"
        || typeof document.querySelector != "function"
        || typeof document.querySelectorAll != "function"
        || typeof Function.bind != "function"
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


    function unFitWindow() {
        var board = getId("board");
        document.body.style.overflow = "";
        board.style.paddingLeft = "";
        board.style.paddingTop = "";
    }

    function getTargetGeneration() {
        var target = view.paGenerationsVal
          , from = view.paFromVal;

        if (!view.paSwitchVal) return null;

        if (from == "current") {
            target += game ? game.getGeneration() : 1;
        }
        return target;
    }

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

    // start a new game in the beginning or
    // at the clicking `Start new game` button
    function startGame() {
        var options = {}
          , board = getId("board")
          , cellC = 0
          , gameCellC = 0
          , hugeBoardLim = 50000
          , cellSize = { x: view.changeSizeVal, y: view.changeSizeVal }
          , optimalBoardSize = {};

        if (view.ngFitVal) {
            fitWindow = true;

            // we must style the page before getting its size
            document.body.style.overflow = "hidden";

            var clientWidth = document.documentElement.clientWidth
              , clientHeight = document.documentElement.clientHeight
              , paddingLeft = Math.floor((clientWidth - 3) % (cellSize.x + 1) / 2)
              , paddingTop = Math.floor((clientHeight - 3) % (cellSize.y + 1) / 2);

            board.style.paddingLeft = paddingLeft+"px";
            board.style.paddingTop = paddingTop+"px";
            
            options.sizeX = Math.floor((clientWidth - 3) / (cellSize.x + 1));
            options.sizeY = Math.floor((clientHeight - 3) / (cellSize.y + 1));

            view.cycleVal = true;
            view.iStatus = true;

            alert(_.fitAlert);
        } else {
            fitWindow = false;

            unFitWindow();

            if (!game) {
                if (!cookie.isFromStorage("ngX") || !cookie.isFromStorage("ngY")) {
                    optimalBoardSize = calcOptimalBoardSize();
                    cookie.save("ngX", optimalBoardSize.x);
                    cookie.save("ngY", optimalBoardSize.y);
                }
                if (!cookie.isFromStorage("ngX")) {
                    options.sizeX = view.ngXVal = optimalBoardSize.x;
                } else {
                    options.sizeX = view.ngXVal;
                }
                if (!cookie.isFromStorage("ngY")) {
                    options.sizeY = view.ngYVal = optimalBoardSize.y;
                } else {
                    options.sizeY = view.ngYVal;
                }
            } else {
                options.sizeX = view.ngXVal || game.getBoardSize().x;
                options.sizeY = view.ngYVal || game.getBoardSize().y;
            }
        }

        cellC = options.sizeX * options.sizeY;
        if (cellC > hugeBoardLim) {
            if (!confirm(_.hugeConfirm1+cellC+_.hugeConfirm2)) {
                if (game) {
                    options.sizeX = game.getBoardSize().x;
                    options.sizeY = game.getBoardSize().y;

                    gameCellC = options.sizeX * options.sizeY;
                    if (gameCellC > hugeBoardLim) {
                        options = {};
                    }
                } else {
                    options = {};
                }
            }
        }

        if (!game) {
            options.period = view.periodVal;
        } else {
            options.period = view.periodVal !== null ? view.periodVal : game.getPeriod();
        }

        view.iCellSize = cellSize.x;

        options.initialFilling = view.ngFillingVal;
        options.boardType = view.engineVal;
        options.hasCanvas = hasCanvas;
        options.pauseAfter = getTargetGeneration();
        options.cellSize = cellSize;

        game = new LifeGame(view, options);
        game.init();
        assignCbsTo(game);
        if (view.cycleVal || fitWindow) {
            game.runCycle();
        }

        view.iBoardSize = game.getBoardSize();

        return game;
    }

    // user interaction with boards
    function assignCbsTo(game) {
        function onmouse(elem, ev, cb, cbBorder, preventDefault) {
            var cellSize = game.getCellSize()
              , boardSize = game.getBoardSize()
              , rect = elem.getBoundingClientRect()
              , clickX = ev.clientX - rect.left - 1
              , clickY = ev.clientY - rect.top - 1
              , cellWithBorderX = cellSize.x + 1
              , cellWithBorderY = cellSize.y + 1;

            if (clickX % cellWithBorderX && clickY % cellWithBorderY) {
                var x = parseInt(clickX / cellWithBorderX)
                  , y = parseInt(clickY / cellWithBorderY);

                if (x < boardSize.x && y < boardSize.y) {
                    cb(x, y);
                }
            } else if (typeof cbBorder == "function") {
                cbBorder();
            }

            if (preventDefault === true) {
                ev.preventDefault();
            }
        }

        game.getBoardElems().forEach(function(elem) {
            elem.onclick = function(ev) {
                onmouse(elem, ev, function(x, y) {
                    game.markCellLive(x, y);
                    view.iCellInfo = { state: "in", x: x, y: y, cellState: true };
                });
            }
            elem.oncontextmenu = function(ev) {
                onmouse(elem, ev, function(x, y) {
                    game.markCellDead(x, y);
                    view.iCellInfo = { state: "in", x: x, y: y, cellState: false };
                }, null, true);
            }
            elem.onmouseenter = function() {
                elem.onmousemove = function(ev) {
                    onmouse(elem, ev, function(x, y) {
                        var state = game.getStateForCell(x, y);
                        view.iCellInfo = { state: "in", x: x, y: y, cellState: state };
                        view.mouseAboveState = { isActive: true, x: x, y: y };
                    }, function() {
                        view.iCellInfo = { state: "border" };
                        view.mouseAboveState = { isActive: false };
                    });
                }
            }
            elem.onmouseleave = function() {
                elem.onmousemove = null;
                view.iCellInfo = { state: "out" };
                view.mouseAboveState = { isActive: false };
            }
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
      , ngXInput:           getId("new-game-x")
      , ngYInput:           getId("new-game-y")
      , ngFitInput:         getId("new-game-fit")
      , ngFilling:          getId("new-game-filling")
      , ngStartInput:       getId("new-game-start")
      , iStatusSpan:      qs("#info-status span")
      , iGenerationSpan:  qs("#info-generation span")
      , iCellInfoSpan:    qs("#info-cell-info span")
      , iBoardSizeSpan:   qs("#info-board-size span")
      , iCellSizeSpan:    qs("#info-cell-size span")
      , iPeriodSpan:       qs("#info-period span")
      , iBoardEngineSpan: qs("#info-board-type span")

        // cached position of the mouse for renew Cell Info at every board redraw
      , mouseAboveState: { isActive: false }

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
            var inputs = qsa('input[name="pause-after"]')
              , i = 0;

            while (inputs[i]) {
                if (inputs[i].checked) {
                    return inputs[i].value;
                }
                i++;
            }
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

                this.iCellInfo = { state: "in", x: x, y: y, cellState: game.getStateForCell(x, y) };
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

      , set iBoardEngine(engineName) {
            this.iBoardEngineSpan.innerHTML = engineName;
        }
    }


    var cookie = new CookieStorage(view);
    cookie.load();

    // scrolling can be done only on full DOM therefore we do it
    // outside the startGame()
    var fitWindow = false
      , game = startGame();

    if (fitWindow) {
        getId("board").scrollIntoView();
    }

    view.iPeriod = game.getPeriod();
    view.iBoardEngine = game.getBoardEngine();

    document.body.addEventListener("keyup", function(ev) {
        if (ev.keyCode == 27) {  // ESC
            unFitWindow();
        }
    }, false);

    view.engineInputs.forEach(function(input) {
        input.addEventListener("change", function() {
            if (input == view.engineCurrent) {
                cookie.save("engine", view.engineVal);
                game.setBoard(view.engineVal);
                view.iBoardEngine = game.getBoardEngine();
            }
        }, false);
    });

    view.cycleInput.addEventListener("click", function() {
        if (!view.cycleVal) {
            view.cycleVal = true;
            view.iStatus = true;
            if (view.paSwitchVal) {
                game.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
            }
            game.runCycle();
        } else {
            view.cycleVal = false;
            view.iStatus = false;
            game.stopLoop();
        }
    }, false);

    view.oneInput.addEventListener("click", function() {
        if (view.cycleVal) {
            view.cycleVal = false;
            view.iStatus = false;
            game.stopLoop();
        }
        game.runOne();
    });

    view.periodInput.addEventListener("change", function() {
        if (view.periodVal !== null) {
            cookie.save("period", view.periodVal);
            view.iPeriod = view.periodVal;
            game.changePeriod(view.periodVal);
        }
    }, false);

    view.paSwitchInput.addEventListener("change", function() {
        cookie.save("paSwitch", +view.paSwitchVal);
        if (view.paSwitchVal) {
            game.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
        } else {
            game.clearPauseAfter();
        }
    });

    view.paGenerationsInput.addEventListener("change", function() {
        cookie.save("paGenerations", view.paGenerationsVal);
        game.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
    });

    // this listener should work correctly while there are only 2 radio buttons
    view.paFromInputs[0].addEventListener("change", function() {
        cookie.save("paFrom", view.paFromVal);
        game.pauseAfter(getTargetGeneration(), view.paFromVal == "current");
    });
    view.paFromInputs[1].addEventListener("change", function() {
        cookie.save("paFrom", view.paFromVal);
    });

    view.changeSizeInput.addEventListener("change", function() {
        cookie.save("cellSize", view.changeSizeVal);
        game.changeCellSize(view.changeSizeVal);
        view.iCellSize = view.changeSizeVal;
    });

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

    view.ngFilling.addEventListener("change", function() {
        cookie.save("ngFilling", view.ngFillingVal);
    });

    view.ngStartInput.addEventListener("click", function() {
        game.over();
        startGame();

        if (fitWindow) {
            getId("board").scrollIntoView();
        }
    }, false);
}

})();
