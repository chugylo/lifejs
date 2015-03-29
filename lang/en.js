var LifeGame = (function(module) {

module.lang = module.lang || {};

module.lang.en = {
    title: "The Life Game"
  , header: "The Life Game"

  , fitAlert: '"Fit to window" function will hide scrolls and auto-run the game. Press ESC to show the scrolls back.'
  , hugeConfirm1: "You are going to create a HUGE board ("
  , hugeConfirm2: " cells). Are you sure?"

    // PANEL
    // p - prefix for a panel
    // pi - prefix for an info panel
    // pPa - prefix for a `pause after` panel
  , pInfo: "Info"
  , piStatus: "Status: "
  , piStatusStopped: "stopped"
  , piStatusRunning: "running"
  , piStatusPaused: "paused"
  , piGeneration: "Generation: "
  , piCellInfo: "Cell Info: "
  , piCellInfoEmpty: "&lt;Hover the mouse above the board to see&gt;"
  , piCellInfoLive: "live"
  , piCellInfoDead: "dead"
  , piCellInfoBorder: "&lt;Cells' border&gt;"
  , piPeriod: "Period: "
  , piMs: "ms"
  , piGps: "generations/s"
  , piBoardSize: "Board Size: "
  , piCells: "cells"
  , piCellSize: "Cell Size: "
  , piRules: "Rules: "
  , piBoardEngine: "Board Engine: "
  , pStep: "Period: "
  , pStepMs: "&#8201;ms"
  , pCycle: "Cycle"
  , pOne: "+One"
  , pPause: "Pause"

  , pPaStop: " Pause after&nbsp;"
  , pPaGenerations: " generations"
  , pPaBeginning: " from beginning"
  , pPaCurrent: " from current"

  , pCellSize: "Cell Size: "
  , pPx: "&#8201;px"

  , pNewGame: "New Game"
  , pBoardSize: "Board Size: "
  , pFit: " Fit to window size"
  , pRules: "Rules: "
  , pFilling: "Initial Filling: "
  , pGolden: "Random, using golden ratio"
  , pAllDead: "All dead"
  , pAllLive: "All live"
  , pStart: "Start new game"
  , pBoardEngine: "Board Engine"
  , pCanvasEngine: " Canvas"
  , pDOMEngine: " DOM"
  , pCanvasEngineTitle: "Quick, recommended"
  , pDOMEngineTitle: "Slow, not recommended"
  , pTip: "Click left mouse to make the cell live and click right to make it dead."
        + "<p>Rules have format \"S/B\" where \"S\" stands for \"survival\" and \"B\" stands for \"birth\". Popular rules: 23/2nbsp;— classical game, 34/34, 23/36&nbsp;— HighLife."
  , pWhatsit: "The Game of Life is a cellular automaton, a zero-player game. The universe is a space divided into cells. Every generation is calculated out of the previous one by simple rules. More <a href=\"http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life\" target=\"_blank\">on Wikipedia</a>."

  , rights: "<a href=\"LICENSE\">License information.</a>"

  , langEnTitle: "English"
  , langUkTitle: "Ukrainian (Українська мова)"
}

return module;

})(LifeGame || {});
