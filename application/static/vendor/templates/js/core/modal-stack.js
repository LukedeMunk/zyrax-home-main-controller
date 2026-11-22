/******************************************************************************
 *
 * File:    modal-stack.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Coordinates modal stacking, overlays, focus escape, and scroll locking.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
/** Owns modal stacking, overlays, escape handling and scroll locking. */
import {AnimationController} from "./animation.js";

export class ModalStack {
    #entries = [];
    #keydown;
    #originalOverflow = null;

    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   options              Value supplied for options.
     */
    /******************************************************************************/
    constructor({documentRef = document, animation, animationDuration = 300} = {}) {
        this.document = documentRef;
        this.animation = new AnimationController(animation);
        this.animationDuration = animationDuration;

        /******************************************************************************/
        /*!
         * @brief   Requests closure of the top modal when Escape is pressed.
         * @param   event                Keyboard event to handle.
         */
        /******************************************************************************/
        this.#keydown = event => {
            if (event.key !== "Escape") return;

            const entry = [...this.#entries].reverse().find(candidate => candidate.state === "open");

            if (!entry) return;
            if (!entry.allowEscapeClose) return event.preventDefault();

            event.preventDefault();
            entry.onRequestClose?.();
        };
        this.document.addEventListener("keydown", this.#keydown);
    }

    /******************************************************************************/
    /*!
     * @brief   Opens the supplied resource and establishes its active state.
     * @param   dialog               Value supplied for dialog.
     * @param   options              Modal behavior options.
     */
    /******************************************************************************/
    open(dialog, {allowEscapeClose = true, onRequestClose} = {}) {
        const existing = this.#entries.find(entry => entry.dialog === dialog);

        if (existing?.state === "open") return;

        if (existing?.state === "closing") {
            this.animation.cancel(existing.closeHandle);
            existing.closeHandle = null;
            existing.state = "open";
            existing.showHandle = this.#show(existing);

            return;
        }

        const overlay = this.document.createElement("div");
        overlay.className = "overlay";
        dialog.before(overlay);

        if (this.#entries.length === 0) this.#originalOverflow = this.document.body.style.overflow;

        const entry = {dialog, overlay, allowEscapeClose, onRequestClose, state: "open", showHandle: null, closeHandle: null};

        this.#entries.push(entry);
        this.#syncScrollLock();
        dialog.showModal?.();

        if (allowEscapeClose) {
            /******************************************************************************/
            /*!
             * @brief   Requests modal closure when its overlay is clicked.
             */
            /******************************************************************************/
            overlay.addEventListener("click", () => onRequestClose?.());
        }

        entry.showHandle = this.#show(entry);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close operation.
     * @param   dialog               Value supplied for dialog.
     * @param   options              Closing behavior options.
     */
    /******************************************************************************/
    close(dialog, {immediate = false} = {}) {
        const entry = this.#entries.find(candidate => candidate.dialog === dialog);

        if (!entry) return;
        if (entry.state === "closing" && !immediate) return;

        this.animation.cancel(entry.showHandle);
        entry.showHandle = null;
        entry.state = "closing";
        entry.dialog.classList.remove("show");
        entry.overlay.classList.remove("show");

        if (immediate) return this.#finalize(entry);

        /******************************************************************************/
        /*!
         * @brief   Finalizes a modal after its closing transition completes.
         */
        /******************************************************************************/
        entry.closeHandle = this.animation.after(this.animationDuration, () => this.#finalize(entry));
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        for (const entry of [...this.#entries]) this.#finalize(entry);
        this.animation.clear();
        this.#syncScrollLock();
        this.document.removeEventListener("keydown", this.#keydown);
    }

    /******************************************************************************/
    /*!
     * @brief   Applies the visible state on the next render frame.
     * @param   entry                Value supplied for entry.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    #show(entry) {
        /******************************************************************************/
        /*!
         * @brief   Adds visible classes after the dialog's hidden state has painted.
         */
        /******************************************************************************/
        return this.animation.nextFrame(() => {
            entry.showHandle = null;

            if (entry.state !== "open") return;

            entry.dialog.getBoundingClientRect?.();
            entry.overlay.classList.add("show");
            entry.dialog.classList.add("show");
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Completes cleanup for a closing modal stack entry.
     * @param   entry                Value supplied for entry.
     */
    /******************************************************************************/
    #finalize(entry) {
        this.animation.cancel(entry.showHandle);
        this.animation.cancel(entry.closeHandle);
        entry.showHandle = null;
        entry.closeHandle = null;
        entry.overlay.remove();
        entry.dialog.close?.();

        const index = this.#entries.indexOf(entry);

        if (index >= 0) this.#entries.splice(index, 1);
        this.#syncScrollLock();
    }

    /******************************************************************************/
    /*!
     * @brief   Synchronizes document scrolling with the modal stack state.
     */
    /******************************************************************************/
    #syncScrollLock() {
        if (this.#entries.length > 0) {
            this.document.body.style.overflow = "hidden";
            return;
        }

        if (this.#originalOverflow !== null) this.document.body.style.overflow = this.#originalOverflow;
        this.#originalOverflow = null;
    }
}
