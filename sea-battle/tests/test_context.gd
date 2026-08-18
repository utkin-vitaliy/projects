class_name TestContext
extends RefCounted

var assertions := 0
var failures := 0


func expect_true(value: bool, message: String) -> void:
	assertions += 1
	if not value:
		failures += 1
		push_error(message)


func expect_false(value: bool, message: String) -> void:
	expect_true(not value, message)


func expect_eq(actual: Variant, expected: Variant, message: String) -> void:
	assertions += 1
	if actual != expected:
		failures += 1
		push_error("%s: expected %s, got %s" % [message, expected, actual])


func expect_not_null(value: Variant, message: String) -> void:
	expect_true(value != null, message)
