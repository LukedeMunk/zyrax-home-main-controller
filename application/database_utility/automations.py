################################################################################
#
# File:     automations.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Automations table of the
#           database.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import configuration constants and global variables
from logger import logi, logw, loge                                             #For logging functionality
import json                                                                     #For polymorphic automation definitions
from sqlalchemy import or_                                                      #For indexed event trigger queries

from server_manager import *                                                    #For database manipulation

from . import database_core as core
from automation.domain import EventType

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
        legacy_action = automation_dict.get("action")
        if legacy_action is None and automation_dict.get("actions"):
            legacy_action = automation_dict["actions"][0]["type"]

        legacy_trigger = automation_dict.get("trigger")
        if legacy_trigger is None:
            legacy_trigger = c.AUTOMATION_TRIGGER_SWITCH

        automation = Automation(name = automation_dict["name"],
                            action = legacy_action,
                            trigger = legacy_trigger,
                            enabled = automation_dict.get("enabled", True),
                            concurrency_policy = automation_dict.get(
                                "concurrency_policy",
                                c.AUTOMATION_CONCURRENCY_RESTART
                            ),
                            error_policy = automation_dict.get(
                                "error_policy",
                                c.AUTOMATION_ERROR_STOP
                            ),
                            is_inverted_automation = inverted_automation)

        #Time window
        if inverted_automation and automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
            automation_dict["time"] = automation_dict["inverted_action_time"]

        if automation.trigger in [
                c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
            automation.time_window_activated = automation_dict["time_window_activated"]
            automation.activate_during_time_window = automation_dict["activate_during_time_window"]
            
            if automation_dict["time_window_activated"] == 1:
                automation.time_window_start_minutes = automation_dict["time_window_start_minutes"]
                automation.time_window_end_minutes = automation_dict["time_window_end_minutes"]

            automation.delay_minutes = automation_dict["delay_minutes"]

        if automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
            automation.delay_minutes = automation_dict["delay_minutes"]

        db.session.add(automation)
        db.session.flush()                                                      #Flush to database to get the ID

        target_device_ids = automation_dict.get("target_device_ids", [])

        if not target_device_ids and automation_dict.get("actions"):
            for action in automation_dict["actions"]:
                target_device_ids.extend(action.get(
                    "configuration", {}
                ).get("target_device_ids", []))

        for device in set(target_device_ids):
            db.session.add(AutomationHasTargetDevice(
                automation_id=automation.id,
                device_id=device
            ))

        #Trigger
        if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
            db.session.add(AutomationHasTriggerTime(automation_id=automation.id, days=_string_to_binary_days(automation_dict["days"]), time=automation_dict["time"]))

        if automation.trigger in [
                c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
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

        _update_automation_definition(automation.id, automation_dict)

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Added automation [" + automation_dict["name"] + "]")

        if not inverted_automation and automation_dict["inverted_automation_copy_id"] != -1:
            if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, None, automation_dict["inverted_action_time"])
            elif automation.trigger in [
                    c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                    c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, automation_dict["inverted_delay_minutes"])
            elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, automation_dict["inverted_delay_minutes"])

                
            success, error = core.commit_with_handling()

            if not success:
                return (success, error)

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
    automation.pop("triggers", None)
    automation.pop("conditions", None)
    automation.pop("actions", None)

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
            return (False, "UI_TEXT_AUTOMATION_NOT_FOUND")
        
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

        if "concurrency_policy" in config_dict:
            automation.concurrency_policy = config_dict["concurrency_policy"]

        if "error_policy" in config_dict:
            automation.error_policy = config_dict["error_policy"]

        if "time" in config_dict:
            AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()
            time_trigger = AutomationHasTriggerTime.query.filter_by(automation_id=id).first()
            if time_trigger is not None:
                time_trigger.time = config_dict["time"]
            else:
                time_trigger = AutomationHasTriggerTime(automation_id=id, time=config_dict["time"])
                db.session.add(time_trigger)

        if "days" in config_dict:
            AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()
            time_trigger = AutomationHasTriggerTime.query.filter_by(automation_id=id).first()
            if time_trigger is not None:
                time_trigger.days = _string_to_binary_days(config_dict["days"])
            else:
                time_trigger = AutomationHasTriggerTime(automation_id=id, days=_string_to_binary_days(config_dict["days"]))
                db.session.add(time_trigger)

        definition_keys = {
            "action",
            "actions",
            "parameters",
            "target_device_ids",
            "trigger",
            "triggers",
            "trigger_device_ids",
            "trigger_state",
            "time_window_activated",
            "activate_during_time_window",
            "time_window_start_minutes",
            "time_window_end_minutes"
        }

        if definition_keys.intersection(config_dict.keys()):
            merged_configuration = get_automation(id=id)
            merged_configuration.update(config_dict)

            for definition_key in ["triggers", "conditions", "actions"]:
                if definition_key not in config_dict:
                    merged_configuration.pop(definition_key, None)

            _update_automation_definition(id, merged_configuration)
                
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

        if automation.trigger in [
                c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
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
                elif automation.trigger in [
                        c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                        c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
                    automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                    automation.inverted_automation_copy_id = create_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))

            #Copy is updated
            else:
                if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                    update_inverted_automation_copy(automation.id, None, config_dict.get("inverted_action_time"))
                elif automation.trigger in [
                        c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                        c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
                    update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
                elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                    update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
        
        #inverted ID not altered, but automation has a copy
        elif automation.inverted_automation_copy_id != -1:
            if automation.trigger == c.AUTOMATION_TRIGGER_TIMER:
                update_inverted_automation_copy(automation.id, None, config_dict.get("inverted_action_time"))
            elif automation.trigger in [
                    c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                    c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
                update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))
            elif automation.trigger == c.AUTOMATION_TRIGGER_SWITCH:
                update_inverted_automation_copy(automation.id, config_dict.get("inverted_delay_minutes"))

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Updated automation [" + automation.name + "]")
    
    return (True, "")

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
    automation.pop("triggers", None)
    automation.pop("conditions", None)
    automation.pop("actions", None)

    if delay_minutes is not None:
        automation["delay_minutes"] = delay_minutes
    else:
        automation.pop("delay_minutes")

    if time is not None:
        automation["time"] = time

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

        if automation == None:
            logw("Automation not deleted. Not found. ID [" + str(id) + "]")
            return (False, "UI_TEXT_AUTOMATION_NOT_FOUND")

        inverted_automation_copy_id = automation.inverted_automation_copy_id
        
        Automation.query.filter_by(id=id).delete()
        AutomationHasParameter.query.filter_by(automation_id=id).delete()
        AutomationHasTriggerDevice.query.filter_by(automation_id=id).delete()
        AutomationHasTriggerTime.query.filter_by(automation_id=id).delete()
        AutomationHasTargetDevice.query.filter_by(automation_id=id).delete()
        AutomationTrigger.query.filter_by(automation_id=id).delete()
        AutomationCondition.query.filter_by(automation_id=id).delete()
        AutomationAction.query.filter_by(automation_id=id).delete()
        DashboardHasTile.query.filter_by(automation_id=id).delete()

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Deleted automation [" + automation.name + "]")
        
        #Delete inverted copy when present
        if inverted_automation_copy_id != -1:
            return delete_automation(inverted_automation_copy_id)
        
    return (True, "")

def _string_to_binary_days(days):
    return "".join("1" if index in days else "0" for index in range(7))

def _binary_days_to_string(binary):
    return [index for index, waarde in enumerate(binary) if waarde == "1"]

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Updated automation trigger devices")
        
    return (True, "")

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

        logi("Updated automation target devices")
        
    return (True, "")

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

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Updated automation parameters")
    
    return (True, "")

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
        
        automation = core.row_to_dictionary(automation)
        automation["parameters"] = _get_automation_parameters(automation["id"])
        automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
        automation["target_device_ids"] = _get_automation_target_devices(automation["id"])
        automation["triggers"] = _get_automation_triggers(automation["id"])
        automation["conditions"] = _get_automation_conditions(automation["id"])
        automation["actions"] = _get_automation_actions(automation["id"])

        if automation["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
            automation_times = AutomationHasTriggerTime.query.filter_by(automation_id=automation["id"]).first()
            automation["days"] = _binary_days_to_string(automation_times.days)
            automation["time"] = automation_times.time
            
            if int(automation["inverted_automation_copy_id"]) != -1:
                automation["inverted_action_time"] = AutomationHasTriggerTime.query.filter_by(automation_id=automation["inverted_automation_copy_id"]).first().time
            else:
                automation["inverted_action_time"] = "00:00"

        elif automation["trigger"] in [
                c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
            if automation["trigger_device_ids"]:
                trigger_device = AutomationHasTriggerDevice.query.filter_by(
                    device_id=automation["trigger_device_ids"][0],
                    automation_id=automation["id"]
                ).first()
                automation["trigger_state"] = trigger_device.trigger_state

        elif automation["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
            if automation["trigger_device_ids"]:
                trigger_device = AutomationHasTriggerDevice.query.filter_by(
                    device_id=automation["trigger_device_ids"][0],
                    automation_id=automation["id"]
                ).first()
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

            automation = core.row_to_dictionary(automation)
            automation["parameters"] = _get_automation_parameters(automation["id"])
            automation["target_device_ids"] = _get_automation_target_devices(automation["id"])
            automation["triggers"] = _get_automation_triggers(automation["id"])
            automation["conditions"] = _get_automation_conditions(automation["id"])
            automation["actions"] = _get_automation_actions(automation["id"])

            if automation["trigger"] == c.AUTOMATION_TRIGGER_TIMER:
                automation_times = AutomationHasTriggerTime.query.filter_by(automation_id=automation["id"]).first()
                automation["days"] = _binary_days_to_string(automation_times.days)
                automation["time"] = automation_times.time
                
                if int(automation["inverted_automation_copy_id"]) != -1:
                    inverted_action_time = AutomationHasTriggerTime.query.filter_by(automation_id=automation["inverted_automation_copy_id"]).first()
                    automation["inverted_action_time"] = inverted_action_time.time
                else:
                    automation["inverted_action_time"] = "00:00"

            elif automation["trigger"] in [
                    c.AUTOMATION_TRIGGER_DOOR_SENSOR,
                    c.AUTOMATION_TRIGGER_MOTION_SENSOR]:
                if int(automation["inverted_automation_copy_id"]) != -1:
                    automation["inverted_delay_minutes"] = get_automation(automation["inverted_automation_copy_id"])["delay_minutes"]

                automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
                if automation["trigger_device_ids"]:
                    trigger_device = AutomationHasTriggerDevice.query.filter_by(
                        device_id=automation["trigger_device_ids"][0],
                        automation_id=automation["id"]
                    ).first()
                    automation["trigger_state"] = trigger_device.trigger_state

            elif automation["trigger"] == c.AUTOMATION_TRIGGER_SWITCH:
                if int(automation["inverted_automation_copy_id"]) != -1:
                    automation["inverted_delay_minutes"] = get_automation(automation["inverted_automation_copy_id"])["delay_minutes"]

                automation["trigger_device_ids"] = _get_automation_trigger_devices(automation["id"])
                if automation["trigger_device_ids"]:
                    trigger_device = AutomationHasTriggerDevice.query.filter_by(
                        device_id=automation["trigger_device_ids"][0],
                        automation_id=automation["id"]
                    ).first()
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
        parameter_list.append(core.row_to_dictionary(parameter))

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


################################################################################
#
#   @brief  Replaces the normalized trigger, condition and action definition.
#   @param  automation_id       Automation ID
#   @param  configuration       Automation configuration
#
################################################################################
def _update_automation_definition(automation_id, configuration):
    AutomationTrigger.query.filter_by(automation_id=automation_id).delete()
    AutomationCondition.query.filter_by(automation_id=automation_id).delete()
    AutomationAction.query.filter_by(automation_id=automation_id).delete()

    explicit_triggers = configuration.get("triggers")

    if explicit_triggers:
        for ordering, trigger in enumerate(explicit_triggers):
            trigger_configuration = trigger.get("configuration", {})
            db.session.add(AutomationTrigger(
                automation_id=automation_id,
                type=trigger["type"],
                source_type=trigger.get("source_type"),
                source_id=trigger.get("source_id"),
                configuration=json.dumps(trigger_configuration),
                ordering=ordering
            ))
    else:
        _add_legacy_automation_triggers(automation_id, configuration)

    explicit_conditions = configuration.get("conditions")

    if explicit_conditions:
        for ordering, condition in enumerate(explicit_conditions):
            db.session.add(AutomationCondition(
                automation_id=automation_id,
                type=condition["type"],
                configuration=json.dumps(
                    condition.get("configuration", {})
                ),
                ordering=ordering
            ))
    elif configuration.get("time_window_activated"):
        db.session.add(AutomationCondition(
            automation_id=automation_id,
            type="time_window",
            configuration=json.dumps({
                "start_minutes": configuration.get(
                    "time_window_start_minutes", 0
                ),
                "end_minutes": configuration.get(
                    "time_window_end_minutes", 1439
                ),
                "active_in_window": bool(configuration.get(
                    "activate_during_time_window", True
                ))
            }),
            ordering=0
        ))

    explicit_actions = configuration.get("actions")

    if explicit_actions:
        for ordering, action in enumerate(explicit_actions):
            db.session.add(AutomationAction(
                automation_id=automation_id,
                type=action["type"],
                configuration=json.dumps(action.get("configuration", {})),
                ordering=ordering
            ))
    else:
        db.session.add(AutomationAction(
            automation_id=automation_id,
            type=configuration["action"],
            configuration=json.dumps({
                "target_device_ids": configuration.get(
                    "target_device_ids", []
                ),
                "parameters": configuration.get("parameters", [])
            }),
            ordering=0
        ))


################################################################################
#
#   @brief  Adds normalized triggers for the existing automation format.
#   @param  automation_id       Automation ID
#   @param  configuration       Existing automation configuration
#
################################################################################
def _add_legacy_automation_triggers(automation_id, configuration):
    trigger = configuration["trigger"]

    if trigger == c.AUTOMATION_TRIGGER_TIMER:
        db.session.add(AutomationTrigger(
            automation_id=automation_id,
            type=EventType.TIME,
            configuration=json.dumps({
                "days": configuration.get("days", []),
                "time": configuration.get("time", "00:00")
            }),
            ordering=0
        ))
        return

    event_type = EventType.DEVICE_STATE_CHANGED
    if trigger == c.AUTOMATION_TRIGGER_SWITCH and configuration.get(
            "event_type") == EventType.BUTTON_PRESSED:
        event_type = EventType.BUTTON_PRESSED

    for ordering, device_id in enumerate(configuration.get(
            "trigger_device_ids", [])):
        db.session.add(AutomationTrigger(
            automation_id=automation_id,
            type=event_type,
            source_type="device",
            source_id=device_id,
            configuration=json.dumps({
                "source_ids": [device_id],
                "state": configuration.get("trigger_state")
            }),
            ordering=ordering
        ))


################################################################################
#
#   @brief  Returns normalized automation triggers.
#   @param  automation_id       Automation ID
#   @return list                Trigger dictionaries
#
################################################################################
def _get_automation_triggers(automation_id):
    triggers = AutomationTrigger.query.filter_by(
        automation_id=automation_id
    ).order_by(AutomationTrigger.ordering).all()

    return [_definition_to_dictionary(trigger) for trigger in triggers]


################################################################################
#
#   @brief  Returns normalized automation conditions.
#   @param  automation_id       Automation ID
#   @return list                Condition dictionaries
#
################################################################################
def _get_automation_conditions(automation_id):
    conditions = AutomationCondition.query.filter_by(
        automation_id=automation_id
    ).order_by(AutomationCondition.ordering).all()

    return [_definition_to_dictionary(condition) for condition in conditions]


################################################################################
#
#   @brief  Returns normalized automation actions.
#   @param  automation_id       Automation ID
#   @return list                Action dictionaries
#
################################################################################
def _get_automation_actions(automation_id):
    actions = AutomationAction.query.filter_by(
        automation_id=automation_id
    ).order_by(AutomationAction.ordering).all()

    return [_definition_to_dictionary(action) for action in actions]


################################################################################
#
#   @brief  Converts a normalized definition row to a dictionary.
#   @param  definition          Definition database row
#   @return dict                Definition dictionary
#
################################################################################
def _definition_to_dictionary(definition):
    dictionary = core.row_to_dictionary(definition)
    dictionary["configuration"] = json.loads(
        definition.configuration or "{}"
    )
    return dictionary


################################################################################
#
#   @brief  Returns enabled automations indexed for the specified event.
#   @param  event_type          Domain event type
#   @param  source_id           Event source ID
#   @return list                Candidate automations
#
################################################################################
def get_automations_for_event(event_type, source_id=None):
    with app.app_context():
        query = AutomationTrigger.query.filter_by(type=event_type)

        try:
            numeric_source_id = int(source_id)
            query = query.filter(or_(
                AutomationTrigger.source_id == numeric_source_id,
                AutomationTrigger.source_id.is_(None)
            ))
        except (TypeError, ValueError):
            query = query.filter(AutomationTrigger.source_id.is_(None))

        automation_ids = {trigger.automation_id for trigger in query.all()}

    automations = []
    for automation_id in automation_ids:
        automation = get_automation(id=automation_id)

        if automation is not None and automation["enabled"]:
            automations.append(automation)

    return automations


################################################################################
#
#   @brief  Backfills normalized definitions for legacy-created automations.
#   @return tuple               Database result
#
################################################################################
def ensure_automation_definitions():
    with app.app_context():
        automations = Automation.query.all()

        for automation_row in automations:
            has_definition = AutomationAction.query.filter_by(
                automation_id=automation_row.id
            ).first() is not None

            if has_definition:
                continue

            automation = get_automation(id=automation_row.id)
            automation.pop("triggers", None)
            automation.pop("conditions", None)
            automation.pop("actions", None)
            _update_automation_definition(automation_row.id, automation)

        return core.commit_with_handling()
#endregion
