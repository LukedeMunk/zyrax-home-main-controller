################################################################################
#
# File:     system_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints for endpoints requested by system nodes.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request                                            #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
from server_manager import generate_json_http_response
from logger import logi, logw, loge                                             #Import logging functions
from urllib.parse import urlparse, parse_qs                                     #For parsing HTTP requests done by ESP32 controllers

dm = DeviceManager()
system_bp = Blueprint("system_blueprints", __name__)

################################################################################
#
#   @brief  TEMP FUNCTION TO SIMULATE RF CODES
#
################################################################################
@system_bp.route("/rf", methods=["GET"])
def rf():
    code = int(request.args.get("code"))
    dm.process_rf_signal(code)
    return generate_json_http_response(c.HTTP_CODE_OK)\


################################################################################
#
#   @brief  Used in UI to check the connection with the server.
#
################################################################################
@system_bp.route("/check_connection", methods=["GET"])
def check_connection():
    return generate_json_http_response(c.HTTP_CODE_OK)
    
################################################################################
#
#   @brief  Requested by ESP controllers. When a controller is configured, it
#           synchronizes the controller. Else the controller will be added to
#           the unconfigured devices.
#
################################################################################
@system_bp.route("/ledstrip_request_connection", methods=["POST"])
def ledstrip_request_connection():
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    hostname = parsed_params[b"hostname"][0].decode()
    ledstrip = dm.get_ledstrip_by_hostname(hostname)

    if ledstrip is None:
        dm.add_unconfigured_device_to_list(request.remote_addr, hostname)
        logi("Ledstrip requested connection, but is not found")
        return generate_json_http_response(c.HTTP_CODE_OK)
    
    dm.synchronize_ledstrip(ledstrip.id)
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the sensor state of
#           the ledstrip.
#
################################################################################
@system_bp.route("/set_ledstrip_sensor_state", methods=["POST"])
def set_ledstrip_sensor_state():
    ledstrip = dm.get_ledstrip_by_ip(request.remote_addr)

    if ledstrip is None:
        loge("Ledstrip sensor state not changed, ledstirp not found")
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST)
    
    logi("Ledstrip sensor state changed")
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    state = int(parsed_params[b"state"][0].decode())
    
    dm.set_ledstrip_sensor_state(ledstrip.id, state)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the OTA state of the
#           ledstrip.
#
################################################################################
@system_bp.route("/set_ota_state", methods=["POST"])
def set_ota_state():
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    id = int(parsed_params[b"id"][0].decode())
    state = int(parsed_params[b"state"][0].decode())
    dm.set_ledstrip_ota_state(id, state)

    return generate_json_http_response(c.HTTP_CODE_OK)