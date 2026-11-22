/******************************************************************************
 *
 * File:    MultiStepModalForm.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Coordinates forms that are divided into multiple modal steps.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {button, element} from "../core/dom.js";
import {ModalForm} from "./ModalForm.js";

export class MultiStepModalForm extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.step = 0;
        this.values = {...(props.values ?? {})};
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();
        this.child?.destroy();

        const steps = this.props.steps ?? [];
        const current = steps[this.step];

        if (!current) return this.root.replaceChildren();

        const childRoot = document.createElement("div");

        this.root.replaceChildren(childRoot);
        this.child = new ModalForm(childRoot, {
            ...this.props,
            ...current,
            title: current.title ?? this.props.title,
            values: this.values,
            submitLabel: this.step === steps.length - 1
                ? this.props.submitLabel ?? "Save"
                : current.nextLabel ?? "Next"
        }).mount();

        const stepperElem = this.#renderStepper(steps);

        this.child.dialog?.querySelector("h2")?.after(stepperElem);

        /******************************************************************************/
        /*!
         * @brief   Saves the current step and advances or submits the complete form.
         * @param   event                Step submission event.
         */
        /******************************************************************************/
        this.listen(childRoot, "ui:submit", event => {
            event.stopPropagation();
            this.values = {...this.values, ...event.detail.values};

            if (this.step < steps.length - 1) {
                this.step += 1;
                this.render();
            } else {
                this.emit("submit", {values: this.values});
            }
        }, {once: true});
    }

    /******************************************************************************/
    /*!
     * @brief   Saves the current values and returns to the previous form step.
     */
    /******************************************************************************/
    previous() {
        if (this.step === 0) return;

        this.#goToStep(this.step - 1);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   values               Value supplied for values.
     */
    /******************************************************************************/
    show(values = {}) {
        this.step = 0;
        this.values = {...values};
        this.props.open = true;
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        this.child?.destroy();
        super.destroy();
    }

    /******************************************************************************/
    /*!
     * @brief   Renders accessible progress and backward navigation for all steps.
     * @param   steps                Configured modal steps.
     * @returns HTMLOListElement    Rendered stepper list.
     */
    /******************************************************************************/
    #renderStepper(steps) {
        const stepperElem = element("ol", {
            className: "modal-stepper",
            attributes: {"aria-label": this.props.stepperLabel ?? "Form progress"}
        });

        for (const item of describeSteps(steps, this.step)) {
            const markerElem = element("span", {
                className: "modal-stepper-marker",
                text: item.number
            });

            const labelElem = element("span", {
                className: "modal-stepper-label",
                text: item.label
            });

            const stateElem = element("span", {
                className: "modal-stepper-state",
                text: item.stateLabel
            });

            let contentElem = element("span", {className: "modal-stepper-content"}, [
                markerElem,
                labelElem,
                stateElem
            ]);

            if (item.state === "complete") {
                contentElem = button({
                    title: `Go to ${item.label}`,
                    className: "modal-stepper-button",
                    dataset: {step: item.index}
                });
                contentElem.append(markerElem, labelElem, stateElem);

                /******************************************************************************/
                /*!
                 * @brief   Returns to a completed step without bypassing future validation.
                 */
                /******************************************************************************/
                const handleStepClick = () => this.#goToStep(item.index);

                this.listen(contentElem, "click", handleStepClick);
            }

            const attributes = item.ariaCurrent ? {"aria-current": item.ariaCurrent} : {};

            stepperElem.append(element("li", {
                className: `modal-stepper-item ${item.state}`,
                attributes
            }, [contentElem]));
        }

        return stepperElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Saves current values and navigates to an earlier completed step.
     * @param   targetStep           Zero-based target step.
     */
    /******************************************************************************/
    #goToStep(targetStep) {
        if (targetStep < 0 || targetStep >= this.step) return;

        this.values = {...this.values, ...this.child.getValues()};
        this.step = targetStep;
        this.render();
    }
}

/******************************************************************************/
/*!
 * @brief   Describes visual and accessible state for each configured step.
 * @param   steps                Configured modal steps.
 * @param   currentStep          Zero-based active step.
 * @returns object[]            Step descriptions for rendering.
 */
/******************************************************************************/
export function describeSteps(steps, currentStep) {
    return steps.map((step, index) => {
        let state = "upcoming";

        if (index < currentStep) state = "complete";
        if (index === currentStep) state = "current";

        return {
            index,
            number: index + 1,
            label: step.label ?? step.title ?? `Step ${index + 1}`,
            state,
            stateLabel: state === "complete"
                ? "Completed"
                : state === "current" ? "Current" : "Upcoming",
            ariaCurrent: state === "current" ? "step" : null
        };
    });
}
