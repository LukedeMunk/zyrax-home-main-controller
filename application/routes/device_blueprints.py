################################################################################
#
# File:     device_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for device features.
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
device_bp = Blueprint("device_blueprints", __name__)

################################################################################
#
#   @brief  Updates the power of the specified device.
#
################################################################################
@device_bp.route("/set_device_power", methods=["POST"])
def set_device_power():
    id = int(request.form.get("id"))
    power = int(request.form.get("power"))
    dm.set_device_power(id, power)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Updates the power of the specifed group.
#
################################################################################
@device_bp.route("/set_group_power", methods=["POST"])
def set_group_power():
    id = int(request.form.get("id"))
    power = int(request.form.get("power"))

    dm.set_device_group_power(id, power)

    return generate_json_http_response(c.HTTP_CODE_OK)