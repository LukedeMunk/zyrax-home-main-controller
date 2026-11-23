################################################################################
#
# File:     ledstrip_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for LED strip features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import json

from werkzeug.exceptions import BadRequest
from flask import Blueprint, request, session                                   #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager

from logger import logi, logw, loge                                             #Import logging functions
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response
from automation.adapter_registry import AdapterRoutingError

dm = DeviceManager()
ledstrip_bp = Blueprint("ledstrip_blueprints", __name__)


################################################################################
#
#   @brief  Returns a UI error when a LED command cannot be routed.
#   @param  error               Target or capability routing failure
#   @return str                 JSON error in the existing UI format
#
################################################################################
@ledstrip_bp.errorhandler(AdapterRoutingError)
def handle_ledstrip_routing_error(error):
    return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, str(error))

#region Administrative ledstrip functionality
################################################################################
#
#   @brief  Updates the LED addressing of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route(c.API_URL_UPDATE_LEDSTRIP_LEDS, methods=["POST"])
@minimum_role_required()
def update_ledstrip_leds():
    id, _ = _get_ledstrip_target(allow_group=False)
    config = {"leds": _read_ledstrip_array("leds"), "segments": _read_ledstrip_array("segments")}
    dm.update_ledstrip_led_addressing(id, config)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Resends the configuration to the specified ledstrip.
#
################################################################################
@ledstrip_bp.route(c.API_URL_REBOOT_DEVICE, methods=["POST"])
@minimum_role_required()
def reboot_ledstrip():
    id = int(request.form.get("id"))
    dm.reboot_ledstrip(id)#todo to device

    return generate_json_http_response(c.HTTP_CODE_OK)
#endregion

#region Ledstrip Commands
################################################################################
#
#   @brief  Endpoint used to draw LEDs in real-time.
#
################################################################################
@ledstrip_bp.route(c.API_URL_DRAW_REALTIME_LEDS, methods=["POST"])
@minimum_role_required()
def draw_realtime_leds():
    id, _ = _get_ledstrip_target(allow_group=False)
    leds = _read_ledstrip_array("leds")
    dm.realtime_ledstrip_coloring(id, leds)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the brightness of a strip or group selected by target_type.
#
################################################################################
@ledstrip_bp.route(c.API_URL_LEDSTRIP_SET_BRIGHTNESS, methods=["POST"])
@minimum_role_required()
def set_ledstrip_brightness():
    id, is_group = _get_ledstrip_target()
    try:
        brightness = int(request.form.get("brightness"))
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide an integer brightness.") from error

    action = dm.set_ledstrip_group_brightness if is_group else dm.set_ledstrip_brightness
    action(id, brightness)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the mode of a strip or group selected by target_type.
#
################################################################################
@ledstrip_bp.route(c.API_URL_LEDSTRIP_SET_MODE, methods=["POST"])
@minimum_role_required()
def set_ledstrip_mode():
    id, is_group = _get_ledstrip_target()
    try:
        mode = int(request.form.get("mode_id"))
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide an integer mode_id.") from error

    action = dm.set_ledstrip_group_mode if is_group else dm.set_ledstrip_mode
    action(id, mode)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates mode parameters for a strip or group selected by target_type.
#
################################################################################
@ledstrip_bp.route(c.API_URL_CONFIGURE_LEDSTRIP_MODE, methods=["POST"])
@minimum_role_required()
def configure_ledstrip_mode():
    id, is_group = _get_ledstrip_target()
    try:
        mode_id = int(request.form.get("mode_id"))
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide an integer mode_id.") from error

    parameters = _read_ledstrip_array("parameters")
    if is_group:
        dm.configure_ledstrip_group_mode(mode_id, id, parameters)
        return generate_json_http_response(c.HTTP_CODE_OK)

    dm.configure_ledstrip_mode(mode_id, id, parameters)
    return generate_json_http_response(
        c.HTTP_CODE_OK, {"mode_configurations": dm.get_ledstrip_mode_configurations(id)}
    )

################################################################################
#
#   @brief  Updates the power animation of a strip or group selected by target_type.
#
################################################################################
@ledstrip_bp.route(c.API_URL_LEDSTRIP_SET_POWER_ANIMATION, methods=["POST"])
@minimum_role_required()
def set_ledstrip_power_animation():
    id, is_group = _get_ledstrip_target()
    try:
        power_animation = int(request.form.get("power_animation"))
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide an integer power_animation.") from error

    action = dm.set_ledstrip_group_power_animation if is_group else dm.set_ledstrip_power_animation
    action(id, power_animation)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Checks and sends ledstrip connection status to the front-end.
#
################################################################################
@ledstrip_bp.route("/check_ledstrip_connection_status", methods=["GET"])
@minimum_role_required()
def check_ledstrip_connection_status():
    id = int(request.args.get("id"))
    status = dm.check_ledstrip_connection_status(id)

    return generate_json_http_response(c.HTTP_CODE_OK, {"connection_status" : status})
#endregion

#region Utilities
#endregion


################################################################################
#
#   @brief  Reads the form target and prevents ambiguous device/group dispatch.
#   @param  allow_group          Whether this operation supports group targets
#   @return tuple               Integer target ID and whether it is a group
#
################################################################################
def _get_ledstrip_target(allow_group=True):
    try:
        id = int(request.form.get("id"))
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide an integer id.") from error

    target_type = request.form.get("target_type", "device")
    allowed = ("device", "group") if allow_group else ("device",)
    if target_type not in allowed:
        raise BadRequest("Unsupported target_type.")

    return id, target_type == "group"


################################################################################
#
#   @brief  Decodes a structured LED field from form data.
#   @param  name                 Name of the JSON-encoded form field
#   @return list                Decoded LED data or mode parameters
#
################################################################################
def _read_ledstrip_array(name):
    try:
        value = json.loads(request.form.get(name, ""))
    except (TypeError, ValueError) as error:
        raise BadRequest(f"Provide a JSON array in {name}.") from error
    if not isinstance(value, list):
        raise BadRequest(f"Provide a JSON array in {name}.")

    return value
