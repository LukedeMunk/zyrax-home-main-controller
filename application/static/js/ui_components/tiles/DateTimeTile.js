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
class DateTimeTile extends Tile {
    static tiles = new Set();
    static interval = null;

    constructor(configuration) {
        super(configuration);

        this.tileElem = null;
        this.timeElem = null;
        this.dateElem = null;
    }

    /**************************************************************************/
    /*!
        @brief  Generates the device tile.
    */
    /**************************************************************************/
    render() {
        this.tileElem = super._renderTileElement();

        if (this.size === TILE_SIZE_1X2) {
            this.#render1x2();
        } else if (this.size === TILE_SIZE_2X4) {
            this.#render2x4();
        } else if (this.size === TILE_SIZE_2X2) {
            this.#render4x2();
        }

        return this.tileElem;
    }

    #render1x2() {
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

        DateTimeTile.tiles.add(this);
        DateTimeTile.#startTimer();

        this.update();

        return this.tileElem;
    }

    #render2x4() {
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

        DateTimeTile.tiles.add(this);
        DateTimeTile.#startTimer();

        this.update();

        return this.tileElem;
    }

    #render4x2() {
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

        DateTimeTile.tiles.add(this);
        DateTimeTile.#startTimer();

        this.update();

        return this.tileElem;
    }

    update() {
        const date = new Date();

        this.timeElem.textContent = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        this.dateElem.textContent = VAR_TEXT_DATE(date);
    }

    destroy() {
        DateTimeTile.tiles.delete(this);

        if (
            DateTimeTile.tiles.size === 0 &&
            DateTimeTile.interval !== null
        ) {
            clearInterval(DateTimeTile.interval);
            DateTimeTile.interval = null;
        }
    }

    static #startTimer() {
        if (DateTimeTile.interval !== null) {
            return;
        }

        DateTimeTile.interval = setInterval(() => {
            for (const tile of DateTimeTile.tiles) {
                /* Tile werd verwijderd bij dashboard/preview opnieuw renderen */
                if (!tile.tileElem.isConnected) {
                    DateTimeTile.tiles.delete(tile);
                    continue;
                }

                tile.update();
            }

            if (DateTimeTile.tiles.size === 0) {
                clearInterval(DateTimeTile.interval);
                DateTimeTile.interval = null;
            }
        }, 1000);
    }
}