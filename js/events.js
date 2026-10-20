/* 일상의 선택들. 큰 갈림길(진학·취업·결혼 등) 사이사이, 대략 2년에 한 번꼴로 시대에 맞는 선택이 찾아와요.
   note는 선택 창 아래에 보여 주는 근거 자료예요. */

const kidsAged = (L, a, b) => L.kids.filter((k) => { const ka = L.year - k.year; return ka >= a && ka <= b; });
const bumpJob = (L, k) => { if (L.job) L.job = Object.assign({}, L.job, { mult: L.job.mult * k }); };
const working = (L) => !!L.job && !L.retired && L.job.id !== 'home';

const POOL = [
  // ───── 어린 시절 ─────
  { id: 'toddler', once: true, when: (L) => L.age === 2, make: (L) => D('toddler', '두 살, 낯선 바깥', '이제 제법 걷기 시작했어요. 처음 보는 것들로 가득한 바깥에서 무엇부터 할까요? 이 아이의 기질이 조금씩 자리 잡아요.', [
    O('개미와 돌멩이를 한참 들여다본다', '호기심', () => { L.flags.temper = '호기심이 많음'; ef(L, { k: 3 }); return '작은 것에도 오래 눈을 떼지 못하는 아이로 자라요.'; }),
    O('있는 힘껏 달려 나간다', '활발함', () => { L.flags.temper = '활발함'; ef(L, { h: 3 }); return '넘어져도 금세 일어나는 아이예요.'; }),
    O('우는 아이에게 다가간다', '다정함', () => { L.flags.temper = '다정함'; ef(L, { r: 3 }); return '친구 마음을 잘 살피는 아이로 자라요.'; }),
    O('엄마 치맛자락을 꼭 잡는다', '조심성', () => { L.flags.temper = '조심성 많음'; ef(L, { p: 1 }); return '낯선 것은 천천히 받아들이는 아이예요.'; }),
  ], { note: '기질은 타고나는 몫과 자라며 겪는 일이 함께 만들어요.' }) },
  { id: 'play', once: true, when: (L) => L.age >= 6 && L.age <= 10, make: (L) => {
    const o = [];
    if (L.year < 1998) o.push(O('골목에서 딱지치기·구슬치기', '해 질 녘까지 친구들과', () => { ef(L, { r: 4, h: 2 }); L.flags.hobby = '골목 놀이'; return '"밥 먹어라!" 소리가 들릴 때까지 골목을 누볐어요.'; }));
    if (L.year >= 1998) o.push(O('PC방·컴퓨터 게임', '스타크래프트·온라인 게임', () => { ef(L, { p: 3, k: -1 }); L.flags.hobby = '게임'; return '친구들과 게임 이야기로 하루가 갔어요.'; }));
    if (L.year >= 2012) o.push(O('스마트폰 영상 보기', '유튜브 키즈', () => { ef(L, { p: 2, h: -1 }); L.flags.hobby = '영상'; return '화면 속 세상이 제일 재미있어요.'; }));
    o.push(O('만화책·동화책 읽기', '', () => { ef(L, { k: 4 }); L.flags.hobby = '독서'; return '책 냄새가 좋아졌어요.'; }));
    if (L.year >= 1980 && L.tier >= 2) o.push(O('태권도·피아노 학원', '동네 학원 버스를 타요', () => { ef(L, { h: 2, a: -40 }); L.flags.hobby = '학원'; return '저녁이면 노란 학원 버스를 타요.'; }));
    return D('play', '놀이의 시간', '학교가 끝나면 무엇을 하며 놀까요?', o, { note: L.year < 1998 ? '1980~90년대 아이들은 골목과 놀이터가 놀이터였어요.' : '1998년 스타크래프트 열풍과 함께 PC방이 전국으로 퍼졌어요.' });
  } },
  { id: 'sibling', once: true, when: (L) => L.age >= 7 && L.age <= 12 && L.siblings > 0, make: (L) => D('sibling', '동생 돌보기', `형제가 ${L.siblings + 1}명인 집이에요. 부모님이 일하러 나간 사이 어린 동생을 봐야 해요.`, [
    O('동생을 업고 논다', '책임감', () => { ef(L, { r: 4, p: -1 }); return '동생이 등에서 잠들었어요.'; }, 2),
    O('친구들과 놀러 나간다', '', () => { ef(L, { p: 3, r: -2 }); return '저녁에 꾸중을 들었지만 재미있었어요.'; }),
  ], { note: `${L.birthYear}년 무렵 합계출산율은 약 ${interp(TFR_KNOTS, L.birthYear).toFixed(1)}명이었어요.` }) },
  { id: 'lunch', once: true, when: (L) => L.age >= 8 && L.age <= 13 && L.year < 1980 && L.tier <= 2, make: (L) => D('lunch', '빈 도시락', '오늘도 도시락을 싸 오지 못했어요. 점심시간이 다가와요.', [
    O('수돗가에서 물로 배를 채운다', '자존심', () => { ef(L, { h: -2, p: -3 }); return '배가 고팠지만 아무 말도 하지 않았어요.'; }),
    O('짝꿍이 나눠 준 반찬을 먹는다', '', () => { ef(L, { r: 5 }); return '그 친구와 평생 친구가 됐어요.'; }),
  ], { note: '1970년대까지 혼분식 장려와 도시락 검사가 있었고, 결식아동도 많았어요.' }) },
  { id: 'captain', once: true, when: (L) => L.age >= 10 && L.age <= 12 && L.phase === 'elem', make: (L) => D('captain', '반장 선거', '반장 선거에 나가 보라는 친구들의 권유가 있어요.', [
    O('나간다', '', () => { if (rnd() < 0.4 + L.rel / 250) { ef(L, { r: 4, p: 4 }); return '반장이 됐어요!'; } ef(L, { p: -2 }); return '아쉽게 떨어졌지만 용기를 냈어요.'; }),
    O('나가지 않는다', '', () => '조용히 친구를 응원했어요.'),
  ]) },
  // ───── 십대 ─────
  { id: 'teen', once: true, when: (L) => L.age >= 13 && L.age <= 16, make: (L) => {
    const o = [O('공부에 전념한다', '성적이 오를지도', () => { ef(L, { k: 5, p: -2 }); return '책상 앞에서 사춘기를 보냈어요.'; })];
    if (L.year >= 1992) o.push(O(L.year >= 2010 ? '아이돌 팬 활동' : L.year >= 1996 ? 'H.O.T.·젝스키스 팬클럽' : '서태지와 아이들에 빠진다', '', () => { ef(L, { p: 5, r: 2, k: -2 }); return '좋아하는 가수 덕에 힘든 시기를 버텼어요.'; }));
    else o.push(O('라디오 심야 방송을 듣는다', '사연을 보내 볼까', () => { ef(L, { p: 4 }); return '밤마다 라디오를 들으며 꿈을 꿨어요.'; }));
    o.push(O('운동부에 들어간다', '', () => { ef(L, { h: 5, r: 2, k: -1 }); return '땀 흘리며 친구들과 가까워졌어요.'; }));
    return D('teen', '사춘기', '마음이 이리저리 흔들리는 나이예요. 무엇에 마음을 쏟을까요?', o, { note: L.year >= 1992 ? '1992년 서태지와 아이들의 등장은 십대 문화를 크게 바꿨어요.' : '' });
  } },
  { id: 'bully', once: true, when: (L) => L.age >= 12 && L.age <= 17, make: (L) => D('bully', '교실 뒤편', '친구 하나가 괴롭힘을 당하는 걸 봤어요.', [
    O('선생님께 알린다', '용기', () => { ef(L, { r: 3, p: 1 }); if (rnd() < 0.3) { ef(L, { p: -4 }); return '도왔지만 한동안 나도 따돌림을 받았어요.'; } return '그 친구가 고맙다고 했어요.'; }),
    O('모른 척한다', '', () => { ef(L, { p: -2 }); return '마음 한구석이 오래 무거웠어요.'; }),
  ]) },
  { id: 'dream', once: true, when: (L) => L.age === 15, make: (L) => {
    const jobs = [['의사·변호사', 'pro'], ['선생님', 'gov'], ['공무원', 'gov'], ['회사원', 'big']];
    if (L.year >= 1995) jobs.push(['연예인', 'self']);
    if (L.year >= 2015) jobs.push(['유튜버', 'self']);
    if (L.year < 1985) jobs.push(['기술자', 'factory']);
    return D('dream', '장래 희망', '진로 조사서에 장래 희망을 적어야 해요.', jobs.map(([n, id]) => O(n, '', () => { L.flags.dream = id; ef(L, { k: 1 }); return `"${n}"라고 적었어요.`; })));
  } },
  { id: 'parttime', once: true, when: (L) => L.age >= 17 && L.age <= 23 && L.year >= 1988 && !working(L), make: (L) => D('parttime', '아르바이트', '용돈이라도 벌어 볼까요?', [
    O(L.year >= 2000 ? '편의점 야간 알바' : '패스트푸드점 알바', '', () => { ef(L, { a: 150, h: -2, k: 1 }); return '세상 돈 벌기가 쉽지 않다는 걸 배웠어요.'; }),
    O('과외를 한다', '공부 잘하는 학생이라면', () => { if (L.know > 55) { ef(L, { a: 300 }); return '과외비로 등록금에 보탰어요.'; } ef(L, { a: 60 }); return '학생이 금방 그만뒀어요.'; }),
    O('하지 않는다', '', () => { ef(L, { k: 2 }); return '공부에 집중했어요.'; }),
  ], { note: L.year >= 2000 ? `${L.year}년 최저임금이 해마다 오르고 있어요.` : '1988년 최저임금제가 처음 시행됐어요.' }) },
  // ───── 대학 ─────
  { id: 'campus', once: true, when: (L) => L.phase === 'univ', make: (L) => {
    const o = [O('동아리·MT에 빠진다', '', () => { ef(L, { r: 6, p: 4, k: -2 }); return '평생 갈 친구들을 만났어요.'; }), O('도서관에서 학점 관리', '', () => { ef(L, { k: 5 }); return '장학금을 받았어요.'; })];
    if (L.year >= 1980 && L.year <= 1991) o.push(O('학생운동에 참여한다', '최루탄 냄새가 가득한 캠퍼스', () => { ef(L, { r: 4, p: 1 }); if (rnd() < 0.08) { ef(L, { h: -6, p: -6 }); return '연행돼 고초를 겪었어요.'; } return '민주화를 외치며 거리로 나섰어요.'; }));
    if (L.year >= 1995 && L.tier >= 3) o.push(O('어학연수를 떠난다', '비용이 많이 들어요', () => { ef(L, { k: 5, a: -800, p: 2 }); return '낯선 나라에서 1년을 보냈어요.'; }));
    return D('campus', '캠퍼스 생활', '대학 생활을 어떻게 보낼까요?', o, { note: L.year >= 1980 && L.year <= 1991 ? '1980년대 대학가는 민주화 운동의 중심이었어요.' : '' });
  } },
  // ───── 일 ─────
  { id: 'hoesik', once: true, when: (L) => working(L) && L.workYears <= 2 && L.age >= 19 && L.year < 2018, make: (L) => D('hoesik', '첫 회식', '부장님이 "오늘은 끝까지 간다!"고 외쳐요. 2차, 3차가 이어질 분위기예요.', [
    O('끝까지 남는다', '눈도장', () => { ef(L, { h: -3, r: 3 }); bumpJob(L, 1.03); return '새벽에 택시를 탔지만 부장님이 이름을 기억했어요.'; }),
    O('1차만 하고 빠진다', '', () => { ef(L, { p: 2, r: -2 }); return '눈치가 보였지만 몸은 편했어요.'; }),
  ]) },
  { id: 'overtime', when: (L) => working(L) && L.age >= 24 && L.age <= 55, make: (L) => D('overtime', '야근', L.year >= 2018 ? '주 52시간제가 시작됐지만, 마감이 코앞이에요.' : '오늘도 사무실 불이 꺼질 줄 몰라요.', [
    O('남아서 끝낸다', '승진에 유리, 건강은 손해', () => { ef(L, { h: -3, r: -2 }); if (rnd() < 0.3 && L.job) { bumpJob(L, 1.08); return '성과를 인정받았어요.'; } return '피곤한 날들이 이어져요.'; }),
    O('정시에 퇴근한다', '저녁이 있는 삶', () => { ef(L, { p: 3, r: 2 }); return '가족과 저녁을 먹었어요.'; }),
  ], { note: L.year < 2018 ? '2000년대 한국의 연간 노동시간은 2,500시간 안팎으로 OECD 최상위권이었어요.' : '2018년부터 주 52시간 근무제가 단계적으로 시행됐어요.' }) },
  { id: 'jobhop', when: (L) => working(L) && L.age >= 28 && L.age <= 52 && L.workYears >= 3, make: (L) => D('jobhop', '이직 제안', '다른 회사에서 연봉을 올려 주겠다는 제안이 왔어요.', [
    O('옮긴다', '모험', () => { const ok = rnd() < 0.55 * jobMarket(L.year) + 0.2; if (ok) { bumpJob(L, 1.15); ef(L, { p: 3 }); return '새 회사에서 자리를 잡았어요.'; } ef(L, { p: -5 }); bumpJob(L, 0.9); return '막상 옮겨 보니 생각과 달랐어요.'; }),
    O('지금 회사에 남는다', '안정', () => { ef(L, { r: 1 }); return '익숙한 자리를 지켰어요.'; }, 1.3),
  ]) },
  { id: 'car', once: true, when: (L) => working(L) && L.year >= 1986 && L.age >= 27 && L.age <= 50, make: (L) => D('car', '마이카', L.year < 2000 ? '"마이카 시대"가 열렸어요. 동료들이 하나둘 차를 사요.' : '차가 있으면 주말에 어디든 갈 수 있어요.', [
    O('할부로 차를 산다', '', () => { ef(L, { a: -medianNow(L) * 0.6, p: 3, r: 2 }); L.flags.car = true; return '첫 차를 몰고 가족과 바다에 갔어요.'; }),
    O('대중교통으로 버틴다', '', () => { ef(L, { a: 100 }); return '그만큼 저축을 늘렸어요.'; }),
  ], { note: '자동차 등록 대수는 1985년 약 111만 대에서 1997년 1,000만 대를 넘었어요.' }) },
  // ───── 건강 습관 ─────
  { id: 'smoke', once: true, when: (L) => L.age >= 20 && L.age <= 45, make: (L) => {
    const male = L.sex === 'M';
    return D('smoke', '담배', male && L.year < 2000 ? '군대에서, 회사에서, 다들 담배를 권해요.' : '스트레스가 쌓이니 담배 생각이 나요.', [
      O('피운다', '건강에 해로워요', () => { L.flags.smoker = true; ef(L, { h: -5, p: 2 }); return '담배를 피우기 시작했어요.'; }, male && L.year < 2000 ? 3 : 0.6),
      O('피우지 않는다', '', () => { ef(L, { h: 2 }); return '담배는 멀리했어요.'; }, 1.5),
    ], { note: male ? '성인 남성 흡연율은 1980년 약 79%에서 2020년 약 34%로 줄었어요.' : '여성 흡연율은 꾸준히 한 자릿수였어요.' });
  } },
  { id: 'quit', once: true, when: (L) => L.flags.smoker && L.age >= 35, make: (L) => D('quit', '금연', '계단을 오를 때마다 숨이 차요.', [
    O('담배를 끊는다', '쉽지 않아요', () => { if (rnd() < 0.5) { L.flags.smoker = false; ef(L, { h: 6, p: 1 }); return '금연에 성공했어요!'; } ef(L, { p: -2 }); return '몇 번이나 다시 피웠어요.'; }),
    O('계속 피운다', '', () => { ef(L, { h: -3 }); return '아직은 괜찮다고 생각했어요.'; }),
  ]) },
  { id: 'drink', when: (L) => L.age >= 30 && L.age <= 60 && L.happy < 50, make: (L) => D('drink', '술잔이 늘었어요', '힘든 일을 잊는 데는 술만 한 게 없는 것 같아요.', [
    O('술을 줄이고 다른 방법을 찾는다', '운동·사람·도움', () => { ef(L, { h: 2, p: 1 }); return '산책을 시작했어요.'; }, 1.5),
    O('술로 버틴다', '당장은 편해요', () => { ef(L, { h: -6, r: -3, p: 2 }); return '아침마다 머리가 무거워요.'; }),
  ]) },
  { id: 'exercise', once: true, when: (L) => L.age >= 35 && L.age <= 65, make: (L) => D('exercise', '건강 챙기기', '배가 나오고 무릎이 쑤셔요.', [
    O('주말마다 등산', '중년의 국민 운동', () => { ef(L, { h: 6, r: 2 }); return '산 정상에서 막걸리 한 잔이 꿀맛이에요.'; }),
    O(L.year >= 2005 ? '헬스장 등록' : '새벽 조깅', '', () => { ef(L, { h: 5, a: -50 }); return '몸이 가벼워졌어요.'; }),
    O('바빠서 미룬다', '', () => { ef(L, { h: -2 }); return '내일부터 하기로 했어요.'; }),
  ]) },
  { id: 'checkup', cd: 10, when: (L) => L.age >= 40 && L.year >= 1995, make: (L) => D('checkup', '건강검진', '국가 건강검진 안내문이 왔어요.', [
    O('검진을 받는다', '', () => { if (rnd() < 0.15) { ef(L, { h: 4 }); return '초기에 문제를 발견해 일찍 치료했어요.'; } ef(L, { h: 1 }); return '다행히 큰 이상은 없었어요.'; }, 2),
    O('귀찮아서 미룬다', '', () => { ef(L, { h: -1 }); return '다음에 받기로 했어요.'; }),
  ], { note: '암은 1983년 통계 집계 이후 줄곧 사망원인 1위예요. 일찍 발견하면 생존율이 크게 올라가요.' }) },
  // ───── 돈 ─────
  { id: 'invest', when: (L) => L.age >= 28 && L.age <= 62 && L.assets > medianNow(L) * 0.3, make: (L) => {
    const y = L.year;
    const era = y >= 1985 && y <= 1990 ? ['땅·아파트 분양에 투자', 0.75, 0.6, '1980년대 후반 부동산 값이 크게 올랐어요.']
      : y >= 1998 && y <= 1999 ? ['코스닥 벤처 주식', 0.35, 1.2, '1999년 벤처 열풍 뒤 2000년 코스닥이 크게 폭락했어요.']
        : y >= 2006 && y <= 2007 ? ['펀드에 가입', 0.3, 0.5, '2008년 금융위기로 많은 펀드가 반 토막 났어요.']
          : y >= 2017 && y <= 2021 ? ['주식·코인 투자', 0.4, 0.9, '2021년 코인·주식 열풍 뒤 2022년 크게 떨어졌어요.']
            : ['주식 투자', 0.5, 0.3, ''];
    return D('invest', '목돈 굴리기', '모아 둔 돈이 조금 있어요. 어떻게 할까요?', [
      O(era[0], '오를 수도, 떨어질 수도', () => { const base = Math.max(L.assets, 0) * 0.5; if (rnd() < era[1]) { ef(L, { a: base * era[2], p: 4 }); return '수익을 냈어요!'; } ef(L, { a: -base * Math.min(0.6, era[2]), p: -6 }); return '큰 손실을 봤어요.'; }),
      O('은행 적금', '안전', () => { ef(L, { a: L.assets * (y < 1998 ? 0.1 : 0.03) }); return '이자가 조금씩 쌓였어요.'; }, 1.5),
    ], { note: era[3] });
  } },
  { id: 'guarantee', once: true, when: (L) => L.age >= 30 && L.age <= 60 && L.year >= 1975 && L.year <= 2012, make: (L) => D('guarantee', '보증', '오랜 친구가 사업 자금 대출에 보증을 서 달라고 해요.', [
    O('서 준다', '의리', () => { if (rnd() < 0.35) { ef(L, { a: -1500, p: -10, r: -5 }); L.debtStress += 2; return '친구 사업이 망해 빚을 떠안았어요.'; } ef(L, { r: 5 }); return '친구가 무사히 갚았어요.'; }),
    O('거절한다', '', () => { ef(L, { r: -4 }); return '사이가 서먹해졌어요.'; }),
  ], { note: '연대보증은 IMF 이후 많은 가정을 무너뜨렸고, 2012년부터 금융권에서 단계적으로 폐지됐어요.' }) },
  { id: 'travel', cd: 9, when: (L) => L.year >= 1989 && L.age >= 22 && L.assets > 0 && !L.retired, make: (L) => D('travel', '해외여행', L.year < 1995 ? '해외여행 자유화로 너도나도 해외로 나가요.' : '휴가에 어디로 갈까요?', [
    O('해외로 떠난다', '', () => { ef(L, { p: 6, k: 2, a: -medianNow(L) * 0.08 }); return '낯선 거리에서 오래 기억할 추억을 만들었어요.'; }),
    O('국내 여행', '', () => { ef(L, { p: 4, a: -medianNow(L) * 0.02 }); return '바닷가에서 쉬었어요.'; }),
    O('집에서 쉰다', '', () => { ef(L, { a: 50 }); return '돈을 아꼈어요.'; }),
  ], { note: L.year < 1995 ? '1989년 해외여행이 전면 자유화됐어요.' : '' }) },
  // ───── 가족 ─────
  { id: 'holiday', cd: 12, when: (L) => L.age >= 20, make: (L) => D('holiday', '명절', L.year < 2000 ? '설날 귀성길, 고속도로가 주차장이 됐어요.' : '이번 명절엔 어떻게 할까요?', [
    O('고향에 내려간다', '가족과 함께', () => { ef(L, { r: 5, p: 1, h: -1 }); return '열 시간 걸려 도착했지만 어머니 밥이 맛있었어요.'; }, 2),
    O(L.year >= 2010 ? '여행을 간다' : '집에서 쉰다', '', () => { ef(L, { p: 3, r: -3 }); return '조용한 명절을 보냈어요.'; }),
  ], { note: '명절마다 수천만 명이 이동하는 "민족 대이동"이 벌어져요.' }) },
  { id: 'fight', cd: 9, when: (L) => L.partner === 'married', make: (L) => D('fight', '부부 싸움', '사소한 일로 배우자와 크게 다퉜어요.', [
    O('먼저 사과하고 대화한다', '', () => { ef(L, { r: 4, p: 2 }); return '오랜만에 속마음을 나눴어요.'; }, 2),
    O('꾹 참는다', '', () => { ef(L, { p: -3 }); return '말없이 며칠이 지나갔어요.'; }),
    O('한동안 따로 지낸다', '', () => { ef(L, { r: -6, p: -3 }); if (rnd() < 0.2) { L.partner = 'divorced'; L.assets *= 0.65; return '결국 이혼했어요.'; } return '시간이 지나 다시 합쳤어요.'; }, 0.5),
  ]) },
  { id: 'discipline', once: true, when: (L) => kidsAged(L, 5, 12).length > 0, make: (L) => D('discipline', '말썽꾸러기', '아이가 친구와 싸우고 들어왔어요.', [
    O(L.year < 2000 ? '회초리를 든다' : '엄하게 혼낸다', '', () => { ef(L, { r: -3 }); return '아이가 한동안 눈을 피했어요.'; }),
    O('이야기를 들어 준다', '', () => { ef(L, { r: 4 }); return '아이가 울며 사정을 털어놨어요.'; }, 1.5),
  ]) },
  { id: 'childcare', once: true, when: (L) => kidsAged(L, 0, 2).length > 0 && working(L), make: (L) => D('childcare', '아이는 누가 봐요?', '맞벌이라 아이를 맡길 곳이 필요해요.', [
    O('부모님께 맡긴다', '', () => { ef(L, { r: 3, a: -100 }); return '할머니 손에서 아이가 자랐어요.'; }),
    O(L.year >= 2005 ? '어린이집에 보낸다' : '놀이방에 보낸다', '', () => { ef(L, { a: -200 }); return '아이가 처음엔 많이 울었어요.'; }),
    O('일을 그만두고 직접 키운다', '경력이 끊겨요', () => { L.job = null; L.workYears = 0; L.workAge = L.age + 5; ef(L, { r: 6, p: 1 }); return '육아에 전념하기로 했어요.'; }),
  ], { note: '여성 고용률이 30대에 크게 떨어지는 "경력단절"은 한국 노동시장의 오랜 특징이에요.' }) },
  { id: 'kidschool', once: true, when: (L) => kidsAged(L, 13, 16).length > 0 && L.year >= 1995, make: (L) => D('kidschool', '자녀 진학', '아이 중학교 성적표가 나왔어요. 진학 방향을 정해야 해요.', [
    O(L.year >= 2000 && L.tier >= 3 ? '조기 유학을 보낸다' : '특목고 입시 학원', '비용이 많이 들어요', () => { ef(L, { a: -medianNow(L) * (L.year >= 2000 && L.tier >= 3 ? 1.5 : 0.4), r: -3 }); return L.year >= 2000 && L.tier >= 3 ? '배우자와 아이가 외국으로 떠나고 "기러기 부모"가 됐어요.' : '아이가 밤늦게까지 학원에 다녀요.'; }),
    O('아이가 원하는 대로', '', () => { ef(L, { r: 4, p: 2 }); return '아이가 스스로 길을 찾기로 했어요.'; }, 1.5),
  ], { note: '2006년 무렵 초·중·고 조기 유학생이 한 해 약 3만 명에 달했어요.' }) },
  { id: 'parents', once: true, when: (L) => L.age >= 42 && L.age <= 62 && !L.flags.parentLost, make: (L) => D('parents', '부모님 부양', '부모님이 편찮으셔서 돌봐 드릴 사람이 필요해요.', [
    O('모시고 산다', '', () => { ef(L, { r: 4, p: -4, a: -200 }); return '한집에서 부모님을 모셨어요.'; }, L.year < 2000 ? 3 : 1),
    O(L.year >= 2008 ? '요양원에 모신다' : '형제들과 비용을 나눈다', '', () => { ef(L, { a: -400, p: -1 }); return '주말마다 찾아뵈었어요.'; }),
  ], { note: L.year >= 2008 ? '2008년 노인장기요양보험이 시작됐어요.' : '이 시절엔 장남·자녀가 부모를 모시는 것이 당연하게 여겨졌어요.' }) },
  { id: 'kidwed', once: true, when: (L) => kidsAged(L, 27, 34).length > 0 && L.age >= 50, make: (L) => D('kidwed', '자녀의 결혼', '자녀가 결혼을 한다고 해요. 신혼집 마련이 걱정이에요.', [
    O('집 마련을 돕는다', '노후 자금이 줄어요', () => { ef(L, { a: -Math.max(0, L.assets) * 0.4, r: 5 }); return '아이 신혼집 전세금에 보탰어요.'; }),
    O('스스로 하게 한다', '', () => { ef(L, { r: -2 }); return '마음은 아팠지만 응원했어요.'; }),
  ]) },
  { id: 'pet', once: true, when: (L) => L.year >= 2005 && L.age >= 25 && L.age <= 70, make: (L) => D('pet', '반려동물', '유기견 보호소 소식을 봤어요.', [
    O('입양한다', '', () => { ef(L, { p: 6, r: 3, a: -100 }); L.flags.pet = true; return '털복숭이 가족이 생겼어요.'; }),
    O('마음만 보탠다', '', () => { ef(L, { p: 1 }); return '후원금을 조금 보냈어요.'; }),
  ], { note: '2020년대에는 네 집 중 한 집 이상이 반려동물과 살아요.' }) },
  { id: 'vote', when: (L) => L.age >= 20 && [1987, 1992, 1997, 2002, 2007, 2012, 2017, 2022, 2025].includes(L.year), make: (L) => D('vote', '대통령 선거', `${L.year}년 대통령 선거일이에요.`, [
    O('투표하러 간다', '', () => { ef(L, { p: 1, k: 1 }); return '한 표를 행사했어요.'; }, 3),
    O('쉰다', '', () => '투표하지 않았어요.'),
  ], { note: L.year === 1987 ? '16년 만의 직선제 대선, 투표율은 89.2%였어요.' : '최근 대선 투표율은 70%대 후반이에요.' }) },
  // ───── 노년 ─────
  { id: 'grandkid', once: true, when: (L) => L.age >= 58 && kidsAged(L, 30, 45).length > 0, make: (L) => D('grandkid', '손주 돌보기', '맞벌이하는 자녀가 손주를 봐 달라고 부탁해요.', [
    O('맡아 준다', '', () => { ef(L, { r: 6, h: -3, p: 3 }); return '손주 재롱에 웃음이 늘었어요.'; }, 1.5),
    O('정중히 거절한다', '내 시간도 소중해요', () => { ef(L, { p: 2, r: -2 }); return '대신 주말에 놀러 오라고 했어요.'; }),
  ]) },
  { id: 'returnfarm', once: true, when: (L) => L.age >= 55 && L.age <= 68 && L.year >= 2005 && !L.rural, make: (L) => D('returnfarm', '귀촌', '도시를 떠나 시골에서 살아 볼까요?', [
    O('시골로 내려간다', '', () => { L.rural = true; ef(L, { h: 4, p: 3, r: -3 }); return '텃밭을 일구며 살아요.'; }),
    O('도시에 남는다', '', () => '익숙한 동네가 좋아요.'),
  ], { note: '2010년대 베이비붐 세대의 은퇴와 함께 귀농·귀촌 인구가 크게 늘었어요.' }) },
  { id: 'oldhobby', once: true, when: (L) => L.age >= 65, make: (L) => D('oldhobby', '노년의 하루', '하루가 길어졌어요. 무엇을 하며 지낼까요?', [
    O('경로당에 나간다', '', () => { ef(L, { r: 6 }); return '동네 친구들과 바둑을 둬요.'; }),
    O(L.year >= 2012 ? '복지관에서 스마트폰을 배운다' : '복지관 노래 교실', '', () => { ef(L, { k: 3, p: 4 }); return L.year >= 2012 ? '손주에게 영상 통화를 걸었어요.' : '노래 실력이 늘었어요.'; }),
    O('집에서 TV를 본다', '', () => { ef(L, { r: -3 }); return '조용한 날들이 이어져요.'; }),
  ]) },
  { id: 'legacy', once: true, when: (L) => L.age >= 75, make: (L) => D('legacy', '삶을 정리하며', '남은 시간을 어떻게 보낼까요?', [
    O('자서전을 쓴다', '', () => { ef(L, { p: 4, k: 2 }); return '내 이야기를 손주들에게 남겼어요.'; }),
    O('재산을 정리해 둔다', '', () => { ef(L, { r: 3 }); return '자식들이 다툴 일이 없게 해 두었어요.'; }),
    O('가 보고 싶던 곳에 간다', '', () => { ef(L, { p: 6, h: -2 }); return '오래 꿈꾸던 곳을 봤어요.'; }),
  ]) },
];

// 큰 갈림길이 없는 해에, 확률적으로 하나를 골라 줘요
function poolEvents(L) {
  if (L.age < 2) return;
  const hasBig = L.queue.some((d) => d.kind !== 'question');
  L.flags.poolUsed = L.flags.poolUsed || {};
  const used = L.flags.poolUsed;
  const forced = POOL.filter((e) => e.once && e.id === 'toddler' && !used[e.id] && e.when(L));
  const cand = (forced.length ? forced : POOL.filter((e) => {
    if (e.once && used[e.id]) return false;
    if (!e.once && used[e.id] && L.age - used[e.id] < (e.cd || 6)) return false;   // 같은 일은 몇 년에 한 번만
    try { return e.when(L); } catch (err) { return false; }
  }));
  if (!cand.length) return;
  const p = forced.length ? 1 : hasBig ? 0.12 : L.age < 6 ? 0.25 : L.age >= 70 ? 0.3 : 0.5;
  if (rnd() >= p) return;
  const e = forced[0] || wpick(cand, (c) => (c.once ? 1.6 : 1));
  used[e.id] = L.age;
  L.queue.push(e.make(L));
}
