/******************************************************************************/
/*
 * File:    BannerManager.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Banner manager class to manage the banner stack. Used to show
 *          notification banners.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Example configuration /*X*/ = required
const EXAMPLE_BANNER_CONFIGURATION = {
    maxVisible: MAX_VISIBLE_BANNERS,
    timeout: SHOW_BANNER_TIME,
    targetElement: document.body
}
//#endregion

class BannerManager {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Banner stack configuration
    */
    /******************************************************************************/
    constructor(configuration={}) {
        this.maxVisible = configuration.maxVisible ?? MAX_VISIBLE_BANNERS;
        this.defaultTimeout = configuration.timeout ?? SHOW_BANNER_TIME;
        this.targetElement = configuration.targetElement ?? document.body;

        this._stacks = new Map();                                                   //Key = targetElement, Value = stack element
    }

    /******************************************************************************/
    /*!
        @brief  Shows the banner with the specified items.
        @param  title               Title of the banner
        @param  message             Description of the banner
        @param  type                Banner type (info, error, etc.)
        @param  timeout             Timeout of the banner. After the timeout, the
                                    banner closes
        @param  onclickFunction     Onclick function to set
        @param  targetElement       DOM element to put the banner on top of
        @return                     DOM element
    */
    /******************************************************************************/
    show(title, message, type, timeout=this.defaultTimeout, onclickFunction=null, targetElement=document.body) {
        targetElement = targetElement ?? this.targetElement;
        
        const bannerStackElem = this.#getStack(targetElement);
        const currentBannersContainerElem = bannerStackElem.querySelectorAll(".banner-container");

        if (currentBannersContainerElem.length >= this.maxVisible) {
            this.close(currentBannersContainerElem[0]);
        }

        const bannerElem = this.#generateBannerElement(title, message, onclickFunction);
        const bannerIconElem = bannerElem.querySelector(".banner-icon");
        const closeBannerButtonElem = bannerElem.querySelector(".banner-close-button");

        closeBannerButtonElem.addEventListener("click", (e) => {
            e.stopPropagation();
            this.close(bannerElem);
        });

        /* Type styling */
        switch (type) {
            case MESSAGE_TYPE_INFO:
                bannerIconElem.className = "banner-icon fa-solid fa-circle-info";
                bannerIconElem.style.color = "var(--icon-blue)";
                break;

            case MESSAGE_TYPE_SUCCESS:
                bannerIconElem.className = "banner-icon fa-solid fa-check-circle";
                bannerIconElem.style.color = "var(--icon-green)";
                break;

            case MESSAGE_TYPE_WARNING:
                bannerIconElem.className = "banner-icon fa-solid fa-triangle-exclamation";
                bannerIconElem.style.color = "var(--icon-orange)";
                break;

            case MESSAGE_TYPE_ERROR:
                bannerIconElem.className = "banner-icon fa-solid fa-circle-xmark";
                bannerIconElem.style.color = "var(--icon-red)";
                break;
        }

        bannerStackElem.appendChild(bannerElem);

        /* Force reflow for animation */
        bannerElem.getBoundingClientRect();
        bannerElem.classList.add("show");

        if (timeout > 0) {
            setTimeout(() => this.close(bannerElem), timeout);
        }

        return bannerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Closes the specified banner DOM element.
        @param  bannerElem          Banner DOM element
    */
    /******************************************************************************/
    close(bannerElem) {
        if (!bannerElem) {
            return;
        }
        
        const bannerStackElem = bannerElem.parentElement;

        bannerElem.classList.remove("show");

        setTimeout(() => {
            bannerElem.remove();

            if (bannerStackElem && bannerStackElem.children.length === 0) {
                bannerStackElem.remove();
                this.#removeStackReference(bannerStackElem);
            }
        }, 300);
    }

    /******************************************************************************/
    /*!
        @brief  Generates the banner DOM element.
        @param  title               Banner title
        @param  message             Message to set
        @param  onclickFunction     Onclick function to set
        @return                     DOM element
    */
    /******************************************************************************/
    #generateBannerElement(title, message, onclickFunction) {
        const bannerElem = document.createElement("div");
        bannerElem.className = "banner-container";

        if (onclickFunction) {
            bannerElem.style.cursor = "pointer";
            bannerElem.addEventListener("click", onclickFunction);
        }

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.className = "banner-icon";

        /* Content */
        const contentElem = document.createElement("div");
        contentElem.className = "banner-content";

        const titleElem = document.createElement("p");
        titleElem.className = "banner-title";
        titleElem.textContent = title || "Notification";

        const messageElem = document.createElement("p");
        messageElem.className = "banner-message";
        messageElem.textContent = message || "";

        contentElem.appendChild(titleElem);
        contentElem.appendChild(messageElem);

        /* Close button */
        const bannerClose = document.createElement("i");
        bannerClose.className = "fa-solid fa-xmark banner-close-button clickable";

        bannerElem.appendChild(iconElem);
        bannerElem.appendChild(contentElem);
        bannerElem.appendChild(bannerClose);

        return bannerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the stack the specified element is in.
        @param  targetElement       DOM element to get the stack of
        @return                     DOM element
    */
    /******************************************************************************/
    #getStack(targetElement) {
        if (!targetElement) targetElement = document.body;

        if (this._stacks.has(targetElement)) {
            return this._stacks.get(targetElement);
        }

        const stack = document.createElement("div");
        stack.className = "banner-stack";

        targetElement.appendChild(stack);
        this._stacks.set(targetElement, stack);

        return stack;
    }

    /******************************************************************************/
    /*!
        @brief  Removes the specified stack reference.
        @param  stackElement        DOM element to remove from the stack
    */
    /******************************************************************************/
    #removeStackReference(stackElement) {
        for (const [key, value] of this._stacks) {
            if (value === stackElement) {
                this._stacks.delete(key);
                return;
            }
        }
    }
}