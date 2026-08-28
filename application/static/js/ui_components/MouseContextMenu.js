/******************************************************************************/
/*
 * File:    MouseContextMenu.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Mouse context menu class to handle mouse context menus.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Example configuration /*X*/ = required
//const EXAMPLE_MENU_ITEMS = {
//    {text: TEXT_MAKE_LED_SEGMENT, icon: "fa-solid fa-lightbulb", onclickFunction: () => toggleSegmentType() },
//    {text: TEXT_ASSIGN_ADDRESSES, icon: "fa-solid fa-list-ol", submenu: [
//        {text: TEXT_ASSENDING, icon: "fa-solid fa-list-ol", onclickFunction: () => ascendAddressing()},
//        {text: TEXT_DESCENDING, icon: "fa-solid fa-list-ol", onclickFunction: () => descendAddressing()}
//    ]}
//];
class MouseContextMenu {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  menuItems           Items that are in the menu
        @param  targetElement       DOM element to render the menu in
        @param  mouseButton         Button of the mouse the menu reacts on
        @param  disabled            True to disable the menu
    */
    /******************************************************************************/
    constructor(menuItems=[], targetElement=document.body, mouseButton=RIGHT_MOUSE_BUTTON, disabled=false) {
        this.menuItems = menuItems;
        this.mouseButton = mouseButton;
        this.disabled = disabled;

        this.visible = false;
        this.hideTimeout = null;
        this.hideSubmenuTimeout = null;
        this.triggerElements = new Set();
        this.targetElement = targetElement;

        this.menuElem = document.createElement("div");
        this.menuElem.className = "mouse-context-menu";
        this.menuElem.setAttribute("role", "menu");
        this.targetElement.appendChild(this.menuElem);

        this.#attachEvents();
        this.#render();
    }

    /******************************************************************************/
    /*!
        @brief  Shows the mouse menu on the specified location.
        @param  x                   X coordinate on the page
        @param  y                   Y coordinate on the page
    */
    /******************************************************************************/
    show(x, y) {
        if (typeof x === "object") {
            y = x.top ?? x.y;
            x = x.left ?? x.x;
        }

        const viewportPadding = 8;
        this.menuElem.style.left = "0px";
        this.menuElem.style.top = "0px";
        this.menuElem.classList.add("show");

        const menuRectangle = this.menuElem.getBoundingClientRect();
        const maximumX = window.innerWidth - menuRectangle.width - viewportPadding;
        const maximumY = window.innerHeight - menuRectangle.height - viewportPadding;
        const safeX = Math.max(
            viewportPadding,
            Math.min(Number(x) || 0, maximumX)
        );
        const safeY = Math.max(
            viewportPadding,
            Math.min(Number(y) || 0, maximumY)
        );

        this.menuElem.style.left = `${safeX}px`;
        this.menuElem.style.top = `${safeY}px`;
        this.menuElem.classList.toggle(
            "submenus-left",
            safeX + menuRectangle.width + 190 > window.innerWidth
        );

        const firstItem = this.menuElem.querySelector(".mouse-context-menu-item");
        firstItem?.focus({preventScroll: true});

        setTimeout(() => {
            this.visible = true;
        }, 10);
    }

    /******************************************************************************/
    /*!
        @brief  Hides the mouse menu.
    */
    /******************************************************************************/
    hide() {
        this.menuElem.classList.remove("show");
        this.visible = false;
    }

    /******************************************************************************/
    /*!
        @brief  Removes the mouse menu DOM element.
    */
    /******************************************************************************/
    destroy() {
        if (this.menuElem == null) {
            return;
        }
        
        this.menuElem.remove();
        this.targetElement.removeEventListener(this.mouseButton, this.trigger);
    }
    
    /******************************************************************************/
    /*!
        @brief  Disables or enables the mouse menu.
        @param  disabled            True to disable the menu
    */
    /******************************************************************************/
    setDisabled(disabled) {
        this.disabled = disabled;
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the specified items in the menu.
        @param  menuItems           Items that are in the menu
    */
    /******************************************************************************/
    setMenuItems(menuItems) {
        this.menuItems = menuItems;
        this.#render();
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified trigger elements of the menu.
        @param  newTriggerElements  Array of DOM elements the menu needs to react on
    */
    /******************************************************************************/
    setTriggerElements(newTriggerElements) {
        if (!this.trigger) {
            this.#attachEvents();
        }

        /* Normalize to array */
        if (!Array.isArray(newTriggerElements)) {
            newTriggerElements = [newTriggerElements];
        }

        /* Delete old listeners */
        this.triggerElements.forEach(elem => {
            elem.removeEventListener(this.mouseButton, this.trigger);
        });

        /* Reset set */
        this.triggerElements.clear();

        /* Add new */
        newTriggerElements.forEach(elem => {
            if (!elem) return;

            elem.addEventListener(this.mouseButton, this.trigger);
            this.triggerElements.add(elem);
        });
    }

    /******************************************************************************/
    /*!
        @brief  Adds the specified trigger element to the menu.
        @param  triggerElement      Trigger DOM element
    */
    /******************************************************************************/
    addTriggerElement(triggerElement) {
        if (!triggerElement || this.triggerElements.has(triggerElement)) return;

        triggerElement.addEventListener(this.mouseButton, this.trigger);
        this.triggerElements.add(triggerElement);
    }

    /******************************************************************************/
    /*!
        @brief  Removes the specified trigger element from the menu.
        @param  triggerElement      Trigger DOM element
    */
    /******************************************************************************/
    removeTriggerElement(triggerElement) {
        if (!triggerElement || !this.triggerElements.has(triggerElement)) return;

        triggerElement.removeEventListener(this.mouseButton, this.trigger);
        this.triggerElements.delete(triggerElement);
    }
    
    /******************************************************************************/
    /*!
        @brief  Renders the mouse menu DOM element.
    */
    /******************************************************************************/
    #render() {
        this.menuElem.innerHTML = "";

        for (const item of this.menuItems) {
            this.#generateMenuItem(item, this.menuElem);
        }
    }
    
    /******************************************************************************/
    /*!
        @brief  Generates the specified menu item DOM element.
        @param  item                Menu item to generate
        @param  parentElem          DOM element to put the item in
    */
    /******************************************************************************/
    #generateMenuItem(item, parentElem) {
        const itemContainer = document.createElement("div");
        itemContainer.className = "mouse-context-menu-item";
        itemContainer.setAttribute("role", "menuitem");
        itemContainer.tabIndex = 0;

        const itemIcon = document.createElement("i");
        itemIcon.className = item.icon || "";

        const itemText = document.createElement("p");
        itemText.style.margin = "0";
        itemText.textContent = item.text;

        itemContainer.appendChild(itemIcon);
        itemContainer.appendChild(itemText);

        /* Click handler */
        if (item.onclickFunction) {
            const executeItem = (e) => {
                e.stopPropagation();
                item.onclickFunction(e);
                this.hide();
            };
            itemContainer.addEventListener("click", executeItem);
            itemContainer.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    executeItem(event);
                }
            });
        }

        /* Submenu */
        if (item.submenu && Array.isArray(item.submenu)) {
            const caret = document.createElement("i");
            caret.className = "fa-solid fa-caret-right";
            itemContainer.appendChild(caret);

            const submenuElem = document.createElement("div");
            submenuElem.className = "submenu";

            for (const subItem of item.submenu) {
                this.#generateMenuItem(subItem, submenuElem);                       //Recursion via class method
            }

            itemContainer.appendChild(submenuElem);

            itemContainer.addEventListener("mouseenter", () => {
                clearTimeout(this.hideSubmenuTimeout);
                submenuElem.classList.add("hover");
            });

            itemContainer.addEventListener("mouseleave", () => {
                this.hideSubmenuTimeout = setTimeout(() => {
                    submenuElem.classList.remove("hover");
                }, 50);
            });

            itemContainer.addEventListener("click", (event) => {
                if (event.target.closest(".submenu")) {
                    return;
                }

                event.stopPropagation();
                submenuElem.classList.toggle("hover");
            });
        }

        parentElem.appendChild(itemContainer);
    }

    /******************************************************************************/
    /*!
        @brief  Attaches the hide and show trigger events.
    */
    /******************************************************************************/
    #attachEvents() {
        if (this._eventsAttached) return;
        this._eventsAttached = true;

        this.trigger = (e) => {
            if (this.mouseButton === RIGHT_MOUSE_BUTTON) {
                e.preventDefault();
            }

            if (this.disabled) return;

            this.show(e.clientX, e.clientY);
        };

        this._onWindowClick = () => {
            if (this.visible) this.hide();
        };

        this._onWindowScroll = () => {
            if (this.visible) this.hide();
        };

        this._onWindowKeyDown = (event) => {
            if (event.key === "Escape" && this.visible) {
                event.preventDefault();
                this.hide();
            }
        };

        this._onWindowResize = () => {
            if (this.visible) this.hide();
        };

        this.menuElem.addEventListener("mouseenter", () => {
            clearTimeout(this.hideTimeout);
        });

        this.menuElem.addEventListener("mouseleave", () => {
            this.hideTimeout = setTimeout(() => this.hide(), 50);
        });

        window.addEventListener("click", this._onWindowClick);
        window.addEventListener("scroll", this._onWindowScroll);
        window.addEventListener("keydown", this._onWindowKeyDown);
        window.addEventListener("resize", this._onWindowResize);
    }
}
