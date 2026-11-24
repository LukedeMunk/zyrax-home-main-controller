/****************************************************************************/
/*
 * File:    ConfirmationDialog.js
 * Brief:   Shows a modal confirmation above the active editor.
 */
/****************************************************************************/
import { button, element } from "../../vendor/templates/js/core/dom.js";

export class ConfirmationDialog {
    /****************************************************************************/
    /*!
     * @brief   Opens a confirmation and resolves with the user's choice.
     * @param   options                 Labels, message and action severity.
     */
    /****************************************************************************/
    confirm({ title, message, type, confirmLabel, cancelLabel }) {
        if (this.dialog?.open) return Promise.resolve(false);

        const dialog = element("dialog", {
            className: "modal show confirmation-dialog",
            attributes: { role: "alertdialog", "aria-label": title }
        });
        const cancel = button({ text: cancelLabel });
        const confirm = button({ text: confirmLabel, className: "button-" + type });
        cancel.autofocus = true;
        cancel.onclick = () => dialog.close();
        confirm.onclick = () => dialog.close("confirm");
        dialog.append(element("h2", { text: title }), element("p", { text: message }),
            element("div", { className: "modal-form-actions" }, [cancel, confirm]));
        dialog.addEventListener("keydown", event => {
            if (event.key === "Escape") event.stopPropagation();
        });
        document.body.append(dialog);
        this.dialog = dialog;

        return new Promise(resolve => {
            dialog.addEventListener("close", () => {
                dialog.remove();
                if (this.dialog === dialog) this.dialog = null;
                resolve(dialog.returnValue === "confirm");
            }, { once: true });
            dialog.showModal();
        });
    }

    /****************************************************************************/
    /*!
     * @brief   Cancels a pending confirmation when the owning page closes.
     */
    /****************************************************************************/
    destroy() {
        this.dialog?.close();
    }
}
