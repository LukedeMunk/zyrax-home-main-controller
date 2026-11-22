/****************************************************************************/
/*
 * File:    RfDeviceTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   RfDeviceTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { TILE_SIZE_1X1, TILE_SIZE_1X2 } from "../../domain/dashboard_tiles.js";
import { Tile } from "./Tile.js";

export class RfDeviceTile extends Tile {
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

        this.icon = configuration.icon;
        this.iconElementId = this.id + "RfDeviceIcon";

        if (this.icon != undefined) {
            this.icon.id = this.icon.id ?? this.iconElementId;
            this.iconElementId = this.icon.id;
        }

        this.subtitle1Id = this.id + "LedstripSubtitle1";
        this.subtitle2Id = this.id + "LedstripSubtitle2";
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
        }

        return this.tileElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the RF device tile title with the requested width.
     * @param   fullWidth               Whether the title spans the full tile width.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    #renderTitleElement(fullWidth = true) {
        const titleContainer = super._renderTitleElement();

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

        if (this.subtitle2) {
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

    /****************************************************************************/
    /*!
     * @brief   Renders a 1x1 tile.
     */
    /****************************************************************************/
    #render1x1() {
        const icons = [this.icon];

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 1x2 tile.
     */
    /****************************************************************************/
    #render1x2() {
        const icons = [this.icon];

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the icon.
     * @param   icon                    Icon to set
     */
    /****************************************************************************/
    setIcon(icon) {
        this.icon.icon = icon.icon ?? "";
        this.icon.title = icon.title ?? "";

        const iconElem = this.root.querySelector("#" + CSS.escape(this.iconElementId));
        iconElem.className = this.icon.icon;
        iconElem.title = this.icon.title;
    }
}
