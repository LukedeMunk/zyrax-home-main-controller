################################################################################
#
# File:     sensor_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for sensor features.
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
import ast                                                                      #For parsing JSON within HTTP parameters

dm = DeviceManager()
sensor_bp = Blueprint("sensor_blueprints", __name__)

################################################################################
#
#   @brief  Adds a sensor to the database.
#
################################################################################
@sensor_bp.route("/add_sensor", methods=["POST"])
def add_sensor():
    config = {
        "name" : request.form.get("name"),
        "model" : int(request.form.get("model")),
        "sensor_type" : int(request.form.get("sensor_type")),
        "icon": request.form.get("icon"),
        "icon_low_state": request.form.get("icon_low_state"),
        "rf_codes" : ast.literal_eval(request.form.get("rf_codes"))
    }
    
    result = dm.add_sensor(config)
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified sensor.
#
################################################################################
@sensor_bp.route("/update_sensor", methods=["POST"])
def update_sensor():
    id = int(request.form.get("id"))

    config = {}

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
#   @brief  Deletes the specified sensor from the database.
#
################################################################################
@sensor_bp.route("/delete_sensor", methods=["POST"])
def delete_sensor():
    id = int(request.form.get("id"))
    dm.delete_device(id)

    return generate_json_http_response(c.HTTP_CODE_OK)