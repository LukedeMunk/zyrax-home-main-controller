################################################################################
#
# File:     ota_blueprints.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Flask blueprints used for OTA features.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Blueprint, request, send_file, session                        #Import flask blueprints and requests
import configuration as c                                                       #Import application configuration variables
from DeviceManager import DeviceManager                                         #Import device manager
from server_manager import generate_json_http_response
from logger import logi, logw, loge                                             #Import logging functions
import os                                                                       #For file handling

dm = DeviceManager()
ota_bp = Blueprint("ota_blueprints", __name__)

################################################################################
#
#   @brief  Endpoint for uploading OTA firmware files.
#
################################################################################
@ota_bp.route("/upload_ota_file", methods=["POST"])
def upload_ota_file():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    file = request.files["otaFile"]

    #Check file
    if file.filename == "":
        return generate_json_http_response(c.HTTP_CODE_BAD_REQUEST, c.TEXT_NO_FILE_SELECTED)
    #if file.filename != : todo: check regex
    #    return generate_json_http_response(HTTP_CODE_BAD_REQUEST, c.TEXT_CONFIGURATION_FILE_UNSUPPORTED)

    #filename = secure_filename(file.filename)
    file.save(os.path.join(c.OTA_FILE_DIRECTORY_PATH, file.filename))

    logi("Uploaded ota file")

    dm.update_ledstrip_firmware(file.filename.replace(".bin", ""))

    return generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  Endpoint to receive the ledstrip OTA progress.
#
################################################################################
@ota_bp.route("/get_ledstrip_ota_progress", methods=["GET"])
def get_ledstrip_ota_progress():
    if "account_id" not in session:
        return generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    progress = dm.get_ledstrip_ota_progress()

    return {"progress" : progress}
    
################################################################################
#
#   @brief  Endpoint to download the specified OTA file.
#
################################################################################
@ota_bp.route("/get_ota_file", methods=["GET"])
def get_ota_file():
    version = request.args.get("version")
    filename = version.replace(".", "_") + ".bin"
    path = os.path.join(c.OTA_FILE_DIRECTORY_PATH, filename)

    if not os.path.exists(path):
        return generate_json_http_response(c.HTTP_CODE_INTERNAL_SERVER_ERROR, "No file to download")
    
    logi("Downloaded ota file")

    return send_file(
                path,
                mimetype = "application/octet-stream",
                download_name = filename
            )