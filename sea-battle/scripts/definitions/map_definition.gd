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


func validate(neighbors: Dictionary, tile_set: TileSet = null) -> Array[StringName]:
	var errors: Array[StringName] = []
	var starts_overlap := player_one_start == player_two_start
	var starts_inside := _contains(player_one_start) and _contains(player_two_start)
	var starts_blocked := (
		blocked_cells.has(player_one_start)
		or blocked_cells.has(player_two_start)
	)
	if starts_overlap:
		errors.append(&"overlapping_starts")
	if not starts_inside:
		errors.append(&"start_outside_map")
	if starts_blocked:
		errors.append(&"start_blocked")
	if starts_inside and not starts_overlap and not starts_blocked:
		var validation_board := HexBoard.new()
		validation_board.configure(all_cells(), blocked_cells, neighbors)
		if validation_board.path(player_one_start, player_two_start).is_empty():
			errors.append(&"starts_disconnected")
	if water_terrain == null or land_terrain == null:
		errors.append(&"terrain_definition_missing")
	else:
		var tile_errors := _validate_terrain_tiles(tile_set)
		errors.append_array(tile_errors)
	return errors


func _contains(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < size.x and cell.y < size.y


func _validate_terrain_tiles(tile_set: TileSet) -> Array[StringName]:
	var source_missing := false
	var tile_missing := false
	for terrain in [water_terrain, land_terrain]:
		if terrain.source_ids.is_empty():
			source_missing = true
			continue
		if tile_set == null:
			continue
		for source_id in terrain.source_ids:
			if not tile_set.has_source(source_id):
				source_missing = true
				continue
			var atlas_source := tile_set.get_source(source_id) as TileSetAtlasSource
			if atlas_source == null or not atlas_source.has_tile(terrain.atlas_coords):
				tile_missing = true
	var errors: Array[StringName] = []
	if source_missing:
		errors.append(&"terrain_tile_source_missing")
	if tile_missing:
		errors.append(&"terrain_tile_missing")
	return errors
