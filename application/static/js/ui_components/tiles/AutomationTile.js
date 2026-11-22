/****************************************************************************/
/*
 * File:    AutomationTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   AutomationTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_AUTOMATION_COMPLETED, TEXT_AUTOMATION_RUNNING, TEXT_AUTOMATION_RUN_FAILED,
    TEXT_READY_TO_RUN
} from "../../domain/language_pack_english.js";
import {
    TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_2X4
} from "../../domain/dashboard_tiles.js";
import { Tile } from "./Tile.js";

export class AutomationTile extends Tile {
    /****************************************************************************/
    /*!
     * @brief   Constructor.
     * @param   configuration           Device tile configuration
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);

        this.subtitle1 = configuration.subtitle1;
        this.subtitle2 = configuration.subtitle2;
        this.subtitleColor = "var(--success-text)";

        this.icons = configuration.icons;

        this.checkboxValue = configuration.checkboxValue ?? false;

        this.enableFunction = configuration.enableFunction ?? null;
        this.tapToRun = configuration.tapToRun ?? false;
        this.isRunning = false;

        this.checkboxElementId = this.id + "AutomationEnabledCb";
        this.subtitle1Id = this.id + "AutomationSubtitle1";
        this.subtitle2Id = this.id + "AutomationSubtitle2";
    }

    /****************************************************************************/
    /*!
     * @brief   Generates the device tile.
     */
    /****************************************************************************/
    render() {
        this.tileElem = super._renderTileElement();

        if (this.size === TILE_SIZE_1X1) {
            this.#render1x1();
        } else if (this.size === TILE_SIZE_1X2) {
            this.#render1x2();
        } else if (this.size === TILE_SIZE_2X4) {
            this.#render2x4();
        } else if (this.size === TILE_SIZE_2X2) {
            this.#render4x2();
        }

        if (this.tapToRun) {
            this.setRunState("idle");
        }

        return this.tileElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Updates the visual state of a tap-to-run automation tile.
     * @param   state                   idle, running, success or error
     */
    /****************************************************************************/
    setRunState(state) {
        if (!this.tapToRun || !this.tileElem) {
            return;
        }

        const stateTexts = {
            idle: TEXT_READY_TO_RUN,
            running: TEXT_AUTOMATION_RUNNING,
            success: TEXT_AUTOMATION_COMPLETED,
            error: TEXT_AUTOMATION_RUN_FAILED
        };
        this.isRunning = state === "running";
        this.tileElem.setAttribute("aria-busy", this.isRunning);
        this.tileElem.setAttribute(
            "aria-label", this.title + " - " + (stateTexts[state] ?? stateTexts.idle)
        );
        this.tileElem.classList.toggle("automation-tile-running", this.isRunning);
        this.tileElem.classList.toggle("automation-tile-success", state === "success");
        this.tileElem.classList.toggle("automation-tile-error", state === "error");

        const subtitleElem = this.root.querySelector("#" + CSS.escape(this.subtitle1Id));
        if (subtitleElem) {
            subtitleElem.textContent = stateTexts[state] ?? stateTexts.idle;
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders an 1x1 tile.
     */
    /****************************************************************************/
    #render1x1() {
        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(this.icons));
    }

    /****************************************************************************/
    /*!
     * @brief   Renders an 1x2 tile.
     */
    /****************************************************************************/
    #render1x2() {
        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(this.icons, "after"));
        if (!this.tapToRun) {
            this.tileElem.appendChild(this._renderSwitch(
                this.checkboxElementId, this.enableFunction, this.checkboxValue
            ));
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 2x4 tile.
     */
    /****************************************************************************/
    #render2x4() {
        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(this.icons));
        if (!this.tapToRun) {
            this.tileElem.appendChild(this._renderSwitch(
                this.checkboxElementId, this.enableFunction, this.checkboxValue
            ));
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 4x2 tile.
     */
    /****************************************************************************/
    #render4x2() {
        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(this.icons));
        if (!this.tapToRun) {
            this.tileElem.appendChild(this._renderSwitch(
                this.checkboxElementId, this.enableFunction, this.checkboxValue
            ));
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders the title and subtitle elements
     * @param   fullWidth               If true, the titles are over the whole
     *                                  width of the tile
     * @returns element                 DOM element
     */
    /****************************************************************************/
    #renderTitleElement(fullWidth = true) {
        const titleContainer = super._renderTitleElement(fullWidth);

        if (this.subtitle1) {
            const subTitle1Elem = document.createElement("p");
            subTitle1Elem.id = this.subtitle1Id;
            subTitle1Elem.textContent = this.subtitle1;
            if (this.subtitleColor) {
                subTitle1Elem.style.color = this.subtitleColor;
            }
            subTitle1Elem.style.fontSize = "var(--font-size-extra-small)";
            subTitle1Elem.style.opacity = "0.6";
            titleContainer.appendChild(subTitle1Elem);
        }

        if (this.subtitle2 && this.size > TILE_SIZE_1X1) {
            const subTitle2Elem = document.createElement("p");
            subTitle2Elem.id = this.subtitle2Id;
            subTitle2Elem.textContent = this.subtitle2;
            if (this.subtitleColor) {
                subTitle2Elem.style.color = this.subtitleColor;
            }
            subTitle2Elem.style.fontSize = "var(--font-size-extra-small)";
            subTitle2Elem.style.opacity = "0.6";
            titleContainer.appendChild(subTitle2Elem);
        }

        return titleContainer;
    }
}
