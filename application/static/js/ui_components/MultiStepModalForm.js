class MultiStepModalForm {
    constructor(configuration) {
        this.setConfiguration(configuration);
    }

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

    render() {
        this.modals.forEach((modal, index) => {
            modal.render();
            if (index > 0) this.#renderPreviousButton(modal, index);
        });
    }

    show() {
        this.showStep(0, false);
    }

    close() {
        this.modals[this.currentStepIndex]?.close();
    }

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

    next() {
        const nextStepIndex = this.#findEnabledStepIndex(this.currentStepIndex + 1, 1);
        this.showStep(nextStepIndex);
    }

    previous() {
        const previousStepIndex = this.#findEnabledStepIndex(this.currentStepIndex - 1, -1);
        this.showStep(previousStepIndex);
    }

    submit() {
        const values = this.validate();
        if (values !== false) this.submitFunction?.(values);
    }

    validate(id=undefined) {
        const values = [];
        for (let stepIndex = 0; stepIndex < this.modals.length; stepIndex++) {
            const stepValues = this.#validateStep(stepIndex, id);
            if (stepValues === false) return false;
            values.push(...stepValues);
        }
        return values;
    }

    getDomElement() {
	    return this.modals[this.currentStepIndex]?.getDomElement();
    }
    setTitle(title) {
        this.title = title;
        //this.modals.forEach(modal => modal.setTitle(title));TODO
    }
    setSubmitFunction(callback) {
        this.submitFunction = callback ?? null;
    }
    setNextStepFunction(callback) {
        const isLastStep = this.currentStepIndex === this.modals.length - 1;
        const submitFunction = isLastStep
            ? () => this.submit()
            : callback
                ? () => callback()
                : () => this.next();

        this.modals[this.currentStepIndex]?.setSubmitFunction(submitFunction);
    }
    setPreviousStepFunction(callback) {
        this.previousStepFunction = callback ?? (() => this.previous());
    }
    setDeleteFunction(callback) {
        this.deleteFunction = callback ?? null;
        this.modals.forEach(modal => modal.setDeleteFunction(this.deleteFunction));
    }
    resetValues() {
        this.modals.forEach(modal => modal.resetValues());
    }
    resetValidationElements() {
        this.modals.forEach(modal => modal.resetValidationElements());
    }
    setSelectOptions(fieldId, options) {
        this.#getModalForField(fieldId)?.setSelectOptions(fieldId, options);
    }
    setTileSelectOptions(fieldId, tiles) {
        this.#getModalForField(fieldId)?.setTileSelectOptions(fieldId, tiles);
    }
    setValue(fieldId, value) {
        this.#getModalForField(fieldId)?.setValue(fieldId, value);
    }
    setValues(values) {
        this.#allFieldIds().forEach((fieldId, index) => this.setValue(fieldId, values[index]));
    }
    getValue(fieldId) {
        return this.#getModalForField(fieldId)?.getValue(fieldId);
    }
    getValues() {
        return this.modals.flatMap(modal => modal.getValues());
    }
    setFieldDisabled(fieldId, disabled, title = "") {
        this.#getModalForField(fieldId).setFieldDisabled(fieldId, disabled, title);
    }
    setStepDisabled(stepIndex, disabled = true) {//TODO use id instead of indexes
        if (stepIndex < 0 || stepIndex >= this.modals.length) return;
        this.disabledSteps[stepIndex] = disabled;
    }
    setBlockVisibility(blockId, visible, displayType = "block") {
        this.#getModalForBlock(blockId).setBlockVisibility(blockId, visible, displayType);
    }
    setIcon(blockId, iconClass, onclickFunction = undefined) {
        this.#getModalForField(blockId).setIcon(blockId, iconClass, onclickFunction);
    }
    setFieldTitle(fieldId, title) {
        this.#getModalForField(fieldId).setFieldTitle(fieldId, title);
    }
    setErrorMessage(message) {
        this.modals[this.currentStepIndex].setErrorMessage(message);
    }

    #getModalForField(fieldId) { return this.fieldModalMap.get(fieldId); }
    #getModalForBlock(blockId) { return this.blockModalMap.get(blockId); }
    #validateStep(stepIndex, id=undefined) {
        if (this.disabledSteps[stepIndex]) return [];
        return this.modals[stepIndex].validate(id);
    }
    #findEnabledStepIndex(stepIndex, direction) {
        while (stepIndex >= 0 && stepIndex < this.modals.length && this.disabledSteps[stepIndex]) {
            stepIndex += direction;
        }
        return stepIndex;
    }
    #allFieldIds() { return this.steps.flatMap(step => this.#fieldIds(step)); }
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
        title.textContent =
            this.steps[stepIndex].previousStepTitle ?? "Previous";

        button.append(icon, title);

        document
            .getElementById(modal.id)
            ?.querySelector(".toolbar-sub")
            ?.prepend(button);
    }

    #fieldIds(step) {
        return (step.columns ?? []).flatMap(column => column.blocks ?? []).flatMap(block => {
            if (block.blockType === MODAL_BLOCK_TYPE_MULTIPLE_INPUTS) return (block.inputFields ?? []).map(field => field.id);
            return [MODAL_BLOCK_TYPE_INPUT, MODAL_BLOCK_TYPE_INPUT_WITH_ICON, MODAL_BLOCK_TYPE_TILE_SELECT].includes(block.blockType) ? [block.id] : [];
        }).filter(Boolean);
    }

    #blockIds(step) {
        return (step.columns ?? []).flatMap(column => column.blocks ?? []).flatMap(block => {
            return [block.blockId];
        }).filter(Boolean);
    }
}
