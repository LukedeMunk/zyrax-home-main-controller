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


from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response, render_login_page

dm = DeviceManager()
template_bp = Blueprint("template_blueprints", __name__)

weather_client = WeatherServiceClient(
    base_url=c.WEATHER_SERVICE_URL,
    api_key=c.dynamic_config.microservice_key
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
    #Check whether is already logged in, send user profiles
    if "account_id" in session:
        return render_login_page(message, db_util.get_profiles(session["account_id"]))
    
    return render_login_page(message)

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
@minimum_role_required()
def account_page():
    return render_template("account.html", title="",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def dashboard_page():
    logi("[" + request.remote_addr + "] visited the website")

    alarm = db_util.get_alarm()
    alarm["connected_deactivation_devices"] = dm.get_connected_alarm_deactivation_devices(alarm["deactivation_devices"])

    return render_template("dashboard.html", title="",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated=db_util.get_alarm()["activated"],
                            user_profiles=db_util.get_profiles(session["account_id"]),
                            alarm=alarm,
                            weather=weather_client.get_weather_forecast(True),
                            weather_location=c.dynamic_config.weather_location,
                            dashboard_configurations=db_util.get_dashboard_configurations(),
                            tile_types=c.TILE_TYPES,
                            automations=dm.get_automations(),
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
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def configuration_page():
    return render_template("configuration.html", title="Configuration",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
                            weather_service_enabled=c.dynamic_config.weather_service_enabled,
                            weather_api_key=c.dynamic_config.weather_api_key,
                            telegram_service_enabled=c.dynamic_config.telegram_service_enabled,
                            rpi_rf_receiver_enabled=c.dynamic_config.rpi_rf_enabled,
                            telegram_bot_token=c.dynamic_config.telegram_bot_token)

################################################################################
#
#   @brief  Loads the LED addressing configuration page.
#
################################################################################
@template_bp.route("/configure_led_addressing", methods=["GET"])
@minimum_role_required()
def configure_led_addressing_page():
    id = int(request.args.get("id"))

    return render_template("configure_led_addressing.html", title="Configure LED addressing",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def realtime_led_coloring_page():
    id = int(request.args.get("id"))
    dm.set_ledstrip_mode(id, c.LEDSTRIP_MODE_ID_DRAWING)

    return render_template("realtime_led_coloring.html", title="Real-time LED coloring",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def automations_page():
    return render_template("automations.html", title="Automations",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def alarm_page():
    return render_template("alarm.html", title="Alarm",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def control_rf_devices_page():
    return render_template("rf_devices.html", title="Sensors",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
@minimum_role_required()
def control_leds_page():
    id = int(request.args.get("id"))
    ledstrip = dm.get_device_dict(id=id, update_states=True)
    ledstrip["color"] = dm.get_ledstrip_color(id)
    title = "Control " + ledstrip["name"]

    print(ledstrip)
    
    return render_template("control_ledstrip.html", title=title,
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
                            LEDSTRIP_MODES=c.LEDSTRIP_MODES,
                            group_selected=False)

################################################################################
#
#   @brief  Loads the ledstrip group control page.
#
################################################################################
@template_bp.route("/control_ledstrip_group", methods=["GET"])
@minimum_role_required()
def control_led_groups_page():
    id = int(request.args.get("id"))
    group = dm.get_group(id=id)
    title = "Control " + group["name"]

    return render_template("control_ledstrip.html", title=title,
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
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
