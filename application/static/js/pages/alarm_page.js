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

const alarmTriggerTableContainerElem = document.getElementById("alarmTriggerTableContainer");
//#endregion

//#region Constants
const TRIGGER_COLUMNS = [TEXT_SENSOR, TEXT_DATE, TEXT_TIME];
//#endregion

//#region Variables
let isFetchingStates = false;
let isFetchingNetworkDevices = false;
let networkDevices = [];
//#endregion


const alarmTriggerTableObject = new StandardTable(alarmTriggerTableContainerElem, ALARM_TRIGGER_TABLE_CONFIGURATION);

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
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

//#region Generate alarm trigger table
/******************************************************************************/
/*!
    @brief  Generates the alarm trigger table.
*/
/******************************************************************************/
function generateTriggerTable() {
    alarmTriggerTableObject.reset();
    alarmTriggerTableObject.setTitle(TEXT_TRIGGER_LOGS + " (" + alarmTriggerTimes.length + ")");

    /* Fill rows */
    for (let triggerRow of alarmTriggerTimes) {
        let row = {
            data: [{
                type: CELL_TYPE_TEXT,
                value: triggerRow.sensor
            },
            {
                type: CELL_TYPE_TEXT,
                value: triggerRow.date
            },
            {
                type: CELL_TYPE_TEXT,
                value: triggerRow.time
            }]
        }
        alarmTriggerTableObject.appendRow(row);
    }

    /* If no rows, generate alternative text */
    if (alarmTriggerTimes.length == 0) {
        alarmTriggerTableObject.appendEmptyTableRow();
    }
    
    alarmTriggerTableObject.restoreScrollPosition();
}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
    @brief  Asynchronous interval function for fetching the states from the
            back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        let response = await fetch("get_sensors", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
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
    @brief  Pauses the back-end refreshes for the specified amount of time
    @param  seconds             Number of seconds to continue refreshes
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
    @brief  Loads states to front-end.
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
            icon.className = device.icon;// + " fa-xl";
        } else {
            icon.className = device.icon_low_state;// + " fa-xl";
        }

        fieldset.append(legend);
        iconContainer.append(icon);
        fieldset.append(iconContainer);
        stateContainerElem.append(fieldset);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the deactivation device tiles.
*/
/******************************************************************************/
function loadDeactivationDeviceTiles() {
    let tile;
    let grid;
    let icon;

    deactivationDeviceContainerElem.innerHTML = "";

    for (let device of alarm.deactivation_devices) {
        tile = document.createElement("div");
        tile.className = "tile";
        tile.onclick = () => loadDeactivationDeviceModal(device.id);
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
    tile.className = "tile";
    tile.onclick = () => loadDeactivationDeviceModal();

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
    @brief  Loads the deactivation device modal.
    @param  id              ID of the deactivation device
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
        submitDeactivationDeviceBtnElem.onclick = () => addDeactivationDevice();

        showModal(deactivationDeviceModalElem);
        fetchNetworkDevices();
        return;
    }

    let deactivationDevice = alarm.deactivation_devices[getIndexFromId(alarm.deactivation_devices, id)];

    deactivationDeviceModalTitleElem.textContent = TEXT_EDIT_DEACTIVATION_DEVICE;
    deactivationDeviceNameTxtElem.value = deactivationDevice.name;
    deactivationDeviceIpTxtElem.value = deactivationDevice.ip_address;
    submitDeactivationDeviceBtnElem.onclick = () => updateDeactivationDevice(deactivationDevice.id);

    showModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
    @brief  Loads the trigger device tiles.
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
        tile.className = "tile";
        tile.id = "triggerDeviceTile" + device.id;
        for (let triggerDevice of alarm.trigger_device_ids) {
            if (triggerDevice == device.id) {
                tile.className = "tile tile-selected";
                break;
            }
        }
        tile.onclick = () => toggleTriggerDeviceSelection(device.id);

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
    @brief  Asynchronous function for fetching connected network devices from
            the back-end.
*/
/******************************************************************************/
async function fetchNetworkDevices() {
    deactivationDeviceIpContainerElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";
    searchingDevicesContainerElem.style.display = "flex";
    manuallyAddDeviceBtnElem.style.display = "none";

    try {
        let response = await fetch("get_network_devices");
    } catch {
        fetchTimeouts++;
        if (fetchTimeouts > FETCH_TIMEOUTS_BEFORE_RECONNECT) {
            loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
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
    @brief  Loads the network devices.
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
        tile.className = "tile";
        tile.style.backgroundColor = "var(--background2)";
        tile.onclick = () => toggleDeactivationDeviceSelection(device.id);

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
    @brief  Selects or deselects the specified trigger device.
    @param  id              ID of the trigger device
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
    @brief  Selects or deselects the specified deactivation device.
    @param  id              ID of the deactivation device
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
    @brief  Loads the DOM elements for manually adding a deactivation device.
*/
/******************************************************************************/
function manuallyAddDeactivationDevice() {
    deactivationDeviceIpContainerElem.style.display = "block";
    manuallyAddDeviceBtnElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";
    submitDeactivationDeviceBtnElem.onclick = () => addDeactivationDevice(true);
}

/******************************************************************************/
/*!
    @brief  Checks whether the specified device is an alarm trigger device.
    @param  id              ID of the trigger device
    @return bool            True if is a trigger device
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