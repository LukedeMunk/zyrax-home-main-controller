################################################################################
#
# File:     WeatherServiceClient.py
# Version:  0.9.0
# Author:   Luke de Munk
# Class:    WeatherServiceClient
# Brief:    For communicating with the weather microservice.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import requests
from logger import logi, logw, loge                                             #Import logging functions
import os
from datetime import datetime
import json
import requests                                                                 #Import request library to do API requests
import configuration as c                                                       #Import application configuration variables

HTTP_CODE_OK = 200
HTTP_CODE_BAD_REQUEST = 400
HTTP_CODE_UNAUTHORIZED = 401
HTTP_CODE_INTERNAL_SERVER_ERROR = 500

SERVICE_STATE_RUNNING = 0
SERVICE_STATE_UNAVAILABLE = 1
SERVICE_STATE_DISABLED = 2
SERVICE_STATE_MISSING_SEVICE_KEY = 3

SERVICE_STATE_INVALID_API_KEY = 4
SERVICE_STATE_INVALID_LOCATION = 5

class WeatherServiceClient:
    _instance = None

    ################################################################################
    #
    #   @brief  Makes the class singleton.
    #
    ################################################################################
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(WeatherServiceClient, cls).__new__(cls)
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
        
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.service_state = SERVICE_STATE_UNAVAILABLE

        if self.base_url == "" or self.api_key == "":
            return
        
        self.api_key_header = {"x-api-key": api_key}

        if not c.WEATHER_SERVICE_ENABLED:
            self.service_state = SERVICE_STATE_DISABLED
        
        self._initialized = True
        self.get_service_state()
        self.set_location()

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
                response = response.json()
                self.service_state = response["detail"]
        except:
            self.service_state = SERVICE_STATE_UNAVAILABLE
        
        return self.service_state
    
    ################################################################################
    #
    #   @brief  Converts the state number to human friendly text.
    #   @param  state           State number
    #   @return string          Human friendly text
    #
    ################################################################################
    def state_to_text(self, state):
        if state == SERVICE_STATE_RUNNING:
            return c.TEXT_SERVICE_STATE_RUNNING
        
        if state == SERVICE_STATE_UNAVAILABLE:
            return c.TEXT_SERVICE_STATE_UNAVAILABLE
        
        if state == SERVICE_STATE_DISABLED:
            return c.TEXT_SERVICE_STATE_DISABLED
        
        if state == SERVICE_STATE_MISSING_SEVICE_KEY:
            return c.TEXT_SERVICE_STATE_MISSING_SEVICE_KEY
        
        if state == SERVICE_STATE_INVALID_API_KEY:
            return c.TEXT_SERVICE_STATE_INVALID_API_KEY
        
        if state == SERVICE_STATE_INVALID_LOCATION:
            return c.TEXT_SERVICE_STATE_INVALID_LOCATION
        
        return c.TEXT_UNKNOWN_ERROR

    ################################################################################
    #
    #   @brief  Reloads the API key.
    #   @return tuple           (False, [reason]) on error and (True) on
    #                           success
    #
    ################################################################################
    def reload_api_key(self):
        if self.service_state == SERVICE_STATE_DISABLED:
            return (True, "")
        
        url = self.base_url + "/reload_api_key"

        try:
            response = requests.post(url, headers=self.api_key_header)
        except:
            self.service_state = SERVICE_STATE_UNAVAILABLE
            return (False, self.state_to_text(SERVICE_STATE_UNAVAILABLE))
        
        if response.status_code == HTTP_CODE_OK:
            return (True, "")
        else:
            response = response.json()
            self.service_state = response["detail"]
            return (False, self.state_to_text(response["detail"]))

    ################################################################################
    #
    #   @brief  Returns the weather forecast.
    #   @param  small           If True, only a portion of the forecast is returned
    #
    ################################################################################
    def get_weather_forecast(self, small=False):
        if self.service_state != SERVICE_STATE_RUNNING:
            return None

        if not os.path.isfile(c.WEATHER_PATH):
            result = self._update_weather_forecast()
            if not result[0]:
                self.service_state = result[1]
                return None

        with open(c.WEATHER_PATH) as file:
            weather = json.load(file)

        if not small:
            return weather
        
        small_dict = {
            "description": weather["description"],
            "days": []
        }

        for day_info in weather["days"]:
            day = {
                    "weekday": day_info["weekday"],
                    "date": day_info["date"],
                    "maximum_temperature": day_info["maximum_temperature"],
                    "minimum_temperature": day_info["minimum_temperature"],
                    "temperature": day_info["temperature"],
                    "feelslikemax": day_info["feelslikemax"],
                    "feelslikemin": day_info["feelslikemin"],
                    "feelslike": day_info["feelslike"],
                    "dew": day_info["dew"],
                    "humidity": day_info["humidity"],
                    "snow": day_info["snow"],
                    "snowdepth": day_info["snowdepth"],
                    "windgust": day_info["windgust"],
                    "windspeed": day_info["windspeed"],
                    "wind_direction": day_info["wind_direction"],
                    "pressure": day_info["pressure"],
                    "cloudcover": day_info["cloudcover"],
                    "visibility": day_info["visibility"],
                    "solar_radiation": day_info["solar_radiation"],
                    "uv_index": day_info["uv_index"],
                    "sunrise": day_info["sunrise"],
                    "sunset": day_info["sunset"],
                    "moonphase": day_info["moonphase"],
                    "conditions": day_info["conditions"],
                    "description": day_info["description"],
                    "icon": day_info["icon"],
                    "hours": []
                    }
            
            now = datetime.now() # current date and time
            date_now = now.strftime("%Y-%m-%d")
            
            if day_info["date"] != date_now:
                small_dict["days"].append(day)
                continue

            for hour in day_info["hours"]:
                hour = {
                    "time": hour["time"],
                    "temperature": hour["temperature"],
                    "feelslike": hour["feelslike"],
                    "humidity": hour["humidity"],
                    "dew": hour["dew"],
                    "snow": hour["snow"],
                    "snowdepth": hour["snowdepth"],
                    "windgust": hour["windgust"],
                    "windspeed": hour["windspeed"],
                    "wind_direction": hour["wind_direction"],
                    "pressure": hour["pressure"],
                    "visibility": hour["visibility"],
                    "cloudcover": hour["cloudcover"],
                    "solar_radiation": hour["solar_radiation"],
                    "conditions": hour["conditions"],
                    "icon": hour["icon"],
                    }
                day["hours"].append(hour)

            small_dict["days"].append(day)

        return small_dict
    
    ################################################################################
    #
    #   @brief  Sends the reload configuration command to the microservice.
    #   @return tuple           (False, [reason]) on error and (True) on
    #                           success
    #
    ################################################################################
    def set_location(self):
        url = self.base_url + "/set_location"

        try:
            response = requests.post(url, json={"location": c.WEATHER_LOCATION}, headers=self.api_key_header)
        except:
            self.service_state = SERVICE_STATE_UNAVAILABLE
            return (False, self.state_to_text(SERVICE_STATE_UNAVAILABLE))
        
        if response.status_code != HTTP_CODE_OK:
            response = response.json()
            self.service_state = response["detail"]
            return (False, self.state_to_text(response["detail"]))
        
        self.service_state = SERVICE_STATE_RUNNING
        return (True, response.json())
    
    ################################################################################
    #
    #   @brief  Downloads the weather forecast from the API.
    #   @return tuple           (False, [reason]) on error and (True) on
    #                           success
    #
    ################################################################################
    def _update_weather_forecast(self):
        if self.service_state != SERVICE_STATE_RUNNING:
            logw("Not updating weather forecast, service unavailable")
            return (False, "Service unavailable")
        
        url = self.base_url + "/update_weather_forecast"
        response = requests.post(url, headers=self.api_key_header)
        
        if response.status_code != HTTP_CODE_OK:
            return (False, response.text)
        
        return (True, "")