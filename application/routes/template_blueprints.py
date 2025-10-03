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
from flask import Blueprint, request, render_template                           #Import flask blueprints and requests
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
#   @brief  Loads the index page (dashboard).
#
################################################################################
@template_bp.route("/", methods=["GET"])
def dashboard_page():
    logi("[" + request.remote_addr + "] visited the website")

    alarm = db_util.get_alarm()
    alarm["connected_deactivation_devices"] = dm.get_connected_alarm_deactivation_devices(alarm["deactivation_devices"])

    return render_template("dashboard.html", title="",
                            alarm_activated=db_util.get_alarm()["activated"],
                            alarm=alarm,
                            weather=weather_client.get_weather_forecast(True),
                            weather_location=c.WEATHER_LOCATION,
                            dashboard_configurations=db_util.get_dashboard_configurations(),
                            tile_types=c.TILE_TYPES,
                            devices=dm.get_devices_dict(update_states=True),
                            groups=dm.get_groups())

################################################################################
#
#   @brief  Loads the configuration page.
#
################################################################################
@template_bp.route("/configuration", methods=["GET"])
def configuration_page():
    return render_template("configuration.html", title="Configuration",
                            alarm_activated=db_util.get_alarm()["activated"],
                            devices=dm.get_devices_dict(update_states=True),
                            unconfigured_devices=dm.get_unconfigured_devices(),
                            groups=dm.get_groups(),
                            ota_files=dm.get_ledstrip_ota_versions(),
                            device_types=c.DEVICE_TYPES,
                            ledstrip_models=c.LEDSTRIP_MODELS,
                            ledstrip_sensor_models=c.LEDSTRIP_SENSOR_MODELS,
                            sensor_models=c.SENSOR_MODELS,
                            camera_models=c.CAMERA_MODELS,
                            logs=get_logs(),
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
    id = int(request.args.get("id"))

    return render_template("configure_led_addressing.html", title="Configure LED addressing",
                            alarm_activated=db_util.get_alarm()["activated"],
                            ledstrip=dm.get_ledstrip_with_leds(id=id))

################################################################################
#
#   @brief  Loads the real-time LED coloring page.
#
################################################################################
@template_bp.route("/realtime_led_coloring", methods=["GET"])
def realtime_led_coloring_page():
    id = int(request.args.get("id"))
    dm.set_ledstrip_mode(id, c.MODE_DRAWING)

    return render_template("realtime_led_coloring.html", title="Real-time LED coloring",
                            alarm_activated=db_util.get_alarm()["activated"],
                            ledstrip=dm.get_ledstrip_with_leds(id=id))

################################################################################
#
#   @brief  Loads the automations page.
#
################################################################################
@template_bp.route("/automations", methods=["GET"])
def automations_page():
    return render_template("automations.html", title="Automations",
                            alarm_activated=db_util.get_alarm()["activated"],
                            automations=dm.get_automations(),
                            triggers=c.AUTOMATION_TRIGGERS,
                            modes=dm.get_ledstrip_modes(),
                            actions=c.AUTOMATION_ACTIONS,
                            devices=dm.get_devices_dict(),
                            groups=dm.get_groups())

################################################################################
#
#   @brief  Loads the alarm page.
#
################################################################################
@template_bp.route("/alarm", methods=["GET"])
def alarm_page():
    return render_template("alarm.html", title="Alarm",
                            alarm_activated=db_util.get_alarm()["activated"],
                            alarm=db_util.get_alarm(),
                            devices=dm.get_devices_dict(update_states=True),
                            alarm_trigger_times=db_util.get_alarm_trigger_times())

################################################################################
#
#   @brief  Loads the sensor control page.
#
################################################################################
@template_bp.route("/control_sensors", methods=["GET"])
def control_sensors_page():
    return render_template("sensors.html", title="Sensors",
                            alarm_activated=db_util.get_alarm()["activated"],
                            devices=dm.get_devices_dict(type=c.DEVICE_TYPE_SENSOR),
                            sensor_trigger_times=db_util.get_sensor_trigger_times())

################################################################################
#
#   @brief  Loads the ledstrip control page.
#
################################################################################
@template_bp.route("/control_leds", methods=["GET"])
def control_leds_page():
    id = int(request.args.get("id"))
    ledstrip = dm.get_device_dict(id=id, update_states=True)
    ledstrip["color"] = dm.get_ledstrip_color(id)
    title = "Control " + ledstrip["name"]
    
    return render_template("control_ledstrip.html", title=title,
                            alarm_activated=db_util.get_alarm()["activated"],
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
    id = int(request.args.get("id"))
    group = dm.get_group(id=id)
    title = "Control " + group["name"]

    return render_template("control_ledstrip.html", title=title,
                            alarm_activated=db_util.get_alarm()["activated"],
                            id=id,
                            mode_configurations=dm.get_ledstrip_mode_configurations(group["device_ids"][0]),
                            power_animations=c.POWER_ANIMATIONS,
                            ledstrip="",
                            devices=dm.get_devices_dict(type=c.DEVICE_TYPE_LEDSTRIP),
                            group=group,
                            palettes=c.PALETTES,
                            group_selected=True)
#endregion
