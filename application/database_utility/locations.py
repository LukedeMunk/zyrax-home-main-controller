################################################################################
#
#   File:   locations.py
#   Brief:  Database operations for device locations.
#
################################################################################
from server_manager import Location, app, db
from . import database_core as core

LOCATION_NOT_FOUND = "Location not found."
LOCATION_ERRORS = {"unique constraint failed": "A location with this name already exists."}

################################################################################
#
#   @brief  Returns all locations in name order.
#
################################################################################
def get_locations():
    with app.app_context():
        return [core.row_to_dictionary(room) for room in Location.query.order_by(Location.name)]

################################################################################
#
#   @brief  Adds a location and returns its ID.
#   @param  config_dict         Location name and icon fields
#
################################################################################
def add_location(config_dict):
    with app.app_context():
        room = Location(**config_dict)
        db.session.add(room)
        success, message = core.commit_with_handling(LOCATION_ERRORS)
        return (True, room.id) if success else (False, message)

################################################################################
#
#   @brief  Updates the supplied location fields.
#   @param  location_id         Location ID
#   @param  config_dict         Location name and icon fields
#
################################################################################
def update_location(location_id, config_dict):
    with app.app_context():
        room = db.session.get(Location, location_id)
        if room is None:
            return False, LOCATION_NOT_FOUND
        for field in ("name", "icon"):
            if field in config_dict:
                setattr(room, field, config_dict[field])
        return core.commit_with_handling(LOCATION_ERRORS)

################################################################################
#
#   @brief  Deletes a location and releases its device assignments.
#   @param  location_id         Location ID
#
################################################################################
def delete_location(location_id):
    with app.app_context():
        room = db.session.get(Location, location_id)
        if room is None:
            return False, LOCATION_NOT_FOUND
        db.session.delete(room)
        return core.commit_with_handling()
