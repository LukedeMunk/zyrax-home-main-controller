################################################################################
#
# File:     database_core.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle the core functionality of the database services.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import configuration constants and global variables
from logger import logi, logw, loge                                             #For logging functionality
from datetime import datetime, timedelta                                        #For update date and time
from sqlalchemy import event, text                                              #For logging the database state and last modifications
import re                                                                       #For checking passwords
from sqlalchemy.exc import IntegrityError, SQLAlchemyError                      #To handle database errors
from server_manager import *                                                    #For database manipulation
from urllib.parse import quote                                                  #For logging database errors in a JSON file

#region Database state fingerprint

#endregion

#region Utilities
################################################################################
#
#   @brief  Adds default ledstrip mode parameters for a newly added ledstrip.
#   @param  device_id           Device ID
#
################################################################################
def add_default_mode_parameters(device_id):
    for mode in c.LEDSTRIP_MODES:
        for parameter in mode["parameters"]:
            db_parameter = ModeHasModeParameter(
                mode_id=mode["id"],
                mode_parameter_id=parameter["id"],
                device_id=device_id,
                value1=parameter["default1"],
                value2=parameter.get("default2"),
            )

            db.session.add(db_parameter)

    db.session.commit()
    
################################################################################
#
#   @brief  Converts a database row to a dictionary.
#   @param  row                 Row to convert
#   @param  null_value          Null value to inject on 'None' values
#   @param  date_to_string      True to convert datetime to string
#   @return                     Dictionary with data of the row
#
################################################################################
def row_to_dictionary(row, null_value=None, date_to_string=True):
    dictionary = {}

    if row is None:
        logw("row is None", True)
        return dictionary

    for column in row.__table__.columns:
        value = getattr(row, column.name)

        # Handle None
        if value is None:
            dictionary[column.name] = null_value
            continue

        # Handle booleans
        if isinstance(value, bool):
            dictionary[column.name] = value
            continue

        # Handle integers and floats
        if isinstance(value, int) or isinstance(value, float):
            dictionary[column.name] = value
            continue

        # Handle datetime
        if not date_to_string and isinstance(value, datetime):
            dictionary[column.name] = value
            dictionary[column.name + "_string"] = str(value)
            continue

        # Default: convert to string
        dictionary[column.name] = str(value)

        # Attempt numeric conversion if string
        try:
            if '.' in dictionary[column.name]:
                dictionary[column.name] = float(dictionary[column.name])
            else:
                dictionary[column.name] = int(dictionary[column.name])
        except (ValueError, TypeError):
            pass

    return dictionary

################################################################################
#
#   @brief  Returns the index of the specified ID in the specified dictionary
#           list.
#   @param  list                List to look in
#   @param  id                  ID to look for
#   @param  key                 Dictionary key to look for
#   @param  log_when_not_found  True to log a warning when not found
#   @return                     Index of the ID or -1 when not found
#
################################################################################
def get_index_from_id(list, id, key="id", log_when_not_found=True):
    index = 0

    for item in list:
        if not isinstance(item, dict):
            item = row_to_dictionary(item)

        if item[key] == int(id):
            return index
        index += 1
        
    if log_when_not_found:
        logw(c.VAR_TEXT_NO_INDEX_FOUND_WITH_ID.format(id, key), True)
        
    return -1

################################################################################
#
#   @brief  Returns a new item name, based on the number of copies made.
#   @param  table               Database table of the item
#   @param  name                Name of the item to copy
#   @return                     Name of the copy + " (copy X)"
#
################################################################################
def generate_copy_name(table, name):
    base_name = re.sub(r" \(copy \d+\)$", "", name)                             #Strip existing "(copy N)"
    pattern = f"{base_name} (copy %)"

    matches = table.query.filter(table.name.like(pattern)).all()

    # Extract existing copy numbers
    numbers = []
    for match in matches:
        found = re.search(r"\(copy (\d+)\)$", match.name)

        if found:
            numbers.append(int(found.group(1)))

    # Determine next number
    next_number = max(numbers) + 1 if numbers else 1

    is_copy = re.search(r" \(copy (\d+)\)$", name)

    if is_copy:
        # Replace existing suffix with the new highest number
        name = re.sub(
            r" \(copy (\d+)\)$",
            f" (copy {next_number})",
            name
        )
    else:
        # Append fresh suffix
        name += " (copy " + str(next_number) + ")"

    return name

################################################################################
#
#   @brief  Commits the changes to the database with error handling.
#   @param  error_map           Dictionay with constraints (log_msg,
#                               return_code)
#   @return                     Tupel with success bool and optional error
#                               string
#
################################################################################
def commit_with_handling(error_map=None):
    try:
        db.session.commit()
        return (True, "")

    except IntegrityError as e:
        db.session.rollback()

        error_string = str(e).lower()

        if error_map:
            for key, return_code in error_map.items():
                if key in error_string:
                    return (False, return_code)

        # fallback
        loge(c.VAR_TEXT_DATABASE_INTEGRITY_ERROR.format(str(e)), True)
        return (False, "UI_TEXT_DATABASE_INTEGRITY_ERROR")

    except SQLAlchemyError as e:
        db.session.rollback()
        loge(c.VAR_TEXT_DATABASE_ERROR.format(quote(str(e))), True)
        return (False, "UI_TEXT_DATABASE_ERROR")

################################################################################
#
#   @brief  Returns the upcoming ordering number of the specified table.
#   @param  column              Database column
#   @return                     Ordering number of the next item in the database
#
################################################################################
def get_next_ordering_number(column):
    return (
        db.session.query(db.func.max(column)).scalar() or 0
    ) + 1
#endregion
