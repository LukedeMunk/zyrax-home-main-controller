/******************************************************************************/
/*
 * File:    Overlay.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Overlay class to put overlays over pages and elements.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
class Overlay {
    /******************************************************************************/
    /*!
        @brief  Constructor.
    */
    /******************************************************************************/
    constructor() {
        this.element = null;
        this.fadeTimeout = null;
    }
   
    /******************************************************************************/
    /*!
        @brief  Shows an overlay (for when the user interface is unavailable).
        @param  targetElement       DOM element to put the overlay over
        @param  showLoadingIcon     True to show a loading icon on the
                                    overlay
    */
    /******************************************************************************/
    show(targetElement=null, showLoadingIcon=true) {
        /* If overlay does not exist, create it */
        if (!this.element) {
            this.element = document.createElement("div");
            this.element.className = "overlay";

            if (showLoadingIcon) {
                const loadingIconElem = document.createElement("div");
                loadingIconElem.className = "dot-loader";
                loadingIconElem.style.height = "8px";
                loadingIconElem.style.margin = "auto";
                this.element.appendChild(loadingIconElem);
                this.element.style.cursor = "wait";
            }

            if (targetElement != null) {
                targetElement.appendChild(this.element);
            } else {
                document.body.appendChild(this.element);
            }
        }

        /* Cancel pending fade-out */
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;
        }

        /* Ensure visible */
        requestAnimationFrame(() => {
            this.element.style.opacity = 1;
        });
    }

    /******************************************************************************/
    /*!
        @brief  Hides the overlay.
    */
    /******************************************************************************/
    hide() {
        if (!this.element) return;

        this.element.style.opacity = 0;

        this.fadeTimeout = setTimeout(() => {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
            this.fadeTimeout = null;
        }, 300);
    }
}