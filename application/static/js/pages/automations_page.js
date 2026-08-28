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
const automationModalElem = document.getElementById("automationModal");

/* Other */

const automationContainerElem = document.getElementById("automationContainer");
//#endregion

//#region Constants
//#endregion

//#region Variables
let lastMouseButtonPressed;
let automationTileObjects = [];
//#endregion

//#region Objects
const automationModalObject = new MultiStepModalForm(AUTOMATION_MODAL_CONFIGURATION);
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
    automationModalObject.setSelectOptions("ledstripModeSelect", getLedstripModeSelectOptions());
    automationModalObject.setTileSelectOptions("automationTargetDevicesTileSelect", getTargetDeviceTileSelectOptions());
    automationModalObject.setSelectOptions("automationTriggerStateSelect", getTriggerSensorStateOptions());

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
        const icons = [
            {
                id: "triggerIcon" + automation.id,
                icon: getIconFromTrigger(automation.trigger)
            },
            {
                id: "actionIcon" + automation.id,
                icon: getIconFromAction(automation.action),
                title: VAR_TEXT_AUTOMATION_ACTION(automation.action)
            },
        ];

        if (automation.inverted_automation_copy_id !== -1) {
            icons.push({
                id: "invertedIcon" + automation.id,
                icon: "fa-solid fa-book-copy",
                title: TEXT_INVERTED_AUTOMATION_ENABLED
            });
        }

        const tileObject = new AutomationTile({
                id: automation.id,
                title: automation.name,
                subtitle1: getAutomationSubtitle(automation),
                subtitle2: VAR_TEXT_AUTOMATION_ACTION(automation.action),
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

function getAutomationSubtitle(automation) {
    let subtitle;

    if (automation.trigger === AUTOMATION_TRIGGER_TIMER) {
        subtitle = automation.time;

        if (automation.inverted_automation_copy_id !== -1) {
            subtitle += " | " + automation.inverted_action_time;
        }

        return subtitle;
    }

    if (automation.time_window_activated) {
        if (automation.activate_during_time_window) {
            subtitle =
                minutesToHourString(automation.time_window_start_minutes) +
                " | " +
                minutesToHourString(automation.time_window_end_minutes);
        } else {
            subtitle =
                minutesToHourString(automation.time_window_end_minutes) +
                " | " +
                minutesToHourString(automation.time_window_start_minutes);
        }

        return subtitle;
    }
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
function getIconFromTrigger(trigger) {
    for (let icon of TRIGGER_TYPE_ICONS) {
        if (icon.triggerType == trigger) {
            return icon.icon;
        }
    }

    return "";
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


/******************************************************************************/
/*!
    @brief  Returns the time string of the specified minutes.
    @param  minutes             Minutes (from 00:00)
    @return string              Hour string (hh:mm)
*/
/******************************************************************************/
function minutesToHourString(minutes) {
    let hours = Math.floor(minutes / 60);
    minutes %= 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

/******************************************************************************/
/*!
    @brief  Returns the number of minutes of the specified time string.
    @param  hourString          Hour string (hh:mm)
    @return                     Minutes (from 00:00)
*/
/******************************************************************************/
function hourStringToMinutes(hourString) {
    const [hours, minutes] = hourString.split(":").map(Number);
    return hours * 60 + minutes;
}
//#endregion