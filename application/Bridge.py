################################################################################
#
# File:     Bridge.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Client and command adapter for the ZyraX bridge HTTP protocol.
#
################################################################################
import requests

from automation.domain import Capability
from server_manager import app, db, BridgeCode, BridgeHost
import database_utility as db_util


class Bridge:
    ############################################################################
    #
    #   @brief  Stores the address of a configured bridge.
    #   @param  hostname            Registered hostname
    #
    ############################################################################
    def __init__(self, hostname):
        self.hostname = hostname

    ############################################################################
    #
    #   @brief  Calls a bridge endpoint using the firmware form and JSON formats.
    #   @param  method              HTTP method
    #   @param  path                Fixed firmware endpoint
    #   @param  fields              Optional form data
    #   @return                     Decoded firmware data or acknowledgement
    #
    ############################################################################
    def request(self, method, path, fields=None):
        try:
            response = requests.request(
                method, f"http://{self.hostname}/api/v1/{path}",
                data=fields, timeout=(2, 5), allow_redirects=False
            )
            result = response.json()
        except (requests.RequestException, ValueError) as error:
            raise RuntimeError(f"Bridge {self.hostname}: {error}") from error
        
        if not isinstance(result, dict):
            raise RuntimeError(f"Bridge {self.hostname}: invalid JSON response.")
        
        if not 200 <= response.status_code < 300 or result.get("ok") is False:
            message = result.get("resultMessage") or result.get("error", {}).get("message")
            raise RuntimeError(f"Bridge {self.hostname}: {message or response.status_code}")
        return result.get("data", result)


class BridgeCommandAdapter:
    ############################################################################
    #
    #   @brief  Lists transmission capabilities routed to configured bridges.
    #   @return tuple               Supported command capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return Capability.RF_SEND, Capability.IR_SEND, Capability.POWER_SET

    ############################################################################
    #
    #   @brief  Transmits a saved code on the selected bridge.
    #   @param  command             Bridge device command with its learned code
    #   @return dict                Firmware acknowledgement
    #
    ############################################################################
    def execute(self, command):
        code_id = command.parameters.get("code_id")
        with app.app_context():
            target_id = int(command.target_id)
            host = db.session.get(BridgeHost, target_id) if command.target_type == "device" else None

            if host is None:
                target = db_util.get_command_target(command.target_type, target_id)

                if target is None:
                    raise ValueError("The transmission target is no longer configured.")
                
                medium = "ir" if command.capability == Capability.IR_SEND else "rf"
                codes = BridgeCode.query.filter_by(
                    device_id=target["device_id"], medium=medium, code_type=None
                )

                if code_id:
                    codes = codes.filter_by(code_id=code_id)

                if command.capability == Capability.POWER_SET:
                    power = int(command.parameters["power"])
                    prefix = "p0" if power == 1 else "p1"
                    codes = codes.filter(BridgeCode.code_id.startswith(prefix))
                    codes = codes.order_by(BridgeCode.bridge_id)

                matches = codes.limit(1 if command.capability == Capability.POWER_SET else 2).all()

                if len(matches) != 1:
                    raise ValueError("Select one learned code and its transmitting bridge.")
                
                code_id = matches[0].code_id
                host = db.session.get(BridgeHost, matches[0].bridge_id)

            client = Bridge(host.hostname)

        return client.request("POST", "transmissions", {"code_id": code_id})
