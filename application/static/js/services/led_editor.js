/****************************************************************************/
/*
 * File:    led_editor.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Sends LED drawing and addressing commands as JSON.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

/****************************************************************************/
/*!
 * @brief   Saves an LED editor configuration and validates the response.
 * @param   http                    Shared controller HTTP client.
 * @param   path                    Controller endpoint path.
 * @param   data                    Configuration sent to the controller.
 * @param   signal                  Abort signal owned by the current page.
 */
/****************************************************************************/
export async function saveDrawing(http, path, data, signal) {
    const result = await http.post(path, data, { signal });
    if (result?.status_code !== 200) throw new Error(result?.message ?? "Invalid response");
}
