################################################################################
#
# File:     user_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for user features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, render_template, after_this_request       #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from logger import logi, logw, loge                                             #Import logging functions
from server_manager import generate_json_http_response
import json                                                                     #For JSON handling
import os                                                                       #For file handling
import keyring
from cryptography.fernet import Fernet

user_bp = Blueprint("user_blueprints", __name__)

    
################################################################################
#
#   @brief  Loads the application configuration page.
#
################################################################################
@user_bp.route("/first_user", methods=["GET"])
def first_user():
    return render_template("user_configuration.html", title="Create user")