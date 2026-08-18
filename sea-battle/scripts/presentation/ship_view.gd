class_name ShipView
extends Node2D

const PLAYER_ONE_COLOR := Color("5f8fbd")
const PLAYER_TWO_COLOR := Color("cf5e58")
const NEUTRAL_COLOR := Color("89979e")
const SAIL_COLOR := Color("f2f0df")
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


func configure(id: StringName, owner: int, ship_definition: ShipDefinition) -> void:
	ship_id = id
	_configure_profile(owner, ship_definition)


func _configure_profile(owner: int, ship_definition: ShipDefinition) -> void:
	player = owner
	definition = ship_definition
	hull = ship_definition.max_hull
	max_hull = ship_definition.max_hull
	reset_presentation()


func reset_presentation() -> void:
	transform = Transform2D.IDENTITY
	hull = max_hull
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
	var texture := get_ship_texture()
	if texture == null:
		return Rect2()
	var size := texture.get_size() * definition.visual_profile.sprite_scale
	return Rect2(-size * 0.5, size)


func get_ship_texture() -> Texture2D:
	if definition == null or definition.visual_profile == null:
		return null
	return definition.visual_profile.texture_for_player(player)


func get_ship_texture_rotation() -> float:
	return PI if player == 1 else 0.0


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
	var texture := get_ship_texture()
	if texture == null:
		return
	var bounds := get_visual_bounds()
	draw_set_transform(Vector2.ZERO, get_ship_texture_rotation())
	draw_texture_rect(texture, bounds, false)
	draw_set_transform(Vector2.ZERO, 0.0)
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
