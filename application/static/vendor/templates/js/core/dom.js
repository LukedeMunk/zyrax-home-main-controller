/******************************************************************************
 *
 * File:    dom.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Provides small helpers for creating accessible DOM elements.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/

/******************************************************************************/
/*!
 * @brief   Creates and configures a DOM element.
 * @param   tagName              Value supplied for tagName.
 * @param   options              Value supplied for options.
 * @param   children             Value supplied for children.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function element(tagName, options = {}, children = []) {
    const node = document.createElement(tagName);

    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = String(options.text);
    if (options.type) node.type = options.type;
    for (const [name, value] of Object.entries(options.attributes ?? {})) {
        if (value !== undefined && value !== null) node.setAttribute(name, String(value));
    }

    Object.assign(node.dataset, options.dataset ?? {});
    node.append(...children.filter(Boolean));

    return node;
}

/******************************************************************************/
/*!
 * @brief   Creates an accessible icon element.
 * @param   className            Value supplied for className.
 * @param   label                Value supplied for label.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function icon(className, label = "") {
    return element("i", {
        className,
        attributes: label ? {"aria-label": label, title: label} : {"aria-hidden": "true"}
    });
}

/******************************************************************************/
/*!
 * @brief   Creates a configured button element.
 * @param   options              Value supplied for options.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function button({text, iconClass, title, className = "", disabled = false, dataset = {}} = {}) {
    const children = [];

    if (iconClass) children.push(icon(iconClass));
    if (text !== undefined) children.push(element("span", {text}));

    const node = element("button", {
        className,
        type: "button",
        attributes: {title},
        dataset
    }, children);
    node.disabled = disabled;

    return node;
}
