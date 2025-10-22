################################################################################
#
# File:     group_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for group features.
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
import ast                                                                      #For parsing JSON within HTTP parameters

dm = DeviceManager()
group_bp = Blueprint("group_blueprints", __name__)

################################################################################
#
#   @brief  Adds a group to the database.
#
################################################################################
@group_bp.route("/add_group", methods=["POST"])
def add_group():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    config = {
        "name" : request.form.get("name"),
        "icon" : request.form.get("icon"),
        "type" : int(request.form.get("type")),
        "device_ids" : ast.literal_eval(request.form.get("device_ids"))
    }
    
    id = dm.add_group(config)
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": id})

################################################################################
#
#   @brief  Updates the specified group.
#
################################################################################
@group_bp.route("/update_group", methods=["POST"])
def update_group():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))

    config = {}

    if "name" in request.form:
        config["name"] = request.form.get("name")
    if "icon" in request.form:
        config["icon"] = request.form.get("icon")
    if "type" in request.form:
        config["type"] = int(request.form.get("type"))
    if "device_ids" in request.form:
        config["device_ids"] = ast.literal_eval(request.form.get("device_ids"))

    dm.update_group(id, config)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified group from the database.
#
################################################################################
@group_bp.route("/delete_group", methods=["POST"])
def delete_group():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.delete_group(id)

    return generate_json_http_response(c.HTTP_CODE_OK)