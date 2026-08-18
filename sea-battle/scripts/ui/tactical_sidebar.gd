class_name TacticalSidebar
extends PanelContainer

signal end_turn_pressed
signal play_again_pressed

@export var turn_banner_path: NodePath
@export var result_overlay_path: NodePath
@export var play_again_button_path: NodePath

@onready var active_player_label: Label = %ActivePlayer
@onready var ship_name_label: Label = %ShipName
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


func _ready() -> void:
	end_turn_button.pressed.connect(func() -> void: end_turn_pressed.emit())
	_turn_banner = get_node_or_null(turn_banner_path) as Control
	_result_overlay = get_node_or_null(result_overlay_path) as Control
	var play_again_button := get_node_or_null(play_again_button_path) as Button
	if _turn_banner != null:
		_turn_banner_label = _turn_banner.get_node_or_null("BannerPanel/BannerLabel") as Label
	if _result_overlay != null:
		_result_label = _result_overlay.get_node_or_null("Center/ResultPanel/ResultContent/ResultLabel") as Label
	if play_again_button != null:
		play_again_button.pressed.connect(func() -> void: play_again_pressed.emit())


func render(state: BattleState) -> void:
	var ship := state.active_ship()
	active_player_label.text = "PLAYER %d" % state.active_player
	ship_name_label.text = ship.definition.display_name.to_upper()
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
	end_turn_button.disabled = state.is_game_over()


func show_message(text: String) -> void:
	message_label.text = text


func show_rejection(reason: StringName, active_player: int) -> void:
	var messages := {
		&"selection_required": "Select your ship",
		&"movement_used": "Movement already used",
		&"attack_used": "Attack already used",
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
