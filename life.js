/*
 * Copyright 2014 chugylo
 * All rights reserved.
 * 
 * life.js - The clone of the Life Game.
 * Alpha version.
 */


(function() {

// shortcuts
var getId = document.getElementById.bind(document)
  , qs = document.querySelector.bind(document)
  , el = document.createElement.bind(document);


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
            case "all-alive":
                return fill(function() {
                    return true;
                });
            case "all-dead":
                return fill(function() {
                    return false;
                });
            default:
                return fill(function() {
                    return Math.random() >= 0.75 ? true : false;
                });
        }
    }

    // the function takes a lot of cpu
    function recalcStateToDiff() {
        var stateDiff = { newAlive: [], newDead: [] }
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
                    if (!stateTable[pos]) {  // dead cell will return alive
                        stateDiff.newAlive.push(pos);
                    }
                } else {
                    if (stateTable[pos]) {  // alive cell will return dead
                        stateDiff.newDead.push(pos);
                    }
                }
            }
        }
        return stateDiff;
    }

    function applyDiffToStateTable(diff) {
        var i = 0
          , newAlive = diff.newAlive
          , newDead = diff.newDead
          , newAliveLen = newAlive.length
          , newDeadLen = newDead.length;

        for (; i < newAliveLen; i++) {
            stateTable[ newAlive[i] ] = true;
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

    function XYToPos(x, y) {
        return x * sizeY + y;
    }

    this.init = function () {
        board.activate();
        board.redraw(stateTable);
        renewView();
    }

    // must be called after .init()
    // newDelay is a positive number or zero
    this.runLoop = function(newDelay) {
        delay = newDelay === undefined ? delay : newDelay;
        runs = true;
        interval = setInterval(function() {
            var diff = recalcStateToDiff();
            applyDiffToStateTable(diff);
            board.redrawDiff(diff);
            renewView();
        }, delay);
    }

    // must be called after .init()
    this.stopLoop = function() {
        runs = false;
        clearInterval(interval);
    }

    // newDelay is a positive number or zero
    this.changeDelay = function(newDelay) {
        if (runs) {
            this.stopLoop();
            this.runLoop(newDelay);
        } else {
            delay = newDelay;
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
        return { x: sizeX, y: sizeY };
    }

    this.getDelay = function() {
        return delay;
    }

    this.getBoardEngine = function() {
        return board.boardType;
    }

    this.getStateForCell = function(x, y) {
        return stateTable[ XYToPos(x, y) ];
    }

    this.markCellAlive = function(x, y) {
        var pos = XYToPos(x, y);
        stateTable[pos] = true;
        board.redrawCellAsAlive(pos);
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
    }

    var sizeX = args.sizeX || 200
      , sizeY = args.sizeY || 100
      , cellSize = args.cellSize || LifeGame.defaultCellSize
      , delay = typeof args.delay == "number" && args.delay >= 0 ? args.delay : 1000
      , hasCanvas = args.hasCanvas === undefined ? true : args.hasCanvas
      , initialFilling = args.initialFilling || "random-25"
      , stateTable = initStateTable()
      , cellsNeighbors = this._getCellsNeighbors(sizeX, sizeY)
      , canvasBoard = hasCanvas ? new CanvasBoard(sizeX, sizeY, cellSize) : null
      , domBoard = new DOMBoard(sizeX, sizeY, cellSize)
      , board = !hasCanvas ? domBoard : args.boardType === "DOM" ? domBoard : canvasBoard
      , interval = 0
      , runs = false
      , generation = 0;
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
LifeGame.defaultCellSize = { x: 5, y: 5 };


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

    this.redraw = function(stateTable) {
        for (var i = 0; i < cellCount; i++) {
            elTable[i].style.backgroundColor = stateTable[i] ? "black" : "white";
        }
    }

    // the function takes a lot of cpu
    this.redrawDiff = function(diff) {
        var i = 0
          , newAlive = diff.newAlive
          , newDead = diff.newDead
          , newAliveLen = newAlive.length
          , newDeadLen = newDead.length;

        for (; i < newAliveLen; i++) {
            elTable[ newAlive[i] ].style.backgroundColor = "black";
        }
        for (i = 0; i < newDeadLen; i++) {
            elTable[ newDead[i] ].style.backgroundColor = "white";
        }
    }

    this.redrawCellAsAlive = function(pos) {
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

    (function() {
        for (var pos = 0; pos < cellCount; pos++) {
            cellMap.push({
                x: Math.floor(pos / sizeY) * (cellSizeX + 1) + 1
              , y: pos % sizeY * (cellSizeY + 1) + 1
            });
        }
    })();

    cx.fillStyle = "#aea";
    cx.fillRect(0, 0, this.width, this.height);

    this.redraw = function(stateTable) {
        for (var i = 0; i < cellCount; i++) {
            cx.fillStyle = stateTable[i] ? "black" : "white";
            cx.fillRect(cellMap[i].x, cellMap[i].y, cellSizeX, cellSizeY);
        }
    }

    // the function takes a lot of cpu
    this.redrawDiff = function(diff) {
        var i = 0
          , newAlive = diff.newAlive
          , newDead = diff.newDead
          , newAliveLen = newAlive.length
          , newDeadLen = newDead.length;

        cx.fillStyle = "black";
        for (; i < newAliveLen; i++) {
            cx.fillRect(cellMap[ newAlive[i] ].x, cellMap[ newAlive[i] ].y, cellSizeX, cellSizeY);
        }

        cx.fillStyle = "white";
        for (i = 0; i < newDeadLen; i++) {
            cx.fillRect(cellMap[ newDead[i] ].x, cellMap[ newDead[i] ].y, cellSizeX, cellSizeY);
        }
    }

    this.redrawCellAsAlive = function(pos) {
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

    // standard language is always English
    for (key in LifeGameLang.en) {
        line = LifeGameLang[lang][key] ? LifeGameLang[lang][key] : LifeGameLang.en[key];
        _[key] = line;
    }

    return _;
}
I18n.fillPage = function(_) {
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

    var stepDelay, newGameLabels, fillingOptions, engineLabels;

    document.getElementsByTagName("title")[0].innerHTML = _.title;
    document.getElementsByTagName("h1")[0].innerHTML = _.header;

    qs("#info-panel h4").innerHTML = _.pInfo;
    prependId("info-status", _.piStatus);
    qs("#info-status span").innerHTML = _.piStatusStopped;
    prependId("info-generation", _.piGeneration);
    prependId("info-cell-info", _.piCellInfo);
    qs("#info-cell-info span").innerHTML = _.piCellInfoEmpty;
    prependId("info-delay", _.piDelay);
    prependId("info-board-size", _.piBoardSize);
    prependId("info-board-type", _.piBoardEngine);
    getId("run").value = _.pRun;
    stepDelay = qs("#flow-control-panel label");
    stepDelay.innerHTML = _.pStepDelay + stepDelay.innerHTML + _.pStepDelayMs;
    qs("#new-game-panel h4").innerHTML = _.pNewGame;
    newGameLabels = getId("new-game-panel").querySelectorAll("label");
    prepend(newGameLabels[0], _.pBoardSize);
    append(newGameLabels[2], _.pFit);
    prepend(newGameLabels[3], _.pFilling);
    fillingOptions = getId("new-game-filling").querySelectorAll("option");
    fillingOptions[0].innerHTML = _.pRandom25;
    fillingOptions[1].innerHTML = _.pAllDead;
    fillingOptions[2].innerHTML = _.pAllAlive;
    getId("new-game-start").value = _.pStart;
    qs("#board-engine-panel h4").innerHTML = _.pBoardEngine;
    engineLabels = getId("board-engine-panel").querySelectorAll("label");
    append(engineLabels[0], _.pCanvasEngine);
    append(engineLabels[1], _.pDOMEngine);
    getId("tip-panel").innerHTML = _.pTip;

    appendId("footer", _.rights);
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

    // start a new game in the beginning or
    // at the clicking `Start new game` button
    function startGame() {
        var options = {}
          , board = getId("board")
          , cellC = 0
          , gameCellC = 0
          , hugeBoardLim = 50000;

        if (view.ngFitVal) {
            fitWindow = true;

            // we must style the page before getting its size
            document.body.style.overflow = "hidden";

            var cellSize = game ? game.getCellSize() : LifeGame.defaultCellSize
              , clientWidth = document.documentElement.clientWidth
              , clientHeight = document.documentElement.clientHeight
              , paddingLeft = Math.floor((clientWidth - 3) % (cellSize.x + 1) / 2)
              , paddingTop = Math.floor((clientHeight - 3) % (cellSize.y + 1) / 2);

            board.style.paddingLeft = paddingLeft+"px";
            board.style.paddingTop = paddingTop+"px";
            
            options.sizeX = Math.floor((clientWidth - 3) / (cellSize.x + 1));
            options.sizeY = Math.floor((clientHeight - 3) / (cellSize.y + 1));

            view.runVal = true;
            view.iStatus = true;

            alert(_.fitAlert);
        } else {
            fitWindow = false;

            unFitWindow();

            if (!game) {
                options.sizeX = view.ngXVal;
                options.sizeY = view.ngYVal;
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
            options.delay = view.delayVal;
        } else {
            options.delay = view.delayVal !== null ? view.delayVal : game.getDelay();
        }

        options.initialFilling = view.ngFillingVal;
        options.boardType = view.engineVal;
        options.hasCanvas = hasCanvas;

        game = new LifeGame(view, options);
        game.init();
        assignCbsTo(game);
        if (view.runVal || fitWindow) {
            game.runLoop();
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
                    game.markCellAlive(x, y);
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
        runInput:     getId("run")
      , delayInput:   getId("delay")
      , ngXInput:     getId("new-game-x")
      , ngYInput:     getId("new-game-y")
      , ngFitInput:   getId("new-game-fit")
      , ngFilling:    getId("new-game-filling")
      , ngStartInput: getId("new-game-start")
      , iStatusSpan:      qs("#info-status span")
      , iGenerationSpan:  qs("#info-generation span")
      , iCellInfoSpan:    qs("#info-cell-info span")
      , iBoardSizeSpan:   qs("#info-board-size span")
      , iDelaySpan:       qs("#info-delay span")
      , iBoardEngineSpan: qs("#info-board-type span")

        // cached position of the mouse for renew Cell Info at every board redraw
      , mouseAboveState: { isActive: false }

      , get engineInputs() {
            // converts into the real array
            var inputs = document.querySelectorAll('input[name="engine"]')
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

        // true - is running
        // false - is in pause
      , get runVal() {
            return this.runInput.getAttribute("data-state") == "running";
        }

        // state == true - launch
        // state == false - pause
      , set runVal(state) {
            this.runInput.setAttribute("data-state", state ? "running" : "paused");
            this.runInput.value = state ? _.pPause : _.pRun;
        }

      , get delayVal() {
            var val = parseInt(this.delayInput.value, 10);
            return val >= 0 && val <= 3600000 ? val : null;
        }

      , _ngSizeVal: function(input) {
            var val = parseInt(input.value, 10);
            return val > 0 && val < 10000 ? val : null;
        }

      , get ngXVal() {
            return this._ngSizeVal(this.ngXInput);
        }

      , get ngYVal() {
            return this._ngSizeVal(this.ngYInput);
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

      , get ngFillingVal() {
            return this.ngFilling.value;
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
                      , stateText = info.cellState ? _.piCellInfoAlive : _.piCellInfoDead;

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

      , set iDelay(delay) {
            var fps = 1000 / delay;
            this.iDelaySpan.innerHTML = delay+"&#8201;"+_.piMs+" ("+fps.toFixed(2)+"&#8201;"+_.piFps+")";
        }

      , set iBoardEngine(engineName) {
            this.iBoardEngineSpan.innerHTML = engineName;
        }
    }


    // scrolling can be done only on full DOM therefore we do it
    // outside the startGame()
    var fitWindow = false
      , game = startGame();

    if (fitWindow) {
        getId("board").scrollIntoView();
    }

    view.iDelay = game.getDelay();
    view.iBoardEngine = game.getBoardEngine();

    document.body.addEventListener("keyup", function(ev) {
        if (ev.keyCode == 27) {  // ESC
            unFitWindow();
        }
    }, false);

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

        if (fitWindow) {
            getId("board").scrollIntoView();
        }
    }, false);
}

})();
