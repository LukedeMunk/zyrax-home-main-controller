/******************************************************************************/
/*
 * File:    module_service.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for account and profile utilities and module utilities.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/


/******************************************************************************/
/*!
    @brief  Loads the weather location modal.
*/
/******************************************************************************/
function loadWeatherLocationModal() {
    errorMessageWeatherLocationFieldElem.style.display = "none";
    weatherLocationTxtElem.classList.remove("invalid-input");

    weatherLocationTxtElem.value = weatherLocation;
    showModal(weatherLocationModalElem);
}

/******************************************************************************/
/*!
    @brief  Validates the weather location input.
    @return bool                True if valid
*/
/******************************************************************************/
function validateWeatherLocation() {
    /* Get user input */
    let location = weatherLocationTxtElem.value;

    /* Reset error styling */
    errorMessageWeatherLocationFieldElem.style.display = "none";
    weatherLocationTxtElem.classList.remove("invalid-input");

    /* Validate location */
    if (location == "") {
        weatherLocationTxtElem.classList.add("invalid-input");
        weatherLocationTxtElem.focus();
        errorMessageWeatherLocationFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageWeatherLocationFieldElem.style.display = "inline-block";
        return false;
    }

    return true;
}
/******************************************************************************/
/*!
    @brief  Sends the updated weather location to the back-end.
*/
/******************************************************************************/
async function updateWeatherLocation() {
    if (!validateWeatherLocation()) {
        return;
    }

    let location = weatherLocationTxtElem.value;
    const result = await httpPostRequestJsonReturn("/update_weather_configuration", {weather_location: location});
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageWeatherLocationFieldElem.style.display = "inline-block";
        errorMessageWeatherLocationFieldElem.textContent = weatherErrorCodeToText(result.message);
        return;
    }

    weatherLocation = result.message.weather_location;
    banners.show(TEXT_SUCCESS, VAR_TEXT_WEATHER_LOCATION_CHANGED_SUCCESSFULLY(weatherLocation), MESSAGE_TYPE_SUCCESS);
    closeModal(weatherLocationModalElem);
    
    weatherLoading = true;
    loadDashboardConfiguration();

    /* Reload weather after some time */
    setTimeout(function() {
        fetchWeatherInformation();
    }, BACK_END_UPDATE_INTERVAL_1S)
}

/******************************************************************************/
/*!
    @brief  Fetches the weather information (after a location change).
*/
/******************************************************************************/
async function fetchWeatherInformation() {
    try {
        let response = await fetch("get_weather", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchWeatherInformation);
        return;
    }

    let data = await response.json();
    weather = data.message.weather;

    weatherLoading = false;
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before resetting the application configuration.
*/
/******************************************************************************/
function resetToFactoryConfigurationConfirm() {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_APPLICATION_CONFIGURATION, buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Resets the application configuration.
*/
/******************************************************************************/
async function resetToFactoryConfiguration() {
    const choice = await resetToFactoryConfigurationConfirm();
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/reset_configuration");
    if (result.status_code != HTTP_CODE_OK) return;
    
    weatherApiKey = "";
    telegramBotToken = "";
    weatherApiKeyTxtElem.value = weatherApiKey;
    telegramBotTokenTxtElem.value = telegramBotToken;

    banners.show(TEXT_SUCCESS, TEXT_APPLICATION_CONFIGURATION_RESETTED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}

//#region Togglers and submitters
/******************************************************************************/
/*!
    @brief  Toggles the weather service state.
*/
/******************************************************************************/
function toggleWeatherServiceEnabled() {
    if (!weatherServiceEnabledCbElem.checked) {
        weatherApiKeyTxtElem.disabled = true;
        weatherApiKeyTxtElem.classList.add("disabled");
        return;
    }

    weatherApiKeyTxtElem.disabled = false;
    weatherApiKeyTxtElem.classList.remove("disabled");

    if (weatherApiKeyTxtElem.value != "") {
        submitWeatherModuleConfiguration();
    }
}

/******************************************************************************/
/*!
    @brief  Toggles the Telegram service state.
*/
/******************************************************************************/
function toggleTelegramServiceEnabled() {
    if (!telegramServiceEnabledCbElem.checked) {
        telegramBotTokenTxtElem.disabled = true;
        telegramBotTokenTxtElem.classList.add("disabled");
        return;
    }

    telegramBotTokenTxtElem.disabled = false;
    telegramBotTokenTxtElem.classList.remove("disabled");

    if (telegramBotTokenTxtElem.value != "") {
        submitTelegramModuleConfiguration();
    }
}

/******************************************************************************/
/*!
    @brief  Submits the weather module configuration when valid.
*/
/******************************************************************************/
async function submitWeatherModuleConfiguration() {
    if (!validateWeatherModuleConfiguration()) {
        return;
    }

    let data = {
        weather_service_enabled: +weatherServiceEnabled,
        weather_api_key: weatherApiKey
    }

    const result = await httpPostRequestJsonReturn("/update_weather_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
    @brief  Submits the Telegram module configuration when valid.
*/
/******************************************************************************/
async function submitTelegramModuleConfiguration() {
    if (!validateTelegramModuleConfiguration()) {
        return;
    }

    let data = {
        telegram_service_enabled: +telegramServiceEnabled,
        telegram_bot_token: telegramBotToken
    }

    const result = await httpPostRequestJsonReturn("/update_telegram_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
    @brief  Enables or disables the Raspberry Pi RF receiver.
*/
/******************************************************************************/
async function submitRpiRfModuleEnabled() {
    const requestedRpiRfEnabled = rpiRfModuleEnabledCbElem.checked;

    let data = {
        rpi_rf_receiver_enabled: +requestedRpiRfEnabled
    }

    const result = await httpPostRequestJsonReturn("/update_rpi_rf_module", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        
        rpiRfModuleEnabledCbElem.checked = rpiRfEnabled;
        return;
    }

    rpiRfEnabled = requestedRpiRfEnabled;
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}
//#endregion

/******************************************************************************/
/*!
    @brief  Validates the weather module configuration.
    @return bool                True if valid
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
        return false;
    }
    
    weatherServiceEnabled = weatherServiceEnabledInput;
    weatherApiKey = weatherApiKeyInput;

    return true;
}

/******************************************************************************/
/*!
    @brief  Validates the Telegram configuration.
    @return bool                True if valid
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
