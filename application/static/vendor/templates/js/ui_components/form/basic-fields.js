/******************************************************************************
 *
 * File:    basic-fields.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Registers the default form field renderers.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {element} from "../../core/dom.js";
import {FieldRegistry} from "./FieldRegistry.js";
import {fileUploadRenderer, imageUploadRenderer} from "./upload-fields.js";

/******************************************************************************/
/*!
 * @brief   Creates the standard registry of supported form field renderers.
 * @returns FieldRegistry       Registry containing every default renderer.
 */
/******************************************************************************/
export function createDefaultFieldRegistry() {
    return new FieldRegistry()
        .register("text", inputRenderer("text"))
        .register("email", inputRenderer("email"))
        .register("password", inputRenderer("password"))
        .register("number", inputRenderer("number"))
        .register("date", inputRenderer("date"))
        .register("time", inputRenderer("time"))
        .register("datetime-local", inputRenderer("datetime-local"))
        .register("file", inputRenderer("file"))
        .register("file-upload", fileUploadRenderer)
        .register("image-upload", imageUploadRenderer)
        .register("textarea", textareaRenderer)
        .register("select", selectRenderer)
        .register("checkbox", checkboxRenderer)
        .register("switch", switchRenderer)
        .register("range", rangeRenderer)
        .register("radio", radioRenderer)
        .register("field-group", fieldGroupRenderer)
        .register("tile-select", tileSelectRenderer);
}

/******************************************************************************/
/*!
 * @brief   Creates a renderer for an input field type.
 * @param   type                 HTML input type to render.
 * @returns Function            Renderer configured for the input type.
 */
/******************************************************************************/
function inputRenderer(type) {
    /******************************************************************************/
    /*!
     * @brief   Renders an input from a field definition and current value.
     * @param   field                Field definition to render.
     * @param   value                Current field value.
     * @returns HTMLInputElement     Rendered input element.
     */
    /******************************************************************************/
    return (field, value) => {
        const input = element("input", {
            type,
            attributes: commonAttributes(field)
        });

        if (type !== "file") input.value = value ?? "";

        return input;
    };
}

/******************************************************************************/
/*!
 * @brief   Renders a textarea from a field definition and current value.
 * @param   field                Field definition to render.
 * @param   value                Current field value.
 * @returns HTMLTextAreaElement Rendered textarea element.
 */
/******************************************************************************/
function textareaRenderer(field, value) {
    const input = element("textarea", {attributes: commonAttributes(field)});
    input.value = value ?? "";

    return input;
}

/******************************************************************************/
/*!
 * @brief   Renders a select control from a field definition and current value.
 * @param   field                Field definition to render.
 * @param   value                Current field value.
 * @returns HTMLSelectElement    Rendered select element.
 */
/******************************************************************************/
function selectRenderer(field, value) {
    const select = element("select", {attributes: commonAttributes(field)});

    for (const option of field.options ?? []) {
        const optionText = option.label ?? option.text ?? option.value;
        const optionElement = element("option", {text: optionText});
        optionElement.value = option.value;
        optionElement.selected = String(option.value) === String(value ?? "");
        select.append(optionElement);
    }

    return select;
}

/******************************************************************************/
/*!
 * @brief   Renders a checkbox from a field definition and current value.
 * @param   field                Field definition to render.
 * @param   value                Current field value.
 * @returns HTMLInputElement     Rendered checkbox element.
 */
/******************************************************************************/
function checkboxRenderer(field, value) {
    const input = element("input", {type: "checkbox", attributes: commonAttributes(field)});
    input.checked = Boolean(value);

    return input;
}

/******************************************************************************/
/*!
 * @brief   Renders a native checkbox presented as a boolean switch.
 * @param   field                Switch field definition.
 * @param   value                Current boolean value.
 * @returns object              Switch element, control, and value reader.
 */
/******************************************************************************/
function switchRenderer(field, value) {
    const descriptionId = field.description ? `${field.name}-description` : null;
    const inputElem = element("input", {
        type: "checkbox",
        attributes: {
            ...commonAttributes(field),
            role: "switch",
            "aria-describedby": descriptionId
        }
    });
    inputElem.checked = Boolean(value);

    const textChildren = [element("span", {
        className: "form-switch-label",
        text: field.label ?? field.name
    })];

    if (field.description) {
        textChildren.push(element("span", {
            className: "form-switch-description",
            text: field.description,
            attributes: {id: descriptionId}
        }));
    }

    const switchElem = element("label", {className: "form-switch"}, [
        inputElem,
        element("span", {className: "form-switch-track", attributes: {"aria-hidden": "true"}}),
        element("span", {className: "form-switch-text"}, textChildren)
    ]);

    /******************************************************************************/
    /*!
     * @brief   Returns the native checkbox state represented by the switch.
     * @returns boolean             Whether the switch is enabled.
     */
    /******************************************************************************/
    const getValue = () => inputElem.checked;

    return {
        element: switchElem,
        control: inputElem,
        ownsLabel: true,
        describedBy: descriptionId,
        getValue
    };
}

/******************************************************************************/
/*!
 * @brief   Renders a range input with a live visible value.
 * @param   field                Range field definition.
 * @param   value                Current slider value.
 * @param   context              Field lifecycle services supplied by ModalForm.
 * @returns object              Range element, control, and value reader.
 */
/******************************************************************************/
function rangeRenderer(field, value, context = {}) {
    const outputId = `${field.name}-value`;
    const inputElem = element("input", {
        type: "range",
        attributes: {
            ...commonAttributes(field),
            "aria-describedby": outputId
        }
    });
    inputElem.value = value ?? field.min ?? 0;

    const outputElem = element("output", {
        className: "range-field-value",
        text: formatRangeValue(field, inputElem.value),
        attributes: {id: outputId, for: field.name}
    });

    /******************************************************************************/
    /*!
     * @brief   Synchronizes the visible output with the native slider value.
     */
    /******************************************************************************/
    const updateOutput = () => {
        outputElem.value = inputElem.value;

        outputElem.textContent = formatRangeValue(field, inputElem.value);
    };

    /******************************************************************************/
    /*!
     * @brief   Returns the current native slider value.
     * @returns string              Current range value.
     */
    /******************************************************************************/
    const getValue = () => inputElem.value;

    context.listen?.(inputElem, "input", updateOutput);

    return {
        element: element("div", {className: "range-field"}, [inputElem, outputElem]),
        control: inputElem,
        describedBy: outputId,
        getValue
    };
}

/******************************************************************************/
/*!
 * @brief   Formats a range value through a callback or configured suffix.
 * @param   field                Range field definition.
 * @param   value                Native slider value.
 * @returns string              Visible range value.
 */
/******************************************************************************/
function formatRangeValue(field, value) {
    if (typeof field.formatValue === "function") return String(field.formatValue(value));

    return `${value}${field.suffix ?? ""}`;
}

/******************************************************************************/
/*!
 * @brief   Renders a radio group from a field definition and current value.
 * @param   field                Field definition to render.
 * @param   value                Current field value.
 * @returns HTMLDivElement       Rendered radio-group element.
 */
/******************************************************************************/
function radioRenderer(field, value) {
    const group = element("div", {className: "form-radio-group"});

    for (const option of field.options ?? []) {
        const input = element("input", {
            type: "radio",
            attributes: {name: field.name, value: option.value}
        });
        input.checked = String(option.value) === String(value ?? "");

        const optionText = document.createTextNode(option.label ?? option.value);
        const label = element("label", {}, [input, optionText]);

        group.append(label);
    }

    return group;
}

/******************************************************************************/
/*!
 * @brief   Renders a tile selector from a field definition and current value.
 * @param   field                Field definition to render.
 * @param   value                Current selected values.
 * @returns HTMLFieldSetElement Rendered tile-selector element.
 */
/******************************************************************************/
function tileSelectRenderer(field, value = []) {
    const selected = new Set(Array.isArray(value) ? value.map(String) : [String(value)]);
    const group = element("fieldset", {className: "tile-select"});

    for (const option of field.options ?? []) {
        const input = element("input", {
            type: field.multiple ? "checkbox" : "radio",
            attributes: {name: field.name, value: option.value}
        });
        input.checked = selected.has(String(option.value));

        const labelText = element("span", {text: option.label});
        const label = element("label", {className: "tile"}, [input, labelText]);

        group.append(label);
    }

    return group;
}

/******************************************************************************/
/*!
 * @brief   Renders a semantic group containing nested registry fields.
 * @param   field                Group definition and nested fields.
 * @param   value                Unused group value.
 * @param   context              Field rendering services supplied by ModalForm.
 * @returns object              Group element and control metadata.
 */
/******************************************************************************/
function fieldGroupRenderer(field, value, context = {}) {
    const descriptionId = field.description ? `${field.name}-description` : null;
    const group = element("fieldset", {
        className: "form-field-group",
        attributes: descriptionId ? {"aria-describedby": descriptionId} : {}
    });
    group.append(element("legend", {text: field.label ?? field.name}));

    if (field.description) {
        group.append(element("p", {
            className: "form-field-group-description",
            text: field.description,
            attributes: {id: descriptionId}
        }));
    }

    for (const nestedField of field.fields ?? []) group.append(context.renderField(nestedField));

    return {element: group, control: group, ownsLabel: true, describedBy: descriptionId};
}

/******************************************************************************/
/*!
 * @brief   Builds common HTML attributes for a field definition.
 * @param   field                Field definition to translate.
 * @returns object              Attributes supported by default controls.
 */
/******************************************************************************/
function commonAttributes(field) {
    return {
        name: field.name,
        placeholder: field.placeholder,
        autocomplete: field.autocomplete,
        min: field.min,
        max: field.max,
        step: field.step,
        required: field.required ? "" : undefined,
        disabled: field.disabled ? "" : undefined
    };
}
