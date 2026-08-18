class_name BattleScreen
extends Control

@export var map_definition: MapDefinition
@export var ship_definition: ShipDefinition
@export var skip_animations := false

@onready var battlefield_panel: Control = %BattlefieldPanel
@onready var board_root: Node2D = %BoardRoot
@onready var tile_map: TileMapLayer = %TileMapLayer
@onready var ship_container: Node2D = %Ships
@onready var highlights: HighlightLayer = %Highlights
@onready var animator: BattleAnimator = %BattleAnimator
@onready var sidebar: TacticalSidebar = %TacticalSidebar

var state: BattleState
var board: HexBoard
var ship_views: Dictionary = {}
var input_locked := false


func _ready() -> void:
	sidebar.end_turn_pressed.connect(_on_end_turn_pressed)
	sidebar.play_again_pressed.connect(_on_play_again_pressed)
	battlefield_panel.gui_input.connect(_on_battlefield_input)
	var neighbors := _build_neighbors()
	var validation_errors := map_definition.validate(neighbors, tile_map.tile_set)
	if not validation_errors.is_empty():
		_report_invalid_map(validation_errors)
		return
	_build_map()
	board = HexBoard.new()
	board.configure(map_definition.all_cells(), map_definition.blocked_cells, neighbors)
	state = BattleState.new()
	state.setup(
		board,
		ship_definition,
		map_definition.player_one_start,
		map_definition.player_two_start
	)
	highlights.configure(tile_map)
	animator.skip_animations = skip_animations
	_spawn_ship_views()
	refresh_from_state()
	_center_board.call_deferred()


func _build_map() -> void:
	tile_map.clear()
	for cell in map_definition.all_cells():
		var terrain := map_definition.terrain_at(cell)
		if terrain == null or terrain.source_ids.is_empty():
			push_error("Terrain at %s has no tile source" % cell)
			continue
		var variant_index := posmod(cell.x + cell.y, terrain.source_ids.size())
		var source_id: int = terrain.source_ids[variant_index]
		tile_map.set_cell(cell, source_id, terrain.atlas_coords)


func _build_neighbors() -> Dictionary:
	var valid_cells := {}
	for cell in map_definition.all_cells():
		valid_cells[cell] = true
	var neighbors := {}
	for cell in map_definition.all_cells():
		var valid_neighbors: Array[Vector2i] = []
		for neighbor in tile_map.get_surrounding_cells(cell):
			if valid_cells.has(neighbor):
				valid_neighbors.append(neighbor)
		neighbors[cell] = valid_neighbors
	return neighbors


func _spawn_ship_views() -> void:
	for player in [BattleState.Player.ONE, BattleState.Player.TWO]:
		var view := ShipView.new()
		view.name = "Player%dShip" % player
		view.configure(player, ship_definition)
		ship_container.add_child(view)
		ship_views[player] = view


func refresh_from_state() -> void:
	for player in [BattleState.Player.ONE, BattleState.Player.TWO]:
		var ship: ShipState = state.ships[player]
		var view: ShipView = ship_views[player]
		view.position = tile_map.map_to_local(ship.cell)
		view.set_hull(ship.hull, ship.definition.max_hull)
		view.set_active(player == state.active_player)
	sidebar.render(state)


func apply_result(result: CommandResult) -> void:
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return
	refresh_from_state()


func handle_cell_click(cell: Vector2i) -> void:
	if input_locked or state.is_game_over():
		return
	if not state.selected:
		var player_at_cell := _player_at(cell)
		if player_at_cell == 0:
			sidebar.show_message("Select your ship")
			return
		var selection := state.select_ship(player_at_cell)
		if not selection.ok:
			sidebar.show_rejection(selection.reason, state.active_player)
			return
		highlights.show_selection(state.active_ship().cell)
		highlights.show_reachable(state.reachable_cells())
		_show_attack_target_or_movement_message()
		sidebar.render(state)
		return

	if cell == state.opposing_ship().cell:
		if not state.can_attack():
			sidebar.show_rejection(&"out_of_range", state.active_player)
			return
		await _present_command(state.attack())
		if not state.is_game_over():
			sidebar.show_message("Select your ship")
		return

	if not state.reachable_cells().has(cell):
		var rejection := state.move_active_ship(cell)
		sidebar.show_rejection(rejection.reason, state.active_player)
		return

	var movement := state.move_active_ship(cell)
	if not movement.ok:
		sidebar.show_rejection(movement.reason, state.active_player)
		return
	await _present_command(movement)
	highlights.clear()
	highlights.show_selection(state.active_ship().cell)
	_show_attack_target_or_movement_message()


func handle_cell_hover(cell: Vector2i) -> void:
	if input_locked:
		highlights.show_path([])
		return
	if state.selected and cell == state.opposing_ship().cell and state.can_attack():
		sidebar.show_message("Attack · %d damage" % state.active_ship().definition.damage)
		highlights.show_path([])
		return
	if not state.selected or state.active_ship().movement_used:
		highlights.show_path([])
		if state.selected:
			_show_attack_target_or_movement_message()
		return
	if not state.reachable_cells().has(cell):
		highlights.show_path([])
		_show_attack_target_or_movement_message()
		return
	var occupied := {state.opposing_ship().cell: true}
	highlights.show_path(state.board.path(state.active_ship().cell, cell, occupied))
	_show_attack_target_or_movement_message()


func cancel_selection() -> void:
	if input_locked or not state.selected:
		return
	var result := state.cancel_selection()
	if not result.ok:
		return
	highlights.clear()
	sidebar.show_message("Select your ship")


func _present_command(result: CommandResult) -> void:
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return
	input_locked = true
	await animator.play(result.events, ship_views, tile_map, sidebar)
	refresh_from_state()
	highlights.clear()
	if state.is_game_over():
		input_locked = true
	else:
		input_locked = false


func _show_attack_target_or_movement_message() -> void:
	if state.can_attack():
		highlights.show_target(state.opposing_ship().cell)
	else:
		highlights.clear_target()
	if state.active_ship().movement_used:
		if state.can_attack():
			sidebar.show_message("Choose a target or end turn")
		else:
			sidebar.show_message("Enemy out of range · end your turn")
	else:
		sidebar.show_message("Choose a destination or attack")


func _report_invalid_map(errors: Array[StringName]) -> void:
	var descriptions := {
		&"overlapping_starts": "player starts overlap",
		&"start_outside_map": "a player start is outside the map",
		&"start_blocked": "a player start is blocked",
		&"starts_disconnected": "player starts have no walkable route",
		&"terrain_definition_missing": "a terrain definition is missing",
		&"terrain_tile_source_missing": "a terrain tile source is missing",
		&"terrain_tile_missing": "a terrain atlas tile is missing",
	}
	input_locked = true
	sidebar.show_message("Invalid battlefield data")
	sidebar.end_turn_button.disabled = true
	for code in errors:
		push_error("Invalid battlefield data: %s (%s)" % [descriptions.get(code, code), code])


func _player_at(cell: Vector2i) -> int:
	for player in [BattleState.Player.ONE, BattleState.Player.TWO]:
		if state.ships[player].cell == cell:
			return player
	return 0


func _on_battlefield_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		handle_cell_hover(cell_from_pointer(event.position))
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			handle_cell_click(cell_from_pointer(event.position))
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			cancel_selection()


func _unhandled_key_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		cancel_selection()


func _on_end_turn_pressed() -> void:
	if input_locked:
		return
	await _present_command(state.end_turn())
	sidebar.show_message("Select your ship")


func _on_play_again_pressed() -> void:
	state.reset()
	animator.clear()
	highlights.clear()
	sidebar.hide_result()
	sidebar.hide_turn_banner()
	input_locked = false
	refresh_from_state()
	sidebar.show_message("Select your ship")


func cell_from_pointer(panel_position: Vector2) -> Vector2i:
	var pointer_global_position: Vector2 = battlefield_panel.to_global(panel_position)
	return tile_map.local_to_map(tile_map.to_local(pointer_global_position))


func _center_board() -> void:
	var used_rect := tile_map.get_used_rect()
	if used_rect.size == Vector2i.ZERO:
		return
	var top_left := tile_map.map_to_local(used_rect.position)
	var bottom_right := tile_map.map_to_local(used_rect.end - Vector2i.ONE)
	var board_center := (top_left + bottom_right) * 0.5
	board_root.position = battlefield_panel.size * 0.5 - board_center
