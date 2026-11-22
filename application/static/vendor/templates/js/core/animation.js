/******************************************************************************
 *
 * File:    animation.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Manages cancellable animation frames and transition timers.
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/

export class AnimationController {
    #frames = new Set();
    #timers = new Set();

    /******************************************************************************/
    /*!
     * @brief   Initializes an animation controller with replaceable scheduling functions.
     * @param   options              Scheduling function overrides.
     */
    /******************************************************************************/
    constructor({requestFrame = defaultRequestFrame, cancelFrame = defaultCancelFrame,
        setTimer = defaultSetTimer, clearTimer = defaultClearTimer} = {}) {
        this.requestFrame = requestFrame;
        this.cancelFrame = cancelFrame;
        this.setTimer = setTimer;
        this.clearTimer = clearTimer;
    }

    /******************************************************************************/
    /*!
     * @brief   Schedules a tracked callback for the next browser render frame.
     * @param   callback             Value supplied for callback.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    nextFrame(callback) {
        const handle = {type: "frame", id: null};

        this.#frames.add(handle);

        /******************************************************************************/
        /*!
         * @brief   Removes a fired frame from tracking and invokes its callback.
         */
        /******************************************************************************/
        handle.id = this.requestFrame(() => {
            if (!this.#frames.delete(handle)) return;

            callback();
        });
        return handle;
    }

    /******************************************************************************/
    /*!
     * @brief   Schedules a tracked callback after the specified delay.
     * @param   milliseconds         Value supplied for milliseconds.
     * @param   callback             Value supplied for callback.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    after(milliseconds, callback) {
        const handle = {type: "timer", id: null};

        this.#timers.add(handle);

        /******************************************************************************/
        /*!
         * @brief   Removes a fired timer from tracking and invokes its callback.
         */
        /******************************************************************************/
        handle.id = this.setTimer(() => {
            if (!this.#timers.delete(handle)) return;

            callback();
        }, milliseconds);
        return handle;
    }

    /******************************************************************************/
    /*!
     * @brief   Cancels a tracked animation frame or timer.
     * @param   handle               Value supplied for handle.
     */
    /******************************************************************************/
    cancel(handle) {
        if (!handle) return;

        if (handle.type === "frame" && this.#frames.delete(handle)) this.cancelFrame(handle.id);
        if (handle.type === "timer" && this.#timers.delete(handle)) this.clearTimer(handle.id);
    }

    /******************************************************************************/
    /*!
     * @brief   Cancels every pending animation frame.
     */
    /******************************************************************************/
    cancelFrames() {
        for (const handle of [...this.#frames]) this.cancel(handle);
    }

    /******************************************************************************/
    /*!
     * @brief   Cancels every tracked animation frame and timer.
     */
    /******************************************************************************/
    clear() {
        for (const handle of [...this.#frames, ...this.#timers]) this.cancel(handle);
    }
}

/******************************************************************************/
/*!
 * @brief   Schedules work through requestAnimationFrame or a timer fallback.
 * @param   callback            Work to execute on the next frame.
 * @returns number              Native frame or timer handle.
 */
/******************************************************************************/
function defaultRequestFrame(callback) {
    if (globalThis.requestAnimationFrame) return globalThis.requestAnimationFrame(callback);

    return globalThis.setTimeout(callback, 0);
}

/******************************************************************************/
/*!
 * @brief   Cancels a native animation frame or fallback timer.
 * @param   handle               Native frame or timer handle.
 */
/******************************************************************************/
function defaultCancelFrame(handle) {
    if (globalThis.cancelAnimationFrame) globalThis.cancelAnimationFrame(handle);
    else globalThis.clearTimeout(handle);
}

/******************************************************************************/
/*!
 * @brief   Schedules a timer callback with the global timer implementation.
 * @param   callback            Work to execute after the delay.
 * @param   milliseconds        Delay in milliseconds.
 * @returns number              Native timer handle.
 */
/******************************************************************************/
function defaultSetTimer(callback, milliseconds) {
    return globalThis.setTimeout(callback, milliseconds);
}

/******************************************************************************/
/*!
 * @brief   Cancels a timer through the global timer implementation.
 * @param   handle               Native timer handle.
 */
/******************************************************************************/
function defaultClearTimer(handle) {
    globalThis.clearTimeout(handle);
}
