################################################################################
#
# File:     device_adapters.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Adapters for existing devices and received RF signals.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c
import database_utility as db_util
from logger import logi

from automation.domain import Capability, Event, EventType


class DeviceCommandAdapter:
    ############################################################################
    #
    #   @brief  Initializes the existing-device command adapter.
    #   @param  device_manager      Device manager used by the adapter
    #
    ############################################################################
    def __init__(self, device_manager):
        self.device_manager = device_manager
        self.command_handlers = {
            Capability.POWER_SET: self._set_power,
            Capability.COLOR_SET: self._set_color,
            Capability.MODE_SET: self._set_mode
        }

    ############################################################################
    #
    #   @brief  Returns capabilities exposed by the adapter.
    #   @return list                Supported capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return list(self.command_handlers.keys())

    ############################################################################
    #
    #   @brief  Executes a device command.
    #   @param  command             Command to execute
    #
    ############################################################################
    def execute(self, command):
        return self.command_handlers[command.capability](command)

    ############################################################################
    #
    #   @brief  Sets device power.
    #   @param  command             Power command
    #
    ############################################################################
    def _set_power(self, command):
        device_id = int(command.target_id)
        power = int(command.parameters["power"])
        device = self.device_manager.get_device_dict(False, device_id)

        if device.get("power") == power:
            return

        if command.context.get("by_sensor", False) and \
                device["type"] == c.DEVICE_TYPE_LEDSTRIP:
            ledstrip = self.device_manager._get_ledstrip(id=device_id)

            if ledstrip.power and not ledstrip.power_setted_by_sensor:
                return

        return self.device_manager.set_device_power(
            device_id,
            power,
            command.context.get("by_sensor", False)
        )

    ############################################################################
    #
    #   @brief  Sets a LED-strip color.
    #   @param  command             Color command
    #
    ############################################################################
    def _set_color(self, command):
        return self.device_manager.set_ledstrip_color(
            int(command.target_id),
            command.parameters["color"]
        )

    ############################################################################
    #
    #   @brief  Sets a LED-strip mode.
    #   @param  command             Mode command
    #
    ############################################################################
    def _set_mode(self, command):
        return self.device_manager.set_ledstrip_mode(
            int(command.target_id),
            int(command.parameters["mode"])
        )


class RfInputAdapter:
    ############################################################################
    #
    #   @brief  Initializes the RF input adapter.
    #   @param  device_manager      Device manager used for state changes
    #   @param  event_dispatcher    Dispatcher for raw RF events
    #
    ############################################################################
    def __init__(self, device_manager, event_dispatcher):
        self.device_manager = device_manager
        self.event_dispatcher = event_dispatcher
        self.code_lookup = {}
        self.code_handlers = {
            c.RF_CODE_TYPE_ACTIVE: self._activate,
            c.RF_CODE_TYPE_INACTIVE: self._deactivate,
            c.RF_CODE_TYPE_TRIGGERED: self._trigger,
            c.RF_CODE_TYPE_LOW_BATTERY: self._set_low_battery
        }

    ############################################################################
    #
    #   @brief  Returns capabilities exposed by the RF input adapter.
    #   @return list                Supported capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return [Capability.RF_RECEIVE]

    ############################################################################
    #
    #   @brief  Executes an RF input command.
    #   @param  command             RF receive command
    #
    ############################################################################
    def execute(self, command):
        return self.receive_code(command.parameters["rf_code"])

    ############################################################################
    #
    #   @brief  Rebuilds the constant-time RF-code lookup.
    #
    ############################################################################
    def refresh(self):
        self.code_lookup = {}
        devices = self.device_manager.get_devices_dict(
            type=c.DEVICE_TYPE_RF_DEVICE
        )

        for device in devices:
            for code in device.get("rf_codes", []):
                self.code_lookup.setdefault(
                    int(code["rf_code"]), []
                ).append((device, code))

    ############################################################################
    #
    #   @brief  Processes a received RF code using the lookup cache.
    #   @param  rf_code             Received RF code
    #   @return bool                True when the code is known
    #
    ############################################################################
    def receive_code(self, rf_code):
        rf_code = int(rf_code)
        matches = self.code_lookup.get(rf_code, [])

        self.event_dispatcher.publish(Event(
            event_type=EventType.RF_CODE_RECEIVED,
            source_type="rf_bridge",
            source_id="local",
            payload={"rf_code": rf_code, "matched_devices": len(matches)}
        ))

        for device, code in matches:
            handler = self.code_handlers.get(code["type"])

            if handler is not None:
                handler(device)

        return len(matches) > 0

    ############################################################################
    #
    #   @brief  Activates an RF device.
    #   @param  device              RF device dictionary
    #
    ############################################################################
    def _activate(self, device):
        if device["state"]:
            return

        db_util.add_sensor_triggered(device["id"])
        self.device_manager.set_rf_device_state(device["id"], True)
        logi("[" + device["name"] + "] opened")

    ############################################################################
    #
    #   @brief  Deactivates an RF device.
    #   @param  device              RF device dictionary
    #
    ############################################################################
    def _deactivate(self, device):
        if not device["state"]:
            return

        self.device_manager.set_rf_device_state(device["id"], False)
        logi("[" + device["name"] + "] closed")

    ############################################################################
    #
    #   @brief  Processes a momentary RF trigger.
    #   @param  device              RF device dictionary
    #
    ############################################################################
    def _trigger(self, device):
        db_util.add_sensor_triggered(device["id"])

        if device["category"] == c.DEVICE_CATEGORY_REMOTE:
            self.event_dispatcher.publish(Event(
                event_type=EventType.BUTTON_PRESSED,
                source_type="device",
                source_id=device["id"],
                payload={"press_type": "short_press"}
            ))
        else:
            self.device_manager.set_rf_device_state(device["id"], True)

        logi("[" + device["name"] + "] triggered")

    ############################################################################
    #
    #   @brief  Sets the RF device low-battery flag.
    #   @param  device              RF device dictionary
    #
    ############################################################################
    def _set_low_battery(self, device):
        db_util.update_device(device["id"], {"low_battery": True})
        logi("[" + device["name"] + "] low battery triggered")
