/******************************************************************************/
/*
 * File:    group_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for device groups.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/



/******************************************************************************/
/*!
    @brief  Loads the group modal.
    @param  id                  Group ID
*/
/******************************************************************************/
function loadGroupModal(id=undefined) {
    groupModalObject.resetValidationElements();
    groupModalObject.setDeleteFunction(undefined);

    /* If no ID specified, new group */
    if (id == undefined) {
        groupModalObject.setTitle(TEXT_ADD_GROUP);
        groupModalObject.setSubmitFunction(() => addGroup());
        groupModalObject.resetValues();
        
        groupModalObject.show();
        return;
    }

    let group = groups[getIndexFromId(groups, id)];

    /* Updating existing group */
    let values = [
            group.icon,
            group.name,
            group.type,
            group.device_ids
        ]

    groupModalObject.setTitle(TEXT_EDIT_GROUP);
    groupModalObject.setSubmitFunction(() => updateGroup(id));
    updateGroupDevices(group);
    groupModalObject.setValues(values);
    groupModalObject.setFieldDisabled("groupTypeSelect", true, TEXT_NO_TYPE_CHANGE);
    groupModalObject.setIcon("groupIconModalBtn", group.icon + " fa-xl");

    const groupModalElem = document.getElementById(groupModalObject.id);
    groupModalObject.setDeleteFunction(() => deleteGroup(id, groupModalElem));
    groupModalObject.show();
}

/******************************************************************************/
/*!
    @brief  Validates the group input.
    @param  id                  Group ID
    @return bool                True if valid
*/
/******************************************************************************/
function validateGroup(id=-1) {
    let values = groupModalObject.validate(id);
    if (!values) {
        return false;
    }

    let data = {
        id: id,
        icon: values[0],
        name: values[1],
        type: parseInt(values[2]),
        device_ids: values[3],
    };
    
    return data;
}

/******************************************************************************/
/*!
    @brief  Updates devices suitable for the specified group.
    @param  group               Group object
*/
/******************************************************************************/
function updateGroupDevices(group=undefined) {
    const tiles = [];

    let type;

    if (group != undefined) {
        type = group.type;
    } else {
        type = parseInt(groupModalObject.getValue("groupTypeSelect"))
        if (type == -1) {
            tiles.push({
                id: "groupDeviceTile",
                title: TEXT_FIRST_SELECT_TYPE,
                icon: "fa-solid fa-square-xmark fa-xl",
                disabled: true
            });
            
            groupModalObject.setTileSelectOptions("groupDevicesTileSelect", tiles);
            return;
        }
    }

    for (const device of devices) {
        if (device.type != type) {
            continue;
        }

        tiles.push({
            id: "groupDeviceTile" + device.id,
            value: device.id,
            title: device.name,
            icon: device.icon
        });
    }

    if (tiles.length == 0) {
        tiles.push({
            id: "groupDeviceTile",
            title: TEXT_NO_DEVICES,
            icon: "fa-solid fa-square-xmark fa-xl",
            disabled: true
        });
    }

    groupModalObject.setTileSelectOptions("groupDevicesTileSelect", tiles);
}

//#region Group functions
/******************************************************************************/
/*!
    @brief  Adds a group to the system.
*/
/******************************************************************************/
async function addGroup() {
    let data = validateGroup();
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/add_group", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        groupModalObject.setErrorMessage(result.message);
        return;
    }

    updateGroupSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Updates the specified group.
    @param  id                  Group ID
*/
/******************************************************************************/
async function updateGroup(id) {
    let data = validateGroup(id);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/update_group", data, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        groupModalObject.setErrorMessage(result.message);
        return;
    }

    updateGroupSuccess(result, data);
}

/******************************************************************************/
/*!
    @brief  Handles the server response for updating or adding groups.
    @param  result              Server response to handle
  @param  data                New or updated group data
*/
/******************************************************************************/
function updateGroupSuccess(result, data) {
    let newGroup = data.id == -1;

    groups = result.message.groups;

    if (newGroup) {
        data.id = result.message.id;
        banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    } else {
        banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    }

    groupModalObject.close();

    /* Trigger event for pages to use */
    const action = newGroup ? "add" : "update";
    document.dispatchEvent(
        new CustomEvent("groupChanged", {detail: {id: data.id, action: action}})
    );
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before deleting the specified group.
    @param  id                  Group ID
*/
/******************************************************************************/
function deleteGroupConfirm(id) {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        let group = groups[getIndexFromId(groups, id)];
        popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE_GROUP(group.name), buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified group.
    @param  id                  Group ID
*/
/******************************************************************************/
async function deleteGroup(id) {
    const choice = await deleteGroupConfirm(id);
    if (choice == CHOICE_OPTION_CANCEL) return;

    let data = {
        id: id
    };

    const result = await httpPostRequestErrorBanner("/delete_group", data);
    if (result.status_code != HTTP_CODE_OK) return;

    let groupIndex = getIndexFromId(groups, id);
    groups.splice(groupIndex, 1);
    banners.show(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("groupChanged", {detail: {id: id, action: "delete"}})
    );
}
//#endregion




/******************************************************************************/
/*!
    @brief  Updates dashboard group power synchronized state.
    @param  group               Group to check
    @return array               When not synchronized, only false. When
                                synchronized, true and the state.
*/
/******************************************************************************/
function groupPowerIsSynchronized(group) {
    let deviceState;

    for (let deviceId of group.device_ids) {
        let deviceIndex = getIndexFromId(devices, deviceId);
        
        if (deviceState == undefined) {
            deviceState = devices[deviceIndex].power;
        } 
        
        if (devices[deviceIndex].power != deviceState) {
            return false;
        }
    }

    return [true, deviceState];
}

/******************************************************************************/
/*!
    @brief  Updates dashboard group brightness synchronized state.
    @param  group               Group to check
    @return array               When not synchronized, only false. When
                                synchronized, true and the state.
*/
/******************************************************************************/
function groupBrightnessIsSynchronized(group) {
    let deviceState;

    for (let deviceId of group.device_ids) {
        let deviceIndex = getIndexFromId(devices, deviceId);
        
        if (deviceState == undefined) {
            deviceState = devices[deviceIndex].brightness;
        } 
        
        if (devices[deviceIndex].brightness != deviceState) {
            return false;
        }
    }

    return [true, deviceState];
}



/******************************************************************************/
/*!
    @brief  Sends the group device power update command to the back-end.
    @param  id                  Group ID
*/
/******************************************************************************/
async function setGroupPower(id) {
    const group = groups[getIndexFromId(groups, id)];
    let index = getIndexFromId(groups, id);

    const power = !group.power;

    let data = {
        id: id,
        power: +power
    };

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner( "/set_group_power", data);
    if (result.status_code != HTTP_CODE_OK) return;

    group.power = power;
    
    for (let deviceId of group.device_ids) {
        let deviceIndex = getIndexFromId(devices, deviceId);
        devices[deviceIndex].power = group.power;
    }

    updateTileStates();
}

/******************************************************************************/
/*!
    @brief  Sends the group device brightness update command to the back-end.
    @param  id                  Group ID
*/
/******************************************************************************/
async function setLedstripGroupBrightness(id) {
    const group = groups[getIndexFromId(groups, id)];
    const tileObject = dashboardTileObjects.find(
        (dashboardTileObject) => dashboardTileObject.tile?.group_id === group.id
    );
    const brightness = tileObject.getRangeValue();

    let data = {
        id: group.id,
        brightness: brightness
    };

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/set_ledstrip_group_brightness", data);
    if (result.status_code != HTTP_CODE_OK) return;
    
    group.brightness = brightness;

    for (let deviceId of group.device_ids) {
        devices[getIndexFromId(devices, deviceId)].brightness = group.brightness;
    }

    updateTileStates();
}