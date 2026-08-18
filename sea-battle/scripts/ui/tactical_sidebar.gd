class_name TacticalSidebar
extends PanelContainer

signal end_turn_pressed
signal play_again_pressed
signal ship_selected(ship_id: StringName)

@export var turn_banner_path: NodePath
@export var result_overlay_path: NodePath
@export var play_again_button_path: NodePath

@onready var active_player_label: Label = %ActivePlayer
@onready var round_label: Label = %Round
@onready var roster_container: VBoxContainer = %Roster
@onready var ship_name_label: Label = %ShipName
@onready var weight_label: Label = %Weight
@onready var role_label: Label = %Role
@onready var hull_label: Label = %HullLabel
@onready var hull_bar: ProgressBar = %HullBar
@onready var stats_label: Label = %Stats
@onready var action_state_label: Label = %ActionState
@onready var message_label: Label = %Message
@onready var end_turn_button: Button = %EndTurn

var _turn_banner: Control
var _turn_banner_label: Label
var _result_overlay: Control
var _result_label: Label
var roster_rows: Array[FleetRosterRow] = []
var _rows_by_ship_id: Dictionary = {}


func _ready() -> void:
	end_turn_button.pressed.connect(func() -> void: end_turn_pressed.emit())
	for child in roster_container.get_children():
		var row := child as FleetRosterRow
		if row == null:
			continue
		roster_rows.append(row)
		row.ship_selected.connect(_on_row_ship_selected)
	_turn_banner = get_node_or_null(turn_banner_path) as Control
	_result_overlay = get_node_or_null(result_overlay_path) as Control
	var play_again_button := get_node_or_null(play_again_button_path) as Button
	if _turn_banner != null:
		_turn_banner_label = _turn_banner.get_node_or_null("BannerPanel/BannerLabel") as Label
	if _result_overlay != null:
		_result_label = _result_overlay.get_node_or_null("Center/ResultPanel/ResultContent/ResultLabel") as Label
	if play_again_button != null:
		play_again_button.pressed.connect(func() -> void: play_again_pressed.emit())


func render_fleet(state: FleetBattleState) -> void:
	roster_container.show()
	round_label.show()
	weight_label.show()
	role_label.show()
	end_turn_button.text = "END ACTIVATION"
	active_player_label.text = "PLAYER %d" % state.active_player
	round_label.text = "ROUND %d" % state.round_number
	_rows_by_ship_id.clear()
	var ships := state.active_fleet().ordered_ships()
	for index in roster_rows.size():
		var row := roster_rows[index]
		if index >= ships.size():
			row.hide()
			continue
		var ship: FleetShipState = ships[index]
		row.show()
		row.render(ship, _status_for(ship, state.selected_ship_id))
		_rows_by_ship_id[ship.ship_id] = row
	set_selected_ship(state.selected_ship())
	end_turn_button.disabled = state.is_game_over() or state.selected_ship() == null


func set_selected_ship(ship: FleetShipState) -> void:
	if ship == null:
		ship_name_label.text = "SELECT A SHIP"
		weight_label.text = "—"
		role_label.text = "Choose a READY ship from the fleet roster"
		hull_label.text = "— / —"
		hull_bar.max_value = 1.0
		hull_bar.value = 0.0
		stats_label.text = "MOVE —   RANGE —   DAMAGE —"
		action_state_label.text = "NO ACTIVE SHIP"
		return
	ship_name_label.text = ship.definition.display_name.to_upper()
	weight_label.text = ship.definition.weight_label.to_upper()
	role_label.text = ship.definition.tactical_role
	hull_label.text = "%d / %d" % [ship.hull, ship.definition.max_hull]
	hull_bar.max_value = ship.definition.max_hull
	hull_bar.value = ship.hull
	stats_label.text = "MOVE %d   RANGE %d   DAMAGE %d" % [
		ship.definition.movement,
		ship.definition.attack_range,
		ship.definition.damage,
	]
	action_state_label.text = "%s · %s" % [
		"MOVE USED" if ship.movement_used else "MOVE READY",
		"ATTACK USED" if ship.attack_used else "ATTACK READY",
	]


func row_for(ship_id: StringName) -> FleetRosterRow:
	return _rows_by_ship_id.get(ship_id) as FleetRosterRow


func _status_for(ship: FleetShipState, selected_ship_id: StringName) -> String:
	if ship.is_destroyed():
		return FleetRosterRow.SUNK
	if ship.ship_id == selected_ship_id:
		return FleetRosterRow.ACTIVE
	if ship.activation_used:
		return FleetRosterRow.USED
	return FleetRosterRow.READY


func _on_row_ship_selected(ship_id: StringName) -> void:
	ship_selected.emit(ship_id)


func show_message(text: String) -> void:
	message_label.text = text


func show_rejection(reason: StringName, active_player: int) -> void:
	var messages := {
		&"selection_required": "Select your ship",
		&"movement_used": "Movement already used",
		&"attack_used": "Attack already used",
		&"ship_already_used": "Ship already activated",
		&"ship_sunk": "Ship has sunk",
		&"invalid_target": "Choose an enemy ship",
		&"action_committed": "Action already committed",
		&"blocked": "Blocked",
		&"out_of_range": "Out of range",
		&"inactive_player": "Player %d's turn" % active_player,
		&"game_over": "Battle is over",
	}
	show_message(messages.get(reason, "Action unavailable"))


func show_turn_banner(player: int) -> void:
	if _turn_banner == null:
		return
	if _turn_banner_label != null:
		_turn_banner_label.text = "PLAYER %d'S TURN" % player
	_turn_banner.show()


func hide_turn_banner() -> void:
	if _turn_banner != null:
		_turn_banner.hide()


func show_result(winner: int) -> void:
	if _result_overlay == null:
		return
	if _result_label != null:
		_result_label.text = "PLAYER %d WINS" % winner
	_result_overlay.show()


func hide_result() -> void:
	if _result_overlay != null:
		_result_overlay.hide()
