/* 사망 확률 모델: 통계청 생명표의 기대수명·영아사망률에 맞춰 보정한 값이에요.
   (연도별 기대수명 표는 data.js의 E0_KNOTS, 보정 결과는 MODE_KNOTS) */

function interp(knots, x) {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    if (x <= knots[i][0]) {
      const [x0, y0] = knots[i - 1], [x1, y1] = knots[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  const n = knots.length, [xa, ya] = knots[n - 2], [xb, yb] = knots[n - 1];
  return yb + (yb - ya) / (xb - xa) * (x - xb);   // 마지막 구간의 추세를 이어 감
}

// 영아사망률(출생 1000명당), 대략적인 추세
const IMR_KNOTS = [[1930, 170], [1940, 150], [1950, 130], [1960, 85], [1970, 45], [1980, 22], [1990, 8.5], [2000, 5.3], [2010, 3.4], [2023, 2.4], [2060, 2.0]];
const GOMPERTZ_B = 9.3;

// age살에 죽을 1년 확률. M은 성인 사망이 가장 많은 나이(보정값)
function annualQ(age, year, M) {
  const imr = interp(IMR_KNOTS, year) / 1000;
  if (age === 0) return imr;
  if (age < 15) return Math.min(0.5, imr * 0.5 * Math.exp(-0.45 * (age - 1)) + 0.00015 * (1 + imr * 20));
  const accident = 0.0003 * (1 + imr * 15) * (age < 45 ? 1 : 0.6);
  const h = (1 / GOMPERTZ_B) * Math.exp((age - M) / GOMPERTZ_B);
  return Math.min(1, 1 - Math.exp(-(h + accident)));
}

// 주어진 해의 생명표로 계산한 출생 시 기대수명
function lifeExpectancy(year, M) {
  let s = 1, e0 = 0;
  for (let a = 0; a < 125; a++) {
    const q = annualQ(a, year, M);
    e0 += s * (1 - q * 0.5);
    s *= 1 - q;
  }
  return e0;
}

if (typeof module !== 'undefined') module.exports = { interp, annualQ, lifeExpectancy, IMR_KNOTS };
