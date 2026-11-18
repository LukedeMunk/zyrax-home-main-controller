################################################################################
#
# File:     system_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints for endpoints requested by system nodes.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request                                    #Import flask blueprints and requests
from threading import Lock
from time import monotonic_ns
from uuid import NAMESPACE_URL, uuid5
from server_manager import db, BridgeCode, DomainEvent, last_received_rf_codes
import database_utility as db_util
from automation.domain import Event, EventType
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager

from logger import logi, logw, loge                                             #Import logging functions
from urllib.parse import urlparse, parse_qs                                     #For parsing HTTP requests done by ESP32 controllers
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

dm = DeviceManager()
system_bp = Blueprint("system_blueprints", __name__)
bridge_event_lock = Lock()

################################################################################
#
#   @brief  Accepts a code reported by an RF receiver on the network.
#   @return str | Response      JSON acknowledgement or validation error
#
################################################################################
@system_bp.route("/rf", methods=["GET", "POST"])
def rf():
    if request.method == "POST":
        return receive_bridge_event("rf")
    code = request.args.get("code", type=int)
    if code is None or not 1 <= code <= 0xFFFFFF:
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST, c.TEXT_DEVICE_RF_CODE_INVALID, use_http_status=True
        )
    receiver = request.args.get("bridge_id", request.remote_addr)
    if not receiver or len(receiver) > 100:
        return generate_json_http_response(
            c.HTTP_CODE_BAD_REQUEST, c.TEXT_DEVICE_RF_RECEIVER_INVALID, use_http_status=True
        )
    last_received_rf_codes[monotonic_ns()] = code
    dm.process_rf_signal(code, source_id="bridge:" + receiver)
    return generate_json_http_response(c.HTTP_CODE_OK)


################################################################################
#
#   @brief  Accepts IR callbacks and the firmware's shared event endpoint.
#   @return Response            Bridge queue acknowledgement
#
################################################################################
@system_bp.route("/ir", methods=["POST"])
@system_bp.route("/api/v1/bridge-events", methods=["POST"])
def bridge_event():
    return receive_bridge_event("ir" if request.path == "/ir" else None)


################################################################################
#
#   @brief  Acknowledges the firmware's startup handshake.
#   @return str                 JSON acknowledgement
#
################################################################################
@system_bp.route("/bridge_request_connection", methods=["POST"])
def bridge_request_connection():
    return generate_json_http_response(c.HTTP_CODE_OK)


################################################################################
#
#   @brief  Routes a firmware event to the registered device and automation bus.
#   @param  expected_medium     Optional required signal medium
#   @return Response            Bridge queue acknowledgement
#
################################################################################
def receive_bridge_event(expected_medium):
    payload = request.get_json(silent=True)
    frame = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(frame, dict):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid bridge event.", True)
    event_id, source = payload.get("event_id"), payload.get("bridge_id")
    if not all(isinstance(value, str) and 1 <= len(value) <= 100 for value in (event_id, source)):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid bridge event ID.", True)
    if request.headers.get("Idempotency-Key", event_id) != event_id:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid idempotency key.", True)
    medium = frame.get("medium")
    if expected_medium and medium != expected_medium:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid signal medium.", True)

    identifier = str(uuid5(NAMESPACE_URL, f"zyrax-bridge/{source}/{event_id}"))
    with bridge_event_lock:
        if db.session.get(DomainEvent, identifier) is not None:
            return generate_json_http_response(c.HTTP_CODE_OK, "", True)

        if medium == "rf":
            code_type = frame.get("code_type")
            device_id = frame.get("device_id")
            code_name = frame.get("code_name")
            if (isinstance(device_id, str) and device_id.isascii() and device_id.isdigit()
                    and len(device_id) <= 18 and type(code_type) is int
                    and isinstance(code_name, str)):
                code = BridgeCode.query.filter_by(
                    device_id=int(device_id), medium="rf", code_type=code_type,
                    name=code_name
                ).first()
                if code:
                    dm.rf_input_adapter.receive_device_code(
                        code.device_id, code_type, "bridge:" + source
                    )
            elif isinstance(device_id, str) and device_id.startswith("b_") and len(device_id) == 18:
                code = BridgeCode.query.filter_by(
                    code_id=device_id, medium="rf", code_type=c.RF_CODE_TYPE_TRIGGERED
                ).first()
                if code:
                    dm.publish_event(Event(
                        EventType.BUTTON_PRESSED, "device", code.device_id,
                        {"button": code.name, "button_id": code.code_id,
                         "press_type": "short_press", "receiver_id": source},
                        causation_id=identifier
                    ))
        if medium == "ir" or (medium == "rf" and "device_id" not in frame):
            matched = set()
            codes = BridgeCode.query.filter_by(medium=medium)
            if medium == "rf":
                codes = codes.filter_by(code_type=None)
            for code in codes:
                signature = ("protocol", "address", "command")
                is_raw = code.frame.get("protocol") in (None, "", "unknown", "raw")
                if is_raw:
                    matches = bool(frame.get("raw_hash")) and frame["raw_hash"] == code.frame.get("raw_hash")
                else:
                    matches = all(key in frame and frame[key] == code.frame.get(key) for key in signature)
                key = (code.device_id, code.name)
                if matches and key not in matched:
                    matched.add(key)
                    if code.code_type is not None:
                        state = 0 if code.code_type == c.RF_CODE_TYPE_INACTIVE else 1
                        dm.publish_event(Event(
                            EventType.DEVICE_STATE_CHANGED, "device", code.device_id,
                            {"state": state}, causation_id=identifier
                        ))
                        continue
                    dm.publish_event(Event(
                        EventType.BUTTON_PRESSED, "device", code.device_id,
                        {"button": code.name, "button_id": code.code_id,
                         "press_type": "short_press", "receiver_id": source},
                        causation_id=identifier
                    ))

        recorded, _ = db_util.add_domain_event(Event(
            "bridge.signal_received", "bridge", source, {"medium": medium}, id=identifier
        ))
        if not recorded:
            return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR, "", True)
    return generate_json_http_response(c.HTTP_CODE_OK, "", True)



################################################################################
#
#   @brief  Used in UI to check the connection with the server.
#
################################################################################
@system_bp.route("/check_connection", methods=["GET"])
def check_connection():
    return generate_json_http_response(c.HTTP_CODE_OK)
    
################################################################################
#
#   @brief  Requested by ESP controllers. When a controller is configured, it
#           synchronizes the controller. Else the controller will be added to
#           the unconfigured devices.
#
################################################################################
@system_bp.route("/ledstrip_request_connection", methods=["POST"])
def ledstrip_request_connection():
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    hostname = parsed_params[b"hostname"][0].decode()
    ledstrip = dm.get_ledstrip_by_hostname(hostname)

    if ledstrip is None:
        dm.add_unconfigured_device_to_list(request.remote_addr, hostname)
        logi("Ledstrip requested connection, but is not found")
        return generate_json_http_response(c.HTTP_CODE_OK)
    
    dm.synchronize_ledstrip(ledstrip.id)
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the sensor state of
#           the ledstrip.
#
################################################################################
@system_bp.route("/set_ledstrip_sensor_state", methods=["POST"])
def set_ledstrip_sensor_state():
    ledstrip = dm.get_ledstrip_by_ip(request.remote_addr)

    if ledstrip is None:
        loge("Ledstrip sensor state not changed, ledstrip not found")
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST)
    
    logi("Ledstrip sensor state changed")
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    state = int(parsed_params[b"state"][0].decode())
    
    dm.set_ledstrip_sensor_state(ledstrip.id, state)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the OTA state of the
#           ledstrip.
#
################################################################################
@system_bp.route("/set_ota_state", methods=["POST"])
def set_ota_state():
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    id = int(parsed_params[b"id"][0].decode())
    state = int(parsed_params[b"state"][0].decode())
    dm.set_ledstrip_ota_state(id, state)

    return generate_json_http_response(c.HTTP_CODE_OK)
