/******************************************************************************/
/*
 * File:   dashboard_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for UI dashboards.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/

/******************************************************************************/
/*!
    @brief  Loads the dashboard configuration modal.
    @param  id                  Group ID
*/
/******************************************************************************/
function loadDashboardConfigurationModal(id=undefined) {
    dashboardConfigurationModalObject.resetValidationElements();
    dashboardConfigurationModalObject.setDeleteFunction(undefined);

    /* If no ID specified, new dashboard */
    if (id == undefined) {
        dashboardConfigurationModalObject.setTitle(TEXT_ADD_DASHBOARD);
        dashboardConfigurationModalObject.setSubmitFunction(() => addDashboardConfiguration());
        dashboardConfigurationModalObject.resetValues();
        dashboardConfigurationModalObject.show();
        return;
    }

    let dashboard = dashboardConfigurations[getIndexFromId(dashboardConfigurations, id)];

    /* Updating existing dashboard */
    let values = [
            dashboard.icon,
            dashboard.name,
        ]

    dashboardConfigurationModalObject.setTitle(TEXT_EDIT_DASHBOARD);
    dashboardConfigurationModalObject.setSubmitFunction(() => updateDashboardConfiguration(id));
    dashboardConfigurationModalObject.setDeleteFunction(() => deleteDashboardConfiguration(id));
    dashboardConfigurationModalObject.setValues(values);
    dashboardConfigurationModalObject.setIcon("dashboardIconModalBtn", dashboard.icon + " fa-xl");
    
    dashboardConfigurationModalObject.show();
}

/******************************************************************************/
/*!
    @brief  Loads the add tile modal.
*/
/******************************************************************************/
function loadAddTileModal() {
    addTileModalObject.resetValues();
    addTileModalObject.resetMessage();
    addTileModalObject.setBlockVisibility("addTileTargetSelectContainer", false);
    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", []);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", false);
    addTileModalObject.show();
}

/******************************************************************************/
/*!
    @brief  Loads the group modal.XX
    @param  id                  Group ID
*/
/******************************************************************************/
function loadDashboardConfigurationOverviewModal() {
    dashboardConfigurationOverviewModalObject.setTitle(TEXT_DASHBOARDS_OVERVIEW);
    dashboardConfigurationOverviewModalObject.show();
}

/******************************************************************************/
/*!
    @brief  Validates the specified dashboard configuration.
    @param  id                 Dashboard ID
    @return bool               True if valid
*/
/******************************************************************************/
function validateDashboardInput(id=-1) {
    let values = dashboardConfigurationModalObject.validate(id);
    if (!values) {
        return false;
    }

    let data = {
        id: id,
        icon: values[0],
        name: values[1]
    };
    
    return data;
}

//#region Dashboard configuration functionality
/******************************************************************************/
/*!
    @brief  Adds a dashboard configuration.
    @return bool               True if successful
*/
/******************************************************************************/
async function addDashboardConfiguration() {
    let data = validateDashboardInput();
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/add_dashboard_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        dashboardConfigurationModalObject.setErrorMessage(result.message);
        return;
    }

    /* Success. Save in frontend */
    dashboardConfigurations = result.message.dashboard_configurations;

    banners.show(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    dashboardConfigurationModalObject.close();

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("dashboardConfigurationChanged", {detail: {id: result.message.id, action: "add"}})
    );
}

/******************************************************************************/
/*!
    @brief  Updates the selected dashboard configuration.
    @return bool               True if successful
*/
/******************************************************************************/
async function updateDashboardConfiguration(id) {
    let data = validateDashboardInput(id);
    if (!data) {
        return;
    }

    let result = await httpPostRequestJsonReturn("/update_dashboard_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        dashboardConfigurationModalObject.setErrorMessage(result.message);
        return;
    }

    /* Success. Save in frontend */
    dashboardConfigurations = result.message.dashboard_configurations;

    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    dashboardConfigurationModalObject.close();

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("dashboardConfigurationChanged", {detail: {id: id, action: "update"}})
    );
}

/******************************************************************************/
/*!
    @brief  Shows a confirmation before deleting the selected dashboard
            configuration.
*/
/******************************************************************************/
function deleteDashboardConfigurationConfirm() {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_DASHBOARD, buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the selected dashboard configuration.
*/
/******************************************************************************/
async function deleteDashboardConfiguration(id) {
    const choice = await deleteDashboardConfigurationConfirm();
    if (choice == CHOICE_OPTION_CANCEL) return;
    
    let data = {
        id: id
    }

    let result = await httpPostRequestErrorBanner("/delete_dashboard_configuration", data);
    if (result.status_code != HTTP_CODE_OK) return;

    let index = getIndexFromId(dashboardConfigurations, id);
    dashboardConfigurations.splice(index, 1);

    dashboardConfigurationModalObject.close();
    selectedDashboardId = dashboardConfigurations[0]?.id;
    configureDashboardMode = false;
    banners.show(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("dashboardConfigurationChanged", {detail: {id: selectedDashboardId, action: "delete"}})
    );
}


//#region Dashboard tile configuration functionality
/******************************************************************************/
/*!
    @brief  Resets the selected dashboard configuration tile ordering.
*/
/******************************************************************************/
async function resetDashboardConfiguration() {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboardId)];

    let data = {
        id: configuration.id
    }

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/reset_dashboard_tile_order", data);
    if (result.status_code != HTTP_CODE_OK) return;
    
    dashboardConfigurations = result.message.dashboard_configurations;

    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
    @brief  Adds a tile to the selected dashboard.
    @param  size                Tile size
*/
/******************************************************************************/
async function addTile(size) {
    let configIndex = getIndexFromId(dashboardConfigurations, selectedDashboardId);
    const tileType = parseInt(addTileModalObject.getValue("addTileTypeSelect"));
    const tileTarget = parseInt(addTileModalObject.getValue("addTileTargetSelect"));

    const position = dashboardGridObject.findAvailablePosition(size);
    let tile = {
        configuration_id: dashboardConfigurations[configIndex].id,
        type: tileType,
        size: size,
        position_x: position.x,
        position_y: position.y
    }

    if (tile.type == TILE_TYPE_DEVICE) {
        tile.device_id = tileTarget;
    } else if (tile.type == TILE_TYPE_GROUP) {
        tile.group_id = tileTarget;
    } else if (tile.type == TILE_TYPE_AUTOMATION) {
        tile.automation_id = tileTarget;
    }

    pauseRefreshes();

    const result = await httpPostRequestErrorBanner("/add_dashboard_tile", tile);
    if (result.status_code != HTTP_CODE_OK) return;
    
    tile.id = result.message.id;
    dashboardConfigurations[configIndex].tiles.push(tile);
    
    addTileModalObject.close();
    loadDashboardConfiguration();
    updateTileStates();
}

/******************************************************************************/
/*!
    @brief  Changes the tile size of the specified tile on the selected
            dashboard.
    @param  tileArrayIndex      Tile index
    @param  size                Tile size
*/
/******************************************************************************/
async function changeTileSize(tileArrayIndex, size) {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboardId)];

    const tile = configuration.tiles[tileArrayIndex];
    const position = dashboardGridObject.findAvailablePosition(size, tile.id);
    let data = {
        id: configuration.tiles[tileArrayIndex].id,
        size: size,
        position_x: position.x,
        position_y: position.y
    }

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/update_dashboard_tile", data);
    if (result.status_code != HTTP_CODE_OK) return;
    
    configuration.tiles[tileArrayIndex].size = size;
    configuration.tiles[tileArrayIndex].position_x = position.x;
    configuration.tiles[tileArrayIndex].position_y = position.y;
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
    @brief  Changes the position of one dashboard tile.
    @param  id                  Tile ID
    @param  positionX           Horizontal grid coordinate
    @param  positionY           Vertical grid coordinate
*/
/******************************************************************************/
async function changeTilePosition(id, positionX, positionY) {
    const data = {
        id: id,
        position_x: positionX,
        position_y: positionY
    };

    pauseRefreshes();
    const result = await httpPostRequestErrorBanner("/update_dashboard_tile", data);

    if (result.status_code != HTTP_CODE_OK) {
        loadDashboardConfiguration();
        return false;
    }

    return true;
}

/******************************************************************************/
/*!
    @brief  Changes the order of the tiles.
    @param  id                  Tile ID
    @param  configurationIndex  Configuration index
    @param  newIndex            New index
*/
/******************************************************************************/
async function changeTileIndex(id, configurationIndex, newIndex) {
    let data = {
        id: id,
        index: newIndex
    }
    
    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/update_dashboard_tile", data);
    if (result.status_code != HTTP_CODE_OK) return;

    dashboardConfigurations[configurationIndex].tiles[getIndexFromId(dashboardConfigurations[configurationIndex].tiles, id)].index = newIndex;
}

/******************************************************************************/
/*!
    @brief  Deletes the specified tile.
    @param  id                  Tile ID
*/
/******************************************************************************/
async function deleteTile(id) {
    const choice = await deleteTileConfirm();
    if (choice == CHOICE_OPTION_CANCEL) {
        return;
    }

    let data = {
        id: id
    }

    pauseRefreshes();
    
    const result = await httpPostRequestErrorBanner("/delete_dashboard_tile", data);
    if (result.status_code != HTTP_CODE_OK) return;

    let configIndex = getIndexFromId(dashboardConfigurations, selectedDashboardId)

    let index = getIndexFromId(dashboardConfigurations[configIndex].tiles, id);
    dashboardConfigurations[configIndex].tiles.splice(index, 1);
    banners.show(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
    @brief  Shows confirmation before deleting a tile.
  @return                       Selected confirmation option
*/
/******************************************************************************/
function deleteTileConfirm() {
    return new Promise((resolve) => {
        const buttons = [
            DELETE_POPUP_BUTTON(resolve),
            CANCEL_POPUP_BUTTON(resolve)
        ];
        popups.show(
            TEXT_Q_ARE_YOU_SURE,
            TEXT_Q_DELETE_TILE,
            buttons,
            MESSAGE_TYPE_WARNING
        );
    });
}
//#endregion



/******************************************************************************/
/*!
    @brief  Loads the icons for the specified element ID and shows the modal.
*/
/******************************************************************************/
function loadDashboardIconModal() {
    loadDashboardIconOptions();
    iconPickerObject.show();
}

/******************************************************************************/
/*!
    @brief  Sets the specified icon to the specified DOM element.
    @param  icon                Icon to set
*/
/******************************************************************************/
function pickDashboardIcon(icon) {
    dashboardConfigurationModalObject.setValue("dashboardIconTxt", icon);
    dashboardConfigurationModalObject.setIcon("dashboardIconModalBtn", icon + " fa-xl");
    iconPickerObject.close();
}

/******************************************************************************/
/*!
    @brief  Updates the tile type and loads the necessary DOM elements.
*/
/******************************************************************************/
function updateModalTileType() {
    const tileType = parseInt(addTileModalObject.getValue("addTileTypeSelect"));
    const definition = DASHBOARD_TILE_TYPE_DEFINITIONS.get(tileType);
    const configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboardId)];

    addTileModalObject.setBlockVisibility("addTileTargetSelectContainer", false);
    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", []);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", false);

    if (!definition) {
        return;
    }

    if (!definition.getTargets) {
        definition.generatePreviews();
        return;
    }

    const configuredTargetIds = new Set(
        configuration.tiles
            .map((tile) => tile[definition.targetKey])
            .filter((targetId) => targetId != null)
    );
    const selectOptions = definition.getTargets()
        .filter((target) => !configuredTargetIds.has(target.id))
        .map((target) => ({
            value: target.id,
            text: target.name
        }));

    selectOptions.unshift({value: -1, text: ""});
    addTileModalObject.setSelectOptions("addTileTargetSelect", selectOptions);
    addTileModalObject.setBlockVisibility("addTileTargetSelectContainer", true);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}
