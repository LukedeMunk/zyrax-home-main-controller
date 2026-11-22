/****************************************************************************/
/*
 * File:    automations.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Saves automation definitions and updates their enabled state.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { submitForm } from "./forms.js";

/****************************************************************************/
/*!
 * @brief   Saves a new or existing automation through the controller API.
 * @param   http                    Shared controller HTTP client.
 * @param   id                      Identifier of the affected item.
 * @param   data                    Configuration sent to the controller.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export async function saveAutomation(http, id, data, signal) {
    const result = await http.post(id === -1 ? "/add_automation" : "/update_automation", data, {
        signal
    });
    if (result.status_code !== 200) throw new Error(result.message);

    return result.message;
}

/****************************************************************************/
/*!
 * @brief   Deletes an automation through the controller API.
 * @param   http                    Shared controller HTTP client.
 * @param   id                      Identifier of the affected item.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function removeAutomation(http, id, signal) {
    return submitForm(http, "/delete_automation", { id }, signal);
}

/****************************************************************************/
/*!
 * @brief   Updates whether an automation is enabled.
 * @param   http                    Shared controller HTTP client.
 * @param   id                      Identifier of the affected item.
 * @param   enabled                 Requested automation enabled state.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function setEnabled(http, id, enabled, signal) {
    return submitForm(http, "/set_automation_enabled", { id, enabled: Number(enabled) }, signal);
}
