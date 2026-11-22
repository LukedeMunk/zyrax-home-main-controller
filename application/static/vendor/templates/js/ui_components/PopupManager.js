/******************************************************************************
 *
 * File:    PopupManager.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders and manages actionable popup messages.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {AnimationController} from "../core/animation.js";
import {button, element} from "../core/dom.js";

export class PopupManager extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.popup = null;
        this.closing = false;
        this.closeTimer = null;
        this.animation = new AnimationController(props.animation);
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();
        this.animation.cancelFrames();

        if (!this.popup) return this.root.replaceChildren();

        const {title, message, type, actions} = this.popup;
        const controls = element("div", {className: "popup-buttons"});

        for (const action of actions) {
            const control = button({text: action.label, className: action.className ?? ""});

            /******************************************************************************/
            /*!
             * @brief   Reports and executes the selected popup action.
             */
            /******************************************************************************/
            this.listen(control, "click", () => {
                this.emit("action", {action: action.name});
                action.onAction?.();

                if (action.close !== false) this.close();
            });
            controls.append(control);
        }

        const dialog = element("div", {
            className: `popup-container ${type}`,
            attributes: {role: "alertdialog", "aria-modal": "true"}
        }, [element("h2", {text: title}), element("p", {text: message}), controls]);

        this.root.replaceChildren(dialog);

        if (!this.closing) {
            /******************************************************************************/
            /*!
             * @brief   Applies the popup's visible state after its initial paint.
             */
            /******************************************************************************/
            this.animation.nextFrame(() => {
                if (!this.mounted || this.closing || !this.popup) return;

                dialog.getBoundingClientRect?.();
                dialog.classList.add("show");
            });
        }
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   options              Value supplied for options.
     */
    /******************************************************************************/
    show({title = "", message = "", type = "info", actions = [{name: "close", label: "Close"}]} = {}) {
        this.animation.cancel(this.closeTimer);
        this.closeTimer = null;
        this.closing = false;
        this.popup = {title, message, type, actions};
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the confirm operation.
     * @param   options              Value supplied for options.
     * @returns Promise              Promise resolved with the selected outcome.
     */
    /******************************************************************************/
    confirm(options = {}) {
        /******************************************************************************/
        /*!
         * @brief   Displays a confirmation popup and resolves the selected outcome.
         * @param   resolve              Promise resolver for the selected outcome.
         */
        /******************************************************************************/
        return new Promise(resolve => this.show({
            ...options,
            actions: [

                /******************************************************************************/
                /*!
                 * @brief   Resolves the confirmation with an affirmative result.
                 */
                /******************************************************************************/
                {name: "confirm", label: options.confirmLabel ?? "Confirm", onAction: () => resolve(true)},

                /******************************************************************************/
                /*!
                 * @brief   Resolves the confirmation with a negative result.
                 */
                /******************************************************************************/
                {name: "cancel", label: options.cancelLabel ?? "Cancel", onAction: () => resolve(false)}
            ]
        }));
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close operation.
     */
    /******************************************************************************/
    close() {
        if (!this.popup || this.closing) return;

        this.closing = true;
        this.animation.cancelFrames();

        const dialog = this.root.querySelector?.(".popup-container");
        dialog?.classList.remove("show");

        /******************************************************************************/
        /*!
         * @brief   Clears popup state after the fade-out transition.
         */
        /******************************************************************************/
        this.closeTimer = this.animation.after(dialog ? 300 : 0, () => {
            this.closeTimer = null;
            this.closing = false;
            this.popup = null;

            if (this.mounted) this.render();
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        this.animation.clear();
        this.closeTimer = null;
        this.popup = null;
        this.closing = false;
        super.destroy();
    }
}
