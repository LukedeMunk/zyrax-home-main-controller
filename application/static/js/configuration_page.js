/******************************************************************************/
/*
 * File:    configuration_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the configuration page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const iconModalTitleElem = document.getElementById("iconModalTitle");
const deviceModalTitleElem = document.getElementById("deviceModalTitle");
const searchingDevicesTitleElem = document.getElementById("searchingDevicesTitle");

const ledstripModalTitleElem = document.getElementById("ledstripModalTitle");
const ledstripTitleElem = document.getElementById("ledstripTitle");
const ledstripNameTitleElem = document.getElementById("ledstripNameTitle");
const ledstripHostnameTitleElem = document.getElementById("ledstripHostnameTitle");
const ledstripModelTitleElem = document.getElementById("ledstripModelTitle");
const ledstripIconTitleElem = document.getElementById("ledstripIconTitle");
const ledstripIconLowStateTitleElem = document.getElementById("ledstripIconLowStateTitle");
const ledstripSensorTitleElem = document.getElementById("ledstripSensorTitle");
const ledstripHasSensorTitleElem = document.getElementById("ledstripHasSensorTitle");
const ledstripSensorIsInvertedTitleElem = document.getElementById("ledstripSensorIsInvertedTitle");
const ledstripSensorModelTitleElem = document.getElementById("ledstripSensorModelTitle");

const sensorModalTitleElem = document.getElementById("sensorModalTitle");
const sensorNameTitleElem = document.getElementById("sensorNameTitle");
const sensorIconTitleElem = document.getElementById("sensorIconTitle");
const sensorIconLowStateTitleElem = document.getElementById("sensorIconLowStateTitle");

const groupModalTitleElem = document.getElementById("groupModalTitle");
const groupNameTitleElem = document.getElementById("groupNameTitle");
const groupIconTitleElem = document.getElementById("groupIconTitle");
const groupTypeSelectTitleElem = document.getElementById("groupTypeSelectTitle");

const modulesTitleElem = document.getElementById("modulesTitle");
const weatherApiKeyTitleElem = document.getElementById("weatherApiKeyTitle");
const telegramBotTokenTitleElem = document.getElementById("telegramBotTokenTitle");

const weatherIntegrationTitleElem = document.getElementById("weatherIntegrationTitle");
const telegramIntegrationTitleElem = document.getElementById("telegramIntegrationTitle");
const rpiRfModuleTitleElem = document.getElementById("rpiRfModuleTitle");

/* Fields */
const errorMessageLedstripFieldElem = document.getElementById("errorMessageLedstripField");
const errorMessageSensorFieldElem = document.getElementById("errorMessageSensorField");
const errorMessageGroupFieldElem = document.getElementById("errorMessageGroupField");

const currentLedstripFirmwareVersionFieldElem = document.getElementById("currentLedstripFirmwareVersionField");

const errorMessageModuleConfigurationFieldElem = document.getElementById("errorMessageModuleConfigurationField");//

/* Buttons */
const manuallyAddDeviceBtnElem = document.getElementById("manuallyAddDeviceBtn");
const submitLedstripBtnElem = document.getElementById("submitLedstripBtn");
const submitSensorBtnElem = document.getElementById("submitSensorBtn");
const submitGroupBtnElem = document.getElementById("submitGroupBtn");

const resetToFactoryConfigurationBtnElem = document.getElementById("resetToFactoryConfigurationBtn");

/* Icons */

/* Input elements */
const ledstripNameTxtElem = document.getElementById("ledstripNameTxt");
const ledstripHostnameTxtElem = document.getElementById("ledstripHostnameTxt");
const ledstripIconTxtElem = document.getElementById("ledstripIconTxt");
const ledstripIconLowStateTxtElem = document.getElementById("ledstripIconLowStateTxt");
const ledstripHasSensorCbElem = document.getElementById("ledstripHasSensorCb");
const ledstripSensorIsInvertedCbElem = document.getElementById("ledstripSensorIsInvertedCb");
const ledstripSensorModelSelectElem = document.getElementById("ledstripSensorModelSelect");
const ledstripModelSelectElem = document.getElementById("ledstripModelSelect");
const sensorNameTxtElem = document.getElementById("sensorNameTxt");
const sensorIconTxtElem = document.getElementById("sensorIconTxt");
const sensorIconLowStateTxtElem = document.getElementById("sensorIconLowStateTxt");
const groupNameTxtElem = document.getElementById("groupNameTxt");
const groupIconTxtElem = document.getElementById("groupIconTxt");
const groupTypeSelectElem = document.getElementById("groupTypeSelect");

const otaPackageFileUploadElem = document.getElementById("otaPackageFileUpload");

const weatherServiceEnabledCbElem = document.getElementById("weatherServiceEnabledCb");
const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");
const telegramServiceEnabledCbElem = document.getElementById("telegramServiceEnabledCb");
const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");
const rpiRfModuleEnabledCbElem = document.getElementById("rpiRfModuleEnabledCb");

/* Tables */
const rfCodesTableElem = document.getElementById("rfCodesTable");
const logTableHeaderElem = document.getElementById("logTableHeader");
const logTableElem = document.getElementById("logTable");

/* Modals */
const iconModalElem = document.getElementById("iconModal");
const deviceModalElem = document.getElementById("deviceModal");
const ledstripModalElem = document.getElementById("ledstripModal");
const sensorModalElem = document.getElementById("sensorModal");
const groupModalElem = document.getElementById("groupModal");

/* Other */
const iconPickerContainerElem = document.getElementById("iconPickerContainer");
const searchingDevicesContainerElem = document.getElementById("searchingDevicesContainer");
const automaticDevicePairContainerElem = document.getElementById("automaticDevicePairContainer");
const manualDevicePairContainerElem = document.getElementById("manualDevicePairContainer");
const deviceTypeContainerElem = document.getElementById("deviceTypeContainer");
const deviceModelContainerElem = document.getElementById("deviceModelContainer");
const ledstripSensorInvertedContainerElem = document.getElementById("ledstripSensorInvertedContainer");
const ledstripSensorModelContainerElem = document.getElementById("ledstripSensorModelContainer");
const rfCodesContainerElem = document.getElementById("rfCodesContainer");
const groupTypeSelectContainerElem = document.getElementById("groupTypeSelectContainer");
const groupDevicesContainerElem = document.getElementById("groupDevicesContainer");
const ledstripContainerElem = document.getElementById("ledstripContainer");
const sensorContainerElem = document.getElementById("sensorContainer");
const cameraContainerElem = document.getElementById("cameraContainer");
const groupContainerElem = document.getElementById("groupContainer");

const ledstripGridElem = document.getElementById("ledstripGrid");
const sensorGridElem = document.getElementById("sensorGrid");
const cameraGridElem = document.getElementById("cameraGrid");
const groupGridElem = document.getElementById("groupGrid");
//#endregion

//#region Constants
const LOG_COLUMNS = [TEXT_TYPE, TEXT_MESSAGE, TEXT_DATE, TEXT_TIME];
const RF_CODE_TABLE_COLUMNS = [TEXT_CODE, TEXT_TIME, TEXT_OPTIONS]
const MAX_UPLOAD_RETRIES = 3;

const NOTE = 0;
const WARNING = 1;
const ERROR = 2;
const FATAL_ERROR = 3;

/* Configuration options */
const CONFIGURATION_OPTION_REFRESH_STATUS = {icon: "fa-solid fa-rotate clickable", title: TEXT_CHECK_STATUS, function: "checkDeviceConnectionStatus"}
const CONFIGURATION_OPTION_RESEND_CONFIGURATION = {icon: "fa-solid fa-share clickable", title: TEXT_RESEND_CONFIG, function: "rebootDevice"}
const CONFIGURATION_OPTION_DOWNLOAD_LOGS = {icon: "fa-solid fa-download clickable", title: TEXT_DOWNLOAD_LOGS, function: "downloadLogs"}
const CONFIGURATION_OPTION_UPDATE_LEDSTRIP = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, function: "loadLedstripModal"}
const CONFIGURATION_OPTION_DELETE_LEDSTRIP = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_LEDSTRIP, function: "deleteLedstripConfirm"}
const CONFIGURATION_OPTION_UPDATE_LEDSTRIP_LEDS = {icon: "fa-solid fa-list-timeline clickable", title: TEXT_UPDATE_PIXEL_ADDRESSING, function: "updateLedAddressing"}

const CONFIGURATION_OPTION_UPDATE_SENSOR = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, function: "loadSensorModal"}
const CONFIGURATION_OPTION_DELETE_SENSOR = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_SENSOR, function: "deleteSensorConfirm"}

const CONFIGURATION_OPTION_UPDATE_GROUP = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, function: "loadGroupModal"}
const CONFIGURATION_OPTION_DELETE_GROUP = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_GROUP, function: "deleteGroupConfirm"}

const CONFIGURATION_OPTIONS_LEDSTRIP = [CONFIGURATION_OPTION_UPDATE_LEDSTRIP,
                                        CONFIGURATION_OPTION_DELETE_LEDSTRIP,
                                        CONFIGURATION_OPTION_UPDATE_LEDSTRIP_LEDS,
                                        CONFIGURATION_OPTION_REFRESH_STATUS,
                                        CONFIGURATION_OPTION_RESEND_CONFIGURATION,
                                        CONFIGURATION_OPTION_DOWNLOAD_LOGS
                                        ]

const CONFIGURATION_OPTIONS_SENSOR = [CONFIGURATION_OPTION_UPDATE_SENSOR,
                                        CONFIGURATION_OPTION_DELETE_SENSOR
                                        ]

const CONFIGURATION_OPTIONS_GROUP = [CONFIGURATION_OPTION_UPDATE_GROUP,
                                        CONFIGURATION_OPTION_DELETE_GROUP,
                                        CONFIGURATION_OPTION_REFRESH_STATUS,
                                        ]
//#endregion

//#region Variables
let ledstrips = [];
let sensors = [];
let fileUploaded = true;

let isFetchingRfCodes = false;
let isFetchingUnconfiguredDevices = false;
let lastRecievedRfCodes = [];

let lastLedstripData;
let lastSensorData;
let lastGroupData;
//#endregion

//#region Key automation listeners
/* Ledstrip modal flow */
ledstripNameTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        ledstripHostnameTxtElem.focus();
    }
});
ledstripHostnameTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        ledstripModelSelectElem.focus();
    }
});
ledstripModelSelectElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        ledstripIconTxtElem.focus();
    }
});
ledstripIconTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        ledstripIconTxtElem.click();
    }
});
ledstripIconLowStateTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        ledstripIconLowStateTxtElem.click();
    }
});

/* Sensor modal flow */
sensorNameTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        sensorIconTxtElem.focus();
    }
});
sensorIconTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        sensorIconTxtElem.click();
    }
});
sensorIconLowStateTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        sensorIconLowStateTxtElem.click();
    }
});

/* Sensor modal flow */
groupNameTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        if (groupTypeSelectContainerElem.style.display == "none") {
            groupIconTxtElem.focus();
        } else {
            groupTypeSelectElem.focus();
        }
    }
});
groupTypeSelectElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        groupIconTxtElem.focus();
    }
});
groupIconTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        groupIconTxtElem.click();
    }
});

/* Modules */
weatherApiKeyTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        telegramBotTokenTxtElem.focus();
    }
});
telegramBotTokenTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        
    }
});
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();

    currentLedstripFirmwareVersionFieldElem.textContent = currentLedstripFirmwareVersion;

    weatherServiceEnabledCbElem.checked = weatherServiceEnabled;
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramServiceEnabledCbElem.checked = telegramServiceEnabled;
    telegramBotTokenTxtElem.value = telegramBotToken;
    rpiRfModuleEnabledCbElem.checked = rpiRfReceiverEnabled;

    loadDevices();
    loadIconOptions();
    loadLedstripModelSelectOptions();
    loadGroupTypeSelectOptions();
    loadLedstripSensorModelSelectOptions();

    generateTiles();
    generateLogTable();

    if (unconfiguredDevices.length > 0) {
        isFetchingUnconfiguredDevices = true;
    }

    fetchUnconfiguredDevices();
});

//#region Tile generation
/******************************************************************************/
/*!
  @brief    Generates configuration tiles.
*/
/******************************************************************************/
function generateTiles() {
    ledstripGridElem.innerHTML = "";
    sensorGridElem.innerHTML = "";
    cameraGridElem.innerHTML = "";
    groupGridElem.innerHTML = "";
    ledstripContainerElem.style.display = ledstrips.length > 0 ? "block" : "none";
    sensorContainerElem.style.display = sensors.length > 0 ? "block" : "none";
    cameraContainerElem.style.display = false ? "block" : "none";
    groupContainerElem.style.display = groups.length > 0 ? "block" : "none";

    for (let ledstrip of ledstrips) {
        generateDeviceTile(ledstrip);
    }
    for (let sensor of sensors) {
        generateDeviceTile(sensor);
    }
    for (let group of groups) {
        generateGroupTile(group);
    }
    
    let tileItem;
    let tileContainer;

    tileContainer = document.createElement("div");
    tileContainer.style.backgroundColor = "var(--background3)";
    tileContainer.style.boxShadow = "0 6px 12px var(--shadow-color)";
    tileContainer.className = "tile double-horizontal";
    tileContainer.setAttribute("onclick", "loadGroupModal();");

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";
    tileItem.style.gridRow = "span 2";
    tileItem.style.textAlign = "center";
    icon = document.createElement("i");
    icon.className = "fa-duotone fa-solid fa-plus fa-2x";

    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);
    groupGridElem.appendChild(tileContainer);
}

/******************************************************************************/
/*!
  @brief    Generates a tile for the specified device.
  @param    device              Device object
*/
/******************************************************************************/
function generateDeviceTile(device) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;

    let configurationOptions;
    let container;
    if (device.type == DEVICE_TYPE_LEDSTRIP) {
        configurationOptions = CONFIGURATION_OPTIONS_LEDSTRIP;
        container = ledstripGridElem;
    } else if (device.type == DEVICE_TYPE_SENSOR) {
        configurationOptions = CONFIGURATION_OPTIONS_SENSOR;
        container = sensorGridElem;
    } else if (device.type == DEVICE_TYPE_IP_CAMERA) {
        configurationOptions = CONFIGURATION_OPTIONS_IP_CAMERA;
        container = cameraGridElem;
    } else {
        console.log(device)
    }

    tileContainer = document.createElement("div");
    tileContainer.style.backgroundColor = "var(--background5)";
    //tileContainer.setAttribute("onclick", redirectFunction);

    tileContainer.className = "tile double-horizontal";
    tileContainer.style.boxShadow = "0 6px 12px var(--shadow-color)";
    tileContainer.style.gridTemplateColumns = "repeat(3, 33%)";

    /* Name */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";
    tileName = document.createElement("p");
    tileName.textContent = device.name;
    tileItem.appendChild(tileName);

    if (device.type == DEVICE_TYPE_LEDSTRIP || device.type == DEVICE_TYPE_IP_CAMERA) {
        tileName = document.createElement("p");
        tileName.style.fontSize = "10px";
        tileName.style.color = device.connection_status ? "var(--success_text)" : "var(--warning_text)";
        tileName.textContent = device.hostname;
        tileItem.appendChild(tileName);
        tileName = document.createElement("p");
        tileName.style.fontSize = "10px";
        tileName.style.color = device.connection_status ? "var(--success_text)" : "var(--warning_text)";
        tileName.textContent = device.ip_address;
        tileItem.appendChild(tileName);
    } else if (device.type == DEVICE_TYPE_SENSOR) {
        tileName = document.createElement("p");
        tileName.style.fontSize = "10px";
        tileName.textContent = "Last time triggered: XX:XX"
        tileItem.appendChild(tileName);
    }

    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.textAlign = "right";
    icon = document.createElement("i");
    icon.className = device.icon + " fa-xl";
    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    /* Options */
    tileItem = document.createElement("div");
    tileItem.style.display = "flex";
    tileItem.style.gap = "5px";

    for (let option of configurationOptions) {
        icon = document.createElement("i");
        icon.className = option.icon;
        icon.setAttribute("onclick", option.function + "(" + device.id + ");");
        tileItem.appendChild(icon);
    }

    tileContainer.appendChild(tileItem);
    container.appendChild(tileContainer);
}

/******************************************************************************/
/*!
  @brief    Generates a tile for the specified group.
  @param    group               Group object
*/
/******************************************************************************/
function generateGroupTile(group) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;

    tileContainer = document.createElement("div");
    tileContainer.style.backgroundColor = "var(--background5)";
    //tileContainer.setAttribute("onclick", redirectFunction);

    tileContainer.className = "tile double-horizontal";
    tileContainer.style.boxShadow = "0 6px 12px var(--shadow-color)";
    tileContainer.style.gridTemplateColumns = "repeat(3, 33%)";

    /* Name */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";
    tileName = document.createElement("p");
    tileName.textContent = group.name;
    tileItem.appendChild(tileName);

    tileName = document.createElement("p");
    tileName.style.fontSize = "10px";
    tileName.textContent = TYPES[group.type];
    tileItem.appendChild(tileName);

    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.textAlign = "right";
    icon = document.createElement("i");
    icon.className = group.icon + " fa-xl";
    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    /* Options */
    tileItem = document.createElement("div");
    tileItem.style.display = "flex";
    tileItem.style.gap = "5px";

    for (let option of CONFIGURATION_OPTIONS_GROUP) {
        icon = document.createElement("i");
        icon.className = option.icon;
        icon.setAttribute("onclick", option.function + "(" + group.id + ");");
        tileItem.appendChild(icon);
    }

    tileContainer.appendChild(tileItem);

    
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";
    tileName = document.createElement("p");
    tileName.style.fontSize = "10px";
    let deviceNames = [];
    for (let deviceId of group.device_ids) {
        for (let device of devices) {
            if (device.id == deviceId) {
                deviceNames.push(device.name);
                break;
            }
        }
    }
    tileName.textContent = deviceNames.join(", ");
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    groupGridElem.appendChild(tileContainer);
}
//#endregion

//#region Generate Log Table
/******************************************************************************/
/*!
  @brief    Generates the logs table.
*/
/******************************************************************************/
function generateLogTable() {
    logTableHeaderElem.innerHTML = "";
    logTableElem.innerHTML = "";

    generateLogTableHead();
    generateLogTableBody();
}

/******************************************************************************/
/*!
  @brief    Generates the log table head.
*/
/******************************************************************************/
function generateLogTableHead() {
    let row;
    let th;
    let cellContent;
    let icon;

    /* Row 1 */
    let tHead = logTableHeaderElem.createTHead();
    row = tHead.insertRow();

    th = document.createElement("th");
    th.colSpan = LOG_COLUMNS.length-1;

    /* Header title */
    cellContent = document.createTextNode(TEXT_LOGS_FROM_MASTER);
    th.appendChild(cellContent);
    row.appendChild(th);
    
    /* Options */
    /* Mark logs as read */
    th = document.createElement("th");
    th.style.textAlign = "right";

    icon = document.createElement("i");
    icon.className = "fa-solid fa-check clickable";
    icon.setAttribute("onclick", "markLogsRead();")
    icon.title = TEXT_MARK_LOGS_READ;
    
    if (logs.length > 0) {
        th.appendChild(icon);
    }
    row.appendChild(th);

    /* Row 2 */
    row = tHead.insertRow();
    row.style.backgroundColor = "var(--background5)";

    for (let column of LOG_COLUMNS) {
        let th = document.createElement("th");
        let cellContent = document.createTextNode(column);
        
        th.style.width = "10%";

        if (column == TEXT_MESSAGE) {
            th.style.width = "70%";
        }

        th.appendChild(cellContent);
        row.appendChild(th);
    }
}

/******************************************************************************/
/*!
  @brief    Generates the log table body.
*/
/******************************************************************************/
function generateLogTableBody() {
    let row;
    let cell;
    let cellContent;

    /* If no logs, alternative row */
    if (logs.length == 0) {
        row = logTableElem.insertRow();

        cell = row.insertCell();
        cell.colSpan = LOG_COLUMNS.length;                                      //Span over all columns
        cell.style.textAlign = "center";

        cellContent = document.createTextNode(TEXT_NO_LOGS_FOUND);
        cell.appendChild(cellContent);
        row.appendChild(cell);
        return;
    }

    for (let log of logs) {
        row = logTableElem.insertRow();

        let typeString = "";
        let backgroundColor = "";
        let logLine = log.log.replaceAll("[", "<b>");
        logLine = logLine.replaceAll("]", "</b>");

        /* Give every type another color based on priority */
        if (log.type == NOTE) {
            typeString = TEXT_NOTE
            backgroundColor = "var(--row_green)";
        } else if (log.type == WARNING) {
            typeString = TEXT_WARNING;
            backgroundColor = "var(--row_orange)";
        } else if (log.type == ERROR) {
            typeString = TEXT_ERROR;
            backgroundColor = "var(--row_red)";
        } else if (log.type == FATAL_ERROR) {
            typeString = TEXT_FATAL_ERROR;
            backgroundColor = "var(--row_red)";
        }

        row.style.backgroundColor = backgroundColor;
        
        /* Log type */
        cell = row.insertCell();
        cell.style.width = "10%";
        cellContent = document.createTextNode(typeString);
        cell.appendChild(cellContent);

        /* Log message */
        cell = row.insertCell();
        cell.style.width = "70%";
        cellContent = document.createTextNode(logLine);
        cell.innerHTML = logLine;

        /* Log date */
        cell = row.insertCell();
        cell.style.width = "10%";
        cellContent = document.createTextNode(log.date);
        cell.appendChild(cellContent);

        /* Log time */
        cell = row.insertCell();
        cell.style.width = "10%";
        cellContent = document.createTextNode(log.time);
        cell.appendChild(cellContent);
    }
}
//#endregion

//#region Generate RF Table
/******************************************************************************/
/*!
  @brief    Generates the RF code table.
*/
/******************************************************************************/
function generateRfCodeTable() {
    rfCodesTableElem.innerHTML = "";

    generateRfCodeTableBody();
    generateRfCodeTableHead();
}

/******************************************************************************/
/*!
  @brief    Generates the RF code table head.
*/
/******************************************************************************/
function generateRfCodeTableHead() {
    let tHead = rfCodesTableElem.createTHead();
    let row = tHead.insertRow();
    row.style.backgroundColor = "var(--background5)";
    row.style.cursor = "pointer";

    for (let column of RF_CODE_TABLE_COLUMNS) {
        let th = document.createElement("th");
        let cellContent = document.createTextNode(column);
        
        th.style.width = "40%";

        if (column == TEXT_OPTIONS) {
            th.style.width = "20%";
        }
        th.appendChild(cellContent);
        row.appendChild(th);
    }
}

/******************************************************************************/
/*!
  @brief    Generates the RF code table body.
*/
/******************************************************************************/
function generateRfCodeTableBody() {
    let row;
    let cell;
    let cellContent;

    if (lastRecievedRfCodes.length == 0) {
        row = rfCodesTableElem.insertRow();

        cell = row.insertCell();
        cell.colSpan = RF_CODE_TABLE_COLUMNS.length;                            //Span over all columns
        cell.style.textAlign = "center";

        cellContent = document.createTextNode(TEXT_LISTENING_TO_RF_CODES);
        cell.appendChild(cellContent);
        row.appendChild(cell);
        return;
    }

    for (let code of lastRecievedRfCodes[0]) {
        row = rfCodesTableElem.insertRow();

        /* Hostname */
        cell = row.insertCell();
        cellContent = document.createTextNode(code);
        cell.appendChild(cellContent);
        
        /* IP */
        cell = row.insertCell();
        cellContent = document.createTextNode("00:00");
        cell.appendChild(cellContent);
        
        /* Options */
        cell = row.insertCell();

        /*  */
        icon = document.createElement("i");
        icon.style.marginLeft = "6px";
        icon.className = "fa-solid fa-plus clickable";
        icon.setAttribute("onclick", "addCodeFromList(" + code + ");");
        icon.title = TEXT_ADD_CODE;
        cell.appendChild(icon);
    }
}
//#endregion

//#region Ledstrip functions
/******************************************************************************/
/*!
  @brief    Opens the modal for the selected unconfigured device type.
  @param    hostname            Hostname of the devicet
*/
/******************************************************************************/
function addUnconfiguredDevice(hostname) {
    isFetchingUnconfiguredDevices = false;

    ledstripHostnameTxtElem.value = hostname;

    let index = 0;
    for (device of unconfiguredDevices) {
        if (device.hostname == hostname) {
            unconfiguredDevices.splice(index, 1);
            break;
        }
        index++;
    }

    //TODO: check device type
    loadLedstripModal(undefined, undefined, hostname);
}

/******************************************************************************/
/*!
  @brief    Adds a ledstrip to the back-end.
  @param    model               Device model
*/
/******************************************************************************/
function addLedstrip() {
    if (!validateLedstrip()) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_ledstrip", lastLedstripData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageLedstripFieldElem.style.display = "inline-block";
        errorMessageLedstripFieldElem.textContent = result.message;
        return;
    }

    updateLedstripSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Updates the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
function updateLedstrip(id) {
    if (!validateLedstrip(id)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/update_ledstrip", lastLedstripData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageLedstripFieldElem.style.display = "inline-block";
        errorMessageLedstripFieldElem.textContent = result.message;
        return;
    }

    updateLedstripSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before deleting the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
function deleteLedstripConfirm(id) {
    let isInGroup = false;
    let ledstrip = ledstrips[getIndexFromId(ledstrips, id)];

    for (let group of groups) {
        if (getIndexFromId(group.device_ids, id, false) != -1) {
            isInGroup = true;
            break;
        }
    }

    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteLedstrip(" + id + ");"},
                    CANCEL_POPUP_BUTTON
                ];

    if (isInGroup) {
        showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_OUT_OF_GROUP(ledstrip.name), buttons, BANNER_TYPE_WARNING);
    } else {
        showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(ledstrip.name), buttons, BANNER_TYPE_WARNING);
    }
}

/******************************************************************************/
/*!
  @brief    Deletes the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
function deleteLedstrip(id) {
    closePopup();

    httpPostRequest("/delete_ledstrip", {id: id});

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].id == id) {
            devices.splice(i, 1);
            break;
        }
    }

    for (let group of groups) {
        let index = getIndexFromId(group.device_ids, id, false);
        if (index != -1) {
            group.device_ids.splice(index, 1);
        }

        if (group.device_ids.length == 0) {
            groups.splice(getIndexFromId(groups, group.id), 1);
            showBanner(TEXT_GROUP_DELETED, TEXT_GROUP_DELETED_NO_DEVICES, BANNER_TYPE_INFO);
        }
    }

    loadDevices();
    generateTiles();
    showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Handles the server response for updating or adding ledstrips.
  @param    result              Server response to handle
*/
/******************************************************************************/
function updateLedstripSuccess(result) {
    let updated = false;

    if (lastLedstripData.id != -1) {
        updated = true;
    }

    if (updated) {
        for (let i in ledstrips) {
            if (ledstrips[i].id == lastLedstripData.id) {
                if (lastLedstripData.name != undefined) {
                    ledstrips[i].name = lastLedstripData.name;
                }
                if (lastLedstripData.ip_address != undefined) {
                    ledstrips[i].ip_address = lastLedstripData.ip_address;
                }
                if (lastLedstripData.has_sensor != undefined) {
                    ledstrips[i].has_sensor = lastLedstripData.has_sensor;
                }
                if (lastLedstripData.number_of_leds != undefined) {
                    ledstrips[i].number_of_leds = lastLedstripData.number_of_leds;
                }
                if (lastLedstripData.driver != undefined) {
                    ledstrips[i].driver = lastLedstripData.driver;
                }
                ledstrips[i].connection_status = false;
                break;
            }
        }
    }

    if (updated) {
        showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    } else {
        lastLedstripData.id = result.message.id;       
        ledstrips.push(lastLedstripData);
        showBanner(TEXT_SUCCESS, TEXT_LEDSTRIP_ADDED_CLICK_TO_CONFIGURE, BANNER_TYPE_SUCCESS, BACK_END_UPDATE_INTERVAL_5S, "updateLedAddressing(" + lastLedstripData.id + ");");
    }

    generateTiles();
    closeModal(ledstripModalElem);
}

/******************************************************************************/
/*!
  @brief    Checks the connection status of the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
async function checkDeviceConnectionStatus(id) {
    //TODO show banner
    ledstrips[getIndexFromId(ledstrips, id)].connection_status = false;
    generateTiles();
    
    /* Wait for DOM to load connecting state */
    setTimeout(function() {
        let result = httpRequestJsonReturn("/check_ledstrip_connection_status", {"id" : id});
        ledstrips[getIndexFromId(ledstrips, id)].connection_status = result.message.connection_status;
        generateTiles();
    }, 50);
}
//#endregion

//#region Sensor functions
/******************************************************************************/
/*!
  @brief    Adds a sensor to the back-end.
*/
/******************************************************************************/
function addSensor(model) {
    if (!validateSensor(undefined, model)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_sensor", lastSensorData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageSensorFieldElem.style.display = "inline-block";
        errorMessageSensorFieldElem.textContent = result.message;
        return;
    }

    updateSensorSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Updates the specified sensor.
  @param    id                  Device ID
*/
/******************************************************************************/
function updateSensor(id) {
    if (!validateSensor(id)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/update_sensor", lastSensorData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageSensorFieldElem.style.display = "inline-block";
        errorMessageSensorFieldElem.textContent = result.message;
        return;
    }

    updateSensorSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before deleting the specified sensor.
  @param    id                  Device ID
*/
/******************************************************************************/
function deleteSensorConfirm(id) {
    let isInGroup = false;
    let sensor = sensors[getIndexFromId(sensors, id)];

    for (let group of groups) {
        if (getIndexFromId(group.device_ids, id, false) != -1) {
            isInGroup = true;
            break;
        }
    }

    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteSensor(" + id + ");"},
                    CANCEL_POPUP_BUTTON
                ];

    if (isInGroup) {
        showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_OUT_OF_GROUP(sensor.name), buttons, BANNER_TYPE_WARNING);
    } else {
        showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(sensor.name), buttons, BANNER_TYPE_WARNING);
    }
}

/******************************************************************************/
/*!
  @brief    Deletes the specified sensor.
  @param    id                  Device ID
*/
/******************************************************************************/
function deleteSensor(id) {
    closePopup();

    httpPostRequest("/delete_sensor", {"id" : id});

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].id == id) {
            devices.splice(i, 1);
        }
    }

    for (let group of groups) {
        let index = getIndexFromId(group.device_ids, id, false);
        if (index != -1) {
            group.device_ids.splice(index, 1);
        }

        if (group.device_ids.length == 0) {
            groups.splice(getIndexFromId(groups, group.id), 1);
            showBanner(TEXT_GROUP_DELETED, TEXT_GROUP_DELETED_NO_DEVICES, BANNER_TYPE_INFO);
        }
    }

    loadDevices();
    generateTiles();
    showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Handles the server response for updating or adding sensors.
  @param    result              Server response to handle
*/
/******************************************************************************/
function updateSensorSuccess(result) {
    let updated = false;

    if (lastSensorData.id != -1) {
        updated = true;
    }

    let model = sensorModels[lastSensorData.model];

    if (updated) {
        for (let i in sensors) {
            if (sensors[i].id == lastSensorData.id) {
                sensors[i].name = lastSensorData.name;
                sensors[i].icon = lastSensorData.icon;
                sensors[i].icon_low_state = lastSensorData.icon_low_state;
                for (let code in model.rf_code_types) {
                    sensors[i].rf_codes[code].rf_code = parseInt(lastSensorData.rf_codes_array[code]);
                }
                break;
            }
        }
    }

    if (updated) {
        showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    } else {
        lastSensorData.id = result.message.id;
        sensors.push(lastSensorData);
        showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    }

    generateTiles();
    closeModal(sensorModalElem);
}
//#endregion

//#region Group functions
/******************************************************************************/
/*!
  @brief    Adds a group to the back-end.
*/
/******************************************************************************/
function addGroup() {
    if (!validateGroup()) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_group", lastGroupData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageGroupFieldElem.style.display = "inline-block";
        errorMessageGroupFieldElem.textContent = result.message;
        return;
    }

    updateGroupSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Updates the specified group.
  @param    id                  Group ID
*/
/******************************************************************************/
function updateGroup(id) {
    if (!validateGroup(id)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/update_group", lastGroupData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageGroupFieldElem.style.display = "inline-block";
        errorMessageGroupFieldElem.textContent = result.message;
        return;
    }

    updateGroupSuccess(result);
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before deleting the specified group.
  @param    id                  Group ID
*/
/******************************************************************************/
function deleteGroupConfirm(id) {
    let group = groups[getIndexFromId(groups, id)];
    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteGroup(" + id + ");"},
                    CANCEL_POPUP_BUTTON
                ];

    showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_GROUP(group.name), buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Deletes the specified group.
  @param    id                  Group ID
*/
/******************************************************************************/
function deleteGroup(id) {
    closePopup();

    let groupIndex = getIndexFromId(groups, id);
    let data = {
        id: groups[groupIndex].id
    };
    
    httpPostRequest("/delete_group", data);

    groups.splice(groupIndex, 1);

    generateTiles();
    showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Handles the server response for updating or adding groups.
  @param    result              Server response to handle
*/
/******************************************************************************/
function updateGroupSuccess(result) {
    let updated = false;

    if (lastGroupData.id != -1) {
        updated = true;
    }

    if (updated) {
        for (let i in groups) {
            if (groups[i].id == lastGroupData.id) {
                groups[i].name = lastGroupData.name;
                groups[i].type = lastGroupData.type;
                groups[i].device_ids = lastGroupData.device_ids;
                break;
            }
        }
    }

    if (updated) {
        showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    } else {
        lastGroupData.id = result.message.id;                                      //New ID received from backend
        groups.push(lastGroupData);
        showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    }

    generateTiles();
    closeModal(groupModalElem);
}
//#endregion

//#region OTA
/******************************************************************************/
/*!
  @brief    Starts a remote ledstrip firmware update.
  @param    version             Version to update to
*/
/******************************************************************************/
function startOta(version) {
    isFetchingSystemInformation = false;
    
    showLoadingBanner(TEXT_SYSTEM_UPDATING, undefined, undefined, undefined, undefined, undefined, true);
    showPageOverlay();

    setTimeout(fetchOtaProgress, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
  @brief    Resets the OTA file input element.
*/
/******************************************************************************/
function resetFileInput() {
    closePopup();
    otaPackageFileUploadElem.value = "";
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before adding an obsolete OTA package.
*/
/******************************************************************************/
function addObsoleteOtaPackageConfirm() {
    let buttons = [
                    {text: TEXT_OK, onclickFunction: "addOtaPackage(true);"},
                    {text: TEXT_CANCEL, onclickFunction: "resetFileInput();"},
                ];

    showPopup(TEXT_Q_ARE_YOU_SURE, TEXT_Q_VERSION_OBSOLETE_UPLOAD_WARNING, buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Uploads a new firmware file.
  @param    obsoleteConfirmed       True if confirmation is positive
*/
/******************************************************************************/
function addOtaPackage(obsoleteConfirmed = false) {
    if (otaPackageFileUploadElem.files.length == 0) {
        showBanner(TEXT_WARNING, TEXT_NO_FILE_SELECTED, BANNER_TYPE_WARNING);
        return;
    }

    /* Validate files */
    if (otaPackageFileUploadElem.files.length != NUMBER_OF_OTA_FILES) {
        showBanner(TEXT_WARNING, TEXT_FILES_INVALID, BANNER_TYPE_WARNING);
        resetFileInput();
        return;
    }

    if (!validateUpdateFilename(otaPackageFileUploadElem.files[0].name)) {
        showBanner(TEXT_WARNING, "Invalid name", BANNER_TYPE_WARNING);
        resetFileInput();
        return;
    }

    /* Check version */
    let version = getVersion(otaPackageFileUploadElem.files[0].name);
    version = versionStringToObject(version);

    if (!obsoleteConfirmed && isObsoleteVersion(version, versionStringToObject(currentLedstripFirmwareVersion))) {
        addObsoleteOtaPackageConfirm();
        return;
    }

    if (obsoleteConfirmed) {
        closePopup();
    }

    numberOfOtaFilesUploaded = 0;
    startOtaPackageUpload(version);
}

/******************************************************************************/
/*!
  @brief    Starts the uploading of the selected OTA files.
  @param    version             Version of the OTA package
*/
/******************************************************************************/
async function startOtaPackageUpload(version) {
    for (let file of otaPackageFileUploadElem.files) {
        await waitUntilFileIsUploaded(_ => fileUploaded == true);               //Wait until previous file is uploaded
        fileUploaded = false;                                                   //Reset upload flag
        uploadUpdateFile("/upload_ota_file", file);
    }

    resetFileInput();
    setTimeout(function () {
        startOta(version);
    }, 3000);
}

/******************************************************************************/
/*!
  @brief    Handles the upload of OTA files.
  @param    url                 URL of the server to receive the file on
  @param    file                File object to upload
  @param    retries             Times the upload gets restarted on error
*/
/******************************************************************************/
function uploadUpdateFile(url, file, retries=MAX_UPLOAD_RETRIES) {
    showLoadingBanner(TEXT_UPLOADING_OTA_FILES, undefined, undefined, undefined, undefined, undefined, true, true);

    let request = new XMLHttpRequest();
    request.open("POST", url);

    request.onerror = () => {
        if (retries > 0) {
            setTimeout(function () {
                uploadUpdateFile(url, file, retries-1);
            }, 1000);
        } else {
            closeLoadingBanner();
            showBanner(TEXT_ERROR, TEXT_OTA_PACK_UPLOAD_ERROR, BANNER_TYPE_ERROR);
        }
    }

    /* Upload progress automation */
    request.onprogress = (e) => {
        let percentageDone = (e.loaded / e.total) * 100;
        showOtaFileUploadProgress(percentageDone, loadingBannerProgressBarElem);
        
        if (percentageDone == 100) {
            fileUploaded = true;
            numberOfOtaFilesUploaded++;
        }
    };

    /* Upload finished automation */
    request.onload = () => {
        /* If not all files are uploaded yet, return */
        if (numberOfOtaFilesUploaded != NUMBER_OF_OTA_FILES) {
            return;
        }

        closeLoadingBanner();
        showBanner(TEXT_SUCCESS, TEXT_UPLOAD_SUCCESSFULL, BANNER_TYPE_SUCCESS);
        showProgress(0, loadingBannerProgressBarElem);
    };

    let formData = new FormData();
    formData.append("otaFile", file);                                           //Append file

    request.send(formData);                                                     //Send POST request to server
}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
  @brief    Asynchronous interval function for fetching the RF codes for
            real-time monitoring.
*/
/******************************************************************************/
async function fetchRfCodes() {
    if (!isFetchingRfCodes) {
        setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    if (!sensorModalElem.classList.contains("show")) {
        isFetchingRfCodes = false;
        setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        var response = await fetch("get_last_received_rf_codes", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchRfCodes);
        return;
    }

    let data = await response.json();

    lastRecievedRfCodes = data.message.rf_codes;
    generateRfCodeTable();

    setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
  @brief    Asynchronous function that fetches and displays the OTA progress.
*/
/******************************************************************************/
async function fetchOtaProgress() {
    try {
        var response = await fetch("get_ledstrip_ota_progress", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchOtaProgress);
        return;
    }

    let data = await response.json();

    if (data.progress == -1) {
        closeLoadingBanner();
        hideOverlay();
        return;
    }

    showProgress(data.progress, loadingBannerProgressBarElem);

    /* If update is not finished */
    if (data.progress < 100) {
        setTimeout(fetchOtaProgress, BACK_END_UPDATE_INTERVAL_1S);
        return;
    }

    /* When ready, do this */
    closeLoadingBanner();
    hideOverlay();
    showBanner(TEXT_SUCCESS, TEXT_UPDATE_SUCCESSFULL, BANNER_TYPE_SUCCESS);
    currentFirmwareVersionFieldElem.textContent = currentFirmwareVersion;
}

/******************************************************************************/
/*!
  @brief    Asynchronous interval function for fetching connected (yet)
            unconfigured gondolas from the back-end.
*/
/******************************************************************************/
async function fetchUnconfiguredDevices() {
    /* Only when enabled, fetch. Else wait */
    if (!isFetchingUnconfiguredDevices) {
        setTimeout(fetchUnconfiguredDevices, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        var response = await fetch("get_unconfigured_devices", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        fetchTimeouts++;
        if (fetchTimeouts > FETCH_TIMEOUTS_BEFORE_RECONNECT) {
            showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
            setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchUnconfiguredDevices);
        } else {
            setTimeout(fetchUnconfiguredDevices, BACK_END_UPDATE_INTERVAL_1S);
        }
        return;
    }

    fetchTimeouts = 0;
    //unconfiguredDevices = serverResponse.message.devices;
    unconfiguredDevices = await response.json();

    loadUnconfiguredDevices();

    setTimeout(fetchUnconfiguredDevices, BACK_END_UPDATE_INTERVAL_5S);
}

/******************************************************************************/
/*!
  @brief    Waits until a file is uploaded.
  @param    conditionFunction   Function to check the state
  @returns  Promise             Promise to await
*/
/******************************************************************************/
function waitUntilFileIsUploaded(conditionFunction) {
    const poll = resolve => {
        if (conditionFunction()) {
            resolve();
        } else {
            setTimeout(_ => poll(resolve), 100);
        }
    }
  
    return new Promise(poll);
}
//#endregion

//#region Utilities
//#region Load functions
/******************************************************************************/
/*!
  @brief    Loads the text of elements in the selected language.
*/
/******************************************************************************/
function loadText() {
    iconModalTitleElem.textContent = TEXT_PICK_ICON;
    deviceModalTitleElem.textContent = TEXT_ADD_DEVICE;
    searchingDevicesTitleElem.textContent = TEXT_LOOKING_FOR_DEVICES;
    ledstripTitleElem.textContent = TEXT_LEDSTRIP;
    ledstripNameTitleElem.textContent = TEXT_NAME;
    ledstripHostnameTitleElem.textContent = TEXT_HOSTNAME;
    ledstripModelTitleElem.textContent = TEXT_MODEL;
    ledstripIconTitleElem.textContent = TEXT_ICON;
    ledstripIconLowStateTitleElem.textContent = TEXT_ICON_NOT_ACTIVE;
    ledstripSensorTitleElem.textContent = TEXT_SENSOR;
    ledstripHasSensorTitleElem.textContent = TEXT_HAS_SENSOR;
    ledstripSensorIsInvertedTitleElem.textContent = TEXT_INVERTED;
    ledstripSensorModelTitleElem.textContent = TEXT_MODEL;
    sensorNameTitleElem.textContent = TEXT_NAME;
    sensorIconTitleElem.textContent = TEXT_ICON;
    sensorIconLowStateTitleElem.textContent = TEXT_ICON_NOT_ACTIVE;
    groupNameTitleElem.textContent = TEXT_NAME;
    groupIconTitleElem.textContent = TEXT_ICON;

    manuallyAddDeviceBtnElem.textContent = TEXT_MY_ACCESSORY_NOT_FOUND;

    modulesTitleElem.textContent = TEXT_API_KEYS;
}

/******************************************************************************/
/*!
  @brief    Loads the devices in arrays based on device type.
*/
/******************************************************************************/
function loadDevices() {
    ledstrips = [];
    sensors = [];

    for (let device of devices) {
        if (device.type == DEVICE_TYPE_LEDSTRIP) {
            ledstrips.push(device);
        } else if (device.type == DEVICE_TYPE_SENSOR) {
            sensors.push(device);
        }
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip model select options.
*/
/******************************************************************************/
function loadLedstripModelSelectOptions() {
    ledstripModelSelectElem.innerHTML = "";
    
    for (let model of ledstripModels) {
        option = document.createElement("option");
        option.value = model.model;
        option.text = model.name;
        
        ledstripModelSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip model select options.
*/
/******************************************************************************/
function loadGroupTypeSelectOptions() {
    groupTypeSelectElem.innerHTML = "";
    
    for (let model of deviceTypes) {
        option = document.createElement("option");
        option.value = model.type;
        option.text = model.name;
        
        groupTypeSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip model select options.
*/
/******************************************************************************/
function loadLedstripSensorModelSelectOptions() {
    ledstripSensorModelSelectElem.innerHTML = "";
    
    for (let model of ledstripSensorModels) {
        option = document.createElement("option");
        option.value = model.model;
        option.text = model.name;
        
        ledstripSensorModelSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the devices models of the specified device type.
  @param    deviceType          Device type
*/
/******************************************************************************/
function loadDeviceModels(deviceType) {
    deviceModelContainerElem.innerHTML = "";
    let tile;
    let grid;
    let icon;

    let models;
    let func;
    let iconName;

    if (deviceType == DEVICE_TYPE_LEDSTRIP) {
        models = ledstripModels;
        func = "loadLedstripModal";
        iconName = "fa-duotone fa-regular fa-lightbulb fa-2x";
    } else if (deviceType == DEVICE_TYPE_SENSOR) {
        models = sensorModels;
        func = "loadSensorModal";
        iconName = "fa-duotone fa-solid fa-door-open fa-2x";
    } else if (deviceType == DEVICE_TYPE_IP_CAMERA) {
        models = cameraModels;
        func = "loadCameraModal";
        iconName = "fa-duotone fa-solid fa-camera-cctv fa-2x";
    }

    for (let model of models) {
        tile = document.createElement("div");
        tile.id = "sensorTile" + model.model;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";

        tile.setAttribute("onclick", func + "(undefined, " + model.model + ");");

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(model.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = iconName;

        grid.appendChild(icon);
        tile.appendChild(grid);

        deviceModelContainerElem.appendChild(tile);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the device modal.
  @param    manualPairing       If true, the supported devices can be chosen for
                                manual setup
*/
/******************************************************************************/
function loadDeviceModal(manualPairing=false) {
    if (manualPairing) {
        searchingDevicesContainerElem.style.display = "none";
        automaticDevicePairContainerElem.style.display = "none";
        manualDevicePairContainerElem.style.display = "block";
        manuallyAddDeviceBtnElem.style.display = "none";
        
        deviceTypeContainerElem.innerHTML = "";

        for (let type of deviceTypes) {
            let typeElem = document.createElement("button");
            typeElem.textContent = type.name;
            typeElem.setAttribute("onclick", "loadDeviceModels(" + type.type + ");");
            deviceTypeContainerElem.appendChild(typeElem);
        }

        showModal(deviceModalElem);
        return;
    }

    isFetchingUnconfiguredDevices = true;
    searchingDevicesContainerElem.style.display = "flex";
    automaticDevicePairContainerElem.style.display = "grid";
    manualDevicePairContainerElem.style.display = "none";
    manuallyAddDeviceBtnElem.style.display = "block";
    loadUnconfiguredDevices();
    showModal(deviceModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the unconfigured connected devices.
*/
/******************************************************************************/
function loadUnconfiguredDevices() {
    automaticDevicePairContainerElem.innerHTML = "";
    let tile;
    let grid;
    let icon;

    for (let device of unconfiguredDevices) {
        tile = document.createElement("div");
        tile.id = "targetDeviceTile" + device.hostname;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";

        tile.setAttribute("onclick", "addUnconfiguredDevice('" + device.hostname + "');");

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(device.hostname);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = DEVICE_TYPE_ICONS[device.type];
        
        grid.appendChild(icon);
        tile.appendChild(grid);

        automaticDevicePairContainerElem.appendChild(tile);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the icons for the specified element ID and shows the modal.
  @param    elementId           ID of the DOM element
*/
/******************************************************************************/
function loadIconModal(elementId) {
    loadIconOptions(elementId);
    showModal(iconModalElem);
}

/******************************************************************************/
/*!
  @brief    Sets the specified icon to the specified DOM element.
  @param    icon                Icon to set
  @param    elementId           ID of the DOM element
*/
/******************************************************************************/
function pickIcon(icon, elementId) {
    document.getElementById(elementId).className = icon;
    closeModal(iconModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the icons for the specified element ID.
  @param    elementId           ID of the DOM element
*/
/******************************************************************************/
function loadIconOptions(elementId) {
    iconPickerContainerElem.innerHTML = "";

    let iconElem;
    for (let icon of ICONS_XL) {
        iconElem = document.createElement("i");
        iconElem.className = icon + " clickable";
        iconElem.setAttribute("onclick", "pickIcon('" + icon + "', '" + elementId + "');");
        iconPickerContainerElem.appendChild(iconElem);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip modal with the specified parameters.
  @param    id                  Device ID
  @param    modelId             Model ID
  @param    hostname            Hostname of the ledstrip
*/
/******************************************************************************/
function loadLedstripModal(id=undefined, modelId=undefined, hostname=undefined) {
    closeModal(deviceModalElem, false);

    /* Reset error styling */
    errorMessageLedstripFieldElem.style.display = "none";

    ledstripNameTxtElem.classList.remove("invalid-input");
    ledstripHostnameTxtElem.classList.remove("invalid-input");
    ledstripIconTxtElem.classList.remove("invalid-input");
    ledstripIconLowStateTxtElem.classList.remove("invalid-input");
    ledstripModelSelectElem.classList.remove("invalid-input");

    if (id == undefined) {
        ledstripModalTitleElem.textContent = TEXT_ADD_LEDSTRIP;
        ledstripNameTxtElem.value = "";
        ledstripHostnameTxtElem.value = "";
        if (hostname != undefined) {
            ledstripHostnameTxtElem.value = hostname;
        }

        ledstripIconTxtElem.className = "";
        ledstripIconLowStateTxtElem.className = "";
        ledstripModelSelectElem.value = "";
        if (modelId != undefined) {
            ledstripModelSelectElem.value = modelId;
        }
        ledstripHasSensorCbElem.checked = false;
        ledstripSensorIsInvertedCbElem.checked = false;
        ledstripSensorInvertedContainerElem.style.display = "none";
        ledstripSensorModelContainerElem.style.display = "none";
        ledstripSensorModelSelectElem.value = "";

        submitLedstripBtnElem.setAttribute("onclick", "addLedstrip();");
        showModal(ledstripModalElem);
        return;
    }

    let ledstrip = ledstrips[getIndexFromId(ledstrips, id)];

    ledstripModalTitleElem.textContent = TEXT_UPDATE_LEDSTRIP;
    ledstripNameTxtElem.value = ledstrip.name;
    ledstripHostnameTxtElem.value= ledstrip.hostname;
    ledstripIconTxtElem.className = ledstrip.icon + " fa-xl";
    ledstripIconLowStateTxtElem.className = ledstrip.icon_low_state + " fa-xl";

    ledstripHasSensorCbElem.checked = ledstrip.has_sensor;
    ledstripSensorIsInvertedCbElem.checked = ledstrip.sensor_inverted;
    
    if (ledstrip.has_sensor == 1) {
        ledstripSensorInvertedContainerElem.style.display = "block";
        ledstripSensorModelContainerElem.style.display = "block";
    } else {
        ledstripSensorInvertedContainerElem.style.display = "none";
        ledstripSensorModelContainerElem.style.display = "none";
    }

    ledstripSensorModelSelectElem.value = ledstrip.sensor_model;
    submitLedstripBtnElem.setAttribute("onclick", "updateLedstrip(" + ledstrip.id + ");");

    showModal(ledstripModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the sensor modal.
  @param    id                  Device ID
  @param    modelId             Model ID
*/
/******************************************************************************/
function loadSensorModal(id=undefined, modelId=undefined) {
    closeModal(deviceModalElem, false);
    
    /* Reset error styling */
    errorMessageSensorFieldElem.style.display = "none";

    sensorNameTxtElem.classList.remove("invalid-input");
    sensorIconTxtElem.classList.remove("invalid-input");
    sensorIconLowStateTxtElem.classList.remove("invalid-input");

    if (id == undefined) {
        sensorModalTitleElem.textContent = TEXT_ADD_SENSOR;
        sensorNameTxtElem.value = "";
        sensorIconTxtElem.className = "";
        sensorIconLowStateTxtElem.className = "";
        loadRfCodeFields(modelId);

        submitSensorBtnElem.setAttribute("onclick", "addSensor(" + modelId + ");");

        showModal(sensorModalElem);
        isFetchingRfCodes = true;
        fetchRfCodes();
        return;
    }

    let sensor = sensors[getIndexFromId(sensors, id)];

    sensorModalTitleElem.textContent = TEXT_UPDATE_SENSOR;
    sensorNameTxtElem.value = sensor.name;
    sensorIconTxtElem.className = sensor.icon + " fa-xl";
    sensorIconLowStateTxtElem.className = sensor.icon_low_state + " fa-xl";
    loadRfCodeFields(sensor.model);
    submitSensorBtnElem.setAttribute("onclick", "updateSensor(" + sensor.id + ");");

    let model = sensorModels[sensor.model];

    for (let codeType of model.rf_code_types) {
        document.getElementById(codeType.type + "RfCodeTxt").value = getRfCode(sensor, codeType.type).rf_code;
    }

    showModal(sensorModalElem);
    isFetchingRfCodes = true;
    fetchRfCodes();
}

/******************************************************************************/
/*!
  @brief    Loads the RF code fields based on the specified RF device model ID.
  @param    modelId             Model ID
*/
/******************************************************************************/
function loadRfCodeFields(modelId) {
    rfCodesContainerElem.innerText = "";

    let model = sensorModels[modelId];
    for (let codeType of model.rf_code_types) {
        generateRfCodeInput(codeType);
    }
}

/******************************************************************************/
/*!
  @brief    Generates an RF code input field based on the specified RF code type.
  @param    type                RF code type object
*/
/******************************************************************************/
function generateRfCodeInput(type) {
    let container;
    let title;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.className = "input-field-container";

    /* Title */
    title = document.createElement("p");
    title.className = "input-field-title";
    title.textContent = type.name;
    container.appendChild(title);

    /* Input */
    input = document.createElement("input");
    input.className = "input-field";
    input.id = type.type + "RfCodeTxt";
    input.type = "text";
    container.appendChild(input);

    rfCodesContainerElem.appendChild(container);
}

/******************************************************************************/
/*!
  @brief    Loads the group modal.
  @param    id                  Group ID
*/
/******************************************************************************/
function loadGroupModal(id=undefined) {
    /* Reset error styling */
    errorMessageGroupFieldElem.style.display = "none";
    groupNameTxtElem.classList.remove("invalid-input");
    groupIconTxtElem.classList.remove("invalid-input");

    if (id == undefined) {
        groupModalTitleElem.textContent = TEXT_ADD_GROUP;
        groupNameTxtElem.value = "";
        groupIconTxtElem.className = "";
        groupTypeSelectElem.value = 0;
        groupTypeSelectContainerElem.style.display = "inline-block";
        groupTypeSelectTitleElem.textContent = TEXT_TYPE;
        groupTypeSelectTitleElem.title = "";
        submitGroupBtnElem.setAttribute("onclick", "addGroup();");

        updateGroupDevices();

        showModal(groupModalElem);
        return;
    }

    let group = groups[getIndexFromId(groups, id)];

    groupModalTitleElem.textContent = TEXT_EDIT_GROUP;
    groupNameTxtElem.value = group.name;
    groupIconTxtElem.className = group.icon + " fa-xl";
    groupTypeSelectContainerElem.style.display = "none";
    groupTypeSelectElem.value = group.type;
    groupTypeSelectTitleElem.textContent = TEXT_TYPE + " " + TYPES[group.type];
    groupTypeSelectTitleElem.title = TEXT_NO_TYPE_CHANGE;
    submitGroupBtnElem.setAttribute("onclick", "updateGroup(" + group.id + ");");
    updateGroupDevices(group);

    showModal(groupModalElem);
}

/******************************************************************************/
/*!
  @brief    Updates devices suitable for the specified group.
  @param    group               Group object
*/
/******************************************************************************/
function updateGroupDevices(group=undefined) {
    groupDevicesContainerElem.innerHTML = "";

    let tile;
    let grid;
    let icon;
    let type;

    if (group != undefined) {
        type = group.type;
    } else {
        type = groupTypeSelectElem.value;
    }

    for (let device of devices) {
        if (device.type != type) {
            continue;
        }
        
        tile = document.createElement("div");
        tile.id = "groupDeviceTile" + device.id;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";
        if (group != undefined) {
            for (let device_id of group.device_ids) {
                if (device.id == device_id) {
                    tile.className = "tile single tile-selected";
                }
            }
        }

        tile.setAttribute("onclick", "toggleGroupDeviceSelection(" + device.id + ");");

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(device.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        if (device.type == DEVICE_TYPE_LEDSTRIP) {
            icon.className = "fa-duotone fa-regular fa-lightbulb fa-2x";
        } else if (device.type == DEVICE_TYPE_SENSOR) {
            icon.className = "fa-duotone fa-regular fa-door-open fa-2x";
        }

        grid.appendChild(icon);
        tile.appendChild(grid);

        groupDevicesContainerElem.appendChild(tile);
    }
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the ledstrip input.
  @param    id                  Device ID
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateLedstrip(id=-1) {
    /* Get user input */
    let name = ledstripNameTxtElem.value;
    let hostname = ledstripHostnameTxtElem.value;
    let icon = ledstripIconTxtElem.className.replace(" fa-xl", "");
    let iconLowState = ledstripIconLowStateTxtElem.className.replace(" fa-xl", "");
    let driver = ledstripModelSelectElem.value;
    
    let hasSensor = ledstripHasSensorCbElem.checked;
    let sensorInverted = ledstripSensorIsInvertedCbElem.checked;
    let sensorModel = ledstripSensorModelSelectElem.value;

    /* Reset error styling */
    errorMessageLedstripFieldElem.style.display = "none";

    ledstripNameTxtElem.classList.remove("invalid-input");
    ledstripHostnameTxtElem.classList.remove("invalid-input");
    ledstripIconTxtElem.classList.remove("invalid-input");
    ledstripIconLowStateTxtElem.classList.remove("invalid-input");
    ledstripModelSelectElem.classList.remove("invalid-input");
    ledstripHasSensorCbElem.classList.remove("invalid-input");
    ledstripSensorModelSelectElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        ledstripNameTxtElem.classList.add("invalid-input");
        ledstripNameTxtElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate hostname */
    if (hostname == "") {
        ledstripHostnameTxtElem.classList.add("invalid-input");
        ledstripHostnameTxtElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }
    
    /* Validate driver */
    if (driver == "") {
        ledstripModelSelectElem.classList.add("invalid-input");
        ledstripModelSelectElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate icons */
    if (icon == "") {
        ledstripIconTxtElem.classList.add("invalid-input");
        ledstripIconTxtElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }
    if (iconLowState == "") {
        ledstripIconLowStateTxtElem.classList.add("invalid-input");
        ledstripIconLowStateTxtElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate sensor model */
    if (hasSensor && sensorModel == "") {
        ledstripSensorModelSelectElem.classList.add("invalid-input");
        ledstripSensorModelSelectElem.focus();
        errorMessageLedstripFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageLedstripFieldElem.style.display = "inline-block";
        return false;
    }

    for (let ledstrip of ledstrips) {
        if (ledstrip.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (ledstrip.name == name) {
            ledstripNameTxtElem.classList.add("invalid-input");
            ledstripNameTxtElem.focus();
            errorMessageLedstripFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageLedstripFieldElem.style.display = "inline-block";
            return false;
        }

        /* Check if hostname is unique */
        if (ledstrip.hostname == hostname) {
            ledstripHostnameTxtElem.classList.add("invalid-input");
            ledstripHostnameTxtElem.focus();
            errorMessageLedstripFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageLedstripFieldElem.style.display = "inline-block";
            return false;
        }
    }

    lastLedstripData = {
        id : id
    }

    let numberChanged = 0;

    if (id != -1) {
        let ledstrip = ledstrips[getIndexFromId(ledstrips, id)];
        if (ledstrip.hostname != hostname) {
            lastLedstripData.hostname = hostname;
            numberChanged++;
        }
        if (ledstrip.name != name) {
            lastLedstripData.name = name;
            numberChanged++;
        }
        if (ledstrip.driver != driver) {
            lastLedstripData.driver = driver;
            numberChanged++;
        }
        if (ledstrip.icon != icon) {
            lastLedstripData.icon = icon;
            numberChanged++;
        }
        if (ledstrip.icon_low_state != iconLowState) {
            lastLedstripData.icon_low_state = iconLowState;
            numberChanged++;
        }
        if (ledstrip.has_sensor != +hasSensor) {
            lastLedstripData.has_sensor = +hasSensor;
            numberChanged++;
        }
        if (ledstrip.sensor_inverted != +sensorInverted) {
            lastLedstripData.sensor_inverted = +sensorInverted;
            numberChanged++;
        }
        if (ledstrip.sensor_model != sensorModel) {
            lastLedstripData.sensor_model = parseInt(sensorModel);
            numberChanged++;
        }
        
        if (numberChanged == 0) {
            closeModal(ledstripModalElem);
            return false;
        }
    } else {
        lastLedstripData.name = name;
        lastLedstripData.hostname = hostname;
        lastLedstripData.driver = driver;
        lastLedstripData.type = DEVICE_TYPE_LEDSTRIP;
        lastLedstripData.icon = icon;
        lastLedstripData.icon_low_state = iconLowState;
        lastLedstripData.has_sensor = +hasSensor;
        lastLedstripData.sensor_inverted = +sensorInverted;
        lastLedstripData.sensor_model = parseInt(sensorModel);
    }
    
    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the sensor input.
  @param    id                  Device ID
  @param    modelId             Model ID
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateSensor(id=-1, modelId=undefined) {
    if (id != -1) {
        modelId = sensors[getIndexFromId(sensors, id)].model;
    }
    let model = sensorModels[modelId];

    /* Get user input */
    let name = sensorNameTxtElem.value;
    let icon = sensorIconTxtElem.className.replace(" fa-xl", "");
    let iconLowState = sensorIconLowStateTxtElem.className.replace(" fa-xl", "");
    let rfCodeElements = [];

    console.log(model)
    for (let codeType of model.rf_code_types) {
        document.getElementById(codeType.type + "RfCodeTxt").classList.remove("invalid-input");
        rfCodeElements.push(document.getElementById(codeType.type + "RfCodeTxt"));
    }

    let rfCodes = [];

    for (let element of rfCodeElements) {
        rfCodes.push(element.value);
    }
    console.log(rfCodes)

    /* Reset error styling */
    errorMessageSensorFieldElem.style.display = "none";

    sensorNameTxtElem.classList.remove("invalid-input");
    sensorIconTxtElem.classList.remove("invalid-input");
    sensorIconLowStateTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        sensorNameTxtElem.classList.add("invalid-input");
        sensorNameTxtElem.focus();
        errorMessageSensorFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageSensorFieldElem.style.display = "inline-block";
        return false;
    }
    /* Validate icons */
    if (icon == "") {
        sensorIconTxtElem.classList.add("invalid-input");
        sensorIconTxtElem.focus();
        errorMessageSensorFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageSensorFieldElem.style.display = "inline-block";
        return false;
    }
    if (iconLowState == "") {
        sensorIconLowStateTxtElem.classList.add("invalid-input");
        sensorIconLowStateTxtElem.focus();
        errorMessageSensorFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageSensorFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate RF open */
    let index = 0;
    for (let code of rfCodes) {
        if (code == "") {
            rfCodeElements[index].classList.add("invalid-input");
            rfCodeElements[index].focus();
            errorMessageSensorFieldElem.textContent = TEXT_FIELD_REQUIRED;
            errorMessageSensorFieldElem.style.display = "inline-block";
            return false;
        }

        /* Check if RF open is unique */
        if (!rfCodeIsUnique(id, code)) {
            rfCodeElements[index].classList.add("invalid-input");
            rfCodeElements[index].focus();
            errorMessageSensorFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageSensorFieldElem.style.display = "inline-block";
            return false;
        }
        index++;
    }

    for (let sensor of sensors) {
        if (sensor.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (sensor.name == name) {
            sensorNameTxtElem.classList.add("invalid-input");
            sensorNameTxtElem.focus();
            errorMessageSensorFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageSensorFieldElem.style.display = "inline-block";
            return false;
        }
    }

    lastSensorData = {
        id: id,
        name: name,
        icon: icon,
        type: DEVICE_TYPE_SENSOR,
        sensor_type: model.type,
        icon_low_state: iconLowState,
        rf_codes_array: rfCodes,
        rf_codes: "[" + rfCodes.toString() + "]",
        model: modelId
    }

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the group input.
  @param    id                  Group ID
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateGroup(id=-1) {
    /* Get user input */
    let name = groupNameTxtElem.value;
    let icon = groupIconTxtElem.className.replace(" fa-xl", "");
    let type = groupTypeSelectElem.value;
    let deviceIds = [];

    /* Get selected devices*/
    for (let device of devices) {
        if (device.type == type) {
            const tileElem = document.getElementById("groupDeviceTile" + device.id);
            if (tileElem.classList.contains("tile-selected")) {
                deviceIds.push(device.id);
            }
        }
    }

    /* Reset error styling */
    errorMessageGroupFieldElem.style.display = "none";
    groupNameTxtElem.classList.remove("invalid-input");
    groupIconTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        groupNameTxtElem.classList.add("invalid-input");
        groupNameTxtElem.focus();
        errorMessageGroupFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageGroupFieldElem.style.display = "inline-block";
        return false;
    }
    
    /* Validate icon */
    if (icon == "") {
        groupIconTxtElem.classList.add("invalid-input");
        groupIconTxtElem.focus();
        errorMessageGroupFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageGroupFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate devices */
    if (deviceIds.length == 0) {
        errorMessageGroupFieldElem.textContent = TEXT_SELECT_ONE_DEVICE;
        errorMessageGroupFieldElem.style.display = "inline-block";
        return false;
    }

    for (let group of groups) {
        if (group.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (group.name == name) {
            groupNameTxtElem.classList.add("invalid-input");
            groupNameTxtElem.focus();
            errorMessageGroupFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageGroupFieldElem.style.display = "inline-block";
            return false;
        }
    }

    lastGroupData = {
        id: id,
        name: name,
        icon: icon,
        type: type,
        device_ids: "[" + deviceIds.toString() + "]"
    }

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the specified update filename.
  @param    filename            Filename to validate
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateUpdateFilename(filename) {
    /* Check version in filename */
    let version = getVersion(filename);
    let extension = getFileExtension(filename);
    
    if (!version.match(VERSION_RE)) {
        showBanner(TEXT_ERROR, TEXT_FIRMWARE_FILENAME_INVALID, BANNER_TYPE_ERROR);
        return false;
    }

    /* Check extension */
    if (extension != EXTENSION_BIN) {
        showBanner(TEXT_ERROR, TEXT_FIRMWARE_FILE_NOT_SUPPORTED, BANNER_TYPE_ERROR);
        return false;
    }

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the weather module configuration.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateWeatherModuleConfiguration() {
    /* Get user input */
    let weatherServiceEnabledInput = weatherServiceEnabledCbElem.checked;
    let weatherApiKeyInput = weatherApiKeyTxtElem.value;

    /* Reset error styling */
    errorMessageModuleConfigurationFieldElem.style.display = "none";
    weatherApiKeyTxtElem.classList.remove("invalid-input");

    /* No API key check when disabled */
    if (!weatherServiceEnabledInput) {
        weatherServiceEnabled = weatherServiceEnabledInput;
        weatherApiKey = weatherApiKeyInput;
        return true;
    }

    /* Validate API key */
    if (weatherApiKeyInput.length != 25) {
        weatherApiKeyTxtElem.classList.add("invalid-input");
        weatherApiKeyTxtElem.focus();
        errorMessageModuleConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        weatherServiceEnabledCbElem.checked = false;
        return false;
    }
    
    weatherServiceEnabled = weatherServiceEnabledInput;
    weatherApiKey = weatherApiKeyInput;

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the Telegram configuration.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateTelegramModuleConfiguration() {
    /* Get user input */
    let telegramServiceEnabledInput = telegramServiceEnabledCbElem.checked;
    let telegramBotTokenInput = telegramBotTokenTxtElem.value;

    /* Reset error styling */
    errorMessageModuleConfigurationFieldElem.style.display = "none";
    telegramBotTokenTxtElem.classList.remove("invalid-input");

    /* No bot token check when disabled */
    if (!telegramServiceEnabledInput) {
        telegramServiceEnabled = telegramServiceEnabledInput;
        telegramBotToken = telegramBotTokenInput;
        return true;
    }

    /* Validate Telegram bot token */
    if (telegramBotTokenInput.length != 46) {
        telegramBotTokenTxtElem.classList.add("invalid-input");
        telegramBotTokenTxtElem.focus();
        errorMessageModuleConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        telegramServiceEnabledCbElem.checked = false;
        return false;
    }
    
    telegramServiceEnabled = telegramServiceEnabledInput;
    telegramBotToken = telegramBotTokenInput;

    return true;
}
//#endregion

//#region Others
/******************************************************************************/
/*!
  @brief    Shows the OTA package upload progress banner.
  @param    percentage          Progress percentage to show
  @param    progressElement     DOM element of the progress bar
*/
/******************************************************************************/
function showOtaFileUploadProgress(percentage, progressElement) {
    let totalPercentage = percentage / NUMBER_OF_OTA_FILES;
    let percentageFilesUploaded = numberOfOtaFilesUploaded / NUMBER_OF_OTA_FILES * 100;
    percentage = totalPercentage + percentageFilesUploaded;

    showProgress(percentage, progressElement);
}

/******************************************************************************/
/*!
  @brief    Marks the master logs as read.
*/
/******************************************************************************/
function markLogsRead() {
    logs = [];
    logsToBeShown = 0;

    generateLogTable();
    httpPostRequest("/mark_logs_read");
}

/******************************************************************************/
/*!
  @brief    Redirects to the logs page of the specified device.
  @param    id                  Device ID
*/
/******************************************************************************/
function downloadLogs(id) {
    let ledstrip = ledstrips[getIndexFromId(ledstrips, id)];
    window.open("http://" + ledstrip.hostname + "/download_logs", "_blank")
}

/******************************************************************************/
/*!
  @brief    Reboots the specified device.
  @param    id                  Device ID
*/
/******************************************************************************/
function rebootDevice(id) {
    httpPostRequest("/reboot_ledstrip", {id : id})
    showBanner(TEXT_SUCCESS, TEXT_LEDSTRIP_RESETTED, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Redirects to the LED addressing page of the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
function updateLedAddressing(id) {
    redirect("/configure_led_addressing?id=" + id);
}

/******************************************************************************/
/*!
  @brief    Returns the RF code object based on the specified sensor and RF code
            type.
  @param    sensor              Sensor object
  @param    type                RF code type ID
*/
/******************************************************************************/
function getRfCode(sensor, type) {
    for (let code of sensor.rf_codes) {
        if (code.type == type) {
            return code;
        }
    }
}

/******************************************************************************/
/*!
  @brief    Toggles whether the ledstrip has a sensor or not.
*/
/******************************************************************************/
function toggleLedstripHasSensor() {
    if (ledstripHasSensorCbElem.checked) {
        ledstripSensorInvertedContainerElem.style.display = "block";
        ledstripSensorModelContainerElem.style.display = "block";
    } else {
        ledstripSensorInvertedContainerElem.style.display = "none";
        ledstripSensorModelContainerElem.style.display = "none";
    }
}

/******************************************************************************/
/*!
  @brief    Toggles group device selection.
  @param    sensorId            Device ID
*/
/******************************************************************************/
function toggleGroupDeviceSelection(id) {
    const tileElem = document.getElementById("groupDeviceTile" + id);
    if (tileElem.classList.contains("tile-selected")) {
        tileElem.classList.remove("tile-selected");
    } else {
        tileElem.classList.add("tile-selected");
    }
}

/******************************************************************************/
/*!
  @brief    Toggles whether the RF code is unique or not.
  @param    sensorId            Sensor ID
  @param    rfCode              RF code
  @returns  bool                True if unique
*/
/******************************************************************************/
function rfCodeIsUnique(sensorId, rfCode) {
    for (let sensor of sensors) {
        if (sensor.id == sensorId) {
            continue;
        }

        for (let code of sensor.rf_codes) {
            if (code == rfCode) {
                return false;
            }
        }
    }

    return true;
}
//#endregion
//#endregion







/******************************************************************************/
/*!
  @brief    Submits the configuration when valid.
  @param    device              Device object
*/
/******************************************************************************/
function submitWeatherModuleConfiguration() {
    if (!validateWeatherModuleConfiguration()) {
        return;
    }

    let data = {
        weather_service_enabled: +weatherServiceEnabled,
        weather_api_key: weatherApiKey
    }

    let result = httpPostRequestJsonReturn("/update_weather_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Submits the configuration when valid.
  @param    device              Device object
*/
/******************************************************************************/
function submitTelegramModuleConfiguration() {
    if (!validateTelegramModuleConfiguration()) {
        return;
    }

    let data = {
        telegram_service_enabled: +telegramServiceEnabled,
        telegram_bot_token: telegramBotToken
    }

    let result = httpPostRequestJsonReturn("/update_telegram_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Enables or disables the Rpi RF receiver
*/
/******************************************************************************/
function submitRpiRfModuleEnabled() {
    rpiRfReceiverEnabled = rpiRfModuleEnabledCbElem.checked;

    let data = {
        rpi_rf_receiver_enabled: +rpiRfReceiverEnabled
    }

    let result = httpPostRequestJsonReturn("/update_rpi_rf_module", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        
        rpiRfReceiverEnabled = false;
        rpiRfModuleEnabledCbElem.checked = rpiRfReceiverEnabled;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before resetting the application configuration.
*/
/******************************************************************************/
function resetToFactoryConfigurationConfirm() {
    let buttons = [
                    {text: TEXT_RESET, onclickFunction: "resetToFactoryConfiguration();"},
                    CANCEL_POPUP_BUTTON
                ];

    showPopup(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_APPLICATION_CONFIGURATION, buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Resets the application configuration.
*/
/******************************************************************************/
function resetToFactoryConfiguration() {
    closePopup();
    
    weatherApiKey = "";
    telegramBotToken = "";
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;

    httpPostRequest("/reset_configuration");
    showBanner(TEXT_SUCCESS, TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}