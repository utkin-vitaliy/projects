class_name BattleScreen
extends Control

@export var map_definition: MapDefinition
@export var ship_definition: ShipDefinition
@export var skip_animations := false

@onready var battlefield_panel: Control = %BattlefieldPanel
@onready var board_root: Node2D = %BoardRoot
@onready var tile_map: TileMapLayer = %TileMapLayer
@onready var ship_container: Node2D = %Ships
@onready var sidebar: TacticalSidebar = %TacticalSidebar

var state: BattleState
var board: HexBoard
var ship_views: Dictionary = {}


func _ready() -> void:
	sidebar.end_turn_pressed.connect(_on_end_turn_pressed)
	sidebar.play_again_pressed.connect(_on_play_again_pressed)
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
