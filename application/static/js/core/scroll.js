/****************************************************************************/
/*
 * File:    scroll.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Animates navigation between profile and setup sections.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

/****************************************************************************/
/*!
 * @brief   Scrolls to a section and reveals it unless navigation has been
 *          cancelled.
 * @param   sectionElement          Section element or identifier to reveal.
 * @param   signal                  Abort signal owned by the current page.
 */
/****************************************************************************/
export function scrollToSection(sectionElement, signal) {
    const section = document.getElementById(sectionElement);

    const targetPosition = section.offsetTop;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 500;                                                   //0.5 seconds
    let start = null;

    // Cubic ease in-out function
    /****************************************************************************/
    /*!
     * @brief   Calculates the eased progress of a section scroll animation.
     * @param   t                       Normalized animation progress.
     * @returns Eased animation progress.
     */
    /****************************************************************************/
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /****************************************************************************/
    /*!
     * @brief   Advances the section scroll animation and schedules its next frame.
     * @param   timestamp               Timestamp of the current animation frame.
     */
    /****************************************************************************/
    function step(timestamp) {
        if (signal?.aborted) return;

        if (!start) start = timestamp;

        const progress = timestamp - start;
        const time = Math.min(progress / duration, 1);
        const eased = easeInOutCubic(time);

        window.scrollTo({ top: startPosition + distance * eased, behavior: "instant" });

        if (progress < duration) {
            window.requestAnimationFrame(step);
        } else {
            // Add class to trigger fade-in after scrolling
            /****************************************************************************/
            /*!
             * @brief   Reveals the destination section after its scroll has completed.
             */
            /****************************************************************************/
            setTimeout(() => {
                if (!signal?.aborted) section.classList.add("show");
            }, 50);
        }
    }

    window.requestAnimationFrame(step);
}
