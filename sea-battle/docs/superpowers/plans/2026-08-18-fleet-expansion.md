# Sea Battle Fleet Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-ship duel with a tested local fleet battle containing one sloop, frigate, and galleon per player on a 127-cell hexagonal battlefield.

**Architecture:** Build the new fleet rules beside the working duel rules, then switch the battle scene only after the fleet model, map, visuals, and roster are independently tested. Gameplay remains resource-driven and scene-free; the Godot scene translates map or roster input into commands and animates typed events without mutating rules state.

**Tech Stack:** Godot 4.7.1, typed GDScript, `Resource`, `TileMapLayer`, `AStar2D`, editor-authored `.tscn`/`.tres`, custom headless test runner.

**Spec:** `docs/superpowers/specs/2026-08-18-fleet-expansion-design.md`

Run every command from the repository root: `/home/vitaliy/dev/projects/sea-battle`.

## Global Constraints

- Desktop target is exactly 1280×720 for this milestone; the complete map and sidebar require no camera movement.
- Render the radius-six board under one uniformly scaled `BoardRoot` at `0.88`; tile map, highlights, ships, and animator must share that transform.
- Both players are human and local; do not add AI, networking, deployment, abilities, randomness, or hidden information.
- Fleet classes and baseline values are Sloop `(hull 2, move 4, range 2, damage 1)`, Frigate `(4, 3, 3, 1)`, and Galleon `(6, 2, 2, 2)`.
- Each surviving ship activates at most once per round; unmatched surviving ships finish their activations and round initiative alternates.
- Attacking ends an activation; attack without movement remains legal; movement after attacking is illegal.
- The galleon must sink a full-health sloop in one guaranteed hit.
- The battlefield is a seven-cells-per-side hexagon with exactly 127 cells and an authored central mountain chain.
- Class identity must remain readable without color; ownership color is separate from silhouette and text.
- Rules return stable `StringName` rejection codes and typed ordered events; UI owns wording.
- Use TDD for every behavior change. A Godot exit code of zero is insufficient if output contains `SCRIPT ERROR`, `ERROR:`, or `Parse Error`.
- Preserve unrelated user changes and do not add deferred subsystem scaffolding.

## Target File Structure

New focused units:

```text
scripts/definitions/ship_visual_profile.gd   # data-only historic silhouette profile
scripts/rules/fleet_ship_state.gd            # one fleet ship's mutable match state
scripts/rules/fleet_state.gd                 # one player's ordered ship collection and readiness
scripts/rules/fleet_battle_state.gd          # fleet commands, rounds, damage, victory, reset
scripts/ui/fleet_roster_row.gd               # one reusable READY/ACTIVE/USED/SUNK row
scenes/components/fleet_roster_row.tscn      # editor-authored roster row
resources/ship_visuals/*.tres                # sloop/frigate/galleon silhouette data
resources/ships/{sloop,frigate,galleon}.tres # approved gameplay definitions
resources/maps/fleet_hex_map.tres            # explicit 127 cells, terrain, and six starts
tests/test_fleet_state.gd
tests/test_fleet_battle_state.gd
```

The temporary parallel `FleetBattleState` avoids breaking the playable duel while fleet rules are developed. Task 8 switches all consumers atomically, deletes the obsolete duel state and data, and makes the fleet version the only gameplay path.

---

### Task 1: Data-Driven Ship Classes and Visual Profiles

**Files:**
- Create: `scripts/definitions/ship_visual_profile.gd`
- Modify: `scripts/definitions/ship_definition.gd`
- Create: `resources/ship_visuals/sloop_visual.tres`
- Create: `resources/ship_visuals/frigate_visual.tres`
- Create: `resources/ship_visuals/galleon_visual.tres`
- Create: `resources/ships/sloop.tres`
- Create: `resources/ships/frigate.tres`
- Create: `resources/ships/galleon.tres`
- Modify: `tests/test_definitions.gd`

**Interfaces:**
- Produces: `ShipVisualProfile` with `hull_points`, `mast_offsets`, `raised_stern`, `gun_port_count`, and `icon_code`.
- Produces: `ShipDefinition.class_id`, `weight_label`, `tactical_role`, and `visual_profile`.
- Produces: class resources loaded later as `Array[ShipDefinition]` in sloop, frigate, galleon order.

- [ ] **Step 1: Extend the definition test with exact failing class expectations**

Add a helper and assertions to `test_definitions.gd`:

```gdscript
const CLASS_PATHS := [
	"res://resources/ships/sloop.tres",
	"res://resources/ships/frigate.tres",
	"res://resources/ships/galleon.tres",
]

func test_fleet_classes(t: TestContext) -> void:
	var expected := {
		&"sloop": ["Sloop", "Light", 2, 4, 2, 1],
		&"frigate": ["Frigate", "Medium", 4, 3, 3, 1],
		&"galleon": ["Galleon", "Heavy", 6, 2, 2, 2],
	}
	for path in CLASS_PATHS:
		var definition: ShipDefinition = load(path)
		t.expect_not_null(definition, "%s loads" % path)
		if definition == null:
			continue
		var values: Array = expected[definition.class_id]
		t.expect_eq(
			[definition.display_name, definition.weight_label, definition.max_hull,
			 definition.movement, definition.attack_range, definition.damage],
			values,
			"%s has approved balance" % definition.class_id
		)
		t.expect_not_null(definition.visual_profile, "%s has visual profile" % definition.class_id)
		t.expect_true(definition.visual_profile.hull_points.size() >= 6, "silhouette is drawable")
```

Call `test_fleet_classes(t)` from `run`.

- [ ] **Step 2: Run the suite and verify the new resources fail to load**

Run:

```bash
/home/vitaliy/.local/bin/godot --headless --path . -s res://tests/test_runner.gd
```

Expected: failures for missing class resources or missing `class_id`/`visual_profile` properties. Record the red output before implementation.

- [ ] **Step 3: Implement the two definition resource types**

Create `ship_visual_profile.gd`:

```gdscript
class_name ShipVisualProfile
extends Resource

@export var hull_points := PackedVector2Array()
@export var mast_offsets := PackedFloat32Array()
@export var raised_stern := false
@export_range(0, 20) var gun_port_count := 0
@export var icon_code: StringName
```

Extend `ShipDefinition` without removing existing numeric fields:

```gdscript
@export var class_id: StringName
@export var weight_label := "Medium"
@export_multiline var tactical_role := "Balanced fleet ship"
@export var visual_profile: ShipVisualProfile
```

- [ ] **Step 4: Author the three visual and gameplay resources**

Use player-neutral profiles. Sloop uses a narrow six-point hull and one mast; frigate uses an eight-point longer hull and two masts; galleon uses a broad eight-point hull, three masts, `raised_stern = true`, and six gun ports. Set `icon_code` to `&"sloop"`, `&"frigate"`, and `&"galleon"` respectively.

Author the `.tres` ship definitions with these exact role strings:

```text
Sloop:   "Fast flanker and vulnerable scout"
Frigate: "Durable ranged-control ship"
Galleon: "Slow, close-range fleet anchor"
```

- [ ] **Step 5: Import and run the suite**

Run the guarded import and tests:

```bash
set -o pipefail
/home/vitaliy/.local/bin/godot --headless --path . --import 2>&1 | tee /tmp/fleet-task1-import.log
! rg -n 'SCRIPT ERROR|ERROR:|Parse Error' /tmp/fleet-task1-import.log
/home/vitaliy/.local/bin/godot --headless --path . -s res://tests/test_runner.gd 2>&1 | tee /tmp/fleet-task1-tests.log
! rg -n 'SCRIPT ERROR|ERROR:|Parse Error' /tmp/fleet-task1-tests.log
```

Expected: all previous assertions and the new exact class assertions pass.

- [ ] **Step 6: Commit class data**

```bash
git add scripts/definitions resources/ship_visuals resources/ships tests/test_definitions.gd
git commit -m "feat: add light medium and heavy ship definitions"
```

---

### Task 2: Explicit 127-Cell Hexagonal Fleet Map

**Files:**
- Modify: `scripts/definitions/map_definition.gd`
- Create: `resources/maps/fleet_hex_map.tres`
- Modify: `tests/test_definitions.gd`
- Create temporarily, then delete before commit: `tests/build_fleet_map_resource.gd`

**Interfaces:**
- Produces: `MapDefinition.playable_cells`, `player_one_starts`, and `player_two_starts`.
- Preserves: `all_cells()`, `terrain_at(cell)`, and `validate(neighbors, tile_set)` for screen consumers.
- Produces stable validation codes in this order: `incorrect_cell_count`, `duplicate_cell`, `incorrect_fleet_size`, `duplicate_start`, `start_outside_map`, `blocked_outside_map`, `start_blocked`, `starts_disconnected`, and `map_disconnected`.

- [ ] **Step 1: Add failing map-shape and start validation tests**

Load `fleet_hex_map.tres` and assert:

```gdscript
func test_fleet_hex_map(t: TestContext) -> void:
	var map: MapDefinition = load("res://resources/maps/fleet_hex_map.tres")
	t.expect_not_null(map, "fleet hex map loads")
	if map == null:
		return
	t.expect_eq(map.all_cells().size(), 127, "seven-side hex has 127 cells")
	t.expect_eq(map.player_one_starts.size(), 3, "player one has three starts")
	t.expect_eq(map.player_two_starts.size(), 3, "player two has three starts")
	var starts := map.player_one_starts + map.player_two_starts
	var unique := {}
	for cell in starts:
		unique[cell] = true
		t.expect_true(map.all_cells().has(cell), "start %s is playable" % cell)
		t.expect_false(map.blocked_cells.has(cell), "start %s is walkable" % cell)
	t.expect_eq(unique.size(), 6, "all fleet starts are distinct")
```

Extend independent invalid-map fixtures to assert the new stable codes and deterministic order.

- [ ] **Step 2: Run the suite and verify missing map fields/resource fail**

Expected: the new map resource fails to load and `MapDefinition` lacks the array properties.

- [ ] **Step 3: Add explicit cells with a temporary duel fallback**

Use:

```gdscript
@export var playable_cells: Array[Vector2i] = []
@export var blocked_cells: Array[Vector2i] = []
@export var player_one_starts: Array[Vector2i] = []
@export var player_two_starts: Array[Vector2i] = []

func all_cells() -> Array[Vector2i]:
	if not playable_cells.is_empty():
		return playable_cells.duplicate()
	var legacy_cells: Array[Vector2i] = []
	for y in range(size.y):
		for x in range(size.x):
			legacy_cells.append(Vector2i(x, y))
	return legacy_cells

func _contains(cell: Vector2i) -> bool:
	return all_cells().has(cell)
```

Retain the existing `size`, `player_one_start`, and `player_two_start` exports only as a documented migration seam so the duel scene remains green through Task 7. `validate` uses fleet start arrays when populated and otherwise preserves legacy validation. Update fleet validation in the exact order listed in **Interfaces**. Connectivity must configure a temporary `HexBoard` with every playable cell, ensure each of the six starts can reach the first valid start, and ensure every non-blocked playable cell is reachable from that same start. Do not silently remove duplicate cells/starts or out-of-map blocked cells. Task 8 removes the fallback and obsolete resource atomically.

- [ ] **Step 4: Generate and save the explicit authored map resource once**

Create a temporary `SceneTree` script. Derive the radius-six cell set from the project's real hex `TileSet`; Godot's `TileMapLayer` coordinates use its configured stacked layout and must not be treated as raw axial coordinates:

```gdscript
var tile_map := TileMapLayer.new()
tile_map.tile_set = load("res://resources/tiles/prototype_tileset.tres")
var visited := {Vector2i.ZERO: true}
var frontier: Array[Vector2i] = [Vector2i.ZERO]
for _radius in range(6):
	var next: Array[Vector2i] = []
	for cell in frontier:
		for neighbor in tile_map.get_surrounding_cells(cell):
			if not visited.has(neighbor):
				visited[neighbor] = true
				next.append(neighbor)
	frontier = next
map.playable_cells.assign(visited.keys())
map.playable_cells.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
	return a.y < b.y or (a.y == b.y and a.x < b.x)
)
```

Use these exact starts, ordered sloop, frigate, galleon:

```gdscript
map.player_one_starts = [Vector2i(-2, 5), Vector2i(0, 6), Vector2i(2, 5)]
map.player_two_starts = [Vector2i(-2, -5), Vector2i(0, -6), Vector2i(2, -5)]
```

Use this initial broken central chain:

```gdscript
map.blocked_cells = [
	Vector2i(-3, -2), Vector2i(-2, -2),
	Vector2i(-1, -1), Vector2i(0, -1),
	Vector2i(2, -1), Vector2i(3, -1),
	Vector2i(-2, 1), Vector2i(-1, 1),
	Vector2i(1, 1), Vector2i(2, 1),
	Vector2i(0, 2), Vector2i(1, 2),
]
```

Assign the existing water and land definitions and save with:

```gdscript
ResourceSaver.save(map, "res://resources/maps/fleet_hex_map.tres")
```

Run the builder once headlessly, inspect the saved `.tres`, and delete the temporary builder script before staging. This is authored data creation, not a runtime procedural-map subsystem.

Before accepting the resource, build `neighbors` from the same `TileMapLayer.get_surrounding_cells()` topology. Assert 127 distinct keys, validate all six starts through that graph, and render one temporary screenshot to confirm the outer boundary is a true six-sided hex rather than merely a 127-cell data set.

- [ ] **Step 5: Run map tests and guarded import**

Expected: 127 unique cells, six valid starts, all invalid fixtures return exact stable codes, and existing tile validation remains green.

- [ ] **Step 6: Commit the map migration**

```bash
git add scripts/definitions/map_definition.gd resources/maps/fleet_hex_map.tres tests/test_definitions.gd
git commit -m "feat: add handcrafted hexagonal fleet map"
```

---

### Task 3: Fleet and Ship Runtime State

**Files:**
- Create: `scripts/rules/fleet_ship_state.gd`
- Create: `scripts/rules/fleet_state.gd`
- Create: `tests/test_fleet_state.gd`
- Modify: `tests/test_runner.gd`

**Interfaces:**
- Produces: `FleetShipState.configure(ship_id, owner, definition, start)` and `activation_used`.
- Produces: `FleetState.configure(player, definitions, starts)`, `ship(id)`, `ordered_ships()`, `living_ships()`, `ready_ships()`, `has_ready_ship()`, `is_defeated()`, `occupied_cells()`, and `reset_activations()`.

- [ ] **Step 1: Register a failing fleet-state suite**

Create `test_fleet_state.gd` using the real class resources:

```gdscript
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
```

Append the suite path to `SUITES` after `test_hex_board.gd`.

- [ ] **Step 2: Run and verify `FleetState` is missing**

Expected: the suite cannot compile because `FleetState` does not exist.

- [ ] **Step 3: Create fleet-specific ship state without breaking the duel**

Create `fleet_ship_state.gd`; leave the duel's `ShipState` unchanged until Task 8:

```gdscript
class_name FleetShipState
extends RefCounted

var ship_id: StringName
var player: int
var cell: Vector2i
var hull: int
var definition: ShipDefinition
var activation_used := false
var movement_used := false
var attack_used := false

func configure(id: StringName, owner: int, ship_definition: ShipDefinition, start: Vector2i) -> void:
	ship_id = id
	player = owner
	definition = ship_definition
	cell = start
	hull = definition.max_hull
	reset_for_battle()

func reset_for_activation() -> void:
	movement_used = false
	attack_used = false

func reset_for_round() -> void:
	activation_used = false
	reset_for_activation()

func reset_for_battle() -> void:
	hull = definition.max_hull
	reset_for_round()

func is_destroyed() -> bool:
	return hull <= 0
```

- [ ] **Step 4: Implement ordered `FleetState`**

Keep one dictionary for lookup and one `Array[StringName]` for deterministic UI/event order. Generate IDs with `&"p%d_%s" % [player, definition.class_id]`. Validate array sizes at the battle setup boundary rather than truncating with `mini`.

Every query returns a new `Array[FleetShipState]`. A ship is ready only if it is not destroyed and `activation_used == false`.

- [ ] **Step 5: Run fleet and complete suites**

Expected: fleet queries pass without changing the still-playable duel path.

- [ ] **Step 6: Commit runtime fleet state**

```bash
git add scripts/rules/fleet_ship_state.gd scripts/rules/fleet_state.gd tests/test_fleet_state.gd tests/test_runner.gd
git commit -m "feat: add ordered fleet runtime state"
```

---

### Task 4: Fleet Activation and Round Rules

**Files:**
- Create: `scripts/rules/fleet_battle_state.gd`
- Create: `tests/test_fleet_battle_state.gd`
- Modify: `tests/test_runner.gd`

**Interfaces:**
- Produces: `FleetBattleState.setup(board, definitions, starts_by_player) -> Array[StringName]`.
- Produces: `select_ship(ship_id)`, `cancel_selection()`, `move_selected_ship(destination)`, `end_activation()`, and `reset()`.
- Produces queries: `selected_ship()`, `active_fleet()`, `opposing_fleet()`, `reachable_cells()`, `occupied_cells(except_ship_id)`, and `is_game_over()`.
- Emits: `ship_selected`, `selection_cancelled`, `ship_moved`, `activation_completed`, `player_changed`, `round_started`, and `battle_reset`.

- [ ] **Step 1: Write failing activation and round tests**

Build a small open board fixture and assert independent cases:

```gdscript
const AXIAL_DIRECTIONS: Array[Vector2i] = [
	Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1),
	Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, 1),
]

func build_axial_neighbors(cells: Array[Vector2i]) -> Dictionary:
	var cell_set := {}
	var neighbors := {}
	for cell in cells:
		cell_set[cell] = true
	for cell in cells:
		var adjacent: Array[Vector2i] = []
		for direction in AXIAL_DIRECTIONS:
			if cell_set.has(cell + direction):
				adjacent.append(cell + direction)
		neighbors[cell] = adjacent
	return neighbors

func make_state() -> FleetBattleState:
	var board := HexBoard.new()
	var cells: Array[Vector2i] = []
	for q in range(-4, 5):
		for r in range(maxi(-4, -q - 4), mini(4, -q + 4) + 1):
			cells.append(Vector2i(q, r))
	board.configure(cells, [], build_axial_neighbors(cells))
	var state := FleetBattleState.new()
	state.setup(board, load_definitions(), {
		FleetBattleState.Player.ONE: [Vector2i(-3, 3), Vector2i(-2, 3), Vector2i(-1, 3)],
		FleetBattleState.Player.TWO: [Vector2i(3, -3), Vector2i(2, -3), Vector2i(1, -3)],
	})
	return state

func event_types(events: Array[BattleEvent]) -> Array[StringName]:
	var types: Array[StringName] = []
	for event in events:
		types.append(event.type)
	return types

func run(t: TestContext, _tree: SceneTree) -> void:
	test_rejects_invalid_setup_without_partial_state(t)
	test_selects_any_ready_active_ship(t)
	test_rejects_enemy_used_and_sunk_ships(t)
	test_moves_once_around_all_occupants(t)
	test_alternates_players_with_ready_ships(t)
	test_allows_unmatched_consecutive_activations(t)
	test_alternates_round_initiative(t)
	test_reset_restores_round_one(t)
```

For the unmatched case, mark two Player 2 ships destroyed, complete Player 2's only activation, and assert Player 1 can finish two ready ships consecutively. For initiative, complete all six activations twice and assert round starters `FleetBattleState.Player.TWO` then `FleetBattleState.Player.ONE`.

Copy `load_definitions()` from Task 3 into this test file. Do not share test-only helpers with production code.

Require exact event sequences. A normal `end_activation()` that switches players returns:

```gdscript
[&"activation_completed", &"player_changed"]
```

The sixth activation returns:

```gdscript
[&"activation_completed", &"round_started"]
```

- [ ] **Step 2: Run and verify `FleetBattleState` is missing**

- [ ] **Step 3: Implement setup, selection, movement, and cancellation**

Use:

```gdscript
class_name FleetBattleState
extends RefCounted

enum Player { ONE = 1, TWO = 2 }

var board: HexBoard
var fleets: Dictionary = {}
var active_player := Player.ONE
var round_starter := Player.ONE
var round_number := 1
var selected_ship_id: StringName = &""
var winner := 0
```

`setup` validates before assigning runtime state and returns all deterministic configuration errors: `board_missing`, `definition_missing`, `incorrect_fleet_size`, `duplicate_class`, `duplicate_start`, `start_outside_map`, then `start_blocked`. It requires a configured board, exactly three non-null definitions with unique class IDs, and exactly three distinct valid, walkable starts for each player. An invalid setup leaves `fleets` empty; a valid setup returns `[]`. Keep `FleetState.configure()` strict and call it only after this boundary succeeds.

`select_ship` rejects in this order: `game_over`, unknown ID as `invalid_target`, destroyed ID as `ship_sunk`, enemy as `inactive_player`, then used as `ship_already_used`. Successful selection resets only the selected ship's current activation actions and emits its ID/player.

Movement passes every living ship cell except the moving origin to `HexBoard.path` and `reachable`. It emits the stable ship ID plus the validated path.

Use these exact payload keys: `ship_selected {ship_id, player}`, `selection_cancelled {ship_id}`, and `ship_moved {ship_id, player, path}`. `activation_completed` carries `{ship_id, player}`, `player_changed` carries `{player}`, `round_started` carries `{round, player}`, and `battle_reset` carries `{round, player}`.

- [ ] **Step 4: Implement activation handoff and round reset**

`end_activation` requires a selection, marks the selected ship used, emits `activation_completed`, clears selection, then:

1. Switches to the opponent and emits `player_changed` if they have a ready ship.
2. Keeps the same player without a player-change event if only their own fleet has ready ships.
3. Otherwise increments the round, toggles `round_starter`, resets both living fleets, sets `active_player = round_starter`, and emits `round_started` with round and player.

- [ ] **Step 5: Run the fleet-rule suite and full regression suite**

Expected: exact activation and round sequences pass; the original duel remains green during parallel migration.

- [ ] **Step 6: Commit activation rules**

```bash
git add scripts/rules/fleet_battle_state.gd tests/test_fleet_battle_state.gd tests/test_runner.gd
git commit -m "feat: add alternating fleet activation rounds"
```

---

### Task 5: Targeted Combat, Sinking, and Fleet Victory

**Files:**
- Modify: `scripts/rules/fleet_battle_state.gd`
- Modify: `tests/test_fleet_battle_state.gd`

**Interfaces:**
- Produces: `legal_targets() -> Array[FleetShipState]`, `can_attack(target_id) -> bool`, and `attack(target_id) -> CommandResult`.
- Emits: `ship_attacked`, `ship_damaged`, `ship_sunk`, `activation_completed`, `player_changed`/`round_started`, and `battle_won`.

- [ ] **Step 1: Add failing targeted-combat tests**

Cover:

```gdscript
test_attack_without_moving_targets_explicit_enemy(t)
test_rejects_friendly_sunk_and_out_of_range_targets(t)
test_attack_ends_activation_and_forbids_later_movement(t)
test_galleon_sinks_full_health_sloop(t)
test_sunk_ship_stops_occupying_cell(t)
test_last_enemy_ship_wins_immediately(t)
```

The galleon/sloop test requires:

```gdscript
state.select_ship(&"p1_galleon")
var result := state.attack(&"p2_sloop")
t.expect_eq(state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull, 0, "heavy hit sinks light ship")
t.expect_eq(event_types(result.events).slice(0, 3),
	[&"ship_attacked", &"ship_damaged", &"ship_sunk"],
	"sinking events preserve presentation order")
```

Create that test state through `setup()` with the same open axial board but override the ordered starts to:

```gdscript
{
	FleetBattleState.Player.ONE: [Vector2i(-2, 0), Vector2i(-2, 1), Vector2i(-1, 0)],
	FleetBattleState.Player.TWO: [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1)],
}
```

This puts `p1_galleon` exactly two cells from `p2_sloop`; do not move ships by directly assigning cells in the test.

For a nonlethal attack that changes player, require:

```gdscript
[&"ship_attacked", &"ship_damaged", &"activation_completed", &"player_changed"]
```

For the final kill, require:

```gdscript
[&"ship_attacked", &"ship_damaged", &"ship_sunk", &"activation_completed", &"battle_won"]
```

- [ ] **Step 2: Run and verify missing target APIs fail**

- [ ] **Step 3: Implement legal target lookup and fixed damage**

`legal_targets` iterates the opposing fleet in deterministic class order and includes living ships whose geometric `board.distance` is between zero and the selected definition's range. `attack` rejects `selection_required`, `attack_used`, `invalid_target`, or `out_of_range` without mutation.

Apply damage with `maxi(0, target.hull - attacker.definition.damage)`. Emit `ship_sunk` only when the resulting hull is zero. Because `FleetState.occupied_cells` excludes destroyed ships, occupancy updates immediately in rules while animation safely runs under input lock.

Use these exact payload keys: `ship_attacked {attacker_id, target_id}`, `ship_damaged {ship_id, hull, max_hull, damage}`, `ship_sunk {ship_id, player, cell}`, and `battle_won {winner}`. Keep activation/handoff payloads from Task 4 unchanged.

- [ ] **Step 4: Implement victory before normal handoff**

Mark the attacker `activation_used`, emit `activation_completed`, then check `opposing_fleet().is_defeated()`. Set `winner`, emit `battle_won`, and do not start a new player or round. Otherwise reuse the activation-handoff helper from Task 4.

- [ ] **Step 5: Run all scene-free suites**

Expected: combat, sinking, rounds, map, class, and original duel suites pass with no engine errors.

- [ ] **Step 6: Commit combat rules**

```bash
git add scripts/rules/fleet_battle_state.gd tests/test_fleet_battle_state.gd
git commit -m "feat: add targeted fleet combat and sinking"
```

---

### Task 6: Historic Class Silhouettes and Six Ship Views

**Files:**
- Modify: `scripts/presentation/ship_view.gd`
- Create: `tests/test_ship_view.gd`
- Modify: `tests/test_runner.gd`

**Interfaces:**
- Consumes: `ShipDefinition.visual_profile` and owner integer.
- Produces temporarily: `ShipView.configure_fleet(ship_id, owner, definition)`, `ship_id`, and presentation state methods `set_hull`, `set_active`, `set_ready`, `set_used`, and `set_sunk`.
- Preserves the duel `configure(owner, definition)` entry point until Task 8 consolidates on the fleet signature.

- [ ] **Step 1: Add a failing view-profile suite**

Instantiate three `ShipView` nodes with real definitions and assert:

```gdscript
t.expect_true(sloop.get_visual_bounds().size.x < frigate.get_visual_bounds().size.x,
	"sloop silhouette is narrower than frigate")
t.expect_true(frigate.get_visual_bounds().size.x < galleon.get_visual_bounds().size.x,
	"frigate silhouette is narrower than galleon")
t.expect_eq(sloop.mast_count(), 1, "sloop has one mast")
t.expect_eq(frigate.mast_count(), 2, "frigate has two masts")
t.expect_eq(galleon.mast_count(), 3, "galleon has three masts")
```

Also assert both owners use identical geometry but different ownership colors, and `set_sunk(true)` disables visibility/input presentation without freeing the rules object.

- [ ] **Step 2: Run and verify new view APIs fail**

- [ ] **Step 3: Make `ShipView` consume its profile**

Store `definition` and draw `profile.hull_points`. Draw masts at `mast_offsets`, a raised stern when configured, and evenly spaced gun-port circles for the galleon. Keep hull bars, active brass outline, and inactive dimming. Add a non-color readiness glyph: hollow circle for ready, solid check for used, and no glyph for active.

Add `configure_fleet(id, owner, ship_definition)` and route both configure entry points into one private profile setup helper. Expose testable geometry queries that return profile data rather than inspecting draw commands:

```gdscript
func get_visual_bounds() -> Rect2:
	var points := definition.visual_profile.hull_points
	var bounds := Rect2(points[0], Vector2.ZERO)
	for point in points:
		bounds = bounds.expand(point)
	return bounds

func mast_count() -> int:
	return definition.visual_profile.mast_offsets.size()
```

Choose ownership colors by numeric owner value (`1` and `2`) inside a dedicated palette helper so this task does not depend on either duel or fleet battle-state constants.

- [ ] **Step 4: Run the view and full suites**

Expected: class geometry, ownership separation, and existing hull behavior pass.

- [ ] **Step 5: Render a temporary 1280×720 class lineup screenshot**

Use a temporary `SceneTree` capture script outside the repository. Configure all six owner/class combinations and inspect the PNG with the image viewer. Verify class identity remains obvious in grayscale/shape, player palette does not alter geometry, and all hull bars remain readable. Delete the temporary script and PNG after review.

- [ ] **Step 6: Commit class presentation**

```bash
git add scripts/presentation/ship_view.gd tests/test_ship_view.gd tests/test_runner.gd
git commit -m "feat: render historic fleet class silhouettes"
```

---

### Task 7: Persistent Fleet Roster Sidebar

**Files:**
- Create: `scripts/ui/fleet_roster_row.gd`
- Create: `scenes/components/fleet_roster_row.tscn`
- Modify: `scenes/components/tactical_sidebar.tscn`
- Modify: `scripts/ui/tactical_sidebar.gd`
- Create: `tests/test_tactical_sidebar.gd`
- Modify: `tests/test_runner.gd`

**Interfaces:**
- Produces: `FleetRosterRow.ship_selected(ship_id)` and `render(ship, status)`.
- Produces: `TacticalSidebar.ship_selected(ship_id)`, `render_fleet(state)`, `set_selected_ship(ship)`, `row_for(ship_id) -> FleetRosterRow`, and existing overlay/message signals.
- Consumes exact status strings: `READY`, `ACTIVE`, `USED`, `SUNK`.

- [ ] **Step 1: Add failing sidebar contract assertions**

Instantiate `tactical_sidebar.tscn` directly in `test_tactical_sidebar.gd`, add it to the test tree, and render a fixture `FleetBattleState`. Assert:

```gdscript
t.expect_eq(sidebar.roster_rows.size(), 3, "sidebar shows three fleet rows")
t.expect_eq(sidebar.roster_rows[0].class_label.text, "SLOOP", "first row is sloop")
t.expect_eq(sidebar.roster_rows[0].status_label.text, "READY", "unused ship is ready")
t.expect_eq(sidebar.round_label.text, "ROUND 1", "round header is visible")
t.expect_eq(sidebar.end_turn_button.text, "END ACTIVATION", "action copy matches fleet rules")
```

After selecting and marking fixture ships, assert exact `ACTIVE`, `USED`, and `SUNK` states and disabled selection for non-ready rows. Emit a ready row click and assert the sidebar forwards its stable ID.

- [ ] **Step 2: Run and verify roster nodes/APIs are missing**

- [ ] **Step 3: Build the reusable editor-authored row**

Use this tree:

```text
FleetRosterRow (Button; fleet_roster_row.gd)
└── RowMargin
    └── RowContent (HBoxContainer)
        ├── ClassIcon (Control)
        ├── Identity (VBoxContainer)
        │   ├── ClassName (Label)
        │   └── Hull (ProgressBar)
        └── Status (Label)
```

The row stores `ship_id`, emits it on press, and disables itself unless status is `READY`. Status must be text and style, never color alone.

- [ ] **Step 4: Add roster plus detail behind a temporary duel-compatible seam**

Keep active-player, messages, overlays, primary button, and the existing detail node names used by the duel. Add `Round`, `Roster`, and selected detail labels for weight and tactical role. `render_fleet` creates no controls in code: instance exactly three pre-authored row scenes under the `Roster` container in the `.tscn` and cache them by index.

Preserve `render(state: BattleState)` through this task so the current battle scene and its regression suite remain green; it hides the roster and renders the legacy duel detail. `render_fleet(state: FleetBattleState)` shows the roster and new detail. Task 8 removes the duel-typed method and makes the fleet path exclusive.

Map rule codes to fleet wording, including `ship_already_used -> "Ship already activated"`, `ship_sunk -> "Ship has sunk"`, and `invalid_target -> "Choose an enemy ship"`.

- [ ] **Step 5: Run sidebar tests and inspect at 1280×720**

Verify no row, role copy, stat line, message, or button clips at the stable sidebar width. Keyboard focus must be visible on all ready rows and **END ACTIVATION**.

- [ ] **Step 6: Commit roster UI**

```bash
git add scripts/ui scenes/components tests/test_tactical_sidebar.gd tests/test_runner.gd
git commit -m "feat: add persistent tactical fleet roster"
```

---

### Task 8: Atomically Switch the Battle Scene to Fleet Gameplay

**Files:**
- Modify: `scenes/battle_screen.tscn`
- Modify: `scripts/battle_screen.gd`
- Modify: `scripts/presentation/highlight_layer.gd`
- Modify: `tests/test_definitions.gd`
- Modify: `tests/test_battle_scene.gd`
- Modify: `tests/test_runner.gd`
- Delete: `scripts/rules/battle_state.gd`
- Delete: `scripts/rules/ship_state.gd`
- Delete: `tests/test_battle_state.gd`
- Delete: `resources/ships/basic_ship.tres`
- Delete: `resources/maps/prototype_map.tres`

**Interfaces:**
- Consumes: `FleetBattleState`, three class resources, `fleet_hex_map.tres`, six starts, fleet roster selection, and multiple legal targets.
- Produces: `handle_ship_selection(ship_id)`, `handle_cell_click(cell)`, `handle_cell_hover(cell)`, `handle_roster_selection(ship_id)`, and `refresh_from_state()` for tests/input.
- Changes `ship_views` keys from player integer to stable ship ID.
- Finalizes: `ShipView.configure(ship_id, owner, definition)`; removes the temporary two-argument duel overload and `configure_fleet` name.

- [ ] **Step 1: Rewrite scene tests with failing six-ship expectations**

Replace duel assumptions with:

```gdscript
t.expect_true(battle.state is FleetBattleState, "scene uses fleet rules")
t.expect_eq(battle.ship_views.size(), 6, "six ship views exist")
t.expect_eq(battle.tile_map.get_used_cells().size(), 127, "entire hex map renders")
t.expect_eq(battle.sidebar.roster_rows.size(), 3, "active fleet roster renders")
t.expect_eq(battle.state.active_player, FleetBattleState.Player.ONE, "player one starts round one")
```

Through public methods, select `p1_sloop` from the map, cancel, select `p1_frigate` from the roster, preview and commit movement, end activation, then assert Player 2 and their roster become active. Assert used/sunk ship clicks leave rules state unchanged with exact feedback.

- [ ] **Step 2: Run and verify the existing battle scene fails the fleet contract**

- [ ] **Step 3: Change scene exports and setup atomically**

Export:

```gdscript
@export var map_definition: MapDefinition
@export var ship_definitions: Array[ShipDefinition] = []
```

Assign `fleet_hex_map.tres` and the three ordered class definitions in the scene. Validate map and definitions, configure `HexBoard`, then call:

```gdscript
var setup_errors := state.setup(board, ship_definitions, {
	FleetBattleState.Player.ONE: map_definition.player_one_starts,
	FleetBattleState.Player.TWO: map_definition.player_two_starts,
})
if not setup_errors.is_empty():
	_report_invalid_setup(setup_errors)
	return
```

Spawn one `ShipView` per `state.fleets[player].ordered_ships()` and key it by `ship.ship_id`.

At this boundary, remove `MapDefinition.size`, `player_one_start`, `player_two_start`, and the rectangular fallback in `all_cells()`. Fleet arrays become required and the explicit-cell validation path becomes the only path. Consolidate `ShipView.configure_fleet(...)` into the final `configure(ship_id, owner, definition)` signature and update all callers. Remove the sidebar's temporary `render(state: BattleState)` path; the screen calls `render_fleet()` exclusively.

Set `BoardRoot.scale = Vector2(0.88, 0.88)` in the scene. Update `_center_board()` to compute bounds from `map_definition.all_cells()` transformed with `tile_map.map_to_local()`, include half a tile at every edge, and set `board_root.position = battlefield_panel.size * 0.5 - local_bounds.get_center() * board_root.scale`. Keep pointer conversion transform-based so clicking remains correct under scaling; extend the existing pointer round-trip scene assertion to an outer-ring cell.

- [ ] **Step 4: Route map and roster selection through one public method**

`handle_ship_selection(ship_id)` calls only `state.select_ship`. Map clicks find a living ship by cell; roster clicks provide the stable ID. Successful selection shows reachable cells and every legal target. Enemy clicks call `state.attack(target.ship_id)`; friendly ready clicks before an action change selection through rules rather than presentation mutation.

After movement, keep the selected outline and refresh legal target markers. **END ACTIVATION** calls `state.end_activation()`. Right-click/`Esc` calls `state.cancel_selection()`.

- [ ] **Step 5: Extend highlights for multiple targets**

Replace the single optional target with `target_cells: Array[Vector2i]`. Draw the existing red outline/crosshair for every legal target and a stronger hovered target cue. Do not create one node per cell.

- [ ] **Step 6: Remove obsolete duel state/data and update global references**

Replace `BattleState.Player` constants with `FleetBattleState.Player`. Remove the obsolete duel suite from `test_runner.gd`, and remove the legacy basic-ship, rectangular-size, and prototype-map assertions from `test_definitions.gd` while retaining its fleet class/map validation. Delete only the five obsolete files listed above plus their generated `.uid` files when Godot confirms no remaining resource reference. Run `rg -n '\bBattleState\b|\bShipState\b|basic_ship|prototype_map' scripts scenes resources tests project.godot` and require no hits; historical docs may retain prototype terminology.

- [ ] **Step 7: Run guarded import, full suite, and main-scene smoke test**

Expected: scene loads 127 tiles and six ships; public map/roster interactions pass; no missing-resource, parser, or runtime errors.

- [ ] **Step 8: Commit the fleet scene migration**

```bash
git add -A
git commit -m "feat: switch battle screen to six-ship fleets"
```

---

### Task 9: Sinking, Round Presentation, Complete Match, and Polish

**Files:**
- Modify: `scripts/presentation/battle_animator.gd`
- Modify: `scripts/presentation/ship_view.gd`
- Modify: `scripts/ui/tactical_sidebar.gd`
- Modify: `scripts/battle_screen.gd`
- Modify: `scenes/battle_screen.tscn`
- Modify: `tests/test_battle_scene.gd`
- Create: `tests/fixtures/close_fleet_map.tres`
- Modify: `README.md`

**Interfaces:**
- Extends: `BattleAnimator.play(events, ship_views, tile_map, sidebar)` for stable ship IDs, `ship_sunk`, `activation_completed`, `player_changed`, and `round_started`.
- Produces complete sinking, removal, alternating-round banner, victory, and restart presentation.

- [ ] **Step 1: Add a failing complete multi-round match test**

Use real fleet state and public battle-screen methods with `skip_animations = true`. Create `tests/fixtures/close_fleet_map.tres` with the same explicit radius-six, TileSet-topology-derived cell set as the production map (127 cells), no blocked cells, and these starts in sloop/frigate/galleon order:

```gdscript
player_one_starts = [Vector2i(-2, 0), Vector2i(-2, 1), Vector2i(-1, 0)]
player_two_starts = [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1)]
```

The fixture must pass the same `MapDefinition.validate()` contract and contain no blocked cells; the Player 1 galleon begins exactly range two from the Player 2 sloop. Override the exported map resource before adding the battle scene to the test tree—never mutate production state positions. Play attacks until:

```gdscript
t.expect_eq(battle.state.fleets[FleetBattleState.Player.TWO].ship(&"p2_sloop").hull, 0, "galleon sinks sloop")
t.expect_false(battle.ship_views[&"p2_sloop"].visible, "sunk view leaves map")
t.expect_eq(battle.sidebar.row_for(&"p2_sloop").status_label.text, "SUNK", "roster preserves sunk state")
```

Continue until all Player 2 ships sink. Assert exact winner overlay, locked battlefield input, and no round start after victory. Emit **Play Again** and assert six visible full-hull views, original cells, all Player 1 rows `READY`, round one, Player 1 initiative, hidden result, and unlocked input.

- [ ] **Step 2: Run and verify missing sinking/round presentation fails**

- [ ] **Step 3: Update animator payloads from player IDs to ship IDs**

Movement, attack, and damage resolve views with `event.data["ship_id"]`, `attacker_id`, and `target_id`. Preserve current durations. For `ship_sunk`, skip mode sets the view invisible immediately; animated mode flashes, scales to `Vector2(0.75, 0.15)`, fades over `0.28` seconds, draws a short water ring under `BattleAnimator`, then hides and restores transform properties for restart.

- [ ] **Step 4: Present handoffs and alternating rounds**

`player_changed` shows the existing brief player banner. `round_started` shows `ROUND N · PLAYER N INITIATIVE` for `0.7` seconds. In skip mode, call show/hide methods without timers. Consecutive unmatched activations must not show a misleading opponent banner.

- [ ] **Step 5: Make restart clear every fleet artifact**

Reset rules, clear animator children, restore all six view transforms/visibility/hull, clear highlights, hide banners/result, rebuild roster, unlock input, and show `Choose a ready ship`.

- [ ] **Step 6: Update README scope and controls**

Document three ships per fleet, class table, one activation per surviving ship per round, alternating initiative, hexagonal fleet map, map/roster selection, **END ACTIVATION**, and sinking/victory. Keep Godot 4.7.1 and the exact headless test command.

- [ ] **Step 7: Run final automated verification**

Run:

```bash
set -o pipefail
/home/vitaliy/.local/bin/godot --headless --path . --import 2>&1 | tee /tmp/fleet-final-import.log
! rg -n 'SCRIPT ERROR|ERROR:|Parse Error' /tmp/fleet-final-import.log
/home/vitaliy/.local/bin/godot --headless --path . -s res://tests/test_runner.gd 2>&1 | tee /tmp/fleet-final-tests.log
! rg -n 'SCRIPT ERROR|ERROR:|Parse Error' /tmp/fleet-final-tests.log
/home/vitaliy/.local/bin/godot --headless --path . --quit-after 3 2>&1 | tee /tmp/fleet-final-main.log
! rg -n 'SCRIPT ERROR|ERROR:|Parse Error' /tmp/fleet-final-main.log
git diff --check
git status --short
```

- [ ] **Step 8: Perform desktop acceptance at 1280×720**

Render and inspect these states: initial six-ship map, each selected class, movement preview around multiple occupants, several legal targets, one fleet partially used, a sunk row/map removal, unmatched consecutive activation, round-two Player 2 initiative, victory, and restart. Verify all 127 cells and the complete sidebar remain visible and class silhouettes are readable without ownership color.

- [ ] **Step 9: Commit fleet polish**

```bash
git add -A
git commit -m "feat: complete local three-ship fleet battles"
```

---

## Completion Criteria

- The project imports in Godot 4.7.1 without parser, resource, or runtime errors.
- Every automated assertion passes and includes the complete fleet-match path.
- The main scene starts headlessly without errors or orphan warnings.
- Both players control exactly one sloop, frigate, and galleon.
- Every surviving ship activates once per round; unmatched activations and alternating initiative behave exactly as specified.
- The galleon sinks a full-health sloop in one hit.
- Sunk ships disappear from occupancy and map presentation while remaining `SUNK` in the roster.
- The 127-cell hexagonal central-chain map and six ships remain fully visible at 1280×720.
- Map and roster selection use the same rules command.
- Class identity is clear by silhouette/text without color.
- Restart restores all authored positions, hull, readiness, initiative, UI, and view state.
- No AI, abilities, deployment, procedural generation, networking, or responsive-layout subsystem has been added.
- Independent code review reports no unresolved Critical or Important findings.
- The working tree contains no unintended changes.
