/****************************************************************************/
/*
 * File:    DashboardDialogs.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Manages dashboard names, icons, target selection and live tile
 *          previews.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { button } from "../../vendor/templates/js/core/dom.js";
import {
    TEXT_EDIT_DASHBOARD_ICON, TEXT_MANAGE_DASHBOARD, TEXT_NAME, TEXT_SUBMIT, TEXT_DELETE, TEXT_TYPE,
    TEXT_TARGET, TEXT_CHOOSE_TILE_TYPE, TEXT_ADD_TILE
} from "../domain/language_pack_english.js";
import {
    TEXT_ADD_DASHBOARD, TEXT_EDIT_DASHBOARD, TEXT_FIELD_REQUIRED, TEXT_NO_CRITICAL_SYMBOLS
} from "../domain/language_pack_english.js";
import { Component } from "../../vendor/templates/js/core/component.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import { ICONS_L } from "../domain/icons.js";
import { SYMBOL_CRITICAL_RE } from "../domain/validation.js";
import { TILE_TYPE_SELECT_OPTIONS } from "../domain/dashboard_tiles.js";

export class DashboardDialogs extends Component {
    /****************************************************************************/
    /*!
     * @brief   Binds dashboard editing, icon selection and tile preview controls.
     */
    /****************************************************************************/
    render() {
        const labels = {
            manage: TEXT_MANAGE_DASHBOARD,
            name: TEXT_NAME,
            submit: TEXT_SUBMIT,
            remove: TEXT_DELETE,
            icon: TEXT_EDIT_DASHBOARD_ICON,
            tile: TEXT_ADD_TILE,
            choose: TEXT_CHOOSE_TILE_TYPE,
            type: TEXT_TYPE,
            target: TEXT_TARGET
        };
        for (const label of this.root.querySelectorAll("[data-label]")) {
            label.textContent = labels[label.dataset.label];
        }

        this.stack = new ModalStack();
        this.dialog = this.root.querySelector("#dashboardEditor");
        this.picker = this.root.querySelector("#dashboardIcons");
        this.tiles = this.root.querySelector("#dashboardTiles");
        this.name = this.dialog.querySelector("input");
        this.iconButton = this.dialog.querySelector("[data-icon]");
        this.error = this.dialog.querySelector(".error");
        this.type = this.tiles.querySelector("[data-type]");
        this.target = this.tiles.querySelector("[data-target]");
        this.preview = this.tiles.querySelector("[data-previews]");
        this.previews = [];

        for (const option of TILE_TYPE_SELECT_OPTIONS)
            this.type.add(new Option(option.text, option.value));

        for (const icon of ICONS_L) {
            const choice = button({ iconClass: icon, title: icon });
            choice.setAttribute("aria-label", icon);

            /****************************************************************************/
            /*!
             * @brief   Applies the chosen dashboard icon and closes the picker.
             */
            /****************************************************************************/
            this.listen(choice, "click", () => {
                this.setIcon(icon);
                this.stack.close(this.picker);
            });
            this.picker.querySelector("[data-icons]").append(choice);
        }

        this.listen(this.iconButton, "click", () => this.open(this.picker));
        this.listen(this.type, "change", () => this.selectType());
        this.listen(this.target, "change", () => this.showPreviews());

        /****************************************************************************/
        /*!
         * @brief   Releases tile previews after their dialog closes.
         */
        /****************************************************************************/
        this.listen(this.tiles, "close", () => {
            if (!this.tiles.open) this.clearPreviews();
        });

        /****************************************************************************/
        /*!
         * @brief   Validates and saves the dashboard name and icon.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        this.listen(this.dialog.querySelector("form"), "submit", async event => {
            event.preventDefault();

            const name = this.name.value;
            this.error.textContent = !name
                || !this.icon
                ? TEXT_FIELD_REQUIRED
                : SYMBOL_CRITICAL_RE.test(name)
                ? TEXT_NO_CRITICAL_SYMBOLS
                : "";
            if (this.error.textContent) return;

            try {
                await this.props.onSave(this.id, name, this.icon);
                this.stack.close(this.dialog);
            } catch (error) {
                this.error.textContent = error.message;
            }
        });
        this.remove = this.dialog.querySelector("[data-delete]");

        /****************************************************************************/
        /*!
         * @brief   Closes the dashboard editor after successful deletion.
         */
        /****************************************************************************/
        this.listen(this.remove, "click", async () => {
            if (await this.props.onDelete(this.id)) this.stack.close(this.dialog);
        });

        for (const control of this.root.querySelectorAll("[data-close]")) {
            this.listen(control, "click", () => this.close(control.closest("dialog")));
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Updates the dashboard icon and its editor preview.
     * @param   icon                    Icon class or icon name.
     */
    /****************************************************************************/
    setIcon(icon) {
        this.icon = icon;
        this.iconButton.firstElementChild.className = icon || "fa-duotone fa-solid fa-calendar-users";
    }

    /****************************************************************************/
    /*!
     * @brief   Opens the requested dialog through its modal stack.
     * @param   dialog                  Dialog element to open or close.
     */
    /****************************************************************************/
    open(dialog) {
        this.stack.open(dialog, {
            /****************************************************************************/
            /*!
             * @brief   Closes the dialog when its modal stack requests dismissal.
             * @returns Calculated value or configured element.
             */
            /****************************************************************************/
            onRequestClose: () => this.close(dialog)
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Closes the active dialog through its modal stack.
     * @param   dialog                  Dialog element to open or close.
     */
    /****************************************************************************/
    close(dialog) {
        this.stack.close(dialog);
    }

    /****************************************************************************/
    /*!
     * @brief   Loads an existing dashboard or prepares the editor for a new one.
     * @param   dashboard               Existing dashboard or an empty new-dashboard value.
     */
    /****************************************************************************/
    edit(dashboard) {
        this.id = dashboard?.id ?? -1;
        this.dialog.querySelector("#dashboardEditorTitle").textContent = dashboard
            ? TEXT_EDIT_DASHBOARD
            : TEXT_ADD_DASHBOARD;
        this.name.value = dashboard?.name ?? "";
        this.setIcon(dashboard?.icon ?? "");
        this.error.textContent = "";
        this.remove.hidden = !dashboard;
        this.open(this.dialog);
    }

    /****************************************************************************/
    /*!
     * @brief   Opens tile selection with no target selected.
     */
    /****************************************************************************/
    add() {
        this.type.value = "-1";
        this.selectType();
        this.open(this.tiles);
    }

    /****************************************************************************/
    /*!
     * @brief   Refreshes available tile targets and their size previews.
     */
    /****************************************************************************/
    selectType() {
        const targets = this.props.getTargets(Number(this.type.value));
        this.target.replaceChildren(new Option("", "-1"));
        this.target.parentElement.hidden = !targets;

        for (const item of targets ?? []) this.target.add(new Option(item.name, item.id));

        this.showPreviews();
    }

    /****************************************************************************/
    /*!
     * @brief   Destroys the mounted tile previews and clears their container.
     */
    /****************************************************************************/
    clearPreviews() {
        for (const tile of this.previews) tile.destroy();

        this.previews = [];
        this.preview.replaceChildren();
    }

    /****************************************************************************/
    /*!
     * @brief   Renders selectable size previews for the current tile target.
     */
    /****************************************************************************/
    showPreviews() {
        this.clearPreviews();
        this.previews = this.props.createPreviews(
            Number(this.type.value), Number(this.target.value)
        );

        for (const tile of this.previews) this.preview.append(tile.mount().root);
    }

    /****************************************************************************/
    /*!
     * @brief   Releases the component resources and mounted child components.
     */
    /****************************************************************************/
    destroy() {
        this.clearPreviews();
        this.stack.destroy();
        super.destroy();
    }
}
