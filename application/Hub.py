################################################################################
#
# File:     Hub.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Client and command adapter for the ZyraX hub HTTP protocol.
#
################################################################################
import requests

import configuration as c
import database_utility as db_util
from automation.domain import Capability
from logger import logi, logw, loge
from server_manager import app, db, HubCode, HubHost


class Hub:
    ############################################################################
    #
    #   @brief  Loads hub identity, connection state and saved API metadata.
    #   @param  init_dict           Saved device and hub configuration
    #
    ############################################################################
    def __init__(self, init_dict):
        self.id = init_dict["id"]
        self.name = init_dict["name"]
        self.hostname = init_dict["hostname"]
        self.ip_address = init_dict.get("ip_address", c.DEFAULT_IP_ADDRESS)
        self.port = init_dict.get("port", 80)
        self.api_version = init_dict.get("api_version", c.DEFAULT_HUB_API_VERSION)
        self.firmware_version = init_dict.get("firmware_version", c.DEFAULT_FIRMWARE_VERSION)
        self.connection_status = init_dict.get("connection_status", False)
        self.ota_state = c.OTA_STATE_FINISHED
        self.states = {}

    ############################################################################
    #
    #   @brief  Sends a GET command using the hub API version.
    #   @param  command             Firmware endpoint relative to the API version
    #   @param  parameters_dict     Optional query parameters
    #   @return tuple              Success flag and decoded data or error
    #
    ############################################################################
    def send_command(self, command, parameters_dict=None):
        return self._send_request("GET", command, parameters_dict)

    ############################################################################
    #
    #   @brief  Sends a POST command using the firmware form format.
    #   @param  command             Firmware endpoint relative to the API version
    #   @param  parameters_dict     Optional form parameters
    #   @return tuple              Success flag and decoded data or error
    #
    ############################################################################
    def send_post_command(self, command, parameters_dict=None):
        return self._send_request("POST", command, parameters_dict)

    ############################################################################
    #
    #   @brief  Updates local device fields and sends supported hub settings.
    #   @param  config_dict         Device fields and optional id, hostname or date_time
    #   @return tuple              Success flag and firmware response or error
    #
    ############################################################################
    def configure(self, config_dict):
        configuration = dict(config_dict)
        if "hostname" in configuration:
            configuration["hub_hostname"] = configuration.pop("hostname")

        fields = {key: configuration[key] for key in ("id", "date_time") if key in configuration}
        if "hub_hostname" in configuration:
            fields["hostname"] = configuration["hub_hostname"]

        response = ""
        if fields:
            success, response = self.send_post_command(c.HUB_COMMAND_SET_CONFIGURATION, fields)
            if not success:
                return False, response

        result = db_util.update_device(self.id, configuration)
        if not result[0]:
            return result
        if "hub_hostname" in configuration:
            self.hostname = configuration["hub_hostname"]
        if "name" in configuration:
            self.name = configuration["name"]

        return True, response

    ############################################################################
    #
    #   @brief  Downloads current Hub states and persists reported device metadata.
    #   @return bool               True when state and metadata were loaded
    #
    ############################################################################
    def download_states(self):
        success, states = self.send_command(c.HUB_COMMAND_GET_STATES)
        if not success or not isinstance(states, dict):
            return False
        
        if not self._store_metadata(states):
            return False

        self.states = states

        return True

    ############################################################################
    #
    #   @brief  Downloads configuration and stores reported API and firmware versions.
    #   @return tuple              Success flag and configuration or error
    #
    ############################################################################
    def download_configuration(self):
        result = self.send_command(c.HUB_COMMAND_GET_CONFIGURATION)
        if not result[0]:
            return result
        if not isinstance(result[1], dict):
            return False, "Invalid hub configuration."
        if not self._store_metadata(result[1]):
            return False, "Could not save hub configuration."

        return result

    ############################################################################
    #
    #   @brief  Sets connection state or probes the Hub status endpoint.
    #   @param  status              Reachability to record, or None to probe the Hub
    #   @return bool               Current reachability or probe success
    #
    ############################################################################
    def check_connection_status(self, status=None):
        if status is None:
            return self.download_states()
        if self.connection_status != bool(status):
            self.connection_status = bool(status)
            db_util.update_device(self.id, {"connection_status": self.connection_status})

        return self.connection_status

    ############################################################################
    #
    #   @brief  Requests a reboot of the Hub controller.
    #   @return bool               True when the Hub accepted the command
    #
    ############################################################################
    def reboot(self):
        return self.send_post_command(c.HUB_COMMAND_REBOOT)[0]

    ############################################################################
    #
    #   @brief  Requests an OTA update and reports unsupported firmware endpoints.
    #   @param  version             Firmware version to install
    #   @return bool               True when the Hub accepted the update
    #
    ############################################################################
    def update_firmware(self, version):
        result = self.send_post_command(c.HUB_COMMAND_UPDATE_FIRMWARE, {"version": version})
        if result[0]:
            self.ota_state = c.OTA_STATE_DOWNLOADING_FIRMWARE

        return result[0]

    ############################################################################
    #
    #   @brief  Calls a hub endpoint using the firmware form and JSON formats.
    #   @param  method              HTTP method
    #   @param  path                Fixed firmware endpoint
    #   @param  fields              Optional form data
    #   @return                     Decoded firmware data or acknowledgement
    #
    ############################################################################
    def request(self, method, path, fields=None):
        success, result = self._send_request(method, path, fields)
        if not success:
            raise RuntimeError(f"Hub {self.hostname}: {result}")

        return result

    ############################################################################
    #
    #   @brief  Executes a request and normalizes Hub data and message responses.
    #   @param  method              GET, POST or DELETE for dynamic code routes
    #   @param  command             Firmware endpoint relative to the API version
    #   @param  fields              Optional query or form parameters
    #   @return tuple              Success flag and decoded data or error
    #
    ############################################################################
    def _send_request(self, method, command, fields=None):
        methods = {"GET": requests.get, "POST": requests.post, "DELETE": requests.delete}
        if method not in methods:
            return False, "Unsupported hub HTTP method."

        hostname = self.hostname
        if "." not in hostname:
            hostname += ".home"
        address = hostname if self.port == 80 else f"{hostname}:{self.port}"
        url = f"http://{address}/api/{self.api_version}/{command}"
        parameters = {"params" if method == "GET" else "data": fields}

        try:
            response = methods[method](
                url=url, **parameters, timeout=10, allow_redirects=False
            )
        except requests.RequestException:
            self.check_connection_status(False)
            logw(c.VAR_TEXT_CANNOT_BE_SEND.format(url, self.name))
            return False, c.TEXT_DEVICE_DISCONNECTED

        self.check_connection_status(True)
        logi(c.VAR_TEXT_SEND_TO.format(url, self.name))
        if not response.text:
            if 200 <= response.status_code < 300:
                return True, ""
            return False, str(response.status_code)

        try:
            result = response.json()
        except ValueError:
            loge(c.VAR_TEXT_JSON_ERROR.format(response.text))
            return False, response.text

        if not isinstance(result, dict):
            return False, "Invalid hub JSON response."
        if not 200 <= response.status_code < 300 or result.get("ok") is False:
            error = result.get("error")
            detail = error.get("message") if isinstance(error, dict) else error
            message = result.get("message") or result.get("resultMessage") or detail
            return False, message or str(response.status_code)

        return True, result.get("data", result)

    ############################################################################
    #
    #   @brief  Persists changed API, firmware and address metadata from the Hub.
    #   @param  configuration       Decoded status or configuration dictionary
    #   @return bool               True when all changed metadata was saved
    #
    ############################################################################
    def _store_metadata(self, configuration):
        reported = dict(configuration)
        if "ip" in reported:
            reported["ip_address"] = reported["ip"]
        changes = {key: reported[key] for key in ("api_version", "firmware_version", "ip_address")
                   if key in reported and reported[key] != getattr(self, key)}
        if not changes:
            return True

        result = db_util.update_device(self.id, changes)
        if not result[0]:
            logw(str(result[1]))
            return False
        for key, value in changes.items():
            setattr(self, key, value)

        return True


class HubCommandAdapter:
    ############################################################################
    #
    #   @brief  Lists transmission capabilities routed to configured hubs.
    #   @return tuple               Supported command capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return Capability.RF_SEND, Capability.IR_SEND, Capability.POWER_SET

    ############################################################################
    #
    #   @brief  Transmits a saved code on the selected hub.
    #   @param  command             Hub device command with its learned code
    #   @return dict                Firmware acknowledgement
    #
    ############################################################################
    def execute(self, command):
        code_id = command.parameters.get("code_id")
        with app.app_context():
            target_id = int(command.target_id)
            host = db.session.get(HubHost, target_id) if command.target_type == "device" else None

            if host is None:
                target = db_util.get_command_target(command.target_type, target_id)

                if target is None:
                    raise ValueError("The transmission target is no longer configured.")
                
                medium = "ir" if command.capability == Capability.IR_SEND else "rf"
                codes = HubCode.query.filter_by(
                    device_id=target["device_id"], medium=medium, code_type=None
                )

                if code_id:
                    codes = codes.filter_by(code_id=code_id)

                if command.capability == Capability.POWER_SET:
                    power = int(command.parameters["power"])
                    prefix = "p0" if power == 1 else "p1"
                    codes = codes.filter(HubCode.code_id.startswith(prefix))
                    codes = codes.order_by(HubCode.hub_id)

                matches = codes.limit(1 if command.capability == Capability.POWER_SET else 2).all()

                if len(matches) != 1:
                    raise ValueError("Select one learned code and its transmitting hub.")
                
                code_id = matches[0].code_id
                host = db.session.get(HubHost, matches[0].hub_id)

            client = Hub(db_util.get_device(host.device_id))

        return client.request("POST", c.HUB_COMMAND_TRANSMIT_CODE, {"code_id": code_id})
