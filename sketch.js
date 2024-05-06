const COLS = 7
const ROWS = 6

/**************************************************
 * UI CONSTANTS
 **************************************************/

const CELL_MARGIN = 15
const CELL_WIDTH = 100
const CELL_HEIGHT = CELL_WIDTH

const TOP_LABEL_HEIGHT = 100
const TOP_DROP_CIRCLES_HEIGHT = 100
const BOTTOM_LABEL_HEIGHT = 100

const BOARD_LEFT_MARGIN = 100
const BOARD_RIGHT_MARGIN = 100
const BOARD_TOP_MARGIN = TOP_LABEL_HEIGHT + TOP_DROP_CIRCLES_HEIGHT
const BOARD_BOTTOM_MARGIN = BOTTOM_LABEL_HEIGHT

const BOARD_WIDTH = (COLS * CELL_WIDTH)
const BOARD_HEIGHT = (ROWS * CELL_HEIGHT)

const CANVAS_WIDTH = BOARD_LEFT_MARGIN + BOARD_WIDTH + BOARD_RIGHT_MARGIN
const CANVAS_HEIGHT = BOARD_TOP_MARGIN + BOARD_HEIGHT + BOARD_BOTTOM_MARGIN

const EMPTY_CELL = 0
const HUMAN_CELL = 1
const COMPUTER_CELL = 2

const INCOMPLETE = 0
const HUMAN_WINS = 1
const COMPUTER_WINS = 2
const DRAW = 3

const MAX_DEPTH = 5;

/**************************************************
 * GLOBALS
 **************************************************/

var board;
var humanGoesFirst = true;
var isCurrentTurnHuman = humanGoesFirst;
var isGameComplete = false;
var animatingCol = -1;
var animatingRow = -1;

/**************************************************
 * cloneBoard()
 **************************************************/

function cloneBoard(baseBoard) {
    newBoard = [...Array(COLS)].map(() => [...Array(ROWS)].map(() => EMPTY_CELL));
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            newBoard[col][row] = baseBoard[col][row];
        }
    }
    return newBoard;
}

/**************************************************
 * MinimaxTree Class
 **************************************************/

class MinimaxTree {
    constructor(treeBoard) {      
        this.treeBoard = cloneBoard(treeBoard)
    }
  
    get bestMove() {
        var bestValue = Number.MIN_SAFE_INTEGER;
        var bestCol = 0;
        
        // For every column..
        for (let col = 0; col < COLS; col++) {
            // ..if the column has empty cells..
            if (board[col][0] == EMPTY_CELL) {
                // ..calculate the node
                let tempNode = new MinimaxNode(cloneBoard(this.treeBoard), col, false, 0);
                console.log("col = ", col, " tempNode.nodeValue = ", tempNode.nodeValue);
                
                // If we find a better move than the one we have saved, then update the bestCol
                if (tempNode.nodeValue > bestValue) {
                    bestValue = tempNode.nodeValue;
                    bestCol = col;
                }
            }
        }
        return bestCol;
    }
}

/**************************************************
 * MinimaxNode Class
 **************************************************/

class MinimaxNode {    
    constructor(nodeBoard, col, humanPlayer, depth) {        
        // Update the board with a cell at the lowest row of column 'col'
        var row = 0;
        while((nodeBoard[col][row] == EMPTY_CELL) && (row < ROWS)) {
            row++;
        }        
        nodeBoard[col][row-1] = humanPlayer ? HUMAN_CELL : COMPUTER_CELL;

        // Check the status of the board (human win, computer win, etc.
        switch (checkBoardState(nodeBoard, col)) {
            case COMPUTER_WINS : {
                // Set a high value
                this.value = 100000 - depth;
                break;               
            }
            case HUMAN_WINS : {
                // Set a low value
                this.value = -100000 + depth;
                break;               
            }
            case DRAW : {
                // Set a neutral value
                this.value = 0 - depth;
                break;
            }
            case INCOMPLETE: {
                if (depth >= MAX_DEPTH) {
                    // If we can't search any deeper, set a neutral value..
                    this.value = 0;//- depth
                } else {
                    // ..otherwise, for every column with spaces, calculate the node for the next move
                    this.childNodes = [];
                    for (let col = 0; col < COLS; col++) {
                        if (nodeBoard[col][0] == EMPTY_CELL) {
                            // Calculate value for the next node. Remember to invert 'humanPlayer' and increment 'depth'
                            this.childNodes.push(new MinimaxNode(cloneBoard(nodeBoard), col, !humanPlayer, depth + 1));
                        }
                    }
                    
                    if (this.childNodes.length == 0) {
                        // If there were no child nodes, set the value to neutral
                        this.value = 0;
                    } else {
                        if (humanPlayer) {
                            // Get the max node
                            this.value = Number.MIN_SAFE_INTEGER;
                            for (let i = 0; i < this.childNodes.length; i++) {
                                if (this.childNodes[i].nodeValue > this.value) {
                                    this.value = this.childNodes[i].nodeValue;
                                }
                            }
                        } else {
                            // Get the min node
                            this.value = Number.MAX_SAFE_INTEGER;
                            for (let i = 0; i < this.childNodes.length; i++) {
                                if (this.childNodes[i].nodeValue < this.value) {
                                    this.value = this.childNodes[i].nodeValue;
                                }
                            }
                        }                        
                    }
                }
                break;
            }
        }        
    }
    
    get nodeValue() {
        return this.value;
    }    
}

/**************************************************
 * preload()
 **************************************************/

function preload() {
}

/**************************************************
 * setup()
 **************************************************/

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(30);
  
  textSize(40);
  textAlign(CENTER, CENTER);
  initialiseBoard()
}

/**************************************************
 * setTopLabel()
 **************************************************/

function setTopLabel(label_text) {
    stroke(255); // White
    fill(255);   // White
    rect(0, 0, CANVAS_WIDTH, TOP_LABEL_HEIGHT);
    stroke(0);   // Black
    fill(0);     // Black
    text(label_text, CANVAS_WIDTH / 2, TOP_LABEL_HEIGHT / 2);    
}

function setTopLabelRGB(label_text, r, g, b) {
    stroke(r,g,b); // White
    fill(r,g,b);   // White
    rect(0, 0, CANVAS_WIDTH, TOP_LABEL_HEIGHT);
    stroke(0);   // Black
    fill(0);     // Black
    text(label_text, CANVAS_WIDTH / 2, TOP_LABEL_HEIGHT / 2);    
}

/**************************************************
 * setBottomLabel()
 **************************************************/

function setBottomLabel(label_text) {
    stroke(0); // Black
    fill(0);   // Black
    text(label_text, CANVAS_WIDTH / 2, BOARD_TOP_MARGIN + BOARD_HEIGHT + (BOTTOM_LABEL_HEIGHT / 2)); 
}

/**************************************************
 * mousePressed()
 **************************************************/
 
function mousePressed() {
    // Check to see if mouse is over a drop column
    const col = getOverCellColumn();
    if (col != -1) {
        animatingCol = col;
        animatingRow = -1;
    } else if ((mouseY > BOARD_TOP_MARGIN + BOARD_HEIGHT) && (mouseY < BOARD_TOP_MARGIN + BOARD_HEIGHT + BOTTOM_LABEL_HEIGHT)) {
        // Also check if mouse is over the 'RESET' button
        humanGoesFirst = !humanGoesFirst;    // Toggle the humanGoesFirst flag so that the other player starts the next game
        isCurrentTurnHuman = humanGoesFirst; // And set the move turn
        initialiseBoard();                   // Clear the board
        isGameComplete = false;              // Set the isGameComplete flag so we can resume
        loop();                              // Finally, restart the draw() loop
    }
}

/**************************************************
 * getOverCellColumn()
 **************************************************/

function getOverCellColumn() {
    if (isCurrentTurnHuman) {
        // Check if mouse is over a drop column
        if ((mouseY > TOP_LABEL_HEIGHT) && (mouseY < BOARD_TOP_MARGIN)) {
            const col = Math.floor((mouseX - BOARD_LEFT_MARGIN) / CELL_WIDTH);
            if ((col >= 0) && (col < COLS)) {
                
                // Only return the column number if there are actually spaces into which we can drop a disk
                if (board[col][0] == EMPTY_CELL) {
                    return col;
                }
            }
        }
    }
    
    // Return -1 if it isn't
    return -1;
}

/**************************************************
 * drawBoard()
 **************************************************/

function drawBoard() {
    // Draw the white background
    background(255); // WHITE
    
    // Draw the board
    stroke(0);       // Black
    fill(0, 0, 255); // Blue
    rect(BOARD_LEFT_MARGIN, BOARD_TOP_MARGIN, BOARD_WIDTH, BOARD_HEIGHT);
    
    // Draw the labels
    setTopLabel(isCurrentTurnHuman ? "HUMAN TURN" : "COMPUTER TURN");
    setBottomLabel("RESET GAME");
    
    // Set the top row to show a cell start dropping
    let overCol = getOverCellColumn();
    for (let col = 0; col < COLS; col++) {
        for (let row = -1; row < ROWS; row++) {            
            if ((row == -1) && (col == overCol)) {
                drawCell(col, row, HUMAN_CELL);
            } else {
                drawCell(col, row, board[col][row]);
            }            
        }
    }
    
    // Show animation
    if (animatingCol != -1) {        
        drawCell(animatingCol, animatingRow, isCurrentTurnHuman ? HUMAN_CELL : COMPUTER_CELL);
        
        if ((animatingRow == ROWS -1) || (board[animatingCol][animatingRow + 1] != EMPTY_CELL)) {
            board[animatingCol][animatingRow] = isCurrentTurnHuman ? HUMAN_CELL : COMPUTER_CELL;
            
            // Clear the mouse-over cells, just incase we are stopping because someone has won
            for (let col = 0; col < COLS; col++) {            
                drawCell(animatingCol, -1, EMPTY_CELL);
            }
            
            // Update the label and isGameComplete flag if someone has won, or if there is a draw
            switch(checkBoardState(board, animatingCol)) {
                case HUMAN_WINS : {
                    isGameComplete = true;
                    setTopLabelRGB("HUMAN WINS!", 255, 0, 0); // Red
                    break;
                }
                case COMPUTER_WINS : {
                    setTopLabelRGB("COMPUTER WINS!", 255, 255, 0); // Yelllow
                    isGameComplete = true;
                    break;
                }
                case DRAW : {
                    setTopLabel("DRAW!");
                    isGameComplete = true;
                    break;
                }
                case INCOMPLETE : {
                    // If noone has won yet, and it still isn't a draw, change turns
                    isCurrentTurnHuman = !isCurrentTurnHuman;
                }
            }
            // Set the animatingCol back to -1 since we are done animating
            animatingCol = -1;
        }
        // Incrememnt the animatingRow field so that we next draw the disk on the next row
        animatingRow++;
    }
}

/**************************************************
 * drawCell()
 **************************************************/

function drawCell(col, row, cellType) {
    if (cellType == HUMAN_CELL) {
        fill(255, 0, 0);    // Red
    } else if (cellType == COMPUTER_CELL) {
        fill(255, 255, 0);  // Yellow
    } else {
        fill(255);          // White
    }    
    
    ellipse(BOARD_LEFT_MARGIN + (col * CELL_WIDTH) + (CELL_WIDTH / 2),
            BOARD_TOP_MARGIN + (row * CELL_HEIGHT) + (CELL_HEIGHT / 2),
            CELL_WIDTH - CELL_MARGIN,
            CELL_HEIGHT - CELL_MARGIN);    
}

/**************************************************
 * checkBoardState()
 **************************************************/

function checkBoardState(someBoard, latestCol) {
    // Get the location of the most recently dropped disk.
    var latestRow = 0;
    while (someBoard[latestCol][latestRow] == EMPTY_CELL) {
        latestRow++; 
    }
    const latestPiece = someBoard[latestCol][latestRow];
    
    // Horizontal check
    var horizontalCount = 1;
    for(let col = latestCol - 1; col >= 0; col--) {
        if(someBoard[col][latestRow] == latestPiece) {
            horizontalCount++;
        } else {
            break;
        }
    }
    for(let col = latestCol + 1; col < COLS; col++) {
        if(someBoard[col][latestRow] == latestPiece) {
            horizontalCount++;
        } else {
            break;
        }
    }
    
    if (horizontalCount >= 4) {
        return latestPiece == HUMAN_CELL ? HUMAN_WINS : COMPUTER_WINS;
    }
    
    // Vertical check    
    var verticalCount = 1;
    for(let row = latestRow - 1; row >= 0; row--) {
        if(someBoard[latestCol][row] == latestPiece) {
            verticalCount++;
        } else {
            break;
        }
    }
    for(let row = latestRow + 1; row < ROWS; row++) {
        if(someBoard[latestCol][row] == latestPiece) {
            verticalCount++;
        } else {
            break;
        }
    }

    if (verticalCount >= 4) {
        return latestPiece == HUMAN_CELL ? HUMAN_WINS : COMPUTER_WINS;
    }

    // Top-left to bottom-right diagonal check
    var diagonalCount = 1;
    for (let row = latestRow - 1, col = latestCol - 1; (row >= 0) && (col >= 0); row--, col--) {
        if(someBoard[col][row] == latestPiece) {
            diagonalCount++;
        } else {
            break;
        }
    }
    for (let row = latestRow + 1, col = latestCol + 1; (row < ROWS) && (col < COLS); row++, col++) {
        if(someBoard[col][row] == latestPiece) {
            diagonalCount++;
        } else {
            break;
        }
    }

    if (diagonalCount >= 4) {
        return latestPiece == HUMAN_CELL ? HUMAN_WINS : COMPUTER_WINS;
    }
    
    // Bottom-left to top-right diagonal check
    diagonalCount = 1;
    for (let row = latestRow + 1, col = latestCol - 1; (row < ROWS) && (col >= 0); row++, col--) {
        if(someBoard[col][row] == latestPiece) {
            diagonalCount++;
        } else {
            break;
        }
    }
    for (let row = latestRow - 1, col = latestCol + 1; (row >= 0) && (col < COLS); row--, col++) {
        if(someBoard[col][row] == latestPiece) {
            diagonalCount++;
        } else {
            break;
        }
    }

    if (diagonalCount >= 4) {
        return latestPiece == HUMAN_CELL ? HUMAN_WINS : COMPUTER_WINS;
    }
    
    // Draw check
    for(let col = 0; col < COLS; col++) {
        if (someBoard[col][0] == EMPTY_CELL) {
            return INCOMPLETE;
        }
    }
    
    return DRAW;
}

/**************************************************
 * draw()
 **************************************************/

function draw() {
    // If the game is complete, disable the loop
    if (isGameComplete) {
        noLoop();
    } else {
        // ..otherwise, draw the board, and if we aren't animating a move, then it must be the computer's turn
        drawBoard()
        if ((!isCurrentTurnHuman) && (animatingCol == -1)) {
            animatingCol = getComputerMove(board);
            animatingRow = -1;
        }
    }
}

/**************************************************
 * getComputerMove()
 **************************************************/

function getComputerMove(){
    var tree = new MinimaxTree(board);
    var col = tree.bestMove;
    console.log("Best move is col = ", col);
    return col;    
}

/**************************************************
 * initialise_board()
 **************************************************/

function initialiseBoard() {
   board = [...Array(COLS)].map(() => [...Array(ROWS)].map(() => EMPTY_CELL))
}