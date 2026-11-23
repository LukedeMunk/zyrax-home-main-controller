/****************************************************************************/
/*
 * File:    dashboard.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Reads devices and issues dashboard commands using the existing Flask contracts.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_ADD_DASHBOARD_CONFIGURATION, API_URL_ADD_DASHBOARD_TILE,
    API_URL_DELETE_DASHBOARD_CONFIGURATION, API_URL_DELETE_DASHBOARD_TILE,
    API_URL_GET_WEATHER_FORECAST, API_URL_LEDSTRIP_SET_BRIGHTNESS,
    API_URL_RESET_DASHBOARD_TILE_ORDER, API_URL_RUN_AUTOMATION, API_URL_SET_DEVICE_POWER,
    API_URL_SET_GROUP_POWER, API_URL_UPDATE_ALARM, API_URL_UPDATE_DASHBOARD_CONFIGURATION,
    API_URL_UPDATE_DASHBOARD_TILE, API_URL_UPDATE_WEATHER_CONFIGURATION
} from "../domain/endpoints.js";
import { readDevices } from "./devices.js";
import { submitForm } from "./forms.js";

/****************************************************************************/
/*!
 * @brief   Creates the controller operations used by dashboard controls.
 * @param   http                    Shared controller HTTP client.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Dashboard request and command methods.
 */
/****************************************************************************/
export function dashboardService(http, signal) {
    /****************************************************************************/
    /*!
     * @brief   Sends a form-encoded dashboard command.
     * @param   url                     Controller endpoint URL.
     * @param   fields                  Fields sent to the controller.
     * @returns Controller response or completion result.
     */
    /****************************************************************************/
    const post = (url, fields) => submitForm(http, url, fields, signal);

    /****************************************************************************/
    /*!
     * @brief   Loads controller state with the page signal and a request timeout.
     * @param   path                    Controller endpoint path.
     * @returns Controller response or completion result.
     */
    /****************************************************************************/
    const get = path => http.get(path, undefined, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(4000)])
    });

    return {
        devices: () => readDevices(http, undefined, signal),
        weather: () => get(API_URL_GET_WEATHER_FORECAST),

        /****************************************************************************/
        /*!
         * @brief   Saves the location used by the weather service.
         * @param   weather_location        Location used for weather reports.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        setLocation: weather_location => post(API_URL_UPDATE_WEATHER_CONFIGURATION, {
            weather_location
        }),

        /****************************************************************************/
        /*!
         * @brief   Saves a new or existing dashboard configuration.
         * @param   id                      Identifier of the affected item.
         * @param   name                    Visible name or element identifier.
         * @param   icon                    Icon class or icon name.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        save: (id, name, icon) => post(id === -1
            ? API_URL_ADD_DASHBOARD_CONFIGURATION
            : API_URL_UPDATE_DASHBOARD_CONFIGURATION, { id, name, icon }),

        /****************************************************************************/
        /*!
         * @brief   Deletes a dashboard configuration.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        remove: id => post(API_URL_DELETE_DASHBOARD_CONFIGURATION, { id }),

        /****************************************************************************/
        /*!
         * @brief   Resets the tile order of a dashboard.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        reset: id => post(API_URL_RESET_DASHBOARD_TILE_ORDER, { id }),

        /****************************************************************************/
        /*!
         * @brief   Adds a tile to the selected dashboard.
         * @param   fields                  Fields sent to the controller.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        addTile: fields => post(API_URL_ADD_DASHBOARD_TILE, fields),

        /****************************************************************************/
        /*!
         * @brief   Saves a dashboard tile position.
         * @param   fields                  Fields sent to the controller.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        moveTile: fields => post(API_URL_UPDATE_DASHBOARD_TILE, fields),

        /****************************************************************************/
        /*!
         * @brief   Removes a dashboard tile.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        removeTile: id => post(API_URL_DELETE_DASHBOARD_TILE, { id }),

        /****************************************************************************/
        /*!
         * @brief   Updates power for a device or group.
         * @param   id                      Identifier of the affected item.
         * @param   power                   Requested device or group power state.
         * @param   group                   Whether the target is a group.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        setPower: (id, power, group) => post(group ? API_URL_SET_GROUP_POWER : API_URL_SET_DEVICE_POWER, {
            id,
            power: Number(power)
        }),

        /****************************************************************************/
        /*!
         * @brief   Updates brightness for a strip or group.
         * @param   id                      Identifier of the affected item.
         * @param   brightness              Requested brightness value.
         * @param   group                   Whether the target is a group.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        setBrightness: (id, brightness, group) => post(API_URL_LEDSTRIP_SET_BRIGHTNESS, {
            id, brightness, target_type: group ? "group" : "device"
        }),

        /****************************************************************************/
        /*!
         * @brief   Updates the alarm armed state.
         * @param   armed                   Requested alarm armed state.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        arm: armed => post(API_URL_UPDATE_ALARM, { armed: Number(armed) }),

        /****************************************************************************/
        /*!
         * @brief   Runs an automation and rejects an unsuccessful execution.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        async run(id) {
            const result = await http.post(API_URL_RUN_AUTOMATION, { id, source: "dashboard" }, {
                signal
            });
            if (result.status_code !== 200 || result.message?.status === "failed") {
                throw new Error(result.message?.error ?? result.message);
            }

            return result.message;
        }
    };
}
