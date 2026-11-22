/******************************************************************************
 *
 * File:    LoadingBannerManager.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders and tracks loading and progress banners.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {AnimationController} from "../core/animation.js";
import {element} from "../core/dom.js";

export class LoadingBannerManager extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.tasks = new Map();
        this.pollControllers = new Set();
        this.nextId = 1;
        this.animation = new AnimationController(props.animation);
        this.fadeFrames = new Map();
        this.removalTimers = new Map();
        this.closing = new Set();
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.animation.clear();
        this.fadeFrames.clear();
        this.removalTimers.clear();

        for (const id of this.closing) this.tasks.delete(id);
        this.closing.clear();

        const stackElem = this.#createStack();

        for (const task of this.tasks.values()) {
            stackElem.append(this.#createTaskElement(task));
            this.#scheduleReveal(task);
        }

        this.root.replaceChildren(stackElem);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   options              Value supplied for options.
     * @returns string              Identifier assigned to the loading task.
     */
    /******************************************************************************/
    show({message = "Loading…", progress} = {}) {
        const id = String(this.nextId++);
        const task = {id, message, progress};

        this.tasks.set(id, task);

        const stackElem = this.#ensureStack();
        stackElem.append(this.#createTaskElement(task));
        this.#scheduleReveal(task);

        return id;
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the update task operation.
     * @param   id                   Value supplied for id.
     * @param   patch                Value supplied for patch.
     */
    /******************************************************************************/
    updateTask(id, patch) {
        const task = this.tasks.get(String(id));

        if (!task || this.closing.has(String(id))) return;

        Object.assign(task, patch);
        this.#updateTaskContent(task);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close operation.
     * @param   id                   Value supplied for id.
     */
    /******************************************************************************/
    close(id) {
        const normalizedId = String(id);
        const task = this.tasks.get(normalizedId);

        if (!task || this.closing.has(normalizedId)) return;

        this.animation.cancel(this.fadeFrames.get(normalizedId));
        this.fadeFrames.delete(normalizedId);
        this.closing.add(normalizedId);
        task.bannerElem?.classList.remove("show");

        /******************************************************************************/
        /*!
         * @brief   Removes loading-task state after its fade-out transition.
         */
        /******************************************************************************/
        const removeTask = () => {
            this.removalTimers.delete(normalizedId);

            this.closing.delete(normalizedId);
            this.tasks.delete(normalizedId);

            const stackElem = task.bannerElem?.parentElement;

            task.bannerElem?.remove();

            if (stackElem && stackElem.children.length === 0) stackElem.remove();
        };

        const removalTimer = this.animation.after(task.bannerElem ? 300 : 0, removeTask);

        this.removalTimers.set(normalizedId, removalTimer);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close all operation.
     */
    /******************************************************************************/
    closeAll() {
        for (const id of [...this.tasks.keys()]) this.close(id);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the track operation.
     * @param   promise              Value supplied for promise.
     * @param   options              Value supplied for options.
     * @returns Promise              Result produced by the operation.
     */
    /******************************************************************************/
    async track(promise, options = {}) {
        const id = this.show(options);

        try {
            return await promise;
        } finally {
            this.close(id);
        }
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the poll operation.
     * @param   url                  Value supplied for url.
     * @param   options              Polling behavior and data extraction callbacks.
     * @returns object              Polling promise and cancellation function.
     */
    /******************************************************************************/
    poll(url, {
        interval = 1000,
        isFinished = defaultIsFinished,
        progress = defaultProgress,
        fetchImpl = fetch,
        message = "Processing…"
    } = {}) {
        const controller = new AbortController();

        this.pollControllers.add(controller);

        const id = this.show({message, progress: 0});

        /******************************************************************************/
        /*!
         * @brief   Polls until cancellation or until the completion predicate succeeds.
         * @returns Promise              Final response data when polling completes.
         */
        /******************************************************************************/
        const run = async () => {
            while (!controller.signal.aborted) {
                const response = await fetchImpl(url, {signal: controller.signal});

                if (!response.ok) throw new Error(`Polling failed: ${response.status}`);

                const data = await response.json();

                this.updateTask(id, {progress: progress(data)});

                if (isFinished(data)) return data;

                await delay(interval, controller.signal);
            }
        };

        /******************************************************************************/
        /*!
         * @brief   Releases polling and loading-banner state after settlement.
         */
        /******************************************************************************/
        const promise = run().finally(() => {
            this.pollControllers.delete(controller);

            this.close(id);
        });

        /******************************************************************************/
        /*!
         * @brief   Cancels the active polling request.
         */
        /******************************************************************************/
        const cancel = () => controller.abort();

        return {promise, cancel};
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        for (const controller of this.pollControllers) controller.abort();
        this.pollControllers.clear();
        this.animation.clear();
        this.fadeFrames.clear();
        this.removalTimers.clear();
        this.closing.clear();
        this.tasks.clear();
        super.destroy();
    }

    /******************************************************************************/
    /*!
     * @brief   Creates the live region that owns all loading banners.
     * @returns HTMLElement         Loading-banner stack.
     */
    /******************************************************************************/
    #createStack() {
        return element("div", {
            className: "loading-banner-stack",
            attributes: {"aria-live": "polite"}
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Returns the rendered stack or creates it when the first task appears.
     * @returns HTMLElement         Active loading-banner stack.
     */
    /******************************************************************************/
    #ensureStack() {
        const currentStackElem = this.root.querySelector?.(".loading-banner-stack");

        if (currentStackElem) return currentStackElem;

        const stackElem = this.#createStack();

        this.root.replaceChildren(stackElem);

        return stackElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Creates markup and cached references for one loading task.
     * @param   task                 Loading-task state.
     * @returns HTMLElement         Loading banner element.
     */
    /******************************************************************************/
    #createTaskElement(task) {
        task.messageElem = element("p", {className: "loading-banner-message", text: task.message});

        const contentElem = element("div", {className: "loading-banner-content centered-flex"}, [
            element("div", {
                className: "dot-loader loading-banner-icon",
                attributes: {"aria-hidden": "true"}
            }),
            task.messageElem
        ]);

        task.bannerElem = element("article", {
            className: "loading-banner-container",
            dataset: {loadingId: task.id}
        }, [contentElem]);
        this.#updateTaskContent(task);

        return task.bannerElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Updates message and progress content without replacing the banner.
     * @param   task                 Loading-task state.
     */
    /******************************************************************************/
    #updateTaskContent(task) {
        task.messageElem.textContent = task.message;

        if (task.progress === undefined) {
            task.progressElem?.remove();
            task.progressElem = null;
            task.barElem = null;

            return;
        }

        const percentage = Math.max(0, Math.min(100, Number(task.progress) || 0));

        if (!task.progressElem) {
            task.barElem = element("div", {
                className: "bar loading-banner-progress-bar",
                attributes: {
                    role: "progressbar",
                    "aria-valuemin": 0,
                    "aria-valuemax": 100
                }
            });
            task.progressElem = element("div", {
                className: "loading-banner-progress progress full-width"
            }, [task.barElem]);
            task.bannerElem.append(task.progressElem);
        }

        task.barElem.setAttribute("aria-valuenow", String(percentage));
        task.barElem.style.width = `${percentage}%`;
    }

    /******************************************************************************/
    /*!
     * @brief   Applies a loading banner's visible state after its initial paint.
     * @param   task                 Loading-task state.
     */
    /******************************************************************************/
    #scheduleReveal(task) {
        const frame = this.animation.nextFrame(() => {
            this.fadeFrames.delete(task.id);

            if (!this.mounted || this.closing.has(task.id)) return;

            task.bannerElem.getBoundingClientRect?.();
            task.bannerElem.classList.add("show");
        });
        this.fadeFrames.set(task.id, frame);
    }
}

/******************************************************************************/
/*!
 * @brief   Waits for a delay while supporting abort cancellation.
 * @param   milliseconds         Delay in milliseconds.
 * @param   signal               Abort signal controlling the delay.
 * @returns Promise              Promise settled by the delay or abort request.
 */
/******************************************************************************/
function delay(milliseconds, signal) {
    /******************************************************************************/
    /*!
     * @brief   Starts a cancellable delay for the promise lifecycle.
     * @param   resolve              Promise resolution callback.
     * @param   reject               Promise rejection callback.
     */
    /******************************************************************************/
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, milliseconds);

        /******************************************************************************/
        /*!
         * @brief   Cancels the timer and rejects the delay when aborted.
         */
        /******************************************************************************/
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
        }, {once: true});
    });
}

/******************************************************************************/
/*!
 * @brief   Reads the conventional completion flag from polling data.
 * @param   data                 Polling response data.
 * @returns *                    Completion flag from the response.
 */
/******************************************************************************/
function defaultIsFinished(data) {
    return data.finished;
}

/******************************************************************************/
/*!
 * @brief   Reads the conventional progress value from polling data.
 * @param   data                 Polling response data.
 * @returns number              Progress value from the response.
 */
/******************************************************************************/
function defaultProgress(data) {
    return data.progress;
}
