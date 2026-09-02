################################################################################
#
# File:     automation_run_service.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Schedules, persists and executes automation runs and action history.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from datetime import datetime, timedelta
from time import sleep
from uuid import NAMESPACE_URL, uuid5

import configuration as c
import database_utility as db_util
from logger import loge, logi
from automation.domain import Capability, Event, EventType


class AutomationRunService:
    SCHEDULER_MISFIRE_GRACE_MINUTES = 15

    ############################################################################
    #
    #   @brief  Initializes the automation run service.
    #   @param  automation_engine   Automation engine used for execution
    #
    ############################################################################
    def __init__(self, automation_engine):
        self.automation_engine = automation_engine

    ############################################################################
    #
    #   @brief  Persists a domain event.
    #   @param  event               Event to persist
    #
    ############################################################################
    def record_event(self, event):
        db_util.add_domain_event(event)

    ############################################################################
    #
    #   @brief  Runs an automation by ID.
    #   @param  automation_id       Automation ID
    #   @param  event               Optional triggering event
    #   @param  source              Run source
    #   @return tuple               Success flag and run ID or error
    #
    ############################################################################
    def run_by_id(self, automation_id, event=None, source="manual"):
        automation = db_util.get_automation(id=automation_id)

        if automation is None:
            return (False, "UI_TEXT_AUTOMATION_NOT_FOUND")

        if not automation["enabled"]:
            return (False, "UI_TEXT_AUTOMATION_DISABLED")

        return self.run_automation(
            automation,
            event=event,
            source=source
        )

    ############################################################################
    #
    #   @brief  Persists and optionally executes an automation run.
    #   @param  automation          Automation dictionary
    #   @param  event               Optional triggering event
    #   @param  source              Run source
    #   @param  delay_seconds       Delay before execution
    #   @param  scheduled_for       Explicit schedule date and time
    #   @param  deduplication_key   Optional unique run key
    #   @return tuple               Success flag and run ID or error
    #
    ############################################################################
    def run_automation(
            self,
            automation,
            event=None,
            source="manual",
            delay_seconds=0,
            scheduled_for=None,
            deduplication_key=None):
        
        current_date_time = datetime.now(c.TIME_ZONE)

        logi("run_automation")
        concurrency_policy = automation.get("concurrency_policy", c.AUTOMATION_CONCURRENCY_RESTART)
        active_run = db_util.get_active_automation_run(automation["id"])

        if concurrency_policy == c.AUTOMATION_CONCURRENCY_SINGLE and active_run is not None:
            return (True, active_run["id"])

        if concurrency_policy == c.AUTOMATION_CONCURRENCY_RESTART:
            db_util.cancel_pending_automation_runs(automation["id"])

        scheduled_for = scheduled_for or (
            current_date_time + timedelta(seconds=delay_seconds)
        )

        event_id = None
        if event is not None:
            event_id = event.id
            
        correlation_id = (
            event.get_correlation_id() if event is not None else None
        )

        result = db_util.add_automation_run({
            "automation_id": automation["id"],
            "event_id": event_id,
            "correlation_id": correlation_id,
            "source": source,
            "status": c.AUTOMATION_RUN_STATUS_PENDING,
            "scheduled_for": scheduled_for,
            "deduplication_key": deduplication_key
        })

        if not result[0]:
            return result

        run_id = result[1]

        if scheduled_for <= current_date_time:
            self.execute_run(run_id)

        return (True, run_id)

    ############################################################################
    #
    #   @brief  Atomically claims and executes a persisted automation run.
    #   @param  run_id              Automation run ID
    #   @return bool                True when executed
    #
    ############################################################################
    def execute_run(self, run_id):
        if not db_util.claim_automation_run(run_id):
            return False

        run = db_util.get_automation_run(run_id)
        automation = db_util.get_automation(id=run["automation_id"])

        if automation is None:
            db_util.finish_automation_run(run_id, c.AUTOMATION_RUN_STATUS_FAILED, "Automation no longer exists")
            return False

        context = {
            "by_sensor": run["source"] == "event",
            "correlation_id": run.get("correlation_id"),
            "causation_id": run.get("event_id")
        }

        try:
            commands = self.automation_engine.create_commands(
                automation,
                context
            )

            command_errors = []

            for command in commands:
                action_run_id = db_util.add_automation_action_run(
                    run_id,
                    command
                )

                try:
                    if command.capability == Capability.AUTOMATION_WAIT:
                        sleep(command.parameters["duration_seconds"])
                    else:
                        self.automation_engine.execute_command(command)
                    db_util.finish_automation_action_run(
                        action_run_id,
                        c.AUTOMATION_RUN_STATUS_COMPLETED
                    )
                except Exception as exception:
                    db_util.finish_automation_action_run(
                        action_run_id,
                        c.AUTOMATION_RUN_STATUS_FAILED,
                        str(exception)
                    )
                    if automation.get("error_policy", c.AUTOMATION_ERROR_STOP) == c.AUTOMATION_ERROR_STOP:
                        raise

                    command_errors.append(str(exception))

            if command_errors:
                error = "; ".join(command_errors)
                db_util.finish_automation_run(run_id, c.AUTOMATION_RUN_STATUS_FAILED, error)
                return False

            db_util.finish_automation_run(run_id, c.AUTOMATION_RUN_STATUS_COMPLETED)
            logi(c.VAR_TEXT_AUTOMATION_EXECUTED.format(automation["name"]))
            return True

        except Exception as exception:
            error = str(exception)
            db_util.finish_automation_run(run_id, c.AUTOMATION_RUN_STATUS_FAILED, error)
            loge("Automation execution failed: " + error)
            return False

    ############################################################################
    #
    #   @brief  Executes all persisted runs that are due.
    #
    ############################################################################
    def process_pending_runs(self):
        for run_id in db_util.get_due_automation_run_ids(
                datetime.now(c.TIME_ZONE)):
            
            self.execute_run(run_id)

    ############################################################################
    #
    #   @brief  Creates deduplicated runs for all due time triggers.
    #
    ############################################################################
    def process_time_triggers(self):
        current_date_time = datetime.now(c.TIME_ZONE).replace(second=0, microsecond=0)
        last_checked_at = db_util.get_automation_scheduler_check()

        if last_checked_at is None:
            first_slot = current_date_time
        else:
            if last_checked_at.tzinfo is None:
                last_checked_at = c.TIME_ZONE.localize(last_checked_at)

            first_slot = last_checked_at + timedelta(minutes=1)

        grace_start = current_date_time - timedelta(minutes=self.SCHEDULER_MISFIRE_GRACE_MINUTES)
        first_slot = max(first_slot, grace_start)
        slot = first_slot

        while slot <= current_date_time:
            for automation in self.automation_engine.get_time_automations(slot):
                deduplication_key = ("time:" + str(automation["id"]) + ":" + slot.isoformat())
                
                event = Event(
                    event_type=EventType.TIME,
                    source_type="scheduler",
                    source_id="system",
                    payload={
                        "automation_id": automation["id"],
                        "scheduled_for": slot.isoformat()
                    },
                    occurred_at=slot,
                    id=str(uuid5(NAMESPACE_URL, deduplication_key))
                )
                self.record_event(event)
                self.run_automation(
                    automation,
                    event=event,
                    source="scheduler",
                    scheduled_for=slot,
                    deduplication_key=deduplication_key
                )

            slot += timedelta(minutes=1)

        db_util.set_automation_scheduler_check(current_date_time)
        self.process_pending_runs()
