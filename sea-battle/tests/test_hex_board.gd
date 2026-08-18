extends RefCounted


func run(t: TestContext, _tree: SceneTree) -> void:
	var center := Vector2i.ZERO
	var east := Vector2i(1, 0)
	var north_east := Vector2i(1, -1)
	var north_west := Vector2i(0, -1)
	var west := Vector2i(-1, 0)
	var south_west := Vector2i(-1, 1)
	var south_east := Vector2i(0, 1)
	var north_east_two := Vector2i(2, -1)
	var far_east := Vector2i(2, 0)
	var cells: Array[Vector2i] = [
		center, east, north_east, north_west, west,
		south_west, south_east, north_east_two, far_east,
	]
	var neighbors := {
		center: [east, north_east, north_west, west, south_west, south_east],
		east: [center, north_east, south_east, far_east],
		north_east: [center, east, north_west, north_east_two],
		north_west: [center, north_east, west],
		west: [center, north_west, south_west],
		south_west: [center, west, south_east],
		south_east: [center, south_west, east],
		north_east_two: [north_east, far_east],
		far_east: [east, north_east_two],
	}

	var board := HexBoard.new()
	var blocked: Array[Vector2i] = [east]
	board.configure(cells, blocked, neighbors)
	t.expect_true(board.has_cell(center), "fixture center exists")
	t.expect_true(board.is_blocked(east), "land is blocked")
	t.expect_eq(board.distance(center, far_east), 2, "geometric distance ignores land")
	t.expect_eq(
		board.path(center, far_east),
		[center, north_east, north_east_two, far_east],
		"movement routes around blocked land"
	)
	t.expect_false(board.reachable(center, 1).has(far_east), "movement limit excludes distant cells")
	t.expect_true(board.reachable(center, 3).has(far_east), "reachable includes valid detour")
	t.expect_eq(
		board.path(center, far_east, {north_east: true}),
		[],
		"occupied detour can make destination unreachable"
	)
