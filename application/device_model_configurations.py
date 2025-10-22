################################################################################
#
# File:     device_model_configurations.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Contains device model configuration declarations.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
LEDSTRIP_MODEL_WS2801 = 0
LEDSTRIP_MODEL_WS2812B = 1
LEDSTRIP_MODEL_SK6812K = 2

LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH = 0

RF_DEVICE_TYPE_DOOR_SENSOR = 0
RF_DEVICE_TYPE_MOTION_SENSOR = 1

DEVICE_TYPE_LEDSTRIP = 0
DEVICE_TYPE_RF_DEVICE = 1
DEVICE_TYPE_IP_CAMERA = 2
DEVICE_TYPE_RF_BRIDGE = 3

RF_CODE_TYPE_ACTIVE = 0
RF_CODE_TYPE_INACTIVE = 1
RF_CODE_TYPE_TRIGGERED = 2
RF_CODE_TYPE_LOW_BATTERY = 3

RF_CODE_OPENED = {"name": "Open signal", "type": RF_CODE_TYPE_ACTIVE}
RF_CODE_CLOSED = {"name": "Close signal", "type": RF_CODE_TYPE_INACTIVE}
RF_CODE_ON = {"name": "On signal", "type": RF_CODE_TYPE_ACTIVE}
RF_CODE_OFF = {"name": "Off signal", "type": RF_CODE_TYPE_INACTIVE}
RF_CODE_TRIGGERED = {"name": "Trigger signal", "type": RF_CODE_TYPE_TRIGGERED}
RF_CODE_LOW_BATTERY = {"name": "Low battery signal", "type": RF_CODE_TYPE_LOW_BATTERY}


ICON_TYPE_ACTIVE = 0
ICON_TYPE_INACTIVE = 1

ICON_ON = {"name": "On", "type": ICON_TYPE_ACTIVE}
ICON_OFF = {"name": "Off", "type": ICON_TYPE_INACTIVE}
ICON_OPEN = {"name": "Open", "type": ICON_TYPE_ACTIVE}
ICON_CLOSED = {"name": "Closed", "type": ICON_TYPE_INACTIVE}
ICON_TRIGGERED = {"name": "Triggered", "type": ICON_TYPE_ACTIVE}
ICON_IDLE = {"name": "Idle", "type": ICON_TYPE_INACTIVE}

ICON_ICON = {"name": "Icon", "type": ICON_TYPE_ACTIVE}

LEDSTRIP_MODEL_ID_WS2801 = 0
LEDSTRIP_MODEL_ID_WS2812B = 1
LEDSTRIP_MODEL_ID_SK6812K = 2
LEDSTRIP_SENSOR_MODEL_ID_OPEN_CLOSE = 10

RF_SENSOR_MODEL_ID_DOOR_WINDOW = 100
RF_SENSOR_MODEL_ID_MOTION = 200
RF_SENSOR_MODEL_ID_MOTION_WITH_BATTERY = 201
RF_SWITCH_MODEL_ID_TOGGLE = 300
RF_SWITCH_MODEL_ID_TAP = 301
RF_REMOTE_MODEL_ID = 400

LEDSTRIP_MODELS = [
    {
        "model_id":LEDSTRIP_MODEL_ID_WS2801,
        "type":DEVICE_TYPE_LEDSTRIP,
        "name":"WS2801",
        "icons":[
            ICON_ON,
            ICON_OFF
        ]
    },
    {
        "model_id":LEDSTRIP_MODEL_ID_WS2812B,
        "type":DEVICE_TYPE_LEDSTRIP,
        "name":"WS2812B",
        "icons":[
            ICON_ON,
            ICON_OFF
        ]
    },
    {
        "model_id":LEDSTRIP_MODEL_ID_SK6812K,
        "type":DEVICE_TYPE_LEDSTRIP,
        "name":"SK6812K",
        "icons":[
            ICON_ON,
            ICON_OFF
        ]
    }
]

LEDSTRIP_SENSOR_MODELS = [
    {
        "model_id":LEDSTRIP_SENSOR_MODEL_ID_OPEN_CLOSE,
        "name":"Contact Switch"
    }
]

DOOR_SENSOR_MODELS = [
    {
        "model_id":RF_SENSOR_MODEL_ID_DOOR_WINDOW,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Door/Window Sensor",
        "rf_code_types":[
            RF_CODE_OPENED,
            RF_CODE_CLOSED
        ],
        "icons":[
            ICON_OPEN,
            ICON_CLOSED
        ],
        "states":[
            {
                "state": 0,
                "name": "Close"
            },
            {
                "state": 1,
                "name": "Open"
            }
        ]
    },
]

MOTION_SENSOR_MODELS = [
    {
        "model_id":RF_SENSOR_MODEL_ID_MOTION,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF PIR Motion Sensor",
        "rf_code_types":[
            RF_CODE_TRIGGERED
        ],
        "icons":[
            ICON_TRIGGERED,
            ICON_IDLE
        ],
        "states":[
            {
                "state": 0,
                "name": "Room Cleared"
            },
            {
                "state": 1,
                "name": "Presence Detected"
            }
        ]
    },
    {
        "model_id":RF_SENSOR_MODEL_ID_MOTION_WITH_BATTERY,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF PIR Motion Sensor with battery warning",
        "rf_code_types":[
            RF_CODE_TRIGGERED,
            RF_CODE_LOW_BATTERY
        ],
        "icons":[
            ICON_TRIGGERED,
            ICON_IDLE
        ],
        "states":[
            {
                "state": 0,
                "name": "Room Cleared"
            },
            {
                "state": 1,
                "name": "Presence Detected"
            },
            {
                "state": 2,
                "name": "Low Battery"
            }
        ]
    }
]

SWITCH_MODELS = [
    {
        "model_id":RF_SWITCH_MODEL_ID_TOGGLE,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Toggle Switch",
        "rf_code_types":[
            RF_CODE_ON,
            RF_CODE_OFF
        ],
        "icons":[
            ICON_ON,
            ICON_OFF
        ],
        "states":[
            {
                "state": 0,
                "name": "Turned off"
            },
            {
                "state": 1,
                "name": "Turned on"
            }
        ]
    },
    {
        "model_id":RF_SWITCH_MODEL_ID_TAP,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Tap Switch",
        "rf_code_types":[
            RF_CODE_TRIGGERED
        ],
        "icons":[
            ICON_ICON
        ],
        "states":[
            {
                "state": 0,
                "name": "Activated"
            }
        ]
    },   
]

REMOTE_MODELS = [
    {
        "model_id":RF_REMOTE_MODEL_ID,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Remote Control",
        "icons":[
            ICON_ICON
        ],
        "buttons":[
            #{
            #    "name": 0,
            #    "rf_code": 0
            #}
        ]
    },
]

POWER_OUTLET_MODELS = [
    {
        "model_id":9,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Toggle Power Outlet",
        "rf_code_types":[
            RF_CODE_ON,
            RF_CODE_OFF
        ],
        "icons":[
            ICON_ON,
            ICON_OFF
        ],
        "states":[
            {
                "state": 0,
                "name": "Off"
            },
            {
                "state": 1,
                "name": "On"
            }
        ]
    },
    {
        "model_id":10,
        "type":DEVICE_TYPE_RF_DEVICE,
        "name":"RF Tap Power Outlet",
        "rf_code_types":[
            RF_CODE_TRIGGERED
        ],
        "icons":[
            ICON_ICON
        ]
    },
]
CAMERA_MODELS = [
    {
        "model_id":11,
        "type":DEVICE_TYPE_IP_CAMERA,
        "name":"Not supported yet",
        "icons":[
            ICON_ICON
        ],
        "states":[
            {
                "state": 0,
                "name": "Activated"
            }
        ]
    },
    
]





#DEVICE_TYPE_RF_SENSOR
#DEVICE_TYPE_RF_REMOTE_SWITCH = 2
#DEVICE_TYPE_RF_POWER_OUTLET = 3

DEVICE_TYPES = [{"name": "Ledstrips", "type" : DEVICE_TYPE_LEDSTRIP},
                {"name": "RF Devices", "type" : DEVICE_TYPE_RF_DEVICE},
                {"name": "Cameras", "type" : DEVICE_TYPE_IP_CAMERA},]
                #{"name": "RF Sensors", "type" : DEVICE_TYPE_RF_SENSOR},
                #{"name": "RF Remotes", "type" : DEVICE_TYPE_RF_REMOTE_SWITCH},
                #{"name": "RF Power Outlets", "type" : DEVICE_TYPE_RF_POWER_OUTLET}]

DEVICE_CATEGORY_LEDSTRIP = 0
DEVICE_CATEGORY_DOOR_SENSOR = 1
DEVICE_CATEGORY_MOTION_SENSOR = 2
DEVICE_CATEGORY_SWITCH = 3
DEVICE_CATEGORY_REMOTE = 4
DEVICE_CATEGORY_POWER_OUTLET = 5
DEVICE_CATEGORY_IP_CAMERA = 6

DEVICE_CATEGORIES = [
    {
        "name":"Ledstrip",
        "category":DEVICE_CATEGORY_LEDSTRIP,
        "icon":"fa-duotone fa-solid fa-lightbulb-on",
        "device_models":LEDSTRIP_MODELS
    },
    {
        "name":"Door/Window Sensor",
        "category":DEVICE_CATEGORY_DOOR_SENSOR,
        "icon":"fa-duotone fa-solid fa-door-open",
        "device_models":DOOR_SENSOR_MODELS
    },
    {
        "name":"Motion Sensor",
        "category":DEVICE_CATEGORY_MOTION_SENSOR,
        "icon":"fa-duotone fa-solid fa-person-walking",
        "device_models":MOTION_SENSOR_MODELS
    },
    {
        "name":"Switch",
        "category":DEVICE_CATEGORY_SWITCH,
        "icon":"fa-duotone fa-solid fa-circle-sort",
        "device_models":SWITCH_MODELS
    },
    {
        "name":"Remote",
        "category":DEVICE_CATEGORY_REMOTE,
        "icon":"fa-duotone fa-solid fa-light-switch",
        "device_models":REMOTE_MODELS
    },
    {
        "name":"Power Outlet",
        "category":DEVICE_CATEGORY_POWER_OUTLET,
        "icon":"fa-duotone fa-solid fa-outlet",
        "device_models":POWER_OUTLET_MODELS
    },
    {
        "name":"Camera",
        "category":DEVICE_CATEGORY_IP_CAMERA,
        "icon":"fa-duotone fa-solid fa-camera-cctv",
        "device_models":CAMERA_MODELS
    }
]

DEVICE_MODELS = {}

#Save to other format
for category in DEVICE_CATEGORIES:
    for model in category["device_models"]:
        DEVICE_MODELS[model["model_id"]] = {
            "model_id": model["model_id"],
            "name": model["name"],
            "icons": model["icons"],
            "category": category["category"],
            "categoryName": category["name"],
            "icon": category["icon"],
            "states": model.get("states", []),
            "rf_code_types": model.get("rf_code_types", None),
            "type": model.get("type", None)
        }
DEVICE_MODELS = list(map(lambda x: x[1], DEVICE_MODELS.items()))