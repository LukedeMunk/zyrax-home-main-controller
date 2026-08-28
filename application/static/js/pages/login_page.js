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
const welcomeBtnElem = document.getElementById("welcomeBtn");

/* Icons */
const rememberEmailIconElem = document.getElementById("rememberEmailIcon");
const showPasswordIconElem = document.getElementById("showPasswordIcon");

/* Input elements */
const emailTxtElem = document.getElementById("emailTxt");
const passwordTxtElem = document.getElementById("passwordTxt");

/* Tables */

/* Modals */

/* Other */
const loginContainerElem = document.getElementById("loginContainer");
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
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    scrollToTop();

    if (userProfiles.length == 0) {
        showTitle(welcomeTitleElem, TEXT_WELCOME_BACK_LOGIN);

        welcomeBtnElem.onclick = () => scrollToSection("loginContainer");
        welcomeBtnElem.textContent = TEXT_LOGIN;
    } else {
        showTitle(welcomeTitleElem, TEXT_WELCOME_BACK_CHOOSE_PROFILE);
        loadProfileOptions(userProfiles, highlightProfileId=profileId);
        loginContainerElem.style.display = "none";

        welcomeBtnElem.onclick = () => scrollToSection("profileContainer");
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
});

/******************************************************************************/
/*!
    @brief  Validates NIST-800 requirements locally to avoid unnecessary
            requests. If valid, sends the credentials to the back-end for
            further validation to login.
*/
/******************************************************************************/
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

    let data = {
        email: email,
        password: password
    }

    const result = await httpPostRequestJsonReturn("/login", data);
    
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
    if (rememberUser) {
        if (profileId != undefined) {
            showTitle(personalWelcomeTitleElem, VAR_TEXT_WELCOME_BACK(userProfiles[getIndexFromId(userProfiles, profileId)].name));
            scrollToSection("emptyContainer");
            setTimeout(() => changeProfile(profileId, true), 300);     //Give some time for scrolling animation
            return;
        }
    }

    loadProfileOptions(userProfiles);
    scrollToSection("profileContainer");
}

//#region Utilities
/******************************************************************************/
/*!
    @brief  Toggles whether the user wants to stay logged in.
    @param  rememberMe          If true, user gets saved in cookies
*/
/******************************************************************************/
function toggleRememberMe(rememberMe=undefined) {
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

/******************************************************************************/
/*!
    @brief  Shows or hides the password.
    @param  show                If defined, that bool is used for state
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
    @brief  Shows the main title after a delay.
*/
/******************************************************************************/
function showTitle(element, text) {
    element.style.opacity = 0;

    setTimeout(() => {
        element.textContent = text;
        element.style.opacity = 1;
    }, 100);
}
//#endregion