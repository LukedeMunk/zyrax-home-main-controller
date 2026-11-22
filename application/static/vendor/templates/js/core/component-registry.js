/******************************************************************************
 *
 * File:    component-registry.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Registers, mounts, updates, and destroys declarative UI components.
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
/** Declarative component mounting for elements with a data-ui attribute. */
export class ComponentRegistry {
    #definitions = new Map();
    #instances = new WeakMap();
    #refs = new Map();

    /******************************************************************************/
    /*!
     * @brief   Registers an implementation under a unique type name.
     * @param   name                 Value supplied for name.
     * @param   ComponentClass       Value supplied for ComponentClass.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    register(name, ComponentClass) {
        if (!name || typeof ComponentClass !== "function") {
            throw new TypeError("register(name, ComponentClass) requires both arguments.");
        }

        if (this.#definitions.has(name)) {
            throw new Error(`Component already registered: ${name}`);
        }

        this.#definitions.set(name, ComponentClass);
        return this;
    }

    /******************************************************************************/
    /*!
     * @brief   Mounts the instance and performs its initial rendering or data load.
     * @param   root                 Value supplied for root.
     * @param   configurations       Value supplied for configurations.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    mount(root = document, configurations = {}) {
        const hosts = [];

        if (root.matches?.("[data-ui]")) hosts.push(root);
        hosts.push(...root.querySelectorAll("[data-ui]"));

        for (const host of hosts) {
            if (!this.#instances.has(host)) this.mountElement(host, configurations);
        }

        return this;
    }

    /******************************************************************************/
    /*!
     * @brief   Creates and mounts the component declared by a host element.
     * @param   host                 Value supplied for host.
     * @param   configurations       Value supplied for configurations.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    mountElement(host, configurations = {}) {
        const name = host.dataset.ui;
        const ComponentClass = this.#definitions.get(name);

        if (!ComponentClass) throw new Error(`Unknown component: ${name}`);

        const ref = host.dataset.ref;
        const inlineProps = parseProps(host.dataset.props);
        const configuredProps = ref ? configurations[ref] : configurations[name];
        const props = {...inlineProps, ...(configuredProps ?? {})};
        const instance = new ComponentClass(host, props).mount();

        this.#instances.set(host, instance);

        if (ref) {
            if (this.#refs.has(ref)) throw new Error(`Duplicate component ref: ${ref}`);

            this.#refs.set(ref, instance);
        }

        return instance;
    }

    /******************************************************************************/
    /*!
     * @brief   Retrieves the requested value or resource.
     * @param   ref                  Value supplied for ref.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    get(ref) {
        return this.#refs.get(ref) ?? null;
    }

    /******************************************************************************/
    /*!
     * @brief   Updates the instance with the supplied data.
     * @param   ref                  Value supplied for ref.
     * @param   props                Value supplied for props.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    update(ref, props) {
        const instance = this.get(ref);

        if (!instance) throw new Error(`Component ref not mounted: ${ref}`);

        instance.update(props);

        return instance;
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     * @param   root                 Value supplied for root.
     */
    /******************************************************************************/
    destroy(root = document) {
        const hosts = [];

        if (root.matches?.("[data-ui]")) hosts.push(root);
        hosts.push(...root.querySelectorAll("[data-ui]"));

        for (const host of hosts) {
            const instance = this.#instances.get(host);

            if (!instance) continue;

            instance.destroy();
            this.#instances.delete(host);

            if (host.dataset.ref) this.#refs.delete(host.dataset.ref);
        }
    }
}

/******************************************************************************/
/*!
 * @brief   Performs the parse props operation.
 * @param   value                Value supplied for value.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
function parseProps(value) {
    if (!value) return {};

    try {
        return JSON.parse(value);
    } catch (error) {
        throw new SyntaxError(`Invalid JSON in data-props: ${error.message}`);
    }
}
