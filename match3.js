// 消消乐核心逻辑：纯函数，不依赖小程序 API，方便单独测试。
// 盘面用一维 cells 数组表示，每个 cell 自带 row / col，
// 页面层只要更新 row / col 就能靠 CSS transition 做出移动和下落动画。

var idSeed = 0;

function resetIdSeed() {
    idSeed = 0;
}

function createCellId() {
    idSeed += 1;
    return 'c' + String(idSeed);
}

function createCell(type, row, col) {
    return {
        id: createCellId(),
        type: type,
        row: row,
        col: col,
        special: '',
    };
}

function randomType(typeCount, random) {
    return Math.floor(random() * typeCount) % typeCount;
}

function toGrid(cells, rows, cols) {
    var grid = [];
    var r;
    var c;
    for (r = 0; r < rows; r += 1) {
        grid.push(new Array(cols));
        for (c = 0; c < cols; c += 1) {
            grid[r][c] = null;
        }
    }
    for (var i = 0; i < cells.length; i += 1) {
        var cell = cells[i];
        if (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) {
            grid[cell.row][cell.col] = cell;
        }
    }
    return grid;
}

function findAt(cells, rows, cols, row, col) {
    if (row < 0 || col < 0 || row >= rows || col >= cols) {
        return null;
    }
    for (var i = 0; i < cells.length; i += 1) {
        if (cells[i].row === row && cells[i].col === col) {
            return cells[i];
        }
    }
    return null;
}

// 生成开局盘面：没有现成三连，且保证至少存在一步可走
function buildBoard(rows, cols, typeCount, random) {
    var rnd = typeof random === 'function' ? random : Math.random;
    var cells = [];
    var row;
    var col;
    for (row = 0; row < rows; row += 1) {
        for (col = 0; col < cols; col += 1) {
            var type = randomType(typeCount, rnd);
            var guard = 0;
            while (createsImmediateMatch(cells, rows, cols, row, col, type) && guard < 60) {
                type = randomType(typeCount, rnd);
                guard += 1;
            }
            cells.push(createCell(type, row, col));
        }
    }
    var attempt = 0;
    while (!hasPossibleMove(cells, rows, cols) && attempt < 30) {
        shuffleTypes(cells, typeCount, rnd);
        attempt += 1;
    }
    return cells;
}

function createsImmediateMatch(cells, rows, cols, row, col, type) {
    var left1 = findAt(cells, rows, cols, row, col - 1);
    var left2 = findAt(cells, rows, cols, row, col - 2);
    if (left1 && left2 && left1.type === type && left2.type === type) {
        return true;
    }
    var up1 = findAt(cells, rows, cols, row - 1, col);
    var up2 = findAt(cells, rows, cols, row - 2, col);
    return Boolean(up1 && up2 && up1.type === type && up2.type === type);
}

// 找出所有待消除方块：ids 为待消除 id，sizes 为各连块长度，bombCells 为触发的炸弹
function findMatches(cells, rows, cols) {
    return matchInGrid(toGrid(cells, rows, cols), rows, cols);
}

function matchInGrid(grid, rows, cols) {
    var groups = [];
    var row;
    var col;

    for (row = 0; row < rows; row += 1) {
        var runStart = 0;
        for (col = 1; col <= cols; col += 1) {
            var same = col < cols
                && grid[row][col]
                && grid[row][runStart]
                && grid[row][col].type === grid[row][runStart].type;
            if (!same) {
                if (col - runStart >= 3) {
                    groups.push(collectRun(grid, row, runStart, col - runStart, true));
                }
                runStart = col;
            }
        }
    }

    for (col = 0; col < cols; col += 1) {
        var start = 0;
        for (row = 1; row <= rows; row += 1) {
            var sameCol = row < rows
                && grid[row][col]
                && grid[start][col]
                && grid[row][col].type === grid[start][col].type;
            if (!sameCol) {
                if (row - start >= 3) {
                    groups.push(collectRun(grid, start, col, row - start, false));
                }
                start = row;
            }
        }
    }

    return mergeGroups(groups, grid, rows, cols);
}

function collectRun(grid, row, col, len, horizontal) {
    var members = [];
    for (var i = 0; i < len; i += 1) {
        var cell = horizontal ? grid[row][col + i] : grid[row + i][col];
        if (cell) {
            members.push(cell);
        }
    }
    return { members: members, size: members.length };
}

function mergeGroups(groups, grid, rows, cols) {
    var ids = [];
    var sizes = [];
    var bombCells = [];
    var i;
    var j;

    for (i = 0; i < groups.length; i += 1) {
        var group = groups[i];
        if (group.size < 3) {
            continue;
        }
        sizes.push(group.size);
        for (j = 0; j < group.members.length; j += 1) {
            var cell = group.members[j];
            if (ids.indexOf(cell.id) === -1) {
                ids.push(cell.id);
            }
            if (cell.special === 'bomb' && bombCells.indexOf(cell) === -1) {
                bombCells.push(cell);
            }
        }
    }

    if (ids.length === 0) {
        return { ids: [], sizes: [], bombCells: [] };
    }

    // 炸弹：连带炸掉周围一圈
    for (i = 0; i < bombCells.length; i += 1) {
        var bomb = bombCells[i];
        for (var dr = -1; dr <= 1; dr += 1) {
            for (var dc = -1; dc <= 1; dc += 1) {
                var r = bomb.row + dr;
                var c = bomb.col + dc;
                if (r < 0 || c < 0 || r >= rows || c >= cols) {
                    continue;
                }
                var target = grid[r][c];
                if (target && ids.indexOf(target.id) === -1) {
                    ids.push(target.id);
                }
            }
        }
    }
    return { ids: ids, sizes: sizes, bombCells: bombCells };
}

// 消除后重力下落：顶部空位补新块，新块带 isNew 供页面做掉落动画
function applyGravity(cells, rows, cols, typeCount, random) {
    var rnd = typeof random === 'function' ? random : Math.random;
    var grid = toGrid(cells, rows, cols);
    var next = [];
    var col;
    var row;

    for (col = 0; col < cols; col += 1) {
        var stack = [];
        for (row = rows - 1; row >= 0; row -= 1) {
            if (grid[row][col]) {
                stack.push(grid[row][col]);
            }
        }
        for (row = rows - 1; row >= 0; row -= 1) {
            var index = rows - 1 - row;
            if (index < stack.length) {
                var moved = stack[index];
                moved.row = row;
                moved.col = col;
                next.push(moved);
            } else {
                var fresh = createCell(randomType(typeCount, rnd), row, col);
                fresh.isNew = true;
                next.push(fresh);
            }
        }
    }
    return next;
}

function swapCells(a, b) {
    var rowA = a.row;
    var colA = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = rowA;
    b.col = colA;
}

// 是否还存在一步能消的走法
function hasPossibleMove(cells, rows, cols) {
    return findHintMove(cells, rows, cols) !== null;
}

// 找出一步可行的交换：返回 { a, b, ids }，ids 为交换后会被消除的方块 id
function findHintMove(cells, rows, cols) {
    var grid = toGrid(cells, rows, cols);
    var row;
    var col;
    for (row = 0; row < rows; row += 1) {
        for (col = 0; col < cols; col += 1) {
            var cell = grid[row][col];
            if (!cell) {
                continue;
            }
            if (col + 1 < cols && grid[row][col + 1]) {
                swapInGrid(grid, row, col, row, col + 1);
                var hitRight = matchInGrid(grid, rows, cols);
                swapInGrid(grid, row, col, row, col + 1);
                if (hitRight.ids.length > 0) {
                    return { a: grid[row][col], b: grid[row][col + 1], ids: hitRight.ids };
                }
            }
            if (row + 1 < rows && grid[row + 1][col]) {
                swapInGrid(grid, row, col, row + 1, col);
                var hitDown = matchInGrid(grid, rows, cols);
                swapInGrid(grid, row, col, row + 1, col);
                if (hitDown.ids.length > 0) {
                    return { a: grid[row][col], b: grid[row + 1][col], ids: hitDown.ids };
                }
            }
        }
    }
    return null;
}

function swapInGrid(grid, rowA, colA, rowB, colB) {
    var a = grid[rowA][colA];
    var b = grid[rowB][colB];
    grid[rowA][colA] = b;
    grid[rowB][colB] = a;
    if (a) {
        a.row = rowB;
        a.col = colB;
    }
    if (b) {
        b.row = rowA;
        b.col = colA;
    }
}

// 死局时重排：保留方块位置，只打乱类型
function shuffleTypes(cells, typeCount, random) {
    var rnd = typeof random === 'function' ? random : Math.random;
    var types = cells.map(function (cell) {
        return cell.type;
    });
    var i;
    for (i = types.length - 1; i > 0; i -= 1) {
        var j = Math.floor(rnd() * (i + 1));
        var temp = types[i];
        types[i] = types[j];
        types[j] = temp;
    }
    for (i = 0; i < cells.length; i += 1) {
        cells[i].type = types[i];
        cells[i].special = '';
    }
    return cells;
}

window.Match3 = {
    createCell: createCell,
    createCellId: createCellId,
    resetIdSeed: resetIdSeed,
    toGrid: toGrid,
    findAt: findAt,
    buildBoard: buildBoard,
    findMatches: findMatches,
    applyGravity: applyGravity,
    swapCells: swapCells,
    swapInGrid: swapInGrid,
    hasPossibleMove: hasPossibleMove,
    findHintMove: findHintMove,
    shuffleTypes: shuffleTypes,
};
