/****************************************************************************/
/*
 * File:    DateTimeTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   DateTimeTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { VAR_TEXT_DATE } from "../../domain/language_pack_english.js";
import { Tile } from "./Tile.js";

export class DateTimeTile extends Tile {
    /****************************************************************************/
    /*!
     * @brief   Initializes the component with its root and configuration.
     * @param   root                    Root element owned by the component.
     * @param   configuration           Initial component configuration.
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);

        this.tileElem = null;
        this.timeElem = null;
        this.dateElem = null;
    }

    /****************************************************************************/
    /*!
     * @brief   Generates the device tile.
     */
    /****************************************************************************/
    render() {
        this.tileElem = super._renderTileElement();

        this.timeElem = document.createElement("p");
        this.timeElem.style.fontSize = "20pt";
        this.timeElem.style.fontWeight = "bold";

        const timeContainer = document.createElement("div");
        timeContainer.style.gridColumn = "span 2";
        timeContainer.appendChild(this.timeElem);

        this.dateElem = document.createElement("p");
        this.dateElem.style.fontSize = "10pt";

        const dateContainer = document.createElement("div");
        dateContainer.style.gridColumn = "span 2";
        dateContainer.appendChild(this.dateElem);

        this.tileElem.appendChild(timeContainer);
        this.tileElem.appendChild(dateContainer);

        this.refreshClock();
        clearInterval(this.clock);
        this.clock = setInterval(() => this.refreshClock(), 1000);

        return this.root;
    }

    /****************************************************************************/
    /*!
     * @brief   Refreshes the date and time displayed by the tile.
     */
    /****************************************************************************/
    refreshClock() {
        const date = new Date();

        this.timeElem.textContent =
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        this.dateElem.textContent = VAR_TEXT_DATE(date);
    }

    /****************************************************************************/
    /*!
     * @brief   Releases the component resources and mounted child components.
     */
    /****************************************************************************/
    destroy() {
        clearInterval(this.clock);
        super.destroy();
    }
}
