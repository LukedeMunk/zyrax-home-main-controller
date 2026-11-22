/****************************************************************************/
/*
 * File:    account_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for account.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_CANCEL, TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_DELETE, TEXT_ERROR, TEXT_FIELD_NO_SYMBOLS,
    TEXT_FIELD_REQUIRED, TEXT_FIELD_UNIQUE, TEXT_FILE_NOT_SUPPORTED, TEXT_LOGOUT,
    TEXT_MANAGE_ACCOUNT, TEXT_MANAGE_PROFILE, TEXT_MANAGE_PROFILES, TEXT_NO_FILE_SELECTED,
    TEXT_PASSWORD_UPDATED_SUCCESSFULLY, TEXT_PROFILE_ADDED_SUCCESSFULLY,
    TEXT_PROFILE_DELETED_SUCCESSFULLY, TEXT_Q_ARE_YOU_SURE, TEXT_SUCCESS, TEXT_WARNING,
    VAR_TEXT_Q_DELETE, VAR_TEXT_TEXT_PASSWORD_UPDATED_WARNING
} from "../domain/language_pack_english.js";
import { mountPage, readPageData, applyTheme, profileStorage } from "../core/page.js";
import { scrollToSection } from "../core/scroll.js";
import { submitForm } from "../services/forms.js";
import { pickProfile } from "../services/session.js";
import { uploadProfilePicture } from "../services/profiles.js";
import { SYMBOL_CRITICAL_RE } from "../domain/validation.js";
import { ProfilePicker } from "../ui_components/ProfilePicker.js";
import { ModalStack } from "../../vendor/templates/js/core/modal-stack.js";
import {
    FloatingNavigationBar, PasswordModalForm
} from "../../vendor/templates/js/ui_components/index.js";

const { http, banners, popup, signal, components } = mountPage("account");
const { account, profiles, themes, languages } = readPageData();

/****************************************************************************/
/*!
 * @brief   Returns the page element with the requested identifier.
 * @param   name                    Visible name or element identifier.
 * @returns The page element with the requested identifier.
 */
/****************************************************************************/
const id = name => document.getElementById(name);

const profileId = Number(profileStorage().getItem("profileId"));
let selectedId = profileId;
let newPicture;
const stack = new ModalStack();
const passwordRoot = document.querySelector('[data-ref="password"]');
const password = new PasswordModalForm(passwordRoot, { modalStack: stack }).mount();
const passwordError = document.createElement("p");

passwordError.className = "message error";
passwordError.setAttribute("role", "alert");

const picker = new ProfilePicker(id("profileSelectContainer"), {
    profiles,
    selectedId: profileId,
    allowAdd: true
}).mount();
const links = [
    ["profile", TEXT_MANAGE_PROFILE, "fa-user"], ["profiles", TEXT_MANAGE_PROFILES, "fa-users"],
    ["account", TEXT_MANAGE_ACCOUNT, "fa-file-user"],
    ["logout", TEXT_LOGOUT, "fa-right-from-bracket"]
].map(([action, label, icon]) => ({ action, label, icon: "fa-duotone fa-solid " + icon }));
const sections = document.querySelector('[data-ref="sections"]');
const navigation = new FloatingNavigationBar(sections, { location: "left", items: links }).mount();

components.push(stack, password, picker, navigation);

for (const language of languages)
    id("profileLanguageSelect")
    .add(new Option(language.language, language.id));
for (const theme of themes) id("profileUiThemeSelect").add(new Option(theme.name, theme.id));

id("accountEmailTxt").value = account.email;
loadProfile(profileId, false);
scrollToSection(location.hash.slice(1) || "profileContainer", signal);

id("profileSelectContainer").addEventListener("ui:select", event => loadProfile(event.detail.id), {
    signal
});

/****************************************************************************/
/*!
 * @brief   Navigates account sections or clears the profile session on logout.
 * @param   detail                  Data reported by the component event.
 */
/****************************************************************************/
sections.addEventListener("ui:action", ({ detail }) => {
    if (detail.action === "logout") {
        localStorage.removeItem("profileId");
        sessionStorage.removeItem("profileId");
        sessionStorage.removeItem("loggedIn");
        location.assign("./logout");
    } else scrollToSection(detail.action + "Container", signal);
}, { signal });

let activeSection;

/****************************************************************************/
/*!
 * @brief   Marks the account section currently visible in the sidebar.
 */
/****************************************************************************/
function highlight() {
    const top = window.scrollY + 100;

    /****************************************************************************/
    /*!
     * @brief   Finds the account section containing the current scroll position.
     * @param   item                    Item in the current collection.
     * @returns Calculated value or configured element.
     */
    /****************************************************************************/
    const current = links.find(item => {
        const node = id(item.action + "Container");

        return node && top >= node.offsetTop && top < node.offsetTop + node.offsetHeight;
    })?.action;
    if (current === activeSection) return;

    activeSection = current;
    navigation.update({
        items: links.map(item => ({ ...item, selected: item.action === current }))
    });
}
highlight();

window.addEventListener("scroll", highlight, { signal });

/****************************************************************************/
/*!
 * @brief   Opens the password editor and clears its previous error.
 */
/****************************************************************************/
id("changePasswordBtn").addEventListener("click", () => {
    password.show();
    passwordError.textContent = "";
    passwordRoot.querySelector("dialog").append(passwordError);
}, { signal });

/****************************************************************************/
/*!
 * @brief   Saves a password change and displays its confirmation or error.
 * @param   detail                  Data reported by the component event.
 */
/****************************************************************************/
passwordRoot.addEventListener("ui:submit", async ({ detail }) => {
    try {
        const { currentPassword, newPassword } = detail.values;
        const warning = await submitForm(http, "/update_password", {
            current_password: currentPassword,
            password: newPassword
        }, signal);

        password.close();
        sessionStorage.setItem("update_password", 0);
        banners.show(warning ? {
            title: TEXT_WARNING,
            message: VAR_TEXT_TEXT_PASSWORD_UPDATED_WARNING(warning),
            type: "warning"
        } : { title: TEXT_SUCCESS, message: TEXT_PASSWORD_UPDATED_SUCCESSFULLY, type: "success" });
    } catch (error) {
        passwordError.textContent = error.message;
    }
}, { signal });
id("submitProfileBtn").addEventListener("click", saveProfile, { signal });

/****************************************************************************/
/*!
 * @brief   Confirms profile deletion and activates a remaining profile if needed.
 */
/****************************************************************************/
id("deleteProfileBtn").addEventListener("click", async () => {
    const profile = profiles.find(item => item.id === selectedId);
    if (!profile || profiles.length < 2) return;
    if (!(await popup.confirm({
        title: TEXT_Q_ARE_YOU_SURE,
        message: VAR_TEXT_Q_DELETE(profile.name),
        type: "warning",
        confirmLabel: TEXT_DELETE,
        cancelLabel: TEXT_CANCEL
    }))) return;

    try {
        await submitForm(http, "/delete_profile", { id: selectedId }, signal);
        profiles.splice(profiles.indexOf(profile), 1);
        if (selectedId === profileId) {
            await pickProfile(http, profiles[0].id, signal);
            profileStorage().setItem("profileId", profiles[0].id);
            applyTheme(profiles[0].ui_theme);
            location.assign("./");

            return;
        }
        loadProfile(profileId);
        banners.show({
            title: TEXT_SUCCESS,
            message: TEXT_PROFILE_DELETED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        showError(error);
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Validates and previews the selected profile picture.
 * @param   event                   Event reported by the bound control.
 */
/****************************************************************************/
id("profilePictureUpload").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file || !/\.(jpe?g|gif|png)$/i.test(file.name)) {
        showError(new Error(file ? TEXT_FILE_NOT_SUPPORTED : TEXT_NO_FILE_SELECTED));

        return;
    }
    if (selectedId === -1) {
        newPicture = file;

        const reader = new FileReader();

        /****************************************************************************/
        /*!
         * @brief   Applies a successfully loaded response or file preview.
         */
        /****************************************************************************/
        reader.onload = () => {
            if (!signal.aborted
                && newPicture === file) id("profilePicturePreview").src = reader.result;
        };
        reader.readAsDataURL(file);

        return;
    }

    try {
        await uploadProfilePicture(selectedId, file, signal);
        loadProfile(profileId);
    } catch (error) {
        showError(error);
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Loads a profile into the editor and optionally scrolls to it.
 * @param   key                     Profile identifier to load.
 * @param   scroll                  Whether to scroll to the selected profile.
 */
/****************************************************************************/
function loadProfile(key, scroll = true) {
    const profile = profiles.find(item => item.id === key);
    selectedId = profile?.id ?? -1;
    picker.update({ profiles, selectedId });
    newPicture = null;
    id("profilePictureUpload").value = "";
    id("profilePicturePreview").src = profile
        ? "/get_profile_picture?id=" + profile.id
        + "&t="
        + Date.now()
        : "/get_default_profile_picture";
    id("profileNameTxt").value = profile?.name ?? "";
    id("profileLanguageSelect").value = profile?.language ?? 0;
    id("profileUiThemeSelect").value = profile?.ui_theme ?? themes[0]?.id;
    id("deleteProfileBtn").style.display = profile && profiles.length > 1 ? "block" : "none";
    if (scroll) scrollToSection("profileContainer", signal);
}

/****************************************************************************/
/*!
 * @brief   Validates and saves the profile and its selected picture.
 */
/****************************************************************************/
async function saveProfile() {
    const field = id("profileNameTxt");
    const name = field.value;
    const adding = selectedId === -1;
    const error = !name
        ? TEXT_FIELD_REQUIRED
        : SYMBOL_CRITICAL_RE.test(name)
        ? TEXT_FIELD_NO_SYMBOLS
        : profiles.some(p => p.id !== selectedId && p.name === name)
        ? TEXT_FIELD_UNIQUE
        : "";

    field.classList.toggle("invalid-input", Boolean(error));
    id("errorMessageProfileField").style.display = error ? "inline-block" : "none";
    if (error) {
        id("errorMessageProfileField").textContent = error;
        field.focus();

        return;
    }

    const data = { id: selectedId, name, language: id("profileLanguageSelect").value };
    if (!adding) data.ui_theme = id("profileUiThemeSelect").value;

    try {
        const saved =
            await submitForm(http, adding ? "/add_profile" : "/update_profile", data, signal);
        if (adding) {
            data.id = saved.id;
            profiles.push(data);

            const picture = newPicture;
            loadProfile(data.id, false);
            if (picture) await uploadProfilePicture(saved.id, picture, signal);
        } else {
            Object.assign(profiles.find(item => item.id === data.id), data);
            applyTheme(data.ui_theme);
        }
        loadProfile(data.id);
        banners.show({
            title: TEXT_SUCCESS,
            message: adding ? TEXT_PROFILE_ADDED_SUCCESSFULLY : TEXT_CHANGES_SAVED_SUCCESSFULLY,
            type: "success"
        });
    } catch (error) {
        showError(error);
    }
}

/****************************************************************************/
/*!
 * @brief   Displays a page error unless the page lifecycle has ended.
 * @param   error                   Failure to display.
 */
/****************************************************************************/
function showError(error) {
    if (!signal.aborted) banners.show({ title: TEXT_ERROR, message: error.message, type: "error" });
}
