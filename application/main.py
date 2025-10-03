################################################################################
#
# File:     main.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Main server functionality for the ZyraX Home main controller.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import request, render_template                                      #Import Flask for webhosting
import configuration as c                                                       #Import application configuration variables
from logger import logi, logw, loge                                             #Import logging functions
from DeviceManager import DeviceManager                                         #Import device manager
import server_manager as sm
import os                                                                       #For file handling
from datetime import datetime                                                   #For checking timed automations
from apscheduler.schedulers.background import BackgroundScheduler               #For checking RF codes and timed automations
from threading import Thread                                                    #For threading

rf_timestamp = 0
last_rf_code = 0

last_automation_check_minute = 0
dm = DeviceManager()

#region Interval functionality
################################################################################
#
#   @brief  Interval function. Checks received RF codes and processes them.
#
################################################################################
def check_received_rf_codes():
    global rf_timestamp
    global last_rf_code
    
    if not c.RPI_RF_ENABLED:
        return
    
    if sm.rf_device is None:
        return
    
    if sm.rf_device.rx_code_timestamp == rf_timestamp:
        return
    
    #When same code, wait at least 5 seconds
    if last_rf_code == sm.rf_device.rx_code:
        if sm.rf_device.rx_code_timestamp - rf_timestamp < 5000000:
            return
    
    rf_timestamp = sm.rf_device.rx_code_timestamp                               #Save timestamp for debouncing
    last_rf_code = sm.rf_device.rx_code
    sm.last_received_rf_codes[rf_timestamp] = last_rf_code
    dm.process_rf_signal(sm.rf_device.rx_code)

################################################################################
#
#   @brief  Interval function. Checks the timed automations.
#
################################################################################
def check_time():
    global last_automation_check_minute
    if last_automation_check_minute == datetime.now().minute:
        return
    
    last_automation_check_minute = datetime.now().minute
    
    dm.check_timed_automations()
#endregion

#region Utilities
################################################################################
#
#   @brief  Makes sure to redirect to the application configuration page when no
#           configuration is present.
#
################################################################################
@sm.app.before_request
def application_configuration_page():
    return #TODO: add user setup
    if c.USER_PRESENT:
        return
    
    if request.path.startswith("/static"):
        return
    
    if request.path.startswith("/update_application_configuration"):
        return
    
    return render_template("application_configuration.html", title="Application configuration",
                            weather_api_key=c.WEATHER_API_KEY,
                            telegram_bot_token=c.TELEGRAM_BOT_TOKEN)
#endregion

################################################################################
#
#   @brief  Starts the program by running setup, starting interval
#           methods and starting the webserver.
#
################################################################################
if __name__ == "__main__":
    sm.register_blueprints(not c.USER_PRESENT)                                     #Register the HTTP routes

    sm.check_directories()
    sm.check_files()
    sm.check_credentials()
    c.load_configuration()
    c.load_credentials()
    sm.initialize_flask_application()
    sm.check_microservices()

    if not c.USER_PRESENT:
        logi("Application started in configuration mode")
    else:
        sm.check_database()
        
        sm.initialize_rf_receiver()

        dm.initialize()
        scheduler = BackgroundScheduler()
        scheduler.add_job(check_time, "interval", seconds=5)
        scheduler.add_job(check_received_rf_codes, "interval", seconds=0.5)
        
        scheduler.start()
        
        logi("Application started")

        if not c.PRODUCTION_MODE:
            logw("In development mode")
            
    sm.app.run(host="0.0.0.0", port=5000, debug=not c.PRODUCTION_MODE, threaded=True)