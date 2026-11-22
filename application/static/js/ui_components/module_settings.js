/****************************************************************************/
/*
 * File:    module_settings.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Binds integration settings on the setup and configuration pages.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_KEY_NOT_VALID, TEXT_SUCCESS
} from "../domain/language_pack_english.js";
import { submitForm } from "../services/forms.js";

/****************************************************************************/
/*!
 * @brief   Binds integration settings to the page lifecycle and controller requests.
 * @param   root                    Root element owned by the component.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @param   banners                 Page notification manager.
 * @param   settings                Initial integration settings.
 */
/****************************************************************************/
export function mountModuleSettings(root, { http, signal, banners }, settings) {
    let {
        weatherServiceEnabled,
        telegramServiceEnabled,
        weatherApiKey,
        telegramBotToken,
        rpiRfEnabled
    } = settings;
    const weatherServiceEnabledCbElem = root.querySelector("#weatherServiceEnabledCb");
    const telegramServiceEnabledCbElem = root.querySelector("#telegramServiceEnabledCb");
    const weatherApiKeyTxtElem = root.querySelector("#weatherApiKeyTxt");
    const telegramBotTokenTxtElem = root.querySelector("#telegramBotTokenTxt");
    const rpiRfModuleEnabledCbElem = root.querySelector("#rpiRfModuleEnabledCb");
    const errorMessageModuleConfigurationFieldElem =
        root.querySelector("#errorMessageModuleConfigurationField");

    weatherServiceEnabledCbElem.checked = Boolean(weatherServiceEnabled);
    telegramServiceEnabledCbElem.checked = Boolean(telegramServiceEnabled);
    rpiRfModuleEnabledCbElem.checked = Boolean(rpiRfEnabled);

    for (const [field, enabled, value] of [[
        weatherApiKeyTxtElem, weatherServiceEnabled, weatherApiKey
    ], [telegramBotTokenTxtElem, telegramServiceEnabled, telegramBotToken]]) {
        field.value = value ?? "";
        field.disabled = !enabled;
        field.classList.toggle("disabled", !enabled);
    }

    weatherServiceEnabledCbElem.addEventListener("click", toggleWeatherServiceEnabled, { signal });
    telegramServiceEnabledCbElem.addEventListener("click", toggleTelegramServiceEnabled, {
        signal
    });
    weatherApiKeyTxtElem.addEventListener("change", submitWeatherModuleConfiguration, { signal });
    telegramBotTokenTxtElem.addEventListener("change", submitTelegramModuleConfiguration, {
        signal
    });
    rpiRfModuleEnabledCbElem.addEventListener("click", submitRpiRfModuleEnabled, { signal });

    /****************************************************************************/
    /*!
     * @brief   Updates the weather input state and submits an available API key.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Updates the Telegram input state and submits an available bot token.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Validates and saves the weather service configuration.
     */
    /****************************************************************************/
    async function submitWeatherModuleConfiguration() {
        if (!validateWeatherModuleConfiguration()) {
            return;
        }

        let data = {
            weather_service_enabled: +weatherServiceEnabled,
            weather_api_key: weatherApiKey
        };

        try {
            await submitForm(http, "/update_weather_configuration", data, signal);
        } catch (error) {
            if (signal.aborted) return;

            errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
            errorMessageModuleConfigurationFieldElem.textContent = error.message;

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
     * @brief   Validates and saves the Telegram service configuration.
     */
    /****************************************************************************/
    async function submitTelegramModuleConfiguration() {
        if (!validateTelegramModuleConfiguration()) {
            return;
        }

        let data = {
            telegram_service_enabled: +telegramServiceEnabled,
            telegram_bot_token: telegramBotToken
        };

        try {
            await submitForm(http, "/update_telegram_configuration", data, signal);
        } catch (error) {
            if (signal.aborted) return;

            errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
            errorMessageModuleConfigurationFieldElem.textContent = error.message;

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
     * @brief   Saves the Raspberry Pi RF receiver state and restores it on failure.
     */
    /****************************************************************************/
    async function submitRpiRfModuleEnabled() {
        const requestedRpiRfEnabled = rpiRfModuleEnabledCbElem.checked;

        let data = { rpi_rf_receiver_enabled: +requestedRpiRfEnabled };

        try {
            await submitForm(http, "/update_rpi_rf_module", data, signal);
        } catch (error) {
            if (signal.aborted) return;

            errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
            errorMessageModuleConfigurationFieldElem.textContent = error.message;

            rpiRfModuleEnabledCbElem.checked = rpiRfEnabled;

            return;
        }

        rpiRfEnabled = requestedRpiRfEnabled;
        banners.show({
            title: TEXT_SUCCESS,
            message: TEXT_CHANGES_SAVED_SUCCESSFULLY,
            type: "success"
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Validates and stores the pending weather service fields.
     * @returns Whether the operation or validation condition succeeds.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Validates and stores the pending Telegram service fields.
     * @returns Whether the operation or validation condition succeeds.
     */
    /****************************************************************************/
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
}
