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
import json

from flask import Blueprint, request                                    #Import flask blueprints and requests
from threading import Lock
from uuid import NAMESPACE_URL, uuid5
from server_manager import db, BridgeCode, DomainEvent
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
#   @brief  Routes a firmware event to the registered device and automation bus.
#   @param  payload             Normalized event from the Hub form endpoint
#   @return Response            Bridge queue acknowledgement
#
################################################################################
def receive_bridge_event(payload):
    frame = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(frame, dict):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid bridge event.", True)
    event_id, source = payload.get("event_id"), payload.get("bridge_id")
    if not all(isinstance(value, str) and 1 <= len(value) <= 100 for value in (event_id, source)):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid bridge event ID.", True)
    if request.headers.get("Idempotency-Key", event_id) != event_id:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid idempotency key.", True)
    medium = frame.get("medium")

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
@system_bp.route(c.API_URL_CHECK_CONNECTION_STATUS, methods=["GET"])
def check_connection():
    return generate_json_http_response(c.HTTP_CODE_OK)
    
################################################################################
#
#   @brief  Accepts LED and bridge startup connections or records unknown devices.
#   @return str | Response      Connection acknowledgement or validation error
#
################################################################################
@system_bp.route(c.API_URL_DEVICE_CONNECTION_REQUEST, methods=["POST"])
def device_request_connection():
    hostname = request.form.get("hostname")
    if hostname is None:
        fields = parse_qs(request.get_data(as_text=True))
        hostname = fields.get("hostname", [None])[0]
    if not isinstance(hostname, str) or not 1 <= len(hostname.strip()) <= 253:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid hostname.", True)

    hostname = hostname.strip()
    ledstrip = dm.get_ledstrip_by_hostname(hostname)
    if ledstrip is not None:
        dm.synchronize_ledstrip(ledstrip.id)
        return generate_json_http_response(c.HTTP_CODE_OK)

    for bridge in dm.get_devices_dict(type=c.DEVICE_TYPE_BRIDGE):
        address = str(bridge.get("hostname", "")).lower()
        if address in (hostname.lower(), hostname.lower() + ".home", request.remote_addr):
            success, message = db_util.update_device(bridge["id"], {
                "ip_address": request.remote_addr, "connection_status": True
            })
            if not success:
                return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR, message, True)
            return generate_json_http_response(c.HTTP_CODE_OK)

    dm.add_unconfigured_device_to_list(request.remote_addr, hostname)
    logi("Unconfigured device requested connection: " + hostname)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the sensor state of
#           the ledstrip.
#
################################################################################
@system_bp.route(c.API_URL_SET_LEDSTRIP_SENSOR_STATE, methods=["POST"])
def set_ledstrip_sensor_state():
    ledstrip = dm.get_ledstrip_by_ip(request.remote_addr)

    if ledstrip is None:
        loge("Ledstrip sensor state not changed, ledstrip not found")
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST)
    
    logi("Ledstrip sensor state changed")
    try:
        state = int(request.form.get("state"))
    except (TypeError, ValueError):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Provide an integer state.", True)
    
    dm.set_ledstrip_sensor_state(ledstrip.id, state)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Requested by ESP controllers. Endpoint to set the OTA state of the
#           ledstrip.
#
################################################################################
@system_bp.route(c.API_URL_SET_OTA_STATE, methods=["POST"])
def set_ota_state():
    parsed_params = urlparse(request.data)
    parsed_params = parse_qs(parsed_params.path)
    
    id = int(parsed_params[b"id"][0].decode())
    state = int(parsed_params[b"state"][0].decode())
    dm.set_ledstrip_ota_state(id, state)#Todo set_device_ota_state

    return generate_json_http_response(c.HTTP_CODE_OK)


################################################################################
#
#   @brief  Receives a queued Hub signal through form fields.
#   @return Response            Idempotent acknowledgement or event validation error
#
################################################################################
@system_bp.route(c.API_URL_HUB_SIGNAL_RECEIVED, methods=["POST"])
def hub_signal_received():
    try:
        frame = json.loads(request.form.get("data", ""))
    except (TypeError, ValueError):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Invalid Hub event data.", True)

    payload = {
        "event_id": request.form.get("event_id"),
        "bridge_id": request.form.get("id"),
        "data": frame
    }
    return receive_bridge_event(payload)
