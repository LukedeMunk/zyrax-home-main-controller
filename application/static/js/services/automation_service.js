/******************************************************************************/
/*
 * File:    automation_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for automations.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Automation trigger types
const AUTOMATION_TRIGGER_DEVICE = "device";
const AUTOMATION_TRIGGER_MANUAL = "manual";
const AUTOMATION_TRIGGER_SIGNAL = "signal";
const AUTOMATION_TRIGGER_TIME = "time";
//#endregion

//#region Automation source and target types
const AUTOMATION_REFERENCE_ACCOUNT = "account";
const AUTOMATION_REFERENCE_BRIDGE = "bridge";
const AUTOMATION_REFERENCE_DEVICE = "device";
const AUTOMATION_REFERENCE_GROUP = "group";
const AUTOMATION_REFERENCE_SYSTEM = "system";
//#endregion

//#region Automation trigger events
const AUTOMATION_EVENT_BUTTON = "button";
const AUTOMATION_EVENT_MANUAL = "manual";
const AUTOMATION_EVENT_NUMERIC = "numeric";
const AUTOMATION_EVENT_RF_RECEIVED = "rf_received";
const AUTOMATION_EVENT_STATE = "state";
const AUTOMATION_EVENT_TIME = "time";
//#endregion

//#region Normalized automation event types
const AUTOMATION_EVENT_TYPE_BUTTON_PRESSED = "button.pressed";
const AUTOMATION_EVENT_TYPE_DEVICE_STATE_CHANGED = "device.state_changed";
const AUTOMATION_EVENT_TYPE_MANUAL_RUN = "automation.manual_run";
const AUTOMATION_EVENT_TYPE_RF_CODE_RECEIVED = "rf.code_received";
const AUTOMATION_EVENT_TYPE_TIME = "time";
//#endregion

//#region Automation operators
const AUTOMATION_OPERATOR_EQUALS = "equals";
const AUTOMATION_OPERATOR_GREATER_THAN = "greater_than";
const AUTOMATION_OPERATOR_LESS_THAN = "less_than";
const AUTOMATION_OPERATOR_NOT_EQUALS = "not_equals";
//#endregion

//#region Automation group matching
const AUTOMATION_GROUP_MATCH_ALL_MEMBERS = "all_members";
const AUTOMATION_GROUP_MATCH_ANY_MEMBER = "any_member";
//#endregion

//#region Automation trigger matching
const AUTOMATION_TRIGGER_MATCH_ALL = "all";
const AUTOMATION_TRIGGER_MATCH_ANY = "any";
//#endregion

//#region Automation conditions
const AUTOMATION_CONDITION_DEVICE_STATE = "device_state";
const AUTOMATION_CONDITION_NUMERIC = "numeric";
const AUTOMATION_CONDITION_TIME_WINDOW = "time_window";
//#endregion

//#region Automation actions
const AUTOMATION_ACTION_CAMERA_RECORD = "camera_record";
const AUTOMATION_ACTION_SEND_IR = "send_ir";
const AUTOMATION_ACTION_SEND_RF = "send_rf";
const AUTOMATION_ACTION_SET_DEVICE_POWER = "set_device_power";
const AUTOMATION_ACTION_SET_LEDSTRIP_COLOR = "set_ledstrip_color";
const AUTOMATION_ACTION_SET_LEDSTRIP_MODE = "set_ledstrip_mode";
const AUTOMATION_ACTION_WAIT = "wait";
//#endregion

//#region Automation concurrency policies
const AUTOMATION_CONCURRENCY_PARALLEL = "parallel";
const AUTOMATION_CONCURRENCY_RESTART = "restart";
const AUTOMATION_CONCURRENCY_SINGLE = "single";
//#endregion

//#region Automation error policies
const AUTOMATION_ERROR_CONTINUE = "continue";
const AUTOMATION_ERROR_STOP = "stop";
//#endregion

//#region Automation button events
const AUTOMATION_BUTTON_DOUBLE_PRESS = "double_press";
const AUTOMATION_BUTTON_HOLD = "hold";
const AUTOMATION_BUTTON_RELEASE = "release";
const AUTOMATION_BUTTON_SHORT_PRESS = "short_press";
//#endregion

/******************************************************************************/
/*!
    @brief  Loads the automation modal.
    @param  event               Mouse event
    @param  id                  Automation ID
*/
/******************************************************************************/
function loadAutomationModal(event, id=undefined) {
    if (event?.target?.closest?.(".switch")) return;
    automationModalObject.open(id);
}

/******************************************************************************/
/*!
    @brief  Saves the automation
    @param  id                  Automation ID
    @param  id, data            Automation data
*/
/******************************************************************************/
async function saveAutomationConfiguration(id, data) {
    const newAutomation = id == -1;
    const endpoint = newAutomation ? "/add_automation" : "/update_automation";
    const result = await httpPostRequestJsonReturn(endpoint, data, true);

    if (result.status_code != HTTP_CODE_OK) {
        automationModalObject.setErrorMessage(result.message);
        return;
    }

    data.id = newAutomation ? result.message.id : id;
    automations = result.message.automations;

    banners.show(
        TEXT_SUCCESS,
        newAutomation ? TEXT_ITEM_ADDED_SUCCESSFULLY : TEXT_CHANGES_SAVED_SUCCESSFULLY,
        MESSAGE_TYPE_SUCCESS
    );

    automationModalObject.finishSave(data.id);
    document.dispatchEvent(new CustomEvent("automationChanged", {
        detail: {id: data.id, action: newAutomation ? "add" : "update"}
    }));
}

/******************************************************************************/
/*!
    @brief  XXX
*/
/******************************************************************************/
function deleteAutomationConfirm() {
    return new Promise((resolve) => {
        popups.show(
            TEXT_Q_ARE_YOU_SURE,
            TEXT_Q_DELETE_AUTOMATION,
            [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)],
            MESSAGE_TYPE_WARNING
        );
    });
}

/******************************************************************************/
/*!
    @brief  XXX
*/
/******************************************************************************/
async function deleteAutomation(id) {
    if (await deleteAutomationConfirm() == CHOICE_OPTION_CANCEL) return;
    
    const result = await httpPostRequestErrorBanner("/delete_automation", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    automations.splice(getIndexFromId(automations, id), 1);
    automationModalObject.close(true);

    document.dispatchEvent(new CustomEvent("automationChanged", {
        detail: {id: id, action: "delete"}
    }));
}

/******************************************************************************/
/*!
    @brief  XXX
*/
/******************************************************************************/
async function toggleAutomationEnabled(id) {
    const automation = automations[getIndexFromId(automations, id)];
    automation.enabled = !automation.enabled;

    await httpPostRequestErrorBanner("/set_automation_enabled", {
        id: id,
        enabled: +automation.enabled
    });
}

/******************************************************************************/
/*!
    @brief  XXX
*/
/******************************************************************************/
async function runAutomation(id, source="manual") {
    const data = {id: id, source: source};
    const result = await httpPostRequestErrorBanner("/run_automation", data, true);

    if (result.status_code == HTTP_CODE_OK) {
        if (result.message.status == "failed") {
            banners.show(
                TEXT_SERVER_ERROR,
                TEXT_ERROR + ": " + result.message.error,
                MESSAGE_TYPE_ERROR
            );
        } else {
            const automation = automations[getIndexFromId(automations, id)];
            banners.show(TEXT_SUCCESS, automation.name, MESSAGE_TYPE_SUCCESS);
        }
    }

    return result;
}
