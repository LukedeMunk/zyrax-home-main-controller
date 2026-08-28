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

from server_manager import *

from . import database_core as core


################################################################################
#
#   @brief  Adds an integration such as an RF, IR or Zigbee bridge.
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

