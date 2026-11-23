/****************************************************************************/
/*
 * File:    login_page.js
 * Author:  Luke de Munk
 * Version: 1.2.6
 *
 * Brief:   Page controller for login page.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_DONT_REMEMBER_ME, TEXT_DONT_SHOW_PASSWORD, TEXT_LOGIN, TEXT_PROFILES, TEXT_REMEMBER_ME,
    TEXT_SERVER_ERROR, TEXT_SHOW_PASSWORD, TEXT_WELCOME_BACK_CHOOSE_PROFILE,
    TEXT_WELCOME_BACK_LOGIN, TEXT_WRONG_CREDENTIALS, VAR_TEXT_WELCOME_BACK
} from "../domain/language_pack_english.js";
import { ProfilePicker } from "../ui_components/ProfilePicker.js";
import { applyTheme, mountPage, profileStorage, readPageData } from "../core/page.js";
import { scrollToSection } from "../core/scroll.js";
import { signIn, pickProfile } from "../services/session.js";
import { EMAIL_RE, PASSWORD_RE } from "../domain/validation.js";

const { http, banners, signal, delay, components } = mountPage("login");
let { message, profiles: userProfiles } = readPageData();
let rememberUser = localStorage.getItem("rememberUser") === "true";
const profileId = profileStorage().getItem("profileId");

//#region Elements
const welcomeTitleElem = document.getElementById("welcomeTitle");
const personalWelcomeTitleElem = document.getElementById("personalWelcomeTitle");
const messageFieldElem = document.getElementById("messageField");
const welcomeBtnElem = document.getElementById("welcomeBtn");
const rememberEmailIconElem = document.getElementById("rememberEmailIcon");
const showPasswordIconElem = document.getElementById("showPasswordIcon");
const emailTxtElem = document.getElementById("emailTxt");
const passwordTxtElem = document.getElementById("passwordTxt");
const loginContainerElem = document.getElementById("loginContainer");
const profileSelectContainerElem = document.getElementById("profileSelectContainer");
const picker = new ProfilePicker(profileSelectContainerElem, {
    profiles: [],
    selectedId: profileId
}).mount();

components.push(picker);

profileSelectContainerElem.addEventListener("ui:select", event => changeProfile(event.detail.id), {
    signal
});
//#endregion

rememberEmailIconElem.addEventListener("click", () => toggleRememberMe(), { signal });
showPasswordIconElem.addEventListener("click", () => showPassword(), { signal });
document.getElementById("loginBtn").addEventListener("click", login, { signal });

//#region Key event listeners
/****************************************************************************/
/*!
 * @brief   Moves focus from the email field to the password on Enter.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
emailTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        passwordTxtElem.focus();
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Submits login when Enter is pressed in the password field.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
passwordTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        login();
    }
}, { signal });
//#endregion

let passwordVisible = false;

/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
function initialize() {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    if (userProfiles.length == 0) {
        showTitle(welcomeTitleElem, TEXT_WELCOME_BACK_LOGIN);

        welcomeBtnElem.onclick = () => scrollToSection("loginContainer", signal);
        welcomeBtnElem.textContent = TEXT_LOGIN;
    } else {
        showTitle(welcomeTitleElem, TEXT_WELCOME_BACK_CHOOSE_PROFILE);
        picker.update({ profiles: userProfiles });
        loginContainerElem.style.display = "none";

        welcomeBtnElem.onclick = () => scrollToSection("profileContainer", signal);
        welcomeBtnElem.textContent = TEXT_PROFILES;

        return;
    }

    /* Show messages, if any */
    if (message != "") {
        messageFieldElem.textContent = message;
        messageFieldElem.classList.add("warning");
        messageFieldElem.style.display = "inline-block";
    }

    toggleRememberMe(rememberUser);
}

initialize();

/****************************************************************************/
/*!
 * @brief   Validates NIST-800 requirements locally to avoid unnecessary
 *          requests. If valid, sends the credentials to the back-end for
 *          further validation to login.
 */
/****************************************************************************/
async function login() {
    let email = emailTxtElem.value;
    let password = passwordTxtElem.value;

    messageFieldElem.style.display = "none";
    messageFieldElem.className = "message";
    messageFieldElem.classList.add("error");

    /* Validate email */
    if (!email.match(EMAIL_RE)) {
        messageFieldElem.textContent = TEXT_WRONG_CREDENTIALS;
        messageFieldElem.style.display = "inline-block";

        passwordTxtElem.value = "";

        return;
    }

    /* Validate password */
    if (password.length < 8 || !password.match(PASSWORD_RE)) {
        messageFieldElem.textContent = TEXT_WRONG_CREDENTIALS;
        messageFieldElem.style.display = "inline-block";

        passwordTxtElem.value = "";

        return;
    }

    try {
        const result = await signIn(http, email, password, signal);
        userProfiles = result.profiles;
    } catch (error) {
        if (signal.aborted) return;

        messageFieldElem.style.display = "inline-block";
        messageFieldElem.textContent = error.message;
        passwordTxtElem.value = "";

        return;
    }

    /* Valid credentials */
    messageFieldElem.classList.remove("error");
    messageFieldElem.style.display = "none";

    sessionStorage.setItem("loggedIn", 1);

    if (rememberUser) {
        if (userProfiles.some(profile => String(profile.id) === profileId)) {
            showTitle(personalWelcomeTitleElem, VAR_TEXT_WELCOME_BACK(
                userProfiles[userProfiles.findIndex(profile =>
                    String(profile.id) === profileId)].name
            ));
            scrollToSection("emptyContainer", signal);
            delay(() =>

                changeProfile(profileId, true), 300);                       //Give some time for scrolling animation
            return;
        }
    }

    picker.update({ profiles: userProfiles });
    scrollToSection("profileContainer", signal);
}

//#region Utilities
/****************************************************************************/
/*!
 * @brief   Toggles whether the user wants to stay logged in.
 * @param   rememberMe              If true, user gets saved in cookies
 */
/****************************************************************************/
function toggleRememberMe(rememberMe = undefined) {
    if (rememberMe != undefined) {
        rememberUser = rememberMe;
    } else {
        rememberUser = !rememberUser;
    }

    if (rememberUser) {
        rememberEmailIconElem.classList.add("fa-floppy-disk");
        rememberEmailIconElem.classList.remove("fa-user-xmark");
        rememberEmailIconElem.title = TEXT_DONT_REMEMBER_ME;
        localStorage.setItem("rememberUser", "true");

        return;
    }

    rememberEmailIconElem.classList.remove("fa-floppy-disk");
    rememberEmailIconElem.classList.add("fa-user-xmark");
    rememberEmailIconElem.title = TEXT_REMEMBER_ME;
    localStorage.setItem("rememberUser", "false");
    localStorage.removeItem("accountId");
    localStorage.removeItem("profileId");
}

/****************************************************************************/
/*!
 * @brief   Shows or hides the password.
 * @param   show                    If defined, that bool is used for state
 */
/****************************************************************************/
function showPassword(show = undefined) {
    if (show != undefined) {
        passwordVisible = show;
    } else {
        passwordVisible = !passwordVisible;
    }

    if (passwordVisible) {
        showPasswordIconElem.classList.remove("fa-eye");
        showPasswordIconElem.classList.add("fa-eye-slash");
        passwordTxtElem.setAttribute("type", "text");
        showPasswordIconElem.title = TEXT_DONT_SHOW_PASSWORD;

        return;
    }

    showPasswordIconElem.classList.add("fa-eye");
    showPasswordIconElem.classList.remove("fa-eye-slash");
    passwordTxtElem.setAttribute("type", "password");
    showPasswordIconElem.title = TEXT_SHOW_PASSWORD;
}

/****************************************************************************/
/*!
 * @brief   Shows the main title after a delay.
 */
/****************************************************************************/
function showTitle(element, text) {
    element.style.opacity = 0;

    /****************************************************************************/
    /*!
     * @brief   Replaces the welcome title after its fade-out delay.
     */
    /****************************************************************************/
    delay(() => {
        element.textContent = text;
        element.style.opacity = 1;
    }, 100);
}

//#endregion
/****************************************************************************/
/*!
 * @brief   Selects a profile and optionally scrolls to the login controls.
 * @param   id                      Identifier of the affected item.
 * @param   scrollDown              Whether to reveal the login controls after profile selection.
 */
/****************************************************************************/
async function changeProfile(id, scrollDown = false) {
    try {
        await pickProfile(http, id, signal);
        profileStorage().setItem("profileId", id);
        applyTheme(userProfiles.find(profile => String(profile.id) === String(id)).ui_theme);
        if (scrollDown) scrollToSection("emptyContainer", signal);
        delay(() => location.assign("/"), 700);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_SERVER_ERROR,
            message: error.message,
            type: "error"
        });
    }
}
