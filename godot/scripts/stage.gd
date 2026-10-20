class_name Stage
extends Control
## 이벤트 장면을 코드로 그려서 보여 주는 무대. 모든 그림은 1280x720 가상 화면 기준이에요.

const W: float = 1280.0
const H: float = 720.0

var scene: String = "news"
var t: float = 0.0
var year: int = 2000
var mood: String = ""
var _sc: float = 1.0
var _off: Vector2 = Vector2.ZERO


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	_sc = minf(size.x / W, size.y / H)
	_off = (size - Vector2(W, H) * _sc) * 0.5
	draw_set_transform(_off, 0.0, Vector2(_sc, _sc))
	var fn: String = "_s_" + scene
	if has_method(fn):
		call(fn)
	else:
		_s_news()
	_era_tint()
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var bar: Color = Color("0b0f1a")
	draw_rect(Rect2(0, 0, _off.x, size.y), bar)
	draw_rect(Rect2(size.x - _off.x, 0, _off.x + 1.0, size.y), bar)
	draw_rect(Rect2(0, 0, size.x, _off.y), bar)
	draw_rect(Rect2(0, size.y - _off.y, size.x, _off.y + 1.0), bar)


# ───────── 그리기 도우미 ─────────
func _rnd(i: float) -> float:
	return fposmod(sin(i * 12.9898) * 43758.5453, 1.0)

func _grad(top: Color, bot: Color) -> void:
	draw_polygon(PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]), PackedColorArray([top, top, bot, bot]))

func _r(x: float, y: float, w: float, h: float, c: Color) -> void:
	draw_rect(Rect2(x, y, w, h), c)

func _c(x: float, y: float, r: float, c: Color) -> void:
	draw_circle(Vector2(x, y), r, c)

func _l(a: Vector2, b: Vector2, c: Color, w: float = 3.0) -> void:
	draw_line(a, b, c, w, true)

func _poly(pts: Array, c: Color) -> void:
	draw_colored_polygon(PackedVector2Array(pts), c)

func _ring(x: float, y: float, r: float, c: Color, w: float = 3.0) -> void:
	draw_arc(Vector2(x, y), r, 0.0, TAU, 40, c, w, true)

func _heart(x: float, y: float, s: float, c: Color) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in 32:
		var a: float = TAU * float(i) / 32.0
		var px: float = 16.0 * pow(sin(a), 3.0)
		var py: float = -(13.0 * cos(a) - 5.0 * cos(2.0 * a) - 2.0 * cos(3.0 * a) - cos(4.0 * a))
		pts.append(Vector2(x + px * s, y + py * s))
	draw_colored_polygon(pts, c)

func _star(x: float, y: float, r: float, c: Color) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in 10:
		var rr: float = r if i % 2 == 0 else r * 0.45
		var a: float = -PI / 2.0 + TAU * float(i) / 10.0
		pts.append(Vector2(x + cos(a) * rr, y + sin(a) * rr))
	draw_colored_polygon(pts, c)

func _person(x: float, y: float, h: float, col: Color, ph: float = 0.0, arms_up: bool = false) -> void:
	var hip: Vector2 = Vector2(x, y - h * 0.42)
	var sh: Vector2 = Vector2(x, y - h * 0.74)
	var sw: float = sin(ph) * h * 0.12
	_l(hip, Vector2(x - h * 0.1 + sw, y), col, h * 0.08)
	_l(hip, Vector2(x + h * 0.1 - sw, y), col, h * 0.08)
	_l(hip, sh, col, h * 0.15)
	if arms_up:
		_l(sh, Vector2(x - h * 0.22, y - h * 1.0 + sin(ph * 2.0) * h * 0.05), col, h * 0.06)
		_l(sh, Vector2(x + h * 0.22, y - h * 1.0 - sin(ph * 2.0) * h * 0.05), col, h * 0.06)
	else:
		_l(sh, Vector2(x - h * 0.2, y - h * 0.46 - sw), col, h * 0.06)
		_l(sh, Vector2(x + h * 0.2, y - h * 0.46 + sw), col, h * 0.06)
	_c(x, y - h * 0.88, h * 0.13, col)

func _building(x: float, y: float, w: float, h: float, col: Color, win: Color, seed_i: float = 0.0, blink: bool = true) -> void:
	_r(x, y, w, h, col)
	var cols: int = maxi(2, int(w / 30.0))
	var rows: int = maxi(2, int(h / 40.0))
	for i in cols:
		for j in rows:
			var on: bool = _rnd(seed_i + float(i) * 7.0 + float(j) * 13.0) > 0.35
			if blink and on and _rnd(float(i * 31 + j * 17) + floor(t * 0.8)) > 0.97:
				on = false
			if on:
				_r(x + 10.0 + float(i) * (w - 20.0) / float(cols), y + 12.0 + float(j) * (h - 24.0) / float(rows), 14.0, 18.0, win)

func _cloud(x: float, y: float, s: float, c: Color) -> void:
	_c(x, y, 30.0 * s, c)
	_c(x + 34.0 * s, y + 6.0 * s, 24.0 * s, c)
	_c(x - 32.0 * s, y + 8.0 * s, 22.0 * s, c)
	_r(x - 32.0 * s, y + 8.0 * s, 66.0 * s, 22.0 * s, c)

func _sun(x: float, y: float, r: float, c: Color) -> void:
	for i in 12:
		var a: float = TAU * float(i) / 12.0 + t * 0.2
		_l(Vector2(x + cos(a) * (r + 12.0), y + sin(a) * (r + 12.0)), Vector2(x + cos(a) * (r + 30.0), y + sin(a) * (r + 30.0)), Color(c, 0.6), 4.0)
	_c(x, y, r, c)

func _house(x: float, y: float, w: float, h: float, wall: Color, roof: Color) -> void:
	_r(x, y, w, h, wall)
	_poly([Vector2(x - 20.0, y), Vector2(x + w * 0.5, y - h * 0.55), Vector2(x + w + 20.0, y)], roof)
	_r(x + w * 0.42, y + h * 0.4, w * 0.16, h * 0.6, Color("5a3a2a"))
	_r(x + w * 0.1, y + h * 0.25, w * 0.2, h * 0.25, Color("ffe9a8"))
	_r(x + w * 0.7, y + h * 0.25, w * 0.2, h * 0.25, Color("ffe9a8"))

func _stars(n: int, ymax: float) -> void:
	for i in n:
		var a: float = 0.35 + 0.65 * absf(sin(t * 1.4 + float(i)))
		_c(_rnd(float(i)) * W, _rnd(float(i) + 50.0) * ymax, 1.5 + _rnd(float(i) + 9.0) * 1.5, Color(1, 1, 0.92, a))

func _flame(x: float, y: float, s: float) -> void:
	var fl: float = 1.0 + 0.15 * sin(t * 9.0 + x)
	_c(x, y - 10.0 * s, 26.0 * s, Color(1.0, 0.8, 0.3, 0.16))
	_poly([Vector2(x - 5.0 * s, y), Vector2(x, y - 22.0 * s * fl), Vector2(x + 5.0 * s, y)], Color("ffb347"))
	_c(x, y - 4.0 * s, 4.0 * s, Color("fff1b8"))

func _era_tint() -> void:
	if year < 1975:
		draw_rect(Rect2(0, 0, W, H), Color(0.55, 0.40, 0.22, 0.24))
		for i in 8:
			var a: float = 0.05 * float(8 - i)
			draw_rect(Rect2(float(i) * 6.0, float(i) * 6.0, W - float(i) * 12.0, H - float(i) * 12.0), Color(0, 0, 0, a), false, 6.0)
	elif year < 2000:
		draw_rect(Rect2(0, 0, W, H), Color(0.95, 0.72, 0.4, 0.07))


# ───────── 장면들 ─────────
func _s_birth() -> void:
	_grad(Color("1b1f3a"), Color("3a2c4a"))
	_r(80, 70, 260, 330, Color("0f1328"))
	_c(210, 190, 66, Color("f6efc8"))
	_c(236, 176, 58, Color("0f1328"))
	for i in 12:
		_c(100.0 + _rnd(float(i)) * 220.0, 90.0 + _rnd(float(i) + 40.0) * 290.0, 2.4, Color(1, 1, 1, 0.4 + 0.6 * absf(sin(t * 1.6 + float(i)))))
	_r(0, 560, W, 160, Color("2a2238"))
	_r(520, 430, 560, 30, Color("8a6a4a"))
	_r(540, 400, 520, 40, Color("efe3d6"))
	_r(540, 360, 120, 44, Color("f7f0e8"))
	_poly([Vector2(780, 400), Vector2(900, 330), Vector2(1030, 400)], Color("f2a6b5"))
	_c(840, 372, 40, Color("f1c9a8"))
	_c(826, 366, 3, Color("3a2a2a"))
	_c(854, 366, 3, Color("3a2a2a"))
	_c(420, 330, 48, Color("c9a99a"))
	_poly([Vector2(370, 560), Vector2(420, 380), Vector2(520, 560)], Color("4a5a8a"))
	var pulse: float = 1.0 + 0.18 * sin(t * 4.0)
	_heart(840, 250, 2.4 * pulse, Color(1.0, 0.45, 0.55, 0.9))

func _s_school() -> void:
	_grad(Color("8ec9f0"), Color("e9f5ff"))
	_sun(1090, 130, 44, Color("ffd45a"))
	_cloud(300.0 + sin(t * 0.3) * 40.0, 130, 1.3, Color(1, 1, 1, 0.95))
	_r(0, 560, W, 160, Color("9ac06a"))
	_r(260, 280, 640, 280, Color("d9b58a"))
	_r(520, 190, 120, 90, Color("c99d6e"))
	_poly([Vector2(500, 190), Vector2(580, 140), Vector2(660, 190)], Color("b3563c"))
	_ring(580, 235, 26, Color("fff8e8"), 5.0)
	_l(Vector2(580, 235), Vector2(580 + sin(t * 2.0) * 14.0, 215), Color("3a2a2a"), 4.0)
	for i in 6:
		_r(290.0 + float(i) * 100.0, 340, 60, 70, Color("fff0c2"))
		_r(290.0 + float(i) * 100.0, 440, 60, 70, Color("fff0c2"))
	_r(550, 470, 60, 90, Color("6a4a3a"))
	_r(980, 250, 6, 310, Color("777777"))
	_poly([Vector2(986, 254), Vector2(1060.0 + sin(t * 3.0) * 6.0, 280), Vector2(986, 310)], Color("e24a4a"))
	for i in 5:
		_person(160.0 + float(i) * 70.0 + sin(t + float(i)) * 12.0, 640.0 + float(i % 2) * 24.0, 90, [Color("2f4b7c"), Color("c0483e"), Color("3a7d44"), Color("8a5a9c"), Color("d08a2e")][i], t * 5.0 + float(i), false)

func _s_graduation() -> void:
	_s_school()
	for i in 9:
		var ph: float = fposmod(t * 0.5 + _rnd(float(i)), 1.0)
		var cx: float = 300.0 + _rnd(float(i) + 3.0) * 680.0
		var cy: float = 480.0 - sin(ph * PI) * 360.0
		var a: float = ph * TAU * 2.0
		var p: Vector2 = Vector2(cx, cy)
		_poly([p + Vector2(-26, 0).rotated(a), p + Vector2(0, -9).rotated(a), p + Vector2(26, 0).rotated(a), p + Vector2(0, 9).rotated(a)], Color("1f1f2a"))
		_c(cx, cy + 12.0, 8, Color("1f1f2a"))

func _s_factory() -> void:
	_grad(Color("5b6470"), Color("a9a398"))
	for i in 3:
		_r(780.0 + float(i) * 150.0, 160, 70, 330, Color("4a4036"))
		for j in 7:
			var ph: float = fposmod(t * 0.35 + float(j) * 0.15 + float(i) * 0.3, 1.0)
			_c(815.0 + float(i) * 150.0 + sin(ph * 6.0 + float(i)) * 22.0, 150.0 - ph * 170.0, 26.0 + ph * 34.0, Color(0.9, 0.9, 0.9, 0.55 * (1.0 - ph)))
	_r(0, 490, W, 230, Color("3b3631"))
	_r(0, 540, W, 18, Color("232220"))
	for i in 8:
		var bx: float = fposmod(float(i) * 190.0 + t * 90.0, 1500.0) - 100.0
		_r(bx, 500, 70, 40, Color("c99a52"))
	_r(120, 300, 520, 190, Color("6a6258"))
	for i in 3:
		_r(150.0 + float(i) * 160.0, 330, 120, 90, Color("ffd57a") if (int(t * 2.0) + i) % 2 == 0 else Color("8a7a52"))
	_gear(360, 240, 70, t * 0.8, Color("2d2a27"))
	_gear(470, 200, 44, -t * 1.25, Color("3a3632"))
	_person(900, 620, 150, Color("1d1a17"), t * 3.0)
	_r(870, 450, 60, 8, Color("e2b43a"))

func _gear(x: float, y: float, r: float, a: float, c: Color) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in 24:
		var rr: float = r if (i / 2) % 2 == 0 else r * 0.78
		var ang: float = a + TAU * float(i) / 24.0
		pts.append(Vector2(x + cos(ang) * rr, y + sin(ang) * rr))
	draw_colored_polygon(pts, c)
	_c(x, y, r * 0.3, Color("a9a398"))

func _s_office() -> void:
	_grad(Color("2a3b66"), Color("a7b6d8"))
	for i in 8:
		_building(float(i) * 170.0 - 20.0, 120.0 + _rnd(float(i)) * 160.0, 150, 700, Color("1e2744"), Color("ffe08a"), float(i) * 9.0)
	_r(0, 560, W, 160, Color("3a2f2a"))
	_r(300, 470, 680, 24, Color("8a6a4a"))
	_r(330, 494, 20, 90, Color("6a4a3a"))
	_r(930, 494, 20, 90, Color("6a4a3a"))
	_r(540, 360, 200, 110, Color("11151f"))
	_r(550, 370, 180, 90, Color("7fc0ff"))
	for i in 5:
		var v: float = 20.0 + 14.0 * float(i) + _rnd(float(i)) * 12.0 * sin(t * 2.0)
		_r(570.0 + float(i) * 30.0, 450.0 - v, 18, v, Color("ffffff"))
	_person(480, 560, 190, Color("14182b"), 0.0)
	var ay: float = 220.0 - fposmod(t * 40.0, 80.0)
	_poly([Vector2(1050, ay + 60), Vector2(1090, ay), Vector2(1130, ay + 60), Vector2(1100, ay + 60), Vector2(1100, ay + 140), Vector2(1080, ay + 140), Vector2(1080, ay + 60)], Color(0.4, 0.9, 0.5, 0.8))

func _s_farm() -> void:
	_grad(Color("f3c26b"), Color("fbe7b0"))
	_sun(300, 220, 70, Color("fff3c2"))
	_poly([Vector2(0, 420), Vector2(250, 300), Vector2(480, 420)], Color("8aa56a"))
	_poly([Vector2(380, 420), Vector2(700, 250), Vector2(1000, 420)], Color("7a9a5a"))
	_poly([Vector2(800, 420), Vector2(1100, 310), Vector2(1300, 420)], Color("8aa56a"))
	_r(0, 410, W, 310, Color("d9b04a"))
	for row in 5:
		for i in 40:
			var x: float = float(i) * 34.0 + float(row) * 11.0
			var y: float = 450.0 + float(row) * 56.0
			var sw: float = sin(t * 2.0 + float(i) * 0.4 + float(row)) * 6.0
			_l(Vector2(x, y), Vector2(x + sw, y - 40.0), Color("b5892a"), 3.0)
			_c(x + sw, y - 42.0, 4.0, Color("f0c24a"))
	_person(900, 640, 170, Color("2c2418"), t * 2.0)
	_poly([Vector2(850, 535), Vector2(900, 510), Vector2(950, 535)], Color("e6c27a"))

func _s_city() -> void:
	_grad(Color("0d1230"), Color("5a4a7a"))
	_stars(40, 300)
	for i in 9:
		_building(float(i) * 150.0 - 10.0, 260.0 + _rnd(float(i) + 4.0) * 180.0, 130, 600, Color("141a38"), Color("ffd57a"), float(i) * 5.0)
	_r(0, 560, W, 160, Color("1b1b24"))
	_r(0, 590, W, 8, Color("55556a"))
	var tx: float = fposmod(t * 220.0, 1700.0) - 300.0
	for i in 4:
		_r(tx + float(i) * 130.0, 520, 120, 60, Color("c9d3e6"))
		_r(tx + float(i) * 130.0 + 14.0, 534, 92, 22, Color("2a3b66"))
	_r(tx - 90.0, 530, 90, 50, Color("e84a4a"))
	_person(250, 700, 130, Color("e9e1d0"), t * 4.0)
	_r(236, 640, 28, 24, Color("c27a3a"))

func _s_war() -> void:
	_grad(Color("3a1a14"), Color("b8582c"))
	_stars(0, 10)
	_cloud(300, 140, 2.2, Color(0.2, 0.12, 0.1, 0.9))
	_cloud(820, 100, 2.6, Color(0.25, 0.14, 0.1, 0.9))
	_r(0, 590, W, 130, Color("1c120e"))
	for i in 4:
		var x: float = 80.0 + float(i) * 280.0
		_poly([Vector2(x, 590), Vector2(x, 420.0 + _rnd(float(i)) * 60.0), Vector2(x + 60.0, 450.0), Vector2(x + 120.0, 400.0), Vector2(x + 140.0, 590)], Color("2a1a14"))
	for i in 3:
		var ph: float = fposmod(t * 0.7 + float(i) * 0.33, 1.0)
		var ex: float = 200.0 + _rnd(float(i) + floor(t * 0.7 + float(i) * 0.33)) * 880.0
		_c(ex, 500, 20.0 + ph * 120.0, Color(1.0, 0.7, 0.25, 0.6 * (1.0 - ph)))
		_c(ex, 500, 8.0 + ph * 50.0, Color(1.0, 0.95, 0.7, 0.9 * (1.0 - ph)))
	for i in 6:
		var x2: float = fposmod(float(i) * 120.0 + t * 26.0, 1300.0) - 40.0
		_person(x2, 640, 110 - float(i % 3) * 14.0, Color("0d0806"), t * 3.0 + float(i))
		_r(x2 - 22.0, 560.0, 36, 28, Color("0d0806"))

func _s_military() -> void:
	_grad(Color("9ac5e8"), Color("e7f1da"))
	_cloud(260.0 + sin(t * 0.3) * 30.0, 120, 1.2, Color(1, 1, 1, 0.9))
	_poly([Vector2(0, 470), Vector2(300, 320), Vector2(640, 470)], Color("5f7d48"))
	_poly([Vector2(500, 470), Vector2(900, 290), Vector2(1280, 470)], Color("4f6b3a"))
	_r(0, 460, W, 260, Color("6f8f4a"))
	_r(900, 150, 8, 330, Color("555555"))
	var pts: Array = [Vector2(908, 156)]
	for i in 7:
		pts.append(Vector2(908.0 + float(i) * 18.0, 156.0 + sin(t * 4.0 + float(i) * 0.7) * 6.0))
	for i in range(6, -1, -1):
		pts.append(Vector2(908.0 + float(i) * 18.0, 220.0 + sin(t * 4.0 + float(i) * 0.7) * 6.0))
	_poly(pts, Color("2a4a9c"))
	for i in 5:
		var x: float = 180.0 + float(i) * 130.0
		_person(x, 640, 140, Color("2f3b22"), t * 4.0 + float(i) * 0.2)
		_poly([Vector2(x - 20.0, 640.0 - 126.0), Vector2(x, 640.0 - 150.0), Vector2(x + 20.0, 640.0 - 126.0)], Color("3f4b2a"))
	_poly([Vector2(960, 560), Vector2(1100, 470), Vector2(1240, 560)], Color("8a7a52"))

func _s_protest() -> void:
	_grad(Color("0a0d1f"), Color("2a2a4a"))
	_stars(30, 220)
	for i in 6:
		_building(float(i) * 220.0, 200.0 + _rnd(float(i)) * 120.0, 190, 600, Color("141830"), Color("ffe08a"), float(i) * 3.0, false)
	_r(0, 580, W, 140, Color("17172a"))
	for row in 3:
		for i in 14:
			var x: float = 40.0 + float(i) * 92.0 + float(row) * 30.0
			var y: float = 700.0 - float(row) * 34.0
			var up: bool = _rnd(float(i + row * 20)) > 0.45
			_person(x, y, 120 - float(row) * 14.0, Color("05060d"), t * 3.0 + float(i), up)
			if _rnd(float(i + row * 11)) > 0.55:
				var fx: float = x - 24.0
				var fy: float = y - (120.0 - float(row) * 14.0) * (0.95 if up else 0.5)
				_flame(fx, fy, 1.1)
	for i in 4:
		var bx: float = 160.0 + float(i) * 300.0
		_l(Vector2(bx, 440), Vector2(bx, 520), Color("2a1a14"), 5.0)
		_r(bx - 60.0, 380, 120, 70, Color("e8dcc0"))
		_r(bx - 44.0, 396, 88, 8, Color("c0392b"))
		_r(bx - 44.0, 414, 64, 8, Color("c0392b"))

func _s_crisis() -> void:
	_grad(Color("2a2f3f"), Color("6a6f80"))
	for i in 4:
		_building(80.0 + float(i) * 300.0, 300, 220, 420, Color("1a1e2a"), Color("8a8a8a"), float(i) * 4.0, false)
	_r(0, 600, W, 120, Color("14161e"))
	var pts: Array = []
	for i in 16:
		var x: float = 260.0 + float(i) * 48.0
		var y: float = 160.0 + float(i) * 18.0 + sin(float(i) * 1.3) * 20.0
		pts.append(Vector2(x, y))
	for i in pts.size() - 1:
		_l(pts[i], pts[i + 1], Color("e84a4a"), 6.0)
	_poly([Vector2(1010, 420), Vector2(970, 395), Vector2(990, 380), Vector2(1030, 410)], Color("e84a4a"))
	for i in 6:
		var ph: float = fposmod(t * 0.6 + float(i) * 0.17, 1.0)
		_c(300.0 + float(i) * 150.0, 100.0 + ph * 500.0, 18.0, Color("f0c24a"))
		_ring(300.0 + float(i) * 150.0, 100.0 + ph * 500.0, 18.0, Color("a07a1a"), 3.0)
	_person(640, 690, 200, Color("0a0c12"), 0.0)
	_r(600, 520, 90, 70, Color("8a6a4a"))
	_r(612, 532, 66, 10, Color("d9c9a8"))

func _s_abroad() -> void:
	_grad(Color("0a1030"), Color("2a4a8a"))
	_stars(60, 560)
	_c(640, 430, 230, Color("2a6fc0"))
	for i in 4:
		var gx: float = 640.0 + cos(t * 0.4 + float(i) * 1.6) * 150.0
		var gy: float = 430.0 + sin(float(i) * 2.3) * 110.0
		_c(gx, gy, 52.0 + 10.0 * float(i % 2), Color("4aa055"))
	_ring(640, 430, 230, Color(1, 1, 1, 0.25), 3.0)
	var a: float = fposmod(t * 0.25, 1.0)
	var px: float = lerpf(180.0, 1100.0, a)
	var py: float = 300.0 - sin(a * PI) * 190.0
	for i in 16:
		var b: float = a - float(i) * 0.012
		if b > 0.0:
			_c(lerpf(180.0, 1100.0, b), 300.0 - sin(b * PI) * 190.0, 3.0, Color(1, 1, 1, 0.5))
	_poly([Vector2(px - 36.0, py), Vector2(px + 40.0, py - 6.0), Vector2(px + 50.0, py), Vector2(px + 40.0, py + 6.0)], Color("f4f4f4"))
	_poly([Vector2(px - 6.0, py), Vector2(px - 26.0, py - 30.0), Vector2(px + 2.0, py - 2.0)], Color("dcdcdc"))
	_poly([Vector2(px - 6.0, py), Vector2(px - 26.0, py + 30.0), Vector2(px + 2.0, py + 2.0)], Color("dcdcdc"))

func _s_wedding() -> void:
	_grad(Color("ffd9e4"), Color("fff6ea"))
	_r(0, 590, W, 130, Color("c8e0b0"))
	_ring(640, 430, 250, Color("e8a0b8"), 18.0)
	_ring(640, 430, 214, Color("fff"), 8.0)
	for i in 14:
		var a: float = PI + float(i) * PI / 13.0
		_c(640.0 + cos(a) * 250.0, 430.0 + sin(a) * 250.0, 18.0, [Color("f08aa8"), Color("fbd36a"), Color("fff")][i % 3])
	_person(580, 620, 220, Color("1a1d2b"), 0.0)
	_poly([Vector2(690, 410), Vector2(650, 620), Vector2(760, 620)], Color("fffaf5"))
	_l(Vector2(690, 410), Vector2(690, 380), Color("fffaf5"), 20.0)
	_c(690, 372, 28, Color("c9a99a"))
	_heart(640, 230, 2.2 + 0.2 * sin(t * 4.0), Color("e85a82"))
	for i in 24:
		var ph: float = fposmod(t * 0.3 + _rnd(float(i)), 1.0)
		_c(_rnd(float(i) + 2.0) * W + sin(t + float(i)) * 20.0, ph * 700.0, 6.0, Color(1.0, 0.7, 0.8, 0.8))

func _s_family() -> void:
	_grad(Color("ffd79a"), Color("fff0cf"))
	_sun(1050, 150, 54, Color("ffb84a"))
	_r(0, 580, W, 140, Color("a6cf7a"))
	_house(160, 340, 360, 240, Color("f2dcb8"), Color("c5533a"))
	_person(760, 640, 230, Color("3a2f4a"), 0.0)
	_person(900, 640, 140, Color("c0483e"), 0.0)
	_l(Vector2(780, 520), Vector2(880, 540), Color("3a2f4a"), 10.0)
	_heart(830, 330.0 - 10.0 * sin(t * 3.0), 2.0, Color("e85a82"))
	for i in 3:
		_heart(1000.0 + float(i) * 40.0, 300.0 - fposmod(t * 40.0 + float(i) * 30.0, 120.0), 0.9, Color(1.0, 0.5, 0.6, 0.7))

func _s_house() -> void:
	var bad: bool = mood == "bad"
	_grad(Color("a8d4f5") if not bad else Color("6a7a8f"), Color("eaf5ff") if not bad else Color("b9c0cc"))
	_r(0, 590, W, 130, Color("94c06a") if not bad else Color("6e7f5e"))
	_house(150, 330, 420, 260, Color("f4e4c4"), Color("b3503a"))
	var pts: Array = []
	for i in 12:
		var x: float = 700.0 + float(i) * 46.0
		var y: float = (520.0 - float(i) * 24.0) if not bad else (300.0 + float(i) * 18.0)
		pts.append(Vector2(x, y + sin(float(i) * 1.7) * 14.0))
	for i in pts.size() - 1:
		_l(pts[i], pts[i + 1], Color("3aa05a") if not bad else Color("e84a4a"), 7.0)
	_l(Vector2(690, 560), Vector2(1240, 560), Color(0, 0, 0, 0.35), 3.0)
	_l(Vector2(690, 560), Vector2(690, 240), Color(0, 0, 0, 0.35), 3.0)
	var ky: float = 250.0 + sin(t * 2.0) * 10.0
	_ring(300, ky - 110.0, 22, Color("f0c24a"), 8.0)
	_r(296, ky - 90.0, 8, 60, Color("f0c24a"))
	_r(296, ky - 50.0, 24, 8, Color("f0c24a"))
	_r(296, ky - 36.0, 18, 8, Color("f0c24a"))

func _s_hospital() -> void:
	_grad(Color("dbe9f0"), Color("f4f8fa"))
	_r(0, 560, W, 160, Color("bfcdd6"))
	_r(120, 400, 540, 28, Color("8a98a5"))
	_r(120, 428, 14, 130, Color("8a98a5"))
	_r(646, 428, 14, 130, Color("8a98a5"))
	_r(140, 360, 500, 50, Color("ffffff"))
	_c(240, 360, 40, Color("e8c9b0"))
	_poly([Vector2(280, 350), Vector2(640, 350), Vector2(640, 410), Vector2(280, 410)], Color("a9c6e0"))
	_l(Vector2(760, 180), Vector2(760, 560), Color("8a98a5"), 6.0)
	_r(730, 190, 60, 90, Color("d0e8ff"))
	var d: float = fposmod(t * 0.9, 1.0)
	_c(760, 290.0 + d * 150.0, 5.0, Color("7fc0ff"))
	_r(900, 250, 270, 170, Color("0e1a22"))
	var pts: Array = []
	for i in 40:
		var x: float = float(i) / 39.0
		var phx: float = fposmod(x * 3.0 - t * 1.2, 1.0)
		var y: float = 0.0
		if phx > 0.42 and phx < 0.5:
			y = -50.0
		elif phx > 0.5 and phx < 0.56:
			y = 36.0
		pts.append(Vector2(912.0 + x * 246.0, 335.0 + y))
	for i in pts.size() - 1:
		_l(pts[i], pts[i + 1], Color("4af08a"), 3.0)
	_r(1000, 90, 60, 60, Color("e84a4a"))
	_r(1012, 100, 36, 12, Color("fff"))
	_r(1024, 88, 12, 36, Color("fff"))

func _s_accident() -> void:
	_grad(Color("0a0d1a"), Color("2a2f42"))
	_stars(30, 260)
	_r(0, 480, W, 240, Color("2a2a30"))
	for i in 12:
		_r(float(i) * 120.0 + 20.0, 590, 60, 8, Color("ddd"))
	_r(0, 480, W, 6, Color("777"))
	_r(420, 520, 330, 70, Color("c0392b"))
	_poly([Vector2(480, 520), Vector2(530, 470), Vector2(690, 470), Vector2(730, 520)], Color("a02a20"))
	_c(480, 595, 32, Color("111"))
	_c(690, 595, 32, Color("111"))
	var on: bool = int(t * 4.0) % 2 == 0
	_c(560, 460, 36, Color(1, 0.2, 0.2, 0.5 if on else 0.1))
	_c(660, 460, 36, Color(0.3, 0.5, 1, 0.1 if on else 0.5))
	_poly([Vector2(900, 570), Vector2(960, 570), Vector2(930, 500)], Color("e8b030"))
	_poly([Vector2(912, 566), Vector2(948, 566), Vector2(930, 520)], Color("111"))
	_person(1080, 640, 140, Color("d9d9e6"), 0.0, true)

func _s_retire() -> void:
	_grad(Color("ff9a5a"), Color("ffd9a0"))
	_c(640, 440, 130, Color("fff0c0"))
	_r(0, 520, W, 200, Color("5a4a3a"))
	_r(0, 520, W, 14, Color("ffb060"))
	_r(340, 540, 360, 18, Color("6a4a30"))
	_r(360, 560, 14, 80, Color("4a3220"))
	_r(670, 560, 14, 80, Color("4a3220"))
	_r(340, 470, 360, 14, Color("6a4a30"))
	_person(500, 548, 150, Color("231810"), 0.0)
	_c(500, 548.0 - 150.0 * 0.88, 20.0, Color("231810"))
	_c(500, 548.0 - 150.0 * 0.95, 14.0, Color("d9d9d9"))
	_l(Vector2(560, 470), Vector2(570, 556), Color("231810"), 4.0)
	_r(1000, 280, 14, 250, Color("3a2a1c"))
	_c(1007, 250, 90, Color("8a4a2a"))
	for i in 10:
		var ph: float = fposmod(t * 0.2 + _rnd(float(i)), 1.0)
		_c(900.0 + _rnd(float(i) + 1.0) * 220.0 + sin(t + float(i)) * 20.0, 300.0 + ph * 260.0, 6.0, Color("d9702a"))
	for i in 3:
		var bx: float = fposmod(t * 40.0 + float(i) * 160.0, 1500.0) - 100.0
		_l(Vector2(bx, 150.0 + float(i) * 30.0), Vector2(bx + 12.0, 142.0 + float(i) * 30.0 + sin(t * 8.0) * 4.0), Color("3a2a1c"), 3.0)
		_l(Vector2(bx + 12.0, 142.0 + float(i) * 30.0 + sin(t * 8.0) * 4.0), Vector2(bx + 24.0, 150.0 + float(i) * 30.0), Color("3a2a1c"), 3.0)

func _s_celebrate() -> void:
	_grad(Color("0a0820"), Color("3a1a5a"))
	_stars(40, 300)
	_r(0, 560, W, 160, Color("17102a"))
	for i in 24:
		_c(30.0 + float(i) * 54.0, 600.0 + sin(t * 3.0 + float(i)) * 6.0, 26, Color("0a0716"))
		_c(30.0 + float(i) * 54.0, 626.0, 20, Color("120a22"))
	for k in 4:
		var ph: float = fposmod(t * 0.55 + float(k) * 0.25, 1.0)
		var seed_i: float = float(k) + floor(t * 0.55 + float(k) * 0.25) * 7.0
		var cx: float = 200.0 + _rnd(seed_i) * 880.0
		var cy: float = 120.0 + _rnd(seed_i + 3.0) * 220.0
		var col: Color = [Color("ffd45a"), Color("ff6a8a"), Color("6ad0ff"), Color("9aff8a")][k]
		var rr: float = ph * 150.0
		for j in 18:
			var a: float = TAU * float(j) / 18.0
			_c(cx + cos(a) * rr, cy + sin(a) * rr + ph * ph * 40.0, 4.0 * (1.0 - ph) + 1.0, Color(col, 1.0 - ph))
	for i in 40:
		var cp: float = fposmod(t * 0.35 + _rnd(float(i)), 1.0)
		_r(_rnd(float(i) + 5.0) * W, cp * 720.0, 8, 14, [Color("ff6a8a"), Color("ffd45a"), Color("6ad0ff")][i % 3])
	_star(640, 330, 70.0 + 6.0 * sin(t * 4.0), Color("ffd45a"))

func _s_loss() -> void:
	_grad(Color("2a3140"), Color("5a6475"))
	_r(0, 560, W, 160, Color("2a2f38"))
	_r(700, 480, 60, 14, Color("5a4a3a"))
	_r(706, 494, 8, 70, Color("4a3a2a"))
	_r(746, 494, 8, 70, Color("4a3a2a"))
	_r(700, 410, 12, 76, Color("5a4a3a"))
	_flame(1000, 560, 1.4)
	_r(988, 560, 24, 60, Color("e8e0d0"))
	_person(480, 640, 200, Color("0a0c12"), 0.0)
	_poly([Vector2(380, 450), Vector2(480, 380), Vector2(580, 450)], Color("1a2236"))
	_l(Vector2(480, 380), Vector2(480, 440), Color("0a0c12"), 3.0)
	for i in 90:
		var ph: float = fposmod(t * 1.8 + _rnd(float(i)), 1.0)
		var x: float = _rnd(float(i) + 11.0) * W
		_l(Vector2(x, ph * 760.0 - 40.0), Vector2(x - 10.0, ph * 760.0 + 12.0), Color(0.8, 0.88, 1.0, 0.45), 2.0)

func _s_rain() -> void:
	_s_loss()

func _s_friends() -> void:
	_grad(Color("a8dcf5"), Color("f0fadc"))
	_sun(1100, 130, 40, Color("ffd45a"))
	_cloud(300, 150, 1.1, Color(1, 1, 1, 0.9))
	_r(0, 560, W, 160, Color("8fc66a"))
	_r(420, 470, 420, 16, Color("7a5a3a"))
	_r(440, 486, 12, 80, Color("5a3a22"))
	_r(810, 486, 12, 80, Color("5a3a22"))
	_person(520, 470, 160, Color("2f4b7c"), 0.0)
	_person(720, 470, 160, Color("c0483e"), 0.0)
	var bob: float = sin(t * 3.0) * 6.0
	_c(520, 240.0 + bob, 58, Color(1, 1, 1, 0.95))
	_c(740, 240.0 - bob, 58, Color(1, 1, 1, 0.95))
	for i in 3:
		_c(500.0 + float(i) * 22.0, 240.0 + bob, 5, Color("444"))
		_c(720.0 + float(i) * 22.0, 240.0 - bob, 5, Color("444"))
	for i in 4:
		var ph: float = fposmod(t * 0.4 + float(i) * 0.25, 1.0)
		var nx: float = 930.0 + float(i) * 40.0
		var ny: float = 400.0 - ph * 240.0
		_c(nx, ny, 9, Color(0.3, 0.2, 0.6, 1.0 - ph))
		_l(Vector2(nx + 8.0, ny), Vector2(nx + 8.0, ny - 34.0), Color(0.3, 0.2, 0.6, 1.0 - ph), 3.0)
	_heart(630, 330.0 - 6.0 * sin(t * 3.0), 1.4, Color(1.0, 0.45, 0.55, 0.9))

func _s_disaster() -> void:
	_grad(Color("1a1620"), Color("5a4a50"))
	_r(0, 590, W, 130, Color("1a171c"))
	_poly([Vector2(300, 590), Vector2(300, 300), Vector2(560, 250), Vector2(560, 590)], Color("3a343c"))
	_poly([Vector2(560, 590), Vector2(560, 360), Vector2(800, 460), Vector2(860, 590)], Color("2e2a30"))
	_poly([Vector2(560, 250), Vector2(700, 300), Vector2(560, 360)], Color("4a444c"))
	for i in 16:
		var ph: float = fposmod(t * 0.3 + _rnd(float(i)), 1.0)
		_c(300.0 + _rnd(float(i) + 1.0) * 600.0, 560.0 - ph * 400.0, 26.0 + ph * 40.0, Color(0.7, 0.66, 0.62, 0.25 * (1.0 - ph)))
	for i in 3:
		var on: bool = int(t * 3.0 + float(i)) % 2 == 0
		_c(160.0 + float(i) * 480.0, 540, 18, Color(1, 0.2, 0.2) if on else Color(0.3, 0.5, 1))
		_c(160.0 + float(i) * 480.0, 540, 56, Color(1, 0.3, 0.3, 0.12))
	for i in 5:
		_flame(960.0 + float(i) * 52.0, 600, 1.3)

func _s_virus() -> void:
	_grad(Color("d9e4ee"), Color("f4f6f8"))
	_r(0, 580, W, 140, Color("b9c4cc"))
	_person(560, 640, 260, Color("2a3a55"), 0.0)
	_r(528, 640.0 - 260.0 * 0.88 + 2.0, 64, 30, Color("fff"))
	_poly([Vector2(530, 420), Vector2(590, 420), Vector2(586, 442), Vector2(534, 442)], Color("f5f9ff"))
	for i in 14:
		var a: float = t * 0.4 + float(i) * 0.9
		var x: float = 640.0 + cos(a) * (240.0 + _rnd(float(i)) * 320.0)
		var y: float = 330.0 + sin(a * 1.3) * (120.0 + _rnd(float(i) + 3.0) * 140.0)
		var r: float = 18.0 + _rnd(float(i) + 8.0) * 16.0
		for k in 10:
			var b: float = TAU * float(k) / 10.0 + t
			_l(Vector2(x, y) + Vector2(cos(b), sin(b)) * r, Vector2(x, y) + Vector2(cos(b), sin(b)) * (r + 9.0), Color("c0392b"), 3.0)
		_c(x, y, r, Color("e05a4a"))
	_r(1000, 130, 150, 100, Color("e8b030"))
	_r(1020, 150, 110, 12, Color("1a1a1a"))
	_r(1020, 176, 80, 12, Color("1a1a1a"))

func _s_news() -> void:
	_grad(Color("1a1f33"), Color("2a3050"))
	_r(0, 600, W, 120, Color("12141f"))
	_r(260, 110, 760, 470, Color("0b0c12"))
	_r(284, 134, 712, 420, Color("29406a"))
	_poly([Vector2(284, 134), Vector2(640, 134), Vector2(560, 554), Vector2(284, 554)], Color(1, 1, 1, 0.04))
	_person(640, 554, 300, Color("0e1220"), 0.0)
	for i in 22:
		_r(284, 134.0 + float(i) * 19.0, 712, 2, Color(0, 0, 0, 0.18))
	_r(284, 484, 712, 70, Color("c0392b"))
	_r(284, 484, 160, 70, Color("f4f4f4"))
	for i in 4:
		var bx: float = fposmod(1000.0 - t * 120.0 + float(i) * 230.0, 1100.0) + 200.0
		if bx > 460.0 and bx < 960.0:
			_r(bx, 510, 120, 10, Color("fff"))
	_r(580, 610, 120, 16, Color("333"))

func _s_death() -> void:
	_grad(Color("05070f"), Color("1a2036"))
	_stars(90, 420)
	_r(0, 600, W, 120, Color("0a0d18"))
	_c(640, 450, 160, Color(1.0, 0.85, 0.5, 0.06 + 0.02 * sin(t * 2.0)))
	_c(640, 450, 90, Color(1.0, 0.85, 0.5, 0.1))
	_r(626, 520, 28, 80, Color("e8e0d0"))
	_flame(640, 520, 2.0)
	for i in 18:
		var ph: float = fposmod(t * 0.12 + _rnd(float(i)), 1.0)
		_c(640.0 + sin(ph * 6.0 + float(i)) * (40.0 + 80.0 * ph), 500.0 - ph * 480.0, 3.0 * (1.0 - ph) + 1.0, Color(1.0, 0.9, 0.6, 1.0 - ph))
	_person(300.0 + fposmod(t * 18.0, 340.0), 640, 120, Color(0.05, 0.06, 0.1, 1.0), t * 2.0)
	_star(1050, 140, 14.0 + 2.0 * sin(t * 2.0), Color("fff6d0"))
