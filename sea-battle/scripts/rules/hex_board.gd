class_name HexBoard
extends RefCounted


class UnitCostAStar:
	extends AStar2D

	func _compute_cost(_from_id: int, _to_id: int) -> float:
		return 1.0

	func _estimate_cost(_from_id: int, _to_id: int) -> float:
		return 0.0


var _cells := {}
var _blocked := {}
var _neighbors := {}
var _movement := UnitCostAStar.new()
var _geometry := UnitCostAStar.new()
var _coord_to_id := {}
var _id_to_coord := {}


func configure(
	cells: Array[Vector2i],
	blocked: Array[Vector2i],
	neighbors: Dictionary
) -> void:
	_cells.clear()
	_blocked.clear()
	_neighbors = neighbors.duplicate(true)
	_movement.clear()
	_geometry.clear()
	_coord_to_id.clear()
	_id_to_coord.clear()

	for cell in blocked:
		_blocked[cell] = true

	var next_id := 1
	for cell in cells:
		_cells[cell] = true
		_coord_to_id[cell] = next_id
		_id_to_coord[next_id] = cell
		_geometry.add_point(next_id, Vector2(cell))
		if not _blocked.has(cell):
			_movement.add_point(next_id, Vector2(cell))
		next_id += 1

	for cell in cells:
		var from_id: int = _coord_to_id[cell]
		for neighbor in _neighbors.get(cell, []):
			if not _coord_to_id.has(neighbor):
				continue
			var to_id: int = _coord_to_id[neighbor]
			if from_id >= to_id:
				continue
			_geometry.connect_points(from_id, to_id)
			if _movement.has_point(from_id) and _movement.has_point(to_id):
				_movement.connect_points(from_id, to_id)


func has_cell(cell: Vector2i) -> bool:
	return _cells.has(cell)


func is_blocked(cell: Vector2i) -> bool:
	return _blocked.has(cell)


func path(
	from_cell: Vector2i,
	to_cell: Vector2i,
	occupied: Dictionary = {}
) -> Array[Vector2i]:
	if not has_cell(from_cell) or not has_cell(to_cell):
		return []
	if is_blocked(from_cell) or is_blocked(to_cell) or occupied.has(to_cell):
		return []

	var disabled_ids: Array[int] = []
	for occupied_cell in occupied:
		if occupied_cell == from_cell or not _coord_to_id.has(occupied_cell):
			continue
		var point_id: int = _coord_to_id[occupied_cell]
		if _movement.has_point(point_id):
			_movement.set_point_disabled(point_id, true)
			disabled_ids.append(point_id)

	var id_path := _movement.get_id_path(
		_coord_to_id[from_cell],
		_coord_to_id[to_cell]
	)
	for point_id in disabled_ids:
		_movement.set_point_disabled(point_id, false)

	var result: Array[Vector2i] = []
	for point_id in id_path:
		result.append(_id_to_coord[point_id])
	return result


func reachable(
	from_cell: Vector2i,
	movement: int,
	occupied: Dictionary = {}
) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for cell_value in _cells:
		var cell: Vector2i = cell_value
		if is_blocked(cell) or occupied.has(cell):
			continue
		var candidate := path(from_cell, cell, occupied)
		if not candidate.is_empty() and candidate.size() - 1 <= movement:
			result.append(cell)
	return result


func distance(from_cell: Vector2i, to_cell: Vector2i) -> int:
	if not has_cell(from_cell) or not has_cell(to_cell):
		return -1
	var id_path := _geometry.get_id_path(
		_coord_to_id[from_cell],
		_coord_to_id[to_cell]
	)
	return id_path.size() - 1 if not id_path.is_empty() else -1
