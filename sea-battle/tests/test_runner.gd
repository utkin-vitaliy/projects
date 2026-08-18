extends SceneTree

const SUITES := [
	"res://tests/test_definitions.gd",
	"res://tests/test_hex_board.gd",
	"res://tests/test_fleet_state.gd",
	"res://tests/test_fleet_battle_state.gd",
	"res://tests/test_ship_view.gd",
	"res://tests/test_tactical_sidebar.gd",
	"res://tests/test_battle_state.gd",
	"res://tests/test_battle_scene.gd",
]


func _initialize() -> void:
	var context := TestContext.new()
	for suite_path in SUITES:
		var suite_script: Script = load(suite_path)
		if suite_script == null or not suite_script.can_instantiate():
			context.expect_true(false, "suite loads: %s" % suite_path)
			continue
		var suite = suite_script.new()
		await suite.run(context, self)
	print("Tests: %d assertions, %d failures" % [context.assertions, context.failures])
	quit(context.failures)
