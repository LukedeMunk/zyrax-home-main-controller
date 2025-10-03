################################################################################
#
# File:     dashboard_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for dashboard features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request                                            #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
import database_utility as db_util                                              #Import utility for database functionality
from server_manager import generate_json_http_response
from logger import logi, logw, loge                                             #Import logging functions

dm = DeviceManager()
dashboard_bp = Blueprint("dashboard_blueprints", __name__)

################################################################################
#
#   @brief  Adds a dashboard configuration to the database.
#
################################################################################
@dashboard_bp.route("/add_dashboard_configuration", methods=["POST"])
def add_dashboard_configuration():
    config = {
        "name" : request.form.get("name"),
        "icon" : request.form.get("icon")
    }

    result = db_util.add_dashboard_configuration(config)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR)
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified dashboard configuration
#
################################################################################
@dashboard_bp.route("/update_dashboard_configuration", methods=["POST"])
def update_dashboard_configuration():
    id = int(request.form.get("id"))
    config = {
        "name" : request.form.get("name"),
        "icon" : request.form.get("icon")
    }

    db_util.update_dashboard_configuration(id, config)
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified dashboard configuration from the database.
#
################################################################################
@dashboard_bp.route("/delete_dashboard_configuration", methods=["POST"])
def delete_dashboard_configuration():
    id = int(request.form.get("id"))
    
    db_util.delete_dashboard_configuration(id)
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Adds a tile to the specified dashboard configuration.
#
################################################################################
@dashboard_bp.route("/add_dashboard_tile", methods=["POST"])
def add_dashboard_tile():
    config = {
        "configuration_id" : int(request.form.get("configuration_id")),
        "index" : int(request.form.get("index")),
        "type" : int(request.form.get("type")),
        "size" : int(request.form.get("size"))
    }

    if config["type"] == c.TILE_TYPE_DEVICE:
        config["device_id"] = int(request.form.get("device_id"))
    elif config["type"] == c.TILE_TYPE_GROUP:
        config["group_id"] = int(request.form.get("group_id"))

    result = db_util.add_dashboard_tile(config)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR)
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Updates the specified tile of the specified dashboard configuration.
#
################################################################################
@dashboard_bp.route("/update_dashboard_tile", methods=["POST"])
def update_dashboard_tile():
    id = int(request.form.get("id"))

    config = {}
    if "index" in request.form:
        config["index"] = int(request.form.get("index"))
    if "size" in request.form:
        config["size"] = int(request.form.get("size"))

    db_util.update_dashboard_tile(id, config)
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Deletes the specified tile from the specified dashboard
#           configuration.
#
################################################################################
@dashboard_bp.route("/delete_dashboard_tile", methods=["POST"])
def delete_dashboard_tile():
    id = int(request.form.get("id"))

    db_util.delete_dashboard_tile(id)
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Resets the dashboard tile order of the specified dashboard
#           configuration.
#
################################################################################
@dashboard_bp.route("/reset_dashboard_tile_order", methods=["POST"])
def reset_dashboard_tile_order():
    id = int(request.form.get("id"))

    db_util.reset_dashboard_tile_order(id)
    
    return generate_json_http_response(c.HTTP_CODE_OK)