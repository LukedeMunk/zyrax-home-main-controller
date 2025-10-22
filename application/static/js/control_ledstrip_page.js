/******************************************************************************/
/*
 * File:    control_ledstrip_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the control leds page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const configurationModalTitleElem = document.getElementById("configurationModalTitle");
const basicsTitleElem = document.getElementById("basicsTitle");
const colorTitleElem = document.getElementById("colorTitle");
const brightnessTitleElem = document.getElementById("brightnessTitle");
const selectModeTitleElem = document.getElementById("selectModeTitle");
const powerAnimationSelectTitleElem = document.getElementById("powerAnimationSelectTitle");

/* Fields */
const errorMessageModeConfigurationFieldElem = document.getElementById("errorMessageModeConfigurationField");
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
const configurationModalElem = document.getElementById("configurationModal");

/* Other */
const configurationVariablesContainerElem = document.getElementById("configurationVariablesContainer");
const modeButtonContainerElem = document.getElementById("modeButtonContainer");
//#endregion

//#region Constants
const UPDATE_INTERVAL = 300;
//#endregion

//#region Variables
let minimumColorBand;
let maximumColorBand;
let isFetchingStates = false;
let selectedModeConfigId;
let configurationDialogOpen = false;

let colorUpdateInterval = null;
//#endregion

//#region Key event listeners
// Automatisch sluiten bij klik buiten dialog
document.addEventListener("mousedown", function(event) {
    if (!configurationDialogOpen) {
        return;
    }

    let rect = configurationModalElem.getBoundingClientRect();
    let clickedInDialog =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

    if (!clickedInDialog) {
        configurationModalElem.classList.remove("show");
        setTimeout(function() {
            configurationDialogOpen = false;
            configurationModalElem.close();
        }, 300);
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

    let index = getIndexFromId(modeConfigs, MODE_COLOR);

    if (groupSelected) {
        let device = devices[getIndexFromId(devices, stripOrGroup.device_ids[0])];
        device.color = modeConfigs[index].parameters[0].value;
        stripOrGroup.power = device.power;
        stripOrGroup.color = device.color;
        stripOrGroup.brightness = device.brightness;
        stripOrGroup.mode = device.mode;
        stripOrGroup.power_animation = device.power_animation;
    } else {
        stripOrGroup.color = modeConfigs[index].parameters[0].value;
        
        if (stripOrGroup.number_of_leds == 0) {
            showBanner(
                        TEXT_ACTION_REQUIRED,
                        VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(stripOrGroup.name),
                        BANNER_TYPE_WARNING,
                        0,
                        "updateLedAddressing(" + stripOrGroup.id + ");"
                    );
        }
    }

    loadModeButtons();
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
  @brief    Sets the color of the full ledstrip.
*/
/******************************************************************************/
function setColor() {
    /* If color is same, return */
    if (colorColorElem.value == stripOrGroup.color) {
        return;
    }

    stripOrGroup.color = colorColorElem.value
    
    let url;
    
    if (groupSelected) {
        url = "/set_ledstrip_group_color";
    } else {
        url = "/set_ledstrip_color";
    }

    let data = {
        id: stripOrGroup.id,
        color: stripOrGroup.color
    };

    stripOrGroup.mode = MODE_COLOR;

    pauseRefreshes();
    httpPostRequest(url, data);
    updateModeButtons();
}

/******************************************************************************/
/*!
  @brief    Sets the power of the ledstrip.
*/
/******************************************************************************/
function setPower() {
    stripOrGroup.power = +powerCbElem.checked;
    let url;

    if (groupSelected) {
        url = "/set_group_power";
    } else {
        url = "/set_device_power";
    }

    let data = {
        id: stripOrGroup.id,
        power: stripOrGroup.power
    };

    pauseRefreshes();
    httpPostRequest(url, data);
}

/******************************************************************************/
/*!
  @brief    Sets the brightness of the ledstrip.
*/
/******************************************************************************/
function setBrightness() {
    stripOrGroup.brightness = brightnessRangeElem.value;
    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_brightness";
    } else {
        url = "/set_ledstrip_brightness";
    }

    let data = {
        id: stripOrGroup.id,
        brightness: stripOrGroup.brightness
    };

    pauseRefreshes();
    httpPostRequest(url, data);
}

/******************************************************************************/
/*!
  @brief    Sets the mode of the ledstrip.
  @param    mode            Mode to send
*/
/******************************************************************************/
function setMode(mode) {
    /* Check if mode has changed, else return */
    if (stripOrGroup.mode == mode) {
        return;
    }

    stripOrGroup.mode = mode;
    if (mode == MODE_DRAWING) {
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
        mode: stripOrGroup.mode
    };

    pauseRefreshes();
    httpPostRequest(url, data);
    updateModeButtons();
}

/******************************************************************************/
/*!
  @brief    Sets the power animation of the ledstrip.
*/
/******************************************************************************/
function setPowerAnimation() {
    let powerAnimation = powerAnimationSelectElem.value;
    
    if (stripOrGroup.power_animation == powerAnimation) {
        return;
    }

    stripOrGroup.power_animation = powerAnimation;
    let url;

    if (groupSelected) {
        url = "/set_ledstrip_group_power_animation";
    } else {
        url = "/set_ledstrip_power_animation";
    }

    let data = {
        id: stripOrGroup.id,
        power_animation: stripOrGroup.power_animation
    };

    pauseRefreshes();
    httpPostRequest(url, data);
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}
//#endregion

//#region Mode Configurations
/******************************************************************************/
/*!
  @brief    Validates and sends updated mode configurations to the back-end.
*/
/******************************************************************************/
function updateModeConfiguration() {
    let index = getIndexFromId(modeConfigs, selectedModeConfigId);

    let data = {
        mode_id: selectedModeConfigId,
        parameters: []
    };

    if (groupSelected) {
        data.group_id = stripOrGroup.id;
    } else {
        data.device_id = sensorOrGroupId;
    }

    let color1Element = undefined;
    let color2Element = undefined;
    let color1Gradient = false;
    let color2Gradient = false;
    let success = true;

    for (let parameter of modeConfigs[index].parameters) {
        if (parameter.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
            parameter.type = MODE_PARAMETER_TYPE_CHECKBOX;
        }
        
        console.log(parameter)
        switch(parameter.type) {
            case MODE_PARAMETER_TYPE_COLOR_RANGE:
                /* Only on first (min) element */
                if (parameter.name == PARAMETER_NAME_MIN_COLOR_POS) {
                    parameter.value = parseInt(document.getElementById(parameter.name + "MinimumRange").value);
                } else if (parameter.name == PARAMETER_NAME_MAX_COLOR_POS) {
                    parameter.value = parseInt(document.getElementById(parameter.name + "MaximumRange").value);
                }

                data.parameters.push(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_COLOR:
                if (parameter.name == PARAMETER_NAME_COLOR1) {
                    color1Element = document.getElementById(parameter.name + "Color");
                    parameter.value = color1Element.value;
                } else if (parameter.name == PARAMETER_NAME_COLOR2) {
                    color2Element = document.getElementById(parameter.name + "Color");
                    parameter.value = color2Element.value;
                }

                data.parameters.push(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_CHECKBOX:
                if (parameter.name == PARAMETER_NAME_USE_GRADIENT1) {
                    color1Gradient = document.getElementById(parameter.name + "Cb").checked;
                    parameter.value = +color1Gradient;
                } else if (parameter.name == PARAMETER_NAME_USE_GRADIENT2) {
                    color2Gradient = document.getElementById(parameter.name + "Cb").checked;
                    parameter.value = +color2Gradient;
                } else {
                    parameter.value = document.getElementById(parameter.name + "Cb").checked;
                }
                
                data.parameters.push(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_RANGE:
                parameter.value = parseInt(document.getElementById(parameter.name + "Range").value);
                data.parameters.push(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_SELECT:
                parameter.value = parseInt(document.getElementById(parameter.name + "Select").value);
                data.parameters.push(parameter);
                break;
            
            default:
                console.error("Parameter type " + parameter.type + " not found")
        }
    }

    if (validateColors(color1Element, color2Element, color1Gradient, color2Gradient)) {
        success = true;
    } else {
        success = false;
    }

    if (!success) {
        return;
    }
    
    let url;
    if (groupSelected) {
        url = "/config_group_mode";
    } else {
        url = "/config_mode";
    }

    httpPostRequest(url, data, true);
    setMode(selectedModeConfigId);
}

/******************************************************************************/
/*!
  @brief    Validates and sends updated mode configurations to the back-end.
  @param    color1Element       Color 1 DOM element
  @param    color2Element       Color 2 DOM element
  @param    color1Gradient      If true, a gradient will be used for color 1
  @param    color2Gradient      If true, a gradient will be used for color 2
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateColors(color1Element, color2Element, color1Gradient, color2Gradient) {
    /* Reset field errors */
    errorMessageModeConfigurationFieldElem.style.display = "none";

    if (color1Element == undefined || color2Element == undefined) {
        return true;
    }
    
    color1Element.classList.remove("invalid-input");
    color2Element.classList.remove("invalid-input");

    /* If one is gradient, colors can be the same*/
    if (color1Gradient || color2Gradient) {
        return true;
    }
    
    /* Validate colors */
    if (color1Element.value == color2Element.value) {
        color1Element.classList.add("invalid-input");
        color2Element.classList.add("invalid-input");
        errorMessageModeConfigurationFieldElem.textContent = TEXT_FIELD_SAME_COLOR;
        errorMessageModeConfigurationFieldElem.style.display = "block";
        return false;
    }

    return true;
}
//#endregion

//#region Generate mode configuration input elements
/******************************************************************************/
/*!
  @brief    Generates a color range DOM element.
  @param    minimumParameter    Minimum value
  @param    maximumParameter    Maximum value
*/
/******************************************************************************/
function generateColorRangeElement(minimumParameter, maximumParameter) {
    let container;
    let container2;
    let title;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.id = minimumParameter.name + "Container";
    container.style.width = "100%";
    container.style.maxWidth = "none";

    /* Title */
    title = document.createElement("p");
    title.id = minimumParameter.name + "Title";
    title.className = "range-title";
    title.textContent = minimumParameter.human_friendly_name;
    title.style.marginBottom = "2px";
    container.appendChild(title);

    container2 = document.createElement("div");
    container2.className = "multi-range-slider";

    /* Min band */
    input = document.createElement("input");
    input.id = minimumParameter.name + "MinimumRange";
    input.className = "multi-range minimum-multi-range";
    input.type = "range";
    input.min = minimumParameter.minimum_value;
    input.max = minimumParameter.maximum_value;
    input.setAttribute("onchange", "setColorBand('" + minimumParameter.name + "MinimumRange', '" + maximumParameter.name + "MaximumRange');");
    input.setAttribute("oninput", "loadColorPosRangeFieldMax('" + minimumParameter.name + "MinimumRange', '" + maximumParameter.name + "MaximumRange');");
    input.style.width = "81%";
    container2.appendChild(input);
    container.appendChild(container2);

    /* Max band */
    input = document.createElement("input");
    input.id = maximumParameter.name + "MaximumRange";
    input.className = "multi-range maximum-multi-range";
    input.type = "range";
    input.min = maximumParameter.minimum_value;
    input.max = maximumParameter.maximum_value;
    input.setAttribute("onchange", "setColorBand('" + minimumParameter.name + "MinimumRange', '" + maximumParameter.name + "MaximumRange');");
    input.setAttribute("oninput", "loadColorPosRangeFieldMin('" + minimumParameter.name + "MinimumRange', '" + maximumParameter.name + "MaximumRange');");
    input.style.width = "81%";
    container2.appendChild(input);

    configurationVariablesContainerElem.appendChild(container);

    document.getElementById(minimumParameter.name + "MinimumRange").value = minimumParameter.value;
    document.getElementById(maximumParameter.name + "MaximumRange").value = maximumParameter.value;

    loadColorRangeField(minimumParameter.name + "MinimumRange", maximumParameter.name + "MaximumRange");
}

/******************************************************************************/
/*!
  @brief    Generates a range DOM element.
  @param    parameter           Mode configuration parameter object
*/
/******************************************************************************/
function generateRangeElement(parameter) {
    let container;
    let title;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.id = parameter.name + "Container";
    container.className = "input-field-container";
    container.style.width = "100%";
    container.style.maxWidth = "none";

    /* Title */
    title = document.createElement("p");
    title.id = parameter.name + "RangeField";
    title.className = "range-title";
    title.textContent = parameter.human_friendly_name;
    container.appendChild(title);

    /* Range */
    input = document.createElement("input");
    input.id = parameter.name + "Range";
    input.type = "range";
    input.min = parameter.minimum_value;
    input.max = parameter.maximum_value;
    input.setAttribute("oninput", "updateRangeField('" + parameter.name + "RangeField', '" + parameter.name + "Range', '" + parameter.human_friendly_name + "');");
    input.setAttribute("onchange", "updateModeConfiguration();");
    container.appendChild(input);

    configurationVariablesContainerElem.appendChild(container);

    document.getElementById(parameter.name + "Range").value = parameter.value;
    updateRangeField(parameter.name + "RangeField", parameter.name + "Range", parameter.human_friendly_name);
}

/******************************************************************************/
/*!
  @brief    Generates a range DOM element.
  @param    colorParameter      Mode configuration color parameter object
  @param    gradientParameter   Mode configuration gradient parameter object
*/
/******************************************************************************/
function generateColorElement(colorParameter, gradientParameter) {
    let container;
    let container2;
    let title;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.id = colorParameter.name + "Container";
    container.className = "color-checkbox-container";

    /* Color */
    container2 = document.createElement("div");
    container2.className = "input-field-container color-container";

    title = document.createElement("p");
    title.id = colorParameter.name + "Title";
    title.className = "input-field-title gradient-background";
    title.textContent = colorParameter.human_friendly_name;
    title.style.margin = "0px auto";
    container2.appendChild(title);

    input = document.createElement("input");
    input.id = colorParameter.name + "Color";
    input.type = "color";
    input.value = colorParameter.value;
    input.className = "input-field";
    input.setAttribute("onchange", "updateModeConfiguration();");
    container2.appendChild(input);
    container.appendChild(container2);

    
    /* Gradient */
    container2 = document.createElement("div");
    container2.id = gradientParameter.name + "Container";

    input = document.createElement("input");
    input.id = gradientParameter.name + "Cb";
    input.type = "checkbox";
    input.checked = gradientParameter.value;
    input.setAttribute("onclick", "updateModeConfiguration();");
    container2.appendChild(input);

    title = document.createElement("p");
    title.id = gradientParameter.name + "Title";
    title.textContent = gradientParameter.human_friendly_name;
    container2.appendChild(title);
    container.appendChild(container2);

    configurationVariablesContainerElem.appendChild(container);
}

/******************************************************************************/
/*!
  @brief    Generates a range DOM element.
  @param    colorParameter      Mode configuration color parameter object
  @param    gradientParameter   Mode configuration gradient parameter object
*/
/******************************************************************************/
//function generateCheckboxElement(parameter, generateContainer=true) {
//    console.error("NOT USED")
//    return
//    let container;
//    let container2;
//    let title;
//    let input;
//
//    /* Main container */
//    if (generateContainer) {
//        container = document.createElement("div");
//        container.id = parameter.name + "Container";
//        container.className = "color-checkbox-container";
//    }
//
//    /* checkbox */
//    container2 = document.createElement("div");
//    container2.id = parameter.name + "Container";
//
//    input = document.createElement("input");
//    input.id = parameter.name + "Cb";
//    input.type = "checkbox";
//    input.checked = parameter.value;
//    input.setAttribute("onclick", "updateModeConfiguration();");
//    container2.appendChild(input);
//
//    title = document.createElement("p");
//    title.id = parameter.name + "Title";
//    title.textContent = parameter.human_friendly_name;
//    container2.appendChild(title);
//    container.appendChild(container2);
//
//    if (generateContainer) {
//        configurationVariablesContainerElem.appendChild(container);
//    }
//}



/******************************************************************************/
/*!
  @brief    Generates a direction checkbox DOM element.
  @param    parameter           Mode configuration parameter object
*/
/******************************************************************************/
function generateDirectionCheckboxElement(parameter) {
    let container;
    let title;
    let label;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.id = parameter.name + "Container";
    container.className = "input-field-container";
    container.style.width = "100%";
    container.style.maxWidth = "none";

    /* Title */
    title = document.createElement("p");
    title.id = parameter.name + "Title";
    title.className = "range-title";
    title.textContent = parameter.human_friendly_name;
    container.appendChild(title);

    /* Switch */
    label = document.createElement("label");
    label.className = "switch";
    
    input = document.createElement("input");
    input.id = parameter.name + "Cb";
    input.type = "checkbox";
    input.checked = parameter.value;
    input.setAttribute("onchange", "updateModeConfiguration();");
    label.appendChild(input);

    input = document.createElement("span");
    input.className = "slider round no-color";
    label.appendChild(input);
    container.appendChild(label);

    configurationVariablesContainerElem.appendChild(container);
}

/******************************************************************************/
/*!
  @brief    Generates a select DOM element.
  @param    parameter           Mode configuration parameter object
*/
/******************************************************************************/
function generateSelectElement(parameter) {
    let container;
    let title;
    let input;

    /* Main container */
    container = document.createElement("div");
    container.id = parameter.name + "Container";
    container.className = "input-field-container";

    /* Title */
    title = document.createElement("p");
    title.id = parameter.name + "Title";
    title.className = "input-field-title gradient-background";
    title.textContent = parameter.human_friendly_name;
    container.appendChild(title);

    /* Select */
    input = document.createElement("select");
    input.id = parameter.name + "Select";
    input.className = "input-field";
    input.value = parameter.value;
    input.setAttribute("onchange", "updateModeConfiguration();");
    container.appendChild(input);

    configurationVariablesContainerElem.appendChild(container);

    loadPaletteSelectOptions(parameter.name + "Select");
    document.getElementById(parameter.name + "Select").value = parameter.value;
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
    basicsTitleElem.textContent = TEXT_BASICS;
    colorTitleElem.textContent = TEXT_COLOR;
    brightnessTitleElem.textContent = TEXT_BRIGHTNESS;
    selectModeTitleElem.textContent = TEXT_SELECT_MODE;
    powerAnimationSelectTitleElem.textContent = TEXT_SELECT_POWER_ANIMATION;
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip color palette select options.
  @param    elementId           ID of the DOM element
*/
/******************************************************************************/
function loadPaletteSelectOptions(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = "";

    for (let palette of palettes) {
        let option = document.createElement("option");
        option.value = palette.value;
        option.text = palette.name;
        
        element.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip power animation select options.
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
  @brief    Loads the mode configuration modal of the specified mode.
  @param    id                  Mode ID
*/
/******************************************************************************/
function loadModeConfigurationModal(id) {
    if (configurationDialogOpen) {
        return;
    }

    selectedModeConfigId = id;
    
    /* Reset error styling */
    errorMessageModeConfigurationFieldElem.style.display = "none";
    configurationVariablesContainerElem.innerHTML = "";
    let configuration = modeConfigs[getIndexFromId(modeConfigs, id)];
    let parameter;

    configurationModalTitleElem.textContent = VAR_TEXT_CONFIGURE_MODE(configuration.name);
    console.log(configuration)

    for (let parameterName of MODE_PARAMETERS) {
        if (!configurationHasParameter(configuration, parameterName)) {
            continue;
        }

        parameter = getConfigParameter(configuration, parameterName);

        switch(parameter.type) {
            case MODE_PARAMETER_TYPE_COLOR_RANGE:
                /* Only on first (min) element */
                if (parameterName == PARAMETER_NAME_MIN_COLOR_POS) {
                    minimumColorBand = getConfigParameter(configuration, parameterName).value;
                    maximumColorBand = getConfigParameter(configuration, PARAMETER_NAME_MAX_COLOR_POS).value;
                    generateColorRangeElement(getConfigParameter(configuration, parameterName), getConfigParameter(configuration, PARAMETER_NAME_MAX_COLOR_POS));
                }
                break;
                
            case MODE_PARAMETER_TYPE_COLOR:
                if (parameterName == PARAMETER_NAME_COLOR1) {
                    generateColorElement(getConfigParameter(configuration, parameterName), getConfigParameter(configuration, PARAMETER_NAME_USE_GRADIENT1));
                } else {
                    generateColorElement(getConfigParameter(configuration, parameterName), getConfigParameter(configuration, PARAMETER_NAME_USE_GRADIENT2));
                }
                break;
                
            case MODE_PARAMETER_TYPE_CHECKBOX:
                
                break;
                
            case MODE_PARAMETER_TYPE_RANGE:
                generateRangeElement(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX:
                generateDirectionCheckboxElement(parameter);
                break;
                
            case MODE_PARAMETER_TYPE_SELECT:
                generateSelectElement(parameter);
                break;
            
            default:
                console.error("Parameter type " + parameter.type + " not found")
        }
    }

    configurationDialogOpen = true;
    configurationModalElem.show();
    configurationModalElem.classList.add("show");
}

/******************************************************************************/
/*!
  @brief    Loads the states to front-end.
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

/******************************************************************************/
/*!
  @brief    Updates button classes to see which mode is selected.
*/
/******************************************************************************/
function loadModeButtons() {
    let tile;
    let grid;
    let icon;

    modeButtonContainerElem.innerHTML = "";

    /* Create real-time drawing tile */
    tile = document.createElement("div");
    tile.id = "modeBtn" + MODE_DRAWING;
    tile.className = "tile single dark-shadow";
    tile.setAttribute("onclick", "setMode(" + MODE_DRAWING + ");");

    grid = document.createElement("div");
    title = document.createTextNode(TEXT_REALTIME_COLORING);

    grid.appendChild(title);
    tile.appendChild(grid);

    modeButtonContainerElem.appendChild(tile);

    for (let mode of modeConfigs) {
        tile = document.createElement("div");
        tile.id = "modeBtn" + mode.id;
        tile.className = "tile single dark-shadow";
        if (mode.id == stripOrGroup.mode) {
            tile.className = "tile single dark-shadow tile-selected";
        }

        tile.setAttribute("onclick", "setMode(" + mode.id + ");");

        grid = document.createElement("div");
        title = document.createTextNode(mode.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        if (mode.id != MODE_COLOR) {
            grid.style.backgroundColor = "var(--background5)";
            grid.style.padding = "8px";
            grid.style.borderRadius = "50px";
            icon = document.createElement("i");
            icon.setAttribute("onclick", "loadModeConfigurationModal(" + mode.id + ");")
            icon.className = "fa-duotone fa-solid fa-sliders fa-xl";
            grid.appendChild(icon);
        }

        tile.appendChild(grid);

        modeButtonContainerElem.appendChild(tile);
    }
}
//#endregion

//#region Update fields
/******************************************************************************/
/*!
  @brief    Loads the ledstrip color range.
  @param    minimumRangeElementId   ID of the minimum range DOM element
  @param    maximumRangeElementId   ID of the maximum range DOM element
*/
/******************************************************************************/
function loadColorRangeField(minimumRangeElementId, maximumRangeElementId) {
    updateColorRangeSlider(minimumRangeElementId, maximumRangeElementId);
}

/******************************************************************************/
/*!
  @brief    Validates and updates the color range minimum value.
  @param    minimumRangeElementId   ID of the minimum range DOM element
  @param    maximumRangeElementId   ID of the maximum range DOM element
*/
/******************************************************************************/
function loadColorPosRangeFieldMin(minimumRangeElementId, maximumRangeElementId) {
    const minColorPosRangeElem = document.getElementById(minimumRangeElementId);
    const maxColorPosRangeElem = document.getElementById(maximumRangeElementId);
    minimumColorBand = parseInt(minColorPosRangeElem.value);
    maximumColorBand = parseInt(maxColorPosRangeElem.value);

    if (minimumColorBand > maximumColorBand - 1) {
        minimumColorBand = maximumColorBand - 1;
        minColorPosRangeElem.value = minimumColorBand;
    }

    loadColorRangeField(minimumRangeElementId, maximumRangeElementId);
}

/******************************************************************************/
/*!
  @brief    Validates and updates the color range maximum value.
  @param    minimumRangeElementId   ID of the minimum range DOM element
  @param    maximumRangeElementId   ID of the maximum range DOM element
*/
/******************************************************************************/
function loadColorPosRangeFieldMax(minimumRangeElementId, maximumRangeElementId) {
    const minColorPosRangeElem = document.getElementById(minimumRangeElementId);
    const maxColorPosRangeElem = document.getElementById(maximumRangeElementId);
    minimumColorBand = parseInt(minColorPosRangeElem.value);
    maximumColorBand = parseInt(maxColorPosRangeElem.value);

    /* If */
    if (maximumColorBand < minimumColorBand + 1) {
        maximumColorBand = minimumColorBand + 1;
        maxColorPosRangeElem.value = maximumColorBand;
    }

    loadColorRangeField(minimumRangeElementId, maximumRangeElementId);
}

/******************************************************************************/
/*!
  @brief    Updates the specified range field text.
  @param    rangeFieldElementId     ID of the range field DOM element
  @param    rangeElementId          ID of the range DOM element
  @param    text                    Text to set
*/
/******************************************************************************/
function updateRangeField(rangeFieldElementId, rangeElementId, text) {
    const rangeFieldElement = document.getElementById(rangeFieldElementId);
    const rangeElement = document.getElementById(rangeElementId);

    rangeFieldElement.textContent = text.replace("?", rangeElement.value);
}

/******************************************************************************/
/*!
  @brief    Sets the color band.
  @param    minimumRangeElementId   ID of the minimum range DOM element
  @param    maximumRangeElementId   ID of the maximum range DOM element
*/
/******************************************************************************/
function setColorBand(minimumRangeElementId, maximumRangeElementId) {
    const minColorPosRangeElem = document.getElementById(minimumRangeElementId);
    const maxColorPosRangeElem = document.getElementById(maximumRangeElementId);
    minimumColorBand = minColorPosRangeElem.value;
    maximumColorBand = maxColorPosRangeElem.value;
    updateModeConfiguration();
}

/******************************************************************************/
/*!
  @brief    Updates the color position range slider element.
  @param    minimumRangeElementId   ID of the minimum range DOM element
  @param    maximumRangeElementId   ID of the maximum range DOM element
*/
/******************************************************************************/
function updateColorRangeSlider(minimumRangeElementId, maximumRangeElementId) {
    const minColorPosRangeElem = document.getElementById(minimumRangeElementId);
    const maxColorPosRangeElem = document.getElementById(maximumRangeElementId);
    let sliderColor = "var(--background2)";

    let rangeDistance = maxColorPosRangeElem.max - maxColorPosRangeElem.min;
    let fromValue = Number(minColorPosRangeElem.value);
    let toValue = Number(maxColorPosRangeElem.value);
    let fromPosition = fromValue - maxColorPosRangeElem.min;
    let toPosition = toValue - maxColorPosRangeElem.min;

    let correctedRange = 98;                                                    //Range for color 98, otherwise background color will be aside of the thumb

    let percentageFrom = ((fromPosition) / rangeDistance) * 100;
    let percentageTo = ((toPosition) / rangeDistance) * 100;

    let correctedFrom = ((percentageFrom * correctedRange) / 100) + 1;
    let correctedTo = ((percentageTo * correctedRange) / 100) + 1;

    // Genereer een gradient over de geselecteerde waarde-range
    let steps = 100; // Meer = vloeiender
    let gradientParts = [];

    // Start met slider background tot begin bereik
    gradientParts.push(`${sliderColor} 0%`);
    gradientParts.push(`${sliderColor} ${correctedFrom}%`);

    for (let i = 0; i <= steps; i++) {
        let pos = fromValue + ((toValue - fromValue) * i / steps);
        let color = colorWheel(parseInt(pos % 256));
        let percent = correctedFrom + ((correctedTo - correctedFrom) * (i / steps));
        gradientParts.push(`${color} ${percent}%`);
    }

    // Eindig met slider background na bereik
    gradientParts.push(`${sliderColor} ${correctedTo}%`);
    gradientParts.push(`${sliderColor} 100%`);

    maxColorPosRangeElem.style.background = `linear-gradient(to right, ${gradientParts.join(', ')})`;
}
//#endregion

//#region Interval update requests
/******************************************************************************/
/*!
  @brief    Asynchronous interval function for fetching the ledstrips states
            from the back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    if (configurationModalElem.classList.contains("show")) {
        isFetchingStates = false;
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        var response = await fetch("get_ledstrips?id=" + stripOrGroup.id, {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchStates);
        return;
    }

    let data = await response.json();
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }
    stripOrGroup = data;
    loadStates();

    setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
  @brief    Pauses back-end refresh intervals for the specified amount of time.
  @param    seconds             Seconds to pause
*/
/******************************************************************************/
function pauseRefreshes(seconds=2) {
    isFetchingStates = false;
    setTimeout(function() {isFetchingStates = true}, seconds*1000);
}
//#endregion

//#region Others
/******************************************************************************/
/*!
  @brief    Returns the specified mode configuration parameter.
  @param    configuration       Mode configuration object
  @param    name                Parameter name
  @returns  object              Mode configuration parameter
*/
/******************************************************************************/
function getConfigParameter(configuration, name) {
    for (let parameter of configuration.parameters) {
        if (parameter.name == name) {
            return parameter;
        }
    }
}

/******************************************************************************/
/*!
  @brief    Returns wheter the configuration has the specified parameter.
  @param    configuration       Mode configuration object
  @param    name                Parameter name
  @returns  bool                True if present
*/
/******************************************************************************/
function configurationHasParameter(configuration, name) {
    for (let parameter of configuration.parameters) {
        if (parameter.name == name) {
            return true;
        }
    }

    return false;
}

/******************************************************************************/
/*!
  @brief    Updates button classes to see which mode and power animations is
            selected.
*/
/******************************************************************************/
function updateModeButtons() {
    /* Reset all button classes */
    for (let mode of modeConfigs) {
        document.getElementById("modeBtn" + mode.id).className = "tile single dark-shadow";
    }
    document.getElementById("modeBtn" + MODE_DRAWING).className = "tile single dark-shadow";
    
    document.getElementById("modeBtn" + stripOrGroup.mode).className = "tile single dark-shadow tile-selected";
}
//#endregion
//#endregion
