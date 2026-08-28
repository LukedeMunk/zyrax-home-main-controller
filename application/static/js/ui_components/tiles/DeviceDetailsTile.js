/******************************************************************************/
/*
 * File:    DeviceDetailsTile.js
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
const EXAMPLE_DEVICE_DETAILS_TILE_CONFIGURATION = {
    containerElement: null,
    id: "detailTile",
    title: "Device1",
    subtitle1: "X.X.X.X",
    subtitle2: "Connected",
    subtitle3: "",
    subtitleColor: "var(--text-green)",
    icon: "",
    warningText: "",
    options: []
}
//#endregion

//#endregion
class DeviceDetailsTile {
    /**************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Device tile configuration
    */
    /**************************************************************************/
    constructor(configuration) {
        this.containerElement = configuration.containerElement;
        this.title = configuration.title ?? "";
        this.icon = configuration.icon ?? "";
        this.subtitle1 = configuration.subtitle1 ?? "";
        this.subtitle2 = configuration.subtitle2 ?? "";
        this.subtitle3 = configuration.subtitle3 ?? "";
        this.subtitleColor = configuration.subtitleColor ?? undefined;
        this.warningText = configuration.warningText ?? undefined;
        this.options = configuration.options ?? [];

        this.tileElem = null;
    }

    /**************************************************************************/
    /*!
        @brief  Generates the device tile.
    */
    /**************************************************************************/
    render() {
        this.tileElem = this.#renderTileElement();
        
        this.tileElem.appendChild(this.#renderTitleElement());
        this.tileElem.appendChild(this.#renderIconElement());
        this.tileElem.appendChild(this.#renderOptionsElement());
        this.tileElem.appendChild(this.#renderSubTitle3Element());

        if (this.containerElement) {
            this.containerElement.appendChild(this.tileElem);
        }

        return this.tileElem;

        
        //nameContainer.style.alignItems = "baseline";
        //if (this.warningText) {
        //    const warningIconElem = document.createElement("i");
        //    warningIconElem.className = "fa-duotone fa-solid fa-circle-exclamation"
        //    warningIconElem.title = this.warningText;
        //    warningIconElem.style.color = "var(--icon-red)";
//
        //    nameContainer.appendChild(warningTextElem);
        //}
//
        //return nameContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Gets or creates the tile container and applies shared styling.
        @return                     Tile DOM element
    */
    /**************************************************************************/
    #renderTileElement() {
        const tileElem = document.createElement("div");
        tileElem.className = "tile tile2x2";
        tileElem.style.backgroundColor = "var(--background5)";
        tileElem.style.gridTemplateColumns = "repeat(3, 33%)";

        return tileElem;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the title element.
        @return                     DOM element
    */
    /**************************************************************************/
    #renderTitleElement() {
        const titleContainer = document.createElement("div");
        titleContainer.style.gridColumn = "span 2";

        const titleElem = document.createElement("p");
        titleElem.textContent = this.title;

        const subTitle1Elem = document.createElement("p");
        subTitle1Elem.textContent = this.subtitle1;
        if (this.subtitleColor) {
            subTitle1Elem.style.color = this.subtitleColor;
        }
        subTitle1Elem.style.fontSize = "var(--font-size-extra-small)";

        const subTitle2Elem = document.createElement("p");
        subTitle2Elem.textContent = this.subtitle2;
        if (this.subtitleColor) {
            subTitle2Elem.style.color = this.subtitleColor;
        }
        subTitle2Elem.style.fontSize = "var(--font-size-extra-small)";

        titleContainer.appendChild(titleElem);
        titleContainer.appendChild(subTitle1Elem);
        titleContainer.appendChild(subTitle2Elem);

        return titleContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the icon element.
        @return                     DOM element
    */
    /**************************************************************************/
    #renderIconElement() {
        const iconContainer = document.createElement("div");
        iconContainer.style.textAlign = "right";

        const iconElem = document.createElement("i");
        iconElem.className = this.icon;

        iconContainer.appendChild(iconElem);
        return iconContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the options element.
        @return                     DOM element
    */
    /**************************************************************************/
    #renderOptionsElement() {
        const optionContainer = document.createElement("div");
        optionContainer.style.display = "flex";
        optionContainer.style.gap = "5px";

        for (let option of this.options) {
            const iconElem = document.createElement("i");
            iconElem.className = option.icon + " clickable";
            iconElem.title = option.title ?? "";
            iconElem.onclick = option.onclickFunction;

            optionContainer.appendChild(iconElem);
        }

        return optionContainer;
    }

    /**************************************************************************/
    /*!
        @brief  Creates the third subtitle element.
        @return                     DOM element
    */
    /**************************************************************************/
    #renderSubTitle3Element() {
        const subtitleContainer = document.createElement("div");
        subtitleContainer.style.gridColumn = "span 2";

        const subtitle3Elem = document.createElement("p");
        subtitle3Elem.textContent = this.subtitle3;
        subtitle3Elem.style.fontSize = "var(--font-size-extra-small)";

        subtitleContainer.appendChild(subtitle3Elem);
        return subtitleContainer;
    }
}