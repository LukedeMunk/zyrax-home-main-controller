/****************************************************************************/
/*
 * File:    devices_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for devices.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_ADD_LOCATION, API_URL_UPDATE_LOCATION, API_URL_DELETE_LOCATION,
    API_URL_LOCATIONS, API_URL_ADD_GROUP, API_URL_UPDATE_GROUP, API_URL_DELETE_GROUP,
    API_URL_ADD_DEVICE, API_URL_CANCEL_HUB_LEARNING_SESSION, API_URL_DELETE_CUSTOM_CODE,
    API_URL_DELETE_DEVICE, API_URL_GET_DEVICES, API_URL_GET_HUB_LEARNING_STATUS,
    API_URL_GET_HUB_STATUS, API_URL_GET_UNCONFIGURED_DEVICES, API_URL_RENAME_CUSTOM_CODE,
    API_URL_SAVE_HUB_LEARNING_RESULT, API_URL_START_HUB_LEARNING_SESSION, API_URL_TRANSMIT_CODE,
    API_URL_UPDATE_DEVICE
} from "../domain/endpoints.js";
import { button } from "../../vendor/templates/js/core/dom.js";
import {
    TEXT_CATALOG_LOCATIONS, TEXT_CATALOG_ADD_LOCATION, TEXT_CATALOG_EDIT_LOCATION,
    TEXT_CATALOG_NO_LOCATIONS, TEXT_CATALOG_NO_ROOM, TEXT_CATALOG_GROUPS, TEXT_CATALOG_ADD_GROUP, TEXT_CATALOG_EDIT_GROUP, TEXT_CATALOG_NO_GROUPS,
    TEXT_HUB_CAPTURED, TEXT_HUB_CODE_NAME, TEXT_HUB_LEARN, TEXT_HUB_MISSING,
    TEXT_HUB_PENDING, TEXT_HUB_RECEIVE, TEXT_HUB_RENAME, TEXT_HUB_RETRY,
    TEXT_HUB_SENT, TEXT_HUB_START, TEXT_HUB_STORED, TEXT_HUB_TRANSMIT,
    TEXT_CATALOG_ADDED_SUFFIX, TEXT_CATALOG_ADD_ANOTHER, TEXT_CATALOG_ADD_CATEGORY,
    TEXT_CATALOG_ADD_DEVICE, TEXT_CATALOG_ALL, TEXT_CATALOG_ALL_CONNECTIONS, TEXT_CATALOG_ALL_ROOMS,
    TEXT_CATALOG_BACK, TEXT_CATALOG_BACK_TO_OVERVIEW, TEXT_CATALOG_BATTERY,
    TEXT_CATALOG_BLUETOOTH_DISCOVERY_UNAVAILABLE, TEXT_CATALOG_HUB, TEXT_CATALOG_HUBS,
    TEXT_CATALOG_HUB_SUBTITLE, TEXT_CATALOG_BUTTON, TEXT_CATALOG_CAMERA, TEXT_CATALOG_CANCEL,
    TEXT_CATALOG_CAPABILITIES_AND_ENTITIES, TEXT_CATALOG_CATEGORIES,
    TEXT_CATALOG_CHOOSE_DEVICE_CONNECTION, TEXT_CATALOG_CHOOSE_DEVICE_LOCATION,
    TEXT_CATALOG_CHOOSE_MODEL, TEXT_CATALOG_CLOSE,
    TEXT_CATALOG_COLOR, TEXT_CATALOG_CONFIRM_DELETE, TEXT_CATALOG_CONNECTED_DEVICES,
    TEXT_CATALOG_CONNECTING, TEXT_CATALOG_CONNECTION, TEXT_CATALOG_CONTACT, TEXT_CATALOG_CONTROLLER,
    TEXT_CATALOG_DELETE, TEXT_CATALOG_DEVICES, TEXT_CATALOG_DEVICE_ADDED,
    TEXT_CATALOG_DEVICE_LOAD_FAILED, TEXT_CATALOG_DEVICE_MANAGEMENT, TEXT_CATALOG_DEVICE_SETTINGS,
    TEXT_CATALOG_DIRECT_VIA_CONTROLLER, TEXT_CATALOG_DISCOVERY_METHODS, TEXT_CATALOG_DOORBELL,
    TEXT_CATALOG_EFFECTS, TEXT_CATALOG_EMPTY_VALUE,
    TEXT_CATALOG_FILTER_BY_CONNECTION, TEXT_CATALOG_FILTER_BY_ROOM, TEXT_CATALOG_HAS_CONTACT_SENSOR,
    TEXT_CATALOG_HOME_SUBTITLE, TEXT_CATALOG_HOSTNAME,
    TEXT_CATALOG_LED_COUNT, TEXT_CATALOG_LIGHTING, TEXT_CATALOG_MOTION, TEXT_CATALOG_MY_HOME,
    TEXT_CATALOG_NAME, TEXT_CATALOG_NEXT, TEXT_CATALOG_NEXT_ARROW, TEXT_CATALOG_NOT_IMPLEMENTED,
    TEXT_CATALOG_NO_CONNECTED_DEVICES, TEXT_CATALOG_NO_DEVICES_FOUND,
    TEXT_CATALOG_NO_DOORBELL_MODELS, TEXT_CATALOG_NO_LAN_DEVICES_FOUND,
    TEXT_CATALOG_OFF, TEXT_CATALOG_OFFLINE, TEXT_CATALOG_ON,
    TEXT_CATALOG_ONLINE, TEXT_CATALOG_OR_CHOOSE_DEVICE, TEXT_CATALOG_OTHER, TEXT_CATALOG_PAIR,
    TEXT_CATALOG_POWER, TEXT_CATALOG_POWER_OUTLET, TEXT_CATALOG_READY_TO_USE,
    TEXT_CATALOG_REGISTERED, TEXT_CATALOG_REMOTE_CONTROL,
    TEXT_CATALOG_ROOM, TEXT_CATALOG_ROOMS, TEXT_CATALOG_SAVE, TEXT_CATALOG_SAVED,
    TEXT_CATALOG_SAVING, TEXT_CATALOG_SEARCH_BY_NAME_OR_ROOM, TEXT_CATALOG_SEARCH_DEVICES,
    TEXT_CATALOG_SEARCH_NEARBY_DEVICES, TEXT_CATALOG_SENSOR,
    TEXT_CATALOG_SEPARATOR, TEXT_CATALOG_SHOW_DISCOVERED_LAN_DEVICES, TEXT_CATALOG_STEP_1_OF_3,
    TEXT_CATALOG_STEP_2_OF_3, TEXT_CATALOG_STEP_3_OF_3, TEXT_CATALOG_SWITCH,
    TEXT_CATALOG_TURN_ON_DEVICE_TO_BEGIN, TEXT_CATALOG_UNREACHABLE, TEXT_CATALOG_VIA,
    TEXT_CATALOG_WHAT_TO_ADD, TEXT_ICON
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { catalogService } from "../services/catalog.js";
import {
    catalogElement, catalogButton, catalogIcon, catalogCard, catalogField, decorateCatalogChoice
} from "../ui_components/catalog_view.js";
import { BannerManager } from "../../vendor/templates/js/ui_components/index.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import {
    createDefaultFieldRegistry
} from "../../vendor/templates/js/ui_components/form/basic-fields.js";
import {
    TEXT_CONFIGURE_LED_ADDRESSING, TEXT_PAIR_AND_CONFIGURE_ADDRESSING
} from "../domain/language_pack_english.js";
import { ConfirmationDialog } from "../ui_components/ConfirmationDialog.js";
import { WizardDialog } from "../ui_components/WizardDialog.js";
import { ICONS_M } from "../domain/icons.js";

const { http, signal, components, banners } = mountPage("devices");
const catalogRequest = catalogService(http, signal);
const {
    groups,
    CATALOG_MODELS,
    CATALOG_RF_TYPE,
    CATALOG_IR_TYPE,
    CATALOG_RF_TAP_MODEL,
    CATALOG_LEDSTRIP_TYPE
} = readPageData();
const DEVICE_CATEGORY_SWITCH = 3;
const DEVICE_CATEGORY_POWER_OUTLET = 5;
const MAX_NUMBER_OF_LEDS = 250;
const catalogDevicesBtnElem = document.getElementById("catalogDevicesBtn");
const catalogHubsBtnElem = document.getElementById("catalogHubsBtn");
const catalogLocationsBtnElem = document.getElementById("catalogLocationsBtn");
const addCatalogLocationBtnElem = document.getElementById("addCatalogLocationBtn");
const catalogGroupsBtnElem = document.getElementById("catalogGroupsBtn");
const addCatalogGroupBtnElem = document.getElementById("addCatalogGroupBtn");
const catalogTitleElem = document.getElementById("catalogTitle");
const catalogSubtitleFieldElem = document.getElementById("catalogSubtitleField");
const catalogCountTitleElem = document.getElementById("catalogCountTitle");
const catalogCountFieldElem = document.getElementById("catalogCountField");
const catalogRoomsFieldElem = document.getElementById("catalogRoomsField");
const catalogStatusFieldElem = document.getElementById("catalogStatusField");
const catalogHostFieldElem = document.getElementById("catalogHostField");
const catalogCategoriesContainerElem = document.getElementById("catalogCategoriesContainer");
const catalogSearchTxtElem = document.getElementById("catalogSearchTxt");
const catalogRoomSelectElem = document.getElementById("catalogRoomSelect");
const catalogConnectionSelectElem = document.getElementById("catalogConnectionSelect");
const catalogCardsContainerElem = document.getElementById("catalogCardsContainer");
const catalogWizardDialogElem = document.getElementById("catalogWizardDialog");
const addCatalogDeviceBtnElem = document.getElementById("addCatalogDeviceBtn");
const deviceCatalogFieldElem = document.getElementById("deviceCatalogField");

const CATALOG_GROUPS = [[TEXT_CATALOG_LIGHTING, "fa-solid fa-lightbulb", [0]], [
    TEXT_CATALOG_SENSOR, "fa-solid fa-tower-broadcast", [1, 2]
], [TEXT_CATALOG_SWITCH, "fa-solid fa-toggle-on", [3]], [
    TEXT_CATALOG_REMOTE_CONTROL, "fa-solid fa-remote", [4]
], [TEXT_CATALOG_POWER_OUTLET, "fa-solid fa-plug", [5]]];
const CATALOG_MODELS_BY_ID = new Map(CATALOG_MODELS.map(model => [model.model_id, model]));
const CATALOG_CAPABILITIES = {
    "power.set": TEXT_CATALOG_POWER,
    "color.set": TEXT_CATALOG_COLOR,
    "mode.set": TEXT_CATALOG_EFFECTS,
    contact: TEXT_CATALOG_CONTACT,
    motion: TEXT_CATALOG_MOTION,
    switch: TEXT_CATALOG_SWITCH,
    button: TEXT_CATALOG_BUTTON,
    battery: TEXT_CATALOG_BATTERY,
    camera: TEXT_CATALOG_CAMERA
};
const stack = new ModalStack();
const fields = createDefaultFieldRegistry();
const catalogWizard = new WizardDialog(catalogWizardDialogElem, { stack }).mount();

const deviceConfirmation = new ConfirmationDialog();
components.push(stack, catalogWizard, deviceConfirmation);

const picker = document.getElementById("catalogIconPicker");
const grid = picker.querySelector(".icon-grid");

/****************************************************************************/
/*!
 * @brief   Binds the icon picker dismissal buttons to their modal stack.
 * @param   button                  Button receiving a dismissal handler.
 */
/****************************************************************************/
picker.querySelectorAll("[data-dismiss]").forEach(button => {
    button.addEventListener("click", () => stack.close(picker), { signal });
});

let catalogLocations = [];
let catalogGroups = groups;
let catalogDevices = [];
let catalogView = "devices";
let catalogCategory = "";
let isCatalogOnline = false;

catalogDevicesBtnElem.onclick = () => showCatalogView("devices");
catalogHubsBtnElem.onclick = () => showCatalogView("hubs");
catalogLocationsBtnElem.onclick = () => showCatalogView("locations");
addCatalogLocationBtnElem.onclick = () => editCatalogLocation();
catalogGroupsBtnElem.onclick = () => showCatalogView("groups");
addCatalogGroupBtnElem.onclick = () => editCatalogGroup();
catalogSearchTxtElem.oninput = renderCatalogCards;
catalogRoomSelectElem.onchange = renderCatalogCards;
catalogConnectionSelectElem.onchange = renderCatalogCards;
addCatalogDeviceBtnElem.onclick = startCatalogWizard;
initializeCatalog();

/****************************************************************************/
/*!
 * @brief   Loads catalog labels, filters, icons and registered devices.
 */
/****************************************************************************/
function initializeCatalog() {
    const labels = {
        TEXT_CATALOG_LOCATIONS,
        TEXT_CATALOG_ADD_LOCATION,
        TEXT_CATALOG_GROUPS,
        TEXT_CATALOG_ADD_GROUP,
        TEXT_CATALOG_DEVICE_MANAGEMENT,
        TEXT_CATALOG_DEVICES,
        TEXT_CATALOG_HUBS,
        TEXT_CATALOG_MY_HOME,
        TEXT_CATALOG_ADD_DEVICE,
        TEXT_CATALOG_ROOMS,
        TEXT_CATALOG_CONTROLLER,
        TEXT_CATALOG_CONNECTING,
        TEXT_CATALOG_CATEGORIES,
        TEXT_CATALOG_SEARCH_DEVICES,
        TEXT_CATALOG_SEARCH_BY_NAME_OR_ROOM,
        TEXT_CATALOG_FILTER_BY_ROOM,
        TEXT_CATALOG_FILTER_BY_CONNECTION,
        TEXT_CATALOG_EMPTY_VALUE
    };

    for (const elem of document.querySelectorAll("[data-catalog-text]")) {
        elem.textContent = labels[elem.dataset.catalogText];
    }

    for (const elem of document.querySelectorAll("[data-catalog-aria-label]")) {
        elem.setAttribute("aria-label", labels[elem.dataset.catalogAriaLabel]);
    }

    for (const elem of document.querySelectorAll("[data-catalog-placeholder]")) {
        elem.placeholder = labels[elem.dataset.catalogPlaceholder];
    }

    catalogHostFieldElem.textContent = window.location.hostname;

    refreshCatalog();
}

/****************************************************************************/
/*!
 * @brief   Loads the live catalog and updates controller status.
 */
/****************************************************************************/
async function refreshCatalog() {
    try {
        [catalogDevices, catalogLocations] = await Promise.all([
            catalogRequest(API_URL_GET_DEVICES), catalogRequest(API_URL_LOCATIONS)
        ]);
        isCatalogOnline = true;

        for (const hub of catalogDevices.filter(item => item.role === "hub")) {
            refreshCatalogHubStatus(hub);
        }
    } catch {
        isCatalogOnline = false;
    }

    renderCatalog();
}

/****************************************************************************/
/*!
 * @brief   Switches between the device and infrastructure views.
 * @param   view                    View to display
 */
/****************************************************************************/
function showCatalogView(view) {
    catalogView = view;
    catalogCategory = "";
    catalogSearchTxtElem.value = "";
    catalogRoomSelectElem.value = "";
    catalogConnectionSelectElem.value = "";
    renderCatalog();
}

/****************************************************************************/
/*!
 * @brief   Updates overview totals and options while retaining valid filters.
 */
/****************************************************************************/
function renderCatalog() {
    const isDeviceView = catalogView === "devices";
    const isGroupView = catalogView === "groups";
    const isLocationView = catalogView === "locations";
    const title = { devices: TEXT_CATALOG_DEVICES, hubs: TEXT_CATALOG_HUBS,
        groups: TEXT_CATALOG_GROUPS, locations: TEXT_CATALOG_LOCATIONS }[catalogView];
    catalogSearchTxtElem.parentElement.hidden = isGroupView || isLocationView;
    catalogLocationsBtnElem.setAttribute("aria-pressed", isLocationView);
    addCatalogLocationBtnElem.disabled = !isCatalogOnline;
    addCatalogGroupBtnElem.disabled = !isCatalogOnline;
    catalogGroupsBtnElem.setAttribute("aria-pressed", isGroupView);
    const devices = catalogDevices.filter(device => device.role === "device" === isDeviceView);

    catalogDevicesBtnElem.setAttribute("aria-pressed", isDeviceView);
    catalogHubsBtnElem.setAttribute("aria-pressed", catalogView === "hubs");
    catalogTitleElem.textContent = title;
    catalogSubtitleFieldElem.textContent = isDeviceView
        ? TEXT_CATALOG_HOME_SUBTITLE
        : TEXT_CATALOG_HUB_SUBTITLE;
    catalogSubtitleFieldElem.hidden = isGroupView || isLocationView;
    catalogCountTitleElem.textContent = title;
    catalogCountFieldElem.textContent = isCatalogOnline ? devices.length : TEXT_CATALOG_EMPTY_VALUE;

    if (isGroupView) catalogCountFieldElem.textContent = catalogGroups.length;

    if (isLocationView) catalogCountFieldElem.textContent = catalogLocations.length;

    const rooms = catalogLocations.map(room => room.name);
    catalogRoomsFieldElem.textContent = isCatalogOnline ? rooms.length : TEXT_CATALOG_EMPTY_VALUE;
    catalogStatusFieldElem.textContent = isCatalogOnline
        ? TEXT_CATALOG_ONLINE
        : TEXT_CATALOG_UNREACHABLE;
    catalogStatusFieldElem.classList.toggle("catalog-online", isCatalogOnline);
    catalogOptions(catalogRoomSelectElem, TEXT_CATALOG_ALL_ROOMS, rooms);
    catalogOptions(
        catalogConnectionSelectElem, TEXT_CATALOG_ALL_CONNECTIONS,
        [...new Set(devices.map(catalogConnection))].sort()
    );

    const categories = isDeviceView
        ? ["", ...new Set([...CATALOG_GROUPS.map(group =>
            group[0]), TEXT_CATALOG_DOORBELL, ...devices.map(catalogDeviceCategory)])]
        : [];

    if (!categories.includes(catalogCategory)) catalogCategory = "";

    /****************************************************************************/
    /*!
     * @brief   Creates a category filter with its current selection state.
     * @param   category                Catalog category used by the filter.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    catalogCategoriesContainerElem.replaceChildren(...categories.map(category => {
        /****************************************************************************/
        /*!
         * @brief   Selects a catalog category and refreshes the displayed devices.
         */
        /****************************************************************************/
        const buttonElem = catalogButton(category || TEXT_CATALOG_ALL, () => {
            catalogCategory = category;
            renderCatalog();
        });
        buttonElem.setAttribute("aria-pressed", category === catalogCategory);

        return buttonElem;
    }));

    renderCatalogCards();
}

/****************************************************************************/
/*!
 * @brief   Replaces filter options and preserves the selected option.
 * @param   selectElem              Filter control
 * @param   label                   Default label
 * @param   values                  Filter options
 */
/****************************************************************************/
function catalogOptions(selectElem, label, values) {
    const value = selectElem.value;
    selectElem.replaceChildren(new Option(label, ""), ...values.map(item => new Option(item, item)));
    selectElem.value = values.includes(value) ? value : "";
}

/****************************************************************************/
/*!
 * @brief   Renders cards matching the name, category, room and connection.
 */
/****************************************************************************/
function renderCatalogCards() {
    if (catalogView === "locations") {
        deviceCatalogFieldElem.hidden = isCatalogOnline && catalogLocations.length > 0;
        deviceCatalogFieldElem.textContent = isCatalogOnline
            ? TEXT_CATALOG_NO_LOCATIONS : TEXT_CATALOG_DEVICE_LOAD_FAILED;
        catalogCardsContainerElem.replaceChildren(...catalogLocations.map(room => catalogCard({
            title: room.name, icon: room.icon,
            badge: String(catalogDevices.filter(device => device.location_id === room.id).length)
        }, () => editCatalogLocation(room))));
        return;
    }
    if (catalogView === "groups") {
        deviceCatalogFieldElem.hidden = catalogGroups.length > 0;
        deviceCatalogFieldElem.textContent = TEXT_CATALOG_NO_GROUPS;
        catalogCardsContainerElem.replaceChildren(...catalogGroups.map(group => catalogCard({
            title: group.name,
            subtitle: catalogDevices.filter(device => group.device_ids.includes(device.id))
                .map(device => device.name).join(TEXT_CATALOG_SEPARATOR),
            icon: group.icon,
            badge: String(group.device_ids.length)
        }, () => editCatalogGroup(group))));
        for (const cardElem of catalogCardsContainerElem.children) cardElem.disabled = !isCatalogOnline;
        return;
    }

    const query = catalogSearchTxtElem.value.trim().toLocaleLowerCase("en");
    const room = catalogRoomSelectElem.value;
    const connection = catalogConnectionSelectElem.value;
    const devices = catalogDevices.filter(device =>
        device.role === "device" === (catalogView === "devices")
        && (!catalogCategory || catalogDeviceCategory(device) === catalogCategory)
        && (!room || device.location === room)
        && (!connection || catalogConnection(device) === connection)
        && (device.name + " " + (device.location ?? "")).toLocaleLowerCase("en").includes(query));

    deviceCatalogFieldElem.hidden = isCatalogOnline && devices.length > 0;
    deviceCatalogFieldElem.textContent = isCatalogOnline
        ? TEXT_CATALOG_NO_DEVICES_FOUND
        : TEXT_CATALOG_DEVICE_LOAD_FAILED;

    /****************************************************************************/
    /*!
     * @brief   Builds a device card with connection, parent and status details.
     * @param   device                  Registered device configuration.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    catalogCardsContainerElem.replaceChildren(...devices.map(device => {
        const parent = [CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(device.type)
            ? null
            : catalogDevices.find(item => item.id === device.parent_device_id);
        const status = catalogDeviceStatus(device);
        const connection = catalogConnection(device);
        const isOnline =
            device.role === "hub" || connection === "LAN" ? device.connection_status : null;

        return catalogCard({
            title: device.name,
            subtitle: [
                catalogDeviceCategory(device), device.location,
                parent && TEXT_CATALOG_VIA + parent.name
            ].filter(Boolean).join(TEXT_CATALOG_SEPARATOR),
            icon: catalogDeviceIcon(device),
            badge: connection,
            status,
            isOnline
        }, () => editCatalogDevice(device));
    }));
}

/****************************************************************************/
/*!
 * @brief   Selects the configured icon for the current device state.
 * @param   device                  Registered device
 * @returns Icon class
 */
/****************************************************************************/
function catalogDeviceIcon(device) {
    const model = CATALOG_MODELS_BY_ID.get(device.model_id);
    if (model?.icons?.length === 1) return device.icon;

    const state = device.type === CATALOG_RF_TYPE ? device.state : device.power;
    if (state === false || state === 0) return device.icon_low_state || device.icon;

    return device.icon;
}

/****************************************************************************/
/*!
 * @brief   Returns the display category of a registered device.
 * @param   device                  Registered device
 * @returns Category label
 */
/****************************************************************************/
function catalogDeviceCategory(device) {
    return (device.role === "hub"
        ? TEXT_CATALOG_HUB
        : null)
        ?? CATALOG_GROUPS.find(group => group[2].includes(device.category))?.[0]
        ?? CATALOG_MODELS_BY_ID.get(device.model_id)?.categoryName
        ?? TEXT_CATALOG_OTHER;
}

/****************************************************************************/
/*!
 * @brief   Describes the transport represented in the existing device model.
 * @param   device                  Registered device
 * @returns Transport label
 */
/****************************************************************************/
function catalogConnection(device) {
    if (device.type === CATALOG_RF_TYPE) return "RF";
    if (device.type === CATALOG_IR_TYPE) return "IR";
    if (device.hostname) return "LAN";

    return TEXT_CATALOG_REGISTERED;
}

/****************************************************************************/
/*!
 * @brief   Displays known state without inferring hardware availability.
 * @param   device                  Registered device
 * @returns Status label
 */
/****************************************************************************/
function catalogDeviceStatus(device) {
    if (device.role === "hub") {
        if (device.connection_status == null && device.hostname) return TEXT_CATALOG_CONNECTING;

        return device.connection_status ? TEXT_CATALOG_ONLINE : TEXT_CATALOG_OFFLINE;
    }

    if (device.type === CATALOG_RF_TYPE) {
        const model = CATALOG_MODELS_BY_ID.get(device.model_id);

        return model?.states.find(state => state.state === Number(device.state))?.name
            ?? TEXT_CATALOG_REGISTERED;
    }

    if (device.connection_status == null) return TEXT_CATALOG_REGISTERED;
    if (!device.connection_status) return TEXT_CATALOG_OFFLINE;

    return device.power == null
        ? TEXT_CATALOG_ONLINE
        : device.power
        ? TEXT_CATALOG_ON
        : TEXT_CATALOG_OFF;
}

/****************************************************************************/
/*!
 * @brief   Shows the discovery entry point and manual category choices.
 */
/****************************************************************************/
function startCatalogWizard() {
    /****************************************************************************/
    /*!
     * @brief   Builds the catalog discovery method screen.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(TEXT_CATALOG_ADD_DEVICE, TEXT_CATALOG_WHAT_TO_ADD, bodyElem => {
        bodyElem.append(catalogElement("p", "", TEXT_CATALOG_TURN_ON_DEVICE_TO_BEGIN));

        /****************************************************************************/
        /*!
         * @brief   Displays the Bluetooth discovery availability notice.
         */
        /****************************************************************************/
        const discoverBtnElem = catalogButton("", () => {
            const host = catalogElement("div");
            bodyElem.append(host);

            const notice = new BannerManager(host).mount();
            notice.show({
                title: TEXT_CATALOG_NOT_IMPLEMENTED,
                message: TEXT_CATALOG_BLUETOOTH_DISCOVERY_UNAVAILABLE
            });

            catalogWizardDialogElem.addEventListener("close", () => notice.destroy(), {
                once: true
            });
        }, "catalog-discovery catalog-row");
        const labelElem = catalogElement("span");

        labelElem.append(catalogElement(
            "strong", "", TEXT_CATALOG_SEARCH_NEARBY_DEVICES
        ), catalogElement("small", "", TEXT_CATALOG_DISCOVERY_METHODS));

        discoverBtnElem.append(
            catalogIcon("fa-brands fa-bluetooth-b"), labelElem,
            catalogElement("span", "", TEXT_CATALOG_NEXT_ARROW)
        );

        bodyElem.append(discoverBtnElem, catalogElement(
            "p", "catalog-eyebrow", TEXT_CATALOG_OR_CHOOSE_DEVICE
        ));

        const choicesElem = catalogElement("div", "catalog-choices");
        for (const [label, icon, categories] of CATALOG_GROUPS) {
            choicesElem.append(catalogChoice(label, icon, () =>
                chooseCatalogConnection(label, categories)));
        }

        const doorbellBtnElem = catalogChoice(TEXT_CATALOG_DOORBELL, "fa-solid fa-bell", null);
        doorbellBtnElem.disabled = true;
        doorbellBtnElem.title = TEXT_CATALOG_NO_DOORBELL_MODELS;
        choicesElem.append(doorbellBtnElem);
        choicesElem.append(catalogChoice(TEXT_CATALOG_HUB, "fa-solid fa-network-wired", () =>
            configureCatalogDevice({ role: "hub" }, startCatalogWizard)));
        bodyElem.append(choicesElem);
    }, [catalogButton(TEXT_CATALOG_CANCEL, () => catalogWizard.close())]);
}

/****************************************************************************/
/*!
 * @brief   Creates a wizard choice with a representative icon.
 * @param   label                   Choice label
 * @param   icon                    Icon class
 * @param   action                  Click callback
 * @returns Choice button
 */
/****************************************************************************/
function catalogChoice(label, icon, action) {
    const buttonElem = catalogButton("", action);
    buttonElem.append(catalogIcon(icon), catalogElement("strong", "", label));

    return buttonElem;
}

/****************************************************************************/
/*!
 * @brief   Shows the available transport and models for a category.
 * @param   label                   Category label
 * @param   categories              Category identifiers
 */
/****************************************************************************/
function chooseCatalogConnection(label, categories) {
    const models = CATALOG_MODELS.filter(model => categories.includes(model.category));
    const transportTypes = { RF: CATALOG_RF_TYPE, IR: CATALOG_IR_TYPE, LAN: CATALOG_LEDSTRIP_TYPE };

    /****************************************************************************/
    /*!
     * @brief   Builds the connection choices supported by the selected category.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(
        TEXT_CATALOG_STEP_1_OF_3,
        TEXT_CATALOG_ADD_CATEGORY.replace("{category}", () => label),
        bodyElem => {
            bodyElem.append(catalogElement("p", "", TEXT_CATALOG_CHOOSE_DEVICE_CONNECTION));

            const choicesElem = catalogElement("div", "catalog-choices");
            for (const connection of ["RF", "IR", "Zigbee", "LAN"]) {
                const matchingModels =
                    models.filter(model => model.type === transportTypes[connection]);
                const buttonElem = catalogChoice(connection, connection === "LAN"
                    ? "fa-solid fa-network-wired"
                    : "fa-solid fa-tower-broadcast", () =>
                    chooseCatalogModel(matchingModels, () =>
                    chooseCatalogConnection(label, categories)));

                buttonElem.disabled = matchingModels.length === 0;
                choicesElem.append(buttonElem);
            }

            bodyElem.append(choicesElem);
        },
        [catalogButton(TEXT_CATALOG_BACK, startCatalogWizard)]
    );
}

/****************************************************************************/
/*!
 * @brief   Selects a model, then opens the matching setup screen.
 * @param   models                  Available models
 * @param   back                    Previous step callback
 */
/****************************************************************************/
function chooseCatalogModel(models, back) {
    /****************************************************************************/
    /*!
     * @brief   Builds the available device model choices.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(TEXT_CATALOG_STEP_2_OF_3, TEXT_CATALOG_CHOOSE_MODEL, bodyElem => {
        const choicesElem = catalogElement("div", "catalog-choices");
        for (const model of models) {
            /****************************************************************************/
            /*!
             * @brief   Starts the learning or configuration flow for the selected model.
             */
            /****************************************************************************/
            choicesElem.append(catalogChoice(model.name, model.icon, () => {
                const previous = () => chooseCatalogModel(models, back);
                if (model.type === CATALOG_RF_TYPE && model.rf_code_types?.length) {
                    configureCatalogDevice({ role: "device", model, learnOnHub: true }, previous);
                } else {
                    configureCatalogDevice({ role: "device", model }, previous);
                }
            }));
        }

        bodyElem.append(choicesElem);
    }, [catalogButton(TEXT_CATALOG_BACK, back)]);
}

/****************************************************************************/
/*!
 * @brief   Lists link targets, including direct controller reception.
 * @returns Hub options including direct connection
 */
/****************************************************************************/
function catalogParents() {
    return [["", TEXT_CATALOG_DIRECT_VIA_CONTROLLER], ...catalogDevices.filter(device =>
        device.role === "hub").map(device =>
        [device.id, device.name])];
}

/****************************************************************************/
/*!
 * @brief   Starts detail editing from a live device card.
 * @param   device                  Registered device
 */
/****************************************************************************/
function editCatalogDevice(device) {
    configureCatalogDevice({
        role: device.role,
        model: CATALOG_MODELS_BY_ID.get(device.model_id),
        parentId: device.parent_device_id ?? "",
        device
    }, () => catalogWizard.close());
}

/****************************************************************************/
/*!
 * @brief   Adds icon choices to the edit form using the shared icon picker.
 * @param   device                  Registered device
 * @param   model                   Device model configuration
 * @param   icons                   Changed icon fields to include on save
 * @returns Icon controls
 */
/****************************************************************************/
function catalogIconFields(device, model, icons) {
    const fieldsElem = catalogElement("div", "catalog-split");
    const [activeIcon, inactiveIcon] = model?.icons ?? [];
    const fields = [["icon", activeIcon?.name ?? TEXT_ICON]];
    if (inactiveIcon && device.icon_low_state != null) {
        fields.push(["icon_low_state", inactiveIcon.name]);
    }

    for (const [field, label] of fields) {
        /****************************************************************************/
        /*!
         * @brief   Populates and opens the icon picker for a device icon field.
         */
        /****************************************************************************/
        const buttonElem = catalogButton("", () => {
            /****************************************************************************/
            /*!
             * @brief   Creates an icon choice with its accessible label and selection action.
             * @param   icon                    Icon class or icon name.
             * @returns Created component, element or operation result.
             */
            /****************************************************************************/
            grid.replaceChildren(...ICONS_M.map(icon => {
                const choice = button({ iconClass: icon, title: icon });
                choice.setAttribute("aria-label", icon);

                /****************************************************************************/
                /*!
                 * @brief   Runs the action bound to the selected control.
                 */
                /****************************************************************************/
                choice.onclick = () => {
                    icons[field] = icon;
                    iconElem.className = icon;
                    stack.close(picker);
                };

                return choice;
            }));
            stack.open(picker, {
                /****************************************************************************/
                /*!
                 * @brief   Closes the dialog when its modal stack requests dismissal.
                 * @returns Calculated value or configured element.
                 */
                /****************************************************************************/
                onRequestClose: () => stack.close(picker)
            });
        }, "catalog-icon-choice");
        const iconElem = catalogElement("i", device[field] || device.icon);

        iconElem.setAttribute("aria-hidden", "true");
        buttonElem.append(iconElem, catalogElement("span", "", label));
        fieldsElem.append(buttonElem);
    }

    return fieldsElem;
}

/****************************************************************************/
/*!
 * @brief   Displays the final form, capabilities and linked devices.
 * @param   draft                   Device data
 * @param   back                    Previous step callback
 */
/****************************************************************************/
function configureCatalogDevice(draft, back) {
    const { device, model, role } = draft;
    const icons = {};
    const isNewLedstrip = !device && model?.type === CATALOG_LEDSTRIP_TYPE;
    const formElem = catalogElement("form", "catalog-fields");
    const errorElem = catalogElement("p", "catalog-error");

    errorElem.setAttribute("role", "alert");

    const nameElem =
        catalogField("catalogNameTxt", TEXT_CATALOG_NAME, "text", draft.name ?? device?.name ?? "");
    nameElem.lastElementChild.required = true;
    nameElem.lastElementChild.maxLength = 50;

    const roomElem = catalogField(
        "catalogDeviceRoomSelect", TEXT_CATALOG_ROOM, "select", draft.locationId ?? device?.location_id ?? "",
        [["", TEXT_CATALOG_NO_ROOM], ...catalogLocations.map(room => [room.id, room.name])]
    );

    const detailsElem = catalogElement("div", "catalog-split");
    detailsElem.append(nameElem, roomElem);
    formElem.append(detailsElem);
    if (device) formElem.append(catalogIconFields(device, model, icons));
    if (device && role === "device"
        && ![CATALOG_LEDSTRIP_TYPE, CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(device.type)) {
        formElem.append(catalogField(
            "catalogParentSelect", TEXT_CATALOG_CONNECTION, "select", draft.parentId,
            catalogParents()
        ));
    }
    if (isNewLedstrip) addCatalogLanFields(formElem, draft);
    if (device?.type === CATALOG_LEDSTRIP_TYPE && role === "device") {
        formElem.append(catalogButton(TEXT_CONFIGURE_LED_ADDRESSING, () =>
            openLedAddressing(device.id)));
    }

    if (role === "hub") {
        const hostnameElem = catalogField(
            "catalogHubHostnameTxt", TEXT_CATALOG_HOSTNAME, "text", device?.hostname ?? ""
        );
        hostnameElem.lastElementChild.required = true;
        hostnameElem.lastElementChild.maxLength = 253;
        formElem.append(hostnameElem);
    }

    if (device && [CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(device.type)) {
        formElem.append(catalogButton(TEXT_HUB_LEARN, () => learnOnCatalogHub(device)));

        for (const code of device.hub_codes ?? []) {
            if (device.model_id === CATALOG_RF_TAP_MODEL
                && !code.can_transmit
                && device.hub_codes.some(item =>
                item.hub_id === code.hub_id && item.can_transmit)) {
                continue;
            }

            formElem.append(catalogHubCodeRow(device, code, model?.buttons != null, errorElem));
        }
    }

    const capabilities = device?.capabilities ?? (isNewLedstrip ? ["power.set", "color.set", "mode.set"] : []);
    if (capabilities.length) {
        const capabilitiesElem = catalogElement("div");
        capabilitiesElem.append(catalogElement(
            "h3", "", TEXT_CATALOG_CAPABILITIES_AND_ENTITIES
        ), ...capabilities.map(
            capability =>
                catalogElement(
                    "span", "catalog-cap", CATALOG_CAPABILITIES[capability] ?? capability
                )
        ));
        formElem.append(capabilitiesElem);
    }

    if (device && role !== "device") {
        const children = catalogDevices.filter(item =>
            ![CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(item.type)
            && item.parent_device_id === device.id);
        formElem.append(
            catalogElement("strong", "", TEXT_CATALOG_CONNECTED_DEVICES),
            catalogElement(
                "small", "",
                children.map(item => item.name).join(TEXT_CATALOG_SEPARATOR)
                    || TEXT_CATALOG_NO_CONNECTED_DEVICES
            )
        );
    }

    formElem.id = "catalogDeviceForm";

    const saveBtnElem =
        catalogElement("button", "catalog-primary", device ? TEXT_CATALOG_SAVE : TEXT_CATALOG_PAIR);
    saveBtnElem.type = "submit";
    saveBtnElem.setAttribute("form", formElem.id);

    const actions = [catalogButton(device ? TEXT_CATALOG_CLOSE : TEXT_CATALOG_BACK, back)];
    if (device) actions.push(catalogButton(TEXT_CATALOG_DELETE, () => deleteCatalogDevice(device, errorElem), "catalog-delete"));
    actions.push(saveBtnElem);

    if (isNewLedstrip) {
        const addressing = catalogElement("button", "", TEXT_PAIR_AND_CONFIGURE_ADDRESSING);
        addressing.type = "submit";
        addressing.name = "configureAddressing";
        addressing.setAttribute("form", formElem.id);
        actions.push(addressing);
    }

    /****************************************************************************/
    /*!
     * @brief   Validates and saves the device configuration form.
     * @param   event                   Event reported by the bound control.
     */
    /****************************************************************************/
    formElem.onsubmit = async event => {
        event.preventDefault();
        if (saveBtnElem.disabled) return;

        const configureAddressing = event.submitter?.name === "configureAddressing";
        const values = new FormData(formElem);
        const payload = {
            name: values.get("catalogNameTxt").trim(),
            location_id: Number(values.get("catalogDeviceRoomSelect")) || null,
            ...icons
        };

        if (values.has("catalogParentSelect")) {
            payload.parent_device_id = Number(values.get("catalogParentSelect")) || null;
        }

        if (!device) Object.assign(payload, {
            role,
            model_id: model?.model_id,
            rf_codes: draft.learnOnHub ? [] : undefined
        });

        if (role === "hub") payload.hostname = values.get("catalogHubHostnameTxt");
        if (draft.learnOnHub) payload.learn_on_hub = true;
        if (isNewLedstrip) Object.assign(payload, {
            hostname: values.get("catalogHostnameTxt").trim(),
            number_of_leds: Number(values.get("catalogLedCountTxt")),
            has_sensor: values.has("catalogContactCb")
        });

        Object.assign(draft, { name: payload.name, locationId: payload.location_id });
        saveBtnElem.disabled = true;
        saveBtnElem.textContent = TEXT_CATALOG_SAVING;
        errorElem.textContent = "";

        let saved;

        try {
            saved = await catalogRequest(device ? API_URL_UPDATE_DEVICE : API_URL_ADD_DEVICE,
                "POST", device ? { ...payload, id: device.id } : payload);
        } catch (error) {
            errorElem.textContent = error.message;
            saveBtnElem.disabled = false;
            saveBtnElem.textContent = device ? TEXT_CATALOG_SAVE : TEXT_CATALOG_PAIR;
            return;
        }

        if (configureAddressing) {
            openLedAddressing(saved.id);
            return;
        }

        await refreshCatalog();
        showCatalogView(role === "device" ? "devices" : "hubs");
        if (device) {
            catalogWizard.close();
            banners.show({ title: TEXT_CATALOG_SAVED, message: payload.name, type: "success" });
        } else {
            const created = catalogDevices.find(item => item.id === saved.id);
            if (created && (draft.learnOnHub || model?.type === CATALOG_IR_TYPE
                || model?.type === CATALOG_RF_TYPE && !model.rf_code_types?.length)
                && catalogDevices.some(item => item.role === "hub" && item.hostname)) {
                learnOnCatalogHub(created);
            } else {
                finishCatalogWizard(payload.name, isNewLedstrip ? saved.id : null);
            }
        }
    };

    /****************************************************************************/
    /*!
     * @brief   Builds the device details form and any pairing progress indicators.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(
        device ? TEXT_CATALOG_DEVICE_SETTINGS : TEXT_CATALOG_STEP_3_OF_3,
        device?.name ?? TEXT_CATALOG_CHOOSE_DEVICE_LOCATION,
        bodyElem => {
            if (!device) {
                const stepsElem = catalogElement("div", "catalog-steps");
                stepsElem.setAttribute("aria-hidden", "true");
                stepsElem.append(...Array.from({ length: 3 }, () => catalogElement("span")));
                bodyElem.append(stepsElem);
            }
            bodyElem.append(formElem, errorElem);
        },
        actions
    );
}

/****************************************************************************/
/*!
 * @brief   Shows hostname input and optional LAN discovery for LED controllers.
 * @param   formElem                Device form
 * @param   draft                   Registration data
 */
/****************************************************************************/
function addCatalogLanFields(formElem, draft) {
    const hostElem =
        catalogField("catalogHostnameTxt", TEXT_CATALOG_HOSTNAME, "text", draft.hostname);
    const inputElem = hostElem.lastElementChild;

    inputElem.required = true;
    inputElem.maxLength = 20;

    const countElem = catalogField("catalogLedCountTxt", TEXT_CATALOG_LED_COUNT, "number", 0);
    countElem.lastElementChild.min = 0;
    countElem.lastElementChild.max = MAX_NUMBER_OF_LEDS;

    const resultsElem = catalogElement("div", "catalog-fields");
    const contact = fields.render({
        type: "switch",
        name: "catalogContactCb",
        label: TEXT_CATALOG_HAS_CONTACT_SENSOR
    }, false);

    contact.control.id = "catalogContactCb";

    /****************************************************************************/
    /*!
     * @brief   Discovers unconfigured LAN devices and renders hostname choices.
     */
    /****************************************************************************/
    formElem.append(catalogButton(TEXT_CATALOG_SHOW_DISCOVERED_LAN_DEVICES, async () => {
        resultsElem.replaceChildren();

        try {
            const devices = await catalogRequest(API_URL_GET_UNCONFIGURED_DEVICES);

            /****************************************************************************/
            /*!
             * @brief   Copies a discovered LAN hostname into the pairing form.
             */
            /****************************************************************************/
            resultsElem.append(...devices.map(item => catalogChoice(
                item.hostname, "fa-solid fa-network-wired",
                () => { inputElem.value = item.hostname; }
            )));
            if (!devices.length) resultsElem.textContent = TEXT_CATALOG_NO_LAN_DEVICES_FOUND;
        } catch (error) {
            resultsElem.textContent = error.message;
        }
    }), resultsElem, hostElem, countElem, contact.element);
}

/****************************************************************************/
/*!
 * @brief   Opens the addressing editor for a registered strip.
 * @param   id                      Device ID returned by the controller.
 */
/****************************************************************************/
function openLedAddressing(id) {
    window.location.assign("/configure_led_addressing?id=" + encodeURIComponent(id));
}

/****************************************************************************/
/*!
 * @brief   Shows completion after the controller confirms registration.
 * @param   name                    Registered name.
 * @param   stripId                 Registered strip ID, when addressing is available.
 */
/****************************************************************************/
function finishCatalogWizard(name, stripId) {
    /****************************************************************************/
    /*!
     * @brief   Builds the successful device pairing screen.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(TEXT_CATALOG_DEVICE_ADDED, TEXT_CATALOG_READY_TO_USE, bodyElem => {
        const orbElem = catalogIcon("fa-solid fa-check");
        orbElem.classList.add("catalog-orb", "catalog-online");
        bodyElem.append(orbElem, catalogElement(
            "h3", "catalog-center", name + TEXT_CATALOG_ADDED_SUFFIX
        ));
    }, [...(stripId != null
        ? [catalogButton(TEXT_CONFIGURE_LED_ADDRESSING, () => openLedAddressing(stripId))]
        : []), catalogButton(TEXT_CATALOG_ADD_ANOTHER, startCatalogWizard), catalogButton(
            TEXT_CATALOG_BACK_TO_OVERVIEW,
            () => catalogWizard.close(), "catalog-primary"
        )]);
}

/****************************************************************************/
/*!
 * @brief   Confirms and deletes a registered device.
 * @param   device                  Registered device
 * @param   errorElem               Error display
 */
/****************************************************************************/
async function deleteCatalogDevice(device, errorElem) {
    const confirmed = await deviceConfirmation.confirm({
        title: TEXT_CATALOG_DELETE,
        message: TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", () => device.name),
        type: "error",
        confirmLabel: TEXT_CATALOG_DELETE,
        cancelLabel: TEXT_CATALOG_CANCEL
    });
    if (!confirmed) return;

    try {
        await catalogRequest(API_URL_DELETE_DEVICE, "POST", { id: device.id });
        catalogWizard.close();
        await refreshCatalog();
    } catch (error) {
        errorElem.textContent = error.message;
    }
}

/****************************************************************************/
/*!
 * @brief   Displays one learned code and its available actions.
 * @param   device                  Device that owns the code
 * @param   code                    Learned hub code
 * @param   isFreeButton            Whether the code may be edited
 * @param   statusElem              Element for action feedback
 * @returns Code row
 */
/****************************************************************************/
function catalogHubCodeRow(device, code, isFreeButton, statusElem) {
    const hub = catalogDevices.find(item => item.id === code.hub_id);
    const fields = { id: code.hub_id, device_id: device.id, code_id: code.id };
    const rowElem = catalogElement("div", "catalog-code-row");
    const titleElem = catalogElement(
        "small", "", [code.name, hub?.name].filter(Boolean).join(TEXT_CATALOG_SEPARATOR)
    );
    const actionsElem = catalogElement("div", "catalog-code-actions");

    rowElem.append(titleElem, actionsElem);

    /****************************************************************************/
    /*!
     * @brief   Executes an action while preventing concurrent edits to the row.
     * @param   action                  Async hub code action
     */
    /****************************************************************************/
    async function runAction(action) {
        for (const buttonElem of actionsElem.children) buttonElem.disabled = true;

        statusElem.textContent = "";

        try {
            await action();
        } catch (error) {
            statusElem.textContent = error.message;
        } finally {
            for (const buttonElem of actionsElem.children) buttonElem.disabled = false;
        }
    }

    if (code.can_transmit) {
        /****************************************************************************/
        /*!
         * @brief   Transmits a learned hub code and reports the hub used.
         */
        /****************************************************************************/
        actionsElem.append(catalogButton(TEXT_HUB_TRANSMIT, () => runAction(async () => {
            await catalogRequest(API_URL_TRANSMIT_CODE, "POST", fields);
            statusElem.textContent = [TEXT_HUB_SENT, hub?.name].filter(Boolean).join(" ");
        })));
    }

    if (isFreeButton) {
        /****************************************************************************/
        /*!
         * @brief   Renames a learned hub code and updates the device details.
         */
        /****************************************************************************/
        const renameBtnElem = catalogButton(TEXT_HUB_RENAME, () => runAction(async () => {
            const name = window.prompt(TEXT_HUB_CODE_NAME, code.name)?.trim();
            if (!name || name === code.name) return;

            await catalogRequest(API_URL_RENAME_CUSTOM_CODE, "POST", { ...fields, name });
            code.name = name;
            titleElem.textContent =
                [name, hub?.name].filter(Boolean)
                .join(TEXT_CATALOG_SEPARATOR);
        }));

        /****************************************************************************/
        /*!
         * @brief   Confirms and deletes a learned hub code.
         */
        /****************************************************************************/
        const deleteBtnElem = catalogButton("", () => runAction(async () => {
            if (!window.confirm(TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", () =>
                code.name))) return;

            await catalogRequest(API_URL_DELETE_CUSTOM_CODE, "POST", fields);
            device.hub_codes = device.hub_codes.filter(item => item !== code);
            rowElem.remove();
        }), "catalog-code-delete");

        deleteBtnElem.setAttribute("aria-label", TEXT_CATALOG_DELETE);
        deleteBtnElem.title = TEXT_CATALOG_DELETE;

        const trashElem = catalogElement("i", "fa-solid fa-trash");
        trashElem.setAttribute("aria-hidden", "true");
        deleteBtnElem.append(trashElem);
        actionsElem.append(renameBtnElem, deleteBtnElem);
    }

    return rowElem;
}

/****************************************************************************/
/*!
 * @brief   Starts, polls and saves firmware learning for a catalog device.
 * @param   device                  Registered RF or IR device
 */
/****************************************************************************/
function learnOnCatalogHub(device) {
    const hubs = catalogDevices.filter(item => item.role === "hub" && item.hostname);
    const options = hubs.map(item => [item.id, item.name + " (" + item.hostname + ")"]);
    const hubElem = catalogField(
        "catalogLearningHubSelect", TEXT_CATALOG_HUB, "select", options[0]?.[0] ?? "",
        options
    );

    hubElem.hidden = hubs.length < 2;

    const model = CATALOG_MODELS_BY_ID.get(device.model_id);
    const isRf = device.type === CATALOG_RF_TYPE;
    const signals = (isRf ? model?.rf_code_types : model?.ir_code_types) ?? [];
    const isPowerDevice = isRf && device.model_id !== CATALOG_RF_TAP_MODEL
        && [DEVICE_CATEGORY_SWITCH, DEVICE_CATEGORY_POWER_OUTLET].includes(device.category)
        && signals.length > 0;
    const canChooseDirection = isRf && (!signals.length || isPowerDevice);
    const slotsElem = catalogField(
        "catalogLearningSlotSelect", TEXT_CATALOG_NAME, "select", signals[0]?.type,
        signals.map(signal => [signal.type, signal.name])
    );
    const signalListElem = catalogElement("ul");
    const directionElem = catalogField(
        "catalogLearningDirectionSelect", TEXT_CATALOG_CONNECTION, "select",
        isPowerDevice ? "receive" : "transmit",
        [["transmit", TEXT_HUB_TRANSMIT], ["receive", TEXT_HUB_RECEIVE]]
    );

    directionElem.hidden = !canChooseDirection;

    const nameElem = catalogField("catalogCodeNameTxt", TEXT_CATALOG_NAME, "text");
    nameElem.lastElementChild.maxLength = 50;

    const statusElem = catalogElement("p", "", hubs.length ? "" : TEXT_HUB_MISSING);
    statusElem.setAttribute("role", "status");

    const detailsElem = catalogElement("p");
    const progressElem = catalogElement("progress");

    progressElem.hidden = true;

    let learningTarget;
    let timer;
    let capture = 0;
    let isClosed = false;
    let isSaving = false;

    /****************************************************************************/
    /*!
     * @brief   Saves the learned hub code while disabling concurrent learning actions.
     */
    /****************************************************************************/
    const saveBtnElem = catalogButton(TEXT_CATALOG_SAVE, async () => {
        isSaving = true;
        saveBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;

        try {
            await catalogRequest(API_URL_SAVE_HUB_LEARNING_RESULT, "POST", learningTarget);
            learningTarget = undefined;
            catalogWizardDialogElem.removeEventListener("close", onClose);
            catalogWizardDialogElem.removeEventListener("cancel", onCancel);
            if (isClosed) return;

            await refreshCatalog();
            if (isClosed || !catalogWizardDialogElem.open) return;

            const saved = catalogDevices.find(item => item.id === device.id);
            editCatalogDevice(saved ?? device);
        } catch (error) {
            statusElem.textContent = error.message;
            saveBtnElem.disabled = false;
            retryBtnElem.disabled = false;
            cancelBtnElem.disabled = false;
        } finally {
            isSaving = false;
        }
    }, "catalog-primary");

    saveBtnElem.disabled = true;

    /****************************************************************************/
    /*!
     * @brief   Starts a firmware capture with the selected learning options.
     */
    /****************************************************************************/
    async function startLearning() {
        if (!signals.length && !nameElem.lastElementChild.value.trim()) {
            statusElem.textContent = TEXT_HUB_CODE_NAME;
            nameElem.lastElementChild.focus();

            return;
        }
        startBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;

        const selected = hubElem.lastElementChild.value;
        const target = { id: selected, device_id: device.id };

        try {
            await catalogRequest(API_URL_START_HUB_LEARNING_SESSION, "POST", {
                ...target,
                name: nameElem.lastElementChild.value,
                receive: Number(canChooseDirection && directionElem.lastElementChild.value === "receive"),
                transmit: Number(isPowerDevice && directionElem.lastElementChild.value === "transmit"),
                slot: Number(slotsElem.lastElementChild.value)
            });
            if (isClosed) {
                await catalogRequest(API_URL_CANCEL_HUB_LEARNING_SESSION, "POST", target);

                return;
            }
            learningTarget = target;
            retryBtnElem.disabled = false;
            await poll();
        } catch (error) {
            statusElem.textContent = error.message;
            startBtnElem.disabled = false;
        } finally {
            cancelBtnElem.disabled = false;
        }
    }

    const startBtnElem = catalogButton(TEXT_HUB_START, startLearning);
    startBtnElem.disabled = !hubs.length;

    /****************************************************************************/
    /*!
     * @brief   Cancels the current learning session before starting another attempt.
     */
    /****************************************************************************/
    const retryBtnElem = catalogButton(TEXT_HUB_RETRY, async () => {
        if (await cancelLearning()) await startLearning();
    });
    retryBtnElem.disabled = true;

    /****************************************************************************/
    /*!
     * @brief   Closes the learning wizard after cancelling its active session.
     */
    /****************************************************************************/
    const cancelBtnElem = catalogButton(TEXT_CATALOG_CANCEL, async () => {
        if (await cancelLearning()) catalogWizard.close();
    });

    /****************************************************************************/
    /*!
     * @brief   Stops polling and cancels the active firmware capture.
     * @returns boolean Whether cancellation succeeded
     */
    /****************************************************************************/
    async function cancelLearning() {
        clearTimeout(timer);
        capture++;
        if (!learningTarget) return true;

        const target = learningTarget;
        learningTarget = undefined;

        const wasReady = !saveBtnElem.disabled;
        saveBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;

        try {
            await catalogRequest(API_URL_CANCEL_HUB_LEARNING_SESSION, "POST", target);
            progressElem.hidden = true;
            detailsElem.textContent = "";
            statusElem.textContent = "";
            renderSignals();

            return true;
        } catch (error) {
            learningTarget = target;
            statusElem.textContent = error.message;
            retryBtnElem.disabled = false;
            saveBtnElem.disabled = !wasReady;

            return false;
        } finally {
            cancelBtnElem.disabled = false;
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Updates sample count and capture details from the hub.
     */
    /****************************************************************************/
    async function poll() {
        const target = learningTarget;
        const currentCapture = capture;
        if (!target) return;

        try {
            const result = await catalogRequest(API_URL_GET_HUB_LEARNING_STATUS, "GET", target);
            if (isClosed || capture !== currentCapture) return;

            statusElem.textContent = result.message || result.state;
            progressElem.hidden = false;
            progressElem.max = result.code_count || result.required_samples || 1;
            progressElem.value = result.code_index ?? result.sample_count ?? 0;

            const frame = result.frame ?? result.codes?.[result.code_index - 1]?.frame;
            renderSignals(result.codes ?? []);
            detailsElem.textContent = [
                result.codes?.[result.code_index]?.name, frame?.protocol,
                frame?.raw_value || frame?.raw_hash
            ].filter(Boolean).join(TEXT_CATALOG_SEPARATOR);
            if (result.state === "ready") {
                saveBtnElem.disabled = false;
            } else if (["waiting", "collecting"].includes(result.state)) {
                if (!signal.aborted) timer = setTimeout(poll, 750);
            }
        } catch (error) {
            if (isClosed || capture !== currentCapture) return;

            statusElem.textContent = error.message;
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Displays the model slots and their saved or captured states.
     * @param   captured                Current firmware session codes
     */
    /****************************************************************************/
    function renderSignals(captured = []) {
        const hubId = Number(hubElem.lastElementChild.value);
        const isTransmit = isPowerDevice && directionElem.lastElementChild.value === "transmit";

        slotsElem.hidden = !signals.length || isRf && !isTransmit;
        nameElem.hidden = Boolean(signals.length);

        /****************************************************************************/
        /*!
         * @brief   Builds a model signal choice and its learned status.
         * @param   signal                  Abort signal owned by the current page.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        signalListElem.replaceChildren(...signals.map(signal => {
            const saved = (device.hub_codes ?? []).some(code =>
                code.hub_id === hubId && (isTransmit
                ? code.id.startsWith("p" + signal.type)
                : code.type === signal.type));
            const ready = captured.some(code => code.type === signal.type && code.captured);
            const status =
                ready ? TEXT_HUB_CAPTURED : saved ? TEXT_HUB_STORED : TEXT_HUB_PENDING;

            return catalogElement("li", "", signal.name + TEXT_CATALOG_SEPARATOR + status);
        }));
    }

    renderSignals();
    directionElem.lastElementChild.onchange = () => renderSignals();
    hubElem.lastElementChild.onchange = () => renderSignals();

    /****************************************************************************/
    /*!
     * @brief   Clears learning state when the wizard is dismissed.
     */
    /****************************************************************************/
    function onClose() {
        isClosed = true;
        clearTimeout(timer);
        if (learningTarget && !isSaving)

            /****************************************************************************/
            /*!
             * @brief   Leaves learning cancellation failures without additional UI feedback.
             */
            /****************************************************************************/
            catalogRequest(API_URL_CANCEL_HUB_LEARNING_SESSION, "POST", learningTarget).catch(() => {});
        catalogWizardDialogElem.removeEventListener("cancel", onCancel);
    }

    /****************************************************************************/
    /*!
     * @brief   Routes Escape through the same cancellation as the button.
     * @param   event                   Dialog cancellation event
     */
    /****************************************************************************/
    function onCancel(event) {
        event.preventDefault();
        cancelBtnElem.click();
    }

    catalogWizardDialogElem.addEventListener("close", onClose, { once: true });
    catalogWizardDialogElem.addEventListener("cancel", onCancel, { signal });
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });

    /****************************************************************************/
    /*!
     * @brief   Builds the hub signal learning controls and progress display.
     * @param   bodyElem                Wizard body receiving the generated controls.
     */
    /****************************************************************************/
    catalogWizard.show(TEXT_HUB_LEARN, device.name, bodyElem => {
        const fieldsElem = catalogElement("div", "catalog-fields");
        fieldsElem.append(
            hubElem, directionElem, slotsElem, nameElem, signalListElem, startBtnElem,
            progressElem, statusElem, detailsElem
        );
        bodyElem.append(fieldsElem);
    }, [cancelBtnElem, retryBtnElem, saveBtnElem]);
}

/****************************************************************************/
/*!
 * @brief   Updates an individual hub card when the status probe completes.
 * @param   hub                  Device entry in the current catalog
 */
/****************************************************************************/
async function refreshCatalogHubStatus(hub) {
    try {
        const status = await catalogRequest(API_URL_GET_HUB_STATUS, "GET", { id: hub.id });
        hub.connection_status = status.online;
    } catch {
        hub.connection_status = false;
    }

    if (catalogDevices.includes(hub) && catalogView === "hubs") renderCatalogCards();
}

/****************************************************************************/
/*!
 * @brief   Opens the group editor with icon and device choices.
 * @param   group                   Existing group, or null when creating one.
 */
/****************************************************************************/
function editCatalogGroup(group = null) {
    const icons = { icon: group?.icon ?? "fa-solid fa-layer-group" };
    const members = new Set(group?.device_ids);
    const nameElem = catalogField("catalogGroupNameTxt", TEXT_CATALOG_NAME, "text", group?.name);
    const inputElem = nameElem.lastElementChild;
    const membersElem = catalogElement("fieldset", "automation-choice-field");
    const choicesElem = catalogElement("div", "catalog-choices");
    membersElem.append(catalogElement("legend", "", TEXT_CATALOG_DEVICES), choicesElem);
    const errorElem = catalogElement("p");
    const actions = [];
    inputElem.required = true;
    inputElem.maxLength = 50;
    errorElem.setAttribute("role", "alert");

    for (const device of catalogDevices.filter(item => item.role === "device")) {
        const tileElem = catalogElement("label");
        const checkElem = catalogElement("input");
        checkElem.type = "checkbox";
        checkElem.checked = members.has(device.id);
        checkElem.onchange = () => {
            if (checkElem.checked) members.add(device.id);
            else members.delete(device.id);
        };
        decorateCatalogChoice(tileElem, checkElem, catalogDeviceIcon(device), device.name);
        choicesElem.append(tileElem);
    }

    /****************************************************************************/
    /*!
     * @brief   Persists the requested group operation and refreshes its overview.
     * @param   deleting                Whether to delete the current group.
     */
    /****************************************************************************/
    async function submitGroup(deleting) {
        inputElem.value = inputElem.value.trim();
        if (!deleting && !inputElem.reportValidity()) return;
        if (deleting && !window.confirm(TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", group.name))) {
            return;
        }

        for (const action of actions) action.disabled = true;
        try {
            if (deleting) {
                await catalogRequest(API_URL_DELETE_GROUP, "POST", { id: group.id });
                catalogGroups = catalogGroups.filter(item => item.id !== group.id);
            } else {
                const payload = { name: inputElem.value, icon: icons.icon, device_ids: [...members] };
                if (group) payload.id = group.id;
                else payload.type = 0;
                const path = group ? API_URL_UPDATE_GROUP : API_URL_ADD_GROUP;
                const result = await catalogRequest(path, "POST", payload);
                catalogGroups = result.groups;
            }
            if (catalogWizardDialogElem.open && errorElem.isConnected) {
                catalogWizard.close();
                showCatalogView("groups");
            } else {
                renderCatalog();
            }
        } catch (error) {
            errorElem.textContent = error.message;
        } finally {
            for (const action of actions) action.disabled = false;
        }
    }

    if (group) actions.push(catalogButton(TEXT_CATALOG_DELETE, () => submitGroup(true), "catalog-delete"));
    actions.push(catalogButton(TEXT_CATALOG_SAVE, () => submitGroup(false), "catalog-primary"));
    catalogWizard.show(TEXT_CATALOG_GROUPS, group ? TEXT_CATALOG_EDIT_GROUP : TEXT_CATALOG_ADD_GROUP,
        bodyElem => {
            bodyElem.append(nameElem, catalogIconFields(icons, null, icons),
                membersElem, errorElem);
            if (!choicesElem.childElementCount) choicesElem.textContent = TEXT_CATALOG_NO_DEVICES_FOUND;
        }, actions);
}

/****************************************************************************/
/*!
 * @brief   Edits a catalog location using the shared icon picker.
 * @param   room                    Existing location, or null for a new room.
 */
/****************************************************************************/
function editCatalogLocation(room = null) {
    const icons = { icon: room?.icon ?? "fa-solid fa-location-dot" };
    const nameElem = catalogField("catalogLocationNameTxt", TEXT_CATALOG_NAME, "text", room?.name);
    const inputElem = nameElem.lastElementChild;
    const errorElem = catalogElement("p", "catalog-error");
    const actions = [];
    inputElem.required = true;
    inputElem.maxLength = 50;
    errorElem.setAttribute("role", "alert");

    /****************************************************************************/
    /*!
     * @brief   Saves the selected operation and reloads current room assignments.
     * @param   action                  Location operation to perform.
     */
    /****************************************************************************/
    async function submitLocation(action) {
        inputElem.value = inputElem.value.trim();
        if (action !== "delete" && !inputElem.reportValidity()) return;
        if (action === "delete" &&
            !window.confirm(TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", room.name))) return;

        for (const buttonElem of actions) buttonElem.disabled = true;
        try {
            if (action === "delete") {
                await catalogRequest(API_URL_DELETE_LOCATION, "POST", { id: room.id });
            } else {
                const payload = { name: inputElem.value, icon: icons.icon };
                if (room) payload.id = room.id;
                const path = room ? API_URL_UPDATE_LOCATION : API_URL_ADD_LOCATION;
                await catalogRequest(path, "POST", payload);
            }
            await refreshCatalog();
            if (catalogWizardDialogElem.open && errorElem.isConnected) {
                catalogWizard.close();
                showCatalogView("locations");
            }
        } catch (error) {
            errorElem.textContent = error.message;
        } finally {
            for (const buttonElem of actions) buttonElem.disabled = false;
        }
    }

    if (room) actions.push(catalogButton(TEXT_CATALOG_DELETE, () => submitLocation("delete"), "catalog-delete"));
    actions.push(catalogButton(TEXT_CATALOG_SAVE, () => submitLocation(room ? "update" : "add"),
        "catalog-primary"));

    const title = room ? TEXT_CATALOG_EDIT_LOCATION : TEXT_CATALOG_ADD_LOCATION;
    catalogWizard.show(TEXT_CATALOG_LOCATIONS, title, bodyElem => {
        bodyElem.append(nameElem, catalogIconFields(icons, null, icons), errorElem);
    }, actions);
}
