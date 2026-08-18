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
	await battle.handle_cell_click(Vector2i(3, 5))
	t.expect_eq(sidebar.message_label.text, "Blocked", "land click shows blocked feedback")
	await battle.handle_cell_click(Vector2i(8, 7))
	t.expect_eq(sidebar.message_label.text, "Out of range", "distant click shows range feedback")

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
	await test_complete_match(t, tree, packed)


func test_complete_match(t: TestContext, tree: SceneTree, packed: PackedScene) -> void:
	var battle = packed.instantiate()
	battle.skip_animations = true
	tree.root.add_child(battle)
	await tree.process_frame
	var original_one: Vector2i = battle.state.ships[BattleState.Player.ONE].cell
	var original_two: Vector2i = battle.state.ships[BattleState.Player.TWO].cell
	battle.state.ships[BattleState.Player.ONE].cell = Vector2i(2, 4)
	battle.state.ships[BattleState.Player.TWO].cell = Vector2i(4, 4)
	battle.refresh_from_state()

	await attack_with_active_ship(battle)
	t.expect_eq(battle.state.ships[BattleState.Player.TWO].hull, 2, "attack deals one damage")
	t.expect_eq(battle.state.active_player, BattleState.Player.TWO, "attack ends turn")
	t.expect_eq(battle.sidebar.active_player_label.text, "PLAYER 2", "sidebar changes player")
	t.expect_eq(battle.sidebar.message_label.text, "Select your ship", "next player receives selection prompt")

	await attack_with_active_ship(battle)
	await attack_with_active_ship(battle)
	await attack_with_active_ship(battle)
	await attack_with_active_ship(battle)
	var result_overlay: Control = battle.get_node("OverlayLayer/ResultOverlay")
	var result_label: Label = result_overlay.get_node("Center/ResultPanel/ResultContent/ResultLabel")
	t.expect_eq(battle.state.winner, BattleState.Player.ONE, "third hit wins the match")
	t.expect_true(result_overlay.visible, "winner overlay is visible")
	t.expect_eq(result_label.text, "PLAYER 1 WINS", "winner copy is exact")
	t.expect_true(battle.input_locked, "battlefield input locks after victory")

	battle.sidebar.play_again_pressed.emit()
	await tree.process_frame
	t.expect_eq(battle.state.active_player, BattleState.Player.ONE, "restart restores player one")
	t.expect_eq(battle.state.ships[BattleState.Player.ONE].hull, 3, "restart restores player one hull")
	t.expect_eq(battle.state.ships[BattleState.Player.TWO].hull, 3, "restart restores player two hull")
	t.expect_eq(battle.state.ships[BattleState.Player.ONE].cell, original_one, "restart restores player one position")
	t.expect_eq(battle.state.ships[BattleState.Player.TWO].cell, original_two, "restart restores player two position")
	t.expect_false(result_overlay.visible, "restart hides winner overlay")
	t.expect_false(battle.input_locked, "restart unlocks battlefield input")
	for replay_index in range(2):
		battle.state.ships[BattleState.Player.ONE].cell = Vector2i(2, 4)
		battle.state.ships[BattleState.Player.TWO].cell = Vector2i(4, 4)
		battle.refresh_from_state()
		for hit_index in range(5):
			await attack_with_active_ship(battle)
		t.expect_eq(battle.state.winner, BattleState.Player.ONE, "replay %d reaches a winner" % (replay_index + 2))
		t.expect_true(result_overlay.visible, "replay %d shows its result" % (replay_index + 2))
		battle.sidebar.play_again_pressed.emit()
		await tree.process_frame
		t.expect_false(result_overlay.visible, "replay %d clears its result" % (replay_index + 2))
	battle.queue_free()
	await tree.process_frame


func attack_with_active_ship(battle: BattleScreen) -> void:
	await battle.handle_cell_click(battle.state.active_ship().cell)
	await battle.handle_cell_click(battle.state.opposing_ship().cell)
