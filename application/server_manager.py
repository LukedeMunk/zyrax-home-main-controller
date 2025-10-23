################################################################################
#
# File:     server_manager.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Server manager manages the server. Creates the database, registers
#           Flask blueprints and configures the Flask webserver.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Flask, session                                                #Import Flask and session
from flask_sqlalchemy import SQLAlchemy                                         #Import Flask FlaskSQLAlchemy
import os
import configuration as c                                                       #Import application configuration variables
from datetime import datetime
import json                                                                     #To generate JSON response strings
from cryptography.fernet import Fernet
import keyring
from logger import logi, logw, loge                                             #Import logging functions
from TelegramServiceClient import *
from WeatherServiceClient import *
from expiringdict import ExpiringDict                                           #To keep track of RF codes

#Flask configuration
app = Flask(__name__)
db =  SQLAlchemy()

if c.PRODUCTION_MODE:
    import RPi.GPIO as GPIO                                                     #For RF purposes
    from rpi_rf import RFDevice                                                 #For RF purposes
    GPIO.setwarnings(False)

rf_device = None
last_received_rf_codes = ExpiringDict(max_age_seconds=30, max_len=50)           #For showing received RF codes in the UI
last_received_rf_codes[0] = 0

telegram_service_state = None#Can be removed?
weather_service_state = None#Can be removed?

#region Account tables
class Account(db.Model):
    __tablename__ = "Account"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(256), unique=True, nullable=False)              #Encrypted
    password = db.Column(db.String(256), nullable=False)                        #Hashed
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.now(c.TIME_ZONE), nullable=False)
    last_logged_in_at = db.Column(db.DateTime(timezone=True), default=datetime.now(c.TIME_ZONE), nullable=False)

class Profile(db.Model):
    __tablename__ = "Profile"
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, nullable=False)
    profile_picture = db.Column(db.String(256), nullable=False, default=c.DEFAULT_PROFILE_PICTURE_FILENAME)
    name = db.Column(db.String(256), nullable=False)
    language = db.Column(db.Integer, nullable=False)
    ui_theme = db.Column(db.Integer, nullable=False, default=c.UI_THEME_DARK_BLUE)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.now(c.TIME_ZONE), nullable=False)

class ProfileHasFavouriteDashboardConfiguration(db.Model):
    __tablename__ = "ProfileHasFavouriteDashboardConfiguration"
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, nullable=False)
    configuration_id = db.Column(db.Integer, nullable=False)

#class AccountHasDashboardConfiguration(db.Model): For not unimplemented
#    __tablename__ = "AccountHasDashboardConfiguration"
#    id = db.Column(db.Integer, primary_key=True)
#    account_id = db.Column(db.Integer, nullable=False)
#    configuration_id = db.Column(db.Integer, nullable=False)

class DashboardConfiguration(db.Model):
    __tablename__ = "DashboardConfiguration"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-grid-horizontal fa-lg")
        
class DashboardHasTile(db.Model):
    __tablename__ = "DashboardHasTile"
    id = db.Column(db.Integer, primary_key=True)
    configuration_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer)
    group_id = db.Column(db.Integer)
    index = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Integer, nullable=False)
    size = db.Column(db.Integer, nullable=False)
#endregion

#region Alarm tables
class Alarm(db.Model):
    __tablename__ = "Alarm"
    id = db.Column(db.Integer, primary_key=True)
    automatically_armed = db.Column(db.Boolean, nullable=False, default=False)
    armed = db.Column(db.Boolean, nullable=False, default=False)
    activated = db.Column(db.Boolean, nullable=False, default=False)

class AlarmIsTriggered(db.Model):
    __tablename__ = "AlarmHIsTriggered"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    trigger_device_id = db.Column(db.Integer, nullable=False)
    datetime = db.Column(db.DateTime(timezone=True), default=datetime.now(c.TIME_ZONE), nullable=False)

class AlarmHasTriggerDevice(db.Model):
    __tablename__ = "AlarmHasTriggerDevice"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)

class AlarmHasDeactivationDevice(db.Model):
    __tablename__ = "AlarmHasDeactivationDevice"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    ip_address = db.Column(db.String(50), nullable=False)
    mac_address = db.Column(db.String(50), nullable=False)
    #endregion
    
#region Device tables
class Device(db.Model):
    __tablename__ = "Device"
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, nullable=False, default=-1)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    type = db.Column(db.Integer, nullable=False)
    model_id = db.Column(db.Integer, nullable=False)##
    category = db.Column(db.Integer, nullable=False)##

class Location(db.Model):
    __tablename__ = "Location"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-person-shelter")

class RfDevice(db.Model):
    __tablename__ = "RfDevice"
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.Boolean, nullable=False, default=False)
    icon_low_state = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    low_battery = db.Column(db.Boolean, nullable=False, default=False)

class RfDeviceIsTriggered(db.Model):
    __tablename__ = "RfDeviceIsTriggered"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    datetime = db.Column(db.DateTime(timezone=True), default=datetime.now(c.TIME_ZONE), nullable=False)

class RfDeviceHasRfCode(db.Model):
    __tablename__ = "RfDeviceHasRfCode"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    rf_code = db.Column(db.Integer, nullable=False, unique=True)
    type = db.Column(db.Integer, nullable=False)                                    #presence detected, opened, closed, low battery, remotecontrolBtn

class IpCamera(db.Model):
    __tablename__ = "IpCamera"
    id = db.Column(db.Integer, primary_key=True)
    hostname = db.Column(db.String(20), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False)
    port = db.Column(db.Integer, nullable=False, default=80)
    connection_status = db.Column(db.Boolean, nullable=False, default=False)
    firmware_version = db.Column(db.String(20), nullable=False, default=c.DEFAULT_FIRMWARE_VERSION)
    sd_card_inserted = db.Column(db.Boolean, nullable=False, default=False)

class LedstripDB(db.Model):
    __tablename__ = "Ledstrip"
    id = db.Column(db.Integer, primary_key=True)
    hostname = db.Column(db.String(20), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False, default=c.DEFAULT_IP_ADDRESS)
    icon_low_state = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    port = db.Column(db.Integer, nullable=False, default=80)
    connection_status = db.Column(db.Boolean, nullable=False, default=False)
    power = db.Column(db.Boolean, nullable=False, default=True)
    firmware_version = db.Column(db.String(20), nullable=False, default=c.DEFAULT_FIRMWARE_VERSION)
    sd_card_inserted = db.Column(db.Boolean, nullable=False, default=False)
    number_of_leds = db.Column(db.Integer, nullable=False, default=0)
    #driver = db.Column(db.Integer, nullable=False, default=c.LEDSTRIP_MODEL_WS2801)
    brightness = db.Column(db.Integer, nullable=False, default=255)
    mode = db.Column(db.Integer, nullable=False, default=1)
    power_animation = db.Column(db.Integer, nullable=False, default=c.POWER_ANIMATION_FADE)
    has_sensor = db.Column(db.Boolean, nullable=False, default=False)
    sensor_inverted = db.Column(db.Boolean, nullable=False, default=False)
    sensor_model = db.Column(db.Integer, nullable=False, default=c.LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH)
    sensor_state = db.Column(db.Boolean, nullable=False, default=False)

class Pixel(db.Model):
    __tablename__ = "Pixel"
    id = db.Column(db.Integer, primary_key=True)
    ledstrip_id = db.Column(db.Integer, nullable=False)
    segment_index = db.Column(db.Integer, nullable=False)
    index = db.Column(db.Integer, nullable=False)
    address = db.Column(db.Integer, nullable=False)

class PixelSegment(db.Model):
    __tablename__ = "PixelSegment"
    id = db.Column(db.Integer, primary_key=True)
    ledstrip_id = db.Column(db.Integer, nullable=False)
    segment_index = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Integer, nullable=False)                                        #LEDSTRIP or INACTIVE
    x1 = db.Column(db.Integer, nullable=False)
    y1 = db.Column(db.Integer, nullable=False)
    x2 = db.Column(db.Integer, nullable=False)
    y2 = db.Column(db.Integer, nullable=False)

class Group(db.Model):
    __tablename__ = "Group"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-sensor")
    type = db.Column(db.Integer, nullable=False)
    synchronized = db.Column(db.Boolean, nullable=False, default=False)

class GroupHasDevice(db.Model):
    __tablename__ = "GroupHasDevice"
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)
#endregion

#region Automations
class Automation(db.Model):
    __tablename__ = "Automation"
    id = db.Column(db.Integer, primary_key=True)
    inverted_automation_copy_id = db.Column(db.Integer, nullable=False, default=-1)     #If -1, no inverted automation enabled, else it is
    is_inverted_automation = db.Column(db.Boolean, nullable=False, default=False)       #If true, this is an inverted automation, else it is
    name = db.Column(db.String(50), unique=True, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    action = db.Column(db.String(50), nullable=False)
    trigger = db.Column(db.Integer, nullable=False)
    time_window_activated = db.Column(db.Boolean, nullable=False, default=False)
    activate_during_time_window = db.Column(db.Boolean, nullable=False, default=True)   #0 to disable during window, 1 to enable
    time_window_start_minutes = db.Column(db.Integer, nullable=False, default=0)
    time_window_end_minutes = db.Column(db.Integer, nullable=False, default=1439)
    delay_minutes = db.Column(db.Integer, nullable=False, default=0)                    #Delay when action takes place when closed, in minutes

class AutomationHasParameter(db.Model):
    __tablename__ = "AutomationHasParameter"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    value = db.Column(db.String(50), nullable=False, default="")
    
class AutomationHasTriggerDevice(db.Model):
    __tablename__ = "AutomationHasTriggerDevice"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)
    trigger_state = db.Column(db.Integer, nullable=False)

class AutomationHasTargetDevice(db.Model):
    __tablename__ = "AutomationHasTargetDevice"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)

class AutomationHasTriggerTime(db.Model):
    __tablename__ = "AutomationHasTriggerTime"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(db.Integer, nullable=False)
    days = db.Column(db.String(7), nullable=False, default="0000000")
    time = db.Column(db.String(5), nullable=False, default="00:00")
#endregion

#region Modes
class Mode(db.Model):
    __tablename__ = "Mode"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class ModeParameter(db.Model):
    __tablename__ = "ModeParameter"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    human_friendly_name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.Integer, nullable=False)                                        #range, select, color, checkbox, directionSwitch
    default_value = db.Column(db.String(50), nullable=False, default="")
    minimum_value = db.Column(db.Integer)
    maximum_value = db.Column(db.Integer)

class ModeHasModeParameter(db.Model):
    __tablename__ = "ModeHasModeParameter"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    mode_id = db.Column(db.Integer, nullable=False)
    mode_parameter_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.String(50), nullable=False, default="")
#endregion

################################################################################
#
#   @brief  Generates the ledstrip mode configuration parameters needed for the
#   specific mode.
#
################################################################################
def generate_ledstrip_mode_parameters():
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_MIN_COLOR_POS, human_friendly_name="Minimum color position",
                                        type=c.MODE_PARAMETER_TYPE_COLOR_RANGE, default_value="0",
                                        minimum_value=0, maximum_value=254))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_MAX_COLOR_POS, human_friendly_name="Maximum color position",
                                        type=c.MODE_PARAMETER_TYPE_COLOR_RANGE, default_value="255",
                                        minimum_value=1, maximum_value=255))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_COLOR1, human_friendly_name="Color 1",
                                        type=c.MODE_PARAMETER_TYPE_COLOR, default_value="#ffffff"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_COLOR2, human_friendly_name="Color 2",
                                        type=c.MODE_PARAMETER_TYPE_COLOR, default_value="#000000"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_USE_GRADIENT1, human_friendly_name="Use gradient 1",
                                        type=c.MODE_PARAMETER_TYPE_CHECKBOX, default_value="False"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_USE_GRADIENT2, human_friendly_name="Use gradient 2",
                                        type=c.MODE_PARAMETER_TYPE_CHECKBOX, default_value="False"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_SEGMENT_SIZE, human_friendly_name="Segment size of ? LEDs",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="1",
                                        minimum_value=1, maximum_value=20))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_TAIL_LENGTH, human_friendly_name="Tail length of ? LEDs",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="0",
                                        minimum_value=0, maximum_value=20))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_WAVE_LENGTH, human_friendly_name="Wave length of ? LEDs",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="10",
                                        minimum_value=1, maximum_value=10))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_TIME_FADE, human_friendly_name="Time fade of ?ms per frame",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="0",
                                        minimum_value=0, maximum_value=1000))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_DELAY, human_friendly_name="Fade delay of ?ms per frame",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="1",
                                        minimum_value=0, maximum_value=1000))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_DELAY_BETWEEN, human_friendly_name="?ms between actions",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="200",
                                        minimum_value=0, maximum_value=10000))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_RANDOMNESS_DELAY, human_friendly_name="?% randomness in the delay",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="0",
                                        minimum_value=0, maximum_value=100))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_INTENSITY, human_friendly_name="Intensity of ?",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="1",
                                        minimum_value=1, maximum_value=10))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_DIRECTION, human_friendly_name="? direction",
                                        type=c.MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX, default_value="False"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_NUMBER_OF_ELEMENTS, human_friendly_name="? elements",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="5",
                                        minimum_value=1, maximum_value=50))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_PALETTE, human_friendly_name="Palette",
                                        type=c.MODE_PARAMETER_TYPE_SELECT, default_value="0"))
    
    db.session.add(ModeParameter(name=c.PARAMETER_NAME_FADE_LENGTH, human_friendly_name="Number of leds fading ?",
                                        type=c.MODE_PARAMETER_TYPE_RANGE, default_value="0",
                                        minimum_value=0, maximum_value=50))
    
    db.session.commit()

################################################################################
#
#   @brief  Generates a JSON string as HTTP response.
#   @param  http_code           HTTP code to add
#   @param  message             Message to add
#   @return                     JSON string
#
################################################################################
def generate_json_http_response(http_code, message=""):
    #If is dictionary, convert to json string
    if isinstance(message, dict):
        message = json.dumps(message)
    else:
        message = "\"" + str(message) + "\""

    json_string = "{\"status_code\":" + str(http_code) + ","
    json_string += "\"message\":" + message + "}"

    return json_string

################################################################################
#
#   @brief  Registers all of the blueprints of the webserver.
#
################################################################################
def register_blueprints():
    from routes.alarm_blueprints import alarm_bp
    from routes.configuration_blueprints import configuration_bp
    from routes.user_blueprints import user_bp
    from routes.automation_blueprints import automation_bp
    from routes.dashboard_blueprints import dashboard_bp
    from routes.data_blueprints import data_bp
    from routes.device_blueprints import device_bp
    from routes.group_blueprints import group_bp
    from routes.ledstrip_blueprints import ledstrip_bp
    from routes.logs_blueprints import logs_bp
    from routes.ota_blueprints import ota_bp
    from routes.rf_device_blueprints import rf_device_bp
    from routes.system_blueprints import system_bp
    from routes.template_blueprints import template_bp

    app.register_blueprint(alarm_bp)
    app.register_blueprint(configuration_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(automation_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(device_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(ledstrip_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(ota_bp)
    app.register_blueprint(rf_device_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(template_bp)

################################################################################
#
#   @brief  Creates the database with the supported ledstrip modes.
#
################################################################################
def _create_database():
    db.create_all()

    generate_ledstrip_mode_parameters()
    
    color_mode = Mode(name="Color")
    fade_mode = Mode(name="Fade")
    gradient_mode = Mode(name="Gradient")
    blink_mode = Mode(name="Blink")
    scan_mode = Mode(name="Scan")
    theater_mode = Mode(name="Theater")
    sine_mode = Mode(name="Sine")
    bouncing_balls_mode = Mode(name="Bouncing Balls")
    dissolve_mode = Mode(name="Dissolve")
    sparkle_mode = Mode(name="Sparkle")
    fireworks_mode = Mode(name="Fireworks")
    fire_mode = Mode(name="Fire")
    sweep_mode = Mode(name="Sweep")
    color_twinkels_mode = Mode(name="Color Twinkels")
    meteor_rain_mode = Mode(name="Meteors")
    color_waves_mode = Mode(name="Color Waves")

    db.session.add(DashboardConfiguration(name="Dashboard1"))
    db.session.add(Alarm())
    db.session.add(color_mode)
    db.session.add(fade_mode)
    db.session.add(gradient_mode)
    db.session.add(blink_mode)
    db.session.add(scan_mode)
    db.session.add(theater_mode)
    db.session.add(sine_mode)
    db.session.add(bouncing_balls_mode)
    db.session.add(dissolve_mode)
    db.session.add(sparkle_mode)
    db.session.add(fireworks_mode)
    db.session.add(fire_mode)
    db.session.add(sweep_mode)
    db.session.add(color_twinkels_mode)
    db.session.add(meteor_rain_mode)
    db.session.add(color_waves_mode)

    db.session.commit()
    
################################################################################
#
#   @brief  Checks the nessecary directories and creates them when not found.
#
################################################################################
def check_directories():
    #Data folder containing all other folders
    if not os.path.isdir(c.DATA_DIRECTORY):
        os.makedirs(c.DATA_DIRECTORY)

    #OTA folder
    if not os.path.isdir(c.OTA_FILE_DIRECTORY_PATH):
        os.makedirs(c.OTA_FILE_DIRECTORY_PATH)

################################################################################
#
#   @brief  Checks the nessecary files and creates them when not found.
#
################################################################################
def check_files():
    #Log file
    if not os.path.isfile(c.LOGS_PATH):
        file = open(c.LOGS_PATH, "w")
        file.close()

    if not os.path.isfile(c.CONFIGURATION_FILE_PATH):
        logw(c.TEXT_NO_CONFIGURATION_FILE_FOUND)
        configuration = {
            "WEATHER_SERVICE_ENABLED" : c.WEATHER_SERVICE_ENABLED,
            "WEATHER_LOCATION" : c.WEATHER_LOCATION,
            "TELEGRAM_SERVICE_ENABLED" : c.TELEGRAM_SERVICE_ENABLED,
            "RPI_RF_ENABLED" : c.RPI_RF_ENABLED
        }

        with open(c.CONFIGURATION_FILE_PATH, "w") as file:
            json.dump(configuration, file, indent=4)

################################################################################
#
#   @brief  Checks the nessecary files and creates them when not found.
#
################################################################################
def check_credentials():
    key = keyring.get_password(c.APPLICATION_NAME, c.FLASK_ENCRYPTION_KEY_NAME)
    if key is None:
        logi("Created Flask encryption key")
        keyring.set_password(c.APPLICATION_NAME, c.FLASK_ENCRYPTION_KEY_NAME, Fernet.generate_key().decode())

    key = keyring.get_password(c.APPLICATION_NAME, c.DATABASE_ENCRYPTION_KEY_NAME)
    if key is None:
        logi("Created database encryption key")
        keyring.set_password(c.APPLICATION_NAME, c.DATABASE_ENCRYPTION_KEY_NAME, Fernet.generate_key().decode())

    key = keyring.get_password(c.APPLICATION_NAME, c.MICROSERVICE_KEY_NAME)
    if key is None:
        logi("Created microservice API key")
        keyring.set_password(c.APPLICATION_NAME, c.MICROSERVICE_KEY_NAME, Fernet.generate_key().decode())

################################################################################
#
#   @brief  Checks the database file and creates it when not found.
#
################################################################################
def check_database():
    global app
    
    #Check database file
    if not os.path.isfile(c.DB_PATH):
        with app.app_context():
            _create_database()

################################################################################
#
#   @brief  Initializes the Flask application
#
################################################################################
def initialize_flask_application():
    global db

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(c.DB_PATH)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = c.OTA_FILE_DIRECTORY_PATH                     #Only file uploads for OTA

    app.config["SECRET_KEY"] = c.FLASK_ENCRYPTION_KEY
    app.config["FLASK_DEBUG"] = 1

    db.init_app(app)

################################################################################
#
#   @brief  Validates the microservices states.
#
################################################################################
def check_microservices():
    global telegram_service_state
    global weather_service_state

    if not c.TELEGRAM_SERVICE_ENABLED:
        logw("Telegram service disabled")
    else:
        telegram_client = TelegramServiceClient(
            base_url=c.TELEGRAM_SERVICE_URL,
            api_key=c.MICROSERVICE_KEY
        )

        telegram_service_state = telegram_client.get_service_state()

        if telegram_service_state != SERVICE_STATE_RUNNING:
            logw("Telegram service unavailable")

    if not c.WEATHER_SERVICE_ENABLED:
        logw("Weather service disabled")
    else:
        weather_client = WeatherServiceClient(
            base_url=c.WEATHER_SERVICE_URL,
            api_key=c.MICROSERVICE_KEY
        )

        weather_service_state = weather_client.get_service_state()

        if weather_service_state != SERVICE_STATE_RUNNING:
            logw("Weather service unavailable")

################################################################################
#
#   @brief  Initializes the RF receiver
#
################################################################################
def initialize_rf_receiver():
    global rf_device
    rf_device = None

    if not c.RPI_RF_ENABLED:
        logw("RF receiver disabled")
        return

    if not c.PRODUCTION_MODE:
        loge("Cannot enable RF receiver. Not available for Windows or development mode")
        return

    try:
        rf_device = RFDevice(c.RF_PIN_BCM, rx_tolerance=150)
        rf_device.enable_rx()
        logi("RF receiver enabled")
    except Exception as e:
        loge("Cannot enable RF receiver: " + str(e))
        rf_device = None