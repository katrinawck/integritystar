/* ============ 主線劇情・澄星保衛戰（多幕互動劇） ============ */
(function () {
    'use strict';

    var POINTS_KEY = 'chengsing-points';
    var STORY_KEY = 'story-progress';
    var LETTERS = ['一', '二', '三', '四', '五'];

    function getPoints() { return window.ChengStar.getPoints(); }

    function loadProg() {
        try { return JSON.parse(localStorage.getItem(STORY_KEY) || '{}'); } catch (e) { return {}; }
    }
    function saveProg(p) { localStorage.setItem(STORY_KEY, JSON.stringify(p)); }

    // ---------- 劇本 ----------
    // bg: 'desolate' | 'revive' | '$style'(玩家選的風貌圖) | '$styleDim'
    var ACTS = [
        {
            id: 'act1', name: '第一幕・荒蕪之星', need: 100, cost: 0,
            sub: '抵達沈睡的清白星球',
            scenes: [
                {
                    bg: 'desolate',
                    lines: [
                        { who: '旁白', text: '浩瀚宇宙之中，曾有一顆象徵純淨與秩序的清白星球。' },
                        { who: '旁白', text: '歲月流逝，雜念、混亂與荒蕪逐漸吞噬了大地。繁花枯萎，清風停滯，整顆星球陷入沈睡。' },
                        { who: '旁白', text: '今日，你累積足夠的秩序積分，蓮蓮成功鎖定這顆荒廢星球的坐標，即將展開重建之旅。' },
                        { who: '蓮蓮', text: '【本幕任務】第一次踏上星球，先選擇你心中理想星球的初始風貌吧！' },
                    ],
                    choice: {
                        key: 'style', title: '選擇星球的初始風貌',
                        options: [
                            { v: 'pure', name: '以「純淨白蓮」為核心', img: 'assets/story/style-lotus.jpg', desc: '打造乾淨、溫柔、治癒的和平星球。' },
                            { v: 'green', name: '以「綠野生機」為核心', img: 'assets/story/style-green.jpg', desc: '打造草木繁盛、萬物復甦的自然星球。' },
                            { v: 'order', name: '以「公正秩序」為核心', img: 'assets/story/style-order.jpg', desc: '打造規整明亮、充滿規則光芒的秩序星球。' },
                        ],
                    },
                },
                {
                    bg: '$style',
                    lines: [
                        { who: '蓮蓮', text: '好美的選擇！大地聽見了你的心願，正在悄悄甦醒。' },
                        { who: '旁白', text: '【第一幕・完成】你的星球已經有了模樣。下一幕，決定誰來重建它。' },
                    ],
                },
            ],
        },
        {
            id: 'act2', name: '第二幕・重建者的身份', cost: 200,
            sub: '選擇你在星球上的身份',
            scenes: [
                {
                    bg: '$style',
                    lines: [
                        { who: '旁白', text: '星球有了風貌，卻還沒有主人。荒蕪已久的大地，需要一位真正的重建者。' },
                        { who: '蓮蓮', text: '一位願意以身作則、把廉潔種進日常的人——就是你。' },
                        { who: '蓮蓮', text: '【本幕任務】選擇你成為的身份，它會決定你重建星球的方式。' },
                    ],
                    choice: {
                        key: 'identity', title: '選擇你的重建者身份',
                        options: [
                            { v: 'teacher', name: '播種教師', icon: '📖', desc: '在學堂裡把誠信的故事教給每一顆種子，用知識抵擋貪念。' },
                            { v: 'guide', name: '清風嚮導', icon: '🍃', desc: '走遍星球每個角落，以身作則，成為居民最想成為的樣子。' },
                            { v: 'judge', name: '秩序仲裁', icon: '⚖️', desc: '制定公平的規則，讓每個人都知道：貪念有代價，公正有回報。' },
                        ],
                    },
                },
                {
                    bg: '$style',
                    lines: [
                        { who: '蓮蓮', text: '很好！從今天起，這顆星球就跟你同名字了。' },
                        { who: '旁白', text: '【第二幕・完成】身份已定。但平靜的日子，不會太久……' },
                    ],
                },
            ],
        },
        {
            id: 'act3', name: '第三幕・貪念霧靄', cost: 250,
            sub: '第一場危機降臨',
            scenes: [
                {
                    bg: '$styleDim',
                    lines: [
                        { who: '旁白', text: '星球剛有一點生氣，一股灰色的「貪念霧靄」便從地面的裂縫裡悄悄滲出。' },
                        { who: '蓮蓮', text: '不好了！有居民偷偷把公共的星光藏進了自己的口袋，霧靄越來越濃……' },
                        { who: '蓮蓮', text: '再這樣下去，星球會重新睡著的！' },
                        { who: '蓮蓮', text: '【本幕任務】選擇你的應對方式，阻止霧靄蔓延。' },
                    ],
                    choice: {
                        key: 'policy', title: '如何阻止貪念霧靄？',
                        options: [
                            { v: 'pact', name: '訂立星球公約', icon: '📜', desc: '召集所有居民共同簽訂《清白公約》，讓承諾看得見、守得住。' },
                            { v: 'school', name: '開設廉潔學堂', icon: '🏫', desc: '把貪念的代價寫成課本，從小教起，讓霧靄再也找不到縫隙。' },
                            { v: 'sunlight', name: '陽光公示台', icon: '☀️', desc: '公共星光的使用全部公開展示，讓貪念無所遁形。' },
                        ],
                    },
                },
                {
                    bg: '$styleDim',
                    lines: [
                        { who: '旁白', text: '灰霧在你選擇的光面前節節退散，裂縫裡重新透出了土壤的顏色。' },
                        { who: '蓮蓮', text: '記住，霧靄不會就此消失——它只是在等下一次考驗。' },
                        { who: '旁白', text: '【第三幕・完成】星球保住了。真正的考驗，總是悄無聲息。' },
                    ],
                },
            ],
        },
        {
            id: 'act4', name: '第四幕・微光考驗', cost: 300,
            sub: '一袋無人看見的星光',
            scenes: [
                {
                    bg: '$style',
                    lines: [
                        { who: '旁白', text: '霧靄漸散，星球迎來第一縷真正的晨光。' },
                        { who: '蓮蓮', text: '可是考驗悄悄來了：小居民阿澄在河邊撿到一袋遺失的星光，足足有一百顆。' },
                        { who: '蓮蓮', text: '沒有人看見。只要他不出聲，這袋星光就歸他了。' },
                        { who: '蓮蓮', text: '【本幕任務】這是最關鍵的一課。你會教阿澄怎麼做？' },
                    ],
                    choice: {
                        key: 'lesson', title: '你會怎麼教阿澄？',
                        options: [
                            { v: 'praise', name: '公開表揚誠實', icon: '🌟', desc: '請阿澄在全村面前歸還星光，讓誠實成為最風光的事。' },
                            { v: 'return', name: '設立拾光歸還所', icon: '🏠', desc: '建一間「拾光歸還所」，讓每一份遺失的善意都有去處。' },
                            { v: 'drama', name: '誠信小劇場', icon: '🎭', desc: '把這件事排成劇場，讓所有孩子親自演一遍「歸還的勇氣」。' },
                        ],
                    },
                },
                {
                    bg: '$style',
                    lines: [
                        { who: '阿澄', text: '我把它還回去了！雖然有點捨不得，但心裡輕輕鬆鬆的，比拿著一百顆星光還開心。' },
                        { who: '蓮蓮', text: '你看到了嗎？這就是這顆星球最珍貴的光。' },
                        { who: '旁白', text: '【第四幕・完成】誠實的種子，已經種進了下一代的志氣裡。' },
                    ],
                },
            ],
        },
        {
            id: 'act5', name: '第五幕・清風重臨', cost: 350,
            sub: '澄星甦醒',
            scenes: [
                {
                    bg: 'revive',
                    lines: [
                        { who: '旁白', text: '因為你的每一個選擇，星球的天空重新亮了起來。' },
                        { who: '蓮蓮', text: '（動態結局・依你的選擇而成）以「$styleName」為根，以「$identity」為名，用「$policy」擋住貪念，用「$lesson」把誠實種進下一代心裡。' },
                        { who: '旁白', text: '清風重臨，繁花重新盛放。沈睡已久的澄星，終於在你手中緩緩睜開了眼睛。' },
                        { who: '澄星', text: '謝謝你……我的光，回來了。' },
                        { who: '澄星', text: '這顆星球的故事還會繼續，而你就是它永遠的守護者。' },
                        { who: '旁白', text: '【第一章・完】感謝遊玩。你可以回到劇情中樞重溫任何一幕，或繼續收集星光。' },
                    ],
                },
            ],
        },
    ];

    var STYLE_NAME = { pure: '純淨白蓮', green: '綠野生機', order: '公正秩序' };
    var IDENTITY_NAME = { teacher: '播種教師', guide: '清風嚮導', judge: '秩序仲裁' };
    var POLICY_NAME = { pact: '星球公約', school: '廉潔學堂', sunlight: '陽光公示台' };
    var LESSON_NAME = { praise: '公開表揚', return: '拾光歸還所', drama: '誠信小劇場' };
    var STYLE_IMG = { pure: 'assets/story/style-lotus.jpg', green: 'assets/story/style-green.jpg', order: 'assets/story/style-order.jpg' };

    var el = {};
    ['storyHub', 'storyStage', 'storyActs', 'storyBg', 'storyTopbar', 'storyActName', 'storyPts',
     'storyDialog', 'storyWho', 'storyLine', 'storyNext', 'storyChoices'].forEach(function (id) {
        el[id] = document.getElementById(id);
    });

    var act = null, sceneIdx = 0, lineIdx = 0;

    // ---------- 劇情中樞 ----------
    function actsDone(prog) { return prog.done || []; }

    function open() {
        el.storyHub.hidden = false;
        el.storyStage.hidden = true;
        renderActs();
    }

    function renderActs() {
        var prog = loadProg();
        var done = actsDone(prog);
        el.storyActs.innerHTML = '';
        ACTS.forEach(function (a, i) {
            var prevOk = i === 0 || done.indexOf(ACTS[i - 1].id) >= 0;
            var isDone = done.indexOf(a.id) >= 0;
            var card = document.createElement('div');
            card.className = 'act-card' + (isDone ? ' done' : '') + (prevOk ? '' : ' lock');
            var needTxt = a.cost > 0
                ? (isDone ? '已換領' : '換領：消耗 ' + a.cost + ' 星光')
                : (isDone ? '已開啟' : '開啟條件：星光達 ' + a.need);
            var stateTxt = isDone ? '✓ 已完成' : (prevOk ? '' : '🔒 完成上一幕解鎖');
            card.innerHTML = '<div class="act-num">' + LETTERS[i] + '</div>'
                + '<div class="act-info"><b>' + a.name + '</b><span>' + a.sub + '</span>'
                + '<i>' + (isDone ? stateTxt : (prevOk ? needTxt : stateTxt)) + '</i></div>'
                + '<button class="btn ' + (isDone ? 'btn-ghost' : 'btn-gold') + '">' + (isDone ? '重溫 ›' : (prevOk ? '進入 ›' : '未解鎖')) + '</button>';
            card.querySelector('button').addEventListener('click', function () {
                if (!prevOk) return;
                var pts = getPoints();
                if (!isDone) {
                    if (a.cost > 0) {
                        if (pts < a.cost) { alert('星光不足！換領這一幕需要 ' + a.cost + ' 星光，你現在有 ' + pts + '。去趣遊星和明鏡星賺取星光吧！'); return; }
                        if (!confirm('換領「' + a.name + '」將消耗 ' + a.cost + ' 星光，確定嗎？')) return;
                        window.ChengStar.addPoints(-a.cost);
                    } else if (pts < a.need) {
                        alert('星光未達 ' + a.need + '！去趣遊星和明鏡星收集星光吧（現有 ' + pts + '）。');
                        return;
                    }
                }
                startAct(a);
            });
            el.storyActs.appendChild(card);
        });
    }

    // ---------- 舞台 ----------
    function bgOf(tok) {
        var prog = loadProg();
        if (tok === 'desolate') return 'url(assets/story/desolate.jpg)';
        if (tok === 'revive') return 'url(assets/story/revive.jpg)';
        if (tok === '$styleDim') return 'url(' + (STYLE_IMG[prog.style] || 'assets/story/desolate.jpg') + ')';
        if (tok === '$style') return 'url(' + (STYLE_IMG[prog.style] || 'assets/story/desolate.jpg') + ')';
        return 'url(assets/story/desolate.jpg)';
    }

    function fillText(s) {
        var prog = loadProg();
        return s.replace('$styleName', STYLE_NAME[prog.style] || '未知風貌')
                .replace('$identity', IDENTITY_NAME[prog.identity] || '重建者')
                .replace('$policy', POLICY_NAME[prog.policy] || '清白之約')
                .replace('$lesson', LESSON_NAME[prog.lesson] || '誠實之課');
    }

    function startAct(a) {
        act = a;
        sceneIdx = 0;
        lineIdx = 0;
        el.storyHub.hidden = true;
        el.storyStage.hidden = false;
        playScene();
    }

    function playScene() {
        var scene = act.scenes[sceneIdx];
        el.storyBg.style.backgroundImage = bgOf(scene.bg);
        el.storyBg.classList.toggle('dim', scene.bg === '$styleDim');
        el.storyActName.textContent = act.name;
        renderPts();
        lineIdx = 0;
        el.storyChoices.hidden = true;
        el.storyDialog.hidden = false;
        showLine();
    }

    function renderPts() {
        el.storyPts.textContent = '◆ 星光 ' + getPoints();
    }

    function showLine() {
        var scene = act.scenes[sceneIdx];
        var ln = scene.lines[lineIdx];
        el.storyWho.textContent = ln.who;
        el.storyWho.className = 'story-who who-' + (ln.who === '旁白' ? 'nar' : ln.who);
        el.storyLine.textContent = fillText(ln.text);
        el.storyLine.classList.remove('pop');
        void el.storyLine.offsetWidth;   // 重觸發動畫
        el.storyLine.classList.add('pop');
        var last = lineIdx >= scene.lines.length - 1;
        if (last && scene.choice) {
            // 台詞完且本景有選擇：藏起繼續鍵，自動浮出選項卡
            el.storyNext.hidden = true;
            el.storyChoices.hidden = true;
            setTimeout(function () { showChoices(scene.choice); }, 650);
        } else {
            el.storyNext.hidden = false;
            el.storyNext.textContent = (last && sceneIdx < act.scenes.length - 1) ? '前往下一景 ›' : (last ? '完成本幕 ›' : '繼續 ›');
        }
    }

    el.storyNext.addEventListener('click', function () {
        var scene = act.scenes[sceneIdx];
        if (lineIdx < scene.lines.length - 1) {
            lineIdx += 1;
            showLine();
            return;
        }
        // 本景台詞完
        if (scene.choice) { showChoices(scene.choice); return; }
        if (sceneIdx < act.scenes.length - 1) {
            sceneIdx += 1;
            playScene();
            return;
        }
        finishAct();
    });

    function showChoices(choice) {
        el.storyDialog.hidden = true;
        var box = el.storyChoices;
        box.innerHTML = '<h3>' + choice.title + '</h3>';
        var wrap = document.createElement('div');
        wrap.className = 'choice-row';
        choice.options.forEach(function (op) {
            var c = document.createElement('div');
            c.className = 'choice-card';
            if (op.img) {
                c.innerHTML = '<div class="choice-img" style="background-image:url(' + op.img + ')"></div>';
            } else {
                c.innerHTML = '<div class="choice-emoji">' + (op.icon || '✦') + '</div>';
            }
            var info = document.createElement('div');
            info.className = 'choice-info';
            info.innerHTML = '<b>' + op.name + '</b><p>' + op.desc + '</p>';
            c.appendChild(info);
            c.addEventListener('click', function () { pickChoice(choice.key, op); });
            wrap.appendChild(c);
        });
        box.appendChild(wrap);
        box.hidden = false;
    }

    function pickChoice(key, op) {
        var prog = loadProg();
        prog[key] = op.v;
        saveProg(prog);
        el.storyChoices.hidden = true;
        el.storyDialog.hidden = false;
        // 進入下一景
        sceneIdx += 1;
        playScene();
    }

    function finishAct() {
        var prog = loadProg();
        prog.done = prog.done || [];
        if (prog.done.indexOf(act.id) < 0) prog.done.push(act.id);
        saveProg(prog);
        open();
    }

    document.getElementById('btnStoryHome').addEventListener('click', function () { window.ChengStar.showPage('home'); });

    window.Story = { open: open };
})();
