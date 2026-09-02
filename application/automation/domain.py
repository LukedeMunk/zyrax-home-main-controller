################################################################################
#
# File:     domain.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Protocol-independent events, commands and device capabilities.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4


class Capability:
    AUTOMATION_WAIT = "automation.wait"
    POWER_SET = "power.set"
    COLOR_SET = "color.set"
    MODE_SET = "mode.set"
    RF_RECEIVE = "rf.receive"
    RF_SEND = "rf.send"
    IR_SEND = "ir.send"
    ZIGBEE_COMMAND = "zigbee.command"


class EventType:
    DEVICE_STATE_CHANGED = "device.state_changed"
    BUTTON_PRESSED = "button.pressed"
    RF_CODE_RECEIVED = "rf.code_received"
    MANUAL_AUTOMATION_RUN = "automation.manual_run"
    TIME = "time"


@dataclass(frozen=True)
class Event:
    event_type: str
    source_type: str
    source_id: object
    payload: dict = field(default_factory=dict)
    occurred_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    id: str = field(default_factory=lambda: str(uuid4()))
    correlation_id: str = None
    causation_id: str = None

    ############################################################################
    #
    #   @brief  Returns the correlation ID used throughout an automation run.
    #   @return str                 Correlation ID
    #
    ############################################################################
    def get_correlation_id(self):
        return self.correlation_id or self.id


@dataclass(frozen=True)
class Command:
    capability: str
    target_type: str
    target_id: object
    parameters: dict = field(default_factory=dict)
    context: dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid4()))
    correlation_id: str = None
    causation_id: str = None
