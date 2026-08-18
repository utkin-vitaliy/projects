class_name BattleAnimator
extends Node2D

const SINK_DURATION := 0.28
const TURN_BANNER_DURATION := 0.55
const ROUND_BANNER_DURATION := 0.7

var skip_animations := false


func play(
	events: Array[BattleEvent],
	ship_views: Dictionary,
	tile_map: TileMapLayer,
	sidebar: TacticalSidebar
) -> void:
	for event in events:
		match event.type:
			&"ship_moved":
				await _play_movement(event, ship_views, tile_map)
			&"ship_attacked":
				await _play_attack(event, ship_views)
			&"ship_damaged":
				await _play_damage(event, ship_views)
			&"ship_sunk":
				await _play_sinking(event, ship_views)
			&"activation_completed":
				_play_activation_completed(event, ship_views)
			&"player_changed":
				await _play_turn_change(event, sidebar)
			&"round_started":
				await _play_round_start(event, sidebar)
			&"battle_won":
				sidebar.show_result(event.data["winner"])


func clear() -> void:
	for child in get_children():
		child.queue_free()


func _play_movement(event: BattleEvent, ship_views: Dictionary, tile_map: TileMapLayer) -> void:
	var view: ShipView = ship_views[event.data["ship_id"]]
	var path: Array = event.data["path"]
	if skip_animations:
		view.position = tile_map.map_to_local(path.back())
		return
	var tween := create_tween()
	for index in range(1, path.size()):
		tween.tween_property(view, "position", tile_map.map_to_local(path[index]), 0.12)
	await tween.finished


func _play_attack(event: BattleEvent, ship_views: Dictionary) -> void:
	if skip_animations:
		return
	var attacker: ShipView = ship_views[event.data["attacker_id"]]
	var target: ShipView = ship_views[event.data["target_id"]]
	var projectile := Polygon2D.new()
	projectile.polygon = PackedVector2Array([
		Vector2(-6, 0), Vector2(0, -4), Vector2(6, 0), Vector2(0, 4),
	])
	projectile.color = Color("d5a653")
	projectile.position = attacker.position
	add_child(projectile)
	var tween := create_tween()
	tween.tween_property(projectile, "position", target.position, 0.18)
	await tween.finished
	projectile.queue_free()


func _play_damage(event: BattleEvent, ship_views: Dictionary) -> void:
	var target: ShipView = ship_views[event.data["ship_id"]]
	target.hull = event.data["hull"]
	if skip_animations:
		target.displayed_hull = event.data["hull"]
		return
	var original_modulate := target.modulate
	target.modulate = Color(1.0, 0.38, 0.32, 1.0)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(target, "displayed_hull", float(event.data["hull"]), 0.16)
	tween.tween_property(target, "scale", Vector2(1.18, 1.18), 0.08)
	tween.tween_property(target, "modulate", Color.WHITE, 0.08)
	tween.chain().tween_property(target, "scale", Vector2.ONE, 0.08)
	tween.tween_property(target, "modulate", original_modulate, 0.08)
	await tween.finished


func _play_sinking(event: BattleEvent, ship_views: Dictionary) -> void:
	var target: ShipView = ship_views[event.data["ship_id"]]
	if skip_animations:
		target.hide()
		target.set_process_input(false)
		return

	var original_transform := target.transform
	var original_modulate := target.modulate
	var ring := _create_water_ring(target.position)
	target.modulate = Color(1.0, 0.55, 0.46, 1.0)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(target, "scale", Vector2(0.75, 0.15), SINK_DURATION)
	tween.tween_property(target, "modulate:a", 0.0, SINK_DURATION)
	tween.tween_property(ring, "scale", Vector2(1.2, 0.68), SINK_DURATION)
	tween.tween_property(ring, "modulate:a", 0.0, SINK_DURATION)
	await tween.finished
	target.hide()
	target.set_process_input(false)
	target.transform = original_transform
	target.modulate = original_modulate
	ring.queue_free()


func _play_activation_completed(event: BattleEvent, ship_views: Dictionary) -> void:
	var view: ShipView = ship_views[event.data["ship_id"]]
	view.set_active(false)
	view.set_used(true)


func _play_turn_change(event: BattleEvent, sidebar: TacticalSidebar) -> void:
	sidebar.show_turn_banner(event.data["player"])
	if not skip_animations:
		await get_tree().create_timer(TURN_BANNER_DURATION).timeout
	sidebar.hide_turn_banner()


func _play_round_start(event: BattleEvent, sidebar: TacticalSidebar) -> void:
	sidebar.show_round_banner(event.data["round"], event.data["player"])
	if not skip_animations:
		await get_tree().create_timer(ROUND_BANNER_DURATION).timeout
	sidebar.hide_turn_banner()


func _create_water_ring(ring_position: Vector2) -> Line2D:
	var ring := Line2D.new()
	ring.name = "WaterRing"
	ring.closed = true
	ring.width = 3.0
	ring.default_color = Color("82d6dc")
	ring.antialiased = true
	for index in 24:
		var angle := TAU * float(index) / 24.0
		ring.add_point(Vector2.from_angle(angle) * 30.0)
	ring.position = ring_position
	ring.scale = Vector2(0.55, 0.3)
	add_child(ring)
	return ring
