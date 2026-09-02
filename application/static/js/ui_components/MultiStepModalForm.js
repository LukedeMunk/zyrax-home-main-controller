/******************************************************************************/
/*
 * File:    MultiStepModalForm.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    constructor(configuration) {
        this.setConfiguration(configuration);
    }

    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    show() {
        this.showStep(0, false);
    }

    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    close() {
        this.modals[this.currentStepIndex]?.close();
    }

    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    next() {
        const nextStepIndex = this.#findEnabledStepIndex(this.currentStepIndex + 1, 1);
        this.showStep(nextStepIndex);
    }

    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    previous() {
        const previousStepIndex = this.#findEnabledStepIndex(this.currentStepIndex - 1, -1);
        this.showStep(previousStepIndex);
    }

    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    submit() {
        const values = this.validate();
        if (values !== false) this.submitFunction?.(values);
    }

    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    getDomElement() {
	    return this.modals[this.currentStepIndex]?.getDomElement();
    }

    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setTitle(title) {
        this.title = title;
        //this.modals.forEach(modal => modal.setTitle(title));TODO
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setSubmitFunction(callback) {
        this.submitFunction = callback ?? null;
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    setPreviousStepFunction(callback) {
        this.previousStepFunction = callback ?? (() => this.previous());
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setDeleteFunction(callback) {
        this.deleteFunction = callback ?? null;
        this.modals.forEach(modal => modal.setDeleteFunction(this.deleteFunction));
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    resetValues() {
        this.modals.forEach(modal => modal.resetValues());
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    resetValidationElements() {
        this.modals.forEach(modal => modal.resetValidationElements());
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setSelectOptions(fieldId, options) {
        this.#getModalForField(fieldId)?.setSelectOptions(fieldId, options);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setTileSelectOptions(fieldId, tiles) {
        this.#getModalForField(fieldId)?.setTileSelectOptions(fieldId, tiles);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setValue(fieldId, value) {
        this.#getModalForField(fieldId)?.setValue(fieldId, value);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setValues(values) {
        this.#allFieldIds().forEach((fieldId, index) => this.setValue(fieldId, values[index]));
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    getValue(fieldId) {
        return this.#getModalForField(fieldId)?.getValue(fieldId);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    getValues() {
        return this.modals.flatMap(modal => modal.getValues());
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setFieldDisabled(fieldId, disabled, title = "") {
        this.#getModalForField(fieldId).setFieldDisabled(fieldId, disabled, title);
    }
    setStepDisabled(stepIndex, disabled = true) {//TODO use id instead of indexes
        if (stepIndex < 0 || stepIndex >= this.modals.length) return;
        this.disabledSteps[stepIndex] = disabled;
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setBlockVisibility(blockId, visible, displayType = "block") {
        this.#getModalForBlock(blockId).setBlockVisibility(blockId, visible, displayType);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setIcon(blockId, iconClass, onclickFunction = undefined) {
        this.#getModalForField(blockId).setIcon(blockId, iconClass, onclickFunction);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setFieldTitle(fieldId, title) {
        this.#getModalForField(fieldId).setFieldTitle(fieldId, title);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    setErrorMessage(message) {
        this.modals[this.currentStepIndex].setErrorMessage(message);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    #getModalForField(fieldId) {
        return this.fieldModalMap.get(fieldId);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    #getModalForBlock(blockId) {
        return this.blockModalMap.get(blockId);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
    */
    /******************************************************************************/
    #validateStep(stepIndex, id=undefined) {
        if (this.disabledSteps[stepIndex]) return [];
        return this.modals[stepIndex].validate(id);
    }
    
    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    #allFieldIds() {
        return this.steps.flatMap(step => this.#fieldIds(step));
    }

    /******************************************************************************/
    /*!
        @brief  XXX
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
        @brief  XXX
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
        @brief  XXX
    */
    /******************************************************************************/
    #blockIds(step) {
        return (step.columns ?? []).flatMap(column => column.blocks ?? []).flatMap(block => {
            return [block.blockId];
        }).filter(Boolean);
    }
}
