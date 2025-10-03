################################################################################
#
# File:     IpCamera.py
# Version:  0.9.0
# Author:   Luke de Munk
# Class:    IpCamera
# Brief:    NOT IMPLEMENTED YET
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables
import requests                                                                 #Import requests for sending commands over HTTP
from logger import log, logi, logw, loge                                        #Import logging functions
import socket                                                                   #Import socket for checking connection
import database_utility as db_util
import json                                                                     #To generate JSON response strings


class IpCamera:
    def __init__(self, init_dict):
        self.id = init_dict["id"]
        self.name = init_dict["name"]
        self.ip_address = init_dict["ip_address"]
        self.port = init_dict["port"]
        self.connection_status = False
        self.firmware_version = init_dict["firmware_version"]
        self.ota_state = c.OTA_STATE_FINISHED