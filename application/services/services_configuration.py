################################################################################
#
# File:     configuration.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Contains configuration variables for service scripts.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import os                                                                       #For file handling

APPLICATION_NAME = "ZyraX_Home"

#Paths config
PATH = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))             #Current folder path
WEATHER_FILENAME = "weather.json"                                               #File name of weather information
DATA_DIRECTORY = "data"

PRODUCTION_MODE = True
if os.name == "nt":
    PRODUCTION_MODE = False

LINUX_SYSTEM_DIRECTORY = os.path.join("/etc", APPLICATION_NAME)

if PRODUCTION_MODE:
    WEATHER_PATH = os.path.join(LINUX_SYSTEM_DIRECTORY, DATA_DIRECTORY, WEATHER_FILENAME)
else:
    WEATHER_PATH = os.path.join(PATH, DATA_DIRECTORY, WEATHER_FILENAME)

#URL configuration
TELEGRAM_SERVICE_URL = "http://127.0.0.1:8000"
WEATHER_SERVICE_URL = "http://127.0.0.1:8001"

#HTTP codes
HTTP_CODE_OK = 200
HTTP_CODE_BAD_REQUEST = 400
HTTP_CODE_UNAUTHORIZED = 401
HTTP_CODE_INTERNAL_SERVER_ERROR = 500
HTTP_CODE_SERVICE_UNAVAILABLE = 503

WEEK_DAYS = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
]
#endregion