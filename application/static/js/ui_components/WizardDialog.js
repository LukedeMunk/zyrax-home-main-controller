/******************************************************************************/
/*
 * File:    WizardDialog.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 *
 * Brief:   Renders successive screens in a native dialog.
 */
/******************************************************************************/
class WizardDialog {
    /******************************************************************************/
    /*!
        @brief  Binds the component to its dialog element.
        @param  dialogElem            Native dialog element
    */
    /******************************************************************************/
    constructor(dialogElem) {
        this.dialogElem = dialogElem;
    }

    /******************************************************************************/
    /*!
        @brief  Shows a screen with a header, content and footer actions.
        @param  stage                 Step label
        @param  title                 Dialog title
        @param  renderContent         Content builder
        @param  actions               Footer buttons
    */
    /******************************************************************************/
    show(stage, title, renderContent, actions = []) {
        const headerElem = catalogElement("header", "catalog-row");
        const headingElem = catalogElement("div");
        const titleElem = catalogElement("h2", "", title);
        titleElem.id = "catalogWizardTitle";
        headingElem.append(catalogElement("small", "catalog-eyebrow", stage),
            titleElem);
        const closeBtnElem = catalogButton(TEXT_CATALOG_CLOSE_ICON, () => this.close());
        closeBtnElem.setAttribute("aria-label", TEXT_CATALOG_CLOSE);
        headerElem.append(headingElem, closeBtnElem);

        const contentElem = catalogElement("div", "catalog-dialog-body");
        const footerElem = catalogElement("footer", "catalog-row");
        renderContent(contentElem);
        footerElem.append(...actions);

        this.dialogElem.replaceChildren(headerElem, contentElem, footerElem);
        if (!this.dialogElem.open) this.dialogElem.showModal();
        this.dialogElem.scrollTop = 0;
    }

    /******************************************************************************/
    /*!
        @brief  Closes the active screen.
    */
    /******************************************************************************/
    close() {
        this.dialogElem.close();
    }
}
