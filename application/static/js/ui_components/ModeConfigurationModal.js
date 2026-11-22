/****************************************************************************/
/*
 * File:    ModeConfigurationModal.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Renders the parameter controls for a ZyraX LED mode.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { button } from "../../vendor/templates/js/core/dom.js";
import { renderRangeField } from "./range_field.js";
import { TEXT_CLOSE, TEXT_GRADIENT } from "../domain/language_pack_english.js";
import { colorWheel } from "../domain/led_geometry.js";
import { Component } from "../../vendor/templates/js/core/component.js";

const MODE_PARAMETER_TYPE_COLOR_RANGE = 0;
const MODE_PARAMETER_TYPE_COLOR = 1;
const MODE_PARAMETER_TYPE_CHECKBOX = 2;
const MODE_PARAMETER_TYPE_RANGE = 3;
const MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX = 4;
const MODE_PARAMETER_TYPE_SELECT = 5;

export class ModeConfigurationModal extends Component {
    /****************************************************************************/
    /*!
     * @brief   Initializes the component with its root and configuration.
     * @param   root                    Root element owned by the component.
     * @param   configuration           Initial component configuration.
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);
        this.id = "modeConfigurationModal" + (configuration.id ?? "");
        this.title = configuration.title ?? "";
        this.fields = configuration.fields ?? [];
        this.isInitialized = true;

        this.modalTitleId = this.id + "Title";
        this.messageElementId = this.id + "Message";
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the modal DOM element.
     */
    /****************************************************************************/
    render() {
        this.rangeFields = new Map();
        this.root.replaceChildren();

        const dialogElem = this.#renderDialogElement();
        dialogElem.append(this.#renderTitleElement(), this.#renderMessageElement());

        const containerElem = document.createElement("div");
        dialogElem.appendChild(containerElem);
        this.root.append(dialogElem);

        /****************************************************************************/
        /*!
         * @brief   Closes mode controls when the native dialog is cancelled.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        this.listen(dialogElem, "cancel", event => {
            event.preventDefault();
            this.close();
        });
        this.listen(document, "click", event => this.#dismissOutside(event));
        this.listen(document, "scroll", event => this.#dismissOutside(event), { capture: true });

        /****************************************************************************/
        /*!
         * @brief   Closes the open mode controls when Escape is pressed.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        this.listen(document, "keydown", event => {
            if (this.isOpen && event.key === "Escape") {
                event.preventDefault();
                this.close();
            }
        });

        for (let field of this.fields) {
            switch (field.type) {
                case MODE_PARAMETER_TYPE_COLOR_RANGE:
                    containerElem.appendChild(this.#generateColorRangeElement(field));
                    this.#loadColorRangeField(field.id);
                    break;
                case MODE_PARAMETER_TYPE_COLOR:
                    containerElem.appendChild(this.#generateColorElement(field));
                    break;
                case MODE_PARAMETER_TYPE_RANGE:
                    containerElem.appendChild(this.#generateRangeElement(field));
                    break;
                case MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX:
                    containerElem.appendChild(this.#generateDirectionCheckboxElement(field));
                    break;
                case MODE_PARAMETER_TYPE_SELECT:
                    containerElem.appendChild(this.#generateSelectElement(field));
                    break;
                case MODE_PARAMETER_TYPE_CHECKBOX:
                    break;
                default:
                    throw new Error("Unknown mode parameter type: " + field.type);
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the DOM element of the modal.
     * @returns DOM element
     */
    /****************************************************************************/
    getDomElement() {
        return this.root.querySelector("#" + this.id);
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the modal title.
     * @param   title                   Title to set
     */
    /****************************************************************************/
    setTitle(title) {
        this.title = title;

        const titleElem = this.root.querySelector("#" + this.modalTitleId);
        titleElem.textContent = this.title;
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the specified error message.
     * @param   message                 Message to set
     */
    /****************************************************************************/
    setErrorMessage(message) {
        const messageElem = this.root.querySelector("#" + this.messageElementId);
        messageElem.textContent = message;
        messageElem.className = "message error";
        messageElem.style.display = "inline-block";
    }

    /****************************************************************************/
    /*!
     * @brief   Resets the message.
     */
    /****************************************************************************/
    resetMessage() {
        const messageElem = this.root.querySelector("#" + this.messageElementId);
        messageElem.style.display = "none";
    }

    /****************************************************************************/
    /*!
     * @brief   Resets the field validations and validation message.
     */
    /****************************************************************************/
    resetValidationElements() {
        const messageElem = this.root.querySelector("#" + this.messageElementId);
        messageElem.style.display = "none";

        for (let field of this.fields) {
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = this.root.querySelector("#" + field.id + "MinimumRange");
                const maxFieldElem = this.root.querySelector("#" + field.id + "MaximumRange");

                minFieldElem.classList.remove("invalid-input");
                maxFieldElem.classList.remove("invalid-input");
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = this.root.querySelector("#" + field.id + "Color");
                const gradientFieldElem = this.root.querySelector("#" + field.id + "GradientCb");

                colorFieldElem.classList.remove("invalid-input");
                gradientFieldElem.classList.remove("invalid-input");
                continue;
            }

            const fieldElem = this.root.querySelector("#" + field.id);
            fieldElem.classList.remove("invalid-input");
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the specified field as invalid.
     * @param   fieldElem               DOM element that is invalid
     * @param   errorMessage            Error message to show
     * @returns DOM element
     */
    /****************************************************************************/
    setFieldInvalid(fieldId, errorMessage) {
        const field = this.#getField(fieldId);

        if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
            const minFieldElem = this.root.querySelector("#" + field.id + "MinimumRange");
            const maxFieldElem = this.root.querySelector("#" + field.id + "MaximumRange");

            minFieldElem.classList.add("invalid-input");
            maxFieldElem.classList.add("invalid-input");

            minFieldElem.focus();
            this.setErrorMessage(errorMessage);

            return;
        }

        if (field.type == MODE_PARAMETER_TYPE_COLOR) {
            const colorFieldElem = this.root.querySelector("#" + field.id + "Color");
            const gradientFieldElem = this.root.querySelector("#" + field.id + "GradientCb");

            colorFieldElem.classList.add("invalid-input");
            gradientFieldElem.classList.add("invalid-input");

            colorFieldElem.focus();
            this.setErrorMessage(errorMessage);

            return;
        }

        const fieldElem = this.root.querySelector("#" + field.id);

        fieldElem.classList.add("invalid-input");
        fieldElem.focus();
        this.setErrorMessage(errorMessage);
    }

    /****************************************************************************/
    /*!
     * @brief   Resets the input values.
     */
    /****************************************************************************/
    resetValues() {
        for (const field of this.fields) {
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = this.root.querySelector("#" + field.id + "MinimumRange");
                const maxFieldElem = this.root.querySelector("#" + field.id + "MaximumRange");

                minFieldElem.value = 0;
                maxFieldElem.value = 255;
                this.#loadColorRangeField(field.id);
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = this.root.querySelector("#" + field.id + "Color");
                const gradientFieldElem = this.root.querySelector("#" + field.id + "GradientCb");

                colorFieldElem.value = "#000000";
                gradientFieldElem.checked = false;
                continue;
            }

            const fieldElem = this.root.querySelector("#" + field.id);
            switch (field.type) {
                case MODE_PARAMETER_TYPE_CHECKBOX:
                    fieldElem.checked = false;
                    break;
                case MODE_PARAMETER_TYPE_RANGE:
                    this.rangeFields.get(field.id).setValue(0);
                    break;
                case MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX:
                    fieldElem.checked = false;
                    break;
                case MODE_PARAMETER_TYPE_SELECT:
                    fieldElem.value = -1;
                    break;
                default:
                    fieldElem.value = "";
                    break;
            }
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the input value to the specified value.
     * @param   fieldId                 ID of the field
     * @param   value                   Value to set
     */
    /****************************************************************************/
    setValue(fieldId, value) {
        const field = this.#getField(fieldId);

        if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
            const minFieldElem = this.root.querySelector("#" + field.id + "MinimumRange");
            const maxFieldElem = this.root.querySelector("#" + field.id + "MaximumRange");

            minFieldElem.value = value[0];
            maxFieldElem.value = value[1];
            this.#loadColorRangeField(field.id);

            return;
        }

        if (field.type == MODE_PARAMETER_TYPE_COLOR) {
            const colorFieldElem = this.root.querySelector("#" + field.id + "Color");
            const gradientFieldElem = this.root.querySelector("#" + field.id + "GradientCb");

            colorFieldElem.value = value[0];
            gradientFieldElem.checked = value[1] == 1;

            return;
        }

        const fieldElem = this.root.querySelector("#" + field.id);

        if (field.type == MODE_PARAMETER_TYPE_CHECKBOX
            || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
            fieldElem.checked = value[0] == 1;
        } else if (field.type == MODE_PARAMETER_TYPE_RANGE) {
            this.rangeFields.get(field.id).setValue(value[0]);
        } else {
            fieldElem.value = value[0];
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the input values of the fields.
     * @returns All input values
     */
    /****************************************************************************/
    getValues() {
        let values = [];

        for (let field of this.fields) {
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = this.root.querySelector("#" + field.id + "MinimumRange");
                const maxFieldElem = this.root.querySelector("#" + field.id + "MaximumRange");
                const range = [parseInt(minFieldElem.value), parseInt(maxFieldElem.value)];

                values.push(range);
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = this.root.querySelector("#" + field.id + "Color");
                const gradientFieldElem = this.root.querySelector("#" + field.id + "GradientCb");
                const color = [colorFieldElem.value, gradientFieldElem.checked];

                values.push(color);
                continue;
            }

            const fieldElem = this.root.querySelector("#" + field.id);

            if (field.type == MODE_PARAMETER_TYPE_CHECKBOX
                || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
                values.push(fieldElem.checked);
            } else if (field.type == MODE_PARAMETER_TYPE_RANGE) {
                values.push(parseInt(fieldElem.value));
            } else {
                values.push(fieldElem.value);
            }
        }

        return values;
    }

    /****************************************************************************/
    /*!
     * @brief   Shows the mode controls without an overlay or scroll lock.
     */
    /****************************************************************************/
    show() {
        if (this.isOpen) return;

        const dialogElem = this.getDomElement();
        this.previousFocusElem = document.activeElement;
        dialogElem.show();
        dialogElem.classList.add("show");
        this.isOpen = true;
    }

    /****************************************************************************/
    /*!
     * @brief   Closes the mode controls and restores focus when it is inside them.
     */
    /****************************************************************************/
    close() {
        const dialogElem = this.getDomElement();
        const shouldRestoreFocus = dialogElem?.contains(document.activeElement);

        dialogElem?.classList.remove("show");
        dialogElem?.close();
        this.isOpen = false;
        if (shouldRestoreFocus) this.previousFocusElem?.focus({ preventScroll: true });
    }

    /****************************************************************************/
    /*!
     * @brief   Releases the dialog and its document listeners.
     */
    /****************************************************************************/
    destroy() {
        this.close();
        super.destroy();
    }

    /****************************************************************************/
    /*!
     * @brief   Dismisses open controls when the page is clicked or scrolled outside.
     * @param   event                   Click or scroll event
     */
    /****************************************************************************/
    #dismissOutside(event) {
        if (!this.isOpen || this.getDomElement().contains(event.target)) return;

        this.close();
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the field based on the specified field ID.
     * @param   fieldId                 ID of the field
     * @returns Object containing field data
     */
    /****************************************************************************/
    #getField(fieldId) {
        return this.fields[this.fields.findIndex(field => field.id === fieldId)];
    }

    /****************************************************************************/
    /*!
     * @brief   Generates the dialog DOM element.
     * @returns DOM element
     */
    /****************************************************************************/
    #renderDialogElement() {
        const dialogElem = document.createElement("dialog");
        dialogElem.id = this.id;
        dialogElem.className = "modal small-bottom-modal";
        dialogElem.setAttribute("aria-labelledby", this.modalTitleId);

        const close = button({ iconClass: "fa-solid fa-xmark", className: "close-modal-button" });
        close.setAttribute("aria-label", TEXT_CLOSE);

        this.listen(close, "click", () => this.close());
        dialogElem.append(close);

        return dialogElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates the modal title DOM element.
     * @returns DOM element
     */
    /****************************************************************************/
    #renderTitleElement() {
        const modalTitleElem = document.createElement("h3");
        modalTitleElem.style.marginTop = "0px";
        modalTitleElem.textContent = this.title;
        modalTitleElem.id = this.modalTitleId;

        return modalTitleElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates the message DOM element.
     * @param   type                    Type of the message
     * @returns DOM element
     */
    /****************************************************************************/
    #renderMessageElement(type = "error") {
        const messageElem = document.createElement("h3");
        messageElem.style.margin = "0px";
        messageElem.style.marginBottom = "10px";
        messageElem.className = "message";
        messageElem.classList.add(type);
        messageElem.id = this.messageElementId;

        return messageElem;
    }
    //#endregion

    //#region Generate mode configuration input elements
    /****************************************************************************/
    /*!
     * @brief   Generates a color range DOM element.
     * @param   minimumParameter        Minimum value
     * @param   maximumParameter        Maximum value
     */
    /****************************************************************************/
    #generateColorRangeElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = this.id + "ColorRangeContainer";
        containerElem.style.width = "100%";
        containerElem.style.maxWidth = "none";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "range-title";
        titleElem.textContent = field.title;
        titleElem.style.marginBottom = "2px";
        containerElem.appendChild(titleElem);

        const rangeContainerElem = document.createElement("div");
        rangeContainerElem.id = field.id + "RangeContainer";
        rangeContainerElem.className = "multi-range-slider";

        /* Min band */
        const minInputElem = document.createElement("input");
        minInputElem.id = field.id + "MinimumRange";
        minInputElem.className = "multi-range minimum-multi-range";
        minInputElem.type = "range";
        minInputElem.value = field.value1;
        minInputElem.min = field.min;
        minInputElem.max = field.max;

        minInputElem.onchange = field.updateFunction;

        /****************************************************************************/
        /*!
         * @brief   Synchronizes the paired limits of the color range control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        minInputElem.oninput = () => this.#loadColorPosRangeFieldMax(field.id);
        minInputElem.style.width = "81%";

        rangeContainerElem.appendChild(minInputElem);
        containerElem.appendChild(rangeContainerElem);

        /* Max band */
        const maxInputElem = document.createElement("input");
        maxInputElem.id = field.id + "MaximumRange";
        maxInputElem.className = "multi-range maximum-multi-range";
        maxInputElem.type = "range";
        maxInputElem.value = field.value2;
        maxInputElem.min = field.min;
        maxInputElem.max = field.max;

        maxInputElem.onchange = field.updateFunction;

        /****************************************************************************/
        /*!
         * @brief   Synchronizes the paired limits of the color range control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        maxInputElem.oninput = () => this.#loadColorPosRangeFieldMin(field.id);
        maxInputElem.style.width = "81%";

        rangeContainerElem.appendChild(maxInputElem);
        containerElem.appendChild(rangeContainerElem);

        return containerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates a range DOM element.
     * @param   parameter               Mode configuration parameter object
     */
    /****************************************************************************/
    #generateRangeElement(field) {
        const containerElem = document.createElement("div");
        containerElem.className = "input-field-container mode-range-field";

        const range = renderRangeField({
            name: field.id,
            label: field.title.replace("?", "").trim(),
            min: field.min,
            max: field.max,

            /****************************************************************************/
            /*!
             * @brief   Formats the current mode parameter value for its range output.
             * @param   value                   Value to apply or format.
             * @returns Formatted display text.
             */
            /****************************************************************************/
            formatValue: value =>
                field.title.includes("?")
                ? field.title.replace("?", value)
                : String(value)
        }, field.value1, this.listen.bind(this));
        if (!field.title.includes("?")) {
            const label = document.createElement("label");
            label.htmlFor = field.id;
            label.textContent = field.title;
            containerElem.append(label);
        }
        this.rangeFields.set(field.id, range);

        this.listen(range.control, "change", field.updateFunction);
        containerElem.append(range.element);

        return containerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates a range DOM element.
     * @param   colorParameter          Mode configuration color parameter object
     * @param   gradientParameter       Mode configuration gradient parameter object
     */
    /****************************************************************************/
    #generateColorElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "color-checkbox-container";

        /* Color */
        const colorContainerElem = document.createElement("div");
        colorContainerElem.className = "input-field-container color-container";

        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "input-field-title";
        titleElem.textContent = field.title;
        titleElem.style.margin = "0px auto";
        colorContainerElem.appendChild(titleElem);

        const inputElem = document.createElement("input");
        inputElem.id = field.id + "Color";
        inputElem.type = "color";
        inputElem.value = field.value1;
        inputElem.className = "input-field";

        inputElem.onchange = field.updateFunction;
        colorContainerElem.appendChild(inputElem);
        containerElem.appendChild(colorContainerElem);

        /* Gradient */
        const fieldElem = document.createElement("div");
        fieldElem.className = "centered-flex";
        fieldElem.style.flexDirection = "column";
        fieldElem.style.gap = "0px";

        const gradientTitleElem = document.createElement("p");
        gradientTitleElem.id = field.id + "Title";
        gradientTitleElem.className = "input-field-title";
        gradientTitleElem.style.margin = "0px";
        gradientTitleElem.style.top = "0px";
        gradientTitleElem.textContent = TEXT_GRADIENT;
        fieldElem.appendChild(gradientTitleElem);

        const labelElem = document.createElement("label");
        labelElem.className = "switch";
        labelElem.style.margin = "15px";

        const checkboxElem = document.createElement("input");
        checkboxElem.id = field.id + "GradientCb";
        checkboxElem.type = "checkbox";
        checkboxElem.checked = field.value2;

        checkboxElem.onclick = field.updateFunction;

        const sliderElem = document.createElement("span");
        sliderElem.className = "slider round";

        labelElem.append(checkboxElem, sliderElem);
        fieldElem.appendChild(labelElem);

        containerElem.appendChild(fieldElem);

        return containerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates a direction checkbox DOM element.
     * @param   parameter               Mode configuration parameter object
     */
    /****************************************************************************/
    #generateDirectionCheckboxElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "input-field-container";
        containerElem.style.width = "100%";
        containerElem.style.maxWidth = "none";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "range-title";
        titleElem.textContent = field.title;
        containerElem.appendChild(titleElem);

        /* Switch */
        const labelElem = document.createElement("label");
        labelElem.className = "switch";

        const inputElem = document.createElement("input");
        inputElem.id = field.id;
        inputElem.type = "checkbox";
        inputElem.checked = field.value1;

        inputElem.onchange = field.updateFunction;
        labelElem.appendChild(inputElem);

        const switchElem = document.createElement("span");
        switchElem.className = "slider round no-color";
        labelElem.appendChild(switchElem);
        containerElem.appendChild(labelElem);

        return containerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates a select DOM element.
     * @param   parameter               Mode configuration parameter object
     */
    /****************************************************************************/
    #generateSelectElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "input-field-container";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "input-field-title";
        titleElem.textContent = field.title;
        containerElem.appendChild(titleElem);

        /* Select */
        const inputElem = document.createElement("select");
        inputElem.id = field.id;
        inputElem.className = "input-field";
        inputElem.value = field.value1;

        inputElem.onchange = field.updateFunction;

        for (const option of field.options) {
            const optionElem = document.createElement("option");
            optionElem.value = option.value;
            optionElem.text = option.text;

            inputElem.appendChild(optionElem);
        }

        containerElem.appendChild(inputElem);

        return containerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Loads the ledstrip color range.
     * @param   minimumRangeElementId   ID of the minimum range DOM element
     * @param   maximumRangeElementId   ID of the maximum range DOM element
     */
    /****************************************************************************/
    #loadColorRangeField(elementId) {
        const minColorPosRangeElem = this.root.querySelector("#" + elementId + "MinimumRange");
        const maxColorPosRangeElem = this.root.querySelector("#" + elementId + "MaximumRange");

        const sliderColor = "var(--background2)";

        let rangeDistance = maxColorPosRangeElem.max - maxColorPosRangeElem.min;
        let fromValue = Number(minColorPosRangeElem.value);
        let toValue = Number(maxColorPosRangeElem.value);
        let fromPosition = fromValue - maxColorPosRangeElem.min;
        let toPosition = toValue - maxColorPosRangeElem.min;

        let correctedRange =
            98; //Range for color 98, otherwise background color will be aside of the thumb
        let percentageFrom = fromPosition / rangeDistance * 100;
        let percentageTo = toPosition / rangeDistance * 100;

        let correctedFrom = percentageFrom * correctedRange / 100 + 1;
        let correctedTo = percentageTo * correctedRange / 100 + 1;

        //Generate a gradient across the selected value range
        let steps = 100; // Meer = vloeiender
        let gradientParts = [];

        //Start with the slider background up to the beginning of the range
        gradientParts.push(`${sliderColor} 0%`);
        gradientParts.push(`${sliderColor} ${correctedFrom}%`);

        for (let i = 0; i <= steps; i++) {
            let pos = fromValue + (toValue - fromValue) * i / steps;
            let color = colorWheel(parseInt(pos % 256));
            let percent = correctedFrom + (correctedTo - correctedFrom) * (i / steps);

            gradientParts.push(`${color} ${percent}%`);
        }

        //End with the slider background after the range
        gradientParts.push(`${sliderColor} ${correctedTo}%`);
        gradientParts.push(`${sliderColor} 100%`);

        maxColorPosRangeElem.style.background =
            `linear-gradient(to right, ${gradientParts.join(', ')})`;
    }

    /****************************************************************************/
    /*!
     * @brief   Validates and updates the color range minimum value.
     * @param   minimumRangeElementId   ID of the minimum range DOM element
     * @param   maximumRangeElementId   ID of the maximum range DOM element
     */
    /****************************************************************************/
    #loadColorPosRangeFieldMin(elementId) {
        const minColorPosRangeElem = this.root.querySelector("#" + elementId + "MinimumRange");
        const maxColorPosRangeElem = this.root.querySelector("#" + elementId + "MaximumRange");

        let minimumColorBand = parseInt(minColorPosRangeElem.value);
        let maximumColorBand = parseInt(maxColorPosRangeElem.value);

        if (minimumColorBand > maximumColorBand - 1) {
            minimumColorBand = maximumColorBand - 1;
            minColorPosRangeElem.value = minimumColorBand;
        }

        this.#loadColorRangeField(elementId);
    }

    /****************************************************************************/
    /*!
     * @brief   Validates and updates the color range maximum value.
     * @param   minimumRangeElementId   ID of the minimum range DOM element
     * @param   maximumRangeElementId   ID of the maximum range DOM element
     */
    /****************************************************************************/
    #loadColorPosRangeFieldMax(elementId) {
        const minColorPosRangeElem = this.root.querySelector("#" + elementId + "MinimumRange");
        const maxColorPosRangeElem = this.root.querySelector("#" + elementId + "MaximumRange");

        let minimumColorBand = parseInt(minColorPosRangeElem.value);
        let maximumColorBand = parseInt(maxColorPosRangeElem.value);

        /* If */
        if (maximumColorBand < minimumColorBand + 1) {
            maximumColorBand = minimumColorBand + 1;
            maxColorPosRangeElem.value = maximumColorBand;
        }

        this.#loadColorRangeField(elementId);
    }
}
