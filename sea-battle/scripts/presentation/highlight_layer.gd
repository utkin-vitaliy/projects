class_name HighlightLayer
extends Node2D

var reachable_cells: Array[Vector2i] = []
var path_cells: Array[Vector2i] = []

var _tile_map: TileMapLayer
var _selection_cell := Vector2i.ZERO
var _has_selection := false
var _target_cell := Vector2i.ZERO
var _has_target := false


func configure(tile_map: TileMapLayer) -> void:
	_tile_map = tile_map
	queue_redraw()


func show_selection(cell: Vector2i) -> void:
	_selection_cell = cell
	_has_selection = true
	queue_redraw()


func show_reachable(cells: Array[Vector2i]) -> void:
	reachable_cells = cells.duplicate()
	queue_redraw()


func show_path(cells: Array[Vector2i]) -> void:
	path_cells = cells.duplicate()
	queue_redraw()


func show_target(cell: Vector2i) -> void:
	_target_cell = cell
	_has_target = true
	queue_redraw()


func clear_target() -> void:
	_has_target = false
	queue_redraw()


func clear() -> void:
	reachable_cells.clear()
	path_cells.clear()
	_has_selection = false
	_has_target = false
	queue_redraw()


func _draw() -> void:
	if _tile_map == null:
		return
	for cell in reachable_cells:
		var center := _tile_map.map_to_local(cell)
		draw_colored_polygon(_hex_points(center, 28.0), Color(0.18, 0.66, 0.87, 0.24))
		draw_circle(center, 4.0, Color(0.55, 0.88, 1.0, 0.9))
	if _has_selection:
		_draw_hex_outline(_tile_map.map_to_local(_selection_cell), Color("d5a653"), 3.0)
	if path_cells.size() > 1:
		var points := PackedVector2Array()
		for cell in path_cells:
			points.append(_tile_map.map_to_local(cell))
		draw_polyline(points, Color("d5a653"), 3.0, true)
		for point in points:
			draw_circle(point, 4.0, Color("f2f0df"))
		for index in range(points.size() - 1):
			_draw_route_chevron(points[index], points[index + 1])
	if _has_target:
		var target_center := _tile_map.map_to_local(_target_cell)
		_draw_hex_outline(target_center, Color("c85f58"), 3.0)
		draw_circle(target_center, 9.0, Color("f2f0df"), false, 2.0, true)
		draw_line(target_center + Vector2(-14, 0), target_center + Vector2(14, 0), Color("f2f0df"), 2.0)
		draw_line(target_center + Vector2(0, -14), target_center + Vector2(0, 14), Color("f2f0df"), 2.0)


func _draw_hex_outline(center: Vector2, color: Color, width: float) -> void:
	var points := _hex_points(center, 28.0)
	points.append(points[0])
	draw_polyline(points, color, width, true)


func _hex_points(center: Vector2, radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	for index in range(6):
		var angle := deg_to_rad(60.0 * index)
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	return points


func _draw_route_chevron(from: Vector2, to: Vector2) -> void:
	var direction := from.direction_to(to)
	var midpoint := from.lerp(to, 0.62)
	var normal := Vector2(-direction.y, direction.x)
	var tip := midpoint + direction * 5.0
	draw_line(tip, midpoint - direction * 5.0 + normal * 5.0, Color("0d222e"), 2.0, true)
	draw_line(tip, midpoint - direction * 5.0 - normal * 5.0, Color("0d222e"), 2.0, true)
