/****************************************************************************/
/*
 * File:    led_editor.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Sends LED drawing and addressing arrays in form-encoded commands.
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
    const fields = { ...data, leds: JSON.stringify(data.leds) };
    if (data.segments !== undefined) fields.segments = JSON.stringify(data.segments);

    const result = await http.post(path, fields, { formEncoded: true, signal });
    if (result?.status_code !== 200) throw new Error(result?.message ?? "Invalid response");
}
