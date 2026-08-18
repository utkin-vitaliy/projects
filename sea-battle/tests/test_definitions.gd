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
