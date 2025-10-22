################################################################################
#
# File:     database_utility.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Wrapper for the database. Handles all database transactions.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
from server_manager import *                                                    #
from sqlalchemy import exc                                                      #Import exceptions to catch them
from logger import logi, logw, loge                                             #Import logging functions
from argon2.exceptions import VerifyMismatchError                               #For password verifying
from zxcvbn import zxcvbn                                                       #To verify the password strength
from argon2 import PasswordHasher                                               #For password hashing with Argon2 algoritm
import re                                                                       #Import regex to be able to check passwords
from cryptography.fernet import Fernet                                          #For encrypting first account data
from urllib.parse import quote                                                  #For logging database errors in a JSON file


ph = PasswordHasher(hash_len=128, salt_len=128)                                 #To hash and verify passwords, total length: 256

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
    config_dict["category"] = c.DEVICE_MODELS[config_dict["model_id"]]["category"]

    with app.app_context():
        device = Device(name=config_dict["name"],
                        icon=config_dict["icon"],
                        type=config_dict["type"],
                        model_id=config_dict["model_id"],
                        category=config_dict["category"])
        
        db.session.add(device)

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
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

        if device.type == c.DEVICE_TYPE_LEDSTRIP:
            _update_ledstrip(id, config_dict)
        elif device.type == c.DEVICE_TYPE_RF_DEVICE:
            _update_rf_device(id, config_dict)
        elif device.type == c.DEVICE_TYPE_IP_CAMERA:
            _update_camera(id, config_dict)

        try:
            db.session.commit()
            logi("Device [" + device.name + "] updated")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
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

        configurations = get_dashboard_configurations()

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

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
            
    return (True)

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
        device = _row_to_dictionary(device)

        if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
            ledstrip = _get_ledstrip(id=device["id"])
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
    
    device = _row_to_dictionary(device)
    if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
        ledstrip = _get_ledstrip(id=device["id"])
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

       #try:
       #    db.session.commit()
       #except exc.SQLAlchemyError as e:
       #    loge("New ledstrip could not be added: " + config_dict["name"] + ". Error code: " + str(e))

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        _add_default_mode_parameters(config_dict["id"])
    
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

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

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

    try:
        db.session.commit()
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Returns the specified ledstrip.
#   @param  id                  Device ID
#   @param  include_leds        If True, LED addressing is included
#   @return dict                Dictionary of the ledstrip
#
################################################################################
def _get_ledstrip(id, include_leds=False):
    with app.app_context():
        ledstrip = LedstripDB.query.filter_by(id=id).first()

        ledstrip = _row_to_dictionary(ledstrip)
        
        if not include_leds:
            return ledstrip
            
        segments_db = PixelSegment.query.filter_by(ledstrip_id=id).all()
        segments = []
        for segment in segments_db:
            segments.append(_row_to_dictionary(segment))

        leds_db = Pixel.query.filter_by(ledstrip_id=id).all()
        leds = []
        for led in leds_db:
            led = _row_to_dictionary(led)
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

    for parameter in parameters_db:
        for web_param in config_dict:
            if parameter.id == web_param["id"]:
                parameter.value = web_param["value"]
                break
        
    try:
        db.session.commit()
        logi("Updated mode configuration [" + mode_db.name + "]")
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True)

################################################################################
#
#   @brief  Returns the mode configurations of the specified ledstrip.
#   @param  device_id           Device ID
#   @return dict                Dictionary list with the mode configurations
#
################################################################################
def get_ledstrip_mode_configurations(device_id):
    with app.app_context():
        mode_configs = []
        modes = Mode.query.all()

        for mode in modes:
            mode = _row_to_dictionary(mode)
            parameters = ModeHasModeParameter.query.filter_by(mode_id=mode["id"], device_id=device_id).all()
            
            mode["parameters"] = []
            for parameter in parameters:
                parameter = _row_to_dictionary(parameter)
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
#   @brief  Returns the specified mode configuration of the specified ledstrip.
#   @param  mode_id             Mode ID
#   @param  device_id           Device ID
#   @return dict                Dictionary of the mode configuration
#
################################################################################
def get_ledstrip_mode_configuration(mode_id, device_id):
    with app.app_context():
        mode = Mode.query.filter_by(id=mode_id).first()
        mode = _row_to_dictionary(mode)

        parameters = ModeHasModeParameter.query.filter_by(mode_id=mode["id"], device_id=device_id).all()
        
        mode["parameters"] = []
        for parameter in parameters:
            parameter = _row_to_dictionary(parameter)
            parameter_info = ModeParameter.query.filter_by(id=parameter["mode_parameter_id"]).first()

            parameter.pop("mode_parameter_id")

            parameter["name"] = parameter_info.name
            parameter["human_friendly_name"] = parameter_info.human_friendly_name
            parameter["type"] = parameter_info.type
            parameter["default_value"] = parameter_info.default_value
            parameter["minimum_value"] = parameter_info.minimum_value
            parameter["maximum_value"] = parameter_info.maximum_value
            
            mode["parameters"].append(parameter)
            
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

        model_dict = c.DEVICE_MODELS[config_dict["model_id"]]
        print(model_dict)
        
        for i, code in enumerate(model_dict["rf_code_types"]):
            db.session.add(RfDeviceHasRfCode(device_id=rf_device.id,
                                                name=config_dict["rf_codes"][i]["name"],
                                                rf_code=config_dict["rf_codes"][i]["rf_code"],# hier bezig
                                                type=code["type"]))

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)
        
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
        model_dict = c.DEVICE_MODELS[int(device.model_id)]
        
        if "rf_codes" in config_dict:
            for i, code in enumerate(model_dict["rf_code_types"]):
                rf_code = RfDeviceHasRfCode.query.filter_by(device_id=rf_device.id, type=code["type"]).first()
                rf_code.name = config_dict["rf_codes"][i]["name"]
                rf_code.rf_code = config_dict["rf_codes"][i]["rf_code"]

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True)

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
        rf_device = _row_to_dictionary(rf_device)

        rf_codes = RfDeviceHasRfCode.query.filter_by(device_id=id).all()
        
        rf_device["rf_codes"] = []
        for code in rf_codes:
            code = _row_to_dictionary(code)
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
        
        dt = _row_to_dictionary(dt)

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

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)
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

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
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

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True)

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

    return _row_to_dictionary(camera)
#endregion

#region Group functionality
################################################################################
#
#   @brief  Adds a group to the database.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_group(config_dict):
    with app.app_context():
        group = Group(name=config_dict["name"],
                      icon=config_dict["icon"],
                      type=config_dict["type"])
        
        db.session.add(group)
        db.session.flush()                                                      #Flush to database to get the ID

        for device in config_dict["device_ids"]:
            db.session.add(GroupHasDevice(
                group_id=group.id,
                device_id=device
            ))
        
        try:
            db.session.commit()
            logi("Added group [" + config_dict["name"] + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
        return (True, group.id)

################################################################################
#
#   @brief  Updates the specified group.
#   @param  id                  Group ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_group(id, config_dict):
    with app.app_context():
        group = Group.query.filter_by(id=id).first()

        #Look for included variables
        if "name" in config_dict:
            group.name = config_dict["name"]

        if "icon" in config_dict:
            group.icon = config_dict["icon"]

        if "type" in config_dict:
            group.type = config_dict["type"]

        if "device_ids" in config_dict:
            GroupHasDevice.query.filter_by(group_id=id).delete()

            for device in config_dict["device_ids"]:
                db.session.add(GroupHasDevice(
                    group_id=group.id,
                    device_id=device
                ))

        try:
            db.session.commit()
            logi("Updated group [" + group.name + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Deletes the specified group.
#   @param  id                  Group ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_group(id):
    with app.app_context():
        group = Group.query.filter_by(id=id).first()

        if group == None:
            logw("Could not find group with ID [" + str(id) + "]")
            return
        
        GroupHasDevice.query.filter_by(group_id=id).delete()
        Group.query.filter_by(id=id).delete()

        configurations = get_dashboard_configurations()

        for configuration in configurations:
            for tile in configuration["tiles"]:
                if tile["type"] == c.TILE_TYPE_DATETIME:
                    continue
                if tile["type"] == c.TILE_TYPE_WEATHER:
                    continue
                if tile["type"] == c.TILE_TYPE_ALARM:
                    continue

                if tile["type"] == c.TILE_TYPE_DEVICE:
                    continue

                if tile["type"] == c.TILE_TYPE_GROUP:
                    if tile["group_id"] == id:
                        DashboardHasTile.query.filter_by(group_id=id).delete()
                        break

        try:
            db.session.commit()
            logi("Deleted group [" + group.name + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Returns the specified group.
#   @param  id                  Group ID
#   @return dict                Dictionary of the group
#
################################################################################
def get_group(id):
    with app.app_context():
        group = Group.query.filter_by(id=id).first()

    group = _row_to_dictionary(group)
    group["device_ids"] = _get_group_device_ids(group["id"])

    return group

################################################################################
#
#   @brief  Returns the groups in the database.
#   @param  type                Group type
#   @return list                Dictionary list with groups
#
################################################################################
def get_groups(type=None):
    with app.app_context():
        if type is None:
            groups = Group.query.all()
        else:
            groups = Group.query.filter_by(type=type).all()

    group_list = []
    for group in groups:
        group = _row_to_dictionary(group)
        group["device_ids"] = _get_group_device_ids(group["id"])
        group_list.append(group)
    
    return group_list
    
################################################################################
#
#   @brief  Returns the device IDs of the devices in the specified group.
#   @param  id                  Group ID
#   @return list                List with device IDs
#
################################################################################
def _get_group_device_ids(id):
    with app.app_context():
        devices = GroupHasDevice.query.filter_by(group_id=id).all()

        device_list = []
        for device in devices:
            device_list.append(device.device_id)
            
    return device_list
#endregion

#region Automation functionality
################################################################################
#
#   @brief  Adds an automation to the database.
#   @param  automation_dict     Dictionary of the automation
#   @param  inverted_automation When True, a copy with the inverted trigger
#                               state and action is created
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_automation(automation_dict, inverted_automation=False):
    with app.app_context():
        automation = Automation(name = automation_dict["name"],
                            action = automation_dict["action"],
                            trigger = automation_dict["trigger"],
                            is_inverted_automation = inverted_automation)

        #Time window
        if inverted_automation and automation_dict["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
            automation_dict["time"] = automation_dict["inverted_action_time"]

        if automation_dict["trigger"] == c.AUTOMATION_TRIGGER_SENSOR:
            automation.time_window_activated = automation_dict["time_window_activated"]
            automation.activate_during_time_window = automation_dict["activate_during_time_window"]
            
            if automation_dict["time_window_activated"] == 1:
                automation.time_window_start_minutes = automation_dict["time_window_start_minutes"]
                automation.time_window_end_minutes = automation_dict["time_window_end_minutes"]

            automation.delay_minutes = automation_dict["delay_minutes"]

        if automation_dict["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
            automation.delay_minutes = automation_dict["delay_minutes"]

        db.session.add(automation)
        db.session.flush()                                                      #Flush to database to get the ID

        for device in automation_dict["target_device_ids"]:
            db.session.add(AutomationHasTargetDevice(
                automation_id=automation.id,
                device_id=device
            ))

        #Trigger
        if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
            db.session.add(AutomationHasTriggerTime(automation_id=automation.id, days=automation_dict["days"], time=automation_dict["time"]))

        if automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
            for device in automation_dict["trigger_device_ids"]:
                db.session.add(AutomationHasTriggerDevice(
                    automation_id=automation.id,
                    device_id=device,
                    trigger_state=automation_dict["trigger_state"]
                ))

        if automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
            for device in automation_dict["trigger_device_ids"]:
                db.session.add(AutomationHasTriggerDevice(
                    automation_id=automation.id,
                    device_id=device,
                    trigger_state=automation_dict["trigger_state"]
                ))

        #Look for included variables
        if automation_dict.get("parameters"):
            for parameter in automation_dict["parameters"]:
                db.session.add(AutomationHasParameter(
                    automation_id=automation.id,
                    name=parameter["name"],
                    value=parameter["value"]))

        try:
            db.session.commit()
            logi("Added automation [" + automation_dict["name"] + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        if not inverted_automation and automation_dict["inverted_automation_copy_id"] != -1:
            if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, None, automation_dict["inverted_action_time"])
            elif automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, automation_dict["inverted_delay_minutes"])
            elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, automation_dict["inverted_delay_minutes"])

            try:
                db.session.commit()
            except exc.SQLAlchemyError as e:
                loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
                return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        return (True, automation.id)

################################################################################
#
#   @brief  Creates an inverted automation copy.
#   @param  id                  Automation ID
#   @param  delay_minutes       Minutes to delay the sensor triggered action 
#                               after a trigger
#   @param  time                Time for the inverted timed action
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def create_inverted_automation_copy(id, delay_minutes=None, time=None):
    automation = get_automation(id)
    automation["name"] += "_inverted"
    automation["inverted_automation_copy_id"] = -1

    if delay_minutes is not None:
        automation["delay_minutes"] = delay_minutes
    else:
        automation.pop("delay_minutes")

    if time is not None:
        automation["inverted_action_time"] = time

    if automation["trigger"] != c.AUTOMATION_TRIGGER_TIMER:
        if automation["trigger_state"] == 1:
            automation["trigger_state"] = 0
        else:
            automation["trigger_state"] = 1

    for i, parameter in enumerate(automation["parameters"]):
        if parameter["name"] == "power":
            if automation["parameters"][i]["value"] == 1:
                automation["parameters"][i]["value"] = 0
            else:
                automation["parameters"][i]["value"] = 1
            break

    result = add_automation(automation, True)
    if not result[0]:
        return -1

    return result[1]

################################################################################
#
#   @brief  Updates the specified automation.
#   @param  id                  Automation ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_automation(id, config_dict):
    with app.app_context():
        automation = Automation.query.filter_by(id=id).first()

        if automation == None:
            logw("Could not find automation with ID [" + str(id) + "]")
            return
        
        #Look for included variables
        if "name" in config_dict:
            automation.name = config_dict["name"]

        if "enabled" in config_dict:
            automation.enabled = config_dict["enabled"]

        if "action" in config_dict:
            automation.action = config_dict["action"]

        if "target_device_ids" in config_dict:
            _update_automation_target_devices(id, config_dict["target_device_ids"])
            
        if "parameters" in config_dict:
            _update_automation_parameters(id, config_dict["parameters"])

        if "trigger" in config_dict:
            automation.trigger = config_dict["trigger"]

        if "time_window_activated" in config_dict:
            automation.time_window_activated = config_dict["time_window_activated"]

        if "activate_during_time_window" in config_dict:
            automation.activate_during_time_window = config_dict["activate_during_time_window"]

        if "time_window_start_minutes" in config_dict:
            automation.time_window_start_minutes = config_dict["time_window_start_minutes"]

        if "time_window_end_minutes" in config_dict:
            automation.time_window_end_minutes = config_dict["time_window_end_minutes"]

        if "delay_minutes" in config_dict:
            automation.delay_minutes = config_dict["delay_minutes"]

        if "days" in config_dict:
            AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()
            time_trigger = AutomationHasTriggerTime.query.filter_by(automation_id=id).first()
            if time_trigger is not None:
                time_trigger.days = config_dict["days"]
                time_trigger.time = config_dict["time"]
            else:
                time_trigger = AutomationHasTriggerTime(automation_id=id, days=config_dict["days"], time= config_dict["time"])
                db.session.add(time_trigger)

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        if automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
            if "trigger_device_ids" in config_dict:
                _update_automation_trigger_devices(id, config_dict)

        if automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
            if "trigger_device_ids" in config_dict:
                _update_automation_trigger_devices(id, config_dict)

        if "inverted_automation_copy_id" in config_dict:
            #Copy is deleted
            if config_dict["inverted_automation_copy_id"] == -1 and automation.inverted_automation_copy_id != -1:
                delete_automation(automation.inverted_automation_copy_id)
                automation.inverted_automation_copy_id = -1

            #Copy is created
            elif config_dict["inverted_automation_copy_id"] == 9999 and automation.inverted_automation_copy_id == -1:
                if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                    automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, None, config_dict.get("inverted_action_time"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
                    automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                    automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))

            #Copy is updated
            else:
                if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                    update_inverted_automation_copy(automation.id, None, config_dict.get("inverted_action_time"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
                    update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                    update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
        
        #inverted ID not altered, but automation has a copy
        elif automation.inverted_automation_copy_id != -1:
            if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                update_inverted_automation_copy(automation.id, None, config_dict.get("inverted_action_time"))
            elif automation.trigger == c.AUTOMATION_TRIGGER_SENSOR:
                update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
            elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))

        try:
            db.session.commit()
            logi("Updated automation [" + automation.name + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Update the specified inverted automation copy.
#   @param  id                  Automation ID
#   @param  delay_minutes       Minutes to delay the sensor triggered action 
#                               after a trigger
#   @param  time                Time for the inverted timed action
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_inverted_automation_copy(id, delay_minutes=None, time=None):
    automation = get_automation(id)
    automation["name"] += "_inverted"
    inverted_automation_copy_id = automation.pop("inverted_automation_copy_id")

    if delay_minutes is not None:
        automation["delay_minutes"] = delay_minutes
    else:
        automation.pop("delay_minutes")

    if time is not None:
        automation["inverted_action_time"] = time

    if automation["trigger"] != c.AUTOMATION_TRIGGER_TIMER:
        if automation["trigger_state"] == 1:
            automation["trigger_state"] = 0
        else:
            automation["trigger_state"] = 1

    for i, parameter in enumerate(automation["parameters"]):
        if parameter["name"] == "power":
            if automation["parameters"][i]["value"] == 1:
                automation["parameters"][i]["value"] = 0
            else:
                automation["parameters"][i]["value"] = 1
            break

    return update_automation(inverted_automation_copy_id, automation)

################################################################################
#
#   @brief  Deletes the specified automation.
#   @param  id                  Automation ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_automation(id):
    with app.app_context():
        automation = Automation.query.filter_by(id=id).first()
        inverted_automation_copy_id = automation.inverted_automation_copy_id

        if automation == None:
            logw("Automation not deleted. Not found. ID [" + str(id) + "]")
            return
        
        Automation.query.filter_by(id=id).delete()
        AutomationHasParameter.query.filter_by(automation_id=id).delete()
        AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()
        AutomationHasTriggerTime.query.filter_by(automation_id=id).delete()
        AutomationHasTargetDevice.query.filter_by(automation_id=id).delete()
        
        try:
            db.session.commit()
            logi("Deleted automation [" + automation.name + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
        #Delete inverted copy when present
        if inverted_automation_copy_id != -1:
            return delete_automation(inverted_automation_copy_id)
        
    return (True)

################################################################################
#
#   @brief  Updates the trigger devices of the specified automation.
#   @param  id                  Automation ID
#   @param  trigger_devices     Trigger device dictionaries
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_automation_trigger_devices(id, trigger_devices):
    trigger_state = trigger_devices["trigger_state"]
    trigger_device_ids = trigger_devices["trigger_device_ids"]

    with app.app_context():
        AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()   #Delete possible trigger devices
        AutomationHasTriggerTime.query.filter_by(automation_id=id).delete()     #Delete possible time triggers

        for device in trigger_device_ids:
            db.session.add(AutomationHasTriggerDevice(
                automation_id=id,
                device_id=device,
                trigger_state=trigger_state
            ))

        try:
            db.session.commit()
            logi("Updated automation trigger devices")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Updates the target devices of the specified automation.
#   @param  id                  Automation ID
#   @param  target_device_ids   Target device IDs
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_automation_target_devices(id, target_device_ids):
    with app.app_context():
        AutomationHasTargetDevice.query.filter_by(automation_id=id).delete()

        for device_id in target_device_ids:
            db.session.add(AutomationHasTargetDevice(
                automation_id=id,
                device_id=device_id
            ))

        try:
            db.session.commit()
            logi("Updated automation target devices")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Updates the parameters of the specified automation.
#   @param  id                  Automation ID
#   @param  parameters          Parameters dictionary list
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def _update_automation_parameters(id, parameters):
    with app.app_context():
        AutomationHasParameter.query.filter_by(automation_id=id).delete()

        for parameter in parameters:
            db.session.add(AutomationHasParameter(
                automation_id=id,
                name=parameter["name"],
                value=parameter["value"]
            ))

        try:
            db.session.commit()
            logi("Updated automation parameters")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Returns the specified automation.
#   @param  id                  Automation ID
#   @param  name                Automation name
#   @return dict                Dictionary of the automation
#
################################################################################
def get_automation(id=None, name=None):
    automation = None
    with app.app_context():
        if id is not None:
            automation = Automation.query.filter_by(id=id).first()

        if name is not None:
            automation = Automation.query.filter_by(name=name).first()

        if automation is None:
            logw("Automation not found")
            return automation
        
        automation = _row_to_dictionary(automation)
        automation["parameters"] = _get_automation_parameters(automation["id"])
        automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
        automation["target_device_ids"] = _get_automation_target_devices(automation["id"])

        if automation["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
            automation_times = AutomationHasTriggerTime.query.filter_by(automation_id=automation["id"]).first()
            automation["days"] = automation_times.days
            automation["time"] = automation_times.time
            
            if int(automation["inverted_automation_copy_id"]) != -1:
                automation["inverted_action_time"] = AutomationHasTriggerTime.query.filter_by(automation_id=automation["inverted_automation_copy_id"]).first().time
            else:
                automation["inverted_action_time"] = "00:00"

        elif automation["trigger"] == c.AUTOMATION_TRIGGER_SENSOR:
            trigger_device = AutomationHasTriggerDevice.query.filter_by(
                                                                    device_id=automation["trigger_device_ids"][0],
                                                                    automation_id=automation["id"]).first()
            automation["trigger_state"] = trigger_device.trigger_state

        elif automation["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
            trigger_device = AutomationHasTriggerDevice.query.filter_by(
                                                                    device_id=automation["trigger_device_ids"][0],
                                                                    automation_id=automation["id"]).first()
            automation["trigger_state"] = trigger_device.trigger_state

    return automation
    
################################################################################
#
#   @brief  Returns the automations in the database.
#   @param  trigger                     Trigger type
#   @param  include_inverted_copies     When True, the inverted copies are
#                                       included
#   @return list                        Dictionary list with automations
#
################################################################################
def get_automations(trigger=None, include_inverted_copies=False):
    automation_list = []

    with app.app_context():
        if trigger is None:
            automations = Automation.query.all()
        else :
            automations = Automation.query.filter_by(trigger=trigger).all()

        for automation in automations:
            if not include_inverted_copies and automation.is_inverted_automation:
                continue

            automation = _row_to_dictionary(automation)
            automation["parameters"] = _get_automation_parameters(automation["id"])
            automation["target_device_ids"] = _get_automation_target_devices(automation["id"])

            if automation["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
                automation_times = AutomationHasTriggerTime.query.filter_by(automation_id=automation["id"]).first()
                automation["days"] = automation_times.days
                automation["time"] = automation_times.time
                
                if int(automation["inverted_automation_copy_id"]) != -1:
                    inverted_action_time = AutomationHasTriggerTime.query.filter_by(automation_id=automation["inverted_automation_copy_id"]).first()
                    automation["inverted_action_time"] = inverted_action_time.time
                else:
                    automation["inverted_action_time"] = "00:00"

            elif automation["trigger"] == c.AUTOMATION_TRIGGER_SENSOR:
                if int(automation["inverted_automation_copy_id"]) != -1:
                    automation["inverted_delay_minutes"] = get_automation(automation["inverted_automation_copy_id"])["delay_minutes"]

                automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
                trigger_device = AutomationHasTriggerDevice.query.filter_by(
                                                                        device_id=automation["trigger_device_ids"][0],
                                                                        automation_id=automation["id"]).first()
                automation["trigger_state"] = trigger_device.trigger_state

            elif automation["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
                if int(automation["inverted_automation_copy_id"]) != -1:
                    automation["inverted_delay_minutes"] = get_automation(automation["inverted_automation_copy_id"])["delay_minutes"]

                automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
                trigger_device = AutomationHasTriggerDevice.query.filter_by(
                                                                        device_id=automation["trigger_device_ids"][0],
                                                                        automation_id=automation["id"]).first()
                automation["trigger_state"] = trigger_device.trigger_state

            automation_list.append(automation)

    return automation_list

################################################################################
#
#   @brief  Returns the parameters of the specified automation.
#   @param  automation_id       Automation ID
#   @return list                Dictionary list with parameters
#
################################################################################
def _get_automation_parameters(automation_id):
    parameter_list = []

    with app.app_context():
        parameters = AutomationHasParameter.query.filter_by(automation_id=automation_id).all()

    for parameter in parameters:
        parameter_list.append(_row_to_dictionary(parameter))

    return parameter_list

################################################################################
#
#   @brief  Returns the trigger device IDs of the specified automation.
#   @param  automation_id       Automation ID
#   @return list                List with trigger device IDs
#
################################################################################
def _get_automation_trigger_devices(automation_id):
    device_list = []

    with app.app_context():
        devices = AutomationHasTriggerDevice.query.filter_by(automation_id=automation_id).all()

    for device in devices:
        device_list.append(device.device_id)

    return device_list

################################################################################
#
#   @brief  Returns the target device IDs of the specified automation.
#   @param  automation_id       Automation ID
#   @return list                List with target device IDs
#
################################################################################
def _get_automation_target_devices(automation_id):
    device_list = []

    with app.app_context():
        devices = AutomationHasTargetDevice.query.filter_by(automation_id=automation_id).all()

    for device in devices:
        device_list.append(device.device_id)

    return device_list
#endregion

#region Alarm functionality
################################################################################
#
#   @brief  Adds the specified deactivation device to the alarm.
#   @param  device_dict         Deactivation device dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_alarm_deactivation_device(device_dict):
    with app.app_context():
        deactivation_device = AlarmHasDeactivationDevice(
                                alarm_id=1,
                                name=device_dict["name"],
                                ip_address=device_dict["ip_address"],
                                mac_address=device_dict["mac_address"])
                                
        db.session.add(deactivation_device)

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        return (True, deactivation_device.id)

################################################################################
#
#   @brief  Updates the specified alarm deactivation device.
#   @param  device_id           Deactivation device ID
#   @param  device_dict         Deactivation device dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_alarm_deactivation_device(device_id, device_dict):
    with app.app_context():
        deactivation_device = AlarmHasDeactivationDevice.query.filter_by(id=device_id).first()
        
        #Look for included variables
        if "name" in device_dict:
            deactivation_device.name = device_dict["name"]

        if "ip_address" in device_dict:
            deactivation_device.ip_address = device_dict["ip_address"]

        try:
            db.session.commit()
            logi("Updated deactivation device [" + str(deactivation_device.name) + "]")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True)

################################################################################
#
#   @brief  Deletes the specified alarm deactivation device.
#   @param  device_id           Deactivation device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_alarm_deactivation_device(device_id):
    with app.app_context():
        AlarmHasDeactivationDevice.query.filter_by(id=device_id).delete()

        try:
            db.session.commit()
            logi("Deleted alarm deactivation device")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True)

################################################################################
#
#   @brief  Adds the specified trigger device to the alarm.
#   @param  device_id           Trigger device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def add_alarm_trigger_device(device_id):
    with app.app_context():
        trigger_device = AlarmHasTriggerDevice(
            alarm_id=1,
            device_id=device_id
        )

        db.session.add(trigger_device)

        try:
            db.session.commit()
            logi("Added alarm trigger device")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Deletes the specified alarm trigger device.
#   @param  device_id           Trigger device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_alarm_trigger_device(device_id):
    with app.app_context():
        AlarmHasTriggerDevice.query.filter_by(device_id=device_id).delete()

        try:
            db.session.commit()
            logi("Deleted alarm trigger device")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Updates the alarm.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_alarm(config_dict):
    with app.app_context():
        id = 1
        alarm = Alarm.query.filter_by(id=id).first()
        
        #Look for included variables
        if "activated" in config_dict:
            alarm.activated = config_dict["activated"]

        if "automatically_armed" in config_dict:
            alarm.automatically_armed = config_dict["automatically_armed"]

        if "armed" in config_dict:
            alarm.armed = config_dict["armed"]

        try:
            db.session.commit()
            logi("Updated alarm")
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Returns the specified alarm.
#   @param  id                  Alarm ID
#   @return dict                Dictionary of the alarm
#
################################################################################
def get_alarm(id=1):
    with app.app_context():
        alarm = Alarm.query.filter_by(id=id).first()

        alarm = _row_to_dictionary(alarm)
        alarm["trigger_device_ids"] = _get_alarm_trigger_devices(alarm["id"])
        alarm["deactivation_devices"] = _get_alarm_deactivation_devices(alarm["id"])

    return alarm

################################################################################
#
#   @brief  Adds an alarm triggered row for the specified sensor.
#   @param  id                  Device ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def add_alarm_trigger_time(device_id):
    with app.app_context():
        trigger_time = AlarmIsTriggered(
            alarm_id=1,
            trigger_device_id=device_id
        )

        db.session.add(trigger_time)

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Returns the trigger times of the specified alarm.
#   @param  id                          Device ID
#   @param  number_of_last_triggers     Number of trigger times
#   @return list                        Dictionary list with trigger times
#
################################################################################
def get_alarm_trigger_times(id=1, number_of_last_triggers=50):
    trigger_list = []
    
    with app.app_context():
        trigger_dates = AlarmIsTriggered.query.filter_by(alarm_id=id).limit(number_of_last_triggers)
    
    for dt in trigger_dates:
        date = datetime.strftime(dt.datetime, "%d-%m-%Y")
        time = datetime.strftime(dt.datetime, "%H:%M:%S")
        
        dt = _row_to_dictionary(dt)

        dt.pop("datetime")
        dt["date"] = date
        dt["time"] = time

        trigger_list.append(dt)

    trigger_list.reverse()

    return trigger_list

################################################################################
#
#   @brief  Returns the alarm trigger devices.
#   @param  alarm_id            Alarm ID
#   @return list                List with trigger device IDs
#
################################################################################
def _get_alarm_trigger_devices(alarm_id):
    device_list = []

    with app.app_context():
        devices = AlarmHasTriggerDevice.query.filter_by(alarm_id=alarm_id).all()

    for device in devices:
        device_list.append(device.device_id)

    return device_list

################################################################################
#
#   @brief  Returns the alarm deactivation devices.
#   @param  id                  Alarm ID
#   @return dict                Dictionary list with the deactivation devices
#
################################################################################
def _get_alarm_deactivation_devices(alarm_id):
    device_list = []

    with app.app_context():
        devices = AlarmHasDeactivationDevice.query.filter_by(alarm_id=alarm_id).all()

    for device in devices:
        device_list.append(_row_to_dictionary(device))

    return device_list
#endregion

#region Dashboard configuration
################################################################################
#
#   @brief  Adds a dashboard configuration.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_dashboard_configuration(config_dict):
    with app.app_context():
        configuration = DashboardConfiguration(name=config_dict["name"],
                                               icon=config_dict["icon"])
            
        db.session.add(configuration)
        
        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
        return (True, configuration.id)
    
################################################################################
#
#   @brief  Updates the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_dashboard_configuration(id, config_dict):
    with app.app_context():
        configuration = DashboardConfiguration.query.filter_by(id=id).first()
        
        #Look for included variables
        if "name" in config_dict:
            configuration.name = config_dict["name"]

        if "icon" in config_dict:
            configuration.icon = config_dict["icon"]

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Deletes the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_dashboard_configuration(id):
    with app.app_context():
        configuration = DashboardConfiguration.query.filter_by(id=id).first()
        
        DashboardConfiguration.query.filter_by(id=id).delete()
        DashboardHasTile.query.filter_by(configuration_id=id).delete()
        
        try:
            db.session.commit()
            logi("Deleted dashboard_configuration: " + configuration.name)
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)

################################################################################
#
#   @brief  Adds a tile to the specified dashboard.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_dashboard_tile(config_dict):
    with app.app_context():
        tile = DashboardHasTile(configuration_id=config_dict["configuration_id"],
                                index=config_dict["index"],
                                type=config_dict["type"],
                                size=config_dict["size"])

        if config_dict["type"] == c.TILE_TYPE_DEVICE:
            tile.device_id = config_dict["device_id"]
        if config_dict["type"] == c.TILE_TYPE_GROUP:
            tile.group_id = config_dict["group_id"]
            
        db.session.add(tile)
        
        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

        return (True, tile.id)

################################################################################
#
#   @brief  Updates the specified dashboard tile.
#   @param  id                  Tile ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_dashboard_tile(id, config_dict):
    with app.app_context():
        tile = DashboardHasTile.query.filter_by(id=id).first()

        if tile == None:
            logw("Could not find tile with ID [" + str(id) + "]")
            return
        
        #Look for included variables
        if "index" in config_dict:
            tile.index = config_dict["index"]

        if "size" in config_dict:
            tile.size = config_dict["size"]

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)
       
################################################################################
#
#   @brief  Deletes the specified dashboard tile.
#   @param  id                  Tile ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_dashboard_tile(id):
    with app.app_context():
        DashboardHasTile.query.filter_by(id=id).delete()

        try:
            db.session.commit()                                                 #Commit changes to database
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True)

################################################################################
#
#   @brief  Resets the tile order of the specified dashboard.
#   @param  id                  Dashboard ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def reset_dashboard_tile_order(id):
    with app.app_context():
        tiles = DashboardHasTile.query.filter_by(configuration_id=id).all()

        for i, tile in enumerate(tiles):
            tile.index = i

        try:
            db.session.commit()
        except exc.SQLAlchemyError as e:
            loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
            return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
        
    return (True)
        
################################################################################
#
#   @brief  Returns the dashboard configurations.
#   @param  account_id          Account ID
#   @return list                Dictionary list with dashboards
#
################################################################################
def get_dashboard_configurations(account_id=None):
    with app.app_context():
        #account_id for now unimplemented
        if account_id is None:
            dashboard_configurations = DashboardConfiguration.query.all()
        #else:
        #    account_dashboards = AccountHasDashboardConfiguration.query.filter_by(account_id=account_id).all()
        #    dashboard_configurations = []
        #    for dashboard in account_dashboards:
        #        dashboard_configurations.append(DashboardConfiguration.query.filter_by(configuration_id=dashboard.configuration_id).first())

        dashboard_configuration_list = []
        for dashboard_configuration in dashboard_configurations:
            dashboard_configuration = _row_to_dictionary(dashboard_configuration)
            tiles = DashboardHasTile.query.filter_by(configuration_id=dashboard_configuration["id"]).all()
            dashboard_configuration["tiles"] = []
            for tile in tiles:
                dashboard_configuration["tiles"].append(_row_to_dictionary(tile))
            
            dashboard_configuration_list.append(dashboard_configuration)

    return dashboard_configuration_list

################################################################################
#
#   @brief  Returns the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @return dict                Dictionary of the dashboard
#
################################################################################
def get_dashboard_configuration(id):
    with app.app_context():
        dashboard_configuration = DashboardConfiguration.query.filter_by(id=id).first()
        dashboard_configuration = _row_to_dictionary(dashboard_configuration)
        tiles = DashboardHasTile.query.filter_by(configuration_id=id).all()

        dashboard_configuration["tiles"] = []
        for tile in tiles:
            dashboard_configuration["tiles"].append(_row_to_dictionary(tile))

    return dashboard_configuration
#endregion








#region Accounts
################################################################################
#
#   @brief  Adds a account to the database.
#   @param  data_dict           User dictionary
#   @return                     Tupel with success bool and error string
#
################################################################################
def add_account(data_dict):
    encryptor = Fernet(c.DATABASE_ENCRYPTION_KEY)                               #Instance the Fernet class with the key
    encrypted_email = encryptor.encrypt(data_dict["email"].encode()).decode()
    
    accounts = Account.query.all()

    #Search for existing names
    for account in accounts:
        if encryptor.decrypt(account.email).decode() == data_dict["email"]:
            return (False, c.TEXT_EMAIL_ALREADY_EXISTS)

    account = Account(
                    email=encrypted_email,
                    password=ph.hash(data_dict["password"])
                )
    
    db.session.add(account)                                                     #Add account to database
    
    try:
        db.session.commit()
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True, account.id)

################################################################################
#
#   @brief  Updates a account based on a dictionary with provided items.
#   @param  id                  ID of the account to update
#   @param  data_dict           Dictionary with new data
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_account(id, data_dict):
    encryptor = Fernet(c.DATABASE_ENCRYPTION_KEY)                               #Instance the Fernet class with the key
    account = Account.query.filter_by(id=id).first()                                  #Get account to update

    if account is None:
        return (False, c.TEXT_ACCOUNT_NOT_FOUND)

    accounts = Account.query.all()

    encrypted_email = encryptor.encrypt(data_dict["email"].encode()).decode()
    
    #Search for existing names
    for db_account in accounts:
        if encryptor.decrypt(db_account.email).decode() == data_dict["email"]:
            return (False, c.TEXT_EMAIL_ALREADY_EXISTS)

    account.email = encrypted_email
    
    try:
        db.session.commit()
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True, "")

################################################################################
#
#   @brief  Deletes a account from the database.
#   @param  id                  ID of the account to delete
#   @return                     Tupel with success bool and error string
#
################################################################################
def delete_account(id):
    account = Account.query.filter_by(id=id).first()                                  #Get account to delete

    if account is None:
        return (False, c.TEXT_ACCOUNT_NOT_FOUND)

    db.session.delete(account)                                                     #Delete account
    
    try:
        db.session.commit()                                                     #Commit changes to database
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True, "")

################################################################################
#
#   @brief  Updates the password of the specified user.
#   @param  id                  ID of the user to update password
#   @param  password            New password of the user
#   @param  current_password    Current password of the user
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_account_password(id, password, current_password=None):
    account = Account.query.filter_by(id=id).first()                                  #Get account to update

    if account is None:
        return (False, c.TEXT_ACCOUNT_NOT_FOUND)
    
    if not re.search(c.RE_PASSWORD, password):
        return (False, c.TEXT_PASSWORD_NOT_STRONG)
    
    #Check whether current password is the same
    if current_password is not None:
        try:
            ph.verify(account.password, current_password)
        except VerifyMismatchError:
            return (False, c.TEXT_INVALID_CURRENT_PASSWORD)

    #Check whether new password is unique
    try:
        ph.verify(account.password, password)
        return (False, c.TEXT_CANNOT_BE_THE_SAME_PASSWORD)
    except VerifyMismatchError:
        pass

    account.password = ph.hash(password)                                           #Hash the default password
    account.password_updated_at = datetime.now(c.TIME_ZONE)                        #Update date and time password updated

    try:
        db.session.commit()                                                     #Commit changes to database
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    strength_results = zxcvbn(password)

    return (True, strength_results["feedback"]["warning"])

################################################################################
#
#   @brief  Resets the password to the default one of the specified account.
#   @param  id                  ID of the account to reset password
#   @return                     True if success, otherwise false
#
################################################################################
def reset_account_password(id):
    account = Account.query.filter_by(id=id).first()                                  #Get account to update password

    if account is None:
        return False

    account.password = ph.hash(c.DEFAULT_PASSWORD)                                 #Hash the default password
    account.password_updated_at = datetime.now(c.TIME_ZONE)
    
    try:
        db.session.commit()                                                     #Commit changes to database
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return False

    return True
    
################################################################################
#
#   @brief  Checks account credentials.
#   @param  email               The email of the account
#   @param  password            The password of the account
#   @return                     Tupel with success bool and error string or account
#
################################################################################
def account_login(email, password):
    encryptor = Fernet(c.DATABASE_ENCRYPTION_KEY)                               #Instance the Fernet class with the key
    accounts = Account.query.all()
    account = None
    
    #Search accounts for email
    for db_account in accounts:
        #If email corresponds to a account, select account
        if encryptor.decrypt(db_account.email).decode() == email:
            account = db_account
            break

    if account is None:
        return (False, c.TEXT_WRONG_CREDENTIALS)                                #User not found by email, wrong email
    
    try:
        ph.verify(account.password, password)                                      #Verify if password is a match
    except VerifyMismatchError:
        return (False, c.TEXT_WRONG_CREDENTIALS)                                #Password incorrect
    
    account.last_logged_in_at = datetime.now(c.TIME_ZONE)                          #Update date and time last logged in
    
    try:
        db.session.commit()                                                     #Commit changes to database
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    #Decrypt data
    account.email = encryptor.decrypt(account.email).decode()

    account = _row_to_dictionary(account)
    account.pop("password")

    return (True, account)                                                         #If credentials are correct, return user
    
################################################################################
#
#   @brief  Returns all users.
#   @return                     List of dictionaries of the users
#
################################################################################
def get_accounts():
    encryptor = Fernet(c.DATABASE_ENCRYPTION_KEY)                               #Instance the Fernet class with the key
    accounts = Account.query.all()
    accounts_list = []

    for account in accounts:
        account = _row_to_dictionary(account)
        account["email"] = encryptor.decrypt(account["email"]).decode()

        account.pop("password")
        accounts_list.append(account)
    
    return accounts_list

################################################################################
#
#   @brief  Returns a user dictionary based on the ID or email.
#   @param  id                  ID of the user
#   @param  email               Email of the user
#   @return                     Dictionary of the specified user
#
################################################################################
def get_account(id):
    encryptor = Fernet(c.DATABASE_ENCRYPTION_KEY)                               #Instance the Fernet class with the key
    account = Account.query.filter_by(id=id).first()                              #Get user based on ID

    if account is None:
        loge(c.TEXT_ACCOUNT_NOT_FOUND)
        return

    account = _row_to_dictionary(account)                                             #Convert db object to dictionary
    account["email"] = encryptor.decrypt(account["email"]).decode()

    account.pop("password")

    return account
#endregion












#region Users
################################################################################
#
#   @brief  Adds a profile to the database.
#   @param  data_dict           User dictionary
#   @return                     Tupel with success bool and error string
#
################################################################################
def add_profile(data_dict):
    profiles = Profile.query.all()
    
    #Search for existing names
    for db_profile in profiles:
        if db_profile.name == data_dict["name"]:
            return (False, c.TEXT_NAME_ALREADY_EXISTS)

    profile = Profile(
                    account_id=data_dict["account_id"],
                    name=data_dict["name"],
                    language=data_dict["language"]
                )
    
    db.session.add(profile)                                                     #Add profile to database
    
    try:
        db.session.commit()
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    return (True, profile.id)

################################################################################
#
#   @brief  Updates a profile based on a dictionary with provided items.
#   @param  id                  ID of the profile to update
#   @param  data_dict           Dictionary with new data
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_profile(id, data_dict):
    profile = Profile.query.filter_by(id=id).first()                                  #Get profile to update

    if profile is None:
        return (False, c.TEXT_PROFILE_NOT_FOUND)

    profiles = Profile.query.all()
    
    if "name" in data_dict:
        #Search for existing names
        for db_profile in profiles:
            if db_profile.id == id:
                continue

            if db_profile.name == data_dict["name"]:
                return (False, c.TEXT_NAME_ALREADY_EXISTS)
            
        profile.name = data_dict["name"]

    if "language" in data_dict:
        profile.language = data_dict["language"]

    if "profile_picture" in data_dict:
        profile.profile_picture = data_dict["profile_picture"]

    if "ui_theme" in data_dict:
        profile.ui_theme = data_dict["ui_theme"]
    
    try:
        db.session.commit()
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))
    
    return (True, "")

################################################################################
#
#   @brief  Deletes a profile from the database.
#   @param  id                  ID of the profile to delete
#   @return                     Tupel with success bool and error string
#
################################################################################
def delete_profile(id):
    profile = Profile.query.filter_by(id=id).first()                                  #Get profile to delete

    if profile is None:
        return (False, c.TEXT_PROFILE_NOT_FOUND)

    picture_filename = profile.profile_picture
    db.session.delete(profile)                                                     #Delete profile
    
    try:
        db.session.commit()                                                     #Commit changes to database
    except exc.SQLAlchemyError as e:
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))))
        return (False, c.VAR_TEXT_DATABASE_ERROR.format(str(e)))

    #Remove profile picture
    if picture_filename != c.DEFAULT_PROFILE_PICTURE_FILENAME:
        path = os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, picture_filename)
        if os.path.exists(path):
            os.remove(path)

    return (True, "")
    
################################################################################
#
#   @brief  Returns all users.
#   @return                     List of dictionaries of the users
#
################################################################################
def get_profiles(account_id):
    profiles = Profile.query.filter_by(account_id=account_id).all()
    profiles_list = []

    for profile in profiles:
        profiles_list.append(_row_to_dictionary(profile))
    
    return profiles_list

################################################################################
#
#   @brief  Returns a user dictionary based on the ID or email.
#   @param  id                  ID of the user
#   @param  email               Email of the user
#   @return                     Dictionary of the specified user
#
################################################################################
def get_profile(id):
    profile = Profile.query.filter_by(id=id).first()                              #Get user based on ID

    if profile is None:
        loge(c.TEXT_PROFILE_NOT_FOUND)
        return

    profile = _row_to_dictionary(profile)                                             #Convert db object to dictionary
    
    return profile
#endregion


































#region Utilities
################################################################################
#
#   @brief  Converts a database row to a dictionary.
#   @param  row                 Row to convert
#   @return                     Dictionary with data of the row
#
################################################################################
def _row_to_dictionary(row):
    dictionary = {}

    if row is None:
        logw("row is None")
        return dictionary

    for column in row.__table__.columns:
        dictionary[column.name] = str(getattr(row, column.name))                #For every column, make a key
        if dictionary[column.name] == "True":
            dictionary[column.name] = True
            continue

        if dictionary[column.name] == "False":
            dictionary[column.name] = False
            continue

        if dictionary[column.name].isdigit():
            dictionary[column.name] = int(dictionary[column.name])
            continue

    return dictionary

################################################################################
#
#   @brief  Adds default ledstrip mode parameters for a newly added ledstrip.
#   @param  device_id           Device ID
#
################################################################################
def _add_default_mode_parameters(device_id):
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.FADE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=11,  value="200"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.GRADIENT_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=1,   value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.GRADIENT_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=2,   value="255"))
    db.session.add(ModeHasModeParameter(mode_id=c.GRADIENT_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=9,   value="10"))
    db.session.add(ModeHasModeParameter(mode_id=c.GRADIENT_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=11,  value="200"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.BLINK_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.BLINK_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.BLINK_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.BLINK_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.BLINK_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=11,  value="200"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=11,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=7,   value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.SCAN_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=8,   value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=11,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=7,   value="2"))
    db.session.add(ModeHasModeParameter(mode_id=c.THEATER_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=15,  value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=11,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=9,   value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.SINE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=15,  value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=7,   value="3"))
    db.session.add(ModeHasModeParameter(mode_id=c.BOUNCING_BALLS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=16,  value="3"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=11,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=10,  value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.DISSOLVE_LEDSTRIP_MODE,       device_id=device_id, mode_parameter_id=12,  value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=14,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=12,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.SPARKLE_LEDSTRIP_MODE,        device_id=device_id, mode_parameter_id=10,  value="0"))

    db.session.add(ModeHasModeParameter(mode_id=c.FIREWORKS_LEDSTRIP_MODE,      device_id=device_id, mode_parameter_id=17,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.FIREWORKS_LEDSTRIP_MODE,      device_id=device_id, mode_parameter_id=12,  value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.FIREWORKS_LEDSTRIP_MODE,      device_id=device_id, mode_parameter_id=13,  value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.FIRE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=17,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.FIRE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=11,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.FIRE_LEDSTRIP_MODE,           device_id=device_id, mode_parameter_id=7,   value="80"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=4,   value="#000000"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=6,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=11,  value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=12,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.SWEEP_LEDSTRIP_MODE,          device_id=device_id, mode_parameter_id=18,  value="10"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_TWINKELS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=17,  value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_TWINKELS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=11,  value="1",))
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_TWINKELS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=12,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_TWINKELS_LEDSTRIP_MODE, device_id=device_id, mode_parameter_id=10,  value="0"))

    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=3,   value="#ffffff"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=5,   value="False"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=7,   value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=8,   value="0"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=11,  value="1"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=12,  value="200"))
    db.session.add(ModeHasModeParameter(mode_id=c.METEOR_RAIN_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=13,  value="0"))
    
    db.session.add(ModeHasModeParameter(mode_id=c.COLOR_WAVES_LEDSTRIP_MODE,    device_id=device_id, mode_parameter_id=17,  value="0"))
    
    db.session.commit()
#endregion