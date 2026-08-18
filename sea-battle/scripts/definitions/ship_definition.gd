class_name ShipDefinition
extends Resource

@export var class_id: StringName
@export var display_name := "The Mariner"
@export var weight_label := "Medium"
@export_multiline var tactical_role := "Balanced fleet ship"
@export_range(1, 99) var max_hull := 3
@export_range(0, 20) var movement := 3
@export_range(1, 20) var attack_range := 2
@export_range(1, 99) var damage := 1
@export var visual_profile: ShipVisualProfile
