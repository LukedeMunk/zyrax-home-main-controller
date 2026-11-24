/****************************************************************************/
/*
 * File:    alarm_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for alarm.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_ADD_ALARM_TRIGGER_DEVICE, API_URL_ADD_DEACTIVATION_DEVICE,
    API_URL_DELETE_ALARM_TRIGGER_DEVICE, API_URL_UPDATE_DEACTIVATION_DEVICE
} from "../domain/endpoints.js";
import {
    TEXT_ALARM_NOT_TRIGGERED_YET, TEXT_BACK_ONLINE, TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_DATE,
    TEXT_DISCONNECTED_CONNECTING, TEXT_EDIT_DEACTIVATION_DEVICE, TEXT_ERROR, TEXT_FIELD_INVALID_IP,
    TEXT_FIELD_REQUIRED, TEXT_FIELD_UNIQUE, TEXT_ITEM_ADDED_SUCCESSFULLY,
    TEXT_NEW_DEACTIVATION_DEVICE, TEXT_PLEASE_SELECT_DEVICE, TEXT_SENSOR, TEXT_SUCCESS, TEXT_TIME,
    TEXT_TRIGGER_LOGS
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { submitForm } from "../services/forms.js";
import { listSensors, listNetworkDevices } from "../services/sensors.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import {
    StandardTable, LoadingBannerManager
} from "../../vendor/templates/js/ui_components/index.js";

const { http, banners, signal, delay, components } = mountPage("dashboard");
let { alarm, devices, alarmTriggerTimes } = readPageData();
const DEVICE_TYPE_RF_DEVICE = 1;
const IP_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

//#region Elements
const deactivationDeviceModalTitleElem = document.getElementById("deactivationDeviceModalTitle");
const errorMessageDeactivationDeviceFieldElem = document.getElementById("errorMessageDeactivationDeviceField");
const manuallyAddDeviceBtnElem = document.getElementById("manuallyAddDeviceBtn");
const submitDeactivationDeviceBtnElem = document.getElementById("submitDeactivationDeviceBtn");
const deactivationDeviceNameTxtElem = document.getElementById("deactivationDeviceNameTxt");
const deactivationDeviceIpTxtElem = document.getElementById("deactivationDeviceIpTxt");
const deactivationDeviceModalElem = document.getElementById("deactivationDeviceModal");
const stateContainerElem = document.getElementById("stateContainer");
const deactivationDeviceContainerElem = document.getElementById("deactivationDeviceContainer");
const triggerDeviceContainerElem = document.getElementById("triggerDeviceContainer");

const deactivationDeviceIpContainerElem = document.getElementById("deactivationDeviceIpContainer");
const searchingDevicesContainerElem = document.getElementById("searchingDevicesContainer");
const networkDevicesContainerElem = document.getElementById("networkDevicesContainer");

const alarmTriggerTableContainerElem = document.getElementById("alarmTriggerTableContainer");
//#endregion

//#region Constants
//#endregion

//#region Variables
let isFetchingStates = false;

let networkDevices = [];
//#endregion

const table = new StandardTable(alarmTriggerTableContainerElem, {
    title: TEXT_TRIGGER_LOGS + " (" + alarmTriggerTimes.length + ")",
    columns: [{ key: "sensor", title: TEXT_SENSOR }, {
        key: "date",
        title: TEXT_DATE
    }, { key: "time", title: TEXT_TIME }],
    rows: alarmTriggerTimes,
    emptyMessage: TEXT_ALARM_NOT_TRIGGERED_YET
}).mount();

const loading = new LoadingBannerManager(document.querySelector('[data-ref="loading"]')).mount();
const stack = new ModalStack();

components.push(table, loading, stack);

let connectionTask = null;
let lastDeactivationDeviceData;

/****************************************************************************/
/*!
 * @brief   Opens the deactivation device editor through its modal stack.
 */
/****************************************************************************/
function openDeviceDialog() {
    stack.open(deactivationDeviceModalElem, {
        onRequestClose: () => stack.close(deactivationDeviceModalElem)
    });
}

deactivationDeviceModalElem.querySelector(".close-modal-button").addEventListener("click", () =>
    stack.close(deactivationDeviceModalElem), { signal });

/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
manuallyAddDeviceBtnElem.addEventListener("click", manuallyAddDeactivationDevice, { signal });
initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    loadStates();
    loadDeactivationDeviceTiles();
    loadTriggerDeviceTiles();
    //generateTriggerTable();
    isFetchingStates = true;
    fetchStates();
}

//#region Generate alarm trigger table
/****************************************************************************/
/*!
 * @brief   Generates the alarm trigger table.
 */
/****************************************************************************/
//#endregion
//#region Interval update requests
/****************************************************************************/
/*!
 * @brief   Asynchronous interval function for fetching the states from the
 * back-end for real-time monitoring.
 */
/****************************************************************************/
async function fetchStates() {
    try {
        devices = await listSensors(http, signal);
        loadStates();
        if (connectionTask !== null) {
            loading.close(connectionTask);
            connectionTask = null;
            banners.show({ title: TEXT_BACK_ONLINE, message: TEXT_BACK_ONLINE, type: "success" });
        }
    } catch (error) {
        if (signal.aborted) return;

        if (connectionTask === null) connectionTask =
            loading.show({ message: TEXT_DISCONNECTED_CONNECTING });
    }

    if (!signal.aborted) delay(fetchStates, 1000);
}

/****************************************************************************/
/*!
 * @brief   Pauses the back-end refreshes for the specified amount of time
 * @param   seconds                 Number of seconds to continue refreshes
 */
/****************************************************************************/
//#endregion
//#region Utilities
//#region Load functionality
/****************************************************************************/
/*!
 * @brief   Loads states to front-end.
 */
/****************************************************************************/
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
            icon.className = device.icon; // + " fa-xl";
        } else {
            icon.className = device.icon_low_state; // + " fa-xl";
        }

        fieldset.append(legend);
        iconContainer.append(icon);
        fieldset.append(iconContainer);
        stateContainerElem.append(fieldset);
    }
}

/****************************************************************************/
/*!
 * @brief   Loads the deactivation device tiles.
 */
/****************************************************************************/
function loadDeactivationDeviceTiles() {
    let tile;
    let grid;
    let icon;

    deactivationDeviceContainerElem.innerHTML = "";

    for (let device of alarm.deactivation_devices) {
        tile = document.createElement("div");
        tile.className = "tile";

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        tile.onclick = () => loadDeactivationDeviceModal(device.id);
        tile.style.backgroundColor = "var(--background4)";

        grid = document.createElement("div");

        const title = document.createTextNode(device.name);

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

    /****************************************************************************/
    /*!
     * @brief   Runs the action bound to the selected control.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
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

/****************************************************************************/
/*!
 * @brief   Loads the deactivation device modal.
 * @param   id                      ID of the deactivation device
 */
/****************************************************************************/
function loadDeactivationDeviceModal(id = undefined) {
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

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        submitDeactivationDeviceBtnElem.onclick = () => saveDeactivationDevice(-1, false);

        openDeviceDialog();
        fetchNetworkDevices();

        return;
    }

    let deactivationDevice = alarm.deactivation_devices.find(device => device.id === id);

    deactivationDeviceModalTitleElem.textContent = TEXT_EDIT_DEACTIVATION_DEVICE;
    deactivationDeviceNameTxtElem.value = deactivationDevice.name;
    deactivationDeviceIpTxtElem.value = deactivationDevice.ip_address;

    /****************************************************************************/
    /*!
     * @brief   Runs the action bound to the selected control.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    submitDeactivationDeviceBtnElem.onclick = () =>
        saveDeactivationDevice(deactivationDevice.id, true);

    openDeviceDialog();
}

/****************************************************************************/
/*!
 * @brief   Loads the trigger device tiles.
 */
/****************************************************************************/
function loadTriggerDeviceTiles() {
    let tile;
    let grid;
    let icon;

    triggerDeviceContainerElem.innerHTML = "";

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

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        tile.onclick = () => toggleTriggerDeviceSelection(device.id);

        grid = document.createElement("div");

        const title = document.createTextNode(device.name);

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

/****************************************************************************/
/*!
 * @brief   Asynchronous function for fetching connected network devices from
 * the back-end.
 */
/****************************************************************************/
async function fetchNetworkDevices() {
    deactivationDeviceIpContainerElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";
    searchingDevicesContainerElem.style.display = "flex";
    manuallyAddDeviceBtnElem.style.display = "none";

    try {
        networkDevices = await listNetworkDevices(http, signal);
    } catch (error) {
        if (!signal.aborted && deactivationDeviceModalElem.open) delay(fetchNetworkDevices, 1000);

        return;
    }

    let id = 0;
    for (let device of networkDevices) {
        device.id = id;
        id++;
    }

    loadNetworkDevices();
}

/****************************************************************************/
/*!
 * @brief   Loads the network devices.
 */
/****************************************************************************/
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

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        tile.onclick = () => toggleDeactivationDeviceSelection(device.id);

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";

        const title = document.createTextNode(device.hostname);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = [
            "fa-solid fa-lightbulb", "fa-solid fa-door-open", "fa-solid fa-camera-cctv"
        ][device.type]
            ?? "";

        grid.appendChild(icon);
        tile.appendChild(grid);

        networkDevicesContainerElem.appendChild(tile);
    }
}

//#endregion
/****************************************************************************/
/*!
 * @brief   Selects or deselects the specified trigger device.
 * @param   id                      ID of the trigger device
 */
/****************************************************************************/
async function toggleTriggerDeviceSelection(id) {
    const tile = document.getElementById("triggerDeviceTile" + id);
    if (tile.getAttribute("aria-busy") === "true") return;

    const selected = isAlarmTriggerDevice(id);
    tile.setAttribute("aria-busy", "true");

    try {
        await submitForm(http, selected
            ? API_URL_DELETE_ALARM_TRIGGER_DEVICE
            : API_URL_ADD_ALARM_TRIGGER_DEVICE, { id }, signal);
        alarm.trigger_device_ids = selected
            ? alarm.trigger_device_ids.filter(key => key != id)
            : [...alarm.trigger_device_ids, id];
        tile.classList.toggle("tile-selected", !selected);
        loadStates();
        banners.show({
            title: TEXT_SUCCESS,
            message: selected ? TEXT_CHANGES_SAVED_SUCCESSFULLY : TEXT_ITEM_ADDED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });
    } finally {
        tile.removeAttribute("aria-busy");
    }
}

/****************************************************************************/
/*!
 * @brief   Selects or deselects the specified deactivation device.
 * @param   id                      ID of the deactivation device
 */
/****************************************************************************/
function toggleDeactivationDeviceSelection(id) {
    for (let device of networkDevices) {
        document.getElementById("deactivationDeviceTile" + device.id)
            .classList.remove("tile-selected");
    }

    const tileElem = document.getElementById("deactivationDeviceTile" + id);
    tileElem.classList.add("tile-selected");
}

/****************************************************************************/
/*!
 * @brief   Loads the DOM elements for manually adding a deactivation device.
 */
/****************************************************************************/
function manuallyAddDeactivationDevice() {
    deactivationDeviceIpContainerElem.style.display = "block";
    manuallyAddDeviceBtnElem.style.display = "none";
    networkDevicesContainerElem.style.display = "none";

    /****************************************************************************/
    /*!
     * @brief   Runs the action bound to the selected control.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    submitDeactivationDeviceBtnElem.onclick = () => saveDeactivationDevice(-1, true);
}

/****************************************************************************/
/*!
 * @brief   Checks whether the specified device is an alarm trigger device.
 * @param   id                      ID of the trigger device
 * @returns bool True if is a trigger device
 */
/****************************************************************************/
function isAlarmTriggerDevice(deviceId) {
    for (let id of alarm.trigger_device_ids) {
        if (id == deviceId) {
            return true;
        }
    }

    return false;
}

//#endregion
/****************************************************************************/
/*!
 * @brief   Validates deactivation device fields before saving them.
 * @param   id                      Identifier of the affected item.
 * @param   manually                Whether to validate a manually entered device.
 * @returns Whether the operation or validation condition succeeds.
 */
/****************************************************************************/
function validateDeactivationDevice(id = -1, manually = false) {
    /* Get user input */
    let name = deactivationDeviceNameTxtElem.value;
    let ipAddress = deactivationDeviceIpTxtElem.value;

    if (!manually) {
        ipAddress = undefined;

        for (let device of networkDevices) {
            if (document.getElementById("deactivationDeviceTile" + device.id)
                .classList.contains("tile-selected")) {
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

    lastDeactivationDeviceData = { id: id, name: name, ip_address: ipAddress };

    return true;
}

/****************************************************************************/
/*!
 * @brief   Saves a deactivation device and refreshes the alarm controls.
 * @param   id                      Identifier of the affected item.
 * @param   manual                  Whether the deactivation device was entered manually.
 */
/****************************************************************************/
async function saveDeactivationDevice(id, manual) {
    if (!validateDeactivationDevice(id, manual)) return;

    try {
        const adding = id === -1;
        const result = await submitForm(http, adding
            ? API_URL_ADD_DEACTIVATION_DEVICE
            : API_URL_UPDATE_DEACTIVATION_DEVICE, lastDeactivationDeviceData, signal);
        if (adding) alarm.deactivation_devices.push({
            ...lastDeactivationDeviceData,
            id: result.id
        });
        else Object.assign(alarm.deactivation_devices.find(device =>
            device.id === id), lastDeactivationDeviceData);
        loadDeactivationDeviceTiles();
        stack.close(deactivationDeviceModalElem);
        banners.show({
            title: TEXT_SUCCESS,
            message: adding ? TEXT_ITEM_ADDED_SUCCESSFULLY : TEXT_CHANGES_SAVED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        errorMessageDeactivationDeviceFieldElem.textContent = error.message;
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
    }
}
