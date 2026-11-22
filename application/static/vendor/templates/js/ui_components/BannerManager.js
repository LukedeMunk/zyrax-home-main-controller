/******************************************************************************
 *
 * File:    BannerManager.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders and manages transient notification banners.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {AnimationController} from "../core/animation.js";
import {button, element, icon} from "../core/dom.js";

export class BannerManager extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.items = [];
        this.nextId = 1;
        this.timers = new Map();
        this.removalTimers = new Map();
        this.closing = new Set();
        this.animation = new AnimationController(props.animation);
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();
        this.animation.cancelFrames();

        const stack = element("div", {className: "banner-stack", attributes: {"aria-live": "polite"}});

        for (const item of this.items) {
            const close = button({
                iconClass: "fa-solid fa-xmark",
                title: "Close",
                className: "banner-close-button",
                dataset: {close: item.id}
            });
            close.setAttribute("aria-label", "Close notification");

            const banner = element("article", {
                className: "banner-container",
                dataset: {bannerId: item.id, type: item.type}
            }, [
                icon(`banner-icon ${typeIcon(item.type)}`, item.type),
                element("div", {className: "banner-content"}, [
                    element("p", {className: "banner-title", text: item.title}),
                    element("p", {className: "banner-message", text: item.message})
                ]),
                close
            ]);

            /******************************************************************************/
            /*!
             * @brief   Closes the banner selected through its close button.
             */
            /******************************************************************************/
            this.listen(close, "click", () => this.close(item.id));
            stack.append(banner);

            if (!this.closing.has(item.id)) {
                /******************************************************************************/
                /*!
                 * @brief   Applies the banner's visible state after its initial paint.
                 */
                /******************************************************************************/
                this.animation.nextFrame(() => {
                    if (!this.mounted || this.closing.has(item.id)) return;

                    banner.getBoundingClientRect?.();
                    banner.classList.add("show");
                });
            }
        }

        this.root.replaceChildren(stack);
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the show operation.
     * @param   options              Value supplied for options.
     * @returns string              Identifier assigned to the banner.
     */
    /******************************************************************************/
    show({title = "", message = "", type = "info", timeout = this.props.timeout ?? 5000} = {}) {
        const item = {id: String(this.nextId++), title, message, type};
        const nextItems = [...this.items, item].slice(-(this.props.maxVisible ?? 3));
        const nextIds = new Set(nextItems.map(candidate => candidate.id));

        for (const previous of this.items) {
            if (nextIds.has(previous.id)) continue;

            this.animation.cancel(this.timers.get(previous.id));
            this.timers.delete(previous.id);
            this.animation.cancel(this.removalTimers.get(previous.id));
            this.removalTimers.delete(previous.id);
            this.closing.delete(previous.id);
        }

        this.items = nextItems;
        this.render();

        if (timeout > 0) {
            /******************************************************************************/
            /*!
             * @brief   Closes the banner when its display timeout expires.
             */
            /******************************************************************************/
            this.timers.set(item.id, this.animation.after(timeout, () => this.close(item.id)));
        }

        return item.id;
    }

    /******************************************************************************/
    /*!
     * @brief   Performs the close operation.
     * @param   id                   Value supplied for id.
     */
    /******************************************************************************/
    close(id) {
        const normalizedId = String(id);

        this.animation.cancel(this.timers.get(normalizedId));
        this.timers.delete(normalizedId);

        if (this.closing.has(normalizedId)) return;

        this.closing.add(normalizedId);

        const banner = this.root.querySelector?.(`[data-banner-id="${normalizedId}"]`);
        banner?.classList.remove("show");

        /******************************************************************************/
        /*!
         * @brief   Removes banner state and markup after the fade-out transition.
         */
        /******************************************************************************/
        const removalTimer = this.animation.after(banner ? 300 : 0, () => {
            this.removalTimers.delete(normalizedId);

            this.closing.delete(normalizedId);
            this.items = this.items.filter(item => item.id !== normalizedId);

            const currentBanner = this.root.querySelector?.(`[data-banner-id="${normalizedId}"]`);
            const stack = currentBanner?.parentElement;

            currentBanner?.remove();

            if (stack && stack.children.length === 0) stack.remove();
        });
        this.removalTimers.set(normalizedId, removalTimer);
    }

    /******************************************************************************/
    /*!
     * @brief   Releases owned resources and removes transient state.
     */
    /******************************************************************************/
    destroy() {
        this.animation.clear();
        this.timers.clear();
        this.removalTimers.clear();
        this.closing.clear();
        super.destroy();
    }
}

/******************************************************************************/
/*!
 * @brief   Selects the status icon class for a banner type.
 * @param   type                 Banner status type.
 * @returns string              Font Awesome icon class.
 */
/******************************************************************************/
function typeIcon(type) {
    return ({success: "fa-solid fa-check-circle", warning: "fa-solid fa-triangle-exclamation", error: "fa-solid fa-circle-xmark"})[type]
        ?? "fa-solid fa-circle-info";
}
