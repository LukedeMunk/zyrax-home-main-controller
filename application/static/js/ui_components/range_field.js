/****************************************************************************/
/*
 * File:    range_field.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Binds template range fields to live device values without sending
 *          another command.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    createDefaultFieldRegistry
} from "../../vendor/templates/js/ui_components/form/basic-fields.js";

const registry = createDefaultFieldRegistry();

/****************************************************************************/
/*!
 * @brief   Mounts a Templates slider and its output with the owner's event lifecycle.
 * @param   options                 Native limits, accessible label and display format.
 * @param   value                   Initial controller value.
 * @param   listen                  Listener registration owned by the page or tile.
 * @returns The field, its native control and a silent state setter.
 */
/****************************************************************************/
export function renderRangeField({ name, label, min, max, formatValue = String }, value, listen) {
    const field = registry.render({ type: "range", name, min, max, formatValue }, value, {
        listen
    });
    field.control.id = name;
    field.control.setAttribute("aria-label", label);

    const output = field.element.querySelector("output");

    return {
        element: field.element,
        control: field.control,

        // Polling must update the output without triggering a device command.
        /****************************************************************************/
        /*!
         * @brief   Updates the range control and output without sending a device command.
         * @param   value                   Value to apply or format.
         */
        /****************************************************************************/
        setValue(value) {
            field.control.value = value;
            output.value = formatValue(field.control.value);
        }
    };
}

/****************************************************************************/
/*!
 * @brief   Converts a device brightness value to its displayed percentage.
 * @param   max                     Maximum value accepted by the control.
 * @returns A formatter for the Templates range renderer.
 */
/****************************************************************************/
export function formatBrightness(max) {
    /****************************************************************************/
    /*!
     * @brief   Formats a native brightness value as a percentage.
     * @param   value                   Value to apply or format.
     * @returns Formatted display text.
     */
    /****************************************************************************/
    return value => Math.round(Number(value) * 100 / max) + "%";
}
