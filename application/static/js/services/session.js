/****************************************************************************/
/*
 * File:    session.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Account session and profile selection requests.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { submitForm } from "./forms.js";

/****************************************************************************/
/*!
 * @brief   Authenticates an account with the supplied credentials.
 * @param   http                    Shared controller HTTP client.
 * @param   email                   Account email address.
 * @param   password                Account password.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function signIn(http, email, password, signal) {
    return submitForm(http, "/login", { email, password }, signal);
}

/****************************************************************************/
/*!
 * @brief   Activates a profile for the current authenticated session.
 * @param   http                    Shared controller HTTP client.
 * @param   id                      Identifier of the affected item.
 * @param   signal                  Abort signal owned by the current page.
 * @returns Controller response or completion result.
 */
/****************************************************************************/
export function pickProfile(http, id, signal) {
    return submitForm(http, "/pick_profile", { id }, signal);
}
