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

import {
    API_URL_LOGIN, API_URL_PICK_PROFILE
} from "../domain/endpoints.js";
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
    return submitForm(http, API_URL_LOGIN, { email, password }, signal);
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
    return submitForm(http, API_URL_PICK_PROFILE, { id }, signal);
}
