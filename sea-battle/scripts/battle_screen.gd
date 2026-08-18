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
@onready var sidebar: TacticalSidebar = %TacticalSidebar

var state: BattleState
var board: HexBoard
var ship_views: Dictionary = {}
var input_locked := false


func _ready() -> void:
	sidebar.end_turn_pressed.connect(_on_end_turn_pressed)
	sidebar.play_again_pressed.connect(_on_play_again_pressed)
	battlefield_panel.gui_input.connect(_on_battlefield_input)
	_build_map()
	var neighbors := _build_neighbors()
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
		sidebar.show_message("Choose a highlighted destination")
		sidebar.render(state)
		return

	if not state.reachable_cells().has(cell):
		var rejection := state.move_active_ship(cell)
		sidebar.show_rejection(rejection.reason, state.active_player)
		return

	var movement := state.move_active_ship(cell)
	if not movement.ok:
		sidebar.show_rejection(movement.reason, state.active_player)
		return
	await _present_movement(movement.events)
	refresh_from_state()
	highlights.clear()
	highlights.show_selection(state.active_ship().cell)
	sidebar.show_message("Attack if in range, or end your turn")


func handle_cell_hover(cell: Vector2i) -> void:
	if input_locked or not state.selected or state.active_ship().movement_used:
		highlights.show_path([])
		return
	if not state.reachable_cells().has(cell):
		highlights.show_path([])
		return
	var occupied := {state.opposing_ship().cell: true}
	highlights.show_path(state.board.path(state.active_ship().cell, cell, occupied))


func cancel_selection() -> void:
	if input_locked or not state.selected:
		return
	var ship := state.active_ship()
	if ship.movement_used or ship.attack_used:
		return
	state.selected = false
	highlights.clear()
	sidebar.show_message("Select your ship")


func _present_movement(events: Array[BattleEvent]) -> void:
	for event in events:
		if event.type != &"ship_moved":
			continue
		var player: int = event.data.player
		var path: Array = event.data.path
		var view: ShipView = ship_views[player]
		input_locked = true
		if skip_animations:
			view.position = tile_map.map_to_local(path.back())
		else:
			var tween := create_tween()
			for index in range(1, path.size()):
				tween.tween_property(view, "position", tile_map.map_to_local(path[index]), 0.12)
			await tween.finished
		input_locked = false


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
	apply_result(state.end_turn())
	sidebar.show_message("Select your ship")


func _on_play_again_pressed() -> void:
	apply_result(state.reset())
	sidebar.hide_result()
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
