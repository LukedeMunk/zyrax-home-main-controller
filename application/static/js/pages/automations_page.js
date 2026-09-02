/******************************************************************************/
/*
 * File:    automations_page.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   JavaScript for the automations page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */

/* Fields */

/* Buttons */

/* Icons */

/* Input elements */

/* Tables */

/* Modals */

/* Other */

const automationContainerElem = document.getElementById("automationContainer");
//#endregion

//#region Constants
//#endregion

//#region Variables
let automationTileObjects = [];
//#endregion

//#region Objects
const automationModalObject = new AutomationModal({
    id: "automationModal",
    getAutomations: () => automations,
    getDevices: () => devices,
    getGroups: () => groups,
    getActions: () => actions,
    getModes: () => modes,
    submitFunction: (id, data) => saveAutomationConfiguration(id, data),
    deleteFunction: (id) => deleteAutomation(id)
});
//#endregion

//#region Event listeners
document.addEventListener("automationChanged", (e) => {
    loadAutomationTiles();
});
//#endregion

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();
    loadAutomationTiles();
    
    automationModalObject.render();

    /* Get names of selected group or device */
    //for (let automation of automations) {
    //    automation.device = devices[getIndexFromId(devices, automation.device)].name;
    //}
});

//#region Tile generation
/******************************************************************************/
/*!
    @brief  Generates the automation tiles.
*/
/******************************************************************************/
function loadAutomationTiles() {
    automationContainerElem.innerHTML = "";

    automationTileObjects = [];

    /* Automation tiles */
    for (let automation of automations) {
        const trigger = automation.triggers?.[0];
        const action = automation.actions?.find((item) => item.type != "wait");
        const icons = [
            {
                id: "triggerIcon" + automation.id,
                icon: getIconFromNormalizedTrigger(trigger)
            },
            {
                id: "actionIcon" + automation.id,
                icon: getIconFromAction(action?.type),
                title: action?.type ?? TEXT_AUTOMATION_NOT_CONFIGURED
            },
        ];

        const tileObject = new AutomationTile({
                id: automation.id,
                title: automation.name,
                subtitle1: getAutomationSubtitle(automation),
                subtitle2: action?.type ?? TEXT_AUTOMATION_NOT_CONFIGURED,
                icons: icons,
                size: TILE_SIZE_2X2,
                checkboxValue: automation.enabled,
                enableFunction: () => toggleAutomationEnabled(automation.id),
                onclickFunction: () => loadAutomationModal(event, automation.id)
            });

        automationTileObjects.push(tileObject);
        automationContainerElem.appendChild(tileObject.render());
    }

    new AddTile({
        containerElement: automationContainerElem,
        title: TEXT_ADD_AUTOMATION,
        onclickFunction: loadAutomationModal
    }).render();
}
/******************************************************************************/
/*!
    @brief  XXX
*/
/******************************************************************************/
function getAutomationSubtitle(automation) {
    const trigger = automation.triggers?.[0];

    if (!trigger) return TEXT_AUTOMATION_NOT_CONFIGURED;
    if (trigger.type == "time") return trigger.configuration.time;
    if (trigger.type == "automation.manual_run") return TEXT_AUTOMATION_MANUAL;

    const sources = trigger.source_type == "group" ? groups : devices;
    return sources.find((item) => item.id == trigger.source_id)?.name ?? TEXT_AUTOMATION_MISSING_SOURCE;
}
//#endregion

//#region Getters
/******************************************************************************/
/*!
    @brief  Returns the icon of the specified action.
    @return string              Classname of the icon
*/
/******************************************************************************/
function getIconFromAction(action) {
    for (let icon of AUTOMATION_ICONS) {
        if (icon.action == action) {
            return icon.icon;
        }
    }

    return "";
}

/******************************************************************************/
/*!
    @brief  Returns the icon of the specified trigger.
    @return string              Classname of the icon
*/
/******************************************************************************/
function getIconFromNormalizedTrigger(trigger) {//TODO make as constant
    if (trigger?.type == "time") return "fa-duotone fa-solid fa-clock";
    if (trigger?.type == "button.pressed") return "fa-duotone fa-solid fa-light-switch";
    if (trigger?.type == "rf.code_received") return "fa-duotone fa-solid fa-signal-stream";

    return "fa-duotone fa-solid fa-bolt";
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
}
//#endregion


//#endregion
