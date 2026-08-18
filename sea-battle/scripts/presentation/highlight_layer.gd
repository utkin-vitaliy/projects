class_name HighlightLayer
extends Node2D

var reachable_cells: Array[Vector2i] = []
var path_cells: Array[Vector2i] = []
var target_cells: Array[Vector2i] = []
var hovered_target_cell := Vector2i.ZERO
var has_hovered_target := false

var _tile_map: TileMapLayer
var _selection_cell := Vector2i.ZERO
var _has_selection := false


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


func show_targets(cells: Array[Vector2i]) -> void:
	target_cells = cells.duplicate()
	if has_hovered_target and not target_cells.has(hovered_target_cell):
		has_hovered_target = false
	queue_redraw()


func show_hovered_target(cell: Vector2i) -> void:
	hovered_target_cell = cell
	has_hovered_target = target_cells.has(cell)
	queue_redraw()


func clear_hovered_target() -> void:
	has_hovered_target = false
	queue_redraw()


func clear() -> void:
	reachable_cells.clear()
	path_cells.clear()
	target_cells.clear()
	_has_selection = false
	has_hovered_target = false
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
	for cell in target_cells:
		var target_center := _tile_map.map_to_local(cell)
		var hovered := has_hovered_target and cell == hovered_target_cell
		var width := 5.0 if hovered else 3.0
		var radius := 12.0 if hovered else 9.0
		var crosshair_width := 3.5 if hovered else 2.0
		_draw_hex_outline(target_center, Color("c85f58"), width)
		draw_circle(target_center, radius, Color("f2f0df"), false, crosshair_width, true)
		draw_line(
			target_center + Vector2(-14, 0),
			target_center + Vector2(14, 0),
			Color("f2f0df"),
			crosshair_width
		)
		draw_line(
			target_center + Vector2(0, -14),
			target_center + Vector2(0, 14),
			Color("f2f0df"),
			crosshair_width
		)


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
