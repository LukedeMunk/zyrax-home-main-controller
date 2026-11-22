/******************************************************************************
 *
 * File:    FieldRegistry.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Registers and resolves form field renderer functions.
 * 
 *          Read-only
 *
 *****************************************************************************/
export class FieldRegistry {
    #renderers = new Map();

    /******************************************************************************/
    /*!
     * @brief   Registers an implementation under a unique type name.
     * @param   type                 Value supplied for type.
     * @param   renderer             Value supplied for renderer.
     * @returns FieldRegistry       This registry for fluent registration.
     */
    /******************************************************************************/
    register(type, renderer) {
        if (this.#renderers.has(type)) {
            throw new Error(`Field renderer already registered: ${type}`);
        }

        this.#renderers.set(type, renderer);

        return this;
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     * @param   field                Value supplied for field.
     * @param   value                Value supplied for value.
     * @param   context              Rendering and lifecycle services.
     * @returns HTMLElement|object  Renderer output.
     */
    /******************************************************************************/
    render(field, value, context = {}) {
        const renderer = this.#renderers.get(field.type ?? "text");

        if (!renderer) throw new Error(`Unknown field type: ${field.type}`);

        return renderer(field, value, context);
    }
}
