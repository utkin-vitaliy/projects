class_name FleetBattleState
extends RefCounted

enum Player { ONE = 1, TWO = 2 }

const REQUIRED_CLASS_IDS: Array[StringName] = [&"sloop", &"frigate", &"galleon"]
const MINIMUM_DRAWABLE_HULL_POINTS := 3

var board: HexBoard
var fleets: Dictionary = {}
var active_player := Player.ONE
var round_starter := Player.ONE
var round_number := 1
var selected_ship_id: StringName = &""
var winner := 0

var _definitions: Array[ShipDefinition] = []
var _starts_by_player: Dictionary = {}
var _starting_player_picker: Callable


func _init(starting_player_picker: Callable = Callable()) -> void:
	_starting_player_picker = starting_player_picker


func setup(
	hex_board: HexBoard,
	definitions: Array[ShipDefinition],
	starts_by_player: Dictionary
) -> Array[StringName]:
	var errors := _validate_setup(hex_board, definitions, starts_by_player)
	if not errors.is_empty():
		return errors

	board = hex_board
	_definitions.clear()
	_definitions.append_array(definitions)
	var player_one_starts: Array = starts_by_player[Player.ONE]
	var player_two_starts: Array = starts_by_player[Player.TWO]
	_starts_by_player = {
		Player.ONE: _copy_starts(player_one_starts),
		Player.TWO: _copy_starts(player_two_starts),
	}
	_restore_battle()
	return errors


func _validate_setup(
	hex_board: HexBoard,
	definitions: Array[ShipDefinition],
	starts_by_player: Dictionary
) -> Array[StringName]:
	var errors: Array[StringName] = []
	var definition_missing := false
	var duplicate_class := false
	var incorrect_class_order := false
	var visual_profile_missing := false
	var visual_hull_missing := false
	var visual_icon_mismatch := false
	var seen_classes := {}
	for index in definitions.size():
		var definition := definitions[index]
		if definition == null:
			definition_missing = true
			continue
		if seen_classes.has(definition.class_id):
			duplicate_class = true
		seen_classes[definition.class_id] = true
		if definitions.size() == REQUIRED_CLASS_IDS.size():
			if definition.class_id != REQUIRED_CLASS_IDS[index]:
				incorrect_class_order = true
		var profile := definition.visual_profile
		if profile == null:
			visual_profile_missing = true
			continue
		if profile.hull_points.size() < MINIMUM_DRAWABLE_HULL_POINTS:
			visual_hull_missing = true
		if profile.icon_code != definition.class_id:
			visual_icon_mismatch = true

	var player_one_starts: Variant = starts_by_player.get(Player.ONE, [])
	var player_two_starts: Variant = starts_by_player.get(Player.TWO, [])
	var incorrect_fleet_size: bool = (
		definitions.size() != 3
		or not player_one_starts is Array
		or not player_two_starts is Array
		or player_one_starts.size() != 3
		or player_two_starts.size() != 3
	)

	var duplicate_start := false
	var start_outside_map := false
	var start_blocked := false
	var seen_starts := {}
	for starts_value in [player_one_starts, player_two_starts]:
		if not starts_value is Array:
			continue
		for start_value in starts_value:
			if seen_starts.has(start_value):
				duplicate_start = true
			seen_starts[start_value] = true
			if not start_value is Vector2i:
				start_outside_map = true
				continue
			if hex_board == null:
				continue
			if not hex_board.has_cell(start_value):
				start_outside_map = true
			elif hex_board.is_blocked(start_value):
				start_blocked = true

	if hex_board == null:
		errors.append(&"board_missing")
	if definition_missing:
		errors.append(&"definition_missing")
	if incorrect_fleet_size:
		errors.append(&"incorrect_fleet_size")
	if duplicate_class:
		errors.append(&"duplicate_class")
	if incorrect_class_order:
		errors.append(&"incorrect_class_order")
	if visual_profile_missing:
		errors.append(&"visual_profile_missing")
	if visual_hull_missing:
		errors.append(&"visual_hull_missing")
	if visual_icon_mismatch:
		errors.append(&"visual_icon_mismatch")
	if duplicate_start:
		errors.append(&"duplicate_start")
	if start_outside_map:
		errors.append(&"start_outside_map")
	if start_blocked:
		errors.append(&"start_blocked")
	return errors


func selected_ship() -> FleetShipState:
	if selected_ship_id == &"":
		return null
	return _ship_by_id(selected_ship_id)


func active_fleet() -> FleetState:
	return fleets.get(active_player) as FleetState


func opposing_fleet() -> FleetState:
	return fleets.get(_other_player(active_player)) as FleetState


func reachable_cells() -> Array[Vector2i]:
	var ship := selected_ship()
	if ship == null or is_game_over() or ship.movement_used or ship.attack_used:
		return []
	var cells := board.reachable(
		ship.cell,
		ship.definition.movement,
		occupied_cells(ship.ship_id)
	)
	cells.erase(ship.cell)
	return cells


func legal_targets() -> Array[FleetShipState]:
	var attacker := selected_ship()
	if attacker == null or is_game_over() or attacker.attack_used:
		return []

	var targets: Array[FleetShipState] = []
	for target in opposing_fleet().ordered_ships():
		if target.is_destroyed():
			continue
		var attack_distance := board.distance(attacker.cell, target.cell)
		if attack_distance >= 0 and attack_distance <= attacker.definition.attack_range:
			targets.append(target)
	return targets


func can_attack(target_id: StringName) -> bool:
	for target in legal_targets():
		if target.ship_id == target_id:
			return true
	return false


func occupied_cells(except_ship_id: StringName = &"") -> Dictionary:
	var occupied := {}
	for fleet_value in fleets.values():
		var fleet: FleetState = fleet_value
		for ship in fleet.living_ships():
			if ship.ship_id != except_ship_id:
				occupied[ship.cell] = true
	return occupied


func is_game_over() -> bool:
	return winner != 0


func select_ship(ship_id: StringName) -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var ship := _ship_by_id(ship_id)
	if ship == null:
		return CommandResult.failure(&"invalid_target")
	if ship.is_destroyed():
		return CommandResult.failure(&"ship_sunk")
	if ship.player != active_player:
		return CommandResult.failure(&"inactive_player")
	if ship.activation_used:
		return CommandResult.failure(&"ship_already_used")
	var current_ship := selected_ship()
	if current_ship != null and (current_ship.movement_used or current_ship.attack_used):
		return CommandResult.failure(&"action_committed")

	ship.reset_for_activation()
	selected_ship_id = ship.ship_id
	var events: Array[BattleEvent] = [
		_event(&"ship_selected", {
			"ship_id": ship.ship_id,
			"player": ship.player,
		}),
	]
	return CommandResult.success(events)


func cancel_selection() -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var ship := selected_ship()
	if ship == null:
		return CommandResult.failure(&"selection_required")
	if ship.movement_used or ship.attack_used:
		return CommandResult.failure(&"action_committed")

	selected_ship_id = &""
	var events: Array[BattleEvent] = [
		_event(&"selection_cancelled", {"ship_id": ship.ship_id}),
	]
	return CommandResult.success(events)


func move_selected_ship(destination: Vector2i) -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var ship := selected_ship()
	if ship == null:
		return CommandResult.failure(&"selection_required")
	if ship.movement_used or ship.attack_used:
		return CommandResult.failure(&"movement_used")
	if destination == ship.cell:
		return CommandResult.failure(&"out_of_range")

	var occupied := occupied_cells(ship.ship_id)
	if board.is_blocked(destination) or occupied.has(destination):
		return CommandResult.failure(&"blocked")
	var route := board.path(ship.cell, destination, occupied)
	if route.is_empty() or route.size() - 1 > ship.definition.movement:
		return CommandResult.failure(&"out_of_range")

	ship.cell = destination
	ship.movement_used = true
	var events: Array[BattleEvent] = [
		_event(&"ship_moved", {
			"ship_id": ship.ship_id,
			"player": ship.player,
			"path": route,
		}),
	]
	return CommandResult.success(events)


func attack(target_id: StringName) -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var attacker := selected_ship()
	if attacker == null:
		return CommandResult.failure(&"selection_required")
	if attacker.attack_used:
		return CommandResult.failure(&"attack_used")
	var target := _ship_by_id(target_id)
	if target == null or target.player == attacker.player or target.is_destroyed():
		return CommandResult.failure(&"invalid_target")
	if not can_attack(target_id):
		return CommandResult.failure(&"out_of_range")

	attacker.attack_used = true
	target.hull = maxi(0, target.hull - attacker.definition.damage)
	var events: Array[BattleEvent] = [
		_event(&"ship_attacked", {
			"attacker_id": attacker.ship_id,
			"target_id": target.ship_id,
		}),
		_event(&"ship_damaged", {
			"ship_id": target.ship_id,
			"hull": target.hull,
			"max_hull": target.definition.max_hull,
			"damage": attacker.definition.damage,
		}),
	]
	if target.is_destroyed():
		events.append(_event(&"ship_sunk", {
			"ship_id": target.ship_id,
			"player": target.player,
			"cell": target.cell,
		}))

	attacker.activation_used = true
	events.append(_event(&"activation_completed", {
		"ship_id": attacker.ship_id,
		"player": attacker.player,
	}))
	selected_ship_id = &""
	if opposing_fleet().is_defeated():
		winner = attacker.player
		events.append(_event(&"battle_won", {"winner": winner}))
		return CommandResult.success(events)

	_append_activation_handoff(events)
	return CommandResult.success(events)


func end_activation() -> CommandResult:
	if is_game_over():
		return CommandResult.failure(&"game_over")
	var ship := selected_ship()
	if ship == null:
		return CommandResult.failure(&"selection_required")

	ship.activation_used = true
	var events: Array[BattleEvent] = [
		_event(&"activation_completed", {
			"ship_id": ship.ship_id,
			"player": ship.player,
		}),
	]
	selected_ship_id = &""
	_append_activation_handoff(events)
	return CommandResult.success(events)


func reset() -> CommandResult:
	_restore_battle()
	var events: Array[BattleEvent] = [
		_event(&"battle_reset", {
			"round": round_number,
			"player": active_player,
		}),
	]
	return CommandResult.success(events)


func _append_activation_handoff(events: Array[BattleEvent]) -> void:
	var opponent := _other_player(active_player)
	if fleets[opponent].has_ready_ship():
		active_player = opponent
		events.append(_event(&"player_changed", {"player": active_player}))
		return
	if active_fleet().has_ready_ship():
		return

	round_number += 1
	for fleet_value in fleets.values():
		var fleet: FleetState = fleet_value
		fleet.reset_activations()
	active_player = round_starter
	events.append(_event(&"round_started", {
		"round": round_number,
		"player": active_player,
	}))


func _restore_battle() -> void:
	round_starter = _pick_starting_player()
	active_player = round_starter
	round_number = 1
	selected_ship_id = &""
	winner = 0
	if _definitions.size() != 3 or _starts_by_player.is_empty():
		fleets.clear()
		return

	var restored_fleets := {}
	for player in [Player.ONE, Player.TWO]:
		var fleet := FleetState.new()
		var starts: Array[Vector2i] = _starts_by_player[player]
		fleet.configure(player, _definitions, starts)
		restored_fleets[player] = fleet
	fleets = restored_fleets


func _pick_starting_player() -> int:
	if _starting_player_picker.is_valid():
		return _starting_player_picker.call()
	return randi_range(Player.ONE, Player.TWO)


func _ship_by_id(ship_id: StringName) -> FleetShipState:
	for fleet_value in fleets.values():
		var fleet: FleetState = fleet_value
		for ship in fleet.ordered_ships():
			if ship.ship_id == ship_id:
				return ship
	return null


func _copy_starts(values: Array) -> Array[Vector2i]:
	var starts: Array[Vector2i] = []
	for value in values:
		starts.append(value)
	return starts


func _other_player(player: int) -> int:
	return Player.TWO if player == Player.ONE else Player.ONE


func _event(type: StringName, data: Dictionary = {}) -> BattleEvent:
	return BattleEvent.new(type, data)
