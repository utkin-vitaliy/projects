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
	await test_real_movement_locks_during_animation(t, tree, packed)


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
	var battle = packed.instantiate()
	battle.skip_animations = true
	tree.root.add_child(battle)
	await tree.process_frame
	if not battle.state is FleetBattleState:
		battle.queue_free()
		await tree.process_frame
		return

	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var attacker: FleetShipState = _ship(fleet_state, &"p1_frigate")
	var first_target: FleetShipState = _ship(fleet_state, &"p2_sloop")
	var second_target: FleetShipState = _ship(fleet_state, &"p2_frigate")
	first_target.cell = Vector2i(-1, 5)
	second_target.cell = Vector2i(1, 5)
	battle.refresh_from_state()
	battle.handle_roster_selection(attacker.ship_id)
	t.expect_eq(
		battle.highlights.target_cells,
		[Vector2i(-1, 5), Vector2i(1, 5)],
		"selection highlights every legal target"
	)
	battle.handle_cell_hover(first_target.cell)
	t.expect_eq(
		battle.highlights.hovered_target_cell,
		first_target.cell,
		"hover strengthens the selected target cue"
	)
	t.expect_eq(battle.sidebar.message_label.text, "Attack · 1 damage", "target hover shows exact damage")
	battle.handle_cell_hover(Vector2i(0, 5))
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
	var battle = packed.instantiate()
	battle.skip_animations = true
	tree.root.add_child(battle)
	await tree.process_frame
	if not battle.state is FleetBattleState:
		battle.queue_free()
		await tree.process_frame
		return

	var fleet_state: FleetBattleState = battle.get("state") as FleetBattleState
	var used: FleetShipState = _ship(fleet_state, &"p1_sloop")
	used.activation_used = true
	var player_before: int = fleet_state.active_player
	await battle.handle_cell_click(used.cell)
	t.expect_eq(battle.state.selected_ship(), null, "used ship selection leaves rules selection unchanged")
	t.expect_eq(battle.state.active_player, player_before, "used ship selection leaves player unchanged")
	t.expect_eq(battle.sidebar.message_label.text, "Ship already activated", "used ship feedback is exact")

	var sunk: FleetShipState = _ship(fleet_state, &"p1_galleon")
	sunk.hull = 0
	battle.refresh_from_state()
	battle.handle_ship_selection(sunk.ship_id)
	t.expect_eq(battle.state.selected_ship(), null, "sunk ship selection leaves rules selection unchanged")
	t.expect_eq(battle.state.active_player, player_before, "sunk ship selection leaves player unchanged")
	t.expect_eq(battle.sidebar.message_label.text, "Ship has sunk", "sunk ship feedback is exact")
	battle.queue_free()
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
		"Invalid fleet battle setup",
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
	t.expect_true(battle.ship_views.is_empty(), "invalid ship definitions spawn no ship views")
	t.expect_eq(
		battle.ship_container.get_child_count(),
		0,
		"invalid ship definitions spawn no partial fleet nodes"
	)
	t.expect_true(battle.state.fleets.is_empty(), "invalid ship definitions create no partial rules fleets")
	t.expect_eq(
		battle.sidebar.message_label.text,
		"Invalid fleet battle setup",
		"invalid ship definitions report setup failure in the real sidebar"
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


func _add_invalid_battle_without_expected_error_output(
	tree: SceneTree,
	battle: BattleScreen
) -> void:
	var previous_error_output := Engine.print_error_messages
	Engine.print_error_messages = false
	tree.root.add_child(battle)
	await tree.process_frame
	Engine.print_error_messages = previous_error_output


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
