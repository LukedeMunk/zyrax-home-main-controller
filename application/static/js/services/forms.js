/****************************************************************************/
/*
 * File:    forms.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Submits form-encoded commands using the existing Flask response
 *          envelope.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

/****************************************************************************/
/*!
 * @brief   Sends a form-encoded command and validates its controller response.
 * @param   http                    Shared controller HTTP client.
 * @param   path                    Controller endpoint path.
 * @param   fields                  Fields sent to the controller.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export async function submitForm(http, path, fields, signal) {
    const result = await http.post(path, fields, { formEncoded: true, signal });
    if (result?.status_code !== 200) throw new Error(result?.message ?? "Invalid response");

    return result.message;
}
