/* 인생이 끝나면 중요한 순간을 골라 장면 그래픽과 함께 재생해요.
   godot/scripts/highlights.gd, stage.gd 와 같은 규칙·그림이에요. (Canvas 2D로 옮김) */

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

/* ───────── 장면 그리기 (1280x720 기준) ───────── */
const Stage = (() => {
  const W = 1280, H = 720;
  const rgb = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const K = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const fpm = (x, m) => ((x % m) + m) % m;
  let g, t = 0, year = 2000, mood = '';

  const grad = (top, bot) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const cir = (x, y, rad, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0, rad), 0, Math.PI * 2); g.fill(); };
  const ln = (ax, ay, bx, by, c, w = 3) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); };
  const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  const ring = (x, y, rad, c, w = 3) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.stroke(); };
  const heart = (x, y, s, c) => {
    const pts = [];
    for (let i = 0; i < 32; i++) { const a = Math.PI * 2 * i / 32; pts.push([x + 16 * Math.sin(a) ** 3 * s, y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s]); }
    poly(pts, c);
  };
  const star = (x, y, rad, c) => { const pts = []; for (let i = 0; i < 10; i++) { const rr = i % 2 ? rad * 0.45 : rad, a = -Math.PI / 2 + Math.PI * 2 * i / 10; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(pts, c); };
  const person = (x, y, h, c, ph = 0, up = false) => {
    const hipy = y - h * 0.42, shy = y - h * 0.74, sw = Math.sin(ph) * h * 0.12;
    ln(x, hipy, x - h * 0.1 + sw, y, c, h * 0.08); ln(x, hipy, x + h * 0.1 - sw, y, c, h * 0.08); ln(x, hipy, x, shy, c, h * 0.15);
    if (up) { ln(x, shy, x - h * 0.22, y - h + Math.sin(ph * 2) * h * 0.05, c, h * 0.06); ln(x, shy, x + h * 0.22, y - h - Math.sin(ph * 2) * h * 0.05, c, h * 0.06); }
    else { ln(x, shy, x - h * 0.2, y - h * 0.46 - sw, c, h * 0.06); ln(x, shy, x + h * 0.2, y - h * 0.46 + sw, c, h * 0.06); }
    cir(x, y - h * 0.88, h * 0.13, c);
  };
  const building = (x, y, w, h, col, win, seed = 0, blink = true) => {
    r(x, y, w, h, col);
    const cols = Math.max(2, Math.floor(w / 30)), rows = Math.max(2, Math.floor(h / 40));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      let on = rnd(seed + i * 7 + j * 13) > 0.35;
      if (blink && on && rnd(i * 31 + j * 17 + Math.floor(t * 0.8)) > 0.97) on = false;
      if (on) r(x + 10 + i * (w - 20) / cols, y + 12 + j * (h - 24) / rows, 14, 18, win);
    }
  };
  const cloud = (x, y, s, c) => { cir(x, y, 30 * s, c); cir(x + 34 * s, y + 6 * s, 24 * s, c); cir(x - 32 * s, y + 8 * s, 22 * s, c); r(x - 32 * s, y + 8 * s, 66 * s, 22 * s, c); };
  const sun = (x, y, rad, hex) => {
    for (let i = 0; i < 12; i++) { const a = Math.PI * 2 * i / 12 + t * 0.2; ln(x + Math.cos(a) * (rad + 12), y + Math.sin(a) * (rad + 12), x + Math.cos(a) * (rad + 30), y + Math.sin(a) * (rad + 30), K(hex, 0.6), 4); }
    cir(x, y, rad, K(hex));
  };
  const house = (x, y, w, h, wall, roof) => {
    r(x, y, w, h, wall); poly([[x - 20, y], [x + w * 0.5, y - h * 0.55], [x + w + 20, y]], roof);
    r(x + w * 0.42, y + h * 0.4, w * 0.16, h * 0.6, '#5a3a2a'); r(x + w * 0.1, y + h * 0.25, w * 0.2, h * 0.25, '#ffe9a8'); r(x + w * 0.7, y + h * 0.25, w * 0.2, h * 0.25, '#ffe9a8');
  };
  const stars = (n, ymax) => { for (let i = 0; i < n; i++) cir(rnd(i) * W, rnd(i + 50) * ymax, 1.5 + rnd(i + 9) * 1.5, `rgba(255,255,235,${0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i))})`); };
  const flame = (x, y, s) => {
    const fl = 1 + 0.15 * Math.sin(t * 9 + x);
    cir(x, y - 10 * s, 26 * s, 'rgba(255,204,77,0.16)'); poly([[x - 5 * s, y], [x, y - 22 * s * fl], [x + 5 * s, y]], '#ffb347'); cir(x, y - 4 * s, 4 * s, '#fff1b8');
  };
  const gear = (x, y, rad, a, c) => {
    const pts = []; for (let i = 0; i < 24; i++) { const rr = Math.floor(i / 2) % 2 === 0 ? rad : rad * 0.78, an = a + Math.PI * 2 * i / 24; pts.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr]); }
    poly(pts, c); cir(x, y, rad * 0.3, '#a9a398');
  };

  const S = {
    birth() {
      grad('#1b1f3a', '#3a2c4a'); r(80, 70, 260, 330, '#0f1328'); cir(210, 190, 66, '#f6efc8'); cir(236, 176, 58, '#0f1328');
      for (let i = 0; i < 12; i++) cir(100 + rnd(i) * 220, 90 + rnd(i + 40) * 290, 2.4, `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + i))})`);
      r(0, 560, W, 160, '#2a2238'); r(520, 430, 560, 30, '#8a6a4a'); r(540, 400, 520, 40, '#efe3d6'); r(540, 360, 120, 44, '#f7f0e8');
      poly([[780, 400], [900, 330], [1030, 400]], '#f2a6b5'); cir(840, 372, 40, '#f1c9a8'); cir(826, 366, 3, '#3a2a2a'); cir(854, 366, 3, '#3a2a2a');
      cir(420, 330, 48, '#c9a99a'); poly([[370, 560], [420, 380], [520, 560]], '#4a5a8a');
      heart(840, 250, 2.4 * (1 + 0.18 * Math.sin(t * 4)), 'rgba(255,115,140,0.9)');
    },
    school() {
      grad('#8ec9f0', '#e9f5ff'); sun(1090, 130, 44, '#ffd45a'); cloud(300 + Math.sin(t * 0.3) * 40, 130, 1.3, 'rgba(255,255,255,0.95)');
      r(0, 560, W, 160, '#9ac06a'); r(260, 280, 640, 280, '#d9b58a'); r(520, 190, 120, 90, '#c99d6e'); poly([[500, 190], [580, 140], [660, 190]], '#b3563c');
      ring(580, 235, 26, '#fff8e8', 5); ln(580, 235, 580 + Math.sin(t * 2) * 14, 215, '#3a2a2a', 4);
      for (let i = 0; i < 6; i++) { r(290 + i * 100, 340, 60, 70, '#fff0c2'); r(290 + i * 100, 440, 60, 70, '#fff0c2'); }
      r(550, 470, 60, 90, '#6a4a3a'); r(980, 250, 6, 310, '#777'); poly([[986, 254], [1060 + Math.sin(t * 3) * 6, 280], [986, 310]], '#e24a4a');
      const cols = ['#2f4b7c', '#c0483e', '#3a7d44', '#8a5a9c', '#d08a2e'];
      for (let i = 0; i < 5; i++) person(160 + i * 70 + Math.sin(t + i) * 12, 640 + (i % 2) * 24, 90, cols[i], t * 5 + i);
    },
    graduation() {
      S.school();
      for (let i = 0; i < 9; i++) {
        const ph = fpm(t * 0.5 + rnd(i), 1), cx = 300 + rnd(i + 3) * 680, cy = 480 - Math.sin(ph * Math.PI) * 360, a = ph * Math.PI * 4;
        const rot = ([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
        poly([rot([-26, 0]), rot([0, -9]), rot([26, 0]), rot([0, 9])], '#1f1f2a'); cir(cx, cy + 12, 8, '#1f1f2a');
      }
    },
    factory() {
      grad('#5b6470', '#a9a398');
      for (let i = 0; i < 3; i++) {
        r(780 + i * 150, 160, 70, 330, '#4a4036');
        for (let j = 0; j < 7; j++) { const ph = fpm(t * 0.35 + j * 0.15 + i * 0.3, 1); cir(815 + i * 150 + Math.sin(ph * 6 + i) * 22, 150 - ph * 170, 26 + ph * 34, `rgba(230,230,230,${0.55 * (1 - ph)})`); }
      }
      r(0, 490, W, 230, '#3b3631'); r(0, 540, W, 18, '#232220');
      for (let i = 0; i < 8; i++) r(fpm(i * 190 + t * 90, 1500) - 100, 500, 70, 40, '#c99a52');
      r(120, 300, 520, 190, '#6a6258');
      for (let i = 0; i < 3; i++) r(150 + i * 160, 330, 120, 90, (Math.floor(t * 2) + i) % 2 === 0 ? '#ffd57a' : '#8a7a52');
      gear(360, 240, 70, t * 0.8, '#2d2a27'); gear(470, 200, 44, -t * 1.25, '#3a3632'); person(900, 620, 150, '#1d1a17', t * 3); r(870, 450, 60, 8, '#e2b43a');
    },
    office() {
      grad('#2a3b66', '#a7b6d8');
      for (let i = 0; i < 8; i++) building(i * 170 - 20, 120 + rnd(i) * 160, 150, 700, '#1e2744', '#ffe08a', i * 9);
      r(0, 560, W, 160, '#3a2f2a'); r(300, 470, 680, 24, '#8a6a4a'); r(330, 494, 20, 90, '#6a4a3a'); r(930, 494, 20, 90, '#6a4a3a');
      r(540, 360, 200, 110, '#11151f'); r(550, 370, 180, 90, '#7fc0ff');
      for (let i = 0; i < 5; i++) { const v = 20 + 14 * i + rnd(i) * 12 * Math.sin(t * 2); r(570 + i * 30, 450 - v, 18, v, '#fff'); }
      person(480, 560, 190, '#14182b');
      const ay = 220 - fpm(t * 40, 80);
      poly([[1050, ay + 60], [1090, ay], [1130, ay + 60], [1100, ay + 60], [1100, ay + 140], [1080, ay + 140], [1080, ay + 60]], 'rgba(102,230,128,0.8)');
    },
    farm() {
      grad('#f3c26b', '#fbe7b0'); sun(300, 220, 70, '#fff3c2');
      poly([[0, 420], [250, 300], [480, 420]], '#8aa56a'); poly([[380, 420], [700, 250], [1000, 420]], '#7a9a5a'); poly([[800, 420], [1100, 310], [1300, 420]], '#8aa56a');
      r(0, 410, W, 310, '#d9b04a');
      for (let row = 0; row < 5; row++) for (let i = 0; i < 40; i++) {
        const x = i * 34 + row * 11, y = 450 + row * 56, sw = Math.sin(t * 2 + i * 0.4 + row) * 6;
        ln(x, y, x + sw, y - 40, '#b5892a', 3); cir(x + sw, y - 42, 4, '#f0c24a');
      }
      person(900, 640, 170, '#2c2418', t * 2); poly([[850, 535], [900, 510], [950, 535]], '#e6c27a');
    },
    city() {
      grad('#0d1230', '#5a4a7a'); stars(40, 300);
      for (let i = 0; i < 9; i++) building(i * 150 - 10, 260 + rnd(i + 4) * 180, 130, 600, '#141a38', '#ffd57a', i * 5);
      r(0, 560, W, 160, '#1b1b24'); r(0, 590, W, 8, '#55556a');
      const tx = fpm(t * 220, 1700) - 300;
      for (let i = 0; i < 4; i++) { r(tx + i * 130, 520, 120, 60, '#c9d3e6'); r(tx + i * 130 + 14, 534, 92, 22, '#2a3b66'); }
      r(tx - 90, 530, 90, 50, '#e84a4a'); person(250, 700, 130, '#e9e1d0', t * 4); r(236, 640, 28, 24, '#c27a3a');
    },
    war() {
      grad('#3a1a14', '#b8582c'); cloud(300, 140, 2.2, 'rgba(51,31,26,0.9)'); cloud(820, 100, 2.6, 'rgba(64,36,26,0.9)'); r(0, 590, W, 130, '#1c120e');
      for (let i = 0; i < 4; i++) { const x = 80 + i * 280; poly([[x, 590], [x, 420 + rnd(i) * 60], [x + 60, 450], [x + 120, 400], [x + 140, 590]], '#2a1a14'); }
      for (let i = 0; i < 3; i++) {
        const ph = fpm(t * 0.7 + i * 0.33, 1), ex = 200 + rnd(i + Math.floor(t * 0.7 + i * 0.33)) * 880;
        cir(ex, 500, 20 + ph * 120, `rgba(255,178,64,${0.6 * (1 - ph)})`); cir(ex, 500, 8 + ph * 50, `rgba(255,242,178,${0.9 * (1 - ph)})`);
      }
      for (let i = 0; i < 6; i++) { const x2 = fpm(i * 120 + t * 26, 1300) - 40; person(x2, 640, 110 - (i % 3) * 14, '#0d0806', t * 3 + i); r(x2 - 22, 560, 36, 28, '#0d0806'); }
    },
    military() {
      grad('#9ac5e8', '#e7f1da'); cloud(260 + Math.sin(t * 0.3) * 30, 120, 1.2, 'rgba(255,255,255,0.9)');
      poly([[0, 470], [300, 320], [640, 470]], '#5f7d48'); poly([[500, 470], [900, 290], [1280, 470]], '#4f6b3a'); r(0, 460, W, 260, '#6f8f4a'); r(900, 150, 8, 330, '#555');
      const pts = [[908, 156]];
      for (let i = 0; i < 7; i++) pts.push([908 + i * 18, 156 + Math.sin(t * 4 + i * 0.7) * 6]);
      for (let i = 6; i >= 0; i--) pts.push([908 + i * 18, 220 + Math.sin(t * 4 + i * 0.7) * 6]);
      poly(pts, '#2a4a9c');
      for (let i = 0; i < 5; i++) { const x = 180 + i * 130; person(x, 640, 140, '#2f3b22', t * 4 + i * 0.2); poly([[x - 20, 640 - 126], [x, 640 - 150], [x + 20, 640 - 126]], '#3f4b2a'); }
      poly([[960, 560], [1100, 470], [1240, 560]], '#8a7a52');
    },
    protest() {
      grad('#0a0d1f', '#2a2a4a'); stars(30, 220);
      for (let i = 0; i < 6; i++) building(i * 220, 200 + rnd(i) * 120, 190, 600, '#141830', '#ffe08a', i * 3, false);
      r(0, 580, W, 140, '#17172a');
      for (let row = 0; row < 3; row++) for (let i = 0; i < 14; i++) {
        const x = 40 + i * 92 + row * 30, y = 700 - row * 34, hh = 120 - row * 14, up = rnd(i + row * 20) > 0.45;
        person(x, y, hh, '#05060d', t * 3 + i, up);
        if (rnd(i + row * 11) > 0.55) flame(x - 24, y - hh * (up ? 0.95 : 0.5), 1.1);
      }
      for (let i = 0; i < 4; i++) { const bx = 160 + i * 300; ln(bx, 440, bx, 520, '#2a1a14', 5); r(bx - 60, 380, 120, 70, '#e8dcc0'); r(bx - 44, 396, 88, 8, '#c0392b'); r(bx - 44, 414, 64, 8, '#c0392b'); }
    },
    crisis() {
      grad('#2a2f3f', '#6a6f80');
      for (let i = 0; i < 4; i++) building(80 + i * 300, 300, 220, 420, '#1a1e2a', '#8a8a8a', i * 4, false);
      r(0, 600, W, 120, '#14161e');
      const pts = []; for (let i = 0; i < 16; i++) pts.push([260 + i * 48, 160 + i * 18 + Math.sin(i * 1.3) * 20]);
      for (let i = 0; i < pts.length - 1; i++) ln(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#e84a4a', 6);
      poly([[1010, 420], [970, 395], [990, 380], [1030, 410]], '#e84a4a');
      for (let i = 0; i < 6; i++) { const ph = fpm(t * 0.6 + i * 0.17, 1); cir(300 + i * 150, 100 + ph * 500, 18, '#f0c24a'); ring(300 + i * 150, 100 + ph * 500, 18, '#a07a1a', 3); }
      person(640, 690, 200, '#0a0c12'); r(600, 520, 90, 70, '#8a6a4a'); r(612, 532, 66, 10, '#d9c9a8');
    },
    abroad() {
      grad('#0a1030', '#2a4a8a'); stars(60, 560); cir(640, 430, 230, '#2a6fc0');
      for (let i = 0; i < 4; i++) cir(640 + Math.cos(t * 0.4 + i * 1.6) * 150, 430 + Math.sin(i * 2.3) * 110, 52 + 10 * (i % 2), '#4aa055');
      ring(640, 430, 230, 'rgba(255,255,255,0.25)', 3);
      const a = fpm(t * 0.25, 1), px = 180 + (1100 - 180) * a, py = 300 - Math.sin(a * Math.PI) * 190;
      for (let i = 0; i < 16; i++) { const b = a - i * 0.012; if (b > 0) cir(180 + (1100 - 180) * b, 300 - Math.sin(b * Math.PI) * 190, 3, 'rgba(255,255,255,0.5)'); }
      poly([[px - 36, py], [px + 40, py - 6], [px + 50, py], [px + 40, py + 6]], '#f4f4f4'); poly([[px - 6, py], [px - 26, py - 30], [px + 2, py - 2]], '#dcdcdc'); poly([[px - 6, py], [px - 26, py + 30], [px + 2, py + 2]], '#dcdcdc');
    },
    wedding() {
      grad('#ffd9e4', '#fff6ea'); r(0, 590, W, 130, '#c8e0b0'); ring(640, 430, 250, '#e8a0b8', 18); ring(640, 430, 214, '#fff', 8);
      const fc = ['#f08aa8', '#fbd36a', '#ffffff'];
      for (let i = 0; i < 14; i++) { const a = Math.PI + i * Math.PI / 13; cir(640 + Math.cos(a) * 250, 430 + Math.sin(a) * 250, 18, fc[i % 3]); }
      person(580, 620, 220, '#1a1d2b'); poly([[690, 410], [650, 620], [760, 620]], '#fffaf5'); ln(690, 410, 690, 380, '#fffaf5', 20); cir(690, 372, 28, '#c9a99a');
      heart(640, 230, 2.2 + 0.2 * Math.sin(t * 4), '#e85a82');
      for (let i = 0; i < 24; i++) cir(rnd(i + 2) * W + Math.sin(t + i) * 20, fpm(t * 0.3 + rnd(i), 1) * 700, 6, 'rgba(255,178,204,0.8)');
    },
    family() {
      grad('#ffd79a', '#fff0cf'); sun(1050, 150, 54, '#ffb84a'); r(0, 580, W, 140, '#a6cf7a'); house(160, 340, 360, 240, '#f2dcb8', '#c5533a');
      person(760, 640, 230, '#3a2f4a'); person(900, 640, 140, '#c0483e'); ln(780, 520, 880, 540, '#3a2f4a', 10);
      heart(830, 330 - 10 * Math.sin(t * 3), 2, '#e85a82');
      for (let i = 0; i < 3; i++) heart(1000 + i * 40, 300 - fpm(t * 40 + i * 30, 120), 0.9, 'rgba(255,128,153,0.7)');
    },
    house() {
      const bad = mood === 'bad';
      grad(bad ? '#6a7a8f' : '#a8d4f5', bad ? '#b9c0cc' : '#eaf5ff'); r(0, 590, W, 130, bad ? '#6e7f5e' : '#94c06a'); house(150, 330, 420, 260, '#f4e4c4', '#b3503a');
      const pts = []; for (let i = 0; i < 12; i++) pts.push([700 + i * 46, (bad ? 300 + i * 18 : 520 - i * 24) + Math.sin(i * 1.7) * 14]);
      for (let i = 0; i < pts.length - 1; i++) ln(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], bad ? '#e84a4a' : '#3aa05a', 7);
      ln(690, 560, 1240, 560, 'rgba(0,0,0,0.35)', 3); ln(690, 560, 690, 240, 'rgba(0,0,0,0.35)', 3);
      const ky = 250 + Math.sin(t * 2) * 10;
      ring(300, ky - 110, 22, '#f0c24a', 8); r(296, ky - 90, 8, 60, '#f0c24a'); r(296, ky - 50, 24, 8, '#f0c24a'); r(296, ky - 36, 18, 8, '#f0c24a');
    },
    hospital() {
      grad('#dbe9f0', '#f4f8fa'); r(0, 560, W, 160, '#bfcdd6'); r(120, 400, 540, 28, '#8a98a5'); r(120, 428, 14, 130, '#8a98a5'); r(646, 428, 14, 130, '#8a98a5');
      r(140, 360, 500, 50, '#fff'); cir(240, 360, 40, '#e8c9b0'); poly([[280, 350], [640, 350], [640, 410], [280, 410]], '#a9c6e0');
      ln(760, 180, 760, 560, '#8a98a5', 6); r(730, 190, 60, 90, '#d0e8ff'); cir(760, 290 + fpm(t * 0.9, 1) * 150, 5, '#7fc0ff'); r(900, 250, 270, 170, '#0e1a22');
      const pts = [];
      for (let i = 0; i < 40; i++) { const x = i / 39, phx = fpm(x * 3 - t * 1.2, 1); let y = 0; if (phx > 0.42 && phx < 0.5) y = -50; else if (phx > 0.5 && phx < 0.56) y = 36; pts.push([912 + x * 246, 335 + y]); }
      for (let i = 0; i < pts.length - 1; i++) ln(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#4af08a', 3);
      r(1000, 90, 60, 60, '#e84a4a'); r(1012, 100, 36, 12, '#fff'); r(1024, 88, 12, 36, '#fff');
    },
    accident() {
      grad('#0a0d1a', '#2a2f42'); stars(30, 260); r(0, 480, W, 240, '#2a2a30'); for (let i = 0; i < 12; i++) r(i * 120 + 20, 590, 60, 8, '#ddd'); r(0, 480, W, 6, '#777');
      r(420, 520, 330, 70, '#c0392b'); poly([[480, 520], [530, 470], [690, 470], [730, 520]], '#a02a20'); cir(480, 595, 32, '#111'); cir(690, 595, 32, '#111');
      const on = Math.floor(t * 4) % 2 === 0; cir(560, 460, 36, `rgba(255,51,51,${on ? 0.5 : 0.1})`); cir(660, 460, 36, `rgba(77,128,255,${on ? 0.1 : 0.5})`);
      poly([[900, 570], [960, 570], [930, 500]], '#e8b030'); poly([[912, 566], [948, 566], [930, 520]], '#111'); person(1080, 640, 140, '#d9d9e6', 0, true);
    },
    retire() {
      grad('#ff9a5a', '#ffd9a0'); cir(640, 440, 130, '#fff0c0'); r(0, 520, W, 200, '#5a4a3a'); r(0, 520, W, 14, '#ffb060');
      r(340, 540, 360, 18, '#6a4a30'); r(360, 560, 14, 80, '#4a3220'); r(670, 560, 14, 80, '#4a3220'); r(340, 470, 360, 14, '#6a4a30');
      person(500, 548, 150, '#231810'); cir(500, 548 - 150 * 0.95, 14, '#d9d9d9'); ln(560, 470, 570, 556, '#231810', 4);
      r(1000, 280, 14, 250, '#3a2a1c'); cir(1007, 250, 90, '#8a4a2a');
      for (let i = 0; i < 10; i++) cir(900 + rnd(i + 1) * 220 + Math.sin(t + i) * 20, 300 + fpm(t * 0.2 + rnd(i), 1) * 260, 6, '#d9702a');
      for (let i = 0; i < 3; i++) { const bx = fpm(t * 40 + i * 160, 1500) - 100, by = 142 + i * 30 + Math.sin(t * 8) * 4; ln(bx, 150 + i * 30, bx + 12, by, '#3a2a1c', 3); ln(bx + 12, by, bx + 24, 150 + i * 30, '#3a2a1c', 3); }
    },
    celebrate() {
      grad('#0a0820', '#3a1a5a'); stars(40, 300); r(0, 560, W, 160, '#17102a');
      for (let i = 0; i < 24; i++) { cir(30 + i * 54, 600 + Math.sin(t * 3 + i) * 6, 26, '#0a0716'); cir(30 + i * 54, 626, 20, '#120a22'); }
      const cols = ['#ffd45a', '#ff6a8a', '#6ad0ff', '#9aff8a'];
      for (let k = 0; k < 4; k++) {
        const ph = fpm(t * 0.55 + k * 0.25, 1), sd = k + Math.floor(t * 0.55 + k * 0.25) * 7, cx = 200 + rnd(sd) * 880, cy = 120 + rnd(sd + 3) * 220, rr = ph * 150;
        for (let j = 0; j < 18; j++) { const a = Math.PI * 2 * j / 18; cir(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr + ph * ph * 40, 4 * (1 - ph) + 1, K(cols[k], 1 - ph)); }
      }
      const cc = ['#ff6a8a', '#ffd45a', '#6ad0ff'];
      for (let i = 0; i < 40; i++) r(rnd(i + 5) * W, fpm(t * 0.35 + rnd(i), 1) * 720, 8, 14, cc[i % 3]);
      star(640, 330, 70 + 6 * Math.sin(t * 4), '#ffd45a');
    },
    loss() {
      grad('#2a3140', '#5a6475'); r(0, 560, W, 160, '#2a2f38'); r(700, 480, 60, 14, '#5a4a3a'); r(706, 494, 8, 70, '#4a3a2a'); r(746, 494, 8, 70, '#4a3a2a'); r(700, 410, 12, 76, '#5a4a3a');
      flame(1000, 560, 1.4); r(988, 560, 24, 60, '#e8e0d0'); person(480, 640, 200, '#0a0c12'); poly([[380, 450], [480, 380], [580, 450]], '#1a2236'); ln(480, 380, 480, 440, '#0a0c12', 3);
      for (let i = 0; i < 90; i++) { const ph = fpm(t * 1.8 + rnd(i), 1), x = rnd(i + 11) * W; ln(x, ph * 760 - 40, x - 10, ph * 760 + 12, 'rgba(204,224,255,0.45)', 2); }
    },
    rain() { S.loss(); },
    friends() {
      grad('#a8dcf5', '#f0fadc'); sun(1100, 130, 40, '#ffd45a'); cloud(300, 150, 1.1, 'rgba(255,255,255,0.9)'); r(0, 560, W, 160, '#8fc66a');
      r(420, 470, 420, 16, '#7a5a3a'); r(440, 486, 12, 80, '#5a3a22'); r(810, 486, 12, 80, '#5a3a22'); person(520, 470, 160, '#2f4b7c'); person(720, 470, 160, '#c0483e');
      const bob = Math.sin(t * 3) * 6;
      cir(520, 240 + bob, 58, 'rgba(255,255,255,0.95)'); cir(740, 240 - bob, 58, 'rgba(255,255,255,0.95)');
      for (let i = 0; i < 3; i++) { cir(500 + i * 22, 240 + bob, 5, '#444'); cir(720 + i * 22, 240 - bob, 5, '#444'); }
      for (let i = 0; i < 4; i++) { const ph = fpm(t * 0.4 + i * 0.25, 1), nx = 930 + i * 40, ny = 400 - ph * 240, c = `rgba(77,51,153,${1 - ph})`; cir(nx, ny, 9, c); ln(nx + 8, ny, nx + 8, ny - 34, c, 3); }
      heart(630, 330 - 6 * Math.sin(t * 3), 1.4, 'rgba(255,115,140,0.9)');
    },
    disaster() {
      grad('#1a1620', '#5a4a50'); r(0, 590, W, 130, '#1a171c'); poly([[300, 590], [300, 300], [560, 250], [560, 590]], '#3a343c'); poly([[560, 590], [560, 360], [800, 460], [860, 590]], '#2e2a30'); poly([[560, 250], [700, 300], [560, 360]], '#4a444c');
      for (let i = 0; i < 16; i++) { const ph = fpm(t * 0.3 + rnd(i), 1); cir(300 + rnd(i + 1) * 600, 560 - ph * 400, 26 + ph * 40, `rgba(179,168,158,${0.25 * (1 - ph)})`); }
      for (let i = 0; i < 3; i++) { const on = Math.floor(t * 3 + i) % 2 === 0; cir(160 + i * 480, 540, 18, on ? '#ff3333' : '#4d80ff'); cir(160 + i * 480, 540, 56, 'rgba(255,77,77,0.12)'); }
      for (let i = 0; i < 5; i++) flame(960 + i * 52, 600, 1.3);
    },
    virus() {
      grad('#d9e4ee', '#f4f6f8'); r(0, 580, W, 140, '#b9c4cc'); person(560, 640, 260, '#2a3a55'); poly([[530, 420], [590, 420], [586, 442], [534, 442]], '#f5f9ff');
      for (let i = 0; i < 14; i++) {
        const a = t * 0.4 + i * 0.9, x = 640 + Math.cos(a) * (240 + rnd(i) * 320), y = 330 + Math.sin(a * 1.3) * (120 + rnd(i + 3) * 140), rr = 18 + rnd(i + 8) * 16;
        for (let k = 0; k < 10; k++) { const b = Math.PI * 2 * k / 10 + t; ln(x + Math.cos(b) * rr, y + Math.sin(b) * rr, x + Math.cos(b) * (rr + 9), y + Math.sin(b) * (rr + 9), '#c0392b', 3); }
        cir(x, y, rr, '#e05a4a');
      }
      r(1000, 130, 150, 100, '#e8b030'); r(1020, 150, 110, 12, '#1a1a1a'); r(1020, 176, 80, 12, '#1a1a1a');
    },
    news() {
      grad('#1a1f33', '#2a3050'); r(0, 600, W, 120, '#12141f'); r(260, 110, 760, 470, '#0b0c12'); r(284, 134, 712, 420, '#29406a');
      poly([[284, 134], [640, 134], [560, 554], [284, 554]], 'rgba(255,255,255,0.04)'); person(640, 554, 300, '#0e1220');
      for (let i = 0; i < 22; i++) r(284, 134 + i * 19, 712, 2, 'rgba(0,0,0,0.18)');
      r(284, 484, 712, 70, '#c0392b'); r(284, 484, 160, 70, '#f4f4f4');
      for (let i = 0; i < 4; i++) { const bx = fpm(1000 - t * 120 + i * 230, 1100) + 200; if (bx > 460 && bx < 960) r(bx, 510, 120, 10, '#fff'); }
      r(580, 610, 120, 16, '#333');
    },
    death() {
      grad('#05070f', '#1a2036'); stars(90, 420); r(0, 600, W, 120, '#0a0d18');
      cir(640, 450, 160, `rgba(255,217,128,${0.06 + 0.02 * Math.sin(t * 2)})`); cir(640, 450, 90, 'rgba(255,217,128,0.1)'); r(626, 520, 28, 80, '#e8e0d0'); flame(640, 520, 2);
      for (let i = 0; i < 18; i++) { const ph = fpm(t * 0.12 + rnd(i), 1); cir(640 + Math.sin(ph * 6 + i) * (40 + 80 * ph), 500 - ph * 480, 3 * (1 - ph) + 1, `rgba(255,230,153,${1 - ph})`); }
      person(300 + fpm(t * 18, 340), 640, 120, '#0d0f1a', t * 2); star(1050, 140, 14 + 2 * Math.sin(t * 2), '#fff6d0');
    },
  };

  function eraTint() {
    if (year < 1975) {
      r(0, 0, W, H, 'rgba(140,102,56,0.24)');
      for (let i = 0; i < 8; i++) { g.strokeStyle = `rgba(0,0,0,${0.05 * (8 - i)})`; g.lineWidth = 6; g.strokeRect(i * 6 + 3, i * 6 + 3, W - i * 12 - 6, H - i * 12 - 6); }
    } else if (year < 2000) r(0, 0, W, H, 'rgba(242,184,102,0.07)');
  }
  function draw(ctx, scene, time, yr, md) {
    g = ctx; t = time; year = yr; mood = md || '';
    g.save(); g.clearRect(0, 0, W, H);
    (S[scene] || S.news)();
    eraTint();
    g.restore();
  }
  return { draw };
})();

/* ───────── 재생기 ───────── */
const Replay = (() => {
  const SCENE_SEC = 7;
  let picks = [], idx = -1, t = 0, playing = false, speed = 1, raf = 0, last = 0, ctx = null, el = null, done = false;
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
    Stage.draw(ctx, p.scene, t, p.year, p.mood);
    const a = Math.max(0, Math.min(1, Math.min(t / 0.7, (SCENE_SEC - t) / 0.7)));
    ctx.fillStyle = `rgba(0,0,0,${1 - a})`; ctx.fillRect(0, 0, 1280, 720);
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
    if (record) picks = Highlights.pick(record.log, 14);
    if (!picks.length) return;
    cancelAnimationFrame(raf); buildTimeline();
    playing = true; el.play.textContent = '⏸'; go(0); last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { playing = false; cancelAnimationFrame(raf); }
  return { start, stop };
})();
