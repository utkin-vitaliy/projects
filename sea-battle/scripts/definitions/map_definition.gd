class_name MapDefinition
extends Resource

@export var size := Vector2i(11, 8)
@export var blocked_cells: Array[Vector2i] = []
@export var player_one_start := Vector2i(1, 4)
@export var player_two_start := Vector2i(9, 3)
@export var water_terrain: TerrainDefinition
@export var land_terrain: TerrainDefinition


func all_cells() -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	for y in range(size.y):
		for x in range(size.x):
			cells.append(Vector2i(x, y))
	return cells


func terrain_at(cell: Vector2i) -> TerrainDefinition:
	return land_terrain if blocked_cells.has(cell) else water_terrain
