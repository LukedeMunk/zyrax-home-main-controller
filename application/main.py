################################################################################
#
# File:     main.py
# Version:  0.9.0
# Author:   Luke de Munk
#
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
from apscheduler.schedulers.background import BackgroundScheduler               #For checking RF codes and timed automations
import database_utility as db_util                                              #Import utility for database functionality
from routes.template_blueprints import initial_setup

from threading import Thread                                                    #For threading
import os                                                                       #For file handling

rf_timestamp = 0
rf_code_timestamps = {}
dm = DeviceManager()

#region Interval functionality
################################################################################
#
#   @brief  Interval function. Checks received RF codes and processes them.
#
################################################################################
def check_received_rf_codes():
    global rf_timestamp
    global rf_code_timestamps
    
    if not c.dynamic_config.rpi_rf_enabled:
        return
    
    if sm.rf_device is None:
        return
    
    if sm.rf_device.rx_code_timestamp == rf_timestamp:
        return
    
    last_code_timestamp = rf_code_timestamps.get(sm.rf_device.rx_code, 0)
    if sm.rf_device.rx_code_timestamp - last_code_timestamp < 250000:
        return                                                                  #Debounce code for 250ms

    rf_timestamp = sm.rf_device.rx_code_timestamp                               #Save timestamp for debouncing
    rf_code_timestamps[sm.rf_device.rx_code] = rf_timestamp
    sm.last_received_rf_codes[rf_timestamp] = sm.rf_device.rx_code
    dm.process_rf_signal(sm.rf_device.rx_code)

################################################################################
#
#   @brief  Interval function. Checks the timed automations.
#
################################################################################
def check_time():
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
def before_http_requests():
    if len(db_util.get_accounts()) > 0:
        return
    
    if request.path.startswith("/static"):
        return
    
    if request.path.startswith("/add_account"):
        return
    
    if request.path.startswith("/get_default_profile_picture"):
        return
    
    return initial_setup()
#endregion

################################################################################
#
#   @brief  Starts the program by running setup, starting interval
#           methods and starting the webserver.
#
################################################################################
if __name__ == "__main__":
    sm.check_directories()
    sm.check_files()
    sm.initialize_flask_application()
    sm.check_microservices()
    sm.check_database()
    sm.register_blueprints()                                                    #Register the HTTP routes

    with sm.app.app_context():
        accounts_in_database = len(db_util.get_accounts())
        
    configuration_mode = accounts_in_database == 0

    if len(db_util.get_devices()) == 0:
        from populate_db import *
        with sm.app.app_context():
            populate_database()
        logi("Populated database, restarting now")
        exit(0)

    if configuration_mode:
        logi(c.TEXT_SERVER_STARTED_IN_CONFIGURATION_MODE)
    else:
        sm.initialize_rf_receiver()

        dm.initialize()
        scheduler = BackgroundScheduler()
        scheduler.add_job(check_time, "interval", seconds=5)
        scheduler.add_job(check_received_rf_codes, "interval", seconds=0.5)
        
        scheduler.start()
        
        logi(c.TEXT_SERVER_STARTED)

        if not c.PRODUCTION_MODE:
            logw(c.TEXT_SERVER_STARTED_IN_DEVELOPMENT_MODE)
            
    sm.app.run(host="0.0.0.0", port=5000, debug=not c.PRODUCTION_MODE, threaded=True)
