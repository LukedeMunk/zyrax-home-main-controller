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
    index = core.get_index_from_id(c.DEVICE_MODELS, config_dict["model_id"], "model_id")

    config_dict["category"] = c.DEVICE_MODELS[index]["category"]

    with app.app_context():
        device = Device(name=config_dict["name"],
                        icon=config_dict["icon"],
                        integration_id=config_dict.get("integration_id"),
                        type=config_dict["type"],
                        model_id=config_dict["model_id"],
                        category=config_dict["category"])
        
        db.session.add(device)

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        config_dict["id"] = device.id

    if config_dict["type"] == c.DEVICE_TYPE_LEDSTRIP:
        _add_ledstrip(config_dict)
    elif config_dict["type"] == c.DEVICE_TYPE_RF_DEVICE:
        _add_rf_device(config_dict)
    elif config_dict["type"] == c.DEVICE_TYPE_IP_CAMERA:
        _add_camera(config_dict)
        
    return (True, config_dict["id"])

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
            return
        
        #Look for included variables
        if "name" in config_dict:
            device.name = config_dict["name"]

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
        
    return (True)
        
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
    with app.app_context():
        ledstrip = LedstripDB(id=config_dict["id"],
                                icon_low_state=config_dict["icon_low_state"],
                                hostname=config_dict["hostname"],
                                has_sensor=config_dict["has_sensor"],
                                number_of_leds=config_dict["number_of_leds"])
                                
        db.session.add(ledstrip)

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

        core.add_default_mode_parameters(config_dict["id"])
    
    return (True)
    
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
    with app.app_context():
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

        return core.commit_with_handling()

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

    return core.commit_with_handling()

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
    with app.app_context():
        rf_device = RfDevice(id=config_dict["id"])

        if "icon_low_state" in config_dict:
            rf_device.icon_low_state = config_dict["icon_low_state"]
        
        db.session.add(rf_device)

        index = core.get_index_from_id(c.DEVICE_MODELS, config_dict["model_id"], "model_id")
        model_dict = c.DEVICE_MODELS[index]
        print(model_dict)
        
        for i, code in enumerate(model_dict.get("rf_code_types") or []):
            db.session.add(RfDeviceHasRfCode(device_id=rf_device.id,
                                                name=config_dict["rf_codes"][i]["name"],
                                                rf_code=config_dict["rf_codes"][i]["rf_code"],# hier bezig
                                                type=code["type"]))

        return core.commit_with_handling()
        
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
    with app.app_context():
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
                rf_code.name = config_dict["rf_codes"][i]["name"]
                rf_code.rf_code = config_dict["rf_codes"][i]["rf_code"]

        return core.commit_with_handling()

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
    with app.app_context():
        camera = IpCamera(id=config_dict["id"],
                                ip_address=config_dict["ip_address"])
                                
        db.session.add(camera)
    
        return (True, camera.id)
    
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
    with app.app_context():
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

        return core.commit_with_handling()

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
