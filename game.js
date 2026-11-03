/* ============ 清風消消樂・DOM 版（無限關卡） ============ */
(function () {
    'use strict';
    var M = window.Match3;
    var PROG_KEY = 'clean-game-progress';

    var ROWS = 8, COLS = 8, TYPES = 5;
    var CELL = 66, GAP = 2;               // cell 尺寸與間距
    var ICONS = ['lotus.jpg', 'scale.jpg', 'scroll.jpg', 'liar.jpg', 'liebomb.jpg'];
    var PUPPET_TYPE = 3, BOMB_ICON = 4;

    var board = document.getElementById('board');
    var el = {};
    ['mLevel', 'mMoves', 'mPuppet', 'mPuppetBar', 'mScore', 'boardMask', 'maskTitle', 'maskText', 'maskBtns']
        .forEach(function (id) { el[id] = document.getElementById(id); });

    var level = 1, moves = 0, score = 0, puppetGoal = 0, puppetCleared = 0;
    var cells = [], views = {}, sel = null, busy = false, maxLevelDone = 1;

    try {
        var p = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
        if (p.maxLevelDone) maxLevelDone = p.maxLevelDone;
    } catch (e) { }

    function makeLevel(id) {
        return {
            id: id,
            moves: 20 + 3 * (id - 1),
            puppets: 12 + 5 * (id - 1),
            bombs: Math.min(14, 8 + 4 * (id - 1)),
            name: ['清風初陣', '蓮池試煉', '正气操練', '明鏡演武', '星光突襲'][ (id - 1) % 5 ] + '・第' + id + '階',
        };
    }
    var cfg = makeLevel(1);

    function posLeft(col) { return GAP + col * (CELL + GAP); }
    function posTop(row) { return GAP + row * (CELL + GAP); }

    function setHud() {
        el.mLevel.textContent = cfg.id;
        el.mMoves.textContent = moves;
        el.mPuppet.textContent = puppetCleared + ' / ' + puppetGoal;
        el.mPuppetBar.style.width = Math.min(100, puppetCleared / puppetGoal * 100) + '%';
        el.mScore.textContent = score;
    }

    function buildViews() {
        board.innerHTML = '';
        views = {};
        cells.forEach(function (c) {
            var d = document.createElement('div');
            d.className = 'cell' + (c.special === 'bomb' ? ' bomb' : '');
            d.style.backgroundImage = "url('" + (c.special === 'bomb' ? ICONS[BOMB_ICON] : ICONS[c.type]) + "')";
            d.style.left = posLeft(c.col) + 'px';
            d.style.top = posTop(c.row) + 'px';
            d.addEventListener('click', function () { onCellTap(c.id); });
            board.appendChild(d);
            views[c.id] = d;
        });
    }

    function refreshView(cell) {
        var d = views[cell.id];
        if (!d) return;
        d.style.left = posLeft(cell.col) + 'px';
        d.style.top = posTop(cell.row) + 'px';
        d.style.backgroundImage = "url('" + (cell.special === 'bomb' ? ICONS[BOMB_ICON] : ICONS[cell.type]) + "')";
        d.classList.toggle('bomb', cell.special === 'bomb');
    }

    function onCellTap(id) {
        if (busy) return;
        if (!sel) {
            sel = id;
            views[id].classList.add('sel');
            return;
        }
        if (sel === id) {
            views[id].classList.remove('sel');
            sel = null;
            return;
        }
        var a = cells.find(function (c) { return c.id === sel; });
        var b = cells.find(function (c) { return c.id === id; });
        views[sel].classList.remove('sel');
        sel = null;
        if (!a || !b) return;
        if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) {
            sel = id;
            views[id].classList.add('sel');
            return;
        }
        trySwap(a, b);
    }

    function trySwap(a, b) {
        busy = true;
        M.swapCells(a, b);
        refreshView(a); refreshView(b);
        setTimeout(function () {
            var hit = M.findMatches(cells, ROWS, COLS);
            if (hit.ids.length === 0) {
                M.swapCells(a, b);
                refreshView(a); refreshView(b);
                setTimeout(function () { busy = false; }, 220);
                return;
            }
            moves -= 1;
            resolveMatches();
        }, 230);
    }

    function resolveMatches() {
        var hit = M.findMatches(cells, ROWS, COLS);
        if (hit.ids.length === 0) { afterResolve(); return; }
        hit.ids.forEach(function (id) {
            var c = cells.find(function (x) { return x.id === id; });
            if (!c) return;
            if (c.type === PUPPET_TYPE) puppetCleared += 1;
            var d = views[id];
            if (d) {
                d.style.transition = 'transform .18s, opacity .18s';
                d.style.transform = 'scale(0)';
                d.style.opacity = '0';
            }
        });
        score += hit.ids.length * 10;
        setTimeout(function () {
            hit.ids.forEach(function (id) {
                if (views[id]) { views[id].remove(); delete views[id]; }
            });
            cells = cells.filter(function (c) { return hit.ids.indexOf(c.id) === -1; });
            cells = M.applyGravity(cells, ROWS, COLS, TYPES, Math.random);
            // 同步更新 view 集合：新方塊補建，舊方塊移位
            var alive = {};
            cells.forEach(function (c) { alive[c.id] = c; });
            Object.keys(views).forEach(function (id) {
                if (!alive[id]) { views[id].remove(); delete views[id]; }
            });
            cells.forEach(function (c) {
                if (!views[c.id]) {
                    var d = document.createElement('div');
                    d.className = 'cell';
                    d.style.left = posLeft(c.col) + 'px';
                    d.style.top = (posTop(c.row) - 460) + 'px';   // 從上方掉入
                    d.style.opacity = '0';
                    d.addEventListener('click', function () { onCellTap(c.id); });
                    board.appendChild(d);
                    views[c.id] = d;
                }
                refreshView(c);
            });
            requestAnimationFrame(function () {
                cells.forEach(function (c) {
                    var d = views[c.id];
                    if (d) { d.style.opacity = '1'; }
                });
            });
            setHud();
            setTimeout(resolveMatches, 260);
        }, 200);
    }

    function afterResolve() {
        setHud();
        if (puppetCleared >= puppetGoal) { finish(true); return; }
        if (moves <= 0) { finish(false); return; }
        busy = false;
    }

    function finish(win) {
        busy = true;
        el.boardMask.hidden = false;
        el.maskBtns.innerHTML = '';
        function addBtn(text, cls, fn) {
            var b = document.createElement('button');
            b.className = 'btn ' + cls;
            b.textContent = text;
            b.addEventListener('click', fn);
            el.maskBtns.appendChild(b);
        }
        if (win) {
            var earned = 20;
            window.ChengStar.addPoints(earned);
            if (cfg.id >= maxLevelDone) {
                maxLevelDone = cfg.id + 1;
                localStorage.setItem(PROG_KEY, JSON.stringify({ maxLevelDone: maxLevelDone }));
            }
            el.maskTitle.textContent = '通關成功！';
            el.maskText.textContent = cfg.name + ' 完成，獲得星光 +' + earned + '　已解鎖第 ' + (cfg.id + 1) + ' 階';
            addBtn('下一關 ›', 'btn-primary', function () { startLevel(cfg.id + 1); });
        } else {
            el.maskTitle.textContent = '步數用完了';
            el.maskText.textContent = '還差 ' + (puppetGoal - puppetCleared) + ' 隻騙子木偶。消耗 80 星光購買 +5 步續命，或重新挑戰。';
            if (window.ChengStar.getPoints() >= 80) {
                addBtn('⚡ 消耗 80 星光續命 +5 步', 'btn-gold', function () {
                    window.ChengStar.addPoints(-80);
                    moves += 5;
                    el.boardMask.hidden = true;
                    busy = false;
                    setHud();
                });
            }
            addBtn('重新挑戰', 'btn-primary', function () { startLevel(cfg.id); });
        }
        addBtn('‹ 返回星際地圖', 'btn-ghost', function () { window.ChengStar.showPage('home'); });
        setHud();
    }

    function startLevel(id) {
        cfg = makeLevel(id);
        level = cfg.id;
        moves = cfg.moves;
        score = 0;
        puppetGoal = cfg.puppets;
        puppetCleared = 0;
        sel = null;
        busy = false;
        M.resetIdSeed();
        cells = M.buildBoard(ROWS, COLS, TYPES, Math.random);
        // 隨機放置謊言炸彈
        var placed = 0, guard = 0;
        while (placed < cfg.bombs && guard < 500) {
            guard += 1;
            var c = cells[Math.floor(Math.random() * cells.length)];
            if (c.special !== 'bomb') { c.special = 'bomb'; placed += 1; }
        }
        buildViews();
        el.boardMask.hidden = true;
        setHud();
    }

    window.GameInit = function () {
        startLevel(Math.min(maxLevelDone, Math.max(1, maxLevelDone)));
    };
    document.getElementById('btnGameHome').addEventListener('click', function () { window.ChengStar.showPage('home'); });
    document.getElementById('btnGameChoose').addEventListener('click', function () { window.ChengStar.showPage('home'); });
})();
