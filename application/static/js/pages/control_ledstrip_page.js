/******************************************************************************/
/*
 * File:    control_ledstrip_page.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   JavaScript for the control leds page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const basicsTitleElem = document.getElementById("basicsTitle");
const colorTitleElem = document.getElementById("colorTitle");
const brightnessTitleElem = document.getElementById("brightnessTitle");
const selectModeTitleElem = document.getElementById("selectModeTitle");
const powerAnimationSelectTitleElem = document.getElementById("powerAnimationSelectTitle");

/* Fields */
const ledstripMessageFieldElem = document.getElementById("ledstripMessageField");

/* Buttons */

/* Icons */

/* Input elements */
const powerCbElem = document.getElementById("powerCb");
const colorColorElem = document.getElementById("colorColor");
const brightnessRangeElem = document.getElementById("brightnessRange");
const powerAnimationSelectElem = document.getElementById("powerAnimationSelect");

/* Tables */

/* Modals */

/* Other */
const modeButtonContainerElem = document.getElementById("modeButtonContainer");
//#endregion

//#region Constants
const UPDATE_INTERVAL = 300;
//#endregion

//#region Variables
let isFetchingStates = false;
let colorUpdateInterval = null;
let modeTileObjects = [];
let modeModalObjects = [];
//#endregion

//#region Key event listeners
//#endregion

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();

    if (groupSelected) {
        const device = devices[getIndexFromId(devices, stripOrGroup.device_ids[0])];
        const modeConfiguration = modeConfigurations[getIndexFromId(modeConfigurations, MODE_COLOR)];

        device.color = modeConfiguration.parameters[0].value;
        stripOrGroup.power = device.power;
        stripOrGroup.color = device.color;
        stripOrGroup.brightness = device.brightness;
        stripOrGroup.mode = device.mode;
        stripOrGroup.power_animation = device.power_animation;
    } else {
        if (stripOrGroup.number_of_leds == 0) {
            banners.show(
                        TEXT_ACTION_REQUIRED,
                        VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(stripOrGroup.name),
                        MESSAGE_TYPE_WARNING,
                        0,
                        () => updateLedAddressing(stripOrGroup.id)
                    );
        }
    }

    renderModeButtons();
    renderModeConfigurationModals();
    
    loadStates()
    
    colorUpdateInterval = setInterval(() => {
        setColor();
    }, UPDATE_INTERVAL);
    
    if (groupSelected) {
        return;
    }
    
    if (!stripOrGroup.sd_card_inserted) {
        ledstripMessageFieldElem.style.display = "inline-block";
        ledstripMessageFieldElem.textContent = TEXT_NO_SD_CARD_INSERTED;
    }

    isFetchingStates = true;
    fetchStates();
});

//#region Update functionality
/******************************************************************************/
/*!
    @brief  Sets the color of the full ledstrip.
*/
/******************************************************************************/
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

    let data = {
        id: stripOrGroup.id,
        color: colorColorElem.value
    };

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner(url, data);
    if (result.status_code != HTTP_CODE_OK) return;

    stripOrGroup.mode = MODE_COLOR;
    stripOrGroup.color = colorColorElem.value;
    updateModeButtons();
}

/******************************************************************************/
/*!
    @brief  Sets the power of the ledstrip.
*/
/******************************************************************************/
async function setPower() {
    let url;

    if (groupSelected) {
        url = "/set_group_power";
    } else {
        url = "/set_device_power";
    }

    let data = {
        id: stripOrGroup.id,
        power: +powerCbElem.checked
    };

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner(url, data);
    if (result.status_code != HTTP_CODE_OK) return;

    stripOrGroup.power = +powerCbElem.checked;
}

/******************************************************************************/
/*!
    @brief  Sets the brightness of the ledstrip.
*/
/******************************************************************************/
async function setBrightness() {
    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_brightness";
    } else {
        url = "/set_ledstrip_brightness";
    }

    let data = {
        id: stripOrGroup.id,
        brightness: parseInt(brightnessRangeElem.value)
    };

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner(url, data);
    if (result.status_code != HTTP_CODE_OK) return;

    stripOrGroup.brightness = parseInt(brightnessRangeElem.value);
}

/******************************************************************************/
/*!
    @brief  Sets the mode of the ledstrip.
    @param  mode            Mode to send
*/
/******************************************************************************/
async function setMode(modeId) {
    /* Check if mode has changed, else return */
    if (stripOrGroup.mode == modeId) {
        return;
    }

    stripOrGroup.mode = modeId;
    if (modeId == LEDSTRIP_MODE_ID_DRAWING) {
        updateModeButtons();
        redirect("/realtime_led_coloring?id=" + stripOrGroup.id);
        return;
    }

    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_mode";
    } else {
        url = "/set_ledstrip_mode";
    }

    let data = {
        id: stripOrGroup.id,
        mode_id: stripOrGroup.mode
    };

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner(url, data);
    if (result.status_code != HTTP_CODE_OK) return;

    updateModeButtons();
}

/******************************************************************************/
/*!
    @brief  Sets the power animation of the ledstrip.
*/
/******************************************************************************/
async function setPowerAnimation() {
    let powerAnimation = parseInt(powerAnimationSelectElem.value);
    
    if (stripOrGroup.power_animation == powerAnimation) {
        return;
    }

    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_power_animation";
    } else {
        url = "/set_ledstrip_power_animation";
    }

    let data = {
        id: stripOrGroup.id,
        power_animation: powerAnimation
    };

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner(url, data);
    if (result.status_code != HTTP_CODE_OK) return;
    stripOrGroup.power_animation = powerAnimation;

    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}
//#endregion

//#region Renderers
/******************************************************************************/
/*!
    @brief  Updates button classes to see which mode and power animations is
            selected.
*/
/******************************************************************************/
function updateModeButtons() {
    /* Reset all button classes */
    for (let modeTile of modeTileObjects) {
        modeTile.setSelected(modeTile.modeId == stripOrGroup.mode);
    }
}

/******************************************************************************/
/*!
    @brief  Updates button classes to see which mode is selected.
*/
/******************************************************************************/
function renderModeButtons() {
    modeButtonContainerElem.replaceChildren();
    modeTileObjects = [];

    const realTimeDrawingBtnObj = new ModeTile({
        modeId: LEDSTRIP_MODE_ID_DRAWING,
        title: TEXT_REALTIME_COLORING,
        onclickFunction: () => setMode(LEDSTRIP_MODE_ID_DRAWING)
    });

    modeButtonContainerElem.appendChild(realTimeDrawingBtnObj.render());
    modeTileObjects.push(realTimeDrawingBtnObj);

    for (let mode of LEDSTRIP_MODES) {
        const tileObj = new ModeTile({
            modeId: mode.id,
            title: mode.name,
            onclickFunction: () => setMode(mode.id),
            configurationFunction: () => loadModeConfigurationModal(mode.id)
        });

        modeButtonContainerElem.appendChild(tileObj.render());

        if (mode.id == stripOrGroup.mode) {
            tileObj.setSelected(true);
        }

        modeTileObjects.push(tileObj);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the mode configuration modal of the specified mode.
    @param  id                  Mode ID
*/
/******************************************************************************/
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
                value2: parameter.default2,
            }

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

        const modalObject = new ModeConfigurationModal(modalConfiguration);
        modalObject.render();
        modeModalObjects.push(modalObject);
    }
}
//#endregion

//#region Utilities
//#region Load functions
/******************************************************************************/
/*!
    @brief  Loads the text of elements in the selected language.
*/
/******************************************************************************/
function loadText() {
    basicsTitleElem.textContent = TEXT_BASICS;
    colorTitleElem.textContent = TEXT_COLOR;
    brightnessTitleElem.textContent = TEXT_BRIGHTNESS;
    selectModeTitleElem.textContent = TEXT_SELECT_MODE;
    powerAnimationSelectTitleElem.textContent = TEXT_SELECT_POWER_ANIMATION;
}

/******************************************************************************/
/*!
    @brief  Loads the ledstrip power animation select options.
*/
/******************************************************************************/
function loadPowerAnimationSelectOptions() {
    powerAnimationSelectElem.innerHTML = "";

    for (let animation of powerAnimations) {
        let option = document.createElement("option");
        option.value = animation.id;
        option.text = animation.name;
        
        powerAnimationSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the mode configuration modal of the specified mode.
    @param  id                  Mode ID
*/
/******************************************************************************/
function loadModeConfigurationModal(id) {
    const mode = LEDSTRIP_MODES[getIndexFromId(LEDSTRIP_MODES, id)];
    const configuration = modeConfigurations[getIndexFromId(modeConfigurations, id)];
    const modalObject = modeModalObjects[getIndexFromId(modeModalObjects, "modeConfigurationModal" + id)];

    modalObject.resetValidationElements();
    modalObject.setTitle(VAR_TEXT_CONFIGURE_MODE(mode.name));
    modalObject.resetValues();

    for (let parameter of configuration.parameters) {
        const values = [parameter.value1, parameter.value2];
        modalObject.setValue("mode" + id + "ParameterField" + parameter.mode_parameter_id, values);
    }

    modalObject.show();
}

/******************************************************************************/
/*!
    @brief  Loads the states to front-end.
*/
/******************************************************************************/
function loadStates() {
    powerCbElem.checked = stripOrGroup.power;
    colorColorElem.value = stripOrGroup.color;
    brightnessRangeElem.value = stripOrGroup.brightness;

    updateModeButtons();
    loadPowerAnimationSelectOptions();
    powerAnimationSelectElem.value = stripOrGroup.power_animation;
}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
    @brief  Asynchronous interval function for fetching the ledstrips states
            from the back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let modalOpen = false;
    for (let modal of modeModalObjects) {
        if (modal.isOpen) {
            modalOpen = true;
            break;
        }
    }

    if (modalOpen) {
        isFetchingStates = false;
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let response;
    try {
        response = await fetch("get_ledstrips?id=" + stripOrGroup.id, {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchStates);
        return;
    }

    /* Last check */
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let data = await response.json();

    stripOrGroup = data;
    loadStates();

    setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
    @brief  Pauses back-end refresh intervals for the specified amount of time.
    @param  seconds             Seconds to pause
*/
/******************************************************************************/
function pauseRefreshes(seconds=2) {
    isFetchingStates = false;
    setTimeout(function() {isFetchingStates = true}, seconds*1000);
}
//#endregion
//#endregion