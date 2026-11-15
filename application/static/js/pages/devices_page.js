/******************************************************************************/
/*
 * File:    devices_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 *
 * Brief:   Device overview and registration wizard.
 */
/******************************************************************************/
const catalogDevicesBtnElem = document.getElementById("catalogDevicesBtn");
const catalogBridgesBtnElem = document.getElementById("catalogBridgesBtn");
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

const CATALOG_GROUPS = [
    [TEXT_CATALOG_LIGHTING, "fa-solid fa-lightbulb", [0]],
    [TEXT_CATALOG_SENSOR, "fa-solid fa-tower-broadcast", [1, 2]],
    [TEXT_CATALOG_SWITCH, "fa-solid fa-toggle-on", [3]],
    [TEXT_CATALOG_REMOTE_CONTROL, "fa-solid fa-remote", [4]],
    [TEXT_CATALOG_POWER_OUTLET, "fa-solid fa-plug", [5]]
];
const CATALOG_MODELS_BY_ID = new Map(
    CATALOG_MODELS.map(model => [model.model_id, model])
);
const CATALOG_CAPABILITIES = {
    "power.set": TEXT_CATALOG_POWER, "color.set": TEXT_CATALOG_COLOR, "mode.set": TEXT_CATALOG_EFFECTS,
    contact: TEXT_CATALOG_CONTACT, motion: TEXT_CATALOG_MOTION, switch: TEXT_CATALOG_SWITCH,
    button: TEXT_CATALOG_BUTTON, battery: TEXT_CATALOG_BATTERY, camera: TEXT_CATALOG_CAMERA
};
const catalogWizard = new WizardDialog(catalogWizardDialogElem);
const catalogIconPicker = new IconPicker({
    id: "catalogIconPicker",
    title: TEXT_PICK_ICON,
    submitTitle: TEXT_CATALOG_CLOSE,
    submitIcon: "fa-solid fa-xmark",
    submitFunction: () => catalogIconPicker.close()
});

let catalogDevices = [];
let catalogView = "devices";
let catalogCategory = "";
let isCatalogOnline = false;

catalogDevicesBtnElem.onclick = () => showCatalogView("devices");
catalogBridgesBtnElem.onclick = () => showCatalogView("bridges");
catalogSearchTxtElem.oninput = renderCatalogCards;
catalogRoomSelectElem.onchange = renderCatalogCards;
catalogConnectionSelectElem.onchange = renderCatalogCards;
addCatalogDeviceBtnElem.onclick = startCatalogWizard;
document.addEventListener("DOMContentLoaded", () => {
    const labels = {
        TEXT_CATALOG_DEVICE_MANAGEMENT,
        TEXT_CATALOG_DEVICES,
        TEXT_CATALOG_BRIDGES,
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
    catalogIconPicker.render();
    document.getElementById("catalogIconPicker").addEventListener("cancel", event => {
        event.preventDefault();
        catalogIconPicker.close();
    });
    refreshCatalog();
});

/******************************************************************************/
/*!
    @brief  Loads the live catalog and updates controller status.
*/
/******************************************************************************/
async function refreshCatalog() {
    try {
        catalogDevices = await catalogRequest("/api/devices");
        isCatalogOnline = true;
        for (const bridge of catalogDevices.filter(item => item.role === "bridge")) {
            refreshCatalogBridgeStatus(bridge);
        }
    } catch {
        isCatalogOnline = false;
    }
    renderCatalog();
}

/******************************************************************************/
/*!
    @brief  Switches between the device and infrastructure views.
    @param  view                  View to display
*/
/******************************************************************************/
function showCatalogView(view) {
    catalogView = view;
    catalogCategory = "";
    catalogSearchTxtElem.value = "";
    catalogRoomSelectElem.value = "";
    catalogConnectionSelectElem.value = "";
    renderCatalog();
}

/******************************************************************************/
/*!
    @brief  Updates overview totals and options while retaining valid filters.
*/
/******************************************************************************/
function renderCatalog() {
    const isDeviceView = catalogView === "devices";
    const title = isDeviceView ? TEXT_CATALOG_DEVICES : TEXT_CATALOG_BRIDGES;
    const devices = catalogDevices.filter(
        device => (device.role === "device") === isDeviceView
    );
    catalogDevicesBtnElem.setAttribute("aria-pressed", isDeviceView);
    catalogBridgesBtnElem.setAttribute("aria-pressed", !isDeviceView);
    catalogTitleElem.textContent = title;
    catalogSubtitleFieldElem.textContent = isDeviceView ? TEXT_CATALOG_HOME_SUBTITLE : TEXT_CATALOG_BRIDGE_SUBTITLE;
    catalogCountTitleElem.textContent = title;
    catalogCountFieldElem.textContent = isCatalogOnline ? devices.length : TEXT_CATALOG_EMPTY_VALUE;
    const rooms = [...new Set(catalogDevices.map(device => device.location).filter(Boolean))].sort();
    catalogRoomsFieldElem.textContent = isCatalogOnline ? rooms.length : TEXT_CATALOG_EMPTY_VALUE;
    catalogStatusFieldElem.textContent = isCatalogOnline ? TEXT_CATALOG_ONLINE : TEXT_CATALOG_UNREACHABLE;
    catalogStatusFieldElem.classList.toggle("catalog-online", isCatalogOnline);
    catalogOptions(catalogRoomSelectElem, TEXT_CATALOG_ALL_ROOMS, rooms);
    catalogOptions(catalogConnectionSelectElem, TEXT_CATALOG_ALL_CONNECTIONS, [...new Set(devices.map(catalogConnection))].sort());

    const categories = isDeviceView ? ["", ...new Set([
        ...CATALOG_GROUPS.map(group => group[0]), TEXT_CATALOG_DOORBELL,
        ...devices.map(catalogDeviceCategory)
    ])] : [];

    if (!categories.includes(catalogCategory)) catalogCategory = "";
    
    catalogCategoriesContainerElem.replaceChildren(...categories.map(category => {
        const buttonElem = catalogButton(category || TEXT_CATALOG_ALL, () => {
            catalogCategory = category;
            renderCatalog();
        });
        buttonElem.setAttribute("aria-pressed", category === catalogCategory);
        return buttonElem;
    }));

    renderCatalogCards();
}

/******************************************************************************/
/*!
    @brief  Replaces filter options and preserves the selected option.
    @param  selectElem            Filter control
    @param  label                 Default label
    @param  values                Filter options
*/
/******************************************************************************/
function catalogOptions(selectElem, label, values) {
    const value = selectElem.value;
    selectElem.replaceChildren(new Option(label, ""),
        ...values.map(item => new Option(item, item)));
    selectElem.value = values.includes(value) ? value : "";
}

/******************************************************************************/
/*!
    @brief  Renders cards matching the name, category, room and connection.
*/
/******************************************************************************/
function renderCatalogCards() {
    const query = catalogSearchTxtElem.value.trim().toLocaleLowerCase("en");
    const room = catalogRoomSelectElem.value;
    const connection = catalogConnectionSelectElem.value;
    const devices = catalogDevices.filter(device =>
        ((device.role === "device") === (catalogView === "devices")) &&
        (!catalogCategory || catalogDeviceCategory(device) === catalogCategory) &&
        (!room || device.location === room) &&
        (!connection || catalogConnection(device) === connection) &&
        (device.name + " " + (device.location ?? ""))
            .toLocaleLowerCase("en").includes(query)
    );
    
    deviceCatalogFieldElem.hidden = isCatalogOnline && devices.length > 0;
    deviceCatalogFieldElem.textContent = isCatalogOnline ? TEXT_CATALOG_NO_DEVICES_FOUND : TEXT_CATALOG_DEVICE_LOAD_FAILED;
    catalogCardsContainerElem.replaceChildren(...devices.map(device => {
        const parent = [CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(device.type) ? null :
            catalogDevices.find(item => item.id === device.parent_device_id);
        const status = catalogDeviceStatus(device);
        const connection = catalogConnection(device);
        const isOnline = device.role === "bridge" || connection === "LAN" ? device.connection_status : null;

        return catalogCard({
            title: device.name,
            subtitle: [catalogDeviceCategory(device), device.location,
                parent && TEXT_CATALOG_VIA + parent.name].filter(Boolean).join(TEXT_CATALOG_SEPARATOR),
            icon: catalogDeviceIcon(device), badge: connection, status, isOnline
        }, () => editCatalogDevice(device));
    }));
}

/******************************************************************************/
/*!
    @brief  Selects the configured icon for the current device state.
    @param  device                Registered device
    @returns                      Icon class
*/
/******************************************************************************/
function catalogDeviceIcon(device) {
    const model = CATALOG_MODELS_BY_ID.get(device.model_id);
    if (model?.icons?.length === 1) return device.icon;
    const state = device.type === CATALOG_RF_TYPE ? device.state : device.power;
    if (state === false || state === 0) return device.icon_low_state || device.icon;
    return device.icon;
}

/******************************************************************************/
/*!
    @brief  Returns the display category of a registered device.
    @param  device                Registered device
    @returns                      Category label
*/
/******************************************************************************/
function catalogDeviceCategory(device) {
    return (device.role === "bridge" ? TEXT_CATALOG_BRIDGE : null) ??
        CATALOG_GROUPS.find(group => group[2].includes(device.category))?.[0] ??
        CATALOG_MODELS_BY_ID.get(device.model_id)?.categoryName ?? TEXT_CATALOG_OTHER;
}

/******************************************************************************/
/*!
    @brief  Describes the transport represented in the existing device model.
    @param  device                Registered device
    @returns                      Transport label
*/
/******************************************************************************/
function catalogConnection(device) {
    if (device.type === CATALOG_RF_TYPE) return "RF";
    if (device.type === CATALOG_IR_TYPE) return "IR";
    if (device.hostname) return "LAN";
    return TEXT_CATALOG_REGISTERED;
}

/******************************************************************************/
/*!
    @brief  Displays known state without inferring hardware availability.
    @param  device                Registered device
    @returns                      Status label
*/
/******************************************************************************/
function catalogDeviceStatus(device) {
    if (device.role === "bridge") {
        if (device.connection_status == null && device.hostname) return TEXT_CATALOG_CONNECTING;
        return device.connection_status ? TEXT_CATALOG_ONLINE : TEXT_CATALOG_OFFLINE;
    }
    
    if (device.type === CATALOG_RF_TYPE) {
        const model = CATALOG_MODELS_BY_ID.get(device.model_id);
        return model?.states.find(state => state.state === Number(device.state))
            ?.name ?? TEXT_CATALOG_REGISTERED;
    }

    if (device.connection_status == null) return TEXT_CATALOG_REGISTERED;
    if (!device.connection_status) return TEXT_CATALOG_OFFLINE;

    return device.power == null ? TEXT_CATALOG_ONLINE : device.power ? TEXT_CATALOG_ON : TEXT_CATALOG_OFF;
}

/******************************************************************************/
/*!
    @brief  Shows the discovery entry point and manual category choices.
*/
/******************************************************************************/
function startCatalogWizard() {
    catalogWizard.show(TEXT_CATALOG_ADD_DEVICE, TEXT_CATALOG_WHAT_TO_ADD, bodyElem => {
        bodyElem.append(catalogElement("p", "", TEXT_CATALOG_TURN_ON_DEVICE_TO_BEGIN));
        const discoverBtnElem = catalogButton("", () => {
            banners.show(TEXT_CATALOG_NOT_IMPLEMENTED, TEXT_CATALOG_BLUETOOTH_DISCOVERY_UNAVAILABLE,
                MESSAGE_TYPE_INFO, undefined, null, catalogWizardDialogElem);
        }, "catalog-discovery catalog-row");
        const labelElem = catalogElement("span");
        labelElem.append(catalogElement("strong", "", TEXT_CATALOG_SEARCH_NEARBY_DEVICES),
            catalogElement("small", "", TEXT_CATALOG_DISCOVERY_METHODS));
        discoverBtnElem.append(catalogIcon("fa-brands fa-bluetooth-b"), labelElem,
            catalogElement("span", "", TEXT_CATALOG_NEXT_ARROW));
        bodyElem.append(discoverBtnElem,
            catalogElement("p", "catalog-eyebrow", TEXT_CATALOG_OR_CHOOSE_DEVICE));
        const choicesElem = catalogElement("div", "catalog-choices");
        for (const [label, icon, categories] of CATALOG_GROUPS) {
            choicesElem.append(catalogChoice(label, icon,
                () => chooseCatalogConnection(label, categories)));
        }
        const doorbellBtnElem = catalogChoice(TEXT_CATALOG_DOORBELL, "fa-solid fa-bell", null);
        doorbellBtnElem.disabled = true;
        doorbellBtnElem.title = TEXT_CATALOG_NO_DOORBELL_MODELS;
        choicesElem.append(doorbellBtnElem);
        choicesElem.append(catalogChoice(TEXT_CATALOG_BRIDGE, "fa-solid fa-network-wired",
            () => configureCatalogDevice({role: "bridge"}, startCatalogWizard)));
        bodyElem.append(choicesElem);
    }, [catalogButton(TEXT_CATALOG_CANCEL, () => catalogWizard.close())]);
}

/******************************************************************************/
/*!
    @brief  Creates a wizard choice with a representative icon.
    @param  label                 Choice label
    @param  icon                  Icon class
    @param  action                Click callback
    @returns                      Choice button
*/
/******************************************************************************/
function catalogChoice(label, icon, action) {
    const buttonElem = catalogButton("", action);
    buttonElem.append(catalogIcon(icon), catalogElement("strong", "", label));
    return buttonElem;
}

/******************************************************************************/
/*!
    @brief  Shows the available transport and models for a category.
    @param  label                 Category label
    @param  categories            Category identifiers
*/
/******************************************************************************/
function chooseCatalogConnection(label, categories) {
    const models = CATALOG_MODELS.filter(model =>
        categories.includes(model.category)
    );
    const transportTypes = {
        RF: CATALOG_RF_TYPE, IR: CATALOG_IR_TYPE, LAN: CATALOG_LEDSTRIP_TYPE
    };
    catalogWizard.show(TEXT_CATALOG_STEP_1_OF_3, TEXT_CATALOG_ADD_CATEGORY.replace("{category}", () => label), bodyElem => {
        bodyElem.append(catalogElement("p", "", TEXT_CATALOG_CHOOSE_DEVICE_CONNECTION));
        const choicesElem = catalogElement("div", "catalog-choices");
        for (const connection of ["RF", "IR", "Zigbee", "LAN"]) {
            const matchingModels = models.filter(
                model => model.type === transportTypes[connection]
            );
            const buttonElem = catalogChoice(connection,
                connection === "LAN" ? "fa-solid fa-network-wired" :
                    "fa-solid fa-tower-broadcast",
                () => chooseCatalogModel(matchingModels,
                    () => chooseCatalogConnection(label, categories)));
            buttonElem.disabled = matchingModels.length === 0;
            choicesElem.append(buttonElem);
        }
        bodyElem.append(choicesElem);
    }, [catalogButton(TEXT_CATALOG_BACK, startCatalogWizard)]);
}

/******************************************************************************/
/*!
    @brief  Selects a model, then opens the matching setup screen.
    @param  models                Available models
    @param  back                  Previous step callback
*/
/******************************************************************************/
function chooseCatalogModel(models, back) {
    catalogWizard.show(TEXT_CATALOG_STEP_2_OF_3, TEXT_CATALOG_CHOOSE_MODEL, bodyElem => {
        const choicesElem = catalogElement("div", "catalog-choices");
        for (const model of models) {
            choicesElem.append(catalogChoice(model.name, model.icon, () => {
                const previous = () => chooseCatalogModel(models, back);
                if (model.type === CATALOG_RF_TYPE && model.rf_code_types?.length) {
                    learnCatalogSignals({role: "device", model}, previous);
                } else {
                    configureCatalogDevice({role: "device", model}, previous);
                }
            }));
        }
        bodyElem.append(choicesElem);
    }, [catalogButton(TEXT_CATALOG_BACK, back)]);
}

/******************************************************************************/
/*!
    @brief  Lists link targets, including direct controller reception.
    @returns                      Bridge options including direct connection
*/
/******************************************************************************/
function catalogParents() {
    return [["", TEXT_CATALOG_DIRECT_VIA_CONTROLLER],
        ...catalogDevices.filter(device => device.role === "bridge")
            .map(device => [device.id, device.name])];
}

/******************************************************************************/
/*!
    @brief  Lets the user enter or select real RF signals from the controller.
    @param  draft                 Registration data
    @param  back                  Previous step callback
*/
/******************************************************************************/
function learnCatalogSignals(draft, back) {
    const signals = draft.model.rf_code_types;
    const formElem = catalogElement("div", "catalog-fields");
    const errorElem = catalogElement("p", "catalog-error");
    errorElem.setAttribute("role", "alert");
    const inputs = signals.map((signal, index) => {
        const fieldElem = catalogField("catalogRf" + index + "Txt",
            signal.name, "number", draft.rfCodes?.[index] ?? "");
        formElem.append(fieldElem);
        return fieldElem.lastElementChild;
    });
    const recentElem = catalogElement("div", "catalog-fields");
    const refreshBtnElem = catalogButton(TEXT_CATALOG_FETCH_RECEIVED_RF_SIGNALS, async () => {
        try {
            const result = await catalogRequest("/get_last_received_rf_codes");
            const codes = [...new Set(result.message.rf_codes[0].filter(code => code > 0))];
            const options = [["", TEXT_CATALOG_CHOOSE_RECEIVED_SIGNAL],
                ...codes.map(code => [code, String(code)])];
            recentElem.replaceChildren(...inputs.map((inputElem, index) => {
                const fieldElem = catalogField("catalogSignal" + index + "Select",
                    signals[index].name, "select", "", options);
                fieldElem.lastElementChild.onchange = event => {
                    if (event.target.value) inputElem.value = event.target.value;
                };
                return fieldElem;
            }));
            errorElem.textContent = codes.length ? "" : TEXT_CATALOG_NO_RF_SIGNALS_RECEIVED;
        } catch (error) {
            errorElem.textContent = error.message;
        }
    });
    catalogWizard.show(TEXT_CATALOG_STEP_2_OF_3, TEXT_CATALOG_LEARN_SIGNAL, bodyElem => {
        const orbElem = catalogIcon(draft.model.icon);
        orbElem.classList.add("catalog-orb");
        bodyElem.append(orbElem, catalogElement("p", "",
            TEXT_CATALOG_SELECT_OR_ENTER_RF_CODE),
        refreshBtnElem, recentElem, formElem, errorElem);
        if (catalogDevices.some(item => item.role === "bridge" && item.hostname)) {
            bodyElem.append(catalogButton(TEXT_BRIDGE_LEARN, () => {
                draft.learnOnBridge = true;
                configureCatalogDevice(draft, () => learnCatalogSignals(draft, back));
            }));
        }
    }, [catalogButton(TEXT_CATALOG_BACK, back), catalogButton(TEXT_CATALOG_NEXT, () => {
        const codes = inputs.map(inputElem => Number(inputElem.value));
        if (codes.some(code => !Number.isInteger(code) || code < 1 ||
            code > 16777215) || new Set(codes).size !== codes.length) {
            errorElem.textContent = TEXT_CATALOG_RF_CODE_REQUIREMENTS;
            return;
        }
        draft.learnOnBridge = false;
        draft.rfCodes = codes;
        configureCatalogDevice(draft, () => learnCatalogSignals(draft, back));
    }, "catalog-primary")]);
}

/******************************************************************************/
/*!
    @brief  Starts detail editing from a live device card.
    @param  device                Registered device
*/
/******************************************************************************/
function editCatalogDevice(device) {
    configureCatalogDevice({
        role: device.role, model: CATALOG_MODELS_BY_ID.get(device.model_id),
        parentId: device.parent_device_id ?? "", device
    }, () => catalogWizard.close());
}

/******************************************************************************/
/*!
    @brief  Adds icon choices to the edit form using the shared icon picker.
    @param  device                Registered device
    @param  model                 Device model configuration
    @param  icons                 Changed icon fields to include on save
    @returns                      Icon controls
*/
/******************************************************************************/
function catalogIconFields(device, model, icons) {
    const fieldsElem = catalogElement("div", "catalog-split");
    const [activeIcon, inactiveIcon] = model?.icons ?? [];
    const fields = [["icon", activeIcon?.name ?? TEXT_ICON]];
    if (inactiveIcon && device.icon_low_state != null) {
        fields.push(["icon_low_state", inactiveIcon.name]);
    }
    for (const [field, label] of fields) {
        const buttonElem = catalogButton("", () => {
            catalogIconPicker.setIcons(ICONS_M.map(icon => ({
                icon,
                onclickFunction: () => {
                    icons[field] = icon;
                    iconElem.className = icon;
                    catalogIconPicker.close();
                }
            })));
            catalogIconPicker.show();
        }, "catalog-icon-choice");
        const iconElem = catalogElement("i", device[field] || device.icon);
        iconElem.setAttribute("aria-hidden", "true");
        buttonElem.append(iconElem, catalogElement("span", "", label));
        fieldsElem.append(buttonElem);
    }
    return fieldsElem;
}

/******************************************************************************/
/*!
    @brief  Displays the final form, capabilities and linked devices.
    @param  draft                 Device data
    @param  back                  Previous step callback
*/
/******************************************************************************/
function configureCatalogDevice(draft, back) {
    const {device, model, role} = draft;
    const icons = {};
    const isNewLedstrip = !device && model?.type === CATALOG_LEDSTRIP_TYPE;
    const formElem = catalogElement("form", "catalog-fields");
    const errorElem = catalogElement("p", "catalog-error");
    errorElem.setAttribute("role", "alert");

    const nameElem = catalogField("catalogNameTxt", TEXT_CATALOG_NAME, "text",
        draft.name ?? device?.name ?? "");
    nameElem.lastElementChild.required = true;
    nameElem.lastElementChild.maxLength = 50;
    const roomElem = catalogField("catalogRoomTxt", TEXT_CATALOG_ROOM, "text",
        draft.location ?? device?.location ?? "");
    roomElem.lastElementChild.maxLength = 50;
    const roomsElem = catalogElement("datalist");
    roomsElem.id = "catalogRoomOptions";
    const rooms = [...new Set(catalogDevices.map(item => item.location).filter(Boolean))];
    roomsElem.append(...rooms.map(room => new Option(room)));
    roomElem.lastElementChild.setAttribute("list", roomsElem.id);
    const detailsElem = catalogElement("div", "catalog-split");
    detailsElem.append(nameElem, roomElem);
    formElem.append(detailsElem, roomsElem);
    if (device) formElem.append(catalogIconFields(device, model, icons));
    if (device && role === "device" && ![
        CATALOG_LEDSTRIP_TYPE, CATALOG_RF_TYPE, CATALOG_IR_TYPE
    ].includes(device.type)) {
        formElem.append(catalogField("catalogParentSelect", TEXT_CATALOG_CONNECTION, "select",
            draft.parentId, catalogParents()));
    }
    if (isNewLedstrip) addCatalogLanFields(formElem, draft);
    if (role === "bridge") {
        const hostnameElem = catalogField("catalogBridgeHostnameTxt",
            TEXT_CATALOG_HOSTNAME, "text", device?.hostname ?? "");
        hostnameElem.lastElementChild.required = true;
        hostnameElem.lastElementChild.maxLength = 253;
        formElem.append(hostnameElem);
    }
    if (device && [CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(device.type)) {
        formElem.append(catalogButton(TEXT_BRIDGE_LEARN,
            () => learnOnCatalogBridge(device)));
        for (const code of device.bridge_codes ?? []) {
            if (device.model_id === CATALOG_RF_TAP_MODEL && !code.can_transmit &&
                device.bridge_codes.some(item => item.bridge_id === code.bridge_id && item.can_transmit)) {
                continue;
            }
            formElem.append(catalogBridgeCodeRow(device, code, model?.buttons != null, errorElem));
        }
    }
    const capabilities = device?.capabilities ?? (isNewLedstrip ?
        ["power.set", "color.set", "mode.set"] : []);
    if (capabilities.length) {
        const capabilitiesElem = catalogElement("div");
        capabilitiesElem.append(catalogElement("h3", "", TEXT_CATALOG_CAPABILITIES_AND_ENTITIES),
            ...capabilities.map(capability => catalogElement("span", "catalog-cap",
                CATALOG_CAPABILITIES[capability] ?? capability)));
        formElem.append(capabilitiesElem);
    }
    if (device && role !== "device") {
        const children = catalogDevices.filter(item =>
            ![CATALOG_RF_TYPE, CATALOG_IR_TYPE].includes(item.type) &&
            item.parent_device_id === device.id
        );
        formElem.append(catalogElement("strong", "", TEXT_CATALOG_CONNECTED_DEVICES),
            catalogElement("small", "", children.map(item => item.name).join(TEXT_CATALOG_SEPARATOR) ||
                TEXT_CATALOG_NO_CONNECTED_DEVICES));
    }

    const saveBtnElem = catalogButton(device ? TEXT_CATALOG_SAVE : TEXT_CATALOG_PAIR,
        () => formElem.requestSubmit(), "catalog-primary");
    formElem.onsubmit = async event => {
        event.preventDefault();
        if (saveBtnElem.disabled) return;
        const values = new FormData(formElem);
        const payload = {
            name: values.get("catalogNameTxt").trim(),
            location: values.get("catalogRoomTxt").trim(),
            ...icons
        };
        if (values.has("catalogParentSelect")) {
            payload.parent_device_id = Number(values.get("catalogParentSelect")) || null;
        }
        if (!device) Object.assign(payload, {role, model_id: model?.model_id,
            rf_codes: draft.rfCodes});
        if (role === "bridge") payload.hostname = values.get("catalogBridgeHostnameTxt");
        if (draft.learnOnBridge) payload.learn_on_bridge = true;
        if (isNewLedstrip) Object.assign(payload, {
            hostname: values.get("catalogHostnameTxt").trim(),
            number_of_leds: Number(values.get("catalogLedCountTxt")),
            has_sensor: values.has("catalogContactCb")
        });
        Object.assign(draft, {name: payload.name, location: payload.location});
        saveBtnElem.disabled = true;
        saveBtnElem.textContent = TEXT_CATALOG_SAVING;
        errorElem.textContent = "";
        let saved;
        try {
            saved = await catalogRequest("/api/devices" + (device ? "/" + device.id : ""),
                device ? "PATCH" : "POST", payload);
        } catch (error) {
            errorElem.textContent = error.message;
            saveBtnElem.disabled = false;
            saveBtnElem.textContent = device ? TEXT_CATALOG_SAVE : TEXT_CATALOG_PAIR;
            return;
        }
        await refreshCatalog();
        showCatalogView(role === "device" ? "devices" : "bridges");
        if (device) {
            catalogWizard.close();
            banners.show(TEXT_CATALOG_SAVED, payload.name, MESSAGE_TYPE_SUCCESS);
        } else {
            const created = catalogDevices.find(item => item.id === saved.id);
            if (created && (draft.learnOnBridge || model?.type === CATALOG_IR_TYPE ||
                (model?.type === CATALOG_RF_TYPE && !model.rf_code_types?.length)) &&
                catalogDevices.some(item => item.role === "bridge" && item.hostname)) {
                learnOnCatalogBridge(created);
            } else {
                finishCatalogWizard(payload.name);
            }
        }
    };
    catalogWizard.show(device ? TEXT_CATALOG_DEVICE_SETTINGS : TEXT_CATALOG_STEP_3_OF_3,
        device?.name ?? TEXT_CATALOG_CHOOSE_DEVICE_LOCATION, bodyElem => {
            if (!device) {
                const stepsElem = catalogElement("div", "catalog-steps");
                stepsElem.setAttribute("aria-hidden", "true");
                stepsElem.append(...Array.from({length: 3}, () => catalogElement("span")));
                bodyElem.append(stepsElem);
            }
            bodyElem.append(formElem, errorElem);
        }, [
            catalogButton(device ? TEXT_CATALOG_CLOSE : TEXT_CATALOG_BACK, back),
            ...(device ? [catalogButton(TEXT_CATALOG_DELETE,
                () => deleteCatalogDevice(device, errorElem), "catalog-delete")] : []),
            saveBtnElem
        ]);
}

/******************************************************************************/
/*!
    @brief  Shows hostname input and optional LAN discovery for LED controllers.
    @param  formElem              Device form
    @param  draft                 Registration data
*/
/******************************************************************************/
function addCatalogLanFields(formElem, draft) {
    const hostElem = catalogField("catalogHostnameTxt", TEXT_CATALOG_HOSTNAME, "text", draft.hostname);
    const inputElem = hostElem.lastElementChild;
    inputElem.required = true;
    inputElem.maxLength = 20;
    const countElem = catalogField("catalogLedCountTxt", TEXT_CATALOG_LED_COUNT, "number", 0);
    countElem.lastElementChild.min = 0;
    countElem.lastElementChild.max = MAX_NUMBER_OF_LEDS;
    const resultsElem = catalogElement("div", "catalog-fields");
    formElem.append(catalogButton(TEXT_CATALOG_SHOW_DISCOVERED_LAN_DEVICES, async () => {
        resultsElem.replaceChildren();
        try {
            const devices = await catalogRequest("/get_unconfigured_devices");
            resultsElem.append(...devices.map(item => catalogChoice(item.hostname,
                "fa-solid fa-network-wired", () => { inputElem.value = item.hostname; })));
            if (!devices.length) resultsElem.textContent = TEXT_CATALOG_NO_LAN_DEVICES_FOUND;
        } catch (error) {
            resultsElem.textContent = error.message;
        }
    }), resultsElem, hostElem, countElem,
    catalogField("catalogContactCb", TEXT_CATALOG_HAS_CONTACT_SENSOR, "checkbox"));
}

/******************************************************************************/
/*!
    @brief  Shows completion after the controller confirms registration.
    @param  name                  Registered name
*/
/******************************************************************************/
function finishCatalogWizard(name) {
    catalogWizard.show(TEXT_CATALOG_DEVICE_ADDED, TEXT_CATALOG_READY_TO_USE, bodyElem => {
        const orbElem = catalogIcon("fa-solid fa-check");
        orbElem.classList.add("catalog-orb", "catalog-online");
        bodyElem.append(orbElem, catalogElement("h3", "catalog-center",
            name + TEXT_CATALOG_ADDED_SUFFIX));
    }, [catalogButton(TEXT_CATALOG_ADD_ANOTHER, startCatalogWizard),
        catalogButton(TEXT_CATALOG_BACK_TO_OVERVIEW, () => catalogWizard.close(), "catalog-primary")]);
}

/******************************************************************************/
/*!
    @brief  Confirms and deletes a registered device.
    @param  device                Registered device
    @param  errorElem             Error display
*/
/******************************************************************************/
async function deleteCatalogDevice(device, errorElem) {
    if (!window.confirm(TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", () => device.name))) return;
    try {
        await catalogRequest("/api/devices/" + device.id, "DELETE");
        catalogWizard.close();
        await refreshCatalog();
    } catch (error) {
        errorElem.textContent = error.message;
    }
}

/******************************************************************************/
/*!
    @brief  Requests JSON from the controller and reports failures.
    @param  url                   Request URL
    @param  method                HTTP method
    @param  payload               Optional request data
    @returns                      Promise resolving to response data
*/
/******************************************************************************/
async function catalogRequest(url, method = "GET", payload) {
    const response = await fetch(url, {
        method, headers: payload ? {"Content-Type": "application/json"} : {},
        body: JSON.stringify(payload)
    });
    if (response.status === HTTP_CODE_NO_CONTENT) return;
    try {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return url.startsWith("/api/devices") || url.startsWith("/api/bridges/") ?
            result.message : result;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(TEXT_CATALOG_INVALID_CONTROLLER_RESPONSE);
        }
        throw error;
    }
}

/******************************************************************************/
/*!
    @brief    Displays one learned code and its available actions.
    @param    device              Device that owns the code
    @param    code                Learned bridge code
    @param    isFreeButton        Whether the code may be edited
    @param    statusElem          Element for action feedback
    @returns                      Code row
*/
/******************************************************************************/
function catalogBridgeCodeRow(device, code, isFreeButton, statusElem) {
    const bridge = catalogDevices.find(item => item.id === code.bridge_id);
    const base = "/api/bridges/" + code.bridge_id;
    const codeId = encodeURIComponent(code.id);
    const endpoint = base + "/devices/" + device.id + "/codes/" + codeId;
    const rowElem = catalogElement("div", "catalog-code-row");
    const titleElem = catalogElement("small", "", [code.name, bridge?.name]
        .filter(Boolean).join(TEXT_CATALOG_SEPARATOR));
    const actionsElem = catalogElement("div", "catalog-code-actions");
    rowElem.append(titleElem, actionsElem);

    /**************************************************************************/
    /*!
        @brief    Executes an action while preventing concurrent edits to the row.
        @param    action              Async bridge code action
    */
    /**************************************************************************/
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
        actionsElem.append(catalogButton(TEXT_BRIDGE_TRANSMIT, () => runAction(async () => {
            await catalogRequest(base + "/transmit/" + codeId, "POST");
            statusElem.textContent = [TEXT_BRIDGE_SENT, bridge?.name].filter(Boolean).join(" ");
        })));
    }
    if (isFreeButton) {
        const renameBtnElem = catalogButton(TEXT_BRIDGE_RENAME, () => runAction(async () => {
            const name = window.prompt(TEXT_BRIDGE_CODE_NAME, code.name)?.trim();
            if (!name || name === code.name) return;
            await catalogRequest(endpoint, "PATCH", {name});
            code.name = name;
            titleElem.textContent = [name, bridge?.name].filter(Boolean).join(TEXT_CATALOG_SEPARATOR);
        }));
        const deleteBtnElem = catalogButton("", () => runAction(async () => {
            if (!window.confirm(TEXT_CATALOG_CONFIRM_DELETE.replace("{name}", () => code.name))) return;
            await catalogRequest(endpoint, "DELETE");
            device.bridge_codes = device.bridge_codes.filter(item => item !== code);
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

/******************************************************************************/
/*!
    @brief    Starts, polls and saves firmware learning for a catalog device.
    @param    device              Registered RF or IR device
*/
/******************************************************************************/
function learnOnCatalogBridge(device) {
    const bridges = catalogDevices.filter(item => item.role === "bridge" && item.hostname);
    const options = bridges.map(item => [item.id, item.name + " (" + item.hostname + ")"]);
    const bridgeElem = catalogField("catalogLearningBridgeSelect", TEXT_CATALOG_BRIDGE,
        "select", options[0]?.[0] ?? "", options);
    bridgeElem.hidden = bridges.length < 2;
    const model = CATALOG_MODELS_BY_ID.get(device.model_id);
    const isRf = device.type === CATALOG_RF_TYPE;
    const signals = (isRf ? model?.rf_code_types : model?.ir_code_types) ?? [];
    const isPowerDevice = isRf && device.model_id !== CATALOG_RF_TAP_MODEL &&
        [DEVICE_CATEGORY_SWITCH, DEVICE_CATEGORY_POWER_OUTLET]
        .includes(device.category) && signals.length > 0;
    const canChooseDirection = isRf && (!signals.length || isPowerDevice);
    const slotsElem = catalogField("catalogLearningSlotSelect", TEXT_CATALOG_NAME,
        "select", signals[0]?.type, signals.map(signal => [signal.type, signal.name]));
    const signalListElem = catalogElement("ul");
    const directionElem = catalogField("catalogLearningDirectionSelect", TEXT_CATALOG_CONNECTION,
        "select", isPowerDevice ? "receive" : "transmit", [["transmit", TEXT_BRIDGE_TRANSMIT], ["receive", TEXT_BRIDGE_RECEIVE]]);
    directionElem.hidden = !canChooseDirection;
    const nameElem = catalogField("catalogCodeNameTxt", TEXT_CATALOG_NAME,
        "text");
    nameElem.lastElementChild.maxLength = 50;
    const statusElem = catalogElement("p", "", bridges.length ? "" : TEXT_BRIDGE_MISSING);
    statusElem.setAttribute("role", "status");
    const detailsElem = catalogElement("p");
    const progressElem = catalogElement("progress");
    progressElem.hidden = true;
    let url;
    let timer;
    let capture = 0;
    let isClosed = false;
    let isSaving = false;

    const saveBtnElem = catalogButton(TEXT_CATALOG_SAVE, async () => {
        isSaving = true;
        saveBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;
        try {
            await catalogRequest(url, "PUT");
            url = undefined;
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

    /**************************************************************************/
    /*!
        @brief    Starts a firmware capture with the selected learning options.
    */
    /**************************************************************************/
    async function startLearning() {
        if (!signals.length && !nameElem.lastElementChild.value.trim()) {
            statusElem.textContent = TEXT_BRIDGE_CODE_NAME;
            nameElem.lastElementChild.focus();
            return;
        }
        startBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;
        const selected = bridgeElem.lastElementChild.value;
        const endpoint = "/api/bridges/" + selected + "/learn/" + device.id;
        try {
            await catalogRequest(endpoint, "POST", {
                name: nameElem.lastElementChild.value,
                receive: canChooseDirection && directionElem.lastElementChild.value === "receive",
                transmit: isPowerDevice && directionElem.lastElementChild.value === "transmit",
                slot: Number(slotsElem.lastElementChild.value)
            });
            if (isClosed) {
                await catalogRequest(endpoint, "DELETE");
                return;
            }
            url = endpoint;
            retryBtnElem.disabled = false;
            await poll();
        } catch (error) {
            statusElem.textContent = error.message;
            startBtnElem.disabled = false;
        } finally {
            cancelBtnElem.disabled = false;
        }
    }

    const startBtnElem = catalogButton(TEXT_BRIDGE_START, startLearning);
    startBtnElem.disabled = !bridges.length;
    const retryBtnElem = catalogButton(TEXT_BRIDGE_RETRY, async () => {
        if (await cancelLearning()) await startLearning();
    });
    retryBtnElem.disabled = true;
    const cancelBtnElem = catalogButton(TEXT_CATALOG_CANCEL, async () => {
        if (await cancelLearning()) catalogWizard.close();
    });

    /**************************************************************************/
    /*!
        @brief    Stops polling and cancels the active firmware capture.
        @returns  boolean             Whether cancellation succeeded
    */
    /**************************************************************************/
    async function cancelLearning() {
        clearTimeout(timer);
        capture++;
        if (!url) return true;
        const endpoint = url;
        url = undefined;
        const wasReady = !saveBtnElem.disabled;
        saveBtnElem.disabled = true;
        retryBtnElem.disabled = true;
        cancelBtnElem.disabled = true;
        try {
            await catalogRequest(endpoint, "DELETE");
            progressElem.hidden = true;
            detailsElem.textContent = "";
            statusElem.textContent = "";
            renderSignals();
            return true;
        } catch (error) {
            url = endpoint;
            statusElem.textContent = error.message;
            retryBtnElem.disabled = false;
            saveBtnElem.disabled = !wasReady;
            return false;
        } finally {
            cancelBtnElem.disabled = false;
        }
    }

    /**************************************************************************/
    /*!
        @brief    Updates sample count and capture details from the bridge.
    */
    /**************************************************************************/
    async function poll() {
        const endpoint = url;
        const currentCapture = capture;
        if (!endpoint) return;
        try {
            const result = await catalogRequest(endpoint);
            if (isClosed || capture !== currentCapture) return;
            statusElem.textContent = result.message || result.state;
            progressElem.hidden = false;
            progressElem.max = result.code_count || result.required_samples || 1;
            progressElem.value = result.code_index ?? result.sample_count ?? 0;
            const frame = result.frame ?? result.codes?.[result.code_index - 1]?.frame;
            renderSignals(result.codes ?? []);
            detailsElem.textContent = [
                result.codes?.[result.code_index]?.name,
                frame?.protocol, frame?.raw_value || frame?.raw_hash
            ].filter(Boolean).join(TEXT_CATALOG_SEPARATOR);
            if (result.state === "ready") {
                saveBtnElem.disabled = false;
            } else if (["waiting", "collecting"].includes(result.state)) {
                timer = setTimeout(poll, 750);
            }
        } catch (error) {
            if (isClosed || capture !== currentCapture) return;
            statusElem.textContent = error.message;
        }
    }

    /**************************************************************************/
    /*!
        @brief    Displays the model slots and their saved or captured states.
        @param    captured            Current firmware session codes
    */
    /**************************************************************************/
    function renderSignals(captured = []) {
        const bridgeId = Number(bridgeElem.lastElementChild.value);
        const isTransmit = isPowerDevice && directionElem.lastElementChild.value === "transmit";
        slotsElem.hidden = !signals.length || (isRf && !isTransmit);
        nameElem.hidden = Boolean(signals.length);
        signalListElem.replaceChildren(...signals.map(signal => {
            const saved = (device.bridge_codes ?? []).some(code => code.bridge_id === bridgeId &&
                (isTransmit ? code.id.startsWith("p" + signal.type) : code.type === signal.type));
            const ready = captured.some(code => code.type === signal.type && code.captured);
            const status = ready ? TEXT_BRIDGE_CAPTURED : saved ? TEXT_BRIDGE_STORED : TEXT_BRIDGE_PENDING;
            return catalogElement("li", "", signal.name + TEXT_CATALOG_SEPARATOR + status);
        }));
    }

    renderSignals();
    directionElem.lastElementChild.onchange = () => renderSignals();
    bridgeElem.lastElementChild.onchange = () => renderSignals();
    /**************************************************************************/
    /*!
        @brief    Clears learning state when the wizard is dismissed.
    */
    /**************************************************************************/
    function onClose() {
        isClosed = true;
        clearTimeout(timer);
        if (url && !isSaving) catalogRequest(url, "DELETE").catch(() => {});
        catalogWizardDialogElem.removeEventListener("cancel", onCancel);
    }

    /**************************************************************************/
    /*!
        @brief    Routes Escape through the same cancellation as the button.
        @param    event               Dialog cancellation event
    */
    /**************************************************************************/
    function onCancel(event) {
        event.preventDefault();
        cancelBtnElem.click();
    }

    catalogWizardDialogElem.addEventListener("close", onClose, {once: true});
    catalogWizardDialogElem.addEventListener("cancel", onCancel);
    catalogWizard.show(TEXT_BRIDGE_LEARN, device.name, bodyElem => {
        const fieldsElem = catalogElement("div", "catalog-fields");
        fieldsElem.append(bridgeElem, directionElem, slotsElem, nameElem, signalListElem,
            startBtnElem, progressElem,
            statusElem, detailsElem);
        bodyElem.append(fieldsElem);
    }, [cancelBtnElem, retryBtnElem, saveBtnElem]);
}


/******************************************************************************/
/*!
    @brief    Updates an individual bridge card when the status probe completes.
    @param    bridge              Device entry in the current catalog
*/
/******************************************************************************/
async function refreshCatalogBridgeStatus(bridge) {
    try {
        const status = await catalogRequest("/api/bridges/" + bridge.id + "/status");
        bridge.connection_status = status.online;
    } catch {
        bridge.connection_status = false;
    }
    if (catalogDevices.includes(bridge) && catalogView === "bridges") renderCatalogCards();
}
