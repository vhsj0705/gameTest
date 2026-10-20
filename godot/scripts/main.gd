extends Control
## 인생 기록 재생기: 기록(JSON)에서 중요한 순간을 골라 장면 그래픽과 함께 재생해요.

const SAMPLE_PATH: String = "res://sample_life.json"
const SCENE_SECONDS: float = 7.5
const FONT_NAMES: Array = ["Malgun Gothic", "맑은 고딕", "Noto Sans KR", "Noto Sans CJK KR", "Apple SD Gothic Neo", "NanumGothic"]
const ACCENT: Color = Color("f2c879")

var record: Dictionary = {}
var picks: Array = []
var idx: int = -1
var t: float = 0.0
var playing: bool = true
var speed: float = 1.0
var finished: bool = false
var shots_dir: String = ""
var shot_taken: bool = false
var shot_n: int = 0
var snapping: bool = false
var max_picks: int = 14

var stage: Stage
var hud_age: Label
var hud_year: Label
var cap_title: Label
var cap_choice: Label
var cap_text: Label
var timeline: Timeline
var btn_play: Button
var summary: Control
var sum_label: RichTextLabel
var chart: HappyChart
var file_dialog: FileDialog
var fade: ColorRect


# ───────── 타임라인(아래쪽 막대) ─────────
class Timeline extends Control:
	var count: int = 0
	var current: int = 0
	var progress: float = 0.0
	var colors: Array = []
	signal seek(i: int)

	func _ready() -> void:
		custom_minimum_size = Vector2(0, 54)
		mouse_filter = Control.MOUSE_FILTER_STOP

	func _gui_input(ev: InputEvent) -> void:
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT and count > 0:
			var i: int = clampi(int(ev.position.x / size.x * float(count)), 0, count - 1)
			seek.emit(i)

	func _draw() -> void:
		if count <= 0:
			return
		var w: float = size.x / float(count)
		for i in count:
			var r: Rect2 = Rect2(float(i) * w + 3.0, 16.0, w - 6.0, 10.0)
			var c: Color = colors[i] if i < colors.size() else Color.GRAY
			draw_rect(r, Color(c, 0.28))
			if i < current:
				draw_rect(r, c)
			elif i == current:
				draw_rect(Rect2(r.position, Vector2(r.size.x * progress, r.size.y)), c)
				draw_circle(Vector2(r.position.x + r.size.x * progress, r.position.y + 5.0), 8.0, Color.WHITE)


# ───────── 행복·건강 곡선(요약 화면) ─────────
class HappyChart extends Control:
	var snaps: Array = []
	var marks: Array = []   # {age, color}

	func _ready() -> void:
		custom_minimum_size = Vector2(430, 260)

	func _draw() -> void:
		draw_rect(Rect2(Vector2.ZERO, size), Color(1, 1, 1, 0.05))
		if snaps.size() < 2:
			return
		var maxa: float = float(snaps[snaps.size() - 1].get("age", 1))
		for k in 5:
			var y: float = 12.0 + (size.y - 24.0) * float(k) / 4.0
			draw_line(Vector2(0, y), Vector2(size.x, y), Color(1, 1, 1, 0.08), 1.0)
		for series in [["happy", Color("f2c879")], ["health", Color("e8707d")]]:
			var pts: PackedVector2Array = PackedVector2Array()
			for s in snaps:
				var x: float = float(s.get("age", 0)) / maxa * (size.x - 8.0) + 4.0
				var y: float = size.y - 12.0 - float(s.get(series[0], 0)) / 100.0 * (size.y - 24.0)
				pts.append(Vector2(x, y))
			draw_polyline(pts, series[1], 2.5, true)
		for m in marks:
			var mx: float = float(m.age) / maxa * (size.x - 8.0) + 4.0
			draw_line(Vector2(mx, 8), Vector2(mx, size.y - 8.0), Color(m.color, 0.5), 2.0)
			draw_circle(Vector2(mx, 14.0), 5.0, m.color)


func _ready() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	var rec_path: String = SAMPLE_PATH
	for a in args:
		if a.begins_with("--record="):
			rec_path = a.substr(9)
		elif a.begins_with("--shots="):
			shots_dir = a.substr(8)
		elif a.begins_with("--max="):
			max_picks = int(a.substr(6))
		elif a.begins_with("--speed="):
			speed = float(a.substr(8))
	_build_theme()
	_build_ui()
	get_window().files_dropped.connect(_on_files_dropped)
	if not _load_record(rec_path):
		_set_caption("기록을 불러오지 못했어요", "", "[기록 열기]로 웹 게임에서 저장한 JSON 파일을 선택해 주세요.")
	if shots_dir != "":
		DirAccess.make_dir_recursive_absolute(shots_dir)


func _build_theme() -> void:
	var f: SystemFont = SystemFont.new()
	f.font_names = PackedStringArray(FONT_NAMES)
	var th: Theme = Theme.new()
	th.default_font = f
	th.default_font_size = 18
	theme = th


func _mk_label(size_px: int, col: Color = Color.WHITE) -> Label:
	var l: Label = Label.new()
	l.add_theme_font_size_override("font_size", size_px)
	l.add_theme_color_override("font_color", col)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


func _mk_btn(text: String, cb: Callable) -> Button:
	var b: Button = Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.pressed.connect(cb)
	return b


func _build_ui() -> void:
	var bg: ColorRect = ColorRect.new()
	bg.color = Color("0b0f1a")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var root: VBoxContainer = VBoxContainer.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 6)
	add_child(root)

	# 위쪽 바
	var top: HBoxContainer = HBoxContainer.new()
	top.add_theme_constant_override("separation", 8)
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 14)
	margin.add_theme_constant_override("margin_right", 14)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_child(top)
	root.add_child(margin)
	var title: Label = _mk_label(20, ACCENT)
	title.text = "인생 기록 재생기"
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(title)
	top.add_child(_mk_btn("기록 열기", func(): file_dialog.popup_centered_ratio(0.7)))
	btn_play = _mk_btn("⏸ 일시정지", _toggle_play)
	top.add_child(btn_play)
	top.add_child(_mk_btn("◀", func(): _go(maxi(0, idx - 1))))
	top.add_child(_mk_btn("▶", func(): _go(idx + 1)))
	for s in [1.0, 2.0, 4.0]:
		top.add_child(_mk_btn("%d×" % int(s), func(): speed = s))
	top.add_child(_mk_btn("처음부터", func(): _restart()))

	# 무대
	var holder: Control = Control.new()
	holder.size_flags_vertical = Control.SIZE_EXPAND_FILL
	holder.clip_contents = true
	root.add_child(holder)
	stage = Stage.new()
	stage.set_anchors_preset(Control.PRESET_FULL_RECT)
	holder.add_child(stage)
	fade = ColorRect.new()
	fade.color = Color.BLACK
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	holder.add_child(fade)

	hud_age = _mk_label(64, Color.WHITE)
	hud_age.autowrap_mode = TextServer.AUTOWRAP_OFF
	hud_age.position = Vector2(28, 14)
	hud_age.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	hud_age.add_theme_constant_override("outline_size", 8)
	holder.add_child(hud_age)
	hud_year = _mk_label(22, ACCENT)
	hud_year.autowrap_mode = TextServer.AUTOWRAP_OFF
	hud_year.position = Vector2(32, 90)
	hud_year.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	hud_year.add_theme_constant_override("outline_size", 6)
	holder.add_child(hud_year)

	var cap: PanelContainer = PanelContainer.new()
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.04, 0.09, 0.72)
	sb.set_corner_radius_all(14)
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 14
	sb.content_margin_bottom = 16
	cap.add_theme_stylebox_override("panel", sb)
	var capm: MarginContainer = MarginContainer.new()
	capm.add_theme_constant_override("margin_left", 14)
	capm.add_theme_constant_override("margin_right", 14)
	capm.custom_minimum_size = Vector2(0, 124)
	capm.add_child(cap)
	root.add_child(capm)
	var cv: VBoxContainer = VBoxContainer.new()
	cv.add_theme_constant_override("separation", 4)
	cap.add_child(cv)
	cap_title = _mk_label(24, ACCENT)
	cv.add_child(cap_title)
	cap_choice = _mk_label(16, Color("b9c3dc"))
	cv.add_child(cap_choice)
	cap_text = _mk_label(19, Color("f2f4fa"))
	cv.add_child(cap_text)

	# 타임라인
	timeline = Timeline.new()
	timeline.seek.connect(func(i: int): _go(i))
	var tm: MarginContainer = MarginContainer.new()
	tm.add_theme_constant_override("margin_left", 14)
	tm.add_theme_constant_override("margin_right", 14)
	tm.add_child(timeline)
	root.add_child(tm)

	_build_summary()

	file_dialog = FileDialog.new()
	file_dialog.access = FileDialog.ACCESS_FILESYSTEM
	file_dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	file_dialog.filters = PackedStringArray(["*.json ; 인생 기록(JSON)"])
	file_dialog.title = "웹 게임에서 저장한 인생 기록 선택"
	file_dialog.file_selected.connect(func(p: String): _load_record(p))
	add_child(file_dialog)


func _build_summary() -> void:
	summary = Control.new()
	summary.set_anchors_preset(Control.PRESET_FULL_RECT)
	summary.visible = false
	add_child(summary)
	var dim: ColorRect = ColorRect.new()
	dim.color = Color(0.03, 0.04, 0.09, 0.985)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	summary.add_child(dim)
	var m: MarginContainer = MarginContainer.new()
	m.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 40)
	summary.add_child(m)
	var v: VBoxContainer = VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	m.add_child(v)
	var h: Label = _mk_label(34, ACCENT)
	h.text = "당신의 삶, 한눈에"
	v.add_child(h)
	var cols: HBoxContainer = HBoxContainer.new()
	cols.add_theme_constant_override("separation", 28)
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(cols)
	sum_label = RichTextLabel.new()
	sum_label.bbcode_enabled = true
	sum_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sum_label.add_theme_font_size_override("normal_font_size", 17)
	sum_label.add_theme_constant_override("line_separation", 5)
	cols.add_child(sum_label)
	var right: VBoxContainer = VBoxContainer.new()
	right.custom_minimum_size = Vector2(430, 0)
	right.add_theme_constant_override("separation", 10)
	cols.add_child(right)
	var ct: Label = _mk_label(16, ACCENT)
	ct.text = "행복과 건강의 흐름"
	right.add_child(ct)
	chart = HappyChart.new()
	chart.custom_minimum_size = Vector2(430, 260)
	right.add_child(chart)
	var cl: Label = _mk_label(13, Color("98a3bd"))
	cl.text = "노란 선: 행복 · 붉은 선: 건강 · 점: 중요한 순간"
	right.add_child(cl)
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row.add_child(_mk_btn("다시 재생", func(): _restart()))
	row.add_child(_mk_btn("기록 열기", func(): file_dialog.popup_centered_ratio(0.7)))
	right.add_child(row)


# ───────── 기록 불러오기 ─────────
func _load_record(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return false
	var txt: String = FileAccess.get_file_as_string(path)
	var data: Variant = JSON.parse_string(txt)
	if typeof(data) != TYPE_DICTIONARY or not data.has("log") or not data.has("meta"):
		_set_caption("올바른 기록 파일이 아니에요", "", "웹 게임 결과 화면의 [Godot 재생용 기록 저장]으로 만든 파일을 열어 주세요.")
		return false
	record = data
	picks = Highlights.pick(record.log, max_picks)
	var cols: Array = []
	for p in picks:
		cols.append(_scene_color(p.scene))
	timeline.count = picks.size()
	timeline.colors = cols
	_restart()
	return true


func _on_files_dropped(files: PackedStringArray) -> void:
	if files.size() > 0:
		_load_record(files[0])


func _scene_color(sc: String) -> Color:
	var m: Dictionary = {
		"birth": "6fd3c0", "death": "8a93a8", "war": "e8603a", "protest": "f2c879", "crisis": "e84a4a", "disaster": "c0504a",
		"wedding": "f08aa8", "family": "f5a85a", "house": "7fb4f0", "school": "7fb4f0", "graduation": "9a8af0", "office": "6aa0e8",
		"factory": "a9a398", "farm": "d9b04a", "city": "8a7ac0", "hospital": "e8707d", "retire": "ff9a5a", "celebrate": "ffd45a",
		"loss": "6a7a8f", "friends": "7fd38a", "abroad": "4aa0e8", "military": "6f8f4a", "virus": "e05a4a", "accident": "d0a030",
	}
	return Color(m.get(sc, "98a3bd"))


# ───────── 재생 ─────────
func _restart() -> void:
	summary.visible = false
	finished = false
	playing = true
	btn_play.text = "⏸ 일시정지"
	shot_n = 0
	_go(0)


func _toggle_play() -> void:
	playing = not playing
	btn_play.text = "⏸ 일시정지" if playing else "▶ 재생"


func _go(i: int) -> void:
	if picks.is_empty():
		return
	if i >= picks.size():
		_show_summary()
		return
	idx = i
	t = 0.0
	shot_taken = false
	finished = false
	summary.visible = false
	var p: Dictionary = picks[idx]
	stage.scene = p.scene
	stage.year = p.year
	stage.mood = p.mood
	stage.t = 0.0
	hud_age.text = "%d세" % p.age
	hud_year.text = "%d년" % p.year
	var star: String = "★ " if p.fav else ""
	_set_caption("%s%s" % [star, p.title], ("선택  ·  " + p.choice) if p.choice != "" else "", p.result)
	_type(0.0)
	timeline.current = idx
	timeline.progress = 0.0
	timeline.queue_redraw()


func _set_caption(title: String, choice: String, text: String) -> void:
	cap_title.text = title
	cap_choice.text = choice
	cap_choice.visible = choice != ""
	cap_text.text = text
	_type(1.0)


func _type(ratio: float) -> void:
	cap_text.modulate.a = clampf(ratio * 3.0, 0.0, 1.0)


func _show_summary() -> void:
	finished = true
	var lines: Array = Highlights.summary_lines(record.meta, picks)
	var bb: String = ""
	for l in lines:
		bb += "• " + l + "\n"
	bb += "\n[color=#f2c879]기억에 남긴 중요한 순간[/color]\n"
	var marks: Array = []
	for p in picks:
		var c: Color = _scene_color(p.scene)
		bb += "[color=#%s]●[/color]  %d년 (%d세) — %s" % [c.to_html(false), p.year, p.age, p.title]
		var line: String = p.result if p.result != "" else p.choice
		if line.length() > 46:
			line = line.substr(0, 46) + "…"
		bb += "  [color=#98a3bd]%s[/color]\n" % line
		marks.append({"age": p.age, "color": c})
	sum_label.text = bb
	chart.snaps = record.get("snaps", [])
	chart.marks = marks
	chart.queue_redraw()
	summary.visible = true
	fade.color = Color(0, 0, 0, 0)
	if shots_dir != "":
		_snap("summary")
		get_tree().create_timer(0.3).timeout.connect(func(): get_tree().quit())


func _snap(tag: String) -> void:
	await RenderingServer.frame_post_draw
	var img: Image = get_viewport().get_texture().get_image()
	img.save_png("%s/%02d_%s.png" % [shots_dir, shot_n, tag])
	shot_n += 1


func _process(delta: float) -> void:
	if picks.is_empty() or idx < 0 or finished or not playing or snapping:
		return
	t += delta * speed
	stage.t = t
	var a: float = clampf(minf(t / 0.7, (SCENE_SECONDS - t) / 0.7), 0.0, 1.0)
	fade.color = Color(0, 0, 0, 1.0 - a)
	_type(clampf(t / (SCENE_SECONDS * 0.5), 0.0, 1.0))
	timeline.progress = clampf(t / SCENE_SECONDS, 0.0, 1.0)
	timeline.queue_redraw()
	if shots_dir != "" and not shot_taken and t >= 3.4:
		shot_taken = true
		snapping = true
		await _snap(picks[idx].scene)
		snapping = false
		t = SCENE_SECONDS
	if t >= SCENE_SECONDS:
		_go(idx + 1)
