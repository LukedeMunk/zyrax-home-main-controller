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
from apscheduler.schedulers.background import BackgroundScheduler               #For scheduled controller tasks
import database_utility as db_util                                              #Import utility for database functionality
from routes.template_blueprints import initial_setup
from werkzeug.middleware.proxy_fix import ProxyFix

from threading import Thread                                                    #For threading
import os                                                                       #For file handling

dm = DeviceManager()

#region Interval functionality
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

        dm.initialize()
        scheduler = BackgroundScheduler()
        scheduler.add_job(check_time, "interval", seconds=5)
        
        scheduler.add_job(dm.refresh_rf_hub_availability, "interval", minutes=30)
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
