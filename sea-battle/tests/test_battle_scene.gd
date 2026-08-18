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
	var sidebar = battle.get_node_or_null("Margin/Layout/SidebarSlot/TacticalSidebar")
	t.expect_not_null(sidebar, "sidebar is instanced")
	if sidebar != null:
		t.expect_eq(sidebar.active_player_label.text, "PLAYER 1", "sidebar shows active player")
		t.expect_eq(sidebar.hull_label.text, "3 / 3", "sidebar shows hull")
		t.expect_eq(
			sidebar.stats_label.text,
			"MOVE 3   RANGE 2   DAMAGE 1",
			"sidebar shows exact stats"
		)
		t.expect_false(sidebar.end_turn_button.disabled, "end turn starts enabled")
	var player_two_start: Vector2i = battle.state.ships[BattleState.Player.TWO].cell
	await battle.handle_cell_click(player_two_start)
	t.expect_false(battle.state.selected, "inactive ship does not select")
	t.expect_eq(sidebar.message_label.text, "Player 1's turn", "inactive ship explains whose turn it is")

	var player_one_start: Vector2i = battle.state.active_ship().cell
	await battle.handle_cell_click(player_one_start)
	t.expect_true(battle.state.selected, "click selects active ship")
	t.expect_true(battle.highlights.reachable_cells.size() > 0, "selection displays reachable cells")
	battle.cancel_selection()
	t.expect_false(battle.state.selected, "selection cancels before an action")
	t.expect_true(battle.highlights.reachable_cells.is_empty(), "cancel clears highlights")
	await battle.handle_cell_click(player_one_start)

	var destination := Vector2i(2, 4)
	battle.handle_cell_hover(destination)
	t.expect_eq(battle.highlights.path_cells.back(), destination, "hover previews destination")
	await battle.handle_cell_click(destination)
	t.expect_eq(battle.state.active_ship().cell, destination, "click commits movement")
	battle.cancel_selection()
	t.expect_true(battle.state.selected, "committed movement cannot be cancelled")
	t.expect_eq(
		battle.ship_views[BattleState.Player.ONE].position,
		battle.tile_map.map_to_local(destination),
		"view reaches destination"
	)
	t.expect_eq(
		battle.ship_views[BattleState.Player.ONE].position,
		battle.tile_map.map_to_local(battle.state.ships[BattleState.Player.ONE].cell),
		"player one view matches authoritative cell"
	)
	battle.queue_free()
	await tree.process_frame
