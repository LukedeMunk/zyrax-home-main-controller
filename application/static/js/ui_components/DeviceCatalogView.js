/******************************************************************************/
/*
 * File:    DeviceCatalogView.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 *
 * Brief:   Renders catalog cards and controls.
 */
/******************************************************************************/

/******************************************************************************/
/*!
    @brief  Creates a catalog element with optional plain text.
    @param  tag                   HTML tag
    @param  className             CSS class
    @param  text                  Plain text
    @returns                      New HTML element
*/
/******************************************************************************/
function catalogElement(tag, className = "", text = "") {
    const elem = document.createElement(tag);
    elem.className = className;
    elem.textContent = text;
    return elem;
}

/******************************************************************************/
/*!
    @brief  Creates a catalog button.
    @param  text                  Button label
    @param  action                Click callback
    @param  className             CSS class
    @returns                      New button
*/
/******************************************************************************/
function catalogButton(text, action, className = "") {
    const buttonElem = catalogElement("button", className, text);
    buttonElem.type = "button";
    buttonElem.addEventListener("click", action);
    return buttonElem;
}

/******************************************************************************/
/*!
    @brief  Creates the icon used on cards and choices.
    @param  icon                  Icon class
    @returns                      Icon element
*/
/******************************************************************************/
function catalogIcon(icon) {
    const elem = catalogElement("span", "catalog-icon");
    const glyphElem = catalogElement("i", icon);
    glyphElem.setAttribute("aria-hidden", "true");
    elem.append(glyphElem);
    return elem;
}

/******************************************************************************/
/*!
    @brief  Renders a preview-style tile with an icon and status.
    @param  details               Card contents
    @param  action                Click callback
    @returns                      Card button
*/
/******************************************************************************/
function catalogCard(details, action) {
    const {title, subtitle, icon, badge, status, isOnline} = details;
    const buttonElem = catalogButton("", action, "catalog-card");
    const topElem = catalogElement("span", "catalog-row");
    topElem.append(catalogIcon(icon), catalogElement("span", "catalog-badge",
        badge));
    const bottomElem = catalogElement("span", "catalog-row");
    const statusClass = isOnline == null ? "" : isOnline ? "catalog-online" : "catalog-offline";
    bottomElem.append(catalogElement("span", statusClass,
        status), catalogElement("span", "", "›"));
    buttonElem.append(topElem, catalogElement("strong", "", title),
        catalogElement("small", "", subtitle), bottomElem);
    return buttonElem;
}

/******************************************************************************/
/*!
    @brief  Renders the label and native input or select.
    @param  id                    Control ID
    @param  label                 Field label
    @param  type                  Control type
    @param  value                 Initial value
    @param  options               Select options
    @returns                      Labeled control
*/
/******************************************************************************/
function catalogField(id, label, type, value = "", options = []) {
    const labelElem = catalogElement("label", "", label);
    const inputElem = catalogElement(type === "select" ? "select" : "input");
    inputElem.id = id;
    inputElem.name = id;
    if (type === "select") {
        inputElem.append(...options.map(([key, text]) => new Option(text, key)));
    } else {
        inputElem.type = type;
    }
    if (type === "checkbox") inputElem.checked = Boolean(value);
    else inputElem.value = value;
    labelElem.append(inputElem);
    return labelElem;
}
