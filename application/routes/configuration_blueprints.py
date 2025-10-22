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
from server_manager import generate_json_http_response
import json                                                                     #For JSON handling
import os                                                                       #For file handling
from WeatherServiceClient import WeatherServiceClient
from TelegramServiceClient import TelegramServiceClient
from threading import Timer
import keyring

configuration_bp = Blueprint("configuration_blueprints", __name__)

weather_client = WeatherServiceClient()
telegram_client = TelegramServiceClient()

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_rpi_rf_module", methods=["POST"])
def update_rpi_rf_module():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    with open(c.CONFIGURATION_FILE_PATH, "r") as file:
        configuration = json.load(file)

    configuration["RPI_RF_ENABLED"] = int(request.form.get("rpi_rf_receiver_enabled"))

    if configuration["RPI_RF_ENABLED"] == 1 and not c.PRODUCTION_MODE:
        loge("Cannot enable RF device. Not currently available for Windows")
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Cannot enable RF device. Not currently available for Windows")
        
    with open(c.CONFIGURATION_FILE_PATH, "w") as file:
        json.dump(configuration, file, indent=4)
    
    if configuration["RPI_RF_ENABLED"] == 1:
        logi("Enabled RF device. Restarting")
        @after_this_request
        def shutdown(response):
            Timer(0.1, lambda: os._exit(0)).start()
            return response

    c.load_configuration()

    return generate_json_http_response(c.HTTP_CODE_OK, "Enabled RF device. Restarting")

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_weather_configuration", methods=["POST"])
def update_weather_configuration():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    with open(c.CONFIGURATION_FILE_PATH, "r") as file:
        configuration = json.load(file)

    weather_location_changed = False

    if "weather_service_enabled" in request.form:
        configuration["WEATHER_SERVICE_ENABLED"] = int(request.form.get("weather_service_enabled"))

    if "weather_api_key" in request.form:
        keyring.set_password(c.APPLICATION_NAME, c.WEATHER_API_KEY_NAME, request.form.get("weather_api_key"))
        c.load_credentials()
        result = weather_client.reload_api_key()
        if not result[0]:
            return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])

    if "weather_location" in request.form:
        configuration["WEATHER_LOCATION"] = request.form.get("weather_location")
        weather_location_changed = True

    with open(c.CONFIGURATION_FILE_PATH, "w") as file:
        json.dump(configuration, file, indent=4)
    
    c.load_configuration()

    if weather_location_changed:
        result = weather_client.set_location()
        if result[0]:
            configuration["WEATHER_LOCATION"] = result[1]["detail"]
        else:
            logi("Configuration not updated")
            return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
        logi("Configuration updated")

        with open(c.CONFIGURATION_FILE_PATH, "w") as file:
            json.dump(configuration, file, indent=4)

        c.load_configuration()

    return generate_json_http_response(c.HTTP_CODE_OK, {"weather_location" : configuration["WEATHER_LOCATION"]})

################################################################################
#
#   @brief  Updates the application configuration.
#
################################################################################
@configuration_bp.route("/update_telegram_configuration", methods=["POST"])
def update_telegram_configuration():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    with open(c.CONFIGURATION_FILE_PATH, "r") as file:
        configuration = json.load(file)

    configuration["TELEGRAM_SERVICE_ENABLED"] = int(request.form.get("telegram_service_enabled"))
    keyring.set_password(c.APPLICATION_NAME, c.TELEGRAM_BOT_TOKEN_NAME, request.form.get("telegram_bot_token"))

    with open(c.CONFIGURATION_FILE_PATH, "w") as file:
        json.dump(configuration, file, indent=4)

    c.load_configuration()

    if not telegram_client.reload_configuration()[0]:
        loge("Bot token updated, but Telegram service unavailable")
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"telegram_state" : telegram_client.get_service_state()})

################################################################################
#
#   @brief  Resets the application configuration file.
#
################################################################################
@configuration_bp.route("/reset_configuration", methods=["POST"])
def reset_configuration():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    if os.path.exists(c.CONFIGURATION_FILE_PATH):
        os.remove(c.CONFIGURATION_FILE_PATH)
        logw("Configuration file resetted")

    
    
    #keyring.delete_password(c.APPLICATION_NAME, c.WEATHER_API_KEY_NAME)
    #keyring.delete_password(c.APPLICATION_NAME, c.TELEGRAM_BOT_TOKEN_NAME)
    #keyring.delete_password(c.APPLICATION_NAME, c.TELEGRAM_CHAT_ID_NAME)
    #keyring.delete_password(c.APPLICATION_NAME, c.FLASK_ENCRYPTION_KEY_NAME)
    #keyring.delete_password(c.APPLICATION_NAME, c.MICROSERVICE_KEY_NAME)
        
    @after_this_request
    def shutdown(response):
        Timer(0.1, lambda: os._exit(0)).start()
        return response
    
    return generate_json_http_response(c.HTTP_CODE_OK)