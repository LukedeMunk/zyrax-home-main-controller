/******************************************************************************
 *
 * File:    store.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Provides immutable page state with subscription support.
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
/** Minimal observable store for page-owned state. */

/******************************************************************************/
/*!
 * @brief   Creates an immutable observable state store.
 * @param   initialState         Value supplied for initialState.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function createStore(initialState = {}) {
    let state = Object.freeze({...initialState});
    const subscribers = new Set();

    return Object.freeze({
        /******************************************************************************/
        /*!
         * @brief   Returns the current immutable state snapshot.
         * @returns object              Current state snapshot.
         */
        /******************************************************************************/
        getState: () => state,

        /******************************************************************************/
        /*!
         * @brief   Applies a state update and notifies store subscribers.
         * @param   update               Value supplied for update.
         * @returns *                    Result produced by the operation.
         */
        /******************************************************************************/
        setState(update) {
            const patch = typeof update === "function" ? update(state) : update;

            state = Object.freeze({...state, ...patch});

            for (const subscriber of subscribers) subscriber(state);

            return state;
        },

        /******************************************************************************/
        /*!
         * @brief   Registers a state subscriber and returns its cleanup function.
         * @param   subscriber           Value supplied for subscriber.
         * @param   options              Subscription options.
         * @returns *                    Result produced by the operation.
         */
        /******************************************************************************/
        subscribe(subscriber, {immediate = false} = {}) {
            subscribers.add(subscriber);

            if (immediate) subscriber(state);

            /******************************************************************************/
            /*!
             * @brief   Removes the registered subscriber from the store.
             * @returns boolean              Whether the subscriber was registered.
             */
            /******************************************************************************/
            return () => subscribers.delete(subscriber);
        }
    });
}
