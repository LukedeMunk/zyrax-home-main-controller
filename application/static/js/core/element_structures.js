/******************************************************************************/
/*
 * File:    element_structures.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   DOM element structures to render with JavaScript.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/

//#region Table configurations
const ALARM_TRIGGER_TABLE_CONFIGURATION = {
    id: "alarmTriggerTable",
    columns: [
        {
            title: TEXT_SENSOR,
            width: "60%"
        },
        {
            title: TEXT_DATE,
            width: "20%"
        },
        {
            title: TEXT_TIME,
            width: "20%"
        }
    ],
    noRowsMessage: TEXT_ALARM_NOT_TRIGGERED_YET
}

const RF_CODE_TABLE_CONFIGURATION = {
    id: "rfCodeTable",
    columns: [
        {
            title: TEXT_CODE,
            width: "40%"
        },
        {
            title: TEXT_TIME,
            width: "30%"
        },
        {
            title: TEXT_OPTIONS,
            canBeSorted: false,
            width: "30%"
        },
    ],
    noRowsMessage: TEXT_NO_RF_CODES_YET
}

const LOG_TABLE_CONFIGURATION = {
    id: "logTable",
    columns: [
        {
            title: TEXT_TYPE,
            width: "15%"
        },
        {
            title: TEXT_MESSAGE,
            width: "65%"
        },
        {
            title: TEXT_DATE,
            width: "10%"
        },
        {
            title: TEXT_TIME,
            width: "10%"
        }
    ],
    headerIcons: [
        {icon: "fa-duotone fa-solid fa-arrow-down-short-wide fa-lg", onclickFunction: () => downloadAllLogs(), title: TEXT_SHOW_ALL_LOGS},
        {icon: "fa-duotone fa-solid fa-arrow-left fa-lg", onclickFunction: () => previousLogsMonth(), title: TEXT_PREVIOUS_MONTH},
        {icon: "fa-duotone fa-solid fa-arrow-right fa-lg", onclickFunction: () => nextLogsMonth(), title: TEXT_NEXT_MONTH},
    ],
    noRowsMessage: TEXT_NO_LOGS
}
//#endregion


//#region Modal configurations
const DASHBOARD_CONFIGURATION_OVERVIEW_MODAL_CONFIGURATION = {
    id: "DashboardConfigurationOverviewModal",
    title: TEXT_DASHBOARDS_OVERVIEW,
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_TABLE,
                    blockId: "dashboardOverviewTableContainer"
                },
            ]
        }
    ]
}

const DASHBOARD_CONFIGURATION_MODAL_CONFIGURATION = {
    id: "dashboardConfigurationModal",
    title: TEXT_ADD_DASHBOARD,
    description: TEXT_MANAGE_DASHBOARD,
    submitFunction: () => addDashboard(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "dashboardIconModalBtn",
                    title: TEXT_EDIT_DASHBOARD_ICON,
                    width: "50%",
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadDashboardIconModal()
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "dashboardIconTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "dashboardNameTxt",
                    title: TEXT_NAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
            ]
        }
    ]
}



const GROUP_MODAL_CONFIGURATION = {
    id: "groupModal",
    title: TEXT_ADD_GROUP,
    submitFunction: () => addGroup(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "groupIconModalBtn",
                    width: "fit-content",
                    title: TEXT_EDIT_GROUP_ICON,
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadIconModal("groupIconModalBtn", "groupIconTxt", "groupModal")
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "groupIconTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "groupNameTxt",
                    title: TEXT_NAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "groupTypeSelect",
                    title: TEXT_TYPE,
                    type: "select",
                    onchangeFunction: () => updateGroupDevices(),
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL,
                            nullValue: -1
                        }
                    ],
                    options: GROUP_TYPE_SELECT_OPTIONS
                },
                {
                    blockType: MODAL_BLOCK_TYPE_TILE_SELECT,
                    id: "groupDevicesTileSelect",
                    title: TEXT_TARGET_DEVICES,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ],
                    tiles: []
                },
            ]
        }
    ]
}

const ADD_TILE_MODAL_CONFIGURATION = {
    id: "addTileModal",
    title: TEXT_ADD_TILE,
    description: TEXT_CHOOSE_TILE_TYPE,
    maxWidth: "760px",
    //submitFunction: () => addDeactivationDevice(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "addTileTypeSelect",
                    title: TEXT_TYPE,
                    type: "select",
                    onchangeFunction: () => updateModalTileType(),
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL,
                            nullValue: -1
                        }
                    ],
                    options: TILE_TYPE_SELECT_OPTIONS
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "addTileTargetSelect",
                    blockId: "addTileTargetSelectContainer",
                    title: TEXT_TARGET,
                    type: "select",
                    visible: false,
                    onchangeFunction: () => generateTileTargetPreviews(),
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL,
                            nullValue: -1
                        }
                    ],
                    options: []
                },
                {
                    blockType: MODAL_BLOCK_TYPE_TILE_SELECT,
                    title: TEXT_PREVIEW,
                    id: "addTilePreviewTileSelect",
                    blockId: "addTilePreviewTileSelectContainer",
                    visible: false,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ],
                    tiles: []
                },
            ]
        }
    ]
}

/*
const DEACTIVATION_DEVICE_MODAL_CONFIGURATION = {
    id: "deactivationDeviceModal",
    title: TEXT_NEW_DEACTIVATION_DEVICE,
    submitFunction: () => addDeactivationDevice(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "deactivationDeviceNameTxt",
                    title: TEXT_NAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "deactivationDeviceIpTxt",
                    title: TEXT_IP_ADDRESS,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_MATCH,
                            regexPattern: IP_RE,
                            errorMessage: TEXT_FIELD_INVALID_IP
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_TILE_SELECT,
                    id: "networkDevicesTileSelect",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ],
                    tiles: []
                },
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "manuallyAddDeviceBtn",
                    title: TEXT_MY_DEVICE_IS_NOT_SHOWN_HERE,
                    width: "100%",
                    onclickFunction: () => manuallyAddDeactivationDevice()
                },
            ]
        }
    ]
}

const WEATHER_LOCATION_MODAL_CONFIGURATION = {
    id: "weatherLocationModal",
    title: TEXT_WEATHER_LOCATION,
    submitFunction: () => updateWeatherLocation(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "weatherLocationTxt",
                    title: TEXT_LOCATION,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                }
            ]
        }
    ]
}
*/


const LEDSTRIP_MODAL_CONFIGURATION = {
    id: "ledstripModal",
    title: TEXT_ADD_LEDSTRIP,
    submitFunction: () => addLedstrip(),
    columnDirection: "column",
    columns: [
        {
            isFieldset: true,
            title: TEXT_LEDSTRIP,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripNameTxt",
                    title: TEXT_NAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripHostnameTxt",
                    title: TEXT_HOSTNAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripModelSelect",
                    title: TEXT_MODEL,
                    type: "select",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL,
                            nullValue: -1
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "ledstripIconBtn",
                    title: TEXT_ICON,
                    width: "50%",
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadIconModal("ledstripIconBtn", "ledstripIconTxt", "ledstripModal")
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripIconTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "ledstripIconLowStateBtn",
                    title: TEXT_ICON_NOT_ACTIVE,
                    width: "50%",
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadIconModal("ledstripIconLowStateBtn", "ledstripIconLowStateTxt", "ledstripModal")
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripIconLowStateTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
            ]
        },
        {
            isFieldset: true,
            title: TEXT_SENSOR,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "ledstripHasSensorCb",
                    title: TEXT_HAS_SENSOR,
                    type: "toggle",
                    onclickFunction: () => toggleLedstripHasSensor()
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    blockId: "ledstripSensorIsInvertedBlock",
                    id: "ledstripSensorIsInvertedCb",
                    title: TEXT_INVERTED,
                    type: "toggle"
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    blockId: "ledstripSensorModelBlock",
                    id: "ledstripSensorModelSelect",
                    title: TEXT_SENSOR_MODEL,
                    type: "select",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL,
                            nullValue: -1
                        }
                    ]
                },
            ]
        }
    ]
}




const RF_DEVICE_MODAL_CONFIGURATION = {
    id: "rfDeviceModal",
    //title: TEXT_ADD_SENSOR,
    submitFunction: () => addRfDevice(),
    columns: [
        {
            isFieldset: false,
            blocks: [
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "rfDeviceNameTxt",
                    title: TEXT_NAME,
                    type: "text",
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        },
                        {
                            type: VALIDATION_REGEX_NO_MATCH,
                            regexPattern: SYMBOL_CRITICAL_RE,
                            errorMessage: TEXT_NO_CRITICAL_SYMBOLS
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "rfDeviceIconBtn",
                    title: TEXT_ICON,
                    width: "50%",
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadIconModal("rfDeviceIconBtn", "rfDeviceIconTxt", "rfDeviceModal")
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "rfDeviceIconTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_BUTTON,
                    id: "rfDeviceIconLowStateBtn",
                    title: TEXT_ICON_NOT_ACTIVE,
                    width: "50%",
                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
                    onclickFunction: () => loadIconModal("rfDeviceIconLowStateBtn", "rfDeviceIconLowStateTxt", "rfDeviceModal")
                },
                {
                    blockType: MODAL_BLOCK_TYPE_INPUT,
                    id: "rfDeviceIconLowStateTxt",
                    visible: false,
                    type: "text",
                    forceValidations: true,
                    validations: [
                        {
                            type: VALIDATION_NOT_NULL
                        }
                    ]
                },
                {
                    blockType: MODAL_BLOCK_TYPE_TABLE,
                    blockId: "rfCodesTableContainer"
                },
            ]
        }
    ]
}
//#endregion


const DASHBOARD_BAR_CONFIGURATION = {
    id: "dashboardNavBar",
    location: "right",
    buttons: [
        {
            id: "addDashboardNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => loadDashboardConfigurationModal(),
            icon: "fa-duotone fa-solid fa-plus fa-lg"
        },
        {
            id: "editDashboardNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => toggleConfigurationMode(),
            icon: "fa-duotone fa-solid fa-pen-to-square fa-lg"
        },
        {
            id: "dashboardOverviewNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => loadDashboardConfigurationOverviewModal(),
            icon: "fa-duotone fa-solid fa-gears fa-lg"
        }
    ]
};

const PROFILE_BAR_CONFIGURATION = {
    id: "profileNavBar",
    location: "left",
    buttons: [
        {
            id: "profileBtn",
            text: TEXT_MANAGE_PROFILE,
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => scrollToSection("profileContainer"),
            icon: "fa-duotone fa-solid fa-user fa-lg"
        },
        {
            id: "profilesBtn",
            text: TEXT_MANAGE_PROFILES,
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => scrollToSection("profilesContainer"),
            icon: "fa-duotone fa-solid fa-users fa-lg"
        },
        {
            id: "accountBtn",
            text: TEXT_MANAGE_ACCOUNT,
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => scrollToSection("accountContainer"),
            icon: "fa-duotone fa-solid fa-file-user fa-lg"
        },
        {
            id: "logoutBtn",
            text: TEXT_LOGOUT,
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => logout(),
            icon: "fa-duotone fa-solid fa-right-from-bracket fa-lg"
        }
    ]
};

const ICON_PICKER_MODAL_CONFIGURATION = {
    id: "iconPickerModal",
    title: TEXT_PICK_ICON,
    submitFunction: () => pickDashboardIcon(),
    icons: []
};
