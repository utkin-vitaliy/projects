extends SceneTree

const SUITES := [
	"res://tests/test_definitions.gd",
	"res://tests/test_hex_board.gd",
]


func _initialize() -> void:
	var context := TestContext.new()
	for suite_path in SUITES:
		var suite_script: Script = load(suite_path)
		if suite_script == null:
			context.expect_not_null(suite_script, "suite loads: %s" % suite_path)
			continue
		var suite = suite_script.new()
		await suite.run(context, self)
	print("Tests: %d assertions, %d failures" % [context.assertions, context.failures])
	quit(context.failures)
