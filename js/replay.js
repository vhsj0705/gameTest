/* 인생이 끝나면 중요한 순간을 골라 도트 장면(js/pixelstage.js)과 함께 재생해요.
   순간을 고르는 규칙은 godot/scripts/highlights.gd 와 같아요. */

const Highlights = (() => {
  const RULES = [
    ['disaster', ['붕괴', '화재', '참사']], ['virus', ['코로나', '메르스', '신종 플루']], ['accident', ['교통사고', '넘어져']],
    ['war', ['한국전쟁', '전쟁', '피난', '전선']], ['protest', ['4·19', '시위', '촛불', '민주항쟁', '5·18', '광주', '6월', '거리로']],
    ['crisis', ['IMF', '외환위기', '구조조정', '금 모으기', '금반지', '일자리를 잃', '신용불량', '빚', '카드 돌려막기', '망해']],
    ['abroad', ['독일', '중동', '해외', '이민', '유학', '파병']], ['military', ['입대', '군에', '복무', '병역']],
    ['wedding', ['결혼식', '결혼', '맞선']], ['family', ['아이가 태어', '자녀', '첫 아이', '독립했']],
    ['house', ['내 집', '집을', '집값', '전세', '월세', '청약', '영끌', '대출']], ['loss', ['떠나셨', '세상을 떠', '사별', '이혼', '외로', '헤어']],
    ['hospital', ['큰 병', '치료', '치매', '병원', '진단']], ['retire', ['퇴직', '은퇴', '정년']],
    ['celebrate', ['월드컵', '올림픽', '로또', '당첨', '합격', '성과를 인정']], ['graduation', ['졸업']],
    ['school', ['입학', '학교', '중학교', '고등학교', '초등', '대학', '재수', '학원']], ['factory', ['공장', '여공', '노동자', '소년 노동', '안내양', '일터']],
    ['office', ['취업', '직원', '승진', '회사', '공무원', '대기업', '중소기업', '창업', '전문직', '일자리', '일하게']],
    ['city', ['도시', '상경', '이농']], ['farm', ['농', '시골', '고향']], ['friends', ['친구', '취미', '인연', '연애', '만난']],
  ];
  const TITLES = {
    birth: '세상에 태어나다', death: '삶의 끝에서', disaster: '무너진 하루', virus: '마스크의 시대', accident: '예기치 못한 사고', war: '전쟁의 한가운데',
    protest: '거리의 목소리', crisis: '외환위기의 그늘', abroad: '먼 나라로', military: '군 복무', wedding: '새 출발', family: '가족이 생기다',
    house: '내 집 이야기', loss: '이별과 상실', hospital: '병과 싸우다', retire: '긴 하루를 마치고', celebrate: '환호의 순간', graduation: '졸업의 날',
    school: '배움의 시간', factory: '공장의 불빛', office: '일터에서', city: '도시로 가는 기차', farm: '고향의 들녘', friends: '함께한 사람들',
    news: '그날의 뉴스', rain: '마음에 내린 비',
  };
  const COLORS = {
    birth: '#6fd3c0', death: '#8a93a8', war: '#e8603a', protest: '#f2c879', crisis: '#e84a4a', disaster: '#c0504a', wedding: '#f08aa8', family: '#f5a85a',
    house: '#7fb4f0', school: '#7fb4f0', graduation: '#9a8af0', office: '#6aa0e8', factory: '#a9a398', farm: '#d9b04a', city: '#8a7ac0', hospital: '#e8707d',
    retire: '#ff9a5a', celebrate: '#ffd45a', loss: '#6a7a8f', friends: '#7fd38a', abroad: '#4aa0e8', military: '#6f8f4a', virus: '#e05a4a', accident: '#d0a030',
  };
  const MILESTONES = ['태어났', '입학', '졸업', '결혼', '아이가', '취업', '일하게', '내 집', '집을', '이혼', '사별', '퇴직', '입대', '상경', '합격', '승진', '세상을 떠'];

  function classify(e) {
    if (e.kind === 'death') return 'death';
    if (e.kind === 'birth') return 'birth';
    for (const [scene, kws] of RULES) if (kws.some((k) => e.text.includes(k))) return scene;
    if (e.kind === 'news') return 'news';
    if (e.kind === 'good') return 'celebrate';
    if (e.kind === 'bad') return 'rain';
    return 'friends';
  }
  function score(e) {
    let s = e.fav ? 12 : 0;
    s += { birth: 100, death: 100, choice: 5, bad: 4, good: 4, work: 3, school: 3, life: 3, news: 1 }[e.kind] || 0;
    if (MILESTONES.some((m) => e.text.includes(m))) s += 4;
    return s;
  }
  function split(text) {
    if (text.startsWith('[선택] ')) {
      const body = text.slice(5), k = body.indexOf(' → ');
      return k < 0 ? { choice: body, result: '' } : { choice: body.slice(0, k), result: body.slice(k + 3) };
    }
    return { choice: '', result: text };
  }
  function pick(log, maxN = 14) {
    const cands = log.map((e, i) => ({ i, e, scene: classify(e), score: score(e) }));
    const chosen = cands.filter((c) => c.scene === 'birth' || c.scene === 'death');
    const rest = cands.filter((c) => c.scene !== 'birth' && c.scene !== 'death').sort((a, b) => b.score - a.score || a.i - b.i);
    const per = {}, years = {};
    for (const c of rest) {
      if (chosen.length >= maxN) break;
      if (c.score < 4 || (per[c.scene] || 0) >= 2 || years[c.e.year]) continue;
      per[c.scene] = (per[c.scene] || 0) + 1; years[c.e.year] = 1; chosen.push(c);
    }
    chosen.sort((a, b) => a.i - b.i);
    return chosen.map((c) => {
      const p = split(c.e.text);
      const bad = c.e.kind === 'bad' || ['war', 'disaster', 'crisis', 'loss', 'accident', 'virus', 'death'].includes(c.scene);
      const good = c.e.kind === 'good' || ['celebrate', 'wedding', 'family', 'graduation', 'birth'].includes(c.scene);
      return { age: c.e.age, year: c.e.year, scene: c.scene, title: TITLES[c.scene] || '순간', choice: p.choice, result: p.result, fav: !!c.e.fav, mood: bad ? 'bad' : good ? 'good' : '' };
    });
  }
  return { pick, COLORS };
})();

/* ───────── 재생기 ───────── */
const Replay = (() => {
  const SCENE_SEC = 7;
  let picks = [], casts = [], idx = -1, t = 0, playing = false, speed = 1, raf = 0, last = 0, ctx = null, el = null, done = false;
  const q = (s) => document.querySelector(s);

  function bind() {
    if (el) return;
    el = {
      canvas: q('#rCanvas'), age: q('#rAge'), year: q('#rYear'), title: q('#rTitle'), choice: q('#rChoice'), text: q('#rText'),
      tl: q('#rTimeline'), play: q('#rPlay'), box: q('#replay'),
    };
    ctx = el.canvas.getContext('2d');
    el.play.addEventListener('click', () => { playing = !playing; el.play.textContent = playing ? '⏸' : '▶'; if (playing) { last = performance.now(); loop(last); } });
    q('#rPrev').addEventListener('click', () => go(Math.max(0, idx - 1)));
    q('#rNext').addEventListener('click', () => go(Math.min(picks.length - 1, idx + 1)));
    q('#rAgain').addEventListener('click', () => start(null));
    q('#rSpeed').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.s; q('#rSpeed').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); });
    el.tl.addEventListener('click', (e) => { const seg = e.target.closest('[data-i]'); if (seg) go(+seg.dataset.i); });
  }
  function buildTimeline() {
    el.tl.innerHTML = '';
    picks.forEach((p, i) => {
      const s = document.createElement('div'); s.dataset.i = i; s.title = `${p.year}년 · ${p.title}`;
      s.style.setProperty('--c', Highlights.COLORS[p.scene] || '#98a3bd'); s.innerHTML = '<i></i>';
      el.tl.appendChild(s);
    });
  }
  function go(i) {
    idx = i; t = 0; done = false;
    const p = picks[i];
    el.age.textContent = p.age + '세'; el.year.textContent = p.year + '년';
    el.title.textContent = (p.fav ? '★ ' : '') + p.title;
    el.choice.textContent = p.choice ? '선택 · ' + p.choice : '';
    el.text.textContent = p.result;
    el.text.style.opacity = 0;
    [...el.tl.children].forEach((s, k) => { s.classList.toggle('past', k < i); s.classList.toggle('now', k === i); s.firstChild.style.width = k < i ? '100%' : '0'; });
    if (!playing) frame();
  }
  function frame() {
    const p = picks[idx]; if (!p) return;
    Stage.draw(ctx, p.scene, t, p.year, p.mood, casts[idx]);
    const a = Math.max(0, Math.min(1, Math.min(t / 0.6, (SCENE_SEC - t) / 0.6)));
    ctx.fillStyle = `rgba(0,0,0,${(1 - a).toFixed(2)})`; ctx.fillRect(0, 0, Stage.W, Stage.H);
    el.text.style.opacity = Math.min(1, t / 1.2);
    const seg = el.tl.children[idx]; if (seg) seg.firstChild.style.width = Math.min(100, t / SCENE_SEC * 100) + '%';
  }
  function loop(now) {
    if (!playing) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    t += dt * speed; frame();
    if (t >= SCENE_SEC) {
      if (idx + 1 < picks.length) go(idx + 1);
      else { playing = false; done = true; el.play.textContent = '▶'; return; }
    }
    raf = requestAnimationFrame(loop);
  }
  function start(record) {
    bind();
    if (record) { picks = Highlights.pick(record.log, 14); const castAt = castBuilder(record); casts = picks.map((p) => castAt(p.age)); }
    if (!picks.length) return;
    cancelAnimationFrame(raf); buildTimeline();
    playing = true; el.play.textContent = '⏸'; go(0); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  // 기록에서 결혼·자녀·이별 시점을 읽어 그 나이의 가족 구성을 만들어요
  function castBuilder(record) {
    const sex = record.meta.sex;
    let married = null, ended = null;
    const kids = [];
    record.log.forEach((e) => {
      if (married === null && e.text.includes('결혼식')) married = e.age;
      if (e.kind === 'life' && e.text.startsWith('아이가 태어났어요')) kids.push(e.age);
      if (married !== null && ended === null && (e.text.includes('이혼했어요') || e.text.includes('배우자가 세상을 떠났어요'))) ended = e.age;
    });
    const kindOf = (a) => (a < 2 ? 'baby' : a < 13 ? 'child' : a < 19 ? 'teen' : a < 62 ? 'adult' : 'old');
    return (age) => ({
      self: { kind: kindOf(age), sex },
      spouse: married !== null && age >= married && (ended === null || age < ended) ? { kind: age >= 62 ? 'old' : 'adult', sex: sex === 'M' ? 'F' : 'M' } : null,
      kids: kids.filter((k) => k <= age).slice(0, 3).map((k) => kindOf(age - k)),
    });
  }
  function stop() { playing = false; cancelAnimationFrame(raf); }
  return { start, stop };
})();
