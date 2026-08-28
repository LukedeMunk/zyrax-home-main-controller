################################################################################
#
# File:     cache.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Takes care of caching of the server.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
import time                                                                     #For caching

_cache = {
    "last_database_modification": 0,
    "timestamp": 0,
    "data": None
}

################################################################################
#
#   @brief  Returns the valid cache items.
#   @return                     Cache items
#
################################################################################
def get_cache_items():
    return {}
    now = time.time()

    #Invalidate cach after database modifications
    last_modification = get_datetime_last_modification()
    if _cache["last_database_modification"] != last_modification:
        _cache["last_database_modification"] = last_modification
        _cache["data"] = None

    #Cache hit
    if _cache["data"] is not None and (now - _cache["timestamp"]) < c.CACHE_TTL_SECONDS:
        return _cache["data"]

    #Cache miss; DB query
    data = {
        "number_of_draft_products": count_draft_products(),
        "number_of_draft_pdf_configurations": count_draft_pdf_configurations(),
        "number_of_expired_quotes": count_expired_quotes()
    }

    #Update cache
    _cache["data"] = data
    _cache["timestamp"] = now

    return data