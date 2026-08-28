/******************************************************************************/
/*
 * File:    ModeConfigurationModal.js
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
//const EXAMPLE_MODAL_CONFIGURATION = {
//    id: "exampleModal",
//    title: "Example modal",
//    description: "Example modal description",
//    maxWidth: "500px",
//    isBigModal: false,
//    allowEscapeClose: true,
//    submitTitle: "Submit",
//    submitIcon: "",
//    submitFunction: () => submitF(),
//    deleteFunction: () => deleteF(),
//    columnDirection: "row",
//    isMultiStep: true,
//    
//    /*X*/steps: [
//        {
//            title: "Example step",
//            previousStepTitle: "Previous",
//            nextStepTitle: "Next step",
//            columns: []
//        }
//    ]
//}
//const EXAMPLE_MODAL_CONFIGURATION = {
//    id: "exampleModal",
//    title: "Example modal",
//    description: "Example modal description",
//    maxWidth: "500px",
//    isBigModal: false,
//    allowEscapeClose: true,
//    submitTitle: "Submit",
//    submitIcon: "",
//    submitFunction: () => submitF(),
//    deleteFunction: () => deleteF(),
//    columnDirection: "row",
//    isMultiStep: false,
//    
//    /*X*/columns: [
//        {
//            title: "columnTitle",
//            isFieldset: true,
//            blocks: [
//                {
//                    blockType: MODAL_BLOCK_TYPE_INPUT,
//                    id: "inputField",
//                    title: "inputField",
//                    type: "text",
//                    disabled: true,
//                    visible: true,
//                    value: 10,
//                    placeHolder: "inputValue",
//                },
//                {
//                    blockType: MODAL_BLOCK_TYPE_MULTIPLE_INPUTS,
//                    blockId: "multiInputBlock",
//                    inputFields: [
//                        {
//                            id: "mulitInputField1",
//                            title: "numberField",
//                            disabled: false,
//                            visible: true,
//                            value: 10,
//                            placeHolder: "inputValue",
//                            width: "80%",
//                            type: "number",
//                            constraints: {
//                                min: 0
//                            },
//                            validations: [
//                                {type: VALIDATION_NOT_NULL},
//                                {type: VALIDATION_MINIMUM_VALUE, value: 0},
//                            ]
//                        },
//                        {
//                            id: "mulitInputSelect2",
//                            title: "selectField",
//                            disabled: false,
//                            visible: true,
//                            value: 1,
//                            placeHolder: "inputValue",
//                            width: "20%",
//                            type: "select",
//                            validations: [
//                                {
//                                    type: VALIDATION_NOT_NULL,
//                                    nullValue: "-1"
//                                }
//                            ],
//                            options: [
//                                {value: -1, text: ""},
//                                {value: 0, text: "Option1"},
//                                {value: 1, text: "Option2"},
//                            ]
//                        }
//                    ]
//                },
//                {
//                    blockType: MODAL_BLOCK_TYPE_INPUT_WITH_ICON,
//                    id: "iconSelect",
//                    title: "iconSelect",
//                    disabled: false,
//                    visible: true,
//                    type: "select",
//                    value: -1,
//                    placeHolder: "inputValue",
//                    validations: [
//                        {
//                            type: VALIDATION_NOT_NULL,
//                            nullValue: "-1"
//                        }
//                    ],
//                    options: [
//                        {value: -1, text: ""},
//                        {value: 0, text: "Option1"},
//                        {value: 1, text: "Option2"},
//                    ],
//                    icons: [
//                        {
//                            id: "inputIcon",
//                            title: "iconTitle",
//                            icon: "fa-duotone fa-duotone fa-solid fa-pen-circle",
//                            onclickFunction: () => example()
//                        }
//                    ],
//                    onchangeFunction: () => exampleOnchange()
//                },
//            ]
//        },
//        {
//            title: "column2Ttitle",
//            isFieldset: true,
//            blocks: [
//                {
//                    blockType: MODAL_BLOCK_TYPE_BUTTON,
//                    id: "btnId",
//                    title: "Button title",
//                    disabled: false,
//                    visible: true,
//                    width: "100%",
//                    icon: "fa-duotone fa-solid fa-calendar-users fa-lg",
//                    onclickFunction: () => onclickExample()
//                },
//                {
//                    blockType: MODAL_BLOCK_TYPE_IMAGE,
//                    blockId: "imageContainer",
//                    uploadElementId: "imageUpload",
//                    image: {id: 1, seller_id: 1, filename: "example.jpg"},
//                    previewFunction: () => { showNotImplementedBanner(); },
//                    deleteFunction: () => { showNotImplementedBanner(); },
//                    uploadFunction: () => { showNotImplementedBanner(); }
//                },
//                {
//                    blockType: MODAL_BLOCK_TYPE_IMAGES,
//                    blockId: "imagesContainer",
//                    images: [
//                        {id: 1, option_id: 1, ordering_number: 0, filename: "example.jpg"}
//                    ],
//                    previewFunction: () => { showNotImplementedBanner(); },
//                    deleteFunction: () => { showNotImplementedBanner(); },
//                    moveUpFunction: () => { showNotImplementedBanner(); },
//                    moveDownFunction: () => { showNotImplementedBanner(); },
//                    uploadFunction: () => { showNotImplementedBanner(); }
//                },
//                {
//                    blockType: MODAL_BLOCK_TYPE_TABLE,
//                    blockId: "modalTableContainer"
//                },
//            ]
//        }
//    ]
//};
//#endregion

class ModeConfigurationModal {
    #outsideMouseDownHandler;
    #closeTimeout;

    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Modal structure and configuration
    */
    /******************************************************************************/
    constructor(configuration=undefined) {
        this.isInitialized = false;
        this.isOpen = false;


        this.#outsideMouseDownHandler = this.#handleOutsideMouseDown.bind(this);    //Save function-reference for removeEventListener().

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
        this.id = "modeConfigurationModal" + (configuration.id ?? "");
        this.title = configuration.title ?? "";
        this.fields = configuration.fields ?? [];
        this.isInitialized = true;
        
        this.modalTitleId = this.id + "Title";
        this.messageElementId = this.id + "Message";
    }

    /******************************************************************************/
    /*!
        @brief  Renders the modal DOM element.
    */
    /******************************************************************************/
    render() {
        document.getElementById(this.id)?.remove();

        const dialogElem = this.#renderDialogElement();
        dialogElem.append(
            this.#renderTitleElement(),
            this.#renderMessageElement()
        );

        const containerElem = document.createElement("div");
        dialogElem.appendChild(containerElem)
        document.body.appendChild(dialogElem);

        let firstRangeField;
        for (let field of this.fields) {
            switch (field.type) {
                case MODE_PARAMETER_TYPE_COLOR_RANGE: containerElem.appendChild(this.#generateColorRangeElement(field)); this.#loadColorRangeField(field.id); break;
                case MODE_PARAMETER_TYPE_COLOR: containerElem.appendChild(this.#generateColorElement(field)); break;
                case MODE_PARAMETER_TYPE_CHECKBOX: break//containerElem.appendChild(this.#generateCheckboxElement(field)); todo break;
                case MODE_PARAMETER_TYPE_RANGE: containerElem.appendChild(this.#generateRangeElement(field));  this.#updateRangeTitle(field.id, field.id + "Title", field.title);break;
                case MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX: containerElem.appendChild(this.#generateDirectionCheckboxElement(field)); break;
                case MODE_PARAMETER_TYPE_SELECT: containerElem.appendChild(this.#generateSelectElement(field)); break;
                default: throw new Error("Unknown block type: " + field.type);
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Returns the DOM element of the modal.
        @return                     DOM element
    */
    /******************************************************************************/
    getDomElement() {
        return document.getElementById(this.id);
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
        @brief  Sets the options for the specified select field.
        @param  fieldId             ID of the field
        @param  options             Select options to set
    */
    /******************************************************************************/
    setFieldTitle(fieldId, title) {
        const field = this.#getField(fieldId);
        field.title = title;

        const fieldTitleElem = document.getElementById(fieldId + "Title");
        fieldTitleElem.textContent = field.title;
    }

    /******************************************************************************/
    /*!
        @brief  Enables or disables the specified field.
        @param  fieldId             ID of the field
        @param  disabled            True to disable the field
        @param  title               Mouse title to set
    */
    /******************************************************************************/
    setFieldDisabled(fieldId, disabled, title="") {
        const fieldElem = document.getElementById(fieldId);
        fieldElem.disabled = disabled;
        fieldElem.title = title;

        if (disabled) {
            fieldElem.classList.add("disabled");
        } else {
            fieldElem.classList.remove("disabled");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the specified field as invalid.
        @param  fieldId             ID of the field
        @param  errorMessage        Error message to show
        @return                     DOM element
    */
    /******************************************************************************/
    setFieldInvalid1(fieldId, errorMessage=undefined) {
        const fieldElem = document.getElementById(fieldId);
        fieldElem.classList.add("invalid-input");
        fieldElem.focus();

        if (errorMessage != undefined) {
            this.setErrorMessage(errorMessage);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the onclick function of the specified field.
        @param  fieldId             ID of the field
        @param  onclickFunction     Onclick function to set
    */
    /******************************************************************************/
    setFieldOnclickFunction(fieldId, onclickFunction) {
        const field = this.#getField(fieldId);
        field.onclickFunction = onclickFunction;

        const fieldElem = document.getElementById(fieldId);
        fieldElem.onclick = onclickFunction ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the field ID of the specified field index.
        @param  fieldIndex          Index to get the ID from
    */
    /******************************************************************************/
    getFieldId(fieldIndex) {
        return this.fields[fieldIndex].id;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the options for the specified select field.
        @param  fieldId             ID of the field
        @param  options             Select options to set
    */
    /******************************************************************************/
    setSelectOptions(fieldId, options) {
        const field = this.#getField(fieldId);
        field.options = options;

        const selectElem = document.getElementById(fieldId);
        selectElem.innerHTML = "";

        /* Rebuild options */
        for (let opt of options) {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            selectElem.appendChild(option);
        }
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
            console.log(field)
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = document.getElementById(field.id + "MinimumRange");
                const maxFieldElem = document.getElementById(field.id + "MaximumRange");
                minFieldElem.classList.remove("invalid-input");
                maxFieldElem.classList.remove("invalid-input");
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = document.getElementById(field.id + "Color");
                const gradientFieldElem = document.getElementById(field.id + "GradientCb");
                colorFieldElem.classList.remove("invalid-input");
                gradientFieldElem.classList.remove("invalid-input");
                continue;
            }

            const fieldElem = document.getElementById(field.id);
            fieldElem.classList.remove("invalid-input");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified field as invalid.
        @param  fieldElem           DOM element that is invalid
        @param  errorMessage        Error message to show
        @return                     DOM element
    */
    /******************************************************************************/
    setFieldInvalid(fieldId, errorMessage) {
        const field = this.#getField(fieldId);

        if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
            const minFieldElem = document.getElementById(field.id + "MinimumRange");
            const maxFieldElem = document.getElementById(field.id + "MaximumRange");
            minFieldElem.classList.add("invalid-input");
            maxFieldElem.classList.add("invalid-input");

            minFieldElem.focus();
            this.setErrorMessage(errorMessage);
            return;
        }

        if (field.type == MODE_PARAMETER_TYPE_COLOR) {
            const colorFieldElem = document.getElementById(field.id + "Color");
            const gradientFieldElem = document.getElementById(field.id + "GradientCb");
            colorFieldElem.classList.add("invalid-input");
            gradientFieldElem.classList.add("invalid-input");

            colorFieldElem.focus();
            this.setErrorMessage(errorMessage);
            return;
        }

        const fieldElem = document.getElementById(field.id);

        fieldElem.classList.add("invalid-input");
        fieldElem.focus();
        this.setErrorMessage(errorMessage);
    }

    /******************************************************************************/
    /*!
        @brief  Resets the input values.
    */
    /******************************************************************************/
    resetValues() {
        for (const field of this.fields) {
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = document.getElementById(field.id + "MinimumRange");
                const maxFieldElem = document.getElementById(field.id + "MaximumRange");
                minFieldElem.value = 0;
                maxFieldElem.value = 255;
                this.#loadColorRangeField(field.id);
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = document.getElementById(field.id + "Color");
                const gradientFieldElem = document.getElementById(field.id + "GradientCb");
                colorFieldElem.value = "#000000";
                gradientFieldElem.checked = false;
                continue;
            }

            const fieldElem = document.getElementById(field.id);
            switch (field.type) {
                case MODE_PARAMETER_TYPE_CHECKBOX: fieldElem.checked = false; break;
                case MODE_PARAMETER_TYPE_RANGE: fieldElem.value = 0; break;
                case MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX: fieldElem.checked = false; break;
                case MODE_PARAMETER_TYPE_SELECT: fieldElem.value = -1; break;
                default: fieldElem.value = ""; break;
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the input values to the specified values.
        @param  values              Values to set
    */
    /******************************************************************************/
    setValues(values) {
        let index = 0;

        for (const field of this.fields) {
            const value = values[index];
        
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = document.getElementById(field.id + "MinimumRange");
                const maxFieldElem = document.getElementById(field.id + "MaximumRange");
                minFieldElem.value = value[0];
                maxFieldElem.value = value[1];
                this.#loadColorRangeField(field.id);
                index++;
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = document.getElementById(field.id + "Color");
                const gradientFieldElem = document.getElementById(field.id + "GradientCb");
                colorFieldElem.value = value[0];
                gradientFieldElem.checked = value[1];
                continue;
            }

            const fieldElem = document.getElementById(field.id);
        
            if (field.type == MODE_PARAMETER_TYPE_CHECKBOX || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
                fieldElem.checked = value[0];
            } else {
                fieldElem.value = value[0];
            }

            index++;
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the input value to the specified value.
        @param  fieldId             ID of the field
        @param  value               Value to set
    */
    /******************************************************************************/
    setValue(fieldId, value) {
        const field = this.#getField(fieldId);

        if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
            const minFieldElem = document.getElementById(field.id + "MinimumRange");
            const maxFieldElem = document.getElementById(field.id + "MaximumRange");
            minFieldElem.value = value[0];
            maxFieldElem.value = value[1];
            this.#loadColorRangeField(field.id);
            return;
        }

        console.log(value)
        console.log(this.fields)
        console.log(fieldId)
        console.log(field)
        if (field.type == MODE_PARAMETER_TYPE_COLOR) {
            const colorFieldElem = document.getElementById(field.id + "Color");
            const gradientFieldElem = document.getElementById(field.id + "GradientCb");
            colorFieldElem.value = value[0];
            gradientFieldElem.checked = value[1] == 1;
            return;
        }

        const fieldElem = document.getElementById(field.id);
    
        if (field.type == MODE_PARAMETER_TYPE_CHECKBOX || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
            fieldElem.checked = value[0] == 1;
        } else if (field.type == MODE_PARAMETER_TYPE_RANGE) {
            fieldElem.value = value[0];
            this.#updateRangeTitle(field.id, field.id + "Title", field.title);
        } else {
            fieldElem.value = value[0];
        }
    }

    /******************************************************************************/
    /*!
        @brief  Returns the input values of the fields.
        @return                     All input values
    */
    /******************************************************************************/
    getValues() {
        let values = [];
        
        for (let field of this.fields) {
            if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
                const minFieldElem = document.getElementById(field.id + "MinimumRange");
                const maxFieldElem = document.getElementById(field.id + "MaximumRange");
                const range = [parseInt(minFieldElem.value), parseInt(maxFieldElem.value)];
                values.push(range);
                continue;
            }

            if (field.type == MODE_PARAMETER_TYPE_COLOR) {
                const colorFieldElem = document.getElementById(field.id + "Color");
                const gradientFieldElem = document.getElementById(field.id + "GradientCb");
                const color = [colorFieldElem.value, gradientFieldElem.checked];
                values.push(color);
                continue;
            }

            const fieldElem = document.getElementById(field.id);
        
            if (field.type == MODE_PARAMETER_TYPE_CHECKBOX || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
                values.push(fieldElem.checked);
            } else if (field.type == MODE_PARAMETER_TYPE_RANGE) {
                values.push(parseInt(fieldElem.value));
            } else {
                values.push(fieldElem.value);
            }
        }

        return values;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the value of the specified field.
        @param  fieldId             ID of the field
        @return                     Input value
    */
    /******************************************************************************/
    getValue(fieldId) {
        const field = this.#getField(fieldId);

        if (field.type == MODE_PARAMETER_TYPE_COLOR_RANGE) {
            const minFieldElem = document.getElementById(field.id + "MinimumRange");
            const maxFieldElem = document.getElementById(field.id + "MaximumRange");
            const range = [parseInt(minFieldElem.value), parseInt(maxFieldElem.value)];
            return range;
        }

        if (field.type == MODE_PARAMETER_TYPE_COLOR) {
            const colorFieldElem = document.getElementById(field.id + "Color");
            const gradientFieldElem = document.getElementById(field.id + "GradientCb");
            const color = [colorFieldElem.value, gradientFieldElem.checked];
            return color;
        }

        const fieldElem = document.getElementById(field.id);
    
        if (field.type == MODE_PARAMETER_TYPE_CHECKBOX || field.type == MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX) {
           return fieldElem.checked;
        }

        return fieldElem.value;
    }
    
    /******************************************************************************/
    /*!
        @brief  Shows the modal popup (with overlay).
    */
    /******************************************************************************/
    show() {
        const modalElem = document.getElementById(this.id);
        modalElem.modalInstance = this;
        modalElem.allowEscapeClose = true;

        if (this.isOpen) {
            return;
        }

        clearTimeout(this.#closeTimeout);
        this.isOpen = true;

        modalElem.showModal();

        requestAnimationFrame(() => {
            modalElem.classList.add("show");
        });

        document.addEventListener("mousedown", this.#outsideMouseDownHandler);
    }

    /******************************************************************************/
    /*!
        @brief  Closes the modal popup.
    */
    /******************************************************************************/
    close() {
        const modalElem = document.getElementById(this.id);

        if (!this.isOpen) {
            return;
        }

        document.removeEventListener("mousedown",  this.#outsideMouseDownHandler);

        this.isOpen = false;
        modalElem.classList.remove("show");

        clearTimeout(this.#closeTimeout);
        this.#closeTimeout = setTimeout(() => modalElem.close(), 300);
    }
    
    /******************************************************************************/
    /*!
        @brief  Returns the field based on the specified field ID.XXXX
        @param  fieldId             ID of the field
        @return                     Object containing field data
    */
    /******************************************************************************/
    #handleOutsideMouseDown(event) {
        if (!this.isOpen) {
            return;
        }

        const dialogElem = document.getElementById(this.id);
        const rect = dialogElem.getBoundingClientRect();

        const clickedInDialog =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

        if (!clickedInDialog) {
            this.close();
        }
    }

    /******************************************************************************/
    /*!
        @brief  Returns the field based on the specified field ID.
        @param  fieldId             ID of the field
        @return                     Object containing field data
    */
    /******************************************************************************/
    #getField(fieldId) {
        return this.fields[getIndexFromId(this.fields, fieldId)];
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
        dialogElem.className = "modal small-bottom-modal";

        return dialogElem;
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
    //#endregion

    //#region Generate mode configuration input elements
    /******************************************************************************/
    /*!
      @brief  Generates a color range DOM element.
      @param  minimumParameter    Minimum value
      @param  maximumParameter    Maximum value
    */
    /******************************************************************************/
    #generateColorRangeElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = this.id + "ColorRangeContainer";
        containerElem.style.width = "100%";
        containerElem.style.maxWidth = "none";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "range-title";
        titleElem.textContent = field.title;
        titleElem.style.marginBottom = "2px";
        containerElem.appendChild(titleElem);

        const rangeContainerElem = document.createElement("div");
        rangeContainerElem.id = field.id + "RangeContainer";
        rangeContainerElem.className = "multi-range-slider";

        /* Min band */
        const minInputElem = document.createElement("input");
        minInputElem.id = field.id + "MinimumRange";
        minInputElem.className = "multi-range minimum-multi-range";
        minInputElem.type = "range";
        minInputElem.value = field.value1;
        minInputElem.min = field.min;
        minInputElem.max = field.max;
        minInputElem.onchange = field.updateFunction;
        minInputElem.oninput = () => this.#loadColorPosRangeFieldMax(field.id);
        minInputElem.style.width = "81%";

        rangeContainerElem.appendChild(minInputElem);
        containerElem.appendChild(rangeContainerElem);

        /* Max band */
        const maxInputElem = document.createElement("input");
        maxInputElem.id = field.id + "MaximumRange";
        maxInputElem.className = "multi-range maximum-multi-range";
        maxInputElem.type = "range";
        maxInputElem.value = field.value2;
        maxInputElem.min = field.min;
        maxInputElem.max = field.max;
        maxInputElem.onchange = field.updateFunction;
        maxInputElem.oninput = () => this.#loadColorPosRangeFieldMin(field.id);
        maxInputElem.style.width = "81%";

        rangeContainerElem.appendChild(maxInputElem);
        containerElem.appendChild(rangeContainerElem);

        return containerElem;
    }

    /******************************************************************************/
    /*!
      @brief  Generates a range DOM element.
      @param  parameter           Mode configuration parameter object
    */
    /******************************************************************************/
    #generateRangeElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "input-field-container";
        containerElem.style.width = "100%";
        containerElem.style.maxWidth = "none";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "range-title";
        titleElem.textContent = field.title;
        containerElem.appendChild(titleElem);

        /* Range */
        const inputElem = document.createElement("input");
        inputElem.id = field.id;
        inputElem.type = "range";
        inputElem.value = field.value1;
        inputElem.min = field.min;
        inputElem.max = field.max;
        inputElem.onchange = field.updateFunction;
        inputElem.oninput = () => this.#updateRangeTitle(field.id, field.id + "Title", field.title);
        containerElem.appendChild(inputElem);

        return containerElem;
    }

    /******************************************************************************/
    /*!
      @brief  Generates a range DOM element.
      @param  colorParameter      Mode configuration color parameter object
      @param  gradientParameter   Mode configuration gradient parameter object
    */
    /******************************************************************************/
    #generateColorElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "color-checkbox-container";

        /* Color */
        const colorContainerElem = document.createElement("div");
        colorContainerElem.className = "input-field-container color-container";

        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "input-field-title";
        titleElem.textContent = field.title;
        titleElem.style.margin = "0px auto";
        colorContainerElem.appendChild(titleElem);

        const inputElem = document.createElement("input");
        inputElem.id = field.id + "Color";
        inputElem.type = "color";
        inputElem.value = field.value1;
        inputElem.className = "input-field";
        inputElem.onchange = field.updateFunction;
        colorContainerElem.appendChild(inputElem);
        containerElem.appendChild(colorContainerElem);

        /* Gradient */
        const fieldElem = document.createElement("div");
        fieldElem.className = "centered-flex";
        fieldElem.style.flexDirection = "column";
        fieldElem.style.gap = "0px";

        const gradientTitleElem = document.createElement("p");
        gradientTitleElem.id = field.id + "Title";
        gradientTitleElem.className = "input-field-title";
        gradientTitleElem.style.margin = "0px";
        gradientTitleElem.style.top = "0px";
        gradientTitleElem.textContent = TEXT_GRADIENT;
        fieldElem.appendChild(gradientTitleElem);

        const labelElem = document.createElement("label");
        labelElem.className = "switch";
        labelElem.style.margin = "15px";

        const checkboxElem = document.createElement("input");
        checkboxElem.id = field.id + "GradientCb";
        checkboxElem.type = "checkbox";
        checkboxElem.checked = field.value2;
        checkboxElem.onclick = field.updateFunction;

        const sliderElem = document.createElement("span");
        sliderElem.className = "slider round";

        labelElem.append(checkboxElem, sliderElem);
        fieldElem.appendChild(labelElem);

        containerElem.appendChild(fieldElem);

        return containerElem;
    }

    /******************************************************************************/
    /*!
      @brief  Generates a direction checkbox DOM element.
      @param  parameter           Mode configuration parameter object
    */
    /******************************************************************************/
    #generateDirectionCheckboxElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "input-field-container";
        containerElem.style.width = "100%";
        containerElem.style.maxWidth = "none";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "range-title";
        titleElem.textContent = field.title;
        containerElem.appendChild(titleElem);

        /* Switch */
        const labelElem = document.createElement("label");
        labelElem.className = "switch";
        
        const inputElem = document.createElement("input");
        inputElem.id = field.id;
        inputElem.type = "checkbox";
        inputElem.checked = field.value1;
        inputElem.onchange = field.updateFunction;
        labelElem.appendChild(inputElem);

        const switchElem = document.createElement("span");
        switchElem.className = "slider round no-color";
        labelElem.appendChild(switchElem);
        containerElem.appendChild(labelElem);

        return containerElem;

        configurationVariablesContainerElem.appendChild(container);
    }

    /******************************************************************************/
    /*!
      @brief  Generates a select DOM element.
      @param  parameter           Mode configuration parameter object
    */
    /******************************************************************************/
    #generateSelectElement(field) {
        /* Main container */
        const containerElem = document.createElement("div");
        containerElem.id = field.id + "Container";
        containerElem.className = "input-field-container";

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.id = field.id + "Title";
        titleElem.className = "input-field-title";
        titleElem.textContent = field.title;
        containerElem.appendChild(titleElem);

        /* Select */
        const inputElem = document.createElement("select");
        inputElem.id = field.id;
        inputElem.className = "input-field";
        inputElem.value = field.value1;
        inputElem.onchange = field.updateFunction;

        for (const option of field.options) {
            const optionElem = document.createElement("option");
            optionElem.value = option.value;
            optionElem.text = option.text;
            
            inputElem.appendChild(optionElem);
        }

        containerElem.appendChild(inputElem);
        return containerElem;
    }





    /******************************************************************************/
    /*!
      @brief  Loads the ledstrip color range.
      @param  minimumRangeElementId   ID of the minimum range DOM element
      @param  maximumRangeElementId   ID of the maximum range DOM element
    */
    /******************************************************************************/
    #loadColorRangeField(elementId) {
        const minColorPosRangeElem = document.getElementById(elementId + "MinimumRange");
        const maxColorPosRangeElem = document.getElementById(elementId + "MaximumRange");

        const sliderColor = "var(--background2)";

        let rangeDistance = maxColorPosRangeElem.max - maxColorPosRangeElem.min;
        let fromValue = Number(minColorPosRangeElem.value);
        let toValue = Number(maxColorPosRangeElem.value);
        let fromPosition = fromValue - maxColorPosRangeElem.min;
        let toPosition = toValue - maxColorPosRangeElem.min;

        let correctedRange = 98;                                                    //Range for color 98, otherwise background color will be aside of the thumb

        let percentageFrom = ((fromPosition) / rangeDistance) * 100;
        let percentageTo = ((toPosition) / rangeDistance) * 100;

        let correctedFrom = ((percentageFrom * correctedRange) / 100) + 1;
        let correctedTo = ((percentageTo * correctedRange) / 100) + 1;

        // Genereer een gradient over de geselecteerde waarde-range
        let steps = 100; // Meer = vloeiender
        let gradientParts = [];

        // Start met slider background tot begin bereik
        gradientParts.push(`${sliderColor} 0%`);
        gradientParts.push(`${sliderColor} ${correctedFrom}%`);

        for (let i = 0; i <= steps; i++) {
            let pos = fromValue + ((toValue - fromValue) * i / steps);
            let color = colorWheel(parseInt(pos % 256));
            let percent = correctedFrom + ((correctedTo - correctedFrom) * (i / steps));
            gradientParts.push(`${color} ${percent}%`);
        }

        // Eindig met slider background na bereik
        gradientParts.push(`${sliderColor} ${correctedTo}%`);
        gradientParts.push(`${sliderColor} 100%`);

        maxColorPosRangeElem.style.background = `linear-gradient(to right, ${gradientParts.join(', ')})`;
    }

    
    /******************************************************************************/
    /*!
      @brief  Validates and updates the color range minimum value.
      @param  minimumRangeElementId   ID of the minimum range DOM element
      @param  maximumRangeElementId   ID of the maximum range DOM element
    */
    /******************************************************************************/
    #loadColorPosRangeFieldMin(elementId) {
        const minColorPosRangeElem = document.getElementById(elementId + "MinimumRange");
        const maxColorPosRangeElem = document.getElementById(elementId + "MaximumRange");

        let minimumColorBand = parseInt(minColorPosRangeElem.value);
        let maximumColorBand = parseInt(maxColorPosRangeElem.value);

        if (minimumColorBand > maximumColorBand - 1) {
            minimumColorBand = maximumColorBand - 1;
            minColorPosRangeElem.value = minimumColorBand;
        }

        this.#loadColorRangeField(elementId);
    }

    /******************************************************************************/
    /*!
      @brief  Validates and updates the color range maximum value.
      @param  minimumRangeElementId   ID of the minimum range DOM element
      @param  maximumRangeElementId   ID of the maximum range DOM element
    */
    /******************************************************************************/
    #loadColorPosRangeFieldMax(elementId) {
        const minColorPosRangeElem = document.getElementById(elementId + "MinimumRange");
        const maxColorPosRangeElem = document.getElementById(elementId + "MaximumRange");

        let minimumColorBand = parseInt(minColorPosRangeElem.value);
        let maximumColorBand = parseInt(maxColorPosRangeElem.value);

        /* If */
        if (maximumColorBand < minimumColorBand + 1) {
            maximumColorBand = minimumColorBand + 1;
            maxColorPosRangeElem.value = maximumColorBand;
        }

        this.#loadColorRangeField(elementId);
    }

    /******************************************************************************/
    /*!
      @brief  Updates the specified range field text.
      @param  rangeFieldElementId     ID of the range field DOM element
      @param  rangeElementId          ID of the range DOM element
      @param  text                    Text to set
    */
    /******************************************************************************/
    #updateRangeTitle(inputElementId, titleElementId, text) {
        const rangeFieldElem = document.getElementById(titleElementId);
        const inputElem = document.getElementById(inputElementId);

        rangeFieldElem.textContent = text.replace("?", inputElem.value);
    }
}
