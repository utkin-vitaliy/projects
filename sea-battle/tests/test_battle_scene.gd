extends RefCounted

const CLOSE_MAP_PATH := "res://tests/fixtures/close_fleet_map.tres"
const CLOSE_STARTS := {
	FleetBattleState.Player.ONE: [
		Vector2i(-2, 0), Vector2i(-2, 1), Vector2i(-1, 0),
	],
	FleetBattleState.Player.TWO: [
		Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1),
	],
}


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
	t.expect_true(battle.state is FleetBattleState, "scene uses fleet rules")
	t.expect_eq(battle.ship_views.size(), 6, "six ship views exist")
	t.expect_eq(battle.tile_map.get_used_cells().size(), 127, "entire hex map renders")
	t.expect_eq(battle.sidebar.roster_rows.size(), 3, "active fleet roster renders")
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.ONE,
		"player one starts round one"
	)
	if not battle.state is FleetBattleState:
		battle.queue_free()
		await tree.process_frame
		return

	test_initial_fleet_presentation(t, battle)
	test_scaled_board_geometry(t, battle)
	await test_public_selection_and_movement(t, tree, battle)
	battle.queue_free()
	await tree.process_frame

	await test_multiple_targets_and_attack(t, tree, packed)
	await test_used_and_sunk_selection_feedback(t, tree, packed)
	await test_invalid_map_export_locks_without_partial_fleet(t, tree, packed)
	await test_invalid_ship_definitions_lock_without_partial_fleet(t, tree, packed)
	await test_invalid_authored_ship_profiles_lock_without_spawning(t, tree, packed)
	await test_real_movement_locks_during_animation(t, tree, packed)
	await test_animated_sinking_owns_its_lock_and_restores_transform(t, tree, packed)
	await test_complete_match_and_play_again(t, tree, packed)


func test_initial_fleet_presentation(t: TestContext, battle: BattleScreen) -> void:
	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var expected_ids: Array[StringName] = [
		&"p1_sloop", &"p1_frigate", &"p1_galleon",
		&"p2_sloop", &"p2_frigate", &"p2_galleon",
	]
	for ship_id in expected_ids:
		t.expect_true(battle.ship_views.has(ship_id), "view lookup uses stable ID %s" % ship_id)
		var ship: FleetShipState = _ship(fleet_state, ship_id)
		var view: ShipView = battle.ship_views[ship_id]
		t.expect_eq(view.ship_id, ship_id, "%s view retains stable ID" % ship_id)
		t.expect_eq(view.player, ship.player, "%s view retains owner" % ship_id)
		t.expect_eq(view.definition, ship.definition, "%s view retains definition" % ship_id)
		t.expect_eq(
			view.position,
			battle.tile_map.map_to_local(ship.cell),
			"%s view matches authoritative cell" % ship_id
		)
	t.expect_eq(battle.sidebar.row_for(&"p1_sloop").ship_id, &"p1_sloop", "player one roster is active")
	t.expect_eq(battle.sidebar.row_for(&"p2_sloop"), null, "inactive fleet is absent from roster lookup")
	t.expect_eq(battle.sidebar.round_label.text, "ROUND 1", "fleet sidebar shows round one")
	t.expect_true(battle.sidebar.end_turn_button.disabled, "activation completion requires a selection")


func test_scaled_board_geometry(t: TestContext, battle: BattleScreen) -> void:
	t.expect_eq(battle.board_root.scale, Vector2(0.88, 0.88), "board uses approved fleet scale")
	var local_bounds := _map_local_bounds(battle)
	var expected_position := (
		battle.battlefield_panel.size * 0.5
		- local_bounds.get_center() * battle.board_root.scale
	)
	t.expect_true(
		battle.board_root.position.distance_to(expected_position) < 0.01,
		"explicit map bounds are centered with half-tile edges"
	)

	var pointer_cell := Vector2i(-1, -6)
	var pointer_viewport_position: Vector2 = (
		battle.tile_map.get_global_transform_with_canvas()
		* battle.tile_map.map_to_local(pointer_cell)
	)
	var pointer_panel_position: Vector2 = (
		battle.battlefield_panel.get_global_transform_with_canvas().affine_inverse()
		* pointer_viewport_position
	)
	t.expect_eq(
		battle.cell_from_pointer(pointer_panel_position),
		pointer_cell,
		"scaled outer-ring pointer resolves to its rendered hex"
	)


func test_public_selection_and_movement(
	t: TestContext,
	tree: SceneTree,
	battle: BattleScreen
) -> void:
	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var sloop: FleetShipState = _ship(fleet_state, &"p1_sloop")
	await battle.handle_cell_click(sloop.cell)
	t.expect_eq(battle.state.selected_ship_id, &"p1_sloop", "map click selects by stable ship ID")
	t.expect_true(battle.highlights.reachable_cells.size() > 0, "map selection shows reachable cells")
	var galleon: FleetShipState = _ship(fleet_state, &"p1_galleon")
	await battle.handle_cell_click(galleon.cell)
	t.expect_eq(
		battle.state.selected_ship_id,
		&"p1_galleon",
		"friendly ready map click changes an uncommitted selection through rules"
	)

	battle.cancel_selection()
	t.expect_eq(battle.state.selected_ship(), null, "uncommitted map selection cancels through rules")
	t.expect_true(battle.highlights.reachable_cells.is_empty(), "cancel clears movement highlights")

	battle.handle_roster_selection(&"p1_frigate")
	t.expect_eq(battle.state.selected_ship_id, &"p1_frigate", "roster selects through stable-ID method")
	t.expect_eq(
		battle.sidebar.row_for(&"p1_frigate").status_label.text,
		"ACTIVE",
		"roster reflects authoritative selection"
	)
	var destination: Vector2i = battle.state.reachable_cells()[0]
	battle.handle_cell_hover(destination)
	t.expect_eq(battle.highlights.path_cells.back(), destination, "hover previews an authoritative route")
	await battle.handle_cell_click(destination)
	var frigate: FleetShipState = _ship(fleet_state, &"p1_frigate")
	t.expect_eq(frigate.cell, destination, "click commits fleet movement")
	t.expect_true(frigate.movement_used, "movement is committed in rules state")
	t.expect_eq(battle.state.selected_ship_id, &"p1_frigate", "movement keeps activation selected")
	t.expect_eq(
		battle.ship_views[&"p1_frigate"].position,
		battle.tile_map.map_to_local(destination),
		"moved stable-ID view reaches authoritative cell"
	)
	t.expect_true(battle.highlights.reachable_cells.is_empty(), "committed move clears destinations")
	t.expect_eq(
		battle.highlights.target_cells,
		_target_cells(fleet_state),
		"committed move refreshes every legal target"
	)

	battle.handle_ship_selection(&"p1_galleon")
	t.expect_eq(battle.state.selected_ship_id, &"p1_frigate", "committed action blocks ship switching")
	t.expect_eq(battle.sidebar.message_label.text, "Action already committed", "switch rejection is exact")
	battle.cancel_selection()
	t.expect_eq(battle.state.selected_ship_id, &"p1_frigate", "committed action blocks cancellation")
	t.expect_eq(battle.sidebar.message_label.text, "Action already committed", "cancel rejection is exact")

	battle.input_locked = true
	battle.handle_ship_selection(&"p1_galleon")
	battle.handle_cell_hover(Vector2i.ZERO)
	t.expect_eq(battle.state.selected_ship_id, &"p1_frigate", "locked input cannot change selection")
	t.expect_true(battle.highlights.path_cells.is_empty(), "locked hover clears transient path safely")
	battle.input_locked = false

	battle.sidebar.end_turn_pressed.emit()
	await tree.process_frame
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.TWO,
		"end activation hands play to player two"
	)
	t.expect_eq(battle.state.selected_ship(), null, "activation completion clears selection")
	t.expect_eq(battle.sidebar.row_for(&"p2_sloop").ship_id, &"p2_sloop", "player two roster becomes active")
	t.expect_eq(battle.sidebar.row_for(&"p1_sloop"), null, "player one roster lookup is retired on handoff")


func test_multiple_targets_and_attack(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle := await _add_close_battle(tree, packed, true)
	if not battle.state is FleetBattleState:
		battle.queue_free()
		await tree.process_frame
		return

	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var attacker: FleetShipState = _ship(fleet_state, &"p1_frigate")
	var first_target: FleetShipState = _ship(fleet_state, &"p2_sloop")
	var second_target: FleetShipState = _ship(fleet_state, &"p2_frigate")
	battle.handle_roster_selection(attacker.ship_id)
	t.expect_eq(
		battle.highlights.target_cells,
		[Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1)],
		"selection highlights every legal target"
	)
	battle.handle_cell_hover(first_target.cell)
	t.expect_eq(
		battle.highlights.hovered_target_cell,
		first_target.cell,
		"hover strengthens the selected target cue"
	)
	t.expect_eq(
		battle.sidebar.message_label.text,
		"Attack Sloop · 1 damage",
		"target hover shows target class and exact damage"
	)
	battle.handle_cell_hover(Vector2i(0, 0))
	t.expect_false(battle.highlights.has_hovered_target, "leaving a target clears its stronger cue")

	var hull_before := first_target.hull
	await battle.handle_cell_click(first_target.cell)
	t.expect_eq(first_target.hull, hull_before - 1, "enemy click attacks the explicit stable-ID target")
	t.expect_eq(second_target.hull, second_target.definition.max_hull, "non-target enemy remains undamaged")
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.TWO,
		"attack completes the activation"
	)
	battle.queue_free()
	await tree.process_frame


func test_used_and_sunk_selection_feedback(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var viewport := SubViewport.new()
	viewport.size = Vector2i(1280, 720)
	tree.root.add_child(viewport)
	var battle: BattleScreen = packed.instantiate()
	battle.map_definition = load(CLOSE_MAP_PATH)
	battle.skip_animations = true
	viewport.add_child(battle)
	await tree.process_frame
	if not battle.state is FleetBattleState:
		viewport.queue_free()
		await tree.process_frame
		return

	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	await _attack_ship(battle, &"p1_galleon", &"p2_sloop")
	var sunk: FleetShipState = _ship(fleet_state, &"p2_sloop")
	var player_before: int = fleet_state.active_player
	var sunk_row: FleetRosterRow = battle.sidebar.row_for(sunk.ship_id)
	t.expect_false(sunk_row.disabled, "sunk roster row accepts a real pointer attempt")
	t.expect_eq(sunk_row.focus_mode, Control.FOCUS_NONE, "sunk roster row remains non-focusable")
	await _click_control(tree, sunk_row)
	t.expect_eq(battle.state.selected_ship(), null, "sunk row click leaves rules selection unchanged")
	t.expect_eq(battle.state.active_player, player_before, "sunk row click leaves player unchanged")
	t.expect_eq(battle.sidebar.message_label.text, "Ship has sunk", "sunk row click shows exact rules rejection")

	await _end_ship_activation(tree, battle, &"p2_frigate")
	var used: FleetShipState = _ship(fleet_state, &"p1_galleon")
	player_before = fleet_state.active_player
	var used_row: FleetRosterRow = battle.sidebar.row_for(used.ship_id)
	t.expect_false(used_row.disabled, "used roster row accepts a real pointer attempt")
	t.expect_eq(used_row.focus_mode, Control.FOCUS_NONE, "used roster row remains non-focusable")
	await _click_control(tree, used_row)
	t.expect_eq(battle.state.selected_ship(), null, "used row click leaves rules selection unchanged")
	t.expect_eq(battle.state.active_player, player_before, "used row click leaves player unchanged")
	t.expect_eq(
		battle.sidebar.message_label.text,
		"Ship already activated",
		"used row click shows exact rules rejection"
	)
	viewport.queue_free()
	await tree.process_frame


func test_invalid_map_export_locks_without_partial_fleet(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle = packed.instantiate()
	battle.map_definition = MapDefinition.new()
	await _add_invalid_battle_without_expected_error_output(tree, battle)
	t.expect_true(battle.input_locked, "invalid map export locks battlefield input")
	t.expect_true(battle.sidebar.end_turn_button.disabled, "invalid map disables activation completion")
	t.expect_true(battle.ship_views.is_empty(), "invalid map spawns no ship views")
	t.expect_eq(battle.ship_container.get_child_count(), 0, "invalid map spawns no partial fleet nodes")
	t.expect_true(battle.state.fleets.is_empty(), "invalid map creates no partial rules fleets")
	t.expect_eq(
		battle.sidebar.message_label.text,
		"Invalid battlefield data",
		"invalid map reports setup failure in the real sidebar"
	)
	battle.queue_free()
	await tree.process_frame


func test_invalid_ship_definitions_lock_without_partial_fleet(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle = packed.instantiate()
	var sloop: ShipDefinition = load("res://resources/ships/sloop.tres")
	var invalid_definitions: Array[ShipDefinition] = [
		sloop,
		sloop,
		load("res://resources/ships/galleon.tres"),
	]
	battle.ship_definitions = invalid_definitions
	await _add_invalid_battle_without_expected_error_output(tree, battle)
	t.expect_true(battle.input_locked, "invalid ship definitions lock battlefield input")
	t.expect_true(battle.sidebar.end_turn_button.disabled, "invalid ship definitions disable activation completion")
	t.expect_true(battle.tile_map.get_used_cells().is_empty(), "invalid ship definitions do not build map tiles")
	t.expect_true(battle.ship_views.is_empty(), "invalid ship definitions spawn no ship views")
	t.expect_eq(
		battle.ship_container.get_child_count(),
		0,
		"invalid ship definitions spawn no partial fleet nodes"
	)
	t.expect_true(battle.state.fleets.is_empty(), "invalid ship definitions create no partial rules fleets")
	t.expect_eq(
		battle.sidebar.message_label.text,
		"Invalid battlefield data",
		"invalid ship definitions report setup failure in the real sidebar"
	)
	battle.queue_free()
	await tree.process_frame


func test_invalid_authored_ship_profiles_lock_without_spawning(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	for case in _invalid_authored_definition_cases():
		var battle = packed.instantiate()
		battle.ship_definitions = case.definitions
		await _add_invalid_battle_without_expected_error_output(tree, battle)
		var case_name: String = case.name
		t.expect_true(battle.input_locked, "%s locks battlefield input" % case_name)
		t.expect_true(battle.sidebar.end_turn_button.disabled, "%s disables activation completion" % case_name)
		t.expect_true(
			battle.tile_map.get_used_cells().is_empty(),
			"%s does not build map tiles" % case_name
		)
		t.expect_true(battle.ship_views.is_empty(), "%s spawns no ship views" % case_name)
		t.expect_eq(
			battle.ship_container.get_child_count(),
			0,
			"%s spawns no partial fleet nodes" % case_name
		)
		t.expect_true(battle.state.fleets.is_empty(), "%s creates no partial rules fleets" % case_name)
		t.expect_eq(
			battle.sidebar.message_label.text,
			"Invalid battlefield data",
			"%s shows approved invalid-data copy" % case_name
		)
		battle.queue_free()
		await tree.process_frame


func test_real_movement_locks_during_animation(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle = packed.instantiate()
	battle.skip_animations = false
	tree.root.add_child(battle)
	await tree.process_frame
	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var sloop: FleetShipState = _ship(fleet_state, &"p1_sloop")
	await battle.handle_cell_click(sloop.cell)
	var destination := _adjacent_reachable_cell(fleet_state)
	t.expect_true(destination != sloop.cell, "real animation fixture has an adjacent destination")
	if destination == sloop.cell:
		battle.queue_free()
		await tree.process_frame
		return

	battle.handle_cell_click(destination)
	t.expect_true(battle.input_locked, "real movement locks input while presentation is in flight")
	battle.handle_roster_selection(&"p1_galleon")
	t.expect_eq(
		fleet_state.selected_ship_id,
		&"p1_sloop",
		"in-flight input cannot replace the authoritative selection"
	)
	await tree.create_timer(1.0).timeout
	t.expect_false(battle.input_locked, "nonterminal movement unlocks input after presentation")
	t.expect_eq(sloop.cell, destination, "awaited movement commits through fleet rules")
	t.expect_eq(
		battle.ship_views[&"p1_sloop"].position,
		battle.tile_map.map_to_local(destination),
		"animated stable-ID view finishes at the authoritative destination"
	)
	battle.queue_free()
	await tree.process_frame


func test_animated_sinking_owns_its_lock_and_restores_transform(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle := await _add_close_battle(tree, packed, false)
	var target_view: ShipView = battle.ship_views[&"p2_sloop"]
	battle.handle_roster_selection(&"p1_galleon")
	battle.handle_cell_click(_ship(battle.state, &"p2_sloop").cell)
	var sinking_started := false
	for _attempt in 40:
		await tree.create_timer(0.02).timeout
		if (
			battle.animator.get_child_count() > 0
			and target_view.scale.y < 0.9
			and target_view.modulate.a < 0.9
		):
			sinking_started = true
			break
	t.expect_true(battle.input_locked, "lethal presentation keeps input locked during sinking")
	t.expect_true(sinking_started, "animated sinking reaches its visible presentation state")
	t.expect_true(
		battle.animator.get_child_count() > 0,
		"animated sinking draws a temporary water ring under the animator"
	)
	t.expect_true(target_view.scale.y < 0.9, "animated sinking compresses the target silhouette")
	t.expect_true(target_view.modulate.a < 0.9, "animated sinking fades the target silhouette")

	for _attempt in 40:
		if not target_view.visible:
			break
		await tree.create_timer(0.02).timeout
	t.expect_false(target_view.visible, "animated sunk view leaves the map before the handoff ends")
	t.expect_eq(target_view.scale, Vector2.ONE, "sinking restores scale after hiding the view")
	t.expect_eq(target_view.rotation, 0.0, "sinking restores rotation after hiding the view")
	for _attempt in 80:
		if not battle.input_locked:
			break
		await tree.create_timer(0.02).timeout
	t.expect_false(battle.input_locked, "sinking and handoff release input only after presentation")
	t.expect_false(target_view.visible, "post-presentation refresh preserves sunk visibility")
	battle.queue_free()
	await tree.process_frame


func test_complete_match_and_play_again(
	t: TestContext,
	tree: SceneTree,
	packed: PackedScene
) -> void:
	var battle := await _add_close_battle(tree, packed, true)
	var close_map: MapDefinition = battle.map_definition
	t.expect_eq(close_map.all_cells().size(), 127, "close match fixture preserves radius-six cells")
	t.expect_true(close_map.blocked_cells.is_empty(), "close match fixture has no blocked cells")
	t.expect_eq(battle.tile_map.get_used_cells().size(), 127, "close fixture passes scene validation")
	t.expect_eq(
		battle.state.board.distance(
			_ship(battle.state, &"p1_galleon").cell,
			_ship(battle.state, &"p2_sloop").cell
		),
		2,
		"close fixture authors the galleon exactly range two from the sloop"
	)

	await _attack_ship(battle, &"p1_galleon", &"p2_sloop")
	t.expect_eq(
		battle.state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull,
		0,
		"galleon sinks sloop"
	)
	t.expect_false(battle.ship_views[&"p2_sloop"].visible, "sunk view leaves map")
	t.expect_eq(
		battle.sidebar.row_for(&"p2_sloop").status_label.text,
		"SUNK",
		"roster preserves sunk state"
	)

	await _end_ship_activation(tree, battle, &"p2_frigate")
	await _attack_ship(battle, &"p1_frigate", &"p2_frigate")
	await _end_ship_activation(tree, battle, &"p2_galleon")
	await _attack_ship(battle, &"p1_sloop", &"p2_galleon")
	t.expect_eq(battle.state.round_number, 2, "five surviving activations complete round one")
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.TWO,
		"round two alternates initiative to player two"
	)
	t.expect_eq(
		_turn_banner_label(battle).text,
		"ROUND 2 · PLAYER 2 INITIATIVE",
		"round-two banner presents alternating initiative"
	)
	t.expect_false(_turn_banner(battle).visible, "skip mode hides round banner without a timer")

	await _end_ship_activation(tree, battle, &"p2_frigate")
	await _attack_ship(battle, &"p1_galleon", &"p2_frigate")
	await _end_ship_activation(tree, battle, &"p2_galleon")
	var banner_before_unmatched := _turn_banner_label(battle).text
	await _attack_ship(battle, &"p1_frigate", &"p2_frigate")
	t.expect_false(battle.ship_views[&"p2_frigate"].visible, "second sunk view leaves map")
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.ONE,
		"player one keeps the unmatched activation"
	)
	t.expect_eq(
		_turn_banner_label(battle).text,
		banner_before_unmatched,
		"unmatched consecutive activation shows no misleading opponent banner"
	)
	await _attack_ship(battle, &"p1_sloop", &"p2_galleon")
	t.expect_eq(battle.state.round_number, 3, "unmatched completion starts round three")
	t.expect_eq(
		_turn_banner_label(battle).text,
		"ROUND 3 · PLAYER 1 INITIATIVE",
		"round-three banner alternates initiative back to player one"
	)

	await _attack_ship(battle, &"p1_galleon", &"p2_galleon")
	await _end_ship_activation(tree, battle, &"p2_galleon")
	await _attack_ship(battle, &"p1_frigate", &"p2_galleon")
	await _attack_ship(battle, &"p1_sloop", &"p2_galleon")
	t.expect_eq(_ship(battle.state, &"p2_sloop").hull, 0, "player two sloop stays sunk")
	t.expect_eq(_ship(battle.state, &"p2_frigate").hull, 0, "player two frigate sinks")
	t.expect_eq(_ship(battle.state, &"p2_galleon").hull, 0, "player two galleon sinks")
	t.expect_eq(battle.state.winner, FleetBattleState.Player.ONE, "complete match records player one")
	t.expect_eq(battle.state.round_number, 3, "victory emits no extra round start")
	t.expect_eq(battle.sidebar.round_label.text, "ROUND 3", "victory preserves the terminal round")
	t.expect_true(_result_overlay(battle).visible, "victory shows the result overlay")
	t.expect_eq(_result_label(battle).text, "PLAYER 1 WINS", "winner overlay copy is exact")
	t.expect_true(battle.input_locked, "victory locks battlefield input")
	battle.handle_ship_selection(&"p1_galleon")
	t.expect_eq(battle.state.selected_ship(), null, "terminal input cannot select another ship")

	var stale_ring := Line2D.new()
	battle.animator.add_child(stale_ring)
	var stale_sunk_view: ShipView = battle.ship_views[&"p2_sloop"]
	stale_sunk_view.scale = Vector2(0.75, 0.15)
	stale_sunk_view.rotation = 0.3
	stale_sunk_view.modulate.a = 0.0
	battle.sidebar.play_again_pressed.emit()
	await tree.process_frame
	t.expect_eq(battle.animator.get_child_count(), 0, "Play Again clears transient animator children")
	t.expect_false(_result_overlay(battle).visible, "Play Again hides the result overlay")
	t.expect_false(_turn_banner(battle).visible, "Play Again hides every handoff banner")
	t.expect_false(battle.input_locked, "Play Again unlocks battlefield input")
	t.expect_eq(battle.state.round_number, 1, "Play Again restores round one")
	t.expect_eq(
		battle.state.active_player,
		FleetBattleState.Player.ONE,
		"Play Again restores player one initiative"
	)
	t.expect_eq(battle.sidebar.message_label.text, "Choose a ready ship", "replay prompt is exact")
	for player in [FleetBattleState.Player.ONE, FleetBattleState.Player.TWO]:
		var ships: Array[FleetShipState] = battle.state.fleets[player].ordered_ships()
		for index in ships.size():
			var ship := ships[index]
			var view: ShipView = battle.ship_views[ship.ship_id]
			t.expect_eq(ship.cell, CLOSE_STARTS[player][index], "replay restores %s cell" % ship.ship_id)
			t.expect_eq(ship.hull, ship.definition.max_hull, "replay restores %s hull" % ship.ship_id)
			t.expect_true(view.visible, "replay restores %s visibility" % ship.ship_id)
			t.expect_eq(view.hull, ship.definition.max_hull, "replay refreshes %s view hull" % ship.ship_id)
			t.expect_eq(
				view.position,
				battle.tile_map.map_to_local(CLOSE_STARTS[player][index]),
				"replay restores %s authored position" % ship.ship_id
			)
			t.expect_eq(view.scale, Vector2.ONE, "replay restores %s scale" % ship.ship_id)
			t.expect_eq(view.rotation, 0.0, "replay restores %s rotation" % ship.ship_id)
			t.expect_eq(view.modulate.a, 1.0, "replay restores %s opacity" % ship.ship_id)
	for ship_id in [&"p1_sloop", &"p1_frigate", &"p1_galleon"]:
		t.expect_eq(
			battle.sidebar.row_for(ship_id).status_label.text,
			"READY",
			"replay restores %s roster readiness" % ship_id
		)
	battle.queue_free()
	await tree.process_frame


func _add_invalid_battle_without_expected_error_output(
	tree: SceneTree,
	battle: BattleScreen
) -> void:
	var previous_error_output := Engine.print_error_messages
	Engine.print_error_messages = false
	tree.root.add_child(battle)
	await tree.process_frame
	Engine.print_error_messages = previous_error_output


func _add_close_battle(
	tree: SceneTree,
	packed: PackedScene,
	skip: bool
) -> BattleScreen:
	var battle: BattleScreen = packed.instantiate()
	battle.map_definition = load(CLOSE_MAP_PATH)
	battle.skip_animations = skip
	tree.root.add_child(battle)
	await tree.process_frame
	return battle


func _invalid_authored_definition_cases() -> Array[Dictionary]:
	var wrong_ids := _clone_definitions()
	wrong_ids[0].class_id = &"cutter"
	wrong_ids[0].visual_profile.icon_code = &"cutter"

	var wrong_order := _clone_definitions()
	var first := wrong_order[0]
	wrong_order[0] = wrong_order[1]
	wrong_order[1] = first

	var null_profile := _clone_definitions()
	null_profile[1].visual_profile = null

	var empty_silhouette := _clone_definitions()
	empty_silhouette[2].visual_profile.hull_points = PackedVector2Array()

	var mismatched_icon := _clone_definitions()
	mismatched_icon[0].visual_profile.icon_code = &"frigate"

	return [
		{"name": "wrong unique class IDs", "definitions": wrong_ids},
		{"name": "wrong class order", "definitions": wrong_order},
		{"name": "null visual profile", "definitions": null_profile},
		{"name": "empty visual silhouette", "definitions": empty_silhouette},
		{"name": "mismatched visual icon identity", "definitions": mismatched_icon},
	]


func _clone_definitions() -> Array[ShipDefinition]:
	var definitions: Array[ShipDefinition] = []
	for path in [
		"res://resources/ships/sloop.tres",
		"res://resources/ships/frigate.tres",
		"res://resources/ships/galleon.tres",
	]:
		var source: ShipDefinition = load(path)
		var definition := source.duplicate() as ShipDefinition
		definition.visual_profile = source.visual_profile.duplicate() as ShipVisualProfile
		definitions.append(definition)
	return definitions


func _click_control(tree: SceneTree, control: Control) -> void:
	var viewport := control.get_viewport()
	var viewport_position := control.get_global_rect().get_center()
	var motion := InputEventMouseMotion.new()
	motion.position = viewport_position
	motion.global_position = viewport_position
	viewport.push_input(motion)
	await tree.process_frame
	for is_pressed in [true, false]:
		var event := InputEventMouseButton.new()
		event.button_index = MOUSE_BUTTON_LEFT
		event.pressed = is_pressed
		event.button_mask = MOUSE_BUTTON_MASK_LEFT if is_pressed else 0
		event.position = viewport_position
		event.global_position = viewport_position
		viewport.push_input(event)
		await tree.process_frame


func _attack_ship(
	battle: BattleScreen,
	attacker_id: StringName,
	target_id: StringName
) -> void:
	battle.handle_roster_selection(attacker_id)
	await battle.handle_cell_click(_ship(battle.state, target_id).cell)


func _end_ship_activation(
	tree: SceneTree,
	battle: BattleScreen,
	ship_id: StringName
) -> void:
	battle.handle_roster_selection(ship_id)
	battle.sidebar.end_turn_pressed.emit()
	await tree.process_frame


func _turn_banner(battle: BattleScreen) -> Control:
	return battle.get_node("OverlayLayer/TurnBanner") as Control


func _turn_banner_label(battle: BattleScreen) -> Label:
	return battle.get_node("OverlayLayer/TurnBanner/BannerPanel/BannerLabel") as Label


func _result_overlay(battle: BattleScreen) -> Control:
	return battle.get_node("OverlayLayer/ResultOverlay") as Control


func _result_label(battle: BattleScreen) -> Label:
	return battle.get_node(
		"OverlayLayer/ResultOverlay/Center/ResultPanel/ResultContent/ResultLabel"
	) as Label


func _adjacent_reachable_cell(state: FleetBattleState) -> Vector2i:
	var selected := state.selected_ship()
	for cell in state.reachable_cells():
		if state.board.distance(selected.cell, cell) == 1:
			return cell
	return selected.cell


func _ship(state: FleetBattleState, ship_id: StringName) -> FleetShipState:
	var player := FleetBattleState.Player.ONE if str(ship_id).begins_with("p1_") else FleetBattleState.Player.TWO
	return state.fleets[player].ship(ship_id)


func _target_cells(state: FleetBattleState) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	for target in state.legal_targets():
		cells.append(target.cell)
	return cells


func _map_local_bounds(battle: BattleScreen) -> Rect2:
	var half_tile := Vector2(battle.tile_map.tile_set.tile_size) * 0.5
	var first_center := battle.tile_map.map_to_local(battle.map_definition.all_cells()[0])
	var bounds := Rect2(first_center - half_tile, half_tile * 2.0)
	for cell in battle.map_definition.all_cells():
		var center := battle.tile_map.map_to_local(cell)
		bounds = bounds.expand(center - half_tile)
		bounds = bounds.expand(center + half_tile)
	return bounds
