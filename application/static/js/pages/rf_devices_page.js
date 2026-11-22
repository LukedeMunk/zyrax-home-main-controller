/****************************************************************************/
/*
 * File:    rf_devices_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for RF devices.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_BACK_ONLINE, TEXT_DATE, TEXT_DISCONNECTED_CONNECTING, TEXT_SENSOR, TEXT_TIME,
    TEXT_TRIGGER_LOGS
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { listSensors } from "../services/sensors.js";
import { LoadingBannerManager } from "../../vendor/templates/js/ui_components/index.js";

const { http, signal, delay, components, banners } = mountPage("dashboard");
let { devices, sensorTriggerTimes } = readPageData();
const loading = new LoadingBannerManager(document.querySelector('[data-ref="loading"]')).mount();

components.push(loading);

let task = null;

//#region Elements
const triggerTableHeaderElem = document.getElementById("triggerTableHeader");
const triggerTableElem = document.getElementById("triggerTable");
const stateContainerElem = document.getElementById("stateContainer");
//#endregion

//#region Constants
const TRIGGER_COLUMNS = [TEXT_SENSOR, TEXT_DATE, TEXT_TIME];
//#endregion

//#region Variables
const DEVICE_TYPE_RF_DEVICE = 1;

//#endregion
/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    loadStates();
    generateTriggerTable();
    fetchStates();
}

//#region Generate trigger table
/****************************************************************************/
/*!
 * @brief   Generates the trigger table.
 */
/****************************************************************************/
function generateTriggerTable() {
    triggerTableHeaderElem.innerHTML = "";
    triggerTableElem.innerHTML = "";

    generateTriggerTableHead();
    generateTriggerTableBody();
}

/****************************************************************************/
/*!
 * @brief   Generates the trigger table head.
 */
/****************************************************************************/
function generateTriggerTableHead() {
    let row;
    let th;
    let cellContent;

    /* Row 1 */
    let tHead = triggerTableHeaderElem.createTHead();

    row = tHead.insertRow();

    th = document.createElement("th");
    th.colSpan = TRIGGER_COLUMNS.length; //Span over all columns
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

/****************************************************************************/
/*!
 * @brief   Generates the trigger table body.
 */
/****************************************************************************/
function generateTriggerTableBody() {
    let row;
    let cell;
    let cellContent;
    let numRows = 0;

    for (let trigger of sensorTriggerTimes) {
        let device = devices.find(item => String(item.id) === String(trigger.device_id));

        row = triggerTableElem.insertRow();

        /* Sensor */
        cell = row.insertCell();
        cell.style.width = "70%";
        cellContent = document.createTextNode(device?.name ?? "");
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
        cell.colSpan = TRIGGER_COLUMNS.length; //Span over all columns
        cell.style.textAlign = "center";

        cellContent = document.createTextNode("");
        cell.appendChild(cellContent);
        row.appendChild(cell);

        return;
    }
}
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
        fieldset = document.createElement("fieldset");
        fieldset.className = "flex";
        fieldset.style.marginTop = "0px";

        legend = document.createElement("legend");
        legend.textContent = device.name;

        iconContainer = document.createElement("div");
        iconContainer.style.margin = "auto";

        icon = document.createElement("i");
        if (device.type == DEVICE_TYPE_RF_DEVICE) {
            if (device.state) {
                icon.className = device.icon + " fa-2x";
            } else {
                icon.className = device.icon_low_state + " fa-2x";
            }
        }

        fieldset.append(legend);
        iconContainer.append(icon);
        fieldset.append(iconContainer);
        stateContainerElem.append(fieldset);
    }
}
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
        generateTriggerTable();
        if (task !== null) {
            loading.close(task);
            task = null;
            banners.show({ title: TEXT_BACK_ONLINE, message: TEXT_BACK_ONLINE, type: "success" });
        }
    } catch (error) {
        if (signal.aborted) return;

        if (task === null) task = loading.show({ message: TEXT_DISCONNECTED_CONNECTING });
    }

    if (!signal.aborted) delay(fetchStates, 1000);
}
