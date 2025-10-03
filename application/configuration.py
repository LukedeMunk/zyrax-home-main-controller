################################################################################
#
# File:     configuration.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Contains configuration variables for Homesystem.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import pytz                                                                     #To declare a timezone
import os                                                                       #For file handling
import json                                                                     #For JSON handling
from language_package_english import *                                          #Import language package
import keyring
import base64

PRODUCTION_MODE = True
if os.name == "nt":
    PRODUCTION_MODE = False #Production mode off on windows machines (For now)

KEYRING_KEY = None

USER_PRESENT = True#TODO For later use in login first user

#Pins
RF_PIN_BCM = 27                                                                 #BCM mode so GPIO27 (pin 13). RF reciever

APPLICATION_NAME = "ZyraX_Home"

#Credential names
WEATHER_API_KEY_NAME = "WEATHER_API_KEY"
TELEGRAM_BOT_TOKEN_NAME = "TELEGRAM_BOT_TOKEN"
TELEGRAM_CHAT_ID_NAME = "TELEGRAM_CHAT_ID"
FLASK_ENCRYPTION_KEY_NAME = "FLASK_ENCRYPTION_KEY"
MICROSERVICE_KEY_NAME = "MICROSERVICE_KEY"

TELEGRAM_SERVICE_NAME = "Telegram_microservice"
WEATHER_SERVICE_NAME = "Weather_microservice"

#Palettes
PALETTE_RANDOM = 0
PALETTE_YELLOW_RED = 1
PALETTE_PURPLE_BLUE = 2
PALETTE_GREEN_BLUE = 3
PALETTE_BLUE_GREEN = 4
PALETTE_CLOUD_COLORS = 10
PALETTE_LAVA_COLORS = 11
PALETTE_OCEAN_COLORS = 12
PALETTE_FOREST_COLORS = 13

PALETTES = [
    {"name": "Random", "value": PALETTE_RANDOM},
    {"name": "Yellow & Red", "value": PALETTE_YELLOW_RED},
    {"name": "Purple & Blue", "value": PALETTE_PURPLE_BLUE},
    {"name": "Green & Blue", "value": PALETTE_GREEN_BLUE},
    {"name": "Blue & Green", "value": PALETTE_BLUE_GREEN},
    {"name": "Clouds", "value": PALETTE_CLOUD_COLORS},
    {"name": "Lava", "value": PALETTE_LAVA_COLORS},
    {"name": "Ocean", "value": PALETTE_OCEAN_COLORS},
    {"name": "Forest", "value": PALETTE_FOREST_COLORS}
]

#Modes
COLOR_LEDSTRIP_MODE = 1
FADE_LEDSTRIP_MODE = 2
GRADIENT_LEDSTRIP_MODE = 3
BLINK_LEDSTRIP_MODE = 4
SCAN_LEDSTRIP_MODE = 5
THEATER_LEDSTRIP_MODE = 6
SINE_LEDSTRIP_MODE = 7
BOUNCING_BALLS_LEDSTRIP_MODE = 8
DISSOLVE_LEDSTRIP_MODE = 9
SPARKLE_LEDSTRIP_MODE = 10
FIREWORKS_LEDSTRIP_MODE = 11
FIRE_LEDSTRIP_MODE = 12
SWEEP_LEDSTRIP_MODE = 13
COLOR_TWINKELS_LEDSTRIP_MODE = 14
METEOR_RAIN_LEDSTRIP_MODE = 15
COLOR_WAVES_LEDSTRIP_MODE = 16
MODE_DRAWING = 50

#Power animations
POWER_ANIMATION_FADE = 0
POWER_ANIMATION_DISSOLVE = 1
POWER_ANIMATION_SWEEP = 2
POWER_ANIMATION_DUAL_SWEEP = 3
NUM_POWER_ANIMATIONS = 4

POWER_ANIMATIONS = [
    {"name" : "Fade", "id" : POWER_ANIMATION_FADE},
    {"name" : "Dissolve", "id" : POWER_ANIMATION_DISSOLVE},
    {"name" : "Sweep", "id" : POWER_ANIMATION_SWEEP},
    {"name" : "Dual Sweep", "id" : POWER_ANIMATION_DUAL_SWEEP}
]

#Tiles
TILE_SIZE_1X1 = 0
TILE_SIZE_1X2 = 1
TILE_SIZE_4X2 = 2
TILE_SIZE_2X4 = 3
TILE_SIZE_4X4 = 4

TILE_TYPE_DEVICE = 0
TILE_TYPE_GROUP = 1
TILE_TYPE_DATETIME = 2
TILE_TYPE_WEATHER = 3
TILE_TYPE_ALARM = 4

TILE_TYPES = [
    {"type": TILE_TYPE_DEVICE, "name": "Device"},
    {"type": TILE_TYPE_GROUP, "name": "Group"},
    {"type": TILE_TYPE_DATETIME, "name": "Date time"},
    {"type": TILE_TYPE_WEATHER, "name": "Weather"},
    {"type": TILE_TYPE_ALARM, "name": "Alarm"},
]

TIME_ZONE = pytz.timezone("CET")

MIN_LEDSTRIP_BRIGHTNESS = 25
MAX_LEDSTRIP_BRIGHTNESS = 255

DEFAULT_FIRMWARE_VERSION = "v0.0.0"
COMPATIBLE_LEDSTRIP_FIRMWARE_VERSIONS = ["v0.0.2", "v0.9.0"]

DEVICE_TYPE_LEDSTRIP = 0
DEVICE_TYPE_SENSOR = 1
DEVICE_TYPE_IP_CAMERA = 2

ALL_DEVICE_TYPES = [DEVICE_TYPE_LEDSTRIP, DEVICE_TYPE_SENSOR]
DEVICE_TYPES = [{"name": "Ledstrips", "type" : DEVICE_TYPE_LEDSTRIP},
                {"name": "Sensors", "type" : DEVICE_TYPE_SENSOR},
                {"name": "Cameras", "type" : DEVICE_TYPE_IP_CAMERA}]

AUTOMATION_TRIGGER_TIMER = 0
AUTOMATION_TRIGGER_DOOR_SENSOR = 1
AUTOMATION_TRIGGER_MOTION_SENSOR = 2

#Ledstrip mode parameters
PARAMETER_NAME_MIN_COLOR_POS = "min_color_pos"
PARAMETER_NAME_MAX_COLOR_POS = "max_color_pos"
PARAMETER_NAME_COLOR1 = "color1"
PARAMETER_NAME_COLOR2 = "color2"
PARAMETER_NAME_USE_GRADIENT1 = "use_gradient1"
PARAMETER_NAME_USE_GRADIENT2 = "use_gradient2"
PARAMETER_NAME_SEGMENT_SIZE = "segment_size"
PARAMETER_NAME_TAIL_LENGTH = "tail_length"
PARAMETER_NAME_WAVE_LENGTH = "wave_length"
PARAMETER_NAME_TIME_FADE = "time_fade"
PARAMETER_NAME_DELAY = "delay"
PARAMETER_NAME_DELAY_BETWEEN = "delay_between"
PARAMETER_NAME_RANDOMNESS_DELAY = "randomness_delay"
PARAMETER_NAME_INTENSITY = "intensity"
PARAMETER_NAME_DIRECTION = "direction"
PARAMETER_NAME_NUMBER_OF_ELEMENTS = "number_of_elements"
PARAMETER_NAME_PALETTE = "palette"
PARAMETER_NAME_FADE_LENGTH = "fade_length"

PARAMETER_ID_MIN_COLOR_POS = 1
PARAMETER_ID_MAX_COLOR_POS = 2
PARAMETER_ID_COLOR1 = 3
PARAMETER_ID_COLOR2 = 4
PARAMETER_ID_USE_GRADIENT1 = 5
PARAMETER_ID_USE_GRADIENT2 = 6
PARAMETER_ID_SEGMENT_SIZE = 7
PARAMETER_ID_TAIL_LENGTH = 8
PARAMETER_ID_WAVE_LENGTH = 9
PARAMETER_ID_TIME_FADE = 10
PARAMETER_ID_DELAY = 11
PARAMETER_ID_DELAY_BETWEEN = 12
PARAMETER_ID_RANDOMNESS_DELAY = 13
PARAMETER_ID_INTENSITY = 14
PARAMETER_ID_DIRECTION = 15
PARAMETER_ID_NUMBER_OF_ELEMENTS = 16
PARAMETER_ID_PALETTE = 17
PARAMETER_ID_FADE_LENGTH = 18

MODE_PARAMETER_TYPE_COLOR_RANGE = 0
MODE_PARAMETER_TYPE_COLOR = 1
MODE_PARAMETER_TYPE_CHECKBOX = 2
MODE_PARAMETER_TYPE_RANGE = 3
MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX = 4
MODE_PARAMETER_TYPE_SELECT = 5

#Device models
LEDSTRIP_MODEL_WS2801 = 0
LEDSTRIP_MODEL_WS2812B = 1
LEDSTRIP_MODEL_SK6812K = 2
MAX_NUMBER_OF_LEDS = 250

LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH = 0

LEDSTRIP_MODELS = [{"model" : LEDSTRIP_MODEL_WS2801, "name" : "WS2801"},
                    {"model" : LEDSTRIP_MODEL_WS2812B, "name" : "WS2812B"},
                    {"model" : LEDSTRIP_MODEL_SK6812K, "name" : "SK6812K"}]

LEDSTRIP_SENSOR_MODELS = [{"model" : LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH, "name" : "Contact Switch"}]

RF_DEVICE_MODEL_OPEN_CLOSE = 0
RF_DEVICE_MODEL_PIR_SENSOR1 = 1
RF_DEVICE_MODEL_PIR_SENSOR2 = 2

RF_DEVICE_TYPE_DOOR_SENSOR = 0
RF_DEVICE_TYPE_MOTION_SENSOR = 1
RF_DEVICE_TYPE_REMOTE = 2

RF_CODE_TYPE_OPENED = 0
RF_CODE_TYPE_CLOSED = 1
RF_CODE_TYPE_TRIGGERED = 2
RF_CODE_TYPE_LOW_BATTERY = 3

RF_CODE_OPENED = {"name": "Open signal", "type": RF_CODE_TYPE_OPENED}
RF_CODE_CLOSED = {"name": "Close signal", "type": RF_CODE_TYPE_CLOSED}
RF_CODE_TRIGGERED = {"name": "Trigger signal", "type": RF_CODE_TYPE_TRIGGERED}
RF_CODE_LOW_BATTERY = {"name": "Low battery signal", "type": RF_CODE_TYPE_LOW_BATTERY}

SENSOR_MODELS = [{"model" : RF_DEVICE_MODEL_OPEN_CLOSE, "type": RF_DEVICE_TYPE_DOOR_SENSOR, "name" : "OpenClose", "rf_code_types" : [RF_CODE_OPENED, RF_CODE_CLOSED]},
                    {"model" : RF_DEVICE_MODEL_PIR_SENSOR1, "type": RF_DEVICE_TYPE_MOTION_SENSOR, "name" : "PIR", "rf_code_types" : [RF_CODE_TRIGGERED]},
                    {"model" : RF_DEVICE_MODEL_PIR_SENSOR2, "type": RF_DEVICE_TYPE_MOTION_SENSOR, "name" : "PIR2", "rf_code_types" : [RF_CODE_TRIGGERED, RF_CODE_LOW_BATTERY]}]

CAMERA_MODELS = [{"model" : 0, "name" : "Not supported yet"},]

#Automations
AUTOMATION_ACTION_SET_DEVICE_POWER = "set_device_power"
AUTOMATION_ACTION_SET_LEDSTRIP_COLOR = "set_ledstrip_color"
AUTOMATION_ACTION_SET_LEDSTRIP_MODE = "set_ledstrip_mode"

AUTOMATION_ACTIONS = [{"name" : "Set power", "device_types" : [DEVICE_TYPE_LEDSTRIP], "function" : AUTOMATION_ACTION_SET_DEVICE_POWER},
                        {"name" : "Update color", "device_types" : [DEVICE_TYPE_LEDSTRIP], "function" : AUTOMATION_ACTION_SET_LEDSTRIP_COLOR},
                        {"name" : "Update mode", "device_types" : [DEVICE_TYPE_LEDSTRIP], "function" : AUTOMATION_ACTION_SET_LEDSTRIP_MODE}]

AUTOMATION_TRIGGERS = [{"id" : 0, "name": "Time", "type" : AUTOMATION_TRIGGER_TIMER},
                        {"id" : 1, "name": "Door sensor", "type" : AUTOMATION_TRIGGER_DOOR_SENSOR},
                        {"id" : 2, "name": "Motion sensor", "type" : AUTOMATION_TRIGGER_MOTION_SENSOR}]

#HTTP commands
CMD_SET_POWER = "set_power"
CMD_SET_BRIGHTNESS = "set_brightness"
CMD_SET_MODE = "set_mode"
CMD_CONFIG_MODE = "configure_mode"
SET_POWER_ANIMATION = "set_power_animation"
CMD_REBOOT = "reboot"
CMD_UPDATE_FIRMWARE = "update_firmware"
CMD_SET_CONFIGURATION = "set_configuration"
CMD_GET_STATES = "get_states"
CMD_GET_MODE_CONFIGURATIONS = "get_mode_configurations"
CMD_GET_CONFIGURATION = "get_configuration"
CMD_DRAW_LEDS = "draw_leds"

#OTA states
OTA_STATE_IDLE = 0
OTA_STATE_DOWNLOADING_FIRMWARE = 1
OTA_STATE_INSTALLING_FIRMWARE = 2
OTA_STATE_FINISHED = 3
OTA_STATE_WAITING = 4

NETWORK_IP_RANGE = "192.168.2.1/24"

#Paths config
PATH = os.path.dirname(os.path.realpath(__file__))                              #Current path
DB_FILENAME = "zyrax_home.db"
LOG_FILENAME = "logs.log"                                                       #File name of logs
WEATHER_FILENAME = "weather.json"                                               #File name of weather information
CONFIGURATION_FILENAME = "configuration.conf"
KEYRING_FILENAME = "./keyring"
KEYRING_KEY_FILENAME = "keyring.key"

DATA_DIRECTORY = "data"
OTA_DIRECTORY = "ota"
LINUX_SYSTEM_DIRECTORY = os.path.join("/etc", APPLICATION_NAME)
LINUX_DATA_DIRECTORY = os.path.join("/var/lib", APPLICATION_NAME)

if PRODUCTION_MODE:
    DATA_DIRECTORY = os.path.join(LINUX_DATA_DIRECTORY, DATA_DIRECTORY)
    DB_PATH = os.path.join(DATA_DIRECTORY, DB_FILENAME)
    LOGS_PATH = os.path.join(DATA_DIRECTORY, LOG_FILENAME)
    WEATHER_PATH = os.path.join(DATA_DIRECTORY, WEATHER_FILENAME)
    OTA_FILE_DIRECTORY_PATH = os.path.join(DATA_DIRECTORY, OTA_DIRECTORY)
    CONFIGURATION_FILE_PATH = os.path.join(DATA_DIRECTORY, CONFIGURATION_FILENAME)
    KEYRING_FILE_PATH = os.path.join(DATA_DIRECTORY, KEYRING_FILENAME)
    KEYRING_KEY_FILE_PATH = os.path.join(DATA_DIRECTORY, KEYRING_KEY_FILENAME)

    from keyrings.cryptfile.cryptfile import CryptFileKeyring

    #Check keyring key file
    if os.path.isfile(KEYRING_KEY_FILE_PATH):
        print("NOTE: Loaded keyring key")
        with open(KEYRING_KEY_FILE_PATH) as file:
            KEYRING_KEY = file.readline()
    else:
        print("NOTE: Generated keyring key")
        with open(KEYRING_KEY_FILE_PATH, "w") as file:
            KEYRING_KEY = base64.b64encode(os.urandom(32)).decode()
            file.write(KEYRING_KEY)

    kr = CryptFileKeyring()
    kr.file_path = KEYRING_FILE_PATH
    kr.keyring_key = KEYRING_KEY
    keyring.set_keyring(kr)
else:
    DATA_DIRECTORY = os.path.join(PATH, DATA_DIRECTORY)
    DB_PATH = os.path.join(DATA_DIRECTORY, DB_FILENAME)
    LOGS_PATH = os.path.join(DATA_DIRECTORY, LOG_FILENAME)
    WEATHER_PATH = os.path.join(DATA_DIRECTORY, WEATHER_FILENAME)
    OTA_FILE_DIRECTORY_PATH = os.path.join(DATA_DIRECTORY, OTA_DIRECTORY)
    CONFIGURATION_FILE_PATH = os.path.join(DATA_DIRECTORY, CONFIGURATION_FILENAME)

#HTTP codes
HTTP_CODE_OK = 200
HTTP_CODE_BAD_REQUEST = 400
HTTP_CODE_UNAUTHORIZED = 401
HTTP_CODE_INTERNAL_SERVER_ERROR = 500

#Microservices
TELEGRAM_SERVICE_URL = "http://127.0.0.1:8000"
WEATHER_SERVICE_URL = "http://127.0.0.1:8001"

#region Load configuration file
WEATHER_SERVICE_ENABLED = False
WEATHER_LOCATION = ""
TELEGRAM_SERVICE_ENABLED = False
RPI_RF_ENABLED = False

WEATHER_API_KEY = ""
TELEGRAM_BOT_TOKEN = ""
TELEGRAM_CHAT_ID = ""
FLASK_ENCRYPTION_KEY = ""
MICROSERVICE_KEY = ""

################################################################################
#
#   @brief  Loads the configuration into RAM.
#
################################################################################
def load_configuration():
    global WEATHER_SERVICE_ENABLED
    global WEATHER_LOCATION
    global TELEGRAM_SERVICE_ENABLED
    global RPI_RF_ENABLED
    
    #Import configuration from configuration file
    with open(CONFIGURATION_FILE_PATH) as file:
        configuration = json.load(file)
        
    #Import configuration from configuration file
    WEATHER_SERVICE_ENABLED = configuration["WEATHER_SERVICE_ENABLED"] == 1
    WEATHER_LOCATION = configuration["WEATHER_LOCATION"]
    TELEGRAM_SERVICE_ENABLED = configuration["TELEGRAM_SERVICE_ENABLED"] == 1
    RPI_RF_ENABLED = configuration["RPI_RF_ENABLED"] == 1

################################################################################
#
#   @brief  Loads the configuration into RAM.
#
################################################################################
def load_credentials():
    global WEATHER_API_KEY
    global TELEGRAM_BOT_TOKEN
    global TELEGRAM_CHAT_ID
    global FLASK_ENCRYPTION_KEY
    global MICROSERVICE_KEY

    #Import configuration from WinCred or GNOME Keyring
    WEATHER_API_KEY = keyring.get_password(APPLICATION_NAME, WEATHER_API_KEY_NAME)
    TELEGRAM_BOT_TOKEN = keyring.get_password(APPLICATION_NAME, TELEGRAM_BOT_TOKEN_NAME)
    TELEGRAM_CHAT_ID = keyring.get_password(APPLICATION_NAME, TELEGRAM_CHAT_ID_NAME)
    FLASK_ENCRYPTION_KEY = keyring.get_password(APPLICATION_NAME, FLASK_ENCRYPTION_KEY_NAME)
    MICROSERVICE_KEY = keyring.get_password(APPLICATION_NAME, MICROSERVICE_KEY_NAME)
#endregion