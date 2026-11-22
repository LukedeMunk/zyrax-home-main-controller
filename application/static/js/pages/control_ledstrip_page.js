/****************************************************************************/
/*
 * File:    control_ledstrip_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for control ledstrip.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { button } from "../../vendor/templates/js/core/dom.js";
import {
    TEXT_BACK_ONLINE, TEXT_BASICS, TEXT_BRIGHTNESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_COLOR,
    TEXT_CONFIGURE_MODE, TEXT_DISCONNECTED_CONNECTING, TEXT_ERROR, TEXT_FIELD_SAME_COLOR,
    TEXT_NO_SD_CARD_INSERTED, TEXT_REALTIME_COLORING, TEXT_SELECT_MODE, TEXT_SELECT_POWER_ANIMATION,
    TEXT_SUCCESS, TEXT_REBOOT, TEXT_REBOOT_REQUESTED, TEXT_CONFIGURE_LEDS, TEXT_UPDATE_FIRMWARE,
    TEXT_SETTINGS, TEXT_NAME, TEXT_CATALOG_HOSTNAME, TEXT_CATALOG_HAS_CONTACT_SENSOR,
    TEXT_SENSOR_INVERTED, TEXT_CANCEL, TEXT_SAVE, TEXT_FIELD_REQUIRED, TEXT_NO_CRITICAL_SYMBOLS,
    VAR_TEXT_CONFIGURE_MODE, VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { formatBrightness, renderRangeField } from "../ui_components/range_field.js";
import { ModeConfigurationModal } from "../ui_components/ModeConfigurationModal.js";
import { submitForm } from "../services/forms.js";
import { readStrip, updateParameters } from "../services/ledstrip.js";
import { SYMBOL_CRITICAL_RE } from "../domain/validation.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import { LoadingBannerManager, ModalForm } from "../../vendor/templates/js/ui_components/index.js";

const { http, signal, banners, components, delay } = mountPage("dashboard");
let { stripOrGroup, modeConfigurations } = readPageData();
const {
    groupSelected,
    devices,
    palettes,
    powerAnimations,
    LEDSTRIP_MODES,
    ledstripOrGroupId
} = readPageData();
const stack = new ModalStack();
const loading = new LoadingBannerManager(document.querySelector('[data-ref="loading"]')).mount();

components.push(stack, loading);

const MODE_COLOR = 1;
const LEDSTRIP_MODE_ID_DRAWING = 100;
const PARAMETER_ID_COLOR1 = 2;
const PARAMETER_ID_COLOR2 = 3;
const PARAMETER_ID_PALETTE = 14;

//#region Elements
const basicsTitleElem = document.getElementById("basicsTitle");
const colorTitleElem = document.getElementById("colorTitle");
const brightnessTitleElem = document.getElementById("brightnessTitle");
const selectModeTitleElem = document.getElementById("selectModeTitle");
const powerAnimationTitleElem = document.getElementById("powerAnimationTitle");
const ledstripMessageFieldElem = document.getElementById("ledstripMessageField");
const powerCbElem = document.getElementById("powerCb");
const colorColorElem = document.getElementById("colorColor");

const brightness = renderRangeField({
    name: "brightnessRange",
    label: TEXT_BRIGHTNESS,
    min: 10,
    max: 255,
    formatValue: formatBrightness(255)
}, stripOrGroup.brightness, (target, event, handler) =>
    target.addEventListener(event, handler, { signal }));

document.querySelector("[data-brightness-field]").append(brightness.element);

const brightnessRangeElem = brightness.control;
const powerAnimationContainerElem = document.getElementById("powerAnimationContainer");
const modeButtonContainerElem = document.getElementById("modeButtonContainer");
//#endregion

//#region Constants
const UPDATE_INTERVAL = 300;
//#endregion

//#region Variables
let refreshAfter = 0;
let task = null;
let colorUpdateInterval = null;

let modeModalObjects = [];
let settingsModal = null;
//#endregion

/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
document.querySelector('[data-action="setPower"]').addEventListener("click", () => setPower(), { signal });
brightnessRangeElem.addEventListener("change", () => setBrightness(), { signal });
initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    loadText();

    if (groupSelected) {
        const device = devices.find(item => item.id == stripOrGroup.device_ids[0]);
        const modeConfiguration = modeConfigurations.find(item => item.id == MODE_COLOR);

        if (device) {
            const parameter = modeConfiguration?.parameters?.[0];
            stripOrGroup.color = parameter?.value1 ?? parameter?.value ?? device.color;
            stripOrGroup.power = device.power;
            stripOrGroup.brightness = device.brightness;
            stripOrGroup.mode = device.mode;
            stripOrGroup.power_animation = device.power_animation;
        }
    } else {
        if (stripOrGroup.number_of_leds == 0) {
            ledstripMessageFieldElem.replaceChildren();

            const link = document.createElement("a");
            link.href = "/configure_led_addressing?id=" + encodeURIComponent(stripOrGroup.id);
            link.textContent =
                VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(stripOrGroup.name);
            ledstripMessageFieldElem.append(link);
            ledstripMessageFieldElem.style.display = "inline-block";
        }
    }

    renderModeButtons();
    renderModeConfigurationModals();
    renderPowerAnimationTiles();
    if (!groupSelected) renderDeviceActions();

    loadStates();

    /****************************************************************************/
    /*!
     * @brief   Sends a changed strip color at the configured update interval.
     */
    /****************************************************************************/
    colorUpdateInterval = setInterval(() => { setColor(); }, UPDATE_INTERVAL);

    signal.addEventListener("abort", () => clearInterval(colorUpdateInterval), { once: true });

    if (groupSelected) {
        return;
    }

    if (!stripOrGroup.sd_card_inserted) {
        ledstripMessageFieldElem.style.display = "inline-block";
        ledstripMessageFieldElem.textContent = TEXT_NO_SD_CARD_INSERTED;
    }

    fetchStates();
}

//#region Update functionality
/****************************************************************************/
/*!
 * @brief   Sets the color of the full ledstrip.
 */
/****************************************************************************/
async function setColor() {
    /* If color is same, return */
    if (colorColorElem.value == stripOrGroup.color) {
        return;
    }

    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_color";
    } else {
        url = "/set_ledstrip_color";
    }

    let data = { id: stripOrGroup.id, color: colorColorElem.value };

    pauseRefreshes();

    try {
        await submitForm(http, url, data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    stripOrGroup.mode = MODE_COLOR;
    stripOrGroup.color = colorColorElem.value;
    updateModeButtons();
}

/****************************************************************************/
/*!
 * @brief   Sets the power of the ledstrip.
 */
/****************************************************************************/
async function setPower() {
    let url;

    if (groupSelected) {
        url = "/set_group_power";
    } else {
        url = "/set_device_power";
    }

    let data = { id: stripOrGroup.id, power: +powerCbElem.checked };

    pauseRefreshes();

    try {
        await submitForm(http, url, data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    stripOrGroup.power = +powerCbElem.checked;
}

/****************************************************************************/
/*!
 * @brief   Sets the brightness of the ledstrip.
 */
/****************************************************************************/
async function setBrightness() {
    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_brightness";
    } else {
        url = "/set_ledstrip_brightness";
    }

    let data = { id: stripOrGroup.id, brightness: parseInt(brightnessRangeElem.value) };

    pauseRefreshes();

    try {
        await submitForm(http, url, data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    stripOrGroup.brightness = parseInt(brightnessRangeElem.value);
}

/****************************************************************************/
/*!
 * @brief   Sets the mode of the ledstrip.
 * @param   mode                    Mode to send
 */
/****************************************************************************/
async function setMode(modeId) {
    /* Check if mode has changed, else return */
    if (stripOrGroup.mode == modeId) {
        return;
    }

    stripOrGroup.mode = modeId;
    if (modeId == LEDSTRIP_MODE_ID_DRAWING) {
        updateModeButtons();
        location.assign("/realtime_led_coloring?id=" + stripOrGroup.id);

        return;
    }

    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_mode";
    } else {
        url = "/set_ledstrip_mode";
    }

    let data = { id: stripOrGroup.id, mode_id: stripOrGroup.mode };

    pauseRefreshes();

    try {
        await submitForm(http, url, data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    updateModeButtons();
}

/****************************************************************************/
/*!
 * @brief   Sets the power animation of the ledstrip.
 * @param   powerAnimation          Selected power animation ID
 */
/****************************************************************************/
async function setPowerAnimation(powerAnimation) {
    if (stripOrGroup.power_animation == powerAnimation) {
        return;
    }

    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_power_animation";
    } else {
        url = "/set_ledstrip_power_animation";
    }

    let data = { id: stripOrGroup.id, power_animation: powerAnimation };

    pauseRefreshes();

    try {
        await submitForm(http, url, data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    stripOrGroup.power_animation = powerAnimation;
    updatePowerAnimationTiles();

    banners.show({
        title: TEXT_SUCCESS,
        message: TEXT_CHANGES_SAVED_SUCCESSFULLY,
        type: "success"
    });
}

//#endregion
//#region Renderers
/****************************************************************************/
/*!
 * @brief   Updates button classes to see which mode and power animations is
 *          selected.
 */
/****************************************************************************/
function updateModeButtons() {
    for (const tile of modeButtonContainerElem.children) {
        tile.classList.toggle("tile-selected", Number(tile.dataset.modeId) === stripOrGroup.mode);
    }
}

/****************************************************************************/
/*!
 * @brief   Synchronizes the selected power animation with the current strip state.
 */
/****************************************************************************/
function updatePowerAnimationTiles() {
    for (const tileElem of powerAnimationContainerElem.children) {
        const isSelected =
            Number(tileElem.dataset.animationId) === Number(stripOrGroup.power_animation);
        tileElem.classList.toggle("tile-selected", isSelected);
        tileElem.setAttribute("aria-pressed", String(isSelected));
    }
}

/****************************************************************************/
/*!
 * @brief   Renders power animations as keyboard-accessible tile buttons.
 */
/****************************************************************************/
function renderPowerAnimationTiles() {
    powerAnimationContainerElem.replaceChildren();

    for (const animation of powerAnimations) {
        const tileElem = button({ text: animation.name, className: "tile power-animation-tile" });
        tileElem.dataset.animationId = animation.id;

        tileElem.addEventListener("click", () => setPowerAnimation(Number(animation.id)), {
            signal
        });
        powerAnimationContainerElem.append(tileElem);
    }
}

/****************************************************************************/
/*!
 * @brief   Adds maintenance actions and mounts the LED controller settings form.
 */
/****************************************************************************/
function renderDeviceActions() {
    settingsModal = new ModalForm(document.querySelector('[data-ref="ledstrip-settings"]'), {
        id: "ledstripSettings",
        title: TEXT_SETTINGS,
        modalStack: stack,
        cancelLabel: TEXT_CANCEL,
        submitLabel: TEXT_SAVE,
        allowBackdropClose: false,
        fields: [{
            name: "name",
            label: TEXT_NAME,
            type: "text",
            required: true,
            maxLength: 50,
            validators: [validateDeviceName]
        }, { name: "hostname", label: TEXT_CATALOG_HOSTNAME, type: "text", required: true }, {
            name: "has_sensor",
            label: TEXT_CATALOG_HAS_CONTACT_SENSOR,
            type: "checkbox"
        }, { name: "sensor_inverted", label: TEXT_SENSOR_INVERTED, type: "checkbox" }]
    }).mount();
    components.push(settingsModal);

    settingsModal.root.addEventListener("ui:submit", saveDeviceSettings, { signal });

    const actionsElem = document.querySelector('[data-ref="ledstrip-actions"]');
    const actions = [[TEXT_REBOOT, "fa-solid fa-power-off", rebootDevice], [
        TEXT_CONFIGURE_LEDS, "fa-solid fa-diagram-project", configureLeds
    ], [
        TEXT_UPDATE_FIRMWARE, "fa-solid fa-cloud-arrow-up", null
    ], [TEXT_SETTINGS, "fa-solid fa-gear", openSettings]];

    for (const [text, iconClass, action] of actions) {
        const buttonElem = button({ text, iconClass });

        if (action) buttonElem.addEventListener("click", action, { signal });
        actionsElem.append(buttonElem);
    }
}

/****************************************************************************/
/*!
 * @brief   Validates a device name before it is submitted to the controller.
 * @param   value                   Name entered in the settings form
 * @returns True or a localized validation error
 */
/****************************************************************************/
function validateDeviceName(value) {
    if (!String(value ?? "").trim()) return TEXT_FIELD_REQUIRED;

    return SYMBOL_CRITICAL_RE.test(value) ? TEXT_NO_CRITICAL_SYMBOLS : true;
}

/****************************************************************************/
/*!
 * @brief   Opens the LED addressing editor for this controller.
 */
/****************************************************************************/
function configureLeds() {
    location.assign("/configure_led_addressing?id=" + encodeURIComponent(stripOrGroup.id));
}

/****************************************************************************/
/*!
 * @brief   Opens settings using the latest controller values.
 */
/****************************************************************************/
function openSettings() {
    for (const modal of modeModalObjects) modal.close();

    settingsModal.show({
        name: stripOrGroup.name,
        hostname: stripOrGroup.hostname,
        has_sensor: Boolean(stripOrGroup.has_sensor),
        sensor_inverted: Boolean(stripOrGroup.sensor_inverted)
    });
}

/****************************************************************************/
/*!
 * @brief   Saves controller settings and keeps the form open when saving fails.
 * @param   event                   Validated settings form submission
 */
/****************************************************************************/
async function saveDeviceSettings(event) {
    const values = event.detail.values;
    const data = {
        id: stripOrGroup.id,
        name: values.name.trim(),
        hostname: values.hostname.trim(),
        has_sensor: Number(values.has_sensor),
        sensor_inverted: Number(values.sensor_inverted)
    };
    const submitElem = settingsModal.dialog.querySelector('[type="submit"]');

    submitElem.disabled = true;
    pauseRefreshes();

    try {
        await submitForm(http, "/update_ledstrip", data, signal);
        Object.assign(stripOrGroup, data);
        settingsModal.close();
        banners.show({
            title: TEXT_SUCCESS,
            message: TEXT_CHANGES_SAVED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });
    } finally {
        submitElem.disabled = false;
    }
}

/****************************************************************************/
/*!
 * @brief   Sends a reboot request to this LED controller.
 */
/****************************************************************************/
async function rebootDevice() {
    pauseRefreshes();

    try {
        await submitForm(http, "/reboot_ledstrip", { id: stripOrGroup.id }, signal);
        banners.show({ title: TEXT_SUCCESS, message: TEXT_REBOOT_REQUESTED, type: "success" });
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });
    }
}

/****************************************************************************/
/*!
 * @brief   Updates button classes to see which mode is selected.
 */
/****************************************************************************/
function renderModeButtons() {
    const drawing = { id: LEDSTRIP_MODE_ID_DRAWING, name: TEXT_REALTIME_COLORING };

    /****************************************************************************/
    /*!
     * @brief   Creates a selectable LED mode tile with its configuration action.
     * @param   mode                    LED mode configuration.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    modeButtonContainerElem.replaceChildren(...[drawing, ...LEDSTRIP_MODES].map(mode => {
        const tile = document.createElement("div");
        tile.className = "tile mode-tile";
        tile.tabIndex = 0;
        tile.setAttribute("role", "button");

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        tile.onclick = () => setMode(mode.id);

        /****************************************************************************/
        /*!
         * @brief   Handles keyboard activation for the selected mode tile.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        tile.onkeydown = event => {
            if (event.target === tile && ["Enter", " "].includes(event.key)) {
                event.preventDefault();
                setMode(mode.id);
            }
        };
        tile.dataset.modeId = mode.id;

        const select = document.createElement("p");
        select.textContent = mode.name;
        tile.append(select);

        if (mode !== drawing) {
            const configure = button({
                iconClass: "fa-duotone fa-solid fa-sliders",
                title: TEXT_CONFIGURE_MODE
            });
            configure.setAttribute("aria-label", VAR_TEXT_CONFIGURE_MODE(mode.name));

            /****************************************************************************/
            /*!
             * @brief   Runs the action bound to the selected control.
             * @param   event                   Event reported by the bound control.
             */
            /****************************************************************************/
            configure.onclick = event => {
                event.stopPropagation();
                loadModeConfigurationModal(mode.id);
            };
            tile.append(configure);
        }

        return tile;
    }));
}

/****************************************************************************/
/*!
 * @brief   Loads the mode configuration modal of the specified mode.
 * @param   id                      Mode ID
 */
/****************************************************************************/
function renderModeConfigurationModals() {
    modeModalObjects = [];

    for (const mode of LEDSTRIP_MODES) {
        const modalConfiguration = {
            id: mode.id,
            title: VAR_TEXT_CONFIGURE_MODE(mode.name),
            fields: []
        };

        for (let parameter of mode.parameters) {
            const field = {
                id: "mode" + mode.id + "ParameterField" + parameter.id,
                title: parameter.name,
                type: parameter.type,
                value1: parameter.default1,
                value2: parameter.default2
            };

            /****************************************************************************/
            /*!
             * @brief   Saves the LED mode configuration after a parameter changes.
             * @returns Calculated value or configured element.
             */
            /****************************************************************************/
            field.updateFunction = () => updateModeConfiguration(mode.id);

            if (parameter.id == PARAMETER_ID_PALETTE) {
                field.options = getPaletteSelectOptions();
            }

            if (parameter.min != undefined) {
                field.min = parameter.min;
            }

            if (parameter.max != undefined) {
                field.max = parameter.max;
            }

            modalConfiguration.fields.push(field);
        }

        const host = document.createElement("div");
        document.querySelector('[data-ref="mode-dialogs"]').append(host);

        const modalObject = new ModeConfigurationModal(host, modalConfiguration).mount();
        components.push(modalObject);
        modeModalObjects.push(modalObject);
    }
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
    basicsTitleElem.textContent = TEXT_BASICS;
    colorTitleElem.textContent = TEXT_COLOR;
    brightnessTitleElem.textContent = TEXT_BRIGHTNESS;
    selectModeTitleElem.textContent = TEXT_SELECT_MODE;
    powerAnimationTitleElem.textContent = TEXT_SELECT_POWER_ANIMATION;
}

/****************************************************************************/
/*!
 * @brief   Loads the configuration controls for the specified LED mode.
 * @param   id                      Mode ID
 */
/****************************************************************************/
function loadModeConfigurationModal(id) {
    for (const modal of modeModalObjects) modal.close();

    const mode = LEDSTRIP_MODES.find(item => item.id == id);
    const configuration = modeConfigurations.find(item => item.id == id);
    const modalObject = modeModalObjects.find(item => item.id == "modeConfigurationModal" + id);

    modalObject.resetValidationElements();
    modalObject.setTitle(VAR_TEXT_CONFIGURE_MODE(mode.name));
    modalObject.resetValues();

    for (const parameter of configuration?.parameters ?? []) {
        const values = [parameter.value1, parameter.value2];
        modalObject.setValue("mode" + id + "ParameterField" + parameter.mode_parameter_id, values);
    }

    modalObject.show();
}

/****************************************************************************/
/*!
 * @brief   Loads the states to front-end.
 */
/****************************************************************************/
function loadStates() {
    powerCbElem.checked = stripOrGroup.power;
    colorColorElem.value = stripOrGroup.color;
    brightness.setValue(stripOrGroup.brightness);

    updateModeButtons();
    updatePowerAnimationTiles();
}
//#endregion

//#region Interval update requests
/****************************************************************************/
/*!
 * @brief   Asynchronous interval function for fetching the ledstrips states
 *          from the back-end for real-time monitoring.
 */
/****************************************************************************/
async function fetchStates() {
    if (signal.aborted) return;

    if (Date.now() >= refreshAfter && !modeModalObjects.some(modal => modal.isOpen)) {
        const started = Date.now();

        try {
            const state = await readStrip(http, stripOrGroup.id, signal);
            if (started >= refreshAfter) {
                stripOrGroup = state;
                loadStates();
            }
            if (task !== null) {
                loading.close(task);
                task = null;
                banners.show({
                    title: TEXT_BACK_ONLINE,
                    message: TEXT_BACK_ONLINE,
                    type: "success"
                });
            }
        } catch (error) {
            if (signal.aborted) return;

            if (task === null) task = loading.show({ message: TEXT_DISCONNECTED_CONNECTING });
        }
    }
    delay(fetchStates, 1000);
}

/****************************************************************************/
/*!
 * @brief   Pauses back-end refresh intervals for the specified amount of time.
 * @param   seconds                 Seconds to pause
 */
/****************************************************************************/
function pauseRefreshes(seconds = 2) {
    refreshAfter = Date.now() + seconds * 1000;
}
//#endregion
//#endregion

/****************************************************************************/
/*!
 * @brief   Validates and saves the parameters of an LED mode.
 * @param   modeId                  LED mode identifier.
 */
/****************************************************************************/
async function updateModeConfiguration(modeId) {
    const mode = LEDSTRIP_MODES.find(mode => mode.id === modeId);
    const configuration = modeConfigurations.find(item => item.id == modeId);
    const modal = modeModalObjects.find(item => item.id == "modeConfigurationModal" + modeId);

    modal.resetValidationElements();

    const values = modal.getValues();

    let data = { mode_id: modeId, parameters: [] };

    if (groupSelected) {
        data.group_id = stripOrGroup.id;
    } else {
        data.device_id = ledstripOrGroupId;
    }

    const color1Index =
        mode.parameters.findIndex(parameter => parameter.id === PARAMETER_ID_COLOR1);

    const color2Index =
        mode.parameters.findIndex(parameter => parameter.id === PARAMETER_ID_COLOR2);

    if (color1Index != -1 && color2Index != -1) {
        if (!validateColors(values[color1Index], values[color2Index])) {
            modal.setFieldInvalid(modal.fields[color1Index].id, TEXT_FIELD_SAME_COLOR);

            return;
        }
    }

    let index = 0;
    for (let param of mode.parameters) {
        const parameter = { id: param.id };

        if (Array.isArray(values[index])) {
            parameter.value1 = values[index][0];
            parameter.value2 = values[index][1];
        } else {
            parameter.value1 = values[index];
        }

        data.parameters.push(parameter);
        index++;
    }

    let url;
    if (groupSelected) {
        url = "/config_group_mode";
    } else {
        url = "/configure_ledstrip_mode";
    }

    try {
        const result = await updateParameters(http, url, data, signal);
        modeConfigurations = result.mode_configurations;
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    setMode(modeId);
}

/****************************************************************************/
/*!
 * @brief   Checks that two fixed mode colors differ unless a gradient is enabled.
 * @param   color1value             First color and gradient selection.
 * @param   color2value             Second color and gradient selection.
 * @returns Whether the operation or validation condition succeeds.
 */
/****************************************************************************/
function validateColors(color1value, color2value) {
    /* If one is gradient, colors can be the same */
    if (color1value[1] || color2value[1]) {
        return true;
    }

    /* Validate colors, cannot be te same */
    if (color1value[0] != color2value[0]) {
        return true;
    }

    return false;
}

/****************************************************************************/
/*!
 * @brief   Returns the palette values and labels for a mode selector.
 * @returns The palette values and labels for a mode selector.
 */
/****************************************************************************/
function getPaletteSelectOptions() {
    const options = [];

    for (const palette of palettes) {
        options.push({ value: palette.value, text: palette.name });
    }

    return options;
}
