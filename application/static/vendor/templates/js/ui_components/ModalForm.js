/******************************************************************************
 *
 * File:    ModalForm.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders configurable, validated modal forms.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {AnimationController} from "../core/animation.js";
import {button, element} from "../core/dom.js";
import {createDefaultFieldRegistry} from "./form/basic-fields.js";
import {validateFields} from "./form/validation.js";

export class ModalForm extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.values = {...(props.values ?? {})};
        this.errors = {};
        this.registry = props.fieldRegistry ?? createDefaultFieldRegistry();
        this.animation = new AnimationController(props.animation);
        this.closeTimer = null;
        this.fieldAdapters = new Map();
        this.fieldCleanups = new Set();
    }

    /******************************************************************************/
    /*!
     * @brief   Updates the instance with the supplied data.
     * @param   nextProps            Value supplied for nextProps.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    update(nextProps = {}) {
        if (nextProps.values) this.values = {...this.values, ...nextProps.values};
        return super.update(nextProps);
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.#releaseFieldResources();
        this.resetListeners();
        this.animation.clear();
        this.closeTimer = null;
        this.fieldAdapters.clear();
        this.#discardDialog();

        const form = element("form", {attributes: {novalidate: ""}});
        const isBig = this.props.size === "big" || this.props.big || this.props.isBigModal;
        const sizeClass = isBig ? " big-modal" : "";
        const titleId = `${this.props.id ?? "form"}-title`;
        const dialog = element("dialog", {
            className: `modal${sizeClass}`,
            attributes: {"aria-labelledby": titleId}
        });

        const title = element("h2", {
            text: this.props.title ?? "",
            attributes: {id: titleId}
        });

        const closeButton = button({
            iconClass: "fa-solid fa-xmark",
            title: "Close",
            className: "close-modal-button"
        });
        closeButton.setAttribute("aria-label", "Close modal");

        /******************************************************************************/
        /*!
         * @brief   Closes the modal from its close button.
         */
        /******************************************************************************/
        this.listen(closeButton, "click", () => this.close());

        if (this.props.allowBackdropClose !== false) {
            /******************************************************************************/
            /*!
             * @brief   Closes the modal when its dialog backdrop is selected.
             * @param   event                Dialog click event.
             */
            /******************************************************************************/
            this.listen(dialog, "click", event => {
                if (event.target === dialog) this.close();
            });
        }

        dialog.append(closeButton, title);

        if (this.props.description) dialog.append(element("p", {text: this.props.description}));

        for (const field of this.props.fields ?? []) form.append(this.#renderField(field));

        const actions = element("div", {className: "modal-form-actions"});

        if (this.props.allowDelete) {
            const deleteButton = button({
                text: this.props.deleteLabel ?? "Delete",
                className: "delete-button"
            });

            /******************************************************************************/
            /*!
             * @brief   Reports a delete request with the current form values.
             */
            /******************************************************************************/
            const emitDelete = () => this.emit("delete", {values: this.getValues()});

            this.listen(deleteButton, "click", emitDelete);
            actions.append(deleteButton);
        }

        const cancelButton = button({text: this.props.cancelLabel ?? "Cancel"});

        /******************************************************************************/
        /*!
         * @brief   Closes the modal from its cancel button.
         */
        /******************************************************************************/
        this.listen(cancelButton, "click", () => this.close());

        const submitButton = button({
            text: this.props.submitLabel ?? "Save",
            className: "primary-button"
        });
        submitButton.type = "submit";
        actions.append(cancelButton, submitButton);
        form.append(actions);

        /******************************************************************************/
        /*!
         * @brief   Validates and reports a form submission.
         * @param   event                Form submission event.
         */
        /******************************************************************************/
        this.listen(form, "submit", event => this.#submit(event));
        dialog.append(form);
        this.root.replaceChildren(dialog);
        this.dialog = dialog;

        if (this.props.open) this.#openDialog();
    }

    /******************************************************************************/
    /*!
     * @brief   Opens the modal with optional initial field values.
     * @param   values               Initial field values.
     */
    /******************************************************************************/
    show(values) {
        if (values) this.values = {...values};
        this.props.open = true;
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close operation.
     */
    /******************************************************************************/
    close() {
        this.props.open = false;

        if (this.props.modalStack) this.props.modalStack.close(this.dialog);
        else if (this.dialog) {
            const dialog = this.dialog;

            this.animation.cancelFrames();
            dialog.classList.remove("show");

            /******************************************************************************/
            /*!
             * @brief   Closes the native dialog after its fade-out transition.
             */
            /******************************************************************************/
            this.closeTimer = this.animation.after(300, () => {
                this.closeTimer = null;
                dialog.close?.();
            });
        }

        this.emit("close");
    }

    /******************************************************************************/
    /*!
     * @brief   Reads normalized values from the rendered form.
     * @returns object              Values indexed by field name.
     */
    /******************************************************************************/
    getValues() {
        if (!this.dialog) return {...this.values};

        const data = new FormData(this.dialog.querySelector("form"));

        return collectFieldValues(this.props.fields ?? [], data, this.fieldAdapters);
    }

    /******************************************************************************/
    /*!
     * @brief   Replaces the available options for a configured field.
     * @param   name                 Field name to update.
     * @param   options              Replacement field options.
     */
    /******************************************************************************/
    setFieldOptions(name, options) {
        const fields = (this.props.fields ?? []).map(field =>
            field.name === name ? {...field, options} : field
        );

        this.update({fields});
    }

    /******************************************************************************/
    /*!
     * @brief   Renders a configured field and its validation feedback.
     * @param   field                Field definition to render.
     * @returns HTMLElement         Field container element.
     */
    /******************************************************************************/
    #renderField(field) {
        const value = this.values[field.name] ?? field.defaultValue;
        const output = this.registry.render(field, value, {
            renderField: this.#renderField.bind(this),
            listen: this.listen.bind(this),
            registerCleanup: this.#registerFieldCleanup.bind(this)
        });

        const rendered = output?.element ? output : {element: output, control: output};
        const control = rendered.control ?? rendered.element;
        control.classList?.add("input-field");

        const hasError = Boolean(this.errors[field.name]);

        if (hasError) control.classList?.add("invalid-input");
        control.setAttribute?.("aria-invalid", String(hasError));

        const errorId = `${this.props.id ?? "form"}-${field.name}-error`;
        const error = element("small", {
            className: "form-field-error message error",
            text: this.errors[field.name] ?? "",
            attributes: {id: errorId}
        });
        error.hidden = !this.errors[field.name];

        const descriptionIds = [rendered.describedBy, hasError ? errorId : null];
        const describedBy = descriptionIds.filter(Boolean).join(" ");

        if (control.dataset && rendered.describedBy) {
            control.dataset.fieldDescriptionIds = rendered.describedBy;
        }

        if (describedBy) control.setAttribute?.("aria-describedby", describedBy);

        const label = rendered.ownsLabel ? null : element("label", {
            className: "input-field-title",
            attributes: {for: field.name}
        }, [document.createTextNode(field.label ?? field.name)]);

        if (control.id !== undefined) control.id = field.name;
        if (typeof rendered.getValue === "function") this.fieldAdapters.set(field.name, rendered);

        return element("div", {
            className: "input-field-container modal-form-field",
            dataset: {field: field.name}
        }, [label, rendered.element, error].filter(Boolean));
    }

    /******************************************************************************/
    /*!
     * @brief   Validates submitted values and reports a valid or invalid result.
     * @param   event                Form submission event.
     */
    /******************************************************************************/
    #submit(event) {
        event.preventDefault();

        const values = this.getValues();

        this.errors = validateFields(this.props.fields ?? [], values);
        this.values = values;
        applyFieldErrors(this.dialog, this.props.fields ?? [], this.errors);

        if (Object.keys(this.errors).length > 0) {
            this.emit("invalid", {errors: this.errors});
            return;
        }

        this.emit("submit", {values});
    }

    /******************************************************************************/
    /*!
     * @brief   Opens the rendered dialog through the stack or native dialog API.
     */
    /******************************************************************************/
    #openDialog() {
        if (this.props.modalStack) {
            this.props.modalStack.open(this.dialog, {
                allowEscapeClose: this.props.allowEscapeClose !== false,

                /******************************************************************************/
                /*!
                 * @brief   Delegates a modal-stack close request to this component.
                 */
                /******************************************************************************/
                onRequestClose: () => this.close()
            });
        } else if (!this.dialog.open) {
            this.dialog.showModal?.();

            const dialog = this.dialog;

            /******************************************************************************/
            /*!
             * @brief   Applies the visible class after the dialog's initial paint.
             */
            /******************************************************************************/
            this.animation.nextFrame(() => {
                if (dialog !== this.dialog || !this.props.open) return;

                dialog.getBoundingClientRect?.();
                dialog.classList.add("show");
            });
        }
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        this.animation.clear();
        this.closeTimer = null;
        this.#releaseFieldResources();
        this.#discardDialog();
        super.destroy();
    }

    /******************************************************************************/
    /*!
     * @brief   Registers cleanup owned by a rendered field.
     * @param   cleanup              Cleanup callback to register.
     */
    /******************************************************************************/
    #registerFieldCleanup(cleanup) {
        if (typeof cleanup === "function") this.fieldCleanups.add(cleanup);
    }

    /******************************************************************************/
    /*!
     * @brief   Releases resources owned by every currently rendered field.
     */
    /******************************************************************************/
    #releaseFieldResources() {
        for (const cleanup of this.fieldCleanups) cleanup();
        this.fieldCleanups.clear();
    }

    /******************************************************************************/
    /*!
     * @brief   Closes and releases the currently rendered dialog immediately.
     */
    /******************************************************************************/
    #discardDialog() {
        if (!this.dialog) return;

        if (this.props.modalStack) this.props.modalStack.close(this.dialog, {immediate: true});
        else this.dialog.close?.();
        this.dialog = null;
    }
}

/******************************************************************************/
/*!
 * @brief   Reads flat values for fields, including fields nested in visual groups.
 * @param   fields               Field definitions to read.
 * @param   formData             FormData-compatible value source.
 * @param   adapters             Custom value readers indexed by field name.
 * @returns object              Values indexed by field name.
 */
/******************************************************************************/
export function collectFieldValues(fields, formData, adapters = new Map()) {
    const values = {};

    for (const field of flattenFields(fields)) {
        const adapter = adapters.get(field.name);

        if (adapter?.getValue) {
            values[field.name] = adapter.getValue();
            continue;
        }

        const all = formData.getAll(field.name);

        if (field.type === "checkbox" && !field.multiple) values[field.name] = all.length > 0;
        else if (field.multiple || field.type === "tile-select") values[field.name] = all;
        else values[field.name] = all[0] ?? "";
    }

    return values;
}

/******************************************************************************/
/*!
 * @brief   Flattens fields nested inside semantic field groups.
 * @param   fields               Field definitions to flatten.
 * @param   includeGroups        Whether group definitions belong in the result.
 * @returns object[]            Flattened field definitions.
 */
/******************************************************************************/
export function flattenFields(fields, includeGroups = false) {
    const flattened = [];

    for (const field of fields) {
        const isGroup = field.type === "field-group";

        if (!isGroup || includeGroups) flattened.push(field);
        if (isGroup) flattened.push(...flattenFields(field.fields ?? [], includeGroups));
    }

    return flattened;
}

/******************************************************************************/
/*!
 * @brief   Updates rendered controls with validation errors without replacing the dialog.
 * @param   dialog               Dialog containing the rendered fields.
 * @param   fields               Field definitions represented by the form.
 * @param   errors               Error messages indexed by field name.
 * @param   options              Error-display options.
 */
/******************************************************************************/
export function applyFieldErrors(dialog, fields, errors, {focusFirst = true} = {}) {
    if (!dialog) return;

    const containers = new Map(
        [...dialog.querySelectorAll("[data-field]")].map(container => [
            container.dataset.field,
            container
        ])
    );

    let firstInvalidControl = null;

    for (const field of flattenFields(fields, true)) {
        const container = containers.get(field.name);

        if (!container) continue;

        const control = container.querySelector(".input-field");
        const error = container.querySelector(".form-field-error");
        const message = errors[field.name] ?? "";
        const hasError = Boolean(message);
        const formId = dialog.getAttribute("aria-labelledby")?.replace(/-title$/, "") ?? "form";
        const errorId = `${formId}-${field.name}-error`;
        const persistentDescriptionIds = control?.dataset?.fieldDescriptionIds;
        const descriptionIds = [persistentDescriptionIds, hasError ? error?.id || errorId : null];
        const describedBy = descriptionIds.filter(Boolean).join(" ");

        control?.classList.toggle("invalid-input", hasError);
        control?.setAttribute("aria-invalid", String(hasError));

        if (describedBy) control?.setAttribute("aria-describedby", describedBy);
        else control?.removeAttribute("aria-describedby");

        if (error) {
            error.textContent = message;
            error.hidden = !hasError;
        }

        if (hasError && !firstInvalidControl) firstInvalidControl = control;
    }

    if (focusFirst) firstInvalidControl?.focus({preventScroll: true});
}
