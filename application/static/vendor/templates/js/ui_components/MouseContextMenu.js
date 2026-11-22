/******************************************************************************
 *
 * File:    MouseContextMenu.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders and controls an accessible pointer context menu.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {button, element} from "../core/dom.js";

export class MouseContextMenu extends Component {
    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();

        const menu = element("div", {className: "mouse-context-menu", attributes: {role: "menu"}});
        menu.hidden = true;

        for (const item of this.props.items ?? []) {
            const control = button({
                text: item.label,
                iconClass: item.icon,
                className: "mouse-context-menu-item",
                disabled: item.disabled,
                dataset: {action: item.action}
            });
            control.setAttribute("role", "menuitem");

            /******************************************************************************/
            /*!
             * @brief   Reports the selected context-menu action and hides the menu.
             */
            /******************************************************************************/
            this.listen(control, "click", () => {
                this.emit("action", {action: item.action, context: this.context});
                this.hide();
            });
            menu.append(control);
        }

        this.root.replaceChildren(menu);
        this.menu = menu;

        for (const trigger of this.props.triggers ?? []) this.addTrigger(trigger);

        /******************************************************************************/
        /*!
         * @brief   Hides the context menu after a document click.
         */
        /******************************************************************************/
        this.listen(document, "click", () => this.hide());

        /******************************************************************************/
        /*!
         * @brief   Hides the context menu when Escape is pressed.
         * @param   event                Keyboard event to handle.
         */
        /******************************************************************************/
        this.listen(window, "keydown", event => {
            if (event.key === "Escape") this.hide();
        });

        /******************************************************************************/
        /*!
         * @brief   Hides the context menu when the viewport scrolls.
         */
        /******************************************************************************/
        this.listen(window, "scroll", () => this.hide());

        /******************************************************************************/
        /*!
         * @brief   Hides the context menu when the viewport is resized.
         */
        /******************************************************************************/
        this.listen(window, "resize", () => this.hide());
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the add trigger operation.
     * @param   trigger              Value supplied for trigger.
     */
    /******************************************************************************/
    addTrigger(trigger) {
        /******************************************************************************/
        /*!
         * @brief   Opens the menu for the trigger that received a context-menu event.
         * @param   event                Context-menu event to handle.
         */
        /******************************************************************************/
        this.listen(trigger, "contextmenu", event => {
            event.preventDefault();
            this.context = trigger.dataset.context ?? null;
            this.show(event.clientX, event.clientY);
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   x                    Value supplied for x.
     * @param   y                    Value supplied for y.
     */
    /******************************************************************************/
    show(x, y) {
        if (this.props.disabled) return;

        this.menu.hidden = false;
        this.menu.style.left = "0px";
        this.menu.style.top = "0px";
        this.menu.classList.add("show");

        const rectangle = this.menu.getBoundingClientRect();
        const safeX = Math.max(8, Math.min(Number(x) || 0, window.innerWidth - rectangle.width - 8));
        const safeY = Math.max(8, Math.min(Number(y) || 0, window.innerHeight - rectangle.height - 8));

        this.menu.style.left = `${safeX}px`;
        this.menu.style.top = `${safeY}px`;
        this.menu.querySelector(".mouse-context-menu-item:not(:disabled)")?.focus({preventScroll: true});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the hide operation.
     */
    /******************************************************************************/
    hide() {
        if (!this.menu || this.menu.hidden) return;

        this.menu.classList.remove("show");

        /******************************************************************************/
        /*!
         * @brief   Hides the menu element after its transition completes.
         */
        /******************************************************************************/
        setTimeout(() => {
            if (this.menu && !this.menu.classList.contains("show")) this.menu.hidden = true;
        }, 160);
    }
}
