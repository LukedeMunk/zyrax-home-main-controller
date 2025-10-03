/******************************************************************************/
/*
 * File:    application_configuration_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the application configuration page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const modulesTitleElem = document.getElementById("modulesTitle");
const weatherApiKeyTitleElem = document.getElementById("weatherApiKeyTitle");
const telegramBotTokenTitleElem = document.getElementById("telegramBotTokenTitle");

/* Fields */
const errorMessageConfigurationFieldElem = document.getElementById("errorMessageConfigurationField");

/* Buttons */
const submitConfigurationBtnElem = document.getElementById("submitBtn");
const resetConfigurationBtnElem = document.getElementById("resetBtn");

/* Icons */

/* Input elements */
const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");
const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");

/* Tables */

/* Modals */

/* Other */
//#endregion

//#region Constants
//#endregion

//#region Variables
//#endregion

//#region Key automation listeners
/* Ledstrip modal flow */
weatherApiKeyTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        telegramBotTokenTxtElem.focus();
    }
});
telegramBotTokenTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        submitConfiguration();
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
    
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;
});

//#region Main functionality
/******************************************************************************/
/*!
  @brief    Submits the configuration when valid.
  @param    device              Device object
*/
/******************************************************************************/
function submitConfiguration() {
    if (!validateConfiguration()) {
        return;
    }

    let data = {
        weather_api_key: weatherApiKey,
        telegram_bot_token: telegramBotToken
    }

    let result = httpPostRequestJsonReturn("/update_application_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageConfigurationFieldElem.style.display = "inline-block";
        errorMessageConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before resetting the application configuration.
*/
/******************************************************************************/
function resetConfigurationConfirm() {
    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "resetConfiguration();"},
                    CANCEL_POPUP_BUTTON
                ];
    showPopup(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_APPLICATION_CONFIGURATION, buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Resets the application configuration.
*/
/******************************************************************************/
function resetConfiguration() {
    closePopup();
    
    weatherApiKey = "";
    telegramBotToken = "";
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;

    httpPostRequest("/reset_configuration");
    showBanner(TEXT_SUCCESS, TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
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
    modulesTitleElem.textContent = TEXT_API_KEYS;
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the application configuration.
  @returns  bool                True if valid
*/
/******************************************************************************/
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