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

from logger import logi, logw, loge                                             #Import logging functions
import ast                                                                      #For parsing JSON within HTTP parameters
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
group_bp = Blueprint("group_blueprints", __name__)

################################################################################
#
#   @brief  Adds a group to the database.
#
################################################################################
@group_bp.route("/add_group", methods=["POST"])
@minimum_role_required()
def add_group():
    request_data = request.json

    config = {
        "name" : request_data.get("name"),
        "icon" : request_data.get("icon"),
        "type" : int(request_data.get("type")),
        "device_ids" : request_data.get("device_ids")
    }
    
    result = dm.add_group(config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    response = {
        "id": result[1],
        "groups": dm.get_groups()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

################################################################################
#
#   @brief  Updates the specified group.
#
################################################################################
@group_bp.route("/update_group", methods=["POST"])
@minimum_role_required()
def update_group():
    id = int(request.json.get("id"))

    config = {}

    if "name" in request.json:
        config["name"] = request.json.get("name")
    if "icon" in request.json:
        config["icon"] = request.json.get("icon")
    if "type" in request.json:
        config["type"] = int(request.json.get("type"))
    if "device_ids" in request.json:
        config["device_ids"] = request.json.get("device_ids")

    result = dm.update_group(id, config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    response = {
        "groups": dm.get_groups()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

################################################################################
#
#   @brief  Deletes the specified group from the database.
#
################################################################################
@group_bp.route("/delete_group", methods=["POST"])
@minimum_role_required()
def delete_group():
    id = int(request.form.get("id"))

    result = dm.delete_group(id)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    return generate_json_http_response(c.HTTP_CODE_OK)