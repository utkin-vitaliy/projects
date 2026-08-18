class_name ShipVisualProfile
extends Resource

@export var hull_points := PackedVector2Array()
@export var mast_offsets := PackedFloat32Array()
@export var raised_stern := false
@export_range(0, 20) var gun_port_count := 0
@export var icon_code: StringName
