class_name MapDefinition
extends Resource

@export var playable_cells: Array[Vector2i] = []
@export var blocked_cells: Array[Vector2i] = []
@export var player_one_starts: Array[Vector2i] = []
@export var player_two_starts: Array[Vector2i] = []
@export var water_terrain: TerrainDefinition
@export var land_terrain: TerrainDefinition


func all_cells() -> Array[Vector2i]:
	return playable_cells.duplicate()


func terrain_at(cell: Vector2i) -> TerrainDefinition:
	return land_terrain if blocked_cells.has(cell) else water_terrain


func validate(neighbors: Dictionary, tile_set: TileSet = null) -> Array[StringName]:
	var errors := _validate_fleet(neighbors)
	if water_terrain == null or land_terrain == null:
		errors.append(&"terrain_definition_missing")
	else:
		var tile_errors := _validate_terrain_tiles(tile_set)
		errors.append_array(tile_errors)
	return errors


func _validate_fleet(neighbors: Dictionary) -> Array[StringName]:
	var errors: Array[StringName] = []
	var unique_cells := {}
	for cell in playable_cells:
		unique_cells[cell] = true
	var starts: Array[Vector2i] = player_one_starts + player_two_starts
	var unique_starts := {}
	for start in starts:
		unique_starts[start] = true

	var incorrect_cell_count := playable_cells.size() != 127
	var duplicate_cell := unique_cells.size() != playable_cells.size()
	var incorrect_fleet_size := (
		player_one_starts.size() != 3
		or player_two_starts.size() != 3
	)
	var duplicate_start := unique_starts.size() != starts.size()
	var start_outside_map := false
	for start in starts:
		if not _contains(start):
			start_outside_map = true
			break
	var blocked_outside_map := false
	for blocked in blocked_cells:
		if not _contains(blocked):
			blocked_outside_map = true
			break
	var start_blocked := false
	for start in starts:
		if blocked_cells.has(start):
			start_blocked = true
			break

	if incorrect_cell_count:
		errors.append(&"incorrect_cell_count")
	if duplicate_cell:
		errors.append(&"duplicate_cell")
	if incorrect_fleet_size:
		errors.append(&"incorrect_fleet_size")
	if duplicate_start:
		errors.append(&"duplicate_start")
	if start_outside_map:
		errors.append(&"start_outside_map")
	if blocked_outside_map:
		errors.append(&"blocked_outside_map")
	if start_blocked:
		errors.append(&"start_blocked")

	if errors.is_empty():
		var validation_board := HexBoard.new()
		validation_board.configure(playable_cells, blocked_cells, neighbors)
		var first_start := starts[0]
		for start in starts:
			if validation_board.path(first_start, start).is_empty():
				errors.append(&"starts_disconnected")
				break
		for cell in playable_cells:
			if blocked_cells.has(cell):
				continue
			if validation_board.path(first_start, cell).is_empty():
				errors.append(&"map_disconnected")
				break
	return errors


func _contains(cell: Vector2i) -> bool:
	return all_cells().has(cell)


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
