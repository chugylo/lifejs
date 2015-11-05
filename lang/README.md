## life.js

The clone of Conway's Game of Life that runs in the browser.

Version: 1.0, released 15 Aug 2014.

License: MIT.
See LICENSE file for more information.

### Drawing
There're two ways to interactively change a state of cells: with mouse and with keyboard.
Click with left mouse button on a cell and it will turn live.
Click with right&nbsp;— dead.
You can also drag mouse, thus change a state of many cells at once.
There're two types of mouse drawing: free and straight.
Current stroking type is indicated in the info panel.

Press `N`, `M` or `B` key to down one of types of the pens (turn drawing on).
Press another key from the above-mentioned list to select a different pen.
Move the pen with arrow keys, gamer-style WASD keys or vi-style HJKL keys.
You can hold the `Shift` key to move the pen for up to 10 cells.
Press the last key again to up the pen (turn drawing off).
There's no undo function.

### Shortcuts

All shortcuts are case-insensitive.

* `ESC` – unfit window
* `R` – cycle/pause the game
* `O` – run one step
* `P` – show/hide info page (this one)
* `C` – free mouse stroking
* `V` – straight mouse stroking
* `N` – select writer pen (to make cells alive)
* `M` – select eraser pen (to make cells dead)
* `B` – select inert pen (just to see the pen's position)
* `→`, `A` and `H` – move the pen left
* `←`, `D` and `L` – move the pen right
* `↑`, `W` and `K` – move the pen up
* `↓`, `S` and `J` – move the pen down

### Install

1. Install npm
2. Install markdown-it: `npm install markdown-it`
3. Launch script md-to-html.js for creating help pages: `./md-to-html.js`
