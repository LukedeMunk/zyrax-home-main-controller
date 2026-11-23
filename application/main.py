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
from werkzeug.middleware.proxy_fix import ProxyFix

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

    received_timestamp = sm.rf_device.rx_code_timestamp
    received_code = sm.rf_device.rx_code

    # The RF receiver has no timestamp or code until the first signal arrives.
    if received_timestamp is None or received_code is None:
        return
    
    if received_timestamp == rf_timestamp:
        return
    
    rf_timestamp = received_timestamp
    last_code_timestamp = rf_code_timestamps.get(received_code)
    if last_code_timestamp is not None and received_timestamp - last_code_timestamp < 250000:
        logi(f"[RF] Debounced code={received_code} timestamp_us={received_timestamp}")
        return                                                                  #Debounce code for 250ms

    rf_code_timestamps[received_code] = received_timestamp
    sm.last_received_rf_codes[received_timestamp] = received_code
    dm.process_rf_signal(received_code, source_id="rpi")

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
    
    if request.path.startswith(c.API_URL_ADD_ACCOUNT):
        return
    
    if request.path.startswith(c.API_URL_GET_PROFILE_PICTURE):
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
    behind_nginx = os.environ.get("ZYRAX_BEHIND_NGINX") == "1"
    sm.check_directories()
    sm.check_files()
    sm.initialize_flask_application()
    sm.check_microservices()
    sm.check_database()
    sm.register_blueprints()                                                    #Register the HTTP routes
    if behind_nginx:
        sm.app.wsgi_app = ProxyFix(sm.app.wsgi_app, x_for=1, x_proto=1)
        sm.app.config["SESSION_COOKIE_SECURE"] = True

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
            
    sm.app.run(
        host="127.0.0.1" if behind_nginx else "0.0.0.0",
        port=5000,
        debug=not c.PRODUCTION_MODE and not behind_nginx,
        threaded=True,
    )
