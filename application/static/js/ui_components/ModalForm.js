/******************************************************************************/
/*
 * File:    ModalForm.js
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
//#region Constants
const VALIDATION_NOT_NULL = 0;
const VALIDATION_UNIQUE = 1;
const VALIDATION_MAX_LENGTH = 2;
const VALIDATION_REGEX_NO_MATCH = 3;
const VALIDATION_REGEX_MATCH = 4;
const VALIDATION_MINIMUM_VALUE = 5;
const VALIDATION_MAXIMUM_VALUE = 6;

const MODAL_BLOCK_TYPE_INPUT = 0;
const MODAL_BLOCK_TYPE_MULTIPLE_INPUTS = 1;
const MODAL_BLOCK_TYPE_INPUT_WITH_ICON = 2;
const MODAL_BLOCK_TYPE_BUTTON = 3;
const MODAL_BLOCK_TYPE_TOOLBAR = 4;
const MODAL_BLOCK_TYPE_IMAGE = 5;
const MODAL_BLOCK_TYPE_IMAGES = 6;
const MODAL_BLOCK_TYPE_TABLE = 7;
const MODAL_BLOCK_TYPE_TILE_SELECT = 8;
//#endregion

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

class ModalForm {
    #blockMap = new Map();                                                      //blockId -> blocks
    #fieldMap = new Map();                                                      //fieldId -> fields
    #tileSelectBlocks = {};

    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Modal structure and configuration
    */
    /******************************************************************************/
    constructor(configuration=undefined) {
        this.isInitialized = false;
        
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
        this.isBigModal = configuration.isBigModal ?? false;
        this.allowEscapeClose = configuration.allowEscapeClose ?? true;
        this.columnDirection = configuration.columnDirection ?? "row";
        this.columns = configuration.columns ?? [];
        this.numberOfInputs = 0;
        this.numberOfBlocks = 0;
        this.isInitialized = true;
        this.isOpen = false;
        
        this.modalTitleId = this.id + "Title";
        this.modalDescriptionId = this.id + "Description";
        this.messageElementId = this.id + "Message";

        this.submitBtnId = this.id + "SubmitBtn";
        this.submitFunction = configuration.submitFunction ?? null;
        this.submitTitle = configuration.submitTitle ?? TEXT_SAVE;
        this.submitIcon = configuration.submitIcon ?? "fa-duotone fa-solid fa-floppy-disk fa-lg";

        this.deleteBtnId = this.id + "DeleteBtn";
        this.deleteFunction = configuration.deleteFunction ?? null;
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
            this.#renderCloseButton(),
            this.#renderTitleElement(),
            this.#renderDescriptionElement(),
            this.#renderMessageElement()
        );

        const columnsContainerElem = document.createElement("div");
        if (this.columns.length > 1) {
            columnsContainerElem.className = "flex";
            columnsContainerElem.style.flexDirection = this.columnDirection;
        }

        for (const column of this.columns) {
            columnsContainerElem.appendChild(this.#renderColumn(column));
        }

        dialogElem.append(columnsContainerElem, this.#renderToolbar());
        document.body.appendChild(dialogElem);
        this.#buildRegistry();
    }

    /******************************************************************************/
    /*!
        @brief  Returns the DOM element of the modal.
        @return                     DOM element
    */
    /******************************************************************************/


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
        @brief  Sets the modal description with sections.
        @param  {intro,             Intro text on top of sections
                sections,           Array of sections to include
                footer}             Footer text below the sections
    */
    /******************************************************************************/
    setDescriptionWithSections({intro=undefined, sections=[], footer=undefined}) {
        let description = this.#buildSectionHtml({intro, sections, footer});

        this.description = description;
        const descriptionElem = document.getElementById(this.modalDescriptionId);
        descriptionElem.innerHTML = description;
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
        @brief  Sets the icon of the specified block.
        @param  blockId             ID of the block
        @param  iconClass           Icon to set
        @param  onclickFunction     Onclick function to set
    */
    /******************************************************************************/
    setIcon(blockId, iconClass, onclickFunction=undefined) {
        const iconElem = document.getElementById(blockId + "Icon");
        
        iconElem.className = iconClass;
        iconElem.onclick = onclickFunction ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the title of the specified block.
        @param  blockId             ID of the block
        @param  title               Title to set
    */
    /******************************************************************************/
    setBlockTitle(blockId, title) {
        const block = this.#getBlock(blockId);
        block.title = title;
        document.getElementById(blockId + "title").textContent = title;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the visibility of the specified block.
        @param  blockId             ID of the block
        @param  visible             True to make the block visible
        @param  displayType         CSS display type
    */
    /******************************************************************************/
    setBlockVisibility(blockId, visible, displayType="block") {
        let block = this.#getBlock(blockId);
        if (block == null) {
            console.warn("Block not found");
        } else {
            block.visible = visible;
        }
        
        if (visible) {
            document.getElementById(blockId).style.display = displayType;
        } else {
            document.getElementById(blockId).style.display = "none";
        }
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
    setFieldInvalid(fieldId, errorMessage=undefined) {
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
        @brief  Sets the onclick function of the specified block.
        @param  blockId             ID of the block
        @param  onclickFunction     Onclick function to set
    */
    /******************************************************************************/
    setBlockOnclickFunction(blockId, onclickFunction) {
        const block = this.#getBlock(blockId);
        block.onclickFunction = onclickFunction;
        
        const blockElem = document.getElementById(blockId);
        blockElem.onclick = onclickFunction ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the field ID of the specified field index.
        @param  fieldIndex          Index to get the ID from
    */
    /******************************************************************************/
    getFieldId(fieldIndex) {
        const fields = this.#getAllFields();
        return fields[fieldIndex].id;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the block ID of the specified block index.
        @param  blockIndex          Index to get the ID from
    */
    /******************************************************************************/
    getBlockId(blockIndex) {
        const blocks = this.#getAllBlocks();
        return blocks[blockIndex].id;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the submit function.
        @param  submitFunction      Function to set
    */
    /******************************************************************************/
    setSubmitFunction(submitFunction=undefined) {
        this.submitFunction = submitFunction ?? null;
        const submitBtnElem = document.getElementById(this.submitBtnId);
        submitBtnElem.onclick = this.submitFunction;

        if (submitBtnElem.onclick != null) {
            submitBtnElem.style.display = "flex";
        } else {
            submitBtnElem.style.display = "none";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the delete function.
        @param  deleteFunction      Function to set
    */
    /******************************************************************************/
    setDeleteFunction(deleteFunction=undefined) {
        this.deleteFunction = deleteFunction ?? null;
        const deleteBtnElem = document.getElementById(this.deleteBtnId);
        deleteBtnElem.onclick = this.deleteFunction ?? null;

        if (deleteBtnElem.onclick != null) {
            deleteBtnElem.style.display = "flex";
        } else {
            deleteBtnElem.style.display = "none";
        }
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

    /*****************************************************************************/
    /*!
        @brief  Updates the tiles of a tile select block.
        @param  blockId             Tile select block id
        @param  tiles               New tile array
    */
    /*****************************************************************************/
    resetSelectedTileSelectItems(blockId) {
        const block = this.#tileSelectBlocks[blockId];

        for (const tile of block.tiles ?? []) {
            tile.selected = false;
            const tileElem = document.getElementById(tile.id);
            tileElem.classList.toggle("tile-selected", tile.selected);
        }

        const oldContainerElem = document.getElementById(blockId + "Fieldset");
        if (oldContainerElem == null) {
            console.warn("Old block not found");
            return;
        }

        const newContainerElem = this.#renderTileSelectBlock(block);
        oldContainerElem.replaceWith(newContainerElem);
    }

    /*****************************************************************************/
    /*!
        @brief  Updates the tiles of a tile select block.
        @param  blockId             Tile select block id
        @param  tiles               New tile array
    */
    /*****************************************************************************/
    setTileSelectOptions(blockId, tiles) {
        const block = this.#tileSelectBlocks[blockId];

        if (block == null) {
            console.warn("Block not found");
            return;
        }

        block.tiles = tiles;

        const oldContainerElem = document.getElementById(block.blockId);
        if (oldContainerElem == null) {
            console.warn("Old block not found");
            return;
        }

        const newContainerElem = this.#renderTileSelectBlock(block);
        oldContainerElem.replaceWith(newContainerElem);
    }

    /*****************************************************************************/
    /*!
        @brief  Updates the tiles of a tile select block.
        @param  blockId             Tile select block id
        @param  tiles               New tile array
    */
    /*****************************************************************************/
    setTileSelectElements(blockId, tiles) {
        const block = this.#tileSelectBlocks[blockId];

        if (block == null) {
            console.warn("Block not found");
            return;
        }

        block.tiles = [];

        const oldContainerElem = document.getElementById(block.blockId);
        if (oldContainerElem == null) {
            console.warn("Old block not found");
            return;
        }

        const newContainerElem = this.#renderTileSelectBlock(block);

        for (let tile of tiles) {
            tile.style.marginBottom = "10px";
            newContainerElem.appendChild(tile);
        }

        oldContainerElem.replaceWith(newContainerElem);
    }

    /******************************************************************************/
    /*!
        @brief  Resets the field validations and validation message.
    */
    /******************************************************************************/
    resetValidationElements() {
        const messageElem = document.getElementById(this.messageElementId);
        messageElem.style.display = "none";
        
        const fields = this.#getAllFields();
        for (let field of fields) {
            const fieldElem = document.getElementById(field.id);
            fieldElem.classList.remove("invalid-input");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the validations for the specified item.
        @param  id                  ID of the block or field
        @param  validations         Validations to set
    */
    /******************************************************************************/
    setValidations(id, validations) {
        const item = this.#getItem(id);
        item.validations = validations;
    }

    /******************************************************************************/
    /*!
        @brief  Resets the validations for the specified item.
        @param  id                  ID of the block or field
    */
    /******************************************************************************/
    resetValidations(id) {
        const item = this.#getItem(id);
        item.validations = [];
    }

    /******************************************************************************/
    /*!
        @brief  Adds the specified validation to the specified item.
        @param  id                  ID of the block or field
        @param  validation          Validations to add
    */
    /******************************************************************************/
    addValidation(id, validation) {
        const item = this.#getItem(id);
        item.validations = item.validations ?? [];

        if (item.validations.some(v => v.type === validation.type)) {
            console.warn("Validation type already present:", validation.type);
            return;
        }

        item.validations.push(validation);
    }

    /******************************************************************************/
    /*!
        @brief  Removes the specified validation from the specified item.
        @param  id                  ID of the block or field
        @param  validation          Validations to add
    */
    /******************************************************************************/
    removeValidation(id, validationType) {
        const item = this.#getItem(id);
        if (!item || !item.validations) return;

        item.validations = item.validations.filter(
            v => v.type !== validationType
        );
    }

    /******************************************************************************/
    /*!
        @brief  Resets the input values.
    */
    /******************************************************************************/
    resetValues() {
        const fields = this.#getAllFields();
        for (const field of fields) {
            const fieldElem = document.getElementById(field.id);

            if (field.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
                this.resetSelectedTileSelectItems(field.id);
                continue;
            }

            switch (field.type) {
                case "checkbox": fieldElem.checked = false; break;
                case "toggle": fieldElem.checked = false; break;
                case "select": fieldElem.value = -1; break;
                case "color": fieldElem.value = "#000000"; break;
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
        const fields = this.#getAllFields();
        let index = 0;

        for (const field of fields) {
            const value = values[index];
            const block = this.#getBlock(field.id);

            if (block.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
                const selectedValues = Array.isArray(value) ? value : [value];

                for (const tile of block.tiles ?? []) {
                    tile.selected = selectedValues.includes(tile.value);

                    const tileElem = document.getElementById(tile.id);
                    tileElem.classList.toggle("tile-selected", tile.selected);
                }

                index++;
                continue;
            }

            const fieldElem = document.getElementById(field.id);

            if (field.type == "checkbox" || field.type == "toggle") {
                fieldElem.checked = value;
            } else {
                fieldElem.value = value;
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
        const block = this.#getBlock(fieldId);
        if (block.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
            const selectedValues = Array.isArray(value) ? value : [value];

            for (const tile of block.tiles ?? []) {
                tile.selected = selectedValues.includes(tile.value);

                const tileElem = document.getElementById(tile.id);
                tileElem.classList.toggle("tile-selected", tile.selected);
            }

            return;
        }

        const field = this.#getField(fieldId);
        const fieldElem = document.getElementById(fieldId);
        
        if (field.type == "checkbox" || field.type == "toggle") {
            fieldElem.checked = value;
        } else {
            fieldElem.value = value;
        }
        console.log(fieldId)
        console.log(fieldElem.value)
        console.log(value)
    }

    /******************************************************************************/
    /*!
        @brief  Returns the input values of the fields.
        @return                     All input values
    */
    /******************************************************************************/
    getValues() {
        const fields = this.#getAllFields();
        let values = [];
        
        for (let field of fields) {
            const block = this.#getBlock(fieldId);
            if (block.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
                values = block.tiles
                            ?.filter(tile => tile.selected)
                            .map(tile => tile.value) ?? [];
                continue;
            }

            const fieldElem = document.getElementById(field.id);
            if (field.type == "checkbox" || field.type == "toggle") {
                values.push(fieldElem.checked);
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
        const fieldElem = document.getElementById(fieldId);
        let values = [];
        
        const block = this.#getBlock(fieldId);
        if (block.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
            values = block.tiles
                        ?.filter(tile => tile.selected)
                        .map(tile => tile.value) ?? [];
            return values;
        }

        if (field.type == "checkbox" || field.type == "toggle") {
            return fieldElem.checked;
        } else {
            return fieldElem.value;
        }
    }

    /******************************************************************************/
    /*!
        @brief  Validates the form inputs according to the configured validations.
        @param  id                  ID of the item to validate
    */
    /******************************************************************************/
    validate(id) {
        this.resetValidationElements();

        const fields = this.#getAllFields();
        let values = [];

        /* Validate fields */
        for (let field of fields) {
            const fieldElem = document.getElementById(field.id);
            let value = fieldElem.value;

            if (field.type == "checkbox" || field.type == "toggle") {
                value = fieldElem.checked;
            }

            if (field.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
                const block = this.#getBlock(field.id);

                value = block.tiles
                            ?.filter(tile => tile.selected)
                            .map(tile => tile.value) ?? [];
            
                if (block.isRadioButton && value.length > 1) {
                    this.#renderInvalidField(fieldElem, TEXT_THIS_FIELD_IS_REQUIRED);//TODO
                    return false;
                }
            }

            if (field.validations == undefined) {
                values.push(value);
                continue;
            }

            field.disabled = field.disabled ?? false;
            field.visible = field.visible ?? true;
            if (!field.forceValidations && (field.disabled || !field.visible)) {
                values.push(value);
                continue;
            }

            /* Multiple validations */
            for (let validation of field.validations) {
                validation.nullValue = validation.nullValue ?? "";
                const isNull = value == validation.nullValue;

                if (field.blockType == MODAL_BLOCK_TYPE_TILE_SELECT) {
                    if (validation.type == VALIDATION_NOT_NULL && value.length == 0) {
                        this.#renderInvalidField(fieldElem, TEXT_THIS_FIELD_IS_REQUIRED);
                        return false;
                    }
                }

                /* Not null check */
                if (validation.type == VALIDATION_NOT_NULL && value == validation.nullValue) {
                    this.#renderInvalidField(fieldElem, TEXT_THIS_FIELD_IS_REQUIRED);
                    return false;
                }

                /* Unique check */
                if (!isNull && validation.type == VALIDATION_UNIQUE) {
                    for (let validationValue of validation.values) {
                        if (value == validationValue[validation.key] && id != validationValue.id) {
                            this.#renderInvalidField(fieldElem, TEXT_THIS_FIELD_NEEDS_TO_BE_UNIQUE);
                            return false;
                        }
                    }
                }

                /* Maximum length check */
                if (!isNull && validation.type == VALIDATION_MAX_LENGTH && value.length > validation.maxLength) {
                    this.#renderInvalidField(fieldElem, TEXT_TOO_MANY_CHARACTERS);
                    return false;
                }

                /* No RegEx match check */
                if (!isNull && validation.type == VALIDATION_REGEX_NO_MATCH && value.match(validation.regexPattern)) {
                    this.#renderInvalidField(fieldElem, validation.errorMessage);
                    return false;
                }

                /* RegEx match check */
                if (!isNull && validation.type == VALIDATION_REGEX_MATCH && !value.match(validation.regexPattern)) {
                    this.#renderInvalidField(fieldElem, validation.errorMessage);
                    return false;
                }

                /* Minimum value check */
                if (!isNull && validation.type == VALIDATION_MINIMUM_VALUE && parseInt(value) < validation.value) {
                    this.#renderInvalidField(fieldElem, VAR_TEXT_CHOOSE_A_HIGHER_VALUE(validation.value));
                    return false;
                }

                /* Maximum value check */
                if (!isNull && validation.type == VALIDATION_MAXIMUM_VALUE && parseInt(value) > validation.value) {
                    this.#renderInvalidField(fieldElem, VAR_TEXT_CHOOSE_A_LOWER_VALUE(validation.value));
                    return false;
                }
            }

            /* Valid */
            values.push(value);
        }

        return values;
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
        @brief  Returns the block based on the specified block ID.
        @param  blockId             ID of the block
        @return                     Object containing block data
    */
    /******************************************************************************/
    #getBlock(blockId) {
        return this.#blockMap.get(blockId) ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the field based on the specified field ID.
        @param  fieldId             ID of the field
        @return                     Object containing field data
    */
    /******************************************************************************/
    #getField(fieldId) {
        return this.#fieldMap.get(fieldId) ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Returns all blocks.
        @param  blockId             ID of the block
        @return                     Array of objects containing block data
    */
    /******************************************************************************/
    #getAllBlocks() {
        return this.columns.flatMap(column => column.blocks ?? []);
    }

    /******************************************************************************/
    /*!
        @brief  Returns all fields.
        @return                     Array of objects containing field data
    */
    /******************************************************************************/
    #getAllFields() {
        return this.columns
                            .flatMap(column => column.blocks ?? [])
                            .flatMap(block => {
                                if (block.blockType === MODAL_BLOCK_TYPE_MULTIPLE_INPUTS) {
                                    return block.inputFields ?? [];
                                }

                                if (
                                    block.blockType === MODAL_BLOCK_TYPE_INPUT ||
                                    block.blockType === MODAL_BLOCK_TYPE_INPUT_WITH_ICON ||
                                    block.blockType === MODAL_BLOCK_TYPE_TILE_SELECT
                                ) {
                                    return block;
                                }

                                return [];
                            });
    }

    /******************************************************************************/
    /*!
        @brief  Returns the field or block based on the specified ID.
        @param  id                  ID of the block or field
        @return                     Object containing block or field data
    */
    /******************************************************************************/
    #getItem(id) {
        return this.#fieldMap.get(id) 
            ?? this.#blockMap.get(id) 
            ?? null;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the images blocks.
        @return                     Object containing block data
    */
    /******************************************************************************/
    getImagesBlocks() {
        return this.columns
        .flatMap(column => column.blocks ?? [])
        .filter(block => block.blockType === MODAL_BLOCK_TYPE_IMAGES);
    }

    /******************************************************************************/
    /*!
        @brief  Returns the image blocks.
        @return                     Object containing block data
    */
    /******************************************************************************/
    getImageBlocks() {
        return this.columns
        .flatMap(column => column.blocks ?? [])
        .filter(block => block.blockType === MODAL_BLOCK_TYPE_IMAGE);
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

        if (this.isBigModal) {
            dialogElem.className = "modal big-modal";
        }

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
    #renderColumn(column) {
        let containerElem;

        if (column.isFieldset) {
            containerElem = document.createElement("fieldset");
            containerElem.style.marginTop = "0px";
            containerElem.style.paddingBottom = "15px";

            if (column.title != undefined) {
                const legendElem = document.createElement("legend");
                legendElem.textContent = column.title;
                containerElem.appendChild(legendElem);
            }
        } else {
            containerElem = document.createElement("div");
        }

        if (column.width != undefined) {
            containerElem.style.width = column.width;
        }

        for (let block of column.blocks) {
            block.blockId = block.blockId ?? this.id + "Block" + this.numberOfBlocks;  //When no ID specified, automatic ID
            this.#blockMap.set(block.blockId, block);
            if (block.id) {
                this.#blockMap.set(block.id, block);
            }

            const blockElem = this.#renderBlock(block);
            containerElem.appendChild(blockElem);
            this.numberOfBlocks++;
        }

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified block DOM element.
        @param  block               Object with block data
    */
    /******************************************************************************/
    #renderBlock(block) {
        switch (block.blockType) {
            case MODAL_BLOCK_TYPE_INPUT: return this.#renderField(block);
            case MODAL_BLOCK_TYPE_MULTIPLE_INPUTS: return this.#renderMultipleFields(block);
            case MODAL_BLOCK_TYPE_INPUT_WITH_ICON: return this.#renderFieldWithIcons(block);
            case MODAL_BLOCK_TYPE_BUTTON: return this.#renderButtonBlock(block);
            case MODAL_BLOCK_TYPE_TOOLBAR: return this.#renderToolbarBlock(block);
            case MODAL_BLOCK_TYPE_IMAGE: return this.renderImageBlock(block);
            case MODAL_BLOCK_TYPE_IMAGES: return this.renderImagesBlock(block);
            case MODAL_BLOCK_TYPE_TABLE: return this.#renderTableBlock(block);
            case MODAL_BLOCK_TYPE_TILE_SELECT: return this.#renderTileSelectBlock(block);
            default: throw new Error("Unknown block type");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderField(block) {
        if (block.id == undefined) {
            block.id = this.id + "InputField" + this.numberOfInputs;
            this.numberOfInputs++;
        }

        const fieldContainerElem = document.createElement("div");
        fieldContainerElem.className = "input-field-container";

        if (block.blockType == MODAL_BLOCK_TYPE_INPUT) {
            fieldContainerElem.style.margin = "5px auto";
            fieldContainerElem.style.width = "95%";
            fieldContainerElem.id = block.blockId;

            if (block.type == "textarea" && this.isBigModal) {
                fieldContainerElem.style.maxWidth = "500px";
            }
        }

        if (block.blockType == MODAL_BLOCK_TYPE_INPUT_WITH_ICON) {
            fieldContainerElem.style.margin = "5px 0px";
            fieldContainerElem.style.width = "100%";
        }

        const fieldTitleElem = document.createElement("p");
        fieldTitleElem.textContent = block.title;
        fieldTitleElem.id = block.id + "Title";
        fieldTitleElem.className = "input-field-title";

        if (block.type == "toggle") {
            fieldTitleElem.style.textAlign = "center";
            fieldTitleElem.style.width = "unset";
            fieldTitleElem.style.margin = "0px";
        }

        if (block.type == "checkbox") {
            fieldContainerElem.className = "inline-cb";
            fieldTitleElem.style.top = "0px";
        }

        if (block.type == "color") {
            fieldTitleElem.style.textAlign = "center";
            fieldTitleElem.style.width = "unset";
            fieldTitleElem.style.margin = "0px";
        }

        let fieldElem;
        switch (block.type) {
            case "textarea": fieldElem = this.#renderTextAreaField(block); break;
            case "select": fieldElem = this.#renderSelectField(block); break;
            case "checkbox": fieldElem = this.#renderCheckboxField(block); break;
            case "toggle": fieldElem = this.#renderToggleField(block); break;
            case "date": fieldElem = this.#renderDateField(block); break;
            case "range": fieldElem = this.#renderRangeField(block); break;
            default: fieldElem = this.#renderTextField(block); break;
        }
        
        fieldElem.value = block.value ?? "";
        fieldElem.placeholder = block.placeHolder ?? "";

        block.disabled = block.disabled ?? false;
        if (block.disabled) {
            fieldElem.disabled = true;
            fieldElem.classList.add("disabled");
        }

        block.visible = block.visible ?? true;
        if (!block.visible) {
            fieldContainerElem.style.display = "none";
        }

        fieldContainerElem.appendChild(fieldTitleElem);
        fieldContainerElem.appendChild(fieldElem);

        return fieldContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified multiple fields DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderMultipleFields(block) {
        if (block.id == undefined) {
            block.id = this.id + "InputFieldContainer" + this.numberOfInputs;
            this.numberOfInputs++;
        }

        const containerElem = document.createElement("div");
        containerElem.id = block.blockId;
        containerElem.className = "input-field-horizontal-group";

        let index = 0;
        for (let field of block.inputFields) {
            const fieldElem = this.#renderField(field);
            fieldElem.style.margin = "0px";
            fieldElem.style.width = field.width;
            containerElem.appendChild(fieldElem);
        }

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified field with icons DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderFieldWithIcons(block) {
        if (block.id == undefined) {
            block.id = this.id + "IconInputFieldContainer" + this.numberOfInputs;
        }

        const blockContainerElem = document.createElement("div");
        blockContainerElem.className = "input-icon-container";
        blockContainerElem.id = block.blockId;

        const fieldContainerElem = this.#renderField(block);

        blockContainerElem.appendChild(fieldContainerElem);

        let index = 0;
        for (let icon of block.icons) {
            let iconId = icon.id ?? this.id + "Icon" + this.numberOfBlocks + "_" + index;
            icon.id = iconId;

            const iconElem = document.createElement("i");
            iconElem.id = icon.id;
            iconElem.title = icon.title;
            iconElem.className = icon.icon;
            iconElem.style.marginTop = "13px";
            iconElem.onclick = icon.onclickFunction ?? null;
            if (iconElem.onclick != null) {
                iconElem.classList.add("clickable");
            }
            blockContainerElem.appendChild(iconElem);
            index++;
        }

        return blockContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified button block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderButtonBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "Button" + this.numberOfInputs;
        }

        const buttonElem = document.createElement("button");
        buttonElem.className = "toolbar-button";
        buttonElem.style.width = block.width ?? "100%";
        buttonElem.style.margin = "0px auto";
        buttonElem.id = block.id;
        buttonElem.style.height = "unset";
        buttonElem.onclick = block.onclickFunction ?? null;

        block.visible = block.visible ?? true;
        block.disabled = block.disabled ?? false;
        if (!block.visible) {
            buttonElem.style.display = "none";
        }

        if (block.disabled) {
            buttonElem.disabled = block.disabled;
            block.classList.add("disabled");
        }

        if (block.width != undefined) {
            buttonElem.style.width = block.width;
        }

        const iconElem = document.createElement("i");
        iconElem.id = block.id + "Icon";
        iconElem.className = block.icon;

        const titleElem = document.createElement("p");
        titleElem.className = "toolbar-button-normal-p";
        titleElem.textContent = block.title;

        buttonElem.appendChild(iconElem);
        buttonElem.appendChild(titleElem);

        return buttonElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified toolbar block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderToolbarBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "Toolbar" + this.numberOfInputs;
        }
        
        const toolbarContainerElem = document.createElement("fieldset");
        toolbarContainerElem.style.marginTop = "0px";
        toolbarContainerElem.style.paddingBottom = "15px";

        if (block.title != undefined) {
            const legendElem = document.createElement("legend");
            legendElem.textContent = block.title;
            toolbarContainerElem.appendChild(legendElem);
        }
        
        toolbarContainerElem.style.width = "fit-content";
        toolbarContainerElem.style.padding = "0px 10px";
        toolbarContainerElem.classList.add("flex");

        for (let button of block.buttons) {
            const buttonElem = document.createElement("button");
            buttonElem.className = "toolbar-button full-width";
            buttonElem.style.minHeight = "unset";
            buttonElem.style.padding = "20px";
            buttonElem.title = button.title ?? "";
            buttonElem.id = button.id;
            buttonElem.style.height = "unset";
            buttonElem.onclick = button.onclickFunction ?? null;

            button.visible = button.visible ?? true;
            button.disabled = button.disabled ?? false;
            if (!button.visible) {
                buttonElem.style.display = "none";
            }

            if (button.disabled) {
                buttonElem.disabled = button.disabled;
                button.classList.add("disabled");
            }

            const iconElem = document.createElement("i");
            iconElem.className = button.icon;
            buttonElem.appendChild(iconElem);

            if (button.text) {
                const titleElem = document.createElement("p");
                titleElem.className = "toolbar-button-normal-p";
                titleElem.textContent = button.text ?? "";
                buttonElem.appendChild(titleElem);
            }

            toolbarContainerElem.appendChild(buttonElem);
        }

        return toolbarContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified table block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTableBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "Table" + this.numberOfInputs;
        }

        const tableContainerElem = document.createElement("table");
        tableContainerElem.className = "scrollable-table-container-table";
        tableContainerElem.id = block.blockId;

        return tableContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified tile select block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTileSelectBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "TileSelect" + this.numberOfInputs;
        }

        this.#tileSelectBlocks[block.id] = block;

        const fieldsetContainerElem = document.createElement("fieldset");
        fieldsetContainerElem.id = block.blockId;
        fieldsetContainerElem.style.padding = "15px";
        fieldsetContainerElem.style.paddingTop = "5px";

        const legendElem = document.createElement("legend");
        legendElem.textContent = block.title;
        fieldsetContainerElem.appendChild(legendElem);

        const containerElem = document.createElement("div");
        containerElem.id = block.id;
        containerElem.className = "tile-select-container";

        if (block.tiles == undefined) {
            fieldsetContainerElem.appendChild(containerElem);
            return fieldsetContainerElem;
        }

        let index = 0;
        for (const tile of block.tiles) {
            const tileElem = document.createElement("div");
            tileElem.id = tile.id ?? "tileSelectTile" + index;
            tileElem.className = "tile";
            tileElem.value = tile.value ?? null;
            tileElem.style.backgroundColor = tile.backgroundColor ?? "var(--background2)";
            tileElem.onclick = tile.onclickFunction ?? null;

            tile.selected = tile.selected ?? false;
            tile.visible = tile.visible ?? true;
            tile.disabled = tile.disabled ?? false;

            if (tile.selected) {
                tileElem.classList.add("tile-selected");
            }

            if (!tile.visible) {
                tileElem.style.display = "none";
            }

            if (tile.disabled) {
                tileElem.classList.add("disabled");
            }

            tileElem.onclick = () => {
                this.#toggleTileSelection(block.id, tile.id);
                tile.onclickFunction?.();
            };

            /* Title */
            const titleGridElem = document.createElement("div");
            titleGridElem.style.gridColumn = "span 2";
            titleGridElem.textContent = tile.title ?? "";
            tileElem.appendChild(titleGridElem);

            /* Icon */
            const iconGridElem = document.createElement("div");
            const iconElem = document.createElement("i");
            iconElem.className = tile.icon ?? "";
            iconGridElem.appendChild(iconElem);
            tileElem.appendChild(iconGridElem);

            containerElem.appendChild(tileElem);
            index++;
        }

        block.visible = block.visible ?? true;
        if (!block.visible) {
            fieldsetContainerElem.style.display = "none";
        }

        fieldsetContainerElem.appendChild(containerElem);
        return fieldsetContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Toggles the tile selection.
        @param  blockId             ID of the block
        @param  tileId              ID of the tile to toggle
    */
    /******************************************************************************/
    #toggleTileSelection(blockId, tileId) {
        const block = this.#tileSelectBlocks[blockId];

        if (block == null) {
            return;
        }

        const tile = block.tiles.find(tile => tile.id == tileId);
        if (tile == null) {
            return;
        }

        if (block.isRadioButton ?? false) {
            for (let blockTile of block.tiles) {
                blockTile.selected = false;
                const tileElem = document.getElementById(blockTile.id);
                tileElem.classList.toggle("tile-selected", tile.selected);
            }
        }

        tile.selected = !tile.selected;

        const tileElem = document.getElementById(tileId);
        tileElem.classList.toggle("tile-selected", tile.selected);
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified image block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    renderImageBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "ImageContainer" + this.numberOfInputs;
            this.numberOfInputs++;
        }

        const imageContainerElem = document.createElement("div");
        imageContainerElem.id = block.blockId;
        imageContainerElem.className = "image-container";
        imageContainerElem.style.width = "90%";
        imageContainerElem.style.margin = "auto";

        const imageWrapperContainerElem = document.createElement("div");
        imageWrapperContainerElem.className = "image-wrapper";
        imageWrapperContainerElem.style.marginTop = "10px";

        const mainImageElem = document.createElement("img");
        mainImageElem.className = "main-image";
        mainImageElem.id = block.id;
        if (block.image.filename != undefined) {
            mainImageElem.src = DOWNLOAD_IMAGE_URL + block.image.filename;
        } else {
            mainImageElem.src = block.image.src;
        }

        const imageOverlayElem = this.#renderImageOverlay(block);

        imageWrapperContainerElem.appendChild(mainImageElem);
        imageWrapperContainerElem.appendChild(imageOverlayElem);

        imageContainerElem.appendChild(imageWrapperContainerElem);

        const uploadBtnElem = document.createElement("input");
        uploadBtnElem.type = "file";
        if (block.uploadElementId == undefined) {
            block.uploadElementId = this.id + "ImageUpload" + this.numberOfInputs;
            this.numberOfInputs++;
        }
        uploadBtnElem.id = block.uploadElementId;
        uploadBtnElem.style.display = "none";
        uploadBtnElem.addEventListener("change", () => {
            block.uploadFunction();
        });

        imageContainerElem.appendChild(uploadBtnElem);
        return imageContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified images block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    renderImagesBlock(block) {
        if (block.id == undefined) {
            block.id = this.id + "ImageContainer" + this.numberOfInputs;
            this.numberOfInputs++;
        }

        const imageContainerElem = document.createElement("div");
        imageContainerElem.id = block.blockId;
        imageContainerElem.className = "image-container";
        imageContainerElem.style.width = "90%";
        imageContainerElem.style.margin = "auto";

        const imageWrapperContainerElem = document.createElement("div");
        imageWrapperContainerElem.className = "image-wrapper";
        imageWrapperContainerElem.style.marginTop = "10px";

        const mainImageElem = document.createElement("img");
        mainImageElem.className = "main-image";

        let showOrderingIcons;
        if (block.images[0].filename != undefined) {
            mainImageElem.src = DOWNLOAD_IMAGE_URL + block.images[0].filename;
            showOrderingIcons = true;
        } else {
            mainImageElem.src = block.images[0].src;
            showOrderingIcons = false;
        }

        let numberOfExistingImages = block.images.filter(img => !img.src).length;
        const imageOverlayElem = this.#renderImagesOverlay(block, 0, numberOfExistingImages, true, showOrderingIcons);

        imageWrapperContainerElem.appendChild(mainImageElem);
        imageWrapperContainerElem.appendChild(imageOverlayElem);

        imageContainerElem.appendChild(imageWrapperContainerElem);

        const subImageElem = this.#renderSubImages(block);

        const uploadBtnElem = document.createElement("input");
        uploadBtnElem.type = "file";
        block.uploadElementId = this.id + "ImageUpload" + this.numberOfInputs;
        this.numberOfInputs++;
        uploadBtnElem.id = block.uploadElementId;
        uploadBtnElem.multiple = true;
        uploadBtnElem.style.display = "none";
        uploadBtnElem.addEventListener("change", () => {
            block.uploadFunction();
        });

        subImageElem.appendChild(this.#renderAddImageTile(uploadBtnElem.id));

        imageContainerElem.appendChild(subImageElem);
        imageContainerElem.appendChild(uploadBtnElem);
        return imageContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates an overlay for the specified image block DOM element.
        @param  block               Object with block data
        @param  showOptions         True to show options for the image
        @return                     DOM element
    */
    /******************************************************************************/
    #renderImageOverlay(block, showOptions=true) {
        const imageOverlayElem = document.createElement("div");
        imageOverlayElem.className = "image-overlay";

        const firstIconRowElem = document.createElement("div");

        const previewIconElem = document.createElement("i");
        previewIconElem.className = "fa-solid fa-magnifying-glass-plus clickable";
        previewIconElem.onclick = () => block.previewFunction(block.image);

        if (block.image.filename != PLACEHOLDER_IMAGE_FILE) {
            firstIconRowElem.appendChild(previewIconElem);
        }

        if (!showOptions) {
            imageOverlayElem.appendChild(firstIconRowElem);
            return imageOverlayElem;
        }

        const uploadBtnElem = document.createElement("input");
        uploadBtnElem.type = "file";
        if (block.uploadElementId == undefined) {
            block.uploadElementId = this.id + "ImageUpload" + this.numberOfInputs;
            this.numberOfInputs++;
        }
        uploadBtnElem.id = block.uploadElementId;
        uploadBtnElem.style.display = "none";
        uploadBtnElem.onchange = () => block.uploadFunction();

        if (block.image.filename != PLACEHOLDER_IMAGE_FILE) {
            const deleteIconElem = document.createElement("i");
            deleteIconElem.className = "fa-solid fa-trash clickable";
            deleteIconElem.style.marginLeft = "10px";
            deleteIconElem.onclick = () => block.deleteFunction(block.image.seller_id);

            firstIconRowElem.appendChild(deleteIconElem);
        } else {
            const addIconElem = document.createElement("i");
            addIconElem.className = "fa-solid fa-plus clickable";
            addIconElem.style.marginLeft = "10px";
            addIconElem.onclick = () => {
                document.getElementById(block.uploadElementId).click();
            };

            firstIconRowElem.appendChild(addIconElem);
        }

        imageOverlayElem.appendChild(firstIconRowElem);

        return imageOverlayElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates an overlay for the specified images block DOM element.
        @param  block               Object with block data
        @param  imageIndex          Index of the image
        @param  numberOfImages      Number of images
        @param  showOptions         True to show options for the image
        @param  showOrderingIcons   True to show ordering icons for the image
        @return                     DOM element
    */
    /******************************************************************************/
    #renderImagesOverlay(block, imageIndex, numberOfImages, showOptions=true, showOrderingIcons=true) {
        const imageOverlayElem = document.createElement("div");
        imageOverlayElem.className = "image-overlay";

        const firstIconRowElem = document.createElement("div");

        const previewIconElem = document.createElement("i");
        previewIconElem.className = "fa-solid fa-magnifying-glass-plus clickable";
        previewIconElem.onclick = () => block.previewFunction(imageIndex);

        if (block.images[imageIndex].filename != PLACEHOLDER_IMAGE_FILE) {
            firstIconRowElem.appendChild(previewIconElem);
        }

        if (!showOptions) {
            imageOverlayElem.appendChild(firstIconRowElem);
            return imageOverlayElem;
        }

        if (numberOfImages > 0 && block.images[imageIndex].filename != PLACEHOLDER_IMAGE_FILE) {
            const deleteIconElem = document.createElement("i");
            deleteIconElem.className = "fa-solid fa-trash clickable";
            deleteIconElem.style.marginLeft = "10px";
            deleteIconElem.onclick = () => {
                block.deleteFunction(block.images[imageIndex].option_id, block.images[imageIndex].image_id);
            };

            firstIconRowElem.appendChild(deleteIconElem);
        }

        if (!showOrderingIcons) {
            imageOverlayElem.appendChild(firstIconRowElem);
            return imageOverlayElem;
        }

        const secondIconRowElem = document.createElement("div");

        const moveUpIconElem = document.createElement("i");
        moveUpIconElem.className = "fa-solid fa-arrow-left clickable";
        moveUpIconElem.onclick = () => {
            block.moveUpFunction(block.images[imageIndex].image_id);
        };

        const moveDownIconElem = document.createElement("i");
        moveDownIconElem.className = "fa-solid fa-arrow-right clickable";
        moveDownIconElem.style.marginLeft = "10px";
        moveDownIconElem.onclick = () => {
            block.moveDownFunction(block.images[imageIndex].image_id);
        };

        if (imageIndex > 0) {
            secondIconRowElem.appendChild(moveUpIconElem);
        }

        if (imageIndex < numberOfImages - 1) {
            secondIconRowElem.appendChild(moveDownIconElem);
        }

        imageOverlayElem.appendChild(firstIconRowElem);
        imageOverlayElem.appendChild(secondIconRowElem);

        return imageOverlayElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the sub images of the images block DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderSubImages(block) {
        const subImageElem = document.createElement("div");
        subImageElem.className = "sub-image-container";

        let index = 0;

        let numberOfExistingImages = block.images.filter(img => !img.src).length;
        
        let showOrderingIcons;
        for (let image of block.images) {
            /* Skip main image */
            if (index == 0) {
                index++;
                continue;
            }

            const imageWrapperContainerElem = document.createElement("div");
            imageWrapperContainerElem.className = "image-wrapper";

            const imageElem = document.createElement("img");
            imageElem.className = "sub-image";
            if (image.filename != undefined) {
                imageElem.src = DOWNLOAD_IMAGE_URL + image.filename;
                showOrderingIcons = true;
            } else {
                imageElem.src = image.src;
                showOrderingIcons = false;
            }

            const imageOverlayElem = this.#renderImagesOverlay(block, index, numberOfExistingImages, true, showOrderingIcons);

            imageWrapperContainerElem.appendChild(imageElem);
            imageWrapperContainerElem.appendChild(imageOverlayElem);

            subImageElem.appendChild(imageWrapperContainerElem);
            index++;
        }

        return subImageElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the add image block DOM element.
        @param  uploadElementId     ID of the upload DOM element
        @return                     DOM element
    */
    /******************************************************************************/
    #renderAddImageTile(uploadElementId) {
        /* Create clickable wrapper */
        const tileElem = document.createElement("div");
        tileElem.className = "image-wrapper";
        tileElem.style.cursor = "pointer";

        /* When clicking the wrapper Ã¢â€ â€™ trigger file input */
        tileElem.addEventListener("click", () => document.getElementById(uploadElementId).click());

        /* Create inner box */
        const imageElem = document.createElement("div");
        imageElem.className = "sub-image";

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.className = "fa-solid fa-plus fa-lg";

        imageElem.appendChild(iconElem);
        tileElem.appendChild(imageElem);

        return tileElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified text area field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTextAreaField(block) {
        const fieldElem = document.createElement("textarea");
        fieldElem.id = block.id;
        fieldElem.className = "input-field description-input";
        fieldElem.rows = 8;
        fieldElem.cols = 80;
        fieldElem.style.width = block.width ?? "";
        fieldElem.style.height = block.height ?? "";

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified checkbox field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderCheckboxField(block) {
        const fieldElem = document.createElement("input");
        fieldElem.id = block.id;
        fieldElem.className = "input-field";
        fieldElem.type = "checkbox";
        fieldElem.onclick = block.onclickFunction ?? null;
        fieldElem.checked = block.checked ?? false;
        fieldElem.title = fieldElem.title ?? "";

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified checkbox field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderToggleField(block) {
        const fieldElem = document.createElement("div");
        fieldElem.className = "centered-flex";

        const labelElem = document.createElement("label");
        labelElem.className = "switch";
        labelElem.style.margin = "15px";

        const checkboxElem = document.createElement("input");
        checkboxElem.id = block.id;
        checkboxElem.type = "checkbox";
        checkboxElem.onclick = block.onclickFunction ?? null;

        const sliderElem = document.createElement("span");
        sliderElem.className = "slider round";

        labelElem.append(checkboxElem, sliderElem);
        fieldElem.appendChild(labelElem);

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified date field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderDateField(block) {
        const fieldElem = document.createElement("input");
        fieldElem.id = block.id;
        fieldElem.className = "input-field";
        fieldElem.type = "date";
        fieldElem.onclick = block.onclickFunction ?? null;
        fieldElem.title = block.title ?? "";
        fieldElem.value = block.value ?? "";

        if (PREFERS_DARK) {
            fieldElem.style.colorScheme = "dark";
        }

        if (block.constraints != undefined) {
            fieldElem.min = block.constraints.min ?? "";
            fieldElem.max = block.constraints.max ?? "";
        }

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified range field DOM elementX
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderRangeField(block) {
        const fieldElem = document.createElement("input");
        fieldElem.id = block.id;
        fieldElem.type = "range";
        fieldElem.className = "input-field";
        fieldElem.value = block.value ?? 0;
        if (block.constraints != undefined) {
            fieldElem.min = block.constraints.min ?? "";
            fieldElem.max = block.constraints.max ?? "";
        }

        fieldElem.oninput = block.oninputFunction ?? null;

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified select field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderSelectField(block) {
        const fieldElem = document.createElement("select");
        fieldElem.id = block.id;
        fieldElem.className = "input-field";
        fieldElem.onchange = block.onchangeFunction ?? null;

        if (block.options == undefined) {
            console.warn("No select options");
            return fieldElem;
        }
        
        let option;

        for (let opt of block.options) {
            option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.text;
            fieldElem.appendChild(option);
        }

        return fieldElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the specified text field DOM element.
        @param  block               Object with block data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderTextField(block) {
        const fieldElem = document.createElement("input");
        fieldElem.id = block.id;
        fieldElem.type = block.type;
        fieldElem.className = "input-field";
        fieldElem.value = block.value ?? "";
        if (block.constraints != undefined) {
            fieldElem.min = block.constraints.min ?? "";
            fieldElem.max = block.constraints.max ?? "";
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
        subContainerElem.append(this.#renderSubmitButton(), this.#renderDeleteButton());
        containerElem.appendChild(subContainerElem);

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Renders the delete button DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    #renderDeleteButton() {
        const buttonElem = document.createElement("button");
        buttonElem.id = this.deleteBtnId;
        buttonElem.className = "toolbar-button delete";
        buttonElem.onclick = this.deleteFunction ?? null;

        if (buttonElem.onclick == null) {
            buttonElem.style.display = "none";
        }

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.id = this.deleteBtnId + "Icon";
        iconElem.className = "fa-duotone fa-solid fa-trash fa-lg";

        /* Text */
        const titleElem = document.createElement("p");
        titleElem.id = this.deleteBtnId + "Title";
        titleElem.textContent = TEXT_DELETE;

        buttonElem.appendChild(iconElem);
        buttonElem.appendChild(titleElem);

        return buttonElem;
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

        if (buttonElem.onclick == null) {
            buttonElem.style.display = "none";
        }

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.id = this.submitBtnId + "Icon";
        iconElem.className = this.submitIcon;

        /* Text */
        const titleElem = document.createElement("p");
        titleElem.id = this.submitBtnId + "Title";
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
        @brief  Generates a HTML description element with the specified intro,
                sections and footer.
        @param  {intro,             Intro text on top of sections
                sections,           Array of sections to include
                footer}             Footer text below the sections
        @return                     HTML string
    */
    /******************************************************************************/
    #buildSectionHtml({intro=undefined, sections=[], footer=undefined}) {
        let html = "";
        if (intro != undefined) {
            html += `<p>${intro}</p>`;
        }

        for (const section of sections) {
            if (typeof section.label !== "undefined") {
                html += `<p>${section.label}</p>`;
            }
            html += this.#renderHtmlList(section.items);
        }

        if (footer != undefined) {
            html += `<p>${footer}</p>`;
        }

        return html;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a HTML list with the specified items as string.
        @param  items               Items to show
        @return                     HTML list string
    */
    /******************************************************************************/
    #renderHtmlList(items) {
        return `
            <ul class="popup-list-container" style="background-color: var(--background4);">
                ${(items ?? []).map(item => `<li>${item}</li>`).join("")}
            </ul>
        `;
    }

    /******************************************************************************/
    /*!
        @brief  Builds the block and field registery to access them during updates.
    */
    /******************************************************************************/
    #buildRegistry() {
        this.#blockMap.clear();
        this.#fieldMap.clear();

        for (const column of this.columns) {
            for (const block of column.blocks ?? []) {

                /* Register block */
                if (block.id) {
                    this.#blockMap.set(block.id, block);
                }
                if (block.blockId) {
                    this.#blockMap.set(block.blockId, block);
                }

                /* Register fields */
                if (
                    block.blockType === MODAL_BLOCK_TYPE_INPUT ||
                    block.blockType === MODAL_BLOCK_TYPE_INPUT_WITH_ICON
                ) {
                    this.#fieldMap.set(block.id, block);
                }

                /* Nested fields */
                if (block.blockType === MODAL_BLOCK_TYPE_MULTIPLE_INPUTS) {
                    for (const field of block.inputFields ?? []) {
                        this.#fieldMap.set(field.id, field);
                    }
                }
            }
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
