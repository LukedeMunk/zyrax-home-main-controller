/******************************************************************************/
/*
 * File:    ModeTile.js
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

//#region Example configuration /*X*/ = required
//const EXAMPLE_DEVICE_TILE_CONFIGURATION = {
//    /*X*/id: "tile0",
//    /*X*/size: TILE_SIZE_1X1,
//    /*X*/title: "title",
//    warningIcon: {icon: "fa-duotone fa-solid fa-circle-exclamation", title: TEXT_NO_RF_RECEIVER_PRESENT},
//
//    tileId: undefined,
//    previewTile: false,
//
//    className: undefined,
//    backgroundColor: "var(--background3)",
//    boxShadow: "var(--shadow-small)",
//    cursor: "pointer",
//
//    onclickFunction: () => loadAddTileModal(),
//
//    items: [
//        {
//            /* X */ type: TILE_ITEM_CONTAINER,
//
//            id: undefined,
//            className: undefined,
//
//            style: {
//                display: "flex",
//                gap: "10px",
//                alignItems: "baseline",
//                gridColumn: "span 2"
//            },
//
//            items: [
//                {
//                    /* X */ type: TILE_ITEM_TEXT,
//
//                    id: undefined,
//                    className: undefined,
//                    text: "Tile title",
//                    title: undefined,
//                    style: undefined
//                },
//                {
//                    /* Alleen tonen indien nodig, zoals een RF-waarschuwing */
//                    type: TILE_ITEM_ICON,
//
//                    id: undefined,
//                    className:
//                        "fa-duotone fa-solid fa-circle-exclamation",
//                    title: TEXT_NO_RF_RECEIVER_PRESENT,
//                    visible: false,
//                    style: undefined
//                }
//            ]
//        },
//        {
//            /* X */ type: TILE_ITEM_CONTAINER,
//
//            id: undefined,
//            className: undefined,
//            style: undefined,
//
//            items: [
//                {
//                    /* X */ type: TILE_ITEM_ICON,
//
//                    id: "deviceIcon0",
//                    className: "fa-duotone fa-solid fa-lightbulb",
//                    title: undefined,
//                    style: undefined
//                }
//            ]
//        }
//    ]
//};

//#endregion
class ModeTile {
    /**************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Device tile configuration
    */
    /**************************************************************************/
    constructor(configuration) {
        this.modeId = configuration.modeId;
        this.id = "modeTile" + (configuration.id ?? this.modeId);
        this.title = configuration.title;

        this.onclickFunction = configuration.onclickFunction ?? null;
        this.configurationFunction = configuration.configurationFunction ?? null;

        this.tileElem = null;
    }

    /**************************************************************************/
    /*!
        @brief  Generates the device tile.
    */
    /**************************************************************************/
    render() {
        const tileElem = document.createElement("div");
        tileElem.className = getClassFromSize(TILE_SIZE_1X1) + " dark-shadow";
        tileElem.id = this.id;
        tileElem.onclick = this.onclickFunction;
        if (tileElem.onclick != null) {
            tileElem.style.cursor = "pointer";
        }

        tileElem.style.paddingRight = "5px";
        tileElem.style.backgroundColor = "var(--background3)";

        tileElem.replaceChildren();

        this.tileElem = tileElem;

        this.tileElem.appendChild(this._renderTitleElement());
        if (this.configurationFunction != null) {
            this.tileElem.appendChild(this._renderIconElement());
        }

        return this.tileElem;
    }


    /**************************************************************************/
    /*!
        @brief  Creates the title element.
        @return                     DOM element
    */
    /**************************************************************************/
    _renderTitleElement() {
        const titleContainer = document.createElement("div");

        const titleElem = document.createElement("p");
        titleElem.textContent = this.title;
        titleContainer.appendChild(titleElem);

        return titleContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the device icon and optional group sync icon.
        @return                     DOM element
    */
    /**************************************************************************/
    _renderIconElement() {
        const iconElem = document.createElement("i");
        iconElem.onclick = this.configurationFunction;
        iconElem.className = "fa-duotone fa-solid fa-sliders";
        iconElem.title = TEXT_CONFIGURE_MODE;

        iconElem.style.padding = "10px";
        iconElem.style.borderRadius = "50px";
        iconElem.style.backgroundColor = "var(--background5)";

        return iconElem;
    }

    /**************************************************************************/
    /*!
        @brief  Sets the selected class.
        @param  selected            If true, the tile is selected
    */
    /**************************************************************************/
    setSelected(selected) {
        if (selected) {
            this.tileElem.classList.add("tile-selected");
        } else {
            this.tileElem.classList.remove("tile-selected");
        }
    }
}