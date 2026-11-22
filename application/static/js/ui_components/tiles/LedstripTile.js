/****************************************************************************/
/*
 * File:    LedstripTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   LedstripTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TILE_SIZE_1X1, TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_TYPE_GROUP
} from "../../domain/dashboard_tiles.js";
import { Tile } from "./Tile.js";

const MAX_LEDSTRIP_BRIGHTNESS = 250;

export class LedstripTile extends Tile {
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
        this.iconElementId = this.id + "LedstripIcon";

        if (this.icon != undefined) {
            this.icon.id = this.icon.id ?? this.iconElementId;
            this.iconElementId = this.icon.id;
        }

        this.checkboxValue = configuration.checkboxValue ?? false;
        this.rangeValue = configuration.rangeValue ?? 0;

        this.powerFunction = configuration.powerFunction ?? null;
        this.rangeOnchangeFunction = configuration.rangeOnchangeFunction ?? null;
        this.rangeOninputFunction = configuration.rangeOninputFunction ?? null;
        this.hasRangeInput = false;

        this.checkboxElementId = this.id + "LedstripPowerCb";
        this.rangeElementId = this.id + "LedstripRange";
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
        } else if (this.size === TILE_SIZE_2X2) {
            this.#render4x2();
        }

        return this.tileElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 1x1 tile.
     */
    /****************************************************************************/
    #render1x1() {
        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({ id: "groupSynchronizedIcon" + this.tile.group_id, icon: "", title: "" });
        }

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons, "after"));
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 1x2 tile.
     */
    /****************************************************************************/
    #render1x2() {
        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({ id: "groupSynchronizedIcon" + this.tile.group_id, icon: "", title: "" });
        }

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons, "after"));
        this.tileElem.appendChild(this._renderSwitch(
            this.checkboxElementId, this.powerFunction, this.checkboxValue
        ));
    }

    /****************************************************************************/
    /*!
     * @brief   Renders a 4x2 tile with brightness slider.
     */
    /****************************************************************************/
    #render4x2() {
        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({ id: "groupSynchronizedIcon" + this.tile.group_id, icon: "", title: "" });
        }

        this.tileElem.appendChild(this.#renderTitleElement(false));
        this.tileElem.appendChild(this._renderSwitch(
            this.checkboxElementId, this.powerFunction, this.checkboxValue
        ));
        this.tileElem.appendChild(this._renderIconsElement(icons));

        if (this.previewTile || this.rangeOnchangeFunction !== undefined) {
            this.hasRangeInput = true;

            const rangeElem = this._renderRangeElement(
                this.rangeElementId, this.rangeOnchangeFunction, this.rangeOninputFunction,
                undefined, MAX_LEDSTRIP_BRIGHTNESS, this.rangeValue
            );

            this.tileElem.appendChild(rangeElem);
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the title element.
     * @param   fullWidth               True when element spans both columns
     * @returns DOM element
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
     * @brief   Sets the specified checkbox value.
     * @param   value                   Value to set
     */
    /****************************************************************************/
    setCheckboxValue(value) {
        this.checkboxValue = value;

        const checkboxElem = this.root.querySelector("#" + CSS.escape(this.checkboxElementId));
        if (checkboxElem) checkboxElem.checked = this.checkboxValue;
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the checkbox value.
     * @returns Checkbox value
     */
    /****************************************************************************/
    getCheckboxValue() {
        const checkboxElem = this.root.querySelector("#" + CSS.escape(this.checkboxElementId));
        if (checkboxElem) this.checkboxValue = checkboxElem.checked;

        return this.checkboxValue;
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the specified range value.
     * @param   value                   Value to set
     */
    /****************************************************************************/
    setRangeValue(value) {
        this.rangeValue = value;

        this.brightness?.setValue(value);
    }

    /****************************************************************************/
    /*!
     * @brief   Returns the range value.
     * @returns Range value
     */
    /****************************************************************************/
    getRangeValue() {
        const rangeElem = this.root.querySelector("#" + CSS.escape(this.rangeElementId));
        this.rangeValue = parseInt(rangeElem.value);

        return this.rangeValue;
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the first subtitle.
     * @param   subtitle                Title to set
     */
    /****************************************************************************/
    setSubtitle1(subtitle) {
        const titleElem = this.root.querySelector("#" + CSS.escape(this.subtitle1Id));
        this.subtitle1 = subtitle;

        titleElem.textContent = this.subtitle1;
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the second subtitle.
     * @param   subtitle                Title to set
     */
    /****************************************************************************/
    setSubtitle2(subtitle) {
        const titleElem = this.root.querySelector("#" + CSS.escape(this.subtitle2Id));
        this.subtitle2 = subtitle;

        titleElem.textContent = this.subtitle2;
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
