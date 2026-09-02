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
from flask import Blueprint, request, session
import configuration as c
from DeviceManager import DeviceManager
import database_utility as db_util
from automation import Event, EventType

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
    if not is_valid_automation_request(request_data):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST,
            "UI_TEXT_INVALID_AUTOMATION_CONFIGURATION"
        )
    
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
    if not is_valid_automation_request(request_data):
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST,
            "UI_TEXT_INVALID_AUTOMATION_CONFIGURATION"
        )
    
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

    result = dm.automation_run_service.run_by_id(automation_id, event=event, source=source)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    run = db_util.get_automation_run(result[1])

    data = {
        "run_id": result[1],
        "status": run["status"],
        "error": run.get("error")
    }
    return generate_json_http_response(c.HTTP_CODE_OK, data)

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
    return {
        "name": request_data.get("name"),
        "enabled": bool(request_data.get("enabled", True)),
        "trigger_match": request_data.get("trigger_match", "any"),
        "concurrency_policy": request_data.get(
            "concurrency_policy",
            c.AUTOMATION_CONCURRENCY_RESTART
        ),
        "error_policy": request_data.get(
            "error_policy",
            c.AUTOMATION_ERROR_STOP
        ),
        "triggers": request_data.get("triggers", []),
        "conditions": request_data.get("conditions", []),
        "actions": request_data.get("actions", [])
    }

################################################################################
#
#   @brief  Checks whether an automation request contains a valid definition.
#   @param  request_data   Automation request dictionary
#   @return                Whether the request is valid
#
################################################################################
def is_valid_automation_request(request_data):
    if not isinstance(request_data, dict):
        return False
    if not str(request_data.get("name", "")).strip():
        return False
    if request_data.get("trigger_match", "any") not in ["any", "all"]:
        return False
    if request_data.get("concurrency_policy", "restart") not in ["restart", "single", "parallel"]:
        return False
    if request_data.get("error_policy", "stop") not in ["stop", "continue"]:
        return False
    
    triggers = request_data.get("triggers")
    actions = request_data.get("actions")

    if not isinstance(triggers, list) or not triggers:
        return False
    if not isinstance(actions, list) or not actions:
        return False
    if not all(isinstance(item, dict) and item.get("type") for item in triggers):
        return False
    if not all(isinstance(item, dict) and item.get("type") for item in actions):
        return False
    
    return True
#endregion
