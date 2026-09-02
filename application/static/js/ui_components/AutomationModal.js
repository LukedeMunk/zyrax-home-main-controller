/******************************************************************************/
/*
 * File:    AutomationModal.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Automation-specific, normalized automation wizard.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
const AUTOMATION_NEW_ID = -1;
const AUTOMATION_REVIEW_STEP = 4;

const AUTOMATION_RULE_ACTION = "action";
const AUTOMATION_RULE_CONDITION = "condition";
const AUTOMATION_RULE_TRIGGER = "trigger";

const AUTOMATION_UI_ACTION_ADD_ACTION = "add-action";
const AUTOMATION_UI_ACTION_ADD_TRIGGER  = "add-trigger";
const AUTOMATION_UI_ACTION_ADD_CONDITION = "add-condition";
const AUTOMATION_UI_ACTION_DELETE = "delete";
const AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN = "move-action-down";
const AUTOMATION_UI_ACTION_MOVE_ACTION_UP = "move-action-up";
const AUTOMATION_UI_ACTION_NEXT = "next";
const AUTOMATION_UI_ACTION_PREVIOUS = "previous";
const AUTOMATION_UI_ACTION_REMOVE_PREFIX = "remove-";
const AUTOMATION_UI_ACTION_SAVE = "save";

const DEFAULT_AUTOMATION_COLOR = "#ffffff";

const INPUT_TYPE_COLOR = "color";
const INPUT_TYPE_NUMBER = "number";
const INPUT_TYPE_TEXT = "text";
const INPUT_TYPE_TIME = "time";

const NOTICE_TYPE_INFO = "info";
const NOTICE_TYPE_SUCCESS = "success";
const NOTICE_TYPE_WARNING = "warning";

/******************************************************************************/
/*!
    @brief  Static class for a block of specialized adapter functions.
*/
/******************************************************************************/
class AutomationDraftAdapter {
    /******************************************************************************/
    /*!
        @brief  Creates a unique identifier for a draft rule.
        @return                     Unique draft rule identifier
    */
    /******************************************************************************/
    static createId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates a trigger with default draft values.
        @return                     Trigger draft
    */
    /******************************************************************************/
    static createTrigger() {
        return {
            id: this.createId(), kind: "device", source_type: "device", source_id: "",
            event: "state", operator: "equals", state: "", group_match: "any_member",
            time: "07:00", days: []
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates a condition with default draft values.
        @return                     Condition draft
    */
    /******************************************************************************/
    static createCondition() {
        return {
            id: this.createId(), type: "time_window", source_type: "device", source_id: "",
            operator: "equals", value: "", start_time: "22:00", end_time: "07:00",
            active_in_window: true
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates an action with default draft values.
        @return                     Action draft
    */
    /******************************************************************************/
    static createAction() {
        return {
            id: this.createId(), type: "set_device_power", target_type: "device",
            target_ids: [], parameters: {power: 0}, duration_minutes: 5
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates an empty automation draft.
        @return                     Automation draft
    */
    /******************************************************************************/
    static createEmpty() {
        return {
            id: -1, name: "", enabled: true, trigger_match: "any",
            triggers: [this.createTrigger()], conditions: [], actions: [this.createAction()],
            concurrency_policy: "restart", error_policy: "stop"
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates an editable draft from an automation.
        @param  automation          Automation returned by the API
        @return                     Editable automation draft
    */
    /******************************************************************************/
    static fromAutomation(automation) {
        const draft = this.createEmpty();

        Object.assign(draft, {
            id: automation.id,
            name: automation.name,
            enabled: automation.enabled,
            trigger_match: automation.trigger_match ?? "any",
            concurrency_policy: automation.concurrency_policy ?? "restart",
            error_policy: automation.error_policy ?? "stop",
            triggers: (automation.triggers ?? []).map((item) => this.fromTrigger(item)),
            conditions: (automation.conditions ?? []).map((item) => this.fromCondition(item)),
            actions: (automation.actions ?? []).map((item) => this.fromAction(item))
        });

        if (!draft.triggers.length) draft.triggers.push(this.createTrigger());
        if (!draft.actions.length) draft.actions.push(this.createAction());

        return draft;
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates a trigger draft from an API trigger.
        @param  item                Normalized API trigger
        @return                     Trigger draft
    */
    /******************************************************************************/
    static fromTrigger(item) {
        const result = this.createTrigger();
        const config = item.configuration ?? {};

        result.source_type = item.source_type ?? "device";
        result.source_id = item.source_id ?? "";
        result.operator = config.operator ?? "equals";
        result.group_match = config.group_match ?? "any_member";

        if (item.type == "time") {
            Object.assign(result, {kind: "time", time: config.time, days: config.days ?? []});
        } else if (item.type == "automation.manual_run") {
            Object.assign(result, {kind: "manual", event: "manual"});
        } else if (item.type == "rf.code_received") {
            Object.assign(result, {kind: "signal", event: "rf_received", state: config.code});
        } else {
            if (item.type == AUTOMATION_EVENT_TYPE_BUTTON_PRESSED) {
                result.event = AUTOMATION_EVENT_BUTTON;
            } else if (config.value != undefined) {
                result.event = AUTOMATION_EVENT_NUMERIC;
            } else {
                result.event = AUTOMATION_EVENT_STATE;
            }

            result.state = config.press_type ?? config.value ?? config.state ?? "";
        }
        return result;
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates a condition draft from an API condition.
        @param  item                Normalized API condition
        @return                     Condition draft
    */
    /******************************************************************************/
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
                source_type: config.source_type ?? "device", source_id: config.source_id ?? "",
                operator: config.operator ?? "equals", value: config.value ?? ""
            });
        }

        return result;
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates an action draft from an API action.
        @param  item                Normalized API action
        @return                     Action draft
    */
    /******************************************************************************/
    static fromAction(item) {
        const result = this.createAction();
        const config = item.configuration ?? {};

        Object.assign(result, {
            type: item.type, target_type: config.target_type ?? "device",
            target_ids: config.target_ids ?? [], parameters: {...(config.parameters ?? {})},
            duration_minutes: config.duration_minutes ?? 5
        });

        return result;
    }
    
    /******************************************************************************/
    /*!
        @brief  Creates an API payload from an automation draft.
        @param  draft               Automation draft
        @return                     Normalized automation payload
    */
    /******************************************************************************/
    static toApiPayload(draft) {
        return {
            id: draft.id, name: draft.name.trim(), enabled: Boolean(draft.enabled),
            trigger_match: draft.trigger_match,
            concurrency_policy: draft.concurrency_policy,
            error_policy: draft.error_policy,
            triggers: draft.triggers.map((item) => this.normalizeTrigger(item)),
            conditions: draft.conditions.map((item) => this.normalizeCondition(item)),
            actions: draft.actions.map((item) => this.normalizeAction(item))
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Normalizes a trigger draft for the API.
        @param  item                Trigger draft
        @return                     Normalized trigger
    */
    /******************************************************************************/
    static normalizeTrigger(item) {
        if (item.kind == "time") {
            return {
                type: "time", source_type: "system", source_id: null,
                configuration: {days: item.days.map(Number), time: item.time}
            };
        }

        if (item.kind == "manual") {
            return {
                type: "automation.manual_run", source_type: "account", source_id: null,
                configuration: {}
            };
        }

        if (item.kind == "signal") {
            return {
                type: "rf.code_received", source_type: item.source_type,
                source_id: Number(item.source_id), configuration: {code: item.state}
            };
        }

        const configuration = {operator: item.operator, group_match: item.group_match};

        if (item.event == "button") configuration.press_type = item.state;
        else if (item.event == "numeric") configuration.value = Number(item.state);
        else configuration.state = Number(item.state);
        
        return {
            type: item.event == "button" ? "button.pressed" : "device.state_changed",
            source_type: item.source_type, source_id: Number(item.source_id), configuration
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Normalizes a condition draft for the API.
        @param  item                Condition draft
        @return                     Normalized condition
    */
    /******************************************************************************/
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
                source_type: item.source_type, source_id: Number(item.source_id),
                operator: item.operator, value: item.value
            }
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Normalizes an action draft for the API.
        @param  item                Action draft
        @return                     Normalized action
    */
    /******************************************************************************/
    static normalizeAction(item) {
        if (item.type == "wait") {
            return {
                type: item.type,
                configuration: {duration_minutes: Number(item.duration_minutes)}
            };
        }

        return {
            type: item.type,
            configuration: {
                target_type: item.target_type,
                target_ids: item.target_ids.map(Number),
                parameters: {...item.parameters}
            }
        };
    }
    
    /******************************************************************************/
    /*!
        @brief  Converts a time string to minutes after midnight.
        @param  value               Time formatted as HH:MM
        @return                     Minutes after midnight
    */
    /******************************************************************************/
    static timeToMinutes(value) {
        const [hours, minutes] = String(value).split(":").map(Number);
        return hours * 60 + minutes;
    }
    
    /******************************************************************************/
    /*!
        @brief  Converts minutes after midnight to a time string.
        @param  value               Minutes after midnight
        @return                     Time formatted as HH:MM
    */
    /******************************************************************************/
    static minutesToTime(value=0) {
        return String(Math.floor(value / 60)).padStart(2, "0") + ":" +
            String(value % 60).padStart(2, "0");
    }
}

class AutomationModal {
    /******************************************************************************/
    /*!
        @brief  Creates an automation wizard.
        @param  configuration       Automation wizard configuration
        @return                     Automation wizard
    */
    /******************************************************************************/
    constructor(configuration) {
        Object.assign(this, configuration);
        this.id = configuration.id ?? "automationModal";
        this.draft = AutomationDraftAdapter.createEmpty();
        this.errors = {};
        this.currentStep = 0;
        this.highestStep = 0;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the automation wizard modal.
    */
    /******************************************************************************/
    render() {
        this.modal = new ModalForm({
            id: this.id, title: TEXT_ADD_AUTOMATION, isBigModal: true,
            allowEscapeClose: false, columns: []
        });

        this.modal.render();

        const dialog = this.modal.getDomElement();
        dialog.classList.add("automation-modal");
        dialog.querySelector(".toolbar")?.remove();
        dialog.querySelector("#" + this.id + "Description")?.remove();
        dialog.querySelector(".close-modal-button").addEventListener(
            "click", () => this.requestClose()
        );

        this.wizardElement = this.element("div", "automation-wizard");
        dialog.appendChild(this.wizardElement);
        
        this.wizardElement.addEventListener("click", (event) => this.onClick(event));
        this.wizardElement.addEventListener("input", (event) => this.onInput(event, false));
        this.wizardElement.addEventListener("change", (event) => this.onInput(event, true));
        this.renderWizard();
    }

    /******************************************************************************/
    /*!
        @brief  Opens the wizard for a new or existing automation.
        @param  id                  Automation ID, if editing
    */
    /******************************************************************************/
    open(id=undefined) {
        const automation = this.getAutomations().find((item) => item.id == id);

        if (automation) {
            this.draft = AutomationDraftAdapter.fromAutomation(automation);
        } else {
            this.draft = AutomationDraftAdapter.createEmpty();
        }

        this.initialDraft = JSON.stringify(this.draft);
        this.currentStep = 0;
        this.highestStep = 0;
        this.errors = {};
        this.modal.setTitle(automation ? TEXT_EDIT_AUTOMATION : TEXT_ADD_AUTOMATION);
        this.renderWizard();
        this.modal.show();
        this.focusFirstField();
    }

    /******************************************************************************/
    /*!
        @brief  Closes the wizard when closing is allowed.
        @param  force               Whether to skip unsaved-change protection
    */
    /******************************************************************************/
    close(force=false) {
        if (!force && this.hasChanges()) return this.requestClose();
        this.modal.close();
    }

    /******************************************************************************/
    /*!
        @brief  Finishes the UI flow after a successful save.
        @param  id                  Saved automation ID
    */
    /******************************************************************************/
    finishSave(id) {
        this.draft.id = id;
        this.initialDraft = JSON.stringify(this.draft);
        this.close(true);
    }

    /******************************************************************************/
    /*!
        @brief  Displays an error message in the modal.
        @param  message             Error message
    */
    /******************************************************************************/
    setErrorMessage(message) {
        this.modal.setErrorMessage(message);
    }

    /******************************************************************************/
    /*!
        @brief  Handles wizard click actions.
        @param  event               Click event
    */
    /******************************************************************************/
    onClick(event) {
        const button = event.target.closest("[data-automation-action]");
        if (!button) return;

        const action = button.dataset.automationAction;

        if (action == "next") return this.next();
        if (action == "previous") return this.previous();
        if (action == "step") return this.goToStep(Number(button.dataset.step));
        if (action == "save") return this.save();
        if (action == "delete") return this.deleteFunction?.(this.draft.id);

        if (action == AUTOMATION_UI_ACTION_ADD_TRIGGER) {
            const trigger = AutomationDraftAdapter.createTrigger();
            this.draft.triggers.push(trigger);
        } else if (action == AUTOMATION_UI_ACTION_ADD_CONDITION) {
            const condition = AutomationDraftAdapter.createCondition();
            this.draft.conditions.push(condition);
        } else if (action == AUTOMATION_UI_ACTION_ADD_ACTION) {
            const automationAction = AutomationDraftAdapter.createAction();
            this.draft.actions.push(automationAction);
        } else if (action.startsWith(AUTOMATION_UI_ACTION_REMOVE_PREFIX)) {
            const type = action.replace(AUTOMATION_UI_ACTION_REMOVE_PREFIX, "");
            const collection = type + "s";

            this.draft[collection] = this.draft[collection].filter((item) => {
                return item.id != button.dataset.id;
            });
        } else if (action == AUTOMATION_UI_ACTION_MOVE_ACTION_UP) {
            this.moveAction(button.dataset.id, -1);
        } else if (action == AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN) {
            this.moveAction(button.dataset.id, 1);
        }

        this.renderWizard();
    }

    /******************************************************************************/
    /*!
        @brief  Updates draft data after a field changes.
        @param  event               Input or change event
        @param  rerender            Whether to rerender the wizard
    */
    /******************************************************************************/
    onInput(event, rerender) {
        const field = event.target.dataset.field;

        if (!field) return;

        const value = event.target.type == "checkbox" ? event.target.checked : event.target.value;
        const collection = event.target.dataset.collection;

        if (!collection) {
            this.draft[field] = value;
        } else {
            const item = this.draft[collection].find((entry) => {
                return entry.id == event.target.dataset.id;
            });

            if (item) this.updateItem(item, field, value, event.target);
        }
        delete this.errors[event.target.dataset.errorKey];

        if (rerender) this.renderWizard();
    }

    /******************************************************************************/
    /*!
        @brief  Updates a draft rule field.
        @param  item                Draft rule
        @param  field               Field name
        @param  value               New field value
        @param  input               Changed input element
    */
    /******************************************************************************/
    updateItem(item, field, value, input) {
        if (["days", "target_ids"].includes(field)) {
            const option = Number(input.dataset.value);
            if (value && !item[field].map(Number).includes(option)) item[field].push(option);
            if (!value) item[field] = item[field].filter((entry) => Number(entry) != option);
            return;
        }

        if (field.startsWith("parameter_")) {
            item.parameters[field.replace("parameter_", "")] = value;
            return;
        }

        if (["true", "false"].includes(value)) {
            value = value == "true";
        }

        item[field] = value;

        if (field == "kind") {
            item.source_type = value == "signal" ? "bridge" : "device";
            item.source_id = "";
            item.state = "";
        }

        if (field == "source_type") item.source_id = "";
        if (field == "target_type") item.target_ids = [];
        if (field == "type" && this.draft.actions.includes(item)) {
            item.target_ids = [];
            item.parameters = value == "set_device_power" ? {power: 0} : {};
        }
    }

    /******************************************************************************/
    /*!
        @brief  Moves an action within the ordered action list.
        @param  id                  Action identifier
        @param  direction           Movement offset
    */
    /******************************************************************************/
    moveAction(id, direction) {
        const index = this.draft.actions.findIndex((item) => item.id == id);
        const destination = index + direction;

        if (index < 0 || destination < 0 || destination >= this.draft.actions.length) return;

        this.draft.actions.splice(destination, 0, this.draft.actions.splice(index, 1)[0]);
    }

    /******************************************************************************/
    /*!
        @brief  Moves to the next wizard step.
    */
    /******************************************************************************/
    next() {
        if (!this.validateStep(this.currentStep)) return this.showValidation();

        this.currentStep++;
        this.highestStep = Math.max(this.highestStep, this.currentStep);
        this.renderWizard();
        this.focusFirstField();
    }

    /******************************************************************************/
    /*!
        @brief  Moves to the previous wizard step.
    */
    /******************************************************************************/
    previous() {
        if (this.currentStep > 0) this.currentStep--;

        this.renderWizard();
    }

    /******************************************************************************/
    /*!
        @brief  Navigates to a wizard step.
        @param  step                Target step index
    */
    /******************************************************************************/
    goToStep(step) {
        if (step > this.highestStep + 1) return;
        if (step > this.currentStep && !this.validateStep(this.currentStep)) {
            return this.showValidation();
        }

        this.currentStep = step;
        this.highestStep = Math.max(this.highestStep, step);
        this.renderWizard();
    }

    /******************************************************************************/
    /*!
        @brief  Validates and saves the automation draft.
    */
    /******************************************************************************/
    async save() {
        this.errors = {};

        for (let step = 0; step < 4; step++) {
            if (!this.validateStep(step, false)) {
                this.currentStep = step;
                return this.showValidation();
            }
        }

        await this.submitFunction(this.draft.id, AutomationDraftAdapter.toApiPayload(this.draft));
    }

    /******************************************************************************/
    /*!
        @brief  Shows validation feedback for the current step.
    */
    /******************************************************************************/
    showValidation() {
        this.renderWizard();
        requestAnimationFrame(() => {
            this.wizardElement.querySelector("[data-error-key]")?.focus();
        });
    }

    /******************************************************************************/
    /*!
        @brief  Validates a wizard step.
        @param  step                Step index
        @param  reset               Whether to clear previous validation errors
        @return                     Whether the step is valid
    */
    /******************************************************************************/
    validateStep(step, reset=true) {
        if (reset) this.errors = {};
        if (step == 0) this.validateGeneral();
        if (step == 1) this.validateTriggers();
        if (step == 2) this.validateConditions();
        if (step == 3) this.validateActions();
        return Object.keys(this.errors).length == 0;
    }

    /******************************************************************************/
    /*!
        @brief  Validates the general automation settings.
        @return                     Whether the settings are valid
    */
    /******************************************************************************/
    validateGeneral() {
        const name = this.draft.name.trim();
        if (!name) this.errors.name = TEXT_FIELD_REQUIRED;

        if (name && typeof SYMBOL_CRITICAL_RE != "undefined" && name.match(SYMBOL_CRITICAL_RE)) {
            this.errors.name = TEXT_NO_CRITICAL_SYMBOLS;
        }

        if (this.getAutomations().some((item) => {
            return item.id != this.draft.id && item.name.toLowerCase() == name.toLowerCase();
        })) this.errors.name = TEXT_FIELD_UNIQUE;
    }

    /******************************************************************************/
    /*!
        @brief  Validates all configured triggers.
        @return                     Whether all triggers are valid
    */
    /******************************************************************************/
    validateTriggers() {
        if (!this.draft.triggers.length) this.errors.triggers = TEXT_AUTOMATION_TRIGGER_REQUIRED;

        for (const item of this.draft.triggers) {
            const invalidTime = item.kind == "time" && (!item.time || !item.days.length);
            const invalidSource = item.kind == "device" &&
                (!item.source_id || item.state === "" || !this.sourceExists(item.source_type,
                    item.source_id));
            if (invalidTime || invalidSource || item.kind == "signal") {
                this.errors["trigger-" + item.id] = item.kind == "signal" ?
                    TEXT_AUTOMATION_BRIDGE_UNAVAILABLE : TEXT_AUTOMATION_COMPLETE_TRIGGER;
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Validates all configured conditions.
        @return                     Whether all conditions are valid
    */
    /******************************************************************************/
    validateConditions() {
        for (const item of this.draft.conditions) {
            const invalidTime = item.type == "time_window" && (!item.start_time || !item.end_time);

            let invalidSource = false;

            if (item.type != AUTOMATION_CONDITION_TIME_WINDOW) {
                const hasNoSource = !item.source_id;
                const hasNoValue = item.value === "";
                const sourceDoesNotExist = !this.sourceExists(
                    item.source_type,
                    item.source_id
                );

                invalidSource = hasNoSource || hasNoValue || sourceDoesNotExist;
            }

            if (invalidTime || invalidSource) {
                this.errors["condition-" + item.id] = TEXT_AUTOMATION_COMPLETE_CONDITION;
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Validates all configured actions.
        @return                     Whether all actions are valid
    */
    /******************************************************************************/
    validateActions() {
        if (!this.draft.actions.length) this.errors.actions = TEXT_AUTOMATION_ACTION_REQUIRED;

        if (!this.draft.actions.some((item) => item.type != "wait")) {
            this.errors.actions = TEXT_AUTOMATION_EXECUTABLE_ACTION_REQUIRED;
        }

        for (const item of this.draft.actions) {
            const invalidWait = item.type == "wait" && Number(item.duration_minutes) < 1;
            const unsupported = ["send_ir", "send_rf", "camera_record"].includes(item.type);
            let invalidTarget = false;

            if (item.type != AUTOMATION_ACTION_WAIT) {
                const hasNoTargets = item.target_ids.length == 0;
                const hasMissingTarget = item.target_ids.some((id) => {
                    return !this.sourceExists(item.target_type, id);
                });

                invalidTarget = hasNoTargets || hasMissingTarget;
            }

            if (invalidWait || unsupported || invalidTarget || !this.actionCompatible(item)) {
                this.errors["action-" + item.id] = invalidWait ?
                    TEXT_AUTOMATION_WAIT_MINIMUM : TEXT_AUTOMATION_INCOMPATIBLE_ACTION;
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Checks whether the draft contains unsaved changes.
        @return                     Whether the draft has changed
    */
    /******************************************************************************/
    hasChanges() {
        return JSON.stringify(this.draft) != this.initialDraft;
    }

    /******************************************************************************/
    /*!
        @brief  Requests closing and protects unsaved changes.
    */
    /******************************************************************************/
    requestClose() {
        if (!this.hasChanges()) return this.close(true);

        popups.show(TEXT_AUTOMATION_UNSAVED_TITLE, TEXT_AUTOMATION_UNSAVED_MESSAGE, [
            {
                text: TEXT_AUTOMATION_DISCARD_CHANGES,
                onclickFunction: () => {
                    popups.close();
                    this.close(true);
                }
            },
            {text: TEXT_AUTOMATION_CONTINUE_EDITING, onclickFunction: () => popups.close()}
        ], MESSAGE_TYPE_WARNING);
    }

    /******************************************************************************/
    /*!
        @brief  Renders all visible wizard content.
    */
    /******************************************************************************/
    renderWizard() {
        if (!this.wizardElement) return;

        this.modal.resetMessage();
        const body = this.element("div", "automation-wizard-body");
        body.appendChild(this.renderStep());

        this.wizardElement.replaceChildren(this.renderProgress(), body, this.renderFooter());
    }

    /******************************************************************************/
    /*!
        @brief  Renders the wizard progress navigation.
        @return                     Progress navigation element
    */
    /******************************************************************************/
    renderProgress() {
        const labels = [
            TEXT_AUTOMATION_GENERAL, TEXT_AUTOMATION_WHEN,
            TEXT_AUTOMATION_CONDITIONS, TEXT_AUTOMATION_ACTIONS_TITLE,
            TEXT_AUTOMATION_REVIEW
        ];

        const navigation = this.element("nav", "automation-progress");
        navigation.setAttribute("aria-label", TEXT_AUTOMATION_PROGRESS);

        labels.forEach((label, index) => {
            const button = this.button(label, "step");
            button.className = "automation-progress-step";
            button.dataset.step = index;
            button.disabled = index > this.highestStep + 1;

            if (index == this.currentStep) button.classList.add("current");
            if (index < this.currentStep) button.classList.add("completed");

            button.replaceChildren(this.element("span", "", index + 1), this.element("p", "", label));
            navigation.appendChild(button);
        });

        return navigation;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the active wizard step.
        @return                     Active step element
    */
    /******************************************************************************/
    renderStep() {
        if (this.currentStep == 0) return this.renderGeneral();
        if (this.currentStep == 1) return this.renderTriggers();
        if (this.currentStep == 2) return this.renderConditions();
        if (this.currentStep == 3) return this.renderActions();

        return this.renderReview();
    }

    /******************************************************************************/
    /*!
        @brief  Renders the general settings step.
        @return                     General settings element
    */
    /******************************************************************************/
    renderGeneral() {
        const section = this.section(TEXT_AUTOMATION_GENERAL_TITLE, TEXT_AUTOMATION_GENERAL_DESCRIPTION);

        section.append(
            this.input(TEXT_NAME, "name", this.draft.name, "text", null, "name"),
            this.error("name"),
            this.checkbox(TEXT_AUTOMATION_ENABLE_IMMEDIATELY, "enabled", this.draft.enabled)
        );

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the trigger configuration step.
        @return                     Trigger step element
    */
    /******************************************************************************/
    renderTriggers() {
        const section = this.section(TEXT_AUTOMATION_WHEN_TITLE, TEXT_AUTOMATION_WHEN_DESCRIPTION);
        section.appendChild(this.error("triggers"));

        const list = this.element("div", "automation-rule-list");

        this.draft.triggers.forEach((item, index) => {
            list.appendChild(this.ruleCard("trigger", item, index, this.triggerFields(item)));
        });

        section.appendChild(list);

        if (this.draft.triggers.length > 1) {
            section.appendChild(
                    this.select(
                        TEXT_AUTOMATION_MULTIPLE_TRIGGERS,
                        "trigger_match",
                        this.draft.trigger_match,
                        [["any", TEXT_AUTOMATION_MATCH_ANY], ["all", TEXT_AUTOMATION_MATCH_ALL]]
                    )
                );
        }

        section.appendChild(this.addButton(TEXT_AUTOMATION_ADD_TRIGGER, AUTOMATION_UI_ACTION_ADD_TRIGGER));

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Renders fields for a trigger.
        @param  item                Trigger draft
        @return                     Trigger fields fragment
    */
    /******************************************************************************/
    triggerFields(item) {
        const fragment = document.createDocumentFragment();

        fragment.appendChild(
                this.select(
                    TEXT_AUTOMATION_TRIGGER_TYPE,
                    "kind",
                    item.kind,
                    [["device", TEXT_AUTOMATION_DEVICE_OR_GROUP], ["time", TEXT_TIME], ["signal", TEXT_AUTOMATION_SIGNAL], ["manual", TEXT_AUTOMATION_MANUAL]],
                    "triggers",
                    item.id
                )
            );

        if (item.kind == "manual") {
            fragment.appendChild(this.notice(TEXT_AUTOMATION_MANUAL_DESCRIPTION, "info"));
        } else if (item.kind == "signal") {
            fragment.appendChild(this.notice(TEXT_AUTOMATION_BRIDGE_UNAVAILABLE, "warning"));
        } else if (item.kind == "time") {
            fragment.append(
                this.input(TEXT_TIME, "time", item.time, "time", "triggers", null, item.id),
                this.dayField(item)
            );
        } else {
            const grid = this.element("div", "automation-field-grid");

            grid.append(
                this.select(
                    TEXT_AUTOMATION_SOURCE_TYPE,
                    "source_type",
                    item.source_type,
                    this.sourceTypeOptions(),
                    "triggers",
                    item.id
                ),
                this.select(
                    TEXT_AUTOMATION_SOURCE,
                    "source_id",
                    item.source_id,
                    this.sourceOptions(item.source_type),
                    "triggers",
                    item.id,
                    TEXT_AUTOMATION_CHOOSE_SOURCE
                ),
                this.select(
                    TEXT_AUTOMATION_EVENT,
                    "event",
                    item.event,
                    this.eventOptions(),
                    "triggers",
                    item.id
                )
            );

            if (item.source_type == "group") {
                grid.appendChild(
                    this.select(
                        TEXT_AUTOMATION_GROUP_TRIGGER_BEHAVIOUR,
                        "group_match",
                        item.group_match,
                        [["any_member", TEXT_AUTOMATION_ANY_GROUP_MEMBER], ["all_members", TEXT_AUTOMATION_ALL_GROUP_MEMBERS]],
                        "triggers", item.id
                    )
                );
            }

            if (item.event == "numeric") {
                grid.append(
                    this.select(TEXT_AUTOMATION_OPERATOR, "operator", item.operator, this.operatorOptions(true), "triggers", item.id),
                    this.input(TEXT_AUTOMATION_VALUE, "state", item.state, "number", "triggers", null, item.id)
                );
            } else {
                grid.appendChild(this.select(TEXT_AUTOMATION_VALUE, "state", item.state, this.stateOptions(item), "triggers", item.id, TEXT_AUTOMATION_CHOOSE_VALUE));
            }

            fragment.appendChild(grid);
        }

        return fragment;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the condition configuration step.
        @return                     Condition step element
    */
    /******************************************************************************/
    renderConditions() {
        const section = this.section(
            TEXT_AUTOMATION_CONDITIONS_TITLE,
            TEXT_AUTOMATION_CONDITIONS_DESCRIPTION
        );

        if (this.draft.conditions.length == 0) {
            const emptyNotice = this.notice(TEXT_AUTOMATION_CONDITIONS_OPTIONAL, NOTICE_TYPE_INFO);
            section.appendChild(emptyNotice);
        }

        const conditionList = this.element( "div", "automation-rule-list");

        for (let index = 0; index < this.draft.conditions.length; index++) {
            const condition = this.draft.conditions[index];
            const fields = this.conditionFields(condition);

            const conditionCard = this.ruleCard(
                AUTOMATION_RULE_CONDITION,
                condition,
                index,
                fields
            );

            conditionList.appendChild(conditionCard);
        }

        const addConditionButton = this.addButton(TEXT_AUTOMATION_ADD_CONDITION, AUTOMATION_UI_ACTION_ADD_CONDITION);
        section.append(conditionList, addConditionButton);
        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Renders fields for a condition.
        @param  condition           Condition draft
        @return                     Condition fields fragment
    */
    /******************************************************************************/
    conditionFields(condition) {
        const fragment = document.createDocumentFragment();
        const conditionTypeOptions = [
            [
                AUTOMATION_CONDITION_TIME_WINDOW,
                TEXT_TIME_WINDOW
            ],
            [
                AUTOMATION_CONDITION_DEVICE_STATE,
                TEXT_AUTOMATION_DEVICE_STATE
            ],
            [
                AUTOMATION_CONDITION_NUMERIC,
                TEXT_AUTOMATION_NUMERIC_VALUE
            ]
        ];

        const conditionTypeField = this.select(
            TEXT_AUTOMATION_CONDITION_TYPE,
            "type",
            condition.type,
            conditionTypeOptions,
            "conditions",
            condition.id
        );

        fragment.appendChild(conditionTypeField);

        let configurationFields;

        if (condition.type == AUTOMATION_CONDITION_TIME_WINDOW) {
            configurationFields = this.timeWindowConditionFields(condition);
        } else {
            configurationFields = this.sourceConditionFields(condition);
        }

        fragment.appendChild(configurationFields);
        return fragment;
    }

    /******************************************************************************/
    /*!
        @brief  Renders fields for a time-window condition.
        @param  condition           Time-window condition draft
        @return                     Condition fields fragment
    */
    /******************************************************************************/
    timeWindowConditionFields(condition) {
        const fieldGrid = this.element("div", "automation-field-grid");

        const startTimeField = this.input(
            TEXT_AUTOMATION_START_TIME,
            "start_time",
            condition.start_time,
            INPUT_TYPE_TIME,
            "conditions",
            null,
            condition.id
        );

        const endTimeField = this.input(
            TEXT_AUTOMATION_END_TIME,
            "end_time",
            condition.end_time,
            INPUT_TYPE_TIME,
            "conditions",
            null,
            condition.id
        );

        const windowBehaviourOptions = [
            [
                true,
                TEXT_AUTOMATION_INSIDE_WINDOW
            ],
            [
                false,
                TEXT_AUTOMATION_OUTSIDE_WINDOW
            ]
        ];

        const windowBehaviourField = this.select(
            TEXT_AUTOMATION_WINDOW_BEHAVIOUR,
            "active_in_window",
            condition.active_in_window,
            windowBehaviourOptions,
            "conditions",
            condition.id
        );

        fieldGrid.append(
            startTimeField,
            endTimeField,
            windowBehaviourField
        );

        return fieldGrid;
    }

    /******************************************************************************/
    /*!
        @brief  Renders fields for a source condition.
        @param  condition           Source condition draft
        @return                     Condition fields fragment
    */
    /******************************************************************************/
    sourceConditionFields(condition) {
        const fieldGrid = this.element("div", "automation-field-grid");

        const sourceTypeField = this.select(
            TEXT_AUTOMATION_SOURCE_TYPE,
            "source_type",
            condition.source_type,
            this.sourceTypeOptions(),
            "conditions",
            condition.id
        );

        const sourceField = this.select(
            TEXT_AUTOMATION_SOURCE,
            "source_id",
            condition.source_id,
            this.sourceOptions(condition.source_type),
            "conditions",
            condition.id,
            TEXT_AUTOMATION_CHOOSE_SOURCE
        );

        const isNumericCondition = condition.type == AUTOMATION_CONDITION_NUMERIC;

        const operatorField = this.select(
            TEXT_AUTOMATION_OPERATOR,
            "operator",
            condition.operator,
            this.operatorOptions(isNumericCondition),
            "conditions",
            condition.id
        );

        let inputType = INPUT_TYPE_TEXT;

        if (isNumericCondition) {
            inputType = INPUT_TYPE_NUMBER;
        }

        const valueField = this.input(
            TEXT_AUTOMATION_VALUE,
            "value",
            condition.value,
            inputType,
            "conditions",
            null,
            condition.id
        );

        fieldGrid.append(
            sourceTypeField,
            sourceField,
            operatorField,
            valueField
        );

        return fieldGrid;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the ordered action configuration step.
        @return                     Action step element
    */
    /******************************************************************************/
    renderActions() {
        const section = this.section(TEXT_AUTOMATION_ACTIONS_TITLE, TEXT_AUTOMATION_ACTIONS_DESCRIPTION);

        const actionsError = this.error("actions");
        section.appendChild(actionsError);

        const actionList = this.element("div", "automation-rule-list");

        for (let index = 0; index < this.draft.actions.length; index++) {
            const action = this.draft.actions[index];
            const fields = this.renderActionFields(action);

            const actionCard = this.ruleCard(
                AUTOMATION_RULE_ACTION,
                action,
                index,
                fields,
                true
            );

            actionList.appendChild(actionCard);
        }

        const addActionButton = this.addButton(TEXT_AUTOMATION_ADD_ACTION, AUTOMATION_UI_ACTION_ADD_ACTION);
        const executionFields = this.executionFields();

        section.append(
            actionList,
            addActionButton,
            executionFields
        );

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Renders fields for an action.
        @param  action              Action draft
        @return                     Action fields fragment
    */
    /******************************************************************************/
    renderActionFields(action) {
        const fragment = document.createDocumentFragment();

        const actionTypeField = this.select(
            TEXT_AUTOMATION_ACTION_TYPE,
            "type",
            action.type,
            this.actionOptions(),
            "actions",
            action.id
        );

        fragment.appendChild(actionTypeField);

        if (action.type == AUTOMATION_ACTION_WAIT) {
            const waitField = this.renderWaitActionField(action);
            fragment.appendChild(waitField);

            return fragment;
        }

        if (this.isUnavailableAction(action.type)) {
            const unavailableNotice = this.notice(TEXT_AUTOMATION_BRIDGE_UNAVAILABLE, NOTICE_TYPE_WARNING);

            fragment.appendChild(unavailableNotice);
            return fragment;
        }

        const targetTypeField = this.select(
            TEXT_AUTOMATION_TARGET_TYPE,
            "target_type",
            action.target_type,
            this.sourceTypeOptions(),
            "actions",
            action.id
        );

        const targetField = this.targetField(action);

        fragment.append(targetTypeField, targetField);

        if (action.target_type == AUTOMATION_REFERENCE_GROUP) {
            const groupNotice = this.notice(TEXT_AUTOMATION_DYNAMIC_GROUP_MEMBERSHIP, NOTICE_TYPE_INFO);
            fragment.appendChild(groupNotice);
        }

        const parameterField = this.renderActionParameterField(action);

        if (parameterField != null) {
            fragment.appendChild(parameterField);
        }

        return fragment;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the duration field for a wait action.
        @param  action              Wait action draft
        @return                     Wait duration field
    */
    /******************************************************************************/
    renderWaitActionField(action) {
        return this.input(
            TEXT_AUTOMATION_DURATION_MINUTES,
            "duration_minutes",
            action.duration_minutes,
            INPUT_TYPE_NUMBER,
            "actions",
            null,
            action.id,
            1
        );
    }

    /******************************************************************************/
    /*!
        @brief  Checks whether an action type is unavailable.
        @param  actionType          Action type
        @return                     Whether the action is unavailable
    */
    /******************************************************************************/
    isUnavailableAction(actionType) {
        const unavailableActionTypes = [
            AUTOMATION_ACTION_SEND_IR,
            AUTOMATION_ACTION_SEND_RF,
            AUTOMATION_ACTION_CAMERA_RECORD
        ];

        return unavailableActionTypes.includes(actionType);
    }

    /******************************************************************************/
    /*!
        @brief  Renders the capability parameter for an action.
        @param  action              Action draft
        @return                     Parameter field or null
    */
    /******************************************************************************/
    renderActionParameterField(action) {
        if (action.type == AUTOMATION_ACTION_SET_DEVICE_POWER) {
            return this.renderPowerActionField(action);
        }

        if (action.type == AUTOMATION_ACTION_SET_LEDSTRIP_COLOR) {
            return this.renderColorActionField(action);
        }

        if (action.type == AUTOMATION_ACTION_SET_LEDSTRIP_MODE) {
            return this.renderModeActionField(action);
        }

        return null;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the power parameter for an action.
        @param  action              Power action draft
        @return                     Power parameter field
    */
    /******************************************************************************/
    renderPowerActionField(action) {
        const powerOptions = [
            [1, TEXT_ON],
            [0, TEXT_OFF]
        ];

        return this.select(
            TEXT_AUTOMATION_VALUE,
            "parameter_power",
            action.parameters.power,
            powerOptions,
            "actions",
            action.id
        );
    }

    /******************************************************************************/
    /*!
        @brief  Renders the color parameter for an action.
        @param  action              Color action draft
        @return                     Color parameter field
    */
    /******************************************************************************/
    renderColorActionField(action) {
        let color = action.parameters.color;

        if (color == null) {
            color = DEFAULT_AUTOMATION_COLOR;
        }

        return this.input(
            TEXT_COLOR,
            "parameter_color",
            color,
            INPUT_TYPE_COLOR,
            "actions",
            null,
            action.id
        );
    }

    /******************************************************************************/
    /*!
        @brief  Renders the mode parameter for an action.
        @param  action              Mode action draft
        @return                     Mode parameter field
    */
    /******************************************************************************/
    renderModeActionField(action) {
        const modeOptions = [];

        for (const mode of this.getModes()) {
            modeOptions.push([
                mode.id,
                mode.name
            ]);
        }

        return this.select(
            TEXT_MODE,
            "parameter_mode",
            action.parameters.mode,
            modeOptions,
            "actions",
            action.id,
            TEXT_AUTOMATION_CHOOSE_MODE
        );
    }

    /******************************************************************************/
    /*!
        @brief  Renders the review step.
        @return                     Review step element
    */
    /******************************************************************************/
    renderReview() {
        const section = this.section(
            TEXT_AUTOMATION_REVIEW_TITLE,
            TEXT_AUTOMATION_REVIEW_DESCRIPTION
        );

        const readyNotice = this.notice(
            TEXT_AUTOMATION_READY_TO_SAVE,
            NOTICE_TYPE_SUCCESS
        );

        const reviewList = this.element(
            "div",
            "automation-review-list"
        );

        const triggerReview = this.reviewSection(
            TEXT_AUTOMATION_WHEN,
            this.triggerSummary()
        );

        const conditionReview = this.reviewSection(
            TEXT_AUTOMATION_ONLY_IF,
            this.conditionSummary()
        );

        const actionReview = this.reviewSection(
            TEXT_AUTOMATION_THEN,
            this.actionSummary()
        );

        reviewList.append(
            triggerReview,
            conditionReview,
            actionReview
        );

        section.append(
            readyNotice,
            reviewList
        );

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the wizard footer controls.
        @return                     Footer element
    */
    /******************************************************************************/
    renderFooter() {
        const footer = this.element("footer", "automation-wizard-footer");
        const spacer = this.element("div");
        const toolbar = this.element("div", "toolbar");

        if (this.currentStep > 0) {
            const previousButton = this.button(
                TEXT_AUTOMATION_PREVIOUS,
                AUTOMATION_UI_ACTION_PREVIOUS
            );

            toolbar.appendChild(previousButton);
        }

        let primaryButtonText = TEXT_AUTOMATION_NEXT;
        let primaryButtonAction = AUTOMATION_UI_ACTION_NEXT;

        if (this.currentStep == AUTOMATION_REVIEW_STEP) {
            primaryButtonText = TEXT_SAVE;
            primaryButtonAction = AUTOMATION_UI_ACTION_SAVE;
        }

        const primaryButton = this.button(primaryButtonText, primaryButtonAction);
        toolbar.appendChild(primaryButton);

        if (this.draft.id != AUTOMATION_NEW_ID) {
            const deleteButton = this.button(TEXT_DELETE, AUTOMATION_UI_ACTION_DELETE);
            toolbar.appendChild(deleteButton);
        }

        footer.append(spacer, toolbar);

        return footer;
    }

    /******************************************************************************/
    /*!
        @brief  Renders a rule card.
        @param  type                Rule type
        @param  item                Rule draft
        @param  index               Rule index
        @param  fields              Rule field elements
        @param  movable             Whether the rule can be reordered
        @return                     Rule card element
    */
    /******************************************************************************/
    ruleCard(type, item, index, fields, movable=false) {
        const errorKey = type + "-" + item.id;

        const card = this.element("article", "automation-rule-card");

        if (this.errors[errorKey]) {
            card.classList.add("has-error");
        }

        const header = this.element("header", "automation-rule-header");
        const number = this.element("span", "automation-rule-number", index + 1);
        const title = this.element("strong", "", this.ruleTitle(type));
        const tools = this.ruleTools(
            type,
            item,
            index,
            movable
        );

        const error = this.error(errorKey);
        header.append(number, title, tools);
        card.append(header, fields, error);

        return card;
    }

    /******************************************************************************/
    /*!
        @brief  Renders controls for a rule card.
        @param  type                Rule type
        @param  item                Rule draft
        @param  index               Rule index
        @param  movable             Whether the rule can be reordered
        @return                     Rule toolbar element
    */
    /******************************************************************************/
    ruleTools(type, item, index, movable) {
        const tools = this.element(
            "div",
            "automation-rule-tools"
        );

        if (movable) {
            const isFirstAction = index == 0;
            const isLastAction =
                index == this.draft.actions.length - 1;

            const moveUpButton = this.iconButton(
                TEXT_AUTOMATION_MOVE_UP,
                "fa-solid fa-arrow-up",
                AUTOMATION_UI_ACTION_MOVE_ACTION_UP,
                item.id,
                isFirstAction
            );

            const moveDownButton = this.iconButton(
                TEXT_AUTOMATION_MOVE_DOWN,
                "fa-solid fa-arrow-down",
                AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN,
                item.id,
                isLastAction
            );

            tools.append(
                moveUpButton,
                moveDownButton
            );
        }

        const removeButton = this.iconButton(
            TEXT_AUTOMATION_REMOVE,
            "fa-solid fa-trash",
            AUTOMATION_UI_ACTION_REMOVE_PREFIX + type,
            item.id
        );

        tools.appendChild(removeButton);

        return tools;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the visible title for a rule type.
        @param  type                Rule type
        @return                     Localized rule title
    */
    /******************************************************************************/
    ruleTitle(type) {
        if (type == AUTOMATION_RULE_ACTION) {
            return TEXT_AUTOMATION_ACTION;
        }

        if (type == AUTOMATION_RULE_TRIGGER) {
            return TEXT_AUTOMATION_TRIGGER;
        }

        return TEXT_AUTOMATION_CONDITION;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a wizard section.
        @param  title               Section title
        @param  description         Section description
        @return                     Section element
    */
    /******************************************************************************/
    section(title, description) {
        const section = this.element("section");
        const header = this.element("header", "automation-step-heading");
        
        header.append(this.element("h4", "", title), this.element("p", "", description));
        section.appendChild(header);

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a labeled input field.
        @param  labelText           Visible field label
        @param  field               Draft field name
        @param  value               Current value
        @param  type                Input type
        @param  collection          Draft collection name
        @param  errorKey            Validation error key
        @param  itemId              Draft item identifier
        @param  min                 Minimum numeric value
        @return                     Field element
    */
    /******************************************************************************/
    input(labelText, field, value, type, collection=null, errorKey=null, itemId=null, min=null) {
        const container = this.element("div", "automation-field");
        const input = this.element("input", "input-field");
        const inputId = this.fieldId(collection, field, itemId);

        input.type = type;
        input.id = inputId;
        input.value = value ?? "";

        if (min != null) input.min = min;

        this.fieldData(input, field, collection, itemId, errorKey);
        const label = this.element("label", "", labelText);
        label.htmlFor = inputId;
        container.append(label, input);

        return container;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a labeled select field.
        @param  labelText           Visible field label
        @param  field               Draft field name
        @param  value               Selected value
        @param  options             Available options
        @param  collection          Draft collection name
        @param  itemId              Draft item identifier
        @param  placeholder         Optional placeholder
        @return                     Field element
    */
    /******************************************************************************/
    select(labelText, field, value, options, collection=null, itemId=null, placeholder=null) {
        const container = this.element("div", "automation-field");
        const select = this.element("select", "input-field");
        const selectId = this.fieldId(collection, field, itemId);

        select.id = selectId;

        if (placeholder != null) select.appendChild(this.option("", placeholder, value));

        options.forEach((item) => select.appendChild(this.option(item[0], item[1], value)));

        this.fieldData(select, field, collection, itemId);

        const label = this.element("label", "", labelText);
        label.htmlFor = selectId;
        container.append(label, select);

        return container;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a unique identifier for a draft field.
        @param  collection          Draft collection name
        @param  field               Field name
        @param  itemId              Draft item identifier
        @return                     Field identifier
    */
    /******************************************************************************/
    fieldId(collection, field, itemId) {
        return this.id + "-" + (collection ?? "general") + "-" + field + (itemId == null ? "" : "-" + itemId);
    }

    /******************************************************************************/
    /*!
        @brief  Creates a labeled checkbox.
        @param  text                Visible checkbox text
        @param  field               Draft field name
        @param  checked             Whether the checkbox is selected
        @return                     Checkbox label element
    */
    /******************************************************************************/
    checkbox(text, field, checked) {
        const label = this.element("label", "automation-checkbox-row");
        const input = this.element("input");
        input.type = "checkbox";
        input.checked = checked;
        input.dataset.field = field;
        label.append(input, this.element("span", "", text));
        return label;
    }

    /******************************************************************************/
    /*!
        @brief  Creates the weekday selector for a trigger.
        @param  item                Trigger draft
        @return                     Weekday field element
    */
    /******************************************************************************/
    dayField(item) {
        const fieldset = this.element("fieldset", "automation-day-field");
        fieldset.appendChild(this.element("legend", "", TEXT_DAYS));
        const container = this.element("div");

        this.dayOptions().forEach((day) => {
            const label = this.element("label", "automation-day-option");
            const input = this.element("input");
            input.type = "checkbox";
            input.checked = item.days.map(Number).includes(day[0]);
            this.fieldData(input, "days", "triggers", item.id);
            input.dataset.value = day[0];
            label.append(input, this.element("span", "", day[1]));
            container.appendChild(label);
        });

        fieldset.appendChild(container);
        return fieldset;
    }

    /******************************************************************************/
    /*!
        @brief  Creates the target selector for an action.
        @param  item                Action draft
        @return                     Target field element
    */
    /******************************************************************************/
    targetField(item) {
        const fieldset = this.element("fieldset", "automation-target-field");
        fieldset.appendChild(this.element("legend", "", TEXT_AUTOMATION_TARGETS));
        const container = this.element("div");

        this.sourceOptions(item.target_type, true).forEach((option) => {
            const label = this.element("label", "automation-target-option");
            const input = this.element("input");
            input.type = "checkbox";
            input.checked = item.target_ids.map(Number).includes(Number(option[0]));
            this.fieldData(input, "target_ids", "actions", item.id);
            input.dataset.value = option[0];
            label.append(input, this.element("span", "", option[1]));
            container.appendChild(label);
        });

        fieldset.appendChild(container);
        return fieldset;
    }

    /******************************************************************************/
    /*!
        @brief  Creates advanced execution settings.
        @return                     Execution settings element
    */
    /******************************************************************************/
    executionFields() {
        const details = this.element("details", "automation-advanced");
        details.appendChild(this.element("summary", "", TEXT_AUTOMATION_ADVANCED_EXECUTION));

        const grid = this.element("div", "automation-field-grid");

        const concurrencyPolicyOptions = [
            [
                AUTOMATION_CONCURRENCY_RESTART,
                TEXT_AUTOMATION_RESTART
            ],
            [
                AUTOMATION_CONCURRENCY_SINGLE,
                TEXT_AUTOMATION_IGNORE_NEW
            ],
            [
                AUTOMATION_CONCURRENCY_PARALLEL,
                TEXT_AUTOMATION_PARALLEL
            ]
        ];

        const concurrencyPolicyField = this.select(
            TEXT_AUTOMATION_ALREADY_RUNNING,
            "concurrency_policy",
            this.draft.concurrency_policy,
            concurrencyPolicyOptions
        );

        const errorPolicyOptions = [
            [
                AUTOMATION_ERROR_STOP,
                TEXT_AUTOMATION_STOP
            ],
            [
                AUTOMATION_ERROR_CONTINUE,
                TEXT_AUTOMATION_CONTINUE
            ]
        ];

        const errorPolicyField = this.select(
            TEXT_AUTOMATION_ACTION_FAILURE,
            "error_policy",
            this.draft.error_policy,
            errorPolicyOptions
        );

        grid.append(
            concurrencyPolicyField,
            errorPolicyField
        );

        details.appendChild(grid);
        return details;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a section for review summary lines.
        @param  title               Section title
        @param  lines               Summary lines
        @return                     Review section element
    */
    /******************************************************************************/
    reviewSection(title, lines) {
        const section = this.element("section", "automation-review-section");
        section.appendChild(this.element("span", "", title));
        lines.forEach((line) => section.appendChild(this.element("p", "", line)));

        return section;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a notice message.
        @param  text                Notice text
        @param  type                Notice type
        @return                     Notice element
    */
    /******************************************************************************/
    notice(text, type) {
        const notice = this.element("div", "automation-notice " + type, text);
        notice.setAttribute("role", "status");

        return notice;
    }

    /******************************************************************************/
    /*!
        @brief  Creates validation feedback for an error key.
        @param  key                 Validation error key
        @return                     Error element
    */
    /******************************************************************************/
    error(key) {
        if (!this.errors[key]) return this.element("span");
        const error = this.element("p", "automation-field-error", this.errors[key]);
        error.dataset.errorKey = key;
        error.tabIndex = -1;
        error.setAttribute("role", "alert");

        return error;
    }

    /******************************************************************************/
    /*!
        @brief  Creates an add-rule button.
        @param  text                Button text
        @param  action              Button action
        @return                     Button element
    */
    /******************************************************************************/
    addButton(text, action) {
        const button = this.button(text, action);
        button.classList.add("automation-add-button");

        return button;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a wizard button.
        @param  text                Button text
        @param  action              Button action
        @return                     Button element
    */
    /******************************************************************************/
    button(text, action) {
        const button = this.element("button", "toolbar-button", text);
        button.type = "button";
        button.dataset.automationAction = action;

        return button;
    }

    /******************************************************************************/
    /*!
        @brief  Creates an icon-only rule button.
        @param  label               Accessible button label
        @param  iconClass           Icon class
        @param  action              Button action
        @param  id                  Rule identifier
        @param  disabled            Whether the button is disabled
        @return                     Button element
    */
    /******************************************************************************/
    iconButton(label, iconClass, action, id, disabled=false) {
        const button = this.element("button");
        button.type = "button";
        button.disabled = disabled;
        button.dataset.automationAction = action;
        button.dataset.id = id;
        button.setAttribute("aria-label", label);
        button.appendChild(this.element("i", iconClass));

        return button;
    }

    /******************************************************************************/
    /*!
        @brief  Creates an option element.
        @param  value               Option value
        @param  text                Visible option text
        @param  selected            Whether the option is selected
        @return                     Option element
    */
    /******************************************************************************/
    option(value, text, selected) {
        const option = this.element("option", "", text);
        option.value = value;
        option.selected = String(value) == String(selected);

        return option;
    }

    /******************************************************************************/
    /*!
        @brief  Creates a DOM element with common properties.
        @param  tag                 HTML tag name
        @param  className           CSS class names
        @param  text                Optional text content
        @return                     DOM element
    */
    /******************************************************************************/
    element(tag, className="", text=undefined) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text != undefined) element.textContent = String(text);

        return element;
    }

    /******************************************************************************/
    /*!
        @brief  Attaches draft metadata to a field element.
        @param  element             Field element
        @param  field               Draft field name
        @param  collection          Draft collection name
        @param  id                  Draft item identifier
        @param  errorKey            Validation error key
    */
    /******************************************************************************/
    fieldData(element, field, collection, id, errorKey) {
        element.dataset.field = field;
        if (collection) element.dataset.collection = collection;
        if (id != null) element.dataset.id = id;
        if (errorKey) element.dataset.errorKey = errorKey;
    }

    /******************************************************************************/
    /*!
        @brief  Returns source-type options.
        @return                     Source-type options
    */
    /******************************************************************************/
    sourceTypeOptions() {
        return [["device", TEXT_DEVICE], ["group", TEXT_GROUP]];
    }

    /******************************************************************************/
    /*!
        @brief  Returns available source or target options.
        @param  type                Reference type
        @param  target              Whether options are for an action target
        @return                     Reference options
    */
    /******************************************************************************/
    sourceOptions(type, target=false) {
        if (type == "group") {
            return this.getGroups().map((group) => [
                group.id,
                VAR_TEXT_AUTOMATION_GROUP_OPTION(
                    group.name,
                    group.device_ids?.length || TEXT_AUTOMATION_EMPTY
                )
            ]);
        }
        return this.getDevices().filter((device) => !target || [DEVICE_CATEGORY_LEDSTRIP,
            DEVICE_CATEGORY_POWER_OUTLET, DEVICE_CATEGORY_IP_CAMERA].includes(device.category))
            .map((device) => [device.id, device.name]);
    }

    /******************************************************************************/
    /*!
        @brief  Returns trigger event options.
        @return                     Event options
    */
    /******************************************************************************/
    eventOptions() {
        return [
            ["state", TEXT_AUTOMATION_STATE_CHANGES],
            ["button", TEXT_AUTOMATION_BUTTON_PRESSED],
            ["numeric", TEXT_AUTOMATION_MEASUREMENT_CHANGES]
        ];
    }

    /******************************************************************************/
    /*!
        @brief  Returns comparison operator options.
        @param  numeric             Whether numeric operators are required
        @return                     Operator options
    */
    /******************************************************************************/
    operatorOptions(numeric) {
        const options = [["equals", TEXT_AUTOMATION_EQUALS], ["not_equals", TEXT_AUTOMATION_NOT_EQUALS]];

        if (numeric) {
            options.push(["greater_than", TEXT_AUTOMATION_GREATER_THAN], ["less_than", TEXT_AUTOMATION_LESS_THAN]);
        }

        return options;
    }

    /******************************************************************************/
    /*!
        @brief  Returns state options for a trigger.
        @param  item                Trigger draft
        @return                     State options
    */
    /******************************************************************************/
    stateOptions(item) {
        if (item.event == "button") {
            return [["short_press", TEXT_AUTOMATION_SHORT_PRESS],
                ["double_press", TEXT_AUTOMATION_DOUBLE_PRESS],
                ["hold", TEXT_AUTOMATION_HOLD], ["release", TEXT_AUTOMATION_RELEASE]];
        }

        const device = this.getDevices().find((entry) => entry.id == item.source_id);
        const model = DEVICE_MODELS.find((entry) => entry.model_id == device?.model_id);

        return model?.states?.map((state) => [state.state, state.name]) ?? [[1, TEXT_ON], [0, TEXT_OFF]];
    }

    /******************************************************************************/
    /*!
        @brief  Returns action-type options.
        @return                     Action-type options
    */
    /******************************************************************************/
    actionOptions() {
        const options = this.getActions().map((item) => [item.function, item.name]);

        options.push(
            ["wait", TEXT_AUTOMATION_WAIT],
            ["send_ir", TEXT_AUTOMATION_SEND_IR],
            ["send_rf", TEXT_AUTOMATION_SEND_RF],
            ["camera_record", TEXT_AUTOMATION_RECORD_CAMERA]
        );

        return options;
    }

    /******************************************************************************/
    /*!
        @brief  Returns weekday options.
        @return                     Weekday options
    */
    /******************************************************************************/
    dayOptions() {
        return [
            [0, TEXT_AUTOMATION_MONDAY_SHORT], [1, TEXT_AUTOMATION_TUESDAY_SHORT],
            [2, TEXT_AUTOMATION_WEDNESDAY_SHORT], [3, TEXT_AUTOMATION_THURSDAY_SHORT],
            [4, TEXT_AUTOMATION_FRIDAY_SHORT], [5, TEXT_AUTOMATION_SATURDAY_SHORT],
            [6, TEXT_AUTOMATION_SUNDAY_SHORT]
        ];
    }

    /******************************************************************************/
    /*!
        @brief  Creates plain-language trigger summaries.
        @return                     Trigger summary lines
    */
    /******************************************************************************/
    triggerSummary() {
        return this.draft.triggers.map((item) => {
            if (item.kind == "time") return VAR_TEXT_AUTOMATION_TIME(item.time);
            if (item.kind == "manual") return TEXT_AUTOMATION_MANUALLY_STARTED;
            if (item.kind == "signal") return TEXT_AUTOMATION_SIGNAL_RECEIVED;

            return VAR_TEXT_AUTOMATION_BECOMES(
                this.sourceName(item.source_type, item.source_id),
                item.state
            );
        });
    }

    /******************************************************************************/
    /*!
        @brief  Creates plain-language condition summaries.
        @return                     Condition summary lines
    */
    /******************************************************************************/
    conditionSummary() {
        if (!this.draft.conditions.length) return [TEXT_AUTOMATION_NO_CONDITIONS];

        return this.draft.conditions.map((item) => item.type == "time_window" ?
            VAR_TEXT_AUTOMATION_TIME_WINDOW(item.start_time, item.end_time) :
            VAR_TEXT_AUTOMATION_SOURCE_VALUE(
                this.sourceName(item.source_type, item.source_id),
                item.value
            ));
    }

    /******************************************************************************/
    /*!
        @brief  Creates plain-language action summaries.
        @return                     Action summary lines
    */
    /******************************************************************************/
    actionSummary() {
        return this.draft.actions.map((item, index) => item.type == "wait" ?
            VAR_TEXT_AUTOMATION_WAIT_SUMMARY(index + 1, item.duration_minutes) :
            VAR_TEXT_AUTOMATION_ACTION_SUMMARY(
                index + 1,
                this.optionText(this.actionOptions(), item.type),
                item.target_ids.map((id) => {
                    return this.sourceName(item.target_type, id);
                }).join(", ")
            ));
    }

    /******************************************************************************/
    /*!
        @brief  Returns the visible name of a source or target.
        @param  type                Reference type
        @param  id                  Reference identifier
        @return                     Reference name
    */
    /******************************************************************************/
    sourceName(type, id) {
        const source = type == "group" ? this.getGroups() : this.getDevices();
        return source.find((item) => item.id == id)?.name ?? TEXT_AUTOMATION_MISSING_SOURCE;
    }

    /******************************************************************************/
    /*!
        @brief  Checks whether a source or target exists.
        @param  type                Reference type
        @param  id                  Reference identifier
        @return                     Whether the reference exists
    */
    /******************************************************************************/
    sourceExists(type, id) {
        const source = type == "group" ? this.getGroups() : this.getDevices();
        return id !== "" && source.some((item) => item.id == id);
    }

    /******************************************************************************/
    /*!
        @brief  Checks whether an action supports all selected targets.
        @param  action              Action draft
        @return                     Whether the action is compatible
    */
    /******************************************************************************/
    actionCompatible(action) {
        if (action.type == "wait" || !action.target_ids.length) return true;

        const definition = this.getActions().find((item) => item.function == action.type);

        if (!definition) return false;

        const types = [];

        if (action.target_type == "device") {
            for (const id of action.target_ids) {
                const type = this.getDevices().find((item) => item.id == id)?.type;
                if (type != undefined) types.push(type);
            }
        } else {
            for (const id of action.target_ids) {
                const group = this.getGroups().find((item) => item.id == id);
                if (!group?.device_ids?.length) return false;
                types.push(...(group.types ?? []));
            }
        }

        return types.length > 0 && types.every((type) => {
            return definition.device_types.includes(type);
        });
    }

    /******************************************************************************/
    /*!
        @brief  Returns visible text for an option value.
        @param  options             Available options
        @param  value               Option value
        @return                     Visible option text
    */
    /******************************************************************************/
    optionText(options, value) {
        return options.find((item) => String(item[0]) == String(value))?.[1] ?? TEXT_AUTOMATION_NOT_CONFIGURED;
    }

    /******************************************************************************/
    /*!
        @brief  Moves focus to the first field in the active step.
    */
    /******************************************************************************/
    focusFirstField() {
        requestAnimationFrame(() => {
            this.wizardElement.querySelector(
                ".automation-wizard-body input, .automation-wizard-body select, " +
                ".automation-wizard-body button"
            )?.focus();
        });
    }
}
