################################################################################
#
# File:     rf_device_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for rf_device features.
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
rf_device_bp = Blueprint("rf_device_blueprints", __name__)

################################################################################
#
#   @brief  Adds a RF device to the database.
#
################################################################################
@rf_device_bp.route("/add_rf_device", methods=["POST"])
@minimum_role_required()
def add_rf_device():
    config = {
        "name" : request.form.get("name"),
        "model_id" : int(request.form.get("model_id")),
        "icon": request.form.get("icon"),
        "rf_codes" : ast.literal_eval(request.form.get("rf_codes"))
    }

    if "icon_low_state" in request.form:
        config["icon_low_state"] = request.form.get("icon_low_state")
    
    result = dm.add_rf_device(config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    response = {
        "id": result[1],
        "devices": dm.get_devices_dict()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

################################################################################
#
#   @brief  Updates the specified RF device.
#
################################################################################
@rf_device_bp.route("/update_rf_device", methods=["POST"])
@minimum_role_required()
def update_rf_device():
    id = int(request.json.get("id"))

    config = {}

    if "name" in request.json:
        config["name"] = request.json.get("name")
    if "model_id" in request.json:
        config["model_id"] = request.json.get("model_id")
    if "icon" in request.json:
        config["icon"] = request.json.get("icon")
    if "icon_low_state" in request.json:
        config["icon_low_state"] = request.json.get("icon_low_state")
    if "rf_codes" in request.json:
        config["rf_codes"] = request.json.get("rf_codes")

    result = dm.update_device(id, config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    response = {
        "devices": dm.get_devices_dict()
    }
    return generate_json_http_response(c.HTTP_CODE_OK, response)

################################################################################
#
#   @brief  Deletes the specified RF device from the database.
#
################################################################################
@rf_device_bp.route("/delete_rf_device", methods=["POST"])
@minimum_role_required()
def delete_rf_device():
    id = int(request.form.get("id"))
    dm.delete_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)