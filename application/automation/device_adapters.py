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
from threading import Lock

from expiringdict import ExpiringDict

import configuration as c
import database_utility as db_util
from automation.adapter_registry import AdapterRoutingError
from automation.domain import Capability, Event, EventType
from logger import logi, logw
from server_manager import app

RF_HUB_DUPLICATE_WINDOW_SECONDS = 0.1

class DeviceCommandAdapter:
    ############################################################################
    #
    #   @brief  Initializes the adapter for ZyraX LED controllers.
    #   @param  device_manager      Manager owning the LED controller instances
    #
    ############################################################################
    def __init__(self, device_manager):
        self.device_manager = device_manager

    ############################################################################
    #
    #   @brief  Returns capabilities implemented by the LED adapter.
    #   @return tuple               Supported capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return Capability.LEDSTRIP

    ############################################################################
    #
    #   @brief  Saves desired settings and sends the command to a LED controller.
    #   @param  command             Device or entity command
    #   @return bool                True on success or when already satisfied
    #
    ############################################################################
    def execute(self, command):
        device_id = command.target_id
        if command.target_type == "entity":
            target = db_util.get_command_target(command.target_type, device_id)
            if target is None:
                raise AdapterRoutingError(f"Entity not found: {device_id}")
            device_id = target["device_id"]

        ledstrip = self.device_manager._get_ledstrip(int(device_id))
        if ledstrip is None:
            raise AdapterRoutingError(f"No LED controller for device:{device_id}")

        if command.capability == Capability.STATE_REFRESH:
            return ledstrip.download_states()

        if command.capability == Capability.PIXELS_PREVIEW:
            return ledstrip.realtime_ledstrip_coloring(command.parameters["leds"])

        if command.capability == Capability.COLOR_SET:
            mode_id = c.LEDSTRIP_MODE_ID_COLOR
            parameters = [{"id": c.PARAMETER_ID_COLOR1, "value1": command.parameters["color"]}]
        elif command.capability == Capability.MODE_CONFIGURE:
            mode_id = command.parameters["mode"]
            parameters = command.parameters["configuration"]
        else:
            mode_id = None

        if mode_id is not None:
            with app.app_context():
                result = db_util.configure_ledstrip_mode(mode_id, ledstrip.id, parameters)
            if result is not True:
                return False
            return ledstrip.send_mode_configuration(mode_id)

        setters = {
            Capability.POWER_SET: ("power", ledstrip.set_power),
            Capability.BRIGHTNESS_SET: ("brightness", ledstrip.set_brightness),
            Capability.MODE_SET: ("mode", ledstrip.set_mode),
            Capability.POWER_ANIMATION_SET: ("power_animation", ledstrip.set_power_animation)
        }
        field, setter = setters[command.capability]
        value = int(command.parameters[field])
        if command.capability == Capability.POWER_SET:
            return self._set_power(ledstrip, value, command.context)

        if not db_util.update_device(ledstrip.id, {field: value})[0]:
            return False
        return setter(value)

    ############################################################################
    #
    #   @brief  Applies power unless the automation should leave it alone.
    #   @param  ledstrip            LED controller receiving the command
    #   @param  power               Desired power
    #   @param  context             Source and deduplication settings
    #   @return bool                True on success or when no change is needed
    #
    ############################################################################
    def _set_power(self, ledstrip, power, context):
        by_sensor = context.get("by_sensor", False)
        if context.get("skip_unchanged", True):
            device = db_util.get_device(ledstrip.id)
            if device.get("power") == power:
                return True
            if by_sensor and device.get("power") and not ledstrip.power_setted_by_sensor:
                return True

        if not db_util.update_device(ledstrip.id, {"power": power})[0]:
            return False
        return ledstrip.set_power(power, by_sensor)


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
        self.recent_receptions = ExpiringDict(
            max_len=1024, max_age_seconds=RF_HUB_DUPLICATE_WINDOW_SECONDS
        )
        self.reception_lock = Lock()
        self.device_receptions = ExpiringDict(
            max_len=1024, max_age_seconds=RF_HUB_DUPLICATE_WINDOW_SECONDS
        )
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
        code_lookup = {}
        devices = self.device_manager.get_devices_dict(
            type=c.DEVICE_TYPE_RF_DEVICE
        )

        for device in devices:
            for code in device.get("rf_codes", []):
                code_lookup.setdefault(
                    int(code["rf_code"]), []
                ).append((device["id"], code["type"]))

        self.code_lookup = code_lookup

    ############################################################################
    #
    #   @brief  Processes a received RF code using the lookup cache.
    #   @param  rf_code             Received RF code
    #   @return bool                True when the code is known
    #
    ############################################################################
    def receive_code(self, rf_code, source_id=None):
        rf_code = int(rf_code)
        matches = self.code_lookup.get(rf_code, [])
        if source_id is not None:
            with self.reception_lock:
                sources = self.recent_receptions.get(rf_code)
                if sources is not None and source_id not in sources:
                    sources.add(source_id)
                    logi(f"[RF] Duplicate code={rf_code} source={source_id}")
                    return bool(matches)
                # A second report from the same receiver starts a new burst.
                self.recent_receptions[rf_code] = {source_id}

        logi(f"[RF] Received code={rf_code} mappings={len(matches)}")

        self.event_dispatcher.publish(Event(
            event_type=EventType.RF_CODE_RECEIVED,
            source_type="rf_hub",
            source_id="local",
            payload={"rf_code": rf_code, "matched_devices": len(matches),
                     "receiver_id": source_id}
        ))

        for device_id, code_type in matches:
            self.receive_device_code(device_id, code_type, source_id)

        return len(matches) > 0

    ############################################################################
    #
    #   @brief  Handles a classified RF code, suppressing cross-receiver copies.
    #   @param  device_id           Master controller device ID
    #   @param  code_type           Configured RF signal type
    #   @param  source_id           Receiver identifier
    #
    ############################################################################
    def receive_device_code(self, device_id, code_type, source_id):
        handler = self.code_handlers.get(code_type)
        if handler is None:
            logw(f"[RF] Unsupported code type={code_type} device={device_id}")
            return
        if source_id is not None:
            key = (device_id, code_type)
            with self.reception_lock:
                sources = self.device_receptions.get(key)
                if sources is not None and source_id not in sources:
                    sources.add(source_id)
                    return
                self.device_receptions[key] = {source_id}

        device = db_util.get_device(device_id)
        if device:
            logi(f"[RF] Matched device={device_id} type={code_type} state={device['state']}")
            handler(device)

    ############################################################################
    #
    #   @brief  Activates an RF device.
    #   @param  device              RF device dictionary
    #
    ############################################################################
    def _activate(self, device):
        if device["state"]:
            logi(f"[RF] Device={device['id']} already active")
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
            logi(f"[RF] Device={device['id']} already inactive")
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
