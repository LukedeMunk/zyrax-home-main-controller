/****************************************************************************/
/*
 * File:    WizardDialog.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Renders successive screens in a native dialog.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { button } from "../../vendor/templates/js/core/dom.js";
import { TEXT_CATALOG_CLOSE } from "../domain/language_pack_english.js";
import { Component } from "../../vendor/templates/js/core/component.js";
import { catalogElement } from "./catalog_view.js";

export class WizardDialog extends Component {
    /****************************************************************************/
    /*!
     * @brief   Binds the component to its dialog element.
     * @param   dialogElem              Native dialog element
     */
    /****************************************************************************/
    render() {
        this.dialogElem = this.root;
    }

    /****************************************************************************/
    /*!
     * @brief   Shows a screen with a header, content and footer actions.
     * @param   stage                   Step label
     * @param   title                   Dialog title
     * @param   renderContent           Content builder
     * @param   actions                 Footer buttons
     */
    /****************************************************************************/
    show(stage, title, renderContent, actions = []) {
        const headerElem = catalogElement("header", "catalog-row");
        const headingElem = catalogElement("div");
        const titleElem = catalogElement("h2", "", title);

        titleElem.id = "catalogWizardTitle";
        headingElem.append(catalogElement("small", "catalog-eyebrow", stage), titleElem);

        const closeBtnElem = button({
            iconClass: "fa-solid fa-xmark",
            className: "close-modal-button"
        });
        closeBtnElem.setAttribute("aria-label", TEXT_CATALOG_CLOSE);

        /****************************************************************************/
        /*!
         * @brief   Runs the action bound to the selected control.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        closeBtnElem.onclick = () => this.close();
        headerElem.append(headingElem, closeBtnElem);

        const contentElem = catalogElement("div", "catalog-dialog-body");
        const footerElem = catalogElement("footer", "modal-form-actions");

        renderContent(contentElem);
        footerElem.append(...actions);

        this.dialogElem.replaceChildren(headerElem, contentElem, footerElem);
        this.props.stack.open(this.dialogElem, {
            /****************************************************************************/
            /*!
             * @brief   Closes the dialog when its modal stack requests dismissal.
             */
            /****************************************************************************/
            onRequestClose: () => {
                const cancel = new Event("cancel", { cancelable: true });
                if (this.dialogElem.dispatchEvent(cancel)) this.close();
            }
        });
        this.dialogElem.scrollTop = 0;
    }

    /****************************************************************************/
    /*!
     * @brief   Closes the active screen.
     */
    /****************************************************************************/
    destroy() {
        this.close();
        super.destroy();
    }

    /****************************************************************************/
    /*!
     * @brief   Closes the active dialog through its modal stack.
     */
    /****************************************************************************/
    close() {
        this.props.stack.close(this.dialogElem);
    }
}
