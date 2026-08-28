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
class DeviceTile extends Tile {
    /**************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Device tile configuration
    */
    /**************************************************************************/
    constructor(configuration) {
        super(configuration);
        
        this.subtitle1 = configuration.subtitle1 ?? "";
        this.subtitle2 = configuration.subtitle2 ?? "";
        this.subtitle3 = configuration.subtitle3 ?? "";
        this.subtitleColor = "var(--text-green)";

        this.icon = configuration.icon;
        this.warningIcon = configuration.warningIcon;
        //this.isGroup = configuration.isGroup ?? false;

        this.checkboxValue = configuration.checkboxValue ?? false;
        this.rangeValue = configuration.rangeValue ?? 0;

        this.powerFunction = configuration.powerFunction ?? null;
        this.rangeOnchangeFunction = configuration.rangeOnchangeFunction ?? null;
        this.rangeOninputFunction = configuration.rangeOninputFunction ?? null;

        this.checkboxElementId = this.id + "DevicePowerCb";
        this.rangeElementId = this.id + "DeviceRange";
        this.iconElementId = this.id + "DeviceIcon";
        this.icon.id = this.iconElementId;
    }

    /**************************************************************************/
    /*!
        @brief  Generates the device tile.
    */
    /**************************************************************************/
    render() {
        this.tileElem = super._renderTileElement();

        if (this.size === TILE_SIZE_1X1) {
            this.#render1x1();
        } else if (this.size === TILE_SIZE_1X2) {
            this.#render1x2();
        } else if (this.size === TILE_SIZE_2X2) {
            this.#render4x2();
        } else if (this.size === TILE_SIZE_4X4) {
            this.#render4x4();
        }

        return this.tileElem;
    }

    /**************************************************************************/
    /*!
        @brief  Renders a 1x1 tile.
    */
    /**************************************************************************/
    #render1x1() {
        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({
                id: "groupSynchronizedIcon" + this.tile.group_id,
                icon: "",
                title: ""
            });
        }

        this.tileElem.appendChild(this._renderTitleElement(true, "test", "test2"));
        this.tileElem.appendChild(this._renderIconsElement(icons));
    }

    /**************************************************************************/
    /*!
        @brief  Renders a 1x2 tile.
    */
    /**************************************************************************/
    #render1x2() {
        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({
                id: "groupSynchronizedIcon" + this.tile.group_id,
                icon: "",
                title: ""
            });
        }

        this.tileElem.appendChild(this._renderTitleElement(true, "test", "test2"));
        this.tileElem.appendChild(this._renderIconsElement(icons, "after"));
        this.tileElem.appendChild(this._renderSwitch(this.checkboxElementId, this.powerFunction, this.checkboxValue));
    }

    /**************************************************************************/
    /*!
        @brief  Renders a 4x2 tile with brightness slider.
    */
    /**************************************************************************/
    #render4x2() {
        this.tileElem.style.gridTemplateColumns = "repeat(3, 33%)";

        const icons = [this.icon];

        if (!this.previewTile && this.tile?.type === TILE_TYPE_GROUP) {
            icons.push({
                id: "groupSynchronizedIcon" + this.tile.group_id,
                icon: "",
                title: ""
            });
        }

        this.tileElem.appendChild(this._renderTitleElement(false, "test", "test2"));
        this.tileElem.appendChild(this._renderSwitch(this.checkboxElementId, this.powerFunction, this.checkboxValue));
        this.tileElem.appendChild(this._renderIconsElement(icons));

        if (this.previewTile || this.rangeOnchangeFunction !== undefined) {
            const rangeElem = this._renderRangeElement(
                this.rangeElementId,
                this.rangeOnchangeFunction,
                this.rangeOninputFunction,
                undefined,
                MAX_LEDSTRIP_BRIGHTNESS,
                this.rangeValue
            )

            this.tileElem.appendChild(rangeElem);
        }
    }

    /**************************************************************************/
    /*!
        @brief  Renders a 4x4 camera tile.
    */
    /**************************************************************************/
    #render4x4() {
        const titleContainerElem = document.createElement("div");
        const titleElem = document.createElement("p");
        titleElem.textContent = this.title;

        titleContainerElem.appendChild(titleElem);
        this.tileElem.appendChild(titleContainerElem);

        /* Huidige tijdelijke camera-preview */
        const cameraContainer = document.createElement("div");
        cameraContainer.style.backgroundColor = "red";

        this.tileElem.appendChild(cameraContainer);
    }

    /**************************************************************************/
    /*!
        @brief  Sets the specified checkbox value.
        @param  value               Value to set
    */
    /**************************************************************************/
    setCheckboxValue(value) {
        this.checkboxValue = value;

        const checkboxElem = document.getElementById(this.checkboxElementId);
        checkboxElem.checked = this.checkboxValue;
    }

    /**************************************************************************/
    /*!
        @brief  Sets the specified range value.
        @param  value               Value to set
    */
    /**************************************************************************/
    setRangeValue(value) {
        this.rangeValue = value;

        const rangeElem = document.getElementById(this.rangeElementId);
        rangeElem.value = this.rangeValue;
    }

    /**************************************************************************/
    /*!
        @brief  Returns the range value.
        @return                     Range value
    */
    /**************************************************************************/
    getRangeValue() {
        const rangeElem = document.getElementById(this.rangeElementId);
        this.rangeValue = parseInt(rangeElem.value);

        return this.rangeValue;
    }

    /**************************************************************************/
    /*!
        @brief  Sets the icon.
        @param  icon                Icon to set
    */
    /**************************************************************************/
    setIcon(icon) {
        this.icon.icon = icon.icon ?? "";
        this.icon.title = icon.title ?? "";

        const iconElem = document.getElementById(this.iconElementId);
        iconElem.className = this.icon.icon;
        iconElem.title = this.icon.title;
    }
}