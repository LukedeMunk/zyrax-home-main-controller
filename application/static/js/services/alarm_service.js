/******************************************************************************/
/*
 * File:    alarm_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for alarms.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/


//#region Deactivation device functionality
/******************************************************************************/
/*!
    @brief  Validates the specified deactivation device.
    @param  id                  ID of the device
    @param  manually            If true, the device is added manually
*/
/******************************************************************************/
function validateDeactivationDevice(id=-1, manually=false) {
    /* Get user input */
    let name = deactivationDeviceNameTxtElem.value;
    let ipAddress = deactivationDeviceIpTxtElem.value;

    if (!manually) {
        ipAddress = undefined;
        for (let device of networkDevices) {
            if (document.getElementById("deactivationDeviceTile" + device.id).classList.contains("tile-selected")) {
                ipAddress = device.ip_address;
                break;
            }
        }
    }

    /* Reset error styling */
    errorMessageDeactivationDeviceFieldElem.style.display = "none";

    deactivationDeviceNameTxtElem.classList.remove("invalid-input");
    deactivationDeviceIpTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        deactivationDeviceNameTxtElem.classList.add("invalid-input");
        deactivationDeviceNameTxtElem.focus();
        errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        return false;
    }

    /* Validate IP */
    if (!manually && ipAddress == undefined) {
        errorMessageDeactivationDeviceFieldElem.textContent = TEXT_PLEASE_SELECT_DEVICE;
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        return false;
    } else {
        if (ipAddress == "") {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_REQUIRED;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
        
        if (!ipAddress.match(IP_RE)) {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_INVALID_IP;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
    }

    for (let deactivationDevice of alarm.deactivation_devices) {
        if (deactivationDevice.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (deactivationDevice.name == name) {
            deactivationDeviceNameTxtElem.classList.add("invalid-input");
            deactivationDeviceNameTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }

        /* Check if IP is unique */
        if (deactivationDevice.ip_address == ipAddress) {
            deactivationDeviceIpTxtElem.classList.add("invalid-input");
            deactivationDeviceIpTxtElem.focus();
            errorMessageDeactivationDeviceFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
            return false;
        }
    }

    lastDeactivationDeviceData = {
        id : id,
        name : name,
        ip_address : ipAddress
    }
    
    return true;
}

/******************************************************************************/
/*!
    @brief  Adds a new deactivation device to the back-end.
    @param  manually            If true, the device is added manually
*/
/******************************************************************************/
async function addDeactivationDevice(manually=false) {
    if (!validateDeactivationDevice(-1, manually)) {
        return;
    }

    const result = await httpPostRequestJsonReturn("/add_deactivation_device", lastDeactivationDeviceData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        errorMessageDeactivationDeviceFieldElem.textContent = result.message;
        return;
    }

    lastDeactivationDeviceData.id = result.message.id;       
    alarm.deactivation_devices.push(lastDeactivationDeviceData);
    banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    loadDeactivationDeviceTiles();
    closeModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
    @brief  Updates the specified deactivation device.
    @param  id                  ID of the device
*/
/******************************************************************************/
async function updateDeactivationDevice(id) {
    if (!validateDeactivationDevice(id)) {
        return;
    }

    const result = await httpPostRequestJsonReturn("/update_deactivation_device", lastDeactivationDeviceData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageDeactivationDeviceFieldElem.style.display = "inline-block";
        errorMessageDeactivationDeviceFieldElem.textContent = result.message;
        return;
    }

    let index = getIndexFromId(alarm.deactivation_devices, id);
    alarm.deactivation_devices[index].name = lastDeactivationDeviceData.name
    alarm.deactivation_devices[index].ip_address = lastDeactivationDeviceData.ip_address;
    
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    loadDeactivationDeviceTiles();
    closeModal(deactivationDeviceModalElem);
}

/******************************************************************************/
/*!
    @brief  Confirmation before deleting the specified deactivation device.
    @param  deactivationDeviceName  Name of the device
*/
/******************************************************************************/
function deleteDeactivationDeviceConfirm(deactivationDeviceName) {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(deactivationDeviceName), buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified deactivation device.
    @param  id                  ID of the device
*/
/******************************************************************************/
async function deleteDeactivationDevice(id) {
    let device = alarm.deactivation_devices[getIndexFromId(alarm.deactivation_devices, id)];
    const choice = await deleteDeactivationDeviceConfirm(device.name);
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/delete_deactivation_device", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    for (let i = 0; i < alarm.deactivation_devices.length; i++) {
        if (alarm.deactivation_devices[i].id == id) {
            alarm.deactivation_devices.splice(i, 1);
            break;
        }
    }

    loadDeactivationDeviceTiles();
    banners.show(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}
//#endregion

//#region Trigger device functionality
/******************************************************************************/
/*!
    @brief  Adds the selected trigger device to the alarm.
    @param  id              ID of the trigger device
*/
/******************************************************************************/
async function addTriggerDevice(id) {
    const result = await httpPostRequestErrorBanner("/add_alarm_trigger_device", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;
    
    alarm.trigger_device_ids.push(id);
    banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
    @brief  Deletes the selected trigger device from the alarm.
    @param  id              ID of the trigger device
*/
/******************************************************************************/
async function deleteTriggerDevice(id) {
    const result = await httpPostRequestErrorBanner("/delete_alarm_trigger_device", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;
    
    for (let i = 0; i < alarm.trigger_device_ids.length; i++) {
        if (alarm.trigger_device_ids[i] == id) {
            alarm.trigger_device_ids.splice(i, 1);
            break;
        }
    }
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}
//#endregion




/******************************************************************************/
/*!
    @brief  Toggles the alarm armed state.
*/
/******************************************************************************/
async function toggleAlarmArmed() {
    alarm.armed = !alarm.armed;
    pauseRefreshes();

    const result = await httpPostRequestErrorBanner("/update_alarm", {armed: +alarm.armed});
    if (result.status_code != HTTP_CODE_OK) return;
    
    updateTileStates();
}


/******************************************************************************/
/*!
    @brief  Deactivates the alarm.
*/
/******************************************************************************/
async function deactivateAlarm() {
    const result = await httpPostRequestJsonReturn("/update_alarm", {activated: 0});
    
    if (result.status_code != HTTP_CODE_OK) {
        banners.show(TEXT_ERROR, result.message, MESSAGE_TYPE_ERROR);
        errorMessageLedstripFieldElem.style.display = "inline-block";
        errorMessageLedstripFieldElem.textContent = result.message;
        return;
    }
    
    banners.show(TEXT_SUCCESS, TEXT_ALARM_DEACTIVATED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
}