################################################################################
#
# File:     weather_service.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Microservice to handle the weather API.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import asyncio
import os
from datetime import datetime
import services_configuration as c
import json
import requests                                                                 #Import request library to do API requests
from fastapi import FastAPI, Header
from contextlib import asynccontextmanager
import keyring
from pydantic import BaseModel
from fastapi import HTTPException
import logging as l

# Configuratie
l.basicConfig(level=l.INFO)

WEATHER_API_KEY_NAME = "WEATHER_API_KEY"
MICROSERVICE_KEY_NAME = "MICROSERVICE_KEY"
SERVICE_NAME = "Weather_microservice"

SERVICE_STATE_RUNNING = 0
SERVICE_STATE_UNAVAILABLE = 1
SERVICE_STATE_DISABLED = 2
SERVICE_STATE_MISSING_SEVICE_KEY = 3

SERVICE_STATE_INVALID_API_KEY = 4
SERVICE_STATE_INVALID_LOCATION = 5

WEATHER_ICONS = [
    {"api_icon": "snow", "fa_icon": "fa-duotone fa-solid fa-snowflakes"},
    {"api_icon": "snow-showers-day", "fa_icon": "fa-duotone fa-solid fa-cloud-snow"},
    {"api_icon": "snow-showers-night", "fa_icon": "fa-duotone fa-solid fa-cloud-snow"},
    {"api_icon": "thunder-rain", "fa_icon": "fa-duotone fa-solid fa-cloud-bolt"},
    {"api_icon": "thunder-showers-day", "fa_icon": "fa-duotone fa-solid fa-cloud-bolt-sun"},
    {"api_icon": "thunder-showers-night", "fa_icon": "fa-duotone fa-solid fa-cloud-bolt-moon"},
    {"api_icon": "rain", "fa_icon": "fa-duotone fa-solid fa-cloud-showers"},
    {"api_icon": "showers-day", "fa_icon": "fa-duotone fa-solid fa-cloud-sun-rain"},
    {"api_icon": "showers-night", "fa_icon": "fa-duotone fa-solid fa-cloud-moon-rain"},
    {"api_icon": "fog", "fa_icon": "fa-duotone fa-solid fa-cloud-fog"},
    {"api_icon": "wind", "fa_icon": "fa-duotone fa-solid fa-wind"},
    {"api_icon": "cloudy", "fa_icon": "fa-duotone fa-solid fa-clouds"},
    {"api_icon": "partly-cloudy-day", "fa_icon": "fa-duotone fa-solid fa-cloud-sun"},
    {"api_icon": "partly-cloudy-night", "fa_icon": "fa-duotone fa-solid fa-cloud-moon"},
    {"api_icon": "clear-day", "fa_icon": "fa-duotone fa-solid fa-sun"},
    {"api_icon": "clear-night", "fa_icon": "fa-duotone fa-solid fa-moon"}
]


weather_location = None
microservice_api_key = None
weather_url = ""
api_key = None
task = None

################################################################################
#
#   @brief  Starts the lifespan handler.
#
################################################################################
@asynccontextmanager
async def lifespan(app: FastAPI):
    global task
    global weather_url
    global api_key
    global microservice_api_key

    api_key = keyring.get_password(c.APPLICATION_NAME, WEATHER_API_KEY_NAME)
    microservice_api_key = keyring.get_password(c.APPLICATION_NAME, MICROSERVICE_KEY_NAME)

    if microservice_api_key is None:
        l.error("No service API key")
    
    if api_key is None:
        l.error("No API key")

    yield
    task.cancel()                                                               #Stop when shutdown

app = FastAPI(title="Weather Microservice", lifespan=lifespan)

#region Endpoints
class LocationRequest(BaseModel):
    location: str
    
################################################################################
#
#   @brief  FastAPI endpoint. Sets the specified weather location.
#
################################################################################
@app.post("/set_location")
async def set_location(request: LocationRequest, x_api_key: str = Header(...)):
    if x_api_key != microservice_api_key:
        raise HTTPException(status_code=c.HTTP_CODE_UNAUTHORIZED)
    
    global weather_location
    global weather_url
    
    weather_location = request.location
    weather_url = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" + weather_location + "?key=" + api_key + "&unitGroup=metric&iconSet=icons2"

    result = _update_weather_forecast()
    if not result[0]:
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=result[1])

    _start_interval_updates()

    raise HTTPException(status_code=c.HTTP_CODE_OK, detail=result[1])

################################################################################
#
#   @brief  FastAPI endpoint. Reloads the weather API key.
#
################################################################################
@app.post("/reload_api_key")
async def reload_api_key(x_api_key: str = Header(...)):
    global task
    global api_key
    global weather_url

    if x_api_key != microservice_api_key:
        raise HTTPException(status_code=c.HTTP_CODE_UNAUTHORIZED)

    if task is not None:
        task.cancel()
    
    api_key = keyring.get_password(c.APPLICATION_NAME, WEATHER_API_KEY_NAME)
    weather_url = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" + weather_location + "?key=" + api_key + "&unitGroup=metric&iconSet=icons2"

    result = _download_weather_forecast()
    if not result[0]:
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=result[1])

    _start_interval_updates()

    raise HTTPException(status_code=c.HTTP_CODE_OK, detail=result[1])

################################################################################
#
#   @brief  FastAPI endpoint. Returns the service state.
#
################################################################################
@app.post("/get_state")
async def get_state(x_api_key: str = Header(...)):
    if microservice_api_key is None or microservice_api_key == "":
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=SERVICE_STATE_MISSING_SEVICE_KEY)
    
    if x_api_key != microservice_api_key:
        raise HTTPException(status_code=c.HTTP_CODE_UNAUTHORIZED)
    
    if api_key is None or api_key == "":
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=SERVICE_STATE_INVALID_API_KEY)
    
    if weather_location is None or weather_location == "":
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=SERVICE_STATE_INVALID_LOCATION)
    
    result = _download_weather_forecast()
    if not result[0]:
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=result[1])
    
    raise HTTPException(status_code=c.HTTP_CODE_OK, detail=SERVICE_STATE_RUNNING)

################################################################################
#
#   @brief  FastAPI endpoint. Updates the weather forecast.
#
################################################################################
@app.post("/update_weather_forecast")
async def update_weather_forecast(x_api_key: str = Header(...)):
    if x_api_key != microservice_api_key:
        raise HTTPException(status_code=c.HTTP_CODE_UNAUTHORIZED)
    
    result = _update_weather_forecast()
    if not result[0]:
        raise HTTPException(status_code=c.HTTP_CODE_SERVICE_UNAVAILABLE, detail=result[1])
    
    raise HTTPException(status_code=c.HTTP_CODE_OK)
#endregion

#region Utilities
########################################################################
#
#   @brief  Converts the VisualCrossings icons into FontAwesome icons.
#   @param  api_icon            VisualCrossings icon
#   @return str                 FontAwesome icon
#
########################################################################
def _convert_icon_to_fontawesome_icon(api_icon):
    for icon in WEATHER_ICONS:
        if icon["api_icon"] == api_icon:
            return icon["fa_icon"]
        
    return ""

########################################################################
#
#   @brief  Updates the weather forecast and saves it as JSON file
#   @return tuple               (False, [reason]) on error and (True,
#                               [resolved location]) on success
#
########################################################################
def _update_weather_forecast():
    if weather_location is None:
        l.warning("Not updating weather, waiting for weather location")
        return (False, SERVICE_STATE_INVALID_LOCATION)
    
    l.info("Updating weather")
    now = datetime.now() # current date and time
    date_now = now.strftime("%m-%d-%Y")
    time_now = now.strftime("%H:%M:%S")

    #Delete file
    if os.path.isfile(c.WEATHER_PATH):
        os.remove(c.WEATHER_PATH)

    result = _download_weather_forecast()
    if not result[0]:
        return (False, result[1])
        
    api_dict = result[1]

    weather_dict = {
        "date_downloaded": date_now,
        "time_downloaded": time_now,
        "resolved_address": api_dict["resolvedAddress"],
        "description": api_dict["description"],
        "days": []
    }

    for day_info in api_dict["days"]:
        weekday = datetime.strptime(day_info["datetime"], "%Y-%m-%d").weekday()
        day = {
                "weekday": c.WEEK_DAYS[weekday],
                "date": day_info["datetime"],
                "maximum_temperature": day_info["tempmax"],
                "minimum_temperature": day_info["tempmin"],
                "temperature": day_info["temp"],
                "feelslikemax": day_info["feelslikemax"],
                "feelslikemin": day_info["feelslikemin"],
                "feelslike": day_info["feelslike"],
                "dew": day_info["dew"],
                "humidity": day_info["humidity"],
                "snow": day_info["snow"],
                "snowdepth": day_info["snowdepth"],
                "windgust": day_info["windgust"],
                "windspeed": day_info["windspeed"],
                "wind_direction": day_info["winddir"],
                "pressure": day_info["pressure"],
                "cloudcover": day_info["cloudcover"],
                "visibility": day_info["visibility"],
                "solar_radiation": day_info["solarradiation"],
                "uv_index": day_info["uvindex"],
                "sunrise": day_info["sunrise"],
                "sunset": day_info["sunset"],
                "moonphase": day_info["moonphase"],
                "conditions": day_info["conditions"],
                "description": day_info["description"],
                "icon": _convert_icon_to_fontawesome_icon(day_info["icon"]),
                "hours": []
                }
        
        for hour in day_info["hours"]:
            hour = {
                "time": hour["datetime"],
                "temperature": hour["temp"],
                "feelslike": hour["feelslike"],
                "humidity": hour["humidity"],
                "dew": hour["dew"],
                "snow": hour["snow"],
                "snowdepth": hour["snowdepth"],
                "windgust": hour["windgust"],
                "windspeed": hour["windspeed"],
                "wind_direction": hour["winddir"],
                "pressure": hour["pressure"],
                "visibility": hour["visibility"],
                "cloudcover": hour["cloudcover"],
                "solar_radiation": hour["solarradiation"],
                "conditions": hour["conditions"],
                "icon": _convert_icon_to_fontawesome_icon(hour["icon"]),
                }
            day["hours"].append(hour)

        weather_dict["days"].append(day)

    with open(c.WEATHER_PATH, "w") as file:
        json.dump(weather_dict, file)

    return (True, weather_dict["resolved_address"])

########################################################################
#
#   @brief  Downloads the weather forecast from the API.
#   @return tuple               (False, [reason]) on error and (True,
#                               [forecast]) on success
#
########################################################################
def _download_weather_forecast():
    try:
        response = requests.get(weather_url)
    except Exception as e:
        l.error(str(e))
        return (False, SERVICE_STATE_UNAVAILABLE)
    
    if response.status_code == c.HTTP_CODE_BAD_REQUEST:
        return (False, SERVICE_STATE_INVALID_LOCATION)
    
    if response.status_code == c.HTTP_CODE_UNAUTHORIZED:
        return (False, SERVICE_STATE_INVALID_API_KEY)
    
    if response.status_code != c.HTTP_CODE_OK:
        l.error(response.text)
        return (False, SERVICE_STATE_UNAVAILABLE)

    return (True, response.json())

########################################################################
#
#   @brief  Downloads the weather forecast from the API.
#   @return str                 JSON with weather information
#
########################################################################
def _start_interval_updates():
    global task

    if task is not None:
        return
    
    task = asyncio.create_task(_update_weather_forecast_interval())     #Start background task

########################################################################
#
#   @brief  Periodic task to update the forecast every hour.
#
########################################################################
async def _update_weather_forecast_interval():
    while True:
        _update_weather_forecast()
        await asyncio.sleep(3600)                                       #Wait an hour
#endregion