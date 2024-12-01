
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(40, 40);
let arena = createMatrix(10, 22);


let gameField = createMatrix(10, 22);
let player = {
    piece : null,
    pos: {x: 0, y: 0},
    score: 0,
    rows: 0,
    dropped: 0,
}
const pointsPerRow = [0, 100, 300, 500, 800];
let piecesQueue = [];
maybeQueueMorePieces();

function collide(arena, matrix, offset) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 && (arena[y + offset.y] && arena[y + offset.y][x + offset.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowsSwept = 0;
    outer_loop: for (let y = arena.length - 1; y > 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer_loop;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
        rowsSwept++;
    }

    player.score += pointsPerRow[rowsSwept];
    player.rows += rowsSwept;
}
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
        // matrix.reverse();
}
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    for (var i = array.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
function maybeQueueMorePieces() {
    let pieces = shuffle(["I","J","L","O","S","T","Z"]);
    // numbers for color
    let pieceToMatrix = {
        "I": [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
        "J": [[2,0,0],[2,2,2],[0,0,0]],
        "L": [[0,0,3],[3,3,3],[0,0,0]],
        "O": [[4,4],[4,4]],
        "S": [[0,5,5],[5,5,0],[0,0,0]],
        "T": [[0,7,0],[7,7,7],[0,0,0]],
        "Z": [[8,8,0],[0,8,8],[0,0,0]]
    };
    let output = shuffle(pieces).map(i => pieceToMatrix[i])
    // be safe and leak a little
    if (player.dropped == 0 || player.dropped % 6 == 0) {
        piecesQueue.push(...output)
    }
    if (player.piece == null || player.piece == undefined) {
        player.piece = piecesQueue.pop();
    }
}

function createMatrix(width, height) {
    // https://stackoverflow.com/a/46792350
    return Array(height).fill().map(() => Array(width).fill(0));
}
// WHY WORK???? HOW?
function pieceRotate() {
    rotate(player.piece, -1)
    let offset = 1;
    while (collide(arena, player.piece, player.pos)) {
        offset = -(offset + (offset > 0 ? 1 : -1));
        player.pos.x += offset;
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
        // if (player.pos.x < 5) {
        //     player.pos.x += 1;
        // }
        //  else {
        //     player.pos.x -= 1;
        // }
    }
}
function pieceMove(x_movement, y_movement) {
    player.pos.x += x_movement;
    player.pos.y -= y_movement;
    if (collide(arena, player.piece, player.pos)) {
        player.pos.x -= x_movement;
        player.pos.y += y_movement;

        if (y_movement != 0) {
            player.dropped += 1;
            player.piece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        if (y + player.pos.y < 4) {
                            arena = createMatrix(10, 22)
                            player.piece = piecesQueue.pop();
                            player.pos = {x: 5, y: 0}
                            player.rows = 0;
                            player.dropped = 0;
                            player.score = 0;
                            return true;
                        }
                        arena[y + player.pos.y][x + player.pos.x] = value;
                        
                    }
                });
            });
            player.piece = piecesQueue.pop();
            player.pos = {x: 5, y: 0}
            arenaSweep();
            return true;
        }
    }
    arenaSweep();
    return false;
}
function pieceHardDrop() {
    while (pieceMove(0, -1) != true)  {
        // no op
        
    }
}
function changeScores() {
    set = (k, v) => document.getElementById(k).innerHTML = `${k}: ${v}`;
    set("Score", player.score)
    set("Rows", player.rows)
    set("Dropped", player.dropped)

}
let timeoutIds = {};
let intervalIds = {};
let allControls = ["ArrowLeft", "a", "A","ArrowRight", "d", "D","ArrowDown", "s", "S","ArrowUp", "w", "W","Enter", "Space", " "]

document.addEventListener('keydown', function(event) {
    if (allControls.includes(event.key)) {
      if (!timeoutIds[event.key]) {
        let func = getFuncByKey(event);
        func();
  
        
        timeoutIds[event.key] = setTimeout(function() {
          // Repeat every
          intervalIds[event.key] = setInterval(func, 75);
          // initial delay
        }, 165);
      }
    }
  });
  
  document.addEventListener('keyup', function(event) {
    if (allControls.includes(event.key)) {
      if (timeoutIds[event.key]) {
        clearTimeout(timeoutIds[event.key]);
        timeoutIds[event.key] = null;
      }
  
      if (intervalIds[event.key]) {
        clearInterval(intervalIds[event.key]);
        intervalIds[event.key] = null;
      }
    }
  });


function getFuncByKey(event) {
    if (["ArrowLeft", "a", "A"].includes(event.key)) {
        return () => pieceMove(-1, 0);
    } else if (["ArrowRight", "d", "D"].includes(event.key)) {
        return () => pieceMove(1, 0);
    } else if (["ArrowDown", "s", "S"].includes(event.key)) {
        return () => pieceMove(0, -1);
    } else if (["ArrowUp", "w", "W"].includes(event.key)) {
        return () =>pieceRotate();
    } else if (["Enter", "Space", " "].includes(event.key)) {
        return () => pieceHardDrop();
    }
}

function drawMatrix(matrix, offset) {
    let colorMap = ["#000",
        '#20B2AA',
        '#4169E1',
        '#FF8C00',
        '#FFD700',
        '#32CD32',
        '#9370DB',
        '#DC143C',
        '#C71585',
        '#082038'
    ];
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colorMap[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}
let frames = 0
function update() {
    frames += 1;
    if (frames % 20 == 0) {
        pieceMove(0, -1);
    }
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let y = 0;
    while (!collide(arena, player.piece, {x: player.pos.x, y: y})) {
        y+=1;
    }
    let shadow = player.piece.map(row => 
        row.map(value => value == 0 ? 0 : 9)
      );
    drawMatrix(shadow, {x: player.pos.x, y: y - 1});
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.piece, player.pos);



    maybeQueueMorePieces();
    // console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\");
    requestAnimationFrame(update);
    changeScores();
}

update()

