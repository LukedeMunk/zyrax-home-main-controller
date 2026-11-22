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
        /****************************************************************************/
        /*!
         * @brief   Loads current device states for the dashboard.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        devices: () => get("/get_devices"),

        /****************************************************************************/
        /*!
         * @brief   Loads the current weather report.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        weather: () => get("/get_weather"),

        /****************************************************************************/
        /*!
         * @brief   Saves the location used by the weather service.
         * @param   weather_location        Location used for weather reports.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        setLocation: weather_location => post("/update_weather_configuration", {
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
            ? "/add_dashboard_configuration"
            : "/update_dashboard_configuration", { id, name, icon }),

        /****************************************************************************/
        /*!
         * @brief   Deletes a dashboard configuration.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        remove: id => post("/delete_dashboard_configuration", { id }),

        /****************************************************************************/
        /*!
         * @brief   Resets the tile order of a dashboard.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        reset: id => post("/reset_dashboard_tile_order", { id }),

        /****************************************************************************/
        /*!
         * @brief   Adds a tile to the selected dashboard.
         * @param   fields                  Fields sent to the controller.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        addTile: fields => post("/add_dashboard_tile", fields),

        /****************************************************************************/
        /*!
         * @brief   Saves a dashboard tile position.
         * @param   fields                  Fields sent to the controller.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        moveTile: fields => post("/update_dashboard_tile", fields),

        /****************************************************************************/
        /*!
         * @brief   Removes a dashboard tile.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        removeTile: id => post("/delete_dashboard_tile", { id }),

        /****************************************************************************/
        /*!
         * @brief   Updates power for a device or group.
         * @param   id                      Identifier of the affected item.
         * @param   power                   Requested device or group power state.
         * @param   group                   Whether the target is a group.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        setPower: (id, power, group) => post(group ? "/set_group_power" : "/set_device_power", {
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
        setBrightness: (id, brightness, group) => post(group
            ? "/set_ledstrip_group_brightness"
            : "/set_ledstrip_brightness", { id, brightness }),

        /****************************************************************************/
        /*!
         * @brief   Updates the alarm armed state.
         * @param   armed                   Requested alarm armed state.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        arm: armed => post("/update_alarm", { armed: Number(armed) }),

        /****************************************************************************/
        /*!
         * @brief   Runs an automation and rejects an unsuccessful execution.
         * @param   id                      Identifier of the affected item.
         * @returns Controller response or completion result.
         */
        /****************************************************************************/
        async run(id) {
            const result = await http.post("/run_automation", { id, source: "dashboard" }, {
                signal
            });
            if (result.status_code !== 200 || result.message?.status === "failed") {
                throw new Error(result.message?.error ?? result.message);
            }

            return result.message;
        }
    };
}
