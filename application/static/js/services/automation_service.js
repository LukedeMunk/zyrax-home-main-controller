/******************************************************************************/
/*
 * File:    automation_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for automations.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/


/******************************************************************************/
/*!
    @brief  Loads the automation modal.
    @param  event               Mouse event
    @param  id                  Automation ID
*/
/******************************************************************************/
function loadAutomationModal(event, id=undefined) {
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

    automationModalObject.resetValidationElements();

    /* If no ID specified, new group */
    if (id == undefined) {
        automationModalObject.setTitle(TEXT_ADD_AUTOMATION);
        automationModalObject.setSubmitFunction(() => addAutomation());
        automationModalObject.setDeleteFunction(undefined);
        automationModalObject.resetValues();

        loadInvertedAutomationCopyFields();
        
        automationModalObject.show();
        return;
    }

    const automation = automations[getIndexFromId(automations, id)];

    /* Updating existing automation */
    let values = [
            automation.name,
            automation.trigger,
            automation.time_window_activated,
            automation.activate_during_time_window,
            minutesToHourString(automation.time_window_start_minutes),
            minutesToHourString(automation.time_window_end_minutes),
            automation.time,
            automation.days,
            automation.trigger_device_ids,
            automation.trigger_state,
            automation.delay_minutes,
            automation.target_device_ids,
            automation.action,
            automation.parameters[getIndexFromId(automation.parameters, "power", "name")]?.value,
            automation.parameters[getIndexFromId(automation.parameters, "color", "name")]?.value,
            automation.parameters[getIndexFromId(automation.parameters, "mode", "name")]?.value,
            automation.inverted_automation_copy_id != -1,
            automation.delay_minutes != 0,
            automation.inverted_delay_minutes != 0,
            automation.inverted_action_time
        ]

    automationModalObject.setTitle(TEXT_EDIT_AUTOMATION);
    automationModalObject.setSubmitFunction(() => updateAutomation(id));
    const automationModalElem = document.getElementById(automationModalObject.id);
    automationModalObject.setDeleteFunction(() => deleteAutomation(id, automationModalElem));
    automationModalObject.setValues(values);

    automationModalObject.currentStepIndex = 0;
    updateAutomationModalStepButtons(automation.trigger);

    automationModalObject.show();

    updateDelayTimeField();

    if (automation.trigger == AUTOMATION_TRIGGER_DOOR_SENSOR || automation.trigger == AUTOMATION_TRIGGER_MOTION_SENSOR) {
        automationModalObject.setValue("automationTriggerDevicesTileSelect", automation.trigger_device_ids);
        automationModalObject.setSelectOptions("automationTriggerStateSelect", getTriggerSensorStateOptions(automation.trigger_device_ids[0]));
    }

    automationModalObject.setBlockVisibility("automationActionSelectContainer", true);
    const targetDevice = devices[getIndexFromId(devices, automation.target_device_ids[0])];
    automationModalObject.setSelectOptions("automationActionSelect", getAutomationActionSelectOptions(targetDevice.type));
    loadActionParameters();
    loadInvertedAutomationCopyFields();
}

/******************************************************************************/
/*!
    @brief  Loads the inverted automation copy fields in the modal
*/
/******************************************************************************/
function loadInvertedAutomationCopyFields() {
    const trigger = automationModalObject.getValue("automationTriggerTileSelect")[0];
    const hasInvertedCopy = automationModalObject.getValue("automationInvertedEnabledCb");
    const action = automationModalObject.getValue("automationActionSelect");

    automationModalObject.setBlockVisibility("timeInvertedActionTimeContainer", false);
    
    if (trigger != AUTOMATION_TRIGGER_TIMER) {
        automationModalObject.setBlockVisibility("delayThisAutomationCbContainer", hasInvertedCopy);
        automationModalObject.setBlockVisibility("delayInvertedAutomationCbContainer", hasInvertedCopy);
    } else {
        automationModalObject.setBlockVisibility("delayThisAutomationCbContainer", false);
        automationModalObject.setBlockVisibility("delayInvertedAutomationCbContainer", false);

        if (action == AUTOMATION_ACTION_SET_DEVICE_POWER) {
            automationModalObject.setBlockVisibility("timeInvertedActionTimeContainer", hasInvertedCopy);
            const actionState = parseInt(automationModalObject.getValue("devicePowerSelect"));
            if (actionState == 1) {
                automationModalObject.setFieldTitle("timeInvertedActionTime", TEXT_TIME_TURNING_OFF);
            } else {
                automationModalObject.setFieldTitle("timeInvertedActionTime", TEXT_TIME_TURNING_ON);
            }
        }
    }
}

/******************************************************************************/
/*!
    @brief  Updates the automation modal step buttons
    @param  trigger             Automation trigger
*/
/******************************************************************************/
function updateAutomationModalStepButtons(trigger=undefined) {
    if (trigger == undefined) {
        trigger = automationModalObject.getValue("automationTriggerTileSelect")[0];
    }

    automationModalObject.setBlockVisibility("automationActionSelectContainer", false);
    automationModalObject.setBlockVisibility("devicePowerSelectContainer", false);
    automationModalObject.setBlockVisibility("ledstripColorColorContainer", false);
    automationModalObject.setBlockVisibility("ledstripModeSelectContainer", false);

    loadTriggerTimeWindowFields();

    if (automationModalObject.currentStepIndex == 0) {
        automationModalObject.setStepDisabled(1, false);
        automationModalObject.setStepDisabled(2, false);
        automationModalObject.setStepDisabled(3, false);

        if (trigger == AUTOMATION_TRIGGER_TIMER) {
            automationModalObject.setStepDisabled(1, true);
            automationModalObject.setStepDisabled(3, true);
        } else {
            automationModalObject.setStepDisabled(2, true);
            automationModalObject.setTileSelectOptions("automationTriggerDevicesTileSelect", getTriggerDeviceTileSelectOptions(trigger));
        }
    }
}

/******************************************************************************/
/*!
    @brief  Updates the delay time field text.
*/
/******************************************************************************/
function updateDelayTimeField() {
    const delay = automationModalObject.getValue("automationDelayRange");

    if (delay == 0) {
        automationModalObject.setFieldTitle("automationDelayRange", TEXT_AUTOMATION_DELAY + " (" + TEXT_AUTOMATION_IMMEDIATELY + ")");
        return;
    }

    automationModalObject.setFieldTitle("automationDelayRange", TEXT_AUTOMATION_DELAY + " (" + delay + " " + TEXT_MINUTES + ")");
    //delayTimeRangeFieldElem.textContent = VAR_TEXT_AUTOMATION_DELAY_TIME(delayTimeRangeElem.value);
}

/******************************************************************************/
/*!
    @brief  Loads the trigger time window fields.
*/
/******************************************************************************/
function loadTriggerTimeWindowFields() {
    const activateTimeWindow = automationModalObject.getValue("automationActivateTimeWindowCb");

    automationModalObject.setBlockVisibility("automationActivateDuringTimeWindowCbContainer", activateTimeWindow);
    automationModalObject.setBlockVisibility("automationTriggerActivationTimeTimeContainer", activateTimeWindow);
    automationModalObject.setBlockVisibility("automationTriggerDectivationTimeTimeContainer", activateTimeWindow);
}

/******************************************************************************/
/*!
    @brief  Loads the action parameters of the selected automation action.
*/
/******************************************************************************/
function loadActionParameters() {
    const action = automationModalObject.getValue("automationActionSelect");
    
    automationModalObject.setBlockVisibility("devicePowerSelectContainer", false);
    automationModalObject.setBlockVisibility("ledstripColorColorContainer", false);
    automationModalObject.setBlockVisibility("ledstripModeSelectContainer", false);

    if (action == AUTOMATION_ACTION_SET_DEVICE_POWER) {
        automationModalObject.setBlockVisibility("devicePowerSelectContainer", true);
    }
    if (action == AUTOMATION_ACTION_SET_LEDSTRIP_COLOR) {
        automationModalObject.setBlockVisibility("ledstripColorColorContainer", true);
    }
    if (action == AUTOMATION_ACTION_SET_LEDSTRIP_MODE) {
        automationModalObject.setBlockVisibility("ledstripModeSelectContainer", true);
    }
}

//#region Validators
/******************************************************************************/
/*!
    @brief  Validates the automation input.
    @param  id                  Automation ID
    @return bool                True if valid
*/
/******************************************************************************/
function validateAutomation(id=-1) {
    let values = automationModalObject.validate(id);
    if (!values) {
        return false;
    }

    const trigger = parseInt(values[1][0]);                                     //[0] because of tile select element gives array

    const automation = automations[getIndexFromId(automations, id)];

    let data = {
        id: id,
        name: values[0],
        trigger: trigger,
        inverted_automation_copy_id: automation?.inverted_automation_copy_id ?? -1
    };

    if (trigger == AUTOMATION_TRIGGER_TIMER) {
        data.time = values[2];
        data.days = values[3];
        data.target_device_ids = values[4];
        data.action = values[5];
        const addInverted = values[9];

        if (addInverted) {
            if (data.inverted_automation_copy_id == -1) {
                data.inverted_automation_copy_id = 9999;
            }
            data.inverted_action_time = values[12];
        } else {
            data.inverted_automation_copy_id = -1;
        }
    } else {
        data.time_window_activated = +values[2];
        data.activate_during_time_window = +values[3];
        data.time_window_start_minutes = hourStringToMinutes(values[4]);
        data.time_window_end_minutes = hourStringToMinutes(values[5]);
        data.trigger_device_ids = values[6];
        data.trigger_state = parseInt(values[7]);
        data.delay_minutes = parseInt(values[8]);
        
        data.target_device_ids = values[9];
        data.action = values[10];

        const addInverted = values[14];
        const delayThis = values[15];
        const delayInverted = values[16];

        if (addInverted) {
            if (data.inverted_automation_copy_id == -1) {
                data.inverted_automation_copy_id = 9999;
            }

            if (delayInverted) {
                data.inverted_delay_minutes = data.delay_minutes;
            } else {
                data.inverted_delay_minutes = 0;
            }

            if (!delayThis) {
                data.delay_minutes = 0;
            }
        } else {
            data.inverted_automation_copy_id = -1;
        }
    } /*else if (trigger == AUTOMATION_TRIGGER_DOOR_SENSOR) {
    } else if (trigger == AUTOMATION_TRIGGER_MOTION_SENSOR) {
        
    } else if (trigger == AUTOMATION_TRIGGER_SWITCH) {
        
    }*/

    data.parameters = getActionParameters(data.action);
    
    return data;
}
//#endregion


//#region Automation configuration
/******************************************************************************/
/*!
    @brief  Adds an automation when valid.
*/
/******************************************************************************/
async function addAutomation() {
    let data = validateAutomation();
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/add_automation", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        automationModalObject.setErrorMessage(result.message);
        return;
    }

    updateAutomationSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Updates the specified automation.
    @param  id                  Automation ID
*/
/******************************************************************************/
async function updateAutomation(id) {
    let data = validateAutomation(id);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/update_automation", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        automationModalObject.setErrorMessage(result.message);
        return;
    }

    updateAutomationSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Handles the server response for updating or adding automations.
    @param  result              Server response to handle
*/
/******************************************************************************/
function updateAutomationSuccess(result, data) {
    let newAutomation = data.id == -1;

    automations = result.message.automations;

    if (newAutomation) {
        data.id = result.message.id;
        banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    } else {
        banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    }

    automationModalObject.close();

    /* Trigger event for pages to use */
    const action = newAutomation ? "add" : "update";
    document.dispatchEvent(
        new CustomEvent("automationChanged", {detail: {id: data.id, action: action}})
    );
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before deleting the selected automation
            configuration.
*/
/******************************************************************************/
function deleteAutomationConfirm() {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_AUTOMATION, buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified automation.
    @param  id                  Automation ID
*/
/******************************************************************************/
async function deleteAutomation(id) {
    const choice = await deleteAutomationConfirm();
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/delete_automation", {id : id});
    if (result.status_code != HTTP_CODE_OK) return;

    automations.splice(getIndexFromId(automations, id), 1);

    automationModalElem.close();

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("automationChanged", {detail: {id: id, action: "delete"}})
    );
}
//#endregion

/******************************************************************************/
/*!
    @brief  Enables or disables the specified automation.
    @param  id                  ID of the automation
*/
/******************************************************************************/
async function toggleAutomationEnabled(id) {
    let automation = automations[getIndexFromId(automations, id)];
    automation.enabled = !automation.enabled;

    let data = {
        id: id,
        enabled: +automation.enabled
    }

    httpPostRequestErrorBanner("/set_automation_enabled", data);
}

/******************************************************************************/
/*!
    @brief  Manually runs the specified automation.
    @param  id                  Automation ID
    @param  source              Manual run source
  @return                       Automation run result
*/
/******************************************************************************/
async function runAutomation(id, source="manual") {
    const result = await httpPostRequestErrorBanner(
        "/run_automation",
        {id: id, source: source},
        true
    );

    if (result.status_code == HTTP_CODE_OK) {
        if (result.message.status == "failed") {
            banners.show(
                TEXT_SERVER_ERROR,
                TEXT_ERROR + ": " + result.message.error,
                MESSAGE_TYPE_ERROR
            );
            return result;
        }

        const automation = automations[getIndexFromId(automations, id)];
        banners.show(
            TEXT_SUCCESS,
            automation.name,
            MESSAGE_TYPE_SUCCESS
        );
    }

    return result;
}


//#region Getters
/******************************************************************************/
/*!
    @brief  Loads the ledstrip mode select options.
    @return array               Array with ledstrip mode options
*/
/******************************************************************************/
function getLedstripModeSelectOptions() {
    let modeSelectOptions = [];
    
    for (let mode of modes) {
        modeSelectOptions.push({
            value: mode.id,
            text: mode.name
        });
    }

    return modeSelectOptions;
}

/******************************************************************************/
/*!
    @brief  Loads the automation trigger device select tiles.
    @param  trigger             Trigger type
    @return array               Array with trigger device tiles
*/
/******************************************************************************/
function getTriggerDeviceTileSelectOptions(trigger) {
    const tiles = [];

    for (const device of devices) {
        if (trigger == AUTOMATION_TRIGGER_DOOR_SENSOR && device.category != DEVICE_CATEGORY_DOOR_SENSOR) {
            continue;
        }

        if (trigger == AUTOMATION_TRIGGER_MOTION_SENSOR && device.category != DEVICE_CATEGORY_MOTION_SENSOR) {
            continue;
        }

        tiles.push({
            id: "automationTriggerDeviceTile" + device.id,
            value: device.id,
            title: device.name,
            icon: device.icon,
            onclickFunction: () => automationModalObject.setSelectOptions("automationTriggerStateSelect", getTriggerSensorStateOptions(device.id))
        });
    }

    return tiles;
}

/******************************************************************************/
/*!
    @brief  Loads the trigger sensor state options based on the sensor type.
    @param  id                  Device ID
    @return array               Array with sensor state options
*/
/******************************************************************************/
function getTriggerSensorStateOptions(id=undefined) {
    const options = [];

    if (id == undefined) {
        options.push({
            value: -1,
            text: TEXT_CHOOSE_TRIGGER_DEVICE_FIRST
        })

        return options;
    }

    let device = devices[getIndexFromId(devices, id)];
    let deviceModel = DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, device.model_id, "model_id")];

    for (const state of deviceModel.states) {
        options.push({
            value: state.state,
            text: state.name
        })
    }

    return options;
}

/******************************************************************************/
/*!
    @brief  Loads the automation target device select tiles.
    @return array               Array with target device tiles
*/
/******************************************************************************/
function getTargetDeviceTileSelectOptions() {
    const tiles = [];

    for (const device of devices) {
        if (device.category != DEVICE_CATEGORY_LEDSTRIP && device.category != DEVICE_CATEGORY_POWER_OUTLET) {
            continue;
        }

        tiles.push({
            id: "automationTargetDeviceTile" + device.id,
            value: device.id,
            title: device.name,
            icon: device.icon,
            onclickFunction: () => {
                automationModalObject.setBlockVisibility("automationActionSelectContainer", true);
                automationModalObject.setSelectOptions("automationActionSelect", getAutomationActionSelectOptions(device.type));
                loadActionParameters();
            }
        });
    }

    return tiles;
}

/******************************************************************************/
/*!
    @brief  Loads the automation action select options.
    @param  type                Device type
    @return array               Array with action options
*/
/******************************************************************************/
function getAutomationActionSelectOptions(type) {
    const options = [];

    for (const action of actions) {
        if (!action.device_types.includes(type)) {
            continue;
        }

        options.push({
            value: action.function,
            text: action.name,
        });
    }

    return options;
}

/******************************************************************************/
/*!
    @brief  Returns the parameters of the selected action.
    @return array               Array with action parameters
*/
/******************************************************************************/
function getActionParameters(action) {
    const parameters = [];

    if (action == AUTOMATION_ACTION_SET_DEVICE_POWER) {
        const parameter = {
            name: "power",
            value: parseInt(automationModalObject.getValue("devicePowerSelect"))
        }
        parameters.push(parameter);
    }
    if (action == AUTOMATION_ACTION_SET_LEDSTRIP_COLOR) {
        const parameter = {
            name: "color",
            value: automationModalObject.getValue("ledstripColorColor")
        }
        parameters.push(parameter);
    }
    if (action == AUTOMATION_ACTION_SET_LEDSTRIP_MODE) {
        const parameter = {
            name: "mode",
            value: parseInt(automationModalObject.getValue("ledstripModeSelect"))
        }
        parameters.push(parameter);
    }

    return parameters;
}
//#endregion
