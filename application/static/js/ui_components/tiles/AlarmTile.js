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

class AlarmTile extends Tile {
    constructor(configuration) {
        super(configuration);

        this.subtitle1 = configuration.subtitle1;
        this.subtitle2 = configuration.subtitle2;
        this.subtitleColor = "var(--text-green)";
        
        this.icon = configuration.icon;
        this.iconElementId = this.id + "AlarmIcon";

        if (this.icon != undefined) {
            this.icon.id = this.icon.id ?? this.iconElementId;
            this.iconElementId = this.icon.id;
        }

        this.checkboxValue = configuration.checkboxValue ?? false;
        this.powerFunction = configuration.powerFunction ?? null;

        this.checkboxElementId = this.id + "AlarmPowerCb";
        this.subtitle1Id = this.id + "AlarmSubtitle1";
        this.subtitle2Id = this.id + "AlarmSubtitle2";
    }

    /**************************************************************************/
    /*!
        @brief  XX
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

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    #render1x2() {
        const icons = [this.icon];

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
        this.tileElem.appendChild(this._renderSwitch(this.checkboxElementId, this.powerFunction, this.checkboxValue));

    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    #render4x2() {
        const icons = [this.icon];

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
        this.tileElem.appendChild(this._renderSwitch(this.checkboxElementId, this.powerFunction, this.checkboxValue));
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    #render4x4() {
        const icons = [this.icon];

        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this._renderIconsElement(icons));
        this.tileElem.appendChild(this._renderSwitch(this.checkboxElementId, this.powerFunction, this.checkboxValue));
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    #renderTitleElement(fullWidth=true) {
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

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    #renderTrustedDevices() {
        for (const connectedDevice of this.alarm.connected_deactivation_devices) {
            const deviceContainer = document.createElement("div");

            const iconElem = document.createElement("i");
            iconElem.className =
                "fa-duotone fa-solid fa-mobile fa-lg";
            iconElem.title = connectedDevice.name;

            deviceContainer.appendChild(iconElem);
            this.tileElem.appendChild(deviceContainer);
        }
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    setCheckboxValue(value) {
        this.checkboxValue = value;

        const checkboxElem = document.getElementById(this.checkboxElementId);
        checkboxElem.checked = this.checkboxValue;
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    getCheckboxValue() {
        const checkboxElem = document.getElementById(this.checkboxElementId);
        this.checkboxValue = checkboxElem.checked;

        return this.checkboxValue;
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    setSubtitle1(subtitle) {
        const titleElem = document.getElementById(this.subtitle1Id);
        this.subtitle1 = subtitle;

        titleElem.textContent = this.subtitle1;
    }

    /**************************************************************************/
    /*!
        @brief  XX
    */
    /**************************************************************************/
    setSubtitle2(subtitle) {
        const titleElem = document.getElementById(this.subtitle2Id);
        this.subtitle2 = subtitle;

        titleElem.textContent = this.subtitle2;
    }

    /**************************************************************************/
    /*!
        @brief  XX
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