class_name Highlights
extends RefCounted
## 인생 기록에서 중요한 순간을 고르고, 각 순간에 어울리는 장면 이름을 붙여요.

# 위에 있을수록 먼저 맞춰 봐요. [장면, [키워드...]]
const SCENE_RULES: Array = [
	["disaster", ["붕괴", "화재", "참사"]],
	["virus", ["코로나", "메르스", "신종 플루"]],
	["accident", ["교통사고", "넘어져"]],
	["war", ["한국전쟁", "전쟁", "피난", "전선"]],
	["protest", ["4·19", "시위", "촛불", "민주항쟁", "5·18", "광주", "6월", "거리로"]],
	["crisis", ["IMF", "외환위기", "구조조정", "금 모으기", "금반지", "일자리를 잃", "신용불량", "빚", "카드 돌려막기", "망해"]],
	["abroad", ["독일", "중동", "해외", "이민", "유학", "파병"]],
	["military", ["입대", "군에", "복무", "병역"]],
	["wedding", ["결혼식", "결혼", "맞선"]],
	["family", ["아이가 태어", "자녀", "첫 아이", "독립했"]],
	["house", ["내 집", "집을", "집값", "전세", "월세", "청약", "영끌", "대출"]],
	["loss", ["떠나셨", "세상을 떠", "사별", "이혼", "외로", "헤어"]],
	["hospital", ["큰 병", "치료", "치매", "병원", "진단"]],
	["retire", ["퇴직", "은퇴", "정년"]],
	["celebrate", ["월드컵", "올림픽", "로또", "당첨", "합격", "성과를 인정"]],
	["graduation", ["졸업"]],
	["school", ["입학", "학교", "중학교", "고등학교", "초등", "대학", "재수", "학원"]],
	["factory", ["공장", "여공", "노동자", "소년 노동", "안내양", "일터"]],
	["office", ["취업", "직원", "승진", "회사", "공무원", "대기업", "중소기업", "창업", "전문직", "일자리", "일하게"]],
	["city", ["도시", "상경", "이농"]],
	["farm", ["농", "시골", "고향"]],
	["friends", ["친구", "취미", "인연", "연애", "만난"]],
]

const SCENE_TITLES: Dictionary = {
	"birth": "세상에 태어나다", "death": "삶의 끝에서", "disaster": "무너진 하루", "virus": "마스크의 시대",
	"accident": "예기치 못한 사고", "war": "전쟁의 한가운데", "protest": "거리의 목소리", "crisis": "외환위기의 그늘",
	"abroad": "먼 나라로", "military": "군 복무", "wedding": "새 출발", "family": "가족이 생기다",
	"house": "내 집 이야기", "loss": "이별과 상실", "hospital": "병과 싸우다", "retire": "긴 하루를 마치고",
	"celebrate": "환호의 순간", "graduation": "졸업의 날", "school": "배움의 시간", "factory": "공장의 불빛",
	"office": "일터에서", "city": "도시로 가는 기차", "farm": "고향의 들녘", "friends": "함께한 사람들",
	"news": "그날의 뉴스", "rain": "마음에 내린 비",
}

# 중요도를 높이는 말들
const MILESTONES: Array = ["태어났", "입학", "졸업", "결혼", "아이가", "취업", "일하게", "내 집", "집을", "이혼", "사별", "퇴직", "입대", "상경", "합격", "승진", "세상을 떠"]

static func classify(e: Dictionary) -> String:
	var kind: String = e.get("kind", "info")
	var text: String = e.get("text", "")
	if kind == "death":
		return "death"
	if kind == "birth":
		return "birth"
	for rule in SCENE_RULES:
		for kw in rule[1]:
			if text.contains(kw):
				return rule[0]
	if kind == "news":
		return "news"
	if kind == "good":
		return "celebrate"
	if kind == "bad":
		return "rain"
	return "friends"

static func score(e: Dictionary) -> int:
	var s: int = 0
	var kind: String = e.get("kind", "info")
	if e.get("fav", false):
		s += 12
	match kind:
		"birth", "death":
			s += 100
		"choice":
			s += 5
		"bad", "good":
			s += 4
		"work", "school", "life":
			s += 3
		"news":
			s += 1
	var text: String = e.get("text", "")
	for m in MILESTONES:
		if text.contains(m):
			s += 4
			break
	return s

## 선택한 결과를 "선택 / 결과" 두 부분으로 나눠요.
static func split_text(text: String) -> Dictionary:
	if text.begins_with("[선택] "):
		var body: String = text.substr(5)
		var parts: PackedStringArray = body.split(" → ", true, 1)
		if parts.size() == 2:
			return {"choice": parts[0], "result": parts[1]}
		return {"choice": parts[0], "result": ""}
	return {"choice": "", "result": text}

static func pick(log: Array, max_n: int = 14) -> Array:
	var cands: Array = []
	for i in log.size():
		var e: Dictionary = log[i]
		var sc: String = classify(e)
		# 이어서 나온 [선택] 줄과 같은 사건이면 선택 줄만 남겨요
		cands.append({"i": i, "e": e, "scene": sc, "score": score(e)})
	var forced: Array = []
	var rest: Array = []
	for c in cands:
		if c.scene == "birth" or c.scene == "death":
			forced.append(c)
		else:
			rest.append(c)
	rest.sort_custom(func(a, b): return a.score > b.score or (a.score == b.score and a.i < b.i))
	var chosen: Array = forced.duplicate()
	var per_scene: Dictionary = {}
	var years_used: Dictionary = {}
	for c in rest:
		if chosen.size() >= max_n:
			break
		if c.score < 4:
			continue
		var n: int = per_scene.get(c.scene, 0)
		if n >= 2:
			continue
		var yr: int = c.e.get("year", 0)
		if years_used.get(yr, 0) >= 1:
			continue
		per_scene[c.scene] = n + 1
		years_used[yr] = 1
		chosen.append(c)
	chosen.sort_custom(func(a, b): return a.i < b.i)
	var out: Array = []
	for c in chosen:
		var parts: Dictionary = split_text(c.e.get("text", ""))
		out.append({
			"age": c.e.get("age", 0), "year": c.e.get("year", 0), "kind": c.e.get("kind", "info"),
			"scene": c.scene, "title": SCENE_TITLES.get(c.scene, "순간"),
			"choice": parts.choice, "result": parts.result, "fav": c.e.get("fav", false),
			"mood": _mood(c.e.get("kind", "info"), c.scene),
		})
	return out

static func _mood(kind: String, scene: String) -> String:
	if kind == "bad" or scene in ["war", "disaster", "crisis", "loss", "accident", "virus", "death"]:
		return "bad"
	if kind == "good" or scene in ["celebrate", "wedding", "family", "graduation", "birth"]:
		return "good"
	return ""

## 인생 요약 문장들
static func summary_lines(meta: Dictionary, picks: Array) -> Array:
	var lines: Array = []
	var sex: String = "남자" if meta.get("sex", "M") == "M" else "여자"
	var where: String = meta.get("region", "")
	if meta.get("rural", false):
		where += " 농어촌"
	lines.append("%d년 %s에서 %s로 태어나 %d세까지 살았어요." % [meta.get("birthYear", 0), where, sex, meta.get("age", 0)])
	lines.append("%s · 최종 학력 %s" % [meta.get("tierName", ""), meta.get("edu", "")])
	var fam: String = {"married": "결혼해 가정을 이뤘어요", "divorced": "이혼을 겪었어요", "widowed": "배우자와 사별했어요", "none": "혼자 지냈어요", "dating": "연애 중이었어요"}.get(meta.get("partner", "none"), "")
	var kids: int = meta.get("kids", 0)
	lines.append("%s%s." % [fam, " · 자녀 %d명" % kids if kids > 0 else ""])
	lines.append("집 %s · 마지막 순자산 약 %s만원(2025년 가치)" % ["보유" if meta.get("house", false) else "없음", _commas(int(meta.get("netWorth", 0)))])
	lines.append("%s(으)로 세상을 떠났어요." % meta.get("cause", "알 수 없는 이유"))
	return lines

static func _commas(n: int) -> String:
	var s: String = str(absi(n))
	var out: String = ""
	var c: int = 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		c += 1
		if c % 3 == 0 and i > 0:
			out = "," + out
	return ("-" if n < 0 else "") + out
