/****************************************************************************/
/*
 * File:    devices.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Loads filtered device catalog data through the shared list endpoint.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_GET_DEVICES
} from "../domain/endpoints.js";

/****************************************************************************/
/*!
 * @brief   Loads enriched devices or one device using optional ID and type filters.
 * @param   http                    Shared controller HTTP client.
 * @param   query                   Optional device ID and type filters.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Device list or the requested device.
 */
/****************************************************************************/
export async function readDevices(http, query, signal) {
    const result = await http.get(API_URL_GET_DEVICES, query, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(4000)])
    });
    if (result?.status_code !== 200) throw new Error(result?.message ?? "Invalid response");

    return result.message;
}
