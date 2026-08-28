################################################################################
#
# File:     logs_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for logging features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, session                                            #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager

from logger import logi, logw, loge, get_logs, reset_logs                       #Import logging functions
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
logs_bp = Blueprint("logs_blueprints", __name__)

################################################################################
#
#   @brief  Marks logs as read and deletes them.
#
################################################################################
@logs_bp.route("/mark_logs_read", methods=["POST"])
@minimum_role_required()
def mark_logs_read():
    reset_logs()

    return generate_json_http_response(c.HTTP_CODE_OK)