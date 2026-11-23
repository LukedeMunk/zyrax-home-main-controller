/****************************************************************************/
/*
 * File:    catalog.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Accesses the device catalog and normalizes its two response formats.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_ADD_DEVICE, API_URL_PREFIX, API_URL_UPDATE_DEVICE
} from "../domain/endpoints.js";
import { TEXT_CATALOG_INVALID_CONTROLLER_RESPONSE } from "../domain/language_pack_english.js";

/****************************************************************************/
/*!
 * @brief   Creates catalog requests that normalize controller response envelopes.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Request function bound to this HTTP client and lifecycle signal.
 */
/****************************************************************************/
export function catalogService(http, signal) {
    /****************************************************************************/
    /*!
     * @brief   Sends a catalog request and normalizes its response envelope.
     * @param   path                    Controller endpoint path.
     * @param   method                  HTTP method used for the request.
     * @param   payload                 Optional request body.
     * @returns Controller response or completion result.
     */
    /****************************************************************************/
    return async function request(path, method = "GET", payload) {
        const isGet = method === "GET";
        const formEncoded = !isGet && path !== API_URL_ADD_DEVICE && path !== API_URL_UPDATE_DEVICE;
        const result = await http.request(path, {
            method, signal, formEncoded,
            query: isGet ? payload : undefined,
            body: isGet ? undefined : payload
        });
        if (result == null) return;
        if (typeof result !== "object") throw new Error(TEXT_CATALOG_INVALID_CONTROLLER_RESPONSE);

        if (result.status_code !== undefined && ![200, 201].includes(result.status_code)) {
            throw new Error(result.message);
        }

        return path.startsWith(API_URL_PREFIX) && result.status_code !== undefined
            ? result.message : result;
    };
}
