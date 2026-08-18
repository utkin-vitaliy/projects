class_name FleetState
extends RefCounted

var player: int

var _ships: Dictionary = {}
var _ship_ids: Array[StringName] = []


func configure(owner: int, definitions: Array[ShipDefinition], starts: Array[Vector2i]) -> void:
	assert(definitions.size() == starts.size(), "Fleet definitions and starts must have equal sizes")
	player = owner
	_ships.clear()
	_ship_ids.clear()
	for index in definitions.size():
		var definition := definitions[index]
		var ship_id: StringName = &"p%d_%s" % [player, definition.class_id]
		var fleet_ship := FleetShipState.new()
		fleet_ship.configure(ship_id, player, definition, starts[index])
		_ships[ship_id] = fleet_ship
		_ship_ids.append(ship_id)


func ship(id: StringName) -> FleetShipState:
	return _ships[id]


func ordered_ships() -> Array[FleetShipState]:
	var ships: Array[FleetShipState] = []
	for ship_id in _ship_ids:
		ships.append(_ships[ship_id])
	return ships


func living_ships() -> Array[FleetShipState]:
	var ships: Array[FleetShipState] = []
	for fleet_ship in ordered_ships():
		if not fleet_ship.is_destroyed():
			ships.append(fleet_ship)
	return ships


func ready_ships() -> Array[FleetShipState]:
	var ships: Array[FleetShipState] = []
	for fleet_ship in ordered_ships():
		if not fleet_ship.is_destroyed() and not fleet_ship.activation_used:
			ships.append(fleet_ship)
	return ships


func has_ready_ship() -> bool:
	return not ready_ships().is_empty()


func is_defeated() -> bool:
	return living_ships().is_empty()


func occupied_cells() -> Dictionary:
	var cells := {}
	for fleet_ship in living_ships():
		cells[fleet_ship.cell] = true
	return cells


func reset_activations() -> void:
	for fleet_ship in ordered_ships():
		fleet_ship.reset_for_round()
