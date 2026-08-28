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
class WeatherTile {
    constructor(configuration) {
        this.containerElement = configuration.containerElement;
        this.tile = configuration.tile;
        this.previewTile = configuration.previewTile ?? false;
        this.size = configuration.size ?? configuration.tile?.size;
        this.id = configuration.id ?? this.size + "WeatherTile";
        this.tileElem = null;
    }

    render() {
        this.tileElem = this.#getTileElement();

        const bubblesElem = document.createElement("div");
        bubblesElem.className = "weather-bubbles";
        bubblesElem.id = this.id;

        this.#applySizeClasses(bubblesElem);

        this.tileElem.appendChild(bubblesElem);
        this.#renderContent();

        if (this.containerElement) {
            this.containerElement.appendChild(this.tileElem);
        }

        this.#generateBubbles(bubblesElem);

        return this.tileElem;
    }

    #getTileElement() {
        let tileElem;

        if (this.previewTile) {
            tileElem = document.createElement("div");
            tileElem.id = "previewTile" + this.size;
            tileElem.onclick = () => addTile(this.size);
        } else {
            tileElem = document.createElement("div");
            tileElem.className = "tile tile1x2";
            //tileElem = document.getElementById("tile tile1x2" + this.tile.index);
            tileElem.setAttribute("tile-id", this.tile.id);
            tileElem.onclick = () => loadWeatherLocationModal();
            tileElem.style.cursor = "pointer";
        }

        tileElem.replaceChildren();
        tileElem.className = "tile weather-tile";
        tileElem.style.boxShadow = "var(--shadow-small)";

        if (!this.previewTile && (typeof configureDashboardMode !== "undefined" && configureDashboardMode)) {
            tileElem.style.border = "1px dashed blue";
            tileElem.style.backgroundColor = "var(--background5)";
        } else {
            tileElem.style.border = "1px solid transparent";
        }

        return tileElem;
    }

    #applySizeClasses(bubblesElem) {
        if (this.size === TILE_SIZE_2X2) {
            this.tileElem.classList.add("tile2x2");
            bubblesElem.classList.add("bubbles-tile2x2");

        } else if (this.size === TILE_SIZE_4X4) {
            this.tileElem.classList.add(
                "weather-tile-tile4x4"
            );
            this.tileElem.classList.add("tile4x4");
            bubblesElem.classList.add(
                "bubbles-tile4x4"
            );
        }
    }

    #renderContent() {
        if (!weatherAvailable) {
            this.tileElem.appendChild(
                this.#createUnavailableHeader("UNAVAILABLE")
            );
            return;
        }

        if (weatherLoading) {
            this.tileElem.appendChild(
                this.#createUnavailableHeader("LOADING")
            );
            return;
        }

        this.tileElem.appendChild(this.#createWeatherHeader());

        if (this.size === TILE_SIZE_4X4) {
            this.tileElem.appendChild(this.#createForecast());
        }
    }

    #createUnavailableHeader(text) {
        const headerElem = document.createElement("div");
        headerElem.className = "weather-header";

        const temperatureContainer = document.createElement("div");

        const temperatureElem = document.createElement("div");
        temperatureElem.className = "temperature";
        temperatureElem.textContent = text;

        const descriptionElem = document.createElement("div");
        descriptionElem.textContent = text;

        temperatureContainer.appendChild(temperatureElem);
        temperatureContainer.appendChild(descriptionElem);
        headerElem.appendChild(temperatureContainer);

        return headerElem;
    }

    #createWeatherHeader() {
        const currentDay = weather.days[0];

        const headerElem = document.createElement("div");
        headerElem.className = "weather-header";

        const temperatureContainer = document.createElement("div");

        const temperatureElem = document.createElement("div");
        temperatureElem.className = "temperature";
        temperatureElem.id = "dayTemperature";
        temperatureElem.textContent = currentDay.temperature + "°C";

        const descriptionElem = document.createElement("div");
        descriptionElem.textContent = this.size > TILE_SIZE_1X2
            ? currentDay.description.replace(".", "")
            : currentDay.conditions;

        temperatureContainer.appendChild(temperatureElem);
        temperatureContainer.appendChild(descriptionElem);
        headerElem.appendChild(temperatureContainer);

        const detailsElem = document.createElement("div");
        detailsElem.className = "temp-details";

        detailsElem.appendChild(
            this.#createWeatherDetail(
                currentDay.icon,
                TEXT_NOW,
                currentDay.conditions,
                this.size > TILE_SIZE_1X2
            )
        );

        if (this.size > TILE_SIZE_1X2) {
            detailsElem.appendChild(
                this.#createWeatherDetail(
                    "fas fa-wind",
                    currentDay.windspeed + " km/h",
                    TEXT_WIND,
                    false
                )
            );
        }

        headerElem.appendChild(detailsElem);

        return headerElem;
    }

    #createWeatherDetail(iconClass, value, label, valueBeforeIcon) {
        const detailElem = document.createElement("div");
        detailElem.className = "weather-detail";

        const iconElem = document.createElement("i");
        iconElem.className = iconClass;

        const valueElem = document.createElement("div");
        valueElem.className = "weather-detail-value";
        valueElem.textContent = value;

        const labelElem = document.createElement("div");
        labelElem.className = "weather-detail-label";
        labelElem.textContent = label;

        if (valueBeforeIcon) {
            detailElem.appendChild(valueElem);
        }

        detailElem.appendChild(iconElem);
        detailElem.appendChild(labelElem);

        if (!valueBeforeIcon) {
            detailElem.appendChild(valueElem);
        }

        return detailElem;
    }

    #createForecast() {
        const forecastElem = document.createElement("div");
        forecastElem.className = "weather-forecast";

        for (let i = 1; i < 6; i++) {
            const day = weather.days[i];

            const itemElem = document.createElement("div");
            itemElem.className = "forecast-item";

            const dayElem = document.createElement("div");
            dayElem.className = "forecast-day";
            dayElem.textContent = day.weekday;

            const iconElem = document.createElement("i");
            iconElem.className = day.icon;

            const temperatureElem = document.createElement("div");
            temperatureElem.className = "forecast-temp";
            temperatureElem.textContent = day.temperature + "°C";

            itemElem.appendChild(dayElem);
            itemElem.appendChild(iconElem);
            itemElem.appendChild(temperatureElem);
            forecastElem.appendChild(itemElem);
        }

        return forecastElem;
    }

    #generateBubbles(bubblesElem) {
        let bubbleCount = 4;

        if (
            this.size === TILE_SIZE_2X2 ||
            this.size === TILE_SIZE_2X4
        ) {
            bubbleCount = 8;
        } else if (this.size === TILE_SIZE_4X4) {
            bubbleCount = 12;
        }

        for (let i = 0; i < bubbleCount; i++) {
            const bubbleElem = document.createElement("div");
            bubbleElem.className = "bubble";

            const bubbleSize = Math.floor(Math.random() * 60) + 20;

            bubbleElem.style.width = bubbleSize + "px";
            bubbleElem.style.height = bubbleSize + "px";
            bubbleElem.style.left = Math.floor(Math.random() * 90) + 5 + "%";
            bubbleElem.style.top = Math.floor(Math.random() * 90) + 5 + "%";
            bubbleElem.style.animationDuration = Math.floor(Math.random() * 6) + 6 + "s";
            bubbleElem.style.animationDelay = Math.floor(Math.random() * 5) + "s";

            bubblesElem.appendChild(bubbleElem);
        }
    }
}