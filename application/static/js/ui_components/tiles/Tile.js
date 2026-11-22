/****************************************************************************/
/*
 * File:    Tile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Tile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { formatBrightness, renderRangeField } from "../range_field.js";
import { TEXT_BRIGHTNESS, TEXT_TILE_OPTIONS } from "../../domain/language_pack_english.js";
import { TILE_SIZE_1X2, getClassFromSize } from "../../domain/dashboard_tiles.js";
import { Component } from "../../../vendor/templates/js/core/component.js";

/****************************************************************************/
/*!
 * @brief   Creates the accessible action button for a dashboard tile menu.
 * @param   tileId                  Dashboard tile identifier.
 * @returns Tile menu button element.
 */
/****************************************************************************/
export function createDashboardTileOptionsButton(tileId) {
    const optionsButtonElem = document.createElement("button");
    optionsButtonElem.type = "button";
    optionsButtonElem.className = "dashboard-tile-options-button";
    optionsButtonElem.setAttribute("aria-label", TEXT_TILE_OPTIONS);
    optionsButtonElem.title = TEXT_TILE_OPTIONS;

    const iconElem = document.createElement("i");
    iconElem.className = "fa-solid fa-ellipsis-vertical";
    optionsButtonElem.appendChild(iconElem);

    /****************************************************************************/
    /*!
     * @brief   Reports the tile menu request without activating the surrounding tile.
     * @param   event                   Event reported by the bound control.
     */
    /****************************************************************************/
    optionsButtonElem.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        optionsButtonElem.dispatchEvent(new CustomEvent("ui:tile-menu", {
            bubbles: true,
            detail: { tileId }
        }));
    });

    return optionsButtonElem;
}

let nextTileId = 0;

export class Tile extends Component {
    /****************************************************************************/
    /*!
     * @brief   Constructor.
     * @param   configuration           Device tile configuration
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);
        this.tileId = configuration.tile?.id ?? "preview" + ++nextTileId;
        this.id = "tile" + (configuration.id ?? this.tileId);
        this.title = configuration.title;
        this.size = configuration.size ?? configuration.tile?.size ?? TILE_SIZE_1X2;
        this.tile = configuration.tile;

        this.onclickFunction = configuration.onclickFunction ?? null;

        this.previewTile = configuration.previewTile ?? false;

        this.titleElementId = this.id + "Title";

        this.tileElem = null;
    }

    /****************************************************************************/
    /*!
     * @brief   Sets the title.
     * @param   title                   Title to set
     */
    /****************************************************************************/
    setTitle(title) {
        this.title = title;

        const titleElem = this.root.querySelector("#" + CSS.escape(this.titleElementId));
        titleElem.textContent = this.title;
    }

    /****************************************************************************/
    /*!
     * @brief   Gets or creates the tile container and applies shared styling.
     * @returns Tile DOM element
     */
    /****************************************************************************/
    _renderTileElement() {
        const tileElem = this.root;
        tileElem.className = getClassFromSize(this.size);
        tileElem.id = this.id;

        tileElem.onclick = this.onclickFunction;
        if (tileElem.onclick != null) {
            tileElem.style.cursor = "pointer";
            tileElem.setAttribute("role", "button");
            tileElem.tabIndex = 0;

            /****************************************************************************/
            /*!
             * @brief   Activates the tile from its own Enter or Space key press.
             * @param   event                   Event reported by the bound control.
             */
            /****************************************************************************/
            this.listen(tileElem, "keydown", event => {
                if (event.target !== tileElem || event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                this.onclickFunction(event);
            });
        }

        if (this.previewTile) {
            tileElem.style.backgroundColor = "var(--background4)";
        } else {
            tileElem.setAttribute("tile-id", this.tileId);
            tileElem.style.backgroundColor = "var(--background3)";
        }

        tileElem.replaceChildren();

        if (!this.previewTile && this.props.editable) {
            tileElem.removeAttribute("role");
            tileElem.removeAttribute("tabindex");
            tileElem.style.backgroundColor = "var(--background5)";
            tileElem.style.border = "1px dashed var(--icon-green)";
            if (matchMedia("(max-width: 699px)").matches) {
                tileElem.appendChild(this._renderOptionsButton());
            }
        } else {
            tileElem.style.border = "1px solid transparent";
        }

        return tileElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the accessible tile options button.
     * @returns Options button
     */
    /****************************************************************************/
    _renderOptionsButton() {
        return createDashboardTileOptionsButton(this.tileId);
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the title element.
     * @param   fullWidth               True when element spans both columns
     * @returns DOM element
     */
    /****************************************************************************/
    _renderTitleElement(fullWidth) {
        const titleContainer = document.createElement("div");

        if (fullWidth) {
            titleContainer.style.gridColumn = "span 2";
        }

        const titleElem = document.createElement("p");
        titleElem.id = this.titleElementId;
        titleElem.textContent = this.title;
        titleContainer.appendChild(titleElem);

        return titleContainer;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the device icon and optional group sync icon.
     * @param   icons                   Array with icons to render
     * @param   iconLocation            "before" or "after" the text
     * @returns DOM element
     */
    /****************************************************************************/
    _renderIconsElement(icons, iconLocation = "before") {
        const iconContainerElem = document.createElement("div");
        iconContainerElem.className = "tile-icons";
        iconContainerElem.classList.toggle("tile-icons-start", iconLocation === "after");

        for (let icon of icons) {
            const iconElem = document.createElement("i");
            if (icon.id) iconElem.id = icon.id;
            iconElem.className = icon.icon ?? "";
            iconElem.title = icon.title ?? "";

            iconContainerElem.appendChild(iconElem);
        }

        return iconContainerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a switch.
     * @param   elementId               ID of the DOM element
     * @param   onclickFunction         Onclick function
     * @param   value                   Value to set
     * @returns DOM element
     */
    /****************************************************************************/
    _renderSwitch(elementId, onclickFunction, value = false) {
        const switchElem = document.createElement("label");
        switchElem.className = "switch";

        this.listen(switchElem, "click", event => event.stopPropagation());

        const inputElem = document.createElement("input");
        inputElem.type = "checkbox";
        inputElem.name = elementId;
        inputElem.id = elementId;

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @param   event                   Event reported by the bound control.
         */
        /****************************************************************************/
        inputElem.onclick = event => {
            event.stopPropagation();
            onclickFunction?.(event);
        };

        if (onclickFunction == null) {
            switchElem.style.pointerEvents = "none";
        }

        inputElem.checked = value;

        const sliderElem = document.createElement("span");
        sliderElem.className = "slider round";
        sliderElem.style.transform = "scale(0.8)";

        switchElem.appendChild(inputElem);
        switchElem.appendChild(sliderElem);

        return switchElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a ledstrip brightness slider.
     * @param   elementId               ID of the DOM element
     * @param   onchangeFunction        Onchange function
     * @param   oninputFunction         Oninput function
     * @param   min                     Minimum value
     * @param   max                     Maximum value
     * @param   value                   Value to set
     * @returns DOM element
     */
    /****************************************************************************/
    _renderRangeElement(
        elementId, onchangeFunction, oninputFunction, min = undefined, max = undefined, value = 0
    ) {
        this.brightness = renderRangeField({
            name: elementId,
            label: TEXT_BRIGHTNESS,
            min: min ?? 0,
            max,
            formatValue: formatBrightness(max)
        }, value, this.listen.bind(this));

        const { element, control } = this.brightness;

        this.listen(element, "click", event => event.stopPropagation());
        if (onchangeFunction) this.listen(control, "change", onchangeFunction);
        if (oninputFunction && !this.previewTile) this.listen(control, "input", oninputFunction);

        return element;
    }
}
