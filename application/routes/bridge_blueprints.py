################################################################################
#
# File:     bridge_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Master controller endpoints for bridge learning and transmission.
#
################################################################################
import json
from typing import NamedTuple, Optional
from uuid import uuid4

from flask import Blueprint, request, session
from werkzeug.exceptions import BadRequest

import configuration as c
import database_utility as db_util
from automation.domain import Capability, Command
from Bridge import Bridge
from DeviceManager import DeviceManager
from server_manager import db, BridgeCode, BridgeHost, Device
from utilities.authentication import minimum_role_required
from utilities.response import generate_json_http_response

bridge_bp = Blueprint("bridge_blueprints", __name__)
dm = DeviceManager()


class _BridgeLearningSession(NamedTuple):
    """Names the fields stored in the existing learning session list."""

    device_id: int
    session_id: str
    code_id: str
    name: str
    path: str
    slot_type: Optional[int]
    is_transmit: bool
    transmit_saved: bool = False


################################################################################
#
#   @brief  Proxies a device learning session on the selected bridge.
#   @param  operation            Start, status, save or cancel learning
#   @return Response            Learning state or saved code
#
################################################################################
@bridge_bp.route(c.API_URL_START_HUB_LEARNING_SESSION, methods=["POST"],
                 defaults={"operation": "start"})
@bridge_bp.route(c.API_URL_GET_HUB_LEARNING_STATUS, methods=["GET"],
                 defaults={"operation": "status"})
@bridge_bp.route(c.API_URL_SAVE_HUB_LEARNING_RESULT, methods=["POST"],
                 defaults={"operation": "save"})
@bridge_bp.route(c.API_URL_CANCEL_HUB_LEARNING_SESSION, methods=["POST"],
                 defaults={"operation": "cancel"})
@minimum_role_required()
def learn_bridge_code(operation):
    bridge_id, device_id = _get_hub_identifiers(include_device=True)
    host = db.session.get(BridgeHost, bridge_id)
    device = db.session.get(Device, device_id)

    if host is None or device is None:
        return generate_json_http_response(c.HTTP_CODE_NOT_FOUND, "Bridge or device not found.", True)
    
    if device.type not in (c.DEVICE_TYPE_RF_DEVICE, c.DEVICE_TYPE_IR_DEVICE):
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, "Select an RF or IR device.", True)

    model = next((item for item in c.DEVICE_MODELS if item["model_id"] == device.model_id), None)

    if model is None:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_DEVICE_UNKNOWN_MODEL, True)
    
    medium = "rf" if device.type == c.DEVICE_TYPE_RF_DEVICE else "ir"
    signals = model.get(f"{medium}_code_types") or []
    client = Bridge(db_util.get_device(bridge_id))
    key = f"bridge_learning_{bridge_id}"

    try:
        if operation == "start":
            result = _start_bridge_learning(client, device, bridge_id, key, medium, signals)
        else:
            result = _continue_bridge_learning(client, device, bridge_id, key, medium, signals, operation)
    except ValueError as error:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, str(error), True)
    except (RuntimeError, KeyError) as error:
        return generate_json_http_response(c.HTTP_CODE_CONFLICT, str(error), True)
    
    return generate_json_http_response(c.HTTP_CODE_OK, result, True)


################################################################################
#
#   @brief  Validates the learning request and starts a firmware capture.
#   @param  client               Bridge HTTP client
#   @param  device               Target device
#   @param  bridge_id            Registered bridge ID
#   @param  key                  Learning session key
#   @param  medium               RF or IR
#   @param  signals              Fixed signal slots defined by the model
#   @return dict                 Initial firmware learning state
#
################################################################################
def _start_bridge_learning(client, device, bridge_id, key, medium, signals):
    payload = request.form.to_dict()
    for flag in ("transmit", "receive"):
        if flag in payload:
            if payload[flag] not in ("0", "1"):
                raise ValueError(f"Provide {flag} as 0 or 1.")
            payload[flag] = payload[flag] == "1"
    if "slot" in payload:
        payload["slot"] = int(payload["slot"])

    is_tap_switch = device.model_id == c.RF_SWITCH_MODEL_ID_TAP
    can_set_power = medium == "rf" and device.category in (
        c.DEVICE_CATEGORY_SWITCH, c.DEVICE_CATEGORY_POWER_OUTLET
    )
    is_transmit = bool(signals) and can_set_power and not is_tap_switch and (
        payload.get("transmit") is True
    )
    slot = next((signal for signal in signals if signal["type"] == payload.get("slot")), None)
    if is_tap_switch:
        slot = signals[0]

    is_single_slot = bool(signals) and (is_transmit or medium == "ir")
    if is_single_slot and slot is None:
        raise ValueError("Choose a signal to learn.")

    name = slot["name"] if slot else payload.get("name")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 50:
        raise ValueError(c.TEXT_BRIDGE_CODE_NAME)
    name = name.strip()

    code_id = uuid4().hex[:16]
    if is_tap_switch:
        existing = BridgeCode.query.filter_by(
            bridge_id=bridge_id, device_id=device.id, code_type=None
        ).first()
        if existing:
            code_id = existing.code_id
    if is_transmit and slot["type"] in (0, 1):
        code_id = f"p{slot['type']}{code_id}"

    path = "learning-session"
    fields = {"name": name, "medium": medium}
    is_reception = medium == "rf" and not is_transmit and not is_tap_switch and (
        bool(signals) or payload.get("receive") is True
    )
    if is_reception:
        path = "device-learning-session"
        code_types = signals
        if not signals:
            code_id = "b_" + code_id
            code_types = [{"name": name, "type": c.RF_CODE_TYPE_TRIGGERED}]
        fields.update(
            device_id=str(device.id) if signals else code_id,
            model_id=device.model_id, name=device.name, code_types=json.dumps(code_types)
        )

    if is_reception:
        command = c.HUB_COMMAND_START_DEVICE_LEARNING
    else:
        command = c.HUB_COMMAND_START_LEARNING
    result = client.request("POST", command, fields)
    slot_type = slot["type"] if is_single_slot else None
    session[key] = [device.id, result["session_id"], code_id, name, path, slot_type, is_transmit]
    return result


################################################################################
#
#   @brief  Reads, cancels or saves the firmware session for this device.
#   @param  client               Bridge HTTP client
#   @param  device               Target device
#   @param  bridge_id            Registered bridge ID
#   @param  key                  Learning session key
#   @param  medium               RF or IR
#   @param  signals              Fixed signal slots defined by the model
#   @param  operation            Status, save or cancel action
#   @return dict                 Firmware state or empty acknowledgement
#
################################################################################
def _continue_bridge_learning(client, device, bridge_id, key, medium, signals, operation):
    current = session.get(key)
    if not current or current[0] != device.id:
        if operation == "cancel":
            return {}
        raise ValueError("Start a learning session for this device.")

    learning = _BridgeLearningSession(*current)
    is_tap_switch = device.model_id == c.RF_SWITCH_MODEL_ID_TAP
    if is_tap_switch and operation == "save":
        _save_tap_switch(client, device, bridge_id, key, learning, signals[0])
        session.pop(key, None)
        return {}

    is_device_learning = learning.path.startswith("device-")
    if is_device_learning:
        status_command = c.HUB_COMMAND_GET_DEVICE_LEARNING_STATUS
    else:
        status_command = c.HUB_COMMAND_GET_LEARNING_STATUS
    result = client.request("GET", status_command)
    is_current_session = learning.session_id == result["session_id"]
    if operation == "cancel":
        if is_current_session:
            if is_device_learning:
                command = c.HUB_COMMAND_CANCEL_DEVICE_LEARNING
            else:
                command = c.HUB_COMMAND_CANCEL_LEARNING
            client.request("POST", command)
        session.pop(key, None)
        return {}

    if not is_current_session:
        raise ValueError("This learning session has ended.")
    if operation != "save":
        return result

    if result["state"] != "ready":
        raise ValueError(c.TEXT_BRIDGE_LEARNING_NOT_READY)
    if learning.path.startswith("device-"):
        _save_received_codes(client, bridge_id, learning, medium, signals, result["codes"])
    else:
        _save_single_code(client, bridge_id, learning, medium, result)
    db.session.commit()
    session.pop(key, None)
    return result


################################################################################
#
#   @brief  Saves received RF signals and replaces previously learned fixed slots.
#   @param  client               Bridge HTTP client
#   @param  bridge_id            Registered bridge ID
#   @param  learning             Current learning session
#   @param  medium               Signal medium
#   @param  signals              Fixed signal slots defined by the model
#   @param  codes                Captured firmware code entries
#
################################################################################
def _save_received_codes(client, bridge_id, learning, medium, signals, codes):
    client.request("POST", c.HUB_COMMAND_SAVE_DEVICE_LEARNING_RESULT)
    if signals:
        previous = BridgeCode.query.filter_by(
            device_id=learning.device_id, bridge_id=bridge_id, medium="rf"
        )
        previous.filter(BridgeCode.code_type.is_not(None)).delete()

    for code in codes:
        code_id = str(code["type"]) if signals else learning.code_id
        db.session.add(BridgeCode(
            bridge_id=bridge_id, device_id=learning.device_id, code_id=code_id,
            name=code["name"], medium=medium, frame=code["frame"], code_type=code["type"]
        ))


################################################################################
#
#   @brief  Saves one capture and replaces the previous code for its fixed slot.
#   @param  client               Bridge HTTP client
#   @param  bridge_id            Registered bridge ID
#   @param  learning             Current learning session
#   @param  medium               RF or IR
#   @param  result               Captured firmware learning result
#
################################################################################
def _save_single_code(client, bridge_id, learning, medium, result):
    client.request("POST", c.HUB_COMMAND_SAVE_LEARNING_RESULT, {"id": learning.code_id})
    if learning.slot_type is not None:
        previous = BridgeCode.query.filter_by(
            device_id=learning.device_id, bridge_id=bridge_id, medium=medium
        )

        if learning.is_transmit:
            previous = previous.filter(BridgeCode.code_id.startswith(learning.code_id[:2]))
        else:
            previous = previous.filter_by(code_type=learning.slot_type)
        previous.delete(synchronize_session=False)

    db.session.add(BridgeCode(
        bridge_id=bridge_id, device_id=learning.device_id, code_id=learning.code_id,
        name=learning.name, medium=medium, frame=result["frame"],
        code_type=None if learning.is_transmit else learning.slot_type
    ))


################################################################################
#
#   @brief  Registers the saved transmit frame as the tap switch receive code.
#   @param  client               Bridge HTTP client
#   @param  device               Tap switch device
#   @param  bridge_id            Learning bridge ID
#   @param  key                  Learning session key
#   @param  learning             Current learning session
#   @param  slot                 Model's fixed trigger slot
#
################################################################################
def _save_tap_switch(client, device, bridge_id, key, learning, slot):
    code_id = learning.code_id
    if not learning.transmit_saved:
        result = client.request("GET", c.HUB_COMMAND_GET_LEARNING_STATUS)
        if learning.session_id != result["session_id"] or result["state"] != "ready":
            raise ValueError(c.TEXT_BRIDGE_LEARNING_NOT_READY)
        
        client.request("POST", c.HUB_COMMAND_SAVE_LEARNING_RESULT, {"id": code_id})
        session[key] = list(learning._replace(transmit_saved=True))

    codes = client.request("GET", c.HUB_COMMAND_GET_CODES, {"include_pulses": "true"})
    saved = next((code for code in codes if code["id"] == code_id), None)

    if saved is None:
        raise RuntimeError(c.TEXT_BRIDGE_CODE_NOT_FOUND)
    frame = saved["frame"]

    client.request("POST", c.HUB_COMMAND_UPDATE_RF_DEVICE, {
        "id": str(device.id), "name": device.name, "model_id": device.model_id,
        "codes": json.dumps([{"name": slot["name"], "type": slot["type"], "frame": frame}])
    })

    for identifier, code_type in ((code_id, None), (str(slot["type"]), slot["type"])):
        db.session.merge(BridgeCode(
            bridge_id=bridge_id, device_id=device.id, code_id=identifier,
            name=slot["name"], medium="rf", frame=frame, code_type=code_type
        ))

    db.session.commit()


################################################################################
#
#   @brief  Renames or deletes a freely learned remote button.
#   @param  operation            Rename or delete a custom button
#   @return Response            Update acknowledgement or error
#
################################################################################
@bridge_bp.route(c.API_URL_RENAME_CUSTOM_CODE, methods=["POST"],
                 defaults={"operation": "rename"})
@bridge_bp.route(c.API_URL_DELETE_CUSTOM_CODE, methods=["POST"],
                 defaults={"operation": "delete"})
@minimum_role_required()
def manage_bridge_button(operation):
    bridge_id, device_id = _get_hub_identifiers(include_device=True)
    code_id = request.form.get("code_id")
    device = db.session.get(Device, device_id)
    host = db.session.get(BridgeHost, bridge_id)
    code = db.session.get(BridgeCode, (bridge_id, device_id, code_id))
    model = next((item for item in c.DEVICE_MODELS
                  if device is not None and item["model_id"] == device.model_id), None)
    if host is None or code is None or model is None or model.get("buttons") is None:
        return generate_json_http_response(c.HTTP_CODE_NOT_FOUND, c.TEXT_BRIDGE_CODE_NOT_FOUND, True)

    if operation == "rename":
        name = request.form.get("name")
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 50:
            return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_BRIDGE_CODE_NAME, True)
        code.name = name.strip()
    else:
        collection = "devices" if code.medium == "rf" and code_id.startswith("b_") else "codes"
        try:
            Bridge(db_util.get_device(bridge_id)).request("DELETE", f"{collection}/{code_id}")
        except RuntimeError as error:
            return generate_json_http_response(c.HTTP_CODE_CONFLICT, str(error), True)
        db.session.delete(code)

    db.session.commit()
    return generate_json_http_response(c.HTTP_CODE_OK, {}, True)


################################################################################
#
#   @brief  Requests transmission of a saved bridge code.
#   @return Response            Transmitting bridge or a failure message
#
################################################################################
@bridge_bp.route(c.API_URL_TRANSMIT_CODE, methods=["POST"])
@minimum_role_required()
def transmit_bridge_code():
    bridge_id, _ = _get_hub_identifiers()
    code_id = request.form.get("code_id")
    code = BridgeCode.query.filter_by(bridge_id=bridge_id, code_id=code_id, code_type=None).first()
    if code is None:
        return generate_json_http_response(c.HTTP_CODE_NOT_FOUND, c.TEXT_BRIDGE_CODE_NOT_FOUND, True)

    capability = Capability.RF_SEND if code.medium == "rf" else Capability.IR_SEND
    try:
        dm.adapter_registry.execute(Command(capability, "device", bridge_id, {"code_id": code_id}))
    except (RuntimeError, ValueError) as error:
        return generate_json_http_response(c.HTTP_CODE_CONFLICT, str(error), True)
    return generate_json_http_response(c.HTTP_CODE_OK, {"bridge_id": bridge_id}, True)

################################################################################
#
#   @brief  Probes the configured bridge asynchronously from the catalog.
#   @return Response            Current reachability
#
################################################################################
@bridge_bp.route(c.API_URL_GET_HUB_STATUS, methods=["GET"])
@minimum_role_required()
def bridge_status():
    bridge_id, _ = _get_hub_identifiers()
    host = db.session.get(BridgeHost, bridge_id)
    online = False

    if host is not None:
        try:
            online = Bridge(db_util.get_device(bridge_id)).download_states()
        except RuntimeError:
            pass
        
    return generate_json_http_response(c.HTTP_CODE_OK, {"online": online}, True)


################################################################################
#
#   @brief  Reads Hub and optional target IDs from query parameters or form data.
#   @param  include_device       Whether a target device identifier is required
#   @return tuple               Integer Hub ID and optional device ID
#
################################################################################
def _get_hub_identifiers(include_device=False):
    fields = request.args if request.method == "GET" else request.form
    try:
        id = int(fields.get("id"))
        device_id = int(fields.get("device_id")) if include_device else None
    except (TypeError, ValueError) as error:
        raise BadRequest("Provide integer id and device_id values as required.") from error

    return id, device_id
