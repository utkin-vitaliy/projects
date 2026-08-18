extends RefCounted

const CLASS_PATHS := {
	&"sloop": "res://resources/ships/sloop.tres",
	&"frigate": "res://resources/ships/frigate.tres",
	&"galleon": "res://resources/ships/galleon.tres",
}


func run(t: TestContext, tree: SceneTree) -> void:
	var sloop := _fleet_view(tree, &"sloop-one", 1, &"sloop")
	var frigate := _fleet_view(tree, &"frigate-one", 1, &"frigate")
	var galleon := _fleet_view(tree, &"galleon-one", 1, &"galleon")
	var opposing_sloop := _fleet_view(tree, &"sloop-two", 2, &"sloop")
	var supports_texture_rotation := sloop.has_method("get_ship_texture_rotation")
	t.expect_true(
		supports_texture_rotation,
		"ship view exposes the rotation applied to its rendered texture"
	)
	if supports_texture_rotation:
		t.expect_true(
			is_equal_approx(float(sloop.call("get_ship_texture_rotation")), PI),
			"Player 1 ship texture faces north"
		)
		t.expect_true(
			is_zero_approx(float(opposing_sloop.call("get_ship_texture_rotation"))),
			"Player 2 ship texture keeps its authored orientation"
		)
	var supports_ship_texture := sloop.has_method("get_ship_texture")
	t.expect_true(supports_ship_texture, "ship view exposes its rendered owner texture")
	if supports_ship_texture:
		var player_one_texture := sloop.call("get_ship_texture") as Texture2D
		var player_two_texture := opposing_sloop.call("get_ship_texture") as Texture2D
		t.expect_not_null(player_one_texture, "Player 1 sloop renders a texture")
		t.expect_not_null(player_two_texture, "Player 2 sloop renders a texture")
		if player_one_texture != null:
			t.expect_eq(
				player_one_texture.resource_path,
				"res://assets/ships/kenney/player_one_sloop.png",
				"Player 1 ship view uses the blue sloop PNG"
			)
		if player_two_texture != null:
			t.expect_eq(
				player_two_texture.resource_path,
				"res://assets/ships/kenney/player_two_sloop.png",
				"Player 2 ship view uses the red sloop PNG"
			)
		t.expect_true(player_one_texture != player_two_texture, "owners render distinct colored PNGs")

	t.expect_true(
		sloop.get_visual_bounds().size.x < frigate.get_visual_bounds().size.x,
		"sloop silhouette is narrower than frigate"
	)
	t.expect_true(
		frigate.get_visual_bounds().size.x < galleon.get_visual_bounds().size.x,
		"frigate silhouette is narrower than galleon"
	)
	t.expect_true(
		sloop.get_visual_bounds().size.y < frigate.get_visual_bounds().size.y,
		"sloop sprite is shorter than frigate"
	)
	t.expect_true(
		frigate.get_visual_bounds().size.y < galleon.get_visual_bounds().size.y,
		"frigate sprite is shorter than galleon"
	)
	t.expect_eq(sloop.mast_count(), 1, "sloop has one mast")
	t.expect_eq(frigate.mast_count(), 2, "frigate has two masts")
	t.expect_eq(galleon.mast_count(), 3, "galleon has three masts")
	t.expect_eq(
		sloop.get_visual_bounds(),
		opposing_sloop.get_visual_bounds(),
		"both owners use identical class geometry"
	)
	t.expect_true(
		sloop.get_ownership_color() != opposing_sloop.get_ownership_color(),
		"owners use different ownership colors"
	)
	t.expect_eq(sloop.ship_id, &"sloop-one", "fleet configuration stores ship id")
	t.expect_eq(
		sloop.definition,
		load(CLASS_PATHS[&"sloop"]),
		"fleet configuration stores its rules definition"
	)

	sloop.set_hull(1, 2)
	t.expect_eq(sloop.hull, 1, "hull presentation stores current hull")
	t.expect_eq(sloop.max_hull, 2, "hull presentation stores maximum hull")
	sloop.set_ready(true)
	t.expect_true(sloop.is_ready, "ready presentation is enabled")
	t.expect_false(sloop.is_used, "ready presentation clears used state")
	sloop.set_used(true)
	t.expect_true(sloop.is_used, "used presentation is enabled")
	t.expect_false(sloop.is_ready, "used presentation clears ready state")
	sloop.set_active(true)
	t.expect_true(sloop.is_active, "active presentation is enabled")
	await _expect_no_active_ship_border(t, tree, sloop)

	var retained_definition: ShipDefinition = sloop.definition
	sloop.set_sunk(true)
	t.expect_false(sloop.visible, "sunk presentation is hidden")
	t.expect_false(sloop.is_processing_input(), "sunk presentation ignores input")
	t.expect_eq(sloop.definition, retained_definition, "sinking retains the rules definition")
	sloop.set_sunk(false)
	t.expect_true(sloop.visible, "restored presentation is visible")
	t.expect_true(sloop.is_processing_input(), "restored presentation accepts input")

	for view in [sloop, frigate, galleon, opposing_sloop]:
		view.free()


func _fleet_view(
	tree: SceneTree,
	id: StringName,
	owner: int,
	class_id: StringName
) -> ShipView:
	var view := ShipView.new()
	tree.root.add_child(view)
	view.configure(id, owner, load(CLASS_PATHS[class_id]))
	return view


func _expect_no_active_ship_border(
	t: TestContext,
	tree: SceneTree,
	view: ShipView
) -> void:
	if DisplayServer.get_name() == "headless":
		return
	var viewport := SubViewport.new()
	viewport.size = Vector2i(128, 128)
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	tree.root.add_child(viewport)
	view.reparent(viewport)
	view.position = Vector2(64.0, 48.0)
	await tree.process_frame
	await tree.process_frame

	var bounds := view.get_visual_bounds()
	var border_sample := Vector2i(
		roundi(view.position.x + bounds.position.x - 7.0),
		roundi(view.position.y)
	)
	var image := viewport.get_texture().get_image()
	t.expect_true(
		image.get_pixelv(border_sample).a < 0.05,
		"active ship draws no square selection border outside its sprite"
	)

	view.reparent(tree.root)
	viewport.queue_free()
