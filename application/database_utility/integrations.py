################################################################################
#
# File:     integrations.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Persists protocol integrations, entities and their capabilities.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import json

import configuration as c
from automation.domain import Capability
from server_manager import (
    app, db, HubCode, HubHost, Device, Entity, EntityHasCapability, Integration
)

from . import database_core as core


################################################################################
#
#   @brief  Looks up a command target and its configured capabilities.
#   @param  target_type         Device or entity
#   @param  target_id           Device or entity ID
#   @return dict | None         Target details, or None if the target is missing
#
################################################################################
def get_command_target(target_type, target_id):
    with app.app_context():
        entity = None
        if target_type == "entity":
            entity = db.session.get(Entity, target_id)
            if entity is None:
                return None
            target_id = entity.device_id

        device = db.session.get(Device, target_id)
        if device is None:
            return None

        integration = None
        if device.integration_id is not None:
            integration = db.session.get(Integration, device.integration_id)
        query = db.session.query(EntityHasCapability.capability).join(Entity)
        query = query.filter(Entity.device_id == device.id)
        if entity is not None:
            query = query.filter(Entity.id == entity.id)

        transmit_codes = []
        if device.type in (c.DEVICE_TYPE_RF_DEVICE, c.DEVICE_TYPE_IR_DEVICE):
            transmit_codes = HubCode.query.filter_by(device_id=device.id, code_type=None).all()
        return {
            "device_id": device.id,
            "device_type": device.type,
            "is_configured_hub": device.role == "hub" and db.session.get(
                HubHost, device.id
            ) is not None,
            "hub_transmit_media": {code.medium for code in transmit_codes},
            "has_hub_power": device.category in (
                c.DEVICE_CATEGORY_SWITCH, c.DEVICE_CATEGORY_POWER_OUTLET
            ) and {"p0", "p1"} <= {code.code_id[:2] for code in transmit_codes},
            "is_main_entity": entity is not None and entity.external_id == "main",
            "integration_type": integration.type if integration else None,
            "is_enabled": integration is None or integration.enabled,
            "capabilities": {capability for capability, in query}
        }


################################################################################
#
#   @brief  Adds an integration such as an RF, IR or Zigbee hub.
#   @param  configuration       Integration configuration
#   @return tuple               Success flag and integration ID or error
#
################################################################################
def add_integration(configuration):
    with app.app_context():
        integration = Integration(
            name=configuration["name"],
            type=configuration["type"],
            enabled=configuration.get("enabled", True),
            configuration=json.dumps(configuration.get("configuration", {}))
        )
        db.session.add(integration)
        success, error = core.commit_with_handling()

        if not success:
            return (False, error)

        return (True, integration.id)


################################################################################
#
#   @brief  Returns configured integrations.
#   @param  type                Optional integration type
#   @return list                Integration dictionaries
#
################################################################################
def get_integrations(type=None):
    with app.app_context():
        query = Integration.query

        if type is not None:
            query = query.filter_by(type=type)

        integrations = []
        for integration in query.all():
            dictionary = core.row_to_dictionary(integration)
            dictionary["configuration"] = json.loads(
                integration.configuration or "{}"
            )
            integrations.append(dictionary)

        return integrations


################################################################################
#
#   @brief  Adds a logical entity exposed by a physical device.
#   @param  configuration       Entity configuration
#   @return tuple               Success flag and entity ID or error
#
################################################################################
def add_entity(configuration):
    with app.app_context():
        entity = Entity(
            device_id=configuration["device_id"],
            external_id=configuration["external_id"],
            name=configuration["name"],
            type=configuration["type"],
            state=json.dumps(configuration.get("state", {}))
        )
        db.session.add(entity)
        db.session.flush()

        for capability in configuration.get("capabilities", []):
            db.session.add(EntityHasCapability(
                entity_id=entity.id,
                capability=capability
            ))

        success, error = core.commit_with_handling()

        if not success:
            return (False, error)

        return (True, entity.id)


################################################################################
#
#   @brief  Returns logical entities and their capabilities.
#   @param  device_id           Optional physical device ID
#   @return list                Entity dictionaries
#
################################################################################
def get_entities(device_id=None):
    with app.app_context():
        query = Entity.query

        if device_id is not None:
            query = query.filter_by(device_id=device_id)

        entities = []
        for entity in query.all():
            dictionary = core.row_to_dictionary(entity)
            dictionary["state"] = json.loads(entity.state or "{}")
            capabilities = EntityHasCapability.query.filter_by(
                entity_id=entity.id
            ).all()
            dictionary["capabilities"] = [
                capability.capability for capability in capabilities
            ]
            entities.append(dictionary)

        return entities


################################################################################
#
#   @brief  Adds learned codes and capabilities to a list of device dictionaries.
#   @param  devices             Devices exposed to the catalog or wizard
#   @return list                Devices with automation metadata
#
################################################################################
def add_device_options(devices):
    with app.app_context():
        learned = {}
        for code in HubCode.query.order_by(HubCode.hub_id, HubCode.code_id):
            learned.setdefault(code.device_id, []).append({
                "id": code.code_id, "name": code.name, "medium": code.medium,
                "type": code.code_type, "hub_id": code.hub_id,
                "can_transmit": code.code_type is None
            })
        capabilities = {}
        
        for device_id, capability in db.session.query(
            Entity.device_id, EntityHasCapability.capability
        ).join(EntityHasCapability):
            capabilities.setdefault(device_id, set()).add(capability)

        for device in devices:
            codes = learned.get(device["id"], [])
            supported = capabilities.get(device["id"], set())
            if device["type"] == c.DEVICE_TYPE_LEDSTRIP:
                supported.update(Capability.LEDSTRIP)

            for medium, capability in (("rf", Capability.RF_SEND), ("ir", Capability.IR_SEND)):
                if any(code["can_transmit"] and code["medium"] == medium for code in codes):
                    supported.add(capability)

            if device["category"] in (c.DEVICE_CATEGORY_SWITCH, c.DEVICE_CATEGORY_POWER_OUTLET):
                if {"p0", "p1"} <= {code["id"][:2] for code in codes if code["can_transmit"]}:
                    supported.add(Capability.POWER_SET)

            device["capabilities"] = sorted(supported)
            device["hub_codes"] = codes
        return devices
