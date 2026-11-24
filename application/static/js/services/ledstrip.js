/****************************************************************************/
/*
 * File:    ledstrip.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Loads LED state and updates hardware mode parameters.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { readDevices } from "./devices.js";

/****************************************************************************/
/*!
 * @brief   Reads an LED strip state with a bounded request timeout.
 * @param   http                    Shared controller HTTP client.
 * @param   id                      Identifier of the affected item.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function readStrip(http, id, signal) {
    return readDevices(http, { id, type: "ledstrip" }, signal);
}

/****************************************************************************/
/*!
 * @brief   Saves LED mode parameters and returns the controller configuration.
 * @param   http                    Shared controller HTTP client.
 * @param   url                     Controller endpoint URL.
 * @param   data                    Configuration sent to the controller.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export async function updateParameters(http, url, data, signal) {
    const fields = { ...data, parameters: JSON.stringify(data.parameters) };
    const result = await http.post(url, fields, { formEncoded: true, signal });
    if (result.status_code !== 200) throw new Error(result.message);

    return result.message;
}
