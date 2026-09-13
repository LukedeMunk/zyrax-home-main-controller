################################################################################
#
# File:     DeviceManager.py
# Version:  0.9.0
# Author:   Luke de Munk
# Class:    DeviceManager
# Brief:    For configuring and handling device states and communicating with
#           the connected devices.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
from datetime import datetime                                                   #For scheduling purposes
from Ledstrip import Ledstrip                                                   #Import ledstrip class
from IpCamera import IpCamera                                                   #Import IpCamera class
from logger import logi, logw, loge                                             #Import logging functions
import database_utility as db_util                                              #Import utility for database functionality
import time
import os                                                                       #For file handling
from threading import Thread, Timer                                             #For threading and timing commands
from pythonping import ping                                                     #For pinging alarm deactivation devices
import network_scanner
from TelegramServiceClient import TelegramServiceClient
from automation import (AdapterRegistry, AutomationEngine,
                        AutomationRunService, Event, EventDispatcher, EventType)
from automation.device_adapters import DeviceCommandAdapter, RfInputAdapter

class DeviceManager:
    _instance = None

    ################################################################################
    #
    #   @brief  Makes the class singleton.
    #
    ################################################################################
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DeviceManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    ################################################################################
    #
    #   @brief  Initializes class.
    #
    ################################################################################
    def __init__(self):
        if self._initialized:
            return
        
        self.devices = []                                                           #Objects
        self.ledstrips = []                                                         #Objects
        self.cameras = []                                                           #Objects
        self.device_timers = []
        self.network_devices = []
        self.unconfigured_devices = []
        self._initialized = True
        self.telegram_client = TelegramServiceClient(
            base_url=c.TELEGRAM_SERVICE_URL,
            api_key=c.dynamic_config.microservice_key
        )
        self.adapter_registry = AdapterRegistry()
        self.event_dispatcher = EventDispatcher()
        self.automation_engine = AutomationEngine(self.adapter_registry)
        self.automation_run_service = AutomationRunService(
            self.automation_engine
        )
        self.automation_engine.set_run_service(self.automation_run_service)
        self.event_dispatcher.set_event_recorder(
            self.automation_run_service.record_event
        )
        self.event_dispatcher.subscribe(self.automation_engine.handle_event)

        self.device_command_adapter = DeviceCommandAdapter(self)
        self.rf_input_adapter = RfInputAdapter(self, self.event_dispatcher)
        self.adapter_registry.register(
            "existing_devices",
            self.device_command_adapter
        )
        self.adapter_registry.register("rf_input", self.rf_input_adapter)

    ################################################################################
    #
    #   @brief  Initializes class.
    #
    ################################################################################
    def initialize(self):
        self.load_devices()
        self.initialize_ledstrips()

        self.check_timed_automations()
        logi(c.TEXT_DEVICE_MANAGER_STARTED)

#region Device functionality
    ################################################################################
    #
    #   @brief  Adds the specified unconfigured connected device to the list.
    #   @param  ip                  IP of the device
    #   @param  hostname            Hostname of the device
    #
    ################################################################################
    def add_unconfigured_device_to_list(self, ip, hostname):
        for strip in self.unconfigured_devices:
            if strip["ip"] == ip:
                logw(c.VAR_TEXT_IP_ALREADY_IN_UNCONFIGURED_LIST.format(ip))
                return
            
            if strip["hostname"] == hostname:
                logw(c.VAR_TEXT_HOSTNAME_ALREADY_IN_UNCONFIGURED_LIST.format(hostname))
                return
            
        self.unconfigured_devices.append({"ip": ip, "hostname": hostname})

    ################################################################################
    #
    #   @brief  Sets the power of the specified device.
    #   @param  id                  Device ID
    #   @param  power               On (1) / Off (0)
    #
    ################################################################################
    def set_device_power(self, id, power, by_sensor_automation=False):
        device = db_util.get_device(id)
        db_util.update_device(id, {"power" : power})

        if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
            self._get_ledstrip(id).set_power(power, by_sensor_automation)

    ################################################################################
    #
    #   @brief  Returns the devices in a list of dictionaries.
    #   @param  update_states       If True, the states get requested from the
    #                               devices
    #   @param  type                Device type
    #   @return list                List of dictionaries with devices
    #
    ################################################################################
    def get_devices_dict(self, update_states=False, type=None):
        devices = db_util.get_devices(type)

        if not update_states or (type is not None and type != c.DEVICE_TYPE_LEDSTRIP):
            return devices
        
        for device in devices:
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                thread_update_states = Thread(target=self._download_ledstrip_states, args=(device["id"],))
                thread_update_states.start()
        
        return devices
    
    ################################################################################
    #
    #   @brief  Returns the specified device.
    #   @param  update_states       If True, the states get requested from the
    #                               device
    #   @param  id                  Device ID
    #   @return dict                Dictionary of the device
    #
    ################################################################################
    def get_device_dict(self, update_states=False, id=None):
        if not update_states:
            device = db_util.get_device(id)
            return device
        
        self._get_ledstrip(id, update_states)
        
        device = db_util.get_device(id)
        return device

    ################################################################################
    #
    #   @brief  Deletes the specified device.
    #   @param  id                  Device ID
    #
    ################################################################################
    def delete_device(self, id):
        db_util.delete_device(id)
        self.load_devices()

    ################################################################################
    #
    #   @brief  Updates the specified device.
    #   @param  id                  Device ID
    #   @param  config_dict         Configuration dictionary
    #
    ################################################################################
    def update_device(self, id, config_dict):
        db_util.update_device(id, config_dict)
        self.load_devices()
    
    ################################################################################
    #
    #   @brief  Returns the unconfigured connected devices.
    #   @return list                Dictionary list with unconfigured devices
    #
    ################################################################################
    def get_unconfigured_devices(self):
        return self.unconfigured_devices
    
    ################################################################################
    #
    #   @brief  Returns the connected network devices.
    #   @return list                Dictionary list with network devices
    #
    ################################################################################
    def get_network_devices(self, filter_system_devices=False, scan=False):
        if scan or len(network_scanner.connected_devices) == 0:
            network_devices = network_scanner.get_connected_devices()
        else:
            network_devices = network_scanner.connected_devices
            
        network_devices = [d for d in network_devices if d.get("hostname") != "homesystem.home"]

        if not filter_system_devices:
            return network_devices
        
        system_devices = db_util.get_devices(c.DEVICE_TYPE_LEDSTRIP)
        system_devices += db_util.get_devices(c.DEVICE_TYPE_IP_CAMERA)

        system_ips = {d["ip_address"] for d in system_devices}                      #Create a set of IPs
        filtered_devices = [d for d in network_devices if d["ip_address"] not in system_ips]        #Filter network_devices

        return filtered_devices
#endregion

#region Ledstrip functionality
    ################################################################################
    #
    #   @brief  Initializes the ledstrips by checking connection and synchronizing
    #           them.
    #
    ################################################################################
    def initialize_ledstrips(self):
        logi(c.TEXT_INITIALIZING_LEDSTRIPS)

        for ledstrip in self.ledstrips:
            self.check_ledstrip_connection_status(ledstrip.id)
            if ledstrip.connection_status:
                self.synchronize_ledstrip(ledstrip.id)
            else:
                loge(c.VAR_TEXT_COULD_NOT_CONNECT_TO_LEDSTRIP.format(ledstrip.name))

    ################################################################################
    #
    #   @brief  Updates the firmware of the ledstrip.
    #   @param  version             Firmware version to update to
    #
    ################################################################################
    def update_ledstrip_firmware(self, version):
        logi(c.TEXT_UPDATING_LEDSTRIP_FIRMWARE)

        filename = version + ".bin"
        path = os.path.join(c.OTA_FILE_DIRECTORY_PATH, filename)

        if not os.path.exists(path):
            return (False, c.TEXT_FIRMWARE_FILE_NOT_FOUND)
        
        all_success = True
        for ledstrip in self.ledstrips:
            if not ledstrip.update_ledstrip_firmware(version):
                all_success = False
                
        if all_success:
            return (True)
        
        return (False, c.TEXT_NOT_ALL_LEDSTRIPS_UPDATING)
    
    ################################################################################
    #
    #   @brief  Returns the specified ledstrip including LED addressing.
    #   @param  id                  Device ID
    #   @return dict                Dictionary of the ledstrip
    #
    ################################################################################
    def get_ledstrip_with_leds(self, id):
        return db_util.get_ledstrip(id, True)
        
    ################################################################################
    #
    #   @brief  Calculates and returns the OTA update progress of the ledstrips.
    #   @return int                 OTA progress (0-100)
    #
    ################################################################################
    def get_ledstrip_ota_progress(self):
        number_of_ledstrips = len(self.ledstrips)
        number_finished = 0

        for ledstrip in self.ledstrips:
            if ledstrip.ota_state == c.OTA_STATE_FINISHED:
                number_finished += 1
                
        progress = number_finished / number_of_ledstrips * 100
        return progress
    
    ################################################################################
    #
    #   @brief  Sets the OTA state of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  state               State to set
    #
    ################################################################################
    def set_ledstrip_ota_state(self, id, state):
        self._get_ledstrip(id).ota_state = state
            
    ################################################################################
    #
    #   @brief  Reboots the specified ledstrip.
    #   @param  id                  Device ID
    #
    ################################################################################
    def reboot_ledstrip(self, id):
        ledstrip = self._get_ledstrip(id)
        ledstrip.reboot()
            
    ################################################################################
    #
    #   @brief  Synchronizes the specified ledstrip.
    #   @param  id                  Device ID
    #
    ################################################################################
    def synchronize_ledstrip(self, id):
        thread_synchronize = Thread(target=self._synchronize_ledstrip_thread, args=(id,))
        thread_synchronize.start()

    ################################################################################
    #
    #   @brief  Synchronizes the specified ledstrip.
    #   @param  id                  Device ID
    #   @return tuple               (False, [response]) on error and (True) on
    #                               success
    #
    ################################################################################
    def _synchronize_ledstrip_thread(self, id):
        ledstrip_db = db_util.get_device(id=id)
        ledstrip = self._get_ledstrip(id, True)

        if not ledstrip.connection_status:
            return
        
        ledstrip_config = self._get_ledstrip(id).download_configuration()[1]

        if ledstrip_db["id"] != ledstrip_config["id"]:
            ledstrip.set_id(ledstrip.id)

        if ledstrip_db["hostname"] != ledstrip_config["hostname"]:#TODO test
            ledstrip.set_hostname(ledstrip_db["hostname"])
            logw("Hostname different")
            #Controller reboots
            return (True)

        if ledstrip_db["model_id"] != ledstrip_config["model_id"]:
            ledstrip.set_model(ledstrip_db["model_id"])
            logw("model different")
            #Controller reboots
            return (True)

        if ledstrip_db["number_of_leds"] != ledstrip_config["number_of_leds"]:
            ledstrip.update_led_addressing()

        if ledstrip_db["power_animation"] != ledstrip_config["power_animation"]:
            ledstrip.set_power_animation(ledstrip.power_animation)

        if ledstrip_db["firmware_version"] != ledstrip_config["firmware_version"]:
            db_util.update_device(id, {"firmware_version": ledstrip_config["firmware_version"]})

        if ledstrip_config["firmware_version"] not in c.COMPATIBLE_LEDSTRIP_FIRMWARE_VERSIONS:
            logw(c.VAR_TEXT_FIRMWARE_OF_LEDSTRIP_NOT_COMPATIBLE.format(ledstrip_db["name"], ledstrip_config["firmware_version"]))
            #TODO update firmware

        if ledstrip_db["has_sensor"] != ledstrip_config["has_sensor"]:
            ledstrip.update_sensor(has_sensor=ledstrip_db["has_sensor"])
        if ledstrip_db["sensor_inverted"] != ledstrip_config["sensor_inverted"]:
            ledstrip.update_sensor(sensor_inverted=ledstrip_db["sensor_inverted"])
        if ledstrip_db["sensor_model"] != ledstrip_config["sensor_model"]:
            ledstrip.update_sensor(sensor_model=ledstrip_db["sensor_model"])
            #Controller reboots
            return (True)

        #Synchronize mode configurations
        result = ledstrip.download_mode_configurations()
        if not result[0]:
            return result
        
        modes_ledstrip = result[1]
        for mode in modes_ledstrip:
            if not self._compare_ledstrip_mode_configurations(mode, db_util.get_ledstrip_mode_configuration(mode["mode"], id)):
                ledstrip.send_mode_configuration(mode["mode"], False)
                time.sleep(0.1)
                continue

        if ledstrip_db["mode"] != ledstrip.mode:
            ledstrip.set_mode(ledstrip.mode)
        if ledstrip_db["brightness"] != ledstrip.brightness:
            ledstrip.set_brightness(ledstrip.brightness)
        if ledstrip_db["power"] != ledstrip.power:
            ledstrip.set_power(ledstrip.power)
        if ledstrip_db["sensor_state"] != ledstrip.sensor_state:
            db_util.update_device(id, {"sensor_state": ledstrip.sensor_state})

        return (True)

    ################################################################################
    #
    #   @brief  Sets the brightness of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  brightness          Brightness to set (0-255)
    #
    ################################################################################
    def set_ledstrip_brightness(self, id, brightness):
        db_util.update_device(id, {"brightness" : brightness})

        self._get_ledstrip(id).set_brightness(brightness)
        
    ################################################################################
    #
    #   @brief  Returns the color of the specified ledstrip.
    #   @param  id                  Device ID
    #   @return string              Color in HEX format
    #
    ################################################################################
    def get_ledstrip_color(self, id):
        parameter = db_util.get_ledstrip_mode_configuration(c.LEDSTRIP_MODE_ID_COLOR, id)["parameters"][0]
        return parameter["value1"]

    ################################################################################
    #
    #   @brief  Sends the drawn LEDs in the UI to the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  leds                List of colors for the ledstrip
    #
    ################################################################################
    def realtime_ledstrip_coloring(self, id, leds):
        self._get_ledstrip(id).realtime_ledstrip_coloring(leds)

    ################################################################################
    #
    #   @brief  Sets the color of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  color               Color to set (HEX string)
    #
    ################################################################################
    def set_ledstrip_color(self, id, color):
        color_parameter = [{
            "id": c.PARAMETER_ID_COLOR1,
            "value1" : color
        }]

        db_util.configure_ledstrip_mode(c.LEDSTRIP_MODE_ID_COLOR, id, color_parameter)
        self._get_ledstrip(id).send_mode_configuration(c.LEDSTRIP_MODE_ID_COLOR)

    ################################################################################
    #
    #   @brief  Sets the mode of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  mode                Mode to set
    #
    ################################################################################
    def set_ledstrip_mode(self, id, mode):
        db_util.update_device(id, {"mode" : mode})
        self._get_ledstrip(id).set_mode(mode)
    
    ################################################################################
    #
    #   @brief  Sets the power animation of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  power_animation     Power animation to set
    #
    ################################################################################
    def set_ledstrip_power_animation(self, id, power_animation):
        db_util.update_device(id, {"power_animation" : power_animation})
        self._get_ledstrip(id).set_power_animation(power_animation)

    ################################################################################
    #
    #   @brief  Updates the specified mode configuration of the specified ledstrip.
    #   @param  mode_id             Mode to configure
    #   @param  device_id           Device ID
    #   @param  config_list         Dictionary list of configuration parameters
    #
    ################################################################################
    def configure_ledstrip_mode(self, mode_id, device_id, config_list):
        db_util.configure_ledstrip_mode(mode_id, device_id, config_list)
        self._get_ledstrip(device_id).send_mode_configuration(mode_id)

    ################################################################################
    #
    #   @brief  Updates the specified mode configuration of the specified group.
    #   @param  mode_id             Mode to configure
    #   @param  group_id            Group ID
    #   @param  config_list         Dictionary list of configuration parameters
    #
    ################################################################################
    def configure_ledstrip_group_mode(self, mode_id, group_id, config_list):
        group = db_util.get_group(id=group_id)

        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                db_util.configure_ledstrip_mode(mode_id, device_id, config_list)
                self._get_ledstrip(device_id).send_mode_configuration(mode_id)

    ################################################################################
    #
    #   @brief  Checks the connection status of a ledstrip.
    #   @param  id                  Device ID
    #   @return bool                True if connected
    #
    ################################################################################
    def check_ledstrip_connection_status(self, id):
        self._get_ledstrip(id).check_connection_status()
        status = self._get_ledstrip(id).connection_status
        return status
    
    ################################################################################
    #
    #   @brief  Sets the ledstrip sensor state of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  sensor_state        1 == open, 0 == closed
    #
    ################################################################################
    def set_ledstrip_sensor_state(self, id, sensor_state):
        db_util.update_device(id, {"sensor_state": sensor_state})

        #Check alarm and automations
        #if sensor_state:
        #    self.check_alarm(id)
        
        #self.check_ledstrip_sensor_automations(id, sensor_state) TODO implement
#endregion

#region RF functionality
    ################################################################################
    #
    #   @brief  Processes the specified RF code and executes actions if needed.
    #   @param  rf_code             RF code to process
    #
    ################################################################################
    def process_rf_signal(self, rf_code):
        return self.rf_input_adapter.receive_code(rf_code)
#endregion

#region Sensor functionality
    ################################################################################
    #
    #   @brief  Updates the state of the specified RF device and executes actions if
    #           needed.
    #   @param  id                  Device ID
    #   @param  state               Opened(1) / Closed(0)
    #
    ################################################################################
    def set_rf_device_state(self, id, state):
        rf_device = db_util.get_device(id)

        if rf_device["category"] == c.DEVICE_CATEGORY_MOTION_SENSOR:
            self._set_motion_sensor_state(id, state)
            return

        #When tap switch, toggle state
        if rf_device["model_id"] == c.RF_SWITCH_MODEL_ID_TAP:
            state = not rf_device["state"]
        
        if rf_device["state"] == state:
            return
        
        db_util.update_device(id, {"state" : state})

        #Check alarm and automations
        if state:
            self.check_alarm(id)
        
        self.check_sensor_automations(id, state)
#endregion

#region Motion sensor functionality
    ################################################################################
    #
    #   @brief  Updates the state of the specified motion sensor and executes
    #           actions if needed.
    #   @param  id                  Device ID
    #   @param  state               Triggered(1) / Not triggered(0)
    #
    ################################################################################
    def _set_motion_sensor_state(self, id, state):
        sensor = db_util.get_device(id)
        state_changed = False

        #Delete timers
        index = self.get_index_from_id(self.device_timers, id)
        if index != -1:
            self.device_timers[index]["timer"].cancel()
            self.device_timers.pop(index)

        #Update device
        if state != sensor["state"]:
            state_changed = True
            db_util.update_device(id, {"state" : state})

        #If state, after 15 seconds of no signal, state is off
        if state:
            self.device_timers.append({"id": id, "timer": Timer(15, self._set_motion_sensor_state, args=[id, False])})
            self.device_timers[self.get_index_from_id(self.device_timers, id)]["timer"].start()
        
        #Check alarm and automations
        if state:
            self.check_alarm(id)
        
        if not state_changed:
            return
        
        self.check_sensor_automations(id, state)
#endregion

#region Device group functionality
    ################################################################################
    #
    #   @brief  Sets the power of the specified group.
    #   @param  id                  Group ID
    #   @param  power               On(1) / Off(0)
    #
    ################################################################################
    def set_device_group_power(self, id, power):
        group = db_util.get_group(id=id)

        if c.DEVICE_TYPE_RF_DEVICE in group["types"] or c.DEVICE_TYPE_IP_CAMERA in group["types"]:
            logw("RF devices and cameras cannot be turned off")
        
        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] != c.DEVICE_TYPE_RF_DEVICE and device["type"] != c.DEVICE_TYPE_IP_CAMERA:
                self.set_device_power(device_id, power)

        if power == 1:
            logi("Group [" + group["name"] + "] turned on")
        else:
            logi("Group [" + group["name"] + "] turned off")
#endregion

#region Ledstrip group functionality
    ################################################################################
    #
    #   @brief  Sets the brightness of the specified group.
    #   @param  id                  Group ID
    #   @param  brightness          Brightness to set (0-255)
    #
    ################################################################################
    def set_ledstrip_group_brightness(self, id, brightness):
        if (brightness > c.MAX_LEDSTRIP_BRIGHTNESS):                                #Protect min and max brightness
            brightness = c.MAX_LEDSTRIP_BRIGHTNESS
        elif (brightness < c.MIN_LEDSTRIP_BRIGHTNESS):
            brightness = c.MIN_LEDSTRIP_BRIGHTNESS
            
        group = db_util.get_group(id=id)
        
        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.set_ledstrip_brightness(device_id, brightness)

    ################################################################################
    #
    #   @brief  Sets the color of the specified group.
    #   @param  id                  Group ID
    #   @param  color               Color to set (HEX string)
    #
    ################################################################################
    def set_ledstrip_group_color(self, id, color):
        group = db_util.get_group(id=id)

        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.set_ledstrip_color(device_id, color)

    ################################################################################
    #
    #   @brief  Sets the mode of the specified group.
    #   @param  id                  Group ID
    #   @param  mode                Mode to set
    #
    ################################################################################
    def set_ledstrip_group_mode(self, id, mode):
        group = db_util.get_group(id=id)

        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.set_ledstrip_mode(device_id, mode)

    ################################################################################
    #
    #   @brief  Sets the power animation of the specified group.
    #   @param  id                  Group ID
    #   @param  power_animation     Power animation to set
    #
    ################################################################################
    def set_ledstrip_group_power_animation(self, id, power_animation):
        group = db_util.get_group(id=id)
        
        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.set_ledstrip_power_animation(device_id, power_animation)
#endregion

#region Automation functionality
    ################################################################################
    #
    #   @brief  Registers an integration adapter and its capabilities.
    #   @param  name                Unique adapter name
    #   @param  adapter             Adapter instance
    #
    ################################################################################
    def register_integration_adapter(self, name, adapter):
        self.adapter_registry.register(name, adapter)

    ################################################################################
    #
    #   @brief  Publishes a protocol-independent event.
    #   @param  event               Event to publish
    #
    ################################################################################
    def publish_event(self, event):
        self.event_dispatcher.publish(event)

    ################################################################################
    #
    #   @brief  Enabled or disables the specified automation
    #   @param  id                  Automation ID
    #   @param  enabled             True to enable
    #
    ################################################################################
    def set_automation_enabled(self, id, enabled):
        return db_util.update_automation(id, {"enabled" : enabled})

    ################################################################################
    #
    #   @brief  Checks whether one of the timed automations needs to be executed and
    #           executes them.
    #
    ################################################################################
    def check_timed_automations(self):
        self.automation_run_service.process_time_triggers()

    ################################################################################
    #
    #   @brief  Checks whether one of the sensor automations needs to be executed
    #           and executes them.
    #   @param  id                  ID of the sensor to set state
    #   @param  state               Opened/Active(1) / Closed/Inactive(0)
    #
    ################################################################################
    def check_sensor_automations(self, id, state):
        self.event_dispatcher.publish(Event(
            event_type=EventType.DEVICE_STATE_CHANGED,
            source_type="device",
            source_id=id,
            payload={"state": int(state)}
        ))

#endregion

#region Alarm functionality
    ################################################################################
    #
    #   @brief  Checks whether the alarm needs to be triggered or not.
    #   @param  id                  Sensor ID
    #
    ################################################################################
    def check_alarm(self, id):
        alarm = db_util.get_alarm()

        if not alarm["armed"]:
            return
        
        #connected_devices = network_scanner.get_connected_devices()                #TODO: To be implemented

        #for device in alarm["deactivation_devices"]:
        #    for wifi_device in connected_devices:
        #        if wifi_device["mac_address"] == device["mac_address"]:
        #            return#device present

        alarm_triggered = False
        for device_id in alarm["trigger_device_ids"]:
            if id == device_id:
                alarm_triggered = True
                break

        if not alarm_triggered:
            return
        
        self.alarm_activated(id)

    ################################################################################
    #
    #   @brief  Checks whether the alarm needs to be triggered or not.
    #   @param  trigger_device_id   Sensor ID
    #
    ################################################################################
    def alarm_activated(self, trigger_device_id):
        logi("Alarm activated")

        db_util.update_alarm({"activated": True})
        db_util.add_alarm_trigger_time(trigger_device_id)
        self.telegram_client.send_message("Alarm triggered!")

        #TODO: strips in alarm mode
#endregion

#region Ledstrip database functionality
    ################################################################################
    #
    #   @brief  Downloads the states of the specified ledstrip.
    #   @param  id                  Device ID
    #
    ################################################################################
    def _download_ledstrip_states(self, id):
        self._get_ledstrip(id, True)
    
    ################################################################################
    #
    #   @brief  Returns the specified ledstrip object.
    #   @param  id                  Device ID
    #   @param  update_states       If True, the states get downloaded
    #   @return Ledstrip            Ledstrip object, or None
    #
    ################################################################################
    def _get_ledstrip(self, id, update_states=False):
        for ledstrip in self.ledstrips:
            if ledstrip.id == id:
                if update_states:
                    ledstrip.download_states()
                    
                return ledstrip
            
        return None
    
    ################################################################################
    #
    #   @brief  Returns the ledstrips in a list of dictionaries.
    #   @param  id          ID of the ledstrip to return
    #   @return ledstrips   Dicts of ledstrips
    #
    ################################################################################
    def get_ledstrip_dict(self, id, update_states=False):
        if update_states:
            self._get_ledstrip(id=id).download_states()
            
        return db_util.get_device(id=id)
    
    ################################################################################
    #
    #   @brief  Returns the specified ledstrip object.
    #   @param  ip                  IP of the ledstrip to return
    #   @return Ledstrip            Ledstrip object, or None
    #
    ################################################################################
    def get_ledstrip_by_ip(self, ip):
        for ledstrip in self.ledstrips:
            if ledstrip.ip_address == ip:
                return ledstrip
            
        return None
    
    ################################################################################
    #
    #   @brief  Returns the specified ledstrip object.
    #   @param  ip                  Hostname of the ledstrip to return
    #   @return Ledstrip            Ledstrip object, or None
    #
    ################################################################################
    def get_ledstrip_by_hostname(self, hostname):
        for ledstrip in self.ledstrips:
            if ledstrip.hostname == hostname:
                return ledstrip
            
        return None
    
    ################################################################################
    #
    #   @brief  Adds a ledstrip to the database.
    #   @param  config_dict         Configuration dictionary
    #   @return tuple               (False, [reason]) on error and (True, [id]) on
    #                               success
    #
    ################################################################################
    def add_ledstrip(self, config_dict):
        config_dict["type"] = c.DEVICE_TYPE_LEDSTRIP
        result = db_util.add_device(config_dict)

        if not result[0]:
            return result
        
        self.load_devices()

        if self.check_ledstrip_connection_status(result[1]):
            self.synchronize_ledstrip(result[1])
        
        return result

    ################################################################################
    #
    #   @brief  Updates the specified ledstrip addressing.
    #   @param  id                  Device ID
    #   @param  config_dict         Address configuration dictionary
    #   @return bool                True on success
    #
    ################################################################################
    def update_ledstrip_led_addressing(self, id, config_dict):
        ledstrip = self._get_ledstrip(id)
        result = ledstrip.update_led_addressing(config_dict)

        if not result[0]:
            return False

        self.load_devices()

        return True
    
    ################################################################################
    #
    #   @brief  Updates the configuration of the specified ledstrip.
    #   @param  id                  Device ID
    #   @param  config_dict         Configuration dictionary
    #   @return bool                True on success
    #
    ################################################################################
    def update_ledstrip(self, id, config_dict):
        ledstrip = self._get_ledstrip(id)
        result = ledstrip.configure(config_dict)

        if not result[0]:
            return result
        
        self.load_devices()

        return result

    ################################################################################
    #
    #   @brief  Returns the ledstrip mode configuration parameters in dictionaries.
    #   @param  id                  Device ID
    #   @return dict                Dictionary list with the mode configurations
    #
    ################################################################################
    def get_ledstrip_mode_configurations(self, id):
        return db_util.get_ledstrip_mode_configurations(id)
    
    ################################################################################
    #
    #   @brief  Returns the ledstip modes.
    #   @return dict                Dictionary list with modes
    #
    ################################################################################
    def get_ledstrip_modes(self):
        return db_util.get_ledstrip_modes()
    
#endregion

#region Sensor database functionality
    ################################################################################
    #
    #   @brief  Adds an RF device to the database.
    #   @param  config_dict         Configuration dictionary
    #
    ################################################################################
    def add_rf_device(self, config_dict):
        config_dict["type"] = c.DEVICE_TYPE_RF_DEVICE
        return db_util.add_device(config_dict)
#endregion

#region Group database functionality
    ################################################################################
    #
    #   @brief  Returns a list of group dictionaries.
    #   @return list                Dictionary list with groups
    #
    ################################################################################
    def get_groups(self):
        return db_util.get_groups()
    
    ################################################################################
    #
    #   @brief  Returns the specified group dictionary.
    #   @param  id                  Group ID
    #   @return dict                Dictionary of the group
    #
    ################################################################################
    def get_group(self, id):
        return db_util.get_group(id=id)
    
    ################################################################################
    #
    #   @brief  Adds a group to the database.
    #   @param  config_dict         Configuration dictionary
    #   @return tuple               (False, [reason]) on error and (True, [id]) on
    #                               success
    #
    ################################################################################
    def add_group(self, config_dict):
        return db_util.add_group(config_dict)

    ################################################################################
    #
    #   @brief  Updates the specified group.
    #   @param  id                  Group ID
    #   @param  config_dict         Configuration dictionary
    #
    ################################################################################
    def update_group(self, id, config_dict):
        result = db_util.update_group(id, config_dict)
        if "name" in config_dict:
            config_dict.pop("name")
        if "icon" in config_dict:
            config_dict.pop("icon")

        group = db_util.get_group(id)

        for device_id in group["device_ids"]:
            device = db_util.get_device(device_id)
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.update_ledstrip(device_id, config_dict)
            elif device["type"] == c.DEVICE_TYPE_RF_DEVICE:
                db_util.update_device(device_id, config_dict)

        return result

    ################################################################################
    #
    #   @brief  Deletes the specified group with the given ID.
    #   @param  id                  Group ID
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def delete_group(self, id):
        return db_util.delete_group(id)
#endregion

#region Automation database functionality
    ################################################################################
    #
    #   @brief  Adds an automation to the database.
    #   @param  automation_dict     Dictionary of the automation
    #   @return tuple               (False, [reason]) on error and (True, [id]) on
    #                               success
    #
    ################################################################################
    def add_automation(self, automation_dict):
        return db_util.add_automation(automation_dict)

    ################################################################################
    #
    #   @brief  Updates the specified automation.
    #   @param  id                  Automation ID
    #   @param  config_dict         Configuration dictionary
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def update_automation(self, id, automation_dict):
        return db_util.update_automation(id, automation_dict)

    ################################################################################
    #
    #   @brief  Deletes the specified automation.
    #   @param  id                  Automation ID
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def delete_automation(self, id):
        return db_util.delete_automation(id)

    ################################################################################
    #
    #   @brief  Returns the automations in the database.
    #   @return list                Dictionary list with automations
    #
    ################################################################################
    def get_automations(self):
        return db_util.get_automations()
#endregion

#region Alarm database functionality
    ################################################################################
    #
    #   @brief  Updates the alarm.
    #   @param  config_dict         Configuration dictionary
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def update_alarm(self, config_dict):
        return db_util.update_alarm(config_dict)
    
    ################################################################################
    #
    #   @brief  Adds the specified deactivation device to the alarm.
    #   @param  device_dict         Deactivation device dictionary
    #   @return tuple               (False, [reason]) on error and (True, [id]) on
    #                               success
    #
    ################################################################################
    def add_alarm_deactivation_device(self, device_dict):
        mac = network_scanner.get_mac_address(device_dict["ip_address"])

        if mac is None:
            return (False, "MAC address not found")
        
        device_dict["mac_address"] = mac
        return db_util.add_alarm_deactivation_device(device_dict)
    
    ################################################################################
    #
    #   @brief  Updates the specified alarm deactivation device.
    #   @param  device_id           Deactivation device ID
    #   @param  device_dict         Deactivation device dictionary
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def update_alarm_deactivation_device(self, device_id, device_dict):
        return db_util.update_alarm_deactivation_device(device_id, device_dict)
    
    ################################################################################
    #
    #   @brief  Deletes the specified alarm deactivation device.
    #   @param  device_id           Deactivation device ID
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def delete_alarm_deactivation_device(self, id):
        return db_util.delete_alarm_deactivation_device(id)
    
    ################################################################################
    #
    #   @brief  Adds the specified trigger device to the alarm.
    #   @param  device_id           Trigger device ID
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def add_alarm_trigger_device(self, id):
        return db_util.add_alarm_trigger_device(id)
    
    ################################################################################
    #
    #   @brief  Deletes the specified alarm trigger device.
    #   @param  device_id           Trigger device ID
    #   @return tuple               (False, [reason]) on error and (True) on
    #                               success
    #
    ################################################################################
    def delete_alarm_trigger_device(self, id):
        return db_util.delete_alarm_trigger_device(id)
#endregion

#region Loading functionalty
    ################################################################################
    #
    #   @brief  Loads devices from database into RAM.
    #
    ################################################################################
    def load_devices(self):
        self.devices = db_util.get_devices()                                        #Get data from database
        self.ledstrips = []                                                         #Reset list
        self.cameras = []                                                           #Reset list

        # The temporary receiver connected directly to the Raspberry Pi is
        # configured independently from an RF/IR bridge. Recalculate both
        # capability flags on every reload so removing a bridge cannot leave
        # stale True values behind.
        rf_bridge_present = False
        
        #Create a list of sensor objects
        for device in self.devices:
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                self.ledstrips.append(Ledstrip(device))
            if device["type"] == c.DEVICE_TYPE_IP_CAMERA:
                self.cameras.append(IpCamera(device))
            if device["type"] == c.DEVICE_TYPE_RF_BRIDGE:
                rf_bridge_present = True

        c.RF_RECEIVER_PRESENT = (
            bool(c.dynamic_config.rpi_rf_enabled) or rf_bridge_present
        )
        c.RF_TRANSMITTER_PRESENT = rf_bridge_present

        if hasattr(self, "rf_input_adapter"):
            self.rf_input_adapter.refresh()
#endregion

#region Utilities functionalty
    ################################################################################
    #
    #   @brief  Returns the ready ledstrip OTA versions.
    #   @param  list                List of OTA versions ready
    #
    ################################################################################
    def get_ledstrip_ota_versions(self):
        ota_versions = [f[:-4] for f in os.listdir(c.OTA_FILE_DIRECTORY_PATH) if os.path.isfile(os.path.join(c.OTA_FILE_DIRECTORY_PATH, f))]

        for version in ota_versions:
            version = version

        return ota_versions
    
    ################################################################################
    #
    #   @brief  Returns the connected alarm deactivation devices.
    #   @param  deactivation_device_dict    Dictionary list of devices
    #   @return list                        Dictionary list of the connected devices
    #
    ################################################################################
    def get_connected_alarm_deactivation_devices(self, deactivation_device_dict):
        connected_list = []
        return []
        for device in deactivation_device_dict:
            result = ping(device["ip_address"], timeout=4)
            if result.success():
                connected_list.append(device)

        return connected_list
    
    ################################################################################
    #
    #   @brief  Returns whether the time is within the time window.
    #   @param  start_minutes       Start in minutes from 00:00
    #   @param  end_minutes         End in minutes from 00:00
    #   @return bool                True if time is in the specified time window
    #
    ################################################################################
    def check_time_window(self, start_minutes, end_minutes):
        now = datetime.now()
        now_minutes = now.hour * 60 + now.minute

        return start_minutes <= now_minutes <= end_minutes
    
    ################################################################################
    #
    #   @brief  Compares the specified ledstrip mode configurations.
    #   @param  ledstrip_mode       Configuration of the ledstrip
    #   @param  db_mode             Configuration in the database
    #   @return bool                True if configurations are the same
    #
    ################################################################################
    def _compare_ledstrip_mode_configurations(self, ledstrip_mode, db_mode):
        if ledstrip_mode["mode"] != db_mode["id"]:
            return False
        
        if len(ledstrip_mode["parameters"]) != len(db_mode["parameters"]):
            logw("Number of parameters differ. This could cause problems, mode [" + str(ledstrip_mode["mode"]) + "]")
            return False
        
        parameters_compared = 0
                    
        for ledstrip_param in ledstrip_mode["parameters"]:
            for db_param in db_mode["parameters"]:
                if int(ledstrip_param["id"]) == int(db_param["mode_parameter_id"]):
#TODO value 2
                    if db_param["value1"] == "False" or db_param["value1"] == "True":
                        db_param["value1"] = db_param["value1"].casefold() == "true"

                    if isinstance(db_param["value1"], bool):
                        db_param["value1"] = int(db_param["value1"])

                    if str(ledstrip_param["value1"]) == str(db_param["value1"]):
                        parameters_compared += 1
                    else:
                        logi(str(ledstrip_param["id"]) + " not the same, mode: " + str(ledstrip_mode["mode"]))
                        logi("DB value1: " + str(db_param["value1"]) + ", strip value1: " + str(ledstrip_param["value1"]))
                        return False
                    
        if parameters_compared == len(ledstrip_mode["parameters"]):
            return True

        loge("Mode parameter names don't match, mode [" + str(ledstrip_mode["mode"]) + "]")
        return False
        
    ################################################################################
    #
    #   @brief  Returns the index of the specified ID in the specified dictionary
    #           list.
    #   @param  list                List to look in
    #   @param  id                  ID to look for
    #   @return bool                Index of the ID
    #
    ################################################################################
    def get_index_from_id(self, list, id):
        index = 0
        for item in list:
            if item["id"] == id:
                return index
            index += 1
            
        return -1
#endregion
