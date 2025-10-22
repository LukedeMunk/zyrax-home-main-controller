################################################################################
#
# File:     user_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for user features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, session                                   #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from logger import logi, logw, loge                                             #Import logging functions
from server_manager import generate_json_http_response, session
import os                                                                       #For file handling
import database_utility as db_util                                              #Import utility for database functionality
from werkzeug.utils import secure_filename
import uuid
from routes.template_blueprints import login_get

user_bp = Blueprint("user_blueprints", __name__)

#region Accounts
################################################################################
#
#   @brief  Endpoint to add an account.
#
################################################################################
@user_bp.route("/add_account", methods=["POST"])
def add_account():
    first_account = False
    if len(db_util.get_accounts()) == 0:
        first_account = True

    elif "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    account = {
        "email": request.form.get("email"),
        "password": request.form.get("password")
    }

    result = db_util.add_account(account)

    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    logi(c.VAR_TEXT_ADDED_ACCOUNT.format(result[1], account["email"]))

    #If first account, login
    if first_account:
        session["account_id"] = result[1]                                       #ID to distinguish accounts
        session["profile_id"] = None                                            #ID to distinguish users
        session.permanent = True                                                #Make session permanent for X amount of minutes (config file)
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Endpoint to update the specified account.
#
################################################################################
@user_bp.route("/update_account", methods=["POST"])
def update_account():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))

    account = {
        "email": request.form.get("email")
    }

    result = db_util.update_account(id, account)

    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    logi(c.VAR_TEXT_UPDATED_ACCOUNT.format(session["account_id"], account["email"]))
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Endpoint to delete the specified account.
#
################################################################################
@user_bp.route("/delete_account", methods=["POST"])
def delete_account():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    id = int(request.form.get("id"))

    if id == session["account_id"]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_CANNOT_DELETE_YOURSELF)
    
    account = db_util.get_account(id=id)
    result = db_util.delete_account(id)

    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    logi("Deleted account")
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Endpoint to update the account password.
#
################################################################################
@user_bp.route("/update_account_password", methods=["POST"])
def update_account_password():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    current_password = request.form.get("current_password")                     #Get current password from arguments

    if current_password is None or current_password == "":
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_INVALID_CURRENT_PASSWORD)
    
    password = request.form.get("password")                                     #Get password from arguments

    result = db_util.update_account_password(session["account_id"], password, current_password)
    
    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    logi(c.VAR_TEXT_UPDATED_PASSWORD.format(session["account_id"], "ACCOUNT"))
    
    return generate_json_http_response(c.HTTP_CODE_OK, result[1])                 #Return a possible strength warning

################################################################################
#
#   @brief  Endpoint to reset the password to the default one of the selected 
#           account. NOT IMPLEMENTED_YET
#
################################################################################
@user_bp.route("/reset_account_password", methods=["POST"])
def reset_account_password():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    #id = int(request.form.get("id"))

    #result = db_util.reset_account_password(id)
    #target_account = db_util.get_account(id=id)

    #if not result:
    return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_ACCOUNT_NOT_FOUND)
    
    #logi(c.VAR_TEXT_RESETTED_PASSWORD_OF.format(session["account_id"], target_account["email"]))
    
    #return generate_json_http_response(c.HTTP_CODE_OK)
#endregion

#region Profiles
################################################################################
#
#   @brief  Endpoint to add a profile.
#
################################################################################
@user_bp.route("/add_profile", methods=["POST"])
def add_profile():
    if "account_id" not in session and len(db_util.get_accounts()) > 0:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    profile = {
        "account_id": session["account_id"],
        "name": request.form.get("name"),
        "language": int(request.form.get("language"))
    }

    result = db_util.add_profile(profile)

    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    #When first profile of account, switch to that profile
    if len(db_util.get_profiles(session["account_id"])) == 1:
        session["profile_id"] = result[1]
        session["language"] = profile["language"]

    logi(c.VAR_TEXT_ADDED_PROFILE.format(session["account_id"], profile["name"]))
    
    return generate_json_http_response(c.HTTP_CODE_OK, {"id": result[1]})

################################################################################
#
#   @brief  Endpoint to upload a profile picture.
#
################################################################################
@user_bp.route("/upload_profile_picture", methods=["POST"])
def upload_profile_picture():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    profile_id = int(request.form.get("profile_id"))
    file = request.files.get("picture")
    
    if not file:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_NO_FILE_SELECTED)

    filename = secure_filename(file.filename)
    extension = os.path.splitext(filename)[1]

    if extension.lower() not in c.ALLOWED_IMAGE_EXTENSIONS:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_INVALID_FILE_TYPE)
    
    filename = str(uuid.uuid4()) + extension
    file.save(os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, filename))

    profile = {
        "profile_picture": filename
    }

    old_picture_filename = db_util.get_profile(profile_id)["profile_picture"]
    result = db_util.update_profile(profile_id, profile)

    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    #Remove old profile picture
    if old_picture_filename != c.DEFAULT_PROFILE_PICTURE_FILENAME:
        path = os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, old_picture_filename)
        if os.path.exists(path):
            os.remove(path)

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Endpoint to update the specified profile.
#
################################################################################
@user_bp.route("/update_profile", methods=["POST"])
def update_profile():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    id = int(request.form.get("id"))

    profile = {
        "name": request.form.get("name"),
        "language": int(request.form.get("language")),
        "ui_theme": int(request.form.get("ui_theme"))
    }

    result = db_util.update_profile(id, profile)

    #If there is an error, return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    logi(c.VAR_TEXT_UPDATED_PROFILE.format(session["profile_id"], profile["name"]))
    
    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Endpoint to delete the specified profile.
#
################################################################################
@user_bp.route("/delete_profile", methods=["POST"])
def delete_profile():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)

    id = int(request.form.get("id"))
    
    profile = db_util.get_profile(id=id)
    old_picture_filename = profile["profile_picture"]

    result = db_util.delete_profile(id)

    if not result:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_PROFILE_NOT_FOUND)
    
    #Remove old profile picture
    if old_picture_filename != c.DEFAULT_PROFILE_PICTURE_FILENAME:
        path = os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, old_picture_filename)
        if os.path.exists(path):
            os.remove(path)
    
    logi(c.VAR_TEXT_DELETED_PROFILE.format(session["account_id"], profile["name"]))
    
    return generate_json_http_response(c.HTTP_CODE_OK)
#endregion

#region Login pages
################################################################################
#
#   @brief  Handles POST request of the login page, checks credentials.
#
################################################################################
@user_bp.route("/login", methods=["POST"])
def login_post():
    email = request.form.get("email").lower()                                   #To lowercase to avoid user typos
    password = request.form.get("password")
    profile_id = None

    result = db_util.account_login(email, password)
    
    #If there is an error, log it and return it to the front-end
    if not result[0]:
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, result[1])
    
    session["account_id"] = result[1]["id"]                                     #ID to distinguish accounts
    session["profile_id"] = profile_id                                          #ID to distinguish users
    session.permanent = True                                                    #Make session permanent for X amount of minutes (config file)

    logi(c.VAR_TEXT_LOGGED_IN.format(email))

    message = {
                "profiles": db_util.get_profiles(session["account_id"])
            }
    
    return generate_json_http_response(c.HTTP_CODE_OK, message)

################################################################################
#
#   @brief  Logs out a user.
#
################################################################################
@user_bp.route("/logout", methods=["GET"])
def logout():
    if "account_id" in session:
        logi(c.VAR_TEXT_USER_LOGGED_OUT.format(session["account_id"]))

    session.clear()                                                             #Clear all session variables
    
    return login_get()

################################################################################
#
#   @brief  Selects the profile ID.
#
################################################################################
@user_bp.route("/pick_profile", methods=["POST"])
def pick_profile():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    profile_id = int(request.form.get("id"))

    session["profile_id"] = profile_id                                          #ID to distinguish users
    session.permanent = True                                                    #Make session permanent for X amount of minutes (config file)

    return generate_json_http_response(c.HTTP_CODE_OK)
#endregion