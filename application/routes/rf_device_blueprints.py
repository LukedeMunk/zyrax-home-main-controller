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