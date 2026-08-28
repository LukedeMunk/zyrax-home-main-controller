/******************************************************************************/
/*
 * File:    DeviceTile.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Toolbar class to manage toolbars. Used to show toolbars with various
 *          buttons, including a timed progress button.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
const TILE_TYPE_DEVICE = 0;
const TILE_TYPE_GROUP = 1;
const TILE_TYPE_DATETIME = 2;
const TILE_TYPE_WEATHER = 3;
const TILE_TYPE_ALARM = 4;
const TILE_TYPE_AUTOMATION = 5;
const TILE_TYPE_ADD = 6;
const TILE_TYPE_SPACER = 100;

const TILE_SIZE_1X1 = 0;
const TILE_SIZE_1X2 = 1;
const TILE_SIZE_2X2 = 2;
const TILE_SIZE_2X4 = 3;
const TILE_SIZE_4X4 = 4;

const TILE_DIMENSIONS = {
    [TILE_SIZE_1X1]: { columns: 1, rows: 1 },
    [TILE_SIZE_1X2]: { columns: 1, rows: 2 },
    [TILE_SIZE_2X2]: { columns: 2, rows: 2 },
    [TILE_SIZE_2X4]: { columns: 1, rows: 4 },
    [TILE_SIZE_4X4]: { columns: 2, rows: 4 }
};

/******************************************************************************/
/*!
    @brief  Creates an accessible dashboard tile options button.
    @param  tileId              Dashboard tile ID
    @return                     Options button
*/
/******************************************************************************/
function createDashboardTileOptionsButton(tileId) {
    const optionsButtonElem = document.createElement("button");
    optionsButtonElem.type = "button";
    optionsButtonElem.className = "dashboard-tile-options-button";
    optionsButtonElem.setAttribute("aria-label", TEXT_TILE_OPTIONS);
    optionsButtonElem.title = TEXT_TILE_OPTIONS;

    const iconElem = document.createElement("i");
    iconElem.className = "fa-solid fa-ellipsis-vertical";
    optionsButtonElem.appendChild(iconElem);

    optionsButtonElem.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rectangle = optionsButtonElem.getBoundingClientRect();
        document.dispatchEvent(new CustomEvent(
            "dashboardTileMenuRequested",
            {
                detail: {
                    tileId: tileId,
                    x: rectangle.right,
                    y: rectangle.bottom
                }
            }
        ));
    });

    return optionsButtonElem;
}

//_region Example configuration /*X*/ = required
//_endregion

class Tile {
    /**************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Device tile configuration
    */
    /**************************************************************************/
    constructor(configuration) {
        this.tileId = configuration.tile?.id ?? Math.floor(Math.random() * 100);
        this.id = "tile" + (configuration.id ?? this.tileId);
        this.title = configuration.title;
        this.size = configuration.size ?? configuration.tile?.size ?? TILE_SIZE_1X2;
        this.tile = configuration.tile;

        this.onclickFunction = configuration.onclickFunction ?? null;

        this.previewTile = configuration.previewTile ?? false;
        
        this.titleElementId = this.id + "Title";

        this.tileElem = null;
    }

    /**************************************************************************/
    /*!
        @brief  Sets the title.
        @param  title               Title to set
    */
    /**************************************************************************/
    setTitle(title) {
        this.title = title;

        const titleElem = document.getElementById(this.titleElementId);
        titleElem.textContent = this.title;
    }

    /**************************************************************************/
    /*!
        @brief  Gets or creates the tile container and applies shared styling.
        @return                     Tile DOM element
    */
    /**************************************************************************/
    _renderTileElement() {
        const tileElem = document.createElement("div");
        tileElem.className = getClassFromSize(this.size);
        tileElem.id = this.id;
        tileElem.onclick = this.onclickFunction;
        if (tileElem.onclick != null) {
            tileElem.style.cursor = "pointer";
            tileElem.setAttribute("role", "button");
            tileElem.tabIndex = 0;
            tileElem.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
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

        if (!this.previewTile && (typeof configureDashboardMode !== "undefined" && configureDashboardMode)) {
            tileElem.removeAttribute("role");
            tileElem.removeAttribute("tabindex");
            tileElem.style.backgroundColor = "var(--background5)";
            tileElem.style.border = "1px dashed var(--icon-green)";
            if (MOBILE_VERSION) {
                tileElem.appendChild(this._renderOptionsButton());
            }
        } else {
            tileElem.style.border = "1px solid transparent";
        }

        return tileElem;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the accessible tile options button.
        @return                     Options button
    */
    /**************************************************************************/
    _renderOptionsButton() {
        return createDashboardTileOptionsButton(this.tileId);
    }

    /**************************************************************************/
    /*!
        @brief  Creates the title element.
        @param  fullWidth           True when element spans both columns
        @return                     DOM element
    */
    /**************************************************************************/
    _renderTitleElement(fullWidth) {
        const titleContainer = document.createElement("div");

        if (fullWidth) {
            titleContainer.style.gridColumn = "span 2";
        }

        const titleElem = document.createElement("p");
        titleElem.textContent = this.title;
        titleContainer.appendChild(titleElem);


        return titleContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the device icon and optional group sync icon.
        @param  icons               Array with icons to render
        @param  iconLocation        "before" or "after" the text
        @return                     DOM element
    */
    /**************************************************************************/
    _renderIconsElement(icons, iconLocation="before") {
        const iconContainerElem = document.createElement("div");
        iconContainerElem.style.display = "flex";
        iconContainerElem.style.gap = "10px";
        iconContainerElem.style.alignItems = "center";
        iconContainerElem.style.justifyContent = "flex-end";

        if (iconLocation == "after") {
            iconContainerElem.style.justifyContent = "flex-start";
        }

        for (let icon of icons) {
            const iconElem = document.createElement("i");
            iconElem.id = icon.id;
            iconElem.className = icon.icon ?? "";
            iconElem.title = icon.title ?? "";

            iconContainerElem.appendChild(iconElem);
        }

        return iconContainerElem;
    }

    /**************************************************************************/
    /*!
        @brief  Creates a switch.
        @param  elementId           ID of the DOM element
        @param  onclickFunction     Onclick function
        @param  value               Value to set
        @return                     DOM element
    */
    /**************************************************************************/
    _renderSwitch(elementId, onclickFunction, value=false) {
        const switchElem = document.createElement("label");
        switchElem.className = "switch";

        const inputElem = document.createElement("input");
        inputElem.type = "checkbox";
        inputElem.name = elementId;
        inputElem.id = elementId;

        inputElem.onclick = (event) => {
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

    /**************************************************************************/
    /*!
        @brief  Creates a ledstrip brightness slider.
        @param  elementId           ID of the DOM element
        @param  onchangeFunction    Onchange function
        @param  oninputFunction     Oninput function
        @param  min                 Minimum value
        @param  max                 Maximum value
        @param  value               Value to set
        @return                     DOM element
    */
    /**************************************************************************/
    _renderRangeElement(elementId, onchangeFunction, oninputFunction, min=undefined, max=undefined, value=0) {
        const rangeContainerElem = document.createElement("div");
        rangeContainerElem.style.gridColumn = "span 3";

        const rangeElem = document.createElement("input");
        rangeElem.type = "range";
        rangeElem.name = elementId;
        rangeElem.id = elementId;
        rangeElem.style.width = "100%";
        rangeElem.style.maxWidth = "none";

        if (max != undefined) {
            rangeElem.max = max;
        }
        if (min != undefined) {
            rangeElem.min = min;
        }
        rangeElem.value = value;

        rangeElem.onchange = onchangeFunction;

        if (!this.previewTile) {
            rangeElem.oninput = oninputFunction;
        }

        rangeContainerElem.appendChild(rangeElem);

        return rangeContainerElem;
    }
}
