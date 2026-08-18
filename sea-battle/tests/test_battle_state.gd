extends RefCounted

const SHIP_DEFINITION := preload("res://resources/ships/basic_ship.tres")


func run(t: TestContext, _tree: SceneTree) -> void:
	test_starts_with_player_one(t)
	test_rejects_inactive_player_selection(t)
	test_moves_once_within_allowance(t)
	test_rejects_blocked_and_distant_moves(t)
	test_attack_ends_turn_before_another_move(t)
	test_attack_without_moving(t)
	test_attack_deals_fixed_damage_and_switches_turn(t)
	test_end_turn_switches_player(t)
	test_third_hit_wins_immediately(t)
	test_reset_restores_initial_state(t)


func test_starts_with_player_one(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(4, 0))
	t.expect_eq(state.active_player, BattleState.Player.ONE, "player one starts")
	t.expect_eq(state.turn_number, 1, "first activation is turn one")
	t.expect_eq(state.active_ship().hull, 3, "active ship starts at full hull")
	t.expect_false(state.selected, "no ship starts selected")


func test_rejects_inactive_player_selection(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(4, 0))
	var result := state.select_ship(BattleState.Player.TWO)
	t.expect_false(result.ok, "inactive player cannot select")
	t.expect_eq(result.reason, &"inactive_player", "selection exposes stable rejection code")
	t.expect_false(state.selected, "rejected selection leaves state unchanged")


func test_moves_once_within_allowance(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(4, 0))
	state.select_ship(BattleState.Player.ONE)
	t.expect_false(state.reachable_cells().has(Vector2i(0, 0)), "origin is not offered as a move")
	var no_op_move := state.move_active_ship(Vector2i(0, 0))
	t.expect_eq(no_op_move.reason, &"out_of_range", "no-op move does not spend movement")
	var result := state.move_active_ship(Vector2i(2, 0))
	t.expect_true(result.ok, "active ship moves within allowance")
	t.expect_eq(state.active_ship().cell, Vector2i(2, 0), "move updates authoritative cell")
	t.expect_eq(event_types(result.events), [&"ship_moved"], "move emits one typed event")
	t.expect_eq(
		result.events[0].data.path,
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(2, 0)],
		"move event carries validated path"
	)
	var second_move := state.move_active_ship(Vector2i(3, 0))
	t.expect_false(second_move.ok, "ship cannot move twice")
	t.expect_eq(second_move.reason, &"movement_used", "second move rejection is stable")


func test_rejects_blocked_and_distant_moves(t: TestContext) -> void:
	var blocked_state := make_state(Vector2i(0, 0), Vector2i(4, 0), [Vector2i(1, 0)])
	blocked_state.select_ship(BattleState.Player.ONE)
	var blocked_result := blocked_state.move_active_ship(Vector2i(1, 0))
	t.expect_eq(blocked_result.reason, &"blocked", "land destination is blocked")

	var distant_state := make_state(Vector2i(0, 0), Vector2i(4, 0))
	distant_state.select_ship(BattleState.Player.ONE)
	var distant_result := distant_state.move_active_ship(Vector2i(4, 0))
	t.expect_eq(distant_result.reason, &"blocked", "occupied destination is blocked")
	var off_board_result := distant_state.move_active_ship(Vector2i(9, 0))
	t.expect_eq(off_board_result.reason, &"out_of_range", "off-board destination is out of range")


func test_attack_ends_turn_before_another_move(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(2, 0))
	state.select_ship(BattleState.Player.ONE)
	state.attack()
	t.expect_eq(state.active_player, BattleState.Player.TWO, "attack hands control to opponent")
	var move_after_attack := state.move_active_ship(Vector2i(3, 0))
	t.expect_eq(move_after_attack.reason, &"selection_required", "new active player must select")
	t.expect_eq(state.ships[BattleState.Player.ONE].cell, Vector2i(0, 0), "attacker cannot move after firing")


func test_attack_without_moving(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(2, 0))
	state.select_ship(BattleState.Player.ONE)
	var result := state.attack()
	t.expect_true(result.ok, "selected ship attacks without moving")
	t.expect_eq(state.ships[BattleState.Player.TWO].hull, 2, "attack removes one hull")


func test_attack_deals_fixed_damage_and_switches_turn(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(2, 0))
	state.select_ship(BattleState.Player.ONE)
	var result := state.attack()
	t.expect_eq(
		event_types(result.events),
		[&"ship_attacked", &"ship_damaged", &"turn_changed"],
		"attack events preserve presentation order"
	)
	t.expect_eq(result.events[1].data.hull, 2, "damage event contains resulting hull")
	t.expect_eq(state.active_player, BattleState.Player.TWO, "nonlethal attack switches player")


func test_end_turn_switches_player(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(4, 0))
	var result := state.end_turn()
	t.expect_true(result.ok, "end turn succeeds before selection")
	t.expect_eq(event_types(result.events), [&"turn_changed"], "end turn emits turn change")
	t.expect_eq(state.active_player, BattleState.Player.TWO, "end turn activates player two")


func test_third_hit_wins_immediately(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(2, 0))
	for exchange in range(2):
		state.select_ship(BattleState.Player.ONE)
		state.attack()
		state.select_ship(BattleState.Player.TWO)
		state.attack()
	var target_hull_before: int = state.ships[BattleState.Player.TWO].hull
	t.expect_eq(target_hull_before, 1, "two hits leave one hull")
	state.select_ship(BattleState.Player.ONE)
	var result := state.attack()
	t.expect_eq(state.winner, BattleState.Player.ONE, "third hit wins for attacker")
	t.expect_eq(state.ships[BattleState.Player.TWO].hull, 0, "losing ship reaches zero hull")
	t.expect_eq(
		event_types(result.events),
		[&"ship_attacked", &"ship_damaged", &"battle_won"],
		"winning attack omits turn change"
	)
	var after_win := state.end_turn()
	t.expect_eq(after_win.reason, &"game_over", "game over rejects further commands")


func test_reset_restores_initial_state(t: TestContext) -> void:
	var state := make_state(Vector2i(0, 0), Vector2i(2, 0))
	state.select_ship(BattleState.Player.ONE)
	state.attack()
	var result := state.reset()
	t.expect_eq(event_types(result.events), [&"battle_reset"], "reset emits reset event")
	t.expect_eq(state.active_player, BattleState.Player.ONE, "reset restores first player")
	t.expect_eq(state.turn_number, 1, "reset restores turn count")
	t.expect_eq(state.ships[BattleState.Player.ONE].cell, Vector2i(0, 0), "reset restores player one position")
	t.expect_eq(state.ships[BattleState.Player.TWO].cell, Vector2i(2, 0), "reset restores player two position")
	t.expect_eq(state.ships[BattleState.Player.TWO].hull, 3, "reset restores hull")
	t.expect_false(state.selected, "reset clears selection")


func make_state(
	player_one_start: Vector2i,
	player_two_start: Vector2i,
	blocked: Array[Vector2i] = []
) -> BattleState:
	var cells: Array[Vector2i] = []
	var neighbors := {}
	for x in range(5):
		var cell := Vector2i(x, 0)
		cells.append(cell)
		var adjacent: Array[Vector2i] = []
		if x > 0:
			adjacent.append(Vector2i(x - 1, 0))
		if x < 4:
			adjacent.append(Vector2i(x + 1, 0))
		neighbors[cell] = adjacent
	var board := HexBoard.new()
	board.configure(cells, blocked, neighbors)
	var state := BattleState.new()
	state.setup(board, SHIP_DEFINITION, player_one_start, player_two_start)
	return state


func event_types(events: Array[BattleEvent]) -> Array[StringName]:
	var result: Array[StringName] = []
	for event in events:
		result.append(event.type)
	return result
