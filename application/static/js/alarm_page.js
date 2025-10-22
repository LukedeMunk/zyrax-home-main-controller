/******************************************************************************/
/*
 * File:    alarm_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the control sensors page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const deactivationDeviceModalTitleElem = document.getElementById("deactivationDeviceModalTitle");

/* Fields */
const errorMessageDeactivationDeviceFieldElem = document.getElementById("errorMessageDeactivationDeviceField");

/* Buttons */
const manuallyAddDeviceBtnElem = document.getElementById("manuallyAddDeviceBtn");
const submitDeactivationDeviceBtnElem = document.getElementById("submitDeactivationDeviceBtn");

/* Icons */

/* Input elements */
const deactivationDeviceNameTxtElem = document.getElementById("deactivationDeviceNameTxt");
const deactivationDeviceIpTxtElem = document.getElementById("deactivationDeviceIpTxt");

/* Tables */
const triggerTableHeaderElem = document.getElementById("triggerTableHeader");
const triggerTableElem = document.getElementById("triggerTable");

/* Modals */
const deactivationDeviceModalElem = document.getElementById("deactivationDeviceModal");

/* Other */
const stateContainerElem = document.getElementById("stateContainer");
const deactivationDeviceContainerElem = document.getElementById("deactivationDeviceContainer");
const triggerDeviceContainerElem = document.getElementById("triggerDeviceContainer");

const deactivationDeviceIpContainerElem = document.getElementById("deactivationDeviceIpContainer");
const searchingDevicesContainerElem = document.getElementById("searchingDevicesContainer");
const networkDevicesContainerElem = document.getElementById("networkDevicesContainer");
//#endregion

//#region Constants
const TRIGGER_COLUMNS = [TEXT_SENSOR, TEXT_DATE, TEXT_TIME];
//#endregion

//#region Variables
let isFetchingStates = false;
let isFetchingNetworkDevices = false;
let networkDevices = [];
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadStates();
    loadDeactivationDeviceTiles();
    loadTriggerDeviceTiles();
    //generateTriggerTable();
    
    isFetchingStates = true;
    fetchStates();
});

//#region Deactivation device functionality
/******************************************************************************/
/*!
  @brief    Adds a new deactivation device to the back-end.
  @param    manually            If true, the device is added manually
*/
/******************************************************************************/
function addDeactivationDevice(manually=false) {
    if (!validateDeactivationDevice(-1, manually)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_deactivation_device", lastDeactivationDeviceData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        errorMessageDeactivationDeviceFieldElem.textContent = result.message;
        return;
    }

    lastDeactivationDeviceData.id = result.message.id;       
    alarm.deactivation_devices.push(lastDeactivationDeviceData);
    showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    loadDeactivationDeviceTiles();
    closeModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
  @brief    Updates the specified deactivation device.
  @param    id                  ID of the device
*/
/******************************************************************************/
function updateDeactivationDevice(id) {
    if (!validateDeactivationDevice(id)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/update_deactivation_device", lastDeactivationDeviceData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        errorMessageDeactivationDeviceFieldElem.textContent = result.message;
        return;
    }

    let index = getIndexFromId(alarm.deactivation_devices, id);
    alarm.deactivation_devices[index].name = lastDeactivationDeviceData.name
    alarm.deactivation_devices[index].ip_address = lastDeactivationDeviceData.ip_address;
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    loadDeactivationDeviceTiles();
    closeModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
  @brief    Confirmation before deleting the specified deactivation device.
  @param    id                      ID of the device
  @param    deactivationDeviceName  Name of the device
*/
/******************************************************************************/
function deleteDeactivationDeviceConfirm(id, deactivationDeviceName) {
    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteDeactivationDevice(" + id + ");"},
                    CANCEL_POPUP_BUTTON
                ];
    showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(deactivationDeviceName), buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Deletes the specified deactivation device.
  @param    id                  ID of the device
*/
/******************************************************************************/
function deleteDeactivationDevice(id) {
    closePopup();

    httpPostRequest("/delete_deactivation_device", {id: id});

    for (let i = 0; i < alarm.deactivation_devices.length; i++) {
        if (alarm.deactivation_devices[i].id == id) {
            alarm.deactivation_devices.splice(i, 1);
            break;
        }
    }

    loadDeactivationDeviceTiles();
    showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Validates the specified deactivation device.
  @param    id                  ID of the device
  @param    manually            If true, the device is added manually
*/
/******************************************************************************/
function validateDeactivationDevice(id=-1, manually=false) {
    /* Get user input */
    let name = deactivationDeviceNameTxtElem.value;
    let ipAddress = deactivationDeviceIpTxtElem.value;

    if (!manually) {
        ipAddress = undefined;
        for (let device of networkDevices) {
            if (document.getElementById("deactivationDeviceTile" + device.id).classList.contains("tile-selected")) {
                ipAddress = device.ip_address;
                break;
            }
        }
    }

    /* Reset error styling */
    errorMessageDeactivationDeviceFieldElem.style.display = "none";

    deactivationDeviceNameTxtElem.classList.remove("invalid-input");
    deactivationDeviceIpTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        deactivationDeviceNameTxtElem.classList.add("invalid-input");
        deactivationDeviceNameTxtElem.focus();
        errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate IP */
    if (!manually && ipAddress == undefined) {
        errorMessageDeactivationDeviceFieldElem.textContent = TEXT_PLEASE_SELECT_DEVICE;
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        return false;
    } else {
        if (ipAddress == "") {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_REQUIRED;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
        
        if (!ipAddress.match(IP_RE)) {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_INVALID_IP;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
    }

    for (let deactivationDevice of alarm.deactivation_devices) {
        if (deactivationDevice.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (deactivationDevice.name == name) {
            deactivationDeviceNameTxtElem.classList.add("invalid-input");
            deactivationDeviceNameTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }

        /* Check if IP is unique */
        if (deactivationDevice.ip_address == ipAddress) {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
    }

    lastDeactivationDeviceData = {
        id : id,
        name : name,
        ip_address : ipAddress
    }
    
    return true;
}
//#endregion

//#region Trigger device functionality
/******************************************************************************/
/*!
  @brief    Adds the selected trigger device to the alarm.
  @param    id              ID of the trigger device
*/
/******************************************************************************/
function addTriggerDevice(id) {
    httpPostRequest("/add_alarm_trigger_device", {id: id});
    
    alarm.trigger_device_ids.push(id);
    showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Deletes the selected trigger device from the alarm.
  @param    id              ID of the trigger device
*/
/******************************************************************************/
function deleteTriggerDevice(id) {
    httpPostRequest("/delete_alarm_trigger_device", {id: id});
    
    for (let i = 0; i < alarm.trigger_device_ids.length; i++) {
        if (alarm.trigger_device_ids[i] == id) {
            alarm.trigger_device_ids.splice(i, 1);
            break;
        }
    }
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}
//#endregion

//#region Generate alarm trigger table
/******************************************************************************/
/*!
  @brief    Generates the alarm trigger table.
*/
/******************************************************************************/
function generateTriggerTable() {
    triggerTableHeaderElem.innerHTML = "";
    triggerTableElem.innerHTML = "";

    generateTriggerTableHead();
    generateTriggerTableBody();
}

/******************************************************************************/
/*!
  @brief    Generates the alarm trigger table head.
*/
/******************************************************************************/
function generateTriggerTableHead() {
    let row;
    let th;
    let cellContent;

    /* Row 1 */
    let tHead = triggerTableHeaderElem.createTHead();
    row = tHead.insertRow();

    th = document.createElement("th");
    th.colSpan = TRIGGER_COLUMNS.length;                                        //Span over all columns

    /* Header title */
    cellContent = document.createTextNode(TEXT_TRIGGER_LOGS);
    th.appendChild(cellContent);
    row.appendChild(th);

    /* Row 2 */
    row = tHead.insertRow();
    row.style.backgroundColor = "var(--background5)";

    for (let column of TRIGGER_COLUMNS) {
        let th = document.createElement("th");
        let cellContent = document.createTextNode(column);
        
        th.style.width = "10%";

        if (column == TEXT_SENSOR) {
            th.style.width = "70%";
        }

        th.appendChild(cellContent);
        row.appendChild(th);
    }
}

/******************************************************************************/
/*!
  @brief    Generates the alarm trigger table body.
*/
/******************************************************************************/
function generateTriggerTableBody() {
    let row;
    let cell;
    let cellContent;
    let numRows = 0;
    
    for (let trigger of alarmTriggerTimes) {
        let device = devices[getIndexFromId(devices, trigger.trigger_device_id)];
        row = triggerTableElem.insertRow();

        /* Sensor */
        cell = row.insertCell();
        cell.style.width = "70%";
        cellContent = document.createTextNode(device.name);
        cell.appendChild(cellContent);

        /* Date */
        cell = row.insertCell();
        cell.style.width = "10%";
        cellContent = document.createTextNode(trigger.date);
        cell.appendChild(cellContent);

        /* Time */
        cell = row.insertCell();
        cell.style.width = "10%";
        cellContent = document.createTextNode(trigger.time);
        cell.appendChild(cellContent);
        numRows++;
    }

    /* If no trigger logs, alternative row */
    if (numRows == 0) {
        row = triggerTableElem.insertRow();

        cell = row.insertCell();
        cell.colSpan = TRIGGER_COLUMNS.length;                                      //Span over all columns
        cell.style.textAlign = "center";

        cellContent = document.createTextNode(TEXT_NO_TRIGGER_LOGS_FOUND);
        cell.appendChild(cellContent);
        row.appendChild(cell);
        return;
    }

}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
  @brief    Asynchronous interval function for fetching the states from the
            back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        var response = await fetch("get_sensors", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchStates);
        return;
    }

    let data = await response.json();
    devices = data;
    loadStates();
    generateTriggerTable();

    setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
  @brief    Pauses the back-end refreshes for the specified amount of time
  @param    seconds             Number of seconds to continue refreshes
*/
/******************************************************************************/
function pauseRefreshes(seconds=2) {
    isFetchingStates = false;
    setTimeout(function() {isFetchingStates = true}, seconds*1000);
}
//#endregion

//#region Utilities
//#region Load functionality
/******************************************************************************/
/*!
  @brief    Loads states to front-end.
*/
/******************************************************************************/
function loadStates() {
    stateContainerElem.innerHTML = "";

    let fieldset;
    let legend;
    let iconContainer;
    let icon;

    for (let device of devices) {
        /* Only trigger devices */
        if (!isAlarmTriggerDevice(device.id)) {
            continue;
        }

        fieldset = document.createElement("fieldset");
        fieldset.className = "flex";
        fieldset.style.marginTop = "0px";

        legend = document.createElement("legend");
        legend.textContent = device.name;

        iconContainer = document.createElement("div");
        iconContainer.style.margin = "auto";

        icon = document.createElement("i");
        if (device.state) {
            icon.className = device.icon + " fa-xl";
        } else {
            icon.className = device.icon_low_state + " fa-xl";
        }

        fieldset.append(legend);
        iconContainer.append(icon);
        fieldset.append(iconContainer);
        stateContainerElem.append(fieldset);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the deactivation device tiles.
*/
/******************************************************************************/
function loadDeactivationDeviceTiles() {
    let tile;
    let grid;
    let icon;

    deactivationDeviceContainerElem.innerHTML = "";

    for (let device of alarm.deactivation_devices) {
        tile = document.createElement("div");
        tile.className = "tile single";
        tile.setAttribute("onclick", "loadDeactivationDeviceModal(" + device.id + ");");
        tile.style.backgroundColor = "var(--background4)";

        grid = document.createElement("div");
        title = document.createTextNode(device.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = "fa-duotone fa-solid fa-mobile fa-xl";
        grid.appendChild(icon);
        tile.appendChild(grid);

        deactivationDeviceContainerElem.appendChild(tile);
    }

    
    tile = document.createElement("div");
    tile.className = "tile single";
    tile.setAttribute("onclick", "loadDeactivationDeviceModal();");

    grid = document.createElement("div");
    tile.appendChild(grid);

    grid = document.createElement("div");
    icon = document.createElement("i");
    icon.className = "fa-duotone fa-solid fa-plus fa-xl";
    grid.appendChild(icon);
    tile.appendChild(grid);

    deactivationDeviceContainerElem.appendChild(tile);
}

/******************************************************************************/
/*!
  @brief    Loads the deactivation device modal.
  @param    id              ID of the deactivation device
*/
/******************************************************************************/
function loadDeactivationDeviceModal(id=undefined) {
    /* Reset error styling */
    errorMessageDeactivationDeviceFieldElem.style.display = "none";

    deactivationDeviceNameTxtElem.classList.remove("invalid-input");
    deactivationDeviceIpTxtElem.classList.remove("invalid-input");
    
    deactivationDeviceIpContainerElem.style.display = "block";
    networkDevicesContainerElem.style.display = "none";
    searchingDevicesContainerElem.style.display = "none";
    manuallyAddDeviceBtnElem.style.display = "none";

    if (id == undefined) {
        deactivationDeviceModalTitleElem.textContent = TEXT_NEW_DEACTIVATION_DEVICE;
        deactivationDeviceNameTxtElem.value = "";
        deactivationDeviceIpTxtElem.value = "";
        submitDeactivationDeviceBtnElem.setAttribute("onclick", "addDeactivationDevice();");

        showModal(deactivationDeviceModalElem);
        fetchNetworkDevices();
        return;
    }

    let deactivationDevice = alarm.deactivation_devices[getIndexFromId(alarm.deactivation_devices, id)];

    deactivationDeviceModalTitleElem.textContent = TEXT_EDIT_DEACTIVATION_DEVICE;
    deactivationDeviceNameTxtElem.value = deactivationDevice.name;
    deactivationDeviceIpTxtElem.value = deactivationDevice.ip_address;
    submitDeactivationDeviceBtnElem.setAttribute("onclick", "updateDeactivationDevice(" + deactivationDevice.id + ");");

    showModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the trigger device tiles.
*/
/******************************************************************************/
function loadTriggerDeviceTiles() {
    let tile;
    let grid;
    let icon;

    triggerDeviceContainerElem.innerHTML = "";
    console.log(alarm)
    for (let device of devices) {
        if (device.type != DEVICE_TYPE_RF_DEVICE) {
            continue;
        }
        
        tile = document.createElement("div");
        tile.className = "tile single";
        tile.id = "triggerDeviceTile" + device.id;
        for (let triggerDevice of alarm.trigger_device_ids) {
            if (triggerDevice == device.id) {
                tile.className = "tile single tile-selected";
                break;
            }
        }
        tile.setAttribute("onclick", "toggleTriggerDeviceSelection(" + device.id + ");");

        grid = document.createElement("div");
        title = document.createTextNode(device.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = device.icon;
        grid.appendChild(icon);
        tile.appendChild(grid);

        triggerDeviceContainerElem.appendChild(tile);
    }
}

/******************************************************************************/
/*!
  @brief    Asynchronous function for fetching connected network devices from
            the back-end.
*/
/******************************************************************************/
async function fetchNetworkDevices() {
    deactivationDeviceIpContainerElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";
    searchingDevicesContainerElem.style.display = "flex";
    manuallyAddDeviceBtnElem.style.display = "none";

    try {
        var response = await fetch("get_network_devices");
    } catch {
        fetchTimeouts++;
        if (fetchTimeouts > FETCH_TIMEOUTS_BEFORE_RECONNECT) {
            showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
            setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchNetworkDevices);
        } else {
            setTimeout(fetchNetworkDevices, BACK_END_UPDATE_INTERVAL_1S);
        }
        return;
    }

    fetchTimeouts = 0;
    networkDevices = await response.json();

    let id = 0;
    for (let device of networkDevices) {
        device.id = id;
        id++;
    }

    loadNetworkDevices();
}

/******************************************************************************/
/*!
  @brief    Loads the network devices.
*/
/******************************************************************************/
function loadNetworkDevices() {
    networkDevicesContainerElem.innerHTML = "";
    networkDevicesContainerElem.style.display = "grid";
    searchingDevicesContainerElem.style.display = "none";
    manuallyAddDeviceBtnElem.style.display = "block";

    let tile;
    let grid;
    let icon;

    for (let device of networkDevices) {
        tile = document.createElement("div");
        tile.id = "deactivationDeviceTile" + device.id;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";

        tile.setAttribute("onclick", "toggleDeactivationDeviceSelection('" + device.id + "');");

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

        networkDevicesContainerElem.appendChild(tile);
    }
}
//#endregion

/******************************************************************************/
/*!
  @brief    Selects or deselects the specified trigger device.
  @param    id              ID of the trigger device
*/
/******************************************************************************/
function toggleTriggerDeviceSelection(id) {
    const tileElem = document.getElementById("triggerDeviceTile" + id);
    if (tileElem.classList.contains("tile-selected")) {
        tileElem.classList.remove("tile-selected");
        deleteTriggerDevice(id);
    } else {
        tileElem.classList.add("tile-selected");
        addTriggerDevice(id);
    }
    
    loadStates();
}

/******************************************************************************/
/*!
  @brief    Selects or deselects the specified deactivation device.
  @param    id              ID of the deactivation device
*/
/******************************************************************************/
function toggleDeactivationDeviceSelection(id) {
    for (let device of networkDevices) {
        document.getElementById("deactivationDeviceTile" + device.id).classList.remove("tile-selected");
    }

    const tileElem = document.getElementById("deactivationDeviceTile" + id);
    tileElem.classList.add("tile-selected");
}

/******************************************************************************/
/*!
  @brief    Loads the DOM elements for manually adding a deactivation device.
*/
/******************************************************************************/
function manuallyAddDeactivationDevice() {
    deactivationDeviceIpContainerElem.style.display = "block";
    manuallyAddDeviceBtnElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";
    submitDeactivationDeviceBtnElem.setAttribute("onclick", "addDeactivationDevice(true);");
}

/******************************************************************************/
/*!
  @brief    Checks whether the specified device is an alarm trigger device.
  @param    id              ID of the trigger device
  @returns  bool            True if is a trigger device
*/
/******************************************************************************/
function isAlarmTriggerDevice(deviceId) {
    for (let id of alarm.trigger_device_ids) {
        if (id == deviceId) {
            return true
        }
    }

    return false;
}
//#endregion