/****************************************************************************/
/*
 * File:    WeatherTile.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   WeatherTile dashboard component.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { TEXT_NOW, TEXT_WIND } from "../../domain/language_pack_english.js";
import {
    TILE_SIZE_1X2, TILE_SIZE_2X2, TILE_SIZE_2X4, TILE_SIZE_4X4
} from "../../domain/dashboard_tiles.js";
import { Component } from "../../../vendor/templates/js/core/component.js";

export class WeatherTile extends Component {
    /****************************************************************************/
    /*!
     * @brief   Initializes the component with its root and configuration.
     * @param   root                    Root element owned by the component.
     * @param   configuration           Initial component configuration.
     */
    /****************************************************************************/
    constructor(root, configuration) {
        super(root, configuration);
        this.containerElement = configuration.containerElement;
        this.tile = configuration.tile;
        this.previewTile = configuration.previewTile ?? false;
        this.size = configuration.size ?? configuration.tile?.size;
        this.id = configuration.id ?? this.size + "WeatherTile";
        this.tileElem = null;
    }

    /****************************************************************************/
    /*!
     * @brief   Builds the weather tile, its content and decorative bubbles.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Prepares the weather tile root for a preview or dashboard item.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    #getTileElement() {
        let tileElem;

        if (this.previewTile) {
            tileElem = this.root;
            tileElem.id = "previewTile" + this.size;

            tileElem.onclick = this.props.onSelect;
        } else {
            tileElem = this.root;
            tileElem.className = "tile tile1x2";

            tileElem.setAttribute("tile-id", this.tile.id);

            tileElem.onclick = this.props.onSelect;
            tileElem.style.cursor = "pointer";
        }

        tileElem.replaceChildren();
        tileElem.className = "tile weather-tile";
        tileElem.style.boxShadow = "var(--shadow-small)";

        if (!this.previewTile && this.props.editable) {
            tileElem.style.border = "1px dashed var(--icon-blue)";
            tileElem.style.backgroundColor = "var(--background5)";
        } else {
            tileElem.style.border = "1px solid transparent";
        }

        return tileElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Applies the weather tile and bubble layout classes for its size.
     * @param   bubblesElem             Container for decorative weather bubbles.
     */
    /****************************************************************************/
    #applySizeClasses(bubblesElem) {
        if (this.size === TILE_SIZE_2X2) {
            this.tileElem.classList.add("tile2x2");
            bubblesElem.classList.add("bubbles-tile2x2");
        } else if (this.size === TILE_SIZE_4X4) {
            this.tileElem.classList.add("weather-tile-tile4x4");
            this.tileElem.classList.add("tile4x4");
            bubblesElem.classList.add("bubbles-tile4x4");
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Renders weather details or the current unavailable or loading state.
     */
    /****************************************************************************/
    #renderContent() {
        if (!this.props.weather?.days?.length) {
            this.tileElem.appendChild(this.#createUnavailableHeader("UNAVAILABLE"));

            return;
        }

        if (this.props.loading) {
            this.tileElem.appendChild(this.#createUnavailableHeader("LOADING"));

            return;
        }

        this.tileElem.appendChild(this.#createWeatherHeader());

        if (this.size === TILE_SIZE_4X4) {
            this.tileElem.appendChild(this.#createForecast());
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Creates the weather tile status header.
     * @param   text                    Visible status text.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Creates the current location and temperature header.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    #createWeatherHeader() {
        const currentDay = this.props.weather.days[0];

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

        detailsElem.appendChild(this.#createWeatherDetail(
            currentDay.icon, TEXT_NOW, currentDay.conditions, this.size > TILE_SIZE_1X2
        ));

        if (this.size > TILE_SIZE_1X2) {
            detailsElem.appendChild(this.#createWeatherDetail(
                "fas fa-wind", currentDay.windspeed + " km/h", TEXT_WIND, false
            ));
        }

        headerElem.appendChild(detailsElem);

        return headerElem;
    }

    /****************************************************************************/
    /*!
     * @brief   Creates a weather detail with its icon, value and label.
     * @param   iconClass               Icon classes for the weather detail.
     * @param   value                   Value to apply or format.
     * @param   label                   Visible label for the rendered value.
     * @param   valueBeforeIcon         Whether the value appears before its icon.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
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

    /****************************************************************************/
    /*!
     * @brief   Creates the daily weather forecast items.
     * @returns Created component, element or operation result.
     */
    /****************************************************************************/
    #createForecast() {
        const forecastElem = document.createElement("div");
        forecastElem.className = "weather-forecast";

        for (let i = 1; i < Math.min(this.props.weather.days.length, 6); i++) {
            const day = this.props.weather.days[i];

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

    /****************************************************************************/
    /*!
     * @brief   Creates the decorative bubble elements for the weather tile.
     * @param   bubblesElem             Container for decorative weather bubbles.
     */
    /****************************************************************************/
    #generateBubbles(bubblesElem) {
        let bubbleCount = 4;

        if (this.size === TILE_SIZE_2X2 || this.size === TILE_SIZE_2X4) {
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
