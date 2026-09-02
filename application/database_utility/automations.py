################################################################################
#
# File:     automations.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Automations table of the
#           database. Normalized automation persistence.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import json
from sqlalchemy import or_
import configuration as c
from logger import logi, logw
from server_manager import (
    app,
    db,
    Automation,
    AutomationAction,
    AutomationCondition,
    AutomationTrigger,
    DashboardHasTile,
    GroupHasDevice
)

from . import database_core as core

################################################################################
#
#   @brief  Adds an automation to the database.
#   @param  configuration       Dictionary of the automation
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_automation(configuration):
    with app.app_context():
        automation = Automation(
            name=configuration["name"],
            enabled=configuration.get("enabled", True),
            trigger_match=configuration.get("trigger_match", "any"),
            concurrency_policy=configuration.get(
                "concurrency_policy",
                c.AUTOMATION_CONCURRENCY_RESTART
            ),
            error_policy=configuration.get(
                "error_policy",
                c.AUTOMATION_ERROR_STOP
            )
        )

        db.session.add(automation)
        db.session.flush()

        _replace_definition(automation.id, configuration)

        success, error = core.commit_with_handling()
        if not success:
            return (False, error)
        
        logi("Added automation [" + configuration["name"] + "]")

        return (True, automation.id)

################################################################################
#
#   @brief  Updates the specified automation.
#   @param  automation_id       Automation ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_automation(automation_id, configuration):
    with app.app_context():
        automation = Automation.query.filter_by(id=automation_id).first()

        if automation is None:
            logw("Could not find automation with ID [" + str(automation_id) + "]")
            return (False, "UI_TEXT_AUTOMATION_NOT_FOUND")

        for field in ["name", "enabled", "trigger_match", "concurrency_policy", "error_policy"]:
            if field in configuration:
                setattr(automation, field, configuration[field])

        if any(key in configuration for key in ["triggers", "conditions", "actions"]):
            current = get_automation(id=automation_id)
            current.update(configuration)
            _replace_definition(automation_id, current)

        success, error = core.commit_with_handling()
        if not success:
            return (False, error)
        logi("Updated automation [" + automation.name + "]")
        return (True, "")

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

        if automation is None:
            return (False, "UI_TEXT_AUTOMATION_NOT_FOUND")
        
        AutomationTrigger.query.filter_by(automation_id=id).delete()
        AutomationCondition.query.filter_by(automation_id=id).delete()
        AutomationAction.query.filter_by(automation_id=id).delete()
        DashboardHasTile.query.filter_by(automation_id=id).delete()

        db.session.delete(automation)

        return core.commit_with_handling()

################################################################################
#
#   @brief  Returns the specified automation.
#   @param  id                  Automation ID
#   @param  name                Automation name
#   @return dict                Dictionary of the automation
#
################################################################################
def get_automation(id=None, name=None):
    with app.app_context():
        query = Automation.query
        automation = query.filter_by(id=id).first() if id is not None else \
            query.filter_by(name=name).first()
        if automation is None:
            return None
        return _automation_to_dictionary(automation)

################################################################################
#
#   @brief  XXX
#
################################################################################
def get_automations(event_type=None):
    with app.app_context():
        if event_type is None:
            rows = Automation.query.order_by(Automation.id).all()
        else:
            ids = {
                row.automation_id
                for row in AutomationTrigger.query.filter_by(type=event_type).all()
            }
            rows = Automation.query.filter(Automation.id.in_(ids)).all() if ids else []

        return [_automation_to_dictionary(row) for row in rows]

################################################################################
#
#   @brief  XXX
#
################################################################################
def get_automations_for_event(event_type, source_id=None, source_type=None):
    with app.app_context():
        query = AutomationTrigger.query.filter_by(type=event_type)

        if source_type is not None:
            query = query.filter_by(source_type=source_type)

        try:
            numeric_id = int(source_id)
            query = query.filter(or_(
                AutomationTrigger.source_id == numeric_id,
                AutomationTrigger.source_id.is_(None)
            ))
        except (TypeError, ValueError):
            query = query.filter(AutomationTrigger.source_id.is_(None))

        automation_ids = {row.automation_id for row in query.all()}

        if source_type == "device" and source_id is not None:
            group_ids = {
                row.group_id
                for row in GroupHasDevice.query.filter_by(device_id=int(source_id)).all()
            }

            if group_ids:
                group_triggers = AutomationTrigger.query.filter(
                    AutomationTrigger.type == event_type,
                    AutomationTrigger.source_type == "group",
                    AutomationTrigger.source_id.in_(group_ids)
                ).all()

                automation_ids.update(row.automation_id for row in group_triggers)

        rows = Automation.query.filter(
            Automation.id.in_(automation_ids),
            Automation.enabled.is_(True)
        ).all() if automation_ids else []

        return [_automation_to_dictionary(row) for row in rows]

################################################################################
#
#   @brief  XXX
#
################################################################################
def _replace_definition(automation_id, configuration):
    AutomationTrigger.query.filter_by(automation_id=automation_id).delete()
    AutomationCondition.query.filter_by(automation_id=automation_id).delete()
    AutomationAction.query.filter_by(automation_id=automation_id).delete()

    for ordering, trigger in enumerate(configuration.get("triggers", [])):
        db.session.add(AutomationTrigger(
            automation_id=automation_id,
            type=trigger["type"],
            source_type=trigger.get("source_type"),
            source_id=trigger.get("source_id"),
            configuration=json.dumps(trigger.get("configuration", {})),
            ordering=ordering
        ))

    for ordering, condition in enumerate(configuration.get("conditions", [])):
        db.session.add(AutomationCondition(
            automation_id=automation_id,
            type=condition["type"],
            configuration=json.dumps(condition.get("configuration", {})),
            ordering=ordering
        ))

    for ordering, action in enumerate(configuration.get("actions", [])):
        db.session.add(AutomationAction(
            automation_id=automation_id,
            type=action["type"],
            configuration=json.dumps(action.get("configuration", {})),
            ordering=ordering
        ))

################################################################################
#
#   @brief  XXX
#
################################################################################
def _automation_to_dictionary(automation):
    result = core.row_to_dictionary(automation)
    result["triggers"] = _definitions(AutomationTrigger, automation.id)
    result["conditions"] = _definitions(AutomationCondition, automation.id)
    result["actions"] = _definitions(AutomationAction, automation.id)

    return result

################################################################################
#
#   @brief  XXX
#
################################################################################
def _definitions(model, automation_id):
    rows = model.query.filter_by(automation_id=automation_id).order_by(
        model.ordering
    ).all()

    result = []

    for row in rows:
        item = {
            "type": row.type,
            "configuration": json.loads(row.configuration or "{}")
        }
        
        if isinstance(row, AutomationTrigger):
            item["source_type"] = row.source_type
            item["source_id"] = row.source_id
        result.append(item)

    return result
