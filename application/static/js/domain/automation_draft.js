/****************************************************************************/
/*
 * File:    automation_draft.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Converts between saved automations, editor drafts and Flask request
 *          payloads.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    AUTOMATION_EVENT_BUTTON, AUTOMATION_EVENT_NUMERIC, AUTOMATION_EVENT_STATE,
    AUTOMATION_EVENT_TYPE_BUTTON_PRESSED
} from "./automation_constants.js";

export const AUTOMATION_NEW_ID = -1;
export const AUTOMATION_REVIEW_STEP = 4;

export const AUTOMATION_RULE_ACTION = "action";
export const AUTOMATION_RULE_CONDITION = "condition";
export const AUTOMATION_RULE_TRIGGER = "trigger";

export const AUTOMATION_UI_ACTION_ADD_ACTION = "add-action";
export const AUTOMATION_UI_ACTION_ADD_TRIGGER = "add-trigger";
export const AUTOMATION_UI_ACTION_ADD_CONDITION = "add-condition";
export const AUTOMATION_UI_ACTION_DELETE = "delete";
export const AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN = "move-action-down";
export const AUTOMATION_UI_ACTION_MOVE_ACTION_UP = "move-action-up";
export const AUTOMATION_UI_ACTION_NEXT = "next";
export const AUTOMATION_UI_ACTION_PREVIOUS = "previous";
export const AUTOMATION_UI_ACTION_REMOVE_PREFIX = "remove-";
export const AUTOMATION_UI_ACTION_SAVE = "save";

export const DEFAULT_AUTOMATION_COLOR = "#ffffff";

export const INPUT_TYPE_COLOR = "color";
export const INPUT_TYPE_NUMBER = "number";
export const INPUT_TYPE_TEXT = "text";
export const INPUT_TYPE_TIME = "time";

export const NOTICE_TYPE_INFO = "info";
export const NOTICE_TYPE_SUCCESS = "success";
export const NOTICE_TYPE_WARNING = "warning";

/****************************************************************************/
/*!
 * @brief   Static class for a block of specialized adapter functions.
 */
/****************************************************************************/
export class AutomationDraftAdapter {
    /****************************************************************************/
    /*!
     * @brief   Creates a unique identifier for a draft rule.
     * @returns Unique draft rule identifier
     */
    /****************************************************************************/
    static createId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a trigger with default draft values.
     * @returns Trigger draft
     */
    /****************************************************************************/
    static createTrigger() {
        return {
            id: this.createId(),
            kind: "device",
            source_type: "device",
            source_id: "",
            event: "state",
            operator: "equals",
            state: "",
            group_match: "any_member",
            time: "07:00",
            days: []
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a condition with default draft values.
     * @returns Condition draft
     */
    /****************************************************************************/
    static createCondition() {
        return {
            id: this.createId(),
            type: "time_window",
            source_type: "device",
            source_id: "",
            operator: "equals",
            value: "",
            start_time: "22:00",
            end_time: "07:00",
            active_in_window: true
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an action with default draft values.
     * @returns Action draft
     */
    /****************************************************************************/
    static createAction() {
        return {
            id: this.createId(),
            type: "set_device_power",
            target_type: "device",
            target_ids: [],
            parameters: { power: 0 },
            duration_minutes: 5
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an empty automation draft.
     * @returns Automation draft
     */
    /****************************************************************************/
    static createEmpty() {
        return {
            id: -1,
            name: "",
            enabled: true,
            trigger_match: "any",
            triggers: [this.createTrigger()],
            conditions: [],
            actions: [this.createAction()],
            concurrency_policy: "restart",
            error_policy: "stop"
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an editable draft from an automation.
     * @param   automation              Automation returned by the API
     * @returns Editable automation draft
     */
    /****************************************************************************/
    static fromAutomation(automation) {
        const draft = this.createEmpty();

        Object.assign(draft, {
            id: automation.id,
            name: automation.name,
            enabled: automation.enabled,
            trigger_match: automation.trigger_match ?? "any",
            concurrency_policy: automation.concurrency_policy ?? "restart",
            error_policy: automation.error_policy ?? "stop",
            triggers: (automation.triggers ?? []).map(item => this.fromTrigger(item)),
            conditions: (automation.conditions ?? []).map(item => this.fromCondition(item)),
            actions: (automation.actions ?? []).map(item => this.fromAction(item))
        });

        if (!draft.triggers.length) draft.triggers.push(this.createTrigger());
        if (!draft.actions.length) draft.actions.push(this.createAction());

        return draft;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a trigger draft from an API trigger.
     * @param   item                    Normalized API trigger
     * @returns Trigger draft
     */
    /****************************************************************************/
    static fromTrigger(item) {
        const result = this.createTrigger();
        const config = item.configuration ?? {};

        result.source_type = item.source_type ?? "device";
        result.source_id = item.source_id ?? "";
        result.operator = config.operator ?? "equals";
        result.group_match = config.group_match ?? "any_member";

        if (item.type == "time") {
            Object.assign(result, { kind: "time", time: config.time, days: config.days ?? [] });
        } else if (item.type == "automation.manual_run") {
            Object.assign(result, { kind: "manual", event: "manual" });
        } else if (item.type == "rf.code_received") {
            Object.assign(result, { kind: "signal", event: "rf_received", state: config.code });
        } else {
            if (item.type == AUTOMATION_EVENT_TYPE_BUTTON_PRESSED) {
                result.event = AUTOMATION_EVENT_BUTTON;
            } else if (config.value != undefined) {
                result.event = AUTOMATION_EVENT_NUMERIC;
            } else {
                result.event = AUTOMATION_EVENT_STATE;
            }

            result.button_id = config.button_id ?? "";
            result.state = config.press_type ?? config.value ?? config.state ?? "";
        }

        return result;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a condition draft from an API condition.
     * @param   item                    Normalized API condition
     * @returns Condition draft
     */
    /****************************************************************************/
    static fromCondition(item) {
        const result = this.createCondition();
        const config = item.configuration ?? {};

        result.type = item.type;

        if (item.type == "time_window") {
            result.start_time = this.minutesToTime(config.start_minutes);
            result.end_time = this.minutesToTime(config.end_minutes ?? 1439);
            result.active_in_window = config.active_in_window ?? true;
        } else {
            Object.assign(result, {
                source_type: config.source_type ?? "device",
                source_id: config.source_id ?? "",
                operator: config.operator ?? "equals",
                value: config.value ?? ""
            });
        }

        return result;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an action draft from an API action.
     * @param   item                    Normalized API action
     * @returns Action draft
     */
    /****************************************************************************/
    static fromAction(item) {
        const result = this.createAction();
        const config = item.configuration ?? {};

        Object.assign(result, {
            type: item.type,
            target_type: config.target_type ?? "device",
            target_ids: config.target_ids ?? [],
            parameters: { ...(config.parameters ?? {}) },
            duration_minutes: config.duration_minutes ?? 5
        });

        if (item.type === "command" && ["rf.send", "ir.send"].includes(config.capability)) {
            result.type = "send_button";
            result.parameters.capability = config.capability;
        }

        return result;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an API payload from an automation draft.
     * @param   draft                   Automation draft
     * @returns Normalized automation payload
     */
    /****************************************************************************/
    static toApiPayload(draft) {
        return {
            id: draft.id,
            name: draft.name.trim(),
            enabled: Boolean(draft.enabled),
            trigger_match: draft.trigger_match,
            concurrency_policy: draft.concurrency_policy,
            error_policy: draft.error_policy,
            triggers: draft.triggers.map(item => this.normalizeTrigger(item)),
            conditions: draft.conditions.map(item => this.normalizeCondition(item)),
            actions: draft.actions.map(item => this.normalizeAction(item))
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Normalizes a trigger draft for the API.
     * @param   item                    Trigger draft
     * @returns Normalized trigger
     */
    /****************************************************************************/
    static normalizeTrigger(item) {
        if (item.kind == "time") {
            return {
                type: "time",
                source_type: "system",
                source_id: null,
                configuration: { days: item.days.map(Number), time: item.time }
            };
        }

        if (item.kind == "manual") {
            return {
                type: "automation.manual_run",
                source_type: "account",
                source_id: null,
                configuration: {}
            };
        }

        if (item.kind == "signal") {
            return {
                type: "rf.code_received",
                source_type: item.source_type,
                source_id: Number(item.source_id),
                configuration: { code: item.state }
            };
        }

        const configuration = { operator: item.operator, group_match: item.group_match };

        if (item.event == "button") {
            if (item.button_id) configuration.button_id =
                item.button_id;
            else configuration.press_type =
                item.state;
        } else if (item.event == "numeric") configuration.value =
            Number(item.state);
        else configuration.state =
            Number(item.state);

        return {
            type: item.event == "button" ? "button.pressed" : "device.state_changed",
            source_type: item.source_type,
            source_id: Number(item.source_id),
            configuration
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Normalizes a condition draft for the API.
     * @param   item                    Condition draft
     * @returns Normalized condition
     */
    /****************************************************************************/
    static normalizeCondition(item) {
        if (item.type == "time_window") {
            return {
                type: item.type,
                configuration: {
                    start_minutes: this.timeToMinutes(item.start_time),
                    end_minutes: this.timeToMinutes(item.end_time),
                    active_in_window: item.active_in_window
                }
            };
        }

        return {
            type: item.type,
            configuration: {
                source_type: item.source_type,
                source_id: Number(item.source_id),
                operator: item.operator,
                value: item.value
            }
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Normalizes an action draft for the API.
     * @param   item                    Action draft
     * @returns Normalized action
     */
    /****************************************************************************/
    static normalizeAction(item) {
        if (item.type === "send_button") {
            return {
                type: "command",
                configuration: {
                    capability: item.parameters.capability,
                    target_type: "device",
                    target_ids: item.target_ids.map(Number),
                    parameters: { code_id: item.parameters.code_id }
                }
            };
        }
        if (item.type === "wait") {
            return {
                type: item.type,
                configuration: { duration_minutes: Number(item.duration_minutes) }
            };
        }

        return {
            type: item.type,
            configuration: {
                target_type: item.target_type,
                target_ids: item.target_ids.map(Number),
                parameters: { ...item.parameters }
            }
        };
    }

    /****************************************************************************/
    /*!
     * @brief   Converts a time string to minutes after midnight.
     * @param   value                   Time formatted as HH:MM
     * @returns Minutes after midnight
     */
    /****************************************************************************/
    static timeToMinutes(value) {
        const [hours, minutes] = String(value).split(":").map(Number);

        return hours * 60 + minutes;
    }

    /****************************************************************************/
    /*!
     * @brief   Converts minutes after midnight to a time string.
     * @param   value                   Minutes after midnight
     * @returns Time formatted as HH:MM
     */
    /****************************************************************************/
    static minutesToTime(value = 0) {
        return String(Math.floor(value / 60)).padStart(2, "0")
            + ":"
            + String(value % 60).padStart(2, "0");
    }
}
