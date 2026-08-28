/******************************************************************************/
/*
 * File:    Toolbar.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Toolbar class to manage toolbars. Used to show toolbars with various
 *          buttons, including a timed progress button.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Example configuration /*X*/ = required
//const EXAMPLE_TOOLBAR_CONFIGURATION = {
//    /*X*/id: "pageToolbarContainer",
//    className: "toolbar",
//    marginTop: "0px",
//    /*X*/groups: [
//        {
//            /*X*/buttons: [
//                {
//                    id: "exampleBtn1",
//                    minRole: 0,
//                    disabled: false,
//                    visible: false,
//                    iconClass: "fa-duotone fa-solid fa-file-export fa-lg",
//                    title: "exampleBtn1",
//                    onclickFunction: () => example1()
//                },
//                {
//                    id: "exampleBtn2",
//                    minRole: 0,
//                    disabled: false,
//                    visible: false,
//                    iconClass: "fa-duotone fa-solid fa-file-import fa-lg",
//                    title: "exampleBtn2",
//                    onclickFunction: () => example2()
//                }
//            ]
//        },
//        {
//            /*X*/buttons: [
//                {
//                    id: "exampleBtn3",
//                    minRole: 0,
//                    disabled: false,
//                    visible: false,
//                    iconClass: "fa-duotone fa-solid fa-money-check-dollar-pen fa-lg",
//                    title: "exampleBtn3",
//                    onclickFunction: () => example3()
//                }
//            ]
//        }
//    ]
//};
//#endregion

class Toolbar {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  configuration       Toolbar structure and configuration
    */
    /******************************************************************************/
    constructor(configuration) {
        if (configuration.id) {
            this.targetElement = document.getElementById(configuration.id);
        } else {
            this.targetElement = document.body;
        }

        this.configuration = configuration;
        this.userRole = configuration.userRole;
        this.className = configuration.className ?? "toolbar";
        this.marginTop = configuration.marginTop ?? "20px";
        this.progressAnimations = {};
        this.toolbarElem = null;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the user role of the current user. To render only the
                accessable buttons for the user.
        @param  userRole            Role of the user
    */
    /******************************************************************************/
    setUserRole(userRole) {
        this.userRole = userRole;
        this.render();
    }

    /******************************************************************************/
    /*!
        @brief  Generates the toolbar DOM element.
        @return                     DOM element
    */
    /******************************************************************************/
    render() {
        if (this.toolbarElem != null) {
            this.toolbarElem.remove();
        }
        
        this.toolbarElem = document.createElement("div");
        this.toolbarElem.className = this.className;
        this.toolbarElem.style.marginTop = this.marginTop;

        for (const group of this.configuration.groups) {
            const subToolbarElem = document.createElement("div");
            subToolbarElem.className = "toolbar-sub";

            for (const button of group.buttons) {
                /* RBAC check */
                if (!this.#hasAccess(button)) {
                    continue;
                }

                const buttonElem = this.#renderButton(button);
                subToolbarElem.appendChild(buttonElem);
            }

            this.toolbarElem.appendChild(subToolbarElem);
        }

        this.targetElement.appendChild(this.toolbarElem);
    }

    /******************************************************************************/
    /*!
        @brief  Sets the toolbar visible.
    */
    /******************************************************************************/
    show() {
        this.toolbarElem.style.display = "flex";
    }

    /******************************************************************************/
    /*!
        @brief  Hides the toolbar.
    */
    /******************************************************************************/
    hide() {
        this.toolbarElem.style.display = "none";
    }

    /******************************************************************************/
    /*!
        @brief  Enables or disables the specified button.
        @param  buttonId            ID of the button
        @param  disabled            True to disable the button
        @param  title               Mouse title to set
    */
    /******************************************************************************/
    setButtonDisabled(buttonId, disabled, title="") {
        const buttonElem = document.getElementById(buttonId);
        buttonElem.disabled = disabled;
        buttonElem.title = title;

        if (disabled) {
            buttonElem.classList.add("disabled");
        } else {
            buttonElem.classList.remove("disabled");
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the visibility of the specified button.
        @param  buttonId            ID of the button
        @param  visible             True to make the button visible
    */
    /******************************************************************************/
    setButtonVisibility(buttonId, visible) {
        const buttonElem = document.getElementById(buttonId);

        if (visible) {
            buttonElem.style.display = "block";
        } else {
            buttonElem.style.display = "none";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the onclick function of the specified button.
        @param  buttonId            ID of the button
        @param  onclickFunction     Function to set
    */
    /******************************************************************************/
    setOnclickFunction(buttonId, onclickFunction) {
        const buttonElem = document.getElementById(buttonId);

        if (buttonElem == null) {
            console.warn("Button not found");
            return;
        }

        /* Remove previous click behavior by cloning (clean reset) */
        const newButtonElem = buttonElem.cloneNode(true);
        buttonElem.parentNode.replaceChild(newButtonElem, buttonElem);

        /* Attach new handler if provided */
        if (typeof onclickFunction === "function") {
            newButtonElem.addEventListener("click", onclickFunction);
        }

        return newButtonElem;
    }

    /******************************************************************************/
    /*!
        @brief  Sets the loading state of the specified button.
        @param  buttonId            ID of the button
        @param  state               State to set (idle, loading, progress)
        @param  title               Cursor title to set
        @param  progress            Progress percentage to set
    */
    /******************************************************************************/
    setButtonState(buttonId, state, title=undefined, progress=undefined) {
        const buttonElem = document.getElementById(buttonId);
        if (!buttonElem) {
            return;
        }

        const iconElem = buttonElem.querySelector(".toolbar-button-icon");
        const loadingIconElem = buttonElem.querySelector(".toolbar-button-loading-icon");
        const progressBarElem = buttonElem.querySelector(".button-progress-bar");
        const titleElem = buttonElem.querySelector(".toolbar-button-title");

        switch (state) {
            /* Default state */
            case "idle":
                buttonElem.disabled = false;
                buttonElem.classList.remove("disabled");

                iconElem.style.display = "block";
                loadingIconElem.style.display = "none";
                progressBarElem.style.display = "none";

                progressBarElem.style.setProperty(
                    "--progress",
                    "0%"
                );

                titleElem.textContent = title ?? buttonElem.dataset.defaultTitle;
                break;

            /* Loading spinner state */
            case "loading":
                buttonElem.disabled = true;
                buttonElem.classList.add("disabled");

                iconElem.style.display = "none";
                loadingIconElem.style.display = "grid";
                progressBarElem.style.display = "none";

                titleElem.textContent = title ?? "Processing...";
                break;

            /* Progress state */
            case "progress":
                buttonElem.disabled = true;
                buttonElem.classList.add("disabled");

                iconElem.style.display = "none";
                loadingIconElem.style.display = "grid";
                progressBarElem.style.display = "block";

                progressBarElem.style.setProperty(
                    "--progress",
                    (progress ?? 0) + "%"
                );

                titleElem.textContent = title ?? "Processing...";
                break;
        }
    }

    /******************************************************************************/
    /*!
        @brief  Animate the progress bar of the specified button.
        @param  buttonId            ID of the button
        @param  seconds             Seconds the percentage is from 0 to 100
    */
    /******************************************************************************/
    animateButtonProgress(buttonId, seconds) {
        const buttonElem = document.getElementById(buttonId);
        const progressBarElem = buttonElem.querySelector(".button-progress-bar");

        /* Cancel previous animation */
        if (this.progressAnimations[buttonId]) {
            cancelAnimationFrame(this.progressAnimations[buttonId]);
        }

        progressBarElem.style.display = "block";
        const duration = seconds * 1000;
        const start = performance.now();

        const update = (now) => {
            const elapsed = now - start;
            const progressValue = Math.min( elapsed / duration, 1);
            const percent = (progressValue * 100).toFixed(2) + "%";

            progressBarElem.style.setProperty(
                "--progress",
                percent
            );

            if (progressValue < 1) {
                this.progressAnimations[buttonId] = requestAnimationFrame(update);
            } else {
                delete this.progressAnimations[buttonId];
            }
        };

        this.progressAnimations[buttonId] = requestAnimationFrame(update);
    }

    /******************************************************************************/
    /*!
        @brief  Generates the specified button DOM element.
        @param  button              Object with button data
        @return                     DOM element
    */
    /******************************************************************************/
    #renderButton(button) {
        const buttonElem = document.createElement("button");
        buttonElem.className = "toolbar-button";

        if (button.id) {
            buttonElem.id = button.id;
        }

        buttonElem.dataset.defaultTitle = button.title ?? "";

        /* Icon */
        const iconElem = document.createElement("i");
        iconElem.className = button.iconClass + " toolbar-button-icon";
        buttonElem.appendChild(iconElem);

        /* Loading icon */
        const loadingIconElem = document.createElement("div");
        loadingIconElem.className = "dot-loader toolbar-button-loading-icon";
        loadingIconElem.style.display = "none";
        buttonElem.appendChild(loadingIconElem);

        /* Progress bar */
        const progressBarElem = document.createElement("div");
        progressBarElem.className = "button-progress-bar";
        progressBarElem.style.display = "none";
        buttonElem.appendChild(progressBarElem);

        /* Title */
        const titleElem = document.createElement("p");
        titleElem.className = "toolbar-button-title";
        titleElem.textContent = button.title ?? "";
        buttonElem.appendChild(titleElem);

        /* Click handler */
        if (button.onclickFunction) {
            buttonElem.addEventListener("click", button.onclickFunction);
        }

        button.disabled = button.disabled ?? false;
        if (button.disabled) {
            buttonElem.disabled = true;
            buttonElem.classList.add("disabled");
        }

        button.visible = button.visible ?? true;
        if (!button.visible) {
            buttonElem.style.display = "none";
        }

        return buttonElem;
    }
    
    /******************************************************************************/
    /*!
        @brief  Checks whether the user has access to the specified button based on
                the user role.
        @param  button              Object with button data
        @return                     True when has access
    */
    /******************************************************************************/
    #hasAccess(button) {
        if (button.minRole === undefined || this.userRole === undefined) return true;

        return userRole <= button.minRole;
    }
}