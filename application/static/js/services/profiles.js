/****************************************************************************/
/*
 * File:    profiles.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Uploads the selected profile picture using the Flask multipart
 *          contract.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_UPLOAD_PROFILE_PICTURE
} from "../domain/endpoints.js";

/****************************************************************************/
/*!
 * @brief   Uploads a profile picture using the controller multipart fields.
 * @param   profileId               Profile associated with the uploaded picture.
 * @param   file                    Selected upload file.
 * @param   signal                  Abort signal owned by the current page.
 */
/****************************************************************************/
export async function uploadProfilePicture(profileId, file, signal) {
    const data = new FormData();
    data.append("image", file);
    data.append("profile_id", profileId);

    const response = await fetch(API_URL_UPLOAD_PROFILE_PICTURE, { method: "POST", body: data, signal });
    const result = await response.json();
    if (!response.ok || result.status_code !== 200) {
        throw new Error(result.message || response.statusText);
    }
}
