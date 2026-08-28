/******************************************************************************/
/*
 * File:    base_utilities.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Global code that handles global utility functions.
 *          
 *          This code must be seen as 'read-only', so that template updates can
 *          be rolled out without much work. Put all the global objects in
 *          'globals.js' and all the global functions in 'base.js'.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/

//#region Disable scrolling variables
let scrollKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";

//Modern Chrome requires { passive: false } when adding event (for scrolling)
let supportsPassive = false;
try {
    window.addEventListener("test", null, Object.defineProperty({}, "passive", {
        get: function() { supportsPassive = true; } 
    }));
} catch(e) {}
let wheelOpt = supportsPassive ? { passive: false } : false;
//#endregion

//#region HTTP requests
/******************************************************************************/
/*!
    @brief  Executes an HTTP request to the backend and returns the response.
    @param  url                 Endpoint to request
    @param  data                JSON object with the data to send
    @param  postRequest         When true, a POST request is sent, else a GET
                                request is sent
    @param  sendAsJson          When true, nested JSON is sent
    @param  loginPageWhenUnauthorized   When true, the login page is shown when
                                        HTTP_CODE_UNAUTHORIZED is returned
    @param  showErrorBanner     When true and error, shows a banner in the UI
    @return                     Response of the request
*/
/******************************************************************************/
async function httpRequestJsonReturn(url, data = {}, postRequest=false, sendAsJson=false, loginPageWhenUnauthorized=true, showErrorBanner=false) {
    console.log("Sending data to:", url);
    console.log(data);

    let method = postRequest ? "POST" : "GET";

    let headers = {};
    let fetchOptions = {};

    /* Build request */
    if (postRequest) {
        let body;
        if (sendAsJson) {
            headers["Content-Type"] = "application/json; charset=utf-8";
            body = JSON.stringify(data);
        } else {
            headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
            body = new URLSearchParams(data).toString();
        }
        fetchOptions.body = body;
    } else {
        /* Append query params for GET */
        let query = new URLSearchParams(data).toString();
        if (query) {
            url += (url.includes("?") ? "&" : "?") + query;
        }
    }

    fetchOptions.method = method;
    fetchOptions.headers = headers;

    try {
        let response = await fetch(url, fetchOptions);

        let responseData;
        try {
            responseData = await response.json();
        } catch {
            responseData = null;
        }

        /* Handle HTTP errors */
        if (!response.ok) {
            if (loginPageWhenUnauthorized && response.status === HTTP_CODE_UNAUTHORIZED) {
                if (page != LOGIN_PAGE) {
                    redirect("./login");
                }
            }

            let errorResponse = {
                status_code: response.status,
                message: response.statusText + ", code: " + response.status
            };

            console.log("serverResponse:");
            console.log(errorResponse);
            
            if (showErrorBanner) {
                banners.show(TEXT_SERVER_ERROR, TEXT_ERROR + ": " + errorResponse.message, MESSAGE_TYPE_ERROR);
            }

            return errorResponse;
        }

        console.log("serverResponse:");
        console.log(responseData);
            
        if (showErrorBanner && responseData.status_code != HTTP_CODE_OK) {
            banners.show(TEXT_SERVER_ERROR, TEXT_ERROR + ": " + responseData.message, MESSAGE_TYPE_ERROR);
        }

        return responseData;

    } catch (error) {
        /* Network / fetch error */
        let errorResponse = {
            status_code: 0,
            message: error.message || TEXT_NETWORK_ERROR
        };

        console.log("serverResponse:");
        console.log(errorResponse);
            
        if (showErrorBanner) {
            banners.show(TEXT_SERVER_ERROR, TEXT_ERROR + ": " + errorResponse.message, MESSAGE_TYPE_ERROR);
        }

        return errorResponse;
    }
}

/******************************************************************************/
/*!
    @brief  Executes an HTTP get request to the backend and returns the
            response. (wrapper function)
    @param  url                 Endpoint to request
    @param  data                JSON object with the data to send
    @param  sendAsJson          When true, nested JSON is sent
    @param  loginPageWhenUnauthorized   When true, the login page is shown when
                                        HTTP_CODE_UNAUTHORIZED is returned
    @return                     Response of the request
*/
/******************************************************************************/
function httpGetRequestJsonReturn(url, data={}, sendAsJson=false, loginPageWhenUnauthorized=true) {
    return httpRequestJsonReturn(url, data, false, sendAsJson, loginPageWhenUnauthorized);
}

/******************************************************************************/
/*!
    @brief  Executes an HTTP get request to the backend and returns the
            response. Shows an error banner when error. (wrapper function)
    @param  url                 Endpoint to request
    @param  data                JSON object with the data to send
    @param  sendAsJson          When true, nested JSON is sent
    @return                     Response of the request
*/
/******************************************************************************/
function httpGetRequestErrorBanner(url, data={}, sendAsJson=false) {
    return httpRequestJsonReturn(url, data, false, sendAsJson, true, true);
}

/******************************************************************************/
/*!
    @brief  Executes an HTTP post request to the backend and returns the
            response. (wrapper function)
    @param  url                 Endpoint to request
    @param  data                JSON object with the data to send
    @param  sendAsJson          When true, nested JSON is sent
    @param  loginPageWhenUnauthorized   When true, the login page is shown when
                                        HTTP_CODE_UNAUTHORIZED is returned
    @return                     Response of the request
*/
/******************************************************************************/
function httpPostRequestJsonReturn(url, data={}, sendAsJson=false, loginPageWhenUnauthorized=true) {
    return httpRequestJsonReturn(url, data, true, sendAsJson, loginPageWhenUnauthorized);
}

/******************************************************************************/
/*!
    @brief  Executes an HTTP post request to the backend and returns the
            response. Shows an error banner when error. (wrapper function)
    @param  url                 Endpoint to request
    @param  data                JSON object with the data to send
    @param  sendAsJson          When true, nested JSON is sent
    @return                     Response of the request
*/
/******************************************************************************/
function httpPostRequestErrorBanner(url, data={}, sendAsJson=false) {
    return httpRequestJsonReturn(url, data, true, sendAsJson, true, true);
}
//#endregion

//#region Modals
/******************************************************************************/
/*!
    @brief  Shows the specified modal popup (with overlay).
    @param  modalElement    DOM modal element to show
*/
/******************************************************************************/
function showModal(modalElement) {
    openModals.push(modalElement);
    disableScrolling();

    /* Create overlay unique to this modal */
    const overlayElem = createModalOverlay();
    modalElement.__overlay = overlayElem;

    modalElement.showModal();
    modalElement.classList.add("show");
    overlayElem.classList.add("show");
}

/******************************************************************************/
/*!
    @brief  Closes the specified modal popup.
    @param  modalElement    DOM modal element to close
*/
/******************************************************************************/
function closeModal(modalElement) {
    /* Remove modal from stack */
    let index = openModals.indexOf(modalElement);
    if (index !== -1) {
        openModals.splice(index, 1);
    } else {
        return;
    }

    /* Enable scrolling only when the last modal closes */
    if (openModals.length === 0) {
        enableScrolling();
    }

    modalElement.classList.remove("show");
    modalElement.__overlay.classList.remove("show");

    setTimeout(() => modalElement.__overlay.remove(), 300);
    setTimeout(() => modalElement.close(), 300);
}

/******************************************************************************/
/*!
    @brief  Creates an overlay for the open modals.
*/
/******************************************************************************/
function createModalOverlay() {
    const overlayElem = document.createElement("div");
    overlayElem.className = "overlay";

    /* Insert overlay directly before the modal for correct stacking */
    if (openModals.length > 1) {
        openModals[openModals.length-2].appendChild(overlayElem);
    } else {
        document.body.appendChild(overlayElem);
    }

    return overlayElem;
}
//#endregion

//#region Utilities
//#region Loaders
/******************************************************************************/
/*!
    @brief  Generates close buttons for the popups.
*/
/******************************************************************************/
function loadModalCloseButtons() {
    let closeButtons = [...document.querySelectorAll(".close-modal-button")];   //Select all elements with classname close-modal-button

    /* For each element (closebutton), set which modal needs to be closed */
    closeButtons.forEach(function(button) {
        button.title = TEXT_CLOSE;
        button.onclick = function () {
            let modalId = button.getAttribute("target-modal");
            closeModal(document.getElementById(modalId));
        };
    });
}
//#endregion

//#region Scrolling
/******************************************************************************/
/*!
    @brief  Disables page scrolling.
*/
/******************************************************************************/
function disableScrolling() {
    document.body.style.overflow = "hidden";
}

/******************************************************************************/
/*!
    @brief  Enables page scrolling.
*/
/******************************************************************************/
function enableScrolling() {
    document.body.style.overflow = "";
}

/******************************************************************************/
/*!
    @brief  When modal is closed by the 'escape' key, enables page scrolling.
*/
/******************************************************************************/
document.body.addEventListener('keydown', function(e) {
    if (e.key !== "Escape") {
        return;
    }

    const modalElem = openModals[openModals.length - 1];

    if (!modalElem) return;

    if (modalElem.allowEscapeClose != undefined && !modalElem.allowEscapeClose) {
        e.preventDefault();
        return;
    }

    /* When modal object, use class function */
    if (modalElem.modalInstance != undefined) {
        modalElem.modalInstance.close();
    } else {
        closeModal(modalElem);
    }
});
//#endregion

//#region Date and Time functionality
/******************************************************************************/
/*!
    @brief  Returns the dates of the specified week number.
    @param  weekNumber          Number of the week of the year
    @return array               Array of dates
*/
/******************************************************************************/
function getDateRangeOfWeek(weekNumber){
    let date = new Date();
    let numOfdaysPastSinceLastMonday = eval(date.getDay() - 1);

    date.setDate(date.getDate() - numOfdaysPastSinceLastMonday);

    let weekNoToday = date.getWeek();
    let weeksInTheFuture = eval(weekNumber - weekNoToday);

    date.setDate(date.getDate() + eval(7 * weeksInTheFuture));

    let dates = [];
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
        dates.push(
            ("0" + date.getDate()).slice(-2) + "-"
            + ("0" + eval(date.getMonth()+1)).slice(-2) + "-"                   //Force format dd-mm-yyyy
            + date.getFullYear()
        );
        date.setDate(date.getDate() + 1);
    }

    return dates;
}

/******************************************************************************/
/*!
    @brief  Returns the human readable time string (HH:MM) of the specified
            minutes.
    @param  minutes             Minutes to format
    @return                     Time string
*/
/******************************************************************************/
function getTimeStringFromMinutes(minutes) {
    let hourString = String(Math.floor(minutes / 60)).padStart(2, "0");
    let minuteString = String((minutes % 60)).padStart(2, "0");

    return hourString + ":" + minuteString;
}

/******************************************************************************/
/*!
    @brief  Adds days to the date object.
    @return                     Date object
*/
/******************************************************************************/
Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);

    return date;
}

/******************************************************************************/
/*!
    @brief  Subtracts days to the date object.
    @return                     Date object
*/
/******************************************************************************/
Date.prototype.subtractDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);

    return date;
}

/******************************************************************************/
/*!
    @brief  Formats the date to an offsetted date string.
    @return                     Date string
*/
/******************************************************************************/
Date.prototype.toDateString = function() {
    let dateTimeOffsetted = this.getTime();
    dateTimeOffsetted = new Date(dateTimeOffsetted + 2 * 60 * 60 * 1000);       //GMT+200

    let date = dateTimeOffsetted.toISOString().split('T')[0];
    date = reverseDateFormat(date);

    return date;
}

/******************************************************************************/
/*!
    @brief  Returns the weeknumber based on the date object
    @return                     Number of the week of the year
*/
/******************************************************************************/
Date.prototype.getWeek = function() {
    let date = new Date(this.valueOf());                                        //Copy date so don't modify original
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));           //Set to nearest Thursday: current date + 4 - current day number. Make Sunday's day number 7

    let yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));            //Get first day of year
    let weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);      //Calculate full weeks to nearest Thursday

    return weekNumber;
}
//#endregion

//#region Other
/******************************************************************************/
/*!
    @brief  Redirects to the specified URL or reloads the page.
    @param  url                 URL to redirect to, when undefined reloads the
                                page
*/
/******************************************************************************/
function redirect(url=undefined, newTab=false) {
    if (url === undefined) {
        window.location.reload();
        return;
    }

    if (newTab) {
        window.open(url, "_blank");
    } else {
        window.location.href = url;
    }
}

/******************************************************************************/
/*!
    @brief  Returns the file extension based on the filename.
    @param  filename            Name of the file
    @return                     Extension of the file
*/
/******************************************************************************/
function getFileExtension(filename) {
    let filenameArray = filename.split(".")
    return filename.split(".")[filenameArray.length-1];
}

/******************************************************************************/
/*!
    @brief  Returns the index of the specified item with the specified ID.
    @param  array               Array to look in
    @param  id                  ID to look for
    @param  key                 Key to look in
    @return                     Array index or -1 when not found
*/
/******************************************************************************/
function getIndexFromId(array, id, key="id") {
    for (let index in array) {
        if (key != undefined) {
            if (array[index][key] == id) {
                return parseInt(index);
            }
        } else {
            if (array[index] == id) {
                return parseInt(index);
            }
        }
    }

    console.warn("No index of ID [" + id + "] and key [" + key + "] found");
    return -1;
}

/******************************************************************************/
/*!
    @brief  Returns the language ID based on the specified language
            abbreviation.
    @param  abbreviation        Language abbreviation
    @return                     Language ID, or -1 when not found
*/
/******************************************************************************/
function getLanguageByAbbriviation(abbreviation) {
    let index = 0;
    for (let languageAbbreviation of LANGUAGE_ABBREVIATIONS) {
        if (languageAbbreviation == abbreviation) {
            return index;
        }
        index++;
    }

    return NO_LANGUAGE;
}
//#endregion
//#endregion