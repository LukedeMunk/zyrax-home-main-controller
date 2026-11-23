################################################################################
#
# File:     devices.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Devices tables of the database.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import configuration constants and global variables
from logger import logi, logw, loge                                             #For logging functionality
from datetime import datetime, timedelta                                        #For update date and time
from sqlalchemy import exc, func, or_, and_                                     #Import exeptions to catch them
import re                                                                       #For checking passwords
from argon2.exceptions import VerifyMismatchError                               #For password verifying
from zxcvbn import zxcvbn                                                       #To verify the password strength

from server_manager import *                                                    #For database manipulation
from automation.domain import Capability

from . import database_core as core
from . import dashboards as m_dashboards


#region Device functionality
################################################################################
#
#   @brief  Adds a device to the database.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_device(config_dict):
    model = next((item for item in c.DEVICE_MODELS
                  if item["model_id"] == config_dict["model_id"]), None)
    if model is None and config_dict.get("role", "device") == "device":
        return False, c.TEXT_DEVICE_UNKNOWN_MODEL

    with app.app_context():
        integration_id = config_dict.get("integration_id")
        adapter_key = {
            c.DEVICE_TYPE_LEDSTRIP: "existing_devices",
            c.DEVICE_TYPE_RF_DEVICE: "rf_input"
        }.get(config_dict["type"])

        if integration_id is None and adapter_key is not None:
            integration = Integration.query.filter_by(type=adapter_key).first()
            if integration is not None:
                integration_id = integration.id

        device = Device(
            name=config_dict["name"],
            icon=config_dict["icon"],
            integration_id=integration_id,
            location_id=config_dict.get("location_id"),
            parent_device_id=(None if config_dict["type"] == c.DEVICE_TYPE_RF_DEVICE else config_dict.get("parent_device_id")),
            role=config_dict.get("role", "device"),
            type=config_dict["type"],
            model_id=config_dict["model_id"],
            category=model["category"] if model else config_dict["category"]
        )

        try:
            if "location" in config_dict:
                device.location_id = _resolve_location(config_dict["location"])

            db.session.add(device)
            db.session.flush()
            config_dict["id"] = device.id

            if config_dict.get("bridge_hostname"):
                db.session.add(BridgeHost(device_id=device.id, hostname=config_dict["bridge_hostname"]))

            if device.type == c.DEVICE_TYPE_LEDSTRIP:
                _add_ledstrip(config_dict)
                capabilities = list(Capability.LEDSTRIP)
                if config_dict["has_sensor"]:
                    capabilities.append("contact")

            elif device.type == c.DEVICE_TYPE_RF_DEVICE:
                _add_rf_device(config_dict)
                capabilities = {
                    c.DEVICE_CATEGORY_DOOR_SENSOR: ["contact"],
                    c.DEVICE_CATEGORY_MOTION_SENSOR: ["motion"],
                    c.DEVICE_CATEGORY_SWITCH: ["switch"],
                    c.DEVICE_CATEGORY_POWER_OUTLET: ["switch"],
                    c.DEVICE_CATEGORY_REMOTE: ["button"]
                }.get(device.category, [])

                if any(code["type"] == c.RF_CODE_TYPE_LOW_BATTERY
                       for code in model["rf_code_types"] or []):
                    capabilities.append("battery")
                    
            elif device.type == c.DEVICE_TYPE_IP_CAMERA:
                _add_camera(config_dict)
                capabilities = ["camera"]
            else:
                capabilities = []

            if capabilities:
                entity = Entity(device_id=device.id, external_id="main",
                                name=device.name, type="device")
                db.session.add(entity)
                db.session.flush()
                db.session.add_all([
                    EntityHasCapability(entity_id=entity.id, capability=name)
                    for name in capabilities
                ])
        except exc.IntegrityError:
            db.session.rollback()
            return False, c.TEXT_DEVICE_DUPLICATE

        success, error = core.commit_with_handling()
        return (True, config_dict["id"]) if success else (False, error)

################################################################################
#
#   @brief  Updates the specified device in the database.
#   @param  id                  Device ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_device(id, config_dict):
    with app.app_context():
        device = Device.query.filter_by(id=id).first()

        if device == None:
            logw("Could not find device with ID [" + str(id) + "]")
            return False, c.TEXT_DEVICE_NOT_FOUND
        
        #Look for included variables
        if "name" in config_dict:
            device.name = config_dict["name"]
            Entity.query.filter_by(device_id=id, external_id="main").update(
                {"name": device.name}, synchronize_session=False
            )

        if "bridge_hostname" in config_dict:
            db.session.merge(BridgeHost(device_id=id, hostname=config_dict["bridge_hostname"]))

        if device.type == c.DEVICE_TYPE_RF_DEVICE:
            device.parent_device_id = None
        elif "parent_device_id" in config_dict:
            device.parent_device_id = config_dict["parent_device_id"]

        if "location" in config_dict:
            device.location_id = _resolve_location(config_dict["location"])
        elif "location_id" in config_dict:
            device.location_id = config_dict["location_id"]

        if "icon" in config_dict:
            device.icon = config_dict["icon"]

        if "model_id" in config_dict:
            device.model_id = config_dict["model_id"]

        if "integration_id" in config_dict:
            device.integration_id = config_dict["integration_id"]

        if device.type == c.DEVICE_TYPE_LEDSTRIP:
            _update_ledstrip(id, config_dict)
        elif device.type == c.DEVICE_TYPE_RF_DEVICE:
            _update_rf_device(id, config_dict)
        elif device.type == c.DEVICE_TYPE_IP_CAMERA:
            _update_camera(id, config_dict)

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Device [" + device.name + "] updated")
        
    return True, ""

################################################################################
#
#   @brief  Finds or creates a room within the current device transaction.
#
################################################################################
def _resolve_location(name):
    if not name:
        return None

    location = Location.query.filter_by(name=name).first()
    if location is None:
        location = Location(name=name)
        db.session.add(location)
        db.session.flush()
    return location.id
        
################################################################################
#
#   @brief  Deletes the specified device from the database.
#   @param  id                  Device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_device(id):
    with app.app_context():
        device = Device.query.filter_by(id=id).first()
        
        if device is None:
            return False, c.TEXT_DEVICE_NOT_FOUND
        if Device.query.filter_by(parent_device_id=id).first() is not None:
            return False, c.TEXT_DEVICE_LINKED_FIRST
        Device.query.filter_by(id=id).delete()
        if device.type == c.DEVICE_TYPE_LEDSTRIP:
            LedstripDB.query.filter_by(id=id).delete()
            ModeHasModeParameter.query.filter_by(device_id=id).delete()
        if device.type == c.DEVICE_TYPE_RF_DEVICE:
            RfDevice.query.filter_by(id=id).delete()
            RfDeviceHasRfCode.query.filter_by(device_id=id).delete()
        if device.type == c.DEVICE_TYPE_IP_CAMERA:
            IpCamera.query.filter_by(id=id).delete()

        GroupHasDevice.query.filter_by(device_id=id).delete()

        groups = Group.query.all()
        deleted_group_ids = []

        for group in groups:
            number_of_devices = GroupHasDevice.query.filter_by(group_id=group.id).count()
            if number_of_devices == 0:
                deleted_group_ids.append(group.id)
                Group.query.filter_by(id=group.id).delete()
                logi("Deleted group, there was no device left in it")

        configurations = m_dashboards.get_dashboard_configurations()

        for configuration in configurations:
            for tile in configuration["tiles"]:
                if tile["type"] == c.TILE_TYPE_DATETIME:
                    continue
                if tile["type"] == c.TILE_TYPE_WEATHER:
                    continue

                if tile["type"] == c.TILE_TYPE_DEVICE:
                    if tile["device_id"] == id:
                        DashboardHasTile.query.filter_by(device_id=id).delete()

                if tile["type"] == c.TILE_TYPE_GROUP:
                    for group_id in deleted_group_ids:
                        if tile["group_id"] == group_id:
                            DashboardHasTile.query.filter_by(group_id=group_id).delete()
                            break

        return core.commit_with_handling()

################################################################################
#
#   @brief  Returns the devices in the database.
#   @param  type                Device type
#   @return list                Dictionary list with devices
#
################################################################################
def get_devices(type=None):
    with app.app_context():
        if type is None:
            devices = Device.query.all()
        else:
            devices = Device.query.filter_by(type=type).all()
    
    device_list = []
    for device in devices:
        device = core.row_to_dictionary(device)

        if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
            ledstrip = get_ledstrip(id=device["id"])
            device.update(ledstrip)
        elif device["type"] == c.DEVICE_TYPE_RF_DEVICE:
            rf_device = _get_rf_device(id=device["id"])
            device.update(rf_device)
        elif device["type"] == c.DEVICE_TYPE_IP_CAMERA:
            camera = _get_camera(id=device["id"])
            device.update(camera)
        
        device_list.append(device)

    return device_list

################################################################################
#
#   @brief  Returns the specified device.
#   @param  id                  Device ID
#   @return dict                Dictionary of the device
#
################################################################################
def get_device(id):
    with app.app_context():
        device = Device.query.filter_by(id=id).first()
    
    device = core.row_to_dictionary(device)
    if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
        ledstrip = get_ledstrip(id=device["id"])
        device.update(ledstrip)
    elif device["type"] == c.DEVICE_TYPE_RF_DEVICE:
        rf_device = _get_rf_device(id=device["id"])
        device.update(rf_device)
    elif device["type"] == c.DEVICE_TYPE_IP_CAMERA:
        camera = _get_camera(id=device["id"])
        device.update(camera)
        
    return device
#endregion

#region Ledstrip functionality
################################################################################
#
#   @brief  Adds a ledstrip to the database.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _add_ledstrip(config_dict):
    db.session.add(LedstripDB(
        id=config_dict["id"],
        icon_low_state=config_dict["icon_low_state"],
        hostname=config_dict["hostname"],
        api_version=config_dict.get("api_version", c.DEFAULT_LEDSTRIP_API_VERSION),
        has_sensor=config_dict["has_sensor"],
        number_of_leds=config_dict["number_of_leds"]
    ))
    core.add_default_mode_parameters(config_dict["id"], commit=False)


################################################################################
#
#   @brief  Updates the specified ledstrip.
#   @param  id                  Device ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_ledstrip(id, config_dict):
    ledstrip = LedstripDB.query.filter_by(id=id).first()

    if ledstrip == None:
        logw("Could not find ledstrip with ID [" + str(id) + "]")
        return

    #Look for included variables
    if "icon_low_state" in config_dict:
        ledstrip.icon_low_state = config_dict["icon_low_state"]

    if "power" in config_dict:
        ledstrip.power = config_dict["power"]

    if "hostname" in config_dict:
        ledstrip.hostname = config_dict["hostname"]

    if "ip_address" in config_dict:
        ledstrip.ip_address = config_dict["ip_address"]

    if "brightness" in config_dict:
        ledstrip.brightness = config_dict["brightness"]

    if "mode" in config_dict:
        ledstrip.mode = config_dict["mode"]

    if "power_animation" in config_dict:
        ledstrip.power_animation = config_dict["power_animation"]

    if "connection_status" in config_dict:
        ledstrip.connection_status = config_dict["connection_status"]

    if "leds" in config_dict:
        _update_ledstrip_leds(id, config_dict["leds"], config_dict["segments"])

    if "firmware_version" in config_dict:
        ledstrip.firmware_version = config_dict["firmware_version"]

    if "api_version" in config_dict:
        ledstrip.api_version = config_dict["api_version"]

    if "sd_card_inserted" in config_dict:
        ledstrip.sd_card_inserted = config_dict["sd_card_inserted"]

    if "sensor_state" in config_dict:
        ledstrip.sensor_state = config_dict["sensor_state"]

    if "has_sensor" in config_dict:
        ledstrip.has_sensor = config_dict["has_sensor"]

    if "sensor_inverted" in config_dict:
        ledstrip.sensor_inverted = config_dict["sensor_inverted"]

    if "sensor_model" in config_dict:
        ledstrip.sensor_model = config_dict["sensor_model"]


################################################################################
#
#   @brief  Updates the specified ledstrip's LED addressing.
#   @param  id                  Device ID
#   @param  leds                List of leds
#   @param  segments            List if segments (mainly for UI)
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_ledstrip_leds(id, leds, segments):
    #Delete old rows
    Pixel.query.filter_by(ledstrip_id=id).delete()
    PixelSegment.query.filter_by(ledstrip_id=id).delete()

    #Create new rows
    for segment in segments:
        db_segment = PixelSegment(ledstrip_id=id,
                            segment_index=segment["segment_index"],
                            type=segment["type"],
                            x1=segment["x1"],
                            y1=segment["y1"],
                            x2=segment["x2"],
                            y2=segment["y2"])
        
        db.session.add(db_segment)

    for led in leds:
        db_segment = PixelSegment.query.filter_by(ledstrip_id=id, segment_index=led["segment_index"]).first()
        db_led = Pixel(ledstrip_id=id,
                            segment_index=led["segment_index"],
                            index=led["index"],
                            address=led["address"])
        
        db.session.add(db_led)

    db_ledstrip = LedstripDB.query.filter_by(id=id).first()
    db_ledstrip.number_of_leds = len(leds)


################################################################################
#
#   @brief  Returns the specified ledstrip.
#   @param  id                  Device ID
#   @param  include_leds        If True, LED addressing is included
#   @return dict                Dictionary of the ledstrip
#
################################################################################
def get_ledstrip(id, include_leds=False):
    with app.app_context():
        ledstrip = LedstripDB.query.filter_by(id=id).first()

        ledstrip = core.row_to_dictionary(ledstrip)
        
        if not include_leds:
            return ledstrip
            
        segments_db = PixelSegment.query.filter_by(ledstrip_id=id).all()
        segments = []
        for segment in segments_db:
            segments.append(core.row_to_dictionary(segment))

        leds_db = Pixel.query.filter_by(ledstrip_id=id).all()
        leds = []
        for led in leds_db:
            led = core.row_to_dictionary(led)
            led.pop("id")
            led.pop("ledstrip_id")
            leds.append(led)

    ledstrip["segments"] = segments
    ledstrip["leds"] = leds

    return ledstrip

#region Ledstrip mode functionality
################################################################################
#
#   @brief  Configures the specified ledstrip mode.
#   @param  mode_id             Mode ID
#   @param  device_id           Device ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def configure_ledstrip_mode(mode_id, device_id, config_dict):
    mode_db = Mode.query.filter_by(id=mode_id).first()

    if mode_db is None:
        loge("No mode found with id " + str(id))
        return (False, "No mode found with id " + str(id))
    
    parameters_db = ModeHasModeParameter.query.filter_by(device_id=device_id, mode_id=mode_id).all()

    print(config_dict)
    for parameter in parameters_db:
        print(core.row_to_dictionary(parameter))
        for web_param in config_dict:
            if parameter.mode_parameter_id == web_param["id"]:
                parameter.value1 = web_param["value1"]
                parameter.value2 = web_param.get("value2")
                break

    success, error = core.commit_with_handling()

    if not success:
        return (success, error)
        
    logi("Updated mode configuration [" + mode_db.name + "]")

    return (True)

################################################################################
#
#   @brief  Returns the mode configurations of the specified ledstrip.
#   @param  device_id           Device ID
#   @return dict                Dictionary list with the mode configurations
#
################################################################################
def get_ledstrip_mode_configurations1(device_id):
    with app.app_context():
        mode_configs = []
        modes = Mode.query.all()

        for mode in modes:
            mode = core.row_to_dictionary(mode)
            parameters = ModeHasModeParameter.query.filter_by(mode_id=mode["id"], device_id=device_id).all()
            
            mode["parameters"] = []
            for parameter in parameters:
                parameter = core.row_to_dictionary(parameter)
                parameter_info = ModeParameter.query.filter_by(id=parameter["mode_parameter_id"]).first()

                parameter.pop("mode_parameter_id")

                parameter["name"] = parameter_info.name
                parameter["human_friendly_name"] = parameter_info.human_friendly_name
                parameter["type"] = parameter_info.type
                parameter["default_value"] = parameter_info.default_value
                parameter["minimum_value"] = parameter_info.minimum_value
                parameter["maximum_value"] = parameter_info.maximum_value
                
                mode["parameters"].append(parameter)

            mode_configs.append(mode)
            
    return mode_configs

################################################################################
#
#   @brief  Returns the mode configurations of the specified ledstrip.
#   @param  device_id           Device ID
#   @return dict                Dictionary list with the mode configurations
#
################################################################################
def get_ledstrip_mode_configurations(device_id):
    with app.app_context():
        modes = Mode.query.all()

        mode_configs = []
        for mode in modes:
            parameters = ModeHasModeParameter.query.filter_by(mode_id=mode.id, device_id=device_id).all()
            
            parameter_list = []
            for parameter in parameters:
                parameter_info = ModeParameter.query.filter_by(id=parameter.mode_parameter_id).first()
                parameter = core.row_to_dictionary(parameter)

                parameter["type"] = parameter_info.type
                parameter_list.append(parameter)

            mode = {
                "id": mode.id,
                "parameters": parameter_list
            }

            mode_configs.append(mode)
            
    return mode_configs

################################################################################
#
#   @brief  Returns the specified mode configuration of the specified ledstrip.
#   @param  mode_id             Mode ID
#   @param  device_id           Device ID
#   @return dict                Dictionary of the mode configuration
#
################################################################################
def get_ledstrip_mode_configuration(mode_id, device_id):
    with app.app_context():
        mode = Mode.query.filter_by(id=mode_id).first()
        parameters = ModeHasModeParameter.query.filter_by(mode_id=mode.id, device_id=device_id).all()
        
        parameter_list = []
        for parameter in parameters:
            parameter_info = ModeParameter.query.filter_by(id=parameter.mode_parameter_id).first()
            parameter = core.row_to_dictionary(parameter)

            parameter["type"] = parameter_info.type
            parameter_list.append(parameter)

        mode = {
            "id": mode.id,
            "parameters": parameter_list
        }
            
    return mode

################################################################################
#
#   @brief  Returns the ledstrip modes.
#   @return dict                Dictionary list with modes
#
################################################################################
def get_ledstrip_modes():
    with app.app_context():
        mode_list = []
        modes = Mode.query.all()

        for mode in modes:
            mode = {
                "id" : mode.id,
                "name" : mode.name
            }

            mode_list.append(mode)
            
    return mode_list
#endregion
#endregion

#region Sensor functionality
################################################################################
#
#   @brief  Adds an RF device to the database.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _add_rf_device(config_dict):
    rf_device = RfDevice(id=config_dict["id"])
    if "icon_low_state" in config_dict:
        rf_device.icon_low_state = config_dict["icon_low_state"]
    db.session.add(rf_device)

    model = next(item for item in c.DEVICE_MODELS
                 if item["model_id"] == config_dict["model_id"])
    for code, value in zip(model["rf_code_types"] or [], config_dict["rf_codes"]):
        db.session.add(RfDeviceHasRfCode(
            device_id=rf_device.id, name=code["name"],
            rf_code=value["rf_code"], type=code["type"]
        ))


################################################################################
#
#   @brief  Updates the specified RF device.
#   @param  id                  Device ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_rf_device(id, config_dict):
    rf_device = RfDevice.query.filter_by(id=id).first()

    if rf_device == None:
        logw("Could not find RF device with ID [" + str(id) + "]")
        return

    #Look for included variables
    if "icon_low_state" in config_dict:
        rf_device.icon_low_state = config_dict["icon_low_state"]

    if "state" in config_dict:
        rf_device.state = config_dict["state"]

    if "low_battery" in config_dict:
        rf_device.low_battery = config_dict["low_battery"]

    device = Device.query.filter_by(id=id).first()
    index = core.get_index_from_id(c.DEVICE_MODELS, device.model_id, "model_id")
    model_dict = c.DEVICE_MODELS[index]

    if "rf_codes" in config_dict:
        for i, code in enumerate(model_dict.get("rf_code_types") or []):
            rf_code = RfDeviceHasRfCode.query.filter_by(device_id=rf_device.id, type=code["type"]).first()
            if rf_code is None:
                rf_code = RfDeviceHasRfCode(device_id=rf_device.id, type=code["type"])
                db.session.add(rf_code)
            rf_code.name = config_dict["rf_codes"][i]["name"]
            rf_code.rf_code = config_dict["rf_codes"][i]["rf_code"]


################################################################################
#
#   @brief  Returns the specified RF device.
#   @param  id                  Device ID
#   @return dict                Dictionary of the RF device
#
################################################################################
def _get_rf_device(id):
    with app.app_context():
        rf_device = RfDevice.query.filter_by(id=id).first()
        rf_device = core.row_to_dictionary(rf_device)

        rf_codes = RfDeviceHasRfCode.query.filter_by(device_id=id).all()
        
        rf_device["rf_codes"] = []
        for code in rf_codes:
            code = core.row_to_dictionary(code)
            rf_device["rf_codes"].append(code)
            
    return rf_device

################################################################################
#
#   @brief  Returns the trigger times of the specified sensor.
#   @param  id                          Device ID
#   @param  number_of_last_triggers     Number of trigger times
#   @return list                        Dictionary list with trigger times
#
################################################################################
def get_sensor_trigger_times(id=None, number_of_last_triggers=50):
    trigger_list = []
    
    with app.app_context():
        if id is None:
            trigger_dates = RfDeviceIsTriggered.query.limit(number_of_last_triggers)
        else:
            trigger_dates = RfDeviceIsTriggered.query.filter_by(device_id=id).limit(number_of_last_triggers)
    
    for dt in trigger_dates:
        date = datetime.strftime(dt.datetime, "%d-%m-%Y")
        time = datetime.strftime(dt.datetime, "%H:%M:%S")
        
        dt = core.row_to_dictionary(dt)

        dt.pop("datetime")
        dt["date"] = date
        dt["time"] = time

        trigger_list.append(dt)

    trigger_list.reverse()

    return trigger_list

################################################################################
#
#   @brief  Adds a sensor triggered row for the specified sensor.
#   @param  id                  Device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def add_sensor_triggered(id):
    with app.app_context():
        row = RfDeviceIsTriggered(device_id=id, datetime=datetime.now(c.TIME_ZONE))
        
        db.session.add(row)
        
        return core.commit_with_handling()
#endregion

#region Camera functionality
################################################################################
#
#   @brief  Adds a camera to the database.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def _add_camera(config_dict):
    db.session.add(IpCamera(
        id=config_dict["id"],
        hostname=config_dict.get("hostname", config_dict["ip_address"]),
        ip_address=config_dict["ip_address"]
    ))


################################################################################
#
#   @brief  Updates the specified camera.
#   @param  id                  Device ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_camera(id, config_dict):
    camera = IpCamera.query.filter_by(id=id).first()

    if camera == None:
        logw("Could not find camera with ID [" + str(id) + "]")
        return

    #Look for included variables
    if "ip_address" in config_dict:
        camera.ip_address = config_dict["ip_address"]

    if "firmware_version" in config_dict:
        camera.firmware_version = config_dict["firmware_version"]

    if "connection_status" in config_dict:
        camera.connection_status = config_dict["connection_status"]


################################################################################
#
#   @brief  Returns the specified camera.
#   @param  id                  Device ID
#   @return dict                Dictionary of the camera
#
################################################################################
def _get_camera(id):
    with app.app_context():
        camera = IpCamera.query.filter_by(id=id).first()

    return core.row_to_dictionary(camera)
#endregion


################################################################################
#
#   @brief  Validates device registrations, catalog edits and LED settings.
#   @param  payload             Submitted device fields
#   @param  device              Existing device, or None for registration
#   @return dict                Validated device configuration
#
################################################################################
def validate_device(payload, device):
    name = payload.get("name", device.name if device else "")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 50:
        raise ValueError(c.TEXT_DEVICE_NAME_LENGTH)

    role = device.role if device else payload.get("role")
    if role not in ("device", "bridge"):
        raise ValueError(c.TEXT_DEVICE_ROLE_REQUIRED)

    model_id = device.model_id if device else payload.get("model_id")
    model = None
    if type(model_id) is int:
        model = next((item for item in c.DEVICE_MODELS if item["model_id"] == model_id), None)

    device_type = model["type"] if model is not None else None
    if device:
        device_type = device.type
    parent_id = _validate_catalog_parent(payload, device, role, device_type)
    config = {"name": name.strip(), "parent_device_id": parent_id}

    if "location" in payload:
        location = payload["location"]
        if not isinstance(location, str) or len(location.strip()) > 50:
            raise ValueError(c.TEXT_DEVICE_LOCATION_LENGTH)
        config["location"] = location.strip()
    if role == "bridge" and ("hostname" in payload or device is None):
        config["bridge_hostname"] = _validate_bridge_hostname(payload.get("hostname"))

    if device is not None:
        if device.type == c.DEVICE_TYPE_LEDSTRIP and parent_id is not None:
            raise ValueError(c.TEXT_DEVICE_LEDSTRIP_DIRECT)
        config.update(_validate_catalog_icons(payload, device.type))

        hardware_settings = {"hostname", "has_sensor", "sensor_inverted"}
        if device.type == c.DEVICE_TYPE_LEDSTRIP and hardware_settings.intersection(payload):
            settings = get_ledstrip(device.id)
            settings.update(payload)
            config.update(_validate_ledstrip_registration(settings))
            if "sensor_inverted" in payload:
                if type(payload["sensor_inverted"]) is not bool:
                    raise ValueError(c.TEXT_DEVICE_CONTACT_INVALID)
                config["sensor_inverted"] = payload["sensor_inverted"]
        return config

    if role == "bridge":
        config.update(
            role=role, model_id=-1,
            type=c.DEVICE_TYPE_BRIDGE,
            category=c.DEVICE_CATEGORY_BRIDGE,
            icon="fa-duotone fa-solid fa-network-wired"
        )
        return config

    if device_type not in (
        c.DEVICE_TYPE_RF_DEVICE, c.DEVICE_TYPE_IR_DEVICE, c.DEVICE_TYPE_LEDSTRIP
    ):
        raise ValueError(c.TEXT_DEVICE_MODEL_UNSUPPORTED)

    icon = model["icon"]
    config.update(model_id=model_id, type=device_type, icon=icon, icon_low_state=icon)

    if device_type == c.DEVICE_TYPE_LEDSTRIP:
        if parent_id is not None:
            raise ValueError(c.TEXT_DEVICE_LEDSTRIP_DIRECT)
        config.update(_validate_ledstrip_registration(payload))
    elif device_type == c.DEVICE_TYPE_RF_DEVICE:
        config["rf_codes"] = _validate_catalog_rf_codes(payload, model)

    return config


################################################################################
#
#   @brief  Validates the requested or existing bridge link.
#   @param  payload             Submitted device fields
#   @param  device              Existing device, or None for registration
#   @param  role                Device or bridge role
#   @param  device_type         Device type, if known
#   @return                     Bridge ID or None for a direct connection
#
################################################################################
def _validate_catalog_parent(payload, device, role, device_type):
    if role == "device" and device_type == c.DEVICE_TYPE_RF_DEVICE:
        if payload.get("parent_device_id") is not None:
            raise ValueError(c.TEXT_DEVICE_RF_BRIDGE_UNSUPPORTED)
        return None

    existing_parent_id = device.parent_device_id if device else None
    parent_id = payload.get("parent_device_id", existing_parent_id)
    if parent_id is None:
        return None

    if role != "device" or type(parent_id) is not int:
        raise ValueError(c.TEXT_DEVICE_BRIDGE_LINK_DEVICE_ONLY)
    parent = db.session.get(Device, parent_id)
    if parent is None or parent.role != "bridge":
        raise ValueError(c.TEXT_DEVICE_BRIDGE_REQUIRED)
    return parent_id


################################################################################
#
#   @brief  Validates and normalizes a submitted bridge hostname.
#   @param  hostname            Submitted hostname
#   @return str                 Normalized hostname
#
################################################################################
def _validate_bridge_hostname(hostname):
    if not isinstance(hostname, str):
        raise ValueError("Enter a bridge hostname.")

    hostname = hostname.strip()
    if not 1 <= len(hostname) <= 253:
        raise ValueError("Enter a bridge hostname.")

    hostname = hostname.lower()
    label_pattern = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    if not all(re.fullmatch(label_pattern, label) for label in hostname.split(".")):
        raise ValueError("Enter a valid bridge hostname.")
    return hostname


################################################################################
#
#   @brief  Validates the editable icon fields for the device type.
#   @param  payload             Submitted device fields
#   @param  device_type         Existing device type
#   @return dict                Validated icon changes
#
################################################################################
def _validate_catalog_icons(payload, device_type):
    fields = ["icon"]
    if device_type in (c.DEVICE_TYPE_LEDSTRIP, c.DEVICE_TYPE_RF_DEVICE):
        fields.append("icon_low_state")

    icons = {}
    for field in fields:
        if field not in payload:
            continue
        icon = payload[field]
        if not isinstance(icon, str) or len(icon) > 50:
            raise ValueError(c.TEXT_DEVICE_ICON_INVALID)
        if not re.fullmatch(r"fa-[a-z0-9-]+(?: fa-[a-z0-9-]+)*", icon):
            raise ValueError(c.TEXT_DEVICE_ICON_INVALID)
        icons[field] = icon
    return icons


################################################################################
#
#   @brief  Validates the connection and hardware fields for a new ledstrip.
#   @param  payload             Submitted device fields
#   @return dict                Validated ledstrip settings
#
################################################################################
def _validate_ledstrip_registration(payload):
    hostname = payload.get("hostname")
    if not isinstance(hostname, str) or not re.fullmatch(r"[a-zA-Z0-9.-]{1,20}", hostname):
        raise ValueError(c.TEXT_DEVICE_HOSTNAME_INVALID)
    if not hostname[0].isalnum() or not hostname[-1].isalnum():
        raise ValueError(c.TEXT_DEVICE_HOSTNAME_INVALID)

    count = payload.get("number_of_leds")
    if type(count) is not int or not 0 <= count <= c.MAX_NUMBER_OF_LEDS:
        raise ValueError(c.TEXT_DEVICE_LED_COUNT_INVALID.format(maximum=c.MAX_NUMBER_OF_LEDS))

    has_sensor = payload.get("has_sensor", False)
    if type(has_sensor) is not bool:
        raise ValueError(c.TEXT_DEVICE_CONTACT_INVALID)
    return {"hostname": hostname, "has_sensor": has_sensor, "number_of_leds": count}


################################################################################
#
#   @brief  Validates locally learned RF codes or defers learning to a bridge.
#   @param  payload             Submitted device fields
#   @param  model               Device model with expected RF code types
#   @return list                Validated RF code entries
#
################################################################################
def _validate_catalog_rf_codes(payload, model):
    codes = payload.get("rf_codes", [])
    if codes == [] and payload.get("learn_on_bridge") is True:
        return []

    expected_count = len(model["rf_code_types"] or [])
    if not isinstance(codes, list) or len(codes) != expected_count:
        raise ValueError(c.TEXT_DEVICE_RF_CODES_REQUIRED)
    if any(type(code) is not int or not 1 <= code <= 16777215 for code in codes):
        raise ValueError(c.TEXT_DEVICE_RF_CODES_INVALID)
    if len(set(codes)) != len(codes):
        raise ValueError(c.TEXT_DEVICE_RF_CODES_INVALID)
    return [{"rf_code": code} for code in codes]
