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
    API_URL_GET_OTA_PROGRESS, API_URL_MARK_LOGS_READ, API_URL_RESET_CONFIGURATION
} from "../domain/endpoints.js";
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
import { LoadingBannerManager, Overlay, StandardTable } from "../../vendor/templates/js/ui_components/index.js";

const { http, banners, popup, components, signal } = mountPage("configuration");
const settings = readPageData();
const { logs } = settings;
const version = document.getElementById("shellData").dataset.version;
const markLogsBtnElem = document.getElementById("markLogsBtn");
const otaPackageFileUploadElem = document.getElementById("otaPackageFileUpload");
const logTypes = [TEXT_NOTE, TEXT_WARNING, TEXT_ERROR, TEXT_FATAL_ERROR];
const logTable = new StandardTable(document.getElementById("logTableContainer"), {
    title: TEXT_LOGS_FROM_MASTER,
    columns: [
        { key: "type", title: TEXT_TYPE, render: renderLogType },
        { key: "log", title: TEXT_MESSAGE, render: renderLogMessage },
        { key: "date", title: TEXT_DATE },
        { key: "time", title: TEXT_TIME }
    ],
    rows: logs,
    emptyMessage: TEXT_NO_LOGS_FOUND
}).mount();

const progress = new LoadingBannerManager(document.querySelector('[data-ref="firmware-progress"]')).mount();
const overlay = new Overlay(document.querySelector('[data-ref="firmware-overlay"]'), {
    fullPage: true
}).mount();

components.push(progress, overlay, logTable);
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
markLogsBtnElem.textContent = TEXT_MARK_LOGS_READ;
markLogsBtnElem.hidden = logs.length === 0;
markLogsBtnElem.addEventListener("click", markLogsRead, { signal });
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
        await submitForm(http, API_URL_RESET_CONFIGURATION, {}, signal);
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
        await submitForm(http, API_URL_MARK_LOGS_READ, {}, signal);
        logTable.update({ rows: [] });
        markLogsBtnElem.hidden = true;
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
        await progress.poll(API_URL_GET_OTA_PROGRESS, {
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
 * @brief   Displays the localized severity with its log color.
 * @param   value                   Numeric controller log severity.
 */
/****************************************************************************/
function renderLogType(value) {
    const label = document.createElement("span");
    const severity = ["success", "warning", "error", "error"][value];
    if (severity) label.classList.add(severity);
    label.textContent = logTypes[value] ?? "";
    return label;
}

/****************************************************************************/
/*!
 * @brief   Highlights bracketed values without interpreting log messages as HTML.
 * @param   message                 Controller log text.
 */
/****************************************************************************/
function renderLogMessage(message) {
    const fragment = document.createDocumentFragment();
    for (const part of String(message).split(/(\[[^\]]*\])/)) {
        if (part.startsWith("[") && part.endsWith("]")) {
            const emphasis = document.createElement("strong");
            emphasis.textContent = part.slice(1, -1);
            fragment.append(emphasis);
        } else {
            fragment.append(part);
        }
    }
    return fragment;
}
