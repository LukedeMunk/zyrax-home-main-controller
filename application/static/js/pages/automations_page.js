/****************************************************************************/
/*
 * File:    automations_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for automations.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { AutomationTile } from "../ui_components/tiles/AutomationTile.js";
import { AddTile } from "../ui_components/tiles/AddTile.js";
import { TILE_SIZE_2X2 } from "../domain/dashboard_tiles.js";
import {
    TEXT_ADD_AUTOMATION, TEXT_AUTOMATION_MANUAL, TEXT_AUTOMATION_MISSING_SOURCE,
    TEXT_AUTOMATION_NOT_CONFIGURED, TEXT_CANCEL, TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_DELETE,
    TEXT_ERROR, TEXT_ITEM_ADDED_SUCCESSFULLY, TEXT_Q_ARE_YOU_SURE, TEXT_Q_DELETE_AUTOMATION,
    TEXT_SUCCESS
} from "../domain/language_pack_english.js";
import { mountPage, readPageData } from "../core/page.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import { AutomationModal } from "../ui_components/AutomationModal.js";
import { saveAutomation, removeAutomation, setEnabled } from "../services/automations.js";

const AUTOMATION_ICONS = [{
    action: "set_device_power",
    icon: "fa-duotone fa-solid fa-power-off fa-lg"
}, { action: "set_ledstrip_color", icon: "fa-duotone fa-solid fa-palette fa-lg" }, {
    action: "set_ledstrip_mode",
    icon: "fa-duotone fa-solid fa-wand-magic-sparkles fa-lg"
}];
let { automations, devices, groups, actions, modes, models } = readPageData();
const { http, banners, signal, components } = mountPage("automations");
const tiles = [];

signal.addEventListener("abort", clearTiles, { once: true });

const root = document.getElementById("automationContainer");
const stack = new ModalStack();
const editor = new AutomationModal(document.querySelector('[data-ref="automation-editor"]'), {
    stack,
    models,

    getAutomations: () => automations,
    getDevices: () => devices,
    getGroups: () => groups,
    getActions: () => actions,
    getModes: () => modes,
    submitFunction: save,
    deleteFunction: remove
}).mount();

components.push(stack, editor);
render();

/****************************************************************************/
/*!
 * @brief   Saves an automation, refreshes its tiles and closes the editor.
 * @param   id                      Identifier of the affected item.
 * @param   data                    Configuration sent to the controller.
 */
/****************************************************************************/
async function save(id, data) {
    try {
        const result = await saveAutomation(http, id, data, signal);
        automations = result.automations;
        editor.finishSave(id === -1 ? result.id : id);
        render();
        banners.show({
            title: TEXT_SUCCESS,
            message: id === -1 ? TEXT_ITEM_ADDED_SUCCESSFULLY : TEXT_CHANGES_SAVED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        editor.setErrorMessage(error.message);
    }
}

/****************************************************************************/
/*!
 * @brief   Confirms automation deletion and refreshes the displayed tiles.
 * @param   id                      Identifier of the affected item.
 */
/****************************************************************************/
async function remove(id) {
    if (!(await editor.confirmation.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: TEXT_Q_DELETE_AUTOMATION,
        type: "warning",
        confirmLabel: TEXT_DELETE,
        cancelLabel: TEXT_CANCEL
    }))) return;

    try {
        await removeAutomation(http, id, signal);
        automations = automations.filter(item => item.id !== id);
        editor.close(true);
        render();
    } catch (error) {
        editor.setErrorMessage(error.message);
    }
}

/****************************************************************************/
/*!
 * @brief   Destroys the mounted automation tiles before rebuilding them.
 */
/****************************************************************************/
function clearTiles() {
    for (const tile of tiles.splice(0)) tile.destroy();
}

/****************************************************************************/
/*!
 * @brief   Renders the component controls from its current state.
 */
/****************************************************************************/
function render() {
    clearTiles();

    for (const item of automations) {
        const action = item.actions?.find(action => action.type !== "wait");
        const trigger = item.triggers?.[0];
        const subtitle = getAutomationSubtitle(item);
        const tile = new AutomationTile(document.createElement("div"), {
            id: item.id,
            title: item.name,
            size: TILE_SIZE_2X2,
            subtitle1: subtitle,
            subtitle2: action?.type ?? TEXT_AUTOMATION_NOT_CONFIGURED,
            icons: [{ icon: getIconFromNormalizedTrigger(trigger), title: subtitle }, {
                icon: getIconFromAction(action?.type),
                title: action?.type ?? TEXT_AUTOMATION_NOT_CONFIGURED
            }],
            checkboxValue: item.enabled,
            enableFunction: event => toggleEnabled(item, event.currentTarget),
            onclickFunction: () => editor.open(item.id)
        });

        tiles.push(tile.mount());
    }

    const add = new AddTile(document.createElement("div"), {
        title: TEXT_ADD_AUTOMATION,

        /****************************************************************************/
        /*!
         * @brief   Runs the selection action associated with this tile.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        onclickFunction: () => editor.open()
    }).mount();
    tiles.push(add);
    root.replaceChildren(...tiles.map(tile => tile.root));
}

/****************************************************************************/
/*!
 * @brief   Updates an automation enabled state and restores the input on failure.
 * @param   item                    Item in the current collection.
 * @param   input                   Initial value or native input control.
 */
/****************************************************************************/
async function toggleEnabled(item, input) {
    input.disabled = true;

    try {
        await setEnabled(http, item.id, input.checked, signal);
        item.enabled = input.checked;
    } catch (error) {
        input.checked = item.enabled;
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });
    } finally {
        input.disabled = false;
    }
}

/****************************************************************************/
/*!
 * @brief   Returns a readable summary of the first automation trigger.
 * @param   automation              Automation definition to summarize.
 * @returns a readable summary of the first automation trigger.
 */
/****************************************************************************/
function getAutomationSubtitle(automation) {
    const trigger = automation.triggers?.[0];

    if (!trigger) return TEXT_AUTOMATION_NOT_CONFIGURED;
    if (trigger.type == "time") return trigger.configuration.time;
    if (trigger.type == "automation.manual_run") return TEXT_AUTOMATION_MANUAL;

    const sources = trigger.source_type == "group" ? groups : devices;

    return sources.find(item => item.id == trigger.source_id)?.name
        ?? TEXT_AUTOMATION_MISSING_SOURCE;
}

/****************************************************************************/
/*!
 * @brief   Returns the icon associated with an automation action type.
 * @param   action                  Action type or visible action label.
 * @returns The icon associated with an automation action type.
 */
/****************************************************************************/
function getIconFromAction(action) {
    for (let icon of AUTOMATION_ICONS) {
        if (icon.action == action) {
            return icon.icon;
        }
    }

    return "";
}

/****************************************************************************/
/*!
 * @brief   Returns the icon associated with a normalized trigger.
 * @param   trigger                 Normalized automation trigger.
 * @returns The icon associated with a normalized trigger.
 */
/****************************************************************************/
function getIconFromNormalizedTrigger(trigger) {
    if (trigger?.type == "time") return "fa-duotone fa-solid fa-clock";
    if (trigger?.type == "button.pressed") return "fa-duotone fa-solid fa-light-switch";
    if (trigger?.type == "rf.code_received") return "fa-duotone fa-solid fa-signal-stream";

    return "fa-duotone fa-solid fa-bolt";
}
