/******************************************************************************
 *
 * File:    Overlay.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders loading overlays for components or the full page.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {element} from "../core/dom.js";

export class Overlay extends Component {
    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.root.classList.add("overlay-host");
        this.root.classList.toggle("page-overlay-host", this.props.fullPage === true);

        if (!this.props.visible) return this.root.replaceChildren();

        const overlay = element("div", {
            className: `overlay show ${this.props.fullPage === true ? "page-overlay" : "component-overlay"}`,
            attributes: {"aria-hidden": "true"}
        });

        if (this.props.loading !== false) overlay.append(element("div", {className: "dot-loader overlay-loading-icon"}));
        this.root.replaceChildren(overlay);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   options              Value supplied for options.
     */
    /******************************************************************************/
    show({loading = true} = {}) {
        clearTimeout(this.hideTimer);
        this.update({visible: true, loading});
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the hide operation.
     */
    /******************************************************************************/
    hide() {
        const overlay = this.root.querySelector?.(".overlay");

        if (!overlay) return this.update({visible: false});

        overlay.classList.remove("show");
        this.props.visible = false;

        /******************************************************************************/
        /*!
         * @brief   Removes the overlay after its fade-out transition.
         */
        /******************************************************************************/
        this.hideTimer = setTimeout(() => {
            if (!this.props.visible && this.mounted) this.render();
        }, 300);
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        clearTimeout(this.hideTimer);
        super.destroy();
    }
}
