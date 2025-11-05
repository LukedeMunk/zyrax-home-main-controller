/******************************************************************************/
/*
 * File:    automations_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the automations page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const modalTitleElem = document.getElementById("modalTitle");
const nameTitleElem = document.getElementById("nameTitle");
const triggerTitleElem = document.getElementById("triggerTitle");
const preconditionsTitleElem = document.getElementById("preconditionsTitle");
const activationTimeTitleElem = document.getElementById("activationTimeTitle");

const daysTitleElem = document.getElementById("daysTitle");
const dayTileTitle0Elem = document.getElementById("dayTileTitle0");
const dayTileTitle1Elem = document.getElementById("dayTileTitle1");
const dayTileTitle2Elem = document.getElementById("dayTileTitle2");
const dayTileTitle3Elem = document.getElementById("dayTileTitle3");
const dayTileTitle4Elem = document.getElementById("dayTileTitle4");
const dayTileTitle5Elem = document.getElementById("dayTileTitle5");
const dayTileTitle6Elem = document.getElementById("dayTileTitle6");

const triggerDeviceTitleElem = document.getElementById("triggerDeviceTitle");
const triggerDeviceStateTitleElem = document.getElementById("triggerDeviceStateTitle");
const delayThisAutomationTitleElem = document.getElementById("delayThisAutomationTitle");
const delayInvertedAutomationTitleElem = document.getElementById("delayInvertedAutomationTitle");
const targetDeviceTitleElem = document.getElementById("targetDeviceTitle");
const actionTitleElem = document.getElementById("actionTitle");
const powerTitleElem = document.getElementById("powerTitle");
const timeInvertedActionTitleElem = document.getElementById("timeInvertedActionTitle");
const colorTitleElem = document.getElementById("colorTitle");
const modeTitleElem = document.getElementById("modeTitle");

/* Fields */
const automationValidationMessageFieldElem = document.getElementById("automationValidationMessageField");
const timeWindowRangeFieldElem = document.getElementById("timeWindowRangeField");
const delayTimeRangeFieldElem = document.getElementById("delayTimeRangeField");

/* Buttons */
const submitAutomationBtnElem = document.getElementById("submitAutomationBtn");
const deleteAutomationBtnElem = document.getElementById("deleteAutomationBtn");

/* Icons */

/* Input elements */
const nameTxtElem = document.getElementById("nameTxt");
const triggerSelectElem = document.getElementById("triggerSelect");
const timeWindowToggleElem = document.getElementById("timeWindowToggle");
const timeWindowStartRangeElem = document.getElementById("timeWindowStartRange");
const timeWindowEndRangeElem = document.getElementById("timeWindowEndRange");
const timeWindowTypeToggleElem = document.getElementById("timeWindowTypeToggle");
const timeTxtElem = document.getElementById("timeTxt");
const triggerDeviceStateSelectElem = document.getElementById("triggerDeviceStateSelect");
const delayTimeRangeElem = document.getElementById("delayTimeRange");
const delayThisAutomationCbElem = document.getElementById("delayThisAutomationCb");
const delayInvertedAutomationCbElem = document.getElementById("delayInvertedAutomationCb");
const actionSelectElem = document.getElementById("actionSelect");
const devicePowerSelectElem = document.getElementById("devicePowerSelect");
const copyAutomationInvertedTriggerAndPowerToggleElem = document.getElementById("copyAutomationInvertedTriggerAndPowerToggle");
const timeInvertedActionTxtElem = document.getElementById("timeInvertedActionTxt");
const ledstripColorColorElem = document.getElementById("ledstripColorColor");
const ledstripModeSelectElem = document.getElementById("ledstripModeSelect");

/* Tables */

/* Modals */
const automationModalElem = document.getElementById("automationModal");

/* Other */
const preconditionsContainerElem = document.getElementById("preconditionsContainer");
const timeWindowContainerElem = document.getElementById("timeWindowContainer");
const timeTriggerContainerElem = document.getElementById("timeTriggerContainer");
const triggerDevicesContainerElem = document.getElementById("triggerDevicesContainer");
const triggerDeviceContainerElem = document.getElementById("triggerDeviceContainer");
const delayTimeTogglesContainerElem = document.getElementById("delayTimeTogglesContainer"); 
const targetDeviceContainerWrapElem = document.getElementById("targetDeviceContainerWrap");
const targetDeviceContainerElem = document.getElementById("targetDeviceContainer");
const devicePowerContainerElem = document.getElementById("devicePowerContainer");
const timeInvertedActionContainerElem = document.getElementById("timeInvertedActionContainer");
const ledstripColorContainerElem = document.getElementById("ledstripColorContainer");
const ledstripModeContainerElem = document.getElementById("ledstripModeContainer");

const automationContainerElem = document.getElementById("automationContainer");
//#endregion

//#region Constants
const MINUTES_RANGE_MINIMUM = 1;                                            //At least 1 minute difference
//#endregion

//#region Variables
let targets = [];
let selectedAutomationId;
let lastAutomationData;
let lastMouseButtonPressed;
let timeWindowStartBand;
let timeWindowEndBand;
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();
    loadTiles();
    loadAutomationTriggerSelectOptions();
    loadLedstripModeSelectOptions();
    loadDevicePowerSelectOptions();

    /* Get names of selected group or device */
    for (let automation of automations) {
        automation.device = getName(devices, automation.device);
    }
});

//#region Tile generation
/******************************************************************************/
/*!
  @brief    Generates the automation tiles.
*/
/******************************************************************************/
function loadTiles() {
    automationContainerElem.innerHTML = "";
    let elementIndex = 0;
    let clickFunction;
    let enableFunction;
    let cbElementId;

    /* Automation tiles */
    for (let automation of automations) {
        clickFunction = "loadModal(event, " + automation.id + ");";
        enableFunction = "toggleAutomationEnabled(" + automation.id + ");";
        cbElementId = "automationEnabledCb" + automation.id;

        generateAutomationTile(automation, enableFunction, clickFunction, cbElementId, elementIndex);
        elementIndex++;
    }

    updateEnabledSwitches();
    generateAddTile();
}

/******************************************************************************/
/*!
  @brief    Generates a tile with the specified data.
  @param    automation          Automation object
  @param    enableFunction      Function for toggling enabled
  @param    clickFunction       Function for when clicked on the tile
  @param    cbElementId         ID of the enable toggle checkbox
  @param    tileIndex           Index for the tile
*/
/******************************************************************************/
function generateAutomationTile(automation, enableFunction, clickFunction, cbElementId, tileIndex) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;

    tileContainer = document.createElement("div");
    tileContainer.id = "tile" + tileIndex;
    tileContainer.tagName = "tile";
    tileContainer.className = "tile double-horizontal";
    tileContainer.setAttribute("onclick", clickFunction);
    //tileContainer.style.gridTemplateColumns = "repeat(3, 33%)";

    /* Name */
    tileItem = document.createElement("div");

    tileName = document.createElement("p");
    tileName.textContent = automation.name;
    
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    /* Information section */
    tileItem = document.createElement("div");
    tileItem.style.display = "flex";
    tileItem.style.justifyContent = "flex-end";
    tileItem.style.alignItems = "center";
    tileItem.style.gap = "10px";

    /* Show activation time when timed automation */
    if (automation.trigger == AUTOMATION_TRIGGER_TIMER) {
        tileName = document.createElement("p");
        tileName.textContent = automation.time;

        if (automation.inverted_automation_copy_id != -1) {
            tileName.textContent += " | " + automation.inverted_action_time;
        }
        
        tileItem.appendChild(tileName);
        tileContainer.appendChild(tileItem);
    } else if (automation.time_window_activated) {
        tileName = document.createElement("p");
        tileName.textContent = minutesToHourString(automation.time_window_start_minutes) + " | " + minutesToHourString(automation.time_window_end_minutes);
        
        tileItem.appendChild(tileName);
        tileContainer.appendChild(tileItem);
    }

    /* Icon trigger */
    icon = document.createElement("i");
    icon.className = getIconFromTrigger(automation.trigger);
    
    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    /* Icon action */
    icon = document.createElement("i");
    icon.className = getIconFromAction(automation.action);
    icon.title = VAR_TEXT_AUTOMATION_ACTION(automation.action);

    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    /* Icon inverted automation enabled */
    if (automation.inverted_automation_copy_id != -1) {
        icon = document.createElement("i");
        icon.className = "fa-solid fa-book-copy";
        icon.title = TEXT_INVERTED_AUTOMATION_ENABLED;

        tileItem.appendChild(icon);
        tileContainer.appendChild(tileItem);
    }
    
    /* Description */
    tileItem = document.createElement("div");

    tileName = document.createElement("p");
    tileName.textContent = VAR_TEXT_AUTOMATION_ACTION(automation.action);
    
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    /* Switch */
    tileItem =  document.createElement("label");
    tileItem.className = "switch";
    tileItem.style.marginRight = "-7px";
    tileItem.style.marginLeft = "auto";

    let cbInput = document.createElement("input");
    cbInput.type = "checkbox";
    cbInput.name = cbElementId;
    cbInput.id = cbElementId;
    cbInput.setAttribute("onclick", enableFunction);

    let span = document.createElement("span");
    span.className = "slider round";
    span.style.transform = "scale(0.8)";
    
    tileItem.appendChild(cbInput);
    tileItem.appendChild(span);
    tileContainer.appendChild(tileItem);

    automationContainerElem.appendChild(tileContainer);
}

/******************************************************************************/
/*!
  @brief    Generates an add automation tile.
*/
/******************************************************************************/
function generateAddTile() {
    let tileItem;
    let icon;
    let tileContainer;

    tileContainer = document.createElement("div");
    tileContainer.id = "tile-add";
    tileContainer.tagName = "tile";
    tileContainer.className = "tile double-horizontal";
    tileContainer.setAttribute("onclick", "loadModal(event);");
    tileContainer.title = TEXT_ADD_AUTOMATION;

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";
    tileItem.style.gridRow = "span 2";
    tileItem.style.textAlign = "center";
    icon = document.createElement("i");
    icon.className = "fa-duotone fa-solid fa-plus fa-2x";

    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    automationContainerElem.appendChild(tileContainer);
}

/******************************************************************************/
/*!
  @brief    Updates automation enabled states.
*/
/******************************************************************************/
function updateEnabledSwitches() {
    for (let automation of automations) {
        document.getElementById("automationEnabledCb" + automation.id).checked = automation.enabled;
    }
}
//#endregion

//#region Automation configuration
/******************************************************************************/
/*!
  @brief    Adds an automation when valid.
*/
/******************************************************************************/
function addAutomation() {
    if (!validateAutomationInput()) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_automation", lastAutomationData, false, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        automationValidationMessageFieldElem.className = "message error";
        automationValidationMessageFieldElem.style.display = "inline-block";
        automationValidationMessageFieldElem.textContent = result.message;
        return;
    }

    updateAutomationSuccess(result);
    loadTiles();
}

/******************************************************************************/
/*!
  @brief    Updates the specified automation.
  @param    id                  Automation ID
*/
/******************************************************************************/
function updateAutomation(id) {
    if (!validateAutomationInput(id)) {
        return;
    }

    let result = httpPostRequestJsonReturn("/update_automation", lastAutomationData, false, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        automationValidationMessageFieldElem.className = "message error";
        automationValidationMessageFieldElem.style.display = "inline-block";
        automationValidationMessageFieldElem.textContent = result.message;
        return;
    }

    updateAutomationSuccess(result);
    loadTiles();
}

/******************************************************************************/
/*!
  @brief    Deletes the specified automation.
  @param    id                  Automation ID
*/
/******************************************************************************/
function deleteAutomation(id) {
    if (!confirm(TEXT_Q_DELETE_AUTOMATION)) {
        return;
    }

    httpPostRequest("/delete_automation", {id : id});

    automations.splice(getIndexFromId(automations, id), 1);

    automationModalElem.close();

    loadTiles();
}

/******************************************************************************/
/*!
  @brief    Handles the server response for updating or adding automations.
  @param    result              Server response to handle
*/
/******************************************************************************/
function updateAutomationSuccess(result) {
    /* New automation */
    if (lastAutomationData.id == -1) {
        lastAutomationData.id = result.message.id;       
        automations.push(lastAutomationData);
        showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
        closeModal(automationModalElem);
        return;
    }

    for (let i in automations) {
        if (automations[i].id != lastAutomationData.id) {
            continue;
        }

        automations[i].name = lastAutomationData.name;
        automations[i].action = lastAutomationData.action;
        automations[i].parameters = lastAutomationData.parameters;
        automations[i].trigger = lastAutomationData.trigger;
        automations[i].target_device_ids = lastAutomationData.target_device_ids;
        automations[i].inverted_automation_copy_id = lastAutomationData.inverted_automation_copy_id;

        if (automations[i].trigger == AUTOMATION_TRIGGER_TIMER) {
            automations[i].days = lastAutomationData.days;
            automations[i].time = lastAutomationData.time;
            automations[i].inverted_action_time = lastAutomationData.inverted_action_time;
        } else {
            automations[i].time_window_activated = lastAutomationData.time_window_activated;
            automations[i].activate_during_time_window = lastAutomationData.activate_during_time_window;

            if (lastAutomationData.time_window_activated) {
                automations[i].time_window_start_minutes = lastAutomationData.time_window_start_minutes;
                automations[i].time_window_end_minutes = lastAutomationData.time_window_end_minutes;
            }
            
            automations[i].trigger_device_ids = lastAutomationData.trigger_device_ids;
            automations[i].trigger_state = lastAutomationData.trigger_state;
            automations[i].delay_minutes = lastAutomationData.delay_minutes;
            automations[i].inverted_delay_minutes = lastAutomationData.inverted_delay_minutes;
        }

        break;
    }

    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    closeModal(automationModalElem);
}
//#endregion

//#region Getters
/******************************************************************************/
/*!
  @brief    Returns the selected target devices.
  @param    type                Device type
  @returns  array               List with target device objects
*/
/******************************************************************************/
function getSelectedTargetDevices(type=undefined) {
    let targets = [];
    for (let device of devices) {
        if (type != undefined && device.type != type) {
            continue;
        }
        const tileElem = document.getElementById("targetDeviceTile" + device.id);
        if (tileElem != undefined && tileElem.classList.contains("tile-selected")) {
            targets.push(device)
        }
    }

    return targets;
}

/******************************************************************************/
/*!
  @brief    Returns the selected target device IDs.
  @returns  array               List with target device IDs
*/
/******************************************************************************/
function getSelectedTargetDeviceIds() {
    let targets = [];
    for (let device of devices) {
        const tileElem = document.getElementById("targetDeviceTile" + device.id);
        if (tileElem != undefined && tileElem.classList.contains("tile-selected")) {
            targets.push(device.id)
        }
    }

    return targets;
}

/******************************************************************************/
/*!
  @brief    Returns the selected trigger device IDs.
  @returns  array               List with trigger device IDs
*/
/******************************************************************************/
function getSelectedTriggerDeviceIds() {
    let triggerDeviceIds = [];
    for (let device of devices) {
        if (device.type != DEVICE_TYPE_RF_DEVICE) {
            continue;
        }
        const tileElem = document.getElementById("triggerDeviceTile" + device.id);
        if (tileElem != undefined && tileElem.classList.contains("tile-selected")) {
            triggerDeviceIds.push(device.id)
        }
    }

    return triggerDeviceIds;
}

/******************************************************************************/
/*!
  @brief    Returns the icon of the specified action.
  @returns  string              Classname of the icon
*/
/******************************************************************************/
function getIconFromAction(action) {
    for (let icon of AUTOMATION_ICONS) {
        if (icon.action == action) {
            return icon.icon;
        }
    }

    return "";
}

/******************************************************************************/
/*!
  @brief    Returns the icon of the specified trigger.
  @returns  string              Classname of the icon
*/
/******************************************************************************/
function getIconFromTrigger(trigger) {
    for (let icon of TRIGGER_TYPE_ICONS) {
        if (icon.triggerType == trigger) {
            return icon.icon;
        }
    }

    return "";
}

/******************************************************************************/
/*!
  @brief    Returns the name of the specified ID in the specified list
  @param    array               Array to look in
  @param    id                  ID to look for
*/
/******************************************************************************/
function getName(array, id) {
    for (let item of array) {
        if (item.id == id) {
            return item.name;
        }
    }
    return "no_name";
}

/******************************************************************************/
/*!
  @brief    Returns the parameters of the selected action.
  @returns  array               Array with action parameters
*/
/******************************************************************************/
function getActionParameters() {
    let parameters = [];

    if (actionSelectElem.value == AUTOMATION_ACTION_SET_DEVICE_POWER) {
        let parameter = {
            name: "power",
            value: devicePowerSelectElem.value
        }
        parameters.push(parameter);
    }
    if (actionSelectElem.value == AUTOMATION_ACTION_SET_LEDSTRIP_COLOR) {
        let parameter = {
            name: "color",
            value: ledstripColorColorElem.value
        }
        parameters.push(parameter);
    }
    if (actionSelectElem.value == AUTOMATION_ACTION_SET_LEDSTRIP_MODE) {
        let parameter = {
            name: "mode",
            value: ledstripModeSelectElem.value
        }
        parameters.push(parameter);
    }

    return parameters;
}
//#endregion

//#region Update fields
/******************************************************************************/
/*!
  @brief    Updates the delay time field text.
*/
/******************************************************************************/
function updateDelayTimeField() {
    if (delayTimeRangeElem.value == 0) {
        delayTimeRangeFieldElem.textContent = TEXT_AUTOMATION_IMMEDIATELY;
        return;
    }
    delayTimeRangeFieldElem.textContent = VAR_TEXT_AUTOMATION_DELAY_TIME(delayTimeRangeElem.value);
}

/******************************************************************************/
/*!
  @brief    Updates the time window field text.
*/
/******************************************************************************/
function updateTimeWindowRangeField() {
    updateTimeWindowRangeSlider();
    
    if (timeWindowTypeToggleElem.checked) {
        timeWindowRangeFieldElem.textContent = VAR_TEXT_ACTIVE_FROM(minutesToHourString(timeWindowStartBand), minutesToHourString(timeWindowEndBand));
        return;
    }

    timeWindowRangeFieldElem.textContent = VAR_TEXT_INACTIVE_FROM(minutesToHourString(timeWindowStartBand), minutesToHourString(timeWindowEndBand));
}

/******************************************************************************/
/*!
  @brief    Sets the time window band. TODO: can be removed?
*/
/******************************************************************************/
function setTimeWindowBand() {
    //timeWindowStartBand = timeWindowStartRangeElem.value;
    //timeWindowEndBand = timeWindowEndRangeElem.value;
}

/******************************************************************************/
/*!
  @brief    Validates and updates the time window range minimum value.
*/
/******************************************************************************/
function loadTimeWindowRangeFieldStart() {
    timeWindowStartBand = parseInt(timeWindowStartRangeElem.value);
    timeWindowEndBand = parseInt(timeWindowEndRangeElem.value);

    if (timeWindowStartBand > timeWindowEndBand - MINUTES_RANGE_MINIMUM) {
        timeWindowStartBand = timeWindowEndBand - MINUTES_RANGE_MINIMUM;
        timeWindowStartRangeElem.value = timeWindowStartBand;
    }

    updateTimeWindowRangeField();
}

/******************************************************************************/
/*!
  @brief    Validates and updates the time window range maximum value.
*/
/******************************************************************************/
function loadTimeWindowRangeFieldEnd() {
    timeWindowStartBand = parseInt(timeWindowStartRangeElem.value);
    timeWindowEndBand = parseInt(timeWindowEndRangeElem.value);

    /* If */
    if (timeWindowEndBand < timeWindowStartBand + MINUTES_RANGE_MINIMUM) {
        timeWindowEndBand = timeWindowStartBand + MINUTES_RANGE_MINIMUM;
        timeWindowEndRangeElem.value = timeWindowEndBand;
    }

    updateTimeWindowRangeField();
}

/******************************************************************************/
/*!
  @brief    Updates the time window range slider element.
*/
/******************************************************************************/
function updateTimeWindowRangeSlider() {
    let sliderColor = "var(--success-text)";
    let rangeColor = "var(--background2)";

    if (timeWindowTypeToggleElem.checked) {
        sliderColor = "var(--background2)";
        rangeColor = "var(--success-text)";
    }

    let rangeDistance = timeWindowEndRangeElem.max - timeWindowEndRangeElem.min;
    let fromPosition = timeWindowStartRangeElem.value - timeWindowEndRangeElem.min;
    let toPosition = timeWindowEndRangeElem.value - timeWindowEndRangeElem.min;

    let correctedRange = 98;                                                    //Range for color 98, otherwise background color will be aside of the thumb

    let percentageFrom = ((fromPosition)/(rangeDistance)*100);
    let percentageTo = ((toPosition)/(rangeDistance)*100);

    percentageFrom = (((percentageFrom) * correctedRange) / 100) + 1;
    percentageTo = (((percentageTo) * correctedRange) / 100) + 1;

    timeWindowEndRangeElem.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${percentageFrom}%,
      ${rangeColor} ${percentageFrom}%,
      ${rangeColor} ${percentageTo}%, 
      ${sliderColor} ${percentageTo}%,
      ${sliderColor} 100%)`;
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
    nameTitleElem.textContent = TEXT_NAME;
    triggerTitleElem.textContent = TEXT_TRIGGER;
    preconditionsTitleElem.textContent = TEXT_PRECONDITIONS;
    activationTimeTitleElem.textContent = TEXT_ACTIVATION_TIME;
    daysTitleElem.textContent = TEXT_DAYS;
    dayTileTitle0Elem.textContent = TEXT_MONDAY;
    dayTileTitle1Elem.textContent = TEXT_TUESDAY;
    dayTileTitle2Elem.textContent = TEXT_WEDNESDAY;
    dayTileTitle3Elem.textContent = TEXT_THURSDAY;
    dayTileTitle4Elem.textContent = TEXT_FRIDAY;
    dayTileTitle5Elem.textContent = TEXT_SATURDAY;
    dayTileTitle6Elem.textContent = TEXT_SUNDAY;
    triggerDeviceTitleElem.textContent = TEXT_TRIGGER_DEVICES;
    triggerDeviceStateTitleElem.textContent = TEXT_TRIGGER_STATE;
    delayThisAutomationTitleElem.textContent = TEXT_DELAY_THIS_AUTOMATION;
    delayInvertedAutomationTitleElem.textContent = TEXT_DELAY_INVERTED_AUTOMATION;
    targetDeviceTitleElem.textContent = TEXT_TARGET_DEVICES;
    actionTitleElem.textContent = TEXT_ACTION;
    powerTitleElem.textContent = TEXT_POWER;
    colorTitleElem.textContent = TEXT_COLOR;
    modeTitleElem.textContent = TEXT_MODE;
}

/******************************************************************************/
/*!
  @brief    Loads the select options for the device power.
  @param    id                  ID
*/
/******************************************************************************/
function loadDevicePowerSelectOptions() {
    devicePowerSelectElem.innerHTML = "";

    let option;

    option = document.createElement("option");
    option.value = 1;
    option.text = TEXT_ON;
    devicePowerSelectElem.appendChild(option);

    option = document.createElement("option");
    option.value = 0;
    option.text = TEXT_OFF;
    devicePowerSelectElem.appendChild(option);
}

/******************************************************************************/
/*!
  @brief    Loads the automation modal.
  @param    event               Mouse event
  @param    id                  Automation ID
*/
/******************************************************************************/
function loadModal(event, id=undefined) {
    /* If switch is clicked, return */
    if (event instanceof PointerEvent) {
        /* Return when mouseUp is executed */
        if (event.pointerId == -1) {
            return;
        }
    } else {
        if (event.button == lastMouseButtonPressed) {
            lastMouseButtonPressed = undefined;
            return;
        } else {
            lastMouseButtonPressed = event.button;
        }
    }
    /* When switch is clicked, don't redirect */
    if (event.target.className == "switch" || event.target.className == "slider round" || event.target.type == "span") {
        return;
    }

    /* Reset error styling */
    automationValidationMessageFieldElem.className = "message error";
    automationValidationMessageFieldElem.style.display = "none";

    nameTxtElem.classList.remove("invalid-input");
    actionSelectElem.classList.remove("invalid-input");
    triggerSelectElem.classList.remove("invalid-input");
    triggerDeviceStateSelectElem.classList.remove("invalid-input");

    /* If undefined, new automation modal */
    if (id == undefined) {
        selectedAutomationId = undefined;
        modalTitleElem.textContent = TEXT_ADD_AUTOMATION;
        nameTxtElem.value = "";
        triggerSelectElem.selectedIndex = 0;

        preconditionsContainerElem.style.display = "none";
        timeWindowToggleElem.style.display = "none";
        timeWindowToggleElem.checked = false;
        timeWindowToggleElem.textContent = TEXT_ACTIVATE_TIME_WINDOW;
        timeWindowToggleElem.style.color = "var(--success-text)";
        toggleTimeWindowActiveState(true);
        timeWindowStartBand = 0;
        timeWindowEndBand = 1439;
        timeWindowStartRangeElem.value = timeWindowStartBand;
        timeWindowEndRangeElem.value = timeWindowEndBand;
        updateTimeWindowRangeField();
        timeWindowContainerElem.style.display = "none";

        delayTimeRangeElem.value = 0;
        updateDelayTimeField();
        delayTimeTogglesContainerElem.style.display = "none";
        delayThisAutomationCbElem.checked = false;
        delayInvertedAutomationCbElem.checked = false;
        loadTargetDevices();
        actionSelectElem.selectedIndex = 0;
        loadActionSelectOptions();
        loadActionParameters();
        loadTriggerSensorStateOptions();
        timeTxtElem.value = "00:00";

        for (let day = 0; day < DAYS_IN_WEEK; day++) {
            document.getElementById("dayTile" + day).className = "tile single";
        }

        submitAutomationBtnElem.setAttribute("onclick", "addAutomation();");
        deleteAutomationBtnElem.style.display = "none";
        timeTriggerContainerElem.style.display = "none";
        triggerDevicesContainerElem.style.display = "none";

        toggleCopyAutomationInvertedTriggerAndPower(false);
        timeInvertedActionContainerElem.style.display = "none";
        timeInvertedActionTitleElem.textContent = "";
        timeInvertedActionTxtElem.value = "00:00";

        showModal(automationModalElem);
        return;
    }

    let automation = automations[getIndexFromId(automations, id)];
    selectedAutomationId = id;

    modalTitleElem.textContent = TEXT_EDIT_AUTOMATION;
    nameTxtElem.value = automation.name;
    triggerSelectElem.value = automation.trigger;
    loadTargetDevices();
    loadActionSelectOptions();
    loadTrigger();

    if (automation.inverted_automation_copy_id != -1) {
        delayTimeRangeElem.value = Math.max(automation.delay_minutes, automation.inverted_delay_minutes);
    } else {
        delayTimeRangeElem.value = automation.delay_minutes;
    }

    updateDelayTimeField();
    actionSelectElem.value = automation.action;
    loadActionParameters();
    triggerDeviceStateSelectElem.value = automation.trigger_state;
    toggleTimeWindowActiveState(automation.activate_during_time_window);

    if (automation.trigger == AUTOMATION_TRIGGER_TIMER) {
        toggleCopyAutomationInvertedTriggerAndPower(automation.inverted_automation_copy_id != -1);
        preconditionsContainerElem.style.display = "none";
        timeWindowToggleElem.style.display = "none";
        timeTriggerContainerElem.style.display = "block";
        triggerDevicesContainerElem.style.display = "none";
        delayThisAutomationCbElem.checked = false;
        delayInvertedAutomationCbElem.checked = false;
        timeTxtElem.value = automation.time;
        
        if (automation.action == AUTOMATION_ACTION_SET_DEVICE_POWER) {
            if (devicePowerSelectElem.value == 1) {
                timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_OFF;
            } else {
                timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_ON;
            }

            timeInvertedActionContainerElem.style.display = "block";
            timeInvertedActionTxtElem.value = automation.inverted_action_time;
        }
    } else if (automation.trigger == AUTOMATION_TRIGGER_SENSOR) {
        toggleCopyAutomationInvertedTriggerAndPower(automation.inverted_automation_copy_id != -1);
        preconditionsContainerElem.style.display = "block";
        timeWindowToggleElem.style.display = "block";
        timeTriggerContainerElem.style.display = "none";
        triggerDevicesContainerElem.style.display = "block";
        delayThisAutomationCbElem.checked = automation.delay_minutes > 0;
        delayInvertedAutomationCbElem.checked = automation.inverted_delay_minutes > 0;
        timeInvertedActionContainerElem.style.display = "none";
        loadTriggerSensorStateOptions(automation.trigger_device_ids[0]);
    } else if (automation.trigger == AUTOMATION_TRIGGER_SWITCH) {
        toggleCopyAutomationInvertedTriggerAndPower(automation.inverted_automation_copy_id != -1);
        preconditionsContainerElem.style.display = "none";
        timeWindowToggleElem.style.display = "none";
        timeTriggerContainerElem.style.display = "none";
        triggerDevicesContainerElem.style.display = "block";
        delayThisAutomationCbElem.checked = automation.delay_minutes > 0;
        delayInvertedAutomationCbElem.checked = automation.inverted_delay_minutes > 0;
        timeInvertedActionContainerElem.style.display = "none";
        loadTriggerSensorStateOptions(automation.trigger_device_ids[0]);
    }

    timeWindowStartBand = automation.time_window_start_minutes;
    timeWindowEndBand = automation.time_window_end_minutes;
    timeWindowStartRangeElem.value = timeWindowStartBand;
    timeWindowEndRangeElem.value = timeWindowEndBand;
    updateTimeWindowRangeField();

    if (automation.time_window_activated == 1) {
        timeWindowToggleElem.checked = true;
        timeWindowToggleElem.textContent = TEXT_DEACTIVATE_TIME_WINDOW;
        timeWindowToggleElem.style.color = "var(--error-text)";
        timeWindowContainerElem.style.display = "block";
    } else {
        timeWindowToggleElem.checked = false;
        timeWindowToggleElem.textContent = TEXT_ACTIVATE_TIME_WINDOW;
        timeWindowToggleElem.style.color = "var(--success-text)";
        timeWindowContainerElem.style.display = "none";
    }

    submitAutomationBtnElem.setAttribute("onclick", "updateAutomation(" + id + ");");
    deleteAutomationBtnElem.style.display = "inline";
    deleteAutomationBtnElem.setAttribute("onclick", "deleteAutomation(" + id + ");");
    showModal(automationModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the options for the selected automation trigger.
*/
/******************************************************************************/
function loadTrigger() {
    copyAutomationInvertedTriggerAndPowerToggleElem.style.display = "block";
    
    let index = -1;
    if (selectedAutomationId != undefined) {
        index = getIndexFromId(automations, selectedAutomationId);
    } else {
        toggleCopyAutomationInvertedTriggerAndPower(false);
    }

    if (triggerSelectElem.value == AUTOMATION_TRIGGER_TIMER) {
        preconditionsContainerElem.style.display = "none";
        timeWindowToggleElem.style.display = "none";
        timeTriggerContainerElem.style.display = "block";
        triggerDevicesContainerElem.style.display = "none";
        if (index != -1) {
            if (automations[index].time != undefined) {
                timeTxtElem.value = automations[index].time;
            }
            loadDays(selectedAutomationId);
        } else {
            timeTxtElem.value = "";
            loadDays();
        }
    } else if (triggerSelectElem.value == AUTOMATION_TRIGGER_SENSOR) {
        preconditionsContainerElem.style.display = "block";
        timeWindowToggleElem.style.display = "block";
        timeTriggerContainerElem.style.display = "none";
        triggerDevicesContainerElem.style.display = "block";
        loadTriggerDevices();
        loadTriggerSensorStateOptions();
        if (index != -1) {
            triggerDeviceStateSelectElem.value = automations[index].trigger_state;
        }
    } else if (triggerSelectElem.value == AUTOMATION_TRIGGER_SWITCH) {
        preconditionsContainerElem.style.display = "none";
        timeWindowToggleElem.style.display = "none";
        timeTriggerContainerElem.style.display = "none";
        triggerDevicesContainerElem.style.display = "block";
        loadTriggerDevices();
        loadTriggerSensorStateOptions();
        if (index != -1) {
            triggerDeviceStateSelectElem.value = automations[index].trigger_state;
        }
    }

    let targetDevices = getSelectedTargetDevices();
    let selectedAction = actionSelectElem.value;
    loadTargetDevices(targetDevices);
    loadActionSelectOptions(selectedAction);
}

/******************************************************************************/
/*!
  @brief    Loads the action parameters of the selected automation action.
*/
/******************************************************************************/
function loadActionParameters() {
    let index = -1; 
    if (selectedAutomationId != undefined) {
        index = getIndexFromId(automations, selectedAutomationId);
    }

    devicePowerContainerElem.style.display = "none";
    ledstripColorContainerElem.style.display = "none";
    ledstripModeContainerElem.style.display = "none";
    timeInvertedActionContainerElem.style.display = "none";

    if (actionSelectElem.value == AUTOMATION_ACTION_SET_DEVICE_POWER) {
        devicePowerContainerElem.style.display = "block";
        if (selectedAutomationId != undefined && copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            devicePowerSelectElem.value = automations[index].parameters[0].value;

            if (automations[index].trigger == AUTOMATION_TRIGGER_TIMER) {
                if (devicePowerSelectElem.value == 1) {
                    timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_OFF;
                } else {
                    timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_ON;
                }

                timeInvertedActionTxtElem.value = automations[index].inverted_action_time;
                timeInvertedActionContainerElem.style.display = "block";
            }
        } else {
            timeInvertedActionTxtElem.value = "";
        }
    }

    if (actionSelectElem.value == AUTOMATION_ACTION_SET_LEDSTRIP_COLOR) {
        ledstripColorContainerElem.style.display = "block";
        if (selectedAutomationId != undefined) {
            ledstripColorColorElem.value = automations[index].parameters[0].value;
        }
    }
    if (actionSelectElem.value == AUTOMATION_ACTION_SET_LEDSTRIP_MODE) {
        ledstripModeContainerElem.style.display = "block";
        if (selectedAutomationId != undefined) {
            ledstripModeSelectElem.value = automations[index].parameters[0].value;
        }
    }
}

/******************************************************************************/
/*!
  @brief    Loads the inverted action title.
*/
/******************************************************************************/
function loadInvertedActionTitle() {
    if (actionSelectElem.value != AUTOMATION_ACTION_SET_DEVICE_POWER || triggerSelectElem.value != AUTOMATION_TRIGGER_TIMER) {
        return;
    }
    
    if (devicePowerSelectElem.value == 1) {
        timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_OFF;
    } else {
        timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_ON;
    }
}

/******************************************************************************/
/*!
  @brief    Loads the automation trigger select options.
*/
/******************************************************************************/
function loadAutomationTriggerSelectOptions() {
    triggerSelectElem.innerHTML = "";

    let option = document.createElement("option");
    option.value = -1;
    option.text = "";
    triggerSelectElem.appendChild(option);
    
    for (let trigger of AUTOMATION_TRIGGERS) {
        option = document.createElement("option");
        option.value = trigger.id;
        option.text = trigger.name;
        
        triggerSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip mode select options.
*/
/******************************************************************************/
function loadLedstripModeSelectOptions() {
    ledstripModeSelectElem.innerHTML = "";
    
    for (let mode of modes) {
        option = document.createElement("option");
        option.value = mode.id;
        option.text = mode.name;
        
        ledstripModeSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the days of the week.
  @param    id                  Automation ID
*/
/******************************************************************************/
function loadDays(id=undefined) {
    if (id == undefined) {
        for (let day = 0; day < DAYS_IN_WEEK; day++) {
            document.getElementById("dayTile" + day).className = "tile single";
        }
        return;
    }

    let automation = automations[getIndexFromId(automations, id)];

    for (let day = 0; day < DAYS_IN_WEEK; day++) {
        if (automation.days != undefined && automation.days[day] == "1") {
            document.getElementById("dayTile" + day).className = "tile single tile-selected";
        } else {
            document.getElementById("dayTile" + day).className = "tile single";
        }
    }
}

/******************************************************************************/
/*!
  @brief    Loads the action select options.
  @param    loadActionId        ID of the action to be selected
*/
/******************************************************************************/
function loadActionSelectOptions(loadActionId=undefined) {
    actionSelectElem.innerHTML = "";

    let targetDevices = getSelectedTargetDevices();
    let sameDeviceTypes = true;
    if (targetDevices[0] == undefined) {
        let option = document.createElement("option");
        option.value = -1;
        option.text = TEXT_CHOOSE_TARGET_DEVICE_FIRST;
        actionSelectElem.appendChild(option);
        return;
    }

    let type = targetDevices[0].type;

    for (let device of targetDevices) {
        if (type != device.type) {
            sameDeviceTypes = false;
            break;
        }
    }
    
    if (!sameDeviceTypes) {
        automationValidationMessageFieldElem.className = "message warning";
        automationValidationMessageFieldElem.textContent = TEXT_DEVICE_TYPES_DIFFER;
        automationValidationMessageFieldElem.style.display = "inline-block";
    } else {
        automationValidationMessageFieldElem.style.display = "none";
    }

    let option = document.createElement("option");
    option.value = -1;
    option.text = "";
    actionSelectElem.appendChild(option);

    let numberOfActions = 0;
    for (let action of actions) {
        if (!action.device_types.includes(type)) {
            if (loadActionId == action.id) {
                loadActionId = -1;
            }
            continue;
        }
        option = document.createElement("option");
        option.value = action.function;
        option.text = action.name;
        actionSelectElem.appendChild(option);
        numberOfActions++;
    }

    if (numberOfActions == 0) {
        actionSelectElem.innerHTML = "";
        option = document.createElement("option");
        option.value = -1;
        option.text = TEXT_NO_ACTIONS_SUPPORTED;
        actionSelectElem.appendChild(option);
    }

    actionSelectElem.value = loadActionId;
    loadActionParameters();
}

/******************************************************************************/
/*!
  @brief    Loads the target devices as tiles.
  @param    targetDevices       Target devices to load
*/
/******************************************************************************/
function loadTargetDevices(targetDevices=undefined) {
    targetDeviceContainerElem.innerHTML = "";
    let tile;
    let grid;
    let icon;
    let automation;
    if (selectedAutomationId != undefined) {
        automation = automations[getIndexFromId(automations, selectedAutomationId)];
    }

    if (triggerSelectElem.value == -1) {
        targetDeviceContainerWrapElem.style.display = "none";
        return;
    }

    targetDeviceContainerWrapElem.style.display = "block";

    let numberOfTargetDevices = 0;
    for (let device of devices) {
        if (device.category != DEVICE_CATEGORY_LEDSTRIP && device.category != DEVICE_CATEGORY_POWER_OUTLET) {
            continue;
        }

        tile = document.createElement("div");
        tile.id = "targetDeviceTile" + device.id;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";
        if (selectedAutomationId != undefined) {
            for (let i in automation.target_device_ids) {
                if (device.id == automation.target_device_ids[i]) {
                    tile.className = "tile single tile-selected";
                }
            }
        } else if (targetDevices != undefined) {
            for (let target of targetDevices) {
                if (device.id == target.id) {
                    tile.className = "tile single tile-selected";
                }
            }
        }

        tile.setAttribute("onclick", "toggleTargetDeviceSelection(" + device.id + ");");

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(device.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = device.icon + " fa-2x";
        if (MOBILE_VERSION) {
            icon.style.fontSize = "var(--font-size-h3)";
        }
        
        grid.appendChild(icon);
        tile.appendChild(grid);

        targetDeviceContainerElem.appendChild(tile);
        numberOfTargetDevices++;
    }

    if (numberOfTargetDevices == 0) {
        tile = document.createElement("div");
        tile.id = "targetDeviceTile";
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(TEXT_NO_TARGET_DEVICES_AVAILABLE);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = "fa-solid fa-square-xmark fa-xl";

        grid.appendChild(icon);
        tile.appendChild(grid);

        targetDeviceContainerElem.appendChild(tile);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the trigger sensor state options based on the sensor type.
  @parsm    id                  Device ID
*/
/******************************************************************************/
function loadTriggerSensorStateOptions(id=undefined) {
    triggerDeviceStateSelectElem.innerHTML = "";

    let option;

    if (id == undefined) {
        option = document.createElement("option");
        option.value = -1;
        option.text = TEXT_CHOOSE_TRIGGER_DEVICE_FIRST;
        triggerDeviceStateSelectElem.appendChild(option);
        triggerDeviceStateSelectElem.value = -1;
        return;
    }

    let device = devices[getIndexFromId(devices, id)];
    let deviceModel = DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, device.model_id, "model_id")];

    for (let state of deviceModel.states) {
        option = document.createElement("option");
        option.value = state.state;
        option.text = state.name;
        triggerDeviceStateSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the trigger devices as tiles.
*/
/******************************************************************************/
function loadTriggerDevices() {
    triggerDeviceContainerElem.innerHTML = "";
    let tile;
    let grid;
    let icon;
    let automation;
    if (selectedAutomationId != undefined) {
        automation = automations[getIndexFromId(automations, selectedAutomationId)];
    }

    if (triggerSelectElem.value == -1) {
        triggerDevicesContainerElem.style.display = "none";
        return;
    }

    let numberOfTriggerDevices = 0;
    for (let device of devices) {
        if (triggerSelectElem.value == AUTOMATION_TRIGGER_SENSOR) {
            if (device.category != DEVICE_CATEGORY_MOTION_SENSOR && device.category != DEVICE_CATEGORY_DOOR_SENSOR) {
                continue;
            }
        } else if (triggerSelectElem.value == AUTOMATION_TRIGGER_SWITCH) {
            if (device.category != DEVICE_CATEGORY_SWITCH && device.category != DEVICE_CATEGORY_REMOTE) {
                continue;
            }
        }

        tile = document.createElement("div");
        tile.id = "triggerDeviceTile" + device.id;
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";
        if (selectedAutomationId != undefined) {
            for (let i in automation.trigger_device_ids) {
                if (device.id == automation.trigger_device_ids[i]) {
                    tile.className = "tile single tile-selected";
                }
            }
        }

        tile.setAttribute("onclick", "toggleTriggerDeviceSelection(" + device.id + ");");

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(device.name);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = device.icon + " fa-2x";
        if (MOBILE_VERSION) {
            icon.style.fontSize = "var(--font-size-h3)";
        }

        grid.appendChild(icon);
        tile.appendChild(grid);

        triggerDeviceContainerElem.appendChild(tile);
        numberOfTriggerDevices++;
    }

    if (numberOfTriggerDevices == 0) {
        tile = document.createElement("div");
        tile.id = "triggerDeviceTile";
        tile.className = "tile single";
        tile.style.backgroundColor = "var(--background2)";

        grid = document.createElement("div");
        grid.style.gridColumn = "span 2";
        title = document.createTextNode(TEXT_NO_TRIGGER_DEVICES_AVALABLE);

        grid.appendChild(title);
        tile.appendChild(grid);

        grid = document.createElement("div");
        icon = document.createElement("i");
        icon.className = "fa-solid fa-square-xmark fa-xl";

        grid.appendChild(icon);
        tile.appendChild(grid);

        triggerDeviceContainerElem.appendChild(tile);
    }
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the automation input.
  @param    id                  Automation ID
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateAutomationInput(id=-1) {
    /* Get user input */
    let name = nameTxtElem.value;
    let targetDeviceIds = getSelectedTargetDeviceIds();
    let action = actionSelectElem.value;
    let trigger = triggerSelectElem.value;
    let parameters = getActionParameters();

    /* Reset error styling */
    automationValidationMessageFieldElem.className = "message error";
    automationValidationMessageFieldElem.style.display = "none";

    nameTxtElem.classList.remove("invalid-input");
    actionSelectElem.classList.remove("invalid-input");
    triggerSelectElem.classList.remove("invalid-input");
    triggerDeviceStateSelectElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        nameTxtElem.classList.add("invalid-input");
        automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
        automationValidationMessageFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate trigger */
    if (trigger == -1) {
        triggerSelectElem.classList.add("invalid-input");
        automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
        automationValidationMessageFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate target */
    if (targetDeviceIds.length < 1) {
        automationValidationMessageFieldElem.textContent = TEXT_SELECT_AT_LEAST_ONE_TARGET;
        automationValidationMessageFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate action */
    if (action == -1 || action == "") {
        actionSelectElem.classList.add("invalid-input");
        automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
        automationValidationMessageFieldElem.style.display = "inline-block";
        return false;
    }
    
    for (let automation of automations) {
        if (automation.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (automation.name == name) {
            nameTxtElem.classList.add("invalid-input");
            nameTxtElem.focus();
            automationValidationMessageFieldElem.textContent = TEXT_FIELD_UNIQUE;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }
    }
    
    lastAutomationData = {
        id : id,
        name : name,
        trigger : trigger,
        target_device_ids : targetDeviceIds,
        action : action
    }

    if (id == -1) {
        lastAutomationData.enabled = true;
        lastAutomationData.trigger_state = false;
    }

    if (parameters.length > 0) {
        lastAutomationData.parameters = parameters;
    }
    
    if (id != -1) {
        if (action == AUTOMATION_ACTION_SET_DEVICE_POWER) {
            let invertedAutomationCopyId = parseInt(automations[getIndexFromId(automations, id)].inverted_automation_copy_id);
            if (invertedAutomationCopyId == -1 && copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
                lastAutomationData.inverted_automation_copy_id = 9999;    //Temporary (create) id
            } else if (invertedAutomationCopyId != -1 && !copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
                lastAutomationData.inverted_automation_copy_id = -1;
            } else {
                lastAutomationData.inverted_automation_copy_id = invertedAutomationCopyId;    //Temporary (no create) id
            }
        } else {
            lastAutomationData.inverted_automation_copy_id = -1;
        }
    } else {
        if (copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            lastAutomationData.inverted_automation_copy_id = 9999;    //Temporary (create) id
        } else {
            lastAutomationData.inverted_automation_copy_id = -1;
        }
    }
    
    if (trigger == AUTOMATION_TRIGGER_TIMER) {
        let time = timeTxtElem.value;

        /* Validate time */
        if (time == "") {
            timeTxtElem.classList.add("invalid-input");
            automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }

        let days = "";
        /* Get days */
        for (let day = 0; day < DAYS_IN_WEEK; day++) {
            if (document.getElementById("dayTile" + day).classList.contains("tile-selected")) {
                days += "1";
            } else {
                days += "0";
            }
        }

        /* Validate days */
        if (days == "0000000") {
            automationValidationMessageFieldElem.textContent = TEXT_SELECT_ONE_DAY;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }

        lastAutomationData.days = days;
        lastAutomationData.time = time;

        if (copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            let invertedActionTime = timeInvertedActionTxtElem.value;

            /* Validate inverted time */
            if (invertedActionTime == "") {
                timeInvertedActionTxtElem.classList.add("invalid-input");
                automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
                automationValidationMessageFieldElem.style.display = "inline-block";
                return false;
            }

            if (invertedActionTime == time) {
                timeInvertedActionTxtElem.classList.add("invalid-input");
                automationValidationMessageFieldElem.textContent = TEXT_FIELD_UNIQUE;
                automationValidationMessageFieldElem.style.display = "inline-block";
                return false;
            }

            lastAutomationData.inverted_action_time = invertedActionTime;
        }
    } else if (trigger == AUTOMATION_TRIGGER_SENSOR) {
        lastAutomationData.delay_minutes = delayTimeRangeElem.value;
        lastAutomationData.time_window_activated = timeWindowToggleElem.checked;
        lastAutomationData.activate_during_time_window = timeWindowTypeToggleElem.checked;

        /* Check delays with inverted automation */
        if (lastAutomationData.inverted_automation_copy_id != -1) {
            if (delayInvertedAutomationCbElem.checked) {
                lastAutomationData.inverted_delay_minutes = lastAutomationData.delay_minutes;
            } else {
                lastAutomationData.inverted_delay_minutes = 0;
            }

            if (!delayThisAutomationCbElem.checked) {
                lastAutomationData.delay_minutes = 0;
            }
        }

        if (lastAutomationData.time_window_activated) {
            lastAutomationData.time_window_start_minutes = timeWindowStartBand;
            lastAutomationData.time_window_end_minutes = timeWindowEndBand;
        }

        let triggerDeviceIds = getSelectedTriggerDeviceIds();
        let triggerState = triggerDeviceStateSelectElem.value;
        
        /* Validate  */
        if (triggerDeviceIds.length < 1) {
            automationValidationMessageFieldElem.textContent = TEXT_SELECT_AT_LEAST_ONE_TRIGGER;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }

        /* Validate  */
        if (triggerState == "") {
            triggerDeviceStateSelectElem.classList.add("invalid-input");
            automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }
        lastAutomationData.trigger_device_ids = triggerDeviceIds;
        lastAutomationData.trigger_state = +triggerState;
    } else if (trigger == AUTOMATION_TRIGGER_SWITCH) {
        lastAutomationData.delay_minutes = delayTimeRangeElem.value;

        /* Check delays with inverted automation */
        if (lastAutomationData.inverted_automation_copy_id != -1) {
            if (delayInvertedAutomationCbElem.checked) {
                lastAutomationData.inverted_delay_minutes = lastAutomationData.delay_minutes;
            } else {
                lastAutomationData.inverted_delay_minutes = 0;
            }

            if (!delayThisAutomationCbElem.checked) {
                lastAutomationData.delay_minutes = 0;
            }
        }

        let triggerDeviceIds = getSelectedTriggerDeviceIds();
        let triggerState = triggerDeviceStateSelectElem.value;
        
        /* Validate  */
        if (triggerDeviceIds.length < 1) {
            automationValidationMessageFieldElem.textContent = TEXT_SELECT_AT_LEAST_ONE_TRIGGER;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }

        /* Validate  */
        if (triggerState == "") {
            triggerDeviceStateSelectElem.classList.add("invalid-input");
            automationValidationMessageFieldElem.textContent = TEXT_FIELD_REQUIRED;
            automationValidationMessageFieldElem.style.display = "inline-block";
            return false;
        }

        lastAutomationData.trigger_device_ids = triggerDeviceIds;
        lastAutomationData.trigger_state = +triggerState;
    }
    
    return true;
}
//#endregion

//#region Toggle functions
/******************************************************************************/
/*!
  @brief    Toggles the specified trigger device and updates button classes to
            see which device is selected.
  @parsm    id                  Device ID
*/
/******************************************************************************/
function toggleTriggerDeviceSelection(id) {
    const tileElem = document.getElementById("triggerDeviceTile" + id);
    /* Disable */
    if (tileElem.classList.contains("tile-selected")) {
        tileElem.classList.remove("tile-selected");
        let selectedTiles = document.querySelectorAll(".tile-selected");
        if (selectedTiles.length == 0) {
            loadTriggerSensorStateOptions();
        }
        return;
    }

    /* Enable */
    let device = devices[getIndexFromId(devices, id)];
    let selectedTiles = document.querySelectorAll(".tile-selected");
    for (let tile of selectedTiles) {
        /* Only trigger devices */
        if (!tile.id.includes("triggerDeviceTile")) {
            continue;
        }

        let deviceId = parseInt(tile.id.replace("triggerDeviceTile", ""));
        let tileDevice = devices[getIndexFromId(devices, deviceId)];
        console.log(tile.id)
        if (tileDevice.category != device.category) {
            showBanner(TEXT_INVALID_MODEL, TEXT_ONLY_SENSORS_OF_SAME_CATEGORY_ALLOWED, BANNER_TYPE_WARNING);
            return;
        }
    }
    tileElem.classList.add("tile-selected");
    loadTriggerSensorStateOptions(id);
}

/******************************************************************************/
/*!
  @brief    Toggles the time window enabled.
*/
/******************************************************************************/
function toggleTimeWindow() {
    timeWindowToggleElem.checked = !timeWindowToggleElem.checked;

    if (timeWindowToggleElem.checked) {
        timeWindowToggleElem.textContent = TEXT_DEACTIVATE_TIME_WINDOW;
        timeWindowToggleElem.style.color = "var(--error-text)";
        timeWindowContainerElem.style.display = "block";
    } else {
        timeWindowToggleElem.textContent = TEXT_ACTIVATE_TIME_WINDOW;
        timeWindowToggleElem.style.color = "var(--success-text)";
        timeWindowContainerElem.style.display = "none";
    }
}

/******************************************************************************/
/*!
  @brief    Toggles the time window active state.
  @parsm    state               State to set
*/
/******************************************************************************/
function toggleTimeWindowActiveState(state=undefined) {
    if (state != undefined) {
        timeWindowTypeToggleElem.checked = state;
    } else {
        timeWindowTypeToggleElem.checked = !timeWindowTypeToggleElem.checked;
    }

    if (timeWindowTypeToggleElem.checked) {
        timeWindowTypeToggleElem.className = "fa-solid fa-circle-check clickable";
        timeWindowTypeToggleElem.title = TEXT_ENABLED_DURING_TIME_WINDOW;
    } else {
        timeWindowTypeToggleElem.className = "fa-solid fa-circle-xmark clickable";
        timeWindowTypeToggleElem.title = TEXT_DISABLED_DURING_TIME_WINDOW;
    }

    updateTimeWindowRangeField();
}

/******************************************************************************/
/*!
  @brief    Toggles the inverted automation copy state.
  @parsm    state               State to set
*/
/******************************************************************************/
function toggleCopyAutomationInvertedTriggerAndPower(state=undefined) {
    if (state != undefined) {
        copyAutomationInvertedTriggerAndPowerToggleElem.checked = state;
    } else {
        copyAutomationInvertedTriggerAndPowerToggleElem.checked = !copyAutomationInvertedTriggerAndPowerToggleElem.checked;
    }

    if (triggerSelectElem.value == AUTOMATION_TRIGGER_TIMER) {
        delayTimeTogglesContainerElem.style.display = "none";
        if (copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            timeInvertedActionContainerElem.style.display = "block";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-check clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_POWER_COPY_ACTIVE;
            if (devicePowerSelectElem.value == 1) {
                timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_OFF;
            } else {
                timeInvertedActionTitleElem.textContent = TEXT_TIME_TURNING_ON;
            }
        } else {
            timeInvertedActionContainerElem.style.display = "none";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-xmark clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_POWER_COPY_INACTIVE;
        }
    } else if (triggerSelectElem.value == AUTOMATION_TRIGGER_SENSOR) {
        if (copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            delayTimeTogglesContainerElem.style.display = "flex";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-check clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_STATES_COPY_ACTIVE;
        } else {
            delayTimeTogglesContainerElem.style.display = "none";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-xmark clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_STATES_COPY_INACTIVE;
        }
    } else if (triggerSelectElem.value == AUTOMATION_TRIGGER_SWITCH) {
        if (copyAutomationInvertedTriggerAndPowerToggleElem.checked) {
            delayTimeTogglesContainerElem.style.display = "flex";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-check clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_STATES_COPY_ACTIVE;
        } else {
            delayTimeTogglesContainerElem.style.display = "none";
            copyAutomationInvertedTriggerAndPowerToggleElem.className = "fa-solid fa-circle-xmark clickable";
            copyAutomationInvertedTriggerAndPowerToggleElem.title = TEXT_INVERTED_AUTOMATION_STATES_COPY_INACTIVE;
        }
    }

    updateTimeWindowRangeField();
}

/******************************************************************************/
/*!
  @brief    Enables or disables the specified automation.
  @param    id                  ID of the automation
*/
/******************************************************************************/
function toggleAutomationEnabled(id) {
    let automation = automations[getIndexFromId(automations, id)];
    automation.enabled = !automation.enabled;

    let data = {
        id: id,
        enabled: +automation.enabled
    }

    httpPostRequest("/set_automation_enabled", data);
}

/******************************************************************************/
/*!
  @brief    Enables or disables the specified day.
  @param    day                 Day tot toggle
*/
/******************************************************************************/
function toggleDaySelection(day) {
    const tileElem = document.getElementById("dayTile" + day);

    if (tileElem.classList.contains("tile-selected")) {
        tileElem.classList.remove("tile-selected");
    } else {
        tileElem.classList.add("tile-selected");
    }
}

/******************************************************************************/
/*!
  @brief    Toggles the specified target device and updates button classes to
            see which device is selected.
  @parsm    id                  Device ID
*/
/******************************************************************************/
function toggleTargetDeviceSelection(id) {
    const tileElem = document.getElementById("targetDeviceTile" + id);
    if (tileElem.classList.contains("tile-selected")) {
        tileElem.classList.remove("tile-selected");
    } else {
        tileElem.classList.add("tile-selected");
    }

    let selectedAction = actionSelectElem.value;
    loadActionSelectOptions(selectedAction);
}
//#endregion

/******************************************************************************/
/*!
  @brief    Returns the time string of the specified minutes.
  @param    minutes             Minutes (from 00:00)
  @returns  string              Hour string (hh:mm)
*/
/******************************************************************************/
function minutesToHourString(minutes) {
    let hours = Math.floor(minutes / 60);
    minutes %= 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}
//#endregion