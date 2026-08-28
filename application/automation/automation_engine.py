################################################################################
#
# File:     automation_engine.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Evaluates automation triggers and creates protocol-independent
#           commands for matching automation actions.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from datetime import datetime

import configuration as c
import database_utility as db_util

from automation.domain import Capability, Command, EventType


class AutomationEngine:
    ############################################################################
    #
    #   @brief  Initializes the automation engine.
    #   @param  adapter_registry    Registry used to execute commands
    #
    ############################################################################
    def __init__(self, adapter_registry):
        self.adapter_registry = adapter_registry
        self.run_service = None
        self.action_handlers = {}
        self.condition_handlers = {}

        self.register_action_handler(
            c.AUTOMATION_ACTION_SET_DEVICE_POWER,
            self._create_power_commands
        )
        self.register_action_handler(
            c.AUTOMATION_ACTION_SET_LEDSTRIP_COLOR,
            self._create_color_commands
        )
        self.register_action_handler(
            c.AUTOMATION_ACTION_SET_LEDSTRIP_MODE,
            self._create_mode_commands
        )
        self.register_action_handler(
            c.AUTOMATION_ACTION_COMMAND,
            self._create_capability_commands
        )

        self.register_condition_handler(
            "time_window",
            self._check_time_window_condition
        )
        self.register_condition_handler(
            "device_state",
            self._check_device_state_condition
        )
        #self.register_condition_handler(
        #    "minimum_temperature",
        #    self._check_minimum_temperature_condition
        #)

    ############################################################################
    #
    #   @brief  Sets the service responsible for scheduling automation runs.
    #   @param  run_service         Automation run service
    #
    ############################################################################
    def set_run_service(self, run_service):
        self.run_service = run_service

    ############################################################################
    #
    #   @brief  Registers an automation action handler.
    #   @param  action_type         Action type
    #   @param  handler             Command factory callback
    #
    ############################################################################
    def register_action_handler(self, action_type, handler):
        self.action_handlers[action_type] = handler

    ############################################################################
    #
    #   @brief  Registers an automation condition handler.
    #   @param  condition_type      Condition type
    #   @param  handler             Condition callback
    #
    ############################################################################
    def register_condition_handler(self, condition_type, handler):
        self.condition_handlers[condition_type] = handler

    ############################################################################
    #
    #   @brief  Evaluates an event against indexed automation triggers.
    #   @param  event               Event to evaluate
    #
    ############################################################################
    def handle_event(self, event):
        if self.run_service is None:
            return

        automations = db_util.get_automations_for_event(
            event.event_type,
            event.source_id
        )

        for automation in automations:
            if not automation["enabled"]:
                continue

            if not self._triggers_match(automation, event):
                continue

            if not self.conditions_match(automation, event.occurred_at):
                continue

            delay_seconds = int(automation.get("delay_minutes", 0)) * 60
            self.run_service.run_automation(
                automation,
                event=event,
                source="event",
                delay_seconds=delay_seconds
            )

    ############################################################################
    #
    #   @brief  Returns automations matching the specified time slot.
    #   @param  date_time           Date and time slot
    #   @return list                Matching automations
    #
    ############################################################################
    def get_time_automations(self, date_time):
        automations = db_util.get_automations(
            c.AUTOMATION_TRIGGER_TIMER,
            True
        )
        current_day = date_time.weekday()
        current_time = date_time.strftime("%H:%M")

        return [
            automation for automation in automations
            if automation["enabled"] and
            current_day in automation["days"] and
            automation["time"] == current_time
        ]

    ############################################################################
    #
    #   @brief  Evaluates all conditions of an automation.
    #   @param  automation          Automation dictionary
    #   @param  occurred_at         Evaluation time
    #   @return bool                True when all conditions match
    #
    ############################################################################
    def conditions_match(self, automation, occurred_at=None):
        occurred_at = occurred_at or datetime.now(c.TIME_ZONE)

        if occurred_at.tzinfo is not None:
            occurred_at = occurred_at.astimezone(c.TIME_ZONE)

        for condition in automation.get("conditions", []):
            handler = self.condition_handlers.get(condition["type"])

            if handler is None or not handler(
                    condition.get("configuration", {}),
                    occurred_at):
                return False

        return True

    ############################################################################
    #
    #   @brief  Creates commands for every action of an automation.
    #   @param  automation          Automation dictionary
    #   @param  context             Automation run context
    #   @return list                Commands to execute
    #
    ############################################################################
    def create_commands(self, automation, context=None):
        commands = []
        context = context or {}

        for action in automation.get("actions", []):
            handler = self.action_handlers.get(action["type"])

            if handler is None:
                raise ValueError(
                    "Unsupported automation action: " + action["type"]
                )

            commands.extend(handler(
                action.get("configuration", {}),
                context
            ))

        return commands

    ############################################################################
    #
    #   @brief  Executes a protocol-independent command.
    #   @param  command             Command to execute
    #   @return                     Adapter result
    #
    ############################################################################
    def execute_command(self, command):
        return self.adapter_registry.execute(command)

    ############################################################################
    #
    #   @brief  Returns whether one of the automation triggers matches an event.
    #   @param  automation          Automation dictionary
    #   @param  event               Event to match
    #   @return bool                True when a trigger matches
    #
    ############################################################################
    def _triggers_match(self, automation, event):
        for trigger in automation.get("triggers", []):
            if trigger["type"] != event.event_type:
                continue

            configuration = trigger.get("configuration", {})
            source_ids = configuration.get("source_ids", [])

            if source_ids and int(event.source_id) not in [
                    int(source_id) for source_id in source_ids]:
                continue

            expected_state = configuration.get("state")
            if expected_state is not None and int(expected_state) != int(
                    event.payload.get("state", -1)):
                continue

            press_type = configuration.get("press_type")
            if press_type is not None and press_type != event.payload.get(
                    "press_type"):
                continue

            return True

        return False

    ############################################################################
    #
    #   @brief  Evaluates a possibly overnight time-window condition.
    #   @param  configuration       Time-window configuration
    #   @param  occurred_at         Evaluation time
    #   @return bool                True when the condition matches
    #
    ############################################################################
    def _check_time_window_condition(self, configuration, occurred_at):
        start_minutes = int(configuration["start_minutes"])
        end_minutes = int(configuration["end_minutes"])
        current_minutes = occurred_at.hour * 60 + occurred_at.minute

        if start_minutes <= end_minutes:
            is_in_window = start_minutes <= current_minutes <= end_minutes
        else:
            is_in_window = (
                current_minutes >= start_minutes or
                current_minutes <= end_minutes
            )

        return is_in_window == bool(configuration.get("active_in_window", True))
    
    ############################################################################
    #
    #   @brief  Checks whether a device has the configured state.
    #   @param  configuration       Condition configuration
    #   @return bool                True when the condition matches
    #
    ############################################################################
    def _check_device_state_condition(self, configuration):
        device = db_util.get_device(configuration["device_id"])

        if not device:
            return False

        return int(device["state"]) == int(configuration["state"])
    
    ############################################################################
    #
    #   @brief  Creates power commands for all configured targets.
    #   @param  configuration       Action configuration
    #   @param  context             Automation run context
    #   @return list                Power commands
    #
    ############################################################################
    def _create_power_commands(self, configuration, context):
        parameters = self._parameter_dictionary(configuration)

        return self._commands_for_targets(
            Capability.POWER_SET,
            configuration,
            {"power": int(parameters["power"])},
            context
        )

    ############################################################################
    #
    #   @brief  Creates color commands for all configured targets.
    #   @param  configuration       Action configuration
    #   @param  context             Automation run context
    #   @return list                Color commands
    #
    ############################################################################
    def _create_color_commands(self, configuration, context):
        parameters = self._parameter_dictionary(configuration)

        return self._commands_for_targets(
            Capability.COLOR_SET,
            configuration,
            {"color": parameters["color"]},
            context
        )

    ############################################################################
    #
    #   @brief  Creates mode commands for all configured targets.
    #   @param  configuration       Action configuration
    #   @param  context             Automation run context
    #   @return list                Mode commands
    #
    ############################################################################
    def _create_mode_commands(self, configuration, context):
        parameters = self._parameter_dictionary(configuration)

        return self._commands_for_targets(
            Capability.MODE_SET,
            configuration,
            {"mode": int(parameters["mode"])},
            context
        )

    ############################################################################
    #
    #   @brief  Creates arbitrary capability commands for integration adapters.
    #   @param  configuration       Action configuration
    #   @param  context             Automation run context
    #   @return list                Capability commands
    #
    ############################################################################
    def _create_capability_commands(self, configuration, context):
        commands = []
        target_type = configuration.get("target_type", "entity")

        for target_id in configuration.get("target_ids", []):
            commands.append(Command(
                capability=configuration["capability"],
                target_type=target_type,
                target_id=target_id,
                parameters=configuration.get("parameters", {}),
                context=context,
                correlation_id=context.get("correlation_id"),
                causation_id=context.get("causation_id")
            ))

        return commands

    ############################################################################
    #
    #   @brief  Creates one command for every action target.
    #   @param  capability          Command capability
    #   @param  configuration       Action configuration
    #   @param  parameters          Command parameters
    #   @param  context             Automation run context
    #   @return list                Created commands
    #
    ############################################################################
    def _commands_for_targets(self, capability, configuration, parameters, context):
        commands = []

        for target_id in configuration.get("target_device_ids", []):
            commands.append(Command(
                capability=capability,
                target_type="device",
                target_id=target_id,
                parameters=parameters,
                context=context,
                correlation_id=context.get("correlation_id"),
                causation_id=context.get("causation_id")
            ))

        return commands

    ############################################################################
    #
    #   @brief  Converts action parameters to a name-value dictionary.
    #   @param  configuration       Action configuration
    #   @return dict                Parameter dictionary
    #
    ############################################################################
    def _parameter_dictionary(self, configuration):
        return {
            parameter["name"]: parameter["value"]
            for parameter in configuration.get("parameters", [])
        }
