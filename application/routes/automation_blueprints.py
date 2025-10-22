################################################################################
#
# File:     automation_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for automation features.
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
automation_bp = Blueprint("automation_blueprints", __name__)

################################################################################
#
#   @brief  Adds an automation to the database.
#
################################################################################
@automation_bp.route("/add_automation", methods=["POST"])
def add_automation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json
    automation_dict = generate_automation_dict_from_request(request_data)
    result = dm.add_automation(automation_dict)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR)
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified automation.
#
################################################################################
@automation_bp.route("/update_automation", methods=["POST"])
def update_automation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    request_data = request.json
    automation_dict = generate_automation_dict_from_request(request_data)
    dm.update_automation(int(request_data.get("id")), automation_dict)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified automation from the database.
#
################################################################################
@automation_bp.route("/delete_automation", methods=["POST"])
def delete_automation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.delete_automation(id)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Enables or disables the specified automation.
#
################################################################################
@automation_bp.route("/set_automation_enabled", methods=["POST"])
def set_automation_enabled():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    enabled = int(request.form.get("enabled"))
    dm.set_automation_enabled(id, enabled)

    return generate_json_http_response(c.HTTP_CODE_OK)

#region Utilities
################################################################################
#
#   @brief  Generates an automation configuration dictionary, based on the
#           automation type.
#   @param  request_data        Data of the HTTP request
#   @return dict                Automation dictionary
#
################################################################################
def generate_automation_dict_from_request(request_data):
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    automation_dict = {
                    "name": request_data.get("name"),
                    "target_device_ids": request_data.get("target_device_ids"),
                    "action": request_data.get("action"),
                    "trigger": int(request_data.get("trigger")),
                    "inverted_automation_copy_id": int(request_data.get("inverted_automation_copy_id"))
                }

    if automation_dict["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
        automation_dict["days"] = request_data.get("days")
        automation_dict["time"] = request_data.get("time")

        if automation_dict["inverted_automation_copy_id"] != -1:
            automation_dict["inverted_action_time"] = request_data.get("inverted_action_time")

    if automation_dict["trigger"] == c.AUTOMATION_TRIGGER_SENSOR:
        automation_dict["time_window_activated"] = int(request_data.get("time_window_activated"))
        automation_dict["activate_during_time_window"] = int(request_data.get("activate_during_time_window"))

        if automation_dict["time_window_activated"] == 1:
            automation_dict["time_window_start_minutes"] = int(request_data.get("time_window_start_minutes"))
            automation_dict["time_window_end_minutes"] = int(request_data.get("time_window_end_minutes"))

        automation_dict["trigger_device_ids"] = request_data.get("trigger_device_ids")
        automation_dict["trigger_state"] = int(request_data.get("trigger_state"))
        automation_dict["delay_minutes"] = int(request_data.get("delay_minutes"))

        if automation_dict["inverted_automation_copy_id"] != -1:
            automation_dict["inverted_delay_minutes"] = int(request_data.get("inverted_delay_minutes"))

    if automation_dict["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
        automation_dict["trigger_device_ids"] = request_data.get("trigger_device_ids")
        automation_dict["trigger_state"] = int(request_data.get("trigger_state"))
        automation_dict["delay_minutes"] = int(request_data.get("delay_minutes"))

        if automation_dict["inverted_automation_copy_id"] != -1:
            automation_dict["inverted_delay_minutes"] = int(request_data.get("inverted_delay_minutes"))
        
    if "parameters" in request_data:
        automation_dict["parameters"] = []
        for parameter in request_data["parameters"]:
            automation_dict["parameters"].append(parameter)

    return automation_dict
#endregion