################################################################################
#
# File:     dashboards.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the Dashboards table of the
#           database.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import configuration constants and global variables
from logger import logi, logw, loge                                             #For logging functionality
from datetime import datetime, timedelta                                        #For update date and time
from sqlalchemy import exc, func, or_, and_                                     #Import exeptions to catch them
import re                                                                       #For checking passwords
from argon2.exceptions import VerifyMismatchError                               #For password verifying
from zxcvbn import zxcvbn                                                       #To verify the password strength

from server_manager import *                                                    #For database manipulation

from . import database_core as core


DASHBOARD_DEFAULT_COLUMNS = 4
DASHBOARD_TILE_DIMENSIONS = {
    c.TILE_SIZE_1X1: (1, 1),
    c.TILE_SIZE_1X2: (1, 2),
    c.TILE_SIZE_2X2: (2, 2),
    c.TILE_SIZE_2X4: (1, 4),
    c.TILE_SIZE_4X4: (2, 4)
}

#region Dashboard configuration
################################################################################
#
#   @brief  Adds a dashboard configuration.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_dashboard_configuration(config_dict):
    with app.app_context():
        configuration = DashboardConfiguration(name=config_dict["name"],
                                               icon=config_dict["icon"])
            
        db.session.add(configuration)
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        return (True, configuration.id)
    
################################################################################
#
#   @brief  Updates the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_dashboard_configuration(id, config_dict):
    with app.app_context():
        configuration = DashboardConfiguration.query.filter_by(id=id).first()

        if configuration is None:
            logw(c.VAR_TEXT_DASHBOARD_CONFIGURATION_NOT_FOUND.format(id))
            return (False, c.VAR_TEXT_DASHBOARD_CONFIGURATION_NOT_FOUND.format(id))
        
        #Look for included variables
        if "name" in config_dict:
            configuration.name = config_dict["name"]

        if "icon" in config_dict:
            configuration.icon = config_dict["icon"]
            
        return core.commit_with_handling()

################################################################################
#
#   @brief  Deletes the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_dashboard_configuration(id):
    with app.app_context():
        configuration = DashboardConfiguration.query.filter_by(id=id).first()

        if configuration is None:
            logw(c.VAR_TEXT_DASHBOARD_CONFIGURATION_NOT_FOUND.format(id))
            return (False, c.VAR_TEXT_DASHBOARD_CONFIGURATION_NOT_FOUND.format(id))
        
        DashboardConfiguration.query.filter_by(id=id).delete()
        DashboardHasTile.query.filter_by(configuration_id=id).delete()
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
        logi("Deleted dashboard configuration: " + configuration.name)
        
    return (True, "")

################################################################################
#
#   @brief  Adds a tile to the specified dashboard.
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True, [id]) on
#                               success
#
################################################################################
def add_dashboard_tile(config_dict):
    with app.app_context():
        if "index" not in config_dict:
            highest_index = db.session.query(
                db.func.max(DashboardHasTile.index)
            ).filter_by(
                configuration_id=config_dict["configuration_id"]
            ).scalar()
            config_dict["index"] = 0 if highest_index is None else (
                highest_index + 1
            )

        existing_tiles = DashboardHasTile.query.filter_by(
            configuration_id=config_dict["configuration_id"]
        ).all()
        position_x = config_dict.get("position_x")
        position_y = config_dict.get("position_y")

        if position_x is None or position_y is None:
            position_x, position_y = _find_available_tile_position(
                existing_tiles,
                config_dict["size"]
            )
        elif not _tile_position_is_available(
                existing_tiles,
                position_x,
                position_y,
                config_dict["size"]):
            return (False, "Tile position overlaps another tile")

        tile = DashboardHasTile(configuration_id=config_dict["configuration_id"],
                                index=config_dict["index"],
                                position_x=position_x,
                                position_y=position_y,
                                type=config_dict["type"],
                                size=config_dict["size"])

        if config_dict["type"] == c.TILE_TYPE_DEVICE:
            tile.device_id = config_dict["device_id"]
        if config_dict["type"] == c.TILE_TYPE_GROUP:
            tile.group_id = config_dict["group_id"]
        if config_dict["type"] == c.TILE_TYPE_AUTOMATION:
            tile.automation_id = config_dict["automation_id"]
            
        db.session.add(tile)
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)

        return (True, tile.id)

################################################################################
#
#   @brief  Updates the specified dashboard tile.
#   @param  id                  Tile ID
#   @param  config_dict         Configuration dictionary
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def update_dashboard_tile(id, config_dict):
    with app.app_context():
        tile = DashboardHasTile.query.filter_by(id=id).first()

        if tile == None:
            logw(c.VAR_TEXT_DASHBOARD_TILE_NOT_FOUND.format(id))
            return (False, c.VAR_TEXT_DASHBOARD_TILE_NOT_FOUND.format(id))

        position_x = config_dict.get("position_x", tile.position_x)
        position_y = config_dict.get("position_y", tile.position_y)
        size = config_dict.get("size", tile.size)
        existing_tiles = DashboardHasTile.query.filter_by(
            configuration_id=tile.configuration_id
        ).all()

        if position_x is None or position_y is None:
            position_x, position_y = _find_available_tile_position(
                existing_tiles,
                size,
                tile.id
            )
            config_dict["position_x"] = position_x
            config_dict["position_y"] = position_y

        if not _tile_position_is_available(
                existing_tiles,
                position_x,
                position_y,
                size,
                tile.id):
            return (False, "Tile position overlaps another tile")
        
        #Look for included variables
        if "index" in config_dict:
            tile.index = config_dict["index"]

        if "size" in config_dict:
            tile.size = config_dict["size"]

        if "position_x" in config_dict:
            tile.position_x = config_dict["position_x"]

        if "position_y" in config_dict:
            tile.position_y = config_dict["position_y"]

        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
    return (True, "")
       
################################################################################
#
#   @brief  Deletes the specified dashboard tile.
#   @param  id                  Tile ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def delete_dashboard_tile(id):
    with app.app_context():
        DashboardHasTile.query.filter_by(id=id).delete()
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
    
    return (True, "")

################################################################################
#
#   @brief  Resets the tile order of the specified dashboard.
#   @param  id                  Dashboard ID
#   @return tuple               (False, [reason]) on error and (True) on
#                               success
#
################################################################################
def reset_dashboard_tile_order(id):
    with app.app_context():
        tiles = DashboardHasTile.query.filter_by(
            configuration_id=id
        ).order_by(DashboardHasTile.index, DashboardHasTile.id).all()

        for tile in tiles:
            tile.position_x = None
            tile.position_y = None

        for i, tile in enumerate(tiles):
            tile.index = i
            tile.position_x, tile.position_y = _find_available_tile_position(
                tiles,
                tile.size,
                tile.id
            )
        
        success, error = core.commit_with_handling()

        if not success:
            return (success, error)
        
    return (True, "")
        
################################################################################
#
#   @brief  Returns the dashboard configurations.
#   @param  account_id          Account ID
#   @return list                Dictionary list with dashboards
#
################################################################################
def get_dashboard_configurations(account_id=None):
    with app.app_context():
        #account_id for now unimplemented
        if account_id is None:
            dashboard_configurations = DashboardConfiguration.query.all()
        #else:
        #    account_dashboards = AccountHasDashboardConfiguration.query.filter_by(account_id=account_id).all()
        #    dashboard_configurations = []
        #    for dashboard in account_dashboards:
        #        dashboard_configurations.append(DashboardConfiguration.query.filter_by(configuration_id=dashboard.configuration_id).first())

        dashboard_configuration_list = []
        for dashboard_configuration in dashboard_configurations:
            dashboard_configuration = core.row_to_dictionary(dashboard_configuration)
            tiles = DashboardHasTile.query.filter_by(configuration_id=dashboard_configuration["id"]).all()
            dashboard_configuration["tiles"] = []
            for tile in tiles:
                dashboard_configuration["tiles"].append(core.row_to_dictionary(tile))
            
            dashboard_configuration_list.append(dashboard_configuration)

    return dashboard_configuration_list

################################################################################
#
#   @brief  Returns the specified dashboard configuration.
#   @param  id                  Dashboard ID
#   @return dict                Dictionary of the dashboard
#
################################################################################
def get_dashboard_configuration(id):
    with app.app_context():
        dashboard_configuration = DashboardConfiguration.query.filter_by(id=id).first()
        dashboard_configuration = core.row_to_dictionary(dashboard_configuration)
        tiles = DashboardHasTile.query.filter_by(configuration_id=id).all()

        dashboard_configuration["tiles"] = []
        for tile in tiles:
            dashboard_configuration["tiles"].append(core.row_to_dictionary(tile))

    return dashboard_configuration
#endregion



################################################################################
#
#   @brief  Finds the first unoccupied dashboard position.
#   @param  tiles               Existing dashboard tiles
#   @param  size                Size of the tile to place
#   @param  ignored_tile_id     Tile that should not occupy a position
#   @return tuple               X and Y position
#
################################################################################
def _find_available_tile_position(tiles, size, ignored_tile_id=None):
    occupied_positions = set()

    for tile in tiles:
        if tile.id == ignored_tile_id:
            continue
        if tile.position_x is None or tile.position_y is None:
            continue

        width, height = DASHBOARD_TILE_DIMENSIONS.get(tile.size, (1, 1))
        for position_x in range(tile.position_x, tile.position_x + width):
            for position_y in range(tile.position_y,
                                    tile.position_y + height):
                occupied_positions.add((position_x, position_y))

    width, height = DASHBOARD_TILE_DIMENSIONS.get(size, (1, 1))
    position_y = 0

    while True:
        for position_x in range(DASHBOARD_DEFAULT_COLUMNS - width + 1):
            candidate_positions = {
                (candidate_x, candidate_y)
                for candidate_x in range(position_x, position_x + width)
                for candidate_y in range(position_y, position_y + height)
            }
            if candidate_positions.isdisjoint(occupied_positions):
                return position_x, position_y
        position_y += 1


################################################################################
#
#   @brief  Checks whether a dashboard position is not occupied.
#
################################################################################
def _tile_position_is_available(tiles, position_x, position_y, size,
                                ignored_tile_id=None):
    width, height = DASHBOARD_TILE_DIMENSIONS.get(size, (1, 1))

    for tile in tiles:
        if tile.id == ignored_tile_id:
            continue
        if tile.position_x is None or tile.position_y is None:
            continue

        tile_width, tile_height = DASHBOARD_TILE_DIMENSIONS.get(
            tile.size,
            (1, 1)
        )
        overlaps = (
            position_x < tile.position_x + tile_width and
            position_x + width > tile.position_x and
            position_y < tile.position_y + tile_height and
            position_y + height > tile.position_y
        )
        if overlaps:
            return False

    return True