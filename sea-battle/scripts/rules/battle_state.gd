class_name BattleState
extends RefCounted

enum Player { ONE = 1, TWO = 2 }

var board: HexBoard
var definition: ShipDefinition
var active_player := Player.ONE
var winner := 0
var turn_number := 1
var selected := false
var ships: Dictionary = {}

var _starts := {}


func setup(
	hex_board: HexBoard,
	ship_definition: ShipDefinition,
	player_one_start: Vector2i,
	player_two_start: Vector2i
) -> void:
	board = hex_board
	definition = ship_definition
	_starts = {
		Player.ONE: player_one_start,
		Player.TWO: player_two_start,
	}
	ships = {
		Player.ONE: _new_ship(Player.ONE, player_one_start),
		Player.TWO: _new_ship(Player.TWO, player_two_start),
	}
	reset()


func active_ship() -> ShipState:
	return ships[active_player]


func opposing_ship() -> ShipState:
	return ships[_other_player(active_player)]


func is_game_over() -> bool:
	return winner != 0


func select_ship(player: int) -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	if player != active_player:
		return CommandResult.failure(&"inactive_player")
	if ships[player].is_destroyed():
		return CommandResult.failure(&"game_over")
	selected = true
	var events: Array[BattleEvent] = [
		_event(&"ship_selected", {"player": player}),
	]
	return CommandResult.success(events)


func reachable_cells() -> Array[Vector2i]:
	if not selected or is_game_over():
		return []
	var ship := active_ship()
	if ship.movement_used or ship.attack_used:
		return []
	var cells := board.reachable(
		ship.cell,
		ship.definition.movement,
		_occupied_by_opponent()
	)
	cells.erase(ship.cell)
	return cells


func cancel_selection() -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	if not selected:
		return CommandResult.failure(&"selection_required")
	var ship := active_ship()
	if ship.movement_used or ship.attack_used:
		return CommandResult.failure(&"action_committed")
	selected = false
	var events: Array[BattleEvent] = [_event(&"selection_cancelled")]
	return CommandResult.success(events)


func move_active_ship(destination: Vector2i) -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	if not selected:
		return CommandResult.failure(&"selection_required")
	var ship := active_ship()
	if ship.movement_used or ship.attack_used:
		return CommandResult.failure(&"movement_used")
	if destination == ship.cell:
		return CommandResult.failure(&"out_of_range")
	if board.is_blocked(destination) or opposing_ship().cell == destination:
		return CommandResult.failure(&"blocked")
	var route := board.path(ship.cell, destination, _occupied_by_opponent())
	if route.is_empty() or route.size() - 1 > ship.definition.movement:
		return CommandResult.failure(&"out_of_range")
	ship.cell = destination
	ship.movement_used = true
	var events: Array[BattleEvent] = [
		_event(&"ship_moved", {
			"player": ship.player,
			"path": route,
		}),
	]
	return CommandResult.success(events)


func can_attack() -> bool:
	if not selected or is_game_over() or active_ship().attack_used:
		return false
	var attack_distance := board.distance(active_ship().cell, opposing_ship().cell)
	return attack_distance >= 0 and attack_distance <= active_ship().definition.attack_range


func attack() -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	if not selected:
		return CommandResult.failure(&"selection_required")
	if active_ship().attack_used:
		return CommandResult.failure(&"attack_used")
	if not can_attack():
		return CommandResult.failure(&"out_of_range")

	var attacker := active_ship()
	var target := opposing_ship()
	attacker.attack_used = true
	target.hull = maxi(0, target.hull - attacker.definition.damage)
	var events: Array[BattleEvent] = [
		_event(&"ship_attacked", {
			"attacker": attacker.player,
			"target": target.player,
		}),
		_event(&"ship_damaged", {
			"player": target.player,
			"hull": target.hull,
		}),
	]
	if target.is_destroyed():
		winner = attacker.player
		events.append(_event(&"battle_won", {"winner": winner}))
	else:
		events.append(_switch_turn())
	return CommandResult.success(events)


func end_turn() -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var events: Array[BattleEvent] = [_switch_turn()]
	return CommandResult.success(events)


func reset() -> CommandResult:
	active_player = Player.ONE
	winner = 0
	turn_number = 1
	selected = false
	for player in [Player.ONE, Player.TWO]:
		var ship: ShipState = ships[player]
		ship.cell = _starts[player]
		ship.hull = ship.definition.max_hull
		ship.reset_actions()
	var events: Array[BattleEvent] = [_event(&"battle_reset")]
	return CommandResult.success(events)


func _new_ship(player: int, start: Vector2i) -> ShipState:
	var ship := ShipState.new()
	ship.configure(player, definition, start)
	return ship


func _switch_turn() -> BattleEvent:
	active_player = _other_player(active_player)
	turn_number += 1
	selected = false
	active_ship().reset_actions()
	return _event(&"turn_changed", {
		"player": active_player,
		"turn": turn_number,
	})


func _occupied_by_opponent() -> Dictionary:
	return {opposing_ship().cell: true}


func _other_player(player: int) -> int:
	return Player.TWO if player == Player.ONE else Player.ONE


func _event(type: StringName, data: Dictionary = {}) -> BattleEvent:
	return BattleEvent.new(type, data)
