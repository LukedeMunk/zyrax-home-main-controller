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
class AddTile {
    constructor(configuration) {
        this.containerElement = configuration.containerElement;
        this.title = configuration.title;
        this.size = configuration.size ?? TILE_SIZE_1X1

        this.onclickFunction = configuration.onclickFunction;

        this.tileElem = null;
    }

    render() {
        this.tileElem = document.createElement("div");
        this.tileElem.id = "tile-add";
        this.tileElem.className = getClassFromSize(this.size);
        this.tileElem.title = this.title;
        this.tileElem.style.cursor = "pointer";
        this.tileElem.onclick = this.onclickFunction;
        this.tileElem.setAttribute("role", "button");
        this.tileElem.setAttribute("aria-label", this.title);
        this.tileElem.tabIndex = 0;
        this.tileElem.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            this.onclickFunction(event);
        });

        this.tileElem.appendChild(this.#createIconElement());

        if (this.containerElement) {
            this.containerElement.appendChild(this.tileElem);
        }

        return this.tileElem;
    }

    #createIconElement() {
        const iconContainer = document.createElement("div");
        iconContainer.style.gridColumn = "span 2";
        iconContainer.style.gridRow = "span 2";
        iconContainer.style.textAlign = "center";

        const iconElem = document.createElement("i");
        iconElem.className = "fa-duotone fa-solid fa-plus fa-xl";

        iconContainer.appendChild(iconElem);

        return iconContainer;
    }
}
