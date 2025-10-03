################################################################################
#
# File:     TelegramServiceClient.py
# Version:  0.9.0
# Author:   Luke de Munk
# Class:    TelegramServiceClient
# Brief:    For communicating with the Telegram microservice.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import requests
from logger import logi, logw, loge                                             #Import logging functions
import configuration as c                                                       #Import application configuration variables

HTTP_CODE_OK = 200
HTTP_CODE_BAD_REQUEST = 400
HTTP_CODE_UNAUTHORIZED = 401
HTTP_CODE_INTERNAL_SERVER_ERROR = 500

SERVICE_STATE_RUNNING = 0
SERVICE_STATE_UNAVAILABLE = 1
SERVICE_STATE_DISABLED = 2
SERVICE_STATE_MISSING_SEVICE_KEY = 3

SERVICE_STATE_MISSING_CHAT_ID = 4

class TelegramServiceClient:
    _instance = None

    ################################################################################
    #
    #   @brief  Makes the class singleton.
    #
    ################################################################################
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(TelegramServiceClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    ################################################################################
    #
    #   @brief  Initializes class.
    #   @param  base_url        Microservice URL
    #   @param  api_key         Microservice API key
    #
    ################################################################################
    def __init__(self, base_url = "", api_key = ""):
        if self._initialized:
            return
        
        self.base_url = base_url
        self.api_key = api_key

        if self.base_url == "" or self.api_key == "":
            self.service_state = SERVICE_STATE_UNAVAILABLE
            return
        
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.api_key_header = {"x-api-key": api_key}
        self.service_state = SERVICE_STATE_UNAVAILABLE
        if not c.TELEGRAM_SERVICE_ENABLED:
            self.service_state = SERVICE_STATE_DISABLED
        
        self._initialized = True
        self.get_service_state()

    ################################################################################
    #
    #   @brief  Gets the state of the microservice.
    #   @return integer         Microservice state
    #
    ################################################################################
    def get_service_state(self):
        if self.service_state == SERVICE_STATE_DISABLED:
            return self.service_state
        
        if self.base_url == "" or self.api_key == "":
            self.service_state = SERVICE_STATE_UNAVAILABLE
            return self.service_state
        
        url = self.base_url + "/get_state"

        try:
            response = requests.post(url, headers=self.api_key_header)
            if response.status_code == HTTP_CODE_OK:
                self.service_state = SERVICE_STATE_RUNNING
            else:
                self.service_state = SERVICE_STATE_UNAVAILABLE
        except:
            self.service_state = SERVICE_STATE_UNAVAILABLE
        
        return self.service_state

    ################################################################################
    #
    #   @brief  Sends the specified text message through Telegram.
    #   @param  text            Message to send
    #   @return tuple           (False, [reason]) on error and (True) on
    #                           success
    #
    ################################################################################
    def send_message(self, text: str):
        if self.service_state != SERVICE_STATE_RUNNING:
            logw("Not sending Telegram message, service unavailable")
            return (False, "Service unavailable")
        
        url = self.base_url + "/send_message"
        payload = {"text": text}
        response = requests.post(url, json=payload, headers=self.api_key_header)
        
        if response.status_code != HTTP_CODE_OK:
            return (False, response.text)
        
        return (True, response.json())
    
    ################################################################################
    #
    #   @brief  Sends the reload configuration command to the microservice.
    #   @return tuple           (False, [reason]) on error and (True) on
    #                           success
    #
    ################################################################################
    def reload_configuration(self):
        url = self.base_url + "/reload_configuration"

        try:
            response = requests.post(url, headers=self.api_key_header)
        except:
            self.service_state = SERVICE_STATE_UNAVAILABLE
            return (False, "Service unavailable")
        
        if response.status_code == HTTP_CODE_OK:
            self.service_state = SERVICE_STATE_RUNNING
            return (True)
        
        self.service_state = SERVICE_STATE_UNAVAILABLE
        return (False, response.text)