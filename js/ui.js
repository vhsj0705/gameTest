/* 화면과 시간 흐름 */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const SAVE_KEY = 'gameTest-life-save';
const FOCI = [['balance', '균형'], ['health', '건강'], ['study', '공부·일'], ['social', '관계'], ['money', '돈 모으기'], ['rest', '쉬기']];
const FOCUS_NOTE = { balance: '골고루 지내요.', health: '운동과 검진에 힘써요. 건강이 더 천천히 닳아요.', study: '배움에 힘써요. 지식이 더 빨리 늘어요.', social: '사람을 만나요. 관계가 늘어요.', money: '아껴 쓰고 모아요. 저축이 늘어요.', rest: '쉬엄쉬엄 지내요. 행복이 오르고 저축은 줄어요.' };

let L = null, running = false, speed = 1, progress = 0, current = null, last = 0, resolving = false;

function show(id) { ['start', 'play', 'end'].forEach((s) => $('#' + s).classList.toggle('hidden', s !== id)); window.scrollTo(0, 0); }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 1800); }

/* ───── 시작 ───── */
function readStart() {
  const mode = $('#yearMode').value;
  let year = null;
  if (mode === 'random') year = randomBirthYear(1940, 2025);
  else if (mode === 'past') year = randomBirthYear(1940, 1979);
  else if (mode === 'now') year = randomBirthYear(1980, 2025);
  else year = Math.max(1940, Math.min(2025, parseInt($('#yearPick').value, 10) || 1970));
  return { year, secPerYear: parseInt($('#lifeLen').value, 10) / 80 };
}
function begin(life) {
  L = life; speed = 1; progress = 0; running = true; current = null; resolving = false;
  $$('#speedBtns .btn').forEach((b) => b.classList.toggle('on', b.dataset.s === '1'));
  $('#btnPause').textContent = '⏸';
  show('play'); renderAll();
  last = performance.now();
  requestAnimationFrame(loop);
}
$('#yearMode').addEventListener('change', (e) => $('#yearPickWrap').classList.toggle('hidden', e.target.value !== 'pick'));
$('#btnBirth').addEventListener('click', () => { const o = readStart(); begin(newLife(o)); });
$('#btnContinue').addEventListener('click', () => {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!s) return; s.queue = []; begin(s); } catch (e) { toast('저장된 기록을 불러오지 못했어요'); }
});
try { if (localStorage.getItem(SAVE_KEY)) $('#btnContinue').classList.remove('hidden'); } catch (e) { /* 저장소를 쓸 수 없어도 괜찮아요 */ }

/* ───── 컨트롤 ───── */
$('#btnPause').addEventListener('click', () => { running = !running; $('#btnPause').textContent = running ? '⏸' : '▶'; if (running) { last = performance.now(); requestAnimationFrame(loop); } });
$('#speedBtns').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.s; $$('#speedBtns .btn').forEach((x) => x.classList.toggle('on', x === b)); });
$('#btnQuit').addEventListener('click', () => { running = false; if (confirm('처음 화면으로 돌아갈까요? 진행 상황은 저장돼 있어요.')) { saveGame(); show('start'); $('#btnContinue').classList.remove('hidden'); } else if (L && !L.dead) { running = true; last = performance.now(); requestAnimationFrame(loop); } });
$('#auto').addEventListener('change', () => { if ($('#auto').checked && current && !resolving) setTimeout(autoResolve, 500); });

function saveGame() {
  if (!L || L.dead) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } return; }
  try { const c = Object.assign({}, L, { queue: [] }); localStorage.setItem(SAVE_KEY, JSON.stringify(c)); } catch (e) { /* 무시 */ }
}

/* ───── 시간 흐름 ───── */
function loop(now) {
  if (!running || !L) return;
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  if (!current && !L.dead) {
    progress += dt * speed / L.secPerYear;
    $('#yearBar').style.width = Math.min(100, progress * 100) + '%';
    if (progress >= 1) { progress = 0; step(); }
  }
  requestAnimationFrame(loop);
}
function step() {
  tick(L);
  renderAll();
  if (L.dead) return finish();
  saveWhenIdle();
  nextDecision();
}
function saveWhenIdle() { if (!L.queue.length) saveGame(); }
function nextDecision() {
  if (L.dead) return finish();
  if (!L.queue.length) { current = null; $('#modal').classList.add('hidden'); saveGame(); return; }
  current = L.queue.shift();
  if ($('#auto').checked && current.kind !== 'question') { openModal(current); setTimeout(autoResolve, 700); }
  else if ($('#auto').checked && current.kind === 'question') { current = null; nextDecision(); }
  else openModal(current);
}
function autoResolve() { if (!current || resolving) return; pickOption(autoChoose(L, current)); }

/* ───── 결정 창 ───── */
function openModal(d) {
  resolving = false;
  $('#mTag').textContent = d.kind === 'question' ? '잠시 멈춤' : d.history ? '시대의 사건' : '결정의 순간';
  $('#mTitle').textContent = d.title;
  $('#mBody').textContent = d.body;
  $('#mResult').classList.add('hidden');
  const note = $('#mNote'); note.value = ''; note.classList.toggle('hidden', d.kind !== 'question');
  const box = $('#mOpts'); box.innerHTML = '';
  d.options.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt';
    b.innerHTML = `<b></b>${o.hint ? '<small></small>' : ''}`;
    b.querySelector('b').textContent = o.label;
    if (o.hint) b.querySelector('small').textContent = o.hint;
    b.addEventListener('click', () => pickOption(i));
    box.appendChild(b);
  });
  $('#modal').classList.remove('hidden');
}
function pickOption(i) {
  if (!current || resolving) return;
  resolving = true;
  const d = current;
  if (d.kind === 'question') { const t = $('#mNote').value.trim(); if (t) { L.notes.push({ age: L.age, q: d.body, a: t }); log(L, `💭 "${t}"`, 'life'); } d.options[i].run && d.options[i].run(L); }
  let resText = '';
  if (d.kind !== 'question') resText = choose(L, d, i);
  renderAll();
  current = null;
  if (L.dead) { $('#modal').classList.add('hidden'); return finish(); }
  const delay = d.kind === 'question' ? 0 : $('#auto').checked ? 600 : 900;
  if (d.kind !== 'question') {
    $('#mResult').textContent = resText || '선택했어요.';
    $('#mResult').classList.remove('hidden');
    $$('#mOpts .opt').forEach((b) => { b.disabled = true; });
  }
  setTimeout(() => { resolving = false; nextDecision(); }, delay);
}

/* ───── 그리기 ───── */
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function renderAll() { renderBar(); renderStats(); renderEra(); renderLog('#log', L.log, false); }
function renderBar() {
  $('#barAge').textContent = L.age + '세';
  $('#barYear').textContent = L.year + '년' + (L.year > 2025 ? ' (예상)' : '');
  $('#barWhere').textContent = (L.rural ? L.region + ' 농어촌' : L.region) + ' · ' + (L.sex === 'M' ? '남' : '여');
}
function renderStats() {
  [['health', L.health], ['happy', L.happy], ['know', L.know], ['rel', L.rel]].forEach(([k, v]) => {
    const row = $(`.stat[data-k=${k}]`); row.querySelector('i').style.width = v + '%'; row.querySelector('b').textContent = Math.round(v);
  });
  const partner = { none: '혼자', dating: '연애 중', married: '결혼', divorced: '이혼', widowed: '사별' }[L.partner];
  const jobTxt = L.retired ? '은퇴' : L.job ? L.job.n : L.phase !== 'none' ? { elem: '초등학생', mid: '중학생', high: '고등학생', univ: '대학생' }[L.phase] : L.age < 7 ? '아이' : '일자리 없음';
  const rows = [
    ['학력', EDU_NAMES[L.edu] + (L.phase !== 'none' ? ' · 재학 중' : '')],
    ['하는 일', jobTxt],
    ['연소득', L.income ? man(L.income) : '-'],
    ['순자산', man(netWorth(L))],
    ['가족', partner + (L.kids.length ? ` · 자녀 ${L.kids.length}` : '')],
    ['주거', L.house ? '자가' : L.flags.rent ? '월세' : L.age < 25 ? '부모 집' : '전세'],
  ];
  $('#facts').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  const f = $('#focus');
  if (!f.children.length) {
    FOCI.forEach(([k, n]) => { const b = document.createElement('button'); b.className = 'btn'; b.dataset.k = k; b.textContent = n; b.addEventListener('click', () => { L.focus = k; renderStats(); }); f.appendChild(b); });
  }
  $$('#focus .btn').forEach((b) => b.classList.toggle('on', b.dataset.k === L.focus));
  $('#focusNote').textContent = FOCUS_NOTE[L.focus];
}
function renderEra() {
  const y = L.year;
  const news = TICKERS.filter((t) => t[0] <= y).slice(-1)[0];
  const e0 = interp(E0_KNOTS, y).toFixed(1), tfr = interp(TFR_KNOTS, y).toFixed(2), col = Math.round(interp(COLLEGE_KNOTS, y) * 100), urban = Math.round(interp(URBAN_KNOTS, y) * 100);
  $('#era').innerHTML = `<b>${y}년의 대한민국</b> · 기대수명 ${e0}세 · 출산율 ${tfr}명 · 대학 진학률 ${col}% · 도시 거주 ${urban}%` + (news ? `<br>최근 소식: ${esc(news[1])}` : '');
}
function renderLog(sel, entries, onlyFav) {
  const ol = $(sel); ol.innerHTML = '';
  const list = entries.map((e, i) => [e, i]).filter(([e]) => !onlyFav || e.fav || e.kind === 'birth' || e.kind === 'death').reverse().slice(0, onlyFav === false ? 400 : 1000);
  list.forEach(([e, i]) => {
    const li = document.createElement('li'); li.className = e.kind;
    li.innerHTML = `<span class="when">${e.age}세<br>${e.year}</span><span></span><button class="star ${e.fav ? 'on' : ''}" title="기억에 남기기">${e.fav ? '★' : '☆'}</button>`;
    li.children[1].textContent = e.text;
    li.querySelector('.star').addEventListener('click', (ev) => { e.fav = !e.fav; ev.target.classList.toggle('on', e.fav); ev.target.textContent = e.fav ? '★' : '☆'; });
    ol.appendChild(li);
  });
}

/* ───── 결과 ───── */
const PHASE_COLOR = { dead: '#444', baby: '#8a93a8' };
function finish() {
  running = false; current = null; saveGame();
  const e0 = interp(E0_KNOTS, L.birthYear);
  const ageTxt = L.age >= e0 + 5 ? '그해 태어난 사람들의 평균보다 오래 살았어요.' : L.age <= e0 - 15 ? '그해 태어난 사람들의 평균보다 훨씬 일찍 떠났어요.' : '그해 태어난 사람들의 평균 수명과 비슷했어요.';
  $('#endEyebrow').textContent = `${L.birthYear}년생 · ${L.sex === 'M' ? '남자' : '여자'} · ${L.rural ? L.region + ' 농어촌' : L.region} · ${TIERS[L.tier].n}`;
  $('#endTitle').textContent = `${L.age}년의 삶`;
  $('#endLead').textContent = `${L.year}년, ${L.age}세에 ${L.cause}(으)로 세상을 떠났어요. ${ageTxt}`;
  const avgHappy = L.snaps.reduce((a, s) => a + s.happy, 0) / L.snaps.length;
  const rows = [
    ['태어난 해', `${L.birthYear}년 (기대수명 약 ${e0.toFixed(0)}세)`], ['떠난 나이', `${L.age}세`], ['최종 학력', EDU_NAMES[L.edu]],
    ['평생 평균 행복', Math.round(avgHappy) + ' / 100'], ['마지막 순자산', man(netWorth(L)) + ' (2025년 가치)'],
    ['가족', ({ married: '결혼', divorced: '이혼', widowed: '사별', none: '혼자', dating: '연애 중' })[L.partner] + (L.kids.length ? ` · 자녀 ${L.kids.length}명` : '')],
    ['집', L.house ? '자가 보유' : '자가 없음'], ['기록한 순간', L.log.filter((x) => x.fav).length + '개'],
  ];
  $('#endFacts').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  drawCurve(); drawMap();
  const nw = $('#notesWrap'); nw.classList.toggle('hidden', !L.notes.length);
  $('#notes').innerHTML = L.notes.map((n) => `<li>${n.age}세 — ${esc(n.a)}</li>`).join('');
  $('#toggleAll').textContent = '전체 기록 보기'; showAll = false; renderLog('#endLog', L.log, true);
  show('end');
}
let showAll = false;
$('#toggleAll').addEventListener('click', () => { showAll = !showAll; $('#toggleAll').textContent = showAll ? '남긴 순간만 보기' : '전체 기록 보기'; renderLog('#endLog', L.log, !showAll); });
$('#btnAgain').addEventListener('click', () => { show('start'); });
$('#btnShare').addEventListener('click', () => {
  const t = `[5천만 분의 1] ${L.birthYear}년 ${L.rural ? L.region + ' 농어촌' : L.region}에서 ${L.sex === 'M' ? '남자' : '여자'}로 태어나 ${L.age}세에 ${L.cause}(으)로 생을 마쳤어요. (${EDU_NAMES[L.edu]}, 평생 평균 행복 ${Math.round(L.snaps.reduce((a, s) => a + s.happy, 0) / L.snaps.length)})`;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('복사했어요'), () => toast('복사하지 못했어요'));
});

function drawMap() {
  const box = $('#lifeMap'); box.innerHTML = '';
  L.snaps.forEach((s) => {
    const i = document.createElement('i');
    const c = s.phase === 'dead' ? PHASE_COLOR.dead : `hsl(${Math.round(s.happy * 1.2)}, 55%, ${s.phase === 'school' ? 58 : 46}%)`;
    i.style.background = c; i.title = `${s.age}세 · ${s.year}년 · 행복 ${Math.round(s.happy)}`;
    box.appendChild(i);
  });
  $('#mapLegend').innerHTML = '<span style="--c:hsl(0,55%,46%)">불행</span><span style="--c:hsl(60,55%,46%)">보통</span><span style="--c:hsl(120,55%,46%)">행복</span><span style="--c:#444">떠남</span>';
}
function drawCurve() {
  const W = 360, H = 190, pad = 28;
  const M = interp(MODE_KNOTS[L.sex], L.birthYear);
  const pts = []; let s = 1;
  for (let a = 0; a <= 110; a++) {
    pts.push([a, s]);
    s *= 1 - annualQ(a, L.birthYear + a, interp(MODE_KNOTS[L.sex], L.birthYear + a));
  }
  const X = (a) => pad + a / 110 * (W - pad - 8), Y = (v) => 8 + (1 - v) * (H - 8 - pad);
  const path = pts.map(([a, v], i) => (i ? 'L' : 'M') + X(a).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const dv = (pts[Math.min(110, L.age)] || [0, 0])[1];
  $('#curve').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="생존 곡선">
    <g stroke="var(--line)" stroke-width="1"><line x1="${pad}" y1="${Y(1)}" x2="${W - 8}" y2="${Y(1)}"/><line x1="${pad}" y1="${Y(0.5)}" x2="${W - 8}" y2="${Y(0.5)}"/><line x1="${pad}" y1="${Y(0)}" x2="${W - 8}" y2="${Y(0)}"/></g>
    <path d="${path}" fill="none" stroke="var(--accent2)" stroke-width="2.5"/>
    <line x1="${X(L.age)}" y1="${Y(0)}" x2="${X(L.age)}" y2="${Y(dv)}" stroke="var(--bad)" stroke-width="2" stroke-dasharray="4 3"/>
    <circle cx="${X(L.age)}" cy="${Y(dv)}" r="5" fill="var(--bad)"/>
    <g fill="var(--muted)" font-size="10"><text x="2" y="${Y(1) + 4}">100%</text><text x="6" y="${Y(0.5) + 4}">50%</text><text x="${pad}" y="${H - 8}">0세</text><text x="${X(50) - 8}" y="${H - 8}">50세</text><text x="${X(100) - 12}" y="${H - 8}">100세</text></g></svg>`;
  $('#curveNote').textContent = `같은 해(${L.birthYear}년)에 태어난 ${L.sex === 'M' ? '남자' : '여자'}가 각 나이까지 살아 있을 확률이에요. 빨간 점이 이번 삶이에요.`;
}

$('#btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(buildRecord(L), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'life-record-' + L.birthYear + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  toast('저장했어요. Godot 재생기에서 열어 보세요');
});
