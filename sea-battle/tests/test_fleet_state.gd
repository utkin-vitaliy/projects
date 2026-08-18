extends RefCounted

const CLASS_PATHS := [
	"res://resources/ships/sloop.tres",
	"res://resources/ships/frigate.tres",
	"res://resources/ships/galleon.tres",
]


func load_definitions() -> Array[ShipDefinition]:
	var definitions: Array[ShipDefinition] = []
	for path in CLASS_PATHS:
		var definition: ShipDefinition = load(path)
		definitions.append(definition)
	return definitions


func run(t: TestContext, _tree: SceneTree) -> void:
	var fleet := FleetState.new()
	fleet.configure(
		1,
		load_definitions(),
		[Vector2i(-1, 1), Vector2i(0, 1), Vector2i(1, 1)]
	)
	t.expect_eq(fleet.ordered_ships().size(), 3, "fleet contains three ships")
	t.expect_eq(fleet.ordered_ships()[0].ship_id, &"p1_sloop", "stable ID includes owner and class")
	t.expect_eq(fleet.ready_ships().size(), 3, "all ships begin ready")
	fleet.ship(&"p1_sloop").activation_used = true
	t.expect_eq(fleet.ready_ships().size(), 2, "used ship leaves ready list")
	fleet.ship(&"p1_frigate").hull = 0
	t.expect_eq(fleet.living_ships().size(), 2, "sunk ship leaves living list")
	t.expect_false(fleet.occupied_cells().has(Vector2i(0, 1)), "sunk ship stops occupying its cell")

	var ordered := fleet.ordered_ships()
	ordered.clear()
	t.expect_eq(fleet.ordered_ships().size(), 3, "ordered ship query returns a fresh array")
	fleet.reset_activations()
	t.expect_eq(fleet.ready_ships().size(), 2, "reset restores living ships to ready")
	fleet.ship(&"p1_sloop").hull = 0
	fleet.ship(&"p1_galleon").hull = 0
	t.expect_true(fleet.is_defeated(), "fleet is defeated when all ships are sunk")
