/******************************************************************************/
/*
 * File:    login_page.js
 * Author:  Luke de Munk
 * Version: 1.2.6
 * 
 * Brief:   JavaScript for login page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const welcomeTitleElem = document.getElementById("welcomeTitle");
const personalWelcomeTitleElem = document.getElementById("personalWelcomeTitle");


/* Fields */
const messageFieldElem = document.getElementById("messageField");

/* Buttons */

/* Icons */
const rememberEmailIconElem = document.getElementById("rememberEmailIcon");
const showPasswordIconElem = document.getElementById("showPasswordIcon");

/* Input elements */
const emailTxtElem = document.getElementById("emailTxt");
const passwordTxtElem = document.getElementById("passwordTxt");

/* Tables */

/* Modals */

/* Other */
const profileSelectContainerElem = document.getElementById("profileSelectContainer");
//#endregion

//#region Key event listeners
emailTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        passwordTxtElem.focus();
    }
});

passwordTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        login();
    }
});
//#endregion

let passwordVisible = false;

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    scrollToTop();
    sessionStorage.setItem("loggedIn", 0);                                     //Reset logged in cookie
    
    /* Show messages, if any */
    if (message != "") {
        messageFieldElem.textContent = message;
        messageFieldElem.classList.add("warning");
        messageFieldElem.style.display = "inline-block";
    }

    showTitle(welcomeTitleElem, TEXT_WELCOME_BACK_LOGIN);
    toggleRememberMe(remember);
});

/******************************************************************************/
/*!
  @brief    Validates NIST-800 requirements locally to avoid unnecessary
            requests. If valid, sends the credentials to the back-end for
            further validation to login.
*/
/******************************************************************************/
function login() {
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

    let data = {
        email: email,
        password: password
    }

    let result = httpPostRequestJsonReturn("/login", data);
    
    /* No valid credentials */
    if (result.status_code != HTTP_CODE_OK) {
        messageFieldElem.style.display = "inline-block";
        messageFieldElem.textContent = result.message;
        passwordTxtElem.value = "";
        return;
    }

    /* Valid credentials */
    messageFieldElem.classList.remove("error");
    messageFieldElem.style.display = "none";

    sessionStorage.setItem("loggedIn", 1);
    
    userProfiles = result.message.profiles;
    if (remember) {
        if (profileId != undefined) {
            showTitle(personalWelcomeTitleElem, VAR_TEXT_WELCOME_BACK(userProfiles[getIndexFromId(userProfiles, profileId)].name));
            scrollToSection("emptyContainer");
            setTimeout(function() {changeProfile(profileId, true);}, 1000);     //Give some time for scrolling animation
            return;
        }
    }

    loadProfiles(userProfiles);
    scrollToSection("profileContainer");
}

//#region Utilities
/******************************************************************************/
/*!
  @brief    Toggles whether the user wants to stay logged in.
  @param    rememberMe          If true, user gets saved in cookies
*/
/******************************************************************************/
function toggleRememberMe(rememberMe=undefined) {
    if (rememberMe != undefined) {
        remember = rememberMe;
    } else {
        remember = !remember;
    }

    if (remember) {
        rememberEmailIconElem.classList.add("fa-floppy-disk");
        rememberEmailIconElem.classList.remove("fa-user-xmark");
        rememberEmailIconElem.title = TEXT_DONT_REMEMBER_ME;
        localStorage.setItem("remember", "true");
        return;
    }

    rememberEmailIconElem.classList.remove("fa-floppy-disk");
    rememberEmailIconElem.classList.add("fa-user-xmark");
    rememberEmailIconElem.title = TEXT_REMEMBER_ME;
    localStorage.setItem("remember", "false");
    localStorage.removeItem("accountId");
    localStorage.removeItem("profileId");
}

/******************************************************************************/
/*!
  @brief    Shows or hides the password.
  @param    show                If defined, that bool is used for state
*/
/******************************************************************************/
function showPassword(show=undefined) {
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

/******************************************************************************/
/*!
  @brief    Shows the main title after a delay.
*/
/******************************************************************************/
function showTitle(element, text) {
    element.style.opacity = 0;

    setTimeout(() => {
        element.textContent = text;
        element.style.opacity = 1;
    }, 1000);
}
//#endregion