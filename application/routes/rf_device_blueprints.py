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
from server_manager import generate_json_http_response
from logger import logi, logw, loge                                             #Import logging functions
import ast                                                                      #For parsing JSON within HTTP parameters

dm = DeviceManager()
rf_device_bp = Blueprint("rf_device_blueprints", __name__)

################################################################################
#
#   @brief  Adds a RF device to the database.
#
################################################################################
@rf_device_bp.route("/add_rf_device", methods=["POST"])
def add_rf_device():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
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

    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified RF device.
#
################################################################################
@rf_device_bp.route("/update_rf_device", methods=["POST"])
def update_rf_device():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))

    config = {}

    if "name" in request.form:
        config["name"] = request.form.get("name")
    if "model_id" in request.form:
        config["model_id"] = request.form.get("model_id")
    if "icon" in request.form:
        config["icon"] = request.form.get("icon")
    if "icon_low_state" in request.form:
        config["icon_low_state"] = request.form.get("icon_low_state")
    if "rf_codes" in request.form:
        config["rf_codes"] = ast.literal_eval(request.form.get("rf_codes"))

    dm.update_device(id, config)
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified RF device from the database.
#
################################################################################
@rf_device_bp.route("/delete_rf_device", methods=["POST"])
def delete_rf_device():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))
    dm.delete_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)