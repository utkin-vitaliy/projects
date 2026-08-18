class_name ShipVisualProfile
extends Resource

@export var hull_points := PackedVector2Array()
@export var mast_offsets := PackedFloat32Array()
@export var raised_stern := false
@export_range(0, 20) var gun_port_count := 0
@export var icon_code: StringName
@export var player_one_texture: Texture2D
@export var player_two_texture: Texture2D
@export_range(0.1, 2.0, 0.01) var sprite_scale := 1.0


func texture_for_player(player: int) -> Texture2D:
	match player:
		1:
			return player_one_texture
		2:
			return player_two_texture
	return null
