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

/****************************************************************************/
/*!
 * @brief   Loads registered sensor devices for the alarm page.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function listSensors(http, signal) {
    return http.get("/get_sensors", undefined, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(4000)])
    });
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
    return http.get("/get_network_devices", undefined, { signal });
}
