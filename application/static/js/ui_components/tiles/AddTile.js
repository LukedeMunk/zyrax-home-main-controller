/****************************************************************************/
/*
 * File:    AddTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   AddTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { TILE_SIZE_1X1, getClassFromSize } from "../../domain/dashboard_tiles.js";
import { Component } from "../../../vendor/templates/js/core/component.js";

export class AddTile extends Component {
    /****************************************************************************/
    /*!
     * @brief   Initializes the component with its root and configuration.
     * @param   root                    Root element owned by the component.
     * @param   configuration           Initial component configuration.
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);
        this.containerElement = configuration.containerElement;
        this.title = configuration.title;
        this.size = configuration.size ?? TILE_SIZE_1X1;

        this.onclickFunction = configuration.onclickFunction;

        this.tileElem = null;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the add tile control and its keyboard selection behavior.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    render() {
        this.tileElem = this.root;
        this.tileElem.id = "tile-add";
        this.tileElem.className = getClassFromSize(this.size) + " add-tile";
        this.tileElem.title = this.title;
        this.tileElem.style.cursor = "pointer";

        this.tileElem.onclick = this.onclickFunction;
        this.tileElem.setAttribute("role", "button");
        this.tileElem.setAttribute("aria-label", this.title);
        this.tileElem.tabIndex = 0;

        /****************************************************************************/
        /*!
         * @brief   Activates the add tile control with Enter or Space.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        this.listen(this.tileElem, "keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            this.onclickFunction(event);
        });

        const plus = document.createElement("i");
        plus.className = "fa-duotone fa-solid fa-plus fa-xl";
        plus.setAttribute("aria-hidden", "true");
        this.tileElem.replaceChildren(plus);

        if (this.containerElement) {
            this.containerElement.appendChild(this.tileElem);
        }

        return this.tileElem;
    }
}
