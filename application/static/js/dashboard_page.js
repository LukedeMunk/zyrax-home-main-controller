/******************************************************************************/
/*
 * File:    dashboard_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the dashboard page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const tileModalTitleElem = document.getElementById("tileModalTitle");
const tileTypeTitleElem = document.getElementById("tileTypeTitle");
const tileTargetTitleElem = document.getElementById("tileTargetTitle");

/* Fields */
const tileErrorMessageFieldElem = document.getElementById("tileErrorMessageField");
const errorMessageWeatherLocationFieldElem = document.getElementById("errorMessageWeatherLocationField");

/* Buttons */

/* Icons */

/* Input elements */
const tileTypeSelectElem = document.getElementById("tileTypeSelect");
const tileTargetSelectElem = document.getElementById("tileTargetSelect");
const weatherLocationTxtElem = document.getElementById("weatherLocationTxt");

/* Tables */

/* Modals */
const tileModalElem = document.getElementById("tileModal");
const iconModalElem = document.getElementById("iconModal");
const weatherLocationModalElem = document.getElementById("weatherLocationModal");


/* Other */
const mouseMenuElem = document.getElementById("mouseMenu");
const mouseMenuOptionsElem = document.getElementById("mouseMenuOptions");
const topBarElem = document.getElementById("topBar");
const tileTargetInputContainerElem = document.getElementById("tileTargetInputContainer");
const tilePreviewContainerElem = document.getElementById("tilePreviewContainer");
const iconPickerContainerElem = document.getElementById("iconPickerContainer");
const dashboardGridElem = document.getElementById("dashboardGrid");
//#endregion

//#region Constants
//#endregion

//#region Variables
let lastMouseButtonPressed;
let mouseContextMenuTileIndex;
let configureDashboardMode = false;
let selectedDashboard;
let isFetchingStates = false;
let lastDashboardData;
let timeTileUpdateInterval;
let weatherLoading = false;
let mouseMenu;
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();
    
    selectedDashboard = dashboardConfigurations[0].id;

    /* Load dashboard cookie */
    if (localStorage.getItem("selectedDashboard") != undefined) {
        if (getIndexFromId(dashboardConfigurations, localStorage.getItem("selectedDashboard")) != -1) {
            selectedDashboard = localStorage.getItem("selectedDashboard");
        }
    }

    loadTileTypeSelectOptions();
    loadIconOptions();
    loadDashboardConfiguration();
    generateMouseContextMenuDashboard();

    isFetchingStates = true;
    fetchStates();
});

//#region Generate functionality
/******************************************************************************/
/*!
  @brief    Generates the empty dashboard grid.
*/
/******************************************************************************/
function generateGrid() {
    dashboardGridElem.innerHTML = "";

    for (let i = 0; i < MAX_NUMBER_OF_TILES; i++) {
        let tileContainer = document.createElement("div");
        tileContainer.id = "tile" + i;
        tileContainer.className = "tile single";
        tileContainer.style.backgroundColor = "transparent";
        tileContainer.style.boxShadow = "none";
        tileContainer.style.cursor = "default";

        dashboardGridElem.appendChild(tileContainer);
    }
}

/******************************************************************************/
/*!
  @brief    Generates tiles for the dashboard.
*/
/******************************************************************************/
function generateTiles() {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    
    if (configuration.tiles == undefined) {
        configuration.tiles = [];
    }

    for (let tile of configuration.tiles) {
        if (tile.type == TILE_TYPE_DEVICE) {
            generateDeviceTile(tile);
            continue;
        }

        if (tile.type == TILE_TYPE_GROUP) {
            generateGroupTile(tile);
            continue;
        }

        if (tile.type == TILE_TYPE_DATETIME) {
            generateDateTimeTile(tile);
            continue;
        }

        if (tile.type == TILE_TYPE_WEATHER) {
            generateWeatherTile(tile);
            continue;
        }

        if (tile.type == TILE_TYPE_ALARM) {
            generateAlarmTile(tile);
            continue;
        }
    }

    let index = getLowestEmptyTileIndex();

    /* Generate add tile */
    if (configuration.tiles.length == 0 || (configureDashboardMode && selectedDashboard != -1)) {
        let tileItem;
        let tileContainer;
    
        tileContainer = document.getElementById("tile" + index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.style.boxShadow = "var(--shadow-small)";
        tileContainer.className = "tile single";
        tileContainer.setAttribute("onclick", "loadAddTileModal();");
    
        /* Icon */
        tileItem = document.createElement("div");
        icon = document.createElement("i");
        icon.className = "fa-duotone fa-solid fa-plus";

        tileItem.appendChild(icon);
        tileContainer.appendChild(tileItem);
    }
}

/******************************************************************************/
/*!
  @brief    Generates tile previews for the add tile modal.
*/
/******************************************************************************/
function generateTilePreviews() {
    tilePreviewContainerElem.innerHTML = "";

    if (tileTypeSelectElem.value == TILE_TYPE_DEVICE || tileTypeSelectElem.value == TILE_TYPE_GROUP) {
        if (tileTargetSelectElem.value == "") {
            return;
        }
    }
    
    if (tileTypeSelectElem.value == TILE_TYPE_DEVICE) {
        let device = devices[getIndexFromId(devices, tileTargetSelectElem.value)];
        generateDevice1x1Tile(device, undefined, undefined, undefined, true, device.icon + " fa-xl");
        if (device.type != DEVICE_TYPE_IP_CAMERA) {
            if (device.type == DEVICE_TYPE_LEDSTRIP) {
                generateDevice1x2Tile(device, undefined, "", undefined, undefined, undefined, true, device.icon + " fa-xl");
            } else {
                generateDevice1x2Tile(device, undefined, undefined, undefined, undefined, undefined, true, device.icon + " fa-xl");
            }
        }
        if (device.type == DEVICE_TYPE_LEDSTRIP) {
            generateDevice4x2TileSlider(device, undefined, "", undefined, undefined, undefined, undefined, undefined, true, device.icon + " fa-xl");
        }
        if (device.type == DEVICE_TYPE_IP_CAMERA) {
            generateDevice4x4TileCamera(device, undefined, undefined, true);
        }
    } else if (tileTypeSelectElem.value == TILE_TYPE_GROUP) {
        let group = groups[getIndexFromId(groups, tileTargetSelectElem.value)];
        generateDevice1x1Tile(group, undefined, undefined, undefined, true, group.icon + " fa-xl");
        if (group.type != DEVICE_TYPE_IP_CAMERA) {
            if (group.type == DEVICE_TYPE_LEDSTRIP) {
                generateDevice1x2Tile(group, undefined, "", undefined, undefined, undefined, true, group.icon + " fa-xl");
            } else {
                generateDevice1x2Tile(group, undefined, undefined, undefined, undefined, undefined, true, group.icon + " fa-xl");
            }
        }
        if (group.type == DEVICE_TYPE_LEDSTRIP) {
            generateDevice4x2TileSlider(group, undefined, "", undefined, undefined, undefined, undefined, undefined, true, group.icon + " fa-xl");
        }
        if (group.type == DEVICE_TYPE_IP_CAMERA) {
            generateDevice4x4TileCamera(group.name, undefined, undefined, true);
        }
    } else if (tileTypeSelectElem.value == TILE_TYPE_DATETIME) {
        generateDateTimeTile(undefined, true, TILE_SIZE_1X2);
        generateDateTimeTile(undefined, true, TILE_SIZE_2X4);
        generateDateTimeTile(undefined, true, TILE_SIZE_4X2);
    } else if (tileTypeSelectElem.value == TILE_TYPE_WEATHER) {
        generateWeatherTile(undefined, true, TILE_SIZE_1X2);
        generateWeatherTile(undefined, true, TILE_SIZE_4X2);
        generateWeatherTile(undefined, true, TILE_SIZE_4X4);
    } else if (tileTypeSelectElem.value == TILE_TYPE_ALARM) {
        generateAlarmTile(undefined, true, TILE_SIZE_1X2);
        generateAlarmTile(undefined, true, TILE_SIZE_4X2);
        generateAlarmTile(undefined, true, TILE_SIZE_4X4);
    }
}

/******************************************************************************/
/*!
  @brief    Generates random background bubbles for the weather tile.
*/
/******************************************************************************/
function generateBubbles() {
    const bubbleContainers = document.getElementsByClassName("weather-bubbles");
    let bubbleCount;

    for (container of bubbleContainers) {
        container.innerHTML = "";
        
        switch (parseInt(container.id)) {
            case TILE_SIZE_1X2:
                bubbleCount = 4;
                break;
            case TILE_SIZE_4X2:
                bubbleCount = 8;
                break;
            case TILE_SIZE_2X4:
                bubbleCount = 8;
                break;
            case TILE_SIZE_4X4:
                bubbleCount = 12;
                break;
        }

        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement("div");
            bubble.classList.add("bubble");
            
            /* Random size between 20px and 80px */
            const size = Math.floor(Math.random() * 60) + 20;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            /* Random position */
            const left = Math.floor(Math.random() * 90) + 5;
            const top = Math.floor(Math.random() * 90) + 5;
            bubble.style.left = `${left}%`;
            bubble.style.top = `${top}%`;
            
            /* Random animation duration and delay */
            const duration = Math.floor(Math.random() * 6) + 6;
            const delay = Math.floor(Math.random() * 5);
            bubble.style.animationDuration = `${duration}s`;
            bubble.style.animationDelay = `${delay}s`;
            
            container.appendChild(bubble);
        }
    }
}

//#region Generate device tiles
/******************************************************************************/
/*!
  @brief    Generates the specified device tile.
  @param    tile                Tile to generate
*/
/******************************************************************************/
function generateDeviceTile(tile) {
    let redirectFunction = undefined;
    let powerFunction = undefined;
    let rangeFunction = undefined;
    
    let device = devices[getIndexFromId(devices, tile.device_id)];

    switch (device.type) {
        case DEVICE_TYPE_LEDSTRIP:
            powerFunction = "setDevicePower(" + device.id + ");";
            rangeFunction = "setLedstripBrightness(" + device.id + ");";
            redirectFunction = "visitPage(event, 'control_leds?id=" + device.id + "');";
            break;
        case DEVICE_TYPE_RF_DEVICE:
            redirectFunction = "visitPage(event, 'control_rf_devices');";
            break;
        case DEVICE_TYPE_IP_CAMERA:
            redirectFunction = "visitPage(event, 'control_camera?id=" + device.id + "');";
            break;
    }

    if (tile.size == TILE_SIZE_1X1) {
        generateDevice1x1Tile(device, tile, redirectFunction, "deviceIcon" + device.id);
    } else if (tile.size == TILE_SIZE_1X2) {
        generateDevice1x2Tile(device, tile, redirectFunction, powerFunction, "devicePowerCb" + device.id, "deviceIcon" + device.id);
    } else if (tile.size == TILE_SIZE_4X2) {
        generateDevice4x2TileSlider(device,
                                    tile,
                                    redirectFunction,
                                    powerFunction,
                                    rangeFunction,
                                    "devicePowerCb" + device.id,
                                    "ledstripBrightnessRange" + device.id,
                                    "deviceIcon" + device.id);
    } else if (tile.size == TILE_SIZE_4X4) {
        generateDevice4x4TileCamera(device.name, tile, redirectFunction);
    }
}

/******************************************************************************/
/*!
  @brief    Generates a 1x1 device tile.
  @param    device              Device object
  @param    tile                Tile to generate
  @param    redirectFunction    Function for redirecting to the device
  @param    iconElementId       ID of the icon DOM element
  @param    previewTile         If true, it is a preview tile
  @param    iconClass           Icon class for the preview tile
*/
/******************************************************************************/
function generateDevice1x1Tile(device, tile=undefined, redirectFunction=undefined, iconElementId=undefined, previewTile=false, iconClass=undefined) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;
    let tileRfWarningIcon;

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile1x1";
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + TILE_SIZE_1X1 + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", redirectFunction);
        tileContainer.setAttribute("tile-id", tile.id);
    }

    tileContainer.className = getClassFromSize(TILE_SIZE_1X1);
    tileContainer.style.boxShadow = "var(--shadow-small)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Name */
    tileItem = document.createElement("div");
    tileItem.style.display = "flex";
    tileItem.style.gap = "10px";
    tileItem.style.alignItems = "baseline";
    tileItem.style.gridColumn = "span 2";

    tileName = document.createElement("p");
    tileName.textContent = device.name;
    tileItem.appendChild(tileName);

    tileRfWarningIcon = document.createElement("i");
    tileRfWarningIcon.className = "fa-duotone fa-solid fa-circle-exclamation";
    tileRfWarningIcon.title = TEXT_NO_RF_RECEIVER_PRESENT;
    
    if (!RF_RECEIVER_PRESENT && device.type == DEVICE_TYPE_RF_DEVICE) {
        tileItem.appendChild(tileRfWarningIcon);
    }
    
    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    icon = document.createElement("i");
    if (previewTile) {
        icon.className = iconClass;
    } else {
        icon.id = iconElementId;
    }

    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}

/******************************************************************************/
/*!
  @brief    Generates a 1x2 device tile.
  @param    device              Device object
  @param    tile                Tile to generate
  @param    redirectFunction    Function for redirecting to the device
  @param    powerFunction       Function for setting the power
  @param    cbElementId         ID of the power checkbox DOM element
  @param    iconElementId       ID of the icon DOM element
  @param    previewTile         If true, it is a preview tile
  @param    iconClass           Icon class for the preview tile
*/
/******************************************************************************/
function generateDevice1x2Tile(device,
                                tile=undefined,
                                redirectFunction=undefined,
                                powerFunction=undefined,
                                cbElementId=undefined,
                                iconElementId=undefined,
                                previewTile=false,
                                iconClass=undefined) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;
    let tileRfWarningIcon;

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile1x2";
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + TILE_SIZE_1X2 + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", redirectFunction);
        tileContainer.setAttribute("tile-id", tile.id);
    }

    tileContainer.className = getClassFromSize(TILE_SIZE_1X2);
    tileContainer.style.boxShadow = "var(--shadow-small)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Name */
    tileItem = document.createElement("div");
    tileItem.style.display = "flex";
    tileItem.style.gap = "10px";
    tileItem.style.alignItems = "baseline";
    tileItem.style.gridColumn = "span 2";

    tileName = document.createElement("p");
    tileName.textContent = device.name;
    tileItem.appendChild(tileName);

    tileRfWarningIcon = document.createElement("i");
    tileRfWarningIcon.className = "fa-duotone fa-solid fa-circle-exclamation";
    tileRfWarningIcon.title = TEXT_NO_RF_RECEIVER_PRESENT;
    
    if (!RF_RECEIVER_PRESENT && device.type == DEVICE_TYPE_RF_DEVICE) {
        tileItem.appendChild(tileRfWarningIcon);
    }
    
    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    icon = document.createElement("i");
    if (previewTile) {
        icon.className = iconClass;
    } else {
        icon.id = iconElementId;
    }

    tileItem.appendChild(icon);

    /* When group, include synchronized icon */
    if (!previewTile && tile.type == TILE_TYPE_GROUP) {
        icon = document.createElement("i");
        icon.style.marginLeft = "6px";
        if (previewTile) {
            icon.className = iconClass;
        } else {
            icon.id = "groupSynchronizedIcon" + tile.group_id;
        }
    
        tileItem.appendChild(icon);
    }
    
    tileContainer.appendChild(tileItem);

    /* Switch */
    if (powerFunction != undefined) {
        tileItem = document.createElement("label");
        tileItem.className = "switch";
    
        let cbInput = document.createElement("input");
        cbInput.type = "checkbox";
        cbInput.name = cbElementId;
        cbInput.id = cbElementId;
        if (powerFunction != undefined) {
            cbInput.setAttribute("onclick", powerFunction);
        }
    
        let span = document.createElement("span");
        span.className = "slider round";
        span.style.transform = "scale(0.8)";
        
        tileItem.appendChild(cbInput);
        tileItem.appendChild(span);
        tileContainer.appendChild(tileItem);
    }

    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}

/******************************************************************************/
/*!
  @brief    Generates a 4x2 device tile with slider.
  @param    device              Device object
  @param    tile                Tile to generate
  @param    redirectFunction    Function for redirecting to the device
  @param    powerFunction       Function for setting the power
  @param    onchangeFunction    Function for changes in slider
  @param    cbElementId         ID of the power checkbox DOM element
  @param    iconElementId       ID of the icon DOM element
  @param    previewTile         If true, it is a preview tile
  @param    iconClass           Icon class for the preview tile
*/
/******************************************************************************/
function generateDevice4x2TileSlider(device,
                                        tile,
                                        redirectFunction,
                                        powerFunction,
                                        onchangeFunction,
                                        cbElementId,
                                        rangeElementId,
                                        iconElementId,
                                        previewTile=false,
                                        iconClass=undefined) {
    let tileItem;
    let icon;
    let tileContainer;
    let tileName;

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile2x4";
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + TILE_SIZE_4X2 + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", redirectFunction);
        tileContainer.setAttribute("tile-id", tile.id);
    }

    tileContainer.className = getClassFromSize(TILE_SIZE_4X2);
    tileContainer.style.boxShadow = "var(--shadow-small)";
    tileContainer.style.gridTemplateColumns = "repeat(3, 33%)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Name */
    tileItem = document.createElement("div");

    tileName = document.createElement("p");
    tileName.textContent = device.name;
    
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    /* Switch */
    if (powerFunction != undefined) {
        tileItem = document.createElement("label");
        tileItem.className = "switch";
    
        let cbInput = document.createElement("input");
        cbInput.type = "checkbox";
        cbInput.name = cbElementId;
        cbInput.id = cbElementId;
        if (powerFunction != undefined) {
            cbInput.setAttribute("onclick", powerFunction);
        }
    
        let span = document.createElement("span");
        span.className = "slider round";
        span.style.transform = "scale(0.8)";
        
        tileItem.appendChild(cbInput);
        tileItem.appendChild(span);
        tileContainer.appendChild(tileItem);
    }

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.textAlign = "right";
    icon = document.createElement("i");
    if (previewTile) {
        icon.className = iconClass;
    } else {
        icon.id = iconElementId;
    }

    tileItem.appendChild(icon);
    
    /* When group, include synchronized icon */
    if (!previewTile && tile.type == TILE_TYPE_GROUP) {
        icon = document.createElement("i");
        icon.style.marginLeft = "6px";
        if (previewTile) {
            icon.className = iconClass;
        } else {
            icon.id = "groupSynchronizedIcon" + tile.group_id;
        }
    
        tileItem.appendChild(icon);
    }
    
    tileContainer.appendChild(tileItem);

    /* Range */
    if (previewTile || onchangeFunction != undefined) {
        tileItem = document.createElement("div");
        tileItem.style.gridColumn = "span 3";

        let rangeInput = document.createElement("input");
        rangeInput.type = "range";
        rangeInput.name = rangeElementId;
        rangeInput.id = rangeElementId;
        rangeInput.max = MAX_LEDSTRIP_BRIGHTNESS;
        rangeInput.style.width = "100%";
        rangeInput.style.maxWidth = "none";
        if (onchangeFunction != undefined) {
            rangeInput.setAttribute("onchange", onchangeFunction);
            if (tile.type == TILE_TYPE_GROUP) {
                rangeInput.setAttribute("oninput", "updateDeviceBrightness(" + tile.group_id + ");");
            }
        }
        
        tileItem.appendChild(rangeInput);
        tileContainer.appendChild(tileItem);
    }
    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}

/******************************************************************************/
/*!
  @brief    Changes the brightness sliders of the group devices when group
            brightness range value changes.
  @param    groupId             Group ID
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

/******************************************************************************/
/*!
  @brief    Generates a 4x4 camera tile with video preview.
  @param    name                Device name
  @param    tile                Tile to generate
  @param    redirectFunction    Function for redirecting to the device
  @param    previewTile         If true, it is a preview tile
*/
/******************************************************************************/
function generateDevice4x4TileCamera(name, tile, redirectFunction, previewTile=false) {
    let tileItem;
    let tileContainer;
    let tileName;

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile4x4";
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + TILE_SIZE_4X4 + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", redirectFunction);
        tileContainer.setAttribute("tile-id", tile.id);
    }

    tileContainer.className = getClassFromSize(TILE_SIZE_4X4);
    tileContainer.style.boxShadow = "var(--shadow-small)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Name */
    tileItem = document.createElement("div");

    tileName = document.createElement("p");
    tileName.textContent = name;
    
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    tileItem.style.backgroundColor = "red";
    tileContainer.appendChild(tileItem);
    
    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}
//#endregion

//#region Generate weather tile
/******************************************************************************/
/*!
  @brief    Generates the specified weather tile.
  @param    tile                Tile to generate
  @param    previewTile         If true, it is a preview tile
  @param    size                Tile size
*/
/******************************************************************************/
function generateWeatherTile(tile, previewTile=false, size=TILE_SIZE_4X2) {
    if (tile != undefined) {
        size = tile.size;
    }
    
    let tileContainer;
    let bubbles = document.createElement("div");
    bubbles.className = "weather-bubbles";

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile" + size;
        tileContainer.setAttribute("onclick", "addTile(" + size + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.setAttribute("tile-id", tile.id);
        tileContainer.setAttribute("onclick", "loadWeatherLocationModal();");
    }

    tileContainer.className = "tile weather-tile";
    tileContainer.style.boxShadow = "var(--shadow-small)";
        
    switch (size) {
        case TILE_SIZE_4X2:
            tileContainer.classList.add("double-horizontal");
            bubbles.classList.add("bubbles-double-horizontal");
            break;
        case TILE_SIZE_2X4:
            //return "tile double-vertical"
            break;
        case TILE_SIZE_4X4:
            tileContainer.classList.add("weather-tile-double-horizontal-vertical");
            tileContainer.classList.add("double-horizontal-vertical");
            bubbles.classList.add("bubbles-double-horizontal-vertical");
            break;
    }

    /* When in dashboard configuration mode */
    if (!previewTile && configureDashboardMode) {
        tileContainer.style.border = "1px dashed blue";
        tileContainer.style.backgroundColor = "var(--background5)";
    }

    /* Bubbles */
    tileContainer.appendChild(bubbles);
    bubbles.id = size;

    if (!weatherAvailable) {
        let header = document.createElement("div");
        header.className = "weather-header";

        let temperatureContainer = document.createElement("div");
        let temperatureField = document.createElement("div");
        temperatureField.className = "temperature";
        temperatureField.textContent = "UNAVAILABLE";

        let descriptionField = document.createElement("div");
        if (size > TILE_SIZE_1X2) {
            descriptionField.textContent = "UNAVAILABLE";
        } else {
            descriptionField.textContent = "UNAVAILABLE";
        }
        
        temperatureContainer.appendChild(temperatureField);
        temperatureContainer.appendChild(descriptionField);
        header.appendChild(temperatureContainer);
        tileContainer.appendChild(header);

        if (previewTile) {
            tilePreviewContainerElem.appendChild(tileContainer);
        }
        return;
    }

    if (weatherLoading) {
        let header = document.createElement("div");
        header.className = "weather-header";

        let temperatureContainer = document.createElement("div");
        let temperatureField = document.createElement("div");
        temperatureField.className = "temperature";
        temperatureField.textContent = "LOADING";

        let descriptionField = document.createElement("div");
        if (size > TILE_SIZE_1X2) {
            descriptionField.textContent = "LOADING";
        } else {
            descriptionField.textContent = "LOADING";
        }
        
        temperatureContainer.appendChild(temperatureField);
        temperatureContainer.appendChild(descriptionField);
        header.appendChild(temperatureContainer);
        tileContainer.appendChild(header);

        if (previewTile) {
            tilePreviewContainerElem.appendChild(tileContainer);
        }
        return;
    }

    /* Header */
    let header = document.createElement("div");
    header.className = "weather-header";

    let temperatureContainer = document.createElement("div");
    let temperatureField = document.createElement("div");
    temperatureField.className = "temperature";
    temperatureField.id = "dayTemperature";
    temperatureField.textContent = weather.days[0].temperature + "°C";

    let descriptionField = document.createElement("div");
    if (size > TILE_SIZE_1X2) {
        descriptionField.textContent = weather.days[0].description.replace(".", "");
    } else {
        descriptionField.textContent = weather.days[0].conditions;
    }
    
    temperatureContainer.appendChild(temperatureField);
    temperatureContainer.appendChild(descriptionField);
    header.appendChild(temperatureContainer);
    
    /* Details */
    let weatherDetailsContainer = document.createElement("div");
    weatherDetailsContainer.className = "temp-details";

    /* Detail 1 */
    let weatherDetailContainer = document.createElement("div");
    weatherDetailContainer.className = "weather-detail";
    
    let icon = document.createElement("i");
    icon.className = weather.days[0].icon;

    let detailValue = document.createElement("div");
    detailValue.className = "weather-detail-value";
    detailValue.textContent = TEXT_NOW;
    let detailLabel = document.createElement("div");
    detailLabel.className = "weather-detail-label";
    detailLabel.textContent = weather.days[0].conditions;

    if (size > TILE_SIZE_1X2) {
        weatherDetailContainer.appendChild(detailValue);
    }
    weatherDetailContainer.appendChild(icon);
    if (size > TILE_SIZE_1X2) {
        weatherDetailContainer.appendChild(detailLabel);
    }
    weatherDetailsContainer.appendChild(weatherDetailContainer);
    header.appendChild(weatherDetailsContainer);

    /* Detail 2 */
    if (size > TILE_SIZE_1X2) {
        let weatherDetailContainer = document.createElement("div");
        weatherDetailContainer.className = "weather-detail";
        
        let icon = document.createElement("i");
        icon.className = "fas fa-wind";
    
        let detailValue = document.createElement("div");
        detailValue.className = "weather-detail-value";
        detailValue.textContent = weather.days[0].windspeed + " km/h";
        let detailLabel = document.createElement("div");
        detailLabel.className = "weather-detail-label";
        detailLabel.textContent = TEXT_WIND;
    
        weatherDetailContainer.appendChild(icon);
        weatherDetailContainer.appendChild(detailLabel);
        weatherDetailContainer.appendChild(detailValue);
        weatherDetailsContainer.appendChild(weatherDetailContainer);
        header.appendChild(weatherDetailsContainer);
    }

    tileContainer.appendChild(header);

    if (size == TILE_SIZE_4X4) {
        let forecastContainer = document.createElement("div");
        forecastContainer.className = "weather-forecast";

        for (let i = 1; i < 6; i++) {//start with 1 because of today is not in forecast
            let forecastItem = document.createElement("div");
            forecastItem.className = "forecast-item";

            let forecastDay = document.createElement("div");
            forecastDay.className = "forecast-day";
            forecastDay.textContent = weather.days[i].weekday;
            forecastItem.appendChild(forecastDay);

            let forecastIcon = document.createElement("i");
            forecastIcon.className = weather.days[i].icon;
            forecastItem.appendChild(forecastIcon);

            let forecastTemperature = document.createElement("div");
            forecastTemperature.className = "forecast-temp";
            forecastTemperature.textContent = weather.days[i].temperature + "°C";
            forecastItem.appendChild(forecastTemperature);

            forecastContainer.appendChild(forecastItem);
        }

        tileContainer.appendChild(forecastContainer);
    }

    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
    
    generateBubbles();
}
//#endregion

//#region Generate datetime tile
/******************************************************************************/
/*!
  @brief    Generates the specified date time tile.
  @param    tile                Tile to generate
  @param    previewTile         If true, it is a preview tile
  @param    size                Tile size
*/
/******************************************************************************/
function generateDateTimeTile(tile, previewTile=false, size=TILE_SIZE_4X2) {
    let tileItem;
    let tileContainer;
    let dateField;
    let timeField;
    let date = new Date();


    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile" + size;
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + size + ");");
        if (size == TILE_SIZE_4X2) {
            tileContainer.className = "tile double-horizontal-centered";
        } else {
            tileContainer.className = getClassFromSize(size);
        }
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.setAttribute("tile-id", tile.id);
        tileContainer.style.backgroundColor = "var(--background3)";
        if (tile.size == TILE_SIZE_4X2) {
            tileContainer.className = "tile double-horizontal-centered";
        } else {
            tileContainer.className = getClassFromSize(tile.size);
        }
    }

    tileContainer.style.boxShadow = "var(--shadow-small)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Time */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";

    timeField = document.createElement("p");
    timeField.id = "timeField";
    timeField.style.fontSize = "20pt";
    timeField.style.fontWeight = "bold";
    timeField.textContent = date.toLocaleTimeString().substring(0, 5);
    
    tileItem.appendChild(timeField);
    tileContainer.appendChild(tileItem);

    /* Date */
    tileItem = document.createElement("div");
    tileItem.style.gridColumn = "span 2";

    dateField = document.createElement("p");
    dateField.style.fontSize = "10pt";
    dateField.textContent = VAR_TEXT_DATE(date);
    
    tileItem.appendChild(dateField);
    tileContainer.appendChild(tileItem);

    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }

    if (timeTileUpdateInterval == undefined) {
        timeTileUpdateInterval = setInterval(updateTimeTile, 1000);
    }
}
//#endregion

//#region Generate group tiles
/******************************************************************************/
/*!
  @brief    Generates the specified group tile.
  @param    tile                Tile to generate
*/
/******************************************************************************/
function generateGroupTile(tile) {
    let redirectFunction;
    let powerFunction = undefined;
    let rangeFunction = undefined;
    
    let group = groups[getIndexFromId(groups, tile.group_id)];
    
    switch (group.type) {
        case DEVICE_TYPE_LEDSTRIP:
            powerFunction = "setGroupPower(" + group.id + ");";
            rangeFunction = "setLedstripGroupBrightness(" + group.id + ");";
            redirectFunction = "visitPage(event, 'control_ledstrip_group?id=" + group.id + "');";
            break;
        case DEVICE_TYPE_RF_DEVICE:
            redirectFunction = "visitPage(event, 'control_rf_devices');";
            break;
        case DEVICE_TYPE_IP_CAMERA:
            redirectFunction = "visitPage(event, 'control_camera_groups?id=" + group.id + "');";
            break;
    }

    if (tile.size == TILE_SIZE_1X1) {
        generateDevice1x1Tile(group, tile, redirectFunction, "deviceGroupIcon" + group.id);
    } else if (tile.size == TILE_SIZE_1X2) {
        generateDevice1x2Tile(group, tile, redirectFunction, powerFunction, "deviceGroupPowerCb" + group.id, "deviceGroupIcon" + group.id);
    } else if (tile.size == TILE_SIZE_4X2) {
        generateDevice4x2TileSlider(group,
                                    tile,
                                    redirectFunction,
                                    powerFunction,
                                    rangeFunction,
                                    "deviceGroupPowerCb" + group.id,
                                    "ledstripGroupBrightnessRange" + group.id,
                                    "deviceGroupIcon" + group.id);
    } else if (tile.size == TILE_SIZE_4X4) {
        console.log("(tile.size == TILE_SIZE_4X4) not supported")//generateDevice4x4TileCamera(device.name, redirectFunction, tile);
    }
}
//#endregion

//#region Generate alarm tile
/******************************************************************************/
/*!
  @brief    Generates the specified alarm tile.
  @param    tile                Tile to generate
  @param    previewTile         If true, it is a preview tile
  @param    size                Tile size
*/
/******************************************************************************/
function generateAlarmTile(tile, previewTile=false, size) {
    if (tile != undefined) {
        size = tile.size;
    }

    if (size == TILE_SIZE_1X2) {
        generateAlarm1x2Tile(tile, previewTile);
        return;
    }

    let tileItem;
    let icon;
    let tileContainer;
    let tileName;

    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile1x1";
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + size + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", "visitPage(event, 'alarm');");
        tileContainer.setAttribute("tile-id", tile.id);
    }

    tileContainer.className = getClassFromSize(size);
    tileContainer.style.boxShadow = "var(--shadow-small)";

    if (!previewTile && configureDashboardMode) {
        tileContainer.style.backgroundColor = "var(--background5)";
        tileContainer.style.border = "1px dashed blue";
    }

    /* Name */
    tileItem = document.createElement("div");
    if (size == TILE_SIZE_1X1) {
        tileItem.style.gridColumn = "span 2";
    }

    tileName = document.createElement("p");
    tileName.textContent = TEXT_ALARM;
    tileItem.appendChild(tileName);

    tileName = document.createElement("p");
    if (alarm.automatically_armed) {
        tileName.textContent = TEXT_AUTO_ARM_ENABLED;
    } else {
        tileName.textContent = TEXT_AUTO_ARM_DISABLED;
    }
    tileName.style.opacity = "0.6";
    
    tileItem.appendChild(tileName);
    tileContainer.appendChild(tileItem);

    /* Icon */
    tileItem = document.createElement("div");
    if (size > TILE_SIZE_1X1) {
        tileItem.style.textAlign = "right";
    }
    
    icon = document.createElement("i");
    if (previewTile) {
        icon.className = "fa-duotone fa-solid fa-shield-halved fa-lg";
    } else {
        icon.id = "alarmIcon";
    }

    tileItem.appendChild(icon);
    tileContainer.appendChild(tileItem);

    /* Connected trusted devices  */
    if (size > TILE_SIZE_1X2) {
        for (let connectedDevice of alarm.connected_deactivation_devices) {
            tileItem = document.createElement("div");
            icon = document.createElement("i");
            icon.className = "fa-duotone fa-solid fa-mobile fa-lg";
            icon.title = connectedDevice.name;
            tileItem.appendChild(icon);
            tileContainer.appendChild(tileItem);
        }
    }

    /* Switch */
    if (size > TILE_SIZE_1X2) {
        tileItem = document.createElement("label");
        tileItem.className = "switch";
        tileItem.style.margin = "0px";
    
        let cbInput = document.createElement("input");
        cbInput.type = "checkbox";
        cbInput.name = "alarmActivatedCb";
        cbInput.id = "alarmActivatedCb";
        cbInput.setAttribute("onclick", "toggleAlarmArmed();");
        let span = document.createElement("span");
        span.className = "slider round";
        span.style.transform = "scale(0.8)";
        
        tileItem.appendChild(cbInput);
        tileItem.appendChild(span);
        tileContainer.appendChild(tileItem);
    }
    
    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}

/******************************************************************************/
/*!
  @brief    Generates a 1x2 alarm tile.
  @param    tile                Tile to generate
  @param    previewTile         If true, it is a preview tile
*/
/******************************************************************************/
function generateAlarm1x2Tile(tile, previewTile=false) {
    if (previewTile) {
        tileContainer = document.createElement("div");
        tileContainer.id = "previewTile" + TILE_SIZE_1X2;
        tileContainer.style.backgroundColor = "var(--background4)";
        tileContainer.setAttribute("onclick", "addTile(" + TILE_SIZE_1X2 + ");");
    } else {
        tileContainer = document.getElementById("tile" + tile.index);
        tileContainer.style.cursor = "pointer";
        tileContainer.setAttribute("tile-id", tile.id);
        tileContainer.style.backgroundColor = "var(--background3)";
        tileContainer.setAttribute("onclick", "visitPage(event, 'alarm');");
    }

    tileContainer.className = "tile alarm-tile";
    tileContainer.style.boxShadow = "var(--shadow-small)";

    /* When in dashboard configuration mode */
    if (!previewTile && configureDashboardMode) {
        tileContainer.style.border = "1px dashed blue";
        tileContainer.style.backgroundColor = "var(--background5)";
    }

    /* Header */
    let header = document.createElement("div");
    header.className = "alarm-tile-header";

    let alarmContainer = document.createElement("div");
    let alarmField = document.createElement("div");
    alarmField.className = "alarm-tile-field";
    alarmField.id = "alarmField";
    if (alarm.armed) {
        alarmField.textContent = TEXT_ARMED;
    } else {
        alarmField.textContent = TEXT_DISARMED;
    }
    let descriptionField = document.createElement("div");
    descriptionField.textContent = TEXT_ALARM;
    descriptionField.style.opacity = "0.8";
    
    alarmContainer.appendChild(descriptionField);
    alarmContainer.appendChild(alarmField);
    header.appendChild(alarmContainer);

    /* Icon */
    let icon = document.createElement("i");
    if (previewTile) {
        icon.className = "fa-duotone fa-solid fa-shield-halved fa-lg";
    } else {
        icon.id = "alarmIcon";
    }

    header.appendChild(icon);

    tileContainer.appendChild(header);

    if (previewTile) {
        tilePreviewContainerElem.appendChild(tileContainer);
    }
}
//#endregion
//#endregion

//#region Basic functionality
/******************************************************************************/
/*!
  @brief    Toggles the alarm armed state.
*/
/******************************************************************************/
function toggleAlarmArmed() {
    alarm.armed = !alarm.armed;
    pauseRefreshes();
    httpPostRequest("/update_alarm", {armed: +alarm.armed});
    updateTileStates();
}

/******************************************************************************/
/*!
  @brief    Sends the device power update command to the back-end.
  @param    id                  Device ID
*/
/******************************************************************************/
function setDevicePower(id) {
    let index = getIndexFromId(devices, id);

    devices[index].power = !devices[index].power;

    let url = "/set_device_power";
    let data = {
        id: id,
        power: +devices[index].power
    };

    pauseRefreshes();
    httpPostRequest(url, data);
    updateTileStates();
}

/******************************************************************************/
/*!
  @brief    Sends the group device power update command to the back-end.
  @param    id                  Group ID
*/
/******************************************************************************/
function setGroupPower(id) {
    let index = getIndexFromId(groups, id);

    groups[index].power = !groups[index].power;

    let url = "/set_group_power";
    let data = {
        id: id,
        power: +groups[index].power
    };

    pauseRefreshes();
    httpPostRequest(url, data);
    
    for (let deviceId of groups[index].device_ids) {
        let deviceIndex = getIndexFromId(devices, deviceId);
        devices[deviceIndex].power = groups[index].power;
    }

    updateTileStates();
}

/******************************************************************************/
/*!
  @brief    Sends the device brightness update command to the back-end.
  @param    id                  Device ID
*/
/******************************************************************************/
function setLedstripBrightness(id) {
    let index = getIndexFromId(devices, id);
    devices[index].brightness = document.getElementById("ledstripBrightnessRange" + id).value;

    let data = {
        id: devices[index].id,
        brightness: devices[index].brightness
    };

    pauseRefreshes();
    httpPostRequest("/set_ledstrip_brightness", data);
    updateTileStates();
}

/******************************************************************************/
/*!
  @brief    Sends the group device brightness update command to the back-end.
  @param    id                  Group ID
*/
/******************************************************************************/
function setLedstripGroupBrightness(id) {
    let index = getIndexFromId(groups, id);
    console.log(groups);
    groups[index].brightness = document.getElementById("ledstripGroupBrightnessRange" + id).value;
    
    for (let deviceId of groups[index].device_ids) {
        devices[getIndexFromId(devices, deviceId)].brightness = groups[index].brightness;
    }

    let data = {
        id: groups[index].id,
        brightness: groups[index].brightness
    };

    pauseRefreshes();
    httpPostRequest("/set_ledstrip_group_brightness", data);
    updateTileStates();
}
//#endregion

//#region Dashboard configuration functionality
/******************************************************************************/
/*!
  @brief    Adds a dashboard configuration.
  @returns  bool               True if successful
*/
/******************************************************************************/
function addDashboardConfiguration() {
    if (!validateDashboardInput()) {
        return false;
    }

    let result = httpPostRequestJsonReturn("/add_dashboard_configuration", lastDashboardData);
    
    if (result.status_code != HTTP_CODE_OK) {
        showBanner(result.message, BANNER_TYPE_ERROR)
        return false;
    }

    let index = getIndexFromId(dashboardConfigurations, -1);
    dashboardConfigurations[index].id = result.message.id;
    dashboardConfigurations[index].name = lastDashboardData.name;
    dashboardConfigurations[index].icon = lastDashboardData.icon;
    showBanner(TEXT_SUCCESS, TEXT_ITEM_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);

    selectedDashboard = result.message.id;

    return true;
}

/******************************************************************************/
/*!
  @brief    Updates the selected dashboard configuration.
  @returns  bool               True if successful
*/
/******************************************************************************/
function updateDashboardConfiguration() {
    if (!validateDashboardInput(selectedDashboard)) {
        return false;
    }

    let result = httpPostRequestJsonReturn("/update_dashboard_configuration", lastDashboardData);
    
    if (result.status_code != HTTP_CODE_OK) {
        showBanner(result.message, BANNER_TYPE_ERROR)
        return false;
    }

    for (let i in dashboardConfigurations) {
        if (dashboardConfigurations[i].id == lastDashboardData.id) {
            dashboardConfigurations[i].name = lastDashboardData.name;
            dashboardConfigurations[i].icon = lastDashboardData.icon;
            break;
        }
    }

    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    return true;
}

/******************************************************************************/
/*!
  @brief    Shows a confirmation before deleting the selected dashboard
            configuration.
*/
/******************************************************************************/
function deleteDashboardConfigurationConfirm() {
    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteDashboardConfiguration();"},
                    CANCEL_POPUP_BUTTON
                ];

    showPopup(TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_DASHBOARD, buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Deletes the selected dashboard configuration.
*/
/******************************************************************************/
function deleteDashboardConfiguration() {
    closePopup();
    if (selectedDashboard == -1) {
        showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
        selectedDashboard = dashboardConfigurations[0].id;
        configureDashboardMode = false;
        loadDashboardConfiguration();
        dashboardConfigurations.pop();
        dashboardConfigurations.pop();
        return;
    }

    let dashboardIndex = getIndexFromId(dashboardConfigurations, selectedDashboard);
    let data = {
        id: dashboardConfigurations[dashboardIndex].id
    };
    
    httpPostRequest("/delete_dashboard_configuration", data);

    dashboardConfigurations.splice(dashboardIndex, 1);

    showBanner(TEXT_SUCCESS, TEXT_ITEM_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    selectedDashboard = dashboardConfigurations[0].id;
    configureDashboardMode = false;
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
  @brief    Validates the specified dashboard configuration.
  @param    id                 Dashboard ID
  @returns  bool               True if valid
*/
/******************************************************************************/
function validateDashboardInput(id=-1) {
    const dashboardNameTxtElem = document.getElementById("dashboardNameTxt");
    const dashboardIconElem = document.getElementById("dashboardIcon");
    
    /* Get user input */
    let name = dashboardNameTxtElem.value;
    let icon = dashboardIconElem.className;

    /* Reset error styling */
    dashboardNameTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        dashboardNameTxtElem.classList.add("invalid-input");
        dashboardNameTxtElem.focus();
        showBanner(TEXT_WARNING, TEXT_FIELD_REQUIRED, BANNER_TYPE_WARNING);
        return false;
    }
    if (name.match(SYMBOL_ALL_RE)) {
        dashboardNameTxtElem.classList.add("invalid-input");
        dashboardNameTxtElem.focus();
        showBanner(TEXT_WARNING, TEXT_NO_CRITICAL_SYMBOLS, BANNER_TYPE_WARNING);
        return false;
    }

    lastDashboardData = {
        id: id,
        name: name,
        icon: icon,
        tiles: []
    }

    return true;
}

/******************************************************************************/
/*!
  @brief    Changes the order of the tiles.
  @param    onUpdate        Function to execute when order is updated
*/
/******************************************************************************/
function changeOrder(onUpdate) {
    let dragEl, nextEl, newPos;
 
    let oldPos = [...dashboardGridElem.children].map(item => {
        item.draggable = true
        let pos = document.getElementById(item.id).getBoundingClientRect();
        return pos;
    });
   
    function _onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        
        let target = e.target;
        if (target && target !== dragEl && target.nodeName == "DIV" ) {
            if (target.classList.contains("inside")) {
                e.stopPropagation();
            } else {
                let targetPos = target.getBoundingClientRect();
                let next = (e.clientY - targetPos.top) / (targetPos.bottom - targetPos.top) > .5 || (e.clientX - targetPos.left) / (targetPos.right - targetPos.left) > .5;
                try {
                    dashboardGridElem.insertBefore(dragEl, next && target.nextSibling || target);
                } catch (error) {}
            }
        }   
    }
    
    function _onDragEnd(evt) {
        evt.preventDefault();
        newPos = [...dashboardGridElem.children].map(child => {
            let pos = document.getElementById(child.id).getBoundingClientRect();
            return pos;
        });
        
        dashboardGridElem.removeEventListener("dragover", _onDragOver, false);
        dashboardGridElem.removeEventListener("dragend", _onDragEnd, false);

        nextEl !== dragEl.nextSibling ? onUpdate(dragEl) : false;

        let configIndex = getIndexFromId(dashboardConfigurations, selectedDashboard);
        let tiles = dashboardConfigurations[configIndex].tiles;
        let index = 0;
        for (let t of dashboardGridElem.children) {
            let tileId = t.getAttribute("tile-id");
            
            if (tileId != null) {
                if (tiles[getIndexFromId(tiles, tileId)].index != index) {
                    changeTileIndex(tileId, configIndex, index);
                }
            }
            
            index++;
        }

        loadDashboardConfiguration();
    }
       
    dashboardGridElem.addEventListener("dragstart", function(e) {     
        dragEl = e.target; 
        nextEl = dragEl.nextSibling;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("Text", dragEl.textContent);
        
        dashboardGridElem.addEventListener("dragover", _onDragOver, false);
        dashboardGridElem.addEventListener("dragend", _onDragEnd, false);
    });
}
//#endregion

//#region Dashboard tile configuration functionality
/******************************************************************************/
/*!
  @brief    Resets the selected dashboard configuration tile ordering.
*/
/******************************************************************************/
function resetDashboardConfiguration() {
    let index = 0;
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    
    for (let tile of configuration.tiles) {
        tile.index = index;
        index++;
    }

    loadDashboardConfiguration();

    let data = {
        id: configuration.id
    }

    pauseRefreshes();
    httpPostRequest("/reset_dashboard_tile_order", data);
}

/******************************************************************************/
/*!
  @brief    Adds a tile to the selected dashboard.
  @param    size                Tile size
*/
/******************************************************************************/
function addTile(size) {
    let configIndex = getIndexFromId(dashboardConfigurations, selectedDashboard)

    loadDashboardConfiguration();

    let tile = {
        configuration_id: dashboardConfigurations[configIndex].id,
        type: parseInt(tileTypeSelectElem.value),
        size: size,
        index: getLowestEmptyTileIndex()
    }

    if (tile.type == TILE_TYPE_DEVICE) {
        tile.device_id = parseInt(tileTargetSelectElem.value);
    } else if (tile.type == TILE_TYPE_GROUP) {
        tile.group_id = parseInt(tileTargetSelectElem.value);
    }

    pauseRefreshes();

    let result = httpPostRequestJsonReturn("/add_dashboard_tile", tile);
    tile.id = result.message.id;
    console.log(dashboardConfigurations[configIndex])
    dashboardConfigurations[configIndex].tiles.push(tile);
    
    closeModal(tileModalElem);
    loadDashboardConfiguration();
    updateTileStates();
}

/******************************************************************************/
/*!
  @brief    Changes the tile size of the specified tile on the selected
            dashboard.
  @param    tileArrayIndex      Tile index
  @param    size                Tile size
*/
/******************************************************************************/
function changeTileSize(tileArrayIndex, size) {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    
    configuration.tiles[tileArrayIndex].size = size;
    loadDashboardConfiguration();

    let data = {
        id: configuration.tiles[tileArrayIndex].id,
        size: size
    }

    pauseRefreshes();
    httpPostRequest("/update_dashboard_tile", data);
}

/******************************************************************************/
/*!
  @brief    Changes the order of the tiles.
  @param    id                  Tile ID
  @param    configurationIndex  Configuration index
  @param    newIndex            New index
*/
/******************************************************************************/
function changeTileIndex(id, configurationIndex, newIndex) {
    dashboardConfigurations[configurationIndex].tiles[getIndexFromId(dashboardConfigurations[configurationIndex].tiles, id)].index = newIndex;
    let data = {
        id: id,
        index: newIndex
    }
    
    pauseRefreshes();
    httpPostRequest("/update_dashboard_tile", data);
}

/******************************************************************************/
/*!
  @brief    Deletes the specified tile.
  @param    id                  Tile ID
*/
/******************************************************************************/
function deleteTile(id) {
    let configIndex = getIndexFromId(dashboardConfigurations, selectedDashboard)

    let index = getIndexFromId(dashboardConfigurations[configIndex].tiles, id);
    dashboardConfigurations[configIndex].tiles.splice(index, 1);
    loadDashboardConfiguration();

    let data = {
        id: id
    }

    pauseRefreshes();
    httpPostRequest("/delete_dashboard_tile", data);
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
    tileTypeTitleElem.textContent = TEXT_TYPE;
    tileTargetTitleElem.textContent = TEXT_TARGET;
}

/******************************************************************************/
/*!
  @brief    Loads the add tile modal.
*/
/******************************************************************************/
function loadAddTileModal() {
    /* Reset error styling */
    tileErrorMessageFieldElem.style.display = "none";
    tileTargetInputContainerElem.style.display = "none";

    tileModalTitleElem.textContent = TEXT_ADD_TILE;
    tileTypeSelectElem.value = "";
    tileTargetSelectElem.value = "";
    tilePreviewContainerElem.innerHTML = "";

    showModal(tileModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the weather location modal.
*/
/******************************************************************************/
function loadWeatherLocationModal() {
    errorMessageWeatherLocationFieldElem.style.display = "none";
    weatherLocationTxtElem.classList.remove("invalid-input");

    weatherLocationTxtElem.value = weatherLocation;
    showModal(weatherLocationModalElem);
}

/******************************************************************************/
/*!
  @brief    Loads the icon options.
*/
/******************************************************************************/
function loadIconOptions() {
    iconPickerContainerElem.innerHTML = "";

    let iconElem;
    for (let icon of ICONS_L) {
        iconElem = document.createElement("i");
        iconElem.className = icon + " clickable";
        iconElem.setAttribute("onclick", "pickIcon('" + icon + "');");
        iconPickerContainerElem.appendChild(iconElem);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the tile type select options.
*/
/******************************************************************************/
function loadTileTypeSelectOptions() {
    tileTypeSelectElem.innerHTML = "";

    let option = document.createElement("option");
    option.value = "";
    option.text = "";
    tileTypeSelectElem.appendChild(option);

    for (let type of tileTypes) {
        let option = document.createElement("option");
        option.value = type.type;
        option.text = type.name;
        
        tileTypeSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the dashboard configurations in the top bar.
*/
/******************************************************************************/
function loadTopBar() {
    topBarElem.innerHTML = "";

    if (configureDashboardMode) {
        let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
        /* Icon */
        let item = document.createElement("i");
        item.id = "dashboardIcon";
        item.setAttribute("onclick", "showModal(iconModalElem);");
        item.className = configuration.icon + " top-bar-item";
        item.title = TEXT_EDIT_DASHBOARD_ICON;
        topBarElem.append(item)

        /* Name */
        item = document.createElement("input");
        item.setAttribute("type", "text");
        item.id = "dashboardNameTxt";
        item.style.marginLeft = "10px";
        item.style.marginRight = "10px";
        item.value = configuration.name;
        item.className = "";
        topBarElem.append(item)

        /* Save */
        item = document.createElement("i");
        item.setAttribute("onclick", "toggleConfigurationMode();");
        item.className = "fa-duotone fa-solid fa-floppy-disk fa-lg top-bar-item";
        item.title = TEXT_SAVE;
        topBarElem.append(item)

        /* Delete */
        if (dashboardConfigurations.length > 1) {
            item = document.createElement("i");
            item.setAttribute("onclick", "deleteDashboardConfigurationConfirm();");
            item.className = "fa-duotone fa-solid fa-trash fa-lg top-bar-item";
            item.title = TEXT_DELETE_DASHBOARD;
            topBarElem.append(item)
        }
        return;
    }

    let item;

    /* Dashboards */
    for (let dashboard of dashboardConfigurations) {
        item = document.createElement("i");
        item.setAttribute("onclick", "loadDashboardConfiguration(" + dashboard.id + ");");
        item.className = dashboard.icon + " top-bar-item";
        if (dashboard.id == selectedDashboard) {
            item.className = dashboard.icon + " top-bar-item top-bar-item-active";
        }
        item.title = dashboard.name;
        topBarElem.append(item)
    }

    /* Add */
    item = document.createElement("i");
    item.setAttribute("onclick", "showAddDashboardConfigurationBar();");
    item.className = "fa-duotone fa-solid fa-plus fa-lg top-bar-item";
    item.title = TEXT_ADD_DASHBOARD;
    topBarElem.append(item)
}

/******************************************************************************/
/*!
  @brief    Loads the specified dashboard configuration.
  @param    id                  Dashboard ID
  @param    save                When true, the specified dashboard gets saved as
                                cookie
*/
/******************************************************************************/
function loadDashboardConfiguration(id=undefined, save=true) {
    if (id == undefined) {
        id = selectedDashboard;
    } else {
        selectedDashboard = id;
        configureDashboardMode = false;
    }

    if (save) {
        localStorage.setItem("selectedDashboard", selectedDashboard);
    }

    generateGrid();
    generateTiles();
    updateTileStates(true);
    loadTopBar();

    if (configureDashboardMode) {
        changeOrder(function (item){});
    }
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the weather location input.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateWeatherLocation() {
    /* Get user input */
    let location = weatherLocationTxtElem.value;

    /* Reset error styling */
    errorMessageWeatherLocationFieldElem.style.display = "none";
    weatherLocationTxtElem.classList.remove("invalid-input");

    /* Validate location */
    if (location == "") {
        weatherLocationTxtElem.classList.add("invalid-input");
        weatherLocationTxtElem.focus();
        errorMessageWeatherLocationFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageWeatherLocationFieldElem.style.display = "inline-block";
        return false;
    }

    return true;
}
//#endregion

//#region Mouse context menu
/******************************************************************************/
/*!
  @brief    Toggles and generates the mouse context menu for the dashboard.
  TODO IMPROVE
  @param    show                Show state to set
*/
/******************************************************************************/
function generateMouseContextMenuDashboard() {
    let index;
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    
    for (let i in configuration.tiles) {
        if (configuration.tiles[i].index == mouseContextMenuTileIndex) {
            index = i;
            break;
        }
    }

    let menuData = [];

    /* Show tile options when tile is selected */
    if (index != undefined) {
        menuData.push({text: TEXT_CHANGE_TILE_SIZE, icon: "fa-solid fa-file", submenu: []});
        menuData.push({text: TEXT_DELETE_TILE, icon: "fa-solid fa-trash", onclickFunction: "deleteTile(" + configuration.tiles[index].id + ");"});

        let tileSizes = getCompatibleTileSizes(configuration.tiles[index]);

        for (let size of tileSizes) {
            if (configuration.tiles[index].size == size.size) {
                continue;
            }

            menuData[0].submenu.push({text: size.description, icon: size.icon, onclickFunction: "changeTileSize(" + index + ", " + size.size + ");"});
        }
    }

    /* Add tile option */
    menuData.push({text: TEXT_ADD_TILE, icon: "fa-duotone fa-solid fa-plus", onclickFunction: "loadAddTileModal();"});

    /* Update dashboard option */
    menuData.push({text: TEXT_EDIT_DASHBOARD, icon: "fa-duotone fa-solid fa-pen-to-square", onclickFunction: "toggleConfigurationMode();"});

    /* Reset dashboard option */
    menuData.push({text: TEXT_RESET_DASHBOARD, icon: "fa-duotone fa-solid fa-arrows-rotate-reverse", onclickFunction: "resetDashboardConfiguration();"});

    if (mouseMenu != undefined) {
        mouseMenu.destroy();
    }
    mouseMenu = generateMouseContextMenu(menuData);
};

/******************************************************************************/
/*!
  @brief    Shows the mouse context menu after right mouse click.
*/
/******************************************************************************/
window.addEventListener("contextmenu", e => {
    e.preventDefault();
    const origin = {
        left: e.clientX,
        top: e.clientY
    };

    const tile = e.target.closest("[id^='tile']");

    if (tile) {
        mouseContextMenuTileIndex = tile.id.replace("tile", "");
    } else {
        mouseContextMenuTileIndex = undefined;
    }

    generateMouseContextMenuDashboard();
    mouseMenu.show(origin);
});
//#endregion

//#region Interval update functionality
/******************************************************************************/
/*!
  @brief    Asynchronous interval function for fetching the devices states
            from the back-end for real-time monitoring.
*/
/******************************************************************************/
async function fetchStates() {
    if (!isFetchingStates) {
        setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_5S);
        return;
    }

    try {
        var response = await fetch("get_devices", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
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
    devices = data;
    updateTileStates();

    setTimeout(fetchStates, BACK_END_UPDATE_INTERVAL_1S);
}

/******************************************************************************/
/*!
  @brief    Interval function for updating the date time tile.
*/
/******************************************************************************/
function updateTimeTile() {
    let timeField = document.getElementById("timeField");
    if (timeField == undefined) {
        clearInterval(timeTileUpdateInterval);
        return;
    }

    let date = new Date();
    timeField.id = "timeField";
    timeField.textContent = date.toLocaleTimeString().substring(0, 5);
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

//#region Update tile states
/******************************************************************************/
/*!
  @brief    Updates the tile states.
  @param    showErrorMessages   If true, banners with possible tile error
            messages are shown.
*/
/******************************************************************************/
function updateTileStates(showErrorMessages=false) {
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    
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
  @brief    Updates the specified device tile states.
  @param    tile                Tile object
  @param    showErrorMessages   If true, banners with possible tile error
            messages are shown.
*/
/******************************************************************************/
function updateDeviceTileStates(tile, showErrorMessages=false) {
    let device = devices[getIndexFromId(devices, tile.device_id)];

    if (device.type == DEVICE_TYPE_LEDSTRIP) {
        if (document.getElementById("devicePowerCb" + device.id) != undefined) {
            document.getElementById("devicePowerCb" + device.id).checked = device.power;
        }

        if (document.getElementById("ledstripBrightnessRange" + device.id) != undefined) {
            document.getElementById("ledstripBrightnessRange" + device.id).value = device.brightness;
        }

        let iconElem = document.getElementById("deviceIcon" + device.id);

        if (device.number_of_leds == 0) {
            iconElem.className = "fa-duotone fa-solid fa-circle-exclamation fa-xl";
            iconElem.title = TEXT_LED_ADDRESSING_NOT_CONFIGURED;
            if (showErrorMessages) {
                showBanner(
                            TEXT_ACTION_REQUIRED,
                            VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(device.name),
                            BANNER_TYPE_WARNING,
                            0,
                            "updateLedAddressing(" + device.id + ");"
                        );
            }
            return;
        }

        if (!device.connection_status) {
            iconElem.className = "fa-duotone fa-solid fa-circle-exclamation fa-xl";
            iconElem.title = TEXT_NOT_CONNECTED;
            return;
        }
        
        if (device.power) {
            iconElem.className = device.icon + " fa-xl";
        } else {
            iconElem.className = device.icon_low_state + " fa-xl";
        }
        return;
    }
    
    if (device.type == DEVICE_TYPE_RF_DEVICE) {
        if (device.state) {
            document.getElementById("deviceIcon" + device.id).className = device.icon + " fa-xl";
        } else {
            document.getElementById("deviceIcon" + device.id).className = device.icon_low_state + " fa-xl";
        }
    }

    /* Devices without power switches */
    if (device.type == DEVICE_TYPE_IP_CAMERA) {
        if (document.getElementById("deviceIcon" + device.id) == undefined) {
            return;
        }
        
        if (device.connection_status) {
            document.getElementById("deviceIcon" + device.id).className = device.icon + " fa-xl";
        } else {
            document.getElementById("deviceIcon" + device.id).className = "fa-duotone fa-solid fa-circle-exclamation fa-xl";
        }
        return;
    }
}

/******************************************************************************/
/*!
  @brief    Updates the specified group tile states.
  @param    tile                Tile object
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
  @brief    Updates the specified alarm tile states.
  @param    tile                Tile object
*/
/******************************************************************************/
function updateAlarmTileStates(tile) {
    if (document.getElementById("alarmActivatedCb") != undefined) {
        document.getElementById("alarmActivatedCb").checked = alarm.armed;
        document.getElementById("alarmActivatedCb").title = TEXT_ARMED;
    }

    if (alarm.armed) {
        document.getElementById("alarmIcon").className = "fa-duotone fa-solid fa-shield-check fa-lg";
        if (document.getElementById("alarmField") != undefined) {
            document.getElementById("alarmField").textContent = TEXT_ARMED;
        }
    } else {
        document.getElementById("alarmIcon").className = "fa-duotone fa-solid fa-shield-slash fa-lg"
        if (document.getElementById("alarmField") != undefined) {
            document.getElementById("alarmField").textContent = TEXT_DISARMED;
        }
    }

    //TODO get connected devices
}
//#endregion

//#region Other
/******************************************************************************/
/*!
  @brief    Sends the updated weather location to the back-end.
*/
/******************************************************************************/
function updateWeatherLocation() {
    if (!validateWeatherLocation()) {
        return;
    }

    let location = weatherLocationTxtElem.value;
    let result = httpPostRequestJsonReturn("/update_weather_configuration", {weather_location: location});
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageWeatherLocationFieldElem.style.display = "inline-block";
        errorMessageWeatherLocationFieldElem.textContent = weatherErrorCodeToText(result.message);
        return;
    }

    weatherLocation = result.message.weather_location;
    showBanner(TEXT_SUCCESS, VAR_TEXT_WEATHER_LOCATION_CHANGED_SUCCESSFULLY(weatherLocation), BANNER_TYPE_SUCCESS);
    closeModal(weatherLocationModalElem);
    
    weatherLoading = true;
    loadDashboardConfiguration();

    /* Reload weather after some time */
    setTimeout(function() {
        fetchWeatherInformation();
    }, BACK_END_UPDATE_INTERVAL_1S)
}

/******************************************************************************/
/*!
  @brief    Fetches the weather information (after a location change).
*/
/******************************************************************************/
async function fetchWeatherInformation() {
    try {
        var response = await fetch("get_weather", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        showLoadingBanner(TEXT_DISCONNECTED_CONNECTING);
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, fetchWeatherInformation);
        return;
    }

    let data = await response.json();
    weather = data.message.weather;

    weatherLoading = false;
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
  @brief    Toggles the dashboard configuration mode.
*/
/******************************************************************************/
function toggleConfigurationMode() {
    if (configureDashboardMode) {
        if (selectedDashboard == -1) {
            if (!addDashboardConfiguration()) {
                return;
            }
        } else if (!updateDashboardConfiguration()) {
            return;
        }
    }
    configureDashboardMode = !configureDashboardMode;
    loadTopBar();
    loadDashboardConfiguration();
}

/******************************************************************************/
/*!
  @brief    Shows the add dashboard configuration bar.
*/
/******************************************************************************/
function showAddDashboardConfigurationBar() {
    configureDashboardMode = true;

    selectedDashboard = -1;

    let configuration = {
        id: selectedDashboard,
        name: TEXT_DASHBOARD,
        icon: "fa-duotone fa-solid fa-grid-horizontal fa-lg",
        tiles: []
    }

    dashboardConfigurations.push(configuration);
    loadTopBar();
    loadDashboardConfiguration(undefined, false);
}

/******************************************************************************/
/*!
  @brief    Returns the lowest empty tile index.
  @returns  integer             Lowest empty tile index
*/
/******************************************************************************/
function getLowestEmptyTileIndex() {
    for (let i = 0; i < MAX_NUMBER_OF_TILES; i++) {
        let tile = document.getElementById("tile" + i);
        if (!tile) continue;

        let isTransparent = tile.style.backgroundColor === "transparent";
        let isSingle = tile.classList.contains("single");
        let isEmpty = tile.innerHTML.trim() === "";

        if (isTransparent && isSingle && isEmpty) {
            return i;
        }
    }

    return undefined;
}

/******************************************************************************/
/*!
  @brief    Returns the compatible tile sizes based on the specified tile.
  @param    tile                Tile object
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
}

/******************************************************************************/
/*!
  @brief    Redirects to device or group when clicked on a tile.
  @param    event               Event to process
  @param    url                 Url to redirect to
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

/******************************************************************************/
/*!
  @brief    Sets the specified icon to the specified DOM element.
  @param    icon                Icon to set
*/
/******************************************************************************/
function pickIcon(icon) {
    const dashboardIconElem = document.getElementById("dashboardIcon");
    dashboardIconElem.className = icon + " top-bar-item";
    closeModal(iconModalElem);
}

/******************************************************************************/
/*!
  @brief    Updates the tile type and loads the necessary DOM elements.
*/
/******************************************************************************/
function updateModalTileType() {
    tileTargetInputContainerElem.style.display = "none";
    tileTargetSelectElem.innerHTML = "";
    let configuration = dashboardConfigurations[getIndexFromId(dashboardConfigurations, selectedDashboard)];
    let itemAlreadyOnDashboard;
    
    console.log(tileTypeSelectElem.value)

    if (tileTypeSelectElem.value == TILE_TYPE_DEVICE) {
        tileTargetInputContainerElem.style.display = "block";
        for (let device of devices) {
            itemAlreadyOnDashboard = false;
            for (let tile of configuration.tiles) {
                if (tile.device_id == device.id) {
                    itemAlreadyOnDashboard = true;
                    break;
                }
            }

            if (itemAlreadyOnDashboard) {
                continue;
            }

            let option = document.createElement("option");
            option.value = device.id;
            option.text = device.name;
            
            tileTargetSelectElem.appendChild(option);
        }
    } else if (tileTypeSelectElem.value == TILE_TYPE_GROUP) {
        tileTargetInputContainerElem.style.display = "block";
        for (let group of groups) {
            itemAlreadyOnDashboard = false;
            for (let tile of configuration.tiles) {
                if (tile.group_id == group.id) {
                    itemAlreadyOnDashboard = true;
                    break;
                }
            }

            if (itemAlreadyOnDashboard) {
                continue;
            }

            let option = document.createElement("option");
            option.value = group.id;
            option.text = group.name;
            
            tileTargetSelectElem.appendChild(option);
        }
    } else if (tileTypeSelectElem.value == TILE_TYPE_DATETIME) {

    } else if (tileTypeSelectElem.value == TILE_TYPE_WEATHER) {

    } else if (tileTypeSelectElem.value == TILE_TYPE_ALARM) {

    }
    
    generateTilePreviews();
}

/******************************************************************************/
/*!
  @brief    Updates dashboard group power synchronized state.
  @param    group               Group to check
  @returns  array               When not synchronized, only false. When
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
  @brief    Updates dashboard group brightness synchronized state.
  @param    group               Group to check
  @returns  array               When not synchronized, only false. When
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
//#endregion
//#endregion