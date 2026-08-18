# Sea Battle Desktop Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished desktop-first local two-player Sea Battle prototype with one ship per player, a fixed hex map, movement, fixed-damage attacks, alternating turns, victory, and restart.

**Architecture:** A scene-free GDScript rules model validates commands and returns ordered events. Godot scenes render the fixed map, ships, highlights, animation, and an editor-authored tactical sidebar; resource files hold ship, terrain, and map data.

**Tech Stack:** Godot 4.7.1, GDScript 2.0, `TileMapLayer`, `AStar2D`, custom `Resource` definitions, built-in headless test runner.

**Spec:** `sea-battle/docs/superpowers/specs/2026-08-17-sea-battle-prototype-design.md`

## Global Constraints

- Target Godot 4.7 and a 1280×720 desktop viewport.
- Use GDScript only; do not copy either implementation from the previous Sea Battle repository.
- Support exactly two local human players with one identical ship each; do not add AI.
- A turn allows up to one move followed by up to one attack; attacking ends the turn.
- Attacks always hit for 1 damage; each ship starts with 3 hull, movement 3, and range 2.
- Use one handcrafted map that is fully visible; do not add camera movement or procedural generation.
- Keep rules free of scene, sprite, animation, and UI references.
- Build UI structure in editable `.tscn` scenes and style it through a reusable `Theme` resource.
- Use the existing ocean and mountain artwork; keep additional terrain outside this plan.
- Do not scaffold menus, settings, saving, networking, responsive layouts, multiple weapons, or additional ships.

---

## Planned File Structure

```text
sea-battle/
├── project.godot
├── Assets/
│   ├── Ocean001.png
│   ├── SnowMount001.png
│   └── SnowMount002.png
├── resources/
│   ├── maps/prototype_map.tres
│   ├── ships/basic_ship.tres
│   ├── terrain/land.tres
│   ├── terrain/water.tres
│   ├── themes/nautical_theme.tres
│   └── tiles/prototype_tileset.tres
├── scenes/
│   ├── battle_screen.tscn
│   └── components/tactical_sidebar.tscn
├── scripts/
│   ├── battle_screen.gd
│   ├── definitions/map_definition.gd
│   ├── definitions/ship_definition.gd
│   ├── definitions/terrain_definition.gd
│   ├── presentation/battle_animator.gd
│   ├── presentation/highlight_layer.gd
│   ├── presentation/ship_view.gd
│   ├── rules/battle_state.gd
│   ├── rules/command_result.gd
│   ├── rules/hex_board.gd
│   ├── rules/ship_state.gd
│   └── ui/tactical_sidebar.gd
└── tests/
    ├── test_context.gd
    ├── test_runner.gd
    ├── test_definitions.gd
    ├── test_hex_board.gd
    ├── test_battle_state.gd
    └── test_battle_scene.gd
```

Every script has one responsibility: definitions hold editable data, `HexBoard` owns topology/path queries, `BattleState` owns rules, presentation nodes draw or animate, `TacticalSidebar` owns panel controls, and `BattleScreen` coordinates them.

---

### Task 1: Project Foundation and Data Definitions

**Files:**
- Modify: `sea-battle/project.godot`
- Create: `sea-battle/scripts/definitions/ship_definition.gd`
- Create: `sea-battle/scripts/definitions/terrain_definition.gd`
- Create: `sea-battle/scripts/definitions/map_definition.gd`
- Create: `sea-battle/resources/ships/basic_ship.tres`
- Create: `sea-battle/resources/terrain/water.tres`
- Create: `sea-battle/resources/terrain/land.tres`
- Create: `sea-battle/resources/maps/prototype_map.tres`
- Create: `sea-battle/tests/test_context.gd`
- Create: `sea-battle/tests/test_runner.gd`
- Create: `sea-battle/tests/test_definitions.gd`

**Interfaces:**
- Produces: `ShipDefinition`, `TerrainDefinition`, and `MapDefinition` resource classes.
- Produces: `TestContext.expect_true(value, message)`, `expect_false(value, message)`, `expect_eq(actual, expected, message)`, and `expect_not_null(value, message)`.
- Produces: headless test command used by every later task.

- [ ] **Step 1: Add the test runner and failing definition tests**

Create `tests/test_context.gd`:

```gdscript
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
```

Create `tests/test_runner.gd` with an initially single-suite list:

```gdscript
extends SceneTree

const SUITES := ["res://tests/test_definitions.gd"]

func _initialize() -> void:
    var context := TestContext.new()
    for suite_path in SUITES:
        var suite = load(suite_path).new()
        await suite.run(context, self)
    print("Tests: %d assertions, %d failures" % [context.assertions, context.failures])
    quit(context.failures)
```

Create `tests/test_definitions.gd`:

```gdscript
extends RefCounted

func run(t: TestContext, _tree: SceneTree) -> void:
    var ship = load("res://resources/ships/basic_ship.tres")
    t.expect_not_null(ship, "basic ship resource loads")
    t.expect_eq(ship.max_hull, 3, "basic ship hull")
    t.expect_eq(ship.movement, 3, "basic ship movement")
    t.expect_eq(ship.attack_range, 2, "basic ship range")
    t.expect_eq(ship.damage, 1, "basic ship damage")

    var map = load("res://resources/maps/prototype_map.tres")
    t.expect_not_null(map, "prototype map resource loads")
    t.expect_eq(map.size, Vector2i(11, 8), "prototype map size")
    t.expect_true(map.player_one_start != map.player_two_start, "starts are distinct")
    t.expect_false(map.blocked_cells.has(map.player_one_start), "player one starts on water")
    t.expect_false(map.blocked_cells.has(map.player_two_start), "player two starts on water")
```

- [ ] **Step 2: Run the test to verify missing resources fail**

Run:

```bash
/home/vitaliy/.local/bin/godot --headless --path sea-battle -s res://tests/test_runner.gd
```

Expected: non-zero exit because the definition scripts and `.tres` resources do not exist.

- [ ] **Step 3: Implement the resource classes**

Create `ship_definition.gd`:

```gdscript
class_name ShipDefinition
extends Resource

@export var display_name := "The Mariner"
@export_range(1, 99) var max_hull := 3
@export_range(0, 20) var movement := 3
@export_range(1, 20) var attack_range := 2
@export_range(1, 99) var damage := 1
```

Create `terrain_definition.gd`:

```gdscript
class_name TerrainDefinition
extends Resource

@export var id: StringName
@export var display_name := ""
@export var walkable := true
@export var source_id := 0
@export var atlas_coords := Vector2i.ZERO
```

Create `map_definition.gd`:

```gdscript
class_name MapDefinition
extends Resource

@export var size := Vector2i(11, 8)
@export var blocked_cells: Array[Vector2i] = []
@export var player_one_start := Vector2i(1, 4)
@export var player_two_start := Vector2i(9, 3)

func all_cells() -> Array[Vector2i]:
    var cells: Array[Vector2i] = []
    for y in range(size.y):
        for x in range(size.x):
            cells.append(Vector2i(x, y))
    return cells
```

- [ ] **Step 4: Create the concrete definition resources**

Create `basic_ship.tres` with `max_hull = 3`, `movement = 3`, `attack_range = 2`, and `damage = 1`.

Create `water.tres` with `id = &"water"`, `walkable = true`, and tile source `0`.

Create `land.tres` with `id = &"land"`, `walkable = false`, and tile source `1`.

Create `prototype_map.tres` with:

```gdscript
size = Vector2i(11, 8)
blocked_cells = Array[Vector2i]([
    Vector2i(4, 1), Vector2i(5, 1),
    Vector2i(4, 2),
    Vector2i(6, 3), Vector2i(7, 3),
    Vector2i(3, 5), Vector2i(4, 5),
    Vector2i(7, 6)
])
player_one_start = Vector2i(1, 4)
player_two_start = Vector2i(9, 3)
```

- [ ] **Step 5: Set the desktop project baseline**

Update `project.godot`:

```ini
[application]
config/name="Sea Battle Prototype"

[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[rendering]
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
```

Keep the main-scene assignment unchanged until Task 4 creates the new scene.

- [ ] **Step 6: Run definitions and project import checks**

Run:

```bash
/home/vitaliy/.local/bin/godot --headless --path sea-battle --import
/home/vitaliy/.local/bin/godot --headless --path sea-battle -s res://tests/test_runner.gd
```

Expected: import succeeds and the definition suite exits `0` with 10 passing assertions.

- [ ] **Step 7: Commit the foundation**

```bash
git add sea-battle/project.godot sea-battle/scripts/definitions sea-battle/resources sea-battle/tests
git commit -m "feat: add prototype data definitions"
```

---

### Task 2: Hex Board and Pathfinding

**Files:**
- Create: `sea-battle/scripts/rules/hex_board.gd`
- Create: `sea-battle/tests/test_hex_board.gd`
- Modify: `sea-battle/tests/test_runner.gd`

**Interfaces:**
- Consumes: arrays from `MapDefinition.all_cells()` and `blocked_cells`.
- Produces: `HexBoard.configure(cells, blocked, neighbors)`.
- Produces: `path(from_cell, to_cell, occupied) -> Array[Vector2i]`.
- Produces: `reachable(from_cell, movement, occupied) -> Array[Vector2i]`.
- Produces: `distance(from_cell, to_cell) -> int`, measured through hex neighbors while ignoring terrain blocking.
- Produces: `is_blocked(cell) -> bool` and `has_cell(cell) -> bool`.

- [ ] **Step 1: Add failing board tests**

Append `"res://tests/test_hex_board.gd"` to `SUITES`. Build a seven-cell fixture with a center and six neighbors, plus a short extension. Test:

```gdscript
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
    var cells: Array[Vector2i] = [center, east, north_east, north_west, west, south_west, south_east, north_east_two, far_east]
    var neighbors := {
        center: [east, north_east, north_west, west, south_west, south_east],
        east: [center, north_east, south_east, far_east],
        north_east: [center, east, north_west, north_east_two],
        north_west: [center, north_east, west],
        west: [center, north_west, south_west],
        south_west: [center, west, south_east],
        south_east: [center, south_west, east],
        north_east_two: [north_east, far_east],
        far_east: [east, north_east_two]
    }

    var board := HexBoard.new()
    var blocked: Array[Vector2i] = [east]
    board.configure(cells, blocked, neighbors)
    t.expect_true(board.is_blocked(east), "land is blocked")
    t.expect_eq(board.distance(center, far_east), 2, "geometric distance ignores land")
    t.expect_eq(board.path(center, far_east), [center, north_east, north_east_two, far_east], "movement routes around blocked land")
    t.expect_false(board.reachable(center, 1).has(far_east), "movement limit excludes distant cells")
    t.expect_true(board.reachable(center, 3).has(far_east), "reachable includes valid detour")
    t.expect_eq(board.path(center, far_east, {north_east: true}), [], "occupied detour can make destination unreachable")
```

- [ ] **Step 2: Run the board suite and verify it fails**

Run the headless test command. Expected: failure because `HexBoard` is undefined.

- [ ] **Step 3: Implement `HexBoard` with two graphs**

Use one `AStar2D` graph containing all cells for geometric distance and one excluding blocked cells for movement. Assign sequential integer point IDs and retain coordinate-to-ID and ID-to-coordinate dictionaries. Connect only neighbor pairs supplied to `configure`.

Implement temporary occupancy by disabling occupied points in the movement graph before a query and enabling them afterward in all return paths:

```gdscript
class_name HexBoard
extends RefCounted

var _cells := {}
var _blocked := {}
var _neighbors := {}
var _movement := AStar2D.new()
var _geometry := AStar2D.new()
var _coord_to_id := {}
var _id_to_coord := {}

func configure(cells: Array[Vector2i], blocked: Array[Vector2i], neighbors: Dictionary) -> void:
    _cells.clear()
    _blocked.clear()
    _neighbors = neighbors.duplicate(true)
    _movement.clear()
    _geometry.clear()
    _coord_to_id.clear()
    _id_to_coord.clear()
    for cell in blocked:
        _blocked[cell] = true
    var next_id := 1
    for cell in cells:
        _cells[cell] = true
        _coord_to_id[cell] = next_id
        _id_to_coord[next_id] = cell
        _geometry.add_point(next_id, Vector2(cell))
        if not _blocked.has(cell):
            _movement.add_point(next_id, Vector2(cell))
        next_id += 1
    for cell in cells:
        var from_id: int = _coord_to_id[cell]
        for neighbor in _neighbors.get(cell, []):
            if not _coord_to_id.has(neighbor):
                continue
            var to_id: int = _coord_to_id[neighbor]
            if from_id >= to_id:
                continue
            _geometry.connect_points(from_id, to_id)
            if _movement.has_point(from_id) and _movement.has_point(to_id):
                _movement.connect_points(from_id, to_id)

func has_cell(cell: Vector2i) -> bool:
    return _cells.has(cell)

func is_blocked(cell: Vector2i) -> bool:
    return _blocked.has(cell)

func path(from_cell: Vector2i, to_cell: Vector2i, occupied: Dictionary = {}) -> Array[Vector2i]:
    if not has_cell(from_cell) or not has_cell(to_cell):
        return []
    if is_blocked(from_cell) or is_blocked(to_cell) or occupied.has(to_cell):
        return []
    var disabled_ids: Array[int] = []
    for cell in occupied:
        if cell == from_cell or not _coord_to_id.has(cell):
            continue
        var point_id: int = _coord_to_id[cell]
        if _movement.has_point(point_id):
            _movement.set_point_disabled(point_id, true)
            disabled_ids.append(point_id)
    var id_path := _movement.get_id_path(_coord_to_id[from_cell], _coord_to_id[to_cell])
    for point_id in disabled_ids:
        _movement.set_point_disabled(point_id, false)
    var result: Array[Vector2i] = []
    for point_id in id_path:
        result.append(_id_to_coord[point_id])
    return result

func reachable(from_cell: Vector2i, movement: int, occupied: Dictionary = {}) -> Array[Vector2i]:
    var result: Array[Vector2i] = []
    for cell in _cells:
        if is_blocked(cell) or occupied.has(cell):
            continue
        var candidate := path(from_cell, cell, occupied)
        if not candidate.is_empty() and candidate.size() - 1 <= movement:
            result.append(cell)
    return result

func distance(from_cell: Vector2i, to_cell: Vector2i) -> int:
    if not has_cell(from_cell) or not has_cell(to_cell):
        return -1
    var id_path := _geometry.get_id_path(_coord_to_id[from_cell], _coord_to_id[to_cell])
    return id_path.size() - 1 if not id_path.is_empty() else -1
```

- [ ] **Step 4: Run the board suite**

Run the headless test command. Expected: all definition and board assertions pass; the unique walkable detour is `[center, north_east, north_east_two, far_east]`.

- [ ] **Step 5: Commit board rules**

```bash
git add sea-battle/scripts/rules/hex_board.gd sea-battle/tests/test_hex_board.gd sea-battle/tests/test_runner.gd
git commit -m "feat: add hex board pathfinding"
```

---

### Task 3: Two-Player Battle Rules

**Files:**
- Create: `sea-battle/scripts/rules/command_result.gd`
- Create: `sea-battle/scripts/rules/ship_state.gd`
- Create: `sea-battle/scripts/rules/battle_state.gd`
- Create: `sea-battle/tests/test_battle_state.gd`
- Modify: `sea-battle/tests/test_runner.gd`

**Interfaces:**
- Consumes: `HexBoard` and `ShipDefinition`.
- Produces: `CommandResult.ok`, `message`, and ordered `events` dictionaries.
- Produces: `BattleState.setup(board, definition, player_one_start, player_two_start)`.
- Produces: `select_ship(player)`, `move_active_ship(destination)`, `attack()`, `end_turn()`, and `reset()`.
- Produces: `active_ship()`, `opposing_ship()`, `reachable_cells()`, `can_attack()`, and `is_game_over()` queries.

- [ ] **Step 1: Write failing battle-rule tests**

Append `test_battle_state.gd` to `SUITES`. Use a five-cell straight neighbor fixture and test these independent setups:

```gdscript
func run(t: TestContext, _tree: SceneTree) -> void:
    test_starts_with_player_one(t)
    test_rejects_inactive_player_selection(t)
    test_moves_once_within_allowance(t)
    test_attack_ends_turn_before_another_move(t)
    test_attack_without_moving(t)
    test_attack_deals_fixed_damage_and_switches_turn(t)
    test_end_turn_switches_player(t)
    test_third_hit_wins_immediately(t)
    test_reset_restores_initial_state(t)
```

Each helper creates fresh state. Assert exact messages (`"Player 1's turn"`, `"Out of range"`, `"Blocked"`, `"Movement already used"`, `"Battle is over"`) and exact event type order. For a successful attack that does not win, require:

```gdscript
[&"ship_attacked", &"ship_damaged", &"turn_changed"]
```

For the winning attack, require:

```gdscript
[&"ship_attacked", &"ship_damaged", &"battle_won"]
```

- [ ] **Step 2: Run tests and verify battle types are missing**

Run the headless test command. Expected: failure because `BattleState`, `ShipState`, and `CommandResult` are undefined.

- [ ] **Step 3: Implement the small state types**

Create `command_result.gd`:

```gdscript
class_name CommandResult
extends RefCounted

var ok: bool
var message: String
var events: Array[Dictionary]

static func success(new_events: Array[Dictionary]) -> CommandResult:
    var result := CommandResult.new()
    result.ok = true
    result.message = ""
    result.events = new_events
    return result

static func failure(reason: String) -> CommandResult:
    var result := CommandResult.new()
    result.ok = false
    result.message = reason
    result.events = []
    return result
```

Create `ship_state.gd`:

```gdscript
class_name ShipState
extends RefCounted

var player: int
var cell: Vector2i
var hull: int
var definition: ShipDefinition
var movement_used := false
var attack_used := false

func configure(owner: int, ship_definition: ShipDefinition, start: Vector2i) -> void:
    player = owner
    definition = ship_definition
    cell = start
    hull = definition.max_hull
    reset_actions()

func reset_actions() -> void:
    movement_used = false
    attack_used = false

func is_destroyed() -> bool:
    return hull <= 0
```

- [ ] **Step 4: Implement `BattleState` command validation and events**

Create `battle_state.gd`:

```gdscript
class_name BattleState
extends RefCounted

enum Player { ONE = 1, TWO = 2 }

var board: HexBoard
var definition: ShipDefinition
var active_player := Player.ONE
var winner := 0
var turn_number := 1
var selected := false
var ships: Dictionary = {}
var _starts := {}

func setup(hex_board: HexBoard, ship_definition: ShipDefinition, player_one_start: Vector2i, player_two_start: Vector2i) -> void:
    board = hex_board
    definition = ship_definition
    _starts = {Player.ONE: player_one_start, Player.TWO: player_two_start}
    ships = {
        Player.ONE: _new_ship(Player.ONE, player_one_start),
        Player.TWO: _new_ship(Player.TWO, player_two_start)
    }
    reset()

func _new_ship(player: int, start: Vector2i) -> ShipState:
    var ship := ShipState.new()
    ship.configure(player, definition, start)
    return ship

func active_ship() -> ShipState:
    return ships[active_player]

func opposing_ship() -> ShipState:
    return ships[_other_player(active_player)]

func is_game_over() -> bool:
    return winner != 0

func select_ship(player: int) -> CommandResult:
    if is_game_over():
        return CommandResult.failure("Battle is over")
    if player != active_player:
        return CommandResult.failure("Player %d's turn" % active_player)
    if ships[player].is_destroyed():
        return CommandResult.failure("Battle is over")
    selected = true
    return CommandResult.success([_event(&"ship_selected", {"player": player})])

func reachable_cells() -> Array[Vector2i]:
    if not selected or is_game_over():
        return []
    var ship := active_ship()
    if ship.movement_used or ship.attack_used:
        return []
    return board.reachable(ship.cell, ship.definition.movement, _occupied_by_opponent())

func move_active_ship(destination: Vector2i) -> CommandResult:
    if is_game_over():
        return CommandResult.failure("Battle is over")
    if not selected:
        return CommandResult.failure("Select your ship")
    var ship := active_ship()
    if ship.movement_used:
        return CommandResult.failure("Movement already used")
    if ship.attack_used:
        return CommandResult.failure("Movement already used")
    if board.is_blocked(destination) or opposing_ship().cell == destination:
        return CommandResult.failure("Blocked")
    var route := board.path(ship.cell, destination, _occupied_by_opponent())
    if route.is_empty() or route.size() - 1 > ship.definition.movement:
        return CommandResult.failure("Out of range")
    ship.cell = destination
    ship.movement_used = true
    return CommandResult.success([_event(&"ship_moved", {
        "player": ship.player,
        "path": route
    })])

func can_attack() -> bool:
    if not selected or is_game_over() or active_ship().attack_used:
        return false
    return board.distance(active_ship().cell, opposing_ship().cell) <= active_ship().definition.attack_range

func attack() -> CommandResult:
    if is_game_over():
        return CommandResult.failure("Battle is over")
    if not selected:
        return CommandResult.failure("Select your ship")
    if active_ship().attack_used:
        return CommandResult.failure("Attack already used")
    if not can_attack():
        return CommandResult.failure("Out of range")
    var attacker := active_ship()
    var target := opposing_ship()
    attacker.attack_used = true
    target.hull = maxi(0, target.hull - attacker.definition.damage)
    var events: Array[Dictionary] = [
        _event(&"ship_attacked", {"attacker": attacker.player, "target": target.player}),
        _event(&"ship_damaged", {"player": target.player, "hull": target.hull})
    ]
    if target.is_destroyed():
        winner = attacker.player
        events.append(_event(&"battle_won", {"winner": winner}))
    else:
        events.append(_switch_turn())
    return CommandResult.success(events)

func end_turn() -> CommandResult:
    if is_game_over():
        return CommandResult.failure("Battle is over")
    return CommandResult.success([_switch_turn()])

func reset() -> CommandResult:
    active_player = Player.ONE
    winner = 0
    turn_number = 1
    selected = false
    for player in [Player.ONE, Player.TWO]:
        var ship: ShipState = ships[player]
        ship.cell = _starts[player]
        ship.hull = ship.definition.max_hull
        ship.reset_actions()
    return CommandResult.success([_event(&"battle_reset")])

func _switch_turn() -> Dictionary:
    active_player = _other_player(active_player)
    turn_number += 1
    selected = false
    active_ship().reset_actions()
    return _event(&"turn_changed", {"player": active_player, "turn": turn_number})

func _occupied_by_opponent() -> Dictionary:
    return {opposing_ship().cell: true}

func _other_player(player: int) -> int:
    return Player.TWO if player == Player.ONE else Player.ONE

func _event(type: StringName, data: Dictionary = {}) -> Dictionary:
    return {"type": type, "data": data}
```

- [ ] **Step 5: Run the full rules suite**

Run the headless test command. Expected: all definition, board, and battle assertions pass with no leaked nodes or resources.

- [ ] **Step 6: Commit battle rules**

```bash
git add sea-battle/scripts/rules sea-battle/tests/test_battle_state.gd sea-battle/tests/test_runner.gd
git commit -m "feat: add local two-player battle rules"
```

---

### Task 4: Fixed Battlefield Scene and Rendering

**Files:**
- Create: `sea-battle/resources/tiles/prototype_tileset.tres`
- Create: `sea-battle/scenes/battle_screen.tscn`
- Create: `sea-battle/scripts/battle_screen.gd`
- Create: `sea-battle/scripts/presentation/ship_view.gd`
- Create: `sea-battle/tests/test_battle_scene.gd`
- Modify: `sea-battle/project.godot`
- Modify: `sea-battle/tests/test_runner.gd`
- Remove after migration: `sea-battle/main.tscn`

**Interfaces:**
- Consumes: map, terrain, ship resources and `BattleState`.
- Produces: `BattleScreen.state`, `tile_map`, `ship_views`, `cell_from_pointer(position)`, and `refresh_from_state()`.
- Produces: `ShipView.configure(player, definition)` and `set_hull(current, maximum)`.

- [ ] **Step 1: Add a failing battle-scene smoke test**

Append `test_battle_scene.gd` to `SUITES` and implement:

```gdscript
extends RefCounted

func run(t: TestContext, tree: SceneTree) -> void:
    var packed: PackedScene = load("res://scenes/battle_screen.tscn")
    t.expect_not_null(packed, "battle scene loads")
    if packed == null:
        return
    var battle = packed.instantiate()
    tree.root.add_child(battle)
    await tree.process_frame
    t.expect_not_null(battle.state, "battle state is configured")
    t.expect_eq(battle.ship_views.size(), 2, "two ship views exist")
    t.expect_eq(battle.tile_map.get_used_cells().size(), 88, "all fixed map cells render")
    t.expect_eq(battle.state.active_player, BattleState.Player.ONE, "player one starts")
    battle.queue_free()
    await tree.process_frame
```

- [ ] **Step 2: Run the suite and verify the scene is missing**

Run the headless test command. Expected: the smoke test fails to load `battle_screen.tscn`.

- [ ] **Step 3: Extract the current tile sources into a reusable TileSet**

Create `prototype_tileset.tres` with hex tile size `Vector2i(64, 56)`, one atlas source for `Ocean001.png`, and one atlas source for each mountain image. Register atlas coordinate `(0, 0)` for all three sources. Preserve the current scene's hex shape and offset axis.

- [ ] **Step 4: Build the exact editor-authored scene tree**

Create `battle_screen.tscn` with this hierarchy and ownership:

```text
BattleScreen (Control; full rect; battle_screen.gd)
└── Margin (MarginContainer; full rect; 24px margins)
    └── Layout (HBoxContainer; separation 24)
        ├── BattlefieldPanel (Control; horizontal size flags EXPAND_FILL; clip_contents true)
        │   └── BoardRoot (Node2D)
        │       ├── TileMapLayer (prototype_tileset.tres)
        │       ├── Ships (Node2D)
        │       ├── Highlights (Node2D)
        │       └── Effects (Node2D)
        └── SidebarSlot (MarginContainer; custom_minimum_size.x 320)
```

Give the root a dark ocean background so unused space never shows the engine clear color. Do not create sidebar controls in code; Task 5 fills `SidebarSlot` with an instanced scene.

- [ ] **Step 5: Implement fixed-map setup in `BattleScreen`**

Export the three definition resources and tile source IDs. In `_ready()`:

1. Fill every map cell with the ocean tile.
2. Replace each blocked coordinate with alternating mountain source IDs based on coordinate parity.
3. Center `BoardRoot` in `BattlefieldPanel` using the tile map's used rectangle.
4. Build the neighbor dictionary by calling `tile_map.get_surrounding_cells(cell)` and filtering to `map_definition.all_cells()`.
5. Configure `HexBoard` and `BattleState`.
6. Spawn exactly two `ShipView` nodes at `tile_map.map_to_local(ship.cell)`.

Implement `ShipView` as a small drawn nautical token so no new bitmap asset is required:

```gdscript
class_name ShipView
extends Node2D

var player: int
var hull: int
var max_hull: int

func configure(owner: int, definition: ShipDefinition) -> void:
    player = owner
    hull = definition.max_hull
    max_hull = definition.max_hull
    queue_redraw()

func set_hull(current: int, maximum: int) -> void:
    hull = current
    max_hull = maximum
    queue_redraw()

func _draw() -> void:
    var color := Color("e2b65c") if player == BattleState.Player.ONE else Color("c85f58")
    draw_colored_polygon(PackedVector2Array([
        Vector2(-22, -7), Vector2(17, -7), Vector2(24, 0),
        Vector2(17, 7), Vector2(-22, 7), Vector2(-14, 0)
    ]), color)
    draw_polyline(PackedVector2Array([
        Vector2(-22, -7), Vector2(17, -7), Vector2(24, 0),
        Vector2(17, 7), Vector2(-22, 7), Vector2(-14, 0), Vector2(-22, -7)
    ]), Color("f7edd0"), 2.0)
```

- [ ] **Step 6: Point the project at the new battle scene and remove the obsolete scene**

Set:

```ini
run/main_scene="res://scenes/battle_screen.tscn"
```

Delete `main.tscn` only after `prototype_tileset.tres` and `battle_screen.tscn` load successfully and no resource depends on it.

- [ ] **Step 7: Run scene tests and a headless load**

Run:

```bash
/home/vitaliy/.local/bin/godot --headless --path sea-battle --import
/home/vitaliy/.local/bin/godot --headless --path sea-battle -s res://tests/test_runner.gd
/home/vitaliy/.local/bin/godot --headless --path sea-battle --quit-after 2
```

Expected: all tests pass, the main scene loads without parser/resource errors, and no orphan-node warnings appear.

- [ ] **Step 8: Commit the rendered battlefield**

```bash
git add sea-battle/project.godot sea-battle/resources/tiles sea-battle/scenes sea-battle/scripts/battle_screen.gd sea-battle/scripts/presentation/ship_view.gd sea-battle/tests
git add -u sea-battle/main.tscn
git commit -m "feat: render fixed sea battle map"
```

---

### Task 5: Tactical Sidebar and Nautical Theme

**Files:**
- Create: `sea-battle/resources/themes/nautical_theme.tres`
- Create: `sea-battle/scenes/components/tactical_sidebar.tscn`
- Create: `sea-battle/scripts/ui/tactical_sidebar.gd`
- Modify: `sea-battle/scenes/battle_screen.tscn`
- Modify: `sea-battle/scripts/battle_screen.gd`
- Modify: `sea-battle/tests/test_battle_scene.gd`

**Interfaces:**
- Consumes: read-only `BattleState` state.
- Produces: `signal end_turn_pressed`, `signal play_again_pressed`.
- Produces: `render(state)`, `show_message(text)`, `show_turn_banner(player)`, and `show_result(winner)`.

- [ ] **Step 1: Extend the scene test with failing sidebar expectations**

After scene startup, assert:

```gdscript
var sidebar = battle.get_node("Margin/Layout/SidebarSlot/TacticalSidebar")
t.expect_not_null(sidebar, "sidebar is instanced")
t.expect_eq(sidebar.active_player_label.text, "PLAYER 1", "sidebar shows active player")
t.expect_eq(sidebar.hull_label.text, "3 / 3", "sidebar shows hull")
t.expect_eq(sidebar.stats_label.text, "MOVE 3   RANGE 2   DAMAGE 1", "sidebar shows exact stats")
t.expect_true(sidebar.end_turn_button.disabled == false, "end turn starts enabled")
```

- [ ] **Step 2: Run the scene suite and verify sidebar lookup fails**

Run the headless test command. Expected: failure because `TacticalSidebar` is absent.

- [ ] **Step 3: Create the clean-nautical theme**

Define theme colors from the approved mockup:

- Panel navy: `#142f3d`.
- Deep navy: `#0d222e`.
- Brass: `#d5a653`.
- Primary text: `#f2f0df`.
- Secondary text: `#a9bdc5`.
- Healthy hull: `#69b978`.
- Player 2 accent: `#c85f58`.

Add reusable styles for `PanelContainer`, `Button`, `Label`, and `ProgressBar`. Buttons must have distinct normal, hover, pressed, focus, and disabled styles.

- [ ] **Step 4: Create the editor-authored sidebar scene**

Create this exact control tree:

```text
TacticalSidebar (PanelContainer; tactical_sidebar.gd)
└── ContentMargin (MarginContainer; 24px margins)
    └── Content (VBoxContainer; separation 14)
        ├── Eyebrow (Label: "ACTIVE PLAYER")
        ├── ActivePlayer (Label: "PLAYER 1")
        ├── Separator (HSeparator)
        ├── ShipName (Label: "THE MARINER")
        ├── HullLabel (Label: "3 / 3")
        ├── HullBar (ProgressBar; min 0; max 3; value 3)
        ├── Stats (Label: "MOVE 3   RANGE 2   DAMAGE 1")
        ├── ActionState (Label: "MOVE READY · ATTACK READY")
        ├── Spacer (Control; vertical EXPAND_FILL)
        ├── Message (Label: "Select your ship"; autowrap)
        └── EndTurn (Button: "END TURN")
```

Add a full-screen sibling `OverlayLayer` to the battle root with `TurnBanner` and `ResultOverlay`; keep both hidden initially. Put the **Play Again** button inside `ResultOverlay`.

- [ ] **Step 5: Implement sidebar state rendering and signals**

Cache child controls with typed `@onready` variables. `render(state)` must derive all visible text from the active `ShipState`, including action readiness. Connect the two buttons to the public signals. `show_message` updates only the message label. `show_turn_banner` and `show_result` control the overlay nodes supplied through exported `NodePath` properties.

- [ ] **Step 6: Wire sidebar rendering from `BattleScreen`**

Instance the sidebar scene in `SidebarSlot`, connect its signals, and call `sidebar.render(state)` after setup and after every successful command. Invalid commands call `sidebar.show_message(result.message)` without changing ship positions or action labels.

- [ ] **Step 7: Run the tests and inspect the theme manually**

Run the headless suite, then launch:

```bash
/home/vitaliy/.local/bin/godot --path sea-battle --editor
```

Verify the 1280×720 preview has a flexible battlefield, 320px sidebar, readable light text, brass primary action, visible keyboard focus, and no control overlap.

- [ ] **Step 8: Commit the sidebar**

```bash
git add sea-battle/resources/themes sea-battle/scenes sea-battle/scripts/ui sea-battle/scripts/battle_screen.gd sea-battle/tests/test_battle_scene.gd
git commit -m "feat: add tactical battle sidebar"
```

---

### Task 6: Selection, Reachability, Path Preview, and Movement

**Files:**
- Create: `sea-battle/scripts/presentation/highlight_layer.gd`
- Modify: `sea-battle/scenes/battle_screen.tscn`
- Modify: `sea-battle/scripts/battle_screen.gd`
- Modify: `sea-battle/scripts/presentation/ship_view.gd`
- Modify: `sea-battle/tests/test_battle_scene.gd`

**Interfaces:**
- Consumes: `BattleState.select_ship`, `reachable_cells`, and `move_active_ship`.
- Produces: `HighlightLayer.show_selection(cell)`, `show_reachable(cells)`, `show_path(cells)`, `show_target(cell)`, and `clear()`.
- Produces: `BattleScreen.handle_cell_click(cell)` and `handle_cell_hover(cell)` for input and tests.

- [ ] **Step 1: Add failing interaction tests through public cell methods**

Test this sequence without synthesizing mouse events:

```gdscript
var player_one_start = battle.state.active_ship().cell
await battle.handle_cell_click(player_one_start)
t.expect_true(battle.state.selected, "click selects active ship")
t.expect_true(battle.highlights.reachable_cells.size() > 0, "selection displays reachable cells")

var destination := Vector2i(2, 4)
battle.handle_cell_hover(destination)
t.expect_eq(battle.highlights.path_cells.back(), destination, "hover previews destination")
await battle.handle_cell_click(destination)
t.expect_eq(battle.state.active_ship().cell, destination, "click commits movement")
t.expect_eq(battle.ship_views[BattleState.Player.ONE].position, battle.tile_map.map_to_local(destination), "view reaches destination")
```

Also assert that clicking Player 2's ship during Player 1's turn leaves selection false and shows `"Player 1's turn"`.

- [ ] **Step 2: Run the scene test and verify interaction APIs are missing**

Run the headless test command. Expected: failure on missing handlers or highlight state.

- [ ] **Step 3: Implement `HighlightLayer` as one drawing node**

Store typed arrays `reachable_cells` and `path_cells`, plus optional selection and target cells. Receive a `TileMapLayer` reference in `configure`. In `_draw`, derive every marker center with `tile_map.map_to_local(cell)` and draw 64×56 hex polygons:

- Reachable: translucent blue fill plus a small center dot.
- Selected: 3px brass outline.
- Path: connected brass lines and dots.
- Target: 3px red outline.

Do not create one node per highlighted cell.

- [ ] **Step 4: Route pointer input through `BattlefieldPanel`**

Set the panel to receive mouse input. Convert panel-local pointer position into `BoardRoot` local space, then call `tile_map.local_to_map`. Route left click to `handle_cell_click`, mouse motion to `handle_cell_hover`, and right-click or `Esc` to `cancel_selection`.

`handle_cell_click` behavior:

1. If input is locked, return.
2. If no ship is selected, only the active ship cell can select.
3. If selected and the clicked cell is reachable, call `move_active_ship` and animate the returned path.
4. If a command fails, display its exact message.
5. After success, refresh sidebar and highlights.

- [ ] **Step 5: Animate movement along the validated path**

The rules update before animation. Lock input, tween the active `ShipView` through each path cell after the origin, use `0.12` seconds per transition, then unlock input. Honor the exact path in the `ship_moved` event rather than recomputing it in presentation.

In headless tests, allow a `skip_animations` exported flag that immediately assigns the final position while preserving the same event handling path.

- [ ] **Step 6: Run interaction tests and manual pointer verification**

Run the headless suite. Then verify manually:

- Only the active ship selects.
- Reachable cells appear immediately.
- Hover path matches the eventual movement.
- Land never highlights.
- Right-click and `Esc` clear pre-action selection.
- A committed move cannot be cancelled.

- [ ] **Step 7: Commit selection and movement**

```bash
git add sea-battle/scenes/battle_screen.tscn sea-battle/scripts/battle_screen.gd sea-battle/scripts/presentation sea-battle/tests/test_battle_scene.gd
git commit -m "feat: add ship selection and movement previews"
```

---

### Task 7: Attacks, Turn Changes, Victory, and Restart

**Files:**
- Create: `sea-battle/scripts/presentation/battle_animator.gd`
- Modify: `sea-battle/scenes/battle_screen.tscn`
- Modify: `sea-battle/scenes/components/tactical_sidebar.tscn`
- Modify: `sea-battle/scripts/battle_screen.gd`
- Modify: `sea-battle/scripts/presentation/ship_view.gd`
- Modify: `sea-battle/scripts/ui/tactical_sidebar.gd`
- Modify: `sea-battle/tests/test_battle_scene.gd`

**Interfaces:**
- Consumes: ordered command events from `BattleState`.
- Produces: `BattleAnimator.play(events, ship_views, tile_map, sidebar)` and `skip_animations`.
- Produces: complete click-to-attack, end-turn, result, and reset interactions.

- [ ] **Step 1: Add failing scene tests for a complete match**

Use a test-only setup that places ships within range, then assert:

```gdscript
await battle.handle_cell_click(battle.state.active_ship().cell)
await battle.handle_cell_click(battle.state.opposing_ship().cell)
t.expect_eq(battle.state.ships[BattleState.Player.TWO].hull, 2, "attack deals one damage")
t.expect_eq(battle.state.active_player, BattleState.Player.TWO, "attack ends turn")
t.expect_eq(battle.sidebar.active_player_label.text, "PLAYER 2", "sidebar changes player")
```

Run enough alternating attacks to win and assert `ResultOverlay.visible`, exact winner text `PLAYER 1 WINS`, and disabled battlefield input. Trigger `play_again_pressed` and assert full hull, original positions, Player 1 active, hidden result overlay, and unlocked input.

- [ ] **Step 2: Run the suite and verify attack presentation fails**

Run the headless test command. Expected: rules assertions may pass, but scene/UI attack and result assertions fail.

- [ ] **Step 3: Add attack targeting to click and hover handlers**

After selection or movement, call `state.can_attack()`. If true, show the opposing ship as a red target and set the sidebar message to `Attack · 1 damage`. Clicking the highlighted opposing ship calls `state.attack()`.

If the target is outside range, retain movement highlights and show `Out of range` when clicked. Attacking is allowed before movement. Once attacked, never return to movement selection because the turn has already changed.

- [ ] **Step 4: Implement ordered event animation**

`BattleAnimator.play(events, ship_views, tile_map, sidebar)` iterates events in order:

- `ship_moved`: use the movement tween from Task 6.
- `ship_attacked`: tween a small brass projectile from attacker to target over `0.18` seconds.
- `ship_damaged`: flash the target white/red, update its hull, and pulse its scale over `0.16` seconds.
- `turn_changed`: ask the sidebar to show `PLAYER N TURN` for `0.55` seconds.
- `battle_won`: leave both ships visible and show the result overlay.

`skip_animations` performs final property assignments and calls overlay methods without timers or tweens.

- [ ] **Step 5: Wire End Turn and Play Again**

End Turn calls `state.end_turn()`, passes events through the animator, clears highlights, and refreshes the sidebar. Play Again calls `state.reset()`, restores ship views from state, clears animation artifacts and highlights, hides the result overlay, and refreshes the sidebar.

- [ ] **Step 6: Run the automated suite**

Run the headless test command. Expected: all rules and scene tests pass, including the complete-match and restart paths.

- [ ] **Step 7: Play three full matches manually**

In each match verify:

1. Player 1 can move then attack.
2. Player 2 can attack without moving.
3. End Turn works before selection and after movement.
4. The third successful hit ends the match immediately.
5. No input is accepted during movement, impact, or turn-banner animation.
6. Play Again restores the identical battlefield.

- [ ] **Step 8: Commit the complete battle loop**

```bash
git add sea-battle/scenes sea-battle/scripts sea-battle/tests/test_battle_scene.gd
git commit -m "feat: complete local two-player battle loop"
```

---

### Task 8: Feedback, Map Validation, and Prototype Polish

**Files:**
- Modify: `sea-battle/scripts/definitions/map_definition.gd`
- Modify: `sea-battle/scripts/battle_screen.gd`
- Modify: `sea-battle/scripts/presentation/highlight_layer.gd`
- Modify: `sea-battle/scripts/ui/tactical_sidebar.gd`
- Modify: `sea-battle/resources/themes/nautical_theme.tres`
- Modify: `sea-battle/tests/test_definitions.gd`
- Modify: `sea-battle/tests/test_battle_scene.gd`
- Modify: `README.md`

**Interfaces:**
- Produces: `MapDefinition.validate(neighbors) -> PackedStringArray`.
- Produces: final player-facing messages and non-color highlight cues.
- Produces: documented run and test commands.

- [ ] **Step 1: Add failing validation and feedback tests**

Test these invalid maps independently:

- Player starts overlap.
- A start is outside the map.
- A start is blocked.
- The two starts have no walkable route.

Require exact validation messages in stable order. Extend the scene test to verify clicking land shows `Blocked` and clicking beyond movement shows `Out of range`. Verify center dots, route chevrons, and the attack crosshair during the manual acceptance pass because they are draw commands rather than state.

- [ ] **Step 2: Run tests and verify validation is absent**

Run the headless test command. Expected: failures on `MapDefinition.validate` and marker metadata.

- [ ] **Step 3: Implement startup validation without UI recovery paths**

`MapDefinition.validate(neighbors)` returns all structural errors. `BattleScreen._ready()` checks them before creating state. If errors exist, call `push_error` once per message, disable input, and show `Invalid battlefield data` in the sidebar. Do not silently repair authored map data.

Validate connectivity by constructing a temporary `HexBoard` and checking for a non-empty path between the starts.

- [ ] **Step 4: Add non-color cues and polish state transitions**

- Draw center dots on reachable cells.
- Draw chevrons along the hovered route.
- Draw a crosshair glyph inside the red attack outline.
- Dim the inactive ship to 70% brightness.
- Keep the active ship brass outline visible when movement is exhausted.
- Use exact sidebar messages: `Select your ship`, `Choose a destination or attack`, `Choose a target or end turn`, `Blocked`, `Out of range`, and `Player N's turn`.

Check all buttons at keyboard focus and ensure no state uses color alone.

- [ ] **Step 5: Document the prototype**

Replace the generic root README content with:

- Project purpose and current one-versus-one local scope.
- Godot 4.7.1 requirement.
- Open `sea-battle/project.godot` and run instructions.
- Exact headless test command.
- Controls: left click, hover, right-click/`Esc`, and End Turn.
- Deferred features summarized from the spec.

- [ ] **Step 6: Run final automated verification**

Run:

```bash
/home/vitaliy/.local/bin/godot --headless --path sea-battle --import
/home/vitaliy/.local/bin/godot --headless --path sea-battle -s res://tests/test_runner.gd
/home/vitaliy/.local/bin/godot --headless --path sea-battle --quit-after 3
git diff --check
git status --short
```

Expected: imports succeed, every test passes, the main scene exits without parser/resource/orphan errors, the diff has no whitespace errors, and status lists only intentional prototype files.

- [ ] **Step 7: Perform the final desktop acceptance pass**

At 1280×720 verify:

- The entire map is visible without panning or zooming.
- The sidebar remains 320px wide and no text clips.
- Both mountain variants appear on the fixed obstacle cells.
- Selection, route, movement, attack, turn, victory, and restart are visually unambiguous.
- Three full matches can be played without invalid state, stuck input, or stale highlights.

- [ ] **Step 8: Commit prototype polish**

```bash
git add README.md sea-battle
git commit -m "feat: polish sea battle desktop prototype"
```

---

## Completion Criteria

The plan is complete only when:

- The full automated suite passes from a clean Godot import.
- The main scene loads headlessly without errors or orphan warnings.
- Three local two-player matches pass the manual acceptance checklist at 1280×720.
- Every included requirement in the approved specification is represented in working behavior.
- No deferred subsystem has been added.
- The working tree contains no unintended changes.
