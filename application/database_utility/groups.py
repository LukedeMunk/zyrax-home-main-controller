################################################################################
#
# File:     groups.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Groups table of the database.
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
from . import devices as m_devices
from . import dashboards as m_dashboards

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
                      type=config_dict["type"]
                      )
        
        db.session.add(group)
        db.session.flush()                                                      #Flush to database to get the ID

        for device in config_dict["device_ids"]:
            db.session.add(GroupHasDevice(
                group_id=group.id,
                device_id=device
            ))
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Added group [" + config_dict["name"] + "]")
    
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

        #if "type" in config_dict:
        #    group.type = config_dict["type"]

        if "device_ids" in config_dict:
            GroupHasDevice.query.filter_by(group_id=id).delete()

            for device in config_dict["device_ids"]:
                db.session.add(GroupHasDevice(
                    group_id=group.id,
                    device_id=device
                ))
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Updated group [" + group.name + "]")
    
    return (True, "")

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
        DashboardHasTile.query.filter_by(group_id=id).delete()
        Group.query.filter_by(id=id).delete()

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Deleted group [" + group.name + "]")
    
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

    if group is None:
        return None

    group = core.row_to_dictionary(group)
    group["device_ids"] = _get_group_device_ids(group["id"])
    group["types"] = _get_group_types(group["id"])

    return group

################################################################################
#
#   @brief  Returns the groups in the database.
#   @return list                Dictionary list with groups
#
################################################################################
def get_groups():
    with app.app_context():
        groups = Group.query.all()

    group_list = []
    for group in groups:
        group = core.row_to_dictionary(group)
        group["device_ids"] = _get_group_device_ids(group["id"])
        group["types"] = _get_group_types(group["id"])
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
    
################################################################################
#
#   @brief  Returns the device types of the devices in the specified group.
#   @param  id                  Group ID
#   @return list                List with device types
#
################################################################################
def _get_group_types(id):
    with app.app_context():
        group_devices = GroupHasDevice.query.filter_by(group_id=id).all()

        types = []
        for group_device in group_devices:
            device = m_devices.get_device(group_device.device_id)
            if device["type"] not in types:
                types.append(device["type"])
            
    return types
#endregion
