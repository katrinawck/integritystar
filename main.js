/* ============ 澄星網站・主流程（路由/星光/主界面/案例/劇情） ============ */
(function () {
    'use strict';

    var POINTS_KEY = 'chengsing-points';
    var CASE_KEY = 'case-progress';
    var STORY_UNLOCK = 300;

    // ---------- 星光 ----------
    function getPoints() {
        var v = parseInt(localStorage.getItem(POINTS_KEY) || '0', 10);
        return isNaN(v) ? 0 : v;
    }
    function addPoints(n) {
        localStorage.setItem(POINTS_KEY, String(getPoints() + n));
        renderPoints();
    }
    function renderPoints() {
        document.getElementById('pointsNum').textContent = getPoints();
    }

    // ---------- 路由 ----------
    var pages = ['splash', 'home', 'game', 'shooter', 'case', 'story'];
    var current = 'splash';
    window.showPage = function (id) {
        pages.forEach(function (p) {
            document.getElementById('page-' + p).hidden = (p !== id);
        });
        current = id;
        document.getElementById('btnHome').hidden = (id === 'splash' || id === 'home');
        if (id === 'story') renderStory();
        if (id === 'case') buildCarousel();
    };

    document.getElementById('btnStart').addEventListener('click', function () { showPage('home'); });
    document.getElementById('btnHome').addEventListener('click', function () { showPage('home'); });
    document.getElementById('topHome').addEventListener('click', function () { showPage('home'); });

    // ---------- 主界面：星球 ----------
    var PLANETS = {
        game: {
            name: '趣遊星', tag: '遊戲站', mascot: 'assets/pingping.png',
            desc: '在遊戲星球放鬆身心！《清風消消樂》拖動圖案、清除騙子木偶與謊言炸彈，無限關卡越後越難；《廉潔神槍手》滑動瞄準、射擊答案靶，邊射邊學廉潔知識！',
            enter: function () { showPage('game'); if (window.GameInit) window.GameInit(); },
            btn: '進入遊戲站',
        },
        case: {
            name: '明鏡星', tag: '澳門案例研讀', mascot: 'assets/qingqing.png',
            desc: '閱讀澳門本地真實廉潔案例，讀完回答「案例放大鏡」的題目，答對即獲得星光積分。目前收錄 5 篇真實案例：警隊洩密受賄、社服機構圍標、前助理檢察長瀆職、速遞公司回佣、選舉提名賄選。',
            enter: function () { showPage('case'); },
            btn: '前往研讀',
        },
        story: {
            name: '澄星', tag: '主線劇情・澄星保衛戰', mascot: 'assets/lianlian.png',
            desc: '廉潔之星「澄星」的平衡被貪念擾亂。在另外兩顆星球完成任務、收集星光積分，達到 300 星光即可解鎖主線劇情，一步步光復澄星。',
            enter: function () { showPage('story'); },
            btn: '前往澄星',
        },
    };
    var picked = 'game';

    document.querySelectorAll('.planet-hotspot').forEach(function (el) {
        el.addEventListener('click', function () {
            picked = el.dataset.key;
            var p = PLANETS[picked];
            document.getElementById('cardMascot').src = p.mascot;
            document.getElementById('cardName').textContent = p.name;
            document.getElementById('cardTag').textContent = p.tag;
            document.getElementById('cardDesc').textContent = p.desc;
            var st = document.getElementById('cardStatus');
            if (picked === 'story') {
                st.hidden = false;
                st.textContent = getPoints() >= STORY_UNLOCK
                    ? '已可解鎖！劇情章節即將登場'
                    : '目前星光 ' + getPoints() + ' / ' + STORY_UNLOCK + '，到其他星球收集星光吧';
            } else if (picked === 'case') {
                st.hidden = false;
                st.textContent = '已收錄 5 篇真實案例，答對一篇 +40 星光';
            } else {
                st.hidden = true;
            }
            var btn = document.getElementById('cardEnter');
            btn.textContent = p.btn;
            document.getElementById('planetCard').hidden = false;
        });
    });
    document.getElementById('cardClose').addEventListener('click', function () {
        document.getElementById('planetCard').hidden = true;
    });
    document.getElementById('planetCard').addEventListener('click', function (e) {
        if (e.target === this) this.hidden = true;
    });
    document.getElementById('cardEnter').addEventListener('click', function () {
        var p = PLANETS[picked];
        if (picked === 'story' && getPoints() < STORY_UNLOCK) {
            document.getElementById('guideBubble').textContent = '星光不足 ' + STORY_UNLOCK + '，先去其他星球收集吧！';
            document.getElementById('planetCard').hidden = true;
            return;
        }
        document.getElementById('planetCard').hidden = true;
        p.enter();
    });

    // 吉祥物台詞輪播
    var TIPS = ['歡迎來到澄星！', '點點星球看看有什麼吧～', '星光越多，劇情開得越快喔！'];
    var tipIdx = 0;
    setInterval(function () {
        if (current !== 'home') return;
        tipIdx = (tipIdx + 1) % TIPS.length;
        document.getElementById('guideBubble').textContent = TIPS[tipIdx];
    }, 5200);

    // ---------- 明鏡星・案例研讀 ----------
    var CASES = DATA.cases;
    var activeIdx = 0;
    var caseDone = {};
    try { caseDone = JSON.parse(localStorage.getItem(CASE_KEY) || '{}'); } catch (e) { caseDone = {}; }

    function caseUnlocked(i) {
        return i === 0 || caseDone[CASES[i - 1].id];
    }
    function caseAllDone() {
        return CASES.every(function (c) { return caseDone[c.id]; });
    }

    function buildCarousel() {
        var wrap = document.getElementById('caseCards');
        wrap.innerHTML = '';
        var N = CASES.length;
        CASES.forEach(function (c, i) {
            var d = ((i - activeIdx) % N + N) % N;   // 0 中央, 1 右, N-1 左
            if (d > 2) d = d - N;
            var el = document.createElement('div');
            var unlocked = caseUnlocked(i);
            el.className = 'case-card ' + (d === 0 ? 'center' : 'side') + (unlocked ? '' : ' locked');
            var off = d === 0 ? 0 : (d === 1 ? 440 : -440);
            var scale = d === 0 ? 1 : 0.82;
            var op = d === 0 ? 1 : (Math.abs(d) === 1 ? 0.55 : 0);
            var z = d === 0 ? 3 : (Math.abs(d) === 1 ? 2 : 1);
            el.style.transform = 'translate(calc(-50% + ' + off + 'px), -50%) scale(' + scale + ')';
            el.style.opacity = op;
            el.style.zIndex = z;
            el.style.pointerEvents = (op > 0 ? 'auto' : 'none');
            var summary = c.summary || (c.story.slice(0, 64) + '……');
            el.innerHTML = '<span class="num">案例 ' + (i + 1) + ' / ' + N + (caseDone[c.id] ? '　✓ 已完成' : '') + '</span>'
                + '<h4>' + c.title + '</h4>'
                + '<p class="summ">' + summary + '</p>'
                + '<span class="tagline">' + (unlocked ? (d === 0 ? '點擊進入研讀 ›' : '點擊切換到此卡') : '完成上一篇解鎖') + '</span>';
            el.addEventListener('click', function () {
                if (d !== 0) { activeIdx = i; buildCarousel(); return; }
                if (!unlocked) { alert('先完成上一篇案例，才能解鎖這一篇喔！'); return; }
                openCase(i);
            });
            wrap.appendChild(el);
        });
        document.getElementById('caseStage').hidden = true;
        document.getElementById('caseCarousel').style.display = 'flex';
    }
    document.getElementById('casePrev').addEventListener('click', function () {
        activeIdx = (activeIdx - 1 + CASES.length) % CASES.length; buildCarousel();
    });
    document.getElementById('caseNext').addEventListener('click', function () {
        activeIdx = (activeIdx + 1) % CASES.length; buildCarousel();
    });

    // 把正文按 highlights 切成高亮片段
    function storyParts(c) {
        var parts = [{ t: '', hl: false }];
        var text = c.story;
        var marks = [];
        (c.highlights || []).forEach(function (h) {
            var at = text.indexOf(h);
            if (at >= 0) marks.push([at, at + h.length]);
        });
        marks.sort(function (a, b) { return a[0] - b[0]; });
        var merged = [];
        marks.forEach(function (m) {
            if (merged.length && m[0] < merged[merged.length - 1][1]) return;
            merged.push(m);
        });
        var out = [];
        var pos = 0;
        merged.forEach(function (m) {
            if (m[0] > pos) out.push({ t: text.slice(pos, m[0]), hl: false });
            out.push({ t: text.slice(m[0], m[1]), hl: true });
            pos = m[1];
        });
        if (pos < text.length) out.push({ t: text.slice(pos), hl: false });
        return out;
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    var stageCase = null;
    function openCase(i) {
        stageCase = CASES[i];
        document.getElementById('caseCarousel').style.display = 'none';
        document.getElementById('caseStage').hidden = false;
        renderStoryStage();
    }
    document.getElementById('caseBack').addEventListener('click', buildCarousel);

    function renderStoryStage() {
        document.getElementById('stageTitle').textContent = stageCase.title;
        document.getElementById('stageStep').textContent = '第一步・細讀案例';
        var body = document.getElementById('stageBody');
        body.innerHTML = '';
        storyParts(stageCase).forEach(function (p) {
            var span = document.createElement('span');
            if (p.hl) span.className = 'story-hl';
            span.textContent = p.t;
            body.appendChild(span);
        });
        var foot = document.getElementById('stageFoot');
        foot.innerHTML = '';
        var btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = '我讀完了，去答題 ›';
        btn.addEventListener('click', renderQuizStage);
        foot.appendChild(btn);
    }

    function renderQuizStage() {
        document.getElementById('stageStep').textContent = '第二步・案例放大鏡';
        var body = document.getElementById('stageBody');
        var foot = document.getElementById('stageFoot');
        foot.innerHTML = '';
        var letters = ['A', 'B', 'C', 'D'];
        var order = shuffle([0, 1, 2, 3]);
        body.innerHTML = '<p style="font-weight:700;font-size:17px;margin-bottom:12px;">' + stageCase.question + '</p>';
        var pickedIdx = -1;
        order.forEach(function (oi, k) {
            var div = document.createElement('div');
            div.className = 'opt';
            div.innerHTML = '<span class="abc">' + letters[k] + '</span><span>' + stageCase.options[oi] + '</span>';
            div.addEventListener('click', function () {
                if (pickedIdx >= 0) return;
                pickedIdx = k;
                var correct = (oi === stageCase.answerIndex);
                document.querySelectorAll('#stageBody .opt').forEach(function (el, idx) {
                    var oi2 = order[idx];
                    el.querySelector('.abc').textContent = letters[idx];
                    if (oi2 === stageCase.answerIndex) el.classList.add('right');
                    else if (idx === pickedIdx) el.classList.add('wrong');
                });
                showAnswerStage(correct);
            });
            body.appendChild(div);
        });
    }

    function showAnswerStage(correct) {
        document.getElementById('stageStep').textContent = '第三步・答案與解析';
        var body = document.getElementById('stageBody');
        var foot = document.getElementById('stageFoot');
        body.innerHTML = '<div class="ans-box"><b>' + (correct ? '答對了！' : '答錯了，沒關係。') + '</b><br>'
            + stageCase.analysis + '</div>'
            + '<p class="src-box">資料來源：' + stageCase.source + '</p>';
        foot.innerHTML = '';
        var btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = '收取星光，返回展台 ›';
        btn.addEventListener('click', function () {
            if (correct && !caseDone[stageCase.id]) {
                caseDone[stageCase.id] = true;
                localStorage.setItem(CASE_KEY, JSON.stringify(caseDone));
                addPoints(40);
            }
            buildCarousel();
        });
        foot.appendChild(btn);
    }

    // ---------- 劇情 ----------
    function renderStory() {
        var pts = getPoints();
        document.getElementById('storyPoints').textContent = pts + ' / ' + STORY_UNLOCK;
        document.getElementById('storyBar').style.width = Math.min(100, pts / STORY_UNLOCK * 100) + '%';
        document.getElementById('storyLock').textContent = pts >= STORY_UNLOCK
            ? '已達標！第一章正在趕製中，敬請期待'
            : '還差 ' + (STORY_UNLOCK - pts) + ' 星光解鎖劇情，加油！';
    }
    document.getElementById('btnStoryHome').addEventListener('click', function () { showPage('home'); });

    // ---------- 提供給其他模組 ----------
    window.ChengStar = {
        getPoints: getPoints,
        addPoints: addPoints,
        showPage: showPage,
    };

    renderPoints();
})();
