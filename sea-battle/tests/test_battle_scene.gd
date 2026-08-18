extends RefCounted


func run(t: TestContext, tree: SceneTree) -> void:
	var packed: PackedScene = load("res://scenes/battle_screen.tscn")
	t.expect_not_null(packed, "battle scene loads")
	if packed == null:
		return
	var battle = packed.instantiate()
	battle.skip_animations = true
	tree.root.add_child(battle)
	await tree.process_frame
	t.expect_not_null(battle.state, "battle state is configured")
	t.expect_eq(battle.ship_views.size(), 2, "two ship views exist")
	t.expect_eq(battle.tile_map.get_used_cells().size(), 88, "all fixed map cells render")
	t.expect_eq(battle.state.active_player, BattleState.Player.ONE, "player one starts")
	t.expect_eq(
		battle.ship_views[BattleState.Player.ONE].position,
		battle.tile_map.map_to_local(battle.state.ships[BattleState.Player.ONE].cell),
		"player one view matches authoritative cell"
	)
	battle.queue_free()
	await tree.process_frame
