class_name TerrainDefinition
extends Resource

@export var id: StringName
@export var display_name := ""
@export var walkable := true
@export var source_ids: Array[int] = []
@export var atlas_coords := Vector2i.ZERO
