class_name ShipState
extends RefCounted

var player: int
var cell: Vector2i
var hull: int
var definition: ShipDefinition
var movement_used := false
var attack_used := false


func configure(owner: int, ship_definition: ShipDefinition, start: Vector2i) -> void:
	player = owner
	definition = ship_definition
	cell = start
	hull = definition.max_hull
	reset_actions()


func reset_actions() -> void:
	movement_used = false
	attack_used = false


func is_destroyed() -> bool:
	return hull <= 0
