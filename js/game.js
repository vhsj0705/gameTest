/* 게임 엔진: 한 해씩 시간을 흘려보내고, 시대 상황에 맞는 선택지를 만들어요. (화면과 무관, DOM 사용 안 함) */

const rnd = () => Math.random();
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const idx = (y) => interp(INCOME_INDEX, y);                 // 소득 지수
const man = (n) => Math.round(n).toLocaleString('ko-KR') + '만원';
function wpick(items, wfn) {
  const ws = items.map(wfn), t = ws.reduce((a, b) => a + b, 0);
  let r = rnd() * t;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

const JOBS = {
  big: { id: 'big', n: '대기업 직원', mult: 1.8 }, sme: { id: 'sme', n: '중소기업 직원', mult: 1.0 },
  gov: { id: 'gov', n: '공무원', mult: 1.25 }, factory: { id: 'factory', n: '공장 노동자', mult: 0.85 },
  farm: { id: 'farm', n: '농·어업', mult: 0.7 }, service: { id: 'service', n: '서비스·판매직', mult: 0.75 },
  self: { id: 'self', n: '자영업', mult: 1.0 }, pro: { id: 'pro', n: '전문직', mult: 2.4 },
  daily: { id: 'daily', n: '일용직', mult: 0.6 }, home: { id: 'home', n: '가사·집안일', mult: 0.15 },
  senior: { id: 'senior', n: '노년 소일거리', mult: 0.3 },
};

function O(label, hint, run, weight = 1) { return { label, hint, run, weight }; }
function D(id, title, body, options, extra) { return Object.assign({ id, title, body, options }, extra); }
function log(L, text, kind = 'info') { L.log.push({ age: L.age, year: L.year, text, kind }); }
function ef(L, d) {
  if (d.h) L.health = clamp(L.health + d.h);
  if (d.p) L.happy = clamp(L.happy + d.p);
  if (d.k) L.know = clamp(L.know + d.k);
  if (d.r) L.rel = clamp(L.rel + d.r);
  if (d.a) L.assets += d.a;
}
const netWorth = (L) => L.assets + (L.house ? L.house.value - L.house.loan : 0);
const medianNow = (L) => MEDIAN_INCOME * idx(L.year);
const retireAge = (y) => (y < 2000 ? 55 : y < 2016 ? 57 : 60);
const loanRate = (y) => (y <= 1998 ? 0.12 : y <= 2008 ? 0.06 : y <= 2021 ? 0.035 : y <= 2023 ? 0.055 : 0.045);
const svcMonths = (y) => Math.round(interp(SERVICE_KNOTS, y));

/* ───────── 태어나기 ───────── */
function randomBirthYear(minY = 1940, maxY = 2025) {
  const ys = []; for (let y = minY; y <= maxY; y++) ys.push(y);
  return wpick(ys, (y) => Math.max(0.05, interp(BIRTHS_KNOTS, y)));
}

function newLife(opts = {}) {
  const year = opts.year || randomBirthYear();
  const sex = rnd() < 0.512 ? 'M' : 'F';
  const region = wpick(REGIONS, (r) => Math.max(0.001, r.w1 + (r.w2 - r.w1) * clamp((year - 1960) / 60, 0, 1)));
  const rural = !region.metro && rnd() < clamp(1.6 * (1 - interp(URBAN_KNOTS, year)), 0, 0.9);
  const tier = wpick([1, 2, 3, 4, 5], (t) => [0, rural ? 0.3 : 0.2, 0.3, 0.28, 0.15, 0.07][t]);
  const L = {
    birthYear: year, year, age: 0, sex, region: region.n, metro: !!region.metro, rural, tier,
    health: clamp(58 + rnd() * 20 + (tier - 3) * 2), happy: 55, know: 18 + rnd() * 14, rel: 50,
    assets: 0, income: 0, job: null, workYears: 0, edu: 0, phase: 'none', workAge: 99, univEnd: 0,
    partner: 'none', spouseAge: 0, kids: [], wantKids: 0, house: null, retired: false, pensionYears: 0,
    focus: 'balance', flags: {}, log: [], notes: [], snaps: [], queue: [], dead: false, cause: '', secPerYear: opts.secPerYear || 45,
    exempt: rnd() < 0.06, debtStress: 0,
    siblings: Math.max(0, Math.round(interp(TFR_KNOTS, year) - 1 + (rnd() - 0.5) * 1.5)),
  };
  const era = ERA_NOTES.find((e) => year >= e[0] && year <= e[1]);
  const where = rural ? `${region.n} 시골 마을` : `${region.n}`;
  log(L, `이 해에 태어난 한국인의 평균 기대수명은 약 ${interp(E0_KNOTS, year).toFixed(0)}세예요.`, 'info');
  log(L, `${year}년, ${where}의 ${TIERS[tier].n}에서 ${sex === 'M' ? '남자' : '여자'}아이로 태어났어요. ${era ? era[2] : ''}`, 'birth');
  L.snaps.push({ age: 0, year, happy: L.happy, health: L.health, phase: 'baby' });
  return L;
}

/* ───────── 죽음 ───────── */
// 그 나이의 평균 건강(이 값보다 건강하면 덜 위험)
const HEALTH_KNOTS = [[0, 70], [30, 71], [40, 68], [50, 64], [60, 58], [70, 49.5], [80, 36], [90, 26], [110, 12]];
const expectedHealth = (a) => interp(HEALTH_KNOTS, a);
function deathChance(L) {
  const M = interp(MODE_KNOTS[L.sex], L.year);
  let q = annualQ(L.age, L.year, M);
  if (L.age >= 15) q *= Math.exp((expectedHealth(L.age) - L.health) / 100);
  if (L.year >= 1950 && L.year <= 1953) {
    q += 0.03;
    if (L.sex === 'M' && L.age >= 17 && L.age <= 40) q += L.flags.avoidedWar ? 0.03 : 0.09;
  }
  if (L.flags.vietnamYear === L.year) q += 0.016;
  if (L.year >= 2020 && L.year <= 2022 && L.age >= 70) q += 0.002;
  if (L.flags.dementia) q += 0.03;
  return Math.min(0.995, q);
}
function pickCause(L) {
  const a = L.age;
  const band = a < 1 ? 'infant' : a < 15 ? 'child' : a < 40 ? 'young' : a < 65 ? 'mid' : 'old';
  if (L.year >= 1950 && L.year <= 1953 && a >= 15 && a <= 45) return '한국전쟁의 희생';
  if (L.year >= 2020 && L.year <= 2022 && a >= 70 && rnd() < 0.1) return '코로나19';
  return wpick(CAUSES[band].filter((c) => L.year >= c[2] && L.year <= c[3]), (c) => c[1])[0];
}
function die(L) {
  L.dead = true;
  L.cause = L.cause || pickCause(L);
  log(L, `${L.age}세에 ${L.cause}(으)로 세상을 떠났어요.`, 'death');
  L.snaps.push({ age: L.age, year: L.year, happy: L.happy, health: 0, phase: 'dead' });
}

/* ───────── 한 해 진행 ───────── */
function tick(L) {
  L.queue = [];
  if (rnd() < deathChance(L)) { die(L); return; }
  L.age++; L.year++;
  historyEvents(L);
  stageSchool(L);
  stageWork(L);
  stageFamily(L);
  stageHousing(L);
  randomEvents(L);
  economy(L);
  drift(L);
  if (L.age >= 55 && !L.retired) stageRetire(L);
  if (typeof poolEvents === 'function' && !L.dead) poolEvents(L);
  L.snaps.push({ age: L.age, year: L.year, happy: L.happy, health: L.health, phase: L.retired ? 'old' : L.phase !== 'none' ? 'school' : L.job ? 'work' : L.age < 7 ? 'baby' : 'free' });
  if (L.health <= 0 && !L.dead) { L.cause = '건강 악화'; die(L); }
}

function choose(L, decision, i) {
  const o = decision.options[i];
  const text = o.run ? o.run(L) : '';
  log(L, `[선택] ${o.label}${text ? ' → ' + text : ''}`, 'choice');
  return text;
}
function autoChoose(L, decision) {
  const ws = decision.options.map((o) => o.weight || 1), t = ws.reduce((a, b) => a + b, 0);
  let r = rnd() * t;
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; }
  return 0;
}

/* ───────── 해마다 달라지는 능력치·돈 ───────── */
function economy(L) {
  const m = medianNow(L);
  let income = 0;
  if (L.retired) {
    income = pensionIncome(L);
  } else if (L.job && L.age >= 13) {
    const gap = L.sex === 'F' ? (L.year < 1990 ? 0.55 : L.year < 2005 ? 0.65 : 0.72) : 1;
    income = m * L.job.mult * (1 + Math.min(L.workYears, 25) * 0.02) * (0.9 + rnd() * 0.2) * (L.age < 18 ? 0.5 : 1) * gap;
    L.workYears++;
    if (L.job.id !== 'farm' && L.job.id !== 'self' && L.job.id !== 'daily' && L.job.id !== 'home' && L.year >= 1988) L.pensionYears++;
  }
  L.income = income;
  let save = 0.2 + (L.focus === 'money' ? 0.12 : 0) - (L.focus === 'rest' ? 0.04 : 0);
  if (L.partner === 'married') save += 0.04;
  const kidsCost = L.kids.filter((k) => L.year - k.year < 20).length * 0.09 * m * (L.year >= 1995 ? 1.3 : 1);
  L.assets += income * save - kidsCost * (L.age < 65 ? 1 : 0.2);
  if (L.retired) { L.assets += income * 0.7 - m * 0.3; L.assets = Math.max(L.assets, -m * 0.5); }   // 은퇴 후 생활비. 부족분은 가족·복지가 메워요
  if (L.flags.rent) L.assets -= m * 0.12;
  if (L.age < 20 && L.age >= 15 && !L.job) L.assets = Math.max(L.assets, 0);
  if (L.house) {
    L.house.value *= 1 + housingTrend(L.year) + (rnd() - 0.5) * 0.04;
    const interest = L.house.loan * loanRate(L.year), repay = Math.min(L.house.loan, Math.max(0, income) * 0.1);
    L.house.loan -= repay; L.assets -= interest;
  }
  L.debtStress = L.assets < -m * 2 ? L.debtStress + 1 : Math.max(0, L.debtStress - 1);
}
function pensionIncome(L) {
  const m = medianNow(L);
  let p = 0;
  if (L.pensionYears >= 10) p += m * 0.28 * Math.min(1, L.pensionYears / 30);
  if (L.age >= 65 && L.year >= 2014) p += 300;                  // 기초연금
  if (!p && L.kids.length) p += m * 0.15 * (L.rel / 60);        // 자녀 용돈
  return p;
}
function drift(L) {
  const f = L.focus, m = medianNow(L);
  let dh = (L.age < 30 ? 0.3 : -(0.15 + (L.age - 30) * 0.008)) + (f === 'health' ? 1.6 : 0) + (f === 'rest' ? 0.7 : 0);
  if (L.age >= 20 && L.age < 65 && L.income < m * 0.3) dh -= 0.5;
  if (L.partner === 'married') dh += 0.2;
  L.health = clamp(L.health + dh + (rnd() - 0.5) * 3);
  const inSchool = L.phase !== 'none';
  L.know = clamp(L.know + (inSchool ? 3.2 + (f === 'study' ? 1.2 : 0) : f === 'study' ? 1.2 : 0.12) * (1 - L.know / 130));
  L.rel = clamp(L.rel + (f === 'social' ? 1.8 : -0.3) + (L.partner === 'married' ? 0.4 : 0) - (L.age > 70 ? 0.6 : 0) + (rnd() - 0.5) * 3);
  let feel;
  if (L.age >= 20 && !L.retired && L.age < 65) feel = clamp(Math.log2(Math.max(L.income, 1) / m + 0.15) * 6, -12, 12);
  else feel = (L.tier - 3) * 3 + (L.retired ? clamp(Math.log2(Math.max(L.income, 1) / (m * 0.5) + 0.2) * 4, -8, 6) : 0);
  const target = 32 + L.rel * 0.25 + L.health * 0.22 + feel + (L.partner === 'married' ? 5 : 0) - Math.min(15, L.debtStress * 3);
  L.happy = clamp(L.happy + (target - L.happy) * 0.35 + (f === 'rest' ? 1.5 : 0) + (rnd() - 0.5) * 4);
}

/* ───────── 시대 사건 ───────── */
function histDecision(L, id, title, body, options) { L.queue.push(D(id, title, body, options, { history: true })); }
function historyEvents(L) {
  const y = L.year;
  TICKERS.filter((t) => t[0] === y).forEach((t) => { log(L, `📰 ${y}년 — ${t[1]}`, 'news'); if (t[2]) ef(L, t[2]); });
  if (y >= 1950 && y <= 1953 && L.age >= 1) {
    if (y === 1950 || !L.flags.warSeen) {
      L.flags.warSeen = true;
      log(L, '📰 한국전쟁이 터졌어요. 피난길과 굶주림, 이별이 이어져요.', 'news');
      ef(L, { p: -6, h: -3, a: -L.assets * 0.3 });
      if (L.sex === 'M' && L.age >= 17 && L.age <= 40) {
        histDecision(L, 'war', '전쟁의 한가운데', '징집 통지가 날아왔고, 마을에는 포성이 가까워요.', [
          O('입대한다', '전선에 나가요. 가장 위험해요', () => { ef(L, { p: -3, r: 3 }); return '총을 들고 전선으로 갔어요.'; }, 1),
          O('피난길에 오른다', '남쪽으로 내려가요', () => { L.flags.avoidedWar = true; ef(L, { h: -4, a: -50 }); return '가족과 남쪽으로 피난을 떠났어요.'; }, 1),
        ]);
      }
    }
  }
  if (y === 1960 && L.age >= 16 && L.age <= 45) {
    histDecision(L, 'apr19', '4·19', '부정선거에 항의하는 시위가 전국으로 번지고 있어요.', [
      O('거리로 나선다', '용기가 필요해요', () => { ef(L, { p: 3, r: 3, k: 2 }); if (rnd() < 0.015) { L.cause = '4·19 시위 중 총상'; die(L); return '시위 도중 총탄에 맞았어요.'; } return '시민들과 함께 외쳤고, 이승만 대통령이 하야했어요.'; }, 1),
      O('집에서 지켜본다', '안전하지만 마음이 무거워요', () => { ef(L, { p: -1 }); return '소식을 라디오로 들었어요.'; }, 2),
    ]);
  }
  if (y >= 1965 && y <= 1973 && L.sex === 'M' && L.age >= 20 && L.age <= 32 && !L.flags.vietnamAsked) {
    L.flags.vietnamAsked = true;
    histDecision(L, 'vietnam', '베트남 파병', '국군이 베트남에 파병되고 있어요. 지원하면 전투수당과 달러를 벌 수 있어요.', [
      O('지원한다', '큰돈을 벌지만 목숨을 걸어요', () => { L.flags.vietnamYear = L.year + 1; ef(L, { a: 1200, h: -8, p: -4 }); return '파병되어 정글에서 1년을 보냈어요. 목돈을 쥐고 돌아오길 바랐어요.'; }, 1),
      O('가지 않는다', '평범하게 지내요', () => '국내에서 복무를 마쳤어요.', 3),
    ]);
  }
  if (y === 1980 && L.region === '광주' && L.age >= 15) {
    histDecision(L, 'gwangju', '1980년 5월, 광주', '계엄군이 도시를 에워쌌고 총성이 울려요.', [
      O('시민군과 함께한다', '가장 위험한 선택이에요', () => { ef(L, { p: -8, r: 5 }); if (rnd() < 0.08) { L.cause = '5·18 민주화운동 중 희생'; die(L); return '끝내 돌아오지 못했어요.'; } L.flags.trauma = true; return '살아남았지만 그날의 기억은 평생 남았어요.'; }, 1),
      O('집 안에 숨는다', '숨죽이며 며칠을 버텨요', () => { ef(L, { p: -6, h: -2 }); return '문을 걸어 잠그고 버텼어요.'; }, 2),
    ]);
  }
  if (y === 1987 && L.age >= 17 && L.age <= 50) {
    histDecision(L, 'june', '1987년 6월', '"호헌 철폐, 독재 타도"를 외치는 시민들이 거리를 메워요.', [
      O('거리로 나간다', '넥타이 부대와 함께해요', () => { ef(L, { p: 3, r: 3, h: -1 }); return '시청 앞 광장에서 목이 쉴 때까지 외쳤어요. 직선제 개헌이 이뤄졌어요.'; }, 1),
      O('지켜본다', '생활이 먼저예요', () => '뉴스로 소식을 지켜봤어요.', 2),
    ]);
  }
  if (y === 1998 && L.age >= 18 && L.tier >= 2) {
    histDecision(L, 'gold', '금 모으기', '나라 빚을 갚자며 국민들이 금붙이를 들고 은행 앞에 줄을 서요.', [
      O('금반지를 낸다', '약 227톤이 모였어요', () => { ef(L, { a: -30, p: 2, r: 2 }); return '돌 반지와 결혼반지를 내놓고 마음이 뭉클했어요.'; }, 2),
      O('내지 않는다', '', () => '내 살림부터 챙기기로 했어요.', 1),
    ]);
  }
  if ((y === 1997 || y === 1998) && L.job && L.age >= 20 && !L.retired) {
    const p = { big: 0.14, sme: 0.2, factory: 0.2, service: 0.15, self: 0.18, gov: 0.02, pro: 0.06, daily: 0.25, farm: 0.03 }[L.job.id] || 0.1;
    if (y === 1998 && rnd() < p * 1.2 || y === 1997 && rnd() < p * 0.4) layoff(L, 'IMF 구조조정');
  }
  if (y === 2003 && L.age >= 20 && L.age <= 45 && rnd() < 0.1) {
    ef(L, { a: -L.assets * 0.4 - 300, p: -8 }); L.debtStress += 2;
    log(L, '카드 돌려막기에 빠져 신용불량자가 됐어요.', 'bad');
  }
  if (y === 2008 && L.age >= 16 && L.age <= 50) {
    histDecision(L, 'candle', '2008년 촛불', '광우병 우려로 시민들이 광화문에 촛불을 들었어요.', [
      O('참가한다', '', () => { ef(L, { p: 1, r: 2 }); return '촛불을 들고 밤거리를 걸었어요.'; }, 1),
      O('지켜본다', '', () => '뉴스로 소식을 지켜봤어요.', 2),
    ]);
  }
  if (y === 2020 && L.age >= 20 && L.job && L.job.id === 'self') { ef(L, { a: -1000, p: -6 }); log(L, '코로나19로 손님이 뚝 끊겨 가게 매출이 크게 줄었어요.', 'bad'); }
  if (y === 2020 && L.age >= 7 && L.age <= 24 && L.phase !== 'none') log(L, '학교 수업이 온라인으로 바뀌었어요.', 'info');
  if (y === 2021 && L.age >= 27 && L.age <= 50 && !L.house && L.assets > 0) {
    histDecision(L, 'yeongkkul', '영끌의 시대', '집값이 하루가 다르게 올라요. 지금 사지 않으면 영영 못 살 것 같아요.', [
      O('대출을 최대로 받아 집을 산다', '집값이 계속 오를까요?', () => { buyHouse(L, 0.85); return '영끌로 집을 샀어요. 다음 해 금리가 가파르게 올랐어요.'; }, 1),
      O('버틴다', '전세로 계속 살아요', () => '무리하지 않기로 했어요.', 2),
      O('주식·코인에 투자한다', '변동성이 커요', () => { const r = rnd() < 0.45 ? 0.5 : -0.4; ef(L, { a: Math.max(L.assets, 500) * r }); return r > 0 ? '운 좋게 수익을 봤어요.' : '고점에 물려 큰 손실을 봤어요.'; }, 1),
    ]);
  }
  if (y === 2022 && L.house && L.house.loan > L.house.value * 0.5) { ef(L, { p: -6 }); L.debtStress += 2; log(L, '대출 이자가 크게 올라 허리가 휘어요.', 'bad'); }
}
function layoff(L, why) {
  log(L, `${why}로 ${L.job.n} 일자리를 잃었어요.`, 'bad');
  ef(L, { p: -10, a: -200 });
  L.job = null; L.workYears = Math.floor(L.workYears * 0.5); L.flags.jobless = L.year; L.workAge = L.age + 1;
}

/* ───────── 학교 ───────── */
function stageSchool(L) {
  const a = L.age;
  if (a === 7) {
    const ok = rnd() < interp(PRIM_KNOTS, L.year) * (L.sex === 'F' && L.year < 1960 ? 0.8 : 1) * (L.tier === 1 ? 0.9 : 1);
    if (ok) { L.phase = 'elem'; log(L, '초등학교에 입학했어요.', 'school'); }
    else { L.know -= 6; L.phase = 'none'; L.workAge = 10; log(L, '집안 사정과 시대 때문에 학교에 가지 못해요. 일을 거들며 자라요.', 'bad'); }
  }
  if (a === 13 && L.phase === 'elem') {
    L.edu = 1; L.phase = 'none';
    const can = rnd() < interp(MS_KNOTS, L.year) * (0.7 + L.tier * 0.08);
    const body = `초등학교를 졸업했어요. 이 해 중학교 진학률은 약 ${Math.round(interp(MS_KNOTS, L.year) * 100)}%예요.` + (L.year < 1975 ? ' 중학교에 가려면 입시를 치러야 해요.' : '');
    if (L.year < 1985 && L.tier <= 2 && can) {
      L.queue.push(D('middle', '중학교 진학', body + ' 집안 형편이 어려워 일을 시켜야 하나 고민하세요.', [
        O('중학교에 간다', '공부를 이어가요', () => { L.phase = 'mid'; ef(L, { a: -50 }); return '부모님이 어렵게 학비를 마련해 주셨어요.'; }, 2),
        O('일터로 나간다', '가계를 돕는 소년 노동', () => { L.workAge = 13; return '일찍 일터로 나갔어요.'; }, 1),
      ]));
    } else if (can) { L.phase = 'mid'; log(L, '중학교에 입학했어요.', 'school'); }
    else { L.workAge = 13; log(L, '중학교에 가지 못하고 일을 시작해요.', 'bad'); }
  }
  if (a === 16 && L.phase === 'mid') {
    L.edu = 2; L.phase = 'none';
    const rate = interp(HS_KNOTS, L.year), opts = [];
    const body = `중학교를 졸업했어요. 이 해 고교 진학률은 약 ${Math.round(rate * 100)}%예요.` + (L.year >= 1974 ? ' 고교 평준화로 추첨 배정을 받아요.' : '');
    const canHigh = rnd() < clamp(rate * (0.6 + L.know / 120) * (0.75 + L.tier * 0.07), 0.05, 0.99);
    if (canHigh) {
      opts.push(O('인문계 고등학교', '대학 진학을 준비해요', () => { L.phase = 'high'; L.flags.track = 'academic'; return '대학 입시를 향해 달려요.'; }, 3));
      opts.push(O(L.year >= 2000 ? '특성화고' : '실업계 고등학교', '일찍 기술과 취업을 준비해요', () => { L.phase = 'high'; L.flags.track = 'voc'; ef(L, { k: -4 }); return '기술을 익히며 취업을 준비해요.'; }, 1));
    }
    opts.push(O('일을 시작한다', '학업을 접고 돈을 벌어요', () => { L.workAge = 16; return '일터로 나갔어요.'; }, canHigh ? 0.5 : 3));
    L.queue.push(D('high', '고등학교', body, opts));
  }
  if (a === 19 && L.phase === 'high') {
    L.edu = 3; L.phase = 'none';
    const rate = interp(COLLEGE_KNOTS, L.year), opts = [];
    const body = `고등학교를 졸업했어요. 이 해 대학 진학률은 약 ${Math.round(rate * 100)}%예요.` + (L.year >= 1980 && L.year < 1982 ? ' 과외가 금지돼 있어요.' : '');
    const base = rate * (0.55 + L.know / 100 * 0.9) * (0.8 + (L.tier - 1) * 0.1) * (L.flags.track === 'voc' ? 0.7 : 1);
    opts.push(O('4년제 대학에 도전', `합격 가능성 약 ${Math.round(clamp(base, 0.03, 0.95) * 100)}%`, () => {
      if (rnd() < clamp(base, 0.03, 0.95)) { L.phase = 'univ'; L.univEnd = L.year + 4; L.flags.degree = 5; ef(L, { a: -L.tier * 60, p: 3 }); return '합격! 대학생이 됐어요.'; }
      ef(L, { p: -6 }); L.flags.retake = true; return '아쉽게 떨어졌어요. 재수를 해야 할지 고민이에요.';
    }, 3));
    opts.push(O('전문대에 진학', '실무 중심, 합격 가능성이 높아요', () => { if (rnd() < clamp(base * 1.7, 0.1, 0.97)) { L.phase = 'univ'; L.univEnd = L.year + 2; L.flags.degree = 4; ef(L, { a: -L.tier * 30 }); return '전문대에 입학했어요.'; } L.workAge = 19; return '아쉽게 떨어져 바로 취업 시장으로 나가요.'; }, 1.5));
    opts.push(O('바로 취업한다', '사회로 먼저 나가요', () => { L.workAge = 19; return '일찍 사회로 나가요.'; }, 1.5));
    L.queue.push(D('college', '대학 진학', body, opts));
  }
  if (L.flags.retake && L.phase === 'none' && L.age >= 19 && L.age <= 20) {
    L.flags.retake = false;
    L.queue.push(D('retake', '재수', '대학 입시에 떨어졌어요. 한 해 더 도전할까요?', [
      O('재수한다', '학원과 독서실에서 1년을 보내요', () => { const p = clamp(interp(COLLEGE_KNOTS, L.year) * (0.65 + L.know / 80), 0.05, 0.92); ef(L, { k: 6, p: -3, a: -150 }); if (rnd() < p) { L.phase = 'univ'; L.univEnd = L.year + 4; L.flags.degree = 5; return '재수 끝에 합격했어요.'; } L.workAge = L.age; return '또 낙방. 이제는 일을 구해요.'; }, 1.5),
      O('포기하고 일한다', '', () => { L.workAge = L.age; return '취업 시장으로 나가요.'; }, 1),
    ]));
  }
  if (L.phase === 'univ' && L.year >= L.univEnd) {
    L.phase = 'none'; L.edu = L.flags.degree; L.workAge = L.age;
    if (L.sex === 'M' && !L.flags.served && !L.exempt) L.workAge = L.age + 1;
    log(L, L.edu === 5 ? '대학을 졸업했어요.' : '전문대를 졸업했어요.', 'school');
  }
  if (a === 20 && L.sex === 'M') {
    if (L.exempt) log(L, '신체검사에서 병역 면제 판정을 받았어요.', 'info');
    else {
      const m = svcMonths(L.year), yrs = Math.ceil(m / 12);
      L.flags.served = true;
      if (L.phase === 'univ') L.univEnd += yrs; else { L.job = null; L.workYears = 0; L.workAge = L.age + yrs; }
      ef(L, { h: 3, r: -2, p: -2 });
      log(L, `군에 입대했어요. 복무 기간은 약 ${m}개월이에요.`, 'life');
    }
  }
  if (a >= 17 && a <= 24 && L.rural && !L.flags.moved && L.year >= 1960 && L.year <= 1995 && L.phase !== 'univ') {
    L.flags.moved = true;
    L.queue.push(D('leaveFarm', '도시로 갈까', `"서울로 가자!" 이 시기에는 농촌 청년들이 일자리를 찾아 도시로 대거 떠나요(이농). 도시 인구 비율은 ${Math.round(interp(URBAN_KNOTS, L.year) * 100)}%예요.`, [
      O('도시로 올라간다', '공장이나 일자리를 구해 상경해요', () => { L.rural = false; L.region = pick(['서울', '경기', '인천', '부산']); L.metro = true; ef(L, { r: -6, p: -2, k: 2 }); L.flags.urban = true; return `${L.region}으로 올라왔어요. 낯설지만 일자리가 있어요.`; }, 2),
      O('고향에 남는다', '농사를 짓고 부모님을 모셔요', () => { L.flags.stayed = true; ef(L, { r: 4 }); return '고향에서 살기로 했어요.'; }, 1),
    ]));
  }
}

/* ───────── 일 ───────── */
function setJob(L, job, text) {
  L.job = job; L.workYears = 0; L.flags.jobless = undefined;
  log(L, text || `${job.n}(으)로 일하게 됐어요.`, 'work');
  return `${job.n}(으)로 일하게 됐어요.`;
}
function stageWork(L) {
  if (L.retired || L.job || L.phase !== 'none' || L.age < L.workAge || L.age >= 65) return;
  if (L.age < 13) return;
  L.queue.push(jobDecision(L));
  L.workAge = 99;
}
function jobDecision(L) {
  const o = [], e = L.edu, k = L.know, m = jobMarket(L.year);
  const body = L.flags.jobless ? '일자리를 구해야 해요.' : `취업 시장 분위기: ${m > 1.2 ? '일자리가 넘쳐요' : m < 0.5 ? '얼어붙어 있어요' : m < 0.8 ? '쉽지 않아요' : '보통이에요'}.`;
  if (e <= 2 || L.age < 18) {
    const kids = L.sex === 'F' && L.year <= 1985 ? '공장 여공' : '공장 노동자';
    o.push(O(kids + '(으)로 일한다', '노동 강도가 세지만 수입이 있어요', () => { ef(L, { h: -3 }); return setJob(L, JOBS.factory); }, 3));
    o.push(O('서비스·판매일을 한다', L.sex === 'F' && L.year <= 1985 ? '버스 안내양·식당 등' : '식당·가게 등', () => setJob(L, JOBS.service), 2));
    if (L.rural) o.push(O('농·어업을 한다', '집안일을 이어요', () => setJob(L, JOBS.farm), 2));
    o.push(O('일용직으로 일한다', '', () => setJob(L, JOBS.daily), 1));
  } else {
    if (e >= 3) o.push(O('대기업에 지원', `합격 가능성 약 ${Math.round(clamp(0.09 * m * (0.5 + k / 60) * (e >= 5 ? 1.6 : e === 4 ? 0.9 : 0.5), 0.01, 0.85) * 100)}%`, () => {
      if (rnd() < clamp(0.09 * m * (0.5 + k / 60) * (e >= 5 ? 1.6 : e === 4 ? 0.9 : 0.5), 0.01, 0.85)) return setJob(L, JOBS.big);
      ef(L, { p: -4 }); return setJob(L, JOBS.sme, '대기업 문턱을 넘지 못하고 중소기업에 들어갔어요.');
    }, 2));
    o.push(O('중소기업에 들어간다', '무난한 선택이에요', () => setJob(L, JOBS.sme), 3));
    if (e >= 3) o.push(O('공무원 시험을 준비한다', `경쟁이 치열해요`, () => {
      ef(L, { k: 3, p: -3 });
      if (rnd() < clamp(0.08 + k / 100 * 0.3 * (m < 0.8 ? 1.1 : 0.8), 0.05, 0.5)) return setJob(L, JOBS.gov, '시험에 합격해 공무원이 됐어요.');
      return setJob(L, JOBS.sme, '합격하지 못하고 중소기업에 들어갔어요.');
    }, 1.5));
    if (e >= 5 && k > 70) o.push(O('전문직을 노린다', '의사·변호사·회계사 등, 합격하기 어려워요', () => {
      ef(L, { k: 4, p: -4 }); if (rnd() < 0.18) return setJob(L, JOBS.pro); return setJob(L, JOBS.big, '전문직은 어려웠지만 좋은 직장을 얻었어요.');
    }, 0.8));
    o.push(O('창업·장사를 한다', '대박과 쪽박 사이', () => { if (rnd() < 0.45) { ef(L, { a: -300 }); return setJob(L, JOBS.self); } ef(L, { a: -900, p: -8 }); return setJob(L, JOBS.daily, '장사가 망해 빚을 졌어요.'); }, 0.8));
    if (L.rural) o.push(O('농사를 짓는다', '고향을 지켜요', () => setJob(L, JOBS.farm), 1));
  }
  if (L.sex === 'M' && L.year >= 1963 && L.year <= 1977 && L.age >= 20 && L.age <= 33 && e >= 2) o.push(O('서독 광부로 간다', '파독 광부. 3년간 지하 1,000m에서 일해요', () => { ef(L, { a: 600, h: -8, p: -2 }); L.flags.abroad = true; return setJob(L, JOBS.sme, '독일 탄광에서 3년을 일하고 목돈을 모아 돌아왔어요.'); }, 1));
  if (L.sex === 'F' && L.year >= 1966 && L.year <= 1977 && L.age >= 20 && L.age <= 33 && e >= 3) o.push(O('서독 간호사로 간다', '파독 간호사. 낯선 땅에서 일해요', () => { ef(L, { a: 500, p: -3, k: 4 }); L.flags.abroad = true; return setJob(L, JOBS.sme, '독일 병원에서 일하고 큰 경험을 얻어 돌아왔어요.'); }, 1));
  if (L.sex === 'M' && L.year >= 1975 && L.year <= 1986 && L.age >= 22 && L.age <= 40) o.push(O('중동 건설 현장으로 간다', '뜨거운 사막에서 높은 임금을 받아요', () => { ef(L, { a: 700 * idx(L.year) / 0.12, h: -7, r: -4 }); return setJob(L, JOBS.sme, '사막의 건설 현장에서 일하고 큰돈을 벌어 돌아왔어요.'); }, 1));
  return D('job', e <= 2 ? '일을 시작해요' : '취업', body, o);
}
const NO_RETIRE = ['self', 'farm', 'daily', 'home', 'senior'];
function stageRetire(L) {
  if (L.retired) return;
  if (L.job && !NO_RETIRE.includes(L.job.id) && L.age >= retireAge(L.year)) {
    L.queue.push(D('retire', '정년 퇴직', `정년이 되었어요. (이 시기 정년은 대체로 ${retireAge(L.year)}세 안팎이에요)`, [
      O('퇴직하고 쉰다', '연금과 저축으로 살아요', () => { L.retired = true; L.job = null; ef(L, { p: 2 }); return '긴 직장 생활을 마쳤어요.'; }, 2),
      O('재취업한다', '경비·택배 등 소일거리를 해요', () => { setJob(L, JOBS.senior); L.retired = false; L.flags.working70 = true; return '다른 일자리를 구했어요.'; }, 1.5),
    ]));
  } else if (NO_RETIRE.includes((L.job || {}).id) && L.age >= 68) { L.retired = true; L.job = null; log(L, '일을 접고 쉬어요.', 'life'); }
  else if (!L.job && L.age >= 60) L.retired = true;
}

/* ───────── 가족 ───────── */
function spouseAlive(L) {
  const sa = L.spouseAge, sx = L.sex === 'M' ? 'F' : 'M';
  const q = annualQ(sa, L.year, interp(MODE_KNOTS[sx], L.year));
  return rnd() >= q;
}
function stageFamily(L) {
  const lo = L.age >= 22;
  const mean = interp(L.sex === 'M' ? MARRY_AGE_M : MARRY_AGE_F, L.year);
  if (L.partner === 'married') {
    L.spouseAge++;
    if (!spouseAlive(L)) { L.partner = 'widowed'; ef(L, { p: -20, r: -8, h: -4 }); log(L, '배우자가 세상을 떠났어요.', 'bad'); }
    else if (rnd() < 0.005 + (L.rel < 35 ? 0.02 : 0) + (L.year >= 2000 ? 0.006 : 0) + (L.year >= 1990 ? 0.003 : 0) && L.age < 70) {
      L.partner = 'divorced'; L.assets *= 0.65; ef(L, { p: -10, r: -8 }); log(L, '이혼했어요.', 'bad');
    }
  } else if ((L.partner === 'none' || L.partner === 'divorced' || L.partner === 'widowed') && lo && L.age <= 50 && L.phase === 'none' && L.partner !== 'dating') {
    const p = 0.26 * Math.exp(-Math.pow((L.age - (mean - 1)) / 6, 2)) * (0.6 + L.rel / 100 * 0.9) * (L.flags.noLove ? 0.3 : 1);
    if (rnd() < p) {
      if (L.year < 1990 && L.partner === 'none') {
        L.queue.push(D('match', '맞선', '중매로 맞선 자리가 들어왔어요. 이 시절에는 중매와 직장·이웃 소개가 흔했어요.', [
          O('맞선을 보고 결혼한다', '', () => marry(L), 3),
          O('거절한다', '', () => { L.flags.noLove = rnd() < 0.3; return '아직은 마음이 없어요.'; }, 1),
        ]));
      } else {
        L.queue.push(D('love', '인연', L.year >= 2015 ? '소개팅 앱과 지인의 소개로 좋은 사람을 만났어요.' : '직장 동료의 소개로 마음 가는 사람을 만났어요.', [
          O('적극적으로 만난다', '', () => { L.partner = 'dating'; L.flags.dating = 0; ef(L, { p: 6, r: 4 }); return '설레는 연애가 시작됐어요.'; }, 3),
          O('일과 나에게 집중한다', '', () => { L.flags.noLove = rnd() < 0.2; ef(L, { k: 1 }); return '지금은 연애보다 내 삶이 먼저예요.'; }, 1.5),
        ]));
      }
    }
  } else if (L.partner === 'dating') {
    L.flags.dating++;
    if (L.flags.dating >= 1) {
      const drive = interp(MARRY_DRIVE, L.year);
      L.queue.push(D('propose', '결혼을 생각해요', `연애가 이어지고 있어요. 이 해의 평균 초혼 나이는 남자 ${interp(MARRY_AGE_M, L.year).toFixed(0)}세, 여자 ${interp(MARRY_AGE_F, L.year).toFixed(0)}세쯤이에요.`, [
        O('결혼한다', '새 가정을 꾸려요', () => marry(L), Math.max(0.5, drive * 6)),
        O('연애만 이어간다', '', () => { L.flags.dating = -1; ef(L, { p: 2 }); return '당분간은 지금 관계를 이어가기로 했어요.'; }, 1),
        O('헤어진다', '', () => { L.partner = 'none'; ef(L, { p: -8, r: -3 }); return '각자의 길을 가기로 했어요.'; }, 0.3),
      ]));
    }
  }
  if (L.partner === 'married') {
    const fertileEnd = L.sex === 'F' ? 41 : 44;
    if (L.kids.length < L.wantKids && L.age <= fertileEnd && rnd() < 0.45) {
      if (L.kids.length === 0 && L.year >= 1980) {
        L.queue.push(D('firstKid', '첫 아이', `이 해 합계출산율은 ${interp(TFR_KNOTS, L.year).toFixed(2)}명이에요. 아이를 가질까요?`, [
          O('아이를 갖는다', '삶이 크게 바뀌어요', () => haveKid(L), 4),
          O('조금 더 미룬다', '', () => { L.wantKids = Math.max(0, L.wantKids - (rnd() < 0.4 ? 1 : 0)); return '조금 더 지켜보기로 했어요.'; }, 1.5),
          O('갖지 않기로 한다', '둘만의 삶을 꾸려요', () => { L.wantKids = 0; ef(L, { p: 1 }); return '아이 없이 살기로 했어요.'; }, 0.7),
        ]));
      } else { haveKid(L); }
    }
    L.kids.forEach((k) => {
      const ka = L.year - k.year;
      if (ka === 7 && L.year >= 1995 && !k.edu) { k.edu = true; L.queue.push(D('hagwon', '자녀 사교육', '아이가 학교에 갈 나이가 됐어요. 사교육비가 큰 고민이에요.', [
        O('학원에 보낸다', '교육비가 많이 들어요', () => { ef(L, { a: -L.income * 0.2, p: -1 }); return '학원비가 부담이지만 아이를 응원해요.'; }, 2),
        O('집에서 돌본다', '여유 있는 시간을 보내요', () => { ef(L, { r: 3, p: 2 }); return '아이와 함께하는 시간이 늘었어요.'; }, 1.5),
      ])); }
    });
  }
  // 부모님
  if (L.age >= 38 && L.age <= 70 && !L.flags.parentLost && rnd() < 0.035 + (L.age - 38) * 0.002) {
    L.flags.parentLost = true;
    const inh = Math.max(0, (L.tier - 2)) * 700 * (idx(L.year) / 0.4);
    ef(L, { p: -10, r: -4, a: inh });
    log(L, '부모님이 세상을 떠나셨어요.' + (inh ? ' 약간의 유산을 물려받았어요.' : ''), 'bad');
  }
  // 자녀 독립·손주
  if (L.age >= 60) L.kids.forEach((k) => { if (L.year - k.year === 30 && !k.out) { k.out = true; ef(L, { p: 3, r: 2 }); log(L, '자녀가 가정을 꾸리고 독립했어요.', 'life'); } });
}
function marry(L) {
  L.partner = 'married'; L.spouseAge = L.age + (L.sex === 'M' ? -3 : 3); L.flags.marriedYear = L.year;
  L.wantKids = Math.max(0, Math.round(interp(TFR_KNOTS, L.year) + (rnd() - 0.5) * 1.4));
  ef(L, { p: 8, r: 8, a: -idx(L.year) * 1500 });
  let txt = '결혼식을 올리고 새 가정을 꾸렸어요.';
  if (L.sex === 'F' && L.job && rnd() < (L.year < 1995 ? 0.7 : L.year < 2010 ? 0.4 : 0.15)) { L.job = null; L.workYears = 0; txt += ' 당시 분위기 때문에 직장을 그만뒀어요.'; }
  return txt;
}
function haveKid(L) {
  L.kids.push({ year: L.year });
  ef(L, { p: 6, r: 4, h: -1 });
  log(L, `아이가 태어났어요. (${L.kids.length}번째)`, 'life');
  return '아이가 태어났어요.';
}

/* ───────── 집 ───────── */
function housePrice(L) {
  const f = L.metro ? (L.region === '서울' ? 1.8 : 1) : L.region === '경기' ? 1.2 : L.rural ? 0.5 : 0.8;
  return interp(PIR_KNOTS, L.year) * medianNow(L) * f;
}
function buyHouse(L, ltv) {
  const price = housePrice(L), cash = Math.max(0, L.assets * 0.9) + (L.tier >= 4 ? price * 0.25 : 0);
  const loan = Math.min(price * ltv, Math.max(0, price - cash));
  L.assets -= price - loan; L.house = { value: price, loan };
  L.flags.rent = false;
}
function stageHousing(L) {
  if (L.house || L.flags.houseAsked || L.age < 29 || L.age > 48 || L.year < 1965 || L.retired || !L.job) return;
  if (L.partner !== 'married' && L.age < 34) return;
  L.flags.houseAsked = true;
  const price = housePrice(L);
  L.queue.push(D('house', '내 집 마련', `집값이 연 소득의 약 ${interp(PIR_KNOTS, L.year).toFixed(0)}배 수준이에요. 내가 사는 곳 기준으로 한 채 값은 약 ${man(price)}이에요.`, [
    O('대출을 받아 집을 산다', '집값이 오르면 큰 자산이 돼요', () => {
      const cash = Math.max(0, L.assets * 0.9) + (L.tier >= 4 ? price * 0.25 : 0);
      if (price - cash > price * 0.8) { L.flags.rent = true; return '대출 한도가 모자라 집을 사지 못하고 월세로 살아요.'; }
      buyHouse(L, 0.8); ef(L, { p: 4 }); return '드디어 내 집을 마련했어요.';
    }, 2),
    O('전세로 산다', '목돈은 묶이지만 부담이 적어요', () => { ef(L, { p: 1 }); return '전세로 안정적으로 살아요.'; }, 2),
    O('월세로 산다', '매달 집세가 나가요', () => { L.flags.rent = true; return '월세로 살며 저축을 늘리려 해요.'; }, 1),
    O('청약을 노린다', `당첨은 운이 필요해요`, () => {
      if (rnd() < 0.12 + (L.partner === 'married' ? 0.1 : 0) + L.kids.length * 0.05) { L.assets -= price * 0.25; L.house = { value: price * 1.1, loan: price * 0.35 }; return '청약에 당첨돼 새 집을 얻었어요!'; }
      L.flags.rent = true; return '아쉽게 낙첨. 월세로 살며 다음을 기약해요.';
    }, 1),
  ]));
}

/* ───────── 무작위 사건 ───────── */
function randomEvents(L) {
  const a = L.age, ev = [];
  const E = (p, run) => { if (rnd() < p) ev.push(run); };
  if (a >= 10 && !L.dead) E(L.year < 1995 ? 0.014 : 0.006, () => { ef(L, { h: -10 - rnd() * 8, p: -3, a: -100 }); log(L, '교통사고를 당해 크게 다쳤어요.', 'bad'); });
  if (a >= 10 && a <= 17) E(0.04, () => { ef(L, { p: -8, r: -6 }); log(L, '학교에서 괴롭힘 때문에 힘든 시기를 보냈어요.', 'bad'); });
  if (a >= 8) E(0.03, () => { ef(L, { r: 8, p: 4 }); log(L, '좋은 친구를 만나 마음이 든든해졌어요.', 'life'); });
  if (a >= 8) E(0.03, () => { ef(L, { p: 5, k: 1 }); log(L, '새로운 취미를 발견해 일상이 즐거워졌어요.', 'life'); });
  if (a >= 19 && L.year >= 2003) E(0.003, () => { ef(L, { a: 3000, p: 8 }); log(L, '로또 3등에 당첨됐어요!', 'good'); });
  if (a >= 30 && a <= 60 && L.year <= 2013 && L.job && ['self', 'sme'].includes(L.job.id)) E(0.008, () => { ef(L, { a: -1500, p: -8 }); L.debtStress++; log(L, '연대보증을 서 준 지인이 도망가 큰 빚을 떠안았어요.', 'bad'); });
  if (L.job && a < 60) E(0.04, () => { L.job = Object.assign({}, L.job, { mult: L.job.mult * 1.1 }); ef(L, { p: 3 }); log(L, '성과를 인정받아 승진하고 월급이 올랐어요.', 'good'); });
  if (L.job && !['self', 'farm', 'daily'].includes(L.job.id) && a < 60) E(0.015 / Math.max(0.4, jobMarket(L.year)), () => layoff(L, '회사 사정'));
  if (a >= 70) E(0.06, () => { ef(L, { h: -12, p: -3 }); log(L, '넘어져 크게 다쳤어요.', 'bad'); });
  if (a >= 75 && !L.flags.dementia) E(0.02, () => { L.flags.dementia = true; ef(L, { k: -15, r: -8 }); log(L, '기억이 흐려지는 치매 진단을 받았어요.', 'bad'); });
  if (a >= 65 && L.rel < 30) E(0.15, () => { ef(L, { p: -6 }); log(L, '찾아오는 사람이 없어 외로운 날이 이어져요.', 'bad'); });
  const illP = 0.006 + Math.max(0, a - 40) * 0.0008 + (L.health < 40 ? 0.02 : 0);
  if (rnd() < illP && a >= 5) L.queue.push(illness(L));
  ev.forEach((f) => f());
}
function illness(L) {
  const insured = L.year >= 1989 || (L.year >= 1977 && L.job && ['big', 'gov', 'pro'].includes(L.job.id));
  const cost = (insured ? 400 : 3500) * idx(L.year) / 0.4;
  const age = L.age;
  return D('illness', '큰 병이 찾아왔어요', insured ? '진단을 받았어요. 건강보험 덕분에 치료비는 일부 부담해요.' : '진단을 받았지만, 이 시절엔 건강보험이 없어 치료비가 어마어마해요.', [
    O('병원에서 치료받는다', `치료비 약 ${man(cost)}`, () => {
      ef(L, { a: -cost, h: -6 });
      if (rnd() < 0.015 + Math.max(0, age - 55) * 0.002) { L.cause = '큰 병'; die(L); return '치료했지만 끝내 회복하지 못했어요.'; }
      return '치료를 받고 시간이 지나며 회복했어요.';
    }, insured ? 4 : 1.5),
    O('민간요법으로 버틴다', '돈은 들지 않지만 위험해요', () => {
      ef(L, { h: -12, p: -4 });
      if (rnd() < 0.08 + Math.max(0, age - 50) * 0.003) { L.cause = '큰 병'; die(L); return '병이 깊어져 끝내 이겨내지 못했어요.'; }
      return '다행히 고비를 넘겼지만 몸이 많이 상했어요.';
    }, insured ? 0.5 : 2),
  ]);
}

/* ───────── 기록 내보내기 (Godot 재생기가 읽는 형식) ───────── */
function buildRecord(L) {
  return {
    version: 1,
    meta: { birthYear: L.birthYear, sex: L.sex, region: L.region, rural: L.rural, tier: L.tier, tierName: TIERS[L.tier].n, age: L.age, year: L.year, cause: L.cause, edu: EDU_NAMES[L.edu], partner: L.partner, kids: L.kids.length, house: !!L.house, netWorth: Math.round(netWorth(L)) },
    log: L.log.map((e) => ({ age: e.age, year: e.year, text: e.text, kind: e.kind, fav: !!e.fav })),
    snaps: L.snaps.map((s) => ({ age: s.age, year: s.year, happy: Math.round(s.happy), health: Math.round(s.health), phase: s.phase })),
    notes: L.notes,
  };
}
