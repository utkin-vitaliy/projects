class_name BattleScreen
extends Control

@export var map_definition: MapDefinition
@export var ship_definitions: Array[ShipDefinition] = []
@export var skip_animations := false

@onready var battlefield_panel: Control = %BattlefieldPanel
@onready var board_root: Node2D = %BoardRoot
@onready var tile_map: TileMapLayer = %TileMapLayer
@onready var ship_container: Node2D = %Ships
@onready var highlights: HighlightLayer = %Highlights
@onready var animator: BattleAnimator = %BattleAnimator
@onready var sidebar: TacticalSidebar = %TacticalSidebar

var state: FleetBattleState
var board: HexBoard
var ship_views: Dictionary = {}
var input_locked := false
var starting_player_picker: Callable


func _ready() -> void:
	sidebar.end_turn_pressed.connect(_on_end_activation_pressed)
	sidebar.play_again_pressed.connect(_on_play_again_pressed)
	sidebar.ship_selected.connect(handle_roster_selection)
	battlefield_panel.gui_input.connect(_on_battlefield_input)
	state = FleetBattleState.new(starting_player_picker)
	highlights.configure(tile_map)
	animator.skip_animations = skip_animations
	if map_definition == null:
		var missing_map: Array[StringName] = [&"map_missing"]
		_report_invalid_setup(missing_map)
		return

	var neighbors := _build_neighbors()
	var validation_errors := map_definition.validate(neighbors, tile_map.tile_set)
	if not validation_errors.is_empty():
		_report_invalid_setup(validation_errors)
		return

	board = HexBoard.new()
	board.configure(map_definition.all_cells(), map_definition.blocked_cells, neighbors)
	var setup_errors := state.setup(board, ship_definitions, {
		FleetBattleState.Player.ONE: map_definition.player_one_starts,
		FleetBattleState.Player.TWO: map_definition.player_two_starts,
	})
	if not setup_errors.is_empty():
		_report_invalid_setup(setup_errors)
		return

	_build_map()
	_spawn_ship_views()
	refresh_from_state()
	battlefield_panel.resized.connect(_center_board)
	highlights.clear()
	sidebar.show_message("Choose a ready ship")
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
	for player in [FleetBattleState.Player.ONE, FleetBattleState.Player.TWO]:
		for ship in state.fleets[player].ordered_ships():
			var view := ShipView.new()
			view.name = str(ship.ship_id)
			view.configure(ship.ship_id, player, ship.definition)
			ship_container.add_child(view)
			ship_views[ship.ship_id] = view


func refresh_from_state() -> void:
	if state == null or state.fleets.is_empty():
		return
	for player in [FleetBattleState.Player.ONE, FleetBattleState.Player.TWO]:
		for ship in state.fleets[player].ordered_ships():
			var view: ShipView = ship_views.get(ship.ship_id) as ShipView
			if view == null:
				continue
			view.position = tile_map.map_to_local(ship.cell)
			view.set_hull(ship.hull, ship.definition.max_hull)
			view.set_sunk(ship.is_destroyed())
			view.set_used(ship.activation_used)
			view.set_ready(
				player == state.active_player
				and not ship.activation_used
				and not ship.is_destroyed()
				and ship.ship_id != state.selected_ship_id
			)
			view.set_active(ship.ship_id == state.selected_ship_id)
	sidebar.render_fleet(state)


func apply_result(result: CommandResult) -> void:
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return
	refresh_from_state()


func handle_ship_selection(ship_id: StringName) -> void:
	if input_locked or state == null or state.is_game_over():
		return
	var result := state.select_ship(ship_id)
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return
	refresh_from_state()
	_refresh_selection_highlights()
	_show_context_message()


func handle_roster_selection(ship_id: StringName) -> void:
	handle_ship_selection(ship_id)


func handle_cell_click(cell: Vector2i) -> void:
	if input_locked or state == null or state.is_game_over():
		return
	var clicked_ship := _living_ship_at(cell)
	var selected := state.selected_ship()
	if clicked_ship != null:
		if selected != null and clicked_ship.player != state.active_player:
			var attacked := await _present_command(state.attack(clicked_ship.ship_id))
			if attacked:
				_refresh_selection_highlights()
				_show_context_message()
			return
		handle_ship_selection(clicked_ship.ship_id)
		return

	if selected == null:
		sidebar.show_message("Choose a ready ship")
		return
	var moved := await _present_command(state.move_selected_ship(cell))
	if moved:
		_refresh_selection_highlights()
		_show_context_message()


func handle_cell_hover(cell: Vector2i) -> void:
	if input_locked or state == null:
		highlights.show_path([])
		highlights.clear_hovered_target()
		return
	var selected := state.selected_ship()
	if selected == null:
		highlights.show_path([])
		highlights.clear_hovered_target()
		return

	var hovered_ship := _living_ship_at(cell)
	if (
		hovered_ship != null
		and hovered_ship.player != state.active_player
		and state.can_attack(hovered_ship.ship_id)
	):
		highlights.show_path([])
		highlights.show_hovered_target(cell)
		sidebar.show_message("Attack %s · %d damage" % [
			hovered_ship.definition.display_name,
			selected.definition.damage,
		])
		return

	highlights.clear_hovered_target()
	if selected.movement_used or selected.attack_used:
		highlights.show_path([])
		_show_context_message()
		return
	if not state.reachable_cells().has(cell):
		highlights.show_path([])
		_show_context_message()
		return
	highlights.show_path(state.board.path(
		selected.cell,
		cell,
		state.occupied_cells(selected.ship_id)
	))
	_show_context_message()


func cancel_selection() -> void:
	if input_locked or state == null or state.selected_ship() == null:
		return
	var result := state.cancel_selection()
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return
	refresh_from_state()
	highlights.clear()
	sidebar.show_message("Choose a ready ship")


func _present_command(result: CommandResult) -> bool:
	if not result.ok:
		sidebar.show_rejection(result.reason, state.active_player)
		return false
	input_locked = true
	await animator.play(result.events, ship_views, tile_map, sidebar)
	refresh_from_state()
	highlights.clear()
	if state.is_game_over():
		input_locked = true
	else:
		input_locked = false
	return true


func _refresh_selection_highlights() -> void:
	highlights.clear()
	var selected := state.selected_ship()
	if selected == null:
		return
	highlights.show_selection(selected.cell)
	highlights.show_reachable(state.reachable_cells())
	var target_cells: Array[Vector2i] = []
	for target in state.legal_targets():
		target_cells.append(target.cell)
	highlights.show_targets(target_cells)


func _show_context_message() -> void:
	var selected := state.selected_ship()
	if selected == null:
		sidebar.show_message("Choose a ready ship")
		return
	var has_target := not state.legal_targets().is_empty()
	if selected.movement_used:
		if has_target:
			sidebar.show_message("Choose a target or end activation")
		else:
			sidebar.show_message("No targets in range · end activation")
	else:
		sidebar.show_message("Choose a destination or attack")


func _report_invalid_setup(errors: Array[StringName]) -> void:
	var descriptions := {
		&"map_missing": "map definition is missing",
		&"incorrect_cell_count": "the battlefield must contain 127 cells",
		&"duplicate_cell": "the battlefield contains a duplicate cell",
		&"incorrect_fleet_size": "each fleet requires three ships and starts",
		&"duplicate_class": "fleet classes must be unique",
		&"definition_missing": "a ship definition is missing",
		&"incorrect_class_order": "fleet classes must be ordered sloop, frigate, galleon",
		&"visual_profile_missing": "a ship visual profile is missing",
		&"visual_hull_missing": "a ship visual profile has no drawable hull",
		&"visual_icon_mismatch": "a ship visual icon does not match its class",
		&"duplicate_start": "fleet starts overlap",
		&"start_outside_map": "a fleet start is outside the map",
		&"blocked_outside_map": "a blocked cell is outside the map",
		&"start_blocked": "a fleet start is blocked",
		&"starts_disconnected": "fleet starts have no walkable route",
		&"map_disconnected": "the walkable map is disconnected",
		&"terrain_definition_missing": "a terrain definition is missing",
		&"terrain_tile_source_missing": "a terrain tile source is missing",
		&"terrain_tile_missing": "a terrain atlas tile is missing",
		&"board_missing": "the rules board is missing",
	}
	input_locked = true
	sidebar.show_invalid_setup()
	for code in errors:
		push_error("Invalid fleet battle setup: %s (%s)" % [descriptions.get(code, code), code])


func _living_ship_at(cell: Vector2i) -> FleetShipState:
	for player in [FleetBattleState.Player.ONE, FleetBattleState.Player.TWO]:
		for ship in state.fleets[player].living_ships():
			if ship.cell == cell:
				return ship
	return null


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


func _on_end_activation_pressed() -> void:
	if input_locked or state == null:
		return
	var ended := await _present_command(state.end_activation())
	if ended:
		_refresh_selection_highlights()
		_show_context_message()


func _on_play_again_pressed() -> void:
	state.reset()
	animator.clear()
	for view_value in ship_views.values():
		var view: ShipView = view_value
		view.reset_presentation()
	highlights.clear()
	sidebar.hide_result()
	sidebar.hide_turn_banner()
	input_locked = false
	refresh_from_state()
	sidebar.show_message("Choose a ready ship")


func cell_from_pointer(panel_position: Vector2) -> Vector2i:
	var pointer_viewport_position := (
		battlefield_panel.get_global_transform_with_canvas()
		* panel_position
	)
	var pointer_tile_position := (
		tile_map.get_global_transform_with_canvas().affine_inverse()
		* pointer_viewport_position
	)
	return tile_map.local_to_map(pointer_tile_position)


func _center_board() -> void:
	var cells := map_definition.all_cells()
	if cells.is_empty():
		return
	var half_tile := Vector2(tile_map.tile_set.tile_size) * 0.5
	var first_center := tile_map.map_to_local(cells[0])
	var local_bounds := Rect2(first_center - half_tile, half_tile * 2.0)
	for cell in cells:
		var center := tile_map.map_to_local(cell)
		local_bounds = local_bounds.expand(center - half_tile)
		local_bounds = local_bounds.expand(center + half_tile)
	board_root.position = (
		battlefield_panel.size * 0.5
		- local_bounds.get_center() * board_root.scale
	)
