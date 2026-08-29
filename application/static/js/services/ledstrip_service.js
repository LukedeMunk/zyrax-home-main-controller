/******************************************************************************/
/*
 * File:    ledstrip_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for ledstrips.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/


/******************************************************************************/
/*!
    @brief  Loads the ledstrip modal with the specified parameters.
    @param  id                  Device ID
    @param  modelId             Model ID
    @param  hostname            Hostname of the ledstrip
*/
/******************************************************************************/
function loadLedstripModal(id=undefined, modelId=undefined, hostname=undefined) {
    ledstripModalObject.resetValidationElements();
    ledstripModalObject.setDeleteFunction(undefined);

    /* If no ID specified, new ledstrip */
    if (id == undefined) {
        ledstripModalObject.setTitle(TEXT_ADD_LEDSTRIP);
        ledstripModalObject.setSubmitFunction(() => addLedstrip());

        ledstripModalObject.resetValues();
        if (modelId != undefined) {
            ledstripModalObject.setValue("ledstripModelSelect", modelId);
        }
        if (hostname != undefined) {
            ledstripModalObject.setValue("ledstripHostnameTxt", hostname);
        }

        ledstripModalObject.setBlockVisibility("ledstripSensorIsInvertedBlock", false);
        ledstripModalObject.setBlockVisibility("ledstripSensorModelBlock", false);
        
        ledstripModalObject.show();
        return;
    }

    let ledstrip = devices[getIndexFromId(devices, id)];

    /* Updating existing ledstrip */
    let values = [
            ledstrip.name,
            ledstrip.hostname,
            ledstrip.model_id,
            ledstrip.icon + " fa-xl",
            ledstrip.icon_low_state + " fa-xl",
            ledstrip.has_sensor,
            ledstrip.sensor_inverted,
            ledstrip.sensor_model
        ]

    ledstripModalObject.setTitle(TEXT_UPDATE_LEDSTRIP);
    ledstripModalObject.setSubmitFunction(() => updateLedstrip(id));
    ledstripModalObject.setValues(values);
    
    ledstripModalObject.setIcon("ledstripIconBtn", ledstrip.icon + " fa-xl");
    ledstripModalObject.setIcon("ledstripIconLowStateBtn", ledstrip.icon_low_state + " fa-xl");
    
    if (ledstrip.has_sensor == 1) {
        ledstripModalObject.setBlockVisibility("ledstripSensorIsInvertedBlock", true);
        ledstripModalObject.setBlockVisibility("ledstripSensorModelBlock", true);
    } else {
        ledstripModalObject.setBlockVisibility("ledstripSensorIsInvertedBlock", false);
        ledstripModalObject.setBlockVisibility("ledstripSensorModelBlock", false);
    }

    const ledstripModalElem = document.getElementById(ledstripModalObject.id);
    ledstripModalObject.setDeleteFunction(() => deleteLedstrip(id, ledstripModalElem));
    ledstripModalObject.show();
}

/******************************************************************************/
/*!
    @brief  Toggles whether the ledstrip has a sensor or not.
*/
/******************************************************************************/
function toggleLedstripHasSensor() {
    if (ledstripModalObject.getValue("ledstripHasSensorCb")) {
        ledstripModalObject.setBlockVisibility("ledstripSensorIsInvertedBlock", true);
        ledstripModalObject.setBlockVisibility("ledstripSensorModelBlock", true);
    } else {
        ledstripModalObject.setBlockVisibility("ledstripSensorIsInvertedBlock", false);
        ledstripModalObject.setBlockVisibility("ledstripSensorModelBlock", false);
    }
}

/******************************************************************************/
/*!
    @brief  Validates the ledstrip input.
    @param  id                  Device ID
    @return bool                True if valid
*/
/******************************************************************************/
function validateLedstrip(id=-1) {
    let values = ledstripModalObject.validate(id);
    if (!values) {
        return false;
    }

    let data = {
        id: id,
        name: values[0],
        hostname: values[1],
        model_id: parseInt(values[2]),
        icon: values[3],
        icon_low_state: values[4],
        has_sensor: +values[5],
    };

    if (data.has_sensor) {
        data.sensor_inverted = +values[6];
        data.sensor_model = parseInt(values[7]);
    }
    
    return data;
}

/******************************************************************************/
/*!
    @brief  Adds a ledstrip to the system.
    @param  model               Device model
*/
/******************************************************************************/
async function addLedstrip() {
    let data = validateLedstrip();
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/add_ledstrip", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        ledstripModalObject.setErrorMessage(result.message);
        return;
    }

    updateLedstripSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Updates the specified ledstrip.
    @param  id                  Device ID
*/
/******************************************************************************/
async function updateLedstrip(id) {
    let data = validateLedstrip(id);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/update_ledstrip", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        ledstripModalObject.setErrorMessage(result.message);
        return;
    }

    updateLedstripSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Handles the server response for updating or adding ledstrips.
    @param  result              Server response to handle
  @param  data                New or updated group data
*/
/******************************************************************************/
function updateLedstripSuccess(result, data) {
    let newLedstrip = data.id == -1;

    devices = result.message.devices;

    if (newLedstrip) {
        data.id = result.message.id;
        let buttons = [
                        {text: TEXT_CONFIGURE, onclickFunction: () => updateLedAddressing(data.id)},
                        {text: TEXT_DONT_CONFIGURE, onclickFunction: () => popups.close() }
                    ];
        popups.show(TEXT_SUCCESS, TEXT_LEDSTRIP_ADDED_CLICK_TO_CONFIGURE, buttons, MESSAGE_TYPE_INFO);
    } else {
        banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    }

    let ledstrip = devices[getIndexFromId(devices, data.id)];
    ledstrip.connection_status = false;                                             //Reset connection status to 'loading'

    ledstripModalObject.close();

    /* Trigger event for pages to use */
    const action = newLedstrip ? "add" : "update";
    document.dispatchEvent(
        new CustomEvent("ledstripChanged", {detail: {id: data.id, action: action}})
    );
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before deleting the specified ledstrip.
    @param  id                  Device ID
*/
/******************************************************************************/
function deleteLedstripConfirm(id) {
    return new Promise((resolve) => {
        let isInGroup = false;
        let ledstrip = devices[getIndexFromId(devices, id)];

        for (let group of groups) {
            if (getIndexFromId(group.device_ids, id, false) != -1) {
                isInGroup = true;
                break;
            }
        }

        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];

        if (isInGroup) {
            popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_OUT_OF_GROUP(ledstrip.name), buttons, MESSAGE_TYPE_WARNING);
        } else {
            popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(ledstrip.name), buttons, MESSAGE_TYPE_WARNING);
        }
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified ledstrip.
    @param  id                  Device ID
*/
/******************************************************************************/
async function deleteLedstrip(id) {
    const choice = await deleteLedstripConfirm(id);
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/delete_ledstrip", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].id == id) {
            devices.splice(i, 1);
            break;
        }
    }

    for (let group of groups) {
        let index = getIndexFromId(group.device_ids, id, undefined);
        if (index != -1) {
            group.device_ids.splice(index, 1);
        }

        if (group.device_ids.length == 0) {
            groups.splice(getIndexFromId(groups, group.id), 1);
            banners.show(TEXT_GROUP_DELETED, TEXT_GROUP_DELETED_NO_DEVICES, MESSAGE_TYPE_INFO);
        }
    }

    banners.show(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("ledstripChanged", {detail: {id: id, action: "delete"}})
    );
}





/******************************************************************************/
/*!
    @brief  Sends the device brightness update command to the back-end.
    @param  id                  Device ID
*/
/******************************************************************************/
async function setLedstripBrightness(id) {
    const device = devices[getIndexFromId(devices, id)];
    const tileObject = dashboardTileObjects.find(
        (dashboardTileObject) => dashboardTileObject.tile?.device_id === device.id
    );

    const brightness = tileObject.getRangeValue();

    let data = {
        id: id,
        brightness: brightness
    };

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/set_ledstrip_brightness", data);
    if (result.status_code != HTTP_CODE_OK) return;

    device.brightness = brightness;

    updateTileStates();
}




//#region Mode Configurations
/******************************************************************************/
/*!
    @brief  Validates and sends updated mode configurations to the back-end.
*/
/******************************************************************************/
async function updateModeConfiguration(modeId) {
    const mode = LEDSTRIP_MODES[getIndexFromId(modeConfigurations, modeId)];
    const configuration = modeConfigurations[getIndexFromId(modeConfigurations, modeId)];
    const modal = modeModalObjects[getIndexFromId(modeModalObjects, "modeConfigurationModal" + modeId)];

    modal.resetValidationElements();
    const values = modal.getValues();

    let data = {
        mode_id: modeId,
        parameters: []
    };

    if (groupSelected) {
        data.group_id = stripOrGroup.id;
    } else {
        data.device_id = ledstripOrGroupId;
    }

    const color1Index = mode.parameters.findIndex(
        parameter => parameter.id === PARAMETER_ID_COLOR1
    );

    const color2Index = mode.parameters.findIndex(
        parameter => parameter.id === PARAMETER_ID_COLOR2
    );

    if (color1Index != -1 && color2Index != -1) {
        if (!validateColors(values[color1Index], values[color2Index])) {
            modal.setFieldInvalid(modal.fields[color1Index].id, TEXT_FIELD_SAME_COLOR);
            return;
        }
    }

    let index = 0;
    for (let param of mode.parameters) {
        const parameter = {
            id: param.id,
        }

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

    const result = await httpPostRequestErrorBanner(url, data, true);
    if (result.status_code != HTTP_CODE_OK) return;

    modeConfigurations = result.message.mode_configurations;

    setMode(modeId);
}

/******************************************************************************/
/*!
      @brief  Validates and sends updated mode configurations to the back-end.
      @param  color1Element       Color 1 DOM element
      @param  color2Element       Color 2 DOM element
      @param  color1Gradient      If true, a gradient will be used for color 1
      @param  color2Gradient      If true, a gradient will be used for color 2
      @return bool                True if valid
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
    @brief  Loads the ledstrip color palette select options.
    @param  elementId           ID of the DOM element
*/
/******************************************************************************/
function getPaletteSelectOptions() {
    const options = [];

    for (const palette of palettes) {
        options.push({
            value: palette.value,
            text: palette.name,
        });
    }

    return options;
}
//#endregion