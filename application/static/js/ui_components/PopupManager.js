/******************************************************************************/
/*
 * File:    PopupManager.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Popup manager class to put show popups and confirmations.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
class PopupManager {
    #popups = new Map();                                                        //Active popup per target
    #popupStack = [];                                                           //Global popup order

    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Popup stack configuration
    */
    /******************************************************************************/
    constructor(configuration = {}) {
        this.overlay = configuration.overlayObject;
        this.defaultTarget = configuration.targetElement ?? document.body;
    }

    /******************************************************************************/
    /*!
        @brief  Shows the popup with the specified message and buttons.
        @param  title               Title of the popup
        @param  message             Description of the popup
        @param  buttons             Buttons of the popup
        @param  type                Popup type
        @param  targetElement       Target DOM element
        @return                     Popup DOM element
    */
    /******************************************************************************/
    show(title, message, buttons, type=MESSAGE_TYPE_SUCCESS, targetElement=null) {
        this.#renderAndShow(title, message, buttons, type, targetElement, false);
    }

    /******************************************************************************/
    /*!
        @brief  Shows the popup with the specified sections and buttons.
        @param  title               Title of the popup
        @param  {intro,             Intro text on top of sections
                sections,           Array of sections to include
                footer}             Footer text below the sections
        @param  buttons             Buttons of the popup
        @param  type                Popup type
        @param  targetElement       Target DOM element
        @return                     Popup DOM element
    */
    /******************************************************************************/
    showWithSections(title,
                    {intro=undefined, sections=[], footer=undefined},
                    buttons,
                    type=MESSAGE_TYPE_SUCCESS,
                    targetElement=null
                ) {

        let message = this.#buildSectionHtml({intro, sections, footer});
        this.#renderAndShow(title, message, buttons, type, targetElement, true);
    }

    /******************************************************************************/
    /*!
        @brief  Shows the popup with the specified items.
        @param  title               Title of the popup
        @param  message             Description of the popup
        @param  buttons             Buttons of the popup
        @param  type                Popup type
        @param  targetElement       Target DOM element
        @param  htmlMessage         True to render HTML
        @return                     Popup DOM element
    */
    /******************************************************************************/
    #renderAndShow(title, message, buttons, type, targetElement, htmlMessage) {
        targetElement = targetElement ?? this.defaultTarget;

        /* Replace existing popup */
        const existingPopup = this.#popups.get(targetElement);

        if (existingPopup) {
            existingPopup.remove();

            this.#popups.delete(targetElement);

            this.#popupStack = this.#popupStack.filter(
                p => p.popupElem !== existingPopup
            );
        }

        const popupElem = this.#render(title, message, buttons, type, htmlMessage);

        targetElement.appendChild(popupElem);

        this.#popups.set(targetElement, popupElem);

        this.#popupStack.push({
            target: targetElement,
            popupElem: popupElem
        });

        if (this.overlay) {
            this.overlay.show(targetElement, false);
        }

        /* Trigger CSS transition */
        popupElem.getBoundingClientRect();
        popupElem.classList.add("show");
        this.#disablePageScrolling();

        return popupElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a HTML description element with the specified intro,
                sections and footer.
        @param  {intro,             Intro text on top of sections
                sections,           Array of sections to include
                footer}             Footer text below the sections
        @return                     HTML string
    */
    /******************************************************************************/
    #buildSectionHtml({intro=undefined, sections=[], footer=undefined}) {
        let html = "";
        if (intro != undefined) {
            html += `<p>${intro}</p>`;
        }

        for (const section of sections) {
            if (typeof section.label !== "undefined") {
                html += `<p>${section.label}</p>`;
            }
            html += this.#renderHtmlList(section.items);
        }

        if (footer != undefined) {
            html += `<p>${footer}</p>`;
        }

        return html;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a HTML list with the specified items as string.
        @param  items               Items to show
        @return                     HTML list string
    */
    /******************************************************************************/
    #renderHtmlList(items) {
        return `
            <ul class="popup-list-container">
                ${(items ?? []).map(item => `<li>${item}</li>`).join("")}
            </ul>
        `;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the popup DOM element.
        @param  title               Title of the popup
        @param  message             Description of the popup
        @param  buttons             Buttons of the popup
        @param  type                Popup type
        @param  htmlMessage         True to render HTML
        @return                     Popup DOM element
    */
    /******************************************************************************/
    #render(title, message, buttons, type, htmlMessage) {
        const popupElem = document.createElement("div");
        popupElem.className = "popup-container";

        const iconElem = document.createElement("i");
        iconElem.className = "popup-icon";

        switch (type) {
            case MESSAGE_TYPE_INFO:
                iconElem.className = "popup-icon fa-solid fa-circle-info";
                iconElem.style.color = "var(--icon-blue)";
                break;

            case MESSAGE_TYPE_SUCCESS:
                iconElem.className = "popup-icon fa-solid fa-check-circle";
                iconElem.style.color = "var(--icon-green)";
                break;

            case MESSAGE_TYPE_WARNING:
                iconElem.className = "popup-icon fa-solid fa-triangle-exclamation";
                iconElem.style.color = "var(--icon-orange)";
                break;

            case MESSAGE_TYPE_ERROR:
                iconElem.className = "popup-icon fa-solid fa-circle-xmark";
                iconElem.style.color = "var(--icon-red)";
                break;
        }

        popupElem.appendChild(iconElem);

        const titleElem = document.createElement("h2");
        titleElem.className = "popup-title";
        titleElem.textContent = title;
        popupElem.appendChild(titleElem);

        let messageElem;

        if (htmlMessage) {
            messageElem = document.createElement("div");
            messageElem.innerHTML = message;

            popupElem.style.maxWidth = "800px";
        } else {
            messageElem = document.createElement("p");
            messageElem.textContent = message;
        }

        messageElem.className = "popup-message";
        popupElem.appendChild(messageElem);

        const buttonContainerElem = document.createElement("div");
        buttonContainerElem.className = "popup-button-container";

        for (const button of buttons) {
            const buttonElem = document.createElement("button");
            buttonElem.textContent = button.text;

            if (button.onclickFunction) {
                buttonElem.addEventListener("click", (e) => {
                    e.stopPropagation();
                    button.onclickFunction();
                });
            }

            buttonContainerElem.appendChild(buttonElem);
        }

        popupElem.appendChild(buttonContainerElem);

        return popupElem;
    }

    /******************************************************************************/
    /*!
        @brief  Closes the popup for the specified target.
        @param  targetElement           DOM element of the target
    */
    /******************************************************************************/
    close(targetElement=null) {
        if (targetElement === null) {
            this.closeLast();
            return;
        }

        targetElement = targetElement ?? this.defaultTarget;

        const popupElem = this.#popups.get(targetElement);

        if (!popupElem) {
            return;
        }

        popupElem.classList.remove("show");

        setTimeout(() => {
            popupElem.remove();

            if (this.#popups.get(targetElement) === popupElem) {
                this.#popups.delete(targetElement);
            }

            this.#popupStack = this.#popupStack.filter(
                p => p.popupElem !== popupElem
            );

            if (this.#popupStack.length === 0 && this.overlay) {
                this.overlay.hide();
                this.#enablePageScrolling();
            }
        }, 300);
    }

    /******************************************************************************/
    /*!
        @brief  Closes the most recently opened popup.
    */
    /******************************************************************************/
    closeLast() {
        const lastPopup = this.#popupStack.at(-1);

        if (!lastPopup) {
            return;
        }

        this.close(lastPopup.target);
    }

    /******************************************************************************/
    /*!
        @brief  Closes all popups.
    */
    /******************************************************************************/
    closeAll() {
        const targets = [...this.#popups.keys()];

        for (const target of targets) {
            this.close(target);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Disables page scrolling.
    */
    /******************************************************************************/
    #disablePageScrolling() {
        document.body.style.overflow = "hidden";
    }

    /******************************************************************************/
    /*!
        @brief  Enables page scrolling.
    */
    /******************************************************************************/
    #enablePageScrolling() {
        if (openModals.length > 0) {
            return;
        }
        
        document.body.style.overflow = "";
    }
}