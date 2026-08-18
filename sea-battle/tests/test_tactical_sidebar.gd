extends RefCounted

const CLASS_PATHS := [
	"res://resources/ships/sloop.tres",
	"res://resources/ships/frigate.tres",
	"res://resources/ships/galleon.tres",
]
const STARTS := {
	FleetBattleState.Player.ONE: [Vector2i(-3, 0), Vector2i(-2, 0), Vector2i(-1, 0)],
	FleetBattleState.Player.TWO: [Vector2i(1, 0), Vector2i(2, 0), Vector2i(3, 0)],
}


func run(t: TestContext, tree: SceneTree) -> void:
	var packed: PackedScene = load("res://scenes/components/tactical_sidebar.tscn")
	t.expect_not_null(packed, "tactical sidebar scene loads directly")
	if packed == null:
		return
	var sidebar = packed.instantiate()
	sidebar.size = Vector2(320.0, 672.0)
	tree.root.add_child(sidebar)
	await tree.process_frame

	t.expect_true(sidebar.has_method("render_fleet"), "sidebar exposes fleet rendering")
	if not sidebar.has_method("render_fleet"):
		sidebar.queue_free()
		await tree.process_frame
		return

	var state := _make_fleet_state()
	sidebar.render_fleet(state)
	await tree.process_frame
	t.expect_eq(sidebar.roster_rows.size(), 3, "sidebar shows three fleet rows")
	t.expect_eq(sidebar.roster_container.get_child_count(), 3, "roster contains three pre-authored rows")
	for row in sidebar.roster_rows:
		t.expect_eq(
			row.scene_file_path,
			"res://scenes/components/fleet_roster_row.tscn",
			"each roster control is an editor-authored row scene"
		)
		t.expect_not_null(row.get_node_or_null("RowMargin/RowContent/ClassIcon"), "row keeps class icon node")
		t.expect_not_null(row.get_node_or_null("RowMargin/RowContent/Identity/ClassName"), "row keeps class label node")
		t.expect_not_null(row.get_node_or_null("RowMargin/RowContent/Identity/Hull"), "row keeps hull bar node")
		t.expect_not_null(row.get_node_or_null("RowMargin/RowContent/Status"), "row keeps status node")

	var sloop_row = sidebar.roster_rows[0]
	var frigate_row = sidebar.roster_rows[1]
	var galleon_row = sidebar.roster_rows[2]
	var expected_icon_center: Vector2 = (
		sloop_row.get_global_transform_with_canvas().affine_inverse()
		* sloop_row.class_icon.get_global_transform_with_canvas()
		* (sloop_row.class_icon.size * 0.5)
	)
	t.expect_eq(
		sloop_row._class_icon_center_in_row(),
		expected_icon_center,
		"nested class icon center converts into row-local drawing coordinates"
	)
	t.expect_eq(sloop_row.class_label.text, "SLOOP", "first row is sloop")
	t.expect_eq(frigate_row.class_label.text, "FRIGATE", "second row is frigate")
	t.expect_eq(galleon_row.class_label.text, "GALLEON", "third row is galleon")
	t.expect_eq(sloop_row.icon_code, &"sloop", "row uses authored sloop visual identity")
	t.expect_eq(sloop_row.status_label.text, "READY", "unused ship is ready")
	t.expect_false(sloop_row.disabled, "ready ship can be selected")
	t.expect_eq(sloop_row.focus_mode, Control.FOCUS_ALL, "ready row accepts keyboard focus")
	t.expect_eq(sloop_row.hull_bar.value, 2.0, "row renders current hull")
	t.expect_eq(sloop_row.hull_bar.max_value, 2.0, "row renders maximum hull")
	t.expect_eq(sloop_row.get("hull_copy"), "2 / 2", "row exposes exact current and maximum hull copy")
	t.expect_eq(sidebar.round_label.text, "ROUND 1", "round header is visible")
	t.expect_eq(sidebar.end_turn_button.text, "END ACTIVATION", "action copy matches fleet rules")
	t.expect_true(sidebar.roster_container.visible, "fleet render shows persistent roster")
	t.expect_eq(sidebar.row_for(&"p1_frigate"), frigate_row, "row lookup uses stable ship ID")
	t.expect_eq(sidebar.row_for(&"missing"), null, "unknown ship ID has no roster row")

	state.select_ship(&"p1_sloop")
	state.fleets[FleetBattleState.Player.ONE].ship(&"p1_frigate").activation_used = true
	state.fleets[FleetBattleState.Player.ONE].ship(&"p1_galleon").hull = 0
	sidebar.render_fleet(state)
	t.expect_eq(sloop_row.status_label.text, "ACTIVE", "selected ship is active")
	t.expect_eq(frigate_row.status_label.text, "USED", "activated ship is used")
	t.expect_eq(galleon_row.status_label.text, "SUNK", "destroyed ship is sunk")
	t.expect_true(sloop_row.disabled, "active row cannot be reselected")
	t.expect_true(frigate_row.disabled, "used row cannot be selected")
	t.expect_true(galleon_row.disabled, "sunk row cannot be selected")
	t.expect_eq(sloop_row.focus_mode, Control.FOCUS_NONE, "active row is skipped by keyboard focus")
	t.expect_eq(frigate_row.focus_mode, Control.FOCUS_NONE, "used row is skipped by keyboard focus")
	t.expect_eq(galleon_row.focus_mode, Control.FOCUS_NONE, "sunk row is skipped by keyboard focus")
	t.expect_eq(sidebar.ship_name_label.text, "SLOOP", "selected detail shows class")
	t.expect_eq(sidebar.weight_label.text, "LIGHT", "selected detail shows weight")
	t.expect_eq(
		sidebar.role_label.text,
		"Fast flanker and vulnerable scout",
		"selected detail shows tactical role"
	)
	t.expect_eq(sidebar.hull_label.text, "2 / 2", "selected detail shows exact hull")
	t.expect_eq(sidebar.stats_label.text, "MOVE 4   RANGE 2   DAMAGE 1", "selected detail shows exact stats")
	t.expect_eq(
		sidebar.action_state_label.text,
		"MOVE READY · ATTACK READY",
		"selected detail shows both actions ready"
	)
	t.expect_false(sidebar.end_turn_button.disabled, "selected ship enables activation completion")
	t.expect_eq(
		sidebar.end_turn_button.focus_mode,
		Control.FOCUS_ALL,
		"enabled end activation accepts keyboard focus"
	)

	var selected_sloop: FleetShipState = state.selected_ship()
	selected_sloop.movement_used = true
	sidebar.render_fleet(state)
	t.expect_eq(
		sidebar.action_state_label.text,
		"MOVE USED · ATTACK READY",
		"selected detail distinguishes spent movement"
	)
	selected_sloop.attack_used = true
	sidebar.render_fleet(state)
	t.expect_eq(
		sidebar.action_state_label.text,
		"MOVE USED · ATTACK USED",
		"selected detail shows both actions spent"
	)
	selected_sloop.movement_used = false
	selected_sloop.attack_used = false

	state.cancel_selection()
	state.fleets[FleetBattleState.Player.ONE].ship(&"p1_frigate").activation_used = false
	sidebar.render_fleet(state)
	var selected_ids: Array[StringName] = []
	sidebar.ship_selected.connect(func(ship_id: StringName) -> void: selected_ids.append(ship_id))
	frigate_row.pressed.emit()
	t.expect_eq(selected_ids, [&"p1_frigate"], "ready row forwards its stable ship ID")
	t.expect_true(sidebar.end_turn_button.disabled, "no selection disables activation completion")

	sidebar.show_rejection(&"ship_already_used", FleetBattleState.Player.ONE)
	t.expect_eq(sidebar.message_label.text, "Ship already activated", "used rejection uses fleet wording")
	sidebar.show_rejection(&"ship_sunk", FleetBattleState.Player.ONE)
	t.expect_eq(sidebar.message_label.text, "Ship has sunk", "sunk rejection uses fleet wording")
	sidebar.show_rejection(&"invalid_target", FleetBattleState.Player.ONE)
	t.expect_eq(sidebar.message_label.text, "Choose an enemy ship", "target rejection uses fleet wording")

	sidebar.queue_free()
	await tree.process_frame


func _make_fleet_state() -> FleetBattleState:
	var definitions: Array[ShipDefinition] = []
	for path in CLASS_PATHS:
		definitions.append(load(path))
	var state := FleetBattleState.new()
	var errors := state.setup(_make_board(), definitions, STARTS)
	assert(errors.is_empty(), "Sidebar fleet fixture must be valid")
	return state


func _make_board() -> HexBoard:
	var cells: Array[Vector2i] = [
		Vector2i(-3, 0), Vector2i(-2, 0), Vector2i(-1, 0),
		Vector2i(1, 0), Vector2i(2, 0), Vector2i(3, 0),
	]
	var neighbors := {}
	for cell in cells:
		neighbors[cell] = []
	var board := HexBoard.new()
	board.configure(cells, [], neighbors)
	return board
