/****************************************************************************/
/*
 * File:    AutomationModal.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Edits automation triggers, conditions and actions inside a
 *          dialog.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { button } from "../../vendor/templates/js/core/dom.js";
import {
    TEXT_ADD_AUTOMATION, TEXT_AUTOMATION_ACTION, TEXT_AUTOMATION_ACTIONS_DESCRIPTION,
    TEXT_AUTOMATION_ACTIONS_TITLE, TEXT_AUTOMATION_ACTION_FAILURE, TEXT_AUTOMATION_ACTION_REQUIRED,
    TEXT_AUTOMATION_ACTION_TYPE, TEXT_AUTOMATION_ADD_ACTION, TEXT_AUTOMATION_ADD_CONDITION,
    TEXT_AUTOMATION_ADD_TRIGGER, TEXT_AUTOMATION_ADVANCED_EXECUTION,
    TEXT_AUTOMATION_ALL_GROUP_MEMBERS, TEXT_AUTOMATION_ALREADY_RUNNING,
    TEXT_AUTOMATION_ANY_GROUP_MEMBER, TEXT_AUTOMATION_HUB_UNAVAILABLE,
    TEXT_AUTOMATION_BUTTON_MISSING, TEXT_AUTOMATION_BUTTON_PRESSED,
    TEXT_AUTOMATION_COMPLETE_CONDITION, TEXT_AUTOMATION_COMPLETE_TRIGGER, TEXT_AUTOMATION_CONDITION,
    TEXT_AUTOMATION_CONDITIONS, TEXT_AUTOMATION_CONDITIONS_DESCRIPTION,
    TEXT_AUTOMATION_CONDITIONS_OPTIONAL, TEXT_AUTOMATION_CONDITIONS_TITLE,
    TEXT_AUTOMATION_CONDITION_TYPE, TEXT_AUTOMATION_CONTINUE, TEXT_AUTOMATION_CONTINUE_EDITING,
    TEXT_AUTOMATION_DEVICE_OR_GROUP, TEXT_AUTOMATION_DEVICE_STATE, TEXT_AUTOMATION_DISCARD_CHANGES,
    TEXT_AUTOMATION_DOUBLE_PRESS, TEXT_AUTOMATION_DURATION_MINUTES,
    TEXT_AUTOMATION_DYNAMIC_GROUP_MEMBERSHIP, TEXT_AUTOMATION_EMPTY, TEXT_AUTOMATION_END_TIME,
    TEXT_AUTOMATION_EQUALS, TEXT_AUTOMATION_EVENT, TEXT_AUTOMATION_EXECUTABLE_ACTION_REQUIRED,
    TEXT_AUTOMATION_FRIDAY_SHORT, TEXT_AUTOMATION_GENERAL, TEXT_AUTOMATION_GENERAL_DESCRIPTION,
    TEXT_AUTOMATION_GENERAL_TITLE, TEXT_AUTOMATION_GREATER_THAN,
    TEXT_AUTOMATION_GROUP_TRIGGER_BEHAVIOUR, TEXT_AUTOMATION_HOLD, TEXT_AUTOMATION_IGNORE_NEW,
    TEXT_AUTOMATION_INCOMPATIBLE_ACTION, TEXT_AUTOMATION_INSIDE_WINDOW, TEXT_AUTOMATION_LESS_THAN,
    TEXT_AUTOMATION_MANUAL, TEXT_AUTOMATION_MANUALLY_STARTED, TEXT_AUTOMATION_MANUAL_DESCRIPTION,
    TEXT_AUTOMATION_MATCH_ALL, TEXT_AUTOMATION_MATCH_ANY, TEXT_AUTOMATION_MEASUREMENT_CHANGES,
    TEXT_AUTOMATION_MISSING_SOURCE, TEXT_AUTOMATION_MONDAY_SHORT, TEXT_AUTOMATION_MOVE_DOWN,
    TEXT_AUTOMATION_MOVE_UP, TEXT_AUTOMATION_MULTIPLE_TRIGGERS, TEXT_AUTOMATION_NEXT,
    TEXT_AUTOMATION_NOT_CONFIGURED, TEXT_AUTOMATION_NOT_EQUALS, TEXT_AUTOMATION_NO_CONDITIONS,
    TEXT_AUTOMATION_NUMERIC_VALUE, TEXT_AUTOMATION_ONLY_IF, TEXT_AUTOMATION_OPERATOR,
    TEXT_AUTOMATION_OUTSIDE_WINDOW, TEXT_AUTOMATION_PARALLEL, TEXT_AUTOMATION_PREVIOUS,
    TEXT_AUTOMATION_PROGRESS, TEXT_AUTOMATION_READY_TO_SAVE, TEXT_AUTOMATION_RECORD_CAMERA,
    TEXT_AUTOMATION_RELEASE, TEXT_AUTOMATION_REMOVE, TEXT_AUTOMATION_RESTART,
    TEXT_AUTOMATION_REVIEW, TEXT_AUTOMATION_REVIEW_DESCRIPTION, TEXT_AUTOMATION_REVIEW_TITLE,
    TEXT_AUTOMATION_SATURDAY_SHORT, TEXT_AUTOMATION_SEND_BUTTON, TEXT_AUTOMATION_SHORT_PRESS,
    TEXT_AUTOMATION_SIGNAL_RECEIVED, TEXT_AUTOMATION_SOURCE, TEXT_AUTOMATION_SOURCE_TYPE,
    TEXT_AUTOMATION_START_TIME, TEXT_AUTOMATION_STATE_CHANGES, TEXT_AUTOMATION_STOP,
    TEXT_AUTOMATION_SUNDAY_SHORT, TEXT_AUTOMATION_TARGETS, TEXT_AUTOMATION_TARGET_TYPE,
    TEXT_AUTOMATION_THEN, TEXT_AUTOMATION_THURSDAY_SHORT, TEXT_AUTOMATION_TRIGGER,
    TEXT_AUTOMATION_TRIGGER_REQUIRED, TEXT_AUTOMATION_TRIGGER_TYPE, TEXT_AUTOMATION_TUESDAY_SHORT,
    TEXT_AUTOMATION_UNSAVED_MESSAGE, TEXT_AUTOMATION_UNSAVED_TITLE, TEXT_AUTOMATION_VALUE,
    TEXT_AUTOMATION_WAIT, TEXT_AUTOMATION_WAIT_MINIMUM, TEXT_AUTOMATION_WEDNESDAY_SHORT,
    TEXT_AUTOMATION_WHEN, TEXT_AUTOMATION_WHEN_DESCRIPTION, TEXT_AUTOMATION_WHEN_TITLE,
    TEXT_AUTOMATION_WINDOW_BEHAVIOUR, TEXT_CLOSE, TEXT_COLOR, TEXT_DAYS, TEXT_DELETE, TEXT_DEVICE,
    TEXT_EDIT_AUTOMATION, TEXT_FIELD_REQUIRED, TEXT_FIELD_UNIQUE, TEXT_GROUP, TEXT_MODE, TEXT_NAME,
    TEXT_NO_CRITICAL_SYMBOLS, TEXT_OFF, TEXT_ON, TEXT_SAVE, TEXT_TIME, TEXT_TIME_WINDOW,
    VAR_TEXT_AUTOMATION_ACTION_SUMMARY, VAR_TEXT_AUTOMATION_BECOMES,
    VAR_TEXT_AUTOMATION_GROUP_OPTION, VAR_TEXT_AUTOMATION_SOURCE_VALUE, VAR_TEXT_AUTOMATION_TIME,
    VAR_TEXT_AUTOMATION_TIME_WINDOW, VAR_TEXT_AUTOMATION_WAIT_SUMMARY
} from "../domain/language_pack_english.js";
import {
    AUTOMATION_ACTION_CAMERA_RECORD, AUTOMATION_ACTION_SEND_IR, AUTOMATION_ACTION_SEND_RF,
    AUTOMATION_ACTION_SET_DEVICE_POWER, AUTOMATION_ACTION_SET_LEDSTRIP_COLOR,
    AUTOMATION_ACTION_SET_LEDSTRIP_MODE, AUTOMATION_ACTION_WAIT, AUTOMATION_CONCURRENCY_PARALLEL,
    AUTOMATION_CONCURRENCY_RESTART, AUTOMATION_CONCURRENCY_SINGLE,
    AUTOMATION_CONDITION_DEVICE_STATE, AUTOMATION_CONDITION_NUMERIC,
    AUTOMATION_CONDITION_TIME_WINDOW, AUTOMATION_ERROR_CONTINUE, AUTOMATION_ERROR_STOP,
    AUTOMATION_REFERENCE_GROUP, DEVICE_CATEGORY_DOOR_SENSOR, DEVICE_CATEGORY_LEDSTRIP,
    DEVICE_CATEGORY_MOTION_SENSOR, DEVICE_CATEGORY_POWER_OUTLET, DEVICE_CATEGORY_REMOTE,
    DEVICE_CATEGORY_SWITCH
} from "../domain/automation_constants.js";
import {
    AUTOMATION_NEW_ID, AUTOMATION_REVIEW_STEP, AUTOMATION_RULE_ACTION, AUTOMATION_RULE_CONDITION,
    AUTOMATION_RULE_TRIGGER, AUTOMATION_UI_ACTION_ADD_ACTION, AUTOMATION_UI_ACTION_ADD_CONDITION,
    AUTOMATION_UI_ACTION_DELETE, AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN,
    AUTOMATION_UI_ACTION_MOVE_ACTION_UP, AUTOMATION_UI_ACTION_NEXT, AUTOMATION_UI_ACTION_PREVIOUS,
    AUTOMATION_UI_ACTION_REMOVE_PREFIX, AUTOMATION_UI_ACTION_SAVE, AutomationDraftAdapter,
    DEFAULT_AUTOMATION_COLOR, INPUT_TYPE_COLOR, INPUT_TYPE_NUMBER, INPUT_TYPE_TEXT, INPUT_TYPE_TIME,
    NOTICE_TYPE_INFO, NOTICE_TYPE_SUCCESS, NOTICE_TYPE_WARNING
} from "../domain/automation_draft.js";
import { AUTOMATION_UI_ACTION_ADD_TRIGGER } from "../domain/automation_draft.js";
import { Component } from "../../vendor/templates/js/core/component.js";
import { AnimationController } from "../../vendor/templates/js/core/animation.js";
import { ConfirmationDialog } from "./ConfirmationDialog.js";
import { decorateCatalogChoice } from "./catalog_view.js";
import { SYMBOL_CRITICAL_RE } from "../domain/validation.js";

export class AutomationModal extends Component {
    /****************************************************************************/
    /*!
     * @brief   Creates an automation wizard.
     * @param   configuration           Automation wizard configuration
     * @returns Automation wizard
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);
        this.animation = new AnimationController();
        Object.assign(this, configuration);
        this.id = configuration.id ?? "automationModal";
        this.draft = AutomationDraftAdapter.createEmpty();
        this.errors = {};
        this.currentStep = 0;
        this.highestStep = 0;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the automation wizard modal.
     */
    /****************************************************************************/
    render() {
        this.dialog = this.element("dialog", "modal big-modal automation-modal");
        this.titleElem = this.element("h2", "", TEXT_ADD_AUTOMATION);
        this.titleElem.id = "automationEditorTitle";
        this.dialog.setAttribute("aria-labelledby", this.titleElem.id);
        this.messageElem = this.element("p", "message error");
        this.wizardElement = this.element("div", "automation-wizard");

        const close = button({ iconClass: "fa-solid fa-xmark", className: "close-modal-button" });
        close.setAttribute("aria-label", TEXT_CLOSE);

        this.listen(close, "click", () => this.requestClose());

        /****************************************************************************/
        /*!
         * @brief   Routes native dialog cancellation through unsaved-change protection.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        this.listen(this.dialog, "cancel", event => {
            event.preventDefault();
            this.requestClose();
        });

        this.confirmation = new ConfirmationDialog();
        this.dialog.append(close, this.titleElem, this.messageElem, this.wizardElement);
        this.root.replaceChildren(this.dialog);

        this.listen(this.wizardElement, "click", event => this.onClick(event));
        this.listen(this.wizardElement, "input", event => this.onInput(event, false));
        this.listen(this.wizardElement, "change", event => this.onInput(event, true));
        this.renderWizard();
    }

    /****************************************************************************/
    /*!
     * @brief   Releases wizard animations, confirmation controls and its modal
     *          stack entry.
     */
    /****************************************************************************/
    destroy() {
        this.animation.clear();
        this.confirmation.destroy();
        this.props.stack.close(this.dialog, { immediate: true });
        super.destroy();
    }

    /****************************************************************************/
    /*!
     * @brief   Loads a new or existing automation draft and opens its wizard.
     * @param   id                      Identifier of the affected item.
     */
    /****************************************************************************/
    open(id = undefined) {
        const automation = this.getAutomations().find(item => item.id == id);

        if (automation) {
            this.draft = AutomationDraftAdapter.fromAutomation(automation);
        } else {
            this.draft = AutomationDraftAdapter.createEmpty();
        }

        this.initialDraft = JSON.stringify(this.draft);
        this.currentStep = 0;
        this.highestStep = 0;
        this.errors = {};
        this.titleElem.textContent = automation ? TEXT_EDIT_AUTOMATION : TEXT_ADD_AUTOMATION;
        this.renderWizard();
        this.props.stack.open(this.dialog, {
            /****************************************************************************/
            /*!
             * @brief   Closes the dialog when its modal stack requests dismissal.
             * @returns Calculated value or configured element.
             */
            /****************************************************************************/
            onRequestClose: () => this.requestClose()
        });
        this.focusFirstField();
    }

    /****************************************************************************/
    /*!
     * @brief   Closes the wizard when closing is allowed.
     * @param   force                   Whether to skip unsaved-change protection
     */
    /****************************************************************************/
    close(force = false) {
        if (!force && this.hasChanges()) return this.requestClose();

        this.props.stack.close(this.dialog);
    }

    /****************************************************************************/
    /*!
     * @brief   Finishes the UI flow after a successful save.
     * @param   id                      Saved automation ID
     */
    /****************************************************************************/
    finishSave(id) {
        this.draft.id = id;
        this.initialDraft = JSON.stringify(this.draft);
        this.close(true);
    }

    /****************************************************************************/
    /*!
     * @brief   Displays an error message in the modal.
     * @param   message                 Error message
     */
    /****************************************************************************/
    setErrorMessage(message) {
        this.messageElem.textContent = message;
        this.messageElem.hidden = false;
    }

    /****************************************************************************/
    /*!
     * @brief   Handles wizard click actions.
     * @param   event                   Click event
     */
    /****************************************************************************/
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

            /****************************************************************************/
            /*!
             * @brief   Keeps rules other than the rule selected for removal.
             * @param   item                    Item in the current collection.
             * @returns Whether the operation or validation condition succeeds.
             */
            /****************************************************************************/
            this.draft[collection] = this.draft[collection].filter(item => {
                return item.id != button.dataset.id;
            });
        } else if (action == AUTOMATION_UI_ACTION_MOVE_ACTION_UP) {
            this.moveAction(button.dataset.id, -1);
        } else if (action == AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN) {
            this.moveAction(button.dataset.id, 1);
        }

        this.renderWizard();
    }

    /****************************************************************************/
    /*!
     * @brief   Updates draft data after a field changes.
     * @param   event                   Input or change event
     * @param   rerender                Whether to rerender the wizard
     */
    /****************************************************************************/
    onInput(event, rerender) {
        const field = event.target.dataset.field;

        if (!field) return;

        const value = event.target.type == "checkbox" ? event.target.checked : event.target.value;
        const collection = event.target.dataset.collection;

        if (!collection) {
            this.draft[field] = value;
        } else {
            /****************************************************************************/
            /*!
             * @brief   Finds the draft rule associated with the changed input.
             * @param   entry                   Draft rule being matched to the input.
             * @returns Whether the operation or validation condition succeeds.
             */
            /****************************************************************************/
            const item = this.draft[collection].find(entry => {
                return entry.id == event.target.dataset.id;
            });

            if (item) this.updateItem(item, field, value, event.target);
        }

        const errorKey = event.target.dataset.errorKey;
        if (errorKey && this.errors[errorKey]) {
            delete this.errors[errorKey];
            this.wizardElement.querySelector(".automation-field-error[data-error-key="
                + CSS.escape(errorKey)
                + "]")?.remove();
        }

        // Rebuild dependent fields for choices. A text field's blur precedes the Next click.
        if (rerender && event.target.matches("select, input[type=radio], input[type=checkbox]")) {
            const active = event.target;
            const body = this.wizardElement.querySelector(".automation-wizard-body");
            const scrollTop = body?.scrollTop ?? 0;

            this.renderWizard();

            const updatedBody = this.wizardElement.querySelector(".automation-wizard-body");
            updatedBody.scrollTop = scrollTop;
            if (active.matches(".automation-choice-tile input")) {
                const replacement = Array.from(
                    updatedBody.querySelectorAll(".automation-choice-tile input")
                ).find(
                    input =>
                        input.dataset.field === field && input.dataset.id === active.dataset.id
                        && input.dataset.collection === active.dataset.collection
                        && input.value === active.value
                        && input.dataset.value === active.dataset.value
                );
                replacement?.focus({ preventScroll: true });
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Updates a draft rule field.
     * @param   item                    Draft rule
     * @param   field                   Field name
     * @param   value                   New field value
     * @param   input                   Changed input element
     */
    /****************************************************************************/
    updateItem(item, field, value, input) {
        if (["days", "target_ids"].includes(field)) {
            const option = Number(input.dataset.value);
            if (field === "target_ids" && item.type === "send_button") {
                item.target_ids = value ? [option] : [];
                item.parameters = {};

                return;
            }
            if (value && !item[field].map(Number).includes(option)) item[field].push(option);
            if (!value) item[field] = item[field].filter(entry => Number(entry) != option);

            return;
        }

        if (field.startsWith("parameter_")) {
            item.parameters[field.replace("parameter_", "")] = value;
            if (item.type === "send_button" && field === "parameter_code_id") {
                const code = this.getDevices().find(device =>
                    device.id == item.target_ids[0])?.hub_codes?.find(entry =>
                    entry.id === value);
                item.parameters.capability = code?.medium + ".send";
            }

            return;
        }

        if (["true", "false"].includes(value)) {
            value = value == "true";
        }

        item[field] = value;

        if (field == "kind") {
            item.source_type = value == "signal" ? "hub" : "device";
            item.source_id = "";
            item.state = "";
        }

        if (field == "source_type") item.source_id = "";
        if (this.draft.triggers.includes(item)
            && ["source_id", "source_type", "kind"].includes(field)) {
            const device = this.getDevices().find(entry => entry.id == item.source_id);
            item.event = item.source_type === "device"
                && device?.category === DEVICE_CATEGORY_REMOTE
                ? "button"
                : "state";
            item.button_id = "";
            item.state = "";
        }
        if (field == "target_type") item.target_ids = [];
        if (field == "type" && this.draft.actions.includes(item)) {
            item.target_ids = [];
            if (value === "send_button") item.target_type = "device";
            item.parameters = value == "set_device_power" ? { power: 0 } : {};
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Moves an action within the ordered action list.
     * @param   id                      Action identifier
     * @param   direction               Movement offset
     */
    /****************************************************************************/
    moveAction(id, direction) {
        const index = this.draft.actions.findIndex(item => item.id == id);
        const destination = index + direction;

        if (index < 0 || destination < 0 || destination >= this.draft.actions.length) return;

        this.draft.actions.splice(destination, 0, this.draft.actions.splice(index, 1)[0]);
    }

    /****************************************************************************/
    /*!
     * @brief   Moves to the next wizard step.
     */
    /****************************************************************************/
    next() {
        if (!this.validateStep(this.currentStep)) return this.showValidation();

        this.currentStep++;
        this.highestStep = Math.max(this.highestStep, this.currentStep);
        this.renderWizard();
        this.focusFirstField();
    }

    /****************************************************************************/
    /*!
     * @brief   Moves to the previous wizard step.
     */
    /****************************************************************************/
    previous() {
        if (this.currentStep > 0 && this.draft.id != AUTOMATION_NEW_ID) {
            return this.goToStep(this.currentStep - 1);
        }

        if (this.currentStep > 0) this.currentStep--;

        this.renderWizard();
    }

    /****************************************************************************/
    /*!
     * @brief   Navigates to a wizard step.
     * @param   step                    Target step index
     */
    /****************************************************************************/
    goToStep(step) {
        const editing = this.draft.id != AUTOMATION_NEW_ID;
        if (step === this.currentStep || !editing && step > this.highestStep + 1) return;
        if ((editing || step > this.currentStep) && !this.validateStep(this.currentStep)) {
            return this.showValidation();
        }

        this.currentStep = step;
        this.highestStep = Math.max(this.highestStep, step);
        this.renderWizard();
    }

    /****************************************************************************/
    /*!
     * @brief   Validates and saves the automation draft.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Shows validation feedback for the current step.
     */
    /****************************************************************************/
    showValidation() {
        this.renderWizard();

        /****************************************************************************/
        /*!
         * @brief   Focuses the first invalid wizard field after rendering validation.
         */
        /****************************************************************************/
        this.animation.nextFrame(() => {
            this.wizardElement.querySelector("[data-error-key]")?.focus();
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Validates a wizard step.
     * @param   step                    Step index
     * @param   reset                   Whether to clear previous validation errors
     * @returns Whether the step is valid
     */
    /****************************************************************************/
    validateStep(step, reset = true) {
        if (reset) this.errors = {};
        if (step == 0) this.validateGeneral();
        if (step == 1) this.validateTriggers();
        if (step == 2) this.validateConditions();
        if (step == 3) this.validateActions();

        return Object.keys(this.errors).length == 0;
    }

    /****************************************************************************/
    /*!
     * @brief   Validates the general automation settings.
     * @returns Whether the settings are valid
     */
    /****************************************************************************/
    validateGeneral() {
        const name = this.draft.name.trim();
        if (!name) this.errors.name = TEXT_FIELD_REQUIRED;

        if (name && typeof SYMBOL_CRITICAL_RE != "undefined" && name.match(SYMBOL_CRITICAL_RE)) {
            this.errors.name = TEXT_NO_CRITICAL_SYMBOLS;
        }

        /****************************************************************************/
        /*!
         * @brief   Checks whether another automation already uses the proposed name.
         * @param   item                    Item in the current collection.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        if (this.getAutomations().some(item => {
            return item.id != this.draft.id && item.name.toLowerCase() == name.toLowerCase();
        })) this.errors.name = TEXT_FIELD_UNIQUE;
    }

    /****************************************************************************/
    /*!
     * @brief   Validates all configured triggers.
     * @returns Whether all triggers are valid
     */
    /****************************************************************************/
    validateTriggers() {
        if (!this.draft.triggers.length) this.errors.triggers = TEXT_AUTOMATION_TRIGGER_REQUIRED;

        for (const item of this.draft.triggers) {
            const invalidTime = item.kind == "time" && (!item.time || !item.days.length);
            const invalidSource = item.kind == "device"
                && (!item.source_id || !item.button_id && item.state === ""
                || !this.sourceExists(item.source_type, item.source_id));
            const missingButton = item.button_id
                && !this.buttonOptions(item.source_id).some(([id]) => id === item.button_id);
            if (missingButton) this.errors["trigger-" + item.id] = TEXT_AUTOMATION_BUTTON_MISSING;
            if (invalidTime || invalidSource || item.kind == "signal") {
                this.errors["trigger-" + item.id] = item.kind == "signal"
                    ? TEXT_AUTOMATION_HUB_UNAVAILABLE
                    : TEXT_AUTOMATION_COMPLETE_TRIGGER;
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Validates all configured conditions.
     * @returns Whether all conditions are valid
     */
    /****************************************************************************/
    validateConditions() {
        for (const item of this.draft.conditions) {
            const invalidTime = item.type == "time_window" && (!item.start_time || !item.end_time);

            let invalidSource = false;

            if (item.type != AUTOMATION_CONDITION_TIME_WINDOW) {
                const hasNoSource = !item.source_id;
                const hasNoValue = item.value === "";
                const sourceDoesNotExist = !this.sourceExists(item.source_type, item.source_id);

                invalidSource = hasNoSource || hasNoValue || sourceDoesNotExist;
            }

            if (invalidTime || invalidSource) {
                this.errors["condition-" + item.id] = TEXT_AUTOMATION_COMPLETE_CONDITION;
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Validates all configured actions.
     * @returns Whether all actions are valid
     */
    /****************************************************************************/
    validateActions() {
        if (!this.draft.actions.length) this.errors.actions = TEXT_AUTOMATION_ACTION_REQUIRED;

        if (!this.draft.actions.some(item => item.type != "wait")) {
            this.errors.actions = TEXT_AUTOMATION_EXECUTABLE_ACTION_REQUIRED;
        }

        for (const item of this.draft.actions) {
            const invalidWait = item.type == "wait" && Number(item.duration_minutes) < 1;
            const unsupported = ["send_ir", "send_rf", "camera_record"].includes(item.type);
            let invalidTarget = false;

            if (item.type != AUTOMATION_ACTION_WAIT) {
                const hasNoTargets = item.target_ids.length == 0;

                /****************************************************************************/
                /*!
                 * @brief   Checks whether an action target is missing from the controller.
                 * @param   id                      Identifier of the affected item.
                 * @returns Whether the operation or validation condition succeeds.
                 */
                /****************************************************************************/
                const hasMissingTarget = item.target_ids.some(id => {
                    return !this.sourceExists(item.target_type, id);
                });

                invalidTarget = hasNoTargets || hasMissingTarget;
            }

            if (invalidWait || unsupported || invalidTarget || !this.actionCompatible(item)) {
                this.errors["action-" + item.id] = invalidWait
                    ? TEXT_AUTOMATION_WAIT_MINIMUM
                    : TEXT_AUTOMATION_INCOMPATIBLE_ACTION;
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Checks whether the draft contains unsaved changes.
     * @returns Whether the draft has changed
     */
    /****************************************************************************/
    hasChanges() {
        return JSON.stringify(this.draft) != this.initialDraft;
    }

    /****************************************************************************/
    /*!
     * @brief   Requests closing and protects unsaved changes.
     */
    /****************************************************************************/
    requestClose() {
        if (!this.hasChanges()) return this.close(true);

        /****************************************************************************/
        /*!
         * @brief   Closes the wizard only when discarding changes is confirmed.
         * @param   discard                 Whether discarding unsaved changes was confirmed.
         */
        /****************************************************************************/
        this.confirmation.confirm({
            title: TEXT_AUTOMATION_UNSAVED_TITLE,
            message: TEXT_AUTOMATION_UNSAVED_MESSAGE,
            type: "warning",
            confirmLabel: TEXT_AUTOMATION_DISCARD_CHANGES,
            cancelLabel: TEXT_AUTOMATION_CONTINUE_EDITING
        }).then(discard => { if (discard) this.close(true); });
    }

    /****************************************************************************/
    /*!
     * @brief   Renders all visible wizard content.
     */
    /****************************************************************************/
    renderWizard() {
        if (!this.wizardElement) return;

        this.messageElem.hidden = true;

        const body = this.element("div", "automation-wizard-body");
        body.appendChild(this.renderStep());

        this.wizardElement.replaceChildren(this.renderProgress(), body, this.renderFooter());
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the wizard progress navigation.
     * @returns Progress navigation element
     */
    /****************************************************************************/
    renderProgress() {
        const labels = [
            TEXT_AUTOMATION_GENERAL, TEXT_AUTOMATION_WHEN, TEXT_AUTOMATION_CONDITIONS,
            TEXT_AUTOMATION_ACTIONS_TITLE, TEXT_AUTOMATION_REVIEW
        ];
        const icons = ["sliders", "bolt", "filter", "play", "clipboard-check"];
        const navigation = this.element("ol", "modal-stepper automation-progress");

        navigation.setAttribute("aria-label", TEXT_AUTOMATION_PROGRESS);

        /****************************************************************************/
        /*!
         * @brief   Builds an accessible wizard progress item for a step.
         * @param   label                   Visible label for the rendered value.
         * @param   index                   Position in the displayed sequence.
         */
        /****************************************************************************/
        labels.forEach((label, index) => {
            const button = this.button(label, "step");
            const item = this.element("li", "modal-stepper-item");

            button.className = "modal-stepper-content modal-stepper-button automation-progress-step";
            button.dataset.step = index;
            button.disabled = this.draft.id == AUTOMATION_NEW_ID && index > this.highestStep + 1;

            if (index == this.currentStep) item.classList.add("current");
            if (index < this.currentStep) item.classList.add("complete");

            button.setAttribute("aria-label", label);
            if (index === this.currentStep) button.setAttribute("aria-current", "step");

            const marker = this.element("span", "modal-stepper-marker");
            marker.setAttribute("aria-hidden", "true");
            marker.append(this.element("i", "fa-solid fa-" + icons[index]));
            button.replaceChildren(marker, this.element("span", "modal-stepper-label", label));
            item.append(button);
            navigation.append(item);
        });

        return navigation;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the active wizard step.
     * @returns Active step element
     */
    /****************************************************************************/
    renderStep() {
        if (this.currentStep == 0) return this.renderGeneral();
        if (this.currentStep == 1) return this.renderTriggers();
        if (this.currentStep == 2) return this.renderConditions();
        if (this.currentStep == 3) return this.renderActions();

        return this.renderReview();
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the general settings step.
     * @returns General settings element
     */
    /****************************************************************************/
    renderGeneral() {
        const section =
            this.section(TEXT_AUTOMATION_GENERAL_TITLE, TEXT_AUTOMATION_GENERAL_DESCRIPTION);

        section.append(this.input(
            TEXT_NAME, "name", this.draft.name, "text", null, "name"
        ), this.error("name"));

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the trigger configuration step.
     * @returns Trigger step element
     */
    /****************************************************************************/
    renderTriggers() {
        const section = this.section(TEXT_AUTOMATION_WHEN_TITLE, TEXT_AUTOMATION_WHEN_DESCRIPTION);
        section.appendChild(this.error("triggers"));

        const list = this.element("div", "automation-rule-list");

        /****************************************************************************/
        /*!
         * @brief   Appends an editable trigger card to the rule list.
         * @param   item                    Item in the current collection.
         * @param   index                   Position in the displayed sequence.
         */
        /****************************************************************************/
        this.draft.triggers.forEach((item, index) => {
            list.appendChild(this.ruleCard("trigger", item, index, this.triggerFields(item)));
        });

        section.appendChild(list);

        if (this.draft.triggers.length > 1) {
            section.appendChild(this.select(
                TEXT_AUTOMATION_MULTIPLE_TRIGGERS, "trigger_match", this.draft.trigger_match,
                [["any", TEXT_AUTOMATION_MATCH_ANY], ["all", TEXT_AUTOMATION_MATCH_ALL]]
            ));
        }

        section.appendChild(this.addButton(
            TEXT_AUTOMATION_ADD_TRIGGER, AUTOMATION_UI_ACTION_ADD_TRIGGER
        ));

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders fields for a trigger.
     * @param   item                    Trigger draft
     * @returns Trigger fields fragment
     */
    /****************************************************************************/
    triggerFields(item) {
        const fragment = document.createDocumentFragment();

        fragment.appendChild(this.choiceTiles(TEXT_AUTOMATION_TRIGGER_TYPE, "kind", item.kind, [
            ["device", TEXT_AUTOMATION_DEVICE_OR_GROUP], ["time", TEXT_TIME],
            ["manual", TEXT_AUTOMATION_MANUAL]
        ], "triggers", item.id));

        if (item.kind == "manual") {
            fragment.appendChild(this.notice(TEXT_AUTOMATION_MANUAL_DESCRIPTION, "info"));
        } else if (item.kind == "signal") {
            fragment.appendChild(this.notice(TEXT_AUTOMATION_HUB_UNAVAILABLE, "warning"));
        } else if (item.kind == "time") {
            fragment.append(this.input(
                TEXT_TIME, "time", item.time, "time", "triggers", null, item.id
            ), this.dayField(item));
        } else {
            const grid = this.element("div", "automation-field-grid");

            grid.append(this.choiceTiles(
                TEXT_AUTOMATION_SOURCE_TYPE, "source_type", item.source_type,
                this.sourceTypeOptions(), "triggers", item.id
            ), this.choiceTiles(
                TEXT_AUTOMATION_SOURCE, "source_id", item.source_id,
                this.sourceOptions(item.source_type), "triggers", item.id
            ));
            fragment.appendChild(grid);

            if (!this.sourceExists(item.source_type, item.source_id)) return fragment;

            grid.appendChild(this.fixedTriggerEvent(item)
                ? this.element(
                    "p", "",
                    TEXT_AUTOMATION_EVENT + ": " + this.optionText(this.eventOptions(), item.event)
                )
                : this.select(
                    TEXT_AUTOMATION_EVENT, "event", item.event, this.eventOptions(), "triggers",
                    item.id
                ));

            if (item.source_type == "group") {
                grid.appendChild(this.select(
                    TEXT_AUTOMATION_GROUP_TRIGGER_BEHAVIOUR, "group_match", item.group_match,
                    [
                        ["any_member", TEXT_AUTOMATION_ANY_GROUP_MEMBER],
                        ["all_members", TEXT_AUTOMATION_ALL_GROUP_MEMBERS]
                    ],
                    "triggers", item.id
                ));
            }

            if (item.event == "numeric") {
                grid.append(this.select(
                    TEXT_AUTOMATION_OPERATOR, "operator", item.operator, this.operatorOptions(true),
                    "triggers", item.id
                ), this.input(
                    TEXT_AUTOMATION_VALUE, "state", item.state, "number", "triggers", null, item.id
                ));
            } else {
                const isButton = this.fixedTriggerEvent(item) === "button";
                const options =
                    isButton ? this.buttonOptions(item.source_id) : this.stateOptions(item);
                if (isButton
                    && (!options.length || item.button_id && !options.some(([id]) =>
                        id === item.button_id))) {
                    grid.appendChild(this.notice(
                        TEXT_AUTOMATION_BUTTON_MISSING, NOTICE_TYPE_WARNING
                    ));
                }
                grid.appendChild(this.choiceTiles(TEXT_AUTOMATION_VALUE, isButton
                    ? "button_id"
                    : "state", isButton
                    ? item.button_id
                    : item.state, options, "triggers", item.id));
            }
        }

        return fragment;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the condition configuration step.
     * @returns Condition step element
     */
    /****************************************************************************/
    renderConditions() {
        const section =
            this.section(TEXT_AUTOMATION_CONDITIONS_TITLE, TEXT_AUTOMATION_CONDITIONS_DESCRIPTION);

        if (this.draft.conditions.length == 0) {
            const emptyNotice = this.notice(TEXT_AUTOMATION_CONDITIONS_OPTIONAL, NOTICE_TYPE_INFO);
            section.appendChild(emptyNotice);
        }

        const conditionList = this.element("div", "automation-rule-list");

        for (let index = 0; index < this.draft.conditions.length; index++) {
            const condition = this.draft.conditions[index];
            const fields = this.conditionFields(condition);

            const conditionCard =
                this.ruleCard(AUTOMATION_RULE_CONDITION, condition, index, fields);

            conditionList.appendChild(conditionCard);
        }

        const addConditionButton =
            this.addButton(TEXT_AUTOMATION_ADD_CONDITION, AUTOMATION_UI_ACTION_ADD_CONDITION);
        section.append(conditionList, addConditionButton);

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders fields for a condition.
     * @param   condition               Condition draft
     * @returns Condition fields fragment
     */
    /****************************************************************************/
    conditionFields(condition) {
        const fragment = document.createDocumentFragment();
        const conditionTypeOptions = [[AUTOMATION_CONDITION_TIME_WINDOW, TEXT_TIME_WINDOW], [
            AUTOMATION_CONDITION_DEVICE_STATE, TEXT_AUTOMATION_DEVICE_STATE
        ], [AUTOMATION_CONDITION_NUMERIC, TEXT_AUTOMATION_NUMERIC_VALUE]];

        const conditionTypeField = this.choiceTiles(
            TEXT_AUTOMATION_CONDITION_TYPE, "type", condition.type, conditionTypeOptions,
            "conditions", condition.id
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

    /****************************************************************************/
    /*!
     * @brief   Renders fields for a time-window condition.
     * @param   condition               Time-window condition draft
     * @returns Condition fields fragment
     */
    /****************************************************************************/
    timeWindowConditionFields(condition) {
        const fieldGrid = this.element("div", "automation-field-grid");

        const startTimeField = this.input(
            TEXT_AUTOMATION_START_TIME, "start_time", condition.start_time, INPUT_TYPE_TIME,
            "conditions", null, condition.id
        );

        const endTimeField = this.input(
            TEXT_AUTOMATION_END_TIME, "end_time", condition.end_time, INPUT_TYPE_TIME, "conditions",
            null, condition.id
        );

        const windowBehaviourOptions =
            [[true, TEXT_AUTOMATION_INSIDE_WINDOW], [false, TEXT_AUTOMATION_OUTSIDE_WINDOW]];

        const windowBehaviourField = this.select(
            TEXT_AUTOMATION_WINDOW_BEHAVIOUR, "active_in_window", condition.active_in_window,
            windowBehaviourOptions, "conditions", condition.id
        );

        fieldGrid.append(startTimeField, endTimeField, windowBehaviourField);

        return fieldGrid;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders fields for a source condition.
     * @param   condition               Source condition draft
     * @returns Condition fields fragment
     */
    /****************************************************************************/
    sourceConditionFields(condition) {
        const fieldGrid = this.element("div", "automation-field-grid");

        const sourceTypeField = this.choiceTiles(
            TEXT_AUTOMATION_SOURCE_TYPE, "source_type", condition.source_type,
            this.sourceTypeOptions(), "conditions", condition.id
        );

        const sourceField = this.choiceTiles(
            TEXT_AUTOMATION_SOURCE, "source_id", condition.source_id,
            this.sourceOptions(condition.source_type), "conditions", condition.id
        );

        fieldGrid.append(sourceTypeField, sourceField);

        if (!this.sourceExists(condition.source_type, condition.source_id)) return fieldGrid;

        const isNumericCondition = condition.type == AUTOMATION_CONDITION_NUMERIC;

        const operatorField = this.select(
            TEXT_AUTOMATION_OPERATOR, "operator", condition.operator,
            this.operatorOptions(isNumericCondition), "conditions", condition.id
        );

        let inputType = INPUT_TYPE_TEXT;

        if (isNumericCondition) {
            inputType = INPUT_TYPE_NUMBER;
        }

        const valueField = this.input(
            TEXT_AUTOMATION_VALUE, "value", condition.value, inputType, "conditions", null,
            condition.id
        );

        fieldGrid.append(operatorField, valueField);

        return fieldGrid;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the ordered action configuration step.
     * @returns Action step element
     */
    /****************************************************************************/
    renderActions() {
        const section =
            this.section(TEXT_AUTOMATION_ACTIONS_TITLE, TEXT_AUTOMATION_ACTIONS_DESCRIPTION);

        const actionsError = this.error("actions");

        section.appendChild(actionsError);

        const actionList = this.element("div", "automation-rule-list");

        for (let index = 0; index < this.draft.actions.length; index++) {
            const action = this.draft.actions[index];
            const fields = this.renderActionFields(action);

            const actionCard = this.ruleCard(AUTOMATION_RULE_ACTION, action, index, fields, true);

            actionList.appendChild(actionCard);
        }

        const addActionButton =
            this.addButton(TEXT_AUTOMATION_ADD_ACTION, AUTOMATION_UI_ACTION_ADD_ACTION);
        const executionFields = this.executionFields();

        section.append(actionList, addActionButton, executionFields);

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders fields for an action.
     * @param   action                  Action draft
     * @returns Action fields fragment
     */
    /****************************************************************************/
    renderActionFields(action) {
        const fragment = document.createDocumentFragment();

        const actionTypeField = this.choiceTiles(
            TEXT_AUTOMATION_ACTION_TYPE, "type", action.type, this.actionOptions(), "actions",
            action.id
        );

        fragment.appendChild(actionTypeField);

        if (action.type == AUTOMATION_ACTION_WAIT) {
            const waitField = this.renderWaitActionField(action);
            fragment.appendChild(waitField);

            return fragment;
        }

        if (this.isUnavailableAction(action.type)) {
            const unavailableNotice =
                this.notice(TEXT_AUTOMATION_HUB_UNAVAILABLE, NOTICE_TYPE_WARNING);

            fragment.appendChild(unavailableNotice);

            return fragment;
        }

        const targetTypeField = this.choiceTiles(
            TEXT_AUTOMATION_TARGET_TYPE, "target_type", action.target_type,
            this.sourceTypeOptions(), "actions", action.id
        );

        const targetField = this.targetField(action);

        fragment.append(targetTypeField, targetField);

        if (action.target_type == AUTOMATION_REFERENCE_GROUP) {
            const groupNotice =
                this.notice(TEXT_AUTOMATION_DYNAMIC_GROUP_MEMBERSHIP, NOTICE_TYPE_INFO);
            fragment.appendChild(groupNotice);
        }

        const parameterField = this.renderActionParameterField(action);

        if (parameterField != null) {
            fragment.appendChild(parameterField);
        }

        return fragment;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the duration field for a wait action.
     * @param   action                  Wait action draft
     * @returns Wait duration field
     */
    /****************************************************************************/
    renderWaitActionField(action) {
        return this.input(
            TEXT_AUTOMATION_DURATION_MINUTES, "duration_minutes", action.duration_minutes,
            INPUT_TYPE_NUMBER, "actions", null, action.id, 1
        );
    }

    /****************************************************************************/
    /*!
     * @brief   Checks whether an action type is unavailable.
     * @param   actionType              Action type
     * @returns Whether the action is unavailable
     */
    /****************************************************************************/
    isUnavailableAction(actionType) {
        const unavailableActionTypes =
            [AUTOMATION_ACTION_SEND_IR, AUTOMATION_ACTION_SEND_RF, AUTOMATION_ACTION_CAMERA_RECORD];

        return unavailableActionTypes.includes(actionType);
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the capability parameter for an action.
     * @param   action                  Action draft
     * @returns Parameter field or null
     */
    /****************************************************************************/
    renderActionParameterField(action) {
        if (action.type === "send_button") {
            const buttons = this.buttonOptions(action.target_ids[0], true);

            return this.choiceTiles(
                TEXT_AUTOMATION_VALUE, "parameter_code_id", action.parameters.code_id, buttons,
                "actions", action.id
            );
        }
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

    /****************************************************************************/
    /*!
     * @brief   Renders the power parameter for an action.
     * @param   action                  Power action draft
     * @returns Power parameter field
     */
    /****************************************************************************/
    renderPowerActionField(action) {
        const powerOptions = [[1, TEXT_ON], [0, TEXT_OFF]];

        return this.choiceTiles(
            TEXT_AUTOMATION_VALUE, "parameter_power", action.parameters.power, powerOptions,
            "actions", action.id
        );
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the color parameter for an action.
     * @param   action                  Color action draft
     * @returns Color parameter field
     */
    /****************************************************************************/
    renderColorActionField(action) {
        let color = action.parameters.color;

        if (color == null) {
            color = DEFAULT_AUTOMATION_COLOR;
        }

        return this.input(
            TEXT_COLOR, "parameter_color", color, INPUT_TYPE_COLOR, "actions", null, action.id
        );
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the mode parameter for an action.
     * @param   action                  Mode action draft
     * @returns Mode parameter field
     */
    /****************************************************************************/
    renderModeActionField(action) {
        const modeOptions = [];

        for (const mode of this.getModes()) {
            modeOptions.push([mode.id, mode.name]);
        }

        return this.choiceTiles(
            TEXT_MODE, "parameter_mode", action.parameters.mode, modeOptions, "actions", action.id
        );
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the review step.
     * @returns Review step element
     */
    /****************************************************************************/
    renderReview() {
        const section = this.section(TEXT_AUTOMATION_REVIEW_TITLE, TEXT_AUTOMATION_REVIEW_DESCRIPTION);
        const readyNotice = this.notice(TEXT_AUTOMATION_READY_TO_SAVE, NOTICE_TYPE_SUCCESS);
        const reviewList = this.element("div", "automation-review-list");
        const triggerReview = this.reviewSection(TEXT_AUTOMATION_WHEN, this.triggerSummary());
        const conditionReview = this.reviewSection(TEXT_AUTOMATION_ONLY_IF, this.conditionSummary());
        const actionReview = this.reviewSection(TEXT_AUTOMATION_THEN, this.actionSummary());

        reviewList.append(triggerReview, conditionReview, actionReview);
        section.append(readyNotice, reviewList);

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the wizard footer controls.
     * @returns Footer element
     */
    /****************************************************************************/
    renderFooter() {
        const footer = this.element("footer", "modal-form-actions automation-wizard-footer");

        if (this.currentStep > 0) {
            const previousButton =
                this.button(TEXT_AUTOMATION_PREVIOUS, AUTOMATION_UI_ACTION_PREVIOUS);

            footer.appendChild(previousButton);
        }

        let primaryButtonText = TEXT_AUTOMATION_NEXT;
        let primaryButtonAction = AUTOMATION_UI_ACTION_NEXT;

        if (this.currentStep == AUTOMATION_REVIEW_STEP) {
            primaryButtonText = TEXT_SAVE;
            primaryButtonAction = AUTOMATION_UI_ACTION_SAVE;
        }

        const primaryButton = this.button(primaryButtonText, primaryButtonAction);
        footer.appendChild(primaryButton);

        if (this.draft.id != AUTOMATION_NEW_ID) {
            if (primaryButtonAction !== AUTOMATION_UI_ACTION_SAVE) {
                footer.appendChild(this.button(TEXT_SAVE, AUTOMATION_UI_ACTION_SAVE));
            }

            const deleteButton = this.button(TEXT_DELETE, AUTOMATION_UI_ACTION_DELETE);
            deleteButton.classList.add("button-error");
            footer.appendChild(deleteButton);
        }

        return footer;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a rule card.
     * @param   type                    Rule type
     * @param   item                    Rule draft
     * @param   index                   Rule index
     * @param   fields                  Rule field elements
     * @param   movable                 Whether the rule can be reordered
     * @returns Rule card element
     */
    /****************************************************************************/
    ruleCard(type, item, index, fields, movable = false) {
        const errorKey = type + "-" + item.id;

        const card = this.element("article", "automation-rule-card");

        if (this.errors[errorKey]) {
            card.classList.add("has-error");
        }

        const header = this.element("header", "automation-rule-header");
        const number = this.element("span", "automation-rule-number", index + 1);
        const title = this.element("strong", "", this.ruleTitle(type));
        const tools = this.ruleTools(type, item, index, movable);

        const error = this.error(errorKey);

        header.append(number, title, tools);
        card.append(header, fields, error);

        return card;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders controls for a rule card.
     * @param   type                    Rule type
     * @param   item                    Rule draft
     * @param   index                   Rule index
     * @param   movable                 Whether the rule can be reordered
     * @returns Rule toolbar element
     */
    /****************************************************************************/
    ruleTools(type, item, index, movable) {
        const tools = this.element("div", "automation-rule-tools");

        if (movable) {
            const isFirstAction = index == 0;
            const isLastAction = index == this.draft.actions.length - 1;

            const moveUpButton = this.iconButton(
                TEXT_AUTOMATION_MOVE_UP, "fa-solid fa-arrow-up",
                AUTOMATION_UI_ACTION_MOVE_ACTION_UP, item.id, isFirstAction
            );

            const moveDownButton = this.iconButton(
                TEXT_AUTOMATION_MOVE_DOWN, "fa-solid fa-arrow-down",
                AUTOMATION_UI_ACTION_MOVE_ACTION_DOWN, item.id, isLastAction
            );

            tools.append(moveUpButton, moveDownButton);
        }

        const removeButton = this.iconButton(
            TEXT_AUTOMATION_REMOVE, "fa-solid fa-trash", AUTOMATION_UI_ACTION_REMOVE_PREFIX + type,
            item.id
        );

        tools.appendChild(removeButton);

        return tools;
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the visible title for a rule type.
     * @param   type                    Rule type
     * @returns Localized rule title
     */
    /****************************************************************************/
    ruleTitle(type) {
        if (type == AUTOMATION_RULE_ACTION) {
            return TEXT_AUTOMATION_ACTION;
        }

        if (type == AUTOMATION_RULE_TRIGGER) {
            return TEXT_AUTOMATION_TRIGGER;
        }

        return TEXT_AUTOMATION_CONDITION;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a wizard section.
     * @param   title                   Section title
     * @param   description             Section description
     * @returns Section element
     */
    /****************************************************************************/
    section(title, description) {
        const section = this.element("section");
        const header = this.element("header", "automation-step-heading");

        header.append(this.element("h4", "", title), this.element("p", "", description));
        section.appendChild(header);

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a labeled input field.
     * @param   labelText               Visible field label
     * @param   field                   Draft field name
     * @param   value                   Current value
     * @param   type                    Input type
     * @param   collection              Draft collection name
     * @param   errorKey                Validation error key
     * @param   itemId                  Draft item identifier
     * @param   min                     Minimum numeric value
     * @returns Field element
     */
    /****************************************************************************/
    input(
        labelText, field, value, type, collection = null, errorKey = null, itemId = null,
        min = null
    ) {
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

    /****************************************************************************/
    /*!
     * @brief   Creates a labeled select field.
     * @param   labelText               Visible field label
     * @param   field                   Draft field name
     * @param   value                   Selected value
     * @param   options                 Available options
     * @param   collection              Draft collection name
     * @param   itemId                  Draft item identifier
     * @param   placeholder             Optional placeholder
     * @returns Field element
     */
    /****************************************************************************/
    select(labelText, field, value, options, collection = null, itemId = null, placeholder = null) {
        const container = this.element("div", "automation-field");
        const select = this.element("select", "input-field");
        const selectId = this.fieldId(collection, field, itemId);

        select.id = selectId;

        if (placeholder != null) select.appendChild(this.option("", placeholder, value));

        options.forEach(item => select.appendChild(this.option(item[0], item[1], value)));

        this.fieldData(select, field, collection, itemId);

        const label = this.element("label", "", labelText);
        label.htmlFor = selectId;
        container.append(label, select);

        return container;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a unique identifier for a draft field.
     * @param   collection              Draft collection name
     * @param   field                   Field name
     * @param   itemId                  Draft item identifier
     * @returns Field identifier
     */
    /****************************************************************************/
    fieldId(collection, field, itemId) {
        return this.id + "-" + (collection ?? "general")
            + "-"
            + field
            + (itemId == null
            ? ""
            : "-" + itemId);
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a labeled checkbox.
     * @param   text                    Visible checkbox text
     * @param   field                   Draft field name
     * @param   checked                 Whether the checkbox is selected
     * @returns Checkbox label element
     */
    /****************************************************************************/
    checkbox(text, field, checked) {
        const label = this.element("label", "automation-checkbox-row");
        const input = this.element("input");

        input.type = "checkbox";
        input.checked = checked;
        input.dataset.field = field;
        label.append(input, this.element("span", "", text));

        return label;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the weekday selector for a trigger.
     * @param   item                    Trigger draft
     * @returns Weekday field element
     */
    /****************************************************************************/
    dayField(item) {
        const fieldset = this.element("fieldset", "automation-day-field");
        fieldset.appendChild(this.element("legend", "", TEXT_DAYS));

        const container = this.element("div");

        /****************************************************************************/
        /*!
         * @brief   Creates a weekday checkbox with its current draft selection.
         * @param   day                     Weekday value and label.
         */
        /****************************************************************************/
        this.dayOptions().forEach(day => {
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

    /****************************************************************************/
    /*!
     * @brief   Creates the target selector for an action.
     * @param   item                    Action draft
     * @returns Target field element
     */
    /****************************************************************************/
    targetField(item) {
        const fieldset =
            this.element("fieldset", "automation-target-field automation-choice-field");
        fieldset.appendChild(this.element("legend", "", TEXT_AUTOMATION_TARGETS));

        const container = this.element("div", "catalog-choices");

        /****************************************************************************/
        /*!
         * @brief   Creates a compatible target tile with its current draft selection.
         * @param   option                  Target value and label.
         */
        /****************************************************************************/
        this.sourceOptions(item.target_type, true).filter(
            ([id]) => this.actionCompatible({ ...item, target_ids: [id] }, false)
        ).forEach(option => {
            const label = this.element("label", "automation-target-option");
            const input = this.element("input");

            input.type = "checkbox";
            input.checked = item.target_ids.map(Number).includes(Number(option[0]));
            this.fieldData(input, "target_ids", "actions", item.id);
            input.dataset.value = option[0];
            this.decorateChoiceTile(
                label, input, option[1], "target_ids", option[0], item.target_type
            );
            container.appendChild(label);
        });

        fieldset.appendChild(container);

        return fieldset;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates advanced execution settings.
     * @returns Execution settings element
     */
    /****************************************************************************/
    executionFields() {
        const details = this.element("details", "automation-advanced");
        details.appendChild(this.element("summary", "", TEXT_AUTOMATION_ADVANCED_EXECUTION));

        const grid = this.element("div", "automation-field-grid");

        const concurrencyPolicyOptions = [[
            AUTOMATION_CONCURRENCY_RESTART, TEXT_AUTOMATION_RESTART
        ], [AUTOMATION_CONCURRENCY_SINGLE, TEXT_AUTOMATION_IGNORE_NEW], [
            AUTOMATION_CONCURRENCY_PARALLEL, TEXT_AUTOMATION_PARALLEL
        ]];

        const concurrencyPolicyField = this.select(
            TEXT_AUTOMATION_ALREADY_RUNNING, "concurrency_policy", this.draft.concurrency_policy,
            concurrencyPolicyOptions
        );

        const errorPolicyOptions = [[AUTOMATION_ERROR_STOP, TEXT_AUTOMATION_STOP], [
            AUTOMATION_ERROR_CONTINUE, TEXT_AUTOMATION_CONTINUE
        ]];

        const errorPolicyField = this.select(
            TEXT_AUTOMATION_ACTION_FAILURE, "error_policy", this.draft.error_policy,
            errorPolicyOptions
        );

        grid.append(concurrencyPolicyField, errorPolicyField);

        details.appendChild(grid);

        return details;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a section for review summary lines.
     * @param   title                   Section title
     * @param   lines                   Summary lines
     * @returns Review section element
     */
    /****************************************************************************/
    reviewSection(title, lines) {
        const section = this.element("section", "automation-review-section");
        section.appendChild(this.element("span", "", title));
        lines.forEach(line => section.appendChild(this.element("p", "", line)));

        return section;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a notice message.
     * @param   text                    Notice text
     * @param   type                    Notice type
     * @returns Notice element
     */
    /****************************************************************************/
    notice(text, type) {
        const notice = this.element("div", "automation-notice " + type, text);
        notice.setAttribute("role", "status");

        return notice;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates validation feedback for an error key.
     * @param   key                     Validation error key
     * @returns Error element
     */
    /****************************************************************************/
    error(key) {
        if (!this.errors[key]) return this.element("span");

        const error = this.element("p", "automation-field-error", this.errors[key]);
        error.dataset.errorKey = key;
        error.tabIndex = -1;
        error.setAttribute("role", "alert");

        return error;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an add-rule button.
     * @param   text                    Button text
     * @param   action                  Button action
     * @returns Button element
     */
    /****************************************************************************/
    addButton(text, action) {
        const button = this.button(text, action);
        button.classList.add("automation-add-button");

        return button;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a wizard button.
     * @param   text                    Button text
     * @param   action                  Button action
     * @returns Button element
     */
    /****************************************************************************/
    button(text, action) {
        const button = this.element("button", "", text);
        button.type = "button";
        button.dataset.automationAction = action;

        return button;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an icon-only rule button.
     * @param   label                   Accessible button label
     * @param   iconClass               Icon class
     * @param   action                  Button action
     * @param   id                      Rule identifier
     * @param   disabled                Whether the button is disabled
     * @returns Button element
     */
    /****************************************************************************/
    iconButton(label, iconClass, action, id, disabled = false) {
        const button = this.element("button");
        button.type = "button";
        button.disabled = disabled;
        button.dataset.automationAction = action;
        button.dataset.id = id;
        button.setAttribute("aria-label", label);
        button.appendChild(this.element("i", iconClass));

        return button;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates an option element.
     * @param   value                   Option value
     * @param   text                    Visible option text
     * @param   selected                Whether the option is selected
     * @returns Option element
     */
    /****************************************************************************/
    option(value, text, selected) {
        const option = this.element("option", "", text);
        option.value = value;
        option.selected = String(value) == String(selected);

        return option;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a DOM element with common properties.
     * @param   tag                     HTML tag name
     * @param   className               CSS class names
     * @param   text                    Optional text content
     * @returns DOM element
     */
    /****************************************************************************/
    element(tag, className = "", text = undefined) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text != undefined) element.textContent = String(text);

        return element;
    }

    /****************************************************************************/
    /*!
     * @brief   Attaches draft metadata to a field element.
     * @param   element                 Field element
     * @param   field                   Draft field name
     * @param   collection              Draft collection name
     * @param   id                      Draft item identifier
     * @param   errorKey                Validation error key
     */
    /****************************************************************************/
    fieldData(element, field, collection, id, errorKey) {
        element.dataset.field = field;
        if (collection) element.dataset.collection = collection;
        if (id != null) element.dataset.id = id;
        if (errorKey) element.dataset.errorKey = errorKey;
    }

    /****************************************************************************/
    /*!
     * @brief   Returns source-type options.
     * @returns Source-type options
     */
    /****************************************************************************/
    sourceTypeOptions() {
        return [["device", TEXT_DEVICE], ["group", TEXT_GROUP]];
    }

    /****************************************************************************/
    /*!
     * @brief   Returns available source or target options.
     * @param   type                    Reference type
     * @param   target                  Whether options are for an action target
     * @returns Reference options
     */
    /****************************************************************************/
    sourceOptions(type, target = false) {
        if (type == "group") {
            return this.getGroups().map(group =>
                [group.id, VAR_TEXT_AUTOMATION_GROUP_OPTION(
                    group.name, group.device_ids?.length || TEXT_AUTOMATION_EMPTY
                )]);
        }

        return this.getDevices().filter(device =>
            device.role !== "hub").map(device =>
            [device.id, device.name]);
    }

    /****************************************************************************/
    /*!
     * @brief   Returns trigger event options.
     * @returns Event options
     */
    /****************************************************************************/
    eventOptions() {
        return [
            ["state", TEXT_AUTOMATION_STATE_CHANGES], ["button", TEXT_AUTOMATION_BUTTON_PRESSED],
            ["numeric", TEXT_AUTOMATION_MEASUREMENT_CHANGES]
        ];
    }

    /****************************************************************************/
    /*!
     * @brief   Returns comparison operator options.
     * @param   numeric                 Whether numeric operators are required
     * @returns Operator options
     */
    /****************************************************************************/
    operatorOptions(numeric) {
        const options =
            [["equals", TEXT_AUTOMATION_EQUALS], ["not_equals", TEXT_AUTOMATION_NOT_EQUALS]];

        if (numeric) {
            options.push(
                ["greater_than", TEXT_AUTOMATION_GREATER_THAN],
                ["less_than", TEXT_AUTOMATION_LESS_THAN]
            );
        }

        return options;
    }

    /****************************************************************************/
    /*!
     * @brief   Returns state options for a trigger.
     * @param   item                    Trigger draft
     * @returns State options
     */
    /****************************************************************************/
    stateOptions(item) {
        if (item.event == "button") {
            return [
                ["short_press", TEXT_AUTOMATION_SHORT_PRESS],
                ["double_press", TEXT_AUTOMATION_DOUBLE_PRESS], ["hold", TEXT_AUTOMATION_HOLD],
                ["release", TEXT_AUTOMATION_RELEASE]
            ];
        }

        const device = this.getDevices().find(entry => entry.id == item.source_id);
        const model = this.props.models.find(entry => entry.model_id == device?.model_id);

        return model?.states?.length
            ? model.states.map(state => [state.state, state.name])
            : [[1, TEXT_ON], [0, TEXT_OFF]];
    }

    /****************************************************************************/
    /*!
     * @brief   Returns action-type options.
     * @returns Action-type options
     */
    /****************************************************************************/
    actionOptions() {
        const options = this.getActions().map(item => [item.function, item.name]);

        options.push(
            ["wait", TEXT_AUTOMATION_WAIT], ["send_button", TEXT_AUTOMATION_SEND_BUTTON],
            ["camera_record", TEXT_AUTOMATION_RECORD_CAMERA]
        );

        return options;
    }

    /****************************************************************************/
    /*!
     * @brief   Returns weekday options.
     * @returns Weekday options
     */
    /****************************************************************************/
    dayOptions() {
        return [
            [0, TEXT_AUTOMATION_MONDAY_SHORT], [1, TEXT_AUTOMATION_TUESDAY_SHORT],
            [2, TEXT_AUTOMATION_WEDNESDAY_SHORT], [3, TEXT_AUTOMATION_THURSDAY_SHORT],
            [4, TEXT_AUTOMATION_FRIDAY_SHORT], [5, TEXT_AUTOMATION_SATURDAY_SHORT],
            [6, TEXT_AUTOMATION_SUNDAY_SHORT]
        ];
    }

    /****************************************************************************/
    /*!
     * @brief   Creates plain-language trigger summaries.
     * @returns Trigger summary lines
     */
    /****************************************************************************/
    triggerSummary() {
        /****************************************************************************/
        /*!
         * @brief   Formats a trigger summary for its time, source or manual event.
         * @param   item                    Item in the current collection.
         * @returns Formatted display text.
         */
        /****************************************************************************/
        return this.draft.triggers.map(item => {
            if (item.kind == "time") return VAR_TEXT_AUTOMATION_TIME(item.time);
            if (item.kind == "manual") return TEXT_AUTOMATION_MANUALLY_STARTED;
            if (item.kind == "signal") return TEXT_AUTOMATION_SIGNAL_RECEIVED;

            return VAR_TEXT_AUTOMATION_BECOMES(
                this.sourceName(item.source_type, item.source_id),
                item.button_id
                    ? this.optionText(this.buttonOptions(item.source_id), item.button_id)
                    : item.state
            );
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Creates plain-language condition summaries.
     * @returns Condition summary lines
     */
    /****************************************************************************/
    conditionSummary() {
        if (!this.draft.conditions.length) return [TEXT_AUTOMATION_NO_CONDITIONS];

        return this.draft.conditions.map(item =>
            item.type == "time_window"
            ? VAR_TEXT_AUTOMATION_TIME_WINDOW(item.start_time, item.end_time)
                : VAR_TEXT_AUTOMATION_SOURCE_VALUE(
                    this.sourceName(item.source_type, item.source_id), item.value
                ));
    }

    /****************************************************************************/
    /*!
     * @brief   Creates plain-language action summaries.
     * @returns Action summary lines
     */
    /****************************************************************************/
    actionSummary() {
        /****************************************************************************/
        /*!
         * @brief   Resolves an action target identifier to its visible name.
         * @param   id                      Identifier of the affected item.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        return this.draft.actions.map((item, index) => item.type == "wait"
            ? VAR_TEXT_AUTOMATION_WAIT_SUMMARY(index + 1, item.duration_minutes)
            : VAR_TEXT_AUTOMATION_ACTION_SUMMARY(
                index + 1, this.optionText(this.actionOptions(), item.type),
                item.target_ids.map(
                    id => { return this.sourceName(item.target_type, id); }
                ).join(", ")
            ));
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the visible name of a source or target.
     * @param   type                    Reference type
     * @param   id                      Reference identifier
     * @returns Reference name
     */
    /****************************************************************************/
    sourceName(type, id) {
        const source = type == "group" ? this.getGroups() : this.getDevices();

        return source.find(item => item.id == id)?.name ?? TEXT_AUTOMATION_MISSING_SOURCE;
    }

    /****************************************************************************/
    /*!
     * @brief   Checks whether a source or target exists.
     * @param   type                    Reference type
     * @param   id                      Reference identifier
     * @returns Whether the reference exists
     */
    /****************************************************************************/
    sourceExists(type, id) {
        const source = type == "group" ? this.getGroups() : this.getDevices();

        return id !== "" && source.some(item => item.id == id && item.role !== "hub");
    }

    /****************************************************************************/
    /*!
     * @brief   Checks whether an action supports all selected targets.
     * @param   action                  Action draft
     * @returns Whether the action is compatible
     */
    /****************************************************************************/
    actionCompatible(action, validateButton = true) {
        if (action.type === "wait" || !action.target_ids.length) return true;

        if (action.type === "send_button") {
            if (action.target_type !== "device" || action.target_ids.length !== 1) return false;

            const options = this.buttonOptions(action.target_ids[0], true);

            return validateButton
                ? options.some(([id]) => id === action.parameters.code_id)
                : options.length > 0;
        }

        const capability = {
            set_device_power: "power.set",
            set_ledstrip_color: "color.set",
            set_ledstrip_mode: "mode.set"
        }[action.type];
        const definition = this.getActions().find(item => item.function === action.type);
        const ids = action.target_type === "device"
            ? action.target_ids
            : action.target_ids.flatMap(id =>
            this.getGroups().find(group => group.id == id)?.device_ids
            ?? []);

        /****************************************************************************/
        /*!
         * @brief   Checks whether a referenced device supports the action capability.
         * @param   id                      Identifier of the affected item.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        return ids.length > 0 && ids.every(id => {
            const device = this.getDevices().find(item => item.id == id);

            return device && device.role !== "hub"
                && (device.capabilities?.includes(capability)
                || definition?.device_types?.includes(device.type));
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the event implied by a supported source category.
     * @param   item                    Trigger draft
     * @returns Event name or undefined
     */
    /****************************************************************************/
    fixedTriggerEvent(item) {
        const device = this.getDevices().find(entry => entry.id == item.source_id);
        if (item.source_type !== "device" || !device) return;
        if (device.category === DEVICE_CATEGORY_REMOTE) return "button";
        if ([
            DEVICE_CATEGORY_LEDSTRIP, DEVICE_CATEGORY_DOOR_SENSOR, DEVICE_CATEGORY_MOTION_SENSOR,
            DEVICE_CATEGORY_SWITCH, DEVICE_CATEGORY_POWER_OUTLET
        ].includes(device.category)) return "state";
    }

    /****************************************************************************/
    /*!
     * @brief   Lists learned buttons suitable for trigger or transmission.
     * @param   deviceId                Owner of the buttons
     * @param   transmit                Whether the button must be sendable
     * @returns Stable button IDs and visible names
     */
    /****************************************************************************/
    buttonOptions(deviceId, transmit = false) {
        const device = this.getDevices().find(entry => entry.id == deviceId);

        return (device?.hub_codes ?? []).filter(code =>
            transmit
            ? code.can_transmit
            : code.medium === "ir"
            || !code.can_transmit).map(code => [code.id, code.name]);
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a single-choice input as keyboard-accessible tiles.
     * @param   title                   Visible group name
     * @param   field                   Draft field name
     * @param   selected                Current value
     * @param   options                 Value and label pairs
     * @param   collection              Draft rule collection
     * @param   id                      Draft rule ID
     * @returns Group of radio tiles
     */
    /****************************************************************************/
    choiceTiles(title, field, selected, options, collection, id) {
        const fieldset = this.element("fieldset", "automation-choice-field");
        fieldset.appendChild(this.element("legend", "", title));

        const grid = this.element("div", "catalog-choices");
        for (const [value, text] of options) {
            const label = this.element("label");
            const input = this.element("input");

            input.type = "radio";
            input.name = this.fieldId(collection, field, id);
            input.value = value;
            input.checked = String(value) === String(selected);
            this.fieldData(input, field, collection, id);

            const sourceType = field === "source_id"
                ? this.draft[collection].find(item => item.id === id)?.source_type
                : undefined;
            this.decorateChoiceTile(label, input, text, field, value, sourceType);
            grid.appendChild(label);
        }

        fieldset.appendChild(grid);

        return fieldset;
    }

    /****************************************************************************/
    /*!
     * @brief   Adds a catalog icon and a selection mark to a form tile.
     * @param   label                   Tile label element
     * @param   input                   Native radio or checkbox
     * @param   text                    Visible label
     * @param   field                   Draft field name
     * @param   value                   Tile value
     * @param   referenceType           Optional device or group reference
     */
    /****************************************************************************/
    decorateChoiceTile(label, input, text, field, value, referenceType) {
        const actionIcons = {
            device: "microchip",
            group: "layer-group",
            time: "clock",
            manual: "hand-pointer",
            time_window: "clock",
            device_state: "toggle-on",
            numeric: "hashtag",
            wait: "hourglass-half",
            set_device_power: "power-off",
            set_ledstrip_color: "palette",
            set_ledstrip_mode: "wand-magic-sparkles",
            send_button: "tower-broadcast",
            camera_record: "video"
        };

        let icon = "fa-solid fa-" + (actionIcons[value] ?? "circle-dot");
        if (referenceType === "group") {
            icon = "fa-solid fa-layer-group";
        } else if (referenceType === "device") {
            const device = this.getDevices().find(item => item.id == value);
            icon = device?.icon || "fa-solid fa-microchip";
        } else if (field === "parameter_code_id") {
            icon = "fa-solid fa-hand-pointer";
        }

        decorateCatalogChoice(label, input, icon, text);
    }

    /****************************************************************************/
    /*!
     * @brief   Returns visible text for an option value.
     * @param   options                 Available options
     * @param   value                   Option value
     * @returns Visible option text
     */
    /****************************************************************************/
    optionText(options, value) {
        return options.find(item => String(item[0]) == String(value))?.[1] ?? TEXT_AUTOMATION_NOT_CONFIGURED;
    }

    /****************************************************************************/
    /*!
     * @brief   Moves focus to the first field in the active step.
     */
    /****************************************************************************/
    focusFirstField() {
        /****************************************************************************/
        /*!
         * @brief   Focuses the first input or action in the rendered wizard step.
         */
        /****************************************************************************/
        this.animation.nextFrame(() => {
            this.wizardElement.querySelector(
                ".automation-wizard-body input, .automation-wizard-body select, "
                    + ".automation-wizard-body button"
            )?.focus({ preventScroll: true });
        });
    }
}
