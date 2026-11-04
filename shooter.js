/* ============ 廉潔神槍手・DOM 版 ============ */
(function () {
    'use strict';
    var QUESTIONS = DATA.shooterQuestions;
    var LETTERS = ['A', 'B', 'C', 'D'];
    var TOTAL = QUESTIONS.length;

    var GUNS = [
        { key: 'steady', name: '穩守號', desc: '體積較大、容彈量更高，瞄準穩定不易偏移', ammo: 35, sens: 0.55, tag: '適合新手' },
        { key: 'swift', name: '疾風號', desc: '體型輕盈、滑動靈敏，但較易偏移', ammo: 25, sens: 1.25, tag: '適合熟手' },
    ];
    var DIFFS = {
        easy:   { name: '簡單', shift: 34, range: 16, speed: 0.75, float: 16, ammoAdd: 3, scorePer: 10, hide: false },
        normal: { name: '普通', shift: 42, range: 24, speed: 1.25, float: 22, ammoAdd: 2, scorePer: 15, hide: false },
        hard:   { name: '困難', shift: 48, range: 30, speed: 1.90, float: 30, ammoAdd: 1, scorePer: 20, hide: true },
    };

    var el = {};
    ['shGun', 'shDiff', 'shPlay', 'shPopup', 'shOver', 'gunList', 'diffList', 'shAmmo', 'shQIdx', 'shScore',
     'shQ', 'shOpts', 'shArena', 'shCross', 'shBullet', 'shSlider', 'shKnob', 'shPopupTitle', 'shPopupBody',
     'shPopupExtra', 'shPopupNext', 'shStars', 'shOverTitle', 'shOverText', 'shOverScore',
     'shOverCorrect', 'shOverEarned'].forEach(function (id) { el[id] = document.getElementById(id); });

    var gun = null, diff = 'easy';
    var state = 'gun';
    var ammo = 0, score = 0, correctCount = 0, qIndex = 0;
    var questions = [], targets = [], answerIdx = -1, tip = '';
    var aim = 0.5, busy = false;
    var t0 = 0, rafId = null, hideIdx = -1;
    var dragOn = false, dragX0 = 0, aimAtDrag = 0.5;
    var arenaW = 1000;

    // ---------- 面板切換 ----------
    function show(panel) {
        ['shGun', 'shDiff', 'shPlay', 'shPopup', 'shOver'].forEach(function (p) {
            el[p].hidden = (p !== panel);
        });
        state = panel;
    }

    // ---------- 選槍 / 難度 ----------
    function renderGuns() {
        el.gunList.innerHTML = '';
        GUNS.forEach(function (g) {
            var d = document.createElement('div');
            d.className = 'gun-card' + (gun && gun.key === g.key ? ' on' : '');
            d.innerHTML = '<h4>' + g.name + '</h4><span class="tag">' + g.tag + '</span>'
                + '<p>' + g.desc + '</p><div class="ammo">初始彈藥 ' + g.ammo + ' 發</div>';
            d.addEventListener('click', function () { gun = g; renderGuns(); });
            el.gunList.appendChild(d);
        });
    }
    function renderDiffs() {
        el.diffList.innerHTML = '';
        [['easy', '簡單', '答案靶緩慢游走・答對補 3 發'],
         ['normal', '普通', '答案靶中速來回・答對補 2 發'],
         ['hard', '困難', '答案靶快速游走且會短暫隱身・答對補 1 發']].forEach(function (d) {
            var div = document.createElement('div');
            div.className = 'diff-item' + (diff === d[0] ? ' on' : '');
            div.innerHTML = '<b>' + d[1] + '</b><span>' + d[2] + '</span><span>' + (diff === d[0] ? '✓' : '') + '</span>';
            div.addEventListener('click', function () { diff = d[0]; renderDiffs(); });
            el.diffList.appendChild(div);
        });
    }
    renderGuns();
    renderDiffs();
    show('shGun');

    document.getElementById('btnGunOk').addEventListener('click', function () {
        if (!gun) { alert('先挑選一把能量槍'); return; }
        show('shDiff');
    });
    document.getElementById('btnDiffBack').addEventListener('click', function () { show('shGun'); });
    document.getElementById('btnDiffOk').addEventListener('click', startGame);
    document.getElementById('btnShAgain').addEventListener('click', function () { show('shDiff'); });
    document.getElementById('btnShHome').addEventListener('click', function () { window.ChengStar.showPage('home'); });

    // ---------- 開局 ----------
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function startGame() {
        questions = shuffle(QUESTIONS);
        ammo = gun.ammo;
        score = 0;
        correctCount = 0;
        qIndex = 0;
        aim = 0.5;
        busy = false;
        show('shPlay');
        buildQuestion();
        startMove();
    }

    function buildQuestion() {
        var q = questions[qIndex];
        var order = shuffle([0, 1, 2, 3]);
        targets = [];
        for (var k = 0; k < 4; k++) {
            var oi = order[k];
            targets.push({ letter: LETTERS[k], text: q.options[oi], el: null });
            if (oi === q.answer) answerIdx = k;
        }
        tip = q.tip;
        el.shQ.textContent = q.q;
        // 選項文字列在題目下方（與靶上字母一一對應）
        el.shOpts.innerHTML = '';
        targets.forEach(function (t) {
            var d = document.createElement('div');
            d.className = 'sh-opt';
            d.innerHTML = '<b>' + t.letter + '</b><span>' + t.text + '</span>';
            el.shOpts.appendChild(d);
        });
        el.shQIdx.textContent = (qIndex + 1) + ' / ' + TOTAL;
        renderHud();
        buildTargets();
    }

    function renderHud() {
        el.shAmmo.textContent = '◆ 彈藥 ' + ammo;
        el.shAmmo.classList.toggle('low', ammo <= 5);
        el.shScore.textContent = '得分 ' + score;
    }

    // ---------- 靶區 ----------
    var BASE = [0.10, 0.37, 0.63, 0.90];   // 四張靶的基準中心（佔靶區寬比例）
    var TARGET_SIZE = 120;                  // 圓靶直徑
    function buildTargets() {
        el.shArena.querySelectorAll('.sh-target').forEach(function (n) { n.remove(); });
        targets.forEach(function (t) {
            var d = document.createElement('div');
            d.className = 'sh-target';
            d.innerHTML = '<div class="ring"><span>' + t.letter + '</span></div>';
            el.shArena.appendChild(d);
            t.el = d;
        });
    }

    function startMove() {
        stopMove();
        t0 = performance.now();
        var d = DIFFS[diff];
        arenaW = el.shArena.clientWidth;
        var arenaH = el.shArena.clientHeight;
        function frame(now) {
            var t = (now - t0) / 1000;
            var shift = Math.sin(t * 0.55) * d.shift;
            targets.forEach(function (tg, i) {
                var dx = Math.sin(t * d.speed + i * 1.6) * d.range;
                var cx = (BASE[i] * arenaW) + shift + dx;
                var half = TARGET_SIZE / 2;
                if (cx < half + 6) cx = half + 6;
                if (cx > arenaW - half - 6) cx = arenaW - half - 6;
                var cy = arenaH * 0.40 + Math.sin(t * d.speed * 0.8 + i * 2.1) * d.float;
                tg.cx = cx; tg.cy = cy;
                tg.el.style.left = (cx - half) + 'px';
                tg.el.style.top = (cy - half) + 'px';
                tg.el.classList.toggle('veil', hideIdx === i);
            });
            el.shCross.style.left = (aim * arenaW) + 'px';
            rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
    }
    function stopMove() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    // 隱身循環（困難）
    setInterval(function () {
        if (state !== 'shPlay' || !DIFFS[diff].hide) { hideIdx = -1; return; }
        var s = Math.floor(performance.now() / 1000) % 6;
        hideIdx = (s === 5) ? Math.floor(performance.now() / 6000) % 4 : -1;
    }, 120);

    // ---------- 滑桿 ----------
    el.shSlider.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.shSlider.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    function onDown(e) {
        if (busy || state !== 'shPlay') return;
        dragOn = true;
        dragX0 = (e.touches ? e.touches[0].clientX : e.clientX);
        aimAtDrag = aim;
    }
    function onMove(e) {
        if (!dragOn) return;
        var x = (e.touches ? e.touches[0].clientX : e.clientX);
        var sens = gun ? gun.sens : 1;
        aim = aimAtDrag + ((x - dragX0) / (window.innerWidth * 0.55)) * sens;
        aim = Math.max(0, Math.min(1, aim));
        el.shKnob.style.left = (10 + aim * 80) + '%';
    }
    function onUp() {
        if (!dragOn) return;
        dragOn = false;
        if (state === 'shPlay' && !busy) shoot();
    }

    // ---------- 射擊 ----------
    function shoot() {
        busy = true;
        var arenaRect = el.shArena.getBoundingClientRect();
        var aimX = aim * arenaW;
        var hitIdx = -1, best = 1e9;
        targets.forEach(function (tg, i) {
            if (hideIdx === i) return;
            var dist = Math.abs(aimX - tg.cx);
            if (dist < 78 && dist < best) { best = dist; hitIdx = i; }
        });
        ammo -= 1;
        renderHud();
        // 能量彈動畫
        el.shBullet.hidden = false;
        el.shBullet.style.left = aimX + 'px';
        el.shBullet.style.top = '100%';
        var bx = aimX, by = arenaRect.height;
        requestAnimationFrame(function () {
            el.shBullet.style.left = bx + 'px';
            el.shBullet.style.top = (targets.length && hitIdx >= 0 ? targets[hitIdx].cy : arenaRect.height * 0.34) + 'px';
        });
        setTimeout(function () {
            el.shBullet.hidden = true;
            resolveShot(hitIdx);
        }, 340);
    }

    function resolveShot(hitIdx) {
        var d = DIFFS[diff];
        var title, body, extra = '', cls;
        if (hitIdx < 0) {
            title = '能量彈落空了'; body = '子彈消散，消耗 1 發彈藥。把準星對準答案靶再鬆手！'; cls = 'miss';
        } else if (hitIdx === answerIdx) {
            targets[hitIdx].el.classList.add('hit-ok');
            ammo += d.ammoAdd;
            score += d.scorePer;
            correctCount += 1;
            renderHud();
            title = '答對了！'; body = '瞄得準、答得對，繼續保持！';
            extra = '◆ 回補彈藥 +' + d.ammoAdd + '　◆ 得分 +' + d.scorePer;
            cls = 'ok';
        } else {
            targets[hitIdx].el.classList.add('hit-bad');
            targets[answerIdx].el.classList.add('hit-ok');   // 高亮正確靶，幫助記憶
            title = '答錯了・來看看解釋'; body = tip;
            extra = '正確答案：' + targets[answerIdx].letter + '　' + targets[answerIdx].text;
            cls = 'bad';
        }
        setTimeout(function () {
            el.shPopupTitle.textContent = title;
            el.shPopupTitle.className = cls;
            el.shPopupBody.textContent = body;
            el.shPopupExtra.textContent = extra;
            el.shPopupNext.textContent = (ammo <= 0 || qIndex + 1 >= TOTAL) ? '查看結算 ›' : '繼續 ›';
            show('shPopup');
        }, cls === 'ok' || cls === 'bad' ? 640 : 180);
    }

    el.shPopupNext.addEventListener('click', function () {
        busy = false;
        if (ammo <= 0 || qIndex + 1 >= TOTAL) { finish(); return; }
        qIndex += 1;
        show('shPlay');
        buildQuestion();
    });

    function finish() {
        stopMove();
        var correct = correctCount;
        var earned = Math.min(40, correct * 5);
        window.ChengStar.addPoints(earned);
        var win = (qIndex + 1) >= TOTAL && ammo > 0;
        el.shStars.innerHTML = '<span class="' + (correct >= 1 ? 'on' : '') + '">★</span>'
            + '<span class="' + (correct >= 6 ? 'on' : '') + '">★</span>'
            + '<span class="' + (correct >= 12 ? 'on' : '') + '">★</span>';
        el.shOverTitle.textContent = win ? '任務完成！' : '彈藥用完了';
        el.shOverText.textContent = win ? '全部題目挑戰完畢，正氣之光閃耀趣遊星！' : '別灰心，正氣值已經提升，再接再厲！';
        el.shOverScore.textContent = score;
        el.shOverCorrect.textContent = correct + '/' + TOTAL;
        el.shOverEarned.textContent = earned;
        show('shOver');
    }

    // 視窗變化時重算靶區寬度
    window.addEventListener('resize', function () {
        if (state === 'shPlay') arenaW = el.shArena.clientWidth;
    });

    // 每次從趣遊星進入時重置到選槍
    window.ShooterShow = function () { show('shGun'); };
})();
