class_name FleetRosterRow
extends Button

signal ship_selected(ship_id: StringName)

const READY := "READY"
const ACTIVE := "ACTIVE"
const USED := "USED"
const SUNK := "SUNK"
const VALID_STATUSES := [READY, ACTIVE, USED, SUNK]
const ICON_FILL := Color("e6d7b5")
const ICON_OUTLINE := Color("0d222e")

@onready var class_icon: Control = %ClassIcon
@onready var class_label: Label = %ClassName
@onready var hull_bar: ProgressBar = %Hull
@onready var status_label: Label = %Status

var ship_id: StringName = &""
var icon_code: StringName = &""
var hull_copy := ""
var _visual_profile: ShipVisualProfile
var _status := READY


func _ready() -> void:
	pressed.connect(_on_pressed)
	hull_bar.draw.connect(_draw_hull_copy)


func render(ship: FleetShipState, status: String) -> void:
	assert(ship != null, "Fleet roster rows require a ship")
	assert(VALID_STATUSES.has(status), "Unsupported fleet roster status: %s" % status)
	ship_id = ship.ship_id
	_visual_profile = ship.definition.visual_profile
	icon_code = _visual_profile.icon_code if _visual_profile != null else &""
	_status = status
	class_label.text = ship.definition.display_name.to_upper()
	hull_bar.max_value = ship.definition.max_hull
	hull_bar.value = ship.hull
	hull_copy = "%d / %d" % [ship.hull, ship.definition.max_hull]
	hull_bar.tooltip_text = "HULL %d / %d" % [ship.hull, ship.definition.max_hull]
	class_icon.tooltip_text = "%s class silhouette" % ship.definition.display_name
	status_label.text = status
	status_label.add_theme_color_override("font_color", _status_color())
	disabled = status != READY
	focus_mode = Control.FOCUS_NONE if disabled else Control.FOCUS_ALL
	mouse_default_cursor_shape = Control.CURSOR_ARROW if disabled else Control.CURSOR_POINTING_HAND
	tooltip_text = "%s · %s · HULL %d / %d" % [
		ship.definition.display_name,
		status,
		ship.hull,
		ship.definition.max_hull,
	]
	hull_bar.queue_redraw()
	queue_redraw()


func _on_pressed() -> void:
	ship_selected.emit(ship_id)


func _status_color() -> Color:
	match _status:
		READY:
			return Color("8fd19e")
		ACTIVE:
			return Color("e2b65c")
		USED:
			return Color("a9bac1")
		SUNK:
			return Color("df8178")
	return Color.WHITE


func _draw() -> void:
	var state_color := _status_color()
	draw_rect(Rect2(3.0, 5.0, 4.0, maxf(size.y - 10.0, 0.0)), state_color, true)
	if _status == ACTIVE:
		draw_rect(Rect2(Vector2(1.0, 1.0), size - Vector2(2.0, 2.0)), state_color, false, 2.0)
	_draw_class_icon()


func _draw_class_icon() -> void:
	if _visual_profile == null or _visual_profile.hull_points.is_empty() or class_icon == null:
		return
	var source_bounds := Rect2(_visual_profile.hull_points[0], Vector2.ZERO)
	for point in _visual_profile.hull_points:
		source_bounds = source_bounds.expand(point)
	if source_bounds.size.x <= 0.0 or source_bounds.size.y <= 0.0:
		return
	var available := class_icon.size - Vector2(8.0, 12.0)
	var icon_scale := minf(available.x / source_bounds.size.x, available.y / source_bounds.size.y)
	var target_center := _class_icon_center_in_row()
	var points := PackedVector2Array()
	for point in _visual_profile.hull_points:
		points.append(target_center + (point - source_bounds.get_center()) * icon_scale)
	draw_colored_polygon(points, ICON_FILL)
	points.append(points[0])
	draw_polyline(points, ICON_OUTLINE, 1.5, true)
	var mast_top := target_center.y - class_icon.size.y * 0.35
	for mast_offset in _visual_profile.mast_offsets:
		var mast_x := target_center.x + mast_offset * icon_scale
		draw_line(Vector2(mast_x, target_center.y), Vector2(mast_x, mast_top), ICON_OUTLINE, 1.5, true)


func _class_icon_center_in_row() -> Vector2:
	return (
		get_global_transform_with_canvas().affine_inverse()
		* class_icon.get_global_transform_with_canvas()
		* (class_icon.size * 0.5)
	)


func _draw_hull_copy() -> void:
	var font := hull_bar.get_theme_default_font()
	var baseline := Vector2(0.0, hull_bar.size.y - 3.0)
	hull_bar.draw_string_outline(
		font,
		baseline,
		hull_copy,
		HORIZONTAL_ALIGNMENT_CENTER,
		hull_bar.size.x,
		10,
		2,
		Color("0d222e")
	)
	hull_bar.draw_string(
		font,
		baseline,
		hull_copy,
		HORIZONTAL_ALIGNMENT_CENTER,
		hull_bar.size.x,
		10,
		Color("f7edd0")
	)
