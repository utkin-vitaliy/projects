class_name FleetShipState
extends RefCounted

var ship_id: StringName
var player: int
var cell: Vector2i
var hull: int
var definition: ShipDefinition
var activation_used := false
var movement_used := false
var attack_used := false


func configure(id: StringName, owner: int, ship_definition: ShipDefinition, start: Vector2i) -> void:
	ship_id = id
	player = owner
	definition = ship_definition
	cell = start
	hull = definition.max_hull
	reset_for_battle()


func reset_for_activation() -> void:
	movement_used = false
	attack_used = false


func reset_for_round() -> void:
	activation_used = false
	reset_for_activation()


func reset_for_battle() -> void:
	hull = definition.max_hull
	reset_for_round()


func is_destroyed() -> bool:
	return hull <= 0
