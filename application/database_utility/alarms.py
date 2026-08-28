################################################################################
#
# File:     alarms.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Alarm table of the database.
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
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Updated deactivation device [" + str(deactivation_device.name) + "]")

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Deleted alarm deactivation device")

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Added alarm trigger device")
        
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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Deleted alarm trigger device")
        
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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

        logi("Updated alarm")
        
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

        alarm = core.row_to_dictionary(alarm)
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
        return core.commit_with_handling()

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
        
        dt = core.row_to_dictionary(dt)

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
        device_list.append(core.row_to_dictionary(device))

    return device_list
#endregion
