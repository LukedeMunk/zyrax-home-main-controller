################################################################################
#
# File:     template_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints for template requests.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, render_template, session                  #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
import database_utility as db_util                                              #Import utility for database functionality
from logger import logi, logw, loge, get_logs                                   #Import logging functions
from WeatherServiceClient import WeatherServiceClient

dm = DeviceManager()
template_bp = Blueprint("template_blueprints", __name__)

weather_client = WeatherServiceClient(
    base_url=c.WEATHER_SERVICE_URL,
    api_key=c.MICROSERVICE_KEY
)

#region Load pages
################################################################################
#
#   @brief  Loads login page.
#   @param  error_message       Error message to show
#   @param  note_message        Note message to show
#   @param  warning_message     Warning message to show
#   @return                     HTML file and parameters to load
#
################################################################################
@template_bp.route("/login", methods=["GET"])
def login_get(message=""):
    #Check whether is already logged in
    if "account_id" in session:
        session.clear()                                                         #Logout, clear session
    
    return render_template("login.html", title="",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=[],
                            message=message)

################################################################################
#
#   @brief  Loads login page.
#   @param  error_message       Error message to show
#   @param  note_message        Note message to show
#   @param  warning_message     Warning message to show
#   @return                     HTML file and parameters to load
#
################################################################################
@template_bp.route("/account", methods=["GET"])
def account_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    return render_template("account.html", title="",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            account=db_util.get_account(session["account_id"]),
                            UI_THEMES=c.UI_THEMES,
                            SUPPORTED_UI_LANGUAGES=c.SUPPORTED_UI_LANGUAGES)

################################################################################
#
#   @brief  Loads the index page (dashboard).
#
################################################################################
@template_bp.route("/", methods=["GET"])
def dashboard_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    logi("[" + request.remote_addr + "] visited the website")

    alarm = db_util.get_alarm()
    alarm["connected_deactivation_devices"] = dm.get_connected_alarm_deactivation_devices(alarm["deactivation_devices"])

    return render_template("dashboard.html", title="",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            alarm=alarm,
                            weather=weather_client.get_weather_forecast(True),
                            weather_location=c.WEATHER_LOCATION,
                            dashboard_configurations=db_util.get_dashboard_configurations(),
                            tile_types=c.TILE_TYPES,
                            devices=dm.get_devices_dict(update_states=True),
                            groups=dm.get_groups())


################################################################################
#
#   @brief  Loads the LED addressing configuration page.
#
################################################################################
@template_bp.route("/initial_setup", methods=["GET"])
def initial_setup():
    return render_template("initial_setup.html", title="",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=[],
                            SUPPORTED_UI_LANGUAGES=c.SUPPORTED_UI_LANGUAGES)

################################################################################
#
#   @brief  Loads the configuration page.
#
################################################################################
@template_bp.route("/configuration", methods=["GET"])
def configuration_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    return render_template("configuration.html", title="Configuration",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            devices=dm.get_devices_dict(update_states=True),
                            unconfigured_devices=dm.get_unconfigured_devices(),
                            groups=dm.get_groups(),
                            ota_files=dm.get_ledstrip_ota_versions(),
                            LEDSTRIP_SENSOR_MODELS=c.LEDSTRIP_SENSOR_MODELS,
                            DEVICE_TYPES=c.DEVICE_TYPES,
                            DEVICE_CATEGORIES=c.DEVICE_CATEGORIES,
                            DEVICE_MODELS=c.DEVICE_MODELS,
                            logs=get_logs(),
                            SUPPORTED_UI_LANGUAGES=c.SUPPORTED_UI_LANGUAGES,
                            weather_service_enabled=c.WEATHER_SERVICE_ENABLED,
                            weather_api_key=c.WEATHER_API_KEY,
                            telegram_service_enabled=c.TELEGRAM_SERVICE_ENABLED,
                            rpi_rf_receiver_enabled=c.RPI_RF_ENABLED,
                            telegram_bot_token=c.TELEGRAM_BOT_TOKEN)

################################################################################
#
#   @brief  Loads the LED addressing configuration page.
#
################################################################################
@template_bp.route("/configure_led_addressing", methods=["GET"])
def configure_led_addressing_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    id = int(request.args.get("id"))

    return render_template("configure_led_addressing.html", title="Configure LED addressing",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            ledstrip=dm.get_ledstrip_with_leds(id=id))

################################################################################
#
#   @brief  Loads the real-time LED coloring page.
#
################################################################################
@template_bp.route("/realtime_led_coloring", methods=["GET"])
def realtime_led_coloring_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    id = int(request.args.get("id"))
    dm.set_ledstrip_mode(id, c.MODE_DRAWING)

    return render_template("realtime_led_coloring.html", title="Real-time LED coloring",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            ledstrip=dm.get_ledstrip_with_leds(id=id))

################################################################################
#
#   @brief  Loads the automations page.
#
################################################################################
@template_bp.route("/automations", methods=["GET"])
def automations_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    return render_template("automations.html", title="Automations",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            automations=dm.get_automations(),
                            AUTOMATION_TRIGGERS=c.AUTOMATION_TRIGGERS,
                            modes=dm.get_ledstrip_modes(),
                            actions=c.AUTOMATION_ACTIONS,
                            DEVICE_TYPES=c.DEVICE_TYPES,
                            DEVICE_CATEGORIES=c.DEVICE_CATEGORIES,
                            DEVICE_MODELS=c.DEVICE_MODELS,
                            devices=dm.get_devices_dict(),
                            groups=dm.get_groups())

################################################################################
#
#   @brief  Loads the alarm page.
#
################################################################################
@template_bp.route("/alarm", methods=["GET"])
def alarm_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    return render_template("alarm.html", title="Alarm",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            alarm=db_util.get_alarm(),
                            devices=dm.get_devices_dict(update_states=True),
                            alarm_trigger_times=db_util.get_alarm_trigger_times())

################################################################################
#
#   @brief  Loads the RF devices control page.
#
################################################################################
@template_bp.route("/control_rf_devices", methods=["GET"])
def control_rf_devices_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    return render_template("rf_devices.html", title="Sensors",
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            devices=dm.get_devices_dict(type=c.DEVICE_TYPE_RF_DEVICE),
                            sensor_trigger_times=db_util.get_sensor_trigger_times())

################################################################################
#
#   @brief  Loads the ledstrip control page.
#
################################################################################
@template_bp.route("/control_leds", methods=["GET"])
def control_leds_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    id = int(request.args.get("id"))
    ledstrip = dm.get_device_dict(id=id, update_states=True)
    ledstrip["color"] = dm.get_ledstrip_color(id)
    title = "Control " + ledstrip["name"]
    
    return render_template("control_ledstrip.html", title=title,
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            id=id,
                            mode_configurations=dm.get_ledstrip_mode_configurations(id),
                            power_animations=c.POWER_ANIMATIONS,
                            ledstrip=ledstrip,
                            devices="",
                            group="",
                            palettes=c.PALETTES,
                            group_selected=False)

################################################################################
#
#   @brief  Loads the ledstrip group control page.
#
################################################################################
@template_bp.route("/control_ledstrip_group", methods=["GET"])
def control_led_groups_page():
    if "account_id" not in session:
        return login_get(c.TEXT_NEED_TO_BE_LOGGED_IN)                           #User not logged in, return to login page
    
    id = int(request.args.get("id"))
    group = dm.get_group(id=id)
    title = "Control " + group["name"]

    return render_template("control_ledstrip.html", title=title,
                            APPLICATION_VERSION=c.APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            id=id,
                            mode_configurations=dm.get_ledstrip_mode_configurations(group["device_ids"][0]),
                            power_animations=c.POWER_ANIMATIONS,
                            ledstrip="",
                            devices=dm.get_devices_dict(type=c.DEVICE_TYPE_LEDSTRIP),
                            group=group,
                            palettes=c.PALETTES,
                            group_selected=True)
#endregion
