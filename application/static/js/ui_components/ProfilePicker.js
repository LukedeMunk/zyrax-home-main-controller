/****************************************************************************/
/*
 * File:    ProfilePicker.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Renders the available ZyraX profiles and reports a selection.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { Component } from "../../vendor/templates/js/core/component.js";
import { TEXT_ADD_PROFILE } from "../domain/language_pack_english.js";

export class ProfilePicker extends Component {
    /****************************************************************************/
    /*!
     * @brief   Renders profile choices and their current selection.
     */
    /****************************************************************************/
    render() {
        this.resetListeners();

        const { profiles, selectedId, allowAdd } = this.props;
        const choices = allowAdd ? [...profiles, { id: -1, name: TEXT_ADD_PROFILE }] : profiles;

        /****************************************************************************/
        /*!
         * @brief   Builds a profile choice with its picture and selected state.
         * @param   profile                 Profile configuration displayed by the choice.
         * @returns Calculated value or configured element.
         */
        /****************************************************************************/
        const cards = choices.map(profile => {
            const card = document.createElement("div");
            card.className = "profile-picture-upload";

            const choice = document.createElement("button");
            choice.type = "button";
            choice.className = "profile-picture-upload-button";
            choice.classList.toggle("selected", String(profile.id) === String(selectedId));

            const image = document.createElement("img");
            image.alt = profile.name;
            image.src = profile.id === -1
                ? "/get_default_profile_picture"
                : "/get_profile_picture?" + new URLSearchParams({ id: profile.id, t: Date.now() });
            choice.append(image);

            this.listen(choice, "click", () => this.emit("select", { id: profile.id }));

            const name = document.createElement("p");
            name.style.fontWeight = "bold";
            name.textContent = profile.name;
            card.append(choice, name);

            return card;
        });

        this.root.replaceChildren(...cards);
    }
}
