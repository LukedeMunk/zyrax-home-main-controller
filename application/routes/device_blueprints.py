################################################################################
#
# File:     device_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for device features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request


import database_utility as db_util
from server_manager import app, db, HubHost, Device, Location
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
from automation.adapter_registry import AdapterRoutingError

from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
device_bp = Blueprint("device_blueprints", __name__)


################################################################################
#
#   @brief  Returns a UI error when a device command cannot be routed.
#   @param  error               Target or capability routing failure
#   @return str                 JSON error in the existing UI format
#
################################################################################
@device_bp.errorhandler(AdapterRoutingError)
def handle_device_routing_error(error):
    return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, str(error))

################################################################################
#
#   @brief  Updates the power of the specified device.
#   @return str                JSON response confirming the update
#
################################################################################
@device_bp.route(c.API_URL_SET_DEVICE_POWER, methods=["POST"])
@minimum_role_required()
def set_device_power():
    id = int(request.form.get("id"))
    power = int(request.form.get("power"))
    dm.set_device_power(id, power)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the power of the specified group.
#   @return str                JSON response confirming the update
#
################################################################################
@device_bp.route(c.API_URL_SET_GROUP_POWER, methods=["POST"])
@minimum_role_required()
def set_group_power():
    id = int(request.form.get("id"))
    power = int(request.form.get("power"))

    dm.set_device_group_power(id, power)

    return generate_json_http_response(c.HTTP_CODE_OK)


################################################################################
#
#   @brief  Lists enriched devices, optionally filtered by ID or device type.
#   @param  device_type         Default device type for the legacy list aliases
#   @return Response           Catalog entries with capabilities and room
#
################################################################################
@device_bp.route(c.API_URL_GET_DEVICES, methods=["GET"])
@minimum_role_required()
def list_devices(device_type=None):
    type_filter = request.args.get("type")
    named_types = {"ledstrip": c.DEVICE_TYPE_LEDSTRIP, "sensor": c.DEVICE_TYPE_RF_DEVICE}
    try:
        if type_filter is not None:
            device_type = named_types[type_filter] if type_filter in named_types else int(type_filter)
        device_id = int(request.args.get("id")) if "id" in request.args else None
    except (TypeError, ValueError):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST, "Invalid device ID or type.", use_http_status=True
        )

    with app.app_context():
        devices = dm.get_devices_dict(type=device_type)
        if device_id is not None:
            devices = [device for device in devices if device["id"] == device_id]
            if not devices:
                return generate_json_http_response(
                    c.HTTP_CODE_NOT_FOUND, c.TEXT_DEVICE_NOT_FOUND, use_http_status=True
                )
        devices = db_util.add_device_options(devices)
        locations = {location.id: location.name for location in Location.query.all()}

        for device in devices:
            device["location"] = locations.get(device["location_id"])

            if device["role"] == "hub":
                host = db.session.get(HubHost, device["id"])
                device["hostname"] = host.hostname if host else None

        if device_id is not None:
            device = devices[0]
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                device["mode_configurations"] = dm.get_ledstrip_mode_configurations(device_id)
            return generate_json_http_response(c.HTTP_CODE_OK, device, use_http_status=True)

        return generate_json_http_response(c.HTTP_CODE_OK, devices, use_http_status=True)


################################################################################
#
#   @brief  Registers, edits or removes a device in the device catalog.
#   @param  device_id           Existing device ID for edits or deletion
#   @return Response           Result with the corresponding HTTP status
#
################################################################################
@device_bp.route(c.API_URL_ADD_DEVICE, methods=["POST"])
@minimum_role_required()
def add_device():
    with app.app_context():
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return generate_json_http_response(
                c.HTTP_CODE_BAD_REQUEST, c.TEXT_DEVICE_JSON_REQUIRED, use_http_status=True
            )

        try:
            config = db_util.validate_device(payload, None)
        except ValueError as error:
            return generate_json_http_response(
                c.HTTP_CODE_BAD_REQUEST, str(error), use_http_status=True
            )

        if config["type"] == c.DEVICE_TYPE_LEDSTRIP:
            success, message = dm.add_ledstrip(config)
        elif config["type"] == c.DEVICE_TYPE_RF_DEVICE:
            success, message = dm.add_rf_device(config)
        else:
            success, message = db_util.add_device(config)
            if success:
                dm.load_devices()

        if not success:
            if message == "UI_TEXT_DATABASE_INTEGRITY_ERROR":
                message = c.TEXT_DEVICE_DUPLICATE

            return generate_json_http_response(
                c.HTTP_CODE_CONFLICT, message, use_http_status=True
            )
        return generate_json_http_response(
            c.HTTP_CODE_CREATED, {"id": message}, use_http_status=True
        )


################################################################################
#
#   @brief  Updates catalog fields and sends changed LED settings to the controller.
#   @return Response           Result with the corresponding HTTP status
#
################################################################################
@device_bp.route(c.API_URL_UPDATE_DEVICE, methods=["POST"])
@minimum_role_required()
def update_device():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST, c.TEXT_DEVICE_JSON_REQUIRED, use_http_status=True
        )
    try:
        id = int(request.form.get("id", payload.get("id")))
    except (TypeError, ValueError):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST, "Invalid device ID.", use_http_status=True
        )

    with app.app_context():
        device = db.session.get(Device, id)
        if device is None:
            return generate_json_http_response(
                c.HTTP_CODE_NOT_FOUND, c.TEXT_DEVICE_NOT_FOUND, use_http_status=True
            )

        try:
            config = db_util.validate_device(payload, device)
        except ValueError as error:
            return generate_json_http_response(
                c.HTTP_CODE_BAD_REQUEST, str(error), use_http_status=True
            )

        hardware_settings = {"hostname", "has_sensor", "sensor_inverted"}
        if device.type == c.DEVICE_TYPE_LEDSTRIP and hardware_settings.intersection(payload):
            success, message = dm.update_ledstrip(id, config)
        else:
            success, message = dm.update_device(id, config)

        if not success:
            if message == "UI_TEXT_DATABASE_INTEGRITY_ERROR":
                message = c.TEXT_DEVICE_DUPLICATE
            return generate_json_http_response(
                c.HTTP_CODE_CONFLICT, message, use_http_status=True
            )
        
        return generate_json_http_response(
            c.HTTP_CODE_OK, {"id": id}, use_http_status=True
        )


################################################################################
#
#   @brief  Registers, edits or removes a device in the device catalog.
#   @param  device_id           Existing device ID for edits or deletion
#   @return Response           Result with the corresponding HTTP status
#
################################################################################
@device_bp.route(c.API_URL_DELETE_DEVICE, methods=["POST"])
@minimum_role_required()
def delete_device():
    id = int(request.form.get("id"))

    with app.app_context():
        device = db.session.get(Device, id) if id else None
        if device is None:
            return generate_json_http_response(
                c.HTTP_CODE_NOT_FOUND, c.TEXT_DEVICE_NOT_FOUND, use_http_status=True
            )

        success, message = dm.delete_device(id)
        if not success:
            return generate_json_http_response(
                c.HTTP_CODE_CONFLICT, message, use_http_status=True
            )
        
        return "", c.HTTP_CODE_NO_CONTENT


################################################################################
#
#   @brief  Returns connection status for an LED strip or hub.
#   @return str                JSON envelope containing connection_status
#
################################################################################
@device_bp.route(c.API_URL_CHECK_DEVICE_CONNECTION_STATUS, methods=["GET"])
@minimum_role_required()
def check_device_connection_status():
    try:
        id = int(request.args.get("id"))
    except (TypeError, ValueError):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid device ID.")

    status = dm.check_device_connection_status(id)

    return generate_json_http_response(c.HTTP_CODE_OK, {"connection_status": status})
