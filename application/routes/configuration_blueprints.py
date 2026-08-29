################################################################################
#
# File:     configuration_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for application configuration features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, after_this_request, session               #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from logger import logi, logw, loge                                             #Import logging functions

import json                                                                     #For JSON handling
import os                                                                       #For file handling
from WeatherServiceClient import WeatherServiceClient
from TelegramServiceClient import TelegramServiceClient
from threading import Timer
import keyring

from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

configuration_bp = Blueprint("configuration_blueprints", __name__)

weather_client = WeatherServiceClient()
telegram_client = TelegramServiceClient()

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_rpi_rf_module", methods=["POST"])
@minimum_role_required()
def update_rpi_rf_module():
    requested_value = request.form.get("rpi_rf_receiver_enabled")

    if requested_value not in ("0", "1"):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid Raspberry Pi RF receiver setting")

    rpi_rf_enabled = requested_value == "1"

    if rpi_rf_enabled and not c.PRODUCTION_MODE:
        loge("Cannot enable RF device. Not currently available for Windows")
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Cannot enable RF device. Not currently available for Windows")

    c.dynamic_config.rpi_rf_enabled = rpi_rf_enabled
    c.RF_RECEIVER_PRESENT = (rpi_rf_enabled or c.RF_TRANSMITTER_PRESENT)

    if rpi_rf_enabled:
        logi("Enabled RF device. Restarting")
        @after_this_request
        def shutdown(response):
            Timer(0.1, lambda: os._exit(0)).start()
            return response

        message = "Enabled RF device. Restarting"
    else:
        logi("Disabled RF device")
        message = "Disabled RF device"

    return generate_json_http_response(c.HTTP_CODE_OK, message)

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_weather_configuration", methods=["POST"])
@minimum_role_required()
def update_weather_configuration():
    weather_location_changed = False

    if "weather_service_enabled" in request.form:
        c.dynamic_config.weather_service_enabled = int(request.form.get("weather_service_enabled"))

    if "weather_api_key" in request.form:
        c.dynamic_config.weather_api_key = request.form.get("weather_api_key")
        result = weather_client.reload_api_key()
        if not result[0]:
            return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    if "weather_location" in request.form:
        c.dynamic_config.weather_location = request.form.get("weather_location")
        weather_location_changed = True

    if weather_location_changed:
        result = weather_client.set_location()
        if result[0]:
            c.dynamic_config.weather_location = result[1]["detail"]
            logi("Weather location updated to [" + c.dynamic_config.weather_location + "]")
        else:
            logi("Weather location not updated, [" + result[1] + "]")
            return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    

    return generate_json_http_response(c.HTTP_CODE_OK, {"weather_location" : c.dynamic_config.weather_location})

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_telegram_configuration", methods=["POST"])
@minimum_role_required()
def update_telegram_configuration():    
    c.dynamic_config.telegram_service_enabled = int(request.form.get("telegram_service_enabled"))
    c.dynamic_config.telegram_bot_token = request.form.get("telegram_bot_token")

    if not telegram_client.reload_configuration()[0]:
        loge("Bot token updated, but Telegram service unavailable")
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"telegram_state" : telegram_client.get_service_state()})

################################################################################
#
#   @brief  Resets the application configuration file.
#
################################################################################
@configuration_bp.route("/reset_configuration", methods=["POST"])
@minimum_role_required()
def reset_configuration():    
    c.dynamic_config.reset()
        
    @after_this_request
    def shutdown(response):
        Timer(0.1, lambda: os._exit(0)).start()
        return response
    
    return generate_json_http_response(c.HTTP_CODE_OK)
