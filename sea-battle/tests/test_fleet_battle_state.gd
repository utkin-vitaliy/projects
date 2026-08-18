extends RefCounted

const CLASS_PATHS := [
	"res://resources/ships/sloop.tres",
	"res://resources/ships/frigate.tres",
	"res://resources/ships/galleon.tres",
]
const AXIAL_DIRECTIONS: Array[Vector2i] = [
	Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1),
	Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, 1),
]
const DEFAULT_STARTS := {
	1: [Vector2i(-3, 3), Vector2i(-2, 3), Vector2i(-1, 3)],
	2: [Vector2i(3, -3), Vector2i(2, -3), Vector2i(1, -3)],
}
const COMBAT_STARTS := {
	1: [Vector2i(-2, 0), Vector2i(-2, 1), Vector2i(-1, 0)],
	2: [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1)],
}


func run(t: TestContext, _tree: SceneTree) -> void:
	test_rejects_invalid_setup_without_partial_state(t)
	test_aggregates_null_board_and_invalid_start_type(t)
	test_empty_board_reports_starts_outside_map(t)
	test_selects_any_ready_active_ship(t)
	test_rejects_enemy_used_and_sunk_ships(t)
	test_moves_once_around_all_occupants(t)
	test_alternates_players_with_ready_ships(t)
	test_allows_unmatched_consecutive_activations(t)
	test_alternates_round_initiative(t)
	test_attack_without_moving_targets_explicit_enemy(t)
	test_rejects_friendly_sunk_and_out_of_range_targets(t)
	test_attack_ends_activation_and_forbids_later_movement(t)
	test_galleon_sinks_full_health_sloop(t)
	test_sunk_ship_stops_occupying_cell(t)
	test_last_enemy_ship_wins_immediately(t)
	test_reset_restores_round_one(t)


func test_rejects_invalid_setup_without_partial_state(t: TestContext) -> void:
	var state := FleetBattleState.new()
	var definitions := load_definitions()
	var invalid_definitions: Array[ShipDefinition] = [definitions[0], definitions[0], null]
	var missing_board_errors := state.setup(null, invalid_definitions, {
		FleetBattleState.Player.ONE: [Vector2i.ZERO, Vector2i.ZERO],
		FleetBattleState.Player.TWO: [Vector2i.ONE, Vector2i(2, 0), Vector2i(3, 0)],
	})
	t.expect_eq(missing_board_errors, [
		&"board_missing",
		&"definition_missing",
		&"incorrect_fleet_size",
		&"duplicate_class",
		&"duplicate_start",
	], "setup aggregates configuration errors in deterministic order")
	t.expect_true(state.fleets.is_empty(), "invalid first setup creates no partial fleets")

	var board := make_board([Vector2i.ZERO])
	var invalid_start_errors := state.setup(board, definitions, {
		FleetBattleState.Player.ONE: [Vector2i.ZERO, Vector2i(0, 1), Vector2i(0, 1)],
		FleetBattleState.Player.TWO: [Vector2i(9, 9), Vector2i(2, -2), Vector2i(3, -3)],
	})
	t.expect_eq(invalid_start_errors, [
		&"duplicate_start",
		&"start_outside_map",
		&"start_blocked",
	], "start validation preserves duplicate outside blocked order")
	t.expect_true(state.fleets.is_empty(), "invalid starts create no partial fleets")
	var invalid_start_type_errors := state.setup(board, definitions, {
		FleetBattleState.Player.ONE: [&"not_a_cell", Vector2i(0, 1), Vector2i(1, 0)],
		FleetBattleState.Player.TWO: [Vector2i(3, -3), Vector2i(2, -3), Vector2i(1, -3)],
	})
	t.expect_eq(invalid_start_type_errors, [&"start_outside_map"], "non-cell start is rejected at setup boundary")
	t.expect_true(state.fleets.is_empty(), "invalid start type creates no partial fleets")

	var valid_errors := state.setup(board, definitions, DEFAULT_STARTS)
	t.expect_eq(valid_errors, [], "valid setup has no errors")
	var original_fleets := state.fleets
	var original_board := state.board
	var errors_after_valid := state.setup(null, definitions, DEFAULT_STARTS)
	t.expect_eq(errors_after_valid, [&"board_missing"], "later invalid setup still reports its error")
	t.expect_true(state.fleets == original_fleets, "failed reconfiguration preserves existing fleets")
	t.expect_true(state.board == original_board, "failed reconfiguration preserves existing board")


func test_aggregates_null_board_and_invalid_start_type(t: TestContext) -> void:
	var state := FleetBattleState.new()
	var errors := state.setup(null, load_definitions(), {
		FleetBattleState.Player.ONE: [&"not_a_cell", Vector2i(0, 1), Vector2i(1, 0)],
		FleetBattleState.Player.TWO: [Vector2i(3, -3), Vector2i(2, -3), Vector2i(1, -3)],
	})
	t.expect_eq(errors, [
		&"board_missing",
		&"start_outside_map",
	], "null board still aggregates malformed start classification")
	t.expect_true(state.fleets.is_empty(), "combined null-board setup creates no fleets")


func test_empty_board_reports_starts_outside_map(t: TestContext) -> void:
	var state := FleetBattleState.new()
	var empty_board := HexBoard.new()
	var errors := state.setup(empty_board, load_definitions(), DEFAULT_STARTS)
	t.expect_eq(errors, [&"start_outside_map"], "non-null empty board is not classified as missing")
	t.expect_true(state.fleets.is_empty(), "empty-board setup creates no fleets")


func test_selects_any_ready_active_ship(t: TestContext) -> void:
	var state := make_state()
	var ship: FleetShipState = state.fleets[FleetBattleState.Player.ONE].ship(&"p1_frigate")
	ship.movement_used = true
	ship.attack_used = true
	var result := state.select_ship(&"p1_frigate")
	t.expect_true(result.ok, "any ready active ship can be selected")
	t.expect_true(state.selected_ship() == ship, "selected ship query returns stable fleet ship")
	t.expect_false(ship.movement_used, "selection resets selected ship movement action")
	t.expect_false(ship.attack_used, "selection resets selected ship attack action")
	t.expect_eq(event_types(result.events), [&"ship_selected"], "selection emits one typed event")
	t.expect_eq(result.events[0].data, {
		"ship_id": &"p1_frigate",
		"player": FleetBattleState.Player.ONE,
	}, "selection event carries exact stable identity payload")

	var cancelled := state.cancel_selection()
	t.expect_true(cancelled.ok, "uncommitted selection can be cancelled")
	t.expect_eq(event_types(cancelled.events), [&"selection_cancelled"], "cancel emits one typed event")
	t.expect_eq(cancelled.events[0].data, {"ship_id": &"p1_frigate"}, "cancel identifies selected ship")
	t.expect_eq(state.selected_ship(), null, "cancel clears selected ship")


func test_rejects_enemy_used_and_sunk_ships(t: TestContext) -> void:
	var state := make_state()
	state.winner = FleetBattleState.Player.ONE
	t.expect_eq(state.select_ship(&"missing").reason, &"game_over", "game over precedes invalid target")
	state.winner = 0
	t.expect_eq(state.select_ship(&"missing").reason, &"invalid_target", "unknown ID is an invalid target")

	var enemy: FleetShipState = state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop")
	enemy.activation_used = true
	t.expect_eq(state.select_ship(enemy.ship_id).reason, &"inactive_player", "enemy precedes used rejection")
	enemy.hull = 0
	t.expect_eq(state.select_ship(enemy.ship_id).reason, &"ship_sunk", "sunk precedes enemy rejection")

	var active_ship: FleetShipState = state.fleets[FleetBattleState.Player.ONE].ship(&"p1_sloop")
	active_ship.activation_used = true
	t.expect_eq(state.select_ship(active_ship.ship_id).reason, &"ship_already_used", "used active ship is rejected")
	active_ship.hull = 0
	t.expect_eq(state.select_ship(active_ship.ship_id).reason, &"ship_sunk", "sunk precedes used rejection")
	t.expect_eq(state.selected_ship(), null, "rejected selections do not change selection")


func test_moves_once_around_all_occupants(t: TestContext) -> void:
	var starts := {
		FleetBattleState.Player.ONE: [Vector2i(-2, 0), Vector2i(-1, 0), Vector2i(0, -2)],
		FleetBattleState.Player.TWO: [Vector2i(2, 0), Vector2i(1, 0), Vector2i(0, 2)],
	}
	var state := make_state(starts)
	state.select_ship(&"p1_sloop")
	var occupied := state.occupied_cells(&"p1_sloop")
	for occupied_cell in occupied:
		t.expect_false(state.reachable_cells().has(occupied_cell), "reachable cells exclude every other living ship")

	var result := state.move_selected_ship(Vector2i(0, 0))
	t.expect_true(result.ok, "selected ship routes around occupied direct path")
	t.expect_eq(event_types(result.events), [&"ship_moved"], "move emits one typed event")
	t.expect_eq(result.events[0].data.keys(), ["ship_id", "player", "path"], "move event has exact payload keys")
	t.expect_eq(result.events[0].data.ship_id, &"p1_sloop", "move event carries stable ship ID")
	t.expect_eq(result.events[0].data.player, FleetBattleState.Player.ONE, "move event carries owner")
	var route: Array = result.events[0].data.path
	t.expect_eq(route.front(), Vector2i(-2, 0), "validated path begins at moving origin")
	t.expect_eq(route.back(), Vector2i(0, 0), "validated path ends at destination")
	for occupied_cell in occupied:
		t.expect_false(route.has(occupied_cell), "validated path avoids every living occupant")
	t.expect_eq(state.selected_ship().cell, Vector2i(0, 0), "move updates authoritative cell")
	var reselected := state.select_ship(&"p1_sloop")
	t.expect_eq(reselected.reason, &"action_committed", "reselection cannot reset a committed move")

	var second_move := state.move_selected_ship(Vector2i(0, 1))
	t.expect_eq(second_move.reason, &"movement_used", "ship cannot move twice in one activation")
	var committed_cancel := state.cancel_selection()
	t.expect_eq(committed_cancel.reason, &"action_committed", "committed movement cannot be cancelled")


func test_alternates_players_with_ready_ships(t: TestContext) -> void:
	var state := make_state()
	state.select_ship(&"p1_sloop")
	var first := state.end_activation()
	t.expect_eq(event_types(first.events), [&"activation_completed", &"player_changed"], "normal activation emits completion before player change")
	t.expect_eq(first.events[0].data, {
		"ship_id": &"p1_sloop",
		"player": FleetBattleState.Player.ONE,
	}, "completion carries activated ship identity")
	t.expect_eq(first.events[1].data, {"player": FleetBattleState.Player.TWO}, "player change carries next player")
	t.expect_eq(state.active_player, FleetBattleState.Player.TWO, "opponent receives next activation")
	t.expect_eq(state.selected_ship(), null, "activation completion clears selection")

	state.select_ship(&"p2_galleon")
	var second := state.end_activation()
	t.expect_eq(event_types(second.events), [&"activation_completed", &"player_changed"], "opponent activation returns control")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "player one receives following activation")


func test_allows_unmatched_consecutive_activations(t: TestContext) -> void:
	var state := make_state()
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_frigate").hull = 0
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_galleon").hull = 0
	complete_ship(state, &"p1_sloop")
	complete_ship(state, &"p2_sloop")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "player one resumes after player two's only activation")

	var first_unmatched := complete_ship(state, &"p1_frigate")
	t.expect_eq(event_types(first_unmatched.events), [&"activation_completed"], "unmatched activation stays with same player without change event")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "same player keeps consecutive unmatched activation")
	var second_unmatched := complete_ship(state, &"p1_galleon")
	t.expect_eq(event_types(second_unmatched.events), [&"activation_completed", &"round_started"], "last unmatched activation starts the next round")
	t.expect_eq(second_unmatched.events[1].data, {
		"round": 2,
		"player": FleetBattleState.Player.TWO,
	}, "round event carries alternating initiative")


func test_alternates_round_initiative(t: TestContext) -> void:
	var state := make_state()
	var round_two_events := complete_round(state)
	t.expect_eq(event_types(round_two_events), [&"activation_completed", &"round_started"], "sixth activation starts a round")
	t.expect_eq(state.round_number, 2, "six activations complete round one")
	t.expect_eq(state.round_starter, FleetBattleState.Player.TWO, "player two starts round two")
	t.expect_eq(state.active_player, FleetBattleState.Player.TWO, "round two activates its starter")
	t.expect_eq(state.active_fleet().ready_ships().size(), 3, "round reset restores active fleet readiness")
	t.expect_eq(state.opposing_fleet().ready_ships().size(), 3, "round reset restores opposing fleet readiness")

	var round_three_events := complete_round(state)
	t.expect_eq(event_types(round_three_events), [&"activation_completed", &"round_started"], "second sixth activation starts another round")
	t.expect_eq(state.round_number, 3, "six more activations complete round two")
	t.expect_eq(state.round_starter, FleetBattleState.Player.ONE, "player one starts round three")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "round three activates its starter")


func test_attack_without_moving_targets_explicit_enemy(t: TestContext) -> void:
	var state := make_state(COMBAT_STARTS, [Vector2i(0, 0)])
	state.select_ship(&"p1_galleon")
	t.expect_eq(ship_ids(state.legal_targets()), [
		&"p2_sloop",
		&"p2_frigate",
		&"p2_galleon",
	], "legal targets preserve opposing fleet class order")
	t.expect_true(state.can_attack(&"p2_frigate"), "geometric range ignores blocked terrain")

	var result := state.attack(&"p2_frigate")
	t.expect_true(result.ok, "selected ship attacks an explicit enemy without moving")
	t.expect_eq(state.fleets[FleetBattleState.Player.TWO].ship(&"p2_frigate").hull, 2, "heavy attack deals its fixed two damage")
	t.expect_eq(state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull, 2, "non-target enemy remains undamaged")
	t.expect_eq(event_types(result.events), [
		&"ship_attacked",
		&"ship_damaged",
		&"activation_completed",
		&"player_changed",
	], "nonlethal attack completes activation before player change")
	t.expect_eq(result.events[0].data, {
		"attacker_id": &"p1_galleon",
		"target_id": &"p2_frigate",
	}, "attack event identifies both ships")
	t.expect_eq(result.events[1].data, {
		"ship_id": &"p2_frigate",
		"hull": 2,
		"max_hull": 4,
		"damage": 2,
	}, "damage event reports fixed damage and resulting hull")


func test_rejects_friendly_sunk_and_out_of_range_targets(t: TestContext) -> void:
	var state := make_state()
	t.expect_eq(ship_ids(state.legal_targets()), [], "no selection has no legal targets")
	var no_selection := state.attack(&"missing")
	t.expect_eq(no_selection.reason, &"selection_required", "selection rejection precedes target lookup")

	state.select_ship(&"p1_sloop")
	var attacker := state.selected_ship()
	var distant_target: FleetShipState = state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop")
	var sunk_target: FleetShipState = state.fleets[FleetBattleState.Player.TWO].ship(&"p2_frigate")
	sunk_target.hull = 0
	var original_player := state.active_player
	var original_selection := state.selected_ship_id
	var original_attacker_hull := attacker.hull
	var original_target_hull := distant_target.hull

	attacker.attack_used = true
	t.expect_eq(state.attack(&"missing").reason, &"attack_used", "spent attack rejection precedes target lookup")
	attacker.attack_used = false
	t.expect_eq(state.attack(&"p1_frigate").reason, &"invalid_target", "friendly ship is not a target")
	t.expect_eq(state.attack(&"p2_frigate").reason, &"invalid_target", "sunk enemy is not a target")
	t.expect_eq(state.attack(&"missing").reason, &"invalid_target", "unknown ship ID is not a target")
	t.expect_eq(state.attack(&"p2_sloop").reason, &"out_of_range", "living distant enemy is out of range")
	t.expect_false(state.can_attack(&"p1_frigate"), "friendly ship cannot be attacked")
	t.expect_false(state.can_attack(&"p2_frigate"), "sunk enemy cannot be attacked")
	t.expect_false(state.can_attack(&"p2_sloop"), "distant enemy cannot be attacked")
	t.expect_eq(ship_ids(state.legal_targets()), [], "friendly sunk and distant ships are absent from legal targets")
	t.expect_eq(state.active_player, original_player, "rejected attacks preserve active player")
	t.expect_eq(state.selected_ship_id, original_selection, "rejected attacks preserve selection")
	t.expect_eq(attacker.hull, original_attacker_hull, "rejected attacks preserve attacker hull")
	t.expect_eq(distant_target.hull, original_target_hull, "rejected attacks preserve target hull")
	t.expect_false(attacker.attack_used, "rejected attacks do not spend attack")
	t.expect_false(attacker.activation_used, "rejected attacks do not spend activation")


func test_attack_ends_activation_and_forbids_later_movement(t: TestContext) -> void:
	var state := make_state(COMBAT_STARTS)
	state.select_ship(&"p1_sloop")
	var attacker := state.selected_ship()
	var result := state.attack(&"p2_galleon")
	t.expect_true(result.ok, "in-range attack succeeds")
	t.expect_true(attacker.attack_used, "attack spends the attack action")
	t.expect_true(attacker.activation_used, "attack completes the ship activation")
	t.expect_eq(state.selected_ship(), null, "attack completion clears selection")
	t.expect_eq(state.active_player, FleetBattleState.Player.TWO, "attack hands control to ready opponent")
	var later_move := state.move_selected_ship(Vector2i(-1, 0))
	t.expect_eq(later_move.reason, &"selection_required", "attacker cannot move after firing")
	t.expect_eq(attacker.cell, Vector2i(-2, 0), "failed later movement preserves attacker cell")


func test_galleon_sinks_full_health_sloop(t: TestContext) -> void:
	var state := make_state(COMBAT_STARTS)
	state.select_ship(&"p1_galleon")
	var result := state.attack(&"p2_sloop")
	t.expect_eq(state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull, 0, "heavy hit sinks light ship")
	t.expect_eq(event_types(result.events).slice(0, 3),
		[&"ship_attacked", &"ship_damaged", &"ship_sunk"],
		"sinking events preserve presentation order")
	t.expect_eq(result.events[1].data, {
		"ship_id": &"p2_sloop",
		"hull": 0,
		"max_hull": 2,
		"damage": 2,
	}, "lethal damage event reports clamped hull and fixed damage")
	t.expect_eq(result.events[2].data, {
		"ship_id": &"p2_sloop",
		"player": FleetBattleState.Player.TWO,
		"cell": Vector2i(1, 0),
	}, "sink event preserves identity owner and cell")
	t.expect_eq(event_types(result.events), [
		&"ship_attacked",
		&"ship_damaged",
		&"ship_sunk",
		&"activation_completed",
		&"player_changed",
	], "nonfinal sinking attack still performs normal handoff")


func test_sunk_ship_stops_occupying_cell(t: TestContext) -> void:
	var state := make_state(COMBAT_STARTS)
	state.select_ship(&"p1_galleon")
	state.attack(&"p2_sloop")
	t.expect_false(state.occupied_cells().has(Vector2i(1, 0)), "sunk ship immediately releases its cell")
	t.expect_false(state.fleets[FleetBattleState.Player.TWO].occupied_cells().has(Vector2i(1, 0)), "fleet occupancy excludes sunk ship")


func test_last_enemy_ship_wins_immediately(t: TestContext) -> void:
	var state := make_state(COMBAT_STARTS)
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull = 1
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_frigate").hull = 0
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_galleon").hull = 0
	state.select_ship(&"p1_galleon")
	var result := state.attack(&"p2_sloop")
	t.expect_eq(event_types(result.events), [
		&"ship_attacked",
		&"ship_damaged",
		&"ship_sunk",
		&"activation_completed",
		&"battle_won",
	], "final kill declares victory before any normal handoff")
	t.expect_eq(result.events[1].data, {
		"ship_id": &"p2_sloop",
		"hull": 0,
		"max_hull": 2,
		"damage": 2,
	}, "overkill damage clamps hull to zero while reporting fixed damage")
	t.expect_eq(result.events[3].data, {
		"ship_id": &"p1_galleon",
		"player": FleetBattleState.Player.ONE,
	}, "winning attack retains standard activation completion payload")
	t.expect_eq(result.events[4].data, {"winner": FleetBattleState.Player.ONE}, "victory event identifies winner")
	t.expect_eq(state.winner, FleetBattleState.Player.ONE, "last enemy ship gives attacker victory")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "victory does not hand control to loser")
	t.expect_eq(state.round_number, 1, "victory does not start a new round")
	t.expect_eq(state.selected_ship(), null, "winning activation clears selection")
	t.expect_eq(state.select_ship(&"p1_sloop").reason, &"game_over", "victory immediately rejects further commands")


func test_reset_restores_round_one(t: TestContext) -> void:
	var state := make_state()
	state.select_ship(&"p1_sloop")
	state.move_selected_ship(Vector2i(-3, 2))
	state.end_activation()
	state.fleets[FleetBattleState.Player.TWO].ship(&"p2_frigate").hull = 1
	state.winner = FleetBattleState.Player.ONE
	state.round_number = 7
	state.round_starter = FleetBattleState.Player.TWO
	var result := state.reset()

	t.expect_eq(event_types(result.events), [&"battle_reset"], "reset emits one typed event")
	t.expect_eq(result.events[0].data, {
		"round": 1,
		"player": FleetBattleState.Player.ONE,
	}, "reset event carries restored round and initiative")
	t.expect_eq(state.active_player, FleetBattleState.Player.ONE, "reset restores player one initiative")
	t.expect_eq(state.round_starter, FleetBattleState.Player.ONE, "reset restores round starter")
	t.expect_eq(state.round_number, 1, "reset restores round one")
	t.expect_eq(state.winner, 0, "reset clears winner")
	t.expect_eq(state.selected_ship(), null, "reset clears selection")
	for player in [FleetBattleState.Player.ONE, FleetBattleState.Player.TWO]:
		var ships: Array[FleetShipState] = state.fleets[player].ordered_ships()
		for index in ships.size():
			var ship: FleetShipState = ships[index]
			t.expect_eq(ship.cell, DEFAULT_STARTS[player][index], "reset restores exact starting cell")
			t.expect_eq(ship.hull, ship.definition.max_hull, "reset restores full hull")
			t.expect_false(ship.activation_used, "reset restores round readiness")
			t.expect_false(ship.movement_used, "reset restores movement action")
			t.expect_false(ship.attack_used, "reset restores attack action")


func load_definitions() -> Array[ShipDefinition]:
	var definitions: Array[ShipDefinition] = []
	for path in CLASS_PATHS:
		var definition: ShipDefinition = load(path)
		definitions.append(definition)
	return definitions


func make_state(
	starts: Dictionary = DEFAULT_STARTS,
	blocked: Array[Vector2i] = []
) -> FleetBattleState:
	var state := FleetBattleState.new()
	var errors := state.setup(make_board(blocked), load_definitions(), starts)
	assert(errors.is_empty(), "Fleet battle test fixture must be valid")
	return state


func make_board(blocked: Array[Vector2i] = []) -> HexBoard:
	var cells: Array[Vector2i] = []
	for q in range(-4, 5):
		for r in range(maxi(-4, -q - 4), mini(4, -q + 4) + 1):
			cells.append(Vector2i(q, r))
	var board := HexBoard.new()
	board.configure(cells, blocked, build_axial_neighbors(cells))
	return board


func build_axial_neighbors(cells: Array[Vector2i]) -> Dictionary:
	var cell_set := {}
	var neighbors := {}
	for cell in cells:
		cell_set[cell] = true
	for cell in cells:
		var adjacent: Array[Vector2i] = []
		for direction in AXIAL_DIRECTIONS:
			if cell_set.has(cell + direction):
				adjacent.append(cell + direction)
		neighbors[cell] = adjacent
	return neighbors


func complete_ship(state: FleetBattleState, ship_id: StringName) -> CommandResult:
	var selected := state.select_ship(ship_id)
	assert(selected.ok, "Test helper must select a legal ready ship")
	var completed := state.end_activation()
	assert(completed.ok, "Test helper must complete a selected activation")
	return completed


func complete_round(state: FleetBattleState) -> Array[BattleEvent]:
	var final_events: Array[BattleEvent] = []
	for activation in range(6):
		var ship: FleetShipState = state.active_fleet().ready_ships()[0]
		var result := complete_ship(state, ship.ship_id)
		if activation == 5:
			final_events = result.events
	return final_events


func event_types(events: Array[BattleEvent]) -> Array[StringName]:
	var types: Array[StringName] = []
	for event in events:
		types.append(event.type)
	return types


func ship_ids(ships: Array[FleetShipState]) -> Array[StringName]:
	var ids: Array[StringName] = []
	for ship in ships:
		ids.append(ship.ship_id)
	return ids
