/******************************************************************************/
/*
 * File:    MultiStepModalForm.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Reusable modal form with multiple configurable steps.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/

class MultiStepModalForm {
    /******************************************************************************/
    /*!
        @brief  Creates a multi-step modal form.
        @param  configuration       Multi-step modal configuration
        @return                     Multi-step modal form
    */
    /******************************************************************************/
    constructor(configuration) {
        this.setConfiguration(configuration);
    }

    /******************************************************************************/
    /*!
        @brief  Applies the modal and step configuration.
        @param  configuration       Multi-step modal configuration
    */
    /******************************************************************************/
    setConfiguration(configuration) {
        this.id = configuration.id ?? "multiStepModalForm";
        this.title = configuration.title ?? "";
        this.steps = configuration.steps ?? [];
        this.submitFunction = configuration.submitFunction ?? null;
        this.deleteFunction = configuration.deleteFunction ?? null;
        this.nextStepFunction = configuration.nextStepFunction ?? null;
        this.previousStepFunction = configuration.previousStepFunction ?? null;
        this.nextStepBtnId = this.id + "SubmitBtn";
        this.currentStepIndex = 0;
        this.disabledSteps = this.steps.map(step => step.disabled ?? false);
        this.fieldModalMap = new Map();
        this.blockModalMap = new Map();

        this.modals = this.steps.map((step, index) => {
            const modalConfiguration = {
                ...configuration,
                ...step,
                id: index === 0 ? this.id : `${this.id}Step${index}`,
                title: step.title ?? this.title,
                columns: step.columns ?? [],
                deleteFunction: this.deleteFunction,
                submitFunction: () => index === this.steps.length - 1
                                ? this.submit()
                                : this.nextStepFunction
                                ? this.nextStepFunction()
                                : this.next(),
                submitTitle: index === this.steps.length - 1
                    ? configuration.submitTitle
                    : step.nextStepTitle ?? TEXT_GO_TO_NEXT_STEP,
                submitIcon: index === this.steps.length - 1
                    ? configuration.submitIcon
                    : "fa-duotone fa-solid fa-arrow-right fa-lg"
            };
            const modal = new ModalForm(modalConfiguration);
            this.#fieldIds(step).forEach(fieldId => this.fieldModalMap.set(fieldId, modal));
            this.#blockIds(step).forEach(blockId => this.blockModalMap.set(blockId, modal));
            return modal;
        });
    }

    /******************************************************************************/
    /*!
        @brief  Renders every modal step.
    */
    /******************************************************************************/
    render() {
        this.modals.forEach((modal, index) => {
            modal.render();
            if (index > 0) this.#renderPreviousButton(modal, index);
        });
    }

    /******************************************************************************/
    /*!
        @brief  Shows the first enabled step.
    */
    /******************************************************************************/
    show() {
        this.showStep(0, false);
    }

    /******************************************************************************/
    /*!
        @brief  Closes the current modal step.
    */
    /******************************************************************************/
    close() {
        this.modals[this.currentStepIndex]?.close();
    }

    /******************************************************************************/
    /*!
        @brief  Shows a configured modal step.
        @param  index               Target step index
        @param  closeCurrent        Whether to close the current step
    */
    /******************************************************************************/
    showStep(index, closeCurrent=true) {
        if (index < 0 || index >= this.modals.length || index === this.currentStepIndex && closeCurrent) return;

        if (index > this.currentStepIndex) {
            if (this.#validateStep(this.currentStepIndex) === false) return;
        }

        const openNext = () => {
            this.currentStepIndex = index;
            this.modals[index].show();
        };

        if (closeCurrent && this.modals[this.currentStepIndex]?.isOpen) {
            this.modals[this.currentStepIndex].close();
            setTimeout(openNext, 310);
        } else {
            openNext();
        }
    }

    /******************************************************************************/
    /*!
        @brief  Shows the next enabled step.
    */
    /******************************************************************************/
    next() {
        const nextStepIndex = this.#findEnabledStepIndex(this.currentStepIndex + 1, 1);
        this.showStep(nextStepIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Shows the previous enabled step.
    */
    /******************************************************************************/
    previous() {
        const previousStepIndex = this.#findEnabledStepIndex(this.currentStepIndex - 1, -1);
        this.showStep(previousStepIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Validates and submits all steps.
    */
    /******************************************************************************/
    submit() {
        const values = this.validate();
        if (values !== false) this.submitFunction?.(values);
    }

    /******************************************************************************/
    /*!
        @brief  Validates all enabled steps.
        @param  id                  Optional field identifier
        @return                     Form values or false when invalid
    */
    /******************************************************************************/
    validate(id=undefined) {
        const values = [];
        for (let stepIndex = 0; stepIndex < this.modals.length; stepIndex++) {
            const stepValues = this.#validateStep(stepIndex, id);
            if (stepValues === false) return false;
            values.push(...stepValues);
        }
        return values;
    }

    /******************************************************************************/
    /*!
        @brief  Returns the current modal DOM element.
        @return                     Current modal DOM element
    */
    /******************************************************************************/
    getDomElement() {
	    return this.modals[this.currentStepIndex]?.getDomElement();
    }

    /******************************************************************************/
    /*!
        @brief  Sets the modal title.
        @param  title               Modal title
    */
    /******************************************************************************/
    setTitle(title) {
        this.title = title;
        //this.modals.forEach(modal => modal.setTitle(title));TODO
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the form submit callback.
        @param  callback            Submit callback
    */
    /******************************************************************************/
    setSubmitFunction(callback) {
        this.submitFunction = callback ?? null;
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the callback for the current next button.
        @param  callback            Next-step callback
    */
    /******************************************************************************/
    setNextStepFunction(callback) {
        const isLastStep = this.currentStepIndex === this.modals.length - 1;
        const submitFunction = isLastStep
            ? () => this.submit()
            : callback
                ? () => callback()
                : () => this.next();

        this.modals[this.currentStepIndex]?.setSubmitFunction(submitFunction);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the previous-step callback.
        @param  callback            Previous-step callback
    */
    /******************************************************************************/
    setPreviousStepFunction(callback) {
        this.previousStepFunction = callback ?? (() => this.previous());
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the delete callback for every step.
        @param  callback            Delete callback
    */
    /******************************************************************************/
    setDeleteFunction(callback) {
        this.deleteFunction = callback ?? null;
        this.modals.forEach(modal => modal.setDeleteFunction(this.deleteFunction));
    }
    
    /******************************************************************************/
    /*!
        @brief  Resets values in every modal step.
    */
    /******************************************************************************/
    resetValues() {
        this.modals.forEach(modal => modal.resetValues());
    }
    
    /******************************************************************************/
    /*!
        @brief  Clears validation feedback in every step.
    */
    /******************************************************************************/
    resetValidationElements() {
        this.modals.forEach(modal => modal.resetValidationElements());
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets options for a select field.
        @param  fieldId             Field identifier
        @param  options             Select options
    */
    /******************************************************************************/
    setSelectOptions(fieldId, options) {
        this.#getModalForField(fieldId)?.setSelectOptions(fieldId, options);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets options for a tile-select field.
        @param  fieldId             Field identifier
        @param  tiles               Tile options
    */
    /******************************************************************************/
    setTileSelectOptions(fieldId, tiles) {
        this.#getModalForField(fieldId)?.setTileSelectOptions(fieldId, tiles);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets a field value.
        @param  fieldId             Field identifier
        @param  value               Field value
    */
    /******************************************************************************/
    setValue(fieldId, value) {
        this.#getModalForField(fieldId)?.setValue(fieldId, value);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets all form values in field order.
        @param  values              Ordered field values
    */
    /******************************************************************************/
    setValues(values) {
        this.#allFieldIds().forEach((fieldId, index) => this.setValue(fieldId, values[index]));
    }
    
    /******************************************************************************/
    /*!
        @brief  Returns a field value.
        @param  fieldId             Field identifier
        @return                     Field value
    */
    /******************************************************************************/
    getValue(fieldId) {
        return this.#getModalForField(fieldId)?.getValue(fieldId);
    }
    
    /******************************************************************************/
    /*!
        @brief  Returns all form values.
        @return                     Form values
    */
    /******************************************************************************/
    getValues() {
        return this.modals.flatMap(modal => modal.getValues());
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets whether a field is disabled.
        @param  fieldId             Field identifier
        @param  disabled            Whether the field is disabled
        @param  title               Disabled-state title
    */
    /******************************************************************************/
    setFieldDisabled(fieldId, disabled, title = "") {
        this.#getModalForField(fieldId).setFieldDisabled(fieldId, disabled, title);
    }
    /******************************************************************************/
    /*!
        @brief  Sets whether a modal step is disabled.
        @param  stepIndex           Step index
        @param  disabled            Whether the step is disabled
    */
    /******************************************************************************/
    setStepDisabled(stepIndex, disabled = true) {//TODO use id instead of indexes
        if (stepIndex < 0 || stepIndex >= this.modals.length) return;
        this.disabledSteps[stepIndex] = disabled;
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the visibility of a form block.
        @param  blockId             Block identifier
        @param  visible             Whether the block is visible
        @param  displayType         Visible CSS display value
    */
    /******************************************************************************/
    setBlockVisibility(blockId, visible, displayType = "block") {
        this.#getModalForBlock(blockId).setBlockVisibility(blockId, visible, displayType);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the icon for a form block.
        @param  blockId             Block identifier
        @param  iconClass           Icon class
        @param  onclickFunction     Optional click callback
    */
    /******************************************************************************/
    setIcon(blockId, iconClass, onclickFunction = undefined) {
        this.#getModalForField(blockId).setIcon(blockId, iconClass, onclickFunction);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the title of a form field.
        @param  fieldId             Field identifier
        @param  title               Field title
    */
    /******************************************************************************/
    setFieldTitle(fieldId, title) {
        this.#getModalForField(fieldId).setFieldTitle(fieldId, title);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the error message for the current step.
        @param  message             Error message
    */
    /******************************************************************************/
    setErrorMessage(message) {
        this.modals[this.currentStepIndex].setErrorMessage(message);
    }
    
    /******************************************************************************/
    /*!
        @brief  Returns the modal that contains a field.
        @param  fieldId             Field identifier
        @return                     Modal form
    */
    /******************************************************************************/
    #getModalForField(fieldId) {
        return this.fieldModalMap.get(fieldId);
    }
    
    /******************************************************************************/
    /*!
        @brief  Returns the modal that contains a block.
        @param  blockId             Block identifier
        @return                     Modal form
    */
    /******************************************************************************/
    #getModalForBlock(blockId) {
        return this.blockModalMap.get(blockId);
    }
    
    /******************************************************************************/
    /*!
        @brief  Validates one modal step.
        @param  stepIndex           Step index
        @param  id                  Optional field identifier
        @return                     Step values or false when invalid
    */
    /******************************************************************************/
    #validateStep(stepIndex, id=undefined) {
        if (this.disabledSteps[stepIndex]) return [];
        return this.modals[stepIndex].validate(id);
    }
    
    /******************************************************************************/
    /*!
        @brief  Finds the next enabled step in a direction.
        @param  stepIndex           Starting step index
        @param  direction           Search direction
        @return                     Enabled step index
    */
    /******************************************************************************/
    #findEnabledStepIndex(stepIndex, direction) {
        while (stepIndex >= 0 && stepIndex < this.modals.length && this.disabledSteps[stepIndex]) {
            stepIndex += direction;
        }
        return stepIndex;
    }

    /******************************************************************************/
    /*!
        @brief  Returns all configured field identifiers.
        @return                     Field identifiers
    */
    /******************************************************************************/
    #allFieldIds() {
        return this.steps.flatMap(step => this.#fieldIds(step));
    }

    /******************************************************************************/
    /*!
        @brief  Renders the previous button for a step.
        @param  modal               Modal form
        @param  stepIndex           Step index
    */
    /******************************************************************************/
    #renderPreviousButton(modal, stepIndex) {
        const button = document.createElement("button");
        button.className = "toolbar-button";

        button.onclick = () => {
            if (this.previousStepFunction) {
                this.previousStepFunction();
            } else {
                this.previous();
            }
        };

        const icon = document.createElement("i");
        icon.className = "fa-duotone fa-solid fa-arrow-left fa-lg";

        const title = document.createElement("p");
        title.textContent = this.steps[stepIndex].previousStepTitle ?? "Previous";

        button.append(icon, title);

        document
            .getElementById(modal.id)
            ?.querySelector(".toolbar-sub")
            ?.prepend(button);
    }

    /******************************************************************************/
    /*!
        @brief  Returns field identifiers configured in a step.
        @param  step                Step configuration
        @return                     Field identifiers
    */
    /******************************************************************************/
    #fieldIds(step) {
        return (step.columns ?? []).flatMap(column => column.blocks ?? []).flatMap(block => {
            if (block.blockType === MODAL_BLOCK_TYPE_MULTIPLE_INPUTS) return (block.inputFields ?? []).map(field => field.id);
            return [MODAL_BLOCK_TYPE_INPUT, MODAL_BLOCK_TYPE_INPUT_WITH_ICON, MODAL_BLOCK_TYPE_TILE_SELECT].includes(block.blockType) ? [block.id] : [];
        }).filter(Boolean);
    }

    /******************************************************************************/
    /*!
        @brief  Returns block identifiers configured in a step.
        @param  step                Step configuration
        @return                     Block identifiers
    */
    /******************************************************************************/
    #blockIds(step) {
        return (step.columns ?? []).flatMap(column => column.blocks ?? []).flatMap(block => {
            return [block.blockId];
        }).filter(Boolean);
    }
}
