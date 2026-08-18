class_name CommandResult
extends RefCounted

var ok: bool
var reason: StringName
var events: Array[BattleEvent]


static func success(new_events: Array[BattleEvent]) -> CommandResult:
	var result := CommandResult.new()
	result.ok = true
	result.reason = &""
	result.events = new_events
	return result


static func failure(rejection: StringName) -> CommandResult:
	var result := CommandResult.new()
	result.ok = false
	result.reason = rejection
	result.events = []
	return result
