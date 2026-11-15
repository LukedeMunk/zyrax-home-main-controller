################################################################################
#
# File:     response.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Takes care of the HTTP responses of the server.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
from flask import Response, render_template
import json                                                                     #For generating JSON response strings


################################################################################
#
#   @brief  Generates a JSON response string based on HTTP code and message.
#   @param  http_code           The HTTP response code
#   @param  message             Optional response message
#   @param  use_http_status     Send the code as the HTTP status as well
#   @return str | Response      Serialized JSON or a Flask JSON response
#
################################################################################
def generate_json_http_response(http_code, message="", use_http_status=False):
    response = {
        "status_code": http_code,
        "message": message
    }
    payload = json.dumps(response)
    if use_http_status:
        return Response(payload, status=http_code, mimetype="application/json")
    return payload

################################################################################
#
#   @brief  Renders the login page based on the specified variables.
#   @param  message             Message to show in UI
#   @return                     Login page
#
################################################################################
def render_login_page(message, user_profiles=[]):
    return render_template("login.html", title="",
                            CURRENT_APPLICATION_VERSION=c.CURRENT_APPLICATION_VERSION,
                            RF_RECEIVER_PRESENT=c.RF_RECEIVER_PRESENT,
                            RF_TRANSMITTER_PRESENT=c.RF_TRANSMITTER_PRESENT,
                            alarm_activated="1",#TODO make cache itemdb_util.get_alarm()["activated"],
                            user_profiles=user_profiles,
                            message=message)
