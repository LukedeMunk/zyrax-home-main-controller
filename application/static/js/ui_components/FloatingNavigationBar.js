/******************************************************************************/
/*
 * File:    FloatingNavigationBar.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Floating navigation bar class to handle the navigation troughout the
 *          application.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
const NAVIGATION_BUTTON_PAGE = 0;
const NAVIGATION_BUTTON_IMAGE = 1;

//#region Example configuration /*X*/ = required
//const EXAMPLE_NAVIGATION_BAR_CONFIGURATION = {
//    id: "navBar",
//    location: "bottom",
//    buttons: [
//        {
//            id: "navBtn1",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_PAGE,
//            pages: [APPLICATION_CONFIGURATION_PAGE],
//            link: "./administrator_dashboard",
//            icon: "fa-duotone fa-solid fa-gears"
//        },
//        {
//            id: "databaseConfigurationNavBtn",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_PAGE,
//            pages: [DATABASE_CONFIGURATION_PAGE],
//            text: TEXT_DATABASE,
//            link: "./database_configuration",
//            icon: "fa-duotone fa-solid fa-database",
//            subItems: [
//                {
//                    id: "tableOverviewNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-solid fa-table-cells",
//                    link: "/database_table_overview",
//                    text: TEXT_CROSSTABLE
//                },
//                {
//                    id: "priceOverviewNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-solid fa-circle-dollar",
//                    link: "/price_configuration",
//                    text: TEXT_MANAGE_MATERIALS_AND_PRICES
//                }
//            ]
//        },
//        {
//            id: "pdfConfigurationNavBtn",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_PAGE,
//            text: TEXT_PDF_CONFIGURATION,
//            pages: [PDF_CONFIGURATION_PAGE],
//            link: "./pdf_configuration",
//            icon: "fa-duotone fa-solid fa-file-pdf"
//        },
//        {
//            id: "ordersNavBtn",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_PAGE,
//            pages: [ORDERS_PAGE],
//            text: TEXT_ORDERS,
//            link: "./orders",
//            icon: "fa-duotone fa-solid fa-conveyor-belt-arm"
//        },
//        {
//            id: "orderNavBtn",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_PAGE,
//            pages: [ORDER_OVERVIEW_PAGE, ORDER_CONFIGURATION_PAGE],
//            text: TEXT_ORDER,
//            link: "./orders",
//            icon: "fa-duotone fa-solid fa-conveyor-belt-arm"
//        },
//        {
//            id: "accountNavBtn",
//            minRole: 0,
//            title: "",
//            type: NAVIGATION_BUTTON_IMAGE,
//            image: "./static/images/icon.png",
//            title: TEXT_ACCOUNT_INFORMATION,
//            subItems: [
//                {
//                    id: "manageAccountNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-regular fa-user",
//                    onclickFunction: () => redirect("/account"),
//                    text: TEXT_MANAGE_ACCOUNT
//                },
//                {
//                    id: "changePasswordNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-solid fa-key",
//                    onclickFunction: () => passwordModalObject.show(),
//                    text: TEXT_CHANGE_PASSWORD
//                },
//                {
//                    id: "helpNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-solid fa-circle-info",
//                    onclickFunction:() => downloadUserManual(),
//                    text: TEXT_HELP
//                },
//                {
//                    id: "logoutNavBtn",
//                    minRole: 0,
//                    title: "",
//                    icon: "fa-duotone fa-solid fa-arrow-right-to-arc",
//                    onclickFunction:() => logout(),
//                    text: TEXT_LOGOUT
//                },
//                {
//                    id: "versionNavBtn",
//                    text: "v0.9.0"
//                }
//            ]
//        }
//    ]
//};
//#endregion

class FloatingNavigationBar {
    /* Submenus */
    #menus = new Map();                                                     //buttonId -> menu element
    #hideTimeouts = new Map();

    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Toolbar configuration
    */
    /******************************************************************************/
    constructor(configuration=undefined) {
        if (configuration != undefined) {
            this.setConfiguration(configuration);
        }

        window.addEventListener("scroll", () => this.#closeAll());
        window.addEventListener("contextmenu", () => this.#closeAll());
    }

    /******************************************************************************/
    /*!
        @brief  Sets the configuration of the toolbar.
        @param  configuration       Toolbar configuration
    */
    /******************************************************************************/
    setConfiguration(configuration) {
        this.buttons = configuration.buttons;

        this.id = configuration.id;
        this.location = configuration.location ?? "bottom";
        this.userRole = configuration.userRole;
        
        this.navigationBarId = this.id + "floatingNavigationBar";
    }

    /******************************************************************************/
    /*!
        @brief  Sets the user role of the current user. To render only the
                accessable buttons for the user.
        @param  userRole            Role of the user
    */
    /******************************************************************************/
    setUserRole(userRole) {
        this.userRole = userRole;
        this.render();
    }

    /******************************************************************************/
    /*!
        @brief  Renders the toolbar DOM element.
    */
    /******************************************************************************/
    render() {
        /* Remove previous instance if it exists */
        document.getElementById(this.id)?.closest("footer")?.remove();

        const footerContainerElem = document.createElement("footer");
        const navigationBarElem = document.createElement("nav");
        navigationBarElem.id = this.id;
        
        footerContainerElem.appendChild(navigationBarElem);
        document.body.appendChild(footerContainerElem);

        /* Build bar */
        let previousType = this.buttons[0].type;

        for (let button of this.buttons) {
            /* RBAC check */
            if (!this.#hasAccess(button)) {
                continue;
            }

            let currentType = button.type;

            /* Insert separator only if previous and current button are different types */
            if (previousType != currentType) {
                let separator = document.createElement("div");
                separator.className = "separator";
                navigationBarElem.appendChild(separator);
            }

            navigationBarElem.appendChild(this.#renderButton(button));

            if (button.subItems && button.subItems.length > 0) {
                this.#renderSubmenu(button);
            }

            previousType = currentType;
        }

        if (this.location == "bottom") {
            navigationBarElem.style.bottom = "16px";
            navigationBarElem.style.left = "50%";
            navigationBarElem.style.transform = "translateX(-50%)";
        } else if (this.location == "top") {
            navigationBarElem.style.top = "16px";
            navigationBarElem.style.left = "50%";
            navigationBarElem.style.transform = "translateX(-50%)";
        } else if (this.location == "left") {
            navigationBarElem.style.left = "16px";
            navigationBarElem.style.bottom = "50%";
            navigationBarElem.style.transform = "translateY(50%)";
            navigationBarElem.style.flexDirection = "column";
        } else if (this.location == "right") {
            navigationBarElem.style.right = "16px";
            navigationBarElem.style.bottom = "50%";
            navigationBarElem.style.transform = "translateY(50%)";
            navigationBarElem.style.flexDirection = "column";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the button visibility.
        @param  buttonId            ID of the button
        @param  visible             True if is visible
    */
    /******************************************************************************/
    setButtonSelected(buttonId, selected) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const buttonElem = document.getElementById(buttonId);

        if (selected) {
            buttonElem.classList.add("selected");
        } else {
            buttonElem.classList.remove("selected");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the button visibility.
        @param  buttonId            ID of the button
        @param  visible             True if is visible
    */
    /******************************************************************************/
    setButtonsDeselected() {
        for (const button of this.buttons) {
            const buttonElem = document.getElementById(button.id);
            buttonElem.classList.remove("selected");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the button visibility.
        @param  buttonId            ID of the button
        @param  visible             True if is visible
    */
    /******************************************************************************/
    setButtonVisibility(buttonId, visible) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const buttonElem = document.getElementById(buttonId);

        button.visible = visible;
        if (visible) {
            buttonElem.style.display = "flex";
        } else {
            buttonElem.style.display = "none";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified text to the button.
        @param  buttonId            ID of the button
        @param  text                Text to set
    */
    /******************************************************************************/
    setButtonText(buttonId, text) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const buttonElem = document.getElementById(buttonId + "Title");

        button.text = text;
        buttonElem.textContent = button.text;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified icon to the button.
        @param  buttonId            ID of the button
        @param  icon                Icon to set
    */
    /******************************************************************************/
    setButtonIcon(buttonId, icon) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const buttonElem = document.getElementById(buttonId + "Icon");

        button.icon = icon;
        buttonElem.classList = button.icon;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified icon to the button.
        @param  buttonId            ID of the button
        @param  icon                Icon to set
    */
    /******************************************************************************/
    setButtonImage(buttonId, imageSrc) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const imageElem = document.getElementById(buttonId + "Image");

        button.image = imageSrc;
        imageElem.src = button.image;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified URL link to the button.
        @param  buttonId            ID of the button
        @param  link                Link to set
    */
    /******************************************************************************/
    setButtonLink(buttonId, link) {
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        const buttonElem = document.getElementById(buttonId);

        button.link = link;
        buttonElem.href = button.link;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified notification badge to the button.
        @param  buttonId                ID of the button
        @param  type                    Type of notification (error, warning, etc.)
        @param  numberOfNotifications   Number of notifications
        @param  title                   Cursor title to set
    */
    /******************************************************************************/
    setButtonNotificationBadge(buttonId, type, numberOfNotifications, title="") {
        const buttonElem = document.getElementById(buttonId);
        if (buttonElem == null) {
            return;
        }
        
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        button.numberOfNotifications = numberOfNotifications;
        button.notificationType = type;
        buttonElem.replaceWith(this.#renderButton(button, title));

        if (button.subItems && button.subItems.length > 0) {
            this.#renderSubmenu(button)
        }
    }

    /******************************************************************************/
    /*!
        @brief  Removes the specified notification badge to the button.
        @param  buttonId                ID of the button
    */
    /******************************************************************************/
    removeButtonNotificationBadge(buttonId) {
        const buttonElem = document.getElementById(buttonId);
        if (buttonElem == null) {
            return;
        }
        
        const button = this.buttons[getIndexFromId(this.buttons, buttonId)];
        button.numberOfNotifications = undefined;
        button.notificationType = undefined;
        buttonElem.replaceWith(this.#renderButton(button));

        if (button.subItems && button.subItems.length > 0) {
            this.#renderSubmenu(button)
        }
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified button DOM element.
        @param  button              Object with button data
        @param  title               Cursor title to set
        @return                     DOM element
    */
    /******************************************************************************/
    #renderButton(button, title=undefined) {
        let buttonElem;

        /* Create the button element */
        if (button.type == NAVIGATION_BUTTON_PAGE) {
            buttonElem = document.createElement("a");
            buttonElem.title = title ?? button.title ?? "";
            buttonElem.className = "button-item";
            if (button.link) {
                buttonElem.href = button.link;
            }
            buttonElem.onclick = button.onclickFunction ?? null;
            if (button.pages && button.pages.includes(page)) {
                buttonElem.classList.add("selected");                               //Mark active
            }
        } else if (button.type == NAVIGATION_BUTTON_IMAGE) {
            buttonElem = document.createElement("div");
            buttonElem.title = title ?? button.title ?? "";
            buttonElem.className = "button-item";
            buttonElem.onclick = button.onclickFunction ?? null;
        }
        
        if (button.icon) {
            const iconElem = document.createElement("i");
            iconElem.id = button.id + "Icon";
            iconElem.className = button.icon;
            buttonElem.appendChild(iconElem);
        } else if (button.image) {
            const imageElem = document.createElement("img");
            imageElem.id = button.id + "Image";
            imageElem.className = "button-item";
            imageElem.src = button.image;

            buttonElem.style.padding = "5px";
            buttonElem.style.marginRight = "7px";
            buttonElem.style.flexDirection = "column";
            buttonElem.appendChild(imageElem);
        }

        if (button.numberOfNotifications && button.numberOfNotifications > 0) {
            const notificationElem = document.createElement("span");
            notificationElem.className = "nav-notification-badge";
            notificationElem.textContent = button.numberOfNotifications;

            if (button.notificationType == MESSAGE_TYPE_ERROR) {
                notificationElem.style.background = "var(--row-red)";
            } else if (button.notificationType == MESSAGE_TYPE_WARNING) {
                notificationElem.style.background = "var(--row-orange)";
            } else if (button.notificationType == MESSAGE_TYPE_SUCCESS) {
                notificationElem.style.background = "var(--row-green)";
            }

            buttonElem.appendChild(notificationElem);
        }

        if (button.text) {
            const titleElem = document.createElement("p");
            titleElem.id = button.id + "Title";
            titleElem.textContent = button.text;
            titleElem.className = "navigation-item-title";

            buttonElem.style.rowGap = "3px";
            buttonElem.appendChild(titleElem);
        }

        buttonElem.id = button.id;
            
        return buttonElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the sub menu of the specified button.
        @param  button              Object with button data
    */
    /******************************************************************************/
    #renderSubmenu(button) {
        let trigger = document.getElementById(button.id);

        /* Hover listeners */
        if (!trigger._submenuBound) {
            trigger.addEventListener("mouseenter", () => this.#openMenu(button));
            trigger.addEventListener("mouseleave", () => this.#scheduleClose(button.id));
            trigger._submenuBound = true;
        }

        if (this.#menus.has(button.id)) return;                                      //Already exists

        /* Generate menu */
        const menuElem = document.createElement("div");
        menuElem.className = "navigation-submenu";

        /* Add menu items */
        for (let i = 0; i < button.subItems.length; i++) {
            let item = button.subItems[i];

            /* RBAC check */
            if (!this.#hasAccess(item)) {
                continue;
            }

            let entry = item.link ? document.createElement("a") : document.createElement("p");
            entry.className = "navigation-submenu-item";
            entry.title = item.title ?? "";
            
            if (item.link) {
                entry.classList.add("clickable");
                entry.href = item.link;
                if (item.link.includes("https://")) {
                    entry.target = "_blank";                                        //Open in new tab
                    entry.rel = "noopener noreferrer";                              //No access to window.opener
                }
            }
            
            if (item.onclickFunction) {
                entry.classList.add("clickable");
                entry.onclick = item.onclickFunction;
            }

            if (item.icon) {
                let icon = document.createElement("i");
                icon.className = item.icon;
                entry.appendChild(icon);
            }

            let span = document.createElement("span");
            span.textContent = item.text;
            entry.appendChild(span);

            menuElem.appendChild(entry);
        }

        menuElem.addEventListener("mouseenter", () => this.#cancelClose(button.id));
        menuElem.addEventListener("mouseleave", () => this.#scheduleClose(button.id));

        document.body.appendChild(menuElem);
        this.#menus.set(button.id, menuElem);
    }
    
    /******************************************************************************/
    /*!
        @brief  Opens the menu of the specified button.
        @param  button              Object with button data
    */
    /******************************************************************************/
    #openMenu(button) {
        const buttonElem = document.getElementById(button.id);
        const menuElem = this.#menus.get(button.id);

        if (!menuElem || !buttonElem) return;

        this.#cancelClose(button.id);
        this.#closeAll(button.id);

        const rect = buttonElem.getBoundingClientRect();

        requestAnimationFrame(() => {
            const menuHeight = menuElem.offsetHeight;
            const centerX = rect.left + rect.width / 2;
            const topY = rect.top;
            const verticalOffset = 12;

            menuElem.style.left = `${centerX}px`;
            menuElem.style.top = `${topY - menuHeight - verticalOffset}px`;

            menuElem.classList.add("show");
            menuElem.classList.remove("hide");
        });
    }

    /******************************************************************************/
    /*!
        @brief  Closes the menu of the specified button after a short delay for
                better UX experience.
        @param  buttonId            ID of the button
    */
    /******************************************************************************/
    #scheduleClose(buttonId) {
        this.#hideTimeouts.set(
            buttonId,
            setTimeout(() => this.#closeMenu(buttonId), 100)
        );
    }

    /******************************************************************************/
    /*!
        @brief  Cancels the scheduled closing of the menu of the specified button.
        @param  buttonId            ID of the button
    */
    /******************************************************************************/
    #cancelClose(buttonId) {
        clearTimeout(this.#hideTimeouts.get(buttonId));
    }

    /******************************************************************************/
    /*!
        @brief  Closes the menu of the specified button.
        @param  buttonId            ID of the button
    */
    /******************************************************************************/
    #closeMenu(buttonId) {
        const menuElem = this.#menus.get(buttonId);
        if (!menuElem) return;

        menuElem.classList.remove("show");
        menuElem.classList.add("hide");
    }

    /******************************************************************************/
    /*!
        @brief  Closes all menus.
        @param  excludeId           Menu ID to not close
    */
    /******************************************************************************/
    #closeAll(excludeId=null) {
        for (let [id] of this.#menus) {
            if (id == excludeId) {
                continue;
            }
            
            this.#closeMenu(id);
        }
    }
    
    /******************************************************************************/
    /*!
        @brief  Checks whether the user has access to the specified button based on
                the user role.
        @param  button              Object with button data
        @return                     True when has access
    */
    /******************************************************************************/
    #hasAccess(button) {
        if (button.minRole === undefined || this.userRole === undefined) return true;

        return userRole <= button.minRole;
    }
}