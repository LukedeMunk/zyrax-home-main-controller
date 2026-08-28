################################################################################
#
# File:     authentication.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Authentication functionality.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from functools import wraps
from flask import session
from expiringdict import ExpiringDict                                           #To keep better track of online users

from utilities.response import render_login_page

online_users = ExpiringDict(max_age_seconds=3600, max_len=100)                  #Remove user from online user list after one hour,
                                                                                #otherwise after automatic session end, user is never removed

################################################################################
#
#   @brief  Wrapper function to check the authentication on entpoints
#   @param  role                Not used yet
#
################################################################################
def minimum_role_required(role=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if "account_id" not in session:
                return render_login_page(message="UI_TEXT_NEED_TO_BE_LOGGED_IN")

            #if session.get("role") > role:
            #    return render_login_page(message="UI_TEXT_NEED_MORE_PRIVILEGES")

            return func(*args, **kwargs)

        return wrapper

    return decorator