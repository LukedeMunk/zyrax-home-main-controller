################################################################################
#
# File:     data_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for requesting data.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, send_file, session                        #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
from server_manager import last_received_rf_codes
from logger import logi, logw, loge                                             #Import logging functions
from WeatherServiceClient import WeatherServiceClient
import database_utility as db_util
import os                                                                       #For file handling

from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
data_bp = Blueprint("data_blueprints", __name__)

weather_client = WeatherServiceClient(
    base_url=c.WEATHER_SERVICE_URL,
    api_key=c.dynamic_config.microservice_key
)

#region Load pages
################################################################################
#
#   @brief  Endpoint to get the weather information.
#
################################################################################
@data_bp.route("/get_profiles", methods=["GET"])
@minimum_role_required()
def get_profiles():
    return generate_json_http_response(c.HTTP_CODE_OK, {"profiles": db_util.get_profiles(session["account_id"])})

################################################################################
#
#   @brief  Endpoint to get the weather information.
#
################################################################################
@data_bp.route("/get_profile_picture", methods=["GET"])
def get_profile_picture():
    profile_id = None
    
    if "id" in request.args:
        profile_id = int(request.args.get("id"))

    elif "profile_id" in session:
        profile_id = session["profile_id"]
    
    else:
        return send_file(c.DEFAULT_PROFILE_PICTURE_PATH)
    
    profile = db_util.get_profile(profile_id)
    
    if profile is None:
        return send_file(c.DEFAULT_PROFILE_PICTURE_PATH)
    
    path = os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, profile["profile_picture"])

    if not os.path.exists(path):
        return send_file(c.DEFAULT_PROFILE_PICTURE_PATH)

    return _send_uncached_file(path)

################################################################################
#
#   @brief  Endpoint to get the weather information.
#
################################################################################
@data_bp.route("/get_default_profile_picture", methods=["GET"])
def get_default_profile_picture():
    return send_file(c.DEFAULT_PROFILE_PICTURE_PATH)

################################################################################
#
#   @brief  Endpoint to get the weather information.
#
################################################################################
@data_bp.route("/get_weather", methods=["GET"])
@minimum_role_required()
def get_weather():
    return generate_json_http_response(c.HTTP_CODE_OK, {"weather" : weather_client.get_weather_forecast(True)})

################################################################################
#
#   @brief  Endpoint to get the last received RF codes from RF devices.
#
################################################################################
@data_bp.route("/get_last_received_rf_codes", methods=["GET"])
@minimum_role_required()
def get_last_received_rf_codes():
    code_list = []
    for code in last_received_rf_codes.values():
        code_list.append(code)

    return generate_json_http_response(c.HTTP_CODE_OK, {"rf_codes" : [code_list]})

################################################################################
#
#   @brief  Endpoint to get the devices within the system.
#
################################################################################
@data_bp.route("/get_devices", methods=["GET"])
@minimum_role_required()
def get_devices():
    if request.args.get("id") is not None:
        id = int(request.args.get("id"))
        device = dm.get_device_dict(id=id)
        return device

    devices = dm.get_devices_dict()
    return devices

################################################################################
#
#   @brief  Endpoint to get the ledstrips within the system.
#
################################################################################
@data_bp.route("/get_ledstrips", methods=["GET"])
@minimum_role_required()
def get_ledstrips():
    if request.args.get("id") != None:
        id = int(request.args.get("id"))
        ledstrip = dm.get_ledstrip_dict(id=id)
        ledstrip["color"] = dm.get_ledstrip_color(id)
        return ledstrip
    
    ledstrips = dm.get_devices_dict(type=c.DEVICE_TYPE_LEDSTRIP)
    for ledstrip in ledstrips:
        ledstrip["color"] = dm.get_ledstrip_color(ledstrip["id"])

    return ledstrips

################################################################################
#
#   @brief  Endpoint to get the sensors within the system.
#
################################################################################
@data_bp.route("/get_sensors", methods=["GET"])
@minimum_role_required()
def get_sensors():
    if request.args.get("id") != None:
        id = int(request.args.get("id"))
        return dm.get_device_dict(id=id)

    return dm.get_devices_dict(type=c.DEVICE_TYPE_RF_DEVICE)

################################################################################
#
#   @brief  Endpoint to receive unconfigured connected devices.
#
################################################################################
@data_bp.route("/get_unconfigured_devices", methods=["GET"])
@minimum_role_required()
def get_unconfigured_devices():
    return dm.get_unconfigured_devices()

################################################################################
#
#   @brief  Endpoint to receive network devices.
#
################################################################################
@data_bp.route("/get_network_devices", methods=["GET"])
@minimum_role_required()
def get_network_devices():
    return dm.get_network_devices(True, True)

################################################################################
#
#   @brief  Endpoint to receive network devices.
#
################################################################################
def _send_uncached_file(path):
    """Send mutable UI images without allowing browsers to reuse stale data."""
    response = send_file(path, conditional=False)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response