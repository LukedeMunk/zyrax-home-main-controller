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
from flask import Blueprint, request, session                                   #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
from server_manager import generate_json_http_response
from logger import logi, logw, loge                                             #Import logging functions

dm = DeviceManager()
ledstrip_bp = Blueprint("ledstrip_blueprints", __name__)

#region Administrative ledstrip functionality
################################################################################
#
#   @brief  Adds a ledstrip to the database.
#
################################################################################
@ledstrip_bp.route("/add_ledstrip", methods=["POST"])
def add_ledstrip():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    config = {
        "name" : request.form.get("name"),
        "hostname" : request.form.get("hostname"),
        "icon" : request.form.get("icon"),
        "icon_low_state" : request.form.get("icon_low_state"),
        "ip_address" : request.form.get("ip_address"),
        "has_sensor" : int(request.form.get("has_sensor")),
        "sensor_inverted" : int(request.form.get("sensor_inverted")),
        "sensor_model" : c.LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH,
        "number_of_leds" : 0,
        "model_id" : int(request.form.get("model_id")),
    }

    if "sensor_model" in request.form.get("sensor_model"):
        config["sensor_model"] = int(request.form.get("sensor_model"))

    result = dm.add_ledstrip(config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/update_ledstrip", methods=["POST"])
def update_ledstrip():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    
    config = {}
    
    if request.form.get("name") is not None:
        config["name"] = request.form.get("name")
    if request.form.get("hostname") is not None:
        config["hostname"] = request.form.get("hostname")
    if request.form.get("icon") is not None:
        config["icon"] = request.form.get("icon")
    if request.form.get("icon_low_state") is not None:
        config["icon_low_state"] = request.form.get("icon_low_state")
    if request.form.get("ip_address") is not None:
        config["ip_address"] = request.form.get("ip_address")
    if request.form.get("model_id") is not None:
        config["model_id"] = int(request.form.get("model_id"))

    if request.form.get("has_sensor") is not None:
        config["has_sensor"] = int(request.form.get("has_sensor"))
    if request.form.get("sensor_inverted") is not None:
        config["sensor_inverted"] = int(request.form.get("sensor_inverted"))
    if request.form.get("sensor_model") is not None:
        config["sensor_model"] = int(request.form.get("sensor_model"))

    result = dm.update_ledstrip(id, config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the LED addressing of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/update_ledstrip_leds", methods=["POST"])
def update_ledstrip_leds():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json

    id = int(request_data.get("id"))
    config = {}
    
    config["leds"] = request_data.get("leds")
    config["segments"] = request_data.get("segments")
    
    dm.update_ledstrip_led_addressing(id, config)
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified ledstrip from the database.
#
################################################################################
@ledstrip_bp.route("/delete_ledstrip", methods=["POST"])
def delete_ledstrip():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.delete_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Resends the configuration to the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/reboot_ledstrip", methods=["POST"])
def reboot_ledstrip():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.reboot_ledstrip(id)

    return generate_json_http_response(c.HTTP_CODE_OK)
#endregion

#region Ledstrip Commands
################################################################################
#
#   @brief  Endpoint used to draw LEDs in real-time.
#
################################################################################
@ledstrip_bp.route("/draw_realtime_leds", methods=["POST"])
def draw_realtime_leds():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json

    id = int(request_data.get("id"))
    leds = request_data.get("leds")
    dm.realtime_ledstrip_coloring(id, leds)
        
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the color of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_color", methods=["POST"])
def set_ledstrip_color():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.set_ledstrip_color(id, request.form.get("color"))
        
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the color of the specified ledstrip group.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_group_color", methods=["POST"])
def set_ledstrip_group_color():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.set_ledstrip_group_color(id, request.form.get("color"))
        
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the brightness of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_brightness", methods=["POST"])
def set_ledstrip_brightness():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    brightness = int(request.form.get("brightness"))
    dm.set_ledstrip_brightness(id, brightness)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the brightness of the specified ledstrip group.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_group_brightness", methods=["POST"])
def set_ledstrip_group_brightness():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    brightness = int(request.form.get("brightness"))
    dm.set_ledstrip_group_brightness(id, brightness)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the mode of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_mode", methods=["POST"])
def set_ledstrip_mode():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    mode = int(request.form.get("mode"))
    dm.set_ledstrip_mode(id, mode)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates mode of the specified ledstrip group.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_group_mode", methods=["POST"])
def set_ledstrip_group_mode():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    mode = int(request.form.get("mode"))
    dm.set_ledstrip_group_mode(id, mode)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the configuration of the specified mode for the specified
#           device.
#
################################################################################
@ledstrip_bp.route("/config_mode", methods=["POST"])
def config_mode():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json

    mode_id = int(request_data.get("mode_id"))
    device_id = int(request_data.get("device_id"))
    config_list = generate_mode_config_dict_from_request(request_data)

    dm.configure_ledstrip_mode(mode_id, device_id, config_list)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the configuration of the specified mode for the specified
#           group.
#
################################################################################
@ledstrip_bp.route("/config_group_mode", methods=["POST"])
def config_group_mode():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json

    mode_id = int(request_data.get("mode_id"))
    group_id = int(request_data.get("group_id"))
    config_list = generate_mode_config_dict_from_request(request_data)

    dm.configure_ledstrip_group_mode(mode_id, group_id, config_list)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the power animation of the specified ledstrip.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_power_animation", methods=["POST"])
def set_ledstrip_power_animation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    power_animation = int(request.form.get("power_animation"))
    dm.set_ledstrip_power_animation(id, power_animation)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the power animation of the specified ledstrip group.
#
################################################################################
@ledstrip_bp.route("/set_ledstrip_group_power_animation", methods=["POST"])
def set_ledstrip_group_power_animation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    power_animation = int(request.form.get("power_animation"))
    dm.set_ledstrip_group_power_animation(id, power_animation)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Checks and sends ledstrip connection status to the front-end.
#
################################################################################
@ledstrip_bp.route("/check_ledstrip_connection_status", methods=["GET"])
def check_ledstrip_connection_status():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.args.get("id"))
    status = dm.check_ledstrip_connection_status(id)

    return generate_json_http_response(c.HTTP_CODE_OK, {"connection_status" : status})
#endregion

#region Utilities
################################################################################
#
#   @brief  Generates a mode configuration dictionary.
#   @param  request_data        Data of the HTTP request
#   @return dict                Automation dictionary
#
################################################################################
def generate_mode_config_dict_from_request(request_data):
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    config_dict = []

    for parameter in request_data["parameters"]:
        config_dict.append(parameter)

    return config_dict
#endregion