/****************************************************************************/
/*
 * File:    dashboard_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for dashboard.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_ADD_DASHBOARD, TEXT_ADD_TILE, TEXT_ALARM, TEXT_ARMED, TEXT_AUTO_ARM_DISABLED,
    TEXT_AUTO_ARM_ENABLED, TEXT_CANCEL, TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_CHANGE_TILE_SIZE,
    TEXT_CREATE_DASHBOARD, TEXT_DASHBOARDS_OVERVIEW, TEXT_DASHBOARD_CONFIGURATION_DESCRIPTION,
    TEXT_DELETE, TEXT_DELETE_DASHBOARD, TEXT_DELETE_TILE, TEXT_DISARMED,
    TEXT_DISCONNECTED_CONNECTING, TEXT_EDIT_DASHBOARD, TEXT_ERROR, TEXT_FIELD_REQUIRED,
    TEXT_ITEM_ADDED_SUCCESSFULLY, TEXT_ITEM_DELETED_SUCCESSFULLY,
    TEXT_LED_ADDRESSING_NOT_CONFIGURED, TEXT_MANAGE_DASHBOARD, TEXT_NOT_CONNECTED,
    TEXT_NO_DASHBOARDS, TEXT_NO_RF_HUB_AVAILABLE, TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_DASHBOARD,
    TEXT_Q_DELETE_TILE, TEXT_READY_TO_RUN, TEXT_RENAME_DASHBOARD, TEXT_RESET_DASHBOARD,
    TEXT_SUCCESS, VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE,
    VAR_TEXT_WEATHER_LOCATION_CHANGED_SUCCESSFULLY
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { dashboardService } from "../services/dashboard.js";
import {
    FloatingNavigationBar, MouseContextMenu, PopupManager
} from "../../vendor/templates/js/ui_components/index.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import { AnimationController } from "../../vendor/templates/js/core/animation.js";
import { DashboardGrid } from "../ui_components/DashboardGrid.js";
import { DashboardDialogs } from "../ui_components/DashboardDialogs.js";
import { createDashboardTileOptionsButton } from "../ui_components/tiles/Tile.js";
import { AddTile } from "../ui_components/tiles/AddTile.js";
import { AlarmTile } from "../ui_components/tiles/AlarmTile.js";
import { AutomationTile } from "../ui_components/tiles/AutomationTile.js";
import { DateTimeTile } from "../ui_components/tiles/DateTimeTile.js";
import { LedstripTile } from "../ui_components/tiles/LedstripTile.js";
import { RfDeviceTile } from "../ui_components/tiles/RfDeviceTile.js";
import { WeatherTile } from "../ui_components/tiles/WeatherTile.js";
import {
    TILE_SIZES, TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_2X4, TILE_SIZE_4X4,
    TILE_TYPE_ALARM, TILE_TYPE_AUTOMATION, TILE_TYPE_DATETIME, TILE_TYPE_DEVICE, TILE_TYPE_GROUP,
    TILE_TYPE_SPACER, TILE_TYPE_WEATHER, getClassFromSize
} from "../domain/dashboard_tiles.js";

const DEVICE_TYPE_LEDSTRIP = 0;
const DEVICE_TYPE_RF_DEVICE = 1;

const { http, banners, popup, signal, delay, components } = mountPage("dashboard");
const data = readPageData();
const api = dashboardService(http, signal);
const { alarm, groups, automations, hubRfReceiverAvailable } = data;
let devices = data.devices;
let weather = data.weather;
let weatherLocation = data.location;
let weatherLoading = false;
let dashboardConfigurations = data.dashboards;
let configureDashboardMode = false;
let selectedDashboardId = dashboardConfigurations.find(item =>
    String(item.id) === localStorage.getItem("selectedDashboardId"))?.id
    ?? dashboardConfigurations[0]?.id;
let dashboardTileObjects = [];
let pausedUntil = 0;

/****************************************************************************/
/*!
 * @brief   Finds a device or group by its identifier.
 * @param   items                   Configurations to search.
 * @param   id                      Identifier of the affected item.
 * @returns Matching configuration or undefined.
 */
/****************************************************************************/
const byId = (items, id) => items.find(item => item.id === id);

/****************************************************************************/
/*!
 * @brief   Returns the currently selected dashboard configuration.
 * @returns The currently selected dashboard configuration.
 */
/****************************************************************************/
const selected = () => byId(dashboardConfigurations, selectedDashboardId);
const dashboardGridElem = document.getElementById("dashboardGrid");

/****************************************************************************/
/*!
 * @brief   Saves a dragged tile position and reports whether the move succeeded.
 * @param   id                      Identifier of the affected item.
 * @param   x                       Horizontal canvas or menu position.
 * @param   y                       Vertical canvas or menu position.
 * @returns Whether the operation or validation condition succeeds.
 */
/****************************************************************************/
const dashboardGridObject = new DashboardGrid(dashboardGridElem, async (id, x, y) => {
    try {
        await api.moveTile({ id, position_x: x, position_y: y });

        return true;
    } catch (error) {
        report(error);

        return false;
    }
}).mount();
const navigation = new FloatingNavigationBar(document.querySelector("[data-dashboard-navigation]")).mount();
const contextMenu = new MouseContextMenu(document.querySelector("[data-context-menu]")).mount();
const editorPopup = new PopupManager(document.querySelector("[data-dashboard-confirmation]")).mount();
const menuAnimation = new AnimationController();
const weatherStack = new ModalStack();
const weatherDialog = document.querySelector("#weatherLocationModal");
const weatherInput = weatherDialog.querySelector("input");
const weatherError = weatherDialog.querySelector(".error");
const editors = new DashboardDialogs(document.querySelector("[data-dashboard-dialogs]"), {
    onSave: saveDashboard,
    onDelete: deleteDashboardConfiguration,
    getTargets,
    createPreviews
}).mount();

components.push(dashboardGridObject, editors, editorPopup, navigation, contextMenu, weatherStack);

signal.addEventListener("abort", () => menuAnimation.clear(), { once: true });
signal.addEventListener("abort", destroyTiles, { once: true });

let menuTile;
let menuPoint;
let reconnectBanner;

/****************************************************************************/
/*!
 * @brief   Displays a successful dashboard operation.
 * @param   message                 Message shown to the user.
 */
/****************************************************************************/
function notify(message) {
    banners.show({ title: TEXT_SUCCESS, message, type: "success" });
}

/****************************************************************************/
/*!
 * @brief   Displays a dashboard error while the page is active.
 * @param   error                   Failure to display.
 */
/****************************************************************************/
function report(error) {
    if (!signal.aborted) banners.show({ title: TEXT_ERROR, message: error.message, type: "error" });
}

/****************************************************************************/
/*!
 * @brief   Destroys mounted dashboard tiles and clears their references.
 */
/****************************************************************************/
function destroyTiles() {
    for (const tile of dashboardTileObjects) tile.destroy();

    dashboardTileObjects = [];
}

/****************************************************************************/
/*!
 * @brief   Renders the selected dashboard and its editing controls.
 * @param   id                      Identifier of the affected item.
 */
/****************************************************************************/
function loadDashboardConfiguration(id = selectedDashboardId) {
    selectedDashboardId = id;
    if (id != null) localStorage.setItem("selectedDashboardId", id);

    const dashboard = selected();
    for (const warning of dashboardGridElem.parentElement.querySelectorAll("[data-addressing]"))
        warning.remove();

    const items = dashboardConfigurations.slice().reverse().map(item => ({
        title: item.name,
        icon: item.icon,
        selected: item.id === id,
        action: "select-" + item.id
    }));
    items.push({
        action: "add",
        title: TEXT_ADD_DASHBOARD,
        icon: "fa-duotone fa-solid fa-plus fa-lg"
    }, {
        action: "edit",
        title: TEXT_EDIT_DASHBOARD,
        icon: configureDashboardMode
            ? "fa-duotone fa-solid fa-floppy-disk fa-lg"
            : "fa-duotone fa-solid fa-pen-to-square fa-lg"
    }, {
        action: "overview",
        title: TEXT_DASHBOARDS_OVERVIEW,
        icon: "fa-duotone fa-solid fa-gears fa-lg"
    });
    navigation.update({ items, location: "right" });
    document.querySelector("#dashboardEmptyState").hidden = !!dashboard;
    document.querySelector("#dashboardConfigurationPanel").hidden = !dashboard
        || !configureDashboardMode;
    destroyTiles();
    dashboardGridElem.replaceChildren();
    if (!dashboard) {
        dashboardGridObject.setConfiguration([], false);

        return;
    }

    for (const tile of [...dashboard.tiles].sort((a, b) => a.index - b.index)) {
        if (tile.type === TILE_TYPE_SPACER) {
            const spacer = createSpacerTile(tile.size);
            spacer.setAttribute("tile-id", tile.id);
            dashboardGridElem.append(spacer);
            continue;
        }

        const component = createDashboardTile(tile);
        if (!component) continue;

        component.props.editable = configureDashboardMode;

        const element = component.mount().root;
        prepareDashboardTileElement(element, tile);
        dashboardGridElem.append(element);
        dashboardTileObjects.push(component);
    }

    if (!dashboard.tiles.length || configureDashboardMode && id !== -1) {
        const add = new AddTile(document.createElement("div"), {
            title: TEXT_ADD_TILE,
            onclickFunction: () => editors.add()
        }).mount();
        dashboardGridElem.append(add.root);
        dashboardTileObjects.push(add);
    }

    dashboardGridObject.setConfiguration(dashboard.tiles, configureDashboardMode);
    updateTileStates(true);
}

/****************************************************************************/
/*!
 * @brief   Applies tile semantics appropriate to the dashboard editing state.
 * @param   tileElem                Rendered dashboard tile element.
 * @param   tile                    Dashboard tile configuration.
 */
/****************************************************************************/
function prepareDashboardTileElement(tileElem, tile) {
    if (configureDashboardMode) {
        tileElem.removeAttribute("role");
        tileElem.removeAttribute("tabindex");

        if (!tileElem.querySelector(".dashboard-tile-options-button")
            && matchMedia("(max-width: 699px)").matches) {
            tileElem.appendChild(createDashboardTileOptionsButton(tile.id));
        }

        return;
    }

    if (tileElem.onclick && !tileElem.hasAttribute("role")) {
        tileElem.setAttribute("role", "button");
        tileElem.tabIndex = 0;

        /****************************************************************************/
        /*!
         * @brief   Activates a dashboard tile with Enter or Space.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        tileElem.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            tileElem.click();
        });
    }
}

/****************************************************************************/
/*!
 * @brief   Creates the component for a configured dashboard tile.
 * @param   tile                    Dashboard tile configuration.
 * @returns Tile component or no value for unsupported targets.
 */
/****************************************************************************/
function createDashboardTile(tile) {
    if (tile.type == TILE_TYPE_DATETIME) {
        return new DateTimeTile(document.createElement("div"), { tile: tile });
    }

    if (tile.type == TILE_TYPE_WEATHER) {
        return new WeatherTile(document.createElement("div"), {
            tile,
            weather,
            loading: weatherLoading,

            /****************************************************************************/
            /*!
             * @brief   Handles selection of this tile outside dashboard editing mode.
             */
            /****************************************************************************/
            onSelect: () => {
                if (!configureDashboardMode) openWeather();
            }
        });
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
        const automation = automations.find(automation => automation.id === tile.automation_id);

        if (!automation) {
            console.warn("Automation for dashboard tile not found:", tile.id);

            return null;
        }

        let tileObject;
        tileObject = new AutomationTile(document.createElement("div"), {
            id: "automation" + tile.id,
            title: automation.name,
            subtitle1: TEXT_READY_TO_RUN,
            icons: [{ icon: "fa-duotone fa-solid fa-bolt" }],
            tile: tile,
            tapToRun: true,

            /****************************************************************************/
            /*!
             * @brief   Runs the selection action associated with this tile.
             * @param   event                   Event reported by the bound control.
             * @returns Calculated value or configured element.
             */
            /****************************************************************************/
            onclickFunction: event => runDashboardAutomation(event, automation.id, tileObject)
        });

        return tileObject;
    }

    return null;
}

/****************************************************************************/
/*!
 * @brief   Creates an inert spacer with the configured dashboard dimensions.
 * @param   size                    Configured dashboard tile size.
 * @returns Inert spacer element.
 */
/****************************************************************************/
function createSpacerTile(size = TILE_SIZE_1X1) {
    const spacerElem = document.createElement("div");

    spacerElem.className = getClassFromSize(size) + " tile-spacer";
    spacerElem.setAttribute("aria-hidden", "true");

    return spacerElem;
}

/****************************************************************************/
/*!
 * @brief   Creates the controls and callbacks for a device dashboard tile.
 * @param   tile                    Dashboard tile configuration.
 * @returns Device tile component or no value for unsupported devices.
 */
/****************************************************************************/
function generateDeviceTile(tile) {
    const device = byId(devices, tile.device_id);

    if (device?.type === DEVICE_TYPE_LEDSTRIP) {
        const onclickFunction = event => visitPage(event, "control_leds?id=" + device.id);
        const powerFunction = () => updateControl(tile, "power");
        const rangeFunction = () => updateControl(tile, "brightness");

        return new LedstripTile(document.createElement("div"), {
            id: "device" + device.id,
            title: device.name,
            tile: tile,
            checkboxValue: device.power,
            rangeValue: device.brightness,
            icon: { icon: device.icon },
            onclickFunction: onclickFunction,
            powerFunction: powerFunction,
            rangeOnchangeFunction: rangeFunction
        });
    }

    if (device?.type === DEVICE_TYPE_RF_DEVICE) {
        let icon = { icon: device.icon };
        if (!hubRfReceiverAvailable) {
            icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation",
                title: TEXT_NO_RF_HUB_AVAILABLE
            };
        }
        
        const onclickFunction = event => visitPage(event, "control_rf_devices");

        return new RfDeviceTile(document.createElement("div"), {
            id: "device" + device.id,
            title: device.name,
            tile: tile,
            icon: icon,
            onclickFunction: onclickFunction
        });
    }
}

/****************************************************************************/
/*!
 * @brief   Creates the controls and callbacks for a group dashboard tile.
 * @param   tile                    Dashboard tile configuration.
 * @returns Group tile component or no value for unsupported groups.
 */
/****************************************************************************/
function generateGroupTile(tile) {
    const group = byId(groups, tile.group_id);

    if (group?.type === DEVICE_TYPE_LEDSTRIP) {
        const onclickFunction = event => visitPage(event, "control_ledstrip_group?id=" + group.id);
        const powerFunction = () => updateControl(tile, "power");
        const rangeFunction = () => updateControl(tile, "brightness");

        return new LedstripTile(document.createElement("div"), {
            id: "group" + group.id,
            title: group.name,
            tile: tile,
            checkboxValue: group.power,
            rangeValue: group.brightness,
            icon: { icon: group.icon },
            onclickFunction: onclickFunction,
            powerFunction: powerFunction,
            rangeOnchangeFunction: rangeFunction,
            rangeOninputFunction: rangeFunction
        });
    }

    if (group?.type === DEVICE_TYPE_RF_DEVICE) {
        let icon = { icon: group.icon };
        if (!hubRfReceiverAvailable) {
            icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation",
                title: TEXT_NO_RF_HUB_AVAILABLE
            };
        }

        const onclickFunction = event => visitPage(event, "control_rf_devices");

        return new RfDeviceTile(document.createElement("div"), {
            id: "group" + group.id,
            title: group.name,
            tile: tile,
            icon: icon,
            onclickFunction: onclickFunction
        });
    }

    if (tile.size === TILE_SIZE_4X4) {
        console.warn("4x4 group tiles are not supported yet.");

        return;
    }
}

/****************************************************************************/
/*!
 * @brief   Creates the alarm tile with its current status and power action.
 * @param   tile                    Dashboard tile configuration.
 * @returns Configured alarm tile component.
 */
/****************************************************************************/
function generateAlarmTile(tile) {
    let icon;
    let subtitle;
    if (alarm.armed) {
        icon = { icon: "fa-duotone fa-solid fa-shield-check fa-lg" };
        subtitle = TEXT_ARMED;
    } else {
        icon = { icon: "fa-duotone fa-solid fa-shield-slash fa-lg" };
        subtitle = TEXT_DISARMED;
    }

    return new AlarmTile(document.createElement("div"), {
        title: TEXT_ALARM,
        tile: tile,
        icon: icon,
        subtitle1: subtitle,
        subtitle2: alarm.automatically_armed ? TEXT_AUTO_ARM_ENABLED : TEXT_AUTO_ARM_DISABLED,
        onclickFunction: event => visitPage(event, "alarm"),
        powerFunction: () => toggleAlarmArmed()
    });
}

/****************************************************************************/
/*!
 * @brief   Applies language pack labels to the page controls.
 */
/****************************************************************************/
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

/****************************************************************************/
/*!
 * @brief   Returns the dashboard sizes supported by a tile target.
 * @param   tile                    Dashboard tile configuration.
 * @returns The dashboard sizes supported by a tile target.
 */
/****************************************************************************/
function getCompatibleTileSizes(tile) {
    if (tile.type == TILE_TYPE_DEVICE) {
        let device = byId(devices, tile.device_id);
        if (device?.type == DEVICE_TYPE_LEDSTRIP) {
            return [TILE_SIZES[0], TILE_SIZES[1], TILE_SIZES[2]];
        } else if (device?.type == DEVICE_TYPE_RF_DEVICE) {
            return [TILE_SIZES[0], TILE_SIZES[1]];
        } else {
            return TILE_SIZES;
        }
    }

    if (tile.type == TILE_TYPE_GROUP) {
        let group = byId(groups, tile.group_id);
        if (group?.type == DEVICE_TYPE_LEDSTRIP) {
            return [TILE_SIZES[0], TILE_SIZES[1], TILE_SIZES[2]];
        } else if (group?.type == DEVICE_TYPE_RF_DEVICE) {
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

    return [];
}

/****************************************************************************/
/*!
 * @brief   Refreshes a device tile and its connection warnings.
 * @param   tile                    Dashboard tile configuration.
 * @param   showErrorMessages       Whether to display device connection warnings.
 */
/****************************************************************************/
function updateDeviceTileStates(tile, showErrorMessages = false) {
    let device = byId(devices, tile.device_id);
    const tileObject = dashboardTileObjects.find(dashboardTileObject => dashboardTileObject.tile?.id === tile.id);

    if (!tileObject || !device) return;

    if (device?.type == DEVICE_TYPE_LEDSTRIP) {
        tileObject.setCheckboxValue(device.power);

        if (tileObject.hasRangeInput) {
            tileObject.setRangeValue(device.brightness);
        }

        if (device.number_of_leds == 0) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation fa-xl",
                title: TEXT_LED_ADDRESSING_NOT_CONFIGURED
            };
            tileObject.setIcon(icon);

            if (showErrorMessages) {
                showAddressingWarning(device);
            }

            return;
        }

        if (!device.connection_status) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation fa-xl",
                title: TEXT_NOT_CONNECTED
            };
            tileObject.setIcon(icon);

            return;
        }

        const icon = {};

        if (device.power) {
            icon.icon = device.icon;
        } else {
            icon.icon = device.icon_low_state;
        }

        tileObject.setIcon(icon);

        return;
    }

    if (device?.type == DEVICE_TYPE_RF_DEVICE) {
        if (!hubRfReceiverAvailable) {
            const icon = {
                icon: "fa-duotone fa-solid fa-circle-exclamation",
                title: TEXT_NO_RF_HUB_AVAILABLE
            };
            tileObject.setIcon(icon);

            return;
        }

        const icon = {};

        if (device.state) {
            icon.icon = device.icon;
        } else {
            icon.icon = device.icon_low_state;
        }

        tileObject.setIcon(icon);

        return;
    }

    /* Devices without power switches */
}

/****************************************************************************/
/*!
 * @brief   Refreshes an alarm tile from the current alarm state.
 * @param   tile                    Dashboard tile configuration.
 */
/****************************************************************************/
function updateAlarmTileStates(tile) {
    let icon;
    let subtitle;

    if (alarm.armed) {
        icon = { icon: "fa-duotone fa-solid fa-shield-check fa-lg" };
        subtitle = TEXT_ARMED;
    } else {
        icon = { icon: "fa-duotone fa-solid fa-shield-slash fa-lg" };
        subtitle = TEXT_DISARMED;
    }

    const tileObject = dashboardTileObjects.find(dashboardTileObject => dashboardTileObject.tile?.id === tile.id);

    tileObject.setIcon(icon);
    tileObject.setSubtitle1(subtitle);
    tileObject.setCheckboxValue(alarm.armed);
}

/****************************************************************************/
/*!
 * @brief   Adds a configuration link for a strip without LED addressing.
 * @param   device                  Registered device configuration.
 */
/****************************************************************************/
function showAddressingWarning(device) {
    const key = String(device.id);
    if ([...dashboardGridElem.parentElement.querySelectorAll("[data-addressing]")].some(link => link.dataset.addressing === key)) {
        return;
    }

    const link = document.createElement("a");
    link.href = "/configure_led_addressing?id=" + device.id;
    link.className = "message warning";
    link.dataset.addressing = key;
    link.textContent = VAR_TEXT_LED_ADDRESSING_NOT_CONFIGURED_CLICK_TO_CONFIGURE(device.name);
    dashboardGridElem.before(link);
}

/****************************************************************************/
/*!
 * @brief   Opens a tile target when dashboard editing and inner controls allow it.
 * @param   event                   Event reported by the bound control.
 * @param   url                     Controller endpoint URL.
 */
/****************************************************************************/
function visitPage(event, url) {
    if (!configureDashboardMode
        && !event.target.closest("input,label,button")) location.assign(url);
}

/****************************************************************************/
/*!
 * @brief   Sends a device or group tile control change to the controller.
 * @param   tile                    Dashboard tile configuration.
 * @param   field                   Control field being updated.
 */
/****************************************************************************/
async function updateControl(tile, field) {
    const group = tile.type === TILE_TYPE_GROUP;
    const item = group ? byId(groups, tile.group_id) : byId(devices, tile.device_id);
    if (!item) return;

    const component = dashboardTileObjects.find(view => view.tile?.id === tile.id);
    const value = field === "power" ? !item.power : component.getRangeValue();

    pausedUntil = Date.now() + 2000;

    try {
        if (field === "power")
            await api.setPower(item.id, value, group);
        else await api.setBrightness(item.id, value, group);
        item[field] = value;
        if (group) for (const device of devices.filter(device =>
            item.device_ids.includes(device.id))) device[field] = value;
    } catch (error) {
        report(error);
    }

    updateTileStates();
}

/****************************************************************************/
/*!
 * @brief   Updates the alarm armed state and refreshes the affected tiles.
 */
/****************************************************************************/
async function toggleAlarmArmed() {
    const armed = !alarm.armed;

    try {
        await api.arm(armed);
        alarm.armed = armed;
    } catch (error) {
        report(error);
    }

    updateTileStates();
}

/****************************************************************************/
/*!
 * @brief   Refreshes dashboard tile values from the latest controller state.
 * @param   showErrors              Whether to display connection warnings.
 */
/****************************************************************************/
function updateTileStates(showErrors = false) {
    for (const tile of selected()?.tiles ?? []) {
        if (tile.type === TILE_TYPE_DEVICE)
            updateDeviceTileStates(tile, showErrors);
        else if (tile.type === TILE_TYPE_ALARM)
            updateAlarmTileStates(tile);
        else if (tile.type === TILE_TYPE_GROUP) {
            const group = byId(groups, tile.group_id);
            const view = dashboardTileObjects.find(view => view.tile?.id === tile.id);
            if (!view || group?.type !== DEVICE_TYPE_LEDSTRIP) continue;

            const members = devices.filter(device => group.device_ids.includes(device.id));
            for (const field of ["power", "brightness"]) {
                if (members.length
                    && members.every(member =>
                        member[field] === members[0][field])) group[field] = members[0][field];
            }

            view.setCheckboxValue(group.power);
            view.setRangeValue(group.brightness);
            view.setIcon({ icon: group.icon });
        }
    }
}

/****************************************************************************/
/*!
 * @brief   Polls the controller and refreshes the dashboard while the page is active.
 */
/****************************************************************************/
async function fetchStates() {
    const started = Date.now();
    if (started >= pausedUntil) {
        try {
            const result = await api.devices();
            if (started >= pausedUntil) {
                devices = result;
                updateTileStates();
            }
            if (reconnectBanner) banners.close(reconnectBanner);
            reconnectBanner = undefined;
        } catch (error) {
            if (!signal.aborted && !reconnectBanner) reconnectBanner = banners.show({
                message: TEXT_DISCONNECTED_CONNECTING,
                timeout: 0
            });
        }
    }
    if (!signal.aborted) delay(fetchStates, 1000);
}

/****************************************************************************/
/*!
 * @brief   Runs an automation and displays its transient tile status.
 * @param   event                   Event reported by the bound control.
 * @param   id                      Identifier of the affected item.
 * @param   view                    Mounted automation tile component.
 */
/****************************************************************************/
async function runDashboardAutomation(event, id, view) {
    if (configureDashboardMode || view.isRunning) return;

    event.stopPropagation();
    view.setRunState("running");

    try {
        await api.run(id);
        notify(byId(automations, id).name);
        view.setRunState("success");
    } catch (error) {
        report(error);
        view.setRunState("error");
    }

    /****************************************************************************/
    /*!
     * @brief   Restores a mounted automation tile to its idle display after execution.
     */
    /****************************************************************************/
    delay(() => {
        if (view.mounted && !view.isRunning) view.setRunState("idle");
    }, 2500);
}

/****************************************************************************/
/*!
 * @brief   Saves a dashboard name and icon and reloads its configuration.
 * @param   id                      Identifier of the affected item.
 * @param   name                    Visible name or element identifier.
 * @param   icon                    Icon class or icon name.
 */
/****************************************************************************/
async function saveDashboard(id, name, icon) {
    const result = await api.save(id, name, icon);
    dashboardConfigurations = result.dashboard_configurations;
    configureDashboardMode = id === -1;
    notify(id === -1 ? TEXT_ITEM_ADDED_SUCCESSFULLY : TEXT_CHANGES_SAVED_SUCCESSFULLY);
    loadDashboardConfiguration(id === -1 ? result.id : id);
}

/****************************************************************************/
/*!
 * @brief   Confirms dashboard deletion and selects a remaining dashboard.
 * @param   id                      Identifier of the affected item.
 * @returns Whether the operation or validation condition succeeds.
 */
/****************************************************************************/
async function deleteDashboardConfiguration(id) {
    const manager = editors.dialog.open ? editorPopup : popup;
    if (!(await manager.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: TEXT_Q_DELETE_DASHBOARD,
        confirmLabel: TEXT_DELETE,
        cancelLabel: TEXT_CANCEL
    }))) return false;

    try {
        await api.remove(id);
        dashboardConfigurations = dashboardConfigurations.filter(item => item.id !== id);
        selectedDashboardId = dashboardConfigurations[0]?.id;
        configureDashboardMode = false;
        notify(TEXT_ITEM_DELETED_SUCCESSFULLY);
        loadDashboardConfiguration();

        return true;
    } catch (error) {
        report(error);

        return false;
    }
}

/****************************************************************************/
/*!
 * @brief   Resets the selected dashboard layout and reloads it.
 */
/****************************************************************************/
async function resetDashboardConfiguration() {
    try {
        const result = await api.reset(selectedDashboardId);
        dashboardConfigurations = result.dashboard_configurations;
        loadDashboardConfiguration();
    } catch (error) {
        report(error);
    }
}

/****************************************************************************/
/*!
 * @brief   Returns the available targets for the requested dashboard tile type.
 * @param   type                    Target, action or tile type.
 * @returns The available targets for the requested dashboard tile type.
 */
/****************************************************************************/
function getTargets(type) {
    const definition = targetDefinition(type);
    if (!definition) return null;

    const [items, key] = definition;

    return items.filter(item => !selected()?.tiles.some(tile => tile[key] === item.id));
}

/****************************************************************************/
/*!
 * @brief   Returns the configuration collection for a dashboard tile type.
 * @param   type                    Target, action or tile type.
 * @returns The configuration collection for a dashboard tile type.
 */
/****************************************************************************/
function targetDefinition(type) {
    if (type === TILE_TYPE_DEVICE) return [devices, "device_id"];
    if (type === TILE_TYPE_GROUP) return [groups, "group_id"];
    if (type === TILE_TYPE_AUTOMATION) return [automations, "automation_id"];
}

/****************************************************************************/
/*!
 * @brief   Creates selectable previews for the supported sizes of a tile.
 * @param   type                    Target, action or tile type.
 * @param   id                      Identifier of the affected item.
 * @returns Tile components for the supported preview sizes.
 */
/****************************************************************************/
function createPreviews(type, id) {
    const definition = targetDefinition(type);
    const item = definition && byId(definition[0], id);
    if (definition && !item) return [];

    let TileClass,
        sizes,
        props = {};
    if (type === TILE_TYPE_DATETIME) {
        TileClass = DateTimeTile;
        sizes = [TILE_SIZE_1X2, TILE_SIZE_2X4, TILE_SIZE_2X2];
    } else if (type === TILE_TYPE_WEATHER) {
        TileClass = WeatherTile;
        sizes = [TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_4X4];
        props = { weather, loading: weatherLoading };
    } else if (type === TILE_TYPE_ALARM) {
        TileClass = AlarmTile;
        sizes = [TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_4X4];
        props = {
            title: TEXT_ALARM,
            icon: { icon: "fa-duotone fa-solid fa-shield-halved" },
            subtitle1: TEXT_AUTO_ARM_ENABLED
        };
    } else if (type === TILE_TYPE_AUTOMATION) {
        TileClass = AutomationTile;
        sizes = [TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2];
        props = {
            title: item.name,
            subtitle1: TEXT_READY_TO_RUN,
            icons: [{ icon: "fa-duotone fa-solid fa-bolt" }],
            tapToRun: true
        };
    } else if (item && [DEVICE_TYPE_LEDSTRIP, DEVICE_TYPE_RF_DEVICE].includes(item.type)) {
        TileClass = item.type === DEVICE_TYPE_LEDSTRIP ? LedstripTile : RfDeviceTile;
        sizes = item.type === DEVICE_TYPE_LEDSTRIP
            ? [TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2]
            : [TILE_SIZE_1X1, TILE_SIZE_1X2];
        props = { title: item.name, icon: { icon: item.icon + " fa-xl" } };
    } else return [];

    /****************************************************************************/
    /*!
     * @brief   Creates a selectable tile preview with a supported size.
     * @param   size                    Configured dashboard tile size.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    return sizes.map(size => {
        const choose = () => addTile(type, id, size);

        return new TileClass(document.createElement("div"), {
            ...props,
            size,
            previewTile: true,
            onclickFunction: choose,
            onSelect: choose
        });
    });
}

/****************************************************************************/
/*!
 * @brief   Adds a tile to the selected dashboard.
 * @param   type                    Target, action or tile type.
 * @param   id                      Identifier of the affected item.
 * @param   size                    Configured dashboard tile size.
 */
/****************************************************************************/
async function addTile(type, id, size) {
    const dashboard = selected();
    const point = dashboardGridObject.findAvailablePosition(size);
    const tile = {
        configuration_id: dashboard.id,
        type,
        size,
        position_x: point.x,
        position_y: point.y
    };
    const definition = targetDefinition(type);
    if (definition) tile[definition[1]] = id;

    try {
        const result = await api.addTile(tile);
        dashboard.tiles.push({ ...tile, id: result.id });
        editors.close(editors.tiles);
        loadDashboardConfiguration();
    } catch (error) {
        report(error);
    }
}

/****************************************************************************/
/*!
 * @brief   Toggles dashboard editing and rebuilds the displayed tiles.
 */
/****************************************************************************/
function toggleConfigurationMode() {
    configureDashboardMode = !configureDashboardMode;
    loadDashboardConfiguration();
}

/****************************************************************************/
/*!
 * @brief   Opens dashboard tile actions or the compatible tile size choices.
 * @param   id                      Identifier of the affected item.
 * @param   x                       Horizontal canvas or menu position.
 * @param   y                       Vertical canvas or menu position.
 * @param   sizes                   Whether to show compatible tile sizes.
 */
/****************************************************************************/
function openMenu(id, x, y, sizes = false) {
    menuTile = selected()?.tiles.find(tile => String(tile.id) === String(id));
    menuPoint = { x, y };

    const items = sizes
        ? getCompatibleTileSizes(menuTile).filter(item =>
            item.size !== menuTile.size).map(item => ({
        label: item.description,
        icon: item.icon,
        action: "size-" + item.size
    })) : [...(menuTile ? [{
        label: TEXT_CHANGE_TILE_SIZE,
        icon: "fa-solid fa-file",
        action: "sizes"
    }, { label: TEXT_DELETE_TILE, icon: "fa-solid fa-trash", action: "remove" }] : []), {
        label: TEXT_ADD_TILE,
        action: "add",
        icon: "fa-duotone fa-solid fa-plus"
    }, {
        label: TEXT_EDIT_DASHBOARD,
        action: "edit",
        icon: "fa-duotone fa-solid fa-pen-to-square"
    }, {
        label: TEXT_RESET_DASHBOARD,
        action: "reset",
        icon: "fa-duotone fa-solid fa-arrows-rotate-reverse"
    }];
    contextMenu.update({ items });
    contextMenu.show(x, y);
}

/****************************************************************************/
/*!
 * @brief   Routes dashboard context menu actions to their page operations.
 * @param   action                  Action type or visible action label.
 */
/****************************************************************************/
contextMenu.root.addEventListener("ui:action", async ({ detail: { action } }) => {
    if (action === "sizes") {
        delay(() => openMenu(menuTile.id, menuPoint.x, menuPoint.y, true), 0);
        return;
    }

    if (action === "add") {
        editors.add();
        return;
    }

    if (action === "edit") {
        toggleConfigurationMode();
        return;
    }

    if (action === "reset") {
        await resetDashboardConfiguration();
        return;
    }

    const tile = menuTile;

    try {
        if (action === "remove") {
            if (!(await popup.confirm({
                title: TEXT_Q_ARE_YOU_SURE,
                message: TEXT_Q_DELETE_TILE,
                confirmLabel: TEXT_DELETE,
                cancelLabel: TEXT_CANCEL
            }))) return;

            await api.removeTile(tile.id);
            selected().tiles = selected().tiles.filter(item => item.id !== tile.id);
            notify(TEXT_ITEM_DELETED_SUCCESSFULLY);
        } else {
            const size = Number(action.slice(5));
            const point = dashboardGridObject.findAvailablePosition(size, tile.id);
            const fields = { id: tile.id, size, position_x: point.x, position_y: point.y };

            await api.moveTile(fields);
            Object.assign(tile, fields);
        }
        loadDashboardConfiguration();
    } catch (error) {
        report(error);
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Opens tile actions at the context menu pointer position.
 * @param   event                   Event reported by the bound control.
 */
/****************************************************************************/
dashboardGridElem.addEventListener("contextmenu", event => {
    event.preventDefault();
    openMenu(
        event.target.closest("[tile-id]")?.getAttribute("tile-id"), event.clientX, event.clientY
    );
}, { signal });

/****************************************************************************/
/*!
 * @brief   Waits for focus scrolling before anchoring the tile action menu.
 * @param   detail                  Data reported by the component event.
 * @param   target                  Element that reported the component event.
 */
/****************************************************************************/
dashboardGridElem.addEventListener("ui:tile-menu", ({ detail, target }) => {
    menuAnimation.cancelFrames();                                           // Opening a focused button can queue a viewport scroll. Anchor after that scroll settles.

    /****************************************************************************/
    /*!
     * @brief   Anchors the tile menu to its button after the layout settles.
     */
    /****************************************************************************/
    menuAnimation.nextFrame(() => menuAnimation.nextFrame(() => {
        if (!target.isConnected) return;

        const anchor = target.getBoundingClientRect();
        openMenu(detail.tileId, anchor.right, anchor.bottom);
    }));
}, { signal });

/****************************************************************************/
/*!
 * @brief   Handles dashboard selection and editing actions from the sidebar.
 * @param   action                  Action type or visible action label.
 */
/****************************************************************************/
navigation.root.addEventListener("ui:action", ({ detail: { action } }) => {
    if (action === "add")
        editors.edit();
    else if (action === "edit")
        toggleConfigurationMode();
    else if (action.startsWith("select-")) {
        configureDashboardMode = false;
        loadDashboardConfiguration(Number(action.slice(7)));
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Loads the current location into the weather dialog and opens it.
 */
/****************************************************************************/
function openWeather() {
    weatherError.style.display = "none";
    weatherInput.classList.remove("invalid-input");
    weatherInput.value = weatherLocation ?? "";
    weatherStack.open(weatherDialog, {
        onRequestClose: () => weatherStack.close(weatherDialog)
    });
}

/****************************************************************************/
/*!
 * @brief   Saves the weather location and refreshes the weather tiles.
 */
/****************************************************************************/
async function updateWeatherLocation() {
    if (!weatherInput.value) {
        weatherError.textContent = TEXT_FIELD_REQUIRED;
        weatherError.style.display = "block";
        weatherInput.classList.add("invalid-input");
        weatherInput.focus();
        return;
    }

    try {
        const result = await api.setLocation(weatherInput.value);
        weatherLocation = result.weather_location;
        notify(VAR_TEXT_WEATHER_LOCATION_CHANGED_SUCCESSFULLY(weatherLocation));
        weatherStack.close(weatherDialog);
        weatherLoading = true;
        loadDashboardConfiguration();
        delay(refreshWeather, 1000);
    } catch (error) {
        weatherError.textContent = error.message;
        weatherError.style.display = "block";
    }
}

/****************************************************************************/
/*!
 * @brief   Fetches the weather report and updates affected dashboard tiles.
 */
/****************************************************************************/
async function refreshWeather() {
    try {
        const result = await api.weather();
        weather = result.message.weather;
        weatherLoading = false;
        loadDashboardConfiguration();
    } catch (error) {
        if (!signal.aborted) delay(refreshWeather, 1000);
    }
}

weatherDialog.querySelector(".close-modal-button").addEventListener("click", () => weatherStack.close(weatherDialog), { signal });
document.querySelector('[data-action="updateWeatherLocation"]').addEventListener("click", () => updateWeatherLocation(), { signal });
document.querySelector('[data-action="loadAddTileModal"]').addEventListener("click", () => editors.add(), { signal });
document.querySelector('[data-action="loadDashboardConfigurationModal"]').addEventListener("click", () => editors.edit(selected()), { signal });
document.querySelector('#addDashboardBtn').addEventListener("click", () => editors.edit(), { signal });
document.querySelector('[data-action="resetDashboardConfiguration"]').addEventListener("click", () => resetDashboardConfiguration(), { signal });
document.querySelector('[data-action="deleteDashboardConfiguration"]').addEventListener("click", () => deleteDashboardConfiguration(selectedDashboardId), { signal });
document.querySelector('#createFirstDashboardBtn').addEventListener("click", () => editors.edit(), { signal });
loadText();
loadDashboardConfiguration();
fetchStates();
