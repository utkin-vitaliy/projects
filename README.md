# Sea Battle Prototype

A deliberately small, desktop-first prototype for a local two-player naval battle. Each player commands a three-ship fleet on the same fixed hexagonal battlefield. There is no AI: players alternate at the same computer until one fleet is sunk.

The code separates authored map and ship resources, deterministic battle rules, and Godot presentation. The fleet map contains 127 handcrafted cells, including a broken central terrain chain that shapes movement without changing attack range.

## Requirements and running

Use Godot **4.7.1**. Open `sea-battle/project.godot` in the editor and run the project with **F5**, or run from this repository root:

```bash
godot --path sea-battle
```

Run the automated tests headlessly with:

```bash
godot --headless --path sea-battle -s res://tests/test_runner.gd
```

## Controls

- **Left click:** select any READY ship on the map, choose a highlighted destination, or attack a highlighted enemy.
- **Fleet roster:** select a READY ship by class; roster and map selection issue the same rules command.
- **Hover:** preview the route to a reachable cell and inspect the attack target.
- **Right click / Esc:** cancel selection before committing an action.
- **END ACTIVATION:** finish the selected ship's activation without attacking.
- **PLAY AGAIN:** restore all six ships, full hull, original cells, round one, and Player 1 initiative after a victory.

## Fleet classes

Each player controls one ship of every class:

| Class | Hull | Move | Range | Damage | Tactical role |
| --- | ---: | ---: | ---: | ---: | --- |
| Sloop | 2 | 4 | 2 | 1 | Fast flanker and vulnerable scout |
| Frigate | 4 | 3 | 3 | 1 | Durable ranged-control ship |
| Galleon | 6 | 2 | 2 | 2 | Slow, close-range fleet anchor |

Every surviving ship receives one activation per round. Players alternate activations while both fleets have READY ships; if only one fleet has activations left, it completes them consecutively. Round initiative alternates between Player 1 and Player 2.

## Current scope

This milestone focuses on a complete 1280×720 local fleet match with fixed class damage, authored deployment, a 127-cell hexagonal ocean-and-mountain map, and a persistent tactical roster. A sunk ship disappears from map occupancy and presentation but remains marked **SUNK** in its fleet roster. Sinking all three opposing ships ends the match immediately and shows the victory overlay.

Online multiplayer, AI, abilities, deployment editing, procedural generation, sound, save data, and responsive/mobile layouts are intentionally deferred.
