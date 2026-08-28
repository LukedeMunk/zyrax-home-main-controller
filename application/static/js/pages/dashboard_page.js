/******************************************************************************/
/*
 * File:    dashboard_page.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   JavaScript for the dashboard page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */

/* Fields */
const errorMessageWeatherLocationFieldElem = document.getElementById("errorMessageWeatherLocationField");

/* Buttons */

/* Icons */

/* Input elements */
const weatherLocationTxtElem = document.getElementById("weatherLocationTxt");

/* Tables */

/* Modals */
const weatherLocationModalElem = document.getElementById("weatherLocationModal");


/* Other */
const dashboardGridElem = document.getElementById("dashboardGrid");
const dashboardConfigurationPanelElem = document.getElementById("dashboardConfigurationPanel");
const dashboardEmptyStateElem = document.getElementById("dashboardEmptyState");
//#endregion

//#region Constants
//#endregion

//#region Variables
let lastMouseButtonPressed;
let mouseContextMenuTileId;
let configureDashboardMode = false;
let selectedDashboardId;
let isFetchingStates = false;
let weatherLoading = false;
let dashboardTileObjects = [];

const DASHBOARD_TILE_TYPE_DEFINITIONS = new Map([
    [TILE_TYPE_DEVICE, {
        targetKey: "device_id",
        getTargets: () => devices,
        generatePreviews: (target) => generateDeviceTilePreviews(target)
    }],
    [TILE_TYPE_GROUP, {
        targetKey: "group_id",
        getTargets: () => groups,
        generatePreviews: (target) => generateDeviceTilePreviews(target)
    }],
    [TILE_TYPE_AUTOMATION, {
        targetKey: "automation_id",
        getTargets: () => automations,
        generatePreviews: (target) => generateAutomationTilePreviews(target)
    }],
    [TILE_TYPE_DATETIME, {
        generatePreviews: () => generateStaticTilePreviews(
            [TILE_SIZE_1X2, TILE_SIZE_2X4, TILE_SIZE_2X2],
            (size) => new DateTimeTile({size: size, previewTile: true})
        )
    }],
    [TILE_TYPE_WEATHER, {
        generatePreviews: () => generateStaticTilePreviews(
            [TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_4X4],
            (size) => new WeatherTile({size: size, previewTile: true})
        )
    }],
    [TILE_TYPE_ALARM, {
        generatePreviews: () => generateStaticTilePreviews(
            [TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_4X4],
            (size) => new AlarmTile({
                title: TEXT_ALARM,
                size: size,
                previewTile: true,
                icon: {
                    icon: "fa-duotone fa-solid fa-shield-halved"
                },
                subtitle1: TEXT_AUTO_ARM_ENABLED
            })
        )
    }]
]);

const contextMouseMenuObject = new MouseContextMenu();
const dashboardGridObject = new DashboardGrid(
    dashboardGridElem,
    (tileId, positionX, positionY) => changeTilePosition(
        tileId,
        positionX,
        positionY
    )
);

const dashboardConfigurationModalObject = new ModalForm(DASHBOARD_CONFIGURATION_MODAL_CONFIGURATION);
const addTileModalObject = new ModalForm(ADD_TILE_MODAL_CONFIGURATION);
const iconPickerObject = new IconPicker(ICON_PICKER_MODAL_CONFIGURATION);

const dashboardNavigationBarObject = new FloatingNavigationBar();
//#endregion

document.addEventListener("dashboardConfigurationChanged", (e) => {
    if (e.detail.action == "add") {
        configureDashboardMode = true;
    } else {
        configureDashboardMode = false;
    }

    selectedDashboardId = e.detail.id;
    loadDashboardConfiguration();
});

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();

    dashboardConfigurationModalObject.render();
    addTileModalObject.render();
    iconPickerObject.render();

    //if (MOBILE_VERSION) {
    //    dashboardGridElem.style.width = "95%";
    //} else {
    //    dashboardGridElem.style.width = "90%";
    //    dashboardGridElem.style.marginRight = "90px";
    //}

    selectedDashboardId = dashboardConfigurations[0]?.id;

    /* Load dashboard cookie */
    if (localStorage.getItem("selectedDashboardId") != undefined) {
        const storedDashboardId = parseInt(localStorage.getItem("selectedDashboardId"));
        if (getIndexFromId(dashboardConfigurations, storedDashboardId) != -1) {
            selectedDashboardId = storedDashboardId;
        }
    }

    loadDashboardIconOptions();
    loadDashboardConfiguration();
    generateMouseContextMenuDashboard();

    isFetchingStates = true;
    fetchStates();
});

//#region Generate functionality
/******************************************************************************/
/*!
    @brief  Loads the specified dashboard configuration.
    @param  id                  Dashboard ID
    @param  save                When true, the specified dashboard gets saved as
                                cookie
*/
/******************************************************************************/
function loadDashboardConfiguration(id=undefined, save=true) {
    if (id == undefined) {
        id = selectedDashboardId;
    } else {
        selectedDashboardId = id;
        configureDashboardMode = false;
    }

    if (save && selectedDashboardId != null) {
        localStorage.setItem("selectedDashboardId", selectedDashboardId);
    }

    loadDashboardControls();
    if (selectedDashboardId == null || getIndexFromId(dashboardConfigurations, selectedDashboardId) == -1) {
        dashboardGridElem.replaceChildren();
        dashboardEmptyStateElem.hidden = false;
        dashboardConfigurationPanelElem.hidden = true;
        return;
    }

    dashboardEmptyStateElem.hidden = true;
    renderDashboard(id);
    updateTileStates(true);
    loadSideBar();
    

    dashboardNavigationBarObject.setButtonSelected("dashboardNavBtn" + id, true);
        
    if (configureDashboardMode) {
        dashboardNavigationBarObject.setButtonIcon("editDashboardNavBtn", "fa-duotone fa-solid fa-floppy-disk fa-lg");
    } else {
        dashboardNavigationBarObject.setButtonIcon("editDashboardNavBtn", "fa-duotone fa-solid fa-pen-to-square fa-lg");
    }
}

/******************************************************************************/
/*!
    @brief  Loads the dashboard configurations in the top bar.
*/
/******************************************************************************/
function loadSideBar() {
    const dashboardBarStructure = {
        ...DASHBOARD_BAR_CONFIGURATION,
        buttons: DASHBOARD_BAR_CONFIGURATION.buttons.map(button => ({
            ...button,
            pages: [...(button.pages ?? [])],
        })),
    };

    for (let dashboard of dashboardConfigurations) {
        const button = {
            id: "dashboardNavBtn" + dashboard.id,
            title: dashboard.name,
            type: NAVIGATION_BUTTON_PAGE,
            onclickFunction: () => loadDashboardConfiguration(dashboard.id),
            icon: dashboard.icon
        };

        dashboardBarStructure.buttons.unshift(button);
    }

    dashboardNavigationBarObject.setConfiguration(dashboardBarStructure);
    dashboardNavigationBarObject.render();
}

/******************************************************************************/
/*!
    @brief  Renders all dashboard tiles in the configured order.
    @param  dashboardConfiguration    Configuration received from the backend
*/
/******************************************************************************/
function renderDashboard(id) {
    dashboardGridElem.replaceChildren();
    dashboardTileObjects = [];

    const configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, id)];
    if (!configuration) {
        console.warn("Dashboard configuration not found:", id);
        return;
    }

    const tiles = [...configuration.tiles].sort(
        (firstTile, secondTile) => firstTile.index - secondTile.index
    );

    const fragment = document.createDocumentFragment();

    for (const tile of tiles) {
        const tileObject = createDashboardTile(tile);

        if (tileObject) {
            const tileElem = tileObject.render();
            prepareDashboardTileElement(tileElem, tile);
            fragment.appendChild(tileElem);
            dashboardTileObjects.push(tileObject);
        }

    }

    /* Generate add tile */
    if (tiles.length == 0 || (configureDashboardMode && selectedDashboardId != -1)) {
        const tileObject = createDashboardTile({type: TILE_TYPE_ADD});
        fragment.appendChild(tileObject.render());
        dashboardTileObjects.push(tileObject);
    }

    dashboardGridElem.appendChild(fragment);
    dashboardGridObject.setConfiguration(tiles, configureDashboardMode);
}

/******************************************************************************/
/*!
    @brief  Adds shared accessibility and mobile options to a rendered tile.
    @param  tileElem            Rendered tile element
    @param  tile                Dashboard tile configuration
*/
/******************************************************************************/
function prepareDashboardTileElement(tileElem, tile) {
    if (configureDashboardMode) {
        tileElem.removeAttribute("role");
        tileElem.removeAttribute("tabindex");

        if (!tileElem.querySelector(".dashboard-tile-options-button") && MOBILE_VERSION) {
            tileElem.appendChild(createDashboardTileOptionsButton(tile.id));
        }
        return;
    }

    if (tileElem.onclick && !tileElem.hasAttribute("role")) {
        tileElem.setAttribute("role", "button");
        tileElem.tabIndex = 0;
        tileElem.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            tileElem.click();
        });
    }
}

/******************************************************************************/
/*!
    @brief  Creates one dashboard tile.
    @param  tile                    Tile configuration received from backend
    @return                          Tile DOM element
*/
/******************************************************************************/
function createDashboardTile(tile) {
    if (tile.type == TILE_TYPE_DATETIME) {
        return new DateTimeTile({tile: tile});
    }

    if (tile.type == TILE_TYPE_WEATHER) {
        return new WeatherTile({tile: tile});
    }

    if (tile.type === TILE_TYPE_DEVICE) {
        return generateDeviceTile(tile);
    }

    if (tile.type == TILE_TYPE_GROUP) {
        return generateGroupTile(tile);
    }

    if (tile.type == TILE_TYPE_ALARM) {
        return generateAlarmTile(tile);
    }

    if (tile.type === TILE_TYPE_AUTOMATION) {
        const automation = automations.find(
            (automation) => automation.id === tile.automation_id
        );

        if (!automation) {
            console.warn("Automation for dashboard tile not found:", tile.id);
            return null;
        }

        let tileObject;
        tileObject = new AutomationTile({
            id: "automation" + tile.id,
            title: automation.name,
            subtitle1: TEXT_READY_TO_RUN,
            subtitle2: automation.action,
            icons: [{icon: "fa-duotone fa-solid fa-bolt"}],
            tile: tile,
            tapToRun: true,
            onclickFunction: (event) => runDashboardAutomation(
                event,
                automation.id,
                tileObject
            )
        });

        return tileObject;
    }

    if (tile.type === TILE_TYPE_SPACER) {
        return createSpacerTile(tile.size);
    }

    if (tile.type === TILE_TYPE_ADD) {
        return generateAddTile(() => loadAddTileModal());
    }

    console.warn("Unknown dashboard tile type:", tile.type);

    return null;
}

/******************************************************************************/
/*!
    @brief  Creates an invisible tile that reserves grid space.
    @param  tile                    Spacer configuration
    @return                          Spacer DOM element
*/
/******************************************************************************/
function createSpacerTile(size=TILE_SIZE_1X1) {
    const spacerElem = document.createElement("div");

    spacerElem.className = getClassFromSize(size) + " tile-spacer";
    spacerElem.setAttribute("aria-hidden", "true");

    return spacerElem;
}

/******************************************************************************/
/*!
    @brief  Generates tile previews for the add tile modal.
*/
/******************************************************************************/
function generateTileTargetPreviews() {
    const tileType = parseInt(addTileModalObject.getValue("addTileTypeSelect"));
    const targetId = parseInt(addTileModalObject.getValue("addTileTargetSelect"));
    const definition = DASHBOARD_TILE_TYPE_DEFINITIONS.get(tileType);

    if (!definition?.getTargets || Number.isNaN(targetId)) {
        return;
    }

    const target = definition.getTargets().find(
        (item) => item.id === targetId
    );
        console.log(target)
    if (target) {
        definition.generatePreviews(target);
    }
}

/******************************************************************************/
/*!
    @brief  Generates tile previews from one reusable tile factory.
    @param  sizes               Supported sizes
    @param  tileFactory         Creates a tile object for one size
*/
/******************************************************************************/
function generateStaticTilePreviews(sizes, tileFactory) {
    const tileElements = sizes.map((size) => {
        const tileObject = tileFactory(size);
        tileObject.onclickFunction = () => addTile(size);
        return tileObject.render();
    });

    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", tileElements);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}

/******************************************************************************/
/*!
    @brief  Generates automation tile previews.
    @param  automation          Automation to preview
*/
/******************************************************************************/
function generateAutomationTilePreviews(automation) {
    const tileElements = [];

    for (const size of [TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2]) {
        tileElements.push(new AutomationTile({
            id: "automationPreview" + size,
            title: automation.name,
            subtitle1: TEXT_READY_TO_RUN,
            subtitle2: automation.action,
            icons: [{icon: "fa-duotone fa-solid fa-bolt"}],
            size: size,
            previewTile: true,
            tapToRun: true,
            onclickFunction: () => addTile(size)
        }).render());
    }

    console.log(tileElements)

    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", tileElements);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}

/******************************************************************************/
/*!
    @brief  Creates an invisible tile that reserves grid space.
    @param  tile                    Spacer configuration
    @return                          Spacer DOM element
*/
/******************************************************************************/
function generateDeviceTilePreviews(target) {
    if (target.type === DEVICE_TYPE_LEDSTRIP) {
        generateLedstripTilePreviews(target);
    }
    
    if (target.type === DEVICE_TYPE_RF_DEVICE) {
        generateSensorTilePreviews(target);
    }
    
    if (target.type === DEVICE_TYPE_IP_CAMERA) {
        generateCameraTilePreviews(target);
    }
}

/******************************************************************************/
/*!
    @brief  Creates an invisible tile that reserves grid space.
    @param  tile                    Spacer configuration
    @return                          Spacer DOM element
*/
/******************************************************************************/
function generateLedstripTilePreviews(target) {
    const tileElements = []
    tileElements.push(new LedstripTile({
        title: target.name,
        size: TILE_SIZE_1X1,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_1X1),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    tileElements.push(new LedstripTile({
        title: target.name,
        size: TILE_SIZE_1X2,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_1X2),
        icon: {icon: target.icon + " fa-xl"}
    }).render());
    
    tileElements.push(new LedstripTile({
        title: target.name,
        size: TILE_SIZE_2X2,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_2X2),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", tileElements);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}

/******************************************************************************/
/*!
    @brief  Creates an invisible tile that reserves grid space.
    @param  tile                    Spacer configuration
    @return                          Spacer DOM element
*/
/******************************************************************************/
function generateSensorTilePreviews(target) {
    const tileElements = []
    tileElements.push(new RfDeviceTile({
        title: target.name,
        size: TILE_SIZE_1X1,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_1X1),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    tileElements.push(new RfDeviceTile({
        title: target.name,
        size: TILE_SIZE_1X2,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_1X2),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", tileElements);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}

/******************************************************************************/
/*!
    @brief  Creates an invisible tile that reserves grid space.
    @param  tile                    Spacer configuration
    @return                          Spacer DOM element
*/
/******************************************************************************/
function generateCameraTilePreviews(target) {
    return;
    const tileElements = []
    tileElements.push(new CameraTile({
        title: target.name,
        size: TILE_SIZE_1X1,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_1X1),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    tileElements.push(new CameraTile({
        title: target.name,
        size: TILE_SIZE_4X4,
        previewTile: true,
        onclickFunction: () => addTile(TILE_SIZE_4X4),
        icon: {icon: target.icon + " fa-xl"}
    }).render());

    addTileModalObject.setTileSelectElements("addTilePreviewTileSelect", tileElements);
    addTileModalObject.setBlockVisibility("addTilePreviewTileSelectContainer", true);
}

//#region Generate device tiles
/******************************************************************************/
/*!
    @brief  Changes the brightness sliders of the group devices when group
            brightness range value changes.
    @param  groupId             Group ID
*/
/******************************************************************************/
function updateDeviceBrightness(groupId) {
    let group = groups[getIndexFromId(groups, groupId)];
    
    if (group.type != DEVICE_TYPE_LEDSTRIP) {
        return;
    }

    for (let deviceId of group.device_ids) {
        let rangeElem = document.getElementById("ledstripBrightnessRange" + deviceId);
        if (rangeElem == undefined) {
            continue;
        }

        rangeElem.value = document.getElementById("ledstripGroupBrightnessRange" + groupId).value;
    }
}
//#endregion

//#region Tile generators
/******************************************************************************/
/*!
    @brief  Generates the specified device tile.
    @param  tile                Tile to generate
*/
/******************************************************************************/
function generateDeviceTile(tile) {
    const device = devices[getIndexFromId(devices, tile.device_id)];

    if (device.type === DEVICE_TYPE_LEDSTRIP) {
        const onclickFunction = (event) => visitPage(event, "control_leds?id=" + device.id);
        const powerFunction = () => setDevicePower(device.id);
        const rangeFunction = () => setLedstripBrightness(device.id);
        let rangeUpdateFunction;
        if (tile.type == TILE_TYPE_GROUP) {
            rangeUpdateFunction = () => updateDeviceBrightness(this.tile.group_id);
        }

        return new LedstripTile({
            id: device.id,
            title: device.name,
            tile: tile,
            checkboxValue: device.power,
            rangeValue: device.brightness,
            icon: {icon: device.icon},
            onclickFunction: onclickFunction,
            powerFunction: powerFunction,
            rangeOnchangeFunction: rangeFunction,
            rangeOninputFunction: rangeUpdateFunction
        });
    }
    
    if (device.type === DEVICE_TYPE_RF_DEVICE) {
        let icon = {icon: device.icon};
        if (!RF_RECEIVER_PRESENT) {
            icon = {icon: "fa-duotone fa-solid fa-circle-exclamation", title: TEXT_NO_RF_RECEIVER_PRESENT};
        }

        const onclickFunction = (event) => visitPage(event, "control_rf_devices");

        return new RfDeviceTile({
            id: device.id,
            title: device.name,
            tile: tile,
            icon: icon,
            onclickFunction: onclickFunction
        });
    }
    
    if (device.type === DEVICE_TYPE_IP_CAMERA) {
        const onclickFunction = (event) => visitPage(event, "control_camera?id=" + device.id);

        return new CameraTile({
            id: device.id,
            title: device.name,
            tile: tile,
            icon: {icon: device.icon},
            onclickFunction: onclickFunction
        });
    }
}

/******************************************************************************/
/*!
    @brief  Generates the specified group tile.
    @param  tile                Tile to generate
*/
/******************************************************************************/
function generateGroupTile(tile) {
    const group = groups[getIndexFromId(groups, tile.group_id)];

    if (group.type === DEVICE_TYPE_LEDSTRIP) {
        const onclickFunction = (event) => visitPage(event, "control_ledstrip_group?id=" + group.id);
        const powerFunction = () => setGroupPower(group.id);
        const rangeFunction = () => setLedstripGroupBrightness(group.id);
        let rangeUpdateFunction;
        if (tile.type == TILE_TYPE_GROUP) {
            rangeUpdateFunction = () => setLedstripGroupBrightness(group.id);
        }

        return new LedstripTile({
            id: group.id,
            title: group.name,
            tile: tile,
            checkboxValue: group.power,
            rangeValue: group.brightness,
            icon: {icon: group.icon},
            onclickFunction: onclickFunction,
            powerFunction: powerFunction,
            rangeOnchangeFunction: rangeFunction,
            rangeOninputFunction: rangeUpdateFunction
        });
    }
    
    if (group.type === DEVICE_TYPE_RF_DEVICE) {
        let icon = {icon: group.icon};
        if (!RF_RECEIVER_PRESENT) {
            icon = {icon: "fa-duotone fa-solid fa-circle-exclamation", title: TEXT_NO_RF_RECEIVER_PRESENT};
        }

        const onclickFunction = (event) => visitPage(event, "control_rf_devices");

        return new RfDeviceTile({
            id: group.id,
            title: group.name,
            tile: tile,
            icon: icon,
            onclickFunction: onclickFunction
        });
    }
    
    if (group.type === DEVICE_TYPE_IP_CAMERA) {
        const onclickFunction = (event) => visitPage(event, "control_camera_groups?id=" + group.id);

        return new CameraTile({
            id: group.id,
            title: group.name,
            tile: tile,
            icon: {icon: group.icon},
            onclickFunction: onclickFunction
        });
    }

    if (tile.size === TILE_SIZE_4X4) {
        console.warn("4x4 group tiles are not supported yet.");
        return;
    }
}

/******************************************************************************/
/*!
    @brief  Generates the specified alarm tile.
    @param  tile                Tile to generate
    @param  previewTile         If true, it is a preview tile
    @param  size                Tile size
*/
/******************************************************************************/
function generateAlarmTile(tile) {
    let icon;
    let subtitle;
    if (alarm.armed) {
        icon = {icon: "fa-duotone fa-solid fa-shield-check fa-lg"};
        subtitle = TEXT_ARMED;
    } else {
        icon = {icon: "fa-duotone fa-solid fa-shield-slash fa-lg"};
        subtitle = TEXT_DISARMED;
    }

    return new AlarmTile({
        title: TEXT_ALARM,
        tile: tile,
        icon: icon,
        subtitle1: subtitle,
        subtitle2: alarm.automatically_armed
            ? TEXT_AUTO_ARM_ENABLED
            : TEXT_AUTO_ARM_DISABLED,
        onclickFunction: () => visitPage(event, "alarm"),
        powerFunction: () => toggleAlarmArmed()
    });
}

/******************************************************************************/
/*!
    @brief  Generates the specified alarm tile.
    @param  tile                Tile to generate
    @param  previewTile         If true, it is a preview tile
    @param  size                Tile size
*/
/******************************************************************************/
function generateAddTile(onclickFunction, size=TILE_SIZE_1X1) {
    const addTileObject = new AddTile({
        title: TEXT_ADD_TILE,
        size: size,
        onclickFunction: onclickFunction
    });

    return addTileObject;
}
//#endregion


/******************************************************************************/
/*!
    @brief  Changes the order of the tiles.
    @param  onUpdate        Function to execute when order is updated
*/
/******************************************************************************/
function changeOrder(onUpdate) {
    const configuration = dashboardConfigurations[getIndexFromId(
        dashboardConfigurations,
        selectedDashboardId
    )];
    dashboardGridObject.setConfiguration(
        configuration?.tiles ?? [],
        configureDashboardMode
    );
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
    document.getElementById("dashboardConfigurationTitle").textContent = TEXT_MANAGE_DASHBOARD;
    document.getElementById("dashboardConfigurationDescription").textContent = TEXT_DASHBOARD_CONFIGURATION_DESCRIPTION;
    document.getElementById("addTileBtnText").textContent = TEXT_ADD_TILE;
    document.getElementById("renameDashboardBtnText").textContent = TEXT_RENAME_DASHBOARD;
    document.getElementById("addDashboardBtnText").textContent = TEXT_ADD_DASHBOARD;
    document.getElementById("resetDashboardBtnText").textContent = TEXT_RESET_DASHBOARD;
    document.getElementById("deleteDashboardBtnText").textContent = TEXT_DELETE_DASHBOARD;
    document.getElementById("dashboardEmptyStateText").textContent = TEXT_NO_DASHBOARDS;
    document.getElementById("createFirstDashboardBtn").textContent = TEXT_CREATE_DASHBOARD;
}

/******************************************************************************/
/*!
    @brief  Loads the icon options.
*/
/******************************************************************************/
function loadDashboardIconOptions() {
    let iconOptions = []
    
    for (let icon of ICONS_L) {
        iconOptions.push({
            icon: icon,
            onclickFunction: () => {
                dashboardConfigurationModalObject.setIcon("dashboardIconModalBtn", icon);
                dashboardConfigurationModalObject.setValue("dashboardIconTxt", icon);
                iconPickerObject.close();
            }
        });
    }

    iconPickerObject.setIcons(iconOptions);
}

/******************************************************************************/
/*!
    @brief  Loads the dashboard configurations in the top bar.
*/
/******************************************************************************/
function loadDashboardControls() {
    dashboardConfigurationPanelElem.hidden = !configureDashboardMode;
}

//#endregion

//#region Validators
//#endregion

//#region Mouse context menu
/******************************************************************************/
/*!
    @brief  Toggles and generates the mouse context menu for the dashboard.
  TODO IMPROVE
    @param  show                Show state to set
*/
/******************************************************************************/
function generateMouseContextMenuDashboard() {
    const configuration = dashboardConfigurations[getIndexFromId(
        dashboardConfigurations,
        selectedDashboardId
    )];
    const index = configuration?.tiles.findIndex(
        (tile) => String(tile.id) === String(mouseContextMenuTileId)
    );

    let menuData = [];

    /* Show tile options when tile is selected */
    if (index != null && index >= 0) {
        menuData.push({text: TEXT_CHANGE_TILE_SIZE, icon: "fa-solid fa-file", submenu: []});
        menuData.push({
            text: TEXT_DELETE_TILE,
            icon: "fa-solid fa-trash",
            onclickFunction: () => deleteTile(configuration.tiles[index].id)
        });

        let tileSizes = getCompatibleTileSizes(configuration.tiles[index]);

        for (let size of tileSizes) {
            if (configuration.tiles[index].size == size.size) {
                continue;
            }

            menuData[0].submenu.push({text: size.description, icon: size.icon, onclickFunction: () => changeTileSize(index, size.size )});
        }
    }

    /* Add tile option */
    menuData.push({text: TEXT_ADD_TILE, icon: "fa-duotone fa-solid fa-plus", onclickFunction: () => loadAddTileModal()});

    /* Update dashboard option */
    menuData.push({text: TEXT_EDIT_DASHBOARD, icon: "fa-duotone fa-solid fa-pen-to-square", onclickFunction: () => toggleConfigurationMode()});

    /* Reset dashboard option */
    menuData.push({text: TEXT_RESET_DASHBOARD, icon: "fa-duotone fa-solid fa-arrows-rotate-reverse", onclickFunction: () => resetDashboardConfiguration()});

    contextMouseMenuObject.setMenuItems(menuData);
};

/******************************************************************************/
/*!
    @brief  Shows the mouse context menu after right mouse click.
*/
/******************************************************************************/
dashboardGridElem.addEventListener("contextmenu", e => {
    e.preventDefault();
    const tile = e.target.closest("[tile-id]");

    if (tile) {
        mouseContextMenuTileId = tile.getAttribute("tile-id");
    } else {
        mouseContextMenuTileId = undefined;
    }

    generateMouseContextMenuDashboard();
    contextMouseMenuObject.show(e.clientX, e.clientY);
});


/******************************************************************************/
/*!
    @brief  Shows the mouse context menu after right mouse click.XXX
*/
/******************************************************************************/
document.addEventListener("dashboardTileMenuRequested", (event) => {
    mouseContextMenuTileId = event.detail.tileId;
    generateMouseContextMenuDashboard();
    contextMouseMenuObject.show(event.detail.x, event.detail.y);
});
//#endregion

//#region Interval update functionality
/******************************************************************************/
/*!
    @brief  Asynchronous interval function for fetching the devices states
            from the back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    let response;
    try {
        response = await fetch("get_devices", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        loadingBanners.show(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchStates);
        return;
    }

    let data = await response.json();
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }
    devices = data;
    updateTileStates();

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

//#region Update tile states
/******************************************************************************/
/*!
    @brief  Updates the tile states.
    @param  showErrorMessages   If true, banners with possible tile error
            messages are shown.
*/
/******************************************************************************/
function updateTileStates(showErrorMessages=false) {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboardId)];
    
    for (let tile of configuration.tiles) {
        if (tile.type == TILE_TYPE_DEVICE) {
            updateDeviceTileStates(tile, showErrorMessages);
        } else if (tile.type == TILE_TYPE_GROUP) {
            updateGroupTileStates(tile);
        } else if (tile.type == TILE_TYPE_ALARM) {
            updateAlarmTileStates(tile);
        }
    }
}

/******************************************************************************/
/*!
    @brief  Updates the specified device tile states.
    @param  tile                Tile object
    @param  showErrorMessages   If true, banners with possible tile error
            messages are shown.
*/
/******************************************************************************/
function updateDeviceTileStates(tile, showErrorMessages=false) {
    let device = devices[getIndexFromId(devices, tile.device_id)];
    const tileObject = dashboardTileObjects.find(
        (dashboardTileObject) => dashboardTileObject.tile?.device_id === device.id
    );

    if (device.type == DEVICE_TYPE_LEDSTRIP) {
        tileObject.setCheckboxValue(device.power);

        if (tileObject.hasRangeInput) {
            tileObject.setRangeValue(device.brightness);
        }

        if (device.number_of_leds == 0) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation fa-xl",
                title: TEXT_LED_ADDRESSING_NOT_CONFIGURED
            }
            tileObject.setIcon(icon);

            if (showErrorMessages) {
                banners.show(
                            TEXT_ACTION_REQUIRED,
                            VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(device.name),
                            MESSAGE_TYPE_WARNING,
                            0,
                            () => updateLedAddressing(device.id)
                        );
            }
            return;
        }

        if (!device.connection_status) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation fa-xl",
                title: TEXT_NOT_CONNECTED
            }
            tileObject.setIcon(icon);
            return;
        }
        
        const icon = {};

        if (device.power) {
            icon.icon = device.icon + " fa-xl";
        } else {
            icon.icon = device.icon_low_state + " fa-xl";
        }

        tileObject.setIcon(icon);
        return;
    }
    
    if (device.type == DEVICE_TYPE_RF_DEVICE) {
        if (!RF_RECEIVER_PRESENT) {
            icon = {icon: "fa-duotone fa-solid fa-circle-exclamation", title: TEXT_NO_RF_RECEIVER_PRESENT};
            tileObject.setIcon(icon);
            return;
        }
        
        if (device.state) {
            icon.icon = device.icon + " fa-xl";
        } else {
            icon.icon = device.icon_low_state + " fa-xl";
        }

        tileObject.setIcon(icon);
        return;
    }

    /* Devices without power switches */
    if (device.type == DEVICE_TYPE_IP_CAMERA) {
        if (!device.connection_status) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation fa-xl",
                title: TEXT_NOT_CONNECTED
            }
            tileObject.setIcon(icon);
            return;
        }
        
        const icon = {};
        
        if (device.state) {
            icon.icon = device.icon + " fa-xl";
        } else {
            icon.icon = "fa-duotone fa-solid fa-circle-exclamation fa-xl";
        }

        tileObject.setIcon(icon);
        return;
    }
}

/******************************************************************************/
/*!
    @brief  Updates the specified group tile states.
    @param  tile                Tile object
*/
/******************************************************************************/
function updateGroupTileStates(tile) {
    let group = groups[getIndexFromId(groups, tile.group_id)];
    let powerSynchronized = [true];
    let brightnessSynchronized = [true];

    if (group.type == DEVICE_TYPE_LEDSTRIP) {
        powerSynchronized = groupPowerIsSynchronized(group);
        brightnessSynchronized = groupBrightnessIsSynchronized(group);

        if (powerSynchronized[0]) {
            group.power = powerSynchronized[1];
        }
        
        if (brightnessSynchronized[0]) {
            group.brightness = brightnessSynchronized[1];
        }
    }

    if (document.getElementById("groupSynchronizedIcon" + group.id) != undefined) {
        if (powerSynchronized[0] && brightnessSynchronized[0]) {
            document.getElementById("groupSynchronizedIcon" + group.id).className = "fa-duotone fa-solid fa-group-arrows-rotate fa-xl";
            document.getElementById("groupSynchronizedIcon" + group.id).title = "Devices synchronized";
        } else {
            document.getElementById("groupSynchronizedIcon" + group.id).className = "fa-duotone fa-solid fa-rotate-exclamation fa-xl";
            document.getElementById("groupSynchronizedIcon" + group.id).title = "Devices not synchronized";
        }
    }

    if (document.getElementById("deviceGroupPowerCb" + group.id) != undefined) {
        document.getElementById("deviceGroupPowerCb" + group.id).checked = group.power;
    }

    if (document.getElementById("ledstripGroupBrightnessRange" + group.id) != undefined) {
        document.getElementById("ledstripGroupBrightnessRange" + group.id).value = group.brightness;
    }

    if (document.getElementById("deviceGroupIcon" + group.id) != undefined) {
        document.getElementById("deviceGroupIcon" + group.id).className = group.icon + " fa-xl";
    }
}

/******************************************************************************/
/*!
    @brief  Updates the specified alarm tile states.
    @param  tile                Tile object
*/
/******************************************************************************/
function updateAlarmTileStates(tile) {
    let icon;
    let subtitle;

    if (alarm.armed) {
        icon = {icon: "fa-duotone fa-solid fa-shield-check fa-lg"};
        subtitle = TEXT_ARMED;
    } else {
        icon = {icon: "fa-duotone fa-solid fa-shield-slash fa-lg"};
        subtitle = TEXT_DISARMED;
    }

    const tileObject = dashboardTileObjects.find(
        (dashboardTileObject) => dashboardTileObject.tile?.id === tile.id
    );
    
    tileObject.setIcon(icon);
    tileObject.setSubtitle1(subtitle);
    tileObject.setCheckboxValue(alarm.armed);

    //TODO get connected devices
}
//#endregion

//#region Other
/******************************************************************************/
/*!
    @brief  Toggles the dashboard configuration mode.
*/
/******************************************************************************/
function toggleConfigurationMode() {
    configureDashboardMode = !configureDashboardMode;
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
    @brief  Returns the compatible tile sizes based on the specified tile. TODO based on device confirguration backend
    @param  tile                Tile object
*/
/******************************************************************************/
function getCompatibleTileSizes(tile) {
    if (tile.type == TILE_TYPE_DEVICE) {
        let device = devices[getIndexFromId(devices, tile.device_id)];
        if (device.type == DEVICE_TYPE_LEDSTRIP) {
            return [TILE_SIZES[0], TILE_SIZES[1], TILE_SIZES[2]];
        } else if (device.type == DEVICE_TYPE_RF_DEVICE) {
            return [TILE_SIZES[0], TILE_SIZES[1]];
        } else {
            return TILE_SIZES;
        }
    }

    if (tile.type == TILE_TYPE_GROUP) {
        let group = groups[getIndexFromId(groups, tile.group_id)];
        if (group.type == DEVICE_TYPE_LEDSTRIP) {
            return [TILE_SIZES[0], TILE_SIZES[1], TILE_SIZES[2]];
        } else if (group.type == DEVICE_TYPE_RF_DEVICE) {
            return [TILE_SIZES[0], TILE_SIZES[1]];
        } else {
            return TILE_SIZES;
        }
    }

    if (tile.type == TILE_TYPE_DATETIME) {
        return TILE_SIZES;
    }

    if (tile.type == TILE_TYPE_WEATHER) {
        return TILE_SIZES;
    }

    if (tile.type == TILE_TYPE_ALARM) {
        return TILE_SIZES;
    }

    if (tile.type == TILE_TYPE_AUTOMATION) {
        return [TILE_SIZES[0], TILE_SIZES[1], TILE_SIZES[2]];
    }
}

/******************************************************************************/
/*!
    @brief  Runs an automation from a dashboard tile.
    @param  event               Click event
    @param  automationId        Automation ID
*/
/******************************************************************************/
async function runDashboardAutomation(event, automationId, tileObject) {
    if (configureDashboardMode) {
        return;
    }

    event.stopPropagation();
    if (tileObject.isRunning) {
        return;
    }

    tileObject.setRunState("running");
    const result = await runAutomation(automationId, "dashboard");
    const failed = result.status_code != HTTP_CODE_OK ||
        result.message?.status === "failed";
    tileObject.setRunState(failed ? "error" : "success");

    setTimeout(() => {
        if (!tileObject.isRunning) {
            tileObject.setRunState("idle");
        }
    }, 2500);
}

/******************************************************************************/
/*!
    @brief  Redirects to device or group when clicked on a tile.
    @param  event               Event to process
    @param  url                 Url to redirect to
*/
/******************************************************************************/
function visitPage(event, url) {
    /* No redirecting when in configuration mode */
    if (configureDashboardMode) {
        return;
    }

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
    
    /* When switch is clicked, don't redirect, ductape solution for now */
    if (event.target.className == "switch" || event.target.className ==  "slider round" || event.target.type == "span") {
        return;
    }
    /* When range is clicked, don't redirect, ductape solution for now */
    if (event.target.type == "range") {
        return;
    }

    redirect(url);
}
//#endregion
//#endregion
