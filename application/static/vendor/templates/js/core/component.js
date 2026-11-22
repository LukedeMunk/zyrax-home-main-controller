/******************************************************************************
 *
 * File:    component.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Defines the framework-free lifecycle shared by UI components.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
/**
 * Small, framework-free lifecycle shared by every UI component.
 * Components own only the DOM below their root element.
 */
export class Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        if (!root || typeof root.replaceChildren !== "function") {
            throw new TypeError("A component requires a valid root element.");
        }

        this.root = root;
        this.props = {...props};
        this.mounted = false;
        this._events = new AbortController();
    }

    /******************************************************************************/
    /*!
     * @brief   Mounts the instance and performs its initial rendering or data load.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    mount() {
        if (this.mounted) return this;

        this.mounted = true;
        this.render();

        return this;
    }

    /******************************************************************************/
    /*!
     * @brief   Updates the instance with the supplied data.
     * @param   nextProps            Value supplied for nextProps.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    update(nextProps = {}) {
        this.props = {...this.props, ...nextProps};

        if (this.mounted) this.render();

        return this;
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        throw new Error(`${this.constructor.name}.render() is not implemented.`);
    }

    /******************************************************************************/
    /*!
     * @brief   Registers an event listener owned by the component lifecycle.
     * @param   target               Value supplied for target.
     * @param   type                 Value supplied for type.
     * @param   listener             Value supplied for listener.
     * @param   options              Value supplied for options.
     */
    /******************************************************************************/
    listen(target, type, listener, options = {}) {
        target.addEventListener(type, listener, {
            ...options,
            signal: this._events.signal
        });
    }

    /******************************************************************************/
    /*!
     * @brief   Dispatches a bubbling component event from the root element.
     * @param   type                 Value supplied for type.
     * @param   detail               Value supplied for detail.
     */
    /******************************************************************************/
    emit(type, detail = {}) {
        this.root.dispatchEvent(new CustomEvent(`ui:${type}`, {
            bubbles: true,
            detail
        }));
    }

    /******************************************************************************/
    /*!
     * @brief   Removes registered listeners and starts a fresh listener lifecycle.
     */
    /******************************************************************************/
    resetListeners() {
        this._events.abort();
        this._events = new AbortController();
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        this._events.abort();
        this.root.replaceChildren();
        this.mounted = false;
    }
}

/******************************************************************************/
/*!
 * @brief   Finds a required descendant element or reports a missing invariant.
 * @param   root                 Value supplied for root.
 * @param   selector             Value supplied for selector.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function requireElement(root, selector) {
    const element = root.querySelector(selector);

    if (!element) throw new Error(`Required element not found: ${selector}`);

    return element;
}
