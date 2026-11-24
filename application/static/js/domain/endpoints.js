/****************************************************************************/
/*
 * File:    endpoints.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Defines the versioned controller API endpoints.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/
export const MASTER_API_VERSION = "v1";
export const API_URL_PREFIX = "/api/" + MASTER_API_VERSION;

export const API_URL_ACCOUNT_PREFIX = "/account";
export const API_URL_DEVICE_PREFIX = "/device";
export const API_URL_HUB_PREFIX = API_URL_DEVICE_PREFIX + "/hub";
export const API_URL_LEDSTRIP_PREFIX = API_URL_DEVICE_PREFIX + "/ledstrip";
export const API_URL_LOCATION_PREFIX = "/location";
export const API_URL_GROUP_PREFIX = "/group";
export const API_URL_AUTOMATION_PREFIX = "/automation";
export const API_URL_DASHBOARD_PREFIX = "/dashboard";
export const API_URL_ALARM_PREFIX = "/alarm";
export const API_URL_APPLICATION_PREFIX = "/application";

//Accounts and profiles
export const API_URL_LOGIN = API_URL_PREFIX + "/login";
export const API_URL_LOGOUT = API_URL_PREFIX + "/logout";

export const API_URL_PICK_PROFILE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/pick_profile";
export const API_URL_ADD_ACCOUNT = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/add";
export const API_URL_UPDATE_ACCOUNT = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/update";
export const API_URL_DELETE_ACCOUNT = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/delete";
export const API_URL_UPDATE_PASSWORD = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/update_password";
export const API_URL_RESET_PASSWORD = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/reset_password";
export const API_URL_ADD_PROFILE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/add_profile";
export const API_URL_UPDATE_PROFILE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/update_profile";
export const API_URL_DELETE_PROFILE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/delete_profile";
export const API_URL_GET_PROFILES = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/get_profiles";
export const API_URL_UPLOAD_PROFILE_PICTURE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/upload_profile_picture";
export const API_URL_GET_PROFILE_PICTURE = API_URL_PREFIX + API_URL_ACCOUNT_PREFIX + "/get_profile_picture";

//Devices
export const API_URL_GET_DEVICES = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/list";
export const API_URL_ADD_DEVICE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/add";
export const API_URL_UPDATE_DEVICE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/update";
export const API_URL_DELETE_DEVICE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/delete";
export const API_URL_GET_UNCONFIGURED_DEVICES = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/list_unconfigured"; // endpoint for found bt devices
export const API_URL_GET_NETWORK_DEVICES = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/list_network_devices";
export const API_URL_CHECK_CONNECTION_STATUS = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/check_connection";
export const API_URL_SET_DEVICE_POWER = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/set_power";
export const API_URL_SET_GROUP_POWER = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/set_group_power";
export const API_URL_DEVICE_CONNECTION_REQUEST = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/connect";
export const API_URL_SET_OTA_STATE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/set_ota_state";
export const API_URL_UPLOAD_FIRMWARE_FILE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/upload_firmware_file";
export const API_URL_GET_OTA_PROGRESS = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/get_ota_progress";
export const API_URL_DOWNLOAD_FIRMWARE_FILE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/download_firmware_file";
export const API_URL_REBOOT_DEVICE = API_URL_PREFIX + API_URL_DEVICE_PREFIX + "/reboot";

//Hub
export const API_URL_START_HUB_LEARNING_SESSION = API_URL_PREFIX + API_URL_HUB_PREFIX + "/start_learning";
export const API_URL_GET_HUB_LEARNING_STATUS = API_URL_PREFIX + API_URL_HUB_PREFIX + "/get_learning_status";
export const API_URL_SAVE_HUB_LEARNING_RESULT = API_URL_PREFIX + API_URL_HUB_PREFIX + "/save_learning_result";
export const API_URL_CANCEL_HUB_LEARNING_SESSION = API_URL_PREFIX + API_URL_HUB_PREFIX + "/cancel_learning";
export const API_URL_RENAME_CUSTOM_CODE = API_URL_PREFIX + API_URL_HUB_PREFIX + "/rename_code";
export const API_URL_DELETE_CUSTOM_CODE = API_URL_PREFIX + API_URL_HUB_PREFIX + "/delete_code";
export const API_URL_TRANSMIT_CODE = API_URL_PREFIX + API_URL_HUB_PREFIX + "/transmit";
export const API_URL_GET_HUB_STATUS = API_URL_PREFIX + API_URL_HUB_PREFIX + "/get_status";
export const API_URL_HUB_SIGNAL_RECEIVED = API_URL_PREFIX + API_URL_HUB_PREFIX + "/hub_signal";

//LED strips

export const API_URL_LEDSTRIP_SET_BRIGHTNESS = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/set_brightness";
export const API_URL_LEDSTRIP_SET_MODE = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/set_mode";
export const API_URL_LEDSTRIP_SET_POWER_ANIMATION = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/set_power_animation";
export const API_URL_LEDSTRIP_GROUP_SET_POWER_ANIMATION = API_URL_LEDSTRIP_SET_POWER_ANIMATION;
export const API_URL_UPDATE_LEDSTRIP_LEDS = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/configure_leds";
export const API_URL_DRAW_REALTIME_LEDS = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/draw";
export const API_URL_CONFIGURE_LEDSTRIP_MODE = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/configure_mode";
export const API_URL_SET_LEDSTRIP_SENSOR_STATE = API_URL_PREFIX + API_URL_LEDSTRIP_PREFIX + "/set_sensor_state";

//Groups
export const API_URL_LOCATIONS = API_URL_PREFIX + "/locations";
export const API_URL_ADD_LOCATION = API_URL_PREFIX + API_URL_LOCATION_PREFIX + "/add";
export const API_URL_UPDATE_LOCATION = API_URL_PREFIX + API_URL_LOCATION_PREFIX + "/update";
export const API_URL_DELETE_LOCATION = API_URL_PREFIX + API_URL_LOCATION_PREFIX + "/delete";
export const API_URL_ADD_GROUP = API_URL_PREFIX + API_URL_GROUP_PREFIX + "/add";
export const API_URL_UPDATE_GROUP = API_URL_PREFIX + API_URL_GROUP_PREFIX + "/update";
export const API_URL_DELETE_GROUP = API_URL_PREFIX + API_URL_GROUP_PREFIX + "/delete";

//Automations
export const API_URL_ADD_AUTOMATION = API_URL_PREFIX + API_URL_AUTOMATION_PREFIX + "/add";
export const API_URL_UPDATE_AUTOMATION = API_URL_PREFIX + API_URL_AUTOMATION_PREFIX + "/update";
export const API_URL_DELETE_AUTOMATION = API_URL_PREFIX + API_URL_AUTOMATION_PREFIX + "/delete";
export const API_URL_RUN_AUTOMATION = API_URL_PREFIX + API_URL_AUTOMATION_PREFIX + "/run";
export const API_URL_GET_AUTOMATION_RUNS = API_URL_PREFIX + API_URL_AUTOMATION_PREFIX + "/get_runs";

//Dashboard
export const API_URL_ADD_DASHBOARD_CONFIGURATION = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/add";
export const API_URL_UPDATE_DASHBOARD_CONFIGURATION = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/update";
export const API_URL_DELETE_DASHBOARD_CONFIGURATION = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/delete";
export const API_URL_ADD_DASHBOARD_TILE = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/add_tile";
export const API_URL_UPDATE_DASHBOARD_TILE = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/update_tile";
export const API_URL_DELETE_DASHBOARD_TILE = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/delete_tile";
export const API_URL_RESET_DASHBOARD_TILE_ORDER = API_URL_PREFIX + API_URL_DASHBOARD_PREFIX + "/reset_order";

//Alarm
export const API_URL_UPDATE_ALARM = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/update";
export const API_URL_ADD_DEACTIVATION_DEVICE = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/add_deactivation_device";
export const API_URL_UPDATE_DEACTIVATION_DEVICE = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/update_deactivation_device";
export const API_URL_DELETE_DEACTIVATION_DEVICE = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/delete_deactivation_device";
export const API_URL_ADD_ALARM_TRIGGER_DEVICE = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/add_trigger_device";
export const API_URL_DELETE_ALARM_TRIGGER_DEVICE = API_URL_PREFIX + API_URL_ALARM_PREFIX + "/delete_trigger_device";

//Application
export const API_URL_UPDATE_WEATHER_CONFIGURATION = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/update_weather_configuration";
export const API_URL_UPDATE_TELEGRAM_CONFIGURATION = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/update_telegram_configuration";
export const API_URL_MARK_LOGS_READ = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/mark_logs_read";
export const API_URL_RESET_CONFIGURATION = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/reset_configuration";
export const API_URL_GET_WEATHER_FORECAST = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/get_weather_forecast";
export const API_URL_REBOOT_APPLICATION = API_URL_PREFIX + API_URL_APPLICATION_PREFIX + "/reboot";
