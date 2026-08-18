class_name ShipView
extends Node2D

var player: int
var hull: int
var max_hull: int
var is_active := false
var displayed_hull := 0.0:
	set(value):
		displayed_hull = value
		queue_redraw()


func configure(owner: int, definition: ShipDefinition) -> void:
	player = owner
	hull = definition.max_hull
	max_hull = definition.max_hull
	displayed_hull = hull
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


func _draw() -> void:
	var ship_color := (
		Color("e2b65c")
		if player == BattleState.Player.ONE
		else Color("c85f58")
	)
	var hull_points := PackedVector2Array([
		Vector2(-22, -7),
		Vector2(17, -7),
		Vector2(24, 0),
		Vector2(17, 7),
		Vector2(-22, 7),
		Vector2(-14, 0),
	])
	draw_colored_polygon(hull_points, ship_color)
	var outline := hull_points.duplicate()
	outline.append(hull_points[0])
	draw_polyline(outline, Color("f7edd0"), 2.0, true)
	draw_line(Vector2(-4, -7), Vector2(-4, -19), Color("4b3426"), 2.0)
	draw_colored_polygon(
		PackedVector2Array([
			Vector2(-3, -18),
			Vector2(12, -11),
			Vector2(-3, -8),
		]),
		Color("f2f0df")
	)
	if is_active:
		draw_arc(Vector2.ZERO, 30.0, 0.0, TAU, 32, Color("d5a653"), 3.0, true)
	var bar_rect := Rect2(-20, 23, 40, 5)
	draw_rect(bar_rect, Color("0d222e"), true)
	var hull_ratio := clampf(displayed_hull / maxf(max_hull, 1), 0.0, 1.0)
	draw_rect(Rect2(bar_rect.position, Vector2(bar_rect.size.x * hull_ratio, bar_rect.size.y)), Color("69b978"), true)
	draw_rect(bar_rect, Color("f2f0df"), false, 1.0)
