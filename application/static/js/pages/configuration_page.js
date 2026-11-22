/****************************************************************************/
/*
 * File:    configuration_page.js
 * Author:  Luke de Munk
 * Version: 0.100.0
 *
 * Brief:   Page controller for configuration.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_API_KEYS, TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY, TEXT_CANCEL, TEXT_CONTINUE,
    TEXT_DATE, TEXT_DELETE, TEXT_ERROR, TEXT_FATAL_ERROR, TEXT_FILES_INVALID,
    TEXT_FIRMWARE_FILENAME_INVALID, TEXT_FIRMWARE_FILE_NOT_SUPPORTED, TEXT_LOGS_FROM_MASTER,
    TEXT_MARK_LOGS_READ, TEXT_MESSAGE, TEXT_NOTE, TEXT_NO_FILE_SELECTED, TEXT_NO_LOGS_FOUND,
    TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_APPLICATION_CONFIGURATION,
    TEXT_Q_VERSION_OBSOLETE_UPLOAD_WARNING, TEXT_SUCCESS, TEXT_SYSTEM_UPDATING, TEXT_TIME,
    TEXT_TYPE, TEXT_UPDATE_SUCCESSFULL, TEXT_UPLOADING_OTA_FILES, TEXT_UPLOAD_SUCCESSFULL,
    TEXT_WARNING, TEXT_WELCOME, TEXT_WELCOME_TO_THE_CONFIGURATION_PAGE
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { submitForm } from "../services/forms.js";
import { uploadOtaFile } from "../services/firmware.js";
import { mountModuleSettings } from "../ui_components/module_settings.js";
import { LoadingBannerManager, Overlay } from "../../vendor/templates/js/ui_components/index.js";

const { http, banners, popup, components, signal } = mountPage("configuration");
const settings = readPageData();
let { logs } = settings;
const version = document.getElementById("shellData").dataset.version;
const logTableHeaderElem = document.getElementById("logTableHeader");
const logTableElem = document.getElementById("logTable");
const otaPackageFileUploadElem = document.getElementById("otaPackageFileUpload");
const LOG_COLUMNS = [TEXT_TYPE, TEXT_MESSAGE, TEXT_DATE, TEXT_TIME];
const NOTE = 0;
const WARNING = 1;
const ERROR = 2;
const FATAL_ERROR = 3;

const progress = new LoadingBannerManager(document.querySelector('[data-ref="firmware-progress"]')).mount();
const overlay = new Overlay(document.querySelector('[data-ref="firmware-overlay"]'), {
    fullPage: true
}).mount();

components.push(progress, overlay);
document.getElementById("currentLedstripFirmwareVersionField").textContent = version;
document.getElementById("modulesTitle").textContent = TEXT_API_KEYS;
mountModuleSettings(document, { http, signal, banners }, settings);

for (const [field, next] of [
    ["weatherApiKeyTxt", "telegramBotTokenTxt"], ["telegramBotTokenTxt", null]
]) {
    /****************************************************************************/
    /*!
     * @brief   Commits a field and advances focus when Enter is pressed.
     * @param   event                   Event reported by the bound control.
     */
    /****************************************************************************/
    document.getElementById(field).addEventListener("keydown", event => {
        if (event.code === "Enter") {
            if (next) document.getElementById(next).focus();
            document.getElementById(field).dispatchEvent(new Event("change"));
        }
    }, { signal });
}

document.getElementById("resetToFactoryConfigurationBtn")
    .addEventListener("click", resetSettings, { signal });
otaPackageFileUploadElem.addEventListener("change", uploadFirmware, { signal });
generateLogTable();
if (new URLSearchParams(location.search).has("show_welcome_message")) {
    banners.show({
        title: TEXT_WELCOME,
        message: TEXT_WELCOME_TO_THE_CONFIGURATION_PAGE,
        type: "info"
    });
}

/****************************************************************************/
/*!
 * @brief   Confirms and resets the controller application configuration.
 */
/****************************************************************************/
async function resetSettings() {
    if (!(await popup.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: TEXT_Q_DELETE_APPLICATION_CONFIGURATION,
        type: "warning",
        confirmLabel: TEXT_DELETE,
        cancelLabel: TEXT_CANCEL
    }))) return;

    try {
        await submitForm(http, "/reset_configuration", {}, signal);
        document.getElementById("weatherApiKeyTxt").value = "";
        document.getElementById("telegramBotTokenTxt").value = "";
        banners.show({
            title: TEXT_SUCCESS,
            message: TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        reportError(error);
    }
}

/****************************************************************************/
/*!
 * @brief   Marks controller logs as read and updates the displayed table.
 */
/****************************************************************************/
async function markLogsRead() {
    try {
        await submitForm(http, "/mark_logs_read", {}, signal);
        logs = [];
        generateLogTable();
    } catch (error) {
        reportError(error);
    }
}

/****************************************************************************/
/*!
 * @brief   Displays a controller error unless the page has been disposed.
 * @param   error                   Failure to display.
 */
/****************************************************************************/
function reportError(error) {
    if (!signal.aborted) banners.show({ title: TEXT_ERROR, message: error.message, type: "error" });
}

/****************************************************************************/
/*!
 * @brief   Validates a firmware file and tracks the upload and installation.
 */
/****************************************************************************/
async function uploadFirmware() {
    const files = Array.from(otaPackageFileUploadElem.files);
    otaPackageFileUploadElem.value = "";
    if (files.length !== 1) {
        banners.show({
            title: TEXT_WARNING,
            message: files.length ? TEXT_FILES_INVALID : TEXT_NO_FILE_SELECTED,
            type: "warning"
        });

        return;
    }

    const file = files[0];
    const match = /^v(\d+)_(\d+)_(\d+)\.bin$/.exec(file.name);
    if (!match) {
        banners.show({
            title: TEXT_ERROR,
            message: file.name.endsWith(".bin")
                ? TEXT_FIRMWARE_FILENAME_INVALID
                : TEXT_FIRMWARE_FILE_NOT_SUPPORTED,
            type: "error"
        });

        return;
    }

    const current = version.replace(/^v/, "").split(/[._]/).map(Number);
    const difference =
        match.slice(1).map((part, i) => Number(part) - current[i]).find(value => value !== 0);
    if (difference < 0 && !(await popup.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: TEXT_Q_VERSION_OBSOLETE_UPLOAD_WARNING,
        confirmLabel: TEXT_CONTINUE,
        cancelLabel: TEXT_CANCEL,
        type: "warning"
    }))) return;

    const task = progress.show({ message: TEXT_UPLOADING_OTA_FILES, progress: 0 });
    otaPackageFileUploadElem.disabled = true;
    overlay.show();

    try {
        await uploadOtaFile(file, signal, value => progress.updateTask(task, { progress: value }));
        banners.show({ title: TEXT_SUCCESS, message: TEXT_UPLOAD_SUCCESSFULL, type: "success" });
        progress.close(task);
        await progress.poll("/get_ledstrip_ota_progress", {
            message: TEXT_SYSTEM_UPDATING,
            progress: state => state.progress,
            isFinished: state => Number(state.progress) >= 100
        }).promise;
        if (!signal.aborted) banners.show({
            title: TEXT_SUCCESS,
            message: TEXT_UPDATE_SUCCESSFULL,
            type: "success"
        });
    } catch (error) {
        reportError(error);
    } finally {
        if (!signal.aborted) {
            progress.close(task);
            overlay.hide();
            otaPackageFileUploadElem.disabled = false;
        }
    }
}

/****************************************************************************/
/*!
 * @brief   Builds the log table header and its current rows.
 */
/****************************************************************************/
function generateLogTable() {
    logTableHeaderElem.innerHTML = "";
    logTableElem.innerHTML = "";

    generateLogTableHead();
    generateLogTableBody();
}

/****************************************************************************/
/*!
 * @brief   Builds the log table column headings and sorting controls.
 */
/****************************************************************************/
function generateLogTableHead() {
    let row;
    let th;
    let cellContent;
    let icon;

    /* Row 1 */
    let tHead = logTableHeaderElem.createTHead();

    row = tHead.insertRow();

    th = document.createElement("th");
    th.colSpan = LOG_COLUMNS.length - 1;

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

    /****************************************************************************/
    /*!
     * @brief   Runs the action bound to the selected control.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
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

/****************************************************************************/
/*!
 * @brief   Renders the controller logs in the selected sort order.
 */
/****************************************************************************/
function generateLogTableBody() {
    let row;
    let cell;
    let cellContent;

    /* If no logs, alternative row */
    if (logs.length == 0) {
        row = logTableElem.insertRow();

        cell = row.insertCell();
        cell.colSpan = LOG_COLUMNS.length; //Span over all columns
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

        /* Give every type another color based on priority */
        if (log.type == NOTE) {
            typeString = TEXT_NOTE;
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

        for (const part of String(log.log).split(/(\[[^\]]*\])/)) {
            if (part.startsWith("[") && part.endsWith("]")) {
                const bold = document.createElement("b");
                bold.textContent = part.slice(1, -1);
                cell.append(bold);
            } else cell.append(document.createTextNode(part));
        }

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
