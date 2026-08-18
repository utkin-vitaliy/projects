# Sea Battle Prototype

A deliberately small, desktop-first prototype for a local two-player naval battle. Each player controls one ship on the same fixed hex battlefield. There is no AI: players alternate at the same computer, moving optionally and then firing when in range.

The code separates authored map and ship resources, deterministic battle rules, and Godot presentation so more terrain, units, rules, and screen sizes can be added without rewriting the prototype core.

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

- **Left click:** select the active ship, choose a highlighted destination, or attack the targeted enemy.
- **Hover:** preview the route to a reachable cell and inspect the attack target.
- **Right click / Esc:** cancel selection before committing an action.
- **End Turn:** pass control without attacking.
- **Play Again:** restore both ships and the original battlefield after a victory.

## Current scope

This milestone focuses on a polished 1280×720 local match with one ship per player, fixed damage, a handcrafted ocean-and-mountain map, and a visible tactical sidebar. Online multiplayer, AI, multiple ship types, abilities, map generation, sound, save data, mobile layouts, sand islands, and reefs are intentionally deferred.
