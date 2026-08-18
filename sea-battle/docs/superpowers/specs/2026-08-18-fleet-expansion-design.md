# Sea Battle Fleet Expansion Design

Date: 2026-08-18
Status: Awaiting Written Review

## Goal

Expand the working local two-player prototype from one identical ship per player into a tactical fleet battle. Each player controls one light sloop, one medium frigate, and one heavy galleon. The expansion adds distinct historic ship silhouettes, data-driven class tuning, alternating single-ship activations, fleet rounds, a persistent fleet roster, sinking, and a larger hexagonal battlefield.

The result remains a desktop-first, same-computer, human-versus-human game with deterministic rules and no hidden information.

## Scope

### Included

- One three-ship fleet per player: sloop, frigate, and galleon.
- Historic-character silhouettes that distinguish classes without relying on color.
- Fixed class statistics and guaranteed fixed damage.
- One surviving ship activation per player turn.
- Each surviving ship activates at most once per round.
- Alternating round initiative.
- Automatic handling of unmatched activations when one fleet exhausts first.
- A handcrafted 127-cell hexagonal battlefield with a central mountain chain and flank routes.
- Three fixed, validated starting cells per player.
- A persistent fleet roster plus selected-ship detail in the existing right sidebar.
- Sinking animation, removal from the map, roster state, full-fleet victory, and restart.
- Automated rule, map, resource, presentation, and complete-match tests.

### Deferred

- Computer-controlled opponents.
- Deployment or fleet-building phases.
- Unique class abilities, weapons, statuses, armor rules, or accuracy rolls.
- Random damage and hidden information.
- Procedural maps, map selection, camera panning, and zooming.
- Sand, reefs, hazards, and additional terrain behavior.
- Personalized vessel names.
- Networking, saving, campaign progression, and responsive/mobile layouts.

## Design Principles

The expansion preserves the prototype's rules, presentation, and interface boundaries.

- Scene-free rules remain authoritative.
- Commands validate before mutating state and return stable rejection codes.
- Successful commands return typed, ordered battle events.
- Presentation animates events but never decides legality or mutates battle state.
- Ship class tuning and visual profiles live in resources.
- Player ownership uses color, while class and readiness also use silhouette, icon, shape, and text.
- The implementation extends the current ship model only as far as the approved fleet rules require; it does not introduce a generic ability framework.

## Ship Classes

The initial balance profile is:

| Class | Weight | Hull | Move | Range | Damage | Tactical role |
|---|---|---:|---:|---:|---:|---|
| Sloop | Light | 2 | 4 | 2 | 1 | Fast flanker and vulnerable scout |
| Frigate | Medium | 4 | 3 | 3 | Durable ranged-control ship |
| Galleon | Heavy | 6 | 2 | 2 | Slow, close-range fleet anchor |

Attacks remain guaranteed hits. A galleon therefore sinks a full-health sloop in one hit. The sloop's protection is speed, route choice, and activation timing rather than durability.

`ShipDefinition` remains the gameplay-tuning resource and gains stable class identity, weight label, tactical-role copy, and a required visual-profile reference. Definitions do not contain per-player state.

## Visual Profiles

Each class references a `ShipVisualProfile` resource consumed by one reusable `ShipView`.

- **Sloop:** narrow hull, one mast and sail, smallest map silhouette.
- **Frigate:** longer hull, two masts, medium silhouette.
- **Galleon:** broad hull, three masts, raised stern, and visible gun ports.

The visual profile provides the class icon and data needed to draw its map silhouette. Player ownership supplies the hull/accent palette separately, so both fleets share class readability while remaining distinguishable.

The first version uses the class names `SLOOP`, `FRIGATE`, and `GALLEON` in the interface. Unique vessel names can later be added to fleet setup data without altering the class definitions.

## Authoritative Fleet State

Each player owns a `FleetState` containing three uniquely identified `ShipState` objects. A ship state owns:

- Stable ship ID and owning player.
- `ShipDefinition` reference.
- Current cell and hull.
- Sunk state.
- Round activation state.
- Current activation's movement and attack usage.

`BattleState` owns:

- Both fleets.
- Active player.
- Round number and round-starting player.
- Selected ship ID.
- Winner.
- Fixed fleet starting data used by reset.

Queries expose surviving ships, ready ships, occupied cells, selected ship, legal targets, reachable cells, fleet exhaustion, and game-over state without giving presentation direct mutation access.

## Activation and Round Flow

Round one begins with Player 1. Round initiative alternates after every completed round, so Player 2 begins round two, Player 1 begins round three, and so on.

An activation proceeds as follows:

```text
Choose one ready surviving ship
  → optionally preview and move once
  → optionally attack one legal enemy target
  → attack or End Activation completes the activation
  → pass to the opponent if they have a ready ship
```

A ship may attack without moving. Attacking ends the activation immediately, so movement after attacking is not allowed. Right-click or `Esc` may cancel selection only before an action is committed. A committed move cannot be undone.

Each surviving ship may activate once per round. If the opponent has exhausted all ready ships, the current player continues selecting and completing their remaining ready ships, including consecutive activations. When neither fleet has a ready ship, the next round begins, activation flags reset for surviving ships, and initiative passes to the other round starter.

Sunk ships never activate and do not count when evaluating fleet exhaustion.

## Attacks, Sinking, and Victory

The selected ship may target any living enemy ship within its definition's geometric hex range. Terrain does not block attacks in this milestone. Ships do block movement and cannot share cells.

Damage is the attacker's fixed definition value. When damage reduces a ship to zero hull:

1. Damage state resolves in the rules layer.
2. Ordered attack, damage, and sinking events are emitted.
3. The sinking presentation plays while input remains locked.
4. The ship view disappears and its cell stops blocking movement.
5. Its roster row remains visible and reads `SUNK`.

The battle ends immediately when a fleet has no surviving ships. The result overlay identifies the winning player. **Play Again** restores all six ships, exact starting cells, full hull, round one, Player 1 initiative, and clear presentation state.

## Commands and Events

Commands operate on explicit ship IDs and, where applicable, target IDs or destination cells:

- Select a ready ship.
- Cancel selection.
- Move the selected ship.
- Attack an enemy ship.
- End the selected ship's activation.
- Reset the battle.

Stable rejection codes include:

- `inactive_player`
- `selection_required`
- `ship_already_used`
- `ship_sunk`
- `action_committed`
- `blocked`
- `out_of_range`
- `invalid_target`
- `game_over`

Presentation-facing events include:

- `ship_selected`
- `selection_cancelled`
- `ship_moved`
- `ship_attacked`
- `ship_damaged`
- `ship_sunk`
- `activation_completed`
- `player_changed`
- `round_started`
- `battle_won`
- `battle_reset`

Event payloads carry stable ship IDs, players, paths, target IDs, resulting hull, round number, or winner as needed. The animator consumes them in order and the screen refreshes from authoritative state afterward.

## Hexagonal Battlefield

The fleet battlefield is a true hexagon with seven cells per side, for 127 playable cells total. The complete map must remain visible in the existing desktop battlefield panel at 1280×720 without panning or zooming.

`MapDefinition` no longer assumes a rectangular `size`. It owns the exact playable-cell set, blocked terrain cells, terrain definitions, and three fixed start cells per player. Explicit cells support the approved hexagon now and irregular coastlines later without changing the rules interface.

The approved terrain structure is a broken central mountain chain. Several clusters divide the center but leave two broad flanking routes and multiple crossings. Initial fleet formations occupy opposing corners:

- Sloop toward the open flank.
- Frigate in a central supporting position.
- Galleon toward the protected inner route.

Movement pathfinding excludes blocked terrain and every other living ship. Attack distance uses the geometry graph and ignores terrain, matching the existing guaranteed-fire model.

## Fleet Sidebar

The approved interface is **Roster + Active Detail** in the existing right sidebar.

The sidebar contains:

- Active player and round header.
- Three persistent roster rows for the active player's fleet.
- Class silhouette or icon.
- Current and maximum hull with a hull bar.
- Exact `READY`, `ACTIVE`, `USED`, or `SUNK` text.
- Selected class, weight, tactical role, movement, range, and damage.
- Contextual instructions or validation feedback.
- **END ACTIVATION**.

Clicking a `READY` roster row selects the same ship as clicking its map view. Used and sunk rows remain informative but cannot be selected. Map selection and roster selection call the same public screen method and the same rules command.

The opponent fleet remains fully visible on the battlefield because the game has no hidden information. The sidebar focuses on the active player's activation choices.

## Map and Interaction Feedback

The existing highlight vocabulary extends to multiple ships and targets:

- Active selected ship: brass outline plus `ACTIVE` roster state.
- Other ready friendly ships: readiness marker and `READY` text.
- Used friendly ships: dimmed plus `USED` text.
- Reachable cells: translucent fill plus center marker.
- Hovered movement route: connected line, dots, and chevrons.
- Legal enemy targets: target outline and crosshair.
- Sunk ship: sinking animation followed by removal and persistent `SUNK` roster text.

Hovering a legal target shows its class and the exact damage about to be dealt. Clicking invalid terrain, used ships, sunk rows, or out-of-range targets produces brief contextual feedback without changing state.

## Animation

Existing movement, projectile, damage, banner, and result animations remain event-driven. Fleet-specific additions are:

- Class silhouettes move along validated paths without recomputation.
- Damage animates each map hull bar and the relevant roster hull bar.
- Sinking flashes the target, lowers or scales it beneath the water line, emits a concise water-ring effect, then removes the view.
- `player_changed` updates the roster and may show a short player banner.
- `round_started` shows a distinct brief round-and-initiative banner.

Input remains locked for the entire event sequence. Test mode skips timing while preserving final state and the same event-handling path.

## Validation and Error Handling

Invalid authored data prevents battle initialization, logs precise development errors, locks input, and shows `Invalid battlefield data`. The system does not silently repair project data.

Validation covers:

- Exactly three class definitions per fleet.
- Required sloop, frigate, and galleon class IDs.
- Unique ship IDs.
- Complete visual profiles.
- Exactly six fixed start cells.
- Starts inside the playable-cell set.
- Distinct, walkable starts with no overlaps.
- A 127-cell connected playable map.
- Reachability from each fleet formation into the shared battlefield.
- Valid terrain definitions, tile sources, and atlas cells.

Player mistakes return stable rule codes and never mutate state. Only the sidebar maps those codes to wording.

## Testing

Automated tests cover:

- Exact sloop, frigate, and galleon resources and approved balance values.
- Required class IDs and visual profiles.
- The 127-cell hexagonal map, central-chain obstacles, and six valid starts.
- Map validation failures and deterministic reason-code order.
- Paths around several occupied ship cells.
- Selecting any ready ship through stable IDs.
- Rejection of inactive, used, and sunk ships.
- Movement and attack limits within one activation.
- Attack without movement and prohibition on movement after attack.
- Alternating activations while both fleets have ready ships.
- Consecutive unmatched activations after one fleet exhausts.
- Alternating round initiative and readiness reset.
- Galleon one-hit destruction of a full-health sloop.
- Sinking, removal from occupancy, full-fleet victory, and deterministic restart.
- Six ship views with correct class silhouettes and ownership palettes.
- Roster and map selection through the same public screen flow.
- Exact `READY`, `ACTIVE`, `USED`, and `SUNK` interface states.
- A complete multi-round fleet match through public scene methods.

Desktop acceptance at 1280×720 verifies that all 127 cells, six ships, and the entire sidebar remain visible; class silhouettes are distinguishable without color; highlights and sinking are unambiguous; input never unlocks mid-animation; and repeated matches do not retain stale activation, roster, or view state.

## Upgrade Boundaries

- New ship classes add definition and visual-profile resources.
- Unique abilities can later add explicit commands and events without changing fleet ownership.
- Deployment can later produce the same fleet-start structure currently authored by the map.
- Reefs and sand extend terrain definitions and map cells.
- Procedural generation can produce the same explicit playable-cell and start-cell data.
- Personalized vessel names can live in fleet setup data rather than class definitions.
- Responsive layouts can replace the desktop sidebar scene while consuming the same fleet state.

No deferred subsystem is scaffolded until its first approved use.
