/* 도트(픽셀) 장면. 320x100 작은 캔버스에 그린 뒤 화면에서 크게 키워(pixelated) 보여 줘요.
   인물은 2등신 스프라이트, 하늘은 띠 모양 디더링, 길가 난간 앞에 사람들이 줄지어 서는 구성이에요. */

const Stage = (() => {
  const W = 320, H = 100, GY = 84;            // GY: 사람들이 서는 바닥선
  const OUT = '#2e2b33', SKIN = '#f2c9a2', HAIR = '#2b2320', GRAY = '#c9c6c2';
  let g, t = 0, f = 0, year = 2000, mood = '';
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const fpm = (x, m) => ((x % m) + m) % m;
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const px = (x, y, c) => P(x, y, 1, 1, c);

  /* ───── 하늘 ───── */
  const SKIES = {
    day: ['#a7d3e6', '#c6e3ee', '#e3eeea'], warm: ['#f4cf98', '#f8e1b8', '#fbefd9'], dusk: ['#ee9c76', '#f4c39b', '#f6e0c0'],
    night: ['#141933', '#222a4b', '#353d63'], gray: ['#8e97a4', '#a9b1bb', '#c4cad0'], war: ['#4d231d', '#93432a', '#c87a48'],
    rose: ['#f3c4cf', '#f7dbe0', '#fbeee9'], mint: ['#bfe3d6', '#d8eee5', '#edf6f0'],
  };
  function sky(kind, bottom = GY) {
    const [a, b, c] = SKIES[kind] || SKIES.day;
    const t1 = Math.floor(bottom * 0.4), t2 = Math.floor(bottom * 0.72);
    for (let y = 0; y < bottom; y++) {
      const col = y < t1 ? a : y < t2 ? b : c;
      P(0, y, W, 1, col);
      const edge = (y === t1 - 1 || y === t1) ? [a, b] : (y === t2 - 1 || y === t2) ? [b, c] : null;
      if (edge) for (let x = (y % 2); x < W; x += 2) px(x, y, y === t1 - 1 || y === t2 - 1 ? edge[1] : edge[0]);
    }
    // 하늘의 잔잔한 점무늬
    const dot = kind === 'night' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.35)';
    for (let y = 2; y < bottom - 6; y += 5) for (let x = (y % 10 === 2 ? 0 : 3); x < W; x += 6) px(x, y, dot);
  }
  function stars(n, maxY) { for (let i = 0; i < n; i++) if ((f + i) % 7 !== 0) px(Math.floor(rnd(i) * W), Math.floor(rnd(i + 40) * maxY), rnd(i + 3) > 0.7 ? '#fff6d0' : '#c9cff0'); }
  function cloud(x, y, s = 1, c = '#fbfbf7', sh = '#e4e9ec') {
    x = Math.round(x);
    const w = Math.round(22 * s);
    P(x + w * 0.3, y, w * 0.4, 1, c); P(x + w * 0.15, y + 1, w * 0.7, 2, c); P(x, y + 3, w, 3, c); P(x + 1, y + 6, w - 2, 1, sh);
  }
  function moon(x, y) { P(x, y + 1, 7, 5, '#f5eec8'); P(x + 1, y, 5, 7, '#f5eec8'); P(x + 3, y, 4, 5, SKIES.night[0]); }
  function sun(x, y, c = '#ffd86a') { P(x - 3, y - 4, 6, 8, c); P(x - 4, y - 3, 8, 6, c); }

  /* ───── 건물·거리 ───── */
  function skyline(seed, base, col, winCol, minH = 14, maxH = 40) {
    let x = -4;
    for (let i = 0; x < W; i++) {
      const w = 14 + Math.floor(rnd(seed + i) * 18), h = minH + Math.floor(rnd(seed + i + 50) * (maxH - minH));
      P(x, base - h, w, h, col);
      for (let yy = base - h + 3; yy < base - 2; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 4) if (rnd(xx * 3 + yy) > 0.45) P(xx, yy, 2, 2, winCol);
      x += w + 2;
    }
  }
  function bldg(x, y, w, h, o = {}) {
    const body = o.body || '#efe9dc', win = o.win || '#8fb3cf';
    P(x - 1, y - 1, w + 2, h + 1, OUT); P(x, y, w, h, body);
    if (o.roof) P(x - 1, y - 3, w + 2, 2, o.roof);
    for (let yy = y + 3; yy < y + h - 7; yy += o.rowGap || 6) for (let xx = x + 3; xx < x + w - 4; xx += o.colGap || 6) {
      const lit = o.night ? rnd(xx * 7 + yy) > 0.35 : true;
      P(xx, yy, 3, 3, o.night ? (lit ? '#ffd98a' : '#3a3f58') : win);
      if (!o.night) px(xx, yy, '#cfe0ec');
    }
    if (o.door !== false) { const dx = x + Math.floor(w / 2) - 3; P(dx - 1, y + h - 8, 8, 1, o.awning || '#c94a46'); P(dx, y + h - 7, 6, 7, '#5a6a7a'); P(dx + 1, y + h - 6, 4, 6, '#8fb3cf'); }
  }
  function aptBlock(x, y, w, h, num, night) {
    bldg(x, y, w, h, { body: '#f1ece2', night, colGap: 5, rowGap: 5, door: false });
    P(x, y, w, 2, '#d9cfbe');
    if (num) { P(x + w - 9, y + 3, 7, 4, '#4a6b8a'); P(x + w - 8, y + 4, 5, 2, '#f1ece2'); }
  }
  function hanok(x, y, w) {
    P(x + 2, y + 6, w - 4, 10, '#e9dcc2'); P(x + 2, y + 6, w - 4, 1, OUT);
    for (let xx = x + 4; xx < x + w - 5; xx += 6) { P(xx, y + 8, 4, 6, '#f6efe0'); P(xx + 2, y + 8, 1, 6, '#b49a72'); P(xx, y + 11, 4, 1, '#b49a72'); }
    P(x - 2, y + 3, w + 4, 3, '#5d5a5e'); P(x, y + 1, w, 2, '#6d6a6e'); P(x - 3, y + 2, 2, 1, '#5d5a5e'); P(x + w + 1, y + 2, 2, 1, '#5d5a5e');
    P(x + 2, y + 16, w - 4, 2, '#9b8b72');
  }
  function railing(y = GY - 8) {
    P(0, y, W, 1, '#8c9097'); P(0, y + 3, W, 1, '#a4a7ad');
    for (let x = 2; x < W; x += 8) P(x, y, 1, 8, '#8c9097');
  }
  function street(o = {}) {
    if (o.rail !== false) railing();
    P(0, GY - 1, W, 6, '#dad6ca'); P(0, GY - 1, W, 1, '#c3beb1');
    P(0, GY + 5, W, H - GY - 5, '#5e6169'); P(0, GY + 5, W, 1, '#4a4d55');
    for (let x = -(Math.floor(o.scroll || 0) % 20); x < W; x += 20) P(x, GY + 10, 10, 1, '#e7e3d7');
  }
  function ground(col, line) { P(0, GY - 1, W, H - GY + 1, col); if (line) P(0, GY - 1, W, 1, line); }
  function tree(x, y, c = '#6fae5a') { P(x, y - 4, 2, 5, '#7a5a3c'); P(x - 3, y - 11, 8, 7, c); P(x - 2, y - 13, 6, 2, c); px(x - 2, y - 10, '#9cd07e'); px(x + 2, y - 9, '#9cd07e'); }
  function car(x, y, c = '#d0584a') {
    x = Math.round(x);
    P(x, y - 5, 18, 4, c); P(x + 4, y - 8, 9, 3, c); P(x + 5, y - 7, 3, 2, '#bfe0f0'); P(x + 9, y - 7, 3, 2, '#bfe0f0');
    P(x + 2, y - 1, 4, 2, '#222'); P(x + 12, y - 1, 4, 2, '#222'); px(x + 17, y - 4, '#ffe28a');
  }
  function heart(x, y, c = '#e85d7a') { P(x, y + 1, 5, 2, c); P(x + 1, y, 1, 1, c); P(x + 3, y, 1, 1, c); P(x + 1, y + 3, 3, 1, c); px(x + 2, y + 4, c); }
  function flameAt(x, y) { const on = (f + x) % 2 === 0; px(x, y - 2, on ? '#ffe7a0' : '#ffb347'); px(x, y - 1, '#ffb347'); P(x, y, 1, 2, '#f4eee0'); }

  /* ───── 인물 스프라이트 ───── */
  const SHIRTS = ['#e8e3d6', '#b8a7d8', '#9cc4e6', '#f1b9a6', '#a9d0a1', '#f2d38a'];
  function person(x, y, o = {}) {
    const k = o.kind || 'adult';
    if (k === 'baby') return baby(x, y, o);
    // [머리 너비, 머리 높이, 몸 높이, 다리 길이]
    const [hw, hh, bh, lh] = { adult: [12, 11, 9, 6], old: [12, 11, 9, 6], teen: [11, 10, 8, 5], child: [10, 9, 6, 4] }[k];
    const bob = o.walk && (f + (o.phase || 0)) % 2 === 0 ? 1 : 0;
    const top = y - (hh + bh + lh) - bob;
    x = Math.round(x);
    const hair = o.hair || (k === 'old' ? GRAY : HAIR), shirt = o.shirt || '#e8e3d6', pants = o.pants || '#4b5468';
    const bw = hw - 2, bx = x + 1, lw = Math.max(3, Math.floor(bw / 2) - 1);
    const step = o.walk && (f + (o.phase || 0)) % 2 === 0 ? 1 : 0;
    const parts = [
      [x, top, hw, hh, SKIN],
      [bx, top + hh, bw, bh, shirt],
      [bx - 2, top + hh + 1, 2, bh - 3, shirt], [bx + bw, top + hh + 1, 2, bh - 3, shirt],
      [bx, top + hh + bh, lw, lh - step, pants], [bx + bw - lw, top + hh + bh, lw, lh, pants],
    ];
    if (o.dress) parts.push([bx - 2, top + hh + bh - 2, bw + 4, lh + 1, o.dress]);
    parts.forEach(([a, b, w, h]) => P(a - 1, b - 1, w + 2, h + 2, OUT));
    parts.forEach(([a, b, w, h, c]) => P(a, b, w, h, c));
    P(bx - 2, top + hh + bh - 2, 2, 1, SKIN); P(bx + bw, top + hh + bh - 2, 2, 1, SKIN);
    if (!o.dress) { P(bx, y - 1 - bob - step, lw, 1, OUT); P(bx + bw - lw, y - 1 - bob, lw, 1, OUT); }
    // 머리카락·모자
    if (o.hat === 'helmet') { P(x - 1, top - 1, hw + 2, 5, '#5b6b3e'); P(x - 2, top + 3, hw + 4, 1, '#4a5832'); }
    else {
      P(x, top, hw, 4, hair); P(x, top + 4, 2, 3, hair); P(x + hw - 2, top + 4, 2, 3, hair); P(x + 3, top + 4, 3, 1, hair);
      if (o.long) { P(x - 1, top + 2, 3, hh + 3, hair); P(x + hw - 2, top + 2, 3, hh + 3, hair); }
    }
    if (o.hat === 'straw') { P(x - 4, top, hw + 8, 2, '#d8b766'); P(x + 1, top - 3, hw - 2, 3, '#e6c879'); P(x + 1, top - 1, hw - 2, 1, '#c0392b'); }
    if (o.hat === 'grad') { P(x - 3, top - 2, hw + 6, 2, '#22222a'); P(x + 2, top - 3, hw - 4, 1, '#22222a'); P(x + hw + 2, top, 1, 3, '#e8c35a'); }
    if (o.hat === 'veil') { P(x - 1, top - 2, hw + 2, 3, '#ffffff'); P(x + hw - 1, top + 1, 3, hh + 6, '#f5f5f5'); }
    // 눈·볼
    P(x + 3, top + 6, 1, 2, OUT); P(x + hw - 4, top + 6, 1, 2, OUT);
    if (o.blush || k === 'child') { px(x + 2, top + 8, '#f3a3a3'); px(x + hw - 3, top + 8, '#f3a3a3'); }
    if (o.mask) P(x + 2, top + 7, hw - 4, 3, '#f7f9fc');
    if (o.tie) { P(bx + Math.floor(bw / 2) - 1, top + hh, 2, 1, '#ffffff'); P(bx + Math.floor(bw / 2) - 1, top + hh + 1, 2, 5, '#c0392b'); }
    // 들고 있는 것
    const hy = top + hh + bh - 2, rx = bx + bw + 2;
    if (o.hold === 'candle') { P(rx, hy - 3, 2, 4, '#f4eee0'); flameAt(rx, hy - 5); }
    if (o.hold === 'flower') { P(rx - 1, hy - 5, 5, 4, '#f08aa8'); P(rx, hy - 6, 2, 1, '#ffd86a'); P(rx + 1, hy - 1, 1, 3, '#5aa05a'); }
    if (o.hold === 'whiteflower') { P(rx - 1, hy - 5, 5, 4, '#ffffff'); P(rx + 1, hy - 1, 1, 3, '#5aa05a'); }
    if (o.hold === 'bag') { P(rx, hy, 6, 5, '#8a5a3a'); P(rx + 1, hy - 1, 4, 1, OUT); }
    if (o.hold === 'box') { P(bx - 2, hy - 3, bw + 4, 6, '#c9a06a'); P(bx - 2, hy - 3, bw + 4, 1, '#e2c08a'); }
    if (o.hold === 'bundle') { P(x, top - 5, hw, 5, '#c9a06a'); P(x + 2, top - 6, hw - 4, 1, '#e2c08a'); }
    if (o.hold === 'flag') { P(rx, hy - 14, 1, 16, '#8a6a4a'); P(rx + 1, hy - 14, 7, 5, o.flag || '#ffffff'); }
    if (o.hold === 'sign') { P(rx, hy - 12, 1, 14, '#8a6a4a'); P(rx - 4, hy - 19, 11, 8, '#efe6cf'); P(rx - 3, hy - 17, 9, 1, '#c0392b'); P(rx - 3, hy - 15, 6, 1, '#c0392b'); }
    if (o.hold === 'umbrella') { P(x - 4, top - 5, hw + 8, 3, o.umb || '#3a4a6a'); P(x - 1, top - 6, hw + 2, 1, o.umb || '#3a4a6a'); P(x + Math.floor(hw / 2), top - 2, 1, 4, OUT); }
    if (o.hold === 'cane') P(rx + 1, top + hh, 1, bh + lh, '#7a5a3c');
    if (o.hold === 'baby') { P(bx + 1, hy - 3, 7, 4, '#f6f0e6'); P(bx + 2, hy - 3, 3, 2, SKIN); }
    if (o.arms) { P(bx - 3, top + hh - 5, 2, 6, shirt); P(bx + bw + 1, top + hh - 5, 2, 6, shirt); P(bx - 3, top + hh - 6, 2, 1, SKIN); P(bx + bw + 1, top + hh - 6, 2, 1, SKIN); }
    return hw + 4;
  }
  function baby(x, y, o) {
    P(x - 1, y - 11, 12, 11, OUT); P(x, y - 10, 10, 9, o.wrap || '#f6f0e6'); P(x + 2, y - 9, 6, 5, SKIN); px(x + 3, y - 7, OUT); px(x + 6, y - 7, OUT); P(x + 2, y - 10, 6, 1, '#e9c9d0');
    return 12;
  }

  /* 주인공과 가족을 한 줄로 세워요 */
  function lineup(x, cast, o = {}) {
    if (!cast) cast = { self: { kind: 'adult', sex: 'M' }, spouse: null, kids: [] };
    const self = Object.assign({ shirt: SHIRTS[2], long: cast.self.sex === 'F', walk: o.walk, phase: 0 }, cast.self, o.self || {});
    if (self.kind === 'old') self.hair = GRAY;
    let cx = x;
    cx += person(cx, GY, self) + 1;
    if (cast.spouse && o.spouse !== false) cx += person(cx, GY, Object.assign({ kind: cast.spouse.kind, long: cast.spouse.sex === 'F', shirt: SHIRTS[3], walk: o.walk, phase: 1 }, o.spouseStyle || {})) + 1;
    if (o.kids !== false) cast.kids.forEach((k, i) => { cx += person(cx, GY, { kind: k, long: i % 2 === 1, shirt: SHIRTS[(i + 4) % SHIRTS.length], walk: o.walk, phase: i }) + 1; });
    return cx;
  }
  function crowd(x0, x1, o = {}) {
    for (let i = 0, x = x0; x < x1; i++) {
      person(x, GY - (i % 2), Object.assign({ kind: rnd(i + 7) > 0.85 ? 'teen' : 'adult', long: rnd(i) > 0.55, shirt: o.shirts ? o.shirts[i % o.shirts.length] : SHIRTS[i % SHIRTS.length], hair: rnd(i + 3) > 0.9 ? GRAY : HAIR, phase: i, walk: o.walk }, typeof o.each === 'function' ? o.each(i) : {}));
      x += 15 + Math.floor(rnd(i + 11) * 3);
    }
  }

  /* ───── 장면 ───── */
  const S = {
    birth(c) {
      if (year < 1980) { // 온돌방
        P(0, 0, W, GY, '#eadcc0'); for (let x = 20; x < 120; x += 8) { P(x, 18, 1, 46, '#b49a72'); } P(20, 18, 100, 1, '#b49a72'); P(20, 40, 100, 1, '#b49a72'); P(20, 64, 100, 1, '#b49a72');
        P(0, GY - 1, W, H - GY + 1, '#c99a5e'); P(0, GY - 1, W, 1, '#a87a44');
      } else { // 병원
        P(0, 0, W, GY, '#e6eef0'); P(0, 50, W, 1, '#cfdbe0'); P(18, 14, 60, 34, OUT); P(19, 15, 58, 32, SKIES.night[1]); moon(58, 20); stars(10, 30);
        P(0, GY - 1, W, H - GY + 1, '#c9d3d8'); P(0, GY - 1, W, 1, '#aab6bc');
        P(230, 52, 70, 6, '#ffffff'); P(229, 51, 72, 1, OUT); P(232, 58, 2, 26, '#9aa4ab'); P(296, 58, 2, 26, '#9aa4ab'); P(230, 46, 14, 6, '#ffffff');
      }
      const mid = 120;
      person(mid, GY, { kind: 'adult', long: true, shirt: '#f1b9a6', hold: 'baby', blush: true });
      person(mid + 18, GY, { kind: 'adult', shirt: '#9cc4e6' });
      if ((f % 6) < 4) heart(mid + 10, GY - 36 - (f % 2));
      baby(mid + 40, GY, {});
    },
    school(c) {
      sky('day'); cloud(30 + fpm(t * 3, 340) - 40, 10, 1.1); skyline(3, 70, '#cfdde4', '#e3edf1', 10, 24);
      bldg(110, 26, 120, 52, { body: '#efe2c8', roof: '#c96a4a', awning: '#5a8a6a' }); P(162, 14, 16, 12, '#e6d2ae'); P(161, 13, 18, 1, OUT);
      P(167, 16, 6, 6, '#fffaf0'); px(170, 17, OUT); px(170, 18, OUT); px(171 + (f % 2), 19, OUT);
      P(250, 30, 1, 48, '#8c9097'); P(251, 30, 9, 6, '#ffffff'); P(254, 32, 3, 2, '#d04848'); P(254, 33, 3, 1, '#3a5aa8');
      ground('#d9c79c', '#c4b083'); tree(40, GY - 1); tree(290, GY - 1, '#7dbb66');
      const cl = c ? Object.assign({}, c, { kids: [], spouse: null }) : null;
      let x = lineup(60, cl, { walk: true, self: { hold: 'bag' }, kids: false });
      for (let i = 0; i < 4; i++) x += person(x + 2, GY, { kind: c && c.self.kind === 'adult' ? 'teen' : 'child', long: i % 2 === 0, shirt: SHIRTS[(i + 1) % 6], walk: true, phase: i }) + 2;
    },
    graduation(c) {
      S.school(c);
      for (let i = 0; i < 5; i++) { const ph = fpm(t * 0.6 + rnd(i), 1), x = 70 + rnd(i + 2) * 180, y = 60 - Math.sin(ph * Math.PI) * 50; P(x - 2, y, 5, 1, '#22222a'); P(x - 1, y - 1, 3, 1, '#22222a'); }
    },
    factory(c) {
      sky(year < 1990 ? 'gray' : 'day'); skyline(8, 66, '#b7bdc4', '#c9ced3', 8, 18);
      for (let i = 0; i < 3; i++) {
        const cx = 210 + i * 26; P(cx - 1, 10, 9, 60, OUT); P(cx, 11, 7, 59, '#8a6e5a'); P(cx, 16, 7, 2, '#c94a46');
        for (let j = 0; j < 5; j++) { const ph = fpm(t * 0.5 + j * 0.2 + i * 0.3, 1); const s = 3 + Math.floor(ph * 5); P(cx + 3 - s / 2 + Math.sin(ph * 5 + i) * 3, 8 - ph * 14, s, s, `rgba(235,235,235,${0.8 * (1 - ph)})`); }
      }
      P(40, 40, 160, 38, OUT); P(41, 41, 158, 37, '#b9b0a2');
      for (let x = 41; x < 199; x += 16) { P(x, 34, 16, 7, '#9a9284'); for (let k = 0; k < 7; k++) P(x + 16 - k * 2 - 2, 34 + k, 2, 1, '#7d766a'); }
      for (let i = 0; i < 6; i++) P(52 + i * 24, 50, 12, 8, (Math.floor(t * 2) + i) % 3 ? '#ffe08a' : '#7d8a99');
      ground('#9a958a', '#7f7a70');
      const s = { shirt: '#6a7f9c', pants: '#3f4a5e' };
      let x = lineup(60, c && Object.assign({}, c, { spouse: null, kids: [] }), { self: s });
      for (let i = 0; i < 4; i++) x += person(x + 3, GY, { shirt: '#6a7f9c', pants: '#3f4a5e', long: i === 2, walk: true, phase: i }) + 3;
    },
    office(c) {
      sky('day'); cloud(250, 8, 1.2); skyline(5, 70, '#c3d4de', '#dce8ee', 26, 56);
      bldg(20, 14, 46, 64, { body: '#d6dde3', win: '#7ea4c4', colGap: 5, rowGap: 5 }); bldg(250, 6, 54, 72, { body: '#e3e0d6', win: '#8fb3cf', colGap: 5, rowGap: 5 });
      street({ scroll: t * 20 }); car(fpm(t * 40, 400) - 40, H - 4, '#4a7ab8');
      const self = { shirt: '#3b4766', pants: '#2a3048', tie: true, hold: 'bag' };
      let x = lineup(100, c && Object.assign({}, c, { spouse: null, kids: [] }), { self });
      for (let i = 0; i < 4; i++) x += person(x + 2, GY, { shirt: ['#3b4766', '#e8e3d6', '#4b4b55', '#9cc4e6'][i], pants: '#2a3048', tie: i % 2 === 0, long: i === 1 || i === 3, walk: true, phase: i }) + 2;
    },
    farm(c) {
      sky('warm'); sun(260, 16, '#ffe9a8');
      P(0, 48, W, 20, '#9cbf86'); for (let x = 0; x < W; x += 2) P(x, 48 - Math.round(8 + 7 * Math.sin(x / 30) + 4 * Math.sin(x / 11)), 2, 20, '#8db27a');
      for (let x = 0; x < W; x += 2) P(x, 54 - Math.round(4 + 4 * Math.sin(x / 19 + 2)), 2, 14, '#7ea66c');
      year < 1985 ? hanok(30, 46, 46) : bldg(30, 48, 40, 20, { body: '#f1ece2', door: false, roof: '#4a7ab8' });
      P(0, 66, W, H - 66, '#86b85a');
      for (let y = 68; y < H; y += 3) for (let x = (y % 6 === 2 ? 0 : 3); x < W; x += 6) { const sway = (f + x) % 4 === 0 ? 1 : 0; P(x + sway, y, 1, 2, '#5f9a3c'); px(x + sway, y - 1, '#c8d86a'); }
      lineup(140, c, { self: { hat: 'straw', shirt: '#e8e3d6', pants: '#6a7a8a' } });
    },
    city(c) {
      sky('dusk'); skyline(11, 64, '#c99a8e', '#f4c9a0', 18, 44);
      P(0, 64, W, 6, '#7a6a72'); P(0, 64, W, 1, OUT);
      const tx = fpm(t * 60, 520) - 200, ktx = year >= 2004;
      for (let i = 0; i < 4; i++) { const x = tx + i * 46; P(x, 50, 44, 14, ktx ? '#eef0f2' : '#2f5aa8'); P(x, 57, 44, 2, ktx ? '#2a5aa8' : '#f1ece2'); for (let k = 0; k < 5; k++) P(x + 3 + k * 8, 52, 5, 4, '#bfe0f0'); P(x, 49, 44, 1, OUT); }
      P(tx + 184, 52, 10, 12, ktx ? '#eef0f2' : '#2f5aa8');
      ground('#c9c3b5', '#a9a395'); for (let x = 0; x < W; x += 16) P(x, GY + 3, 8, 1, '#e8e2d2');
      lineup(130, c && Object.assign({}, c, { kids: [] }), { self: { hold: 'bag', shirt: '#e8e3d6' }, walk: true });
    },
    war(c) {
      sky('war'); for (let i = 0; i < 4; i++) { const ph = fpm(t * 0.25 + i * 0.25, 1); P(40 + i * 80 + Math.sin(ph * 4) * 4, 50 - ph * 50, 10 + ph * 10, 6 + ph * 6, `rgba(60,40,36,${0.7 * (1 - ph)})`); }
      for (let i = 0; i < 5; i++) { const x = 10 + i * 66; P(x, 46 + (i % 2) * 6, 26, 40, '#4a2f28'); P(x + 18, 40 + (i % 3) * 4, 8, 10, '#4a2f28'); P(x + 4, 56, 4, 4, '#2a1a16'); P(x + 14, 62, 4, 4, '#2a1a16'); }
      if (f % 5 === 0) { const fx = 40 + Math.floor(rnd(Math.floor(t)) * 240); P(fx, 40, 6, 4, '#ffd27a'); P(fx + 1, 38, 4, 8, '#ffe9b0'); }
      ground('#5a4232', '#3e2c22');
      let x = fpm(t * 6, 60) + 30;
      x = lineup(x, c, { walk: true, self: { hold: 'bundle', shirt: '#d8ccb4', pants: '#6a5a4a' }, spouseStyle: { hold: 'bundle', shirt: '#e6dcc6' } });
      for (let i = 0; i < 6; i++) x += person(x + 3, GY, { shirt: i % 2 ? '#d8ccb4' : '#e6dcc6', pants: '#6a5a4a', long: i % 3 === 0, hold: i % 2 ? 'bundle' : null, walk: true, phase: i, kind: i === 4 ? 'child' : 'adult' }) + 3;
    },
    military(c) {
      sky('day'); cloud(60, 8); P(0, 40, W, 30, '#7fa36a'); for (let x = 0; x < W; x += 2) P(x, 40 - Math.round(10 + 8 * Math.sin(x / 26)), 2, 20, '#6e955a');
      P(220, 52, 70, 26, OUT); P(221, 53, 68, 25, '#9aa77a'); P(218, 49, 76, 4, '#5b6b3e'); for (let i = 0; i < 5; i++) P(226 + i * 13, 60, 6, 5, '#d8e0c0');
      P(40, 22, 1, 56, '#8c9097'); P(41, 22, 12, 8, '#ffffff'); P(45, 24, 4, 2, '#d04848'); P(45, 26, 4, 2, '#3a5aa8');
      ground('#b6a77e', '#998a64');
      const sol = { shirt: '#5f7044', pants: '#4a5832', hat: 'helmet' };
      let x = lineup(70, c && Object.assign({}, c, { spouse: null, kids: [] }), { self: sol, walk: true });
      for (let i = 0; i < 6; i++) x += person(x + 2, GY, Object.assign({ walk: true, phase: 0 }, sol)) + 2;
    },
    protest(c) {
      sky('night'); stars(30, 30); skyline(14, 70, '#2a3150', '#ffd98a', 20, 50);
      ground('#2c2f42', '#3a3e55');
      for (let i = 0; i < 22; i++) { const x = 2 + i * 15; person(x, GY - 4 - (i % 2) * 2, { kind: 'adult', long: rnd(i) > 0.5, shirt: '#3a3e55', pants: '#22253a', hair: HAIR, hold: i % 3 === 0 ? 'sign' : 'candle' }); }
      lineup(150, c && Object.assign({}, c, { kids: [] }), { self: { hold: 'candle', shirt: '#e8e3d6' } });
    },
    crisis(c) {
      sky('gray'); skyline(21, 70, '#9aa2ad', '#b5bcc5', 20, 46);
      bldg(30, 18, 110, 60, { body: '#d9d6cf', win: '#8a97a6', door: true, awning: '#2f5aa8' }); P(60, 22, 50, 7, '#2f5aa8'); P(64, 24, 42, 3, '#e8ecf2');
      P(180, 16, 70, 34, OUT); P(181, 17, 68, 32, '#1b2232');
      const pts = []; for (let i = 0; i < 12; i++) pts.push([184 + i * 5, 22 + i * 2 + (i % 3 === 0 ? -2 : 0)]); pts.forEach(([x, y]) => P(x, y, 5, 2, '#e8504a'));
      street();
      lineup(150, c && Object.assign({}, c, { kids: [] }), { self: { hold: 'box', shirt: '#3b4766', pants: '#2a3048', tie: true } });
      for (let i = 0; i < 6; i++) person(10 + i * 16, GY, { shirt: SHIRTS[i], long: i % 2 === 1, hold: i === 2 ? 'flower' : null });
    },
    abroad(c) {
      sky('day'); cloud(40, 14, 1.3);
      const a = fpm(t * 0.12, 1), x = -30 + a * 380, y = 50 - a * 40;
      P(x, y, 26, 4, '#f4f6f8'); P(x + 22, y + 1, 6, 2, '#f4f6f8'); P(x + 8, y - 4, 6, 4, '#dfe4ea'); P(x + 8, y + 4, 8, 3, '#dfe4ea'); P(x, y - 3, 3, 3, '#c94a46'); for (let k = 0; k < 5; k++) px(x + 6 + k * 3, y + 1, '#7fa6c8');
      P(0, 70, W, 14, '#c9ccd2'); P(0, 70, W, 1, '#a9adb5'); for (let x2 = 0; x2 < W; x2 += 24) P(x2, 76, 12, 1, '#f4f2ea');
      bldg(200, 40, 110, 30, { body: '#e8edf2', win: '#9cc4e6', door: false }); P(200, 40, 110, 4, '#4a7ab8');
      ground('#dcd8cc', '#c3beb1');
      lineup(110, c, { self: { hold: 'bag' }, walk: true });
    },
    wedding(c) {
      sky('rose'); cloud(30, 10); cloud(250, 6, 0.8);
      P(100, 24, 120, 60, '#fbf6f0'); P(99, 23, 122, 1, OUT); P(99, 23, 1, 61, OUT); P(220, 23, 1, 61, OUT);
      for (let i = 0; i < 24; i++) { const a = Math.PI + i * Math.PI / 23; P(160 + Math.cos(a) * 36, 66 + Math.sin(a) * 36, 3, 3, ['#f08aa8', '#ffd86a', '#ffffff', '#a9d0a1'][i % 4]); }
      ground('#e9e0d4', '#d6cbbd'); P(130, GY - 1, 60, H - GY + 1, '#c94a5a');
      const self = c ? c.self : { sex: 'M' }, isF = self.sex === 'F';
      const groom = { kind: 'adult', shirt: '#2b2f3e', pants: '#2b2f3e', tie: true }, bride = { kind: 'adult', long: true, shirt: '#ffffff', dress: '#ffffff', hat: 'veil', hold: 'flower', blush: true };
      person(144, GY, groom); person(161, GY, bride);
      if ((f % 6) < 4) heart(156, GY - 36);
      for (let i = 0; i < 4; i++) { person(30 + i * 16, GY, { shirt: SHIRTS[i], long: i % 2 === 0 }); person(212 + i * 16, GY, { shirt: SHIRTS[i + 2], long: i % 2 === 1 }); }
      for (let i = 0; i < 18; i++) { const ph = fpm(t * 0.3 + rnd(i), 1); px(100 + rnd(i + 5) * 120, ph * 80, ['#f08aa8', '#ffffff', '#ffd86a'][i % 3]); }
      void isF;
    },
    family(c) {
      sky('warm'); sun(40, 14); cloud(220, 10);
      year < 1980 ? hanok(200, 52, 70) : aptBlock(180, 10, 120, 68, true);
      tree(30, GY - 1, '#7dbb66'); ground('#b9d48e', '#a3c07a');
      lineup(90, c, { self: {} });
      if ((f % 6) < 4) heart(116, GY - 40);
    },
    house(c) {
      const bad = mood === 'bad';
      sky(bad ? 'gray' : 'day'); cloud(80, 8);
      aptBlock(20, 14, 70, 64, true); aptBlock(100, 6, 70, 72, true); aptBlock(250, 18, 60, 60, true);
      P(184, 20, 50, 30, OUT); P(185, 21, 48, 28, '#f4f1e6');
      for (let i = 0; i < 8; i++) P(188 + i * 5, bad ? 26 + i * 2 : 42 - i * 2, 4, 2, bad ? '#e8504a' : '#3aa05a');
      street();
      lineup(170, c, {});
      if (!bad) { const ky = GY - 40 - (f % 2); P(186, ky, 4, 4, '#f0c24a'); P(187, ky + 1, 2, 2, '#fff2c0'); P(190, ky + 1, 6, 1, '#f0c24a'); P(194, ky + 2, 1, 2, '#f0c24a'); }
    },
    hospital(c) {
      P(0, 0, W, GY, '#e3ecef'); P(0, 50, W, 1, '#cfdbe0'); ground('#c9d3d8', '#aab6bc');
      P(60, 54, 90, 6, '#ffffff'); P(59, 53, 92, 1, OUT); P(62, 60, 2, 24, '#9aa4ab'); P(146, 60, 2, 24, '#9aa4ab'); P(62, 48, 16, 6, '#ffffff');
      P(66, 46, 8, 7, OUT); P(67, 47, 6, 5, SKIN); P(78, 50, 66, 4, '#9cc4e6');
      P(166, 20, 1, 64, '#9aa4ab'); P(162, 20, 9, 12, '#d6ecfa'); px(166, 34 + (f % 4) * 3, '#7fc0ff');
      P(190, 22, 50, 26, OUT); P(191, 23, 48, 24, '#0e1a22');
      for (let i = 0; i < 46; i++) { const ph = fpm(i / 46 * 3 - t * 0.8, 1); const y = ph > 0.42 && ph < 0.48 ? 28 : ph > 0.48 && ph < 0.54 ? 40 : 35; px(192 + i, y, '#4af08a'); }
      P(260, 10, 14, 14, '#e8504a'); P(263, 15, 8, 4, '#ffffff'); P(265, 13, 4, 8, '#ffffff');
      if (c && c.spouse) person(246, GY, { kind: c.spouse.kind, long: c.spouse.sex === 'F', shirt: SHIRTS[3] });
      if (c) c.kids.filter((k) => k === 'adult').slice(0, 2).forEach((k, i) => person(264 + i * 16, GY, { shirt: SHIRTS[i + 4], long: i % 2 === 1 }));
    },
    accident(c) {
      sky('night'); stars(20, 30); skyline(31, 70, '#262c4b', '#ffd98a', 20, 44);
      street({ scroll: 0 });
      car(120, GY + 12, '#d0584a');
      const on = f % 2 === 0;
      P(170, GY - 3, 30, 10, '#f4f4f4'); P(170, GY + 5, 30, 1, OUT); P(174, GY - 1, 6, 4, '#bfe0f0'); P(184, GY, 6, 2, '#e8504a'); P(186, GY - 2, 2, 6, '#e8504a');
      P(178, GY - 5, 4, 2, on ? '#ff4040' : '#5a2020'); P(188, GY - 5, 4, 2, on ? '#4060ff' : '#202a5a');
      P(230, GY + 6, 7, 1, '#e8b030'); P(231, GY + 4, 5, 2, '#e8b030'); P(233, GY + 2, 1, 2, '#e8b030');
      lineup(250, c && Object.assign({}, c, { kids: [], spouse: null }), {});
    },
    retire(c) {
      sky('dusk'); sun(262, 40, '#ffe4a0'); P(0, 60, W, 2, '#f6b47a');
      for (let i = 0; i < 3; i++) { const bx = fpm(t * 10 + i * 40, 360) - 20; px(bx, 18 + i * 5, OUT); px(bx + 1, 17 + i * 5 + (f % 2), OUT); px(bx + 2, 18 + i * 5, OUT); }
      ground('#9c8a6e', '#7d6c52'); tree(260, GY - 1, '#c9783a'); tree(40, GY - 1, '#d08a3a');
      for (let i = 0; i < 6; i++) { const ph = fpm(t * 0.2 + rnd(i), 1); px(250 + rnd(i + 1) * 30, 70 + ph * 14, '#d9702a'); }
      P(120, GY - 8, 60, 2, '#7a5a3a'); P(122, GY - 6, 2, 6, '#5a3a22'); P(176, GY - 6, 2, 6, '#5a3a22'); P(120, GY - 14, 60, 2, '#7a5a3a');
      lineup(130, c && Object.assign({}, c, { kids: [] }), { self: { hold: 'cane' } });
    },
    celebrate(c) {
      sky('night'); stars(30, 40);
      const cols = ['#ffd86a', '#ff6a8a', '#6ad0ff', '#9aff8a'];
      for (let k = 0; k < 4; k++) {
        const ph = fpm(t * 0.5 + k * 0.25, 1), sd = k + Math.floor(t * 0.5 + k * 0.25) * 7, cx = 30 + rnd(sd) * 260, cy = 12 + rnd(sd + 3) * 24, r = Math.floor(ph * 14);
        if (ph < 0.9) for (let j = 0; j < 10; j++) { const a = Math.PI * 2 * j / 10; px(cx + Math.cos(a) * r, cy + Math.sin(a) * r + ph * 4, cols[k]); }
      }
      P(0, 60, W, 24, '#2a2140'); for (let y = 62; y < 82; y += 4) for (let x = (y % 8 === 2 ? 0 : 3); x < W; x += 6) P(x, y - ((f + x) % 3 === 0 ? 1 : 0), 3, 3, year >= 2002 && year <= 2002 ? '#d0343a' : SHIRTS[(x + y) % 6]);
      ground('#3a3150', '#4a4166');
      lineup(140, c, { self: { arms: true, shirt: year === 2002 ? '#d0343a' : SHIRTS[2] } });
    },
    loss(c) {
      sky('gray');
      P(110, 20, 100, 58, '#f2f0ec'); P(109, 19, 102, 1, OUT);
      P(150, 26, 20, 24, '#2b2b33'); P(152, 28, 16, 20, '#c9c6c2'); P(156, 32, 8, 8, '#8a8784'); P(150, 26, 3, 3, '#111'); P(167, 26, 3, 3, '#111');
      for (let i = 0; i < 14; i++) P(114 + i * 7, 56 + (i % 2), 5, 4, '#ffffff'); for (let i = 0; i < 14; i++) px(116 + i * 7, 60, '#7aa06a');
      ground('#a9a7a2', '#8f8d88');
      lineup(60, c, { self: { shirt: '#2b2b33', pants: '#2b2b33' }, spouseStyle: { shirt: '#2b2b33', pants: '#2b2b33' } });
      for (let i = 0; i < 4; i++) person(226 + i * 16, GY, { shirt: '#2b2b33', pants: '#2b2b33', long: i % 2 === 0, hold: i === 1 ? 'whiteflower' : null });
      rain();
    },
    rain(c) {
      sky('gray'); skyline(41, 70, '#9aa2ad', '#b5bcc5', 20, 40); street();
      lineup(140, c, { self: { hold: 'umbrella' }, kids: false });
      rain();
    },
    friends(c) {
      sky('mint'); cloud(40, 10); cloud(230, 6, 0.8); tree(60, GY - 1); tree(270, GY - 1, '#7dbb66');
      ground('#a9d08e', '#94bd7a'); P(120, GY - 8, 80, 2, '#9a7a5a'); P(122, GY - 6, 2, 6, '#7a5a3a'); P(196, GY - 6, 2, 6, '#7a5a3a');
      let x = lineup(130, c && Object.assign({}, c, { kids: [], spouse: null }), {});
      x += person(x, GY, { shirt: SHIRTS[4], long: true, blush: true }) + 1; person(x, GY, { shirt: SHIRTS[5] });
      P(136, 36 - (f % 2), 14, 8, '#ffffff'); P(138, 44 - (f % 2), 2, 2, '#ffffff'); heart(141, 37 - (f % 2));
      P(176, 32 + (f % 2), 10, 7, '#ffffff'); px(179, 34 + (f % 2), '#5a4a9a'); P(180, 33 + (f % 2), 1, 4, '#5a4a9a');
    },
    disaster(c) {
      sky('gray'); skyline(51, 70, '#8a8f99', '#a5abb4', 18, 40);
      P(110, 40, 40, 38, '#bdb6aa'); P(150, 52, 40, 26, '#a8a194'); P(120, 34, 26, 6, '#bdb6aa'); for (let i = 0; i < 10; i++) P(110 + rnd(i) * 80, 60 + rnd(i + 3) * 18, 4, 3, '#8a8378');
      for (let i = 0; i < 8; i++) { const ph = fpm(t * 0.3 + rnd(i), 1); P(110 + rnd(i + 1) * 80, 40 - ph * 30, 6, 6, `rgba(190,184,176,${0.5 * (1 - ph)})`); }
      street();
      const on = f % 2 === 0;
      P(30, GY - 4, 34, 10, '#c94a46'); P(34, GY - 2, 8, 4, '#bfe0f0'); P(40, GY - 7, 6, 3, on ? '#ff4040' : '#4060ff');
      lineup(220, c && Object.assign({}, c, { kids: [] }), {});
      for (let i = 0; i < 3; i++) person(76 + i * 16, GY, { shirt: '#e88a2a', pants: '#3a3a44', hat: 'helmet' });
    },
    virus(c) {
      sky('day'); skyline(61, 70, '#c3d4de', '#dce8ee', 20, 44);
      bldg(20, 30, 70, 48, { body: '#efe9dc' }); P(30, 36, 50, 8, '#f2d36a'); P(34, 38, 42, 4, '#2b2b33');
      street();
      lineup(120, c, { self: { mask: true }, walk: true });
      for (let i = 0; i < 4; i++) person(214 + i * 16, GY, { mask: true, shirt: SHIRTS[i + 1], long: i % 2 === 0, walk: true, phase: i });
      for (let i = 0; i < 6; i++) { const x = 20 + rnd(i) * 280 + Math.sin(t + i) * 6, y = 10 + rnd(i + 3) * 30; P(x, y, 4, 4, '#e8605a'); px(x - 1, y + 1, '#c0392b'); px(x + 4, y + 2, '#c0392b'); px(x + 1, y - 1, '#c0392b'); px(x + 2, y + 4, '#c0392b'); }
    },
    news(c) {
      P(0, 0, W, GY, year < 1990 ? '#d9cbb0' : '#e9e2d4'); P(0, 20, W, 1, '#c8b998');
      if (year < 1990) { for (let x = 10; x < W; x += 14) P(x, 0, 1, GY, '#cdbf9f'); }
      ground(year < 1990 ? '#b88a52' : '#c9a57a', '#a87a44');
      const crt = year < 2005;
      const tx = 180, ty = crt ? 34 : 28, tw = crt ? 50 : 70, th = crt ? 38 : 40;
      P(tx - 2, ty - 2, tw + 4, th + 4, crt ? '#6a5a4a' : '#222'); P(tx, ty, tw, th, '#2f4a6e');
      P(tx + tw / 2 - 5, ty + 10, 10, 10, SKIN); P(tx + tw / 2 - 5, ty + 8, 10, 3, HAIR); P(tx + tw / 2 - 7, ty + 20, 14, th - 20, '#2b2f3e');
      P(tx, ty + th - 8, tw, 6, '#c0392b'); P(tx + 2 + (f % 3), ty + th - 6, tw - 10, 2, '#ffffff');
      for (let y = ty; y < ty + th; y += 2) P(tx, y, tw, 1, 'rgba(0,0,0,0.12)');
      if (crt) { P(tx + 10, ty + th + 2, tw - 20, GY - ty - th - 2, '#7a5a3a'); P(tx + tw / 2 - 1, ty - 8, 1, 6, OUT); P(tx + tw / 2 - 6, ty - 10, 1, 8, OUT); }
      else P(tx - 10, ty + th + 2, tw + 20, GY - ty - th - 2, '#8a6a4a');
      P(40, GY - 12, 90, 12, '#8a6a7a'); P(40, GY - 18, 90, 6, '#a07a8a');
      lineup(50, c, {});
    },
    death(c) {
      sky('night'); stars(60, 60); moon(260, 10);
      ground('#1b2036', '#262c4b');
      P(150, 50, 20, 26, '#2b2b33'); P(152, 52, 16, 22, '#8a8784'); P(156, 56, 8, 8, '#5a5754'); P(150, 50, 3, 3, '#111'); P(167, 50, 3, 3, '#111');
      for (let i = 0; i < 8; i++) P(140 + i * 6, 76, 4, 4, '#ffffff');
      P(130, 70, 2, 8, '#f4eee0'); flameAt(130, 68); P(188, 70, 2, 8, '#f4eee0'); flameAt(188, 68);
      for (let i = 0; i < 10; i++) { const ph = fpm(t * 0.1 + rnd(i), 1); px(160 + Math.sin(ph * 6 + i) * (10 + 30 * ph), 70 - ph * 64, `rgba(255,230,160,${1 - ph})`); }
    },
  };
  function rain() { for (let i = 0; i < 70; i++) { const ph = fpm(t * 1.6 + rnd(i), 1), x = Math.floor(rnd(i + 11) * W); P(x, Math.floor(ph * 110) - 8, 1, 3, 'rgba(210,225,245,0.6)'); } }

  function eraTint() {
    if (year < 1975) P(0, 0, W, H, 'rgba(150,110,60,0.22)');
    else if (year < 2000) P(0, 0, W, H, 'rgba(240,180,100,0.06)');
  }
  function draw(ctx, scene, time, yr, md, cast) {
    g = ctx; t = time; f = Math.floor(time * 6); year = yr; mood = md || '';
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    (S[scene] || S.news)(cast);
    eraTint();
  }
  return { draw, W, H };
})();
