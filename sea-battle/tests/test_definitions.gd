extends RefCounted

const CLASS_PATHS := [
	"res://resources/ships/sloop.tres",
	"res://resources/ships/frigate.tres",
	"res://resources/ships/galleon.tres",
]


func run(t: TestContext, _tree: SceneTree) -> void:
	var ship = load("res://resources/ships/basic_ship.tres")
	t.expect_not_null(ship, "basic ship resource loads")
	if ship == null:
		return
	t.expect_eq(ship.max_hull, 3, "basic ship hull")
	t.expect_eq(ship.movement, 3, "basic ship movement")
	t.expect_eq(ship.attack_range, 2, "basic ship range")
	t.expect_eq(ship.damage, 1, "basic ship damage")
	test_fleet_classes(t)

	var map = load("res://resources/maps/prototype_map.tres")
	t.expect_not_null(map, "prototype map resource loads")
	if map == null:
		return
	t.expect_eq(map.size, Vector2i(11, 8), "prototype map size")
	t.expect_true(map.player_one_start != map.player_two_start, "starts are distinct")
	t.expect_true(map.terrain_at(map.player_one_start).walkable, "player one starts on walkable terrain")
	t.expect_true(map.terrain_at(map.player_two_start).walkable, "player two starts on walkable terrain")
	t.expect_false(map.terrain_at(map.blocked_cells[0]).walkable, "blocked cells use land definition")
	t.expect_eq(map.land_terrain.source_ids, [1, 2], "land exposes both art variants")
	test_map_validation(t, map.water_terrain, map.land_terrain)
	test_fleet_hex_map(t)
	test_fleet_map_validation(t, map.water_terrain, map.land_terrain)


func test_fleet_classes(t: TestContext) -> void:
	var expected := {
		&"sloop": ["Sloop", "Light", 2, 4, 2, 1],
		&"frigate": ["Frigate", "Medium", 4, 3, 3, 1],
		&"galleon": ["Galleon", "Heavy", 6, 2, 2, 2],
	}
	for path in CLASS_PATHS:
		var definition: ShipDefinition = load(path)
		t.expect_not_null(definition, "%s loads" % path)
		if definition == null:
			continue
		var values: Array = expected[definition.class_id]
		t.expect_eq(
			[definition.display_name, definition.weight_label, definition.max_hull,
				definition.movement, definition.attack_range, definition.damage],
			values,
			"%s has approved balance" % definition.class_id
		)
		t.expect_not_null(definition.visual_profile, "%s has visual profile" % definition.class_id)
		t.expect_true(definition.visual_profile.hull_points.size() >= 6, "silhouette is drawable")


func test_map_validation(
	t: TestContext,
	water: TerrainDefinition,
	land: TerrainDefinition
) -> void:
	var tile_set: TileSet = load("res://resources/tiles/prototype_tileset.tres")
	var neighbors := {
		Vector2i(0, 0): [Vector2i(1, 0)],
		Vector2i(1, 0): [Vector2i(0, 0), Vector2i(2, 0)],
		Vector2i(2, 0): [Vector2i(1, 0)],
	}
	var definition := MapDefinition.new()
	definition.size = Vector2i(3, 1)
	definition.player_one_start = Vector2i(0, 0)
	definition.player_two_start = Vector2i(2, 0)
	definition.water_terrain = water
	definition.land_terrain = land
	t.expect_eq(definition.validate(neighbors, tile_set), [], "valid map has no validation codes")

	definition.player_two_start = Vector2i(0, 0)
	t.expect_eq(definition.validate(neighbors), [&"overlapping_starts"], "overlap has stable code")
	definition.player_two_start = Vector2i(3, 0)
	t.expect_eq(definition.validate(neighbors), [&"start_outside_map"], "outside start has stable code")
	definition.player_two_start = Vector2i(2, 0)
	definition.blocked_cells = [Vector2i(2, 0)]
	t.expect_eq(definition.validate(neighbors), [&"start_blocked"], "blocked start has stable code")
	definition.blocked_cells = []
	var disconnected := {
		Vector2i(0, 0): [],
		Vector2i(1, 0): [],
		Vector2i(2, 0): [],
	}
	t.expect_eq(definition.validate(disconnected), [&"starts_disconnected"], "disconnected starts have stable code")
	definition.water_terrain = null
	definition.land_terrain = null
	t.expect_eq(
		definition.validate(neighbors),
		[&"terrain_definition_missing"],
		"missing terrain has stable code"
	)
	var invalid_water: TerrainDefinition = water.duplicate(true)
	invalid_water.source_ids = [999]
	definition.water_terrain = invalid_water
	definition.land_terrain = land
	t.expect_eq(
		definition.validate(neighbors, tile_set),
		[&"terrain_tile_source_missing"],
		"unknown tile source has stable code"
	)
	invalid_water.source_ids = [0]
	invalid_water.atlas_coords = Vector2i(9, 9)
	t.expect_eq(
		definition.validate(neighbors, tile_set),
		[&"terrain_tile_missing"],
		"unknown atlas tile has stable code"
	)


func test_fleet_hex_map(t: TestContext) -> void:
	var map: MapDefinition = load("res://resources/maps/fleet_hex_map.tres")
	t.expect_not_null(map, "fleet hex map loads")
	if map == null:
		return
	t.expect_eq(map.all_cells().size(), 127, "seven-side hex has 127 cells")
	t.expect_eq(map.player_one_starts.size(), 3, "player one has three starts")
	t.expect_eq(map.player_two_starts.size(), 3, "player two has three starts")
	var starts: Array[Vector2i] = map.player_one_starts + map.player_two_starts
	var unique := {}
	for cell in starts:
		unique[cell] = true
		t.expect_true(map.all_cells().has(cell), "start %s is playable" % cell)
		t.expect_false(map.blocked_cells.has(cell), "start %s is walkable" % cell)
	t.expect_eq(unique.size(), 6, "all fleet starts are distinct")


func test_fleet_map_validation(
	t: TestContext,
	water: TerrainDefinition,
	land: TerrainDefinition
) -> void:
	var valid := _fleet_map_fixture(water, land)
	var connected := _line_neighbors(valid.playable_cells)
	t.expect_eq(valid.validate(connected), [], "valid fleet map has no validation codes")

	var incorrect_count := _fleet_map_fixture(water, land)
	incorrect_count.playable_cells.pop_back()
	incorrect_count.player_two_starts = [
		Vector2i(3, 0), Vector2i(4, 0), Vector2i(5, 0)
	]
	t.expect_eq(
		incorrect_count.validate(_line_neighbors(incorrect_count.playable_cells)),
		[&"incorrect_cell_count"],
		"fleet map requires exactly 127 authored cells"
	)

	var duplicate_cell := _fleet_map_fixture(water, land)
	duplicate_cell.playable_cells[-1] = duplicate_cell.playable_cells[-2]
	duplicate_cell.player_two_starts = [
		Vector2i(3, 0), Vector2i(4, 0), Vector2i(5, 0)
	]
	t.expect_eq(
		duplicate_cell.validate(_line_neighbors(duplicate_cell.playable_cells)),
		[&"duplicate_cell"],
		"duplicate playable cell has stable code"
	)

	var incorrect_fleet := _fleet_map_fixture(water, land)
	incorrect_fleet.player_two_starts.pop_back()
	t.expect_eq(
		incorrect_fleet.validate(connected),
		[&"incorrect_fleet_size"],
		"each fleet requires exactly three starts"
	)

	var duplicate_start := _fleet_map_fixture(water, land)
	duplicate_start.player_two_starts[0] = duplicate_start.player_one_starts[0]
	t.expect_eq(
		duplicate_start.validate(connected),
		[&"duplicate_start"],
		"duplicate fleet start has stable code"
	)

	var outside_start := _fleet_map_fixture(water, land)
	outside_start.player_two_starts[0] = Vector2i(999, 0)
	t.expect_eq(
		outside_start.validate(connected),
		[&"start_outside_map"],
		"outside fleet start has stable code"
	)

	var outside_block := _fleet_map_fixture(water, land)
	outside_block.blocked_cells = [Vector2i(999, 0)]
	t.expect_eq(
		outside_block.validate(connected),
		[&"blocked_outside_map"],
		"outside blocked cell has stable code"
	)

	var blocked_start := _fleet_map_fixture(water, land)
	blocked_start.blocked_cells = [blocked_start.player_one_starts[0]]
	t.expect_eq(
		blocked_start.validate(connected),
		[&"start_blocked"],
		"blocked fleet start has stable code"
	)

	var disconnected_starts := _fleet_map_fixture(water, land)
	var split_neighbors := _line_neighbors(disconnected_starts.playable_cells)
	_disconnect_line(split_neighbors, Vector2i(63, 0), Vector2i(64, 0))
	t.expect_eq(
		disconnected_starts.validate(split_neighbors),
		[&"starts_disconnected", &"map_disconnected"],
		"start connectivity precedes whole-map connectivity"
	)

	var disconnected_map := _fleet_map_fixture(water, land)
	disconnected_map.player_two_starts = [
		Vector2i(3, 0), Vector2i(4, 0), Vector2i(5, 0)
	]
	var island_neighbors := _line_neighbors(disconnected_map.playable_cells)
	_disconnect_line(island_neighbors, Vector2i(125, 0), Vector2i(126, 0))
	t.expect_eq(
		disconnected_map.validate(island_neighbors),
		[&"map_disconnected"],
		"isolated walkable cell has stable code"
	)

	var ordered := _fleet_map_fixture(water, land)
	ordered.playable_cells[-1] = ordered.playable_cells[-2]
	ordered.playable_cells.pop_front()
	ordered.player_one_starts.pop_back()
	ordered.player_two_starts = [Vector2i(0, 0), Vector2i(999, 0), Vector2i(125, 0)]
	ordered.blocked_cells = [Vector2i(0, 0), Vector2i(888, 0)]
	t.expect_eq(
		ordered.validate(connected),
		[
			&"incorrect_cell_count",
			&"duplicate_cell",
			&"incorrect_fleet_size",
			&"duplicate_start",
			&"start_outside_map",
			&"blocked_outside_map",
			&"start_blocked",
		],
		"fleet validation codes have deterministic order"
	)


func _fleet_map_fixture(
	water: TerrainDefinition,
	land: TerrainDefinition
) -> MapDefinition:
	var definition := MapDefinition.new()
	for x in range(127):
		definition.playable_cells.append(Vector2i(x, 0))
	definition.player_one_starts = [
		Vector2i(0, 0), Vector2i(1, 0), Vector2i(2, 0)
	]
	definition.player_two_starts = [
		Vector2i(124, 0), Vector2i(125, 0), Vector2i(126, 0)
	]
	definition.water_terrain = water
	definition.land_terrain = land
	return definition


func _line_neighbors(cells: Array[Vector2i]) -> Dictionary:
	var neighbors := {}
	for index in cells.size():
		var adjacent: Array[Vector2i] = []
		if index > 0:
			adjacent.append(cells[index - 1])
		if index + 1 < cells.size():
			adjacent.append(cells[index + 1])
		neighbors[cells[index]] = adjacent
	return neighbors


func _disconnect_line(neighbors: Dictionary, left: Vector2i, right: Vector2i) -> void:
	neighbors[left].erase(right)
	neighbors[right].erase(left)
