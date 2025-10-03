################################################################################
#
# File:     alarm_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for alarm features.
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

dm = DeviceManager()
alarm_bp = Blueprint("alarm_blueprints", __name__)

################################################################################
#
#   @brief  Updates the alarm.
#
################################################################################
@alarm_bp.route("/update_alarm", methods=["POST"])
def update_alarm():
    alarm_dict = {}

    if "activated" in request.form:
        alarm_dict["activated"] = int(request.form.get("activated"))

    if "automatically_armed" in request.form:
        alarm_dict["automatically_armed"] = int(request.form.get("automatically_armed"))

    if "armed" in request.form:
        alarm_dict["armed"] = int(request.form.get("armed"))

    dm.update_alarm(alarm_dict)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Adds a deactivation device to the alarm.
#
################################################################################
@alarm_bp.route("/add_deactivation_device", methods=["POST"])
def add_deactivation_device():
    alarm_dict = {
        "name": request.form.get("name"),
        "ip_address": request.form.get("ip_address")
    }
    
    result = dm.add_alarm_deactivation_device(alarm_dict)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR, result[1])
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified alarm deactivation device.
#
################################################################################
@alarm_bp.route("/update_deactivation_device", methods=["POST"])
def update_deactivation_device():
    id = int(request.form.get("id"))

    alarm_dict = {
        "name": request.form.get("name"),
        "ip_address": request.form.get("ip_address")
    }
    
    result = dm.update_alarm_deactivation_device(id, alarm_dict)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified alarm deactivation device.
#
################################################################################
@alarm_bp.route("/delete_deactivation_device", methods=["POST"])
def delete_deactivation_device():
    id = int(request.form.get("id"))

    dm.delete_alarm_deactivation_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Adds the specified trigger device to the alarm.
#
################################################################################
@alarm_bp.route("/add_alarm_trigger_device", methods=["POST"])
def add_alarm_trigger_device():
    id = int(request.form.get("id"))

    dm.add_alarm_trigger_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified alarm trigger device.
#
################################################################################
@alarm_bp.route("/delete_alarm_trigger_device", methods=["POST"])
def delete_alarm_trigger_device():
    id = int(request.form.get("id"))

    dm.delete_alarm_trigger_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)