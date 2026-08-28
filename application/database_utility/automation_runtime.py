################################################################################
#
# File:     automation_runtime.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Persists domain events and automation execution history.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from datetime import datetime
import json

import configuration as c
from server_manager import *

from . import database_core as core


################################################################################
#
#   @brief  Adds a domain event to the event history.
#   @param  event               Event to persist
#   @return tuple               Database result
#
################################################################################
def add_domain_event(event):
    with app.app_context():
        existing_event = DomainEvent.query.filter_by(id=event.id).first()

        if existing_event is not None:
            return (True, event.id)

        db.session.add(DomainEvent(
            id=event.id,
            type=event.event_type,
            source_type=event.source_type,
            source_id=str(event.source_id),
            payload=json.dumps(event.payload),
            correlation_id=event.correlation_id,
            causation_id=event.causation_id,
            occurred_at=event.occurred_at
        ))
        success, error = core.commit_with_handling()

        if not success:
            return (False, error)

        return (True, event.id)


################################################################################
#
#   @brief  Adds an automation run to the execution history.
#   @param  configuration       Run configuration
#   @return tuple               Success flag and run ID or error
#
################################################################################
def add_automation_run(configuration):
    with app.app_context():
        deduplication_key = configuration.get("deduplication_key")

        if deduplication_key is not None:
            existing_run = AutomationRun.query.filter_by(
                deduplication_key=deduplication_key
            ).first()

            if existing_run is not None:
                return (True, existing_run.id)

        run = AutomationRun(
            automation_id=configuration["automation_id"],
            event_id=configuration.get("event_id"),
            correlation_id=configuration.get("correlation_id"),
            source=configuration["source"],
            status=configuration["status"],
            scheduled_for=configuration["scheduled_for"],
            deduplication_key=deduplication_key
        )
        db.session.add(run)
        success, error = core.commit_with_handling()

        if not success:
            if deduplication_key is not None:
                existing_run = AutomationRun.query.filter_by(
                    deduplication_key=deduplication_key
                ).first()

                if existing_run is not None:
                    return (True, existing_run.id)

            return (False, error)

        return (True, run.id)


################################################################################
#
#   @brief  Atomically changes a pending run to running.
#   @param  run_id              Automation run ID
#   @return bool                True when the run was claimed
#
################################################################################
def claim_automation_run(run_id):
    with app.app_context():
        updated_rows = AutomationRun.query.filter_by(
            id=run_id,
            status=c.AUTOMATION_RUN_STATUS_PENDING
        ).update({
            "status": c.AUTOMATION_RUN_STATUS_RUNNING,
            "started_at": datetime.now(c.TIME_ZONE)
        })
        success, error = core.commit_with_handling()
        return success and updated_rows == 1


################################################################################
#
#   @brief  Finishes an automation run.
#   @param  run_id              Automation run ID
#   @param  status              Final status
#   @param  error               Optional error message
#
################################################################################
def finish_automation_run(run_id, status, error=None):
    with app.app_context():
        run = AutomationRun.query.filter_by(id=run_id).first()

        if run is None:
            return (False, "UI_TEXT_AUTOMATION_RUN_NOT_FOUND")

        run.status = status
        run.error = error
        run.finished_at = datetime.now(c.TIME_ZONE)
        return core.commit_with_handling()


################################################################################
#
#   @brief  Returns an automation run.
#   @param  run_id              Automation run ID
#   @return dict                Automation run dictionary
#
################################################################################
def get_automation_run(run_id):
    with app.app_context():
        run = AutomationRun.query.filter_by(id=run_id).first()
        return core.row_to_dictionary(run, date_to_string=False)


################################################################################
#
#   @brief  Returns due pending automation run IDs.
#   @param  due_at              Latest schedule time
#   @return list                Due run IDs
#
################################################################################
def get_due_automation_run_ids(due_at):
    with app.app_context():
        runs = AutomationRun.query.filter(
            AutomationRun.status == c.AUTOMATION_RUN_STATUS_PENDING,
            AutomationRun.scheduled_for <= due_at
        ).order_by(AutomationRun.scheduled_for).all()
        return [run.id for run in runs]


################################################################################
#
#   @brief  Returns the first pending or running run for an automation.
#   @param  automation_id       Automation ID
#   @return dict                Active run dictionary or None
#
################################################################################
def get_active_automation_run(automation_id):
    with app.app_context():
        run = AutomationRun.query.filter(
            AutomationRun.automation_id == automation_id,
            AutomationRun.status.in_([
                c.AUTOMATION_RUN_STATUS_PENDING,
                c.AUTOMATION_RUN_STATUS_RUNNING
            ])
        ).order_by(AutomationRun.id).first()

        if run is None:
            return None

        return core.row_to_dictionary(run, date_to_string=False)


################################################################################
#
#   @brief  Cancels pending runs for an automation.
#   @param  automation_id       Automation ID
#   @return tuple               Database result
#
################################################################################
def cancel_pending_automation_runs(automation_id):
    with app.app_context():
        AutomationRun.query.filter_by(
            automation_id=automation_id,
            status=c.AUTOMATION_RUN_STATUS_PENDING
        ).update({
            "status": c.AUTOMATION_RUN_STATUS_CANCELLED,
            "finished_at": datetime.now(c.TIME_ZONE)
        })
        return core.commit_with_handling()


################################################################################
#
#   @brief  Adds an action run to the execution history.
#   @param  run_id              Parent automation run ID
#   @param  command             Command being executed
#   @return int                 Action run ID
#
################################################################################
def add_automation_action_run(run_id, command):
    with app.app_context():
        action_run = AutomationActionRun(
            automation_run_id=run_id,
            command_id=command.id,
            capability=command.capability,
            target_type=command.target_type,
            target_id=str(command.target_id),
            parameters=json.dumps(command.parameters),
            status=c.AUTOMATION_RUN_STATUS_RUNNING,
            started_at=datetime.now(c.TIME_ZONE)
        )
        db.session.add(action_run)
        success, error = core.commit_with_handling()

        if not success:
            raise RuntimeError(error)

        return action_run.id


################################################################################
#
#   @brief  Finishes an action run.
#   @param  action_run_id       Action run ID
#   @param  status              Final status
#   @param  error               Optional error message
#
################################################################################
def finish_automation_action_run(action_run_id, status, error=None):
    with app.app_context():
        action_run = AutomationActionRun.query.filter_by(
            id=action_run_id
        ).first()

        if action_run is None:
            return (False, "UI_TEXT_AUTOMATION_ACTION_RUN_NOT_FOUND")

        action_run.status = status
        action_run.error = error
        action_run.finished_at = datetime.now(c.TIME_ZONE)
        return core.commit_with_handling()


################################################################################
#
#   @brief  Returns recent automation runs and their action history.
#   @param  automation_id       Optional automation ID
#   @param  limit               Maximum number of runs
#   @return list                Automation run dictionaries
#
################################################################################
def get_automation_runs(automation_id=None, limit=100):
    with app.app_context():
        query = AutomationRun.query

        if automation_id is not None:
            query = query.filter_by(automation_id=automation_id)

        runs = query.order_by(AutomationRun.id.desc()).limit(limit).all()
        run_list = []

        for run in runs:
            run_dictionary = core.row_to_dictionary(run)
            action_runs = AutomationActionRun.query.filter_by(
                automation_run_id=run.id
            ).order_by(AutomationActionRun.id).all()
            run_dictionary["actions"] = [
                core.row_to_dictionary(action_run)
                for action_run in action_runs
            ]
            run_list.append(run_dictionary)

        return run_list


################################################################################
#
#   @brief  Returns the last persisted scheduler check.
#   @return datetime            Last scheduler check or None
#
################################################################################
def get_automation_scheduler_check():
    with app.app_context():
        state = AutomationSchedulerState.query.filter_by(id=1).first()
        return None if state is None else state.last_checked_at


################################################################################
#
#   @brief  Persists the last scheduler check.
#   @param  checked_at          Scheduler check time
#
################################################################################
def set_automation_scheduler_check(checked_at):
    with app.app_context():
        state = AutomationSchedulerState.query.filter_by(id=1).first()

        if state is None:
            state = AutomationSchedulerState(id=1)
            db.session.add(state)

        state.last_checked_at = checked_at
        return core.commit_with_handling()
