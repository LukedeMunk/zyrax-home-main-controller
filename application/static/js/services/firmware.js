/****************************************************************************/
/*
 * File:    firmware.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Uploads firmware using the multipart field accepted by Flask and
 *          reports byte progress.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { TEXT_NETWORK_ERROR } from "../domain/language_pack_english.js";

/****************************************************************************/
/*!
 * @brief   Uploads firmware and retries transient network failures.
 * @param   file                    Selected upload file.
 * @param   signal                  Abort signal owned by the current page.
 * @param   onProgress              Callback receiving upload progress percentages.
 */
/****************************************************************************/
export async function uploadOtaFile(file, signal, onProgress) {
    for (let retry = 0;; retry++) {
        try {
            await sendFile(file, signal, onProgress);

            return;
        } catch (error) {
            if (error.name !== "NetworkError" || retry === 3) throw error;

            /****************************************************************************/
            /*!
             * @brief   Creates an abortable delay before retrying a failed firmware upload.
             * @param   resolve                 Resolves the pending asynchronous operation.
             * @param   reject                  Rejects the pending asynchronous operation.
             */
            /****************************************************************************/
            await new Promise((resolve, reject) => {
                signal.throwIfAborted();

                /****************************************************************************/
                /*!
                 * @brief   Resolves the firmware retry delay and releases its abort listener.
                 */
                /****************************************************************************/
                const timer = setTimeout(() => {
                    signal.removeEventListener("abort", abort);
                    resolve();
                }, 1000);

                /****************************************************************************/
                /*!
                 * @brief   Cancels the pending firmware upload or retry delay.
                 */
                /****************************************************************************/
                function abort() {
                    clearTimeout(timer);
                    reject(signal.reason);
                }

                signal.addEventListener("abort", abort, { once: true });
            });
        }
    }
}

/****************************************************************************/
/*!
 * @brief   Uploads the firmware multipart body and reports byte progress.
 * @param   file                    Selected upload file.
 * @param   signal                  Abort signal owned by the current page.
 * @param   onProgress              Callback receiving upload progress percentages.
 * @returns Calculated value or configured element.
 */
/****************************************************************************/
function sendFile(file, signal, onProgress) {
    /****************************************************************************/
    /*!
     * @brief   Creates the firmware upload request and binds its lifecycle callbacks.
     * @param   resolve                 Resolves the pending asynchronous operation.
     * @param   reject                  Rejects the pending asynchronous operation.
     */
    /****************************************************************************/
    return new Promise((resolve, reject) => {
        signal.throwIfAborted();

        const request = new XMLHttpRequest();

        /****************************************************************************/
        /*!
         * @brief   Cancels the pending firmware upload or retry delay.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        const abort = () => request.abort();

        signal.addEventListener("abort", abort, { once: true });
        request.onloadend = () => signal.removeEventListener("abort", abort);
        request.onerror = () => reject(new DOMException(TEXT_NETWORK_ERROR, "NetworkError"));
        request.onabort = () => reject(new DOMException("Aborted", "AbortError"));

        /****************************************************************************/
        /*!
         * @brief   Applies a successfully loaded response or file preview.
         */
        /****************************************************************************/
        request.onload = () => {
            const result = request.response;
            if (request.status === 200
                && result?.status_code === 200) resolve();
            else reject(
                    new Error(result?.message ?? TEXT_NETWORK_ERROR)
                );
        };
        request.open("POST", "/upload_ota_file");
        request.responseType = "json";

        /****************************************************************************/
        /*!
         * @brief   Reports upload progress when the total byte count is available.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        request.upload.onprogress = event => {
            if (event.lengthComputable) onProgress(100 * event.loaded / event.total);
        };

        const body = new FormData();
        body.append("otaFile", file);
        request.send(body);
    });
}
