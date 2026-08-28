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
from logger import logi, logw, loge                                             #Import logging functions
import database_utility as db_util                                              #Import utility for database functionality
from automation import Event, EventType

from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

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
    
    response = {
        "id": result[1],
        "automations": dm.get_automations()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

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

    result = dm.update_automation(int(request_data.get("id")), automation_dict)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    response = {
        "automations": dm.get_automations()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

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
    
    result = dm.delete_automation(id)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

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
    
    result = dm.set_automation_enabled(id, enabled)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Manually runs the specified automation through the run service.
#
################################################################################
@automation_bp.route("/run_automation", methods=["POST"])
def run_automation():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    request_data = request.get_json(silent=True) or request.form
    try:
        automation_id = int(request_data.get("id"))
    except (TypeError, ValueError):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST,
            "UI_TEXT_INVALID_AUTOMATION_ID"
        )

    source = request_data.get("source", "manual")
    if source not in ["manual", "dashboard", "api"]:
        source = "manual"
    event = Event(
        event_type=EventType.MANUAL_AUTOMATION_RUN,
        source_type="account",
        source_id=session["account_id"],
        payload={"automation_id": automation_id, "source": source}
    )
    dm.automation_run_service.record_event(event)
    result = dm.automation_run_service.run_by_id(
        automation_id,
        event=event,
        source=source
    )

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    run = db_util.get_automation_run(result[1])
    return generate_json_http_response(c.HTTP_CODE_OK, {
        "run_id": result[1],
        "status": run["status"],
        "error": run.get("error")
    })

################################################################################
#
#   @brief  Returns recent automation execution history.
#
################################################################################
@automation_bp.route("/get_automation_runs", methods=["GET"])
def get_automation_runs():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    automation_id = request.args.get("automation_id")
    try:
        limit = min(max(int(request.args.get("limit", 100)), 1), 500)
    except (TypeError, ValueError):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST,
            "UI_TEXT_INVALID_LIMIT"
        )

    if automation_id is not None:
        try:
            automation_id = int(automation_id)
        except (TypeError, ValueError):
            return generate_json_http_response(
                c.HTTP_CODE_BAD_REQUEST,
                "UI_TEXT_INVALID_AUTOMATION_ID"
            )

    return generate_json_http_response(
        c.HTTP_CODE_OK,
        {"runs": db_util.get_automation_runs(automation_id, limit)}
    )

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
    if "triggers" in request_data and "actions" in request_data:
        first_action = request_data["actions"][0]
        has_time_trigger = any(
            trigger["type"] == EventType.TIME
            for trigger in request_data["triggers"]
        )
        legacy_trigger = (
            c.AUTOMATION_TRIGGER_TIMER if has_time_trigger else
            c.AUTOMATION_TRIGGER_SWITCH
        )
        first_trigger_configuration = request_data["triggers"][0].get(
            "configuration", {}
        )
        automation_dict = {
            "name": request_data.get("name"),
            "enabled": bool(request_data.get("enabled", True)),
            "trigger": int(request_data.get("trigger", legacy_trigger)),
            "action": first_action["type"],
            "target_device_ids": first_action.get(
                "configuration", {}
            ).get("target_device_ids", []),
            "parameters": first_action.get(
                "configuration", {}
            ).get("parameters", []),
            "triggers": request_data["triggers"],
            "conditions": request_data.get("conditions", []),
            "actions": request_data["actions"],
            "inverted_automation_copy_id": -1,
            "concurrency_policy": request_data.get(
                "concurrency_policy",
                c.AUTOMATION_CONCURRENCY_RESTART
            ),
            "error_policy": request_data.get(
                "error_policy",
                c.AUTOMATION_ERROR_STOP
            ),
            "delay_minutes": int(request_data.get("delay_minutes", 0)),
            "time_window_activated": False,
            "activate_during_time_window": True,
            "trigger_device_ids": first_trigger_configuration.get(
                "source_ids", []
            ),
            "trigger_state": first_trigger_configuration.get("state", 1),
            "days": first_trigger_configuration.get("days", []),
            "time": first_trigger_configuration.get("time", "00:00")
        }
        return automation_dict

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

    if automation_dict["trigger"] in [
            c.AUTOMATION_TRIGGER_DOOR_SENSOR,
            c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
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
