/******************************************************************************/
/*
 * File:    rf_device_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for RF devices.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/



/******************************************************************************/
/*!
    @brief  Loads the RF device modal.
    @param  id                  Device ID
    @param  modelId             Model ID
*/
/******************************************************************************/
function loadRfDeviceModal(id=undefined, modelId=undefined) {
    const modalConfiguration = {
        ...RF_DEVICE_MODAL_CONFIGURATION,
        columns: RF_DEVICE_MODAL_CONFIGURATION.columns.map(column => ({
            ...column,
            blocks: column.blocks.map(block => ({
                ...block,
                onclickFunction: block.onclickFunction
                    ? () => block.onclickFunction(device.id)
                    : undefined
            }))
        }))
    };

    let rfCodeFields;
    let device;
    let modelIndex;
    if (id != undefined) {
        device = devices[getIndexFromId(devices, id)];
        rfCodeFields = loadRfCodeFields(device.id, device.model_id);
        modelIndex = getIndexFromId(DEVICE_MODELS, device.model_id, "model_id");
    } else {
        rfCodeFields = loadRfCodeFields(undefined, modelId);
        modelIndex = getIndexFromId(DEVICE_MODELS, modelId, "model_id");
    }

    modalConfiguration.columns[0].blocks.push(...rfCodeFields);
    rfDeviceModalObject.setConfiguration(modalConfiguration);

    rfDeviceModalObject.render();
    rfDeviceModalObject.setDeleteFunction(undefined);

    const tableContainerElem = document.getElementById("rfCodesTableContainer");
    rfCodeModalTableObject = new StandardTable(tableContainerElem, RF_CODE_TABLE_CONFIGURATION);

    /* If no ID specified, new RF device */
    if (id == undefined) {
        let title = VAR_TEXT_ADD(DEVICE_MODELS[modelIndex].name);
        rfDeviceModalObject.setTitle(title);
        rfDeviceModalObject.setSubmitFunction(() => addRfDevice(modelId));
        rfDeviceModalObject.resetValues();

        if (DEVICE_MODELS[modelIndex].icons.length > 1) {
            rfDeviceModalObject.setBlockVisibility("rfDeviceIconLowStateBtn", true);
            rfDeviceModalObject.setBlockTitle("rfDeviceIconLowStateBtn", DEVICE_MODELS[modelIndex].icons[1].name);
        } else {
            rfDeviceModalObject.setBlockVisibility("rfDeviceIconLowStateBtn", false);
        }
        
        rfDeviceModalObject.show();
        isFetchingRfCodes = true;
        fetchRfCodes();
        return;
    }

    /* Updating existing RF device */
    let values = [
            device.name,
            device.icon,
            device.icon_low_state
        ]

    for (let codeType of DEVICE_MODELS[modelIndex].rf_code_types ?? []) {
        console.log(codeType)
        values.push(getRfCode(device, codeType.type).rf_code);
    }

    rfDeviceModalObject.setTitle(VAR_TEXT_UPDATE(device.name));
    rfDeviceModalObject.setSubmitFunction(() => updateRfDevice(id));
    rfDeviceModalObject.setValues(values);
    
    rfDeviceModalObject.setIcon("rfDeviceIconBtn", device.icon + " fa-xl");
    rfDeviceModalObject.setIcon("rfDeviceIconLowStateBtn", device.icon_low_state + " fa-xl");

    const rfDeviceModalElem = document.getElementById(rfDeviceModalObject.id);
    rfDeviceModalObject.setDeleteFunction(() => deleteRfDevice(id, rfDeviceModalElem));
    rfDeviceModalObject.show();

    isFetchingRfCodes = true;
    fetchRfCodes();
}

/******************************************************************************/
/*!
    @brief  Validates the RF device input.
    @param  id                  Device ID
    @param  modelId             Model ID
    @return bool                True if valid
*/
/******************************************************************************/
function validateRfDevice(id=-1, modelId=undefined) {
    if (id != -1) {
        modelId = devices[getIndexFromId(devices, id)].model_id;
    }

    let modelIndex;
    if (id != undefined) {
        device = devices[getIndexFromId(devices, id)];
        modelIndex = getIndexFromId(DEVICE_MODELS, device.model_id, "model_id");
    } else {
        modelIndex = getIndexFromId(DEVICE_MODELS, modelId, "model_id");
    }

    let model = DEVICE_MODELS[modelIndex];

    let values = rfDeviceModalObject.validate(id);
    if (!values) {
        return false;
    }

    let data = {
        id: id,
        type: DEVICE_TYPE_RF_DEVICE,
        name: values[0],
        icon: values[1],
        icon_low_state: values[2],
        model_id: modelId,
        category : model.category,
        rf_codes: []
    };

    for (let codeType of DEVICE_MODELS[modelIndex].rf_code_types ?? []) {
        console.log(codeType)
        data.rf_codes.push(getRfCode(device, codeType.type).rf_code);
    }
    
    return data;



//
//  /* Validate RF */
//  let rfCodes = [];
//  let rfCodesArray = [];
//
//  let rfTypeIndex = 0;
//  for (const rfCodeInputElement of rfCodeElements) {
//      if (rfCodeInputElement.value == "") {
//          rfCodeInputElement.classList.add("invalid-input");
//          rfCodeInputElement.focus();
//          errorMessageRfDeviceFieldElem.textContent = TEXT_FIELD_REQUIRED;
//          errorMessageRfDeviceFieldElem.style.display = "inline-block";
//          return false;
//      }
//
//      if (NUMBER_RE.test(rfCodeInputElement.value)) {
//          rfCodeInputElement.classList.add("invalid-input");
//          rfCodeInputElement.focus();
//          errorMessageRfDeviceFieldElem.textContent = TEXT_FIELD_ONLY_NUMBERS;
//          errorMessageRfDeviceFieldElem.style.display = "inline-block";
//          return false;
//      }
//
//      let code = {
//          rf_code: parseInt(rfCodeInputElement.value),
//          type: model.rf_code_types[rfTypeIndex].type,
//          name: model.rf_code_types[rfTypeIndex].name
//      }
//
//      /* Check if RF is unique */
//      if (!rfCodeIsUnique(id, code)) {
//          rfCodeInputElement.classList.add("invalid-input");
//          rfCodeInputElement.focus();
//          errorMessageRfDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
//          errorMessageRfDeviceFieldElem.style.display = "inline-block";
//          return false;
//      }
//
//      rfCodes.push(code);
//      rfCodesArray.push(code);
//      rfTypeIndex++;
//  }
//
//  for (let device of devices) {
//      if (device.id == id) {
//          continue;
//      }
//
//      /* Check if name is unique */
//      if (device.name == name) {
//          rfDeviceNameTxtElem.classList.add("invalid-input");
//          rfDeviceNameTxtElem.focus();
//          errorMessageRfDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
//          errorMessageRfDeviceFieldElem.style.display = "inline-block";
//          return false;
//      }
//  }
}

//#region Sensor functions
/******************************************************************************/
/*!
    @brief  Adds an RF device to the system.
    @param  modelId             Device model ID
*/
/******************************************************************************/
async function addRfDevice(modelId) {
    let data = validateRfDevice(-1, modelId);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/add_rf_device", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        rfDeviceModalObject.setErrorMessage(result.message);
        return;
    }

    updateRfDeviceSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Updates the specified RF device.
    @param  id                  Device ID
*/
/******************************************************************************/
async function updateRfDevice(id) {
    let data = validateRfDevice(id);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/update_rf_device", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        rfDeviceModalObject.setErrorMessage(result.message);
        return;
    }

    updateRfDeviceSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Handles the server response for updating or adding RF devices.
    @param  result              Server response to handle
*/
/******************************************************************************/
function updateRfDeviceSuccess(result) {
    let newRfDevice = data.id == -1;
    let modelIndex = getIndexFromId(DEVICE_MODELS, data.model_id, "model_id");
    let model = DEVICE_MODELS[modelIndex];

    devices = result.message.devices;

    if (newRfDevice) {
        data.id = result.message.id;
        banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    } else {
        banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    }

    rfDeviceModalObject.close();

    /* Trigger event for pages to use */
    const action = newRfDevice ? "add" : "update";
    document.dispatchEvent(
        new CustomEvent("rfDeviceChanged", {detail: {id: data.id, action: action}})
    );
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before deleting the specified RF device.
    @param  id                  Device ID
*/
/******************************************************************************/
function deleteRfDeviceConfirm(id) {
    return new Promise((resolve) => {
        let isInGroup = false;
        let device = devices[getIndexFromId(devices, id)];

        for (let group of groups) {
            if (getIndexFromId(group.device_ids, id, undefined) != -1) {
                isInGroup = true;
                break;
            }
        }

        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        if (isInGroup) {
            popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_OUT_OF_GROUP(device.name), buttons, MESSAGE_TYPE_WARNING);
        } else {
            popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(device.name), buttons, MESSAGE_TYPE_WARNING);
        }
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified RF device.
    @param  id                  Device ID TODO add group param
*/
/******************************************************************************/
async function deleteRfDevice(id) {
    const choice = await deleteRfDeviceConfirm(id);
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/delete_rf_device", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].id == id) {
            devices.splice(i, 1);
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
        new CustomEvent("rfDeviceChanged", {detail: {id: id, action: "delete"}})
    );
}
//#endregion






/******************************************************************************/
/*!
    @brief  Loads the RF code fields based on the specified RF device model ID.
    @param  deviceId            Device ID
    @param  modelId             Device model ID
*/
/******************************************************************************/
function loadRfCodeFields(deviceId=undefined, modelId=undefined) {
    const model = DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, modelId, "model_id")];

    const fields = [];
    if (model.category == DEVICE_CATEGORY_REMOTE) {
        if (deviceId == undefined) {
            fields.push(generateRfCodeInput({name: "Code 1", type: 0}));
            return fields;
        }

        let device = devices[getIndexFromId(devices, deviceId)];
        for (let codeType of device.rf_codes) {
            fields.push(generateRfCodeInput(codeType));
        }
    }

    for (let codeType of model.rf_code_types ?? []) {
        fields.push(generateRfCodeInput(codeType));
    }

    return fields;
}

/******************************************************************************/
/*!
    @brief  Generates an RF code input field based on the specified RF code type.
    @param  type                RF code type object
*/
/******************************************************************************/
function generateRfCodeInput(type) {
    const inputField = {
        blockType: MODAL_BLOCK_TYPE_INPUT,
        id: type.type + "RfCodeTxt",
        title: type.name,
        type: "text",
        validations: [
            {
                type: VALIDATION_NOT_NULL
            },
            {
                type: VALIDATION_REGEX_NO_MATCH,
                regexPattern: SYMBOL_CRITICAL_RE,
                errorMessage: TEXT_NO_CRITICAL_SYMBOLS
            }
        ]
    }

    return inputField;
    
    //TODO Add quick actions bij rfcodes.
}

/******************************************************************************/
/*!
    @brief  Returns the RF code object based on the specified RF device and RF
            code type.
    @param  rfDevice            RF device object
    @param  type                RF code type ID
    @return code                RF code object
*/
/******************************************************************************/
function getRfCode(rfDevice, type) {
    for (let code of rfDevice.rf_codes) {
        if (code.type == type) {
            return code;
        }
    }
}

/******************************************************************************/
/*!
    @brief  Toggles whether the RF code is unique or not.
    @param  deviceId            Device ID
    @param  rfCode              RF code
    @return bool                True if unique
*/
/******************************************************************************/
function rfCodeIsUnique(deviceId, rfCode) {
    for (let device of devices) {
        if (device.id == deviceId) {
            continue;
        }

        if (device.rf_codes == undefined) {
            continue;
        }

        console.log(device.rf_codes)
        console.log(rfCode)

        for (let code of device.rf_codes) {
            if (code.rf_code == rfCode.rf_code) {
                return false;
            }
        }
    }

    return true;
}


/******************************************************************************/
/*!
    @brief  Asynchronous interval function for fetching the RF codes for
            real-time monitoring.
*/
/******************************************************************************/
async function fetchRfCodes() {
    if (!isFetchingRfCodes) {
        setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    if (!rfDeviceModalObject.isOpen) {
        isFetchingRfCodes = false;
        setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let response;
    try {
        response = await fetch("get_last_received_rf_codes", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchRfCodes);
        return;
    }

    let data = await response.json();

    lastRecievedRfCodes = data.message.rf_codes;
    generateRfCodeTable();

    setTimeout(fetchRfCodes, BACK_END_UPDATE_INTERVAL_1S);
}


//#region Generate RF Table
/******************************************************************************/
/*!
    @brief  Generates the RF code table.
*/
/******************************************************************************/
function generateRfCodeTable() {
    rfCodeModalTableObject.reset();
    rfCodeModalTableObject.setTitle(TEXT_RF_CODES + " (" + lastRecievedRfCodes.length + ")");

    /* Fill rows */
    for (let rfCode of lastRecievedRfCodes) {
        /* Set onclick functions */
        const tableOptionAdd = {
            icon: "fa-duotone fa-solid fa-plus fa-lg clickable",
            onclickFunction: () => addCodeFromList(rfCode),
            title: TEXT_ADD_CODE
        };

        let row = {
            data: [{
                type: CELL_TYPE_TEXT,
                value: rfCode
            },
            {
                type: CELL_TYPE_TEXT,
                value: "00:00"
            },
            {
                type: CELL_TYPE_OPTIONS,
                options: [tableOptionAdd]
            }]
        }

        rfCodeModalTableObject.appendRow(row);
    }

    /* If no rows, generate alternative text */
    if (lastRecievedRfCodes.length == 0) {
        rfCodeModalTableObject.appendEmptyTableRow();
    }
    
    rfCodeModalTableObject.restoreScrollPosition();
}
//#endregion
