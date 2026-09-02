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

/* Fields */
const currentLedstripFirmwareVersionFieldElem = document.getElementById("currentLedstripFirmwareVersionField");

/* Buttons */
const resetToFactoryConfigurationBtnElem = document.getElementById("resetToFactoryConfigurationBtn");

/* Icons */

/* Input elements */
const otaPackageFileUploadElem = document.getElementById("otaPackageFileUpload");

/* Tables */
const rfCodesTableElem = document.getElementById("rfCodesTable");
const logTableHeaderElem = document.getElementById("logTableHeader");
const logTableElem = document.getElementById("logTable");

/* Modals */
const deviceModalElem = document.getElementById("deviceModal");

/* Other */
const errorMessageModuleConfigurationFieldElem = document.getElementById("errorMessageModuleConfigurationField");//
const searchingDevicesContainerElem = document.getElementById("searchingDevicesContainer");
const automaticDevicePairContainerElem = document.getElementById("automaticDevicePairContainer");
const manualDevicePairContainerElem = document.getElementById("manualDevicePairContainer");
const deviceCategoryContainerElem = document.getElementById("deviceCategoryContainer");
const deviceModelContainerElem = document.getElementById("deviceModelContainer");

const devicesContainerElem = document.getElementById("devicesContainer");

const modulesTitleElem = document.getElementById("modulesTitle");
const weatherServiceEnabledCbElem = document.getElementById("weatherServiceEnabledCb");
const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");
const telegramServiceEnabledCbElem = document.getElementById("telegramServiceEnabledCb");
const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");
const rpiRfModuleEnabledCbElem = document.getElementById("rpiRfModuleEnabledCb");
//#endregion

//#region Constants
const LOG_COLUMNS = [TEXT_TYPE, TEXT_MESSAGE, TEXT_DATE, TEXT_TIME];
const MAX_UPLOAD_RETRIES = 3;

const NOTE = 0;
const WARNING = 1;
const ERROR = 2;
const FATAL_ERROR = 3;

/* Configuration options */
const CONFIGURATION_OPTION_REFRESH_STATUS = {icon: "fa-solid fa-rotate clickable", title: TEXT_CHECK_STATUS, onclickFunction: checkDeviceConnectionStatus}
const CONFIGURATION_OPTION_RESEND_CONFIGURATION = {icon: "fa-solid fa-share clickable", title: TEXT_RESEND_CONFIG, onclickFunction: rebootDevice}
const CONFIGURATION_OPTION_DOWNLOAD_LOGS = {icon: "fa-solid fa-download clickable", title: TEXT_DOWNLOAD_LOGS, onclickFunction: downloadLogs}
const CONFIGURATION_OPTION_UPDATE_LEDSTRIP = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, onclickFunction: loadLedstripModal}
const CONFIGURATION_OPTION_DELETE_LEDSTRIP = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_LEDSTRIP, onclickFunction: deleteLedstrip}
const CONFIGURATION_OPTION_UPDATE_LEDSTRIP_LEDS = {icon: "fa-solid fa-list-timeline clickable", title: TEXT_UPDATE_PIXEL_ADDRESSING, onclickFunction: updateLedAddressing}

const CONFIGURATION_OPTION_UPDATE_SENSOR = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, onclickFunction: loadRfDeviceModal}
const CONFIGURATION_OPTION_DELETE_SENSOR = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_SENSOR, onclickFunction: deleteRfDevice}

const CONFIGURATION_OPTION_UPDATE_GROUP = {icon: "fa-solid fa-pen-to-square clickable", title: TEXT_CONFIGURE, onclickFunction: loadGroupModal}
const CONFIGURATION_OPTION_DELETE_GROUP = {icon: "fa-solid fa-trash clickable", title: TEXT_DELETE_GROUP, onclickFunction: deleteGroup}

const CONFIGURATION_OPTIONS_LEDSTRIP = [
    CONFIGURATION_OPTION_UPDATE_LEDSTRIP,
    CONFIGURATION_OPTION_DELETE_LEDSTRIP,
    CONFIGURATION_OPTION_UPDATE_LEDSTRIP_LEDS,
    CONFIGURATION_OPTION_REFRESH_STATUS,
    CONFIGURATION_OPTION_RESEND_CONFIGURATION,
    CONFIGURATION_OPTION_DOWNLOAD_LOGS
]

const CONFIGURATION_OPTIONS_SENSOR = [
    CONFIGURATION_OPTION_UPDATE_SENSOR,
    CONFIGURATION_OPTION_DELETE_SENSOR
]

const CONFIGURATION_OPTIONS_GROUP = [
    CONFIGURATION_OPTION_UPDATE_GROUP,
    CONFIGURATION_OPTION_DELETE_GROUP,
]

const LEDSTRIP_MODEL_SELECT_OPTIONS = DEVICE_MODELS
    .filter(model => model.type == DEVICE_TYPE_LEDSTRIP)
    .map(model => ({
        value: model.model_id,
        text: model.name
    }));

const LEDSTRIP_SENSOR_MODEL_SELECT_OPTIONS = [{value: -1, text: ""}, {value: 0, text: TEXT_CONTACT_SENSOR}];
//#endregion

//#region Variables
let fileUploaded = true;

let isFetchingRfCodes = false;
let isFetchingUnconfiguredDevices = false;
let lastRecievedRfCodes = [];

const iconPickerObject = new IconPicker(ICON_PICKER_MODAL_CONFIGURATION);
const ledstripModalObject = new ModalForm(LEDSTRIP_MODAL_CONFIGURATION);
const rfDeviceModalObject = new ModalForm();
const groupModalObject = new ModalForm(GROUP_MODAL_CONFIGURATION);

let rfCodeModalTableObject;
//#endregion

//#region Event listeners
document.addEventListener("ledstripChanged", (e) => {
    generateDeviceDetailTiles();
});
document.addEventListener("rfDeviceChanged", (e) => {
    generateDeviceDetailTiles();
});
document.addEventListener("groupChanged", (e) => {
    generateDeviceDetailTiles();
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
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();

    iconPickerObject.render();

    ledstripModalObject.render();
    ledstripModalObject.setSelectOptions("ledstripModelSelect", LEDSTRIP_MODEL_SELECT_OPTIONS);
    ledstripModalObject.setSelectOptions("ledstripSensorModelSelect", LEDSTRIP_SENSOR_MODEL_SELECT_OPTIONS);

    groupModalObject.render();

    currentLedstripFirmwareVersionFieldElem.textContent = CURRENT_APPLICATION_VERSION;

    weatherServiceEnabledCbElem.checked = weatherServiceEnabled;
    weatherApiKeyTxtElem.value = weatherApiKey;
    if (weatherServiceEnabled) {
        weatherApiKeyTxtElem.disabled = false;
        weatherApiKeyTxtElem.classList.remove("disabled");
    }
    telegramServiceEnabledCbElem.checked = telegramServiceEnabled;
    telegramBotTokenTxtElem.value = telegramBotToken;
    if (telegramServiceEnabled) {
        telegramBotTokenTxtElem.disabled = false;
        telegramBotTokenTxtElem.classList.remove("disabled");
    }
    rpiRfModuleEnabledCbElem.checked = rpiRfEnabled;

    generateDeviceDetailTiles();
    generateLogTable();

    if (unconfiguredDevices.length > 0) {
        isFetchingUnconfiguredDevices = true;
    }

    fetchUnconfiguredDevices();
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has("show_welcome_message")) {
        banners.show(TEXT_WELCOME, TEXT_WELCOME_TO_THE_CONFIGURATION_PAGE, MESSAGE_TYPE_INFO)
    }
});

//#region Tile generation
/******************************************************************************/
/*!
    @brief  Generates configuration tiles.
*/
/******************************************************************************/
function generateDeviceDetailTiles() {
    devicesContainerElem.innerHTML = "";

    let index = 0;
    for (let category of DEVICE_CATEGORIES) {
        const containerElem = document.createElement("div");
        containerElem.id = "deviceCategory" + index + "Container";
        containerElem.style.flexGrow = "1";
        containerElem.style.display = "flex";
        containerElem.style.gap = "10px";
        containerElem.style.flexDirection = "column";

        const titleContainerElem = document.createElement("div");
        titleContainerElem.style.display = "flex";
        titleContainerElem.style.gap = "10px";
        titleContainerElem.style.alignItems = "baseline";
        titleContainerElem.style.justifyContent = "center";

        const titleElem = document.createElement("p");
        titleElem.textContent = category.name + "s";
        titleContainerElem.appendChild(titleElem);

        if (!RF_RECEIVER_PRESENT && category.device_models[0].type == DEVICE_TYPE_RF_DEVICE) {
            const warningIconElem = document.createElement("i");
            warningIconElem.className = "fa-duotone fa-solid fa-circle-exclamation";
            warningIconElem.title = TEXT_NO_RF_RECEIVER_PRESENT;
            titleContainerElem.appendChild(warningIconElem);
        }
        containerElem.appendChild(titleContainerElem);

        for (let device of devices) {
            if (device.category == index) {
                devicesContainerElem.appendChild(containerElem);        //First device, create column
                break;
            }
        }
        
        index++;
    }

    for (let device of devices) {
        generateDeviceTile(device);
    }
    
    const containerElem = document.createElement("div");
    containerElem.id = "groupContainer";
    containerElem.style.flexGrow = "1";
    containerElem.style.display = "flex";
    containerElem.style.gap = "10px";
    containerElem.style.flexDirection = "column";

    const titleElem = document.createElement("p");
    titleElem.textContent = TEXT_GROUPS;
    containerElem.appendChild(titleElem);

    devicesContainerElem.appendChild(containerElem);
    
    for (let group of groups) {
        generateGroupTile(group);
    }

    const tileElem = document.createElement("div");
    tileElem.style.backgroundColor = "var(--background4)";
    tileElem.style.boxShadow = "var(--shadow-small)";
    tileElem.className = "tile tile2x2";
    tileElem.onclick = () => loadGroupModal();

    /* Icon */
    const tileItemElem = document.createElement("div");
    tileItemElem.style.gridColumn = "span 2";
    tileItemElem.style.gridRow = "span 2";
    tileItemElem.style.textAlign = "center";

    const iconElem = document.createElement("i");
    iconElem.className = "fa-duotone fa-solid fa-plus fa-2x";

    tileItemElem.appendChild(iconElem);
    tileElem.appendChild(tileItemElem);
    containerElem.appendChild(tileElem);
}

/******************************************************************************/
/*!
    @brief  Generates a tile for the specified device.
    @param  device              Device object
*/
/******************************************************************************/
function generateDeviceTile(device) {
    let configurationOptions;

    switch (device.category) {
        case DEVICE_CATEGORY_LEDSTRIP:
            configurationOptions = CONFIGURATION_OPTIONS_LEDSTRIP;
            break;

        case DEVICE_CATEGORY_DOOR_SENSOR:
        case DEVICE_CATEGORY_MOTION_SENSOR:
        case DEVICE_CATEGORY_SWITCH:
        case DEVICE_CATEGORY_REMOTE:
        case DEVICE_CATEGORY_POWER_OUTLET:
            configurationOptions = CONFIGURATION_OPTIONS_SENSOR;
            break;

        case DEVICE_TYPE_IP_CAMERA:
            configurationOptions = CONFIGURATION_OPTIONS_IP_CAMERA;
            break;

        default:
            console.warn("Unknown device category");
            configurationOptions = [];
            break;
    }

    configurationOptions = configurationOptions.map(option => ({
        ...option,
        onclickFunction: () => option.onclickFunction(device.id)
    }));

    /* Name */
    let subtitle1 = device.name;
    let subtitle2 = "";
    let subtitleColor;

    if (device.type == DEVICE_TYPE_LEDSTRIP || device.type == DEVICE_TYPE_IP_CAMERA) {
        subtitle1 = device.hostname;
        subtitle2 = device.ip_address;
        subtitleColor = device.connection_status ? "var(--success-text)" : "var(--warning-text)";
    } else if (device.type == DEVICE_TYPE_RF_DEVICE) {
        subtitle1 = DEVICE_CATEGORIES[device.category].name;
    }

    let warningText;
    if (device.type == DEVICE_TYPE_LEDSTRIP && device.number_of_leds == 0) {
        warningText = TEXT_LED_ADDRESSING_NOT_CONFIGURED;
    }

    const containerElem = document.getElementById("deviceCategory" + device.category + "Container");
    new DeviceDetailsTile({
        containerElement: containerElem,
        title: device.name,
        subtitle1: subtitle1,
        subtitle2: subtitle2,
        subtitleColor: subtitleColor,
        icon: device.icon + " fa-xl",
        warningText: warningText,
        options: configurationOptions
    }).render();
}

/******************************************************************************/
/*!
    @brief  Generates a tile for the specified group.
    @param  group               Group object
*/
/******************************************************************************/
function generateGroupTile(group) {
    let deviceNames = [];
    for (let deviceId of group.device_ids) {
        for (let device of devices) {
            if (device.id == deviceId) {
                deviceNames.push(device.name);
                break;
            }
        }
    }
    
    let subtitle3 = deviceNames.join(", ");

    let configurationOptions = CONFIGURATION_OPTIONS_GROUP;
    configurationOptions = configurationOptions.map(option => ({
        ...option,
        onclickFunction: () => option.onclickFunction(group.id)
    }));
    
    const containerElem = document.getElementById("groupContainer");
    new DeviceDetailsTile({
        containerElement: containerElem,
        title: group.name,
        subtitle1: TYPES[group.type],
        subtitle3: subtitle3,
        icon: group.icon + " fa-xl",
        options: configurationOptions
    }).render();
}
//#endregion

//#region Generate Log Table
/******************************************************************************/
/*!
    @brief  Generates the logs table.
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
    @brief  Generates the log table head.
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
    icon.onclick = () => markLogsRead();
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
    @brief  Generates the log table body.
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
            backgroundColor = "var(--row-green)";
        } else if (log.type == WARNING) {
            typeString = TEXT_WARNING;
            backgroundColor = "var(--row-orange)";
        } else if (log.type == ERROR) {
            typeString = TEXT_ERROR;
            backgroundColor = "var(--row-red)";
        } else if (log.type == FATAL_ERROR) {
            typeString = TEXT_FATAL_ERROR;
            backgroundColor = "var(--row-red)";
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


//#region Ledstrip functions
/******************************************************************************/
/*!
    @brief  Checks the connection status of the specified ledstrip.
    @param  id                  Device ID
*/
/******************************************************************************/
async function checkDeviceConnectionStatus(id) {
    //TODO show banner
    devices[getIndexFromId(devices, id)].connection_status = false;
    generateDeviceDetailTiles();
    
    /* Wait for DOM to load connecting state */
    setTimeout(async function() {
        let result = await httpRequestJsonReturn("/check_ledstrip_connection_status", {"id" : id});
        devices[getIndexFromId(devices, id)].connection_status = result.message.connection_status;
        generateDeviceDetailTiles();
    }, 50);
}
//#endregion


//#region OTA
/******************************************************************************/
/*!
    @brief  Starts a remote ledstrip firmware update.
    @param  version             Version to update to
*/
/******************************************************************************/
function startOta(version) {
    isFetchingSystemInformation = false;
    loadingBanners.show(TEXT_SYSTEM_UPDATING, "/get_ledstrip_ota_progress", "progress", 100, TEXT_SUCCESS, TEXT_UPDATE_SUCCESSFULL, true, true);
}

/******************************************************************************/
/*!
    @brief  Resets the OTA file input element.
*/
/******************************************************************************/
function resetFileInput() {
    otaPackageFileUploadElem.value = "";
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before adding an obsolete OTA package.
*/
/******************************************************************************/
function addObsoleteOtaPackageConfirm() {
    return new Promise((resolve) => {
        let buttons = [CONTINUE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, TEXT_Q_VERSION_OBSOLETE_UPLOAD_WARNING, buttons, MESSAGE_TYPE_WARNING);
    });

}

/******************************************************************************/
/*!
    @brief  Uploads a new firmware file.
*/
/******************************************************************************/
async function addOtaPackage() {
    if (otaPackageFileUploadElem.files.length == 0) {
        banners.show(TEXT_WARNING, TEXT_NO_FILE_SELECTED, MESSAGE_TYPE_WARNING);
        return;
    }

    /* Validate files */
    if (otaPackageFileUploadElem.files.length != NUMBER_OF_OTA_FILES) {
        banners.show(TEXT_WARNING, TEXT_FILES_INVALID, MESSAGE_TYPE_WARNING);
        resetFileInput();
        return;
    }

    if (!validateUpdateFilename(otaPackageFileUploadElem.files[0].name)) {
        banners.show(TEXT_WARNING, TEXT_INVALID_FILENAME, MESSAGE_TYPE_WARNING);//XX
        resetFileInput();
        return;
    }

    /* Check version */
    let version = getVersion(otaPackageFileUploadElem.files[0].name);
    version = versionStringToObject(version);

    if (isObsoleteVersion(version, versionStringToObject(CURRENT_APPLICATION_VERSION))) {
        const choice = await addObsoleteOtaPackageConfirm();
        if (choice == CHOICE_OPTION_CANCEL) {
            resetFileInput();
            return;
        }
    }

    numberOfOtaFilesUploaded = 0;
    startOtaPackageUpload(version);
}

/******************************************************************************/
/*!
    @brief  Starts the uploading of the selected OTA files.
    @param  version             Version of the OTA package
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
    @brief  Handles the upload of OTA files.
    @param  url                 URL of the server to receive the file on
    @param  file                File object to upload
    @param  retries             Times the upload gets restarted on error
*/
/******************************************************************************/
function uploadUpdateFile(url, file, retries=MAX_UPLOAD_RETRIES) {
    loadingBanners.show(TEXT_UPLOADING_OTA_FILES, undefined, undefined, undefined, undefined, undefined, true, true);

    let request = new XMLHttpRequest();
    request.open("POST", url);

    request.onerror = () => {
        if (retries > 0) {
            setTimeout(function () {
                uploadUpdateFile(url, file, retries-1);
            }, 1000);
        } else {
            loadingBanners.closeAll();
            banners.show(TEXT_ERROR, TEXT_OTA_PACK_UPLOAD_ERROR, MESSAGE_TYPE_ERROR);
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

        loadingBanners.close();
        banners.show(TEXT_SUCCESS, TEXT_UPLOAD_SUCCESSFULL, MESSAGE_TYPE_SUCCESS);
    };

    let formData = new FormData();
    formData.append("otaFile", file);                                           //Append file

    request.send(formData);                                                     //Send POST request to server
}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
    @brief  Asynchronous interval function for fetching connected (yet)
            unconfigured gondolas from the back-end.
*/
/******************************************************************************/
async function fetchUnconfiguredDevices() {
    /* Only when enabled, fetch. Else wait */
    if (!isFetchingUnconfiguredDevices) {
        setTimeout(fetchUnconfiguredDevices, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let response;
    try {
        response = await fetch("get_unconfigured_devices", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        fetchTimeouts++;
        if (fetchTimeouts > FETCH_TIMEOUTS_BEFORE_RECONNECT) {
            loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
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
    @brief  Waits until a file is uploaded.
    @param  conditionFunction   Function to check the state
    @return Promise             Promise to await
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
    @brief  Loads the text of elements in the selected language.
*/
/******************************************************************************/
function loadText() {
    iconModalTitleElem.textContent = TEXT_PICK_ICON;
    deviceModalTitleElem.textContent = TEXT_ADD_DEVICE;
    searchingDevicesTitleElem.textContent = TEXT_LOOKING_FOR_DEVICES;

    modulesTitleElem.textContent = TEXT_API_KEYS;
}

/******************************************************************************/
/*!
    @brief  Loads the devices models of the specified device category.
    @param  deviceCategory      Device category
*/
/******************************************************************************/
function loadDeviceModels(deviceCategory) {
    deviceModelContainerElem.innerHTML = "";
    const models = DEVICE_CATEGORIES[deviceCategory].device_models;

    for (let model of models) {
        const tileElem = document.createElement("div");
        tileElem.id = "deviceTile" + model.model_id;
        tileElem.className = "tile";
        tileElem.style.margin = "10px";
        tileElem.style.backgroundColor = "var(--background2)";

        tileElem.onclick = () => loadDeviceAddModal(model.model_id);

        const gridElem = document.createElement("div");
        gridElem.style.gridColumn = "span 2";
        const titleElem = document.createTextNode(model.name);

        gridElem.appendChild(titleElem);
        tileElem.appendChild(gridElem);

        deviceModelContainerElem.appendChild(tileElem);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the unconfigured connected devices.
*/
/******************************************************************************/
function loadUnconfiguredDevices() {
    automaticDevicePairContainerElem.innerHTML = "";

    for (let device of unconfiguredDevices) {
        const tileElem = document.createElement("div");
        tileElem.id = "targetDeviceTile" + device.hostname;
        tileElem.className = "tile";
        tileElem.style.backgroundColor = "var(--background2)";

        tileElem.onclick = () => addUnconfiguredDevice(device.hostname);

        const row1Elem = document.createElement("div");
        row1Elem.style.gridColumn = "span 2";
        const titleElem = document.createTextNode(device.hostname);

        row1Elem.appendChild(titleElem);
        tileElem.appendChild(row1Elem);

        const row2Elem = document.createElement("div");
        const iconElem = document.createElement("i");
        iconElem.className = DEVICE_TYPE_ICONS[device.type];
        
        row2Elem.appendChild(iconElem);
        tileElem.appendChild(row2Elem);

        automaticDevicePairContainerElem.appendChild(tileElem);
    }
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
    @brief  Validates the specified update filename.
    @param  filename            Filename to validate
    @return bool                True if valid
*/
/******************************************************************************/
function validateUpdateFilename(filename) {
    /* Check version in filename */
    let version = getVersion(filename);
    let extension = getFileExtension(filename);
    
    if (!version.match(VERSION_RE)) {
        banners.show(TEXT_ERROR, TEXT_FIRMWARE_FILENAME_INVALID, MESSAGE_TYPE_ERROR);
        return false;
    }

    /* Check extension */
    if (extension != EXTENSION_BIN) {
        banners.show(TEXT_ERROR, TEXT_FIRMWARE_FILE_NOT_SUPPORTED, MESSAGE_TYPE_ERROR);
        return false;
    }

    return true;
}
//#endregion

//#region Others
/******************************************************************************/
/*!
    @brief  Shows the OTA package upload progress banner.
    @param  percentage          Progress percentage to show
    @param  progressElement     DOM element of the progress bar
*/
/******************************************************************************/
function showOtaFileUploadProgress(percentage, progressElement) {
    let totalPercentage = percentage / NUMBER_OF_OTA_FILES;
    let percentageFilesUploaded = numberOfOtaFilesUploaded / NUMBER_OF_OTA_FILES * 100;
    percentage = totalPercentage + percentageFilesUploaded;

    //showProgress(percentage, progressElement);
}

/******************************************************************************/
/*!
    @brief  Marks the master logs as read.
*/
/******************************************************************************/
async function markLogsRead() {
    const result = await httpPostRequestErrorBanner("/mark_logs_read");
    if (result.status_code != HTTP_CODE_OK) return;

    logs = [];
    logsToBeShown = 0;

    generateLogTable();
}
//#endregion
//#endregion
