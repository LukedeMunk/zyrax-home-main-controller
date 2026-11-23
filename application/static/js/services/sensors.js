/****************************************************************************/
/*
 * File:    sensors.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Reads live sensor states.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_GET_NETWORK_DEVICES
} from "../domain/endpoints.js";
import { readDevices } from "./devices.js";

/****************************************************************************/
/*!
 * @brief   Loads registered sensor devices for the alarm page.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function listSensors(http, signal) {
    return readDevices(http, { type: "sensor" }, signal);
}

/****************************************************************************/
/*!
 * @brief   Discovers network devices available as alarm deactivation devices.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function listNetworkDevices(http, signal) {
    return http.get(API_URL_GET_NETWORK_DEVICES, undefined, { signal });
}
