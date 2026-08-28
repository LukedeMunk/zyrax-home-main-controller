/******************************************************************************/
/*
 * File:    IconPicker.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Modal form class to generate modal forms. Provides additional
 *          features such as field validation.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Example configuration /*X*/ = required
//const EXAMPLE_ICON_PICKER_MODAL_CONFIGURATION = {
//    id: "exampleModal",
//    title: "Example modal",
//    description: "Example modal description",
//    maxWidth: "500px",
//    submitTitle: "Pick",
//    submitIcon: "Pick",
//    submitFunction: () => submitF(),
//    icons: []
//};
//#endregion

class IconPicker {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Modal structure and configuration
    */
    /******************************************************************************/
    constructor(configuration=undefined) {
        if (configuration != undefined) {
            this.setConfiguration(configuration);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the structure and configuration of the modal.
        @param  configuration       Modal structure and configuration
    */
    /******************************************************************************/
    setConfiguration(configuration) {
        this.id = configuration.id ?? "modalForm";
        this.title = configuration.title ?? "";
        this.description = configuration.description ?? "";
        this.maxWidth = configuration.maxWidth ?? "500px";
        this.icons = configuration.icons ?? [];
        this.isInitialized = true;
        this.isOpen = false;
        
        this.modalTitleId = this.id + "Title";
        this.modalDescriptionId = this.id + "Description";
        this.messageElementId = this.id + "Message";

        this.submitBtnId = this.id + "SubmitBtn";
        this.submitFunction = configuration.submitFunction;
        this.submitTitle = configuration.submitTitle ?? TEXT_SAVE;
        this.submitIcon = configuration.submitIcon ?? "fa-duotone fa-solid fa-floppy-disk fa-lg";

        this.iconContainerElem = null;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the modal DOM element.
    */
    /******************************************************************************/
    render() {
        document.getElementById(this.id)?.remove();                        //Remove existing container if it exists

        const dialogElem = this.#renderDialogElement();
        const closeBtnElem = this.#renderCloseButton();
        const modalTitleElem = this.#renderTitleElement();
        const modalDescriptionElem = this.#renderDescriptionElement();
        const messageElem = this.#renderMessageElement();
        this.iconContainerElem = this.#renderIconGridElement();

        dialogElem.appendChild(closeBtnElem);
        dialogElem.appendChild(modalTitleElem);
        dialogElem.appendChild(modalDescriptionElem);
        dialogElem.appendChild(messageElem);
        dialogElem.appendChild(this.iconContainerElem);
        
        this.setIcons(this.icons);

        const toolbarElem = this.#renderToolbar();

        dialogElem.appendChild(toolbarElem);
        document.body.appendChild(dialogElem);
    }

    /******************************************************************************/
    /*!
        @brief  Sets the modal title.
        @param  title               Title to set
    */
    /******************************************************************************/
    setTitle(title) {
        this.title = title;
        const titleElem = document.getElementById(this.modalTitleId);
        titleElem.textContent = this.title;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the modal description.
        @param  description         Description to set
    */
    /******************************************************************************/
    setDescription(description) {
        this.description = description;
        const descriptionElem = document.getElementById(this.modalDescriptionId);
        descriptionElem.textContent = this.description;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified error message.
        @param  message             Message to set
    */
    /******************************************************************************/
    setErrorMessage(message) {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.textContent = message;
        messageElem.className = "message error";
        messageElem.style.display = "inline-block";
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified warning message.
        @param  message             Message to set
    */
    /******************************************************************************/
    setWarningMessage(message) {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.textContent = message;
        messageElem.className = "message warning";
        messageElem.style.display = "inline-block";
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified success message.
        @param  message             Message to set
    */
    /******************************************************************************/
    setSuccessMessage(message) {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.textContent = message;
        messageElem.className = "message success";
        messageElem.style.display = "inline-block";
    }

    /******************************************************************************/
    /*!
        @brief  Resets the message.
    */
    /******************************************************************************/
    resetMessage() {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.style.display = "none";
    }

    /******************************************************************************/
    /*!
        @brief  Sets the submit function.
        @param  submitFunction      Function to set
    */
    /******************************************************************************/
    setSubmitFunction(submitFunction) {
        this.submitFunction = submitFunction;
        const submitBtnElem = document.getElementById(this.submitBtnId);
        submitBtnElem.onclick = this.submitFunction ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the options for the specified select field.
        @param  fieldId             ID of the field
        @param  options             Select options to set
    */
    /******************************************************************************/
    setIcons(icons) {
        this.iconContainerElem.innerHTML = "";

        for (let icon of icons) {
            const iconElem = document.createElement("i");
            iconElem.className = icon.icon + " clickable";
            iconElem.onclick = icon.onclickFunction;
            this.iconContainerElem.appendChild(iconElem);
        }
    }
    
    /******************************************************************************/
    /*!
        @brief  Shows the modal popup (with overlay).
    */
    /******************************************************************************/
    show() {
        const modalElem = document.getElementById(this.id);
        modalElem.modalInstance = this;
        modalElem.allowEscapeClose = this.allowEscapeClose;

        openModals.push(modalElem);
        this.#disablePageScrolling();

        /* Create overlay unique to this modal */
        this.#renderModalOverlay();

        modalElem.showModal();
        modalElem.classList.add("show");
        this.overlayElem.classList.add("show");
        this.isOpen = true;
    }

    /******************************************************************************/
    /*!
        @brief  Closes the modal popup.
    */
    /******************************************************************************/
    close() {
        const modalElem = document.getElementById(this.id);

        /* Remove modal from stack */
        const index = openModals.indexOf(modalElem);
        if (index !== -1) {
            openModals.splice(index, 1);
        } else {
            return;
        }

        /* Enable scrolling only when the last modal closes */
        if (openModals.length === 0) {
            this.#enablePageScrolling();
        }

        modalElem.classList.remove("show");
        this.overlayElem.classList.remove("show");

        setTimeout(() => this.overlayElem.remove(), 300);
        setTimeout(() => modalElem.close(), 300);
        this.isOpen = false;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the dialog DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderDialogElement() {
        const dialogElem = document.createElement("dialog");
        dialogElem.id = this.id;
        dialogElem.className = "modal";

        return dialogElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the close button DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderCloseButton() {
        const closeBtnElem = document.createElement("i");
        closeBtnElem.className = "fa-solid fa-xmark close-modal-button clickable";
        closeBtnElem.title = TEXT_CLOSE;
        closeBtnElem.onclick = () => this.close();

        return closeBtnElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the modal title DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTitleElement() {
        const modalTitleElem = document.createElement("h3");
        modalTitleElem.style.marginTop = "0px";
        modalTitleElem.textContent = this.title;
        modalTitleElem.id = this.modalTitleId;

        return modalTitleElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the modal description DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderDescriptionElement() {
        const modalDescriptionElem = document.createElement("p");
        modalDescriptionElem.style.marginBottom = "20px";
        modalDescriptionElem.textContent = this.description;
        modalDescriptionElem.id = this.modalDescriptionId;

        return modalDescriptionElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the message DOM element.
        @param  type                Type of the message
        @return                     DOM element
    */
    /******************************************************************************/
    #renderMessageElement(type="error") {
        const messageElem = document.createElement("h3");
        messageElem.style.margin = "0px";
        messageElem.style.marginBottom = "10px";
        messageElem.className = "message";
        messageElem.classList.add(type);
        messageElem.id = this.messageElementId;

        return messageElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified column DOM element.
        @param  column              Column to generate
        @return                     DOM element
    */
    /******************************************************************************/
    #renderIconGridElement() {
        const gridElem = document.createElement("div");
        gridElem.className = "icon-grid";

        return gridElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the toolbar DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderToolbar() {
        const containerElem = document.createElement("div");
        containerElem.className = "toolbar";
        containerElem.style.marginTop = "20px";

        const subContainerElem = document.createElement("div");
        subContainerElem.className = "toolbar-sub";

        const submitBtnElem = this.#renderSubmitButton();
        subContainerElem.appendChild(submitBtnElem);

        containerElem.appendChild(subContainerElem);

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the submit button DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderSubmitButton() {
        const buttonElem = document.createElement("button");
        buttonElem.id = this.submitBtnId;
        buttonElem.className = "toolbar-button";
        buttonElem.onclick = this.submitFunction ?? null;

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.className = this.submitIcon;

        /* Text */
        const titleElem = document.createElement("p");
        titleElem.textContent = this.submitTitle;

        buttonElem.appendChild(iconElem);
        buttonElem.appendChild(titleElem);

        return buttonElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the modal overlay DOM element.
    */
    /******************************************************************************/
    #renderModalOverlay() {
        this.overlayElem = document.createElement("div");
        this.overlayElem.className = "overlay";

        /* Insert overlay directly before the modal for correct stacking */
        if (openModals.length > 1) {
            openModals[openModals.length-2].appendChild(this.overlayElem);
        } else {
            document.body.appendChild(this.overlayElem);
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
        document.body.style.overflow = "";
    }
}