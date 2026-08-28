################################################################################
#
# File:     language_package_english.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Text constants used in the application.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
#User served messages
TEXT_SERVER_STARTED = "Webserver started"
TEXT_CREATED_DATABASE = "Database created successfully"
TEXT_NO_LOGS_FILE = "No logs folder found, creating one"
TEXT_NO_DATABASE_FOLDER = "No database folder found, creating one"
TEXT_NO_DATABASE = "No database found, creating one"
TEXT_NO_FILE_SELECTED = "No file selected"
TEXT_CONFIGURATION_FILE_UNSUPPORTED = "Configuration file not supported"
TEXT_FILE_NOT_SUPPORTED = "This file is not supported, please choose a 'jpg' or 'png' file"
TEXT_NO_CONFIGURATION_FILE_FOUND = "No configuration file found, creating configuration file"
TEXT_DATABASE_STATE_UNKNOWN = "XXX"
TEXT_PASSWORD_NOT_STRONG = "The password is not strong enough"
VAR_TEXT_SENSOR_TURNED_ON_DEVICE = "[{}] turned on [{}]"
VAR_TEXT_SENSOR_TURNED_OFF_DEVICE = "[{}] turned off [{}]"

VAR_TEXT_ADDED_DEVICE = "Added device [{}]"
VAR_TEXT_UPDATED_DEVICE = "Updated device [{}]"
VAR_TEXT_DELETED_DEVICE = "Deleted device [{}]"
VAR_TEXT_UPDATED_PASSWORD = "[{}] updated their password"
TEXT_PROFILE_NOT_FOUND = "Profile not found"
TEXT_ACCOUNT_NOT_FOUND = "Account not found"
TEXT_CANNOT_DELETE_YOURSELF = "You cannot delete yourself"
VAR_TEXT_ADDED_ACCOUNT = "[{}] added an account with email [{}]"
VAR_TEXT_UPDATED_ACCOUNT = "[{}] updated the account with email [{}]"
VAR_TEXT_DELETED_ACCOUNT = "[{}] deleted the account with email [{}]"
VAR_TEXT_ADDED_PROFILE = "[{}] added an profile with name [{}]"
VAR_TEXT_UPDATED_PROFILE = "[{}] updated the profile with name [{}]"
VAR_TEXT_LOGGED_IN = "[{}] logged in"
VAR_TEXT_USER_LOGGED_OUT = "[{}] logged out"
TEXT_NEED_TO_BE_LOGGED_IN = "Please login first"
TEXT_INVALID_FILE_TYPE = "Invalid file type"
VAR_TEXT_DELETED_PROFILE = "[{}] deleted the profile with name [{}]"

TEXT_WRONG_CREDENTIALS = "Email or password incorrect"

TEXT_CANNOT_BE_THE_SAME_PASSWORD = "Password cannot be the same"
TEXT_INVALID_CURRENT_PASSWORD = "Invalid current password"
TEXT_INVALID_PASSWORD = "Invalid password"
TEXT_NAME_ALREADY_EXISTS = "Name already exists, please choose another name"
TEXT_EMAIL_ALREADY_EXISTS = "Email already exists, please choose another email or login"

TEXT_SERVICE_STATE_RUNNING = "Service running"
TEXT_SERVICE_STATE_UNAVAILABLE = "Service unavailable"
TEXT_SERVICE_STATE_DISABLED = "Service disabled"
TEXT_SERVICE_STATE_MISSING_SEVICE_KEY = "Missing service key"
TEXT_SERVICE_STATE_INVALID_API_KEY = "Invalid API key"
TEXT_SERVICE_STATE_INVALID_LOCATION = "Invalid location"
TEXT_UNKNOWN_ERROR = "Unknown error"

WEEK_DAYS = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
]



TEXT_LEDSTRIP = "Ledstrip"
TEXT_DOOR_WINDOW_SENSOR = "Door/Window Sensor"
TEXT_MOTION_SENSOR = "Motion Sensor"
TEXT_SWITCH = "Switch"
TEXT_REMOTE = "Remote"
TEXT_POWER_OUTLET = "Power Outlet"
TEXT_CAMERA = "Camera"

TEXT_LEDSTRIPS = "Ledstrips"
TEXT_RF_DEVICES = "Rf Devices"
TEXT_CAMERAS = "Cameras"

TEXT_CONTACT_SWITCH = "Contact switch"
TEXT_RF_DOOR_WINDOW_SENSOR = "RF Door/Window Sensor"
TEXT_RF_PIR_MOTION_SENSOR = "RF PIR Motion Sensor"
TEXT_RF_TOGGLE_SWITCH = "RF Toggle Switch"
TEXT_RF_TAP_SWITCH = "RF Tap Switch"
TEXT_ROOM_CLEARED = "Room Cleared"
TEXT_PRESENCE_DETECTED = "Presence Detected"
TEXT_LOW_BATTERY = "Low Battery"
TEXT_TURNED_OFF = "Turned off"
TEXT_TURNED_ON = "Turned on"
TEXT_ACTIVATED = "Activated"
TEXT_RF_REMOTE_CONTROL = "RF Remote Control"
TEXT_RF_TOGGLE_POWER_OUTLET = "RF Toggle Power Outlet"
TEXT_RF_TAP_POWER_OUTLET = "RF Tap Power Outlet"
TEXT_ON = "On"
TEXT_OFF = "Off"
TEXT_OPEN = "Open"
TEXT_CLOSED = "Closed"
TEXT_TRIGGERED = "Triggered"
TEXT_IDLE = "Idle"
TEXT_ICON = "Icon"

TEXT_OPEN_SIGNAL = "Open signal"
TEXT_CLOSE_SIGNAL = "Close signal"
TEXT_ON_SIGNAL = "On signal"
TEXT_OFF_SIGNAL = "Off signal"
TEXT_TRIGGER_SIGNAL = "Trigger signal"
TEXT_LOW_BATTERY_SIGNAL = "Low battery signal"
TEXT_DUAL_SWEEP = "Dual Sweep"
TEXT_DEVICE = "Device"
TEXT_GROUP = "Group"
TEXT_DATE_AND_TIME = "Date & time"
TEXT_WEATHER = "Weather"
TEXT_ALARM = "Alarm"
TEXT_AUTOMATION = "Automation"

TEXT_DARK_BLUE = "Dark Blue"
TEXT_LIGHT_BLUE = "Light Blue"
TEXT_DARK_GREEN = "Dark Green"
TEXT_LIGHT_GREEN = "Light Green"

TEXT_SET_POWER = "Set power"
TEXT_UPDATE_COLOR = "Update color"
TEXT_UPDATE_MODE = "Update mode"
TEXT_TIME = "Time"
TEXT_SENSOR = "Sensor"
TEXT_SWITCH = "Switch"
TEXT_ENGLISH = "English"

VAR_TEXT_NO_INDEX_FOUND_WITH_ID = "Geen index gevonden van ID [{}] en key [{}]"
VAR_TEXT_DATABASE_ERROR = "Databasefout [{}]"
VAR_TEXT_DATABASE_INTEGRITY_ERROR = "Database integriteitsfout [{}]"

VAR_TEXT_COULD_NOT_CONNECT_TO_LEDSTRIP = "Could not connect to ledstrip [{}]"

TEXT_INITIALIZING_LEDSTRIPS = "Initializing ledstrips"
TEXT_DEVICE_MANAGER_STARTED = "Device manager started"
VAR_TEXT_IP_ALREADY_IN_UNCONFIGURED_LIST = "Strip with IP [{}] already in unconfigured ledstrip list"
VAR_TEXT_HOSTNAME_ALREADY_IN_UNCONFIGURED_LIST = "Strip with hostname [{}] already in unconfigured ledstrip list"

VAR_TEXT_CANNOT_UPDATE_LEDSTRIP = "Could not update ledstrip [{}], error [{}]"
TEXT_CANNOT_GET_STATES = "Cannot get states"
TEXT_CANNOT_GET_MODE_CONFIGURATIONS = "Cannot get mode configurations"


TEXT_SERVER_STARTED_IN_CONFIGURATION_MODE = "Application started in configuration mode"
TEXT_SERVER_STARTED_IN_DEVELOPMENT_MODE = "Application started in development mode"

VAR_TEXT_JSON_ERROR = "JSON error, string [{}]"
VAR_TEXT_CANNOT_BE_SEND = "[{}] could not be sent to [{}]"
VAR_TEXT_SEND_TO = "Sent [{}] to [{}]"
VAR_TEXT_AUTOMATION_EXECUTED = "Automation [{}] executed"
VAR_TEXT_WAITING_FOR_EXECUTING_AUTOMATION = "Waiting for [{}] minute and then execute automation"
TEXT_DEVICE_DISCONNECTED = "Device not connected"

VAR_TEXT_DELETED_DELAY_TIMER_SAME_ACTION = "Deleted automation delay timer [{}] because it has the same action"
VAR_TEXT_FIRMWARE_OF_LEDSTRIP_NOT_COMPATIBLE = "Firmware of [{}] is not compatible. Firmware [{}]"
VAR_TEXT_DASHBOARD_CONFIGURATION_NOT_FOUND = "Dashboard configuration with ID [{}] not found"
VAR_TEXT_DASHBOARD_TILE_NOT_FOUND = "Dashboard tile with ID [{}] not found"

TEXT_UPDATING_LEDSTRIP_FIRMWARE = "Updating firmware of the ledstrips"
TEXT_FIRMWARE_FILE_NOT_FOUND = "Firmware file not found"
TEXT_NOT_ALL_LEDSTRIPS_UPDATING = "Not all ledstrips are updating"

TEXT_COLOR = "Color"
TEXT_COLOR_1 = "Color 1"
TEXT_COLOR_2 = "Color 2"
TEXT_FADE = "Fade"
TEXT_GRADIENT = "Gradient"
TEXT_BLINK = "Blink"
TEXT_SCAN = "Scan"
TEXT_THEATER = "Theater"
TEXT_SINE = "Sine"
TEXT_BOUNCING_BALLS = "Bouncing Balls"
TEXT_DISSOLVE = "Dissolve"
TEXT_SPARKLE = "Sparkle"
TEXT_FIREWORKS = "Fireworks"
TEXT_FIRE = "Fire"
TEXT_SWEEP = "Sweep"
TEXT_COLOR_TWINKELS = "Color Twinkels"
TEXT_METEOR_RAIN = "Meteor Rain"
TEXT_COLOR_WAVES = "Color Waves"
TEXT_DRAWING = "Drawing"

VAR_TEXT_DATABASE_VERSION_DIFFERS = "Database version is [{}] and application version is [{}]. This can cause problems"
TEXT_FADE_DELAY2 = "Fade time of ?ms per frame"#TODO
TEXT_FADE_DELAY = "Fade delay of ?ms per frame"
TEXT_COLOR_RANGE = "Color range"
TEXT_MAXIMUM_COLOR_POSITION = "Maximum color position"
TEXT_WAVE_LENGTH = "Wave length of ? LEDs"
TEXT_SEGMENT_SIZE = "Segment size of ? LEDs"
TEXT_TAIL_LENGTH = "Tail length of ? LEDs"
TEXT_DIRECTION = "? direction"
TEXT_NUMBER_OF_ELEMENTS = "? elements"


TEXT_DELAY_BETWEEN = "?ms between actions"
TEXT_DELAY_RANDOMNESS = "?% randomness in the delay"
TEXT_INTENSITY = "Intensity of ?"
TEXT_COLOR_PALETTE = "Color palette"
TEXT_FADE_LENGTH = "Number of leds fading ?"
