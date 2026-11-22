/****************************************************************************/
/*
 * File:    application_configuration_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for application configuration.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_API_KEYS, TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY, TEXT_CANCEL,
    TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_DELETE, TEXT_ERROR, TEXT_KEY_NOT_VALID,
    TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_APPLICATION_CONFIGURATION, TEXT_SUCCESS
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { submitForm } from "../services/forms.js";

const { http, popup, banners, signal } = mountPage("dashboard");
let { weatherApiKey, telegramBotToken } = readPageData();
//#region Elements
const modulesTitleElem = document.getElementById("modulesTitle");
const errorMessageConfigurationFieldElem =
    document.getElementById("errorMessageConfigurationField");
const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");
const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");

//#endregion
//#region Key automation listeners
/* Ledstrip modal flow */
/****************************************************************************/
/*!
 * @brief   Moves focus to the Telegram token when Enter is pressed.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
weatherApiKeyTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        telegramBotTokenTxtElem.focus();
    }
});

/****************************************************************************/
/*!
 * @brief   Submits the integration configuration when Enter is pressed.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
telegramBotTokenTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        submitConfiguration();
    }
});

//#endregion
/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
document.querySelector('[data-action="submitConfiguration"]').addEventListener("click", () =>
    submitConfiguration(), { signal });
document.querySelector('[data-action="resetConfiguration"]').addEventListener("click", () =>
    resetConfiguration(), { signal });
initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    loadText();

    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;
}

//#region Main functionality
/****************************************************************************/
/*!
 * @brief   Submits the configuration when valid.
 * @param   device                  Device object
 */
/****************************************************************************/
async function submitConfiguration() {
    if (!validateConfiguration()) {
        return;
    }

    let data = { weather_api_key: weatherApiKey, telegram_bot_token: telegramBotToken };

    try {
        await submitForm(http, "/update_application_configuration", data, signal);
    } catch (error) {
        errorMessageConfigurationFieldElem.style.display = "inline-block";
        errorMessageConfigurationFieldElem.textContent = error.message;

        return;
    }

    banners.show({
        title: TEXT_SUCCESS,
        message: TEXT_CHANGES_SAVED_SUCCESSFULLY,
        type: "success"
    });
}

/****************************************************************************/
/*!
 * @brief   Shows a confirmation before resetting the application configuration.
 */
/****************************************************************************/
function resetConfigurationConfirm() {
    return popup.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: TEXT_Q_DELETE_APPLICATION_CONFIGURATION,
        type: "warning",
        confirmLabel: TEXT_DELETE,
        cancelLabel: TEXT_CANCEL
    });
}

/****************************************************************************/
/*!
 * @brief   Resets the application configuration.
 */
/****************************************************************************/
async function resetConfiguration() {
    const choice = await resetConfigurationConfirm();
    if (!choice) return;

    try {
        await submitForm(http, "/reset_configuration", {}, signal);
    } catch (error) {
        banners.show({ title: TEXT_ERROR, message: error.message, type: "error" });

        return;
    }

    weatherApiKey = "";
    telegramBotToken = "";
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;

    banners.show({
        title: TEXT_SUCCESS,
        message: TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY,
        type: "success"
    });
}

//#endregion
//#region Utilities
//#region Load functions
/****************************************************************************/
/*!
 * @brief   Loads the text of elements in the selected language.
 */
/****************************************************************************/
function loadText() {
    modulesTitleElem.textContent = TEXT_API_KEYS;
}

//#endregion
//#region Validators
/****************************************************************************/
/*!
 * @brief   Validates the application configuration.
 * @returns bool True if valid
 */
/****************************************************************************/
function validateConfiguration() {
    /* Get user input */
    let weatherApiKeyInput = weatherApiKeyTxtElem.value;
    let telegramBotTokenInput = telegramBotTokenTxtElem.value;

    /* Reset error styling */
    errorMessageConfigurationFieldElem.style.display = "none";

    weatherApiKeyTxtElem.classList.remove("invalid-input");
    telegramBotTokenTxtElem.classList.remove("invalid-input");

    /* Validate weatherApiKeyInput */
    if (weatherApiKeyInput != "" && weatherApiKeyInput.length != 25) {
        weatherApiKeyTxtElem.classList.add("invalid-input");
        weatherApiKeyTxtElem.focus();
        errorMessageConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageConfigurationFieldElem.style.display = "inline-block";

        return false;
    }

    /* Validate telegramBotTokenInput */
    if (telegramBotTokenInput != "" && telegramBotTokenInput.length != 46) {
        telegramBotTokenTxtElem.classList.add("invalid-input");
        telegramBotTokenTxtElem.focus();
        errorMessageConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageConfigurationFieldElem.style.display = "inline-block";

        return false;
    }

    weatherApiKey = weatherApiKeyInput;
    telegramBotToken = telegramBotTokenInput;

    return true;
}
//#endregion
//#endregion
