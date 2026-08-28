/******************************************************************************/
/*
 * File:    device_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for devices.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/

/******************************************************************************/
/*!
    @brief  Loads the specific device modal for the specified model.
    @param  modelId             Device model ID
*/
/******************************************************************************/
function loadDeviceAddModal(modelId) {
    if (DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, modelId, "model_id")].type == DEVICE_TYPE_LEDSTRIP) {
        loadLedstripModal(undefined, modelId);
    } else if (DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, modelId, "model_id")].type == DEVICE_TYPE_RF_DEVICE) {
        loadRfDeviceModal(undefined, modelId);
    } else if (DEVICE_MODELS[getIndexFromId(DEVICE_MODELS, modelId, "model_id")].type == DEVICE_TYPE_IP_CAMERA) {
        //
    }
}

/******************************************************************************/
/*!
    @brief  Loads the device modal.
    @param  manualPairing       If true, the supported devices can be chosen for
                                manual setup
*/
/******************************************************************************/
function loadDeviceModal(manualPairing=false) {
    deviceCategoryContainerElem.innerHTML = "";

    for (let category of DEVICE_CATEGORIES) {
        if (!RF_RECEIVER_PRESENT && category.device_models[0].type == DEVICE_TYPE_RF_DEVICE) {
            continue;
        }

        const categoryBtnElem = document.createElement("button");
        categoryBtnElem.className = "icon-text-button";
        categoryBtnElem.style.justifyContent = "space-between";
        categoryBtnElem.style.padding = "0px 10px";
        categoryBtnElem.textContent = category.name;
        categoryBtnElem.onclick = () => loadDeviceModels(category.category);
        
        let icon = document.createElement("i");
        icon.className = category.icon;
        icon.style.fontSize = "var(--font-size-h2)";
        
        categoryBtnElem.appendChild(icon);
        deviceCategoryContainerElem.appendChild(categoryBtnElem);
    }

    if (manualPairing) {
        searchingDevicesContainerElem.style.display = "none";
        automaticDevicePairContainerElem.style.display = "none";
        manualDevicePairContainerElem.style.display = "block";

        showModal(deviceModalElem);
        return;
    }

    isFetchingUnconfiguredDevices = true;
    searchingDevicesContainerElem.style.display = "flex";
    automaticDevicePairContainerElem.style.display = "grid";
    manualDevicePairContainerElem.style.display = "none";
    loadUnconfiguredDevices();
    showModal(deviceModalElem);
}

/******************************************************************************/
/*!
    @brief  Opens the modal for the selected unconfigured device type.
    @param  hostname            Hostname of the devicet
*/
/******************************************************************************/
function addUnconfiguredDevice(hostname) {
    isFetchingUnconfiguredDevices = false;

    ledstripHostnameTxtElem.value = hostname;

    let index = 0;
    for (device of unconfiguredDevices) {
        if (device.hostname == hostname) {
            unconfiguredDevices.splice(index, 1);
            break;
        }
        index++;
    }

    //TODO: check device type
    loadLedstripModal(undefined, undefined, hostname);
}

/******************************************************************************/
/*!
    @brief  Sends the device power update command to the back-end.
    @param  id                  Device ID
*/
/******************************************************************************/
async function setDevicePower(id) {
    const device = devices[getIndexFromId(devices, id)];

    const power = !device.power;

    let data = {
        id: id,
        power: +power
    };

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/set_device_power", data);
    if (result.status_code != HTTP_CODE_OK) return;

    device.power = power;

    updateTileStates();
}

/******************************************************************************/
/*!
    @brief  Redirects to the logs page of the specified device.
    @param  id                  Device ID
*/
/******************************************************************************/
function downloadLogs(id) {
    let device = devices[getIndexFromId(devices, id)];
    window.open("http://" + device.hostname + "/download_logs", "_blank")
}

/******************************************************************************/
/*!
    @brief  Reboots the specified device.
    @param  id                  Device ID
*/
/******************************************************************************/
async function rebootDevice(id) {
    const result = await httpPostRequestErrorBanner("/reboot_ledstrip", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    banners.show(TEXT_SUCCESS, TEXT_LEDSTRIP_RESETTED, MESSAGE_TYPE_SUCCESS);
}