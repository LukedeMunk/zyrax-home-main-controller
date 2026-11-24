################################################################################
#
# File:     location_blueprints.py
# Brief:    Catalog endpoints for managing device locations.
#
################################################################################
from flask import Blueprint, request
from DeviceManager import DeviceManager
from database_utility.locations import LOCATION_NOT_FOUND
import configuration as c
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
location_bp = Blueprint("location_blueprints", __name__)

################################################################################
#
#   @brief  Extracts and validates the location fields supplied by the client.
#
################################################################################
def _location_fields(payload, required=False):
    fields = {}
    for key in ("name", "icon"):
        if key not in payload and not required:
            continue
        value = payload.get(key)
        if not isinstance(value, str) or not 1 <= len(value.strip()) <= 50:
            raise ValueError("Invalid location name or icon.")
        fields[key] = value.strip()
    return fields

################################################################################
#
#   @brief  Returns all catalog locations.
#
################################################################################
@location_bp.get(c.API_URL_LOCATIONS)
@minimum_role_required()
def list_locations():
    return generate_json_http_response(c.HTTP_CODE_OK, dm.get_locations())

################################################################################
#
#   @brief  Registers a location and returns its ID and the updated catalog.
#
################################################################################
@location_bp.post(c.API_URL_ADD_LOCATION)
@minimum_role_required()
def add_location():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Expected a location object.")
    try:
        fields = _location_fields(payload, required=True)
    except ValueError as error:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, str(error))

    success, result = dm.add_location(fields)
    if not success:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result)
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result, "locations": dm.get_locations()})

################################################################################
#
#   @brief  Updates the supplied fields of an existing location.
#
################################################################################
@location_bp.post(c.API_URL_UPDATE_LOCATION)
@minimum_role_required()
def update_location():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or type(payload.get("id")) is not int:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid location ID.")
    try:
        fields = _location_fields(payload)
    except ValueError as error:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, str(error))

    success, message = dm.update_location(payload["id"], fields)
    if not success:
        code = c.HTTP_CODE_NOT_FOUND if message == LOCATION_NOT_FOUND else c.HTTP_CODE_BAD_REQUEST
        return generate_json_http_response(code, message)
    return generate_json_http_response(c.HTTP_CODE_OK, {"locations": dm.get_locations()})

################################################################################
#
#   @brief  Deletes a location selected in the catalog.
#
################################################################################
@location_bp.post(c.API_URL_DELETE_LOCATION)
@minimum_role_required()
def delete_location():
    location_id = request.form.get("id", type=int)
    if location_id is None:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid location ID.")

    success, message = dm.delete_location(location_id)
    if not success:
        code = c.HTTP_CODE_NOT_FOUND if message == LOCATION_NOT_FOUND else c.HTTP_CODE_BAD_REQUEST
        return generate_json_http_response(code, message)
    return generate_json_http_response(c.HTTP_CODE_OK)
