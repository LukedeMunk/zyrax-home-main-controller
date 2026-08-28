/******************************************************************************/
/*
 * File:    PasswordModalForm.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Password modal manager class to manage the password modal including
 *          password hints.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
class PasswordModalForm {
    /******************************************************************************/
    /*!
        @brief  Constructor.
    */
    /******************************************************************************/
    constructor() {
        this.allowEscapeClose = true;
        this.id = "passwordModal";
        this.messageElementId = this.id + "PasswordModalMessage";
        this.submitBtnId = this.id + "SubmitBtn";

        this.validationIcons = [
            {
                id: "pwdValidationIconLength",
                title: TEXT_LENGTH_BETWEEN_8_AND_64
            },
            {
                id: "pwdValidationIconUpperCase",
                title: TEXT_AT_LEAST_ONE_UPPER_CASE_CHARACTER
            },
            {
                id: "pwdValidationIconLowerCase",
                title: TEXT_AT_LEAST_ONE_LOWER_CASE_CHARACTER
            },
            {
                id: "pwdValidationIconNumber",
                title: TEXT_AT_LEAST_ONE_NUMBER
            },
            {
                id: "pwdValidationIconSymbol",
                title: TEXT_AT_LEAST_ONE_SYMBOL
            },
        ]

        this.fields = [
            {
                id: "currentPasswordTxt",
                iconId: "currentPasswordIcon",
                title: TEXT_CURRENT_PASSWORD,
                onclickFunction: () => this.#togglePasswordVisibility(0),
                viewable: false
            },
            {
                id: "newPasswordTxt",
                iconId: "newPasswordIcon",
                title: TEXT_NEW_PASSWORD,
                onclickFunction: () => this.#togglePasswordVisibility(1),
                viewable: false
            },
            {
                id: "retypePasswordTxt",
                iconId: "retypePasswordIcon",
                title: TEXT_RETYPE_PASSWORD,
                onclickFunction: () => this.#togglePasswordVisibility(2),
                viewable: false
            },
        ];
    }

    /******************************************************************************/
    /*!
        @brief  Generates the toolbar DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    render() {
        document.getElementById(this.id)?.remove();                                 //Remove existing container if it exists

        const dialogElem = this.#renderDialogElement();
        const closeBtnElem = this.#renderCloseButton();
        const modalTitleElem = this.#renderModalTitleElement();
        const messageElem = this.#renderMessageElement();
        const validationHintsElem = this.#renderValidationHints();

        dialogElem.appendChild(closeBtnElem);
        dialogElem.appendChild(modalTitleElem);
        dialogElem.appendChild(messageElem);
        dialogElem.appendChild(validationHintsElem);

        const columnsContainerElem = document.createElement("div");
        const columnContainerElem = this.#renderInputElements();
        columnsContainerElem.appendChild(columnContainerElem);

        dialogElem.appendChild(columnsContainerElem);

        /* Create buttons container */
        const toolbarElem = this.#renderToolbar();
        
        dialogElem.appendChild(toolbarElem);
        document.body.appendChild(dialogElem);

        this.#addEnterEventListeners();
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
        @brief  Resets the field validations and validation message.
    */
    /******************************************************************************/
    resetValidationElements() {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.style.display = "none";
        
        for (let field of this.fields) {
            const fieldElem = document.getElementById(field.id);
            fieldElem.classList.remove("invalid-input");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Resets the input values.
    */
    /******************************************************************************/
    resetValues() {
        for (let field of this.fields) {
            const fieldElem = document.getElementById(field.id);
            fieldElem.value = "";
        }
    }
    
    /******************************************************************************/
    /*!
        @brief  Shows the modal popup (with overlay).
        @param  showCloseButton True to show the close button
    */
    /******************************************************************************/
    show(showCloseButton=true) {
        this.#resetPasswordVisibility();
        this.resetValues();
        this.resetValidationElements();
        this.#updatePasswordValidationIcons();

        if (showCloseButton) {
            document.getElementById(this.id + "CloseBtn").style.display = "block";
            this.allowEscapeClose = true;
        } else {
            document.getElementById(this.id + "CloseBtn").style.display = "none";
            this.allowEscapeClose = false;
        }

        const modalElem = document.getElementById(this.id);
        modalElem.modalInstance = this;
        modalElem.allowEscapeClose = this.allowEscapeClose;

        openModals.push(modalElem);
        this.#disablePageScrolling();

        this.#renderModalOverlay();                                                 //Create overlay unique to this modal 

        modalElem.showModal();
        modalElem.classList.add("show");
        this.overlayElem.classList.add("show");
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
    }
    
    /******************************************************************************/
    /*!
        @brief  Toggles the password visibility of the specified field.
        @param  fieldIndex          Index of the field
    */
    /******************************************************************************/
    #togglePasswordVisibility(fieldIndex) {
        const field = this.fields[fieldIndex];
        const fieldElem = document.getElementById(field.id);
        const iconElem = document.getElementById(field.iconId);

        field.viewable = !field.viewable;

        if (field.viewable) {
            fieldElem.type = "text";
            iconElem.classList.remove("fa-eye");
            iconElem.classList.add("fa-eye-slash");
            iconElem.title = TEXT_DONT_SHOW_PASSWORD;
            return;
        }

        fieldElem.type = "password";
        iconElem.classList.add("fa-eye");
        iconElem.classList.remove("fa-eye-slash");
        iconElem.title = TEXT_SHOW_PASSWORD;
    }
    
    /******************************************************************************/
    /*!
        @brief  Resets the password visibility of the fields.
    */
    /******************************************************************************/
    #resetPasswordVisibility() {
        for (let field of this.fields) {
            const fieldElem = document.getElementById(field.id);
            const iconElem = document.getElementById(field.iconId);
            field.viewable = false;

            fieldElem.type = "password";
            iconElem.classList.add("fa-eye");
            iconElem.classList.remove("fa-eye-slash");
            iconElem.title = TEXT_SHOW_PASSWORD;
        }
    }

    /******************************************************************************/
    /*!
        @brief  Updates the password validation icons based on the user input.
    */
    /******************************************************************************/
    #updatePasswordValidationIcons() {
        const SYMBOL_RE = /[-\+!$%^&*()_|~=:@#;<>?,.\/\\]+/;
        const DIGIT_RE = /[0-9]+/;
        const UPPERCASE_RE = /[A-Z]+/;
        const LOWERCASE_RE = /[a-z]+/;

        const newPasswordFieldElem = document.getElementById(this.fields[1].id);
        let newPassword = newPasswordFieldElem.value;

        const pwdValidationIconLengthElem = document.getElementById(this.validationIcons[0].id);
        const pwdValidationIconUpperCaseElem = document.getElementById(this.validationIcons[1].id);
        const pwdValidationIconLowerCaseElem = document.getElementById(this.validationIcons[2].id);
        const pwdValidationIconNumberElem = document.getElementById(this.validationIcons[3].id);
        const pwdValidationIconSymbolElem = document.getElementById(this.validationIcons[4].id);

        if (newPassword.length < 8 || newPassword.length > 64) {
            pwdValidationIconLengthElem.className = "fa-solid fa-circle-xmark";
            pwdValidationIconLengthElem.style.color = "var(--warning-text)";
        } else {
            pwdValidationIconLengthElem.className = "fa-solid fa-circle-check";
            pwdValidationIconLengthElem.style.color = "var(--success-text)";
        }

        if (!newPassword.match(UPPERCASE_RE)) {
            pwdValidationIconUpperCaseElem.className = "fa-solid fa-circle-xmark";
            pwdValidationIconUpperCaseElem.style.color = "var(--warning-text)";
        } else {
            pwdValidationIconUpperCaseElem.className = "fa-solid fa-circle-check";
            pwdValidationIconUpperCaseElem.style.color = "var(--success-text)";
        }
        
        if (!newPassword.match(LOWERCASE_RE)) {
            pwdValidationIconLowerCaseElem.className = "fa-solid fa-circle-xmark";
            pwdValidationIconLowerCaseElem.style.color = "var(--warning-text)";
        } else {
            pwdValidationIconLowerCaseElem.className = "fa-solid fa-circle-check";
            pwdValidationIconLowerCaseElem.style.color = "var(--success-text)";
        }
        
        if (!newPassword.match(DIGIT_RE)) {
            pwdValidationIconNumberElem.className = "fa-solid fa-circle-xmark";
            pwdValidationIconNumberElem.style.color = "var(--warning-text)";
        } else {
            pwdValidationIconNumberElem.className = "fa-solid fa-circle-check";
            pwdValidationIconNumberElem.style.color = "var(--success-text)";
        }
        
        if (!newPassword.match(SYMBOL_RE)) {
            pwdValidationIconSymbolElem.className = "fa-solid fa-circle-xmark";
            pwdValidationIconSymbolElem.style.color = "var(--warning-text)";
        } else {
            pwdValidationIconSymbolElem.className = "fa-solid fa-circle-check";
            pwdValidationIconSymbolElem.style.color = "var(--success-text)";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Validates the password inputs.
        @return                     False if invalid, data if valid
    */
    /******************************************************************************/
    #validate() {
        this.resetValidationElements();

        let values = [];

        /* Validate fields */
        for (let field of this.fields) {
            const fieldElem = document.getElementById(field.id);
            let value = fieldElem.value;

            /* Multiple validations */
            const isNull = value == "";
            
            /* Not null check */
            if (isNull) {
                if (field.id == "currentPasswordTxt") {
                    this.#renderInvalidField(fieldElem, TEXT_INVALID_PASSWORD);
                } else {
                    this.#renderInvalidField(fieldElem, TEXT_THIS_FIELD_IS_REQUIRED);
                }
                return false;
            }

            /* NIST check */
            if (field.id == "currentPasswordTxt" && (value.length < 8 || !value.match(PASSWORD_RE))) {
                this.#renderInvalidField(fieldElem, TEXT_INVALID_PASSWORD);
                return false;
            }

            if (field.id == "newPasswordTxt" && value.length < 8) {
                this.#renderInvalidField(fieldElem, TEXT_AT_LEAST_8_CHARACTERS);
                return false;
            }

            if (field.id == "newPasswordTxt" && !value.match(PASSWORD_RE)) {
                this.#renderInvalidField(fieldElem, TEXT_PASSWORD_DOES_NOT_FULFILL_REQUIREMENTS);
                return false;
            }
            
            /* Password retype check*/
            if (field.id == "retypePasswordTxt" && values[1] != value) {
                this.#renderInvalidField(fieldElem, TEXT_PASSWORDS_NOT_IDENTICAL);
                return false;
            }

            /* Valid */
            values.push(value);
        }

        return values;
    }

    /******************************************************************************/
    /*!
        @brief  Updates the password.
    */
    /******************************************************************************/
    async #updatePassword() {
        let values = this.#validate();
        if (!values) {
            return;
        }

        let data = {
            current_password: values[0],
            password: values[1]
        }

        let result = await httpPostRequestJsonReturn("/update_password", data);
        
        if (result.status_code != HTTP_CODE_OK) {
            if (result.status_code == HTTP_CODE_UNAUTHORIZED) {
                const fieldElem = document.getElementById(this.fields[0].id);
                this.#renderInvalidField(fieldElem, result.message);
                fieldElem.value = "";
            } else {
                this.setErrorMessage(result.message);
            }
            return;
        }

        /* Print strength warning if there is any */
        if (result.message != "") {
            banners.show(TEXT_WARNING, VAR_TEXT_TEXT_PASSWORD_UPDATED_WARNING(result.message), MESSAGE_TYPE_WARNING);
        } else {
            banners.show(TEXT_SUCCESS, TEXT_PASSWORD_UPDATED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);
        }
        
        this.close();
        
        sessionStorage.setItem("update_password", 0);
        this.#updatePasswordValidationIcons();
    }

    /******************************************************************************/
    /*!
        @brief  Renders the dialog DOM element.
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
        @brief  Renders the close button DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderCloseButton() {
        const closeBtnElem = document.createElement("i");
        closeBtnElem.className = "fa-solid fa-xmark close-modal-button clickable";
        closeBtnElem.title = TEXT_CLOSE;
        closeBtnElem.id = this.id + "CloseBtn";
        closeBtnElem.addEventListener("click", () => this.close());

        return closeBtnElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the title DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderModalTitleElement() {
        const modalTitleElem = document.createElement("h3");
        modalTitleElem.style.marginTop = "0px";
        modalTitleElem.textContent = TEXT_CHANGE_PASSWORD;

        return modalTitleElem;
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
        @brief  Adds event listeners to the fields. When the user preses Enter, the
                next field is in focus. When the last field is done, the submit
                button gets focussed. This is done to increase user efficiency.
    */
    /******************************************************************************/
    #addEnterEventListeners() {
        this.fields.forEach((field, index) => {
            const fieldElem = document.getElementById(field.id);

            fieldElem.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") {
                    return;
                }

                event.preventDefault();

                const nextField = this.fields[index + 1];
                const nextInput = nextField ? document.getElementById(nextField.id) : null;
                if (nextInput) {
                    nextInput.focus();
                } else {
                    this.#updatePassword();
                }
            });
        });
    }

    /******************************************************************************/
    /*!
        @brief  Generates the input DOM elements.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderInputElements() {
        const containerElem = document.createElement("div");

        for (let field of this.fields) {
            const blockElem = this.#renderFieldWithIcons(field);
            containerElem.appendChild(blockElem);
        }

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the password hint DOM elements.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderValidationHints() {
        const containerElem = document.createElement("div");
        containerElem.className = "password-validation-container";
        
        for (let validation of this.validationIcons) {
            const validationContainerElem = document.createElement("div");
            validationContainerElem.className = "message-container";

            const iconElem = document.createElement("i");
            iconElem.id = validation.id;
            iconElem.className = "fa-solid fa-circle-xmark";
            iconElem.style.transition = "300ms";

            const titleElem = document.createElement("p");
            titleElem.style.margin = "10px 0px";
            titleElem.textContent = validation.title;

            validationContainerElem.appendChild(iconElem);
            validationContainerElem.appendChild(titleElem);
            containerElem.appendChild(validationContainerElem);
        }
        
        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified field DOM element.
        @param  field               Object with field data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderField(field) {
        const fieldContainerElem = document.createElement("div");
        fieldContainerElem.className = "input-field-container";
        fieldContainerElem.style.margin = "5px 0px";
        fieldContainerElem.style.width = "100%";

        const fieldTitleElem = document.createElement("p");
        fieldTitleElem.className = "input-field-title";
        fieldTitleElem.textContent = field.title;

        const fieldElem = this.#renderTextField(field);
        fieldElem.id = field.id;

        fieldContainerElem.appendChild(fieldTitleElem);
        fieldContainerElem.appendChild(fieldElem);

        return fieldContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified field with icons DOM element.
        @param  field               Object with field data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderFieldWithIcons(field) {
        const blockContainerElem = document.createElement("div");
        blockContainerElem.className = "input-icon-container";

        const fieldContainerElem = this.#renderField(field);

        blockContainerElem.appendChild(fieldContainerElem);

        const iconElem = document.createElement("i");
        iconElem.id = field.iconId;
        iconElem.className = "fa-duotone fa-solid fa-eye clickable";
        iconElem.style.marginTop = "13px";
        iconElem.onclick = field.onclickFunction;
        blockContainerElem.appendChild(iconElem);

        return blockContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified text field DOM element.
        @param  field               Object with field data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTextField(field) {
        const fieldElem = document.createElement("input");
        fieldElem.type = "password";
        fieldElem.className = "input-field";

        if (field.id == "newPasswordTxt") {
            fieldElem.addEventListener("keyup", () => {
                this.#updatePasswordValidationIcons();
            });
        }

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified field as invalid.
        @param  fieldElem           DOM element that is invalid
        @param  errorMessage        Error message to show
        @return                     DOM element
    */
    /******************************************************************************/
    #renderInvalidField(fieldElem, errorMessage) {
        fieldElem.classList.add("invalid-input");
        fieldElem.focus();
        this.setErrorMessage(errorMessage);

        return fieldElem;
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
        buttonElem.onclick = () => this.#updatePassword();

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.className = "fa-duotone fa-solid fa-floppy-disk fa-lg";
        buttonElem.appendChild(iconElem);

        const titleElem = document.createElement("p");
        titleElem.textContent = TEXT_SAVE;
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