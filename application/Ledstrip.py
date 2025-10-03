################################################################################
#
# File:     Ledstrip.py
# Version:  0.9.0
# Author:   Luke de Munk
# Class:    Ledstrip
# Brief:    For handling ledstrip functionality and storing states.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
import requests                                                                 #Import requests for sending commands over HTTP
from logger import logi, logw, loge                                             #Import logging functions
import socket                                                                   #Import socket for checking connection
import database_utility as db_util                                              #Import utility for database functionality
import json                                                                     #To generate JSON response strings

class Ledstrip:
    ################################################################################
    #
    #   @brief  Initializes class.
    #
    ################################################################################
    def __init__(self, init_dict):
        self.id = init_dict["id"]
        self.name = init_dict["name"]
        self.hostname = init_dict["hostname"]
        self.ip_address = init_dict["ip_address"]
        self.port = init_dict["port"]
        self.firmware_version = init_dict["firmware_version"]
        self.sd_card_inserted = init_dict["sd_card_inserted"]
        self.power = init_dict["power"]
        self.brightness = init_dict["brightness"]
        self.mode = init_dict["mode"]
        self.power_animation = init_dict["power_animation"]
        self.driver = init_dict["driver"]
        self.has_sensor = init_dict["has_sensor"]
        self.sensor_inverted = init_dict["sensor_inverted"]
        self.sensor_model = init_dict["sensor_model"]
        self.sensor_state = init_dict["sensor_state"]
        
        self.power_setted_by_sensor = False
        self.ota_state = c.OTA_STATE_FINISHED
        self.connection_status = False

    ################################################################################
    #
    #   @brief  Sends the specified command with the specified parameters.
    #   @param  command                 Command to send (HTTP url)
    #   @param  parameters_dict         Dictionary of parameters
    #   @return tuple                   (False, [reason]) on error and (True,
    #                                   [response]) on success
    #
    ################################################################################
    def send_command(self, command, parameters_dict={}):
        parameter_string = ""
        
        for parameter in parameters_dict:
            parameter_string += parameter + "="                                     #Parameter name
            parameter_string += str(parameters_dict[parameter]) + "&"               #Parameter value

        parameter_string = parameter_string[0:-1]
        url = "http://" + self.hostname + ".home/" + command + "?" + parameter_string

        try:
            response = requests.get(url, timeout=10)
            self.check_connection_status(True)
        except:
            self.check_connection_status(False)
            logw("[" + url + "] could not be sended to [" + self.name + "]")
            return (False, "")

        logi("Sent [" + url + "] to [" + self.name + "]")

        if response.status_code != c.HTTP_CODE_OK:
            return (False, response.text)
        
        response = response.text
        if response == "":
            return (True, response)
        
        try:
            response = json.loads(response)
        except:
            loge("JSON error, string: " + response)
            
        return (True, response)

    ################################################################################
    #
    #   @brief  Sends the specified POST command with the specified parameters.
    #   @param  command                 Command to send (HTTP url)
    #   @param  parameters_dict         Dictionary of parameters
    #   @return tuple                   (False, [reason]) on error and (True,
    #                                   [response]) on success
    #
    ################################################################################
    def send_post_command(self, command, parameters_dict={}):
        url = "http://" + self.hostname + ".home/" + command
        
        try:
            response = requests.post(url=url, data=parameters_dict, timeout=10)
            self.check_connection_status(True)
        except:
            self.check_connection_status(False)
            loge(url + " could not be sended to [" + self.name + "]")
            print(parameters_dict)
            return (False, "")

        logi("Sent [" + url + "] to [" + self.name + "]")
        print(parameters_dict)

        if response.status_code != c.HTTP_CODE_OK:
            return (False, response.text)
        
        response = response.text
        if response == "":
            return (True, response)
        
        try:
            response = json.loads(response)
        except:
            loge("JSON error, string: " + response)
        
        return (True, response)

    ################################################################################
    #
    #   @brief  Updates the configuration of the ledstrip.
    #   @param  config_dict             Configuration dictionary
    #   @return tuple                   (False, [reason]) on error and (True,
    #                                   [response]) on success
    #
    ################################################################################
    def configure(self, config_dict):
        db_util.update_device(self.id, config_dict)

        config_dict.pop("name", None)
        config_dict.pop("ip", None)

        if len(config_dict.values()) == 0:
            return (True, "")

        config_dict["id"] = self.id

        result = self.send_post_command(c.CMD_SET_CONFIGURATION, config_dict)

        if result[0]:
            logi("Updated ledstrip [" + self.name + "]")
            if "hostname" in config_dict:
                self.hostname = config_dict["hostname"]
        else:
            loge("Could not update ledstrip [" + self.name + "], error [" + result[1] + "]")

        return result
        
    ################################################################################
    #
    #   @brief  Downloads the states from the ledstrip.
    #   @return bool                    True if successful
    #
    ################################################################################
    def download_states(self):
        result = self.send_command(c.CMD_GET_STATES)
        
        if not result[0]:
            loge("Cannot get states")
            return False
        
        state_dict = {}

        if int(result[1]["power"]) != self.power:
            self.power = int(result[1]["power"])
            state_dict["power"] = self.power

        if int(result[1]["brightness"]) != self.brightness:
            self.brightness = int(result[1]["brightness"])
            state_dict["brightness"] = self.brightness

        if int(result[1]["mode"]) != self.mode:
            self.mode = int(result[1]["mode"])
            state_dict["mode"] = self.mode

        if int(result[1]["sd_card_inserted"]) != self.sd_card_inserted:
            self.sd_card_inserted = int(result[1]["sd_card_inserted"])
            state_dict["sd_card_inserted"] = self.sd_card_inserted

        if state_dict != {}:
            db_util.update_device(self.id, state_dict)
        
        return True
        
    ################################################################################
    #
    #   @brief  Downloads the mode configurations from the ledstrip.
    #   @return tuple               (False, [reason]) on error and (True,
    #                               [response]) on success
    #
    ################################################################################
    def download_mode_configurations(self):
        result = self.send_command(c.CMD_GET_MODE_CONFIGURATIONS)

        if not result[0]:
            loge("Cannot get mode configurations")

        return result
    
    ################################################################################
    #
    #   @brief  Downloads the configuration from the ledstrip.
    #   @return tuple               (False, [reason]) on error and (True,
    #                               [response]) on success
    #
    ################################################################################
    def download_configuration(self):
        result = self.send_command(c.CMD_GET_CONFIGURATION)
        
        if not result[0]:
            loge("Cannot get configuration")

        return result

    ################################################################################
    #
    #   @brief  TO BE IMPLEMENTED
    #   @return bool                    True if successful
    #
    ################################################################################
    #def download_sensor_triggers(self):
    #    result = self.send_command(c.CMD_GET_CONFIGURATION)
    #    
    #    if not result[0]:
    #        loge("Cannot get sensor triggers")
    #        return False
    
    #    return True
    
    ################################################################################
    #
    #   @brief  Sets the ID of the ledstrip.
    #   @param  id                      Device ID
    #   @return bool                    True if successful
    #
    ################################################################################
    def set_id(self, id):
        self.id = id
        result = self.send_post_command(c.CMD_SET_CONFIGURATION, {"id" : id})
        
        return result[0]
    
    ################################################################################
    #
    #   @brief  Updates the LED addressing of the ledstrip.
    #   @param  address_dict            Dictionary list of the addresses, None to
    #                                   only send the addressing to the ledstrip
    #   @return bool                    True if successful
    #
    ################################################################################
    def update_led_addressing(self, address_dict=None):
        if address_dict is not None:
            db_util.update_device(self.id, address_dict)
            
        db_ledstrip = db_util._get_ledstrip(self.id, True)
        leds = []

        for led in db_ledstrip["leds"]:
            leds.append(led["address"])

        return self.send_post_command(c.CMD_SET_CONFIGURATION, {"led_addresses" : "[" + ", ".join(str(address) for address in leds) + "]", "number_of_leds": len(leds)})

    ################################################################################
    #
    #   @brief  Updates the connection status of the ledstrip.
    #   @param  status                  Status to set, None to check the status
    #
    ################################################################################
    def check_connection_status(self, status=None):
        if status is not None:
            self.connection_status = status
            db_util.update_device(self.id, {"connection_status" : self.connection_status})
            return
        
        self.connection_status = False

        logi(self.hostname)
        try:
            ip = socket.gethostbyname(self.hostname)
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            socket.setdefaulttimeout(1)
            if s.connect_ex((ip, self.port)) == 0:
                self.connection_status = True

            s.close()
        except:
            loge("socket.gaierror: [Errno 11001] getaddrinfo failed")
        
        db_util.update_device(self.id, {"connection_status" : self.connection_status})
    
    ################################################################################
    #
    #   @brief  Reboots the controller.
    #   @return bool                    True if successful
    #
    ################################################################################
    def reboot(self):
        result = self.send_post_command(c.CMD_REBOOT)
        return result[0]

    ################################################################################
    #
    #   @brief  Sends the OTA firmware update command to the ledstrip.
    #   @param  version                 Version to update to
    #   @return bool                    True if successful
    #
    ################################################################################
    def update_ledstrip_firmware(self, version):
        self.firmware_version = version
        self.ota_state = c.OTA_STATE_DOWNLOADING_FIRMWARE

        result = self.send_post_command(c.CMD_UPDATE_FIRMWARE, {"version" : version})
        return result[0]

    ################################################################################
    #
    #   @brief  Updates the power.
    #   @param  power                   On(1)/Off(0)
    #   @return bool                    True if successful
    #
    ################################################################################
    def set_power(self, power, by_sensor_automation=False):
        self.power = power
        self.power_setted_by_sensor = by_sensor_automation
        result = self.send_post_command(c.CMD_SET_POWER, {"power" : power})
        return result[0]

    ################################################################################
    #
    #   @brief  Updates the brightness.
    #   @param  brightness              Brightness to set (0-255)
    #   @return bool                    True if successful
    #
    ################################################################################
    def set_brightness(self, brightness):            
        self.brightness = int(brightness)
        result = self.send_post_command(c.CMD_SET_BRIGHTNESS, {"brightness" : self.brightness})
        return result[0]

    ################################################################################
    #
    #   @brief  Updates the mode.
    #   @param  mode                    Mode to set
    #   @return bool                    True if successful
    #
    ################################################################################
    def set_mode(self, mode):
        self.mode = int(mode)
        result = self.send_post_command(c.CMD_SET_MODE, {"mode" : self.mode})
        return result[0]

    ################################################################################
    #
    #   @brief  Updates the (real-time) ledstrip coloring.
    #   @param  leds                    List of HEX color strings for the
    #                                   corresponding LEDs
    #   @return bool                    True if successful
    #
    ################################################################################
    def realtime_ledstrip_coloring(self, leds):
        result = self.send_post_command(c.CMD_DRAW_LEDS, {"leds" : "['" + "', '".join(str(color)[1:] for color in leds) + "']"})
        return result[0]

    ################################################################################
    #
    #   @brief  Sends mode configuration parameters to the ledstrip.
    #   @param  mode_id                 Mode ID
    #   @param  start_mode              If True, the mode is started in the ledstrip
    #   @return bool                    True if successful
    #
    ################################################################################
    def send_mode_configuration(self, mode_id, start_mode=True):
        mode_config = db_util.get_ledstrip_mode_configuration(mode_id, self.id)
        parameters = {}

        for parameter in mode_config["parameters"]:
            if parameter["name"] == c.PARAMETER_NAME_COLOR1 or parameter["name"] == c.PARAMETER_NAME_COLOR2:
                parameter["value"] = parameter["value"].replace("#", "")

            if parameter["name"] == c.PARAMETER_NAME_USE_GRADIENT1 or parameter["name"] == c.PARAMETER_NAME_USE_GRADIENT2:
                if parameter["value"] == True:
                    parameter["value"] = 1
                elif parameter["value"] == False:
                    parameter["value"] = 0

            parameters[parameter["name"]] = parameter["value"]

        parameters["mode"] = int(mode_id)

        if start_mode:
            db_util.update_device(self.id, {"mode": mode_id})
            parameters["start_mode"] = 1
        
        result = self.send_post_command(c.CMD_CONFIG_MODE, parameters)
        return result[0]
        
    ################################################################################
    #
    #   @brief  Updates the power animation.
    #   @param  power_animation         Power animation to set
    #   @return bool                    True if successful
    #
    ################################################################################
    def set_power_animation(self, power_animation):
        if power_animation >= c.NUM_POWER_ANIMATIONS:
            return False

        self.power_animation = power_animation

        result = self.send_post_command(c.CMD_SET_CONFIGURATION, {"power_animation" : power_animation})
        return result[0]
        
    ################################################################################
    #
    #   @brief  Updates the (possible) sensor of the ledstrip.
    #   @param  has_sensor              True if sensor is connected
    #   @param  sensor_inverted         True if sensor is inverted
    #   @param  sensor_model            Model of the sensor
    #   @return bool                    True if successful
    #
    ################################################################################
    def update_sensor(self, has_sensor=None, sensor_inverted=None, sensor_model=None):
        config_dict = {}
        if has_sensor is not None:
            self.has_sensor = has_sensor
            config_dict["has_sensor"] = has_sensor
        if sensor_inverted is not None:
            self.sensor_inverted = sensor_inverted
            config_dict["sensor_inverted"] = sensor_inverted
        if sensor_model is not None:
            self.sensor_model = sensor_model
            config_dict["sensor_model"] = sensor_model

        if config_dict == {}:
            return True

        result = self.send_post_command(c.CMD_SET_CONFIGURATION, config_dict)
        return result[0]