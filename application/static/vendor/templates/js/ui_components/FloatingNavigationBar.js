/******************************************************************************
 *
 * File:    FloatingNavigationBar.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders an accessible floating page navigation control.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {button, element, icon} from "../core/dom.js";

const NAVIGATION_LOCATIONS = new Set(["top", "right", "bottom", "left"]);

export class FloatingNavigationBar extends Component {
    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();

        const location = normalizeNavigationLocation(this.props.location);
        const items = (this.props.items ?? []).filter(item =>
            navigationHasAccess(item, this.props.userRole) && item.visible !== false
        );

        const menuClass = items.some(item => item.items?.length > 0) ? " has-menu" : "";
        const navigation = element("nav", {
            className: `floating-navigation-bar ${location}${menuClass}`,
            attributes: {"aria-label": this.props.label ?? "Main navigation"}
        });

        for (const item of items) {
            const menuItems = getVisibleNavigationItems(item.items, this.props.userRole);

            if (menuItems.length > 0) {
                const menuElem = createNavigationMenu(item, menuItems);

                bindNavigationMenuActions(this, menuElem, menuItems);
                this.listen(menuElem, "keydown", closeNavigationMenuOnEscape);
                navigation.append(menuElem);
                continue;
            }

            const controlElem = createNavigationControl(item);

            if (item.href) {
                navigation.append(controlElem);
            } else {
                /******************************************************************************/
                /*!
                 * @brief   Reports the selected navigation action.
                 */
                /******************************************************************************/
                const reportAction = () => this.emit("action", {action: item.action, item});

                this.listen(controlElem, "click", reportAction);
                navigation.append(controlElem);
            }
        }

        this.root.replaceChildren(navigation);
    }
}

/******************************************************************************/
/*!
 * @brief   Filters optional submenu items using the normal access rules.
 * @param   items                Optional submenu item collection.
 * @param   role                 Active user role.
 * @returns object[]            Visible and accessible submenu items.
 */
/******************************************************************************/
function getVisibleNavigationItems(items, role) {
    if (!Array.isArray(items)) return [];

    return items.filter(item => navigationHasAccess(item, role) && item.visible !== false);
}

/******************************************************************************/
/*!
 * @brief   Creates an accessible disclosure menu for one navigation item.
 * @param   item                 Parent navigation item.
 * @param   menuItems            Visible submenu items.
 * @returns HTMLDetailsElement  Rendered navigation disclosure.
 */
/******************************************************************************/
function createNavigationMenu(item, menuItems) {
    const accessibleName = item.label ?? item.title ?? item.action ?? "Navigation menu";
    const summaryChildren = [];

    if (item.icon) summaryChildren.push(icon(item.icon));
    if (item.label) {
        summaryChildren.push(element("span", {
            className: "navigation-item-title",
            text: item.label
        }));
    }

    summaryChildren.push(icon(
        "navigation-menu-indicator fa-solid fa-chevron-down"
    ));

    const summaryElem = element("summary", {
        className: "navigation-item navigation-menu-trigger",
        attributes: {
            title: item.title ?? accessibleName,
            "aria-label": item.label ? undefined : accessibleName
        }
    }, summaryChildren);

    const listElem = element("ul", {
        className: "navigation-submenu",
        attributes: {"aria-label": accessibleName}
    });

    for (const menuItem of menuItems) {
        listElem.append(element("li", {}, [createNavigationMenuControl(menuItem)]));
    }

    return element("details", {className: "navigation-menu"}, [summaryElem, listElem]);
}

/******************************************************************************/
/*!
 * @brief   Creates a semantic link or action button inside a navigation menu.
 * @param   item                 Submenu item configuration.
 * @returns HTMLElement         Rendered submenu control.
 */
/******************************************************************************/
function createNavigationMenuControl(item) {
    const accessibleName = item.label ?? item.title ?? item.action ?? "Navigation item";

    if (item.href) {
        const children = [];

        if (item.icon) children.push(icon(item.icon));
        if (item.label) children.push(element("span", {text: item.label}));

        return element("a", {
            className: "navigation-submenu-item",
            attributes: {
                href: item.href,
                title: item.title ?? accessibleName,
                "aria-label": item.label ? undefined : accessibleName
            }
        }, children);
    }

    return button({
        text: item.label,
        iconClass: item.icon,
        title: item.title ?? accessibleName,
        className: "navigation-submenu-item",
        disabled: item.disabled,
        dataset: {navigationAction: item.action ?? ""}
    });
}

/******************************************************************************/
/*!
 * @brief   Connects submenu action buttons to the component event contract.
 * @param   component            Floating-navigation component instance.
 * @param   menuElem             Menu containing the action buttons.
 * @param   menuItems            Submenu item configurations.
 */
/******************************************************************************/
function bindNavigationMenuActions(component, menuElem, menuItems) {
    const actionElems = menuElem.querySelectorAll("[data-navigation-action]");

    for (const actionElem of actionElems) {
        const item = menuItems.find(candidate =>
            String(candidate.action ?? "") === actionElem.dataset.navigationAction
        );

        if (!item) continue;

        /**********************************************************************/
        /*!
         * @brief   Closes the menu and reports the selected submenu action.
         */
        /**********************************************************************/
        const reportAction = () => {
            menuElem.removeAttribute("open");

            component.emit("action", {action: item.action, item});
        };
        component.listen(actionElem, "click", reportAction);
    }
}

/******************************************************************************/
/*!
 * @brief   Closes a navigation submenu when Escape is pressed.
 * @param   event                Keyboard event from the disclosure menu.
 */
/******************************************************************************/
function closeNavigationMenuOnEscape(event) {
    if (event.key !== "Escape") return;

    event.preventDefault();
    event.currentTarget.removeAttribute("open");
    event.currentTarget.querySelector("summary")?.focus();
}

/******************************************************************************/
/*!
 * @brief   Normalizes a requested navigation location.
 * @param   location             Requested top, right, bottom, or left location.
 * @returns string              Supported location, defaulting to bottom.
 */
/******************************************************************************/
export function normalizeNavigationLocation(location) {
    return NAVIGATION_LOCATIONS.has(location) ? location : "bottom";
}

/******************************************************************************/
/*!
 * @brief   Creates a semantic link or action button for one navigation item.
 * @param   item                 Navigation item configuration.
 * @returns HTMLElement         Rendered navigation control.
 */
/******************************************************************************/
function createNavigationControl(item) {
    const accessibleName = item.label ?? item.title ?? item.action ?? "Navigation item";
    const className = `navigation-item${item.selected ? " selected" : ""}`;

    if (item.href) {
        const children = [];

        if (item.icon) children.push(icon(item.icon));
        if (item.label) {
            children.push(element("span", {className: "navigation-item-title", text: item.label}));
        }

        const attributes = {
            href: item.href,
            title: item.title ?? accessibleName,
            "aria-label": item.label ? undefined : accessibleName,
            "aria-current": item.selected ? "page" : undefined
        };

        return element("a", {className, attributes}, children);
    }

    const controlElem = button({
        text: item.label,
        iconClass: item.icon,
        title: item.title ?? accessibleName,
        className,
        disabled: item.disabled,
        dataset: {action: item.action ?? ""}
    });
    controlElem.querySelector("span")?.classList.add("navigation-item-title");

    if (!item.label) controlElem.setAttribute("aria-label", accessibleName);
    if (item.selected) controlElem.setAttribute("aria-pressed", "true");

    return controlElem;
}

/******************************************************************************/
/*!
 * @brief   Determines whether a user role may access a navigation item.
 * @param   item                 Navigation item to inspect.
 * @param   role                 Active user role.
 * @returns boolean             Whether the item is accessible.
 */
/******************************************************************************/
function navigationHasAccess(item, role) {
    return item.minRole === undefined || role === undefined || role <= item.minRole;
}
