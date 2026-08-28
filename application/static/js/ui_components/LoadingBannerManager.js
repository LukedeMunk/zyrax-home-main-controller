/******************************************************************************/
/*
 * File:    LoadingBannerManager.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Loading banner manager class to manage the loading banner stack.
 *          Used to show loading and progress banners.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Example configuration /*X*/ = required
const EXAMPLE_LOADING_BANNER_CONFIGURATION = {
    maxVisible: MAX_VISIBLE_BANNERS,
    targetElement: document.body,
    overlayObject: null,
    banners: null
}
//#endregion

class LoadingBannerManager {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Loading banner stack configuration
    */
    /******************************************************************************/
    constructor(configuration={}) {
        this.maxVisible = configuration.maxVisible ?? MAX_VISIBLE_BANNERS;
        this.targetElement = configuration.targetElement ?? document.body;
        this.overlay = configuration.overlayObject ?? null;
        this.banners = configuration.banners ?? null;

        this._stacks = new Map();                                               //Key = targetElement, Value = stack element
        this._bannerStates = new Map();                                         //Key = banner element, Value = polling and overlay state
    }

    /******************************************************************************/
    /*!
        @brief  Shows the loading banner and starts polling when a status URL is
                specified.
        @param  message             Message to show
        @param  statusUrl           URL to get the progress status from
        @param  statusVariable      Variable that contains progress status
        @param  successValue        Value when finished successful
        @param  successTitle        Title to show on success
        @param  successMessage      Message to show on success
        @param  showProgressBar     True to show a progress bar
        @param  showOverlay         True to show an overlay
        @param  targetElement       DOM element to put the banner on top of
        @return                     DOM element
    */
    /******************************************************************************/
    show(message,
         statusUrl=undefined,
         statusVariable=undefined,
         successValue=undefined,
         successTitle=TEXT_SUCCESS,
         successMessage=TEXT_SUCCESS,
         showProgressBar=false,
         showOverlay=false,
         targetElement=null) {

        targetElement = targetElement ?? this.targetElement;

        const bannerStackElem = this.#getStack(targetElement);
        const currentBannerElems = bannerStackElem.querySelectorAll(".loading-banner-container");

        if (currentBannerElems.length >= this.maxVisible) {
            this.close(currentBannerElems[0]);
        }

        const bannerElem = this.#generateLoadingBannerElement(message, showProgressBar);
        const state = {
            abortController: null,
            pollTimeout: null,
            progressResetTimeout: null,
            showOverlay: showOverlay
        };

        this._bannerStates.set(bannerElem, state);
        bannerStackElem.appendChild(bannerElem);
        this.#setLegacyElementReferences(bannerElem);

        if (showOverlay && this.overlay) {
            this.overlay.show(targetElement, false);
        }

        /* Force reflow for animation */
        bannerElem.getBoundingClientRect();
        bannerElem.classList.add("show");

        if (statusUrl !== undefined) {
            state.pollTimeout = setTimeout(() => {
                this.#waitUntilFinished(
                    bannerElem,
                    statusUrl,
                    statusVariable,
                    successValue,
                    BACK_END_UPDATE_INTERVAL_1S,
                    successTitle,
                    successMessage,
                    showProgressBar
                );
            }, 500);
        }

        return bannerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Closes the specified loading banner DOM element. When no element
                is specified, the most recently shown banner is closed.
        @param  bannerElem          Loading banner DOM element
    */
    /******************************************************************************/
    close(bannerElem=null) {
        bannerElem = bannerElem ?? Array.from(this._bannerStates.keys()).at(-1);

        if (!bannerElem || !this._bannerStates.has(bannerElem)) {
            return;
        }

        const bannerStackElem = bannerElem.parentElement;

        this.#cleanupBannerState(bannerElem);
        bannerElem.classList.remove("show");

        setTimeout(() => {
            bannerElem.remove();

            if (bannerStackElem && bannerStackElem.children.length === 0) {
                bannerStackElem.remove();
                this.#removeStackReference(bannerStackElem);
            }
        }, 300);

        this.#hideOverlayWhenUnused();
    }

    /******************************************************************************/
    /*!
        @brief  Closes all loading banners.
    */
    /******************************************************************************/
    closeAll() {
        const bannerElems = Array.from(this._bannerStates.keys());

        for (const bannerElem of bannerElems) {
            this.close(bannerElem);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Waits until finished and executes the specified callback function.
        @param  statusUrl               URL to get the progress status from
        @param  statusVariable          Variable that contains progress status
        @param  successValue            Value when finished successful
        @param  functionAfterFinished   Function to execute after finish
        @param  interval                Rate of polling (in ms)
    */
    /******************************************************************************/
    async waitUntilFinishedFunction(statusUrl,
                                    statusVariable,
                                    successValue,
                                    functionAfterFinished,
                                    interval=BACK_END_UPDATE_INTERVAL_1S) {

        let data;

        try {
            const response = await fetch(statusUrl);
            data = await response.json();
        } catch {
            setTimeout(() => {
                this.waitUntilFinishedFunction(
                    statusUrl,
                    statusVariable,
                    successValue,
                    functionAfterFinished,
                    interval
                );
            }, UPDATE_INTERVAL_PAUSE_TIME);
            return;
        }

        if (data[statusVariable] != successValue) {
            setTimeout(() => {
                this.waitUntilFinishedFunction(
                    statusUrl,
                    statusVariable,
                    successValue,
                    functionAfterFinished,
                    interval
                );
            }, interval);
            return;
        }

        setTimeout(functionAfterFinished, 10);
    }

    /******************************************************************************/
    /*!
        @brief  Generates a loading banner DOM element.
        @param  message             Message to show
        @param  showProgressBar     True to show a progress bar
        @return                     DOM element
    */
    /******************************************************************************/
    #generateLoadingBannerElement(message, showProgressBar) {
        const bannerElem = document.createElement("div");
        bannerElem.className = "loading-banner-container";

        const contentElem = document.createElement("div");
        contentElem.className = "loading-banner-content centered-flex";

        const iconElem = document.createElement("div");
        iconElem.className = "loading-banner-icon dot-loader";

        const messageElem = document.createElement("p");
        messageElem.className = "loading-banner-message";
        messageElem.textContent = message || "";

        contentElem.appendChild(iconElem);
        contentElem.appendChild(messageElem);
        bannerElem.appendChild(contentElem);

        const progressElem = document.createElement("div");
        progressElem.className = "loading-banner-progress progress full-width";
        progressElem.style.display = showProgressBar ? "block" : "none";

        const progressBarElem = document.createElement("div");
        progressBarElem.className = "loading-banner-progress-bar bar";

        progressElem.appendChild(progressBarElem);
        bannerElem.appendChild(progressElem);

        return bannerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Internal polling loop. Polls until error or success.
    */
    /******************************************************************************/
    async #waitUntilFinished(bannerElem,
                             statusUrl,
                             statusVariable,
                             successValue,
                             interval,
                             successTitle,
                             successMessage,
                             showProgressBar) {

        const state = this._bannerStates.get(bannerElem);

        if (!state) {
            return;
        }

        state.abortController = new AbortController();
        let data;

        try {
            const response = await fetch(statusUrl, {
                signal: state.abortController.signal
            });
            data = await response.json();
        } catch {
            if (this._bannerStates.has(bannerElem)) {
                this.#schedulePoll(
                    bannerElem,
                    statusUrl,
                    statusVariable,
                    successValue,
                    UPDATE_INTERVAL_PAUSE_TIME,
                    interval,
                    successTitle,
                    successMessage,
                    showProgressBar
                );
            }
            return;
        } finally {
            const currentState = this._bannerStates.get(bannerElem);

            if (currentState === state) {
                state.abortController = null;
            }
        }

        if (!this._bannerStates.has(bannerElem)) {
            return;
        }

        if (showProgressBar) {
            const progressBarElem = bannerElem.querySelector(".loading-banner-progress-bar");
            this.#showProgress(bannerElem, progressBarElem, data[statusVariable]);
        }

        if (data[statusVariable] != successValue) {
            this.#schedulePoll(
                bannerElem,
                statusUrl,
                statusVariable,
                successValue,
                interval,
                interval,
                successTitle,
                successMessage,
                showProgressBar
            );
            return;
        }

        this.close(bannerElem);

        setTimeout(() => {
            if (this.banners) {
                this.banners.show(successTitle, successMessage, MESSAGE_TYPE_SUCCESS);
            }
        }, 100);
    }

    /******************************************************************************/
    /*!
        @brief  Schedules the next polling request.
    */
    /******************************************************************************/
    #schedulePoll(bannerElem,
                  statusUrl,
                  statusVariable,
                  successValue,
                  delay,
                  interval,
                  successTitle,
                  successMessage,
                  showProgressBar) {

        const state = this._bannerStates.get(bannerElem);

        if (!state) {
            return;
        }

        state.pollTimeout = setTimeout(() => {
            this.#waitUntilFinished(
                bannerElem,
                statusUrl,
                statusVariable,
                successValue,
                interval,
                successTitle,
                successMessage,
                showProgressBar
            );
        }, delay);
    }

    /******************************************************************************/
    /*!
        @brief  Cleans up polling and progress state for a loading banner.
        @param  bannerElem          Loading banner DOM element
    */
    /******************************************************************************/
    #cleanupBannerState(bannerElem) {
        const state = this._bannerStates.get(bannerElem);

        if (!state) {
            return;
        }

        if (state.pollTimeout) {
            clearTimeout(state.pollTimeout);
        }

        if (state.progressResetTimeout) {
            clearTimeout(state.progressResetTimeout);
        }

        if (state.abortController) {
            state.abortController.abort();
        }

        this._bannerStates.delete(bannerElem);

        if (typeof loadingBannerElem !== "undefined" && loadingBannerElem === bannerElem) {
            const nextBannerElem = Array.from(this._bannerStates.keys()).at(-1) ?? null;
            this.#setLegacyElementReferences(nextBannerElem);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Updates deprecated global DOM references used by legacy pages.
        @param  bannerElem          Loading banner DOM element
    */
    /******************************************************************************/
    #setLegacyElementReferences(bannerElem) {
        if (typeof loadingBannerElem === "undefined") {
            return;
        }

        loadingBannerElem = bannerElem;
        loadingBannerMessageFieldElem = bannerElem?.querySelector(".loading-banner-message") ?? null;
        loadingBannerProgressElem = bannerElem?.querySelector(".loading-banner-progress") ?? null;
        loadingBannerProgressBarElem = bannerElem?.querySelector(".loading-banner-progress-bar") ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Shows the progress in the specified progress bar element.
    */
    /******************************************************************************/
    #showProgress(bannerElem, progressBarElem, percentage) {
        if (!progressBarElem) {
            return;
        }

        const numericPercentage = Number(percentage);
        const normalizedPercentage = Number.isFinite(numericPercentage)
            ? Math.min(100, Math.max(0, numericPercentage))
            : 0;

        progressBarElem.style.width = normalizedPercentage.toString() + "%";
        progressBarElem.style.backgroundColor = this.#getGradient(normalizedPercentage / 100);
        progressBarElem.textContent = Math.round(normalizedPercentage).toString() + "%";

        const state = this._bannerStates.get(bannerElem);

        if (normalizedPercentage === 100 && state && !state.progressResetTimeout) {
            state.progressResetTimeout = setTimeout(() => {
                state.progressResetTimeout = null;
                this.#showProgress(bannerElem, progressBarElem, 0);
            }, 1000);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Returns the stack the specified element is in.
        @param  targetElement       DOM element to get the stack of
        @return                     DOM element
    */
    /******************************************************************************/
    #getStack(targetElement) {
        if (!targetElement) {
            targetElement = document.body;
        }

        if (this._stacks.has(targetElement)) {
            return this._stacks.get(targetElement);
        }

        const stackElem = document.createElement("div");
        stackElem.className = "loading-banner-stack";

        targetElement.appendChild(stackElem);
        this._stacks.set(targetElement, stackElem);

        return stackElem;
    }

    /******************************************************************************/
    /*!
        @brief  Removes the specified stack reference.
        @param  stackElement        DOM element to remove from the stack
    */
    /******************************************************************************/
    #removeStackReference(stackElement) {
        for (const [key, value] of this._stacks) {
            if (value === stackElement) {
                this._stacks.delete(key);
                return;
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Hides the overlay when no remaining banner uses it.
    */
    /******************************************************************************/
    #hideOverlayWhenUnused() {
        if (!this.overlay) {
            return;
        }

        const overlayInUse = Array.from(this._bannerStates.values()).some(
            state => state.showOverlay
        );

        if (!overlayInUse) {
            this.overlay.hide();
        }
    }

    /******************************************************************************/
    /*!
        @brief  Calculates a gradient with the specified ratio.
    */
    /******************************************************************************/
    #getGradient(ratio, color1="329637", color2="328896") {
        const hex = function(value) {
            const hexValue = value.toString(16);
            return (hexValue.length === 1) ? "0" + hexValue : hexValue;
        };

        const red = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
        const green = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
        const blue = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));

        return "#" + hex(red) + hex(green) + hex(blue);
    }
}

/******************************************************************************/
/* Backwards-compatible functions used by existing application code. */
/******************************************************************************/
function showLoadingBanner(message,
                           statusUrl=undefined,
                           statusVariable=undefined,
                           successValue=undefined,
                           successTitle=TEXT_SUCCESS,
                           successMessage=TEXT_SUCCESS,
                           showProgressBar=false,
                           showOverlay=false) {

    return loadingBanners.show(
        message,
        statusUrl,
        statusVariable,
        successValue,
        successTitle,
        successMessage,
        showProgressBar,
        showOverlay
    );
}

/*
function closeLoadingBanner() {
    loadingBanners.closeAll();
}

function waitUntilFinishedFunction(statusUrl,
                                   statusVariable,
                                   successValue,
                                   functionAfterFinished,
                                   interval=BACK_END_UPDATE_INTERVAL_1S) {

    return loadingBanners.waitUntilFinishedFunction(
        statusUrl,
        statusVariable,
        successValue,
        functionAfterFinished,
        interval
    );
}
*/