extends RefCounted


func run(t: TestContext, _tree: SceneTree) -> void:
	var ship = load("res://resources/ships/basic_ship.tres")
	t.expect_not_null(ship, "basic ship resource loads")
	if ship == null:
		return
	t.expect_eq(ship.max_hull, 3, "basic ship hull")
	t.expect_eq(ship.movement, 3, "basic ship movement")
	t.expect_eq(ship.attack_range, 2, "basic ship range")
	t.expect_eq(ship.damage, 1, "basic ship damage")

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
