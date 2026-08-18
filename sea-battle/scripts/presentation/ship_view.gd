class_name ShipView
extends Node2D

const PLAYER_ONE_COLOR := Color("e2b65c")
const PLAYER_TWO_COLOR := Color("c85f58")
const NEUTRAL_COLOR := Color("89979e")
const HULL_OUTLINE_COLOR := Color("f7edd0")
const MAST_COLOR := Color("4b3426")
const SAIL_COLOR := Color("f2f0df")
const ACTIVE_COLOR := Color("d5a653")
const BAR_BACKGROUND_COLOR := Color("0d222e")
const BAR_HULL_COLOR := Color("69b978")

var ship_id: StringName = &""
var player: int
var definition: ShipDefinition
var hull: int
var max_hull: int
var is_active := false
var is_ready := false
var is_used := false
var is_sunk := false
var displayed_hull := 0.0:
	set(value):
		displayed_hull = value
		queue_redraw()


func configure(owner: int, ship_definition: ShipDefinition) -> void:
	ship_id = &""
	_configure_profile(owner, ship_definition)


func configure_fleet(id: StringName, owner: int, ship_definition: ShipDefinition) -> void:
	ship_id = id
	_configure_profile(owner, ship_definition)


func _configure_profile(owner: int, ship_definition: ShipDefinition) -> void:
	player = owner
	definition = ship_definition
	hull = ship_definition.max_hull
	max_hull = ship_definition.max_hull
	displayed_hull = hull
	is_active = false
	is_ready = false
	is_used = false
	is_sunk = false
	visible = true
	set_process_input(true)
	modulate = Color(0.7, 0.7, 0.7, 1.0)
	queue_redraw()


func set_hull(current: int, maximum: int) -> void:
	hull = current
	max_hull = maximum
	displayed_hull = current
	queue_redraw()


func set_active(active: bool) -> void:
	is_active = active
	modulate = Color.WHITE if active else Color(0.7, 0.7, 0.7, 1.0)
	queue_redraw()


func set_ready(ready: bool) -> void:
	is_ready = ready
	if ready:
		is_used = false
	queue_redraw()


func set_used(used: bool) -> void:
	is_used = used
	if used:
		is_ready = false
	queue_redraw()


func set_sunk(sunk: bool) -> void:
	is_sunk = sunk
	visible = not sunk
	set_process_input(not sunk)
	queue_redraw()


func get_visual_bounds() -> Rect2:
	var points := definition.visual_profile.hull_points
	var bounds := Rect2(points[0], Vector2.ZERO)
	for point in points:
		bounds = bounds.expand(point)
	return bounds


func mast_count() -> int:
	return definition.visual_profile.mast_offsets.size()


func get_ownership_color() -> Color:
	return _palette_color_for_owner(player)


func _palette_color_for_owner(owner: int) -> Color:
	match owner:
		1:
			return PLAYER_ONE_COLOR
		2:
			return PLAYER_TWO_COLOR
		_:
			return NEUTRAL_COLOR


func _draw() -> void:
	if definition == null or definition.visual_profile == null:
		return
	var profile := definition.visual_profile
	var hull_points := profile.hull_points
	if hull_points.is_empty():
		return
	var ship_color := get_ownership_color()
	var bounds := get_visual_bounds()
	if is_active:
		draw_rect(bounds.grow(7.0), ACTIVE_COLOR, false, 3.0, true)
	draw_colored_polygon(hull_points, ship_color)
	var outline := hull_points.duplicate()
	outline.append(hull_points[0])
	draw_polyline(outline, HULL_OUTLINE_COLOR, 2.0, true)
	if profile.raised_stern:
		_draw_raised_stern(bounds, ship_color)
	_draw_masts(profile.mast_offsets, bounds.position.y)
	_draw_gun_ports(profile.gun_port_count, bounds)
	_draw_readiness_glyph(bounds)
	var bar_width := clampf(bounds.size.x * 0.65, 44.0, 72.0)
	var bar_rect := Rect2(
		bounds.get_center().x - bar_width * 0.5,
		bounds.end.y + 12.0,
		bar_width,
		6.0
	)
	draw_rect(bar_rect, BAR_BACKGROUND_COLOR, true)
	var hull_ratio := clampf(displayed_hull / maxf(max_hull, 1), 0.0, 1.0)
	draw_rect(
		Rect2(bar_rect.position, Vector2(bar_rect.size.x * hull_ratio, bar_rect.size.y)),
		BAR_HULL_COLOR,
		true
	)
	draw_rect(bar_rect, SAIL_COLOR, false, 1.0)


func _draw_masts(offsets: PackedFloat32Array, hull_top: float) -> void:
	for offset in offsets:
		var mast_base := Vector2(offset, hull_top + 3.0)
		var mast_top := Vector2(offset, hull_top - 30.0)
		draw_line(mast_base, mast_top, MAST_COLOR, 3.0, true)
		draw_colored_polygon(
			PackedVector2Array([
				mast_top + Vector2(2.0, 4.0),
				mast_top + Vector2(18.0, 14.0),
				mast_top + Vector2(2.0, 23.0),
			]),
			SAIL_COLOR
		)


func _draw_raised_stern(bounds: Rect2, ship_color: Color) -> void:
	var stern := PackedVector2Array([
		Vector2(bounds.position.x + 5.0, bounds.position.y + 2.0),
		Vector2(bounds.position.x + 7.0, bounds.position.y - 15.0),
		Vector2(bounds.position.x + 27.0, bounds.position.y - 15.0),
		Vector2(bounds.position.x + 31.0, bounds.position.y),
	])
	draw_colored_polygon(stern, ship_color)
	stern.append(stern[0])
	draw_polyline(stern, HULL_OUTLINE_COLOR, 2.0, true)


func _draw_gun_ports(count: int, bounds: Rect2) -> void:
	if count <= 0:
		return
	var left := bounds.position.x + 24.0
	var right := bounds.end.x - 21.0
	for index in range(count):
		var progress := 0.5 if count == 1 else float(index) / float(count - 1)
		var port_position := Vector2(lerpf(left, right, progress), 3.0)
		draw_circle(port_position, 3.2, BAR_BACKGROUND_COLOR)
		draw_arc(port_position, 3.2, 0.0, TAU, 12, HULL_OUTLINE_COLOR, 1.0, true)


func _draw_readiness_glyph(bounds: Rect2) -> void:
	if is_active:
		return
	var glyph_center := Vector2(bounds.end.x + 11.0, bounds.position.y - 4.0)
	if is_used:
		draw_line(
			glyph_center + Vector2(-6.0, 0.0),
			glyph_center + Vector2(-1.0, 5.0),
			SAIL_COLOR,
			3.0,
			true
		)
		draw_line(
			glyph_center + Vector2(-1.0, 5.0),
			glyph_center + Vector2(7.0, -6.0),
			SAIL_COLOR,
			3.0,
			true
		)
	elif is_ready:
		draw_arc(glyph_center, 7.0, 0.0, TAU, 20, SAIL_COLOR, 2.0, true)
