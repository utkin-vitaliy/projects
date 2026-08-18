# Sea Battle Desktop Prototype Design

Date: 2026-08-17
Status: Approved

## Goal

Build the smallest polished version of Sea Battle that proves the core local multiplayer experience while preserving clean upgrade paths for additional terrain, ships, maps, rules, and display sizes.

The prototype is a desktop-first, local two-player, turn-based naval battle on a fixed hex map. Each player controls one ship. The first player to reduce the opposing ship to zero hull wins.

## Scope

### Included

- One handcrafted battlefield that remains entirely visible at 1280×720.
- One ship controlled by Player 1 and one ship controlled by Player 2.
- Alternating local turns on the same desktop.
- Select, preview movement, move, attack, end turn, win, and restart flows.
- Guaranteed attacks with fixed damage.
- Water and impassable island or mountain terrain.
- An editable tactical sidebar and clean-nautical visual theme.
- Short movement, attack, damage, turn-change, and victory feedback.
- Scene-free rule tests and a small scene smoke test.

### Deferred

- Computer-controlled opponents.
- More than one ship per player.
- Procedural maps and map selection.
- Sand, reefs, hazards, and other terrain beyond the initial two categories.
- Multiple weapons, abilities, statuses, objectives, and scenarios.
- Main menu, settings, saving, campaign progression, and networking.
- Mobile, tablet, and responsive layouts.
- Camera panning and zooming.
- Random damage, accuracy rolls, and hidden information.

## Architecture

The project uses Godot 4.7 and GDScript. It has three boundaries.

### Rules

Scene-free GDScript classes own the authoritative battle state and validate commands. They operate on hex coordinates and definition resources but do not reference sprites, controls, animation, or scene nodes.

The rules layer owns:

- Active player and turn number.
- Ship position, hull, and action availability.
- Occupied and blocked hexes.
- Reachability and paths.
- Move and attack legality.
- Damage and victory resolution.
- Resetting the fixed battle.

### Presentation

Godot nodes render a snapshot of the rules state and animate the events returned by successful commands. Presentation never decides whether an action is legal.

The presentation layer owns:

- The `TileMapLayer` battlefield.
- Player 1 and Player 2 ship views.
- Selection, reachable-cell, path, target, and blocked feedback.
- Movement, attack, damage, and victory effects.
- Temporarily locking input while an event is animated.

### Interface

Editable `Control` scenes own the desktop layout and sidebar. Interface elements are composed in the editor rather than constructed procedurally in a large script. A shared Godot `Theme` resource owns reusable typography, colors, panels, and button styles.

The main scene has this conceptual structure:

```text
BattleScreen (Control)
├── BattlefieldPanel (Control)
│   ├── TileMapLayer
│   ├── Ships (Node2D)
│   ├── Highlights (Node2D)
│   └── Effects (Node2D)
└── TacticalSidebar (Control scene)
```

The battlefield consumes the flexible left region. The sidebar uses a stable desktop width on the right. This layout keeps the current desktop design precise without coupling battle rules to future responsive layouts.

## Data-Driven Definitions

Ships and terrain use custom Godot `Resource` definitions.

The initial ship definition contains:

- Display name.
- Maximum hull.
- Movement allowance.
- Attack range.
- Fixed attack damage.
- Presentation references where appropriate.

The initial terrain definition distinguishes walkable water from impassable land. Adding sand, reefs, hazards, or alternative art later should extend terrain data and presentation behavior without changing turn control or the input flow.

Initial tuning values are:

- Hull: 3.
- Movement: 3 hexes.
- Attack range: 2 hexes.
- Damage: 1 hull.
- Hit chance: guaranteed.

Both players begin with identical definitions. The values remain resource data so playtesting can tune them without source changes.

## Game Flow

The game launches directly into the battle.

Each turn permits up to one movement followed by up to one attack:

```text
Select active ship
  → optionally preview and commit movement
  → optionally preview and commit an attack
  → end the turn
  → activate the other player
```

A player may attack without moving. A player may not attack and then move. A committed attack ends the turn automatically. If the player cannot or does not want to attack, the sidebar's **End Turn** button ends the turn.

Before an action is committed, right-click or `Esc` cancels the current selection. A committed move is not undoable in the prototype.

After a turn ends, a short banner identifies the newly active player. The battlefield remains visible because the game has no hidden information. Only the active player's ship accepts input.

Reducing a ship to zero hull ends the battle immediately. The result overlay identifies the winner and offers **Play Again**, which restores the original map, ships, hull, and first-player turn.

## Commands and Events

Input is translated into explicit rules commands such as:

- Select the active ship.
- Move to a destination hex.
- Attack the opposing ship.
- End the turn.
- Reset the battle.

The rules layer validates a command before mutating state. A successful command returns ordered domain events such as:

- Ship selected.
- Ship moved along a path.
- Ship attacked.
- Ship damaged.
- Turn changed.
- Battle won.
- Battle reset.

Presentation code consumes those events, runs the corresponding animation, and refreshes the view from authoritative state. Input remains disabled while event animation is in progress.

## Movement and Attack Interaction

Selecting the active ship displays all reachable water hexes within its remaining movement allowance. Hovering a reachable destination previews the complete legal path. Clicking that destination commits movement.

After movement, or immediately after selecting a ship already able to attack, the opposing ship is highlighted when it is in range. Hovering the target displays `Attack · 1 damage`. Clicking commits the attack.

The initial map contains only water and blocking land. Ships cannot enter or pass through land or the opposing ship's occupied cell. The pathfinder must find the shortest legal route around obstacles.

Pathfinding uses an `AStar2D` graph built from the walkable cells in the `TileMapLayer`. Neighbor connections come from the tile map's hex topology rather than duplicated pixel or coordinate calculations.

## Interface Design

The approved layout is the tactical-sidebar option: a dominant battlefield on the left and a persistent ship/action panel on the right.

The sidebar always shows:

- Active player (`PLAYER 1` or `PLAYER 2`).
- Ship name.
- Current and maximum hull.
- Movement, range, and damage values.
- Whether movement and attack remain available.
- Contextual instructions or validation feedback.
- **End Turn**.

The approved visual treatment is clean nautical:

- Deep navy panel surfaces.
- Warm brass accents for focus and primary actions.
- Light, high-contrast text.
- Restrained maritime decoration.
- Illustrated terrain based on the existing ocean and mountain tiles.

The initial visual vocabulary is:

- Active ship: warm brass outline.
- Reachable cells: translucent blue fill plus a movement marker.
- Hovered route: connected gold path markers.
- Valid attack target: red outline plus damage text or icon.
- Impassable terrain: blocked cursor and no reachable highlight.
- Inactive ship: subdued presentation and ignored input.

Important states use shape, icon, or text in addition to color so color is not the only information channel.

## Animation and Timing

Animation should feel responsive and should not hold up play:

- Selection and hover feedback appear immediately.
- Movement follows the previewed path with a short tween per cell.
- Attacks use a concise firing and impact effect.
- Damage produces an impact flash and animated hull-bar change.
- Turn banners are brief and non-modal.
- Victory uses a centered overlay with the battlefield still visible.

Exact durations are tuning values. Rules resolve before presentation begins, and new input is accepted only after the current event sequence finishes.

## Validation and Error Handling

Invalid player commands do not mutate state. Common invalid actions produce brief contextual feedback in the sidebar rather than modal dialogs. Examples include `Out of range`, `Blocked`, and `Player 2's turn`.

The handcrafted map is validated when the battle starts:

- Both starting cells are walkable.
- Starting cells are distinct and unoccupied by terrain.
- A legal route connects the ships.
- Every terrain identifier has a registered definition and tile.

Invalid project data should fail early with a clear development error. Player mistakes should remain quiet, recoverable interactions.

## Testing

Automated rules tests cover:

- Hex neighbors and distance.
- Shortest paths around obstacles.
- Legal and illegal movement.
- Attack range and fixed damage.
- One-move and one-attack limits.
- Prohibition on movement after attacking.
- Alternating Player 1 and Player 2 turns.
- Input restrictions to the active player's ship.
- Immediate victory when hull reaches zero.
- Deterministic reset to the initial battle.
- Rejection of invalid map setup.

A scene smoke test verifies that the battle scene loads, displays two ships, reports the active player in the sidebar, responds to a state refresh, and restarts.

Manual verification plays multiple complete matches and checks path-preview clarity, input locking during animations, turn-transition clarity, hover feedback, sidebar readability, and restart behavior at 1280×720.

## Upgrade Boundaries

Future work should extend the prototype through existing boundaries:

- New terrain adds definition resources, artwork, and optional terrain behavior.
- New ships add definitions and presentation scenes.
- Larger fleets extend battle state from one ship per player to collections without changing command ownership.
- Procedural generation produces the same map-data structure consumed by the handcrafted map loader.
- Larger maps add a camera inside `BattlefieldPanel` without restructuring the sidebar.
- Other resolutions provide alternative interface layouts over the same rules and presentation events.

No deferred subsystem is scaffolded until its first real use.
