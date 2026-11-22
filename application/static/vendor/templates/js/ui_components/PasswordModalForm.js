/******************************************************************************
 *
 * File:    PasswordModalForm.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders a password form with live requirement feedback.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {ModalForm} from "./ModalForm.js";
import {element, icon} from "../core/dom.js";
import {passwordRequirements, validators} from "./form/validation.js";

export class PasswordModalForm extends ModalForm {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, {
            title: "Change password",
            submitLabel: "Change password",
            ...props,
            fields: props.fields ?? [
                {name: "currentPassword", label: "Current password", type: "password", autocomplete: "current-password", validators: [validators.required]},
                {name: "newPassword", label: "New password", type: "password", autocomplete: "new-password", validators: [
                    validators.required,
                    validators.passwordRequirements
                ]},
                {name: "repeatPassword", label: "Repeat password", type: "password", autocomplete: "new-password", validators: [
                    validators.required,
                    validateMatchingPasswords
                ]}
            ]
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        super.render();

        const passwordInput = this.dialog?.querySelector('[name="newPassword"]');
        const actions = this.dialog?.querySelector(".modal-form-actions");

        if (!passwordInput || !actions) return;

        const checklist = element("div", {
            className: "password-validation-container",
            attributes: {"aria-live": "polite", "aria-label": "Password requirements"}
        });

        for (const requirement of passwordRequirements) {
            checklist.append(element("div", {className: "message-container", dataset: {requirement: requirement.key}}, [
                icon("fa-solid fa-circle-xmark message-icon"),
                element("p", {className: "message-text", text: requirement.label})
            ]));
        }

        actions.before(checklist);

        /******************************************************************************/
        /*!
         * @brief   Refreshes password-requirement feedback for the current input.
         */
        /******************************************************************************/
        const updateChecklist = () => this.#updateChecklist(checklist, passwordInput.value);

        this.listen(passwordInput, "input", updateChecklist);
        updateChecklist();
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   values               Value supplied for values.
     */
    /******************************************************************************/
    show(values = {}) {
        this.errors = {};
        super.show({currentPassword: "", newPassword: "", repeatPassword: "", ...values});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the update checklist operation.
     * @param   checklist            Value supplied for checklist.
     * @param   value                Value supplied for value.
     */
    /******************************************************************************/
    #updateChecklist(checklist, value) {
        for (const requirement of passwordRequirements) {
            const row = checklist.querySelector(`[data-requirement="${requirement.key}"]`);
            const requirementIcon = row?.querySelector(".message-icon");
            const valid = requirement.test(value);

            requirementIcon?.classList.toggle("fa-circle-check", valid);
            requirementIcon?.classList.toggle("fa-circle-xmark", !valid);
            row?.classList.toggle("valid", valid);
        }
    }
}

/******************************************************************************/
/*!
 * @brief   Validates that the repeated password matches the new password.
 * @param   value                Repeated password value.
 * @param   values               Complete form values.
 * @returns boolean|string      True when passwords match, otherwise an error message.
 */
/******************************************************************************/
function validateMatchingPasswords(value, values) {
    return value === values.newPassword || "Passwords do not match.";
}
