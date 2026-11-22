/******************************************************************************
 *
 * File:    Toolbar.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders grouped toolbar actions with access control.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {button, element} from "../core/dom.js";

export class Toolbar extends Component {
    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();

        const toolbar = element("div", {
            className: this.props.className ?? "toolbar",
            attributes: {role: "toolbar", "aria-label": this.props.label ?? "Actions"}
        });

        for (const group of this.props.groups ?? []) {
            const groupElement = element("div", {className: "toolbar-sub", attributes: {role: "group"}});

            for (const item of group.buttons ?? []) {
                if (!toolbarHasAccess(item, this.props.userRole) || item.visible === false) continue;

                const control = button({
                    text: item.title ?? "",
                    iconClass: item.iconClass,
                    title: item.title,
                    className: "toolbar-button",
                    disabled: item.disabled,
                    dataset: {action: item.action ?? item.id ?? ""}
                });

                /******************************************************************************/
                /*!
                 * @brief   Executes and reports the selected toolbar action.
                 */
                /******************************************************************************/
                this.listen(control, "click", () => {
                    item.onAction?.(item);
                    this.emit("action", {action: item.action ?? item.id, item});
                });
                groupElement.append(control);
            }

            toolbar.append(groupElement);
        }

        this.root.replaceChildren(toolbar);
        this.toolbar = toolbar;
    }

    /******************************************************************************/
    /*!
     * @brief   Updates the interactive and visual state of one toolbar button.
     * @param   action               Action that identifies the button.
     * @param   state                State values to apply.
     */
    /******************************************************************************/
    setButtonState(action, state) {
        const control = this.root.querySelector(`[data-action="${CSS.escape(action)}"]`);

        if (!control) return;

        control.disabled = Boolean(state.disabled ?? state.loading);
        control.hidden = state.visible === false;
        control.classList.toggle("is-loading", Boolean(state.loading));

        if (state.title !== undefined) control.querySelector("span").textContent = state.title;
    }
}

/******************************************************************************/
/*!
 * @brief   Determines whether a user role may access a toolbar item.
 * @param   item                 Toolbar item to inspect.
 * @param   userRole             Active user role.
 * @returns boolean             Whether the item is accessible.
 */
/******************************************************************************/
function toolbarHasAccess(item, userRole) {
    return item.minRole === undefined || userRole === undefined || userRole <= item.minRole;
}
